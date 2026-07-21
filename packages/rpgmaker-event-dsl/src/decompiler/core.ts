import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { WorkspaceStatePaths } from "../workspace/state.js";
import type { RawEventCommand } from "../compiler/types.js";
import type { SnapshotCommonEvent, SnapshotMapEvent, SnapshotMapEventPage } from "./types.js";

export function renderPageConditions(conditions: Record<string, unknown> | undefined): string {
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

export function renderEventImport(helpers: readonly string[]): string {
  const uniqueHelpers = [...new Set(helpers)].sort((left, right) => left.localeCompare(right));

  return `import { ${uniqueHelpers.join(", ")} } from "rpgmaker-event-dsl";`;
}

export function collectConditionHelperNames(
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

export function readMapEvents(mapData: Record<string, unknown>): SnapshotMapEvent[] {
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

export function readMapEventPages(value: unknown): SnapshotMapEventPage[] {
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

export function readCommonEvents(value: readonly unknown[]): SnapshotCommonEvent[] {
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

export function readRawCommandList(value: unknown): RawEventCommand[] {
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

export function normalizeCommandList(
  commands: readonly RawEventCommand[] | undefined,
): RawEventCommand[] {
  return commands?.filter((command) => command.code !== 0) ?? [];
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
  return readFile(resolve(statePaths.projectDataSnapshotDirectory, relativePath), "utf8");
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
  return JSON.stringify(value);
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
