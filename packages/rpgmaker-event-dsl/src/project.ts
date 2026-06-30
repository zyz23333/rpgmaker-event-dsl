import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type MapInfoEntry = {
  id: number;
  name: string;
  parentId: number;
};

export type ProjectIndex = {
  actorsByName: Map<string, number>;
  armorsByName: Map<string, number>;
  commonEventsByName: Map<string, number>;
  itemsByName: Map<string, number>;
  mapsByName: Map<string, number>;
  troopsByName: Map<string, number>;
  switchesByName: Map<string, number>;
  variablesByName: Map<string, number>;
  weaponsByName: Map<string, number>;
};

export type LoadedProject = {
  projectRoot: string;
  dataDirectory: string;
  mapInfos: MapInfoEntry[];
  commonEvents: readonly unknown[];
  index: ProjectIndex;
};

export async function loadProject(projectRoot: string): Promise<LoadedProject> {
  const dataDirectory = join(projectRoot, "data");
  const [
    mapInfosRaw,
    commonEventsRaw,
    actorsRaw,
    itemsRaw,
    weaponsRaw,
    armorsRaw,
    troopsRaw,
    systemRaw,
  ] = await Promise.all([
    readFile(join(dataDirectory, "MapInfos.json"), "utf8"),
    readFile(join(dataDirectory, "CommonEvents.json"), "utf8"),
    readFile(join(dataDirectory, "Actors.json"), "utf8"),
    readFile(join(dataDirectory, "Items.json"), "utf8"),
    readFile(join(dataDirectory, "Weapons.json"), "utf8"),
    readFile(join(dataDirectory, "Armors.json"), "utf8"),
    readFile(join(dataDirectory, "Troops.json"), "utf8"),
    readFile(join(dataDirectory, "System.json"), "utf8"),
  ]);

  const mapInfos = parseMapInfos(mapInfosRaw);
  const commonEvents = parseCommonEvents(commonEventsRaw);
  const actors = parseArray<Record<string, unknown>>(actorsRaw);
  const items = parseArray<Record<string, unknown>>(itemsRaw);
  const weapons = parseArray<Record<string, unknown>>(weaponsRaw);
  const armors = parseArray<Record<string, unknown>>(armorsRaw);
  const troops = parseArray<Record<string, unknown>>(troopsRaw);
  const system = parseObject<Record<string, unknown>>(systemRaw);

  return {
    projectRoot,
    dataDirectory,
    mapInfos,
    commonEvents,
    index: buildProjectIndex({
      actors,
      armors,
      commonEvents,
      items,
      mapInfos,
      troops,
      system,
      weapons,
    }),
  };
}

export function buildProjectIndex(input: {
  actors: readonly Record<string, unknown>[];
  armors: readonly Record<string, unknown>[];
  commonEvents: readonly { id: number; name: string }[];
  items: readonly Record<string, unknown>[];
  mapInfos: readonly MapInfoEntry[];
  troops?: readonly Record<string, unknown>[];
  system: Record<string, unknown>;
  weapons: readonly Record<string, unknown>[];
}): ProjectIndex {
  return {
    actorsByName: buildNamedIndex(input.actors),
    armorsByName: buildNamedIndex(input.armors),
    commonEventsByName: buildNamedIndex(input.commonEvents),
    itemsByName: buildNamedIndex(input.items),
    mapsByName: buildMapIndex(input.mapInfos),
    troopsByName: buildNamedIndex(input.troops ?? []),
    switchesByName: buildNamedIndexFromEntries(readSwitchEntries(input.system)),
    variablesByName: buildNamedIndexFromEntries(readVariableEntries(input.system)),
    weaponsByName: buildNamedIndex(input.weapons),
  };
}

export function parseMapInfos(raw: string): MapInfoEntry[] {
  const values = parseArray<Record<string, unknown>>(raw);

  return values.flatMap((entry) => {
    if (!entry) {
      return [];
    }

    const id = readPositiveInt(entry.id);
    const name = readString(entry.name);
    const parentId = readNonNegativeInt(entry.parentId);

    if (id === null || name === null || parentId === null) {
      return [];
    }

    return [{ id, name, parentId }];
  });
}

export function parseCommonEvents(raw: string): { id: number; name: string }[] {
  const values = parseArray<Record<string, unknown>>(raw);

  return values.flatMap((entry) => {
    if (!entry) {
      return [];
    }

    const id = readPositiveInt(entry.id);
    const name = readString(entry.name);

    if (id === null || name === null) {
      return [];
    }

    return [{ id, name }];
  });
}

function buildMapIndex(mapInfos: readonly MapInfoEntry[]): Map<string, number> {
  const index = new Map<string, number>();

  for (const entry of mapInfos) {
    if (!index.has(entry.name)) {
      index.set(entry.name, entry.id);
    }
  }

  return index;
}

function buildNamedIndex(
  entries: readonly (Record<string, unknown> | null | undefined)[],
): Map<string, number> {
  const index = new Map<string, number>();

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const id = readPositiveInt(entry.id);
    const name = readString(entry.name);

    if (id !== null && name !== null && !index.has(name)) {
      index.set(name, id);
    }
  }

  return index;
}

function buildNamedIndexFromEntries(
  entries: readonly { id: number; name: string }[],
): Map<string, number> {
  const index = new Map<string, number>();

  for (const entry of entries) {
    if (!index.has(entry.name)) {
      index.set(entry.name, entry.id);
    }
  }

  return index;
}

function readSwitchEntries(system: Record<string, unknown>): { id: number; name: string }[] {
  return readDatabaseEntries(system, "switches");
}

function readVariableEntries(system: Record<string, unknown>): { id: number; name: string }[] {
  return readDatabaseEntries(system, "variables");
}

function readDatabaseEntries(
  system: Record<string, unknown>,
  key: string,
): { id: number; name: string }[] {
  const entries = system[key];
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries.flatMap((entry, index) => {
    if (typeof entry === "string") {
      return entry.length > 0 ? [{ id: index, name: entry }] : [];
    }

    if (!entry || typeof entry !== "object") {
      return [];
    }

    const record = entry as Record<string, unknown>;
    const name = readString(record.name);
    return name === null ? [] : [{ id: index, name }];
  });
}

function parseArray<T>(raw: string): T[] {
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("Expected a JSON array.");
  }

  return parsed as T[];
}

function parseObject<T>(raw: string): T {
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Expected a JSON object.");
  }

  return parsed as T;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readPositiveInt(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

function readNonNegativeInt(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}
