import { PNG } from "pngjs";

// Private implementation seam: no image-library objects cross the Workspace interface.
export type Raster = {
  width: number;
  height: number;
  data: Buffer;
  /** Native scene pixels are mapped into this bounded output rectangle. */
  viewport?: {
    scaleX: number;
    scaleY: number;
    offsetX: number;
    offsetY: number;
    clip: { x: number; y: number; width: number; height: number };
  };
};
export const maximumRasterPixels = 16_777_216;
export const maximumRasterDimension = 4096;

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
    throw new Error(
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

function compositePixel(target: Raster, offset: number, color: ArrayLike<number>, sourceOffset = 0): void {
  const alpha = color[sourceOffset + 3]! / 255;
  if (alpha === 0) return;
  const targetAlpha = target.data[offset + 3]! / 255;
  const outputAlpha = alpha + targetAlpha * (1 - alpha);
  for (let channel = 0; channel < 3; channel++) {
    target.data[offset + channel] = Math.round(
      (color[sourceOffset + channel]! * alpha + target.data[offset + channel]! * targetAlpha * (1 - alpha)) /
        outputAlpha,
    );
  }
  target.data[offset + 3] = Math.round(outputAlpha * 255);
}

export function fillRasterRect(
  target: Raster,
  dx: number,
  dy: number,
  width: number,
  height: number,
  color: readonly [number, number, number, number],
): void {
  const view = target.viewport ?? {
    scaleX: 1,
    scaleY: 1,
    offsetX: 0,
    offsetY: 0,
    clip: { x: 0, y: 0, width: target.width, height: target.height },
  };
  const left = Math.max(view.clip.x, 0, Math.ceil(dx * view.scaleX + view.offsetX - 0.5));
  const top = Math.max(view.clip.y, 0, Math.ceil(dy * view.scaleY + view.offsetY - 0.5));
  const right = Math.min(
    view.clip.x + view.clip.width,
    target.width,
    Math.ceil((dx + width) * view.scaleX + view.offsetX - 0.5),
  );
  const bottom = Math.min(
    view.clip.y + view.clip.height,
    target.height,
    Math.ceil((dy + height) * view.scaleY + view.offsetY - 0.5),
  );
  for (let y = top; y < bottom; y++) {
    for (let x = left; x < right; x++) compositePixel(target, (y * target.width + x) * 4, color);
  }
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
  const view = target.viewport ?? {
    scaleX: 1,
    scaleY: 1,
    offsetX: 0,
    offsetY: 0,
    clip: { x: 0, y: 0, width: target.width, height: target.height },
  };
  const left = Math.max(view.clip.x, 0, Math.ceil(dx * view.scaleX + view.offsetX - 0.5));
  const top = Math.max(view.clip.y, 0, Math.ceil(dy * view.scaleY + view.offsetY - 0.5));
  const right = Math.min(
    view.clip.x + view.clip.width,
    target.width,
    Math.ceil((dx + width) * view.scaleX + view.offsetX - 0.5),
  );
  const bottom = Math.min(
    view.clip.y + view.clip.height,
    target.height,
    Math.ceil((dy + height) * view.scaleY + view.offsetY - 0.5),
  );
  for (let y = top; y < bottom; y++) {
    const sourceY = sy + Math.floor((y + 0.5 - view.offsetY) / view.scaleY - dy);
    for (let x = left; x < right; x++) {
      const sourceX = sx + Math.floor((x + 0.5 - view.offsetX) / view.scaleX - dx);
      const sourceOffset = (sourceY * source.width + sourceX) * 4;
      const targetOffset = (y * target.width + x) * 4;
      compositePixel(target, targetOffset, source.data, sourceOffset);
    }
  }
}
