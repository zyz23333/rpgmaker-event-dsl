import type { Raster } from "./raster.js";

const glyphs: Record<string, string[]> = {
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  N: ["10001", "11001", "11001", "10101", "10011", "10011", "10001"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
};

/** Output-pixel overlay: keeps original-cell mapping and content bounds unchanged. */
export function drawIncompleteNotice(raster: Raster): void {
  const lines = raster.width >= 63 ? ["INCOMPLETE"] : ["INCOM", "PLETE"];
  const scale = raster.width >= 126 && raster.height >= 20 ? 2 : 1;
  const width = Math.min(raster.width, 63 * scale);
  const height = Math.min(raster.height, (lines.length * 8 + 3) * scale);
  function paint(x: number, y: number, color: readonly number[]) {
    if (x >= 0 && y >= 0 && x < raster.width && y < raster.height)
      raster.data.set(color, (y * raster.width + x) * 4);
  }
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) paint(x, y, [160, 0, 0, 255]);
  for (const [lineIndex, line] of lines.entries()) {
    for (const [characterIndex, character] of [...line].entries()) {
      for (const [rowIndex, row] of glyphs[character]!.entries()) {
        for (const [column, value] of [...row].entries()) {
          if (value !== "1") continue;
          for (let y = 0; y < scale; y++)
            for (let x = 0; x < scale; x++)
              paint(
                (2 + characterIndex * 6 + column) * scale + x,
                (2 + lineIndex * 8 + rowIndex) * scale + y,
                [255, 255, 0, 255],
              );
        }
      }
    }
  }
}
