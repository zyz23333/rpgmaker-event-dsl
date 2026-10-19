import { link, mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { withWorkspaceOperationLock } from "./operation-lock.js";
import { dirname, resolve } from "node:path";
import { createHash, randomUUID } from "node:crypto";

import { discoverDefinitionFiles } from "./definitions.js";
import {
  isCompileBaselineFresh,
  expectedCompileOutputFileNames,
  type FileHashEntry,
} from "../project-data/materialization.js";
import {
  getWorkspaceStatePaths,
  readPendingPush,
  type SyncManifest,
  type WorkspaceStatePaths,
} from "./state.js";
import {
  buildStructuredDiffReport,
  deriveAffectedProjectDataFiles,
} from "../project-data/structured-diff.js";
import { loadWorkspace, type LoadedWorkspace } from "./config.js";
import type { PushWorkspaceOptions } from "./types.js";
import { assertProjectDataSnapshotExists, readCurrentSnapshotFileHashes } from "./checks.js";
import { isMissingFileError } from "./guards.js";
import { isCanonicalMapFileName } from "../project-data/project.js";

import { createPendingPushState, resolvePendingInterruptedPushForPush } from "./push-recovery.js";

async function readFileHashOrNull(filePath: string): Promise<string | null> {
  try {
    return createHash("sha256")
      .update(await readFile(filePath))
      .digest("hex");
  } catch (error) {
    if (isMissingFileError(error)) return null;
    throw error;
  }
}

export async function assertNoPendingInterruptedPushForNonPush(input: {
  statePaths: WorkspaceStatePaths;
  commandName: string;
}): Promise<void> {
  const pendingPush = await readPendingPush(input.statePaths.pendingPushManifestPath);
  if (pendingPush === null) {
    return;
  }

  throw new Error(
    `Interrupted Push is pending before ${input.commandName}. Run push to resolve it before running other workspace commands.`,
  );
}

export function assertKnownSafeProjectDataFile(
  relativePath: string,
  generatedFiles: readonly FileHashEntry[],
): void {
  const knownFiles = new Set(generatedFiles.map((entry) => entry.relativePath));
  if (!isSafeProjectDataFileName(relativePath) || !knownFiles.has(relativePath)) {
    throw new Error(`Unknown or unsafe Project Data File for diff --file: ${relativePath}.`);
  }
}

export async function assertGeneratedProjectDataIntegrity(
  statePaths: WorkspaceStatePaths,
  manifest: SyncManifest,
  commandName: string,
): Promise<void> {
  if (manifest.generatedFiles === undefined || manifest.compileBaseline === undefined) {
    throw new Error(`Generated Project Data is required before ${commandName}. Run compile first.`);
  }

  const generatedStats = await stat(statePaths.generatedProjectDataDirectory).catch(
    (error: unknown) => {
      if (isMissingFileError(error)) {
        return null;
      }

      throw error;
    },
  );

  if (generatedStats === null || !generatedStats.isDirectory()) {
    throw new Error(`Generated Project Data is required before ${commandName}. Run compile first.`);
  }

  const expectedNames = await expectedCompileOutputFileNames(statePaths);
  const listedNames = manifest.generatedFiles.map(({ relativePath }) => relativePath).sort();
  const actualEntries = await readdir(statePaths.generatedProjectDataDirectory, {
    withFileTypes: true,
  });
  const actualNames = actualEntries.map(({ name }) => name).sort();
  if (
    JSON.stringify(expectedNames) !== JSON.stringify(listedNames) ||
    JSON.stringify(expectedNames) !== JSON.stringify(actualNames) ||
    actualEntries.some((entry) => !entry.isFile())
  ) {
    throw new Error(
      `Generated Project Data integrity check failed before ${commandName}: incomplete or unexpected owned output file set. Run compile first.`,
    );
  }

  const currentGeneratedFiles = await Promise.all(
    manifest.generatedFiles.map(async ({ relativePath }) => ({
      hash: createHash("sha256")
        .update(await readFile(resolve(statePaths.generatedProjectDataDirectory, relativePath)))
        .digest("hex"),
      relativePath,
    })),
  );
  currentGeneratedFiles.sort((left, right) => left.relativePath.localeCompare(right.relativePath));

  const expectedGeneratedFiles = [...manifest.generatedFiles].sort((left, right) =>
    left.relativePath.localeCompare(right.relativePath),
  );

  if (JSON.stringify(currentGeneratedFiles) !== JSON.stringify(expectedGeneratedFiles)) {
    throw new Error(
      `Generated Project Data integrity check failed before ${commandName}. Run compile first.`,
    );
  }
}

export async function readJsonFiles(
  directory: string,
  files: readonly FileHashEntry[],
): Promise<Map<string, unknown>> {
  const entries = await Promise.all(
    files.map(
      async ({ relativePath }) =>
        [
          relativePath,
          JSON.parse(await readFile(resolve(directory, relativePath), "utf8")),
        ] as const,
    ),
  );

  return new Map(entries);
}

export async function pushWorkspace(options: PushWorkspaceOptions): Promise<void> {
  await withWorkspaceOperationLock(
    options.workspaceRoot,
    options.allowDestructive ? "push --allow-destructive" : "push",
    () => pushWorkspaceUnlocked(options),
  );
}

async function pushWorkspaceUnlocked(options: PushWorkspaceOptions): Promise<void> {
  const commandName = options.allowDestructive ? "push --allow-destructive" : "push";
  const workspace = await loadWorkspace(options.workspaceRoot);
  const statePaths = getWorkspaceStatePaths(workspace.workspaceRoot);

  await resolvePendingInterruptedPushForPush({ workspace, statePaths });

  const manifest = await assertProjectDataSnapshotExists(
    statePaths,
    commandName,
    workspace.projectRootBinding,
  );

  await assertGeneratedProjectDataIntegrity(statePaths, manifest, commandName);
  await assertGeneratedProjectDataFresh({
    commandName,
    manifest,
    statePaths,
    workspace,
  });

  const generatedFiles = manifest.generatedFiles ?? [];
  const generated = await readJsonFiles(statePaths.generatedProjectDataDirectory, generatedFiles);
  const snapshot = await readJsonFiles(statePaths.projectDataSnapshotDirectory, generatedFiles);
  const report = buildStructuredDiffReport({ generated, snapshot });

  if (report.hasDestructiveChanges && !options.allowDestructive) {
    throw new Error(
      "Destructive Changes detected before push. Re-run with --allow-destructive after review.",
    );
  }

  const affectedFiles = deriveAffectedProjectDataFiles({ generated, snapshot });
  await assertNoProjectDrift({
    expectedFiles: manifest.snapshotFiles,
    dataDirectory: workspace.dataDirectory,
  });
  if (affectedFiles.length === 0) {
    return;
  }

  const stagedWrite = await stageProjectRootWrites({
    affectedFiles,
    generatedFiles,
    dataDirectory: workspace.dataDirectory,
    statePaths,
  });
  const writtenFiles: string[] = [];
  const snapshotHashes = new Map(
    manifest.snapshotFiles.map((entry) => [entry.relativePath, entry.hash]),
  );

  try {
    await createPendingPushState({ affectedFiles, generatedFiles, manifest, statePaths });
    await assertNoProjectDrift({
      expectedFiles: manifest.snapshotFiles,
      dataDirectory: workspace.dataDirectory,
    });
    for (const stagedFile of stagedWrite.files) {
      const expectedHash = snapshotHashes.get(stagedFile.relativePath);
      if (expectedHash === undefined) {
        throw new Error(
          `Project Drift detected before push for ${stagedFile.relativePath}. Run pull first.`,
        );
      }
      await replaceProjectRootFile(stagedFile, expectedHash);
      writtenFiles.push(stagedFile.relativePath);
    }
    const generatedHashes = new Map(
      generatedFiles.map(({ relativePath, hash }) => [relativePath, hash]),
    );
    await assertNoProjectDrift({
      dataDirectory: workspace.dataDirectory,
      expectedFiles: manifest.snapshotFiles.map((entry) =>
        writtenFiles.includes(entry.relativePath)
          ? { ...entry, hash: generatedHashes.get(entry.relativePath)! }
          : entry,
      ),
    });
  } catch (error) {
    if (!(error instanceof RetainedProjectRootObjectError)) {
      await rm(stagedWrite.directory, { force: true, recursive: true });
    }
    const written = writtenFiles.length > 0 ? writtenFiles.join(", ") : "none";
    throw new Error(
      `Project Root replacement failed during push after writing: ${written}. ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }

  await rm(stagedWrite.directory, { force: true, recursive: true });
  await resolvePendingInterruptedPushForPush({ workspace, statePaths });
}

async function assertGeneratedProjectDataFresh(input: {
  commandName: string;
  manifest: SyncManifest;
  statePaths: WorkspaceStatePaths;
  workspace: LoadedWorkspace;
}): Promise<void> {
  const files = await discoverDefinitionFiles(input.workspace.workspaceRoot, {
    sourceRoot: input.workspace.config.sourceRoot,
    sourceInclude: input.workspace.config.sourceInclude,
    sourceExclude: input.workspace.config.sourceExclude,
  });
  const snapshotFiles = await readCurrentSnapshotFileHashes(
    input.statePaths,
    input.manifest.snapshotFiles,
  );

  if (
    input.manifest.compileBaseline === undefined ||
    !(await isCompileBaselineFresh({
      projectRootBinding: input.workspace.projectRootBinding,
      baseline: input.manifest.compileBaseline,
      config: input.workspace.config,
      snapshotFiles,
      sourceFiles: files,
      workspaceRoot: input.workspace.workspaceRoot,
    }))
  ) {
    throw new Error(
      `Generated Project Data is stale before ${input.commandName}. Run compile first.`,
    );
  }
}

async function assertNoProjectDrift(input: {
  expectedFiles: readonly FileHashEntry[];
  dataDirectory: string;
}): Promise<void> {
  for (const { relativePath, hash: expectedHash } of input.expectedFiles) {
    const currentHash = await readProjectRootFileHash(input.dataDirectory, relativePath);
    if (currentHash !== expectedHash) {
      throw new Error(`Project Drift detected before push for ${relativePath}. Run pull first.`);
    }
  }
}

async function readProjectRootFileHash(
  dataDirectory: string,
  relativePath: string,
): Promise<string> {
  try {
    return createHash("sha256")
      .update(await readFile(resolve(dataDirectory, relativePath)))
      .digest("hex");
  } catch (error) {
    throw new Error(`Project Drift detected before push for ${relativePath}. Run pull first.`, {
      cause: error,
    });
  }
}

async function stageProjectRootWrites(input: {
  affectedFiles: readonly string[];
  generatedFiles: readonly FileHashEntry[];
  dataDirectory: string;
  statePaths: WorkspaceStatePaths;
}): Promise<{
  directory: string;
  files: Array<{
    relativePath: string;
    stagedPath: string;
    targetPath: string;
    originalPath: string;
  }>;
}> {
  const stagingDirectory = resolve(
    input.dataDirectory,
    `push-staging.tmp-${process.pid}-${randomUUID()}`,
  );
  const files: Array<{
    relativePath: string;
    stagedPath: string;
    targetPath: string;
    originalPath: string;
  }> = [];

  await rm(stagingDirectory, { force: true, recursive: true });
  await mkdir(stagingDirectory, { recursive: true });

  try {
    for (const relativePath of input.affectedFiles) {
      const generatedPath = resolve(input.statePaths.generatedProjectDataDirectory, relativePath);
      const stagedPath = resolve(stagingDirectory, relativePath);

      await mkdir(dirname(stagedPath), { recursive: true });
      const content = await readFile(generatedPath);
      if (
        createHash("sha256").update(content).digest("hex") !==
        input.generatedFiles.find((entry) => entry.relativePath === relativePath)?.hash
      )
        throw new Error(
          `Generated Project Data changed while staging ${relativePath}. Run compile first.`,
        );
      await writeFile(stagedPath, content);
      files.push({
        originalPath: resolve(stagingDirectory, "original", relativePath),
        relativePath,
        stagedPath,
        targetPath: resolve(input.dataDirectory, relativePath),
      });
    }
  } catch (error) {
    await rm(stagingDirectory, { force: true, recursive: true });
    throw new Error("Failed to stage Project Root writes before push.", { cause: error });
  }

  return {
    directory: stagingDirectory,
    files,
  };
}

class RetainedProjectRootObjectError extends Error {
  constructor(originalPath: string, error: unknown, restoreError: unknown) {
    super(
      `Captured Project Root object retained at ${originalPath}; non-overwriting restoration failed. ${error instanceof Error ? error.message : String(error)} Restoration: ${restoreError instanceof Error ? restoreError.message : String(restoreError)}`,
      { cause: error },
    );
  }
}

async function replaceProjectRootFile(
  stagedFile: {
    relativePath: string;
    stagedPath: string;
    targetPath: string;
    originalPath: string;
  },
  expectedHash: string,
): Promise<void> {
  let replacementInstalled = false;
  let originalCaptured = false;
  await mkdir(dirname(stagedFile.originalPath), { recursive: true });
  try {
    await rename(stagedFile.targetPath, stagedFile.originalPath);
    originalCaptured = true;
    const capturedHash = await readFileHashOrNull(stagedFile.originalPath);
    if (capturedHash !== expectedHash) {
      throw new Error(
        `Project Drift detected during push for ${stagedFile.relativePath}. Run pull first.`,
      );
    }

    // Both files are on the Project data volume. link refuses an existing target
    // atomically, including arrivals after the preceding content checks.
    await link(stagedFile.stagedPath, stagedFile.targetPath);
    replacementInstalled = true;
    await rm(stagedFile.stagedPath);
  } catch (error) {
    if (originalCaptured && !replacementInstalled) {
      try {
        await link(stagedFile.originalPath, stagedFile.targetPath);
        await rm(stagedFile.originalPath);
      } catch (restoreError) {
        // Captured bytes may be an external edit absent from the Snapshot backup.
        // Retain this object and the staging directory if it cannot be restored.
        throw new RetainedProjectRootObjectError(stagedFile.originalPath, error, restoreError);
      }
    }
    throw error;
  }

  await rm(stagedFile.originalPath, { force: true });
}

function isSafeProjectDataFileName(relativePath: string): boolean {
  return (
    relativePath === "CommonEvents.json" ||
    relativePath === "Troops.json" ||
    relativePath === "System.json" ||
    isCanonicalMapFileName(relativePath)
  );
}
