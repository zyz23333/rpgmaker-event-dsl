import {
  assertNativeMapEvent,
  assertNativeMapEvents,
  assertNativeMapPage,
  assertNativeMapPages,
} from "../map-event/native.js";
import { readProjectDataSnapshotFile, type WorkspaceStatePaths } from "../workspace/state.js";
import type { RawEventCommand } from "../compiler/types.js";
import type { SnapshotCommonEvent, SnapshotMapEvent, SnapshotMapEventPage } from "./types.js";
import { readNativePageMovement } from "../commands/movement/page.js";
import { describeValue, renderJsonValue } from "../project-data/json-values.js";
import {
  CommandStructureError,
  inspectCommandListStructure,
} from "../validation/command-structure.js";

export function renderPageConditions(conditions: Record<string, unknown> | undefined): string {
  if (conditions === undefined) {
    return "{}";
  }

  const fields: string[] = [];

  for (const [slot, helper] of [
    ["switch1", "switch"],
    ["switch2", "switch"],
    ["variable", "variable"],
    ["item", "item"],
    ["actor", "actor"],
  ] as const) {
    if (
      conditions[`${slot}Valid`] === false &&
      conditions[`${slot}Id`] === 1 &&
      (slot !== "variable" || Object.is(conditions.variableValue, 0))
    )
      continue;
    fields.push(
      `${slot}: { enabled: ${conditions[`${slot}Valid`]}, ref: ${helper}Ref({ id: ${literal(conditions[`${slot}Id`])} })${slot === "variable" ? `, atLeast: ${literal(conditions.variableValue)}` : ""} }`,
    );
  }
  if (conditions.selfSwitchValid !== false || conditions.selfSwitchCh !== "A")
    fields.push(
      `selfSwitch: { enabled: ${conditions.selfSwitchValid}, value: ${literal(conditions.selfSwitchCh)} }`,
    );

  if (fields.length === 0) {
    return "{}";
  }

  return `{\n${indentLines(fields.map((field) => `${field},`).join("\n"), 4)}\n  }`;
}

export function renderEventImport(helpers: readonly string[]): string {
  const uniqueHelpers = [...new Set(helpers)].sort((left, right) => left.localeCompare(right));

  return `import { ${uniqueHelpers.join(", ")} } from "rpgmaker-event-dsl";`;
}

export function collectConditionHelperNames(
  conditions: readonly (Record<string, unknown> | undefined)[],
): string[] {
  const helpers = new Set<string>();

  for (const condition of conditions) {
    if (
      condition &&
      (condition.switch1Valid !== false ||
        condition.switch1Id !== 1 ||
        condition.switch2Valid !== false ||
        condition.switch2Id !== 1)
    ) {
      helpers.add("switchRef");
    }
    if (
      condition &&
      (condition.variableValid !== false ||
        condition.variableId !== 1 ||
        !Object.is(condition.variableValue, 0))
    ) {
      helpers.add("variableRef");
    }
    if (condition && (condition.itemValid !== false || condition.itemId !== 1)) {
      helpers.add("itemRef");
    }
    if (condition && (condition.actorValid !== false || condition.actorId !== 1)) {
      helpers.add("actorRef");
    }
  }

  return [...helpers];
}

export function readMapEvents(
  mapData: Record<string, unknown>,
  mapId?: number,
): SnapshotMapEvent[] {
  try {
    assertNativeMapEvents(mapData.events);
  } catch (error) {
    if (error instanceof CommandStructureError)
      throw new CommandStructureError(
        error.code,
        error.detail,
        error.location,
        `map:${mapId ?? "?"}`,
        "decompile",
      );
    throw error;
  }
  return mapData.events.flatMap((entry, index) => {
    if (entry === null) return [];
    const identity = `map:${mapId ?? "?"}/event:${index}`;
    try {
      assertNativeMapEvent(entry, index);
      return [
        {
          id: entry.id as number,
          name: entry.name as string,
          note: entry.note as string,
          x: entry.x as number,
          y: entry.y as number,
          pages: readMapEventPages(entry.pages, identity),
        },
      ];
    } catch (error) {
      if (error instanceof CommandStructureError)
        throw new CommandStructureError(
          error.code,
          error.detail,
          error.location,
          identity,
          "decompile",
        );
      throw error;
    }
  });
}

export function readMapEventPages(value: unknown, identity?: string): SnapshotMapEventPage[] {
  try {
    assertNativeMapPages(value);
    return value.map((record, pageIndex) => {
      const path = `pages[${pageIndex}]`;
      assertNativeMapPage(record, path);
      const movement = readNativePageMovement(record, path)!;
      return {
        movement,
        conditions: record.conditions as Record<string, unknown>,
        image: record.image as SnapshotMapEventPage["image"],
        directionFix: record.directionFix as boolean,
        stepAnime: record.stepAnime as boolean,
        through: record.through as boolean,
        walkAnime: record.walkAnime as boolean,
        priorityType: record.priorityType as number,
        trigger: record.trigger as number,
        list: readRawCommandList(record.list, identity, `${path}.`),
      };
    });
  } catch (error) {
    if (error instanceof CommandStructureError)
      throw new CommandStructureError(
        error.code,
        error.detail,
        error.location,
        identity,
        "decompile",
      );
    throw error;
  }
}

export function readCommonEvents(value: readonly unknown[]): SnapshotCommonEvent[] {
  if (value.length === 0 || value[0] !== null)
    throw new CommandStructureError(
      "MV-COMMON-EVENT",
      "Common Event data requires a reserved null first slot.",
      {
        nativePath: "CommonEvents[0]",
        expected: "present null reserved slot",
        actual: describeValue(value[0]),
      },
      "commonEvents",
      "decompile",
    );
  return value.flatMap((entry, index) => {
    if (entry === null) return [];
    const fail = (field: string, expected: string, actual: unknown): never => {
      throw new CommandStructureError(
        "MV-COMMON-EVENT",
        "Invalid owned Common Event saved state.",
        {
          nativePath: `CommonEvents[${index}]${field ? `.${field}` : ""}`,
          expected,
          actual: describeValue(actual),
        },
        `commonEvent:${index}`,
        "decompile",
      );
    };
    if (typeof entry !== "object" || Array.isArray(entry))
      fail("", "Common Event object or null hole", entry);
    const record = entry as Record<string, unknown>;
    for (const field of Object.keys(record))
      if (!["id", "name", "trigger", "switchId", "list"].includes(field))
        fail(field, "only id, name, trigger, switchId and list", record[field]);
    if (index === 0 || record.id !== index)
      fail("id", "positive ID matching the array position", record.id);
    if (typeof record.name !== "string") fail("name", "present string", record.name);
    if (
      Object.is(record.trigger, -0) ||
      (record.trigger !== 0 && record.trigger !== 1 && record.trigger !== 2)
    )
      fail("trigger", "0, 1 or 2", record.trigger);
    if (!Number.isSafeInteger(record.switchId) || (record.switchId as number) <= 0)
      fail("switchId", "positive safe integer", record.switchId);
    return [
      {
        id: index,
        list: readRawCommandList(record.list, `commonEvent:${index}`),
        name: record.name as string,
        trigger: record.trigger as 0 | 1 | 2,
        switchId: record.switchId as number,
      },
    ];
  });
}

export function readRawCommandList(
  value: unknown,
  identity?: string,
  nativePrefix = "",
): RawEventCommand[] {
  try {
    inspectCommandListStructure(value as RawEventCommand[], { requireTerminator: true });
  } catch (error) {
    if (error instanceof CommandStructureError)
      throw new CommandStructureError(
        error.code,
        error.detail,
        {
          ...error.location,
          ...(error.location.nativePath
            ? { nativePath: nativePrefix + error.location.nativePath }
            : {}),
          ...(error.location.relatedLocations
            ? {
                relatedLocations: error.location.relatedLocations.map((related) => ({
                  ...related,
                  ...(related.nativePath ? { nativePath: nativePrefix + related.nativePath } : {}),
                })),
              }
            : {}),
        },
        identity,
        "decompile",
      );
    throw error;
  }
  return (value as RawEventCommand[]).map((entry: RawEventCommand) => ({
    ...entry,
    parameters: [...entry.parameters],
  }));
}

export function normalizeCommandList(
  commands: readonly RawEventCommand[] | undefined,
): RawEventCommand[] {
  return commands === undefined ? [] : [...commands];
}

export function readNamedSystemEntries(value: unknown): Array<{ id: number; name: string }> {
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

export async function readSnapshotFile(
  statePaths: WorkspaceStatePaths,
  relativePath: string,
): Promise<string> {
  return readProjectDataSnapshotFile(statePaths, relativePath);
}

export async function readSnapshotArray(
  statePaths: WorkspaceStatePaths,
  relativePath: string,
): Promise<unknown[]> {
  const parsed = JSON.parse(await readSnapshotFile(statePaths, relativePath));
  if (!Array.isArray(parsed)) {
    throw new Error(`Expected snapshot ${relativePath} to contain a JSON array.`);
  }

  return parsed;
}

export async function readSnapshotObject(
  statePaths: WorkspaceStatePaths,
  relativePath: string,
): Promise<Record<string, unknown>> {
  const parsed = JSON.parse(await readSnapshotFile(statePaths, relativePath));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Expected snapshot ${relativePath} to contain a JSON object.`);
  }

  return parsed as Record<string, unknown>;
}

export function renderEmptyModule(): string {
  return "export {};\n";
}

export function commonEventTriggerFromCode(value: unknown): "none" | "autorun" | "parallel" {
  if (value === 1) {
    return "autorun";
  }
  if (value === 2) {
    return "parallel";
  }

  return "none";
}

export function mapPageTriggerFromCode(
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

export function createExportNameAllocator(): {
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

export function toPascalCasePart(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export function formatMapFileName(mapId: number): string {
  return `Map${mapId.toString().padStart(3, "0")}.json`;
}

export function indentLines(value: string, spaces: number): string {
  if (value.length === 0) {
    return "";
  }

  const prefix = " ".repeat(spaces);
  return value
    .split("\n")
    .map((line) => (line.length === 0 ? line : `${prefix}${line}`))
    .join("\n");
}

export function literal(value: unknown): string {
  return renderJsonValue(value, { typeScript: true });
}

export function readStringParameter(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

export function isMessageBackground(value: unknown): value is 0 | 1 | 2 {
  return value === 0 || value === 1 || value === 2;
}

export function isMessagePositionType(value: unknown): value is 0 | 1 | 2 {
  return value === 0 || value === 1 || value === 2;
}

export function isItemType(value: unknown): value is 1 | 2 | 3 | 4 {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

export function isDirection(value: unknown): value is 2 | 4 | 6 | 8 {
  return value === 2 || value === 4 || value === 6 || value === 8;
}

export function isEventLocationDirection(value: unknown): value is 0 | 2 | 4 | 6 | 8 {
  return value === 0 || isDirection(value);
}

export function isFadeType(value: unknown): value is 0 | 1 | 2 {
  return value === 0 || value === 1 || value === 2;
}

export function isBlendMode(value: unknown): value is 0 | 1 | 2 | 3 {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

export function isNumberTuple(value: unknown, length: number): value is number[] {
  return (
    Array.isArray(value) &&
    value.length === length &&
    value.every((entry) => typeof entry === "number")
  );
}

export function isSelfSwitch(value: unknown): value is "A" | "B" | "C" | "D" {
  return value === "A" || value === "B" || value === "C" || value === "D";
}

export function readControlValue(value: unknown): boolean | null {
  if (value === 0) {
    return true;
  }
  if (value === 1) {
    return false;
  }

  return null;
}

export function readPositiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

export function isMissingFileError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string" &&
    (error as { code?: string }).code === "ENOENT"
  );
}
