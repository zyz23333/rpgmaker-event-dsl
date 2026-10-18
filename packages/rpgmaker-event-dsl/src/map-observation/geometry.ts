import type { MapBounds } from "./types.js";

export function validateMapBounds(
  bounds: MapBounds,
  mapWidth: number,
  mapHeight: number,
  label: string,
): void {
  const { x, y, width, height } = bounds;
  if (
    ![x, y, width, height].every(Number.isSafeInteger) ||
    x < 0 ||
    y < 0 ||
    width <= 0 ||
    height <= 0
  ) {
    throw new Error(
      `Invalid ${label}: use nonnegative integer X/Y and positive integer width/height within safe integer limits.`,
    );
  }
  if (x >= mapWidth || y >= mapHeight || width > mapWidth - x || height > mapHeight - y) {
    throw new Error(
      `Requested ${label} is outside the ${mapWidth} x ${mapHeight} map. Use original zero-based map coordinates; selections do not wrap.`,
    );
  }
}
