// Adapted from RPG Maker MV CoreScript Sprite_Character.js (MIT).
// Copyright (c) 2015 KADOKAWA CORPORATION./YOJI OJIMA.
// Full license: distributed THIRD_PARTY_NOTICES.md.
import { mapEventImageSchema } from "./event-image.js";
import { z } from "zod";
import type { ValidatedMap, ValidatedTileset } from "./read.js";
import { blitRaster } from "./raster.js";
import type { Raster } from "./raster.js";

export function selectPreviewEvents(map: ValidatedMap) {
  return map.events.flatMap((event) => {
    if (event === null) return [];
    const image = mapEventImageSchema.safeParse(event.pages[0]?.image);
    if (!image.success)
      throw new Error(`Malformed event ${event.id} Preview Page 1 image definition: ${image.error.message}`);
    const priority = z.number().int().min(0).max(2).default(1).safeParse(event.pages[0]?.priorityType);
    if (!priority.success) throw new Error(`Malformed event ${event.id} Preview Page 1 priorityType.`);
    return [{ eventId: event.id, page: 1, x: event.x, y: event.y, image: image.data, priorityType: priority.data }];
  });
}

export async function drawNativeEvent(options: {
  target: Raster;
  event: ReturnType<typeof selectPreviewEvents>[number];
  tileset: ValidatedTileset;
  loadImage: (category: "characters" | "tilesets", name: string) => Promise<Raster>;
}): Promise<void> {
  const { target, event, tileset, loadImage } = options;
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
  const shiftY = prefix.includes("!") ? 0 : 6;
  const asset = await loadImage("characters", image.characterName);
  const width = asset.width / (big ? 3 : 12);
  const height = asset.height / (big ? 4 : 8);
  if (!Number.isInteger(width) || !Number.isInteger(height))
    throw new Error(`Malformed character image ${image.characterName}: expected an integral ${big ? "3 x 4" : "12 x 8"} frame layout.`);
  const sx = ((big ? 0 : (image.characterIndex % 4) * 3) + image.pattern) * width;
  const sy = ((big ? 0 : Math.floor(image.characterIndex / 4) * 4) + (image.direction - 2) / 2) * height;
  blitRaster(target, asset, sx, sy, width, height,
    event.x * 48 + 24 - width / 2, event.y * 48 + 48 - shiftY - height);
}
