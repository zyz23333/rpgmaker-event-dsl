import { createHash, randomUUID } from "node:crypto";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";

import { renderMapPreview } from "../map-observation/render.js";
import type { MapPreviewBounds, MapPreviewResult } from "../map-observation/preview-types.js";
import { loadSelectedWorkspaceMap } from "./map-observation.js";
import type { MapObservationOptions } from "./map-observation.js";

export type RenderWorkspaceMapOptions = MapObservationOptions & {
  mapId: number;
  crop?: MapPreviewBounds;
  grid?: boolean;
  allowMissingAssets?: boolean;
};

export async function renderWorkspaceMap(
  options: RenderWorkspaceMapOptions,
): Promise<MapPreviewResult> {
  const context = await loadSelectedWorkspaceMap(options, "map render");
  const rendered = await renderMapPreview({
    map: context.map,
    tileset: context.tileset,
    projectRoot: context.workspace.projectRoot,
    ...(options.crop === undefined ? {} : { crop: options.crop }),
    ...(options.grid === undefined ? {} : { grid: options.grid }),
    allowMissingAssets: options.allowMissingAssets === true,
  });
  const bounds = rendered.bounds;
  const identity = createHash("sha256")
    .update(
      JSON.stringify({
        source: context.source,
        bounds,
        pages: rendered.previewPages,
        data: context.dataInputs,
        images: rendered.imageInputs,
        grid: options.grid ?? true,
      }),
    )
    .digest("hex")
    .slice(0, 16);
  const artifactRoot = resolve(context.statePaths.workspaceStateDirectory, "map-previews");
  const suffix = randomUUID();
  const directory = resolve(
    artifactRoot,
    `map-${context.identity.id}-${context.source}-${bounds.x}-${bounds.y}-${bounds.width}-${bounds.height}-${identity}-${suffix}`,
  );
  const stagingDirectory = resolve(artifactRoot, `.tmp-${suffix}`);
  const result: MapPreviewResult = {
    schemaVersion: 1,
    kind: "map-preview",
    source: context.source,
    map: context.identity,
    dataInputs: context.dataInputs,
    warnings: rendered.warnings,
    originalMap: {
      width: context.map.width,
      height: context.map.height,
      tileWidth: 48,
      tileHeight: 48,
    },
    looping: {
      horizontal: context.map.scrollType === 2 || context.map.scrollType === 3,
      vertical: context.map.scrollType === 1 || context.map.scrollType === 3,
    },
    bounds,
    output: { width: rendered.width, height: rendered.height },
    mapContent: rendered.mapContent,
    transform: rendered.transform,
    overlays: rendered.overlays,
    compatibility: { target: "rpg-maker-mv-native-static", animationFrame: 0 },
    previewPages: rendered.previewPages,
    parallax: rendered.parallax,
    imageInputs: rendered.imageInputs,
    artifacts: {
      png: resolve(directory, "preview.png"),
      metadata: resolve(directory, "metadata.json"),
    },
    complete: rendered.warnings.length === 0,
  };
  await mkdir(stagingDirectory, { recursive: true });
  try {
    await writeFile(resolve(stagingDirectory, "preview.png"), rendered.png);
    await writeFile(
      resolve(stagingDirectory, "metadata.json"),
      `${JSON.stringify(result, null, 2)}\n`,
      "utf8",
    );
    // Publish the pair in one filesystem rename after both files are complete.
    await rename(stagingDirectory, directory);
  } catch (error) {
    const stagingRelative = relative(artifactRoot, stagingDirectory);
    if (
      !stagingRelative.startsWith("..") &&
      !isAbsolute(stagingRelative) &&
      stagingRelative.startsWith(".tmp-")
    ) {
      await rm(stagingDirectory, { recursive: true, force: true });
    }
    throw error;
  }
  return result;
}
