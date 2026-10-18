import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";

import { z } from "zod";

import type { ValidatedMap, ValidatedTileset } from "./read.js";
import type { MapImageInput, MapPreviewBounds, MapPreviewPage } from "./preview-types.js";
import { planMapViewport } from "./viewport.js";
import { drawCoordinateOverlay } from "./overlays.js";
import { blitRaster, createRaster, decodePng, encodePng } from "./raster.js";
import type { Raster } from "./raster.js";

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
  crop?: MapPreviewBounds;
  grid?: boolean;
}) {
  const { map, tileset, projectRoot } = options;
  if (map.parallaxName !== "") throw new Error("Parallax rendering is not implemented yet.");
  const previewPages = readPreviewPages(map);
  const viewport = planMapViewport(map.width, map.height, options.crop, options.grid ?? true);
  const raster = createRaster(viewport.output.width, viewport.output.height);
  raster.viewport = {
    scaleX: viewport.transform.scaleX / 48,
    scaleY: viewport.transform.scaleY / 48,
    offsetX: viewport.transform.offsetX,
    offsetY: viewport.transform.offsetY,
    clip: viewport.mapContent,
  };
  const assets = new Map<string, Raster>();
  const imageInputs: MapImageInput[] = [];

  async function loadTileset(slot: number): Promise<Raster> {
    const name = tileset.tilesetNames[slot];
    if (name === undefined || name === "") {
      throw new Error(`Required tileset image slot ${slot} has no filename in Tilesets.json.`);
    }
    const relativePath = `img/tilesets/${name}.png`;
    const path = resolve(projectRoot, relativePath);
    const withinProject = relative(projectRoot, path);
    if (withinProject.startsWith("..") || isAbsolute(withinProject) || /[\\/]/u.test(name)) {
      throw new Error(
        `Invalid tileset image filename ${JSON.stringify(name)}: use a project asset filename.`,
      );
    }
    const cached = assets.get(path);
    if (cached !== undefined) return cached;
    let bytes: Buffer;
    try {
      bytes = await readFile(path);
    } catch (error) {
      throw new Error(
        `Cannot read required Map Image Asset ${relativePath} from Project Root ${projectRoot}. Restore the PNG image before rendering.`,
        { cause: error },
      );
    }
    let asset: Raster;
    try {
      asset = decodePng(bytes);
    } catch (error) {
      throw new Error(
        `Cannot decode required Map Image Asset ${relativePath}: ${error instanceof Error ? error.message : String(error)} Restore a valid PNG image before rendering.`,
        { cause: error },
      );
    }
    assets.set(path, asset);
    imageInputs.push({
      relativePath,
      path,
      status: "available",
      hash: createHash("sha256").update(bytes).digest("hex"),
    });
    return asset;
  }

  const cells = map.width * map.height;
  for (let index = 0; index < cells; index++) {
    const x = index % map.width;
    const y = Math.floor(index / map.width);
    if (
      x < viewport.bounds.x ||
      y < viewport.bounds.y ||
      x >= viewport.bounds.x + viewport.bounds.width ||
      y >= viewport.bounds.y + viewport.bounds.height
    )
      continue;
    if ([1, 2, 3].some((layer) => map.data[layer * cells + index] !== 0)) {
      throw new Error("Multiple tile layer rendering is not implemented yet.");
    }
    if (map.data[4 * cells + index] !== 0)
      throw new Error("Shadow rendering is not implemented yet.");
    const tileId = map.data[index]!;
    if (tileId === 0) continue;
    if (tileId >= 2048) throw new Error("Autotile rendering is not implemented yet.");
    if (tileId >= 1024 && tileId < 1536) throw new Error(`Malformed ordinary tile ID ${tileId}.`);
    const flags = tileset.flags[tileId];
    if (flags === undefined)
      throw new Error(`Tileset flags are missing required tile ID ${tileId}.`);
    if ((flags & 0x10) !== 0) throw new Error("Upper tile layer rendering is not implemented yet.");
    const slot = tileId >= 1536 ? 4 : 5 + Math.floor(tileId / 256);
    const asset = await loadTileset(slot);
    // MV ordinary tiles use two eight-column blocks in each B-E sheet.
    const sx = ((Math.floor(tileId / 128) % 2) * 8 + (tileId % 8)) * 48;
    const sy = (Math.floor((tileId % 256) / 8) % 16) * 48;
    try {
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
  drawCoordinateOverlay(raster, viewport);
  return {
    png: encodePng(raster),
    imageInputs,
    previewPages,
    width: raster.width,
    height: raster.height,
    ...viewport,
  };
}
