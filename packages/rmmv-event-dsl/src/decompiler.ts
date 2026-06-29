import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { parseMapInfos, type MapInfoEntry } from "./project.js";
import type { WorkspaceStatePaths } from "./state.js";

type RawEventCommand = {
  code: number;
  indent: number;
  parameters: unknown[];
};

type SnapshotMapEvent = {
  id: number;
  name: string;
  x: number;
  y: number;
  pages: SnapshotMapEventPage[];
};

type SnapshotMapEventPage = {
  conditions?: Record<string, unknown>;
  list?: RawEventCommand[];
  trigger?: number;
};

type SnapshotCommonEvent = {
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

  return `import { switchDefinition, variableDefinition } from "@rmmv-event-dsl/core";\n\n${declarations.join(
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

function renderCommands(commands: readonly RawEventCommand[]): string {
  const rendered: string[] = [];

  for (let index = 0; index < commands.length; index += 1) {
    const command = commands[index];

    if (command === undefined || command.code === 0) {
      continue;
    }

    if (command.code === 101) {
      const lines: string[] = [];
      // MV stores Show Text and Comment bodies as continuation commands. Keep those readable
      // where possible, and leave unsupported command shapes as raw escape hatches below.
      while (commands[index + 1]?.code === 401 && commands[index + 1]?.indent === command.indent) {
        const next = commands[index + 1];
        const line = next?.parameters[0];
        lines.push(typeof line === "string" ? line : "");
        index += 1;
      }
      rendered.push(`showText(${literal(lines.length > 0 ? lines : [""])})`);
      continue;
    }

    if (command.code === 108) {
      const lines = [readStringParameter(command.parameters[0])];
      while (commands[index + 1]?.code === 408 && commands[index + 1]?.indent === command.indent) {
        const next = commands[index + 1];
        lines.push(readStringParameter(next?.parameters[0]));
        index += 1;
      }
      rendered.push(`comment(${literal(lines)})`);
      continue;
    }

    const helper = renderSimpleCommand(command);
    rendered.push(helper ?? renderRawCommand(command));
  }

  return rendered.map((line) => `${line},`).join("\n");
}

function renderSimpleCommand(command: RawEventCommand): string | null {
  switch (command.code) {
    case 117: {
      const commonEventId = readPositiveInteger(command.parameters[0]);
      return commonEventId === null
        ? null
        : `callCommonEvent(commonEventRef({ id: ${commonEventId} }))`;
    }
    case 118:
      return `label(${literal(readStringParameter(command.parameters[0]))})`;
    case 119:
      return `jumpToLabel(${literal(readStringParameter(command.parameters[0]))})`;
    case 121: {
      const switchId = readPositiveInteger(command.parameters[0]);
      const value = command.parameters[1];
      return switchId === null || typeof value !== "number"
        ? null
        : `controlSwitch({ switch: switchRef({ id: ${switchId} }), value: ${value === 0 ? "true" : "false"} })`;
    }
    case 122:
      return renderControlVariable(command);
    case 123: {
      const selfSwitch = command.parameters[0];
      const value = command.parameters[1];
      return typeof selfSwitch === "string" && ["A", "B", "C", "D"].includes(selfSwitch)
        ? `controlSelfSwitch({ selfSwitch: ${literal(selfSwitch)}, value: ${value === 0 ? "true" : "false"} })`
        : null;
    }
    case 125: {
      const operation = command.parameters[0];
      const value = command.parameters[2];
      return typeof operation === "number" && typeof value === "number"
        ? `changeGold({ operation: ${literal(operation === 0 ? "gain" : "lose")}, value: ${value} })`
        : null;
    }
    case 126: {
      const itemId = readPositiveInteger(command.parameters[0]);
      const operation = command.parameters[1];
      const amount = command.parameters[3];
      return itemId !== null && typeof operation === "number" && typeof amount === "number"
        ? `changeItem({ item: itemRef({ id: ${itemId} }), operation: ${literal(operation === 0 ? "gain" : "lose")}, amount: ${amount} })`
        : null;
    }
    case 214:
      return "eraseEvent()";
    case 230: {
      const frames = command.parameters[0];
      return typeof frames === "number" ? `wait(${frames})` : null;
    }
    default:
      return null;
  }
}

function renderControlVariable(command: RawEventCommand): string | null {
  const variableId = readPositiveInteger(command.parameters[0]);
  const repeatedVariableId = command.parameters[1];
  const operationCode = command.parameters[2];
  const operandKind = command.parameters[3];

  if (
    variableId === null ||
    repeatedVariableId !== variableId ||
    typeof operationCode !== "number" ||
    typeof operandKind !== "number"
  ) {
    return null;
  }

  const operation = controlVariableOperationFromCode(operationCode);
  if (operation === null) {
    return null;
  }

  if (operandKind === 0 && typeof command.parameters[4] === "number") {
    return `controlVariable({ variable: variableRef({ id: ${variableId} }), operation: ${literal(operation)}, value: ${command.parameters[4]} })`;
  }

  if (operandKind === 1) {
    const sourceVariableId = readPositiveInteger(command.parameters[4]);
    return sourceVariableId === null
      ? null
      : `controlVariable({ variable: variableRef({ id: ${variableId} }), operation: ${literal(operation)}, value: variableRef({ id: ${sourceVariableId} }) })`;
  }

  if (
    operandKind === 2 &&
    typeof command.parameters[4] === "number" &&
    typeof command.parameters[5] === "number"
  ) {
    return `controlVariable({ variable: variableRef({ id: ${variableId} }), operation: ${literal(operation)}, value: { kind: "random", from: ${command.parameters[4]}, to: ${command.parameters[5]} } })`;
  }

  return null;
}

function renderRawCommand(command: RawEventCommand): string {
  const indentLine = command.indent === 0 ? "" : `\n  indent: ${command.indent},`;

  return `rawDslCommand({
  code: ${command.code},${indentLine}
  parameters: ${literal(command.parameters)},
})`;
}

function renderPageConditions(conditions: Record<string, unknown> | undefined): string {
  if (conditions === undefined) {
    return "{}";
  }

  const fields: string[] = [];

  if (conditions.switch1Valid === true) {
    const switchId = readPositiveInteger(conditions.switch1Id);
    if (switchId !== null) {
      fields.push(`switch1: switchRef({ id: ${switchId} })`);
    }
  }

  if (conditions.switch2Valid === true) {
    const switchId = readPositiveInteger(conditions.switch2Id);
    if (switchId !== null) {
      fields.push(`switch2: switchRef({ id: ${switchId} })`);
    }
  }

  if (conditions.variableValid === true) {
    const variableId = readPositiveInteger(conditions.variableId);
    if (variableId !== null && typeof conditions.variableValue === "number") {
      fields.push(
        `variable: { ref: variableRef({ id: ${variableId} }), operator: "ge", value: ${conditions.variableValue} }`,
      );
    }
  }

  if (conditions.selfSwitchValid === true && typeof conditions.selfSwitchCh === "string") {
    fields.push(`selfSwitch: ${literal(conditions.selfSwitchCh)}`);
  }

  if (conditions.itemValid === true) {
    const itemId = readPositiveInteger(conditions.itemId);
    if (itemId !== null) {
      fields.push(`item: itemRef({ id: ${itemId} })`);
    }
  }

  if (conditions.actorValid === true) {
    const actorId = readPositiveInteger(conditions.actorId);
    if (actorId !== null) {
      fields.push(`actor: actorRef({ id: ${actorId} })`);
    }
  }

  if (fields.length === 0) {
    return "{}";
  }

  return `{\n${indentLines(fields.map((field) => `${field},`).join("\n"), 4)}\n  }`;
}

function renderEventImport(helpers: readonly string[]): string {
  const uniqueHelpers = [...new Set(helpers)].sort((left, right) => left.localeCompare(right));

  return `import { ${uniqueHelpers.join(", ")} } from "@rmmv-event-dsl/core";`;
}

function collectCommandHelperNames(commands: readonly RawEventCommand[]): string[] {
  const helpers = new Set<string>();

  for (let index = 0; index < commands.length; index += 1) {
    const command = commands[index];
    if (command === undefined || command.code === 0) {
      continue;
    }

    switch (command.code) {
      case 101:
        helpers.add("showText");
        while (
          commands[index + 1]?.code === 401 &&
          commands[index + 1]?.indent === command.indent
        ) {
          index += 1;
        }
        break;
      case 108:
        helpers.add("comment");
        while (
          commands[index + 1]?.code === 408 &&
          commands[index + 1]?.indent === command.indent
        ) {
          index += 1;
        }
        break;
      case 117:
        helpers.add("callCommonEvent");
        helpers.add("commonEventRef");
        break;
      case 118:
        helpers.add("label");
        break;
      case 119:
        helpers.add("jumpToLabel");
        break;
      case 121:
        helpers.add("controlSwitch");
        helpers.add("switchRef");
        break;
      case 122:
        helpers.add("controlVariable");
        helpers.add("variableRef");
        break;
      case 123:
        helpers.add("controlSelfSwitch");
        break;
      case 125:
        helpers.add("changeGold");
        break;
      case 126:
        helpers.add("changeItem");
        helpers.add("itemRef");
        break;
      case 214:
        helpers.add("eraseEvent");
        break;
      case 230:
        helpers.add("wait");
        break;
      default:
        helpers.add("rawDslCommand");
        break;
    }
  }

  return [...helpers];
}

function collectConditionHelperNames(
  conditions: readonly (Record<string, unknown> | undefined)[],
): string[] {
  const helpers = new Set<string>();

  for (const condition of conditions) {
    if (condition?.switch1Valid === true || condition?.switch2Valid === true) {
      helpers.add("switchRef");
    }
    if (condition?.variableValid === true) {
      helpers.add("variableRef");
    }
    if (condition?.itemValid === true) {
      helpers.add("itemRef");
    }
    if (condition?.actorValid === true) {
      helpers.add("actorRef");
    }
  }

  return [...helpers];
}

function readMapEvents(mapData: Record<string, unknown>): SnapshotMapEvent[] {
  const events = Array.isArray(mapData.events) ? mapData.events : [];

  return events.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const record = entry as Record<string, unknown>;
    const id = readPositiveInteger(record.id);
    if (id === null) {
      return [];
    }

    return [
      {
        id,
        name: typeof record.name === "string" ? record.name : `Event ${id}`,
        pages: readMapEventPages(record.pages),
        x: typeof record.x === "number" ? record.x : 0,
        y: typeof record.y === "number" ? record.y : 0,
      },
    ];
  });
}

function readMapEventPages(value: unknown): SnapshotMapEventPage[] {
  if (!Array.isArray(value)) {
    return [{ conditions: {}, list: [], trigger: 0 }];
  }

  const pages = value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const record = entry as Record<string, unknown>;
    return [
      {
        conditions:
          record.conditions &&
          typeof record.conditions === "object" &&
          !Array.isArray(record.conditions)
            ? (record.conditions as Record<string, unknown>)
            : {},
        list: readRawCommandList(record.list),
        trigger: typeof record.trigger === "number" ? record.trigger : 0,
      },
    ];
  });

  return pages.length > 0 ? pages : [{ conditions: {}, list: [], trigger: 0 }];
}

function readCommonEvents(value: readonly unknown[]): SnapshotCommonEvent[] {
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const record = entry as Record<string, unknown>;
    const id = readPositiveInteger(record.id);
    if (id === null) {
      return [];
    }

    const output: SnapshotCommonEvent = {
      id,
      list: readRawCommandList(record.list),
      name: typeof record.name === "string" ? record.name : `Common Event ${id}`,
      trigger: typeof record.trigger === "number" ? record.trigger : 0,
    };

    if (typeof record.switchId === "number") {
      output.switchId = record.switchId;
    }

    return [output];
  });
}

function readRawCommandList(value: unknown): RawEventCommand[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const record = entry as Record<string, unknown>;
    if (typeof record.code !== "number") {
      return [];
    }

    return [
      {
        code: record.code,
        indent: typeof record.indent === "number" ? record.indent : 0,
        parameters: Array.isArray(record.parameters) ? [...record.parameters] : [],
      },
    ];
  });
}

function normalizeCommandList(commands: readonly RawEventCommand[] | undefined): RawEventCommand[] {
  return commands?.filter((command) => command.code !== 0) ?? [];
}

function readNamedSystemEntries(value: unknown): Array<{ id: number; name: string }> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry, index) => {
    if (typeof entry !== "string" || entry.length === 0 || index === 0) {
      return [];
    }

    return [{ id: index, name: entry }];
  });
}

async function readSnapshotFile(
  statePaths: WorkspaceStatePaths,
  relativePath: string,
): Promise<string> {
  return readFile(resolve(statePaths.projectDataSnapshotDirectory, relativePath), "utf8");
}

async function readSnapshotArray(
  statePaths: WorkspaceStatePaths,
  relativePath: string,
): Promise<unknown[]> {
  const parsed = JSON.parse(await readSnapshotFile(statePaths, relativePath));
  if (!Array.isArray(parsed)) {
    throw new Error(`Expected snapshot ${relativePath} to contain a JSON array.`);
  }

  return parsed;
}

async function readSnapshotObject(
  statePaths: WorkspaceStatePaths,
  relativePath: string,
): Promise<Record<string, unknown>> {
  const parsed = JSON.parse(await readSnapshotFile(statePaths, relativePath));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Expected snapshot ${relativePath} to contain a JSON object.`);
  }

  return parsed as Record<string, unknown>;
}

function renderEmptyModule(): string {
  return "export {};\n";
}

function commonEventTriggerFromCode(value: unknown): "none" | "autorun" | "parallel" {
  if (value === 1) {
    return "autorun";
  }
  if (value === 2) {
    return "parallel";
  }

  return "none";
}

function mapPageTriggerFromCode(
  value: unknown,
): "action" | "playerTouch" | "eventTouch" | "autorun" | "parallel" {
  if (value === 1) {
    return "playerTouch";
  }
  if (value === 2) {
    return "eventTouch";
  }
  if (value === 3) {
    return "autorun";
  }
  if (value === 4) {
    return "parallel";
  }

  return "action";
}

function controlVariableOperationFromCode(
  value: number,
): "set" | "add" | "sub" | "mul" | "div" | "mod" | null {
  switch (value) {
    case 0:
      return "set";
    case 1:
      return "add";
    case 2:
      return "sub";
    case 3:
      return "mul";
    case 4:
      return "div";
    case 5:
      return "mod";
    default:
      return null;
  }
}

function createExportNameAllocator(): {
  create(prefix: string, displayName: string, id: number): string;
} {
  const usedNames = new Set<string>();

  return {
    create(prefix, displayName, id) {
      const nameParts = displayName
        .normalize("NFKD")
        .replaceAll(/[^a-zA-Z0-9]+/gu, " ")
        .trim()
        .split(/\s+/u)
        .filter(Boolean);
      const base =
        nameParts.length === 0 ? prefix : `${prefix}${nameParts.map(toPascalCasePart).join("")}`;
      const candidate = `${base}${id.toString().padStart(3, "0")}`;
      let output = candidate;
      let suffix = 2;

      while (usedNames.has(output)) {
        output = `${candidate}_${suffix}`;
        suffix += 1;
      }

      usedNames.add(output);
      return output;
    },
  };
}

function toPascalCasePart(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function formatMapFileName(mapId: number): string {
  return `Map${mapId.toString().padStart(3, "0")}.json`;
}

function indentLines(value: string, spaces: number): string {
  if (value.length === 0) {
    return "";
  }

  const prefix = " ".repeat(spaces);
  return value
    .split("\n")
    .map((line) => (line.length === 0 ? line : `${prefix}${line}`))
    .join("\n");
}

function literal(value: unknown): string {
  return JSON.stringify(value);
}

function readStringParameter(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readPositiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

function isMissingFileError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string" &&
    (error as { code?: string }).code === "ENOENT"
  );
}
