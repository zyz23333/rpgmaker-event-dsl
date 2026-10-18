import { createMapImageLoader } from "./assets.js";
import { drawIncompleteNotice } from "./incomplete-notice.js";
import { z } from "zod";

import type { ValidatedMap, ValidatedTileset } from "./read.js";
import type { MapPreviewPage } from "./preview-types.js";
import { blitRaster, createRaster, encodePng } from "./raster.js";
import type { Raster } from "./raster.js";
import { drawAutotile, getAutotileSlot } from "./native-autotiles.js";

const imageSchema = z.object({
  characterName: z.string(),
  tileId: z.number().int().nonnegative(),
});

function readPreviewPages(map: ValidatedMap): MapPreviewPage[] {
  return map.events.flatMap((event) => {
    if (event === null) return [];
    const image = imageSchema.safeParse(event.pages[0]?.image);
    if (!image.success)
      throw new Error(`Malformed event ${event.id} Preview Page 1 image definition.`);
    if (image.data.tileId !== 0 || image.data.characterName !== "") {
      throw new Error(
        `Event ${event.id} has a visual image. Event image rendering is not implemented yet.`,
      );
    }
    return [{ eventId: event.id, page: 1 }];
  });
}

export async function renderMapPreview(options: {
  map: ValidatedMap;
  tileset: ValidatedTileset;
  projectRoot: string;
  allowMissingAssets?: boolean;
}) {
  const { map, tileset, projectRoot } = options;
  if (map.parallaxName !== "") throw new Error("Parallax rendering is not implemented yet.");
  const previewPages = readPreviewPages(map);
  const raster = createRaster(map.width * 48, map.height * 48);
  const imageLoader = createMapImageLoader({
    projectRoot,
    allowMissingAssets: options.allowMissingAssets === true,
  });

  async function loadTileset(slot: number): Promise<Raster> {
    const name = tileset.tilesetNames[slot];
    if (name === undefined || name === "")
      throw new Error(`Required tileset image slot ${slot} has no filename in Tilesets.json.`);
    return imageLoader.load("tilesets", name);
  }

  const cells = map.width * map.height;
  for (let index = 0; index < cells; index++) {
    if ([1, 2, 3].some((layer) => map.data[layer * cells + index] !== 0)) {
      throw new Error("Multiple tile layer rendering is not implemented yet.");
    }
    if (map.data[4 * cells + index] !== 0)
      throw new Error("Shadow rendering is not implemented yet.");
    const tileId = map.data[index]!;
    if (tileId === 0) continue;
    if (tileId >= 1024 && tileId < 1536) throw new Error(`Malformed ordinary tile ID ${tileId}.`);
    const flags = tileset.flags[tileId];
    if (flags === undefined)
      throw new Error(`Tileset flags are missing required tile ID ${tileId}.`);
    if ((flags & 0x10) !== 0) throw new Error("Upper tile layer rendering is not implemented yet.");
    const slot =
      tileId >= 2048 ? getAutotileSlot(tileId) : tileId >= 1536 ? 4 : 5 + Math.floor(tileId / 256);
    const asset = await loadTileset(slot);
    // MV ordinary tiles use two eight-column blocks in each B-E sheet.
    const sx = ((Math.floor(tileId / 128) % 2) * 8 + (tileId % 8)) * 48;
    const sy = (Math.floor((tileId % 256) / 8) % 16) * 48;
    try {
      if (tileId >= 2048) {
        drawAutotile(
          raster,
          asset,
          tileId,
          flags,
          (index % map.width) * 48,
          Math.floor(index / map.width) * 48,
        );
        continue;
      }
      blitRaster(
        raster,
        asset,
        sx,
        sy,
        48,
        48,
        (index % map.width) * 48,
        Math.floor(index / map.width) * 48,
      );
    } catch (error) {
      throw new Error(
        `Cannot render tile ${tileId} from tileset image ${tileset.tilesetNames[slot]}: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  }
  if (imageLoader.warnings.length > 0) drawIncompleteNotice(raster);
  return {
    png: encodePng(raster),
    imageInputs: imageLoader.imageInputs,
    warnings: imageLoader.warnings,
    previewPages,
    width: raster.width,
    height: raster.height,
  };
}
