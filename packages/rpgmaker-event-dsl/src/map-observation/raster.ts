import { PNG } from "pngjs";

// Private implementation seam: no image-library objects cross the Workspace interface.
export type Raster = { width: number; height: number; data: Buffer };
export const maximumRasterPixels = 16_777_216;
export const maximumRasterDimension = 4096;
export class RasterResourceLimitError extends Error {}

export function assertRasterBudget(width: number, height: number): void {
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width <= 0 ||
    height <= 0 ||
    width > maximumRasterDimension ||
    height > maximumRasterDimension ||
    width * height > maximumRasterPixels
  ) {
    throw new RasterResourceLimitError(
      `Map Preview resource limit: ${width} x ${height} pixels exceeds the ${maximumRasterDimension}-pixel dimension or ${maximumRasterPixels}-pixel budget. Request a smaller view.`,
    );
  }
}

export function createRaster(width: number, height: number): Raster {
  assertRasterBudget(width, height);
  return { width, height, data: Buffer.alloc(width * height * 4) };
}

export function decodePng(bytes: Buffer): Raster {
  if (
    bytes.length < 33 ||
    !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
    bytes.toString("ascii", 12, 16) !== "IHDR"
  )
    throw new Error("Expected a PNG image with an IHDR header.");
  // Inspect dimensions before the decoder allocates an untrusted image.
  assertRasterBudget(bytes.readUInt32BE(16), bytes.readUInt32BE(20));
  const decoded = PNG.sync.read(bytes, { checkCRC: true });
  return { width: decoded.width, height: decoded.height, data: decoded.data };
}

export function encodePng(raster: Raster): Buffer {
  const image = new PNG({ width: raster.width, height: raster.height });
  image.data = raster.data;
  return PNG.sync.write(image);
}

export function blitRaster(
  target: Raster,
  source: Raster,
  sx: number,
  sy: number,
  width: number,
  height: number,
  dx: number,
  dy: number,
): void {
  if (sx < 0 || sy < 0 || sx + width > source.width || sy + height > source.height) {
    throw new Error(
      `Required image is too small for source rectangle ${sx},${sy},${width},${height}.`,
    );
  }
  for (let y = 0; y < height; y++) {
    if (dy + y < 0 || dy + y >= target.height) continue;
    for (let x = 0; x < width; x++) {
      if (dx + x < 0 || dx + x >= target.width) continue;
      const sourceOffset = ((sy + y) * source.width + sx + x) * 4;
      const targetOffset = ((dy + y) * target.width + dx + x) * 4;
      const alpha = source.data[sourceOffset + 3]! / 255;
      if (alpha === 0) continue;
      const targetAlpha = target.data[targetOffset + 3]! / 255;
      const outputAlpha = alpha + targetAlpha * (1 - alpha);
      for (let channel = 0; channel < 3; channel++) {
        target.data[targetOffset + channel] = Math.round(
          (source.data[sourceOffset + channel]! * alpha +
            target.data[targetOffset + channel]! * targetAlpha * (1 - alpha)) /
            outputAlpha,
        );
      }
      target.data[targetOffset + 3] = Math.round(outputAlpha * 255);
    }
  }
}
