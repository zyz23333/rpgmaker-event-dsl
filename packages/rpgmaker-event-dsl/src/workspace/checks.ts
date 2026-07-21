import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import type { FileHashEntry } from "../project-data/materialization.js";
import {
  hashUtf8Content,
  readSyncManifest,
  type SyncManifest,
  type WorkspaceStatePaths,
} from "./state.js";
import { isMissingFileError } from "./guards.js";

export async function assertProjectDataSnapshotExists(
  statePaths: WorkspaceStatePaths,
  commandName: string,
): Promise<SyncManifest> {
  const manifest = await readSyncManifest(statePaths.syncManifestPath);
  if (manifest === null) {
    throw new Error(
      `Project Data Snapshot is required before ${commandName}. Run clone or pull first.`,
    );
  }

  const snapshotStats = await stat(statePaths.projectDataSnapshotDirectory).catch(
    (error: unknown) => {
      if (isMissingFileError(error)) {
        return null;
      }

      throw error;
    },
  );

  if (snapshotStats === null || !snapshotStats.isDirectory()) {
    throw new Error(
      `Project Data Snapshot is required before ${commandName}. Run clone or pull first.`,
    );
  }

  return manifest;
}

export async function readCurrentSnapshotFileHashes(
  statePaths: WorkspaceStatePaths,
  snapshotFiles: readonly FileHashEntry[],
): Promise<FileHashEntry[]> {
  const entries = await Promise.all(
    snapshotFiles.map(async ({ relativePath }) => ({
      hash: hashUtf8Content(
        await readFile(resolve(statePaths.projectDataSnapshotDirectory, relativePath), "utf8"),
      ),
      relativePath,
    })),
  );

  return entries.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}
