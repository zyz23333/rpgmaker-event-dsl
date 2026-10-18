import { fillRasterRect } from "./raster.js";
import type { Raster } from "./raster.js";
import type { planMapViewport } from "./viewport.js";

const glyphs: Record<string, string[]> = {
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["110", "001", "010", "100", "111"],
  "3": ["110", "001", "010", "001", "110"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "110", "001", "110"],
  "6": ["011", "100", "111", "101", "111"],
  "7": ["111", "001", "010", "010", "010"],
  "8": ["111", "101", "111", "101", "111"],
  "9": ["111", "101", "111", "001", "110"],
  X: ["101", "101", "010", "101", "101"],
  Y: ["101", "101", "010", "010", "010"],
  "-": ["000", "000", "111", "000", "000"],
};

/** Text is painted in output pixels, independently of the native scene viewport. */
export function drawRasterText(
  target: Raster,
  text: string,
  x: number,
  y: number,
  color: readonly [number, number, number, number],
): void {
  const output = { width: target.width, height: target.height, data: target.data };
  for (let index = 0; index < text.length; index++) {
    const glyph = glyphs[text[index]!] ?? [];
    for (let row = 0; row < glyph.length; row++) {
      for (let column = 0; column < 3; column++) {
        if (glyph[row]![column] === "1")
          fillRasterRect(output, x + index * 4 + column, y + row, 1, 1, color);
      }
    }
  }
}

export function drawCoordinateOverlay(
  target: Raster,
  viewport: ReturnType<typeof planMapViewport>,
): void {
  if (!viewport.overlays.grid) return;
  const output = { width: target.width, height: target.height, data: target.data };
  const { bounds, mapContent, transform, overlays } = viewport;
  const background = [20, 24, 32, 255] as const;
  const foreground = [240, 244, 248, 255] as const;
  const line = [48, 64, 80, 255] as const;
  fillRasterRect(output, 0, 0, output.width, mapContent.y, background);
  fillRasterRect(output, 0, 0, mapContent.x, output.height, background);
  drawRasterText(output, "X", 6, 6, foreground);
  drawRasterText(output, "Y", 6, mapContent.y + 6, foreground);
  for (let x = bounds.x; x < bounds.x + bounds.width; x += overlays.coordinateStep.x) {
    const px = Math.round(x * transform.scaleX + transform.offsetX);
    fillRasterRect(output, px, mapContent.y, 1, mapContent.height, line);
    const text = String(x);
    drawRasterText(
      output,
      text,
      Math.round(px + transform.scaleX / 2 - (text.length * 4 - 1) / 2),
      6,
      foreground,
    );
  }
  for (let y = bounds.y; y < bounds.y + bounds.height; y += overlays.coordinateStep.y) {
    const py = Math.round(y * transform.scaleY + transform.offsetY);
    fillRasterRect(output, mapContent.x, py, mapContent.width, 1, line);
    const text = String(y);
    drawRasterText(
      output,
      text,
      mapContent.x - 8 - (text.length * 4 - 1),
      Math.round(py + transform.scaleY / 2 - 2),
      foreground,
    );
  }
}
