import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";

import { z } from "zod";

import type { ValidatedMap, ValidatedTileset } from "./read.js";
import type { MapImageInput, MapPreviewPage } from "./preview-types.js";
import { blitRaster, createRaster, decodePng, encodePng } from "./raster.js";
import type { Raster } from "./raster.js";
import { drawNativeParallax, drawNativeShadow, nativeCellLayers } from "./native-layers.js";
import { drawAutotile, drawTableEdge, getAutotileSlot } from "./native-autotiles.js";

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
}) {
  const { map, tileset, projectRoot } = options;
  const previewPages = readPreviewPages(map);
  const raster = createRaster(map.width * 48, map.height * 48);
  const assets = new Map<string, Raster>();
  const imageInputs: MapImageInput[] = [];

  async function loadImage(category: "tilesets" | "parallaxes", name: string): Promise<Raster> {
    const relativePath = `img/${category}/${name}.png`;
    const path = resolve(projectRoot, relativePath);
    const withinProject = relative(projectRoot, path);
    if (withinProject.startsWith("..") || isAbsolute(withinProject) || /[\\/]/u.test(name)) {
      throw new Error(
        `Invalid ${category} image filename ${JSON.stringify(name)}: use a project asset filename.`,
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

  async function loadTileset(slot: number): Promise<Raster> {
    const name = tileset.tilesetNames[slot];
    if (name === undefined || name === "") {
      throw new Error(`Required tileset image slot ${slot} has no filename in Tilesets.json.`);
    }
    return loadImage("tilesets", name);
  }

  if (map.parallaxName !== "") {
    const parallax = await loadImage("parallaxes", map.parallaxName);
    drawNativeParallax(raster, parallax, map.width * 48, map.height * 48);
  }

  async function drawTile(tileId: number, dx: number, dy: number) {
    if (tileId === 0) return;
    if (tileId >= 1024 && tileId < 1536) throw new Error(`Malformed ordinary tile ID ${tileId}.`);
    const flags = tileset.flags[tileId];
    if (flags === undefined)
      throw new Error(`Tileset flags are missing required tile ID ${tileId}.`);
    const slot =
      tileId >= 2048 ? getAutotileSlot(tileId) : tileId >= 1536 ? 4 : 5 + Math.floor(tileId / 256);
    const asset = await loadTileset(slot);
    // MV ordinary tiles use two eight-column blocks in each B-E sheet.
    const sx = ((Math.floor(tileId / 128) % 2) * 8 + (tileId % 8)) * 48;
    const sy = (Math.floor((tileId % 256) / 8) % 16) * 48;
    try {
      if (tileId >= 2048) {
        drawAutotile(raster, asset, tileId, flags, dx, dy);
        return;
      }
      blitRaster(raster, asset, sx, sy, 48, 48, dx, dy);
    } catch (error) {
      throw new Error(
        `Cannot render tile ${tileId} from tileset image ${tileset.tilesetNames[slot]}: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  }
  const cells = map.width * map.height;
  for (let index = 0; index < cells; index++) {
    const layers = nativeCellLayers(map, tileset, index);
    const dx = (index % map.width) * 48;
    const dy = Math.floor(index / map.width) * 48;
    for (const tileId of layers.lowerBeforeShadow) await drawTile(tileId, dx, dy);
    drawNativeShadow(raster, layers.shadowBits, dx, dy);
    if (layers.tableEdgeTileId !== 0) {
      const asset = await loadTileset(1);
      drawTableEdge(raster, asset, layers.tableEdgeTileId, dx, dy);
    }
    for (const tileId of layers.lowerAfterShadow) await drawTile(tileId, dx, dy);
  }
  // Event sprites at native z1/z3 are composed here by event rendering.
  for (let index = 0; index < cells; index++) {
    const layers = nativeCellLayers(map, tileset, index);
    for (const tileId of layers.upper)
      await drawTile(tileId, (index % map.width) * 48, Math.floor(index / map.width) * 48);
  }
  // Native z5 event sprites are above the upper tile scene.
  return {
    png: encodePng(raster),
    imageInputs,
    previewPages,
    parallax: {
      name: map.parallaxName,
      originX: 0 as const,
      originY: 0 as const,
      time: 0 as const,
      loopX: map.parallaxLoopX,
      loopY: map.parallaxLoopY,
      scrollX: map.parallaxSx,
      scrollY: map.parallaxSy,
    },
    width: raster.width,
    height: raster.height,
  };
}
