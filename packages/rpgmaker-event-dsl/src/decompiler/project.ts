import { mkdir, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseMapInfos, type MapInfoEntry } from "../project.js";
import type { WorkspaceStatePaths } from "../state.js";
import type { RawEventCommand } from "../compiler/commands.js";
import {
  collectCommandHelperNames,
  collectConditionHelperNames,
  commonEventTriggerFromCode,
  createExportNameAllocator,
  formatMapFileName,
  indentLines,
  isMissingFileError,
  literal,
  mapPageTriggerFromCode,
  normalizeCommandList,
  readCommonEvents,
  readMapEvents,
  readNamedSystemEntries,
  readPositiveInteger,
  readSnapshotArray,
  readSnapshotFile,
  readSnapshotObject,
  renderEmptyModule,
  renderEventImport,
  renderPageConditions,
} from "../decompiler.js";
import { renderCommands } from "./commands.js";

export type SnapshotMapEvent = {
  id: number;
  name: string;
  x: number;
  y: number;
  pages: SnapshotMapEventPage[];
};

export type SnapshotMapEventPage = {
  conditions?: Record<string, unknown>;
  list?: RawEventCommand[];
  trigger?: number;
};

export type SnapshotCommonEvent = {
  id: number;
  list?: RawEventCommand[];
  name: string;
  switchId?: number;
  trigger?: number;
};

type DecompileFile = {
  content: string;
  path: string;
};

export type DecompileProjectDataSnapshotOptions = {
  sourceRoot: string;
  statePaths: WorkspaceStatePaths;
  workspaceRoot: string;
};

export async function decompileProjectDataSnapshot(
  options: DecompileProjectDataSnapshotOptions,
): Promise<void> {
  const files = await buildDecompiledSourceFiles(options);

  await assertTargetFilesDoNotExist(files);

  for (const file of files) {
    await mkdir(dirname(file.path), { recursive: true });
    await writeFile(file.path, file.content, "utf8");
  }
}

async function buildDecompiledSourceFiles(
  options: DecompileProjectDataSnapshotOptions,
): Promise<DecompileFile[]> {
  const mapInfos = parseMapInfos(await readSnapshotFile(options.statePaths, "MapInfos.json"));
  const outputRoot = resolve(options.workspaceRoot, options.sourceRoot, "decompiled");
  const files: DecompileFile[] = [];

  for (const mapInfo of mapInfos) {
    const mapFileName = formatMapFileName(mapInfo.id);
    const mapData = await readSnapshotObject(options.statePaths, mapFileName);
    files.push({
      content: renderMapSource(mapInfo, readMapEvents(mapData)),
      path: resolve(outputRoot, "maps", `${mapFileName.slice(0, -".json".length)}.events.ts`),
    });
  }

  files.push({
    content: renderCommonEventsSource(
      readCommonEvents(await readSnapshotArray(options.statePaths, "CommonEvents.json")),
    ),
    path: resolve(outputRoot, "common-events.events.ts"),
  });

  files.push({
    content: renderSystemSource(await readSnapshotObject(options.statePaths, "System.json")),
    path: resolve(outputRoot, "system.dsl.ts"),
  });

  return files.sort((left, right) => left.path.localeCompare(right.path));
}

async function assertTargetFilesDoNotExist(files: readonly DecompileFile[]): Promise<void> {
  const existingFiles: string[] = [];

  // Decompile is intentionally all-or-nothing so existing hand-maintained source is never mixed
  // with a partially written generated layout.
  for (const file of files) {
    const targetStats = await stat(file.path).catch((error: unknown) => {
      if (isMissingFileError(error)) {
        return null;
      }

      throw error;
    });

    if (targetStats !== null) {
      existingFiles.push(file.path);
    }
  }

  if (existingFiles.length > 0) {
    throw new Error(
      [
        "Decompile output already exists. Remove it before running decompile again.",
        ...existingFiles.map((filePath) => `- ${filePath}`),
      ].join("\n"),
    );
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
    ...collectCommandHelperNames(
      events.flatMap((event) => event.pages.flatMap((page) => normalizeCommandList(page.list))),
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
        trigger === "none"
          ? ""
          : `\n  switch: switchRef({ id: ${readPositiveInteger(event.switchId) ?? 1} }),`;

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
    ...(events.some((event) => commonEventTriggerFromCode(event.trigger) !== "none")
      ? ["switchRef"]
      : []),
    ...collectCommandHelperNames(events.flatMap((event) => normalizeCommandList(event.list))),
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
  conditions: ${renderPageConditions(page.conditions)},
  trigger: ${literal(mapPageTriggerFromCode(page.trigger))},
  commands: [
${indentLines(renderCommands(normalizeCommandList(page.list)), 4)}
  ],
})`;
}
