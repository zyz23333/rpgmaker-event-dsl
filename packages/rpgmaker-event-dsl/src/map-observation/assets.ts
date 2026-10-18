import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";

import type { MapImageInput, MapImageUnavailableReason, MapImageWarning } from "./preview-types.js";
import { createRaster, decodePng, RasterResourceLimitError } from "./raster.js";
import type { Raster } from "./raster.js";

type ImageCategory = "tilesets" | "characters" | "parallaxes";

function checkerPlaceholder(category: ImageCategory, name: string): Raster {
  const largeCharacter = /^[!$]*\$/u.test(name);
  const width =
    category === "tilesets" ? 768 : category === "parallaxes" ? 96 : largeCharacter ? 144 : 576;
  const height =
    category === "tilesets" ? 768 : category === "parallaxes" ? 96 : largeCharacter ? 192 : 384;
  const raster = createRaster(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const bright = (Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0;
      raster.data.set(bright ? [255, 0, 255, 255] : [32, 0, 32, 255], (y * width + x) * 4);
    }
  }
  return raster;
}

export function createMapImageLoader(options: {
  projectRoot: string;
  allowMissingAssets?: boolean;
}) {
  const cache = new Map<string, Raster>();
  const imageInputs: MapImageInput[] = [];
  const warnings: MapImageWarning[] = [];

  async function load(category: ImageCategory, name: string): Promise<Raster> {
    const relativePath = `img/${category}/${name}.png`;
    const path = resolve(options.projectRoot, relativePath);
    const withinProject = relative(options.projectRoot, path);
    if (
      name === "" ||
      /[\\/:]/u.test(name) ||
      name.includes("\0") ||
      withinProject.startsWith("..") ||
      isAbsolute(withinProject)
    ) {
      throw new Error(
        `Invalid ${category} image filename ${JSON.stringify(name)}: use a project asset filename.`,
      );
    }
    const cached = cache.get(path);
    if (cached !== undefined) return cached;

    function unavailable(
      reason: MapImageUnavailableReason,
      message: string,
      cause: unknown,
    ): Raster {
      if (options.allowMissingAssets !== true) throw new Error(message, { cause });
      const placeholder = checkerPlaceholder(category, name);
      imageInputs.push({ status: "unavailable", reason, relativePath, path });
      warnings.push({ code: "map-image-unavailable", reason, relativePath, path, message });
      cache.set(path, placeholder);
      return placeholder;
    }

    let bytes: Buffer;
    try {
      bytes = await readFile(path);
    } catch (error) {
      const reason =
        error instanceof Error && "code" in error && error.code === "ENOENT"
          ? "missing"
          : "unreadable";
      return unavailable(
        reason,
        `Cannot read required Map Image Asset ${relativePath} from Project Root ${options.projectRoot}. Restore the PNG image before rendering.`,
        error,
      );
    }
    let image: Raster;
    try {
      image = decodePng(bytes);
    } catch (error) {
      if (error instanceof RasterResourceLimitError) {
        throw new RasterResourceLimitError(
          `Cannot decode required Map Image Asset ${relativePath}: ${error.message}`,
          { cause: error },
        );
      }
      if (error instanceof RangeError) {
        throw new Error(
          `Cannot decode required Map Image Asset ${relativePath}: ${error.message}`,
          { cause: error },
        );
      }
      return unavailable(
        "undecodable",
        `Cannot decode required Map Image Asset ${relativePath}: ${error instanceof Error ? error.message : String(error)} Restore a valid PNG image before rendering.`,
        error,
      );
    }
    imageInputs.push({
      status: "available",
      relativePath,
      path,
      hash: createHash("sha256").update(bytes).digest("hex"),
    });
    cache.set(path, image);
    return image;
  }

  return { load, imageInputs, warnings };
}
