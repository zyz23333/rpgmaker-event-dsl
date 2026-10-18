// Adapted from RPG Maker MV CoreScript Sprite_Character.js (MIT).
// Copyright (c) 2015 KADOKAWA CORPORATION./YOJI OJIMA.
// Full license: distributed THIRD_PARTY_NOTICES.md.
import { mapEventImageSchema } from "./event-image.js";
import { z } from "zod";
import type { ValidatedMap, ValidatedTileset } from "./read.js";
import { blitRaster, createRaster } from "./raster.js";
import type { Raster } from "./raster.js";
import type { MapPreviewPage } from "./preview-types.js";

export function selectPreviewEvents(map: ValidatedMap, choices: readonly MapPreviewPage[] = []) {
  const checked = z.array(z.object({
    eventId: z.number().int().positive(), page: z.number().int().positive(),
  })).safeParse(choices);
  if (!checked.success) throw new Error(`Invalid Preview Page choices: ${checked.error.message}`);
  const selectedPages = new Map<number, number>();
  for (const { eventId, page } of checked.data) {
    if (selectedPages.has(eventId)) throw new Error(`Duplicate Preview Page override for event ${eventId}.`);
    const event = map.events.find((event) => event?.id === eventId);
    if (event === undefined || event === null)
      throw new Error(`Preview Page override event ${eventId} does not exist in the Selected Map and source.`);
    if (page > event.pages.length) throw new Error(`Event ${eventId} does not have Preview Page ${page}.`);
    selectedPages.set(eventId, page);
  }
  return map.events.flatMap((event, order) => {
    if (event === null) return [];
    const page = selectedPages.get(event.id) ?? 1;
    const selected = event.pages[page - 1];
    const image = mapEventImageSchema.safeParse(selected?.image);
    if (!image.success)
      throw new Error(`Malformed event ${event.id} Preview Page ${page} image definition: ${image.error.message}`);
    const priority = z.number().int().min(0).max(2).default(1).safeParse(selected?.priorityType);
    if (!priority.success) throw new Error(`Malformed event ${event.id} Preview Page ${page} priorityType.`);
    const prefix = /^[!$]+/u.exec(image.data.characterName)?.[0] ?? "";
    const shiftY = image.data.tileId > 0 || prefix.includes("!") ? 0 : 6;
    return [{ eventId: event.id, page, x: event.x, y: event.y, image: image.data,
      priorityType: priority.data, bottomY: event.y * 48 + 48 - shiftY, order }];
  });
}

export async function drawNativeEvent(options: {
  target: Raster;
  event: ReturnType<typeof selectPreviewEvents>[number];
  map: ValidatedMap;
  tileset: ValidatedTileset;
  loadImage: (category: "characters" | "tilesets", name: string) => Promise<Raster>;
}): Promise<void> {
  const { target, event, map, tileset, loadImage } = options;
  const image = event.image;
  if (image.tileId === 0 && image.characterName === "") return;
  if (image.tileId > 0) {
    if (image.tileId >= 1024)
      throw new Error(`Malformed event ${event.eventId} tile graphic ${image.tileId}: use a native B-E tile ID.`);
    const slot = 5 + Math.floor(image.tileId / 256);
    const name = tileset.tilesetNames[slot];
    if (name === undefined || name === "")
      throw new Error(`Required event tileset image slot ${slot} has no filename in Tilesets.json.`);
    const asset = await loadImage("tilesets", name);
    const sx = ((Math.floor(image.tileId / 128) % 2) * 8 + (image.tileId % 8)) * 48;
    const sy = (Math.floor((image.tileId % 256) / 8) % 16) * 48;
    blitRaster(target, asset, sx, sy, 48, 48, event.x * 48, event.y * 48);
    return;
  }
  const prefix = /^[!$]+/u.exec(image.characterName)?.[0] ?? "";
  const big = prefix.includes("$");
  const asset = await loadImage("characters", image.characterName);
  const width = asset.width / (big ? 3 : 12);
  const height = asset.height / (big ? 4 : 8);
  if (!Number.isInteger(width) || !Number.isInteger(height))
    throw new Error(`Malformed character image ${image.characterName}: expected an integral ${big ? "3 x 4" : "12 x 8"} frame layout.`);
  const sx = ((big ? 0 : (image.characterIndex % 4) * 3) + image.pattern) * width;
  const sy = ((big ? 0 : Math.floor(image.characterIndex / 4) * 4) + (image.direction - 2) / 2) * height;
  const cells = map.width * map.height;
  let onBush = false;
  for (let plane = 0; plane < 4; plane++) {
    const tileId = map.data[plane * cells + event.y * map.width + event.x]!;
    const flags = tileset.flags[tileId];
    if (flags === undefined) throw new Error(`Tileset flags are missing required tile ID ${tileId}.`);
    if ((flags & 0x40) !== 0) onBush = true;
  }
  if (event.priorityType === 1 && !prefix.includes("!") && onBush) {
    const depth = Math.min(12, height);
    const dx = event.x * 48 + 24 - width / 2;
    if (height > depth) blitRaster(target, asset, sx, sy, width, height - depth, dx, event.bottomY - height);
    const lowerBody = createRaster(width, depth);
    for (let y = 0; y < depth; y++) {
      const start = ((sy + height - depth + y) * asset.width + sx) * 4;
      lowerBody.data.set(asset.data.subarray(start, start + width * 4), y * width * 4);
    }
    for (let offset = 3; offset < lowerBody.data.length; offset += 4)
      lowerBody.data[offset] = Math.round(lowerBody.data[offset]! * 128 / 255);
    blitRaster(target, lowerBody, 0, 0, width, depth, dx, event.bottomY - depth);
    return;
  }
  blitRaster(target, asset, sx, sy, width, height,
    event.x * 48 + 24 - width / 2, event.bottomY - height);
}
