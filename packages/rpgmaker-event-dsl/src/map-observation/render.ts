import { createMapImageLoader } from "./assets.js";
import { drawIncompleteNotice } from "./incomplete-notice.js";
import { z } from "zod";

import type { ValidatedMap, ValidatedTileset } from "./read.js";
import type { MapPreviewBounds, MapPreviewPage } from "./preview-types.js";
import { planMapViewport } from "./viewport.js";
import { drawCoordinateOverlay } from "./overlays.js";
import { blitRaster, createRaster, encodePng } from "./raster.js";
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
  allowMissingAssets?: boolean;
  crop?: MapPreviewBounds;
  grid?: boolean;
}) {
  const { map, tileset, projectRoot } = options;
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
  const imageLoader = createMapImageLoader({
    projectRoot,
    allowMissingAssets: options.allowMissingAssets === true,
  });
  const loadImage = imageLoader.load;

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
  function* visibleCellIndices() {
    for (let y = viewport.bounds.y; y < viewport.bounds.y + viewport.bounds.height; y++) {
      for (let x = viewport.bounds.x; x < viewport.bounds.x + viewport.bounds.width; x++) {
        yield y * map.width + x;
      }
    }
  }
  for (const index of visibleCellIndices()) {
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
  for (const index of visibleCellIndices()) {
    const layers = nativeCellLayers(map, tileset, index);
    for (const tileId of layers.upper)
      await drawTile(tileId, (index % map.width) * 48, Math.floor(index / map.width) * 48);
  }
  // Native z5 event sprites are above the upper tile scene.
  drawCoordinateOverlay(raster, viewport);
  if (imageLoader.warnings.length > 0) drawIncompleteNotice(raster);
  return {
    png: encodePng(raster),
    imageInputs: imageLoader.imageInputs,
    warnings: imageLoader.warnings,
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
    ...viewport,
  };
}
