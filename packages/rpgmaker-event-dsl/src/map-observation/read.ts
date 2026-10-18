import { z } from "zod";

import type { MapInfoEntry } from "../project-data/project.js";

const mapInfoSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  parentId: z.number().int().nonnegative(),
});

const audioSchema = z.object({
  name: z.string(),
  pan: z.number(),
  pitch: z.number(),
  volume: z.number(),
});

const mapSettingsSchema = z.object({
  autoplayBgm: z.boolean(),
  autoplayBgs: z.boolean(),
  battleback1Name: z.string(),
  battleback2Name: z.string(),
  bgm: audioSchema,
  bgs: audioSchema,
  disableDashing: z.boolean(),
  displayName: z.string(),
  encounterList: z.array(z.record(z.string(), z.unknown())),
  encounterStep: z.number().int().nonnegative(),
  note: z.string(),
  parallaxLoopX: z.boolean(),
  parallaxLoopY: z.boolean(),
  parallaxName: z.string(),
  parallaxShow: z.boolean(),
  parallaxSx: z.number(),
  parallaxSy: z.number(),
  scrollType: z.number().int().min(0).max(3),
  specifyBattleback: z.boolean(),
});

const mapEventSchema = z
  .object({
    id: z.number().int().positive(),
    name: z.string(),
    note: z.string().optional(),
    x: z.number().int().nonnegative(),
    y: z.number().int().nonnegative(),
    pages: z.array(z.record(z.string(), z.unknown())).nonempty(),
  })
  .passthrough();

const mapSchema = mapSettingsSchema.extend({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  tilesetId: z.number().int().positive(),
  data: z.array(z.number().int().nonnegative()),
  events: z.array(mapEventSchema.nullable()),
});

const tilesetSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  mode: z.number().int().min(0).max(1),
  flags: z.array(z.number().int().nonnegative()),
  tilesetNames: z.array(z.string()).length(9),
});

export type ValidatedMap = z.infer<typeof mapSchema>;
export type ValidatedTileset = z.infer<typeof tilesetSchema>;
export type MapSettings = z.infer<typeof mapSettingsSchema>;

export function readSelectedMap(value: unknown, mapId: number): ValidatedMap {
  const result = mapSchema.safeParse(value);
  if (!result.success) {
    throw new Error(`Malformed map ${mapId}: ${result.error.message}`);
  }
  const map = result.data;
  if (map.data.length !== map.width * map.height * 6) {
    throw new Error(
      `Malformed map ${mapId}: tile data must contain six layers for ${map.width} x ${map.height} cells.`,
    );
  }
  const ids = new Set<number>();
  for (const [slot, event] of map.events.entries()) {
    if (event === null) continue;
    if (event.id !== slot) {
      throw new Error(
        `Malformed map ${mapId}: event ID ${event.id} does not match its native MV array slot ${slot}. Restore matching event identities before observing the map.`,
      );
    }
    if (ids.has(event.id) || event.x >= map.width || event.y >= map.height) {
      throw new Error(
        `Malformed map ${mapId}: event ${event.id} must have a unique ID and a definition position inside the map.`,
      );
    }
    ids.add(event.id);
  }
  return map;
}

export function readSelectedTileset(value: unknown, tilesetId: number): ValidatedTileset {
  if (!Array.isArray(value)) {
    throw new Error("Malformed Tilesets.json: expected an array.");
  }
  const entry: unknown = value[tilesetId];
  const result = tilesetSchema.safeParse(entry);
  if (!result.success || result.data.id !== tilesetId) {
    throw new Error(
      `Tileset ${tilesetId} is missing or malformed in Tilesets.json. Run clone or pull to restore supporting data.`,
    );
  }
  return result.data;
}

export function readMapSettings(map: ValidatedMap): MapSettings {
  return mapSettingsSchema.parse(map);
}

export function readMapDirectory(value: unknown): MapInfoEntry[] {
  const result = z.array(mapInfoSchema.nullable()).safeParse(value);
  if (!result.success) {
    throw new Error(`Malformed MapInfos.json: ${result.error.message}`);
  }
  for (const [slot, entry] of result.data.entries()) {
    if (entry !== null && entry.id !== slot) {
      throw new Error(
        `Malformed MapInfos.json: map ID ${entry.id} does not match its native MV array slot ${slot}. Restore matching map identities before observing maps.`,
      );
    }
  }
  const maps = result.data.filter((entry) => entry !== null);
  if (new Set(maps.map(({ id }) => id)).size !== maps.length) {
    throw new Error("Malformed MapInfos.json: map IDs must be unique.");
  }
  return maps.sort((left, right) => left.id - right.id);
}
