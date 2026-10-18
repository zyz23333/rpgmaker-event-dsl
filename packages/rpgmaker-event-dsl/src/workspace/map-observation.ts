import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

import { inspectMapCell } from "../map-observation/cells.js";
import { validateMapBounds } from "../map-observation/geometry.js";
import { readMapInspectionSelector } from "../map-observation/selection.js";
import {
  readMapDirectory,
  readMapSettings,
  readSelectedMap,
  readSelectedTileset,
} from "../map-observation/read.js";
import type {
  MapDataInput,
  MapAreaResult,
  MapBounds,
  MapCellResult,
  MapInspectionResult,
  MapInspectionSelector,
  MapListResult,
  MapObservationSource,
  MapSummaryResult,
} from "../map-observation/types.js";
import { assertProjectDataSnapshotExists } from "./checks.js";
import { loadWorkspace } from "./config.js";
import {
  assertGeneratedProjectDataFresh,
  assertGeneratedProjectDataIntegrity,
  assertNoPendingInterruptedPushForNonPush,
} from "./push.js";
import { isMissingFileError } from "./guards.js";
import { getWorkspaceStatePaths } from "./state.js";
import type { WorkspaceCommandOptions } from "./types.js";

export type MapObservationOptions = WorkspaceCommandOptions & {
  source?: MapObservationSource;
};

export type InspectWorkspaceMapOptions = MapObservationOptions & {
  mapId: number;
  selector?: MapInspectionSelector;
};

export async function loadMapObservationContext(
  options: MapObservationOptions,
  commandName: string,
) {
  const source = options.source ?? "snapshot";
  if (source !== "snapshot" && source !== "generated") {
    throw new Error(`Unknown map source ${String(source)}. Use snapshot or generated.`);
  }
  const workspace = await loadWorkspace(resolve(options.workspaceRoot));
  const statePaths = getWorkspaceStatePaths(workspace.workspaceRoot);
  await assertNoPendingInterruptedPushForNonPush({ statePaths, commandName });
  const manifest = await assertProjectDataSnapshotExists(statePaths, commandName);
  if (source === "generated") {
    try {
      await assertGeneratedProjectDataIntegrity(statePaths, manifest, commandName);
    } catch (error) {
      if (!isMissingFileError(error)) throw error;
      throw new Error(
        `Generated Project Data is missing before ${commandName}. Run compile first.`,
        { cause: error },
      );
    }
    try {
      await assertGeneratedProjectDataFresh({ commandName, manifest, statePaths, workspace });
    } catch (error) {
      if (!isMissingFileError(error)) throw error;
      throw new Error(
        `Project Data Snapshot input is missing before ${commandName}. Run clone or pull, then compile first.`,
        { cause: error },
      );
    }
  }
  return { source, workspace, statePaths, manifest };
}

export async function readMapObservationInput(
  directory: string,
  source: MapObservationSource,
  relativePath: string,
): Promise<{ value: unknown; input: MapDataInput }> {
  const path = resolve(directory, relativePath);
  let bytes: Buffer;
  try {
    bytes = await readFile(path);
  } catch (error) {
    throw new Error(
      `Cannot read ${source} map input ${relativePath}. ${source === "generated" ? "Run compile first to restore Generated Project Data." : "Run clone or pull to restore snapshot data."}`,
      { cause: error },
    );
  }
  let value: unknown;
  try {
    value = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`Malformed ${source} map input ${relativePath}: expected valid JSON.`, {
      cause: error,
    });
  }
  return {
    value,
    input: { source, relativePath, path, hash: createHash("sha256").update(bytes).digest("hex") },
  };
}

export type MapObservationContext = Awaited<ReturnType<typeof loadMapObservationContext>>;

export async function readWorkspaceMapDataInput(
  context: MapObservationContext,
  relativePath: string,
) {
  const generatedDomain = /^(?:Map\d+|System|CommonEvents)\.json$/u.test(relativePath);
  const source = context.source === "generated" && generatedDomain ? "generated" : "snapshot";
  const directory =
    source === "generated"
      ? context.statePaths.generatedProjectDataDirectory
      : context.statePaths.projectDataSnapshotDirectory;
  const result = await readMapObservationInput(directory, source, relativePath);
  if (context.source === "generated") {
    const expected =
      source === "generated"
        ? context.manifest.generatedFiles
        : context.manifest.compileBaseline?.snapshotFiles;
    const expectedHash = expected?.find((entry) => entry.relativePath === relativePath)?.hash;
    if (expectedHash === undefined || result.input.hash !== expectedHash) {
      throw new Error(
        `${source === "generated" ? "Generated Project Data integrity check failed" : "Generated Project Data is stale"} for ${relativePath}. Run compile first.`,
      );
    }
  }
  return result;
}

export async function listWorkspaceMaps(options: MapObservationOptions): Promise<MapListResult> {
  const context = await loadMapObservationContext(options, "map list");
  const directory = await readWorkspaceMapDataInput(context, "MapInfos.json");
  return {
    schemaVersion: 1,
    kind: "map-list",
    source: context.source,
    maps: readMapDirectory(directory.value),
    dataInputs: [directory.input],
    warnings: [],
  };
}

export async function loadSelectedWorkspaceMap(
  options: InspectWorkspaceMapOptions,
  commandName: string,
) {
  if (!Number.isSafeInteger(options.mapId) || options.mapId <= 0) {
    throw new Error(
      "Select a map with a positive integer map ID (--map). Use map list to discover map IDs.",
    );
  }
  const context = await loadMapObservationContext(options, commandName);
  const directory = await readWorkspaceMapDataInput(context, "MapInfos.json");
  const identity = readMapDirectory(directory.value).find(({ id }) => id === options.mapId);
  if (identity === undefined) {
    throw new Error(
      `Map ${options.mapId} does not exist in MapInfos.json. Use map list to discover map IDs.`,
    );
  }
  const mapFileName = `Map${options.mapId.toString().padStart(3, "0")}.json`;
  const mapInput = await readWorkspaceMapDataInput(context, mapFileName);
  const map = readSelectedMap(mapInput.value, options.mapId);
  const tilesetInput = await readWorkspaceMapDataInput(context, "Tilesets.json");
  const tileset = readSelectedTileset(tilesetInput.value, map.tilesetId);
  return {
    ...context,
    identity,
    map,
    tileset,
    dataInputs: [directory.input, mapInput.input, tilesetInput.input],
  };
}

export function inspectWorkspaceMap(
  options: InspectWorkspaceMapOptions & { selector?: { kind: "summary" } },
): Promise<MapSummaryResult>;
export function inspectWorkspaceMap(
  options: InspectWorkspaceMapOptions & { selector: { kind: "cell"; x: number; y: number } },
): Promise<MapCellResult>;
export function inspectWorkspaceMap(
  options: InspectWorkspaceMapOptions & { selector: { kind: "area" } & MapBounds },
): Promise<MapAreaResult>;
export function inspectWorkspaceMap(
  options: InspectWorkspaceMapOptions,
): Promise<MapInspectionResult>;
export async function inspectWorkspaceMap(
  options: InspectWorkspaceMapOptions,
): Promise<MapInspectionResult> {
  options = { ...options, selector: readMapInspectionSelector(options.selector) };
  const context = await loadSelectedWorkspaceMap(options, "map inspect");
  if (options.selector?.kind === "area") {
    const { x, y, width, height } = options.selector;
    validateMapBounds({ x, y, width, height }, context.map.width, context.map.height, "area");
    const cells = [];
    for (let cellY = y; cellY < y + height; cellY += 1) {
      for (let cellX = x; cellX < x + width; cellX += 1) {
        cells.push(inspectMapCell(context.map, context.tileset, cellX, cellY));
      }
    }
    return {
      schemaVersion: 1,
      kind: "map-area",
      source: context.source,
      map: context.identity,
      width: context.map.width,
      height: context.map.height,
      bounds: { x, y, width, height },
      cells,
      events: context.map.events.flatMap((event) =>
        event !== null &&
        event.x >= x &&
        event.x < x + width &&
        event.y >= y &&
        event.y < y + height
          ? [{ id: event.id, name: event.name, x: event.x, y: event.y }]
          : [],
      ),
      dataInputs: context.dataInputs,
      warnings: [],
    };
  }
  if (options.selector?.kind === "cell") {
    validateMapBounds(
      { x: options.selector.x, y: options.selector.y, width: 1, height: 1 },
      context.map.width,
      context.map.height,
      "cell",
    );
    return {
      schemaVersion: 1,
      kind: "map-cell",
      source: context.source,
      map: context.identity,
      width: context.map.width,
      height: context.map.height,
      cell: inspectMapCell(context.map, context.tileset, options.selector.x, options.selector.y),
      dataInputs: context.dataInputs,
      warnings: [],
    };
  }
  return {
    schemaVersion: 1,
    kind: "map-summary",
    source: context.source,
    map: context.identity,
    width: context.map.width,
    height: context.map.height,
    tileset: { id: context.tileset.id, name: context.tileset.name, mode: context.tileset.mode },
    settings: readMapSettings(context.map),
    events: context.map.events.flatMap((event) =>
      event === null ? [] : [{ id: event.id, name: event.name, x: event.x, y: event.y }],
    ),
    dataInputs: context.dataInputs,
    warnings: [],
  };
}
