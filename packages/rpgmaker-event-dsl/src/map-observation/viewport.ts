import { validateMapBounds } from "./geometry.js";
import type { MapPreviewBounds } from "./preview-types.js";
import { maximumRasterDimension } from "./raster.js";

export function planMapViewport(
  mapWidth: number,
  mapHeight: number,
  crop?: MapPreviewBounds,
  grid = true,
) {
  const bounds = crop ?? { x: 0, y: 0, width: mapWidth, height: mapHeight };
  validateMapBounds(bounds, mapWidth, mapHeight, "crop");
  const nativeWidth = bounds.width * 48;
  const nativeHeight = bounds.height * 48;
  const leftMargin = grid ? Math.max(28, String(bounds.y + bounds.height - 1).length * 4 + 12) : 0;
  const topMargin = grid ? 20 : 0;
  const scale = Math.min(
    1,
    (maximumRasterDimension - leftMargin) / nativeWidth,
    (maximumRasterDimension - topMargin) / nativeHeight,
  );
  const width = Math.max(1, Math.floor(nativeWidth * scale));
  const height = Math.max(1, Math.floor(nativeHeight * scale));
  const scaleX = width / bounds.width;
  const scaleY = height / bounds.height;
  return {
    bounds,
    output: { width: width + leftMargin, height: height + topMargin },
    mapContent: { x: leftMargin, y: topMargin, width, height },
    transform: {
      scaleX,
      scaleY,
      offsetX: leftMargin - bounds.x * scaleX,
      offsetY: topMargin - bounds.y * scaleY,
    },
    overlays: {
      grid,
      coordinateStep: {
        x: Math.max(1, Math.ceil((String(bounds.x + bounds.width - 1).length * 4 + 12) / scaleX)),
        y: Math.max(1, Math.ceil(12 / scaleY)),
      },
    },
  };
}
