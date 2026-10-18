import type { ValidatedMap, ValidatedTileset } from "./read.js";
import { blitRaster, createRaster } from "./raster.js";
import type { Raster } from "./raster.js";

// MV Tilemap._paintTiles keeps z0 and z4 separate, with shadows between
// lower planes0/1 and lower planes2/3. Event z1/z3 belongs between these scenes.
export function nativeCellLayers(map: ValidatedMap, tileset: ValidatedTileset, index: number) {
  const cells = map.width * map.height;
  const lowerBeforeShadow: number[] = [];
  const lowerAfterShadow: number[] = [];
  const upper: number[] = [];
  for (let plane = 0; plane < 4; plane++) {
    const tileId = map.data[plane * cells + index]!;
    if (tileId === 0) continue;
    const flags = tileset.flags[tileId];
    if (flags === undefined)
      throw new Error(`Tileset flags are missing required tile ID ${tileId}.`);
    if ((flags & 0x10) !== 0) upper.push(tileId);
    else (plane < 2 ? lowerBeforeShadow : lowerAfterShadow).push(tileId);
  }
  const x = index % map.width;
  const y = Math.floor(index / map.width);
  const aboveY = y > 0 ? y - 1 : map.scrollType === 1 || map.scrollType === 3 ? map.height - 1 : -1;
  const above = aboveY < 0 ? 0 : map.data[cells + aboveY * map.width + x]!;
  const current = map.data[cells + index]!;
  const base = map.data[index]!;
  const isTable = (tileId: number) =>
    tileId >= 2816 && tileId < 4352 && ((tileset.flags[tileId] ?? 0) & 0x80) !== 0;
  const tableEdgeTileId =
    isTable(above) && !isTable(current) && !(base >= 4352 && base < 8192) ? above : 0;
  return {
    lowerBeforeShadow,
    lowerAfterShadow,
    upper,
    shadowBits: map.data[4 * cells + index]!,
    tableEdgeTileId,
  };
}

const shadowQuarter = createRaster(24, 24);
for (let offset = 3; offset < shadowQuarter.data.length; offset += 4)
  shadowQuarter.data[offset] = 128;

export function drawNativeShadow(target: Raster, shadowBits: number, dx: number, dy: number): void {
  for (let quarter = 0; quarter < 4; quarter++) {
    if ((shadowBits & (1 << quarter)) !== 0) {
      blitRaster(
        target,
        shadowQuarter,
        0,
        0,
        24,
        24,
        dx + (quarter % 2) * 24,
        dy + Math.floor(quarter / 2) * 24,
      );
    }
  }
}

export function drawNativeParallax(
  target: Raster,
  source: Raster,
  width: number,
  height: number,
): void {
  for (let y = 0; y < height; y += source.height) {
    for (let x = 0; x < width; x += source.width) {
      blitRaster(
        target,
        source,
        0,
        0,
        Math.min(source.width, width - x),
        Math.min(source.height, height - y),
        x,
        y,
      );
    }
  }
}
