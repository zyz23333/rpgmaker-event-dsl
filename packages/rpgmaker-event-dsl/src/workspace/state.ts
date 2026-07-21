import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { dirname, posix, resolve } from "node:path";

import { z } from "zod";

import { parseMapInfos } from "../project-data/project.js";
import { writeStableJson } from "../project-data/writer.js";

export const workspaceStateDirectoryName = ".rpgmaker-event-dsl";
export const projectDataSnapshotDirectoryName = "project-data-snapshot";
export const generatedProjectDataDirectoryName = "generated-project-data";
export const syncManifestFileName = "sync-manifest.json";
export const pendingPushDirectoryName = "pending-push";
export const pendingPushBackupDirectoryName = "backup";
export const pendingPushManifestFileName = "pending-push.json";

export const standardDatabaseFileNames = [
  "Actors.json",
  "Animations.json",
  "Armors.json",
  "Classes.json",
  "CommonEvents.json",
  "Enemies.json",
  "Items.json",
  "MapInfos.json",
  "Skills.json",
  "States.json",
  "System.json",
  "Tilesets.json",
  "Troops.json",
  "Weapons.json",
] as const;

export const syncManifestSchema = z
  .object({
    compileBaseline: z
      .object({
        hash: z.string().min(1),
        config: z
          .object({
            scriptEnabled: z.boolean(),
            sourceExclude: z.array(z.string().min(1)),
            sourceInclude: z.array(z.string().min(1)),
            sourceRoot: z.string().min(1),
          })
          .strict(),
        snapshotFiles: z.array(
          z
            .object({
              hash: z.string().min(1),
              relativePath: z.string().min(1),
            })
            .strict(),
        ),
        sourceFiles: z.array(
          z
            .object({
              hash: z.string().min(1),
              relativePath: z.string().min(1),
            })
            .strict(),
        ),
      })
      .strict()
      .optional(),
    generatedFiles: z
      .array(
        z
          .object({
            hash: z.string().min(1),
            relativePath: z.string().min(1),
          })
          .strict(),
      )
      .optional(),
    snapshotFiles: z.array(
      z
        .object({
          hash: z.string().min(1),
          relativePath: z.string().min(1),
        })
        .strict(),
    ),
  })
  .strict();

export const pendingPushSchema = z
  .object({
    affectedFiles: z
      .array(
        z
          .object({
            backupHash: z.string().min(1),
            backupRelativePath: z.string().min(1),
            generatedHash: z.string().min(1),
            relativePath: z.string().min(1),
            snapshotHash: z.string().min(1),
          })
          .strict(),
      )
      .min(1),
    startedAt: z.string().min(1),
    version: z.literal(1),
  })
  .strict();

export type WorkspaceStatePaths = {
  workspaceStateDirectory: string;
  projectDataSnapshotDirectory: string;
  generatedProjectDataDirectory: string;
  pendingPushDirectory: string;
  pendingPushBackupDirectory: string;
  pendingPushManifestPath: string;
  syncManifestPath: string;
};

export type SyncManifest = z.infer<typeof syncManifestSchema>;
export type PendingPush = z.infer<typeof pendingPushSchema>;

export type SnapshotFilePlan = {
  relativePath: string;
  sourcePath: string;
  hash: string;
};

export function getWorkspaceStatePaths(workspaceRoot: string): WorkspaceStatePaths {
  const workspaceStateDirectory = resolve(workspaceRoot, workspaceStateDirectoryName);

  return {
    workspaceStateDirectory,
    projectDataSnapshotDirectory: resolve(
      workspaceStateDirectory,
      projectDataSnapshotDirectoryName,
    ),
    generatedProjectDataDirectory: resolve(
      workspaceStateDirectory,
      generatedProjectDataDirectoryName,
    ),
    pendingPushDirectory: resolve(workspaceStateDirectory, pendingPushDirectoryName),
    pendingPushBackupDirectory: resolve(
      workspaceStateDirectory,
      pendingPushDirectoryName,
      pendingPushBackupDirectoryName,
    ),
    pendingPushManifestPath: resolve(
      workspaceStateDirectory,
      pendingPushDirectoryName,
      pendingPushManifestFileName,
    ),
    syncManifestPath: resolve(workspaceStateDirectory, syncManifestFileName),
  };
}

export async function readSyncManifest(manifestPath: string): Promise<SyncManifest | null> {
  try {
    const rawManifest = await readFile(manifestPath, "utf8");
    return syncManifestSchema.parse(JSON.parse(rawManifest));
  } catch (error) {
    if (isMissingFileError(error)) {
      return null;
    }

    throw error;
  }
}

export async function readPendingPush(manifestPath: string): Promise<PendingPush | null> {
  try {
    const rawManifest = await readFile(manifestPath, "utf8");
    return pendingPushSchema.parse(JSON.parse(rawManifest));
  } catch (error) {
    if (isMissingFileError(error)) {
      return null;
    }

    throw error;
  }
}

export async function writeSyncManifest(
  manifestPath: string,
  manifest: SyncManifest,
): Promise<void> {
  await mkdir(dirname(manifestPath), { recursive: true });

  const tempManifestPath = `${manifestPath}.tmp-${process.pid}-${randomUUID()}`;
  await writeFile(tempManifestPath, writeStableJson(manifest), "utf8");
  await rm(manifestPath, { force: true });
  await rename(tempManifestPath, manifestPath);
}

export async function captureStandardProjectDataSnapshot(options: {
  dataDirectory: string;
  statePaths: WorkspaceStatePaths;
}): Promise<SyncManifest> {
  const snapshotPlan = await collectStandardProjectDataSnapshotPlan(options.dataDirectory);

  await writeSnapshotState(options.statePaths, snapshotPlan);

  return {
    snapshotFiles: snapshotPlan
      .map(({ hash, relativePath }) => ({ hash, relativePath }))
      .sort((left, right) => left.relativePath.localeCompare(right.relativePath)),
  };
}

export async function collectStandardProjectDataSnapshotPlan(
  dataDirectory: string,
): Promise<SnapshotFilePlan[]> {
  const mapInfosPath = resolve(dataDirectory, "MapInfos.json");
  const mapInfosRaw = await readFile(mapInfosPath, "utf8");
  const mapInfos = parseMapInfos(mapInfosRaw);
  const mapFileNames = new Set(mapInfos.map((entry) => formatMapFileName(entry.id)));

  const fileNames = [...standardDatabaseFileNames, ...mapFileNames];

  const snapshotPlan: SnapshotFilePlan[] = [];

  for (const fileName of fileNames) {
    const sourcePath = resolve(dataDirectory, fileName);
    await assertReadableFile(sourcePath);

    const rawContent = await readFile(sourcePath, "utf8");
    snapshotPlan.push({
      hash: hashContent(rawContent),
      relativePath: toPosixPath(fileName),
      sourcePath,
    });
  }

  snapshotPlan.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
  return snapshotPlan;
}

async function writeSnapshotState(
  statePaths: WorkspaceStatePaths,
  snapshotPlan: readonly SnapshotFilePlan[],
): Promise<void> {
  const tempSnapshotDirectory = resolve(
    statePaths.workspaceStateDirectory,
    `${projectDataSnapshotDirectoryName}.tmp-${process.pid}-${randomUUID()}`,
  );

  await mkdir(dirname(statePaths.projectDataSnapshotDirectory), { recursive: true });
  await rm(tempSnapshotDirectory, { force: true, recursive: true });
  await mkdir(tempSnapshotDirectory, { recursive: true });

  try {
    for (const filePlan of snapshotPlan) {
      const destinationPath = resolve(tempSnapshotDirectory, filePlan.relativePath);
      await mkdir(dirname(destinationPath), { recursive: true });
      await writeFile(destinationPath, await readFile(filePlan.sourcePath, "utf8"), "utf8");
    }

    await replaceDirectory(tempSnapshotDirectory, statePaths.projectDataSnapshotDirectory);
    await writeSyncManifest(statePaths.syncManifestPath, {
      snapshotFiles: snapshotPlan
        .map(({ hash, relativePath }) => ({ hash, relativePath }))
        .sort((left, right) => left.relativePath.localeCompare(right.relativePath)),
    });
  } catch (error) {
    await rm(tempSnapshotDirectory, { force: true, recursive: true });
    throw error;
  }
}

async function replaceDirectory(sourceDirectory: string, targetDirectory: string): Promise<void> {
  const targetExists = await exists(targetDirectory);
  const backupDirectory = targetExists
    ? `${targetDirectory}.bak-${process.pid}-${randomUUID()}`
    : null;

  if (backupDirectory !== null) {
    await rm(backupDirectory, { force: true, recursive: true });
    await rename(targetDirectory, backupDirectory);
  }

  try {
    await rename(sourceDirectory, targetDirectory);
  } catch (error) {
    if (backupDirectory !== null) {
      await rm(targetDirectory, { force: true, recursive: true });
      await rename(backupDirectory, targetDirectory);
      await rm(backupDirectory, { force: true, recursive: true });
    }

    throw error;
  }

  if (backupDirectory !== null) {
    await rm(backupDirectory, { force: true, recursive: true });
  }
}

async function assertReadableFile(filePath: string): Promise<void> {
  const fileStats = await stat(filePath);

  if (!fileStats.isFile()) {
    throw new Error(`Expected ${filePath} to be a file.`);
  }
}

function hashContent(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

export function hashUtf8Content(content: string): string {
  return hashContent(content);
}

function formatMapFileName(mapId: number): string {
  return `Map${mapId.toString().padStart(3, "0")}.json`;
}

function toPosixPath(path: string): string {
  return path.split(/[/\\]/u).join(posix.sep);
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (isMissingFileError(error)) {
      return false;
    }

    throw error;
  }
}

function isMissingFileError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string" &&
    (error as { code?: string }).code === "ENOENT"
  );
}
