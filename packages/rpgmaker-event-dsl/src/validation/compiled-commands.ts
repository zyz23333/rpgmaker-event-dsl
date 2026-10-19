import { compileNodes } from "../compiler/dispatch.js";
import { CommandStructureError, inspectCommandListStructure } from "./command-structure.js";
import type { StagedDataGraph, ValidationIssue } from "./types.js";

export function validateCompiledCommandLists(
  graph: StagedDataGraph,
  issues: ValidationIssue[],
): void {
  for (const declaration of graph.declarations) {
    const lists =
      declaration.kind === "commonEvent"
        ? [
            {
              commands: declaration.commands,
              identity: `commonEvent:${declaration.id}`,
              path: "commands",
            },
          ]
        : declaration.kind === "mapEvent"
          ? declaration.pages.map((page, index) => ({
              commands: page.commands,
              identity: `map:${declaration.mapId}/event:${declaration.id}`,
              path: `pages[${index}].commands`,
            }))
          : [];
    for (const list of lists) {
      try {
        const commands = compileNodes(list.commands, 0, graph.resolver, true, list.path);
        const { breaksOutsideLoops } = inspectCommandListStructure(commands, {
          requireTerminator: true,
        });
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
          if (location.nativePath !== undefined)
            location.nativePath = list.path.replace(/commands$/u, "") + location.nativePath;
          issues.push(
            new CommandStructureError(error.code, error.detail, location).issue(
              list.identity,
              "compile",
            ),
          );
        }
        // Other families report their parameter/reference failures through their own validators.
      }
    }
  }
}
