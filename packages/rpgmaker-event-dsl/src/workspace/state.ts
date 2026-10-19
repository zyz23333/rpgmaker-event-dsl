import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { dirname, posix, resolve } from "node:path";

import { z } from "zod";

import { isCanonicalMapFileName, parseMapInfos } from "../project-data/project.js";
import { writeStableJson } from "../project-data/writer.js";
import { typeInputSchema } from "./type-inputs.js";

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

const hashSchema = z.string().regex(/^[a-f0-9]{64}$/u);
const projectDataFileNameSchema = z
  .string()
  .refine(
    (name) =>
      (standardDatabaseFileNames as readonly string[]).includes(name) ||
      isCanonicalMapFileName(name),
  );
const projectDataHashSchema = z
  .object({ hash: hashSchema, relativePath: projectDataFileNameSchema })
  .strict();
const projectDataHashesSchema = z
  .array(projectDataHashSchema)
  .refine((files) => new Set(files.map(({ relativePath }) => relativePath)).size === files.length);

export const syncManifestSchema = z
  .object({
    version: z.literal(1),
    projectRootBinding: z.string().min(1),
    compileBaseline: z
      .object({
        projectRootBinding: z.string().min(1),
        compileContractVersion: z.string().min(1).optional(),
        typeInputs: z.array(typeInputSchema).optional(),
        hash: hashSchema,
        config: z
          .object({
            scriptEnabled: z.boolean(),
            sourceExclude: z.array(z.string().min(1)),
            sourceInclude: z.array(z.string().min(1)),
            sourceRoot: z.string().min(1),
          })
          .strict(),
        snapshotFiles: projectDataHashesSchema,
        sourceFiles: z.array(
          z
            .object({
              hash: hashSchema,
              relativePath: z.string().min(1),
            })
            .strict(),
        ),
      })
      .strict()
      .optional(),
    generatedFiles: projectDataHashesSchema.optional(),
    snapshotFiles: projectDataHashesSchema.refine((files) =>
      standardDatabaseFileNames.every((name) =>
        files.some(({ relativePath }) => relativePath === name),
      ),
    ),
  })
  .strict();

export const pendingPushSchema = z
  .object({
    projectRootBinding: z.string().min(1),
    affectedFiles: z
      .array(
        z
          .object({
            backupHash: hashSchema,
            backupRelativePath: projectDataFileNameSchema,
            generatedHash: hashSchema,
            relativePath: projectDataFileNameSchema,
            snapshotHash: hashSchema,
          })
          .strict(),
      )
      .min(1),
    startedAt: z.string().min(1),
    version: z.literal(2),
  })
  .strict();

export type WorkspaceStatePaths = {
  snapshotContents?: ReadonlyMap<string, Buffer>;
  workspaceStateDirectory: string;
  projectDataSnapshotDirectory: string;
  generatedProjectDataDirectory: string;
  pendingPushDirectory: string;
  pendingPushBackupDirectory: string;
  pendingPushManifestPath: string;
  syncManifestPath: string;
};

export async function readProjectDataSnapshotFile(
  statePaths: WorkspaceStatePaths,
  relativePath: string,
): Promise<string> {
  if (statePaths.snapshotContents !== undefined) {
    const content = statePaths.snapshotContents.get(relativePath);
    if (content === undefined)
      throw new Error(`Captured Snapshot file is missing: ${relativePath}`);
    return content.toString("utf8");
  }
  return readFile(resolve(statePaths.projectDataSnapshotDirectory, relativePath), "utf8");
}

export type SyncManifest = z.infer<typeof syncManifestSchema>;
export type PendingPush = z.infer<typeof pendingPushSchema>;

export type SnapshotFilePlan = {
  relativePath: string;
  sourcePath: string;
  content: Buffer;
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

    throw new Error(
      `Unknown or corrupt Sync Manifest at ${manifestPath}. Run pull to establish a new Snapshot when no Interrupted Push is pending.`,
      { cause: error },
    );
  }
}

export async function readPendingPush(manifestPath: string): Promise<PendingPush | null> {
  try {
    const rawManifest = await readFile(manifestPath, "utf8");
    return pendingPushSchema.parse(JSON.parse(rawManifest));
  } catch (error) {
    if (isMissingFileError(error)) {
      const directory = await stat(dirname(manifestPath)).catch((directoryError: unknown) => {
        if (isMissingFileError(directoryError)) return null;
        throw directoryError;
      });
      if (directory === null) return null;
      throw new Error(
        `Interrupted Push state is incomplete: missing ${manifestPath}. Recovery stopped without changes.`,
        { cause: error },
      );
    }
    throw new Error(
      `Unknown or corrupt Interrupted Push state at ${manifestPath}. Recovery stopped without changes.`,
      { cause: error },
    );
  }
}

export async function writeSyncManifest(
  manifestPath: string,
  manifest: SyncManifest,
  assertInputsUnchanged?: () => Promise<void>,
): Promise<void> {
  await mkdir(dirname(manifestPath), { recursive: true });

  const tempManifestPath = `${manifestPath}.tmp-${process.pid}-${randomUUID()}`;
  try {
    await writeFile(tempManifestPath, writeStableJson(manifest), "utf8");
    await assertInputsUnchanged?.();
    await rename(tempManifestPath, manifestPath);
  } finally {
    await rm(tempManifestPath, { force: true });
  }
}

export async function captureStandardProjectDataSnapshot(options: {
  dataDirectory: string;
  projectRootBinding: string;
  statePaths: WorkspaceStatePaths;
  assertWorkspaceUnchanged: () => Promise<void>;
}): Promise<SyncManifest> {
  const snapshotPlan = await collectStandardProjectDataSnapshotPlan(options.dataDirectory);
  const manifest: SyncManifest = {
    version: 1,
    projectRootBinding: options.projectRootBinding,
    snapshotFiles: snapshotPlan
      .map(({ hash, relativePath }) => ({ hash, relativePath }))
      .sort((left, right) => left.relativePath.localeCompare(right.relativePath)),
  };
  await writeSnapshotState(
    options.statePaths,
    snapshotPlan,
    manifest,
    options.assertWorkspaceUnchanged,
  );
  return manifest;
}

export async function collectStandardProjectDataSnapshotPlan(
  dataDirectory: string,
): Promise<SnapshotFilePlan[]> {
  const mapInfosPath = resolve(dataDirectory, "MapInfos.json");
  const mapInfosRaw = await readFile(mapInfosPath);
  const mapFileNames = parseMapInfos(decodeProjectData(mapInfosRaw, "MapInfos.json")).map(
    ({ id }) => formatMapFileName(id),
  );

  const fileNames = [...standardDatabaseFileNames, ...mapFileNames];

  const snapshotPlan: SnapshotFilePlan[] = [];

  for (const fileName of fileNames) {
    const sourcePath = resolve(dataDirectory, fileName);
    await assertReadableFile(sourcePath);

    const rawContent = fileName === "MapInfos.json" ? mapInfosRaw : await readFile(sourcePath);
    assertProjectDataCarrier(decodeProjectData(rawContent, fileName), fileName);
    snapshotPlan.push({
      content: rawContent,
      hash: hashContent(rawContent),
      relativePath: toPosixPath(fileName),
      sourcePath,
    });
  }

  snapshotPlan.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
  return snapshotPlan;
}

function assertProjectDataCarrier(content: string, fileName: string): void {
  try {
    const value: unknown = JSON.parse(content);
    const object = typeof value === "object" && value !== null && !Array.isArray(value);
    if (
      fileName === "System.json"
        ? object
        : fileName.startsWith("Map") && fileName !== "MapInfos.json"
          ? object && "events" in value && Array.isArray(value.events)
          : Array.isArray(value)
    )
      return;
    throw new Error("Unexpected carrier shape");
  } catch (error) {
    throw new Error(
      `Cannot safely locate Project data carrier in ${fileName}. Snapshot capture stopped without publication.`,
      { cause: error },
    );
  }
}

async function writeSnapshotState(
  statePaths: WorkspaceStatePaths,
  snapshotPlan: readonly SnapshotFilePlan[],
  manifest: SyncManifest,
  assertWorkspaceUnchanged: () => Promise<void>,
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
      await writeFile(destinationPath, filePlan.content);
    }

    for (const filePlan of snapshotPlan) {
      const current = await readFile(filePlan.sourcePath).catch((error: unknown) => {
        throw new Error(
          `Project data changed during Snapshot capture: ${filePlan.relativePath}. Run clone or pull again.`,
          { cause: error },
        );
      });
      if (!current.equals(filePlan.content)) {
        throw new Error(
          `Project data changed during Snapshot capture: ${filePlan.relativePath}. Run clone or pull again.`,
        );
      }
    }
    await assertWorkspaceUnchanged();
    await replaceDirectory(tempSnapshotDirectory, statePaths.projectDataSnapshotDirectory, () =>
      writeSyncManifest(statePaths.syncManifestPath, manifest),
    );
  } catch (error) {
    await rm(tempSnapshotDirectory, { force: true, recursive: true });
    throw error;
  }
}

async function replaceDirectory(
  sourceDirectory: string,
  targetDirectory: string,
  publishManifest: () => Promise<void>,
): Promise<void> {
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
    await publishManifest();
  } catch (error) {
    await rm(targetDirectory, { force: true, recursive: true });
    if (backupDirectory !== null) {
      await rename(backupDirectory, targetDirectory);
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

function decodeProjectData(content: Buffer, relativePath: string): string {
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(content);
  } catch (error) {
    throw new Error(
      `Invalid UTF-8 Project data: ${relativePath}. Snapshot capture stopped without publication.`,
      { cause: error },
    );
  }
}

function hashContent(content: string | Buffer): string {
  return createHash("sha256").update(content).digest("hex");
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
