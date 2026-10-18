import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

import {
  readMapDirectory,
  readMapSettings,
  readSelectedMap,
  readSelectedTileset,
} from "../map-observation/read.js";
import type {
  MapDataInput,
  MapListResult,
  MapObservationSource,
  MapSummaryResult,
} from "../map-observation/types.js";
import { assertProjectDataSnapshotExists } from "./checks.js";
import { loadWorkspace } from "./config.js";
import { assertNoPendingInterruptedPushForNonPush } from "./push.js";
import { getWorkspaceStatePaths } from "./state.js";
import type { WorkspaceCommandOptions } from "./types.js";

export type MapObservationOptions = WorkspaceCommandOptions & {
  source?: MapObservationSource;
};

export type InspectWorkspaceMapOptions = MapObservationOptions & {
  mapId: number;
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
    throw new Error(
      "Generated map observation requires compiled Generated Project Data. Run compile first.",
    );
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
      `Cannot read ${source} map input ${relativePath}. Run clone or pull to restore snapshot data.`,
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

export async function listWorkspaceMaps(options: MapObservationOptions): Promise<MapListResult> {
  const context = await loadMapObservationContext(options, "map list");
  const directory = await readMapObservationInput(
    context.statePaths.projectDataSnapshotDirectory,
    "snapshot",
    "MapInfos.json",
  );
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
  const directory = await readMapObservationInput(
    context.statePaths.projectDataSnapshotDirectory,
    "snapshot",
    "MapInfos.json",
  );
  const identity = readMapDirectory(directory.value).find(({ id }) => id === options.mapId);
  if (identity === undefined) {
    throw new Error(
      `Map ${options.mapId} does not exist in MapInfos.json. Use map list to discover map IDs.`,
    );
  }
  const mapFileName = `Map${options.mapId.toString().padStart(3, "0")}.json`;
  const mapInput = await readMapObservationInput(
    context.statePaths.projectDataSnapshotDirectory,
    "snapshot",
    mapFileName,
  );
  const map = readSelectedMap(mapInput.value, options.mapId);
  const tilesetInput = await readMapObservationInput(
    context.statePaths.projectDataSnapshotDirectory,
    "snapshot",
    "Tilesets.json",
  );
  const tileset = readSelectedTileset(tilesetInput.value, map.tilesetId);
  return {
    ...context,
    identity,
    map,
    tileset,
    dataInputs: [directory.input, mapInput.input, tilesetInput.input],
  };
}

export async function inspectWorkspaceMap(
  options: InspectWorkspaceMapOptions,
): Promise<MapSummaryResult> {
  const context = await loadSelectedWorkspaceMap(options, "map inspect");
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
