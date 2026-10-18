// Adapted from RPG Maker MV CoreScript Tilemap.js (MIT).
// Copyright (c) 2015 KADOKAWA CORPORATION./YOJI OJIMA.
// Full license: distributed THIRD_PARTY_NOTICES.md.
import { blitRaster } from "./raster.js";
import type { Raster } from "./raster.js";

type Quarter = readonly [number, number];
type AutotileLayout = { slot: number; bx: number; by: number; quarters: readonly Quarter[] };

/** MV stores the selected shape in the tile ID; neighbors do not determine it here. */
export function getAutotileLayout(tileId: number): AutotileLayout {
  if (!Number.isSafeInteger(tileId) || tileId < 2048 || tileId >= 8192) {
    throw new Error(
      `Malformed autotile ID ${tileId}: expected an MV tile ID from 2048 through 8191.`,
    );
  }
  const kind = Math.floor((tileId - 2048) / 48);
  const shape = (tileId - 2048) % 48;
  const tx = kind % 8;
  const ty = Math.floor(kind / 8);
  let slot = 0;
  let bx = 0;
  let by = 0;
  let table: readonly (readonly Quarter[])[] = floorAutotileTable;
  if (tileId < 2816) {
    // All animated A1 tiles use the native frame-zero water/waterfall offsets.
    if (kind === 1) by = 3;
    else if (kind === 2) bx = 6;
    else if (kind === 3) {
      bx = 6;
      by = 3;
    } else if (kind >= 4) {
      bx = Math.floor(tx / 4) * 8;
      by = ty * 6 + (Math.floor(tx / 2) % 2) * 3;
      if (kind % 2 !== 0) {
        bx += 6;
        table = waterfallAutotileTable;
      }
    }
  } else if (tileId < 4352) {
    slot = 1;
    bx = tx * 2;
    by = (ty - 2) * 3;
  } else if (tileId < 5888) {
    slot = 2;
    bx = tx * 2;
    by = (ty - 6) * 2;
    table = wallAutotileTable;
  } else {
    slot = 3;
    bx = tx * 2;
    by = Math.floor((ty - 10) * 2.5 + (ty % 2 === 1 ? 0.5 : 0));
    if (ty % 2 === 1) table = wallAutotileTable;
  }
  const quarters = table[shape];
  if (quarters === undefined) {
    throw new Error(
      `Malformed autotile ID ${tileId}: shape ${shape} has no native MV ${slot === 2 || slot === 3 ? "wall" : "waterfall"} composition.`,
    );
  }
  return { slot, bx, by, quarters };
}

export function getAutotileSlot(tileId: number): number {
  return getAutotileLayout(tileId).slot;
}

export function drawAutotile(
  target: Raster,
  source: Raster,
  tileId: number,
  flags: number,
  dx: number,
  dy: number,
): void {
  const layout = getAutotileLayout(tileId);
  for (const [index, [qx, qy]] of layout.quarters.entries()) {
    const sx = (layout.bx * 2 + qx) * 24;
    const sy = (layout.by * 2 + qy) * 24;
    const x = dx + (index % 2) * 24;
    const y = dy + Math.floor(index / 2) * 24;
    if (layout.slot === 1 && (flags & 0x80) !== 0 && (qy === 1 || qy === 5)) {
      const underlayX = qy === 1 ? [0, 3, 2, 1][qx]! : qx;
      blitRaster(
        target,
        source,
        (layout.bx * 2 + underlayX) * 24,
        (layout.by * 2 + 3) * 24,
        24,
        24,
        x,
        y,
      );
      blitRaster(target, source, sx, sy, 24, 12, x, y + 12);
    } else {
      blitRaster(target, source, sx, sy, 24, 24, x, y);
    }
  }
}

/** Lower table lip, drawn by the layer compositor into the next map row. */
export function drawTableEdge(
  target: Raster,
  source: Raster,
  tileId: number,
  dx: number,
  dy: number,
): void {
  if (tileId < 2816 || tileId >= 4352) return;
  const layout = getAutotileLayout(tileId);
  for (let half = 0; half < 2; half++) {
    const [qx, qy] = layout.quarters[half + 2]!;
    blitRaster(
      target,
      source,
      (layout.bx * 2 + qx) * 24,
      (layout.by * 2 + qy) * 24 + 12,
      24,
      12,
      dx + half * 24,
      dy,
    );
  }
}

const floorAutotileTable = [
  [
    [2, 4],
    [1, 4],
    [2, 3],
    [1, 3],
  ],
  [
    [2, 0],
    [1, 4],
    [2, 3],
    [1, 3],
  ],
  [
    [2, 4],
    [3, 0],
    [2, 3],
    [1, 3],
  ],
  [
    [2, 0],
    [3, 0],
    [2, 3],
    [1, 3],
  ],
  [
    [2, 4],
    [1, 4],
    [2, 3],
    [3, 1],
  ],
  [
    [2, 0],
    [1, 4],
    [2, 3],
    [3, 1],
  ],
  [
    [2, 4],
    [3, 0],
    [2, 3],
    [3, 1],
  ],
  [
    [2, 0],
    [3, 0],
    [2, 3],
    [3, 1],
  ],
  [
    [2, 4],
    [1, 4],
    [2, 1],
    [1, 3],
  ],
  [
    [2, 0],
    [1, 4],
    [2, 1],
    [1, 3],
  ],
  [
    [2, 4],
    [3, 0],
    [2, 1],
    [1, 3],
  ],
  [
    [2, 0],
    [3, 0],
    [2, 1],
    [1, 3],
  ],
  [
    [2, 4],
    [1, 4],
    [2, 1],
    [3, 1],
  ],
  [
    [2, 0],
    [1, 4],
    [2, 1],
    [3, 1],
  ],
  [
    [2, 4],
    [3, 0],
    [2, 1],
    [3, 1],
  ],
  [
    [2, 0],
    [3, 0],
    [2, 1],
    [3, 1],
  ],
  [
    [0, 4],
    [1, 4],
    [0, 3],
    [1, 3],
  ],
  [
    [0, 4],
    [3, 0],
    [0, 3],
    [1, 3],
  ],
  [
    [0, 4],
    [1, 4],
    [0, 3],
    [3, 1],
  ],
  [
    [0, 4],
    [3, 0],
    [0, 3],
    [3, 1],
  ],
  [
    [2, 2],
    [1, 2],
    [2, 3],
    [1, 3],
  ],
  [
    [2, 2],
    [1, 2],
    [2, 3],
    [3, 1],
  ],
  [
    [2, 2],
    [1, 2],
    [2, 1],
    [1, 3],
  ],
  [
    [2, 2],
    [1, 2],
    [2, 1],
    [3, 1],
  ],
  [
    [2, 4],
    [3, 4],
    [2, 3],
    [3, 3],
  ],
  [
    [2, 4],
    [3, 4],
    [2, 1],
    [3, 3],
  ],
  [
    [2, 0],
    [3, 4],
    [2, 3],
    [3, 3],
  ],
  [
    [2, 0],
    [3, 4],
    [2, 1],
    [3, 3],
  ],
  [
    [2, 4],
    [1, 4],
    [2, 5],
    [1, 5],
  ],
  [
    [2, 0],
    [1, 4],
    [2, 5],
    [1, 5],
  ],
  [
    [2, 4],
    [3, 0],
    [2, 5],
    [1, 5],
  ],
  [
    [2, 0],
    [3, 0],
    [2, 5],
    [1, 5],
  ],
  [
    [0, 4],
    [3, 4],
    [0, 3],
    [3, 3],
  ],
  [
    [2, 2],
    [1, 2],
    [2, 5],
    [1, 5],
  ],
  [
    [0, 2],
    [1, 2],
    [0, 3],
    [1, 3],
  ],
  [
    [0, 2],
    [1, 2],
    [0, 3],
    [3, 1],
  ],
  [
    [2, 2],
    [3, 2],
    [2, 3],
    [3, 3],
  ],
  [
    [2, 2],
    [3, 2],
    [2, 1],
    [3, 3],
  ],
  [
    [2, 4],
    [3, 4],
    [2, 5],
    [3, 5],
  ],
  [
    [2, 0],
    [3, 4],
    [2, 5],
    [3, 5],
  ],
  [
    [0, 4],
    [1, 4],
    [0, 5],
    [1, 5],
  ],
  [
    [0, 4],
    [3, 0],
    [0, 5],
    [1, 5],
  ],
  [
    [0, 2],
    [3, 2],
    [0, 3],
    [3, 3],
  ],
  [
    [0, 2],
    [1, 2],
    [0, 5],
    [1, 5],
  ],
  [
    [0, 4],
    [3, 4],
    [0, 5],
    [3, 5],
  ],
  [
    [2, 2],
    [3, 2],
    [2, 5],
    [3, 5],
  ],
  [
    [0, 2],
    [3, 2],
    [0, 5],
    [3, 5],
  ],
  [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ],
] as const;

const wallAutotileTable = [
  [
    [2, 2],
    [1, 2],
    [2, 1],
    [1, 1],
  ],
  [
    [0, 2],
    [1, 2],
    [0, 1],
    [1, 1],
  ],
  [
    [2, 0],
    [1, 0],
    [2, 1],
    [1, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ],
  [
    [2, 2],
    [3, 2],
    [2, 1],
    [3, 1],
  ],
  [
    [0, 2],
    [3, 2],
    [0, 1],
    [3, 1],
  ],
  [
    [2, 0],
    [3, 0],
    [2, 1],
    [3, 1],
  ],
  [
    [0, 0],
    [3, 0],
    [0, 1],
    [3, 1],
  ],
  [
    [2, 2],
    [1, 2],
    [2, 3],
    [1, 3],
  ],
  [
    [0, 2],
    [1, 2],
    [0, 3],
    [1, 3],
  ],
  [
    [2, 0],
    [1, 0],
    [2, 3],
    [1, 3],
  ],
  [
    [0, 0],
    [1, 0],
    [0, 3],
    [1, 3],
  ],
  [
    [2, 2],
    [3, 2],
    [2, 3],
    [3, 3],
  ],
  [
    [0, 2],
    [3, 2],
    [0, 3],
    [3, 3],
  ],
  [
    [2, 0],
    [3, 0],
    [2, 3],
    [3, 3],
  ],
  [
    [0, 0],
    [3, 0],
    [0, 3],
    [3, 3],
  ],
] as const;

const waterfallAutotileTable = [
  [
    [2, 0],
    [1, 0],
    [2, 1],
    [1, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ],
  [
    [2, 0],
    [3, 0],
    [2, 1],
    [3, 1],
  ],
  [
    [0, 0],
    [3, 0],
    [0, 1],
    [3, 1],
  ],
] as const;
