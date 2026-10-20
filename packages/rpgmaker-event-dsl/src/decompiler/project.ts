import { resolve } from "node:path";
import { parseMapInfos, type MapInfoEntry } from "../project-data/project.js";
import type { WorkspaceStatePaths } from "../workspace/state.js";
import type { SnapshotCommonEvent, SnapshotMapEvent, SnapshotMapEventPage } from "./types.js";
import {
  collectConditionHelperNames,
  commonEventTriggerFromCode,
  createExportNameAllocator,
  formatMapFileName,
  indentLines,
  literal,
  normalizeCommandList,
  readCommonEvents,
  readMapEvents,
  readRawCommandList,
  readNamedSystemEntries,
  readSnapshotArray,
  readSnapshotFile,
  readSnapshotObject,
  renderEmptyModule,
  renderEventImport,
} from "./core.js";
import { renderCommands } from "./dispatch.js";
import { renderDecompiledCommandList } from "./dispatch.js";
import { assertNativeSwitchCommand } from "../commands/variables/validation.js";
import { variableTroopContext } from "../commands/variables/diagnostics.js";
import { assertNativeContextReferences } from "../validation/native-context-references.js";
import { buildSnapshotReferenceInput } from "../validation/staged-graph.js";
import {
  buildReferenceScopes,
  buildReferenceScope,
  createReferenceResolver,
} from "../validation/references.js";
import type { ReferenceResolver } from "../validation/types.js";
import type { ValidationIssue } from "../validation/types.js";
import type { RawEventCommand } from "./types.js";
import {
  inspectNativeCommandInputs,
  inspectNativeRouteInputs,
} from "../validation/native-command-inputs.js";
import { renderMovementRoute } from "../commands/movement/decompile.js";
import { validateNativeMovementRouteInputs } from "../commands/movement/validation.js";
import { inspectConditionalContext } from "../commands/flow/conditional-context.js";
import { inspectNativeCommandReferences } from "../validation/native-references.js";
import { CommandStructureError } from "../validation/command-errors.js";
import { assertNativeBattlePages, type NativeBattleEventPage } from "../validation/battle-pages.js";
import { renderMapPageSettings } from "./map-page.js";

export type DecompileFile = {
  content: string;
  path: string;
};

export type DecompileProjectDataSnapshotOptions = {
  scriptEnabled?: boolean;
  sourceRoot: string;
  statePaths: WorkspaceStatePaths;
  workspaceRoot: string;
  validateCandidate: (files: readonly DecompileFile[]) => Promise<void>;
  publishCandidate: (files: readonly DecompileFile[]) => Promise<void>;
};

export async function decompileProjectDataSnapshot(
  options: DecompileProjectDataSnapshotOptions,
): Promise<void> {
  const issues: ValidationIssue[] = [];
  const files = await buildDecompiledSourceFiles(options, issues);
  await options.validateCandidate(files);

  await options.publishCandidate(files);
  for (const issue of issues) console.error(issue.message);
}

async function buildDecompiledSourceFiles(
  options: DecompileProjectDataSnapshotOptions,
  issues: ValidationIssue[],
): Promise<DecompileFile[]> {
  const mapInfos = parseMapInfos(await readSnapshotFile(options.statePaths, "MapInfos.json"));
  const outputRoot = resolve(options.workspaceRoot, options.sourceRoot, "decompiled");
  const files: DecompileFile[] = [];
  const system = await readSnapshotObject(options.statePaths, "System.json");
  const referenceSources = await Promise.all(
    [
      "Actors",
      "Animations",
      "Armors",
      "Classes",
      "CommonEvents",
      "Enemies",
      "Items",
      "Skills",
      "States",
      "Tilesets",
      "Troops",
      "Weapons",
    ].map((name) => readSnapshotArray(options.statePaths, `${name}.json`)),
  );
  const [
    actors,
    animations,
    armors,
    classes,
    commonEventsInput,
    enemies,
    items,
    skills,
    states,
    tilesets,
    troops,
    weapons,
  ] = referenceSources as [
    unknown[],
    unknown[],
    unknown[],
    unknown[],
    unknown[],
    unknown[],
    unknown[],
    unknown[],
    unknown[],
    unknown[],
    unknown[],
    unknown[],
  ];
  const commonEvents = readCommonEvents(commonEventsInput);
  const scopes = buildReferenceScopes({
    declarations: [],
    snapshotReferences: buildSnapshotReferenceInput({
      system,
      actors,
      animations,
      armors,
      classes,
      commonEvents: commonEventsInput,
      enemies,
      items,
      mapInfos,
      skills,
      states,
      tilesets,
      troops,
      weapons,
    }),
  });
  // Decompile's entire owned candidate comes from this captured Snapshot. Compile's
  // resolver continues to take Common Events exclusively from actual declarations.
  scopes.commonEvent = buildReferenceScope(commonEvents, true);
  const resolver = createReferenceResolver(scopes);
  for (const event of commonEvents) {
    // none's omitted authoring switch reconstructs the fixed saved default 1.
    if (event.trigger === 0 && event.switchId === 1) continue;
    try {
      resolver.resolveReference({ kind: "switch", id: event.switchId });
    } catch (error) {
      throw new CommandStructureError(
        "MV-COMMON-REFERENCE",
        error instanceof Error ? error.message : String(error),
        {
          nativePath: `CommonEvents[${event.id}].switchId`,
          expected: "existing System Switch slot",
          actual: String(event.switchId),
        },
        `commonEvent:${event.id}`,
        "decompile",
      );
    }
  }

  for (const mapInfo of mapInfos) {
    const mapFileName = formatMapFileName(mapInfo.id);
    const mapData = await readSnapshotObject(options.statePaths, mapFileName);
    const events = readMapEvents(mapData, mapInfo.id);
    for (const event of events) {
      for (const [pageIndex, page] of event.pages.entries()) {
        const inputOptions = {
          identity: `map:${mapInfo.id}/event:${event.id}`,
          stage: "decompile" as const,
          scriptEnabled: options.scriptEnabled ?? false,
          prefix: `pages[${pageIndex}].`,
          variableContext: { mapEventIds: events.map(({ id }) => id) },
        };
        issues.push(...inspectNativeCommandInputs(page.list ?? [], inputOptions));
        issues.push(
          ...inspectConditionalContext(
            page.list ?? [],
            { kind: "map", eventIds: events.map((event) => event.id) },
            resolver,
            inputOptions,
          ),
        );
        if (page.movement !== undefined) {
          const path = `pages[${pageIndex}].moveRoute`;
          const referenceIssues: ValidationIssue[] = [];
          validateNativeMovementRouteInputs(
            page.movement.route,
            resolver,
            { scriptEnabled: true, identity: inputOptions.identity, nativePath: path },
            referenceIssues,
          );
          if (referenceIssues.length)
            throw new Error(
              `decompile error ${inputOptions.identity}: ${referenceIssues.map((issue) => `${issue.nativePath}: ${issue.message}`).join("; ")}`,
            );
          issues.push(...inspectNativeRouteInputs(page.movement.route, path, inputOptions));
        }
        assertSnapshotReferences(
          normalizeCommandList(page.list),
          `map ${mapInfo.id} event ${event.id}.pages[${pageIndex}].list`,
          resolver,
        );
        const errors = inspectNativeCommandReferences(page.list ?? [], resolver, inputOptions);
        if (errors.length) throw new Error(errors.map((issue) => issue.message).join("\n"));
        assertSnapshotRendering(page.list ?? [], inputOptions.identity, inputOptions.prefix);
      }
    }
    files.push({
      content: renderMapSource(mapInfo, events),
      path: resolve(outputRoot, "maps", `${mapFileName.slice(0, -".json".length)}.events.ts`),
    });
  }

  for (const event of commonEvents) {
    issues.push(
      ...inspectConditionalContext(event.list ?? [], { kind: "common" }, resolver, {
        identity: `commonEvent:${event.id}`,
        stage: "decompile",
      }),
    );
    issues.push(
      ...inspectNativeCommandInputs(event.list ?? [], {
        identity: `commonEvent:${event.id}`,
        stage: "decompile",
        scriptEnabled: options.scriptEnabled ?? false,
      }),
    );
    assertSnapshotReferences(
      normalizeCommandList(event.list),
      `common event ${event.id}.list`,
      resolver,
    );
    const errors = inspectNativeCommandReferences(event.list ?? [], resolver, {
      identity: `commonEvent:${event.id}`,
      stage: "decompile",
    });
    if (errors.length) throw new Error(errors.map((issue) => issue.message).join("\n"));
    assertSnapshotRendering(event.list ?? [], `commonEvent:${event.id}`);
  }
  files.push({
    content: renderCommonEventsSource(commonEvents),
    path: resolve(outputRoot, "common-events.events.ts"),
  });

  const troopEvents: Array<{ id: number; pages: NativeBattleEventPage[] }> = [];
  for (const [id, entry] of troops.entries()) {
    if (entry === null) continue;
    if (
      !entry ||
      typeof entry !== "object" ||
      Array.isArray(entry) ||
      !("id" in entry) ||
      entry.id !== id ||
      id <= 0
    )
      throw new Error(
        `decompile Troops.json[${id}]: expected Troop with positive matching identity or null.`,
      );
    const troop = entry as Record<string, unknown>;
    const identity = `troop:${id}`;
    assertNativeBattlePages(troop.pages, troop.members, resolver, identity, "decompile");
    for (const [pageIndex, page] of troop.pages.entries()) {
      const prefix = `pages[${pageIndex}].`;
      const commands = readRawCommandList(page.list, identity, prefix);
      issues.push(
        ...inspectConditionalContext(
          commands,
          { kind: "troop", members: troop.members },
          resolver,
          { identity, stage: "decompile", prefix },
        ),
      );
      issues.push(
        ...inspectNativeCommandInputs(commands, {
          identity,
          stage: "decompile",
          scriptEnabled: options.scriptEnabled ?? false,
          prefix,
          variableContext: variableTroopContext(troop.members, resolver),
        }),
      );
      const errors = inspectNativeCommandReferences(commands, resolver, {
        identity,
        stage: "decompile",
        prefix,
      });
      if (errors.length) throw new Error(errors.map(({ message }) => message).join("\n"));
      assertSnapshotReferences(commands, `${identity}.${prefix}list`, resolver);
      assertSnapshotRendering(commands, identity, prefix);
    }
    troopEvents.push({ id, pages: troop.pages });
  }
  files.push({
    content: renderTroopEventsSource(troopEvents),
    path: resolve(outputRoot, "troop-events.events.ts"),
  });

  files.push({
    content: renderSystemSource(system),
    path: resolve(outputRoot, "system.dsl.ts"),
  });

  return files.sort((left, right) => left.path.localeCompare(right.path));
}

function renderTroopEventsSource(
  events: readonly { id: number; pages: NativeBattleEventPage[] }[],
): string {
  if (!events.length) return renderEmptyModule();
  const helpers = new Set<string>(["troopEvent", "battlePage"]);
  const body = events
    .map(({ id, pages }) => {
      const renderedPages = pages.map((page) => {
        const c = page.conditions;
        const slots: string[] = [];
        if (c.turnEnding) slots.push("turnEnd: true");
        if (c.turnValid || !Object.is(c.turnA, 0) || !Object.is(c.turnB, 0))
          slots.push(
            `turn: { enabled: ${c.turnValid}, a: ${literal(c.turnA)}, b: ${literal(c.turnB)} }`,
          );
        if (c.enemyValid || !Object.is(c.enemyIndex, 0) || c.enemyHp !== 50)
          slots.push(
            `enemy: { enabled: ${c.enemyValid}, index: ${literal(c.enemyIndex)}, hpAtMost: ${literal(c.enemyHp)} }`,
          );
        if (c.actorValid || c.actorId !== 1 || c.actorHp !== 50) {
          helpers.add("actorRef");
          slots.push(
            `actor: { enabled: ${c.actorValid}, ref: actorRef({ id: ${literal(c.actorId)} }), hpAtMost: ${literal(c.actorHp)} }`,
          );
        }
        if (c.switchValid || c.switchId !== 1) {
          helpers.add("switchRef");
          slots.push(
            `switch: { enabled: ${c.switchValid}, ref: switchRef({ id: ${literal(c.switchId)} }) }`,
          );
        }
        for (const name of renderDecompiledCommandList(page.list).helperNames) helpers.add(name);
        return `battlePage({\n${slots.length ? `  conditions: { ${slots.join(", ")} },\n` : ""}${page.span === 0 ? "" : `  span: ${literal(page.span === 1 ? "turn" : "moment")},\n`}  commands: [\n${indentLines(renderCommands(page.list), 4)}\n  ],\n})`;
      });
      return `export const troopEvent${id} = troopEvent({\n  troopId: ${id},\n  pages: [\n${indentLines(renderedPages.join(",\n"), 4)}\n  ],\n});`;
    })
    .join("\n\n");
  return `${renderEventImport([...helpers])}\n\n${body}\n`;
}

function assertSnapshotRendering(
  commands: readonly RawEventCommand[],
  identity: string,
  prefix = "",
): void {
  try {
    renderDecompiledCommandList(commands);
  } catch (error) {
    if (error instanceof CommandStructureError) {
      const location = { ...error.location };
      if (location.nativePath) location.nativePath = prefix + location.nativePath;
      if (location.relatedLocations)
        location.relatedLocations = location.relatedLocations.map((related) => ({
          ...related,
          ...(related.nativePath ? { nativePath: prefix + related.nativePath } : {}),
        }));
      throw new CommandStructureError(error.code, error.detail, location, identity, "decompile");
    }
    throw error;
  }
}

function assertSnapshotReferences(
  commands: readonly RawEventCommand[],
  identity: string,
  resolver: ReferenceResolver,
) {
  for (const [index, command] of commands.entries()) {
    try {
      assertNativeSwitchCommand(command.code, command.parameters, resolver);
      assertNativeContextReferences(command.code, command.parameters, resolver);
      if (command.code === 205) {
        const issues: ValidationIssue[] = [];
        validateNativeMovementRouteInputs(
          command.parameters[1],
          resolver,
          { scriptEnabled: true, nativePath: `list[${index}].parameters[1]` },
          issues,
        );
        if (issues.length)
          throw new Error(
            issues.map((issue) => `${issue.code} ${issue.nativePath}: ${issue.message}`).join("; "),
          );
      }
    } catch (error) {
      throw new Error(
        `decompile ${identity}[${index}]: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

function renderMapSource(mapInfo: MapInfoEntry, events: readonly SnapshotMapEvent[]): string {
  if (events.length === 0) {
    return renderEmptyModule();
  }

  const names = createExportNameAllocator();
  const body = events
    .map((event) => {
      const exportName = names.create("mapEvent", event.name, event.id);
      return `export const ${exportName} = mapEvent({
  mapId: ${mapInfo.id},
  id: ${event.id},
  name: ${literal(event.name)},
${event.note === "" ? "" : `  note: ${literal(event.note)},\n`}\
  x: ${event.x},
  y: ${event.y},
  pages: [
${indentLines(event.pages.map(renderPage).join(",\n"), 4)}
  ],
});`;
    })
    .join("\n\n");

  return `${renderEventImport([
    "mapEvent",
    "page",
    ...collectConditionHelperNames(
      events.flatMap((event) => event.pages.map((page) => page.conditions)),
    ),
    ...events.flatMap((event) =>
      event.pages.flatMap((page) => [
        ...(page.image.characterName === "" ? [] : ["imageAsset"]),
        ...renderDecompiledCommandList(normalizeCommandList(page.list)).helperNames,
        ...(page.movement ? (renderMovementRoute(page.movement.route)?.helperNames ?? []) : []),
      ]),
    ),
  ])}\n\n${body}\n`;
}

function renderCommonEventsSource(events: readonly SnapshotCommonEvent[]): string {
  if (events.length === 0) {
    return renderEmptyModule();
  }

  const names = createExportNameAllocator();
  const body = events
    .map((event) => {
      const exportName = names.create("commonEvent", event.name, event.id);
      const trigger = commonEventTriggerFromCode(event.trigger);
      const switchLine =
        trigger === "none" && event.switchId === 1
          ? ""
          : `\n  switch: switchRef({ id: ${event.switchId} }),`;

      return `export const ${exportName} = commonEvent({
  id: ${event.id},
  name: ${literal(event.name)},
  trigger: ${literal(trigger)},${switchLine}
  commands: [
${indentLines(renderCommands(normalizeCommandList(event.list)), 4)}
  ],
});`;
    })
    .join("\n\n");

  return `${renderEventImport([
    "commonEvent",
    ...(events.some((event) => event.trigger !== 0 || event.switchId !== 1) ? ["switchRef"] : []),
    ...events.flatMap(
      (event) => renderDecompiledCommandList(normalizeCommandList(event.list)).helperNames,
    ),
  ])}\n\n${body}\n`;
}

function renderSystemSource(system: Record<string, unknown>): string {
  const switches = readNamedSystemEntries(system.switches);
  const variables = readNamedSystemEntries(system.variables);
  const declarations: string[] = [];
  const names = createExportNameAllocator();

  for (const entry of switches) {
    declarations.push(`export const ${names.create("switch", entry.name, entry.id)} = switchDefinition({
  id: ${entry.id},
  name: ${literal(entry.name)},
});`);
  }

  for (const entry of variables) {
    declarations.push(`export const ${names.create("variable", entry.name, entry.id)} = variableDefinition({
  id: ${entry.id},
  name: ${literal(entry.name)},
});`);
  }

  if (declarations.length === 0) {
    return renderEmptyModule();
  }

  return `import { switchDefinition, variableDefinition } from "rpgmaker-event-dsl";\n\n${declarations.join(
    "\n\n",
  )}\n`;
}

function renderPage(page: SnapshotMapEventPage): string {
  return `page({
${renderMapPageSettings(page)
  .map((field) => `  ${field}\n`)
  .join("")}\
  commands: [
${indentLines(renderCommands(normalizeCommandList(page.list)), 4)}
  ],
})`;
}
