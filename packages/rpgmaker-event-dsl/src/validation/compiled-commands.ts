import { compileNodes } from "../compiler/dispatch.js";
import { CommandStructureError, inspectCommandListStructure } from "./command-structure.js";
import type { StagedDataGraph, ValidationIssue } from "./types.js";
import { inspectNativeCommandInputs, inspectNativeRouteInputs } from "./native-command-inputs.js";
import { compilePageMovement } from "../commands/movement/page.js";
import { validateNativeMovementRouteInputs } from "../commands/movement/validation.js";
import { inspectNativeCommandReferences } from "./native-references.js";
import type { RawEventCommand, CommandOrigins } from "../compiler/types.js";
import { inspectConditionalContext } from "../commands/flow/conditional-context.js";
import {
  variableTroopContext,
  type VariableInputContext,
} from "../commands/variables/diagnostics.js";

export function validateCompiledCommandLists(
  graph: StagedDataGraph,
  issues: ValidationIssue[],
  options: { scriptEnabled: boolean },
): void {
  for (const declaration of graph.declarations) {
    const variableContext: VariableInputContext = {};
    if (declaration.kind === "troopEvent") {
      const members = graph.snapshotTroops?.find(({ id }) => id === declaration.troopId)?.members;
      Object.assign(variableContext, variableTroopContext(members, graph.resolver));
    }
    if (declaration.kind === "mapEvent") {
      const map = graph.snapshotMaps?.find(({ id }) => id === declaration.mapId);
      if (map)
        variableContext.mapEventIds = [...graph.mapEventsByIdentity.values()]
          .filter(({ mapId }) => mapId === declaration.mapId)
          .map(({ id }) => id);
    }
    const lists =
      declaration.kind === "commonEvent"
        ? [
            {
              commands: declaration.commands,
              identity: `commonEvent:${declaration.id}`,
              path: "commands",
              movement: undefined,
            },
          ]
        : declaration.kind === "mapEvent"
          ? declaration.pages.map((page, index) => ({
              commands: page.commands,
              identity: `map:${declaration.mapId}/event:${declaration.id}`,
              path: `pages[${index}].commands`,
              movement: page.movement,
            }))
          : declaration.kind === "troopEvent" && Array.isArray(declaration.pages)
            ? declaration.pages.flatMap((page, index) =>
                page && Array.isArray(page.commands)
                  ? [
                      {
                        commands: page.commands,
                        identity: `troop:${declaration.troopId}`,
                        path: `pages[${index}].commands`,
                        movement: undefined,
                      },
                    ]
                  : [],
              )
            : [];
    for (const list of lists) {
      let commands: RawEventCommand[] = [];
      const origins: CommandOrigins = new Map();
      const prefix = list.path.replace(/commands$/u, "");
      try {
        if (list.movement !== undefined) {
          const prefix = list.path.replace(/commands$/u, "");
          const movement = compilePageMovement(list.movement, graph.resolver, `${prefix}movement`);
          validateNativeMovementRouteInputs(
            movement.moveRoute,
            graph.resolver,
            {
              scriptEnabled: true,
              identity: list.identity,
              dslPath: `${prefix}movement.route`,
              nativePath: `${prefix}moveRoute`,
            },
            issues,
          );
          issues.push(
            ...inspectNativeRouteInputs(
              movement.moveRoute,
              `${prefix}moveRoute`,
              { ...options, stage: "compile", identity: list.identity },
              `${prefix}movement.route`,
            ),
          );
        }
        commands = compileNodes(list.commands, 0, graph.resolver, true, list.path, origins);
        const { breaksOutsideLoops } = inspectCommandListStructure(commands, {
          requireTerminator: true,
        });
        issues.push(
          ...inspectNativeCommandInputs(commands, {
            ...options,
            stage: "compile",
            identity: list.identity,
            prefix,
            origins,
            variableContext,
          }),
        );
        issues.push(
          ...inspectNativeCommandReferences(commands, graph.resolver, {
            stage: "compile",
            identity: list.identity,
            prefix,
            origins,
          }),
        );
        issues.push(
          ...inspectConditionalContext(
            commands,
            declaration.kind === "mapEvent"
              ? {
                  kind: "map",
                  eventIds: [...graph.mapEventsByIdentity.values()]
                    .filter((event) => event.mapId === declaration.mapId)
                    .map((event) => event.id),
                }
              : declaration.kind === "troopEvent"
                ? {
                    kind: "troop",
                    members: graph.snapshotTroops?.find((troop) => troop.id === declaration.troopId)
                      ?.members,
                  }
                : { kind: "common" },
            graph.resolver,
            { identity: list.identity, stage: "compile", prefix, origins },
          ),
        );
        for (const index of breaksOutsideLoops)
          issues.push({
            level: "warning",
            code: "MV-BREAK-OUTSIDE-LOOP",
            stage: "compile",
            identity: list.identity,
            nativePath: `${list.path.replace(/commands$/u, "list")}[${index}]`,
            message: `${list.identity}: Break Loop outside a Loop can skip the remaining event commands while looking for a matching Repeat Above record.`,
          });
      } catch (error) {
        if (error instanceof CommandStructureError) {
          const location = { ...error.location };
          const sourceAt = (path: string) => {
            const index = Number(/^list\[(\d+)\]/u.exec(path)?.[1]);
            return origins.get(commands[index]!)?.path;
          };
          if (location.nativePath !== undefined) {
            const source = sourceAt(location.nativePath);
            if (location.dslPath === undefined && source !== undefined) location.dslPath = source;
            if (!location.nativePath.startsWith("pages["))
              location.nativePath = prefix + location.nativePath;
          }
          if (location.relatedLocations)
            location.relatedLocations = location.relatedLocations.map((related) => {
              const source = related.nativePath ? sourceAt(related.nativePath) : undefined;
              return {
                ...related,
                ...(source ? { dslPath: source } : {}),
                ...(related.nativePath && !related.nativePath.startsWith("pages[")
                  ? { nativePath: prefix + related.nativePath }
                  : {}),
              };
            });
          issues.push(
            new CommandStructureError(error.code, error.detail, location).issue(
              list.identity,
              "compile",
            ),
          );
        } else {
          const detail = error instanceof Error ? error.message : String(error);
          if (!issues.some((issue) => issue.level === "error" && issue.message.includes(detail)))
            issues.push(
              new CommandStructureError("MV-COMMAND-INPUT", detail, {
                dslPath: list.path,
                expected: "valid authored commands and resolvable inputs",
                actual: detail,
              }).issue(list.identity, "compile"),
            );
        }
      }
    }
  }
}
