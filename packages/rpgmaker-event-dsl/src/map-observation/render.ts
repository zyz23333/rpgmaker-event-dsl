import { createMapImageLoader } from "./assets.js";
import { drawIncompleteNotice } from "./incomplete-notice.js";

import type { ValidatedMap, ValidatedTileset } from "./read.js";
import type { MapPreviewBounds, MapPreviewPage } from "./preview-types.js";
import { planMapViewport } from "./viewport.js";
import { drawCoordinateOverlay, drawEventMarkers } from "./overlays.js";
import { blitRaster, createRaster, encodePng } from "./raster.js";
import type { Raster } from "./raster.js";
import { drawNativeParallax, drawNativeShadow, nativeCellLayers } from "./native-layers.js";
import { drawAutotile, drawTableEdge, getAutotileSlot } from "./native-autotiles.js";
import { drawNativeEvent, selectPreviewEvents } from "./native-events.js";
import { ordinaryTileAtlasLayout } from "./native-image-layout.js";

export async function renderMapPreview(options: {
  map: ValidatedMap;
  tileset: ValidatedTileset;
  projectRoot: string;
  allowMissingAssets?: boolean;
  events?: boolean;
  eventPages?: readonly MapPreviewPage[];
  crop?: MapPreviewBounds;
  grid?: boolean;
}) {
  const { map, tileset, projectRoot } = options;
  const previewEvents = selectPreviewEvents(map, options.eventPages);
  const previewPages = previewEvents.map(({ eventId, page }) => ({ eventId, page }));
  const orderedEvents = [...previewEvents].sort(
    (left, right) =>
      left.priorityType - right.priorityType ||
      left.bottomY - right.bottomY ||
      left.order - right.order,
  );
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
    const ordinary = tileId < 2048 ? ordinaryTileAtlasLayout(tileId) : undefined;
    const slot = ordinary?.slot ?? getAutotileSlot(tileId);
    const asset = await loadTileset(slot);
    try {
      if (ordinary === undefined) {
        drawAutotile(raster, asset, tileId, flags, dx, dy);
        return;
      }
      blitRaster(raster, asset, ordinary.sx, ordinary.sy, 48, 48, dx, dy);
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
  for (const priority of [0, 1]) {
    for (const event of orderedEvents.filter((event) => event.priorityType === priority))
      await drawNativeEvent({ target: raster, event, map, tileset, loadImage });
  }
  for (const index of visibleCellIndices()) {
    const layers = nativeCellLayers(map, tileset, index);
    for (const tileId of layers.upper)
      await drawTile(tileId, (index % map.width) * 48, Math.floor(index / map.width) * 48);
  }
  for (const event of orderedEvents.filter((event) => event.priorityType === 2))
    await drawNativeEvent({ target: raster, event, map, tileset, loadImage });
  drawCoordinateOverlay(raster, viewport);
  if (options.events !== false) drawEventMarkers(raster, previewEvents, viewport);
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
    overlays: { ...viewport.overlays, events: options.events !== false },
  };
}
