import { stat } from "node:fs/promises";

import type { FileHashEntry } from "../project-data/materialization.js";
import {
  collectStandardProjectDataSnapshotPlan,
  readSyncManifest,
  type SyncManifest,
  type WorkspaceStatePaths,
} from "./state.js";
import { isMissingFileError } from "./guards.js";

export async function assertProjectDataSnapshotExists(
  statePaths: WorkspaceStatePaths,
  commandName: string,
  projectRootBinding: string,
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

  assertProjectRootBinding(manifest, projectRootBinding, commandName);
  const current = await readCurrentSnapshotFileHashes(statePaths, manifest.snapshotFiles).catch(
    (error: unknown) => {
      throw new Error(
        `Unknown or inconsistent Snapshot before ${commandName}. Run pull to capture it again.`,
        { cause: error },
      );
    },
  );
  const expected = [...manifest.snapshotFiles].sort((left, right) =>
    left.relativePath.localeCompare(right.relativePath),
  );
  if (JSON.stringify(current) !== JSON.stringify(expected)) {
    throw new Error(
      `Unknown or inconsistent Snapshot before ${commandName}. Run pull to capture it again.`,
    );
  }
  return manifest;
}

export function assertProjectRootBinding(
  manifest: SyncManifest,
  projectRootBinding: string,
  commandName: string,
): void {
  if (
    manifest.projectRootBinding !== projectRootBinding ||
    (manifest.compileBaseline !== undefined &&
      manifest.compileBaseline.projectRootBinding !== projectRootBinding)
  ) {
    throw new Error(
      `Project Root Binding mismatch before ${commandName}. Run pull explicitly to establish the configured target when no Interrupted Push is pending.`,
    );
  }
}

export async function readCurrentSnapshotFileHashes(
  statePaths: WorkspaceStatePaths,
  _snapshotFiles: readonly FileHashEntry[],
): Promise<FileHashEntry[]> {
  const files = await collectStandardProjectDataSnapshotPlan(
    statePaths.projectDataSnapshotDirectory,
  );
  return files.map(({ hash, relativePath }) => ({ hash, relativePath }));
}
