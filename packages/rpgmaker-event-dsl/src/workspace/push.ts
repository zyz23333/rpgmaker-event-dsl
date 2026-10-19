import { link, mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { withWorkspaceOperationLock } from "./operation-lock.js";
import { dirname, resolve } from "node:path";
import { createHash, randomUUID } from "node:crypto";

import { discoverDefinitionFiles } from "./definitions.js";
import {
  isCompileBaselineFresh,
  expectedCompileOutputFileNames,
  type CompileBaseline,
  type FileHashEntry,
} from "../project-data/materialization.js";
import {
  getWorkspaceStatePaths,
  hashUtf8Content,
  readPendingPush,
  writeSyncManifest,
  type PendingPush,
  type SyncManifest,
  type WorkspaceStatePaths,
} from "./state.js";
import {
  buildStructuredDiffReport,
  deriveAffectedProjectDataFiles,
} from "../project-data/structured-diff.js";
import { loadWorkspace, type LoadedWorkspace, type WorkspaceConfig } from "./config.js";
import { writeStableJson } from "../project-data/writer.js";
import type { PushWorkspaceOptions } from "./types.js";
import { assertProjectDataSnapshotExists, readCurrentSnapshotFileHashes } from "./checks.js";
import { isMissingFileError } from "./guards.js";
import { isCanonicalMapFileName } from "../project-data/project.js";

type InterruptedPushFileState = "generated" | "missing" | "snapshot" | "unknown";

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

async function resolvePendingInterruptedPushForPush(input: {
  workspace: LoadedWorkspace;
  statePaths: WorkspaceStatePaths;
}): Promise<void> {
  const pendingPush = await readPendingPush(input.statePaths.pendingPushManifestPath);
  if (pendingPush === null) {
    return;
  }

  if (pendingPush.projectRootBinding !== input.workspace.projectRootBinding) {
    throw new Error(
      "Project Root Binding mismatch for Interrupted Push. Return to the original configured target before recovery.",
    );
  }
  const manifest = await assertProjectDataSnapshotExists(
    input.statePaths,
    "Interrupted Push recovery",
    input.workspace.projectRootBinding,
  );
  assertPendingMetadataConsistent(pendingPush, manifest);
  const states = await classifyInterruptedPushFiles({
    dataDirectory: input.workspace.dataDirectory,
    pendingPush,
    statePaths: input.statePaths,
  });
  const stateSet = new Set(states.map(({ state }) => state));

  if (stateSet.size === 1 && stateSet.has("generated")) {
    await completeInterruptedPush({
      affectedFiles: pendingPush.affectedFiles.map(({ relativePath }) => relativePath),
      manifest,
      statePaths: input.statePaths,
    });
    await rm(input.statePaths.pendingPushDirectory, { force: true, recursive: true });
    return;
  }

  if (stateSet.size === 1 && stateSet.has("snapshot")) {
    await rm(input.statePaths.pendingPushDirectory, { force: true, recursive: true });
    return;
  }

  throw new Error(
    [
      "Interrupted Push cannot be recovered automatically.",
      "Restore affected Project Root files to either the pending backup state or Generated Project Data, then run push again.",
      ...states.map(({ relativePath, state }) => `- ${relativePath}: ${state}`),
    ].join("\n"),
  );
}

function assertPendingMetadataConsistent(pending: PendingPush, manifest: SyncManifest): void {
  const snapshotHashes = new Map(
    manifest.snapshotFiles.map((entry) => [entry.relativePath, entry.hash]),
  );
  const generatedHashes = new Map(
    (manifest.generatedFiles ?? []).map((entry) => [entry.relativePath, entry.hash]),
  );
  const seen = new Set<string>();
  for (const entry of pending.affectedFiles) {
    if (
      seen.has(entry.relativePath) ||
      !isSafeProjectDataFileName(entry.relativePath) ||
      entry.backupRelativePath !== entry.relativePath ||
      entry.snapshotHash !== snapshotHashes.get(entry.relativePath) ||
      entry.generatedHash !== generatedHashes.get(entry.relativePath) ||
      entry.backupHash !== entry.snapshotHash
    ) {
      throw new Error(
        `Interrupted Push metadata is inconsistent for ${entry.relativePath}. Recovery stopped without changes.`,
      );
    }
    seen.add(entry.relativePath);
  }
}

async function createPendingPushState(input: {
  affectedFiles: readonly string[];
  generatedFiles: readonly FileHashEntry[];
  manifest: SyncManifest;
  statePaths: WorkspaceStatePaths;
}): Promise<void> {
  const snapshotHashes = new Map(
    input.manifest.snapshotFiles.map((entry) => [entry.relativePath, entry.hash]),
  );
  const generatedHashes = new Map(
    input.generatedFiles.map((entry) => [entry.relativePath, entry.hash]),
  );

  const tempDirectory = resolve(
    input.statePaths.workspaceStateDirectory,
    `pending-push.tmp-${process.pid}-${randomUUID()}`,
  );

  await rm(tempDirectory, { force: true, recursive: true });
  await mkdir(resolve(tempDirectory, "backup"), { recursive: true });

  try {
    const affectedFiles = [];

    for (const relativePath of input.affectedFiles) {
      const snapshotHash = snapshotHashes.get(relativePath);
      const generatedHash = generatedHashes.get(relativePath);
      if (snapshotHash === undefined || generatedHash === undefined) {
        throw new Error(`Cannot create Interrupted Push state for ${relativePath}.`);
      }

      const snapshotPath = resolve(input.statePaths.projectDataSnapshotDirectory, relativePath);
      const backupPath = resolve(tempDirectory, "backup", relativePath);
      const content = await readFile(snapshotPath);
      const backupHash = createHash("sha256").update(content).digest("hex");
      if (backupHash !== snapshotHash)
        throw new Error(`Snapshot changed while preparing Interrupted Push for ${relativePath}.`);

      await mkdir(dirname(backupPath), { recursive: true });
      await writeFile(backupPath, content);
      affectedFiles.push({
        backupHash,
        backupRelativePath: relativePath,
        generatedHash,
        relativePath,
        snapshotHash,
      });
    }

    await writeFile(
      resolve(tempDirectory, "pending-push.json"),
      writeStableJson({
        projectRootBinding: input.manifest.projectRootBinding,
        affectedFiles,
        startedAt: new Date().toISOString(),
        version: 2,
      }),
      "utf8",
    );
    await rm(input.statePaths.pendingPushDirectory, { force: true, recursive: true });
    await rename(tempDirectory, input.statePaths.pendingPushDirectory);
  } catch (error) {
    await rm(tempDirectory, { force: true, recursive: true });
    throw error;
  }
}

async function completeInterruptedPush(input: {
  affectedFiles: readonly string[];
  manifest: SyncManifest;
  statePaths: WorkspaceStatePaths;
}): Promise<void> {
  const snapshotFiles = new Map(
    input.manifest.snapshotFiles.map((entry) => [entry.relativePath, entry]),
  );
  const generatedFiles = new Map(
    (input.manifest.generatedFiles ?? []).map((entry) => [entry.relativePath, entry]),
  );

  for (const relativePath of input.affectedFiles) {
    const content = await readFile(
      resolve(input.statePaths.generatedProjectDataDirectory, relativePath),
    );
    const snapshotPath = resolve(input.statePaths.projectDataSnapshotDirectory, relativePath);

    await mkdir(dirname(snapshotPath), { recursive: true });
    await writeFile(snapshotPath, content);
    snapshotFiles.set(relativePath, {
      hash: createHash("sha256").update(content).digest("hex"),
      relativePath,
    });
  }

  const nextSnapshotFiles = [...snapshotFiles.values()].sort((left, right) =>
    left.relativePath.localeCompare(right.relativePath),
  );
  const previousCompileBaseline = input.manifest.compileBaseline;
  const compileBaseline =
    previousCompileBaseline === undefined
      ? undefined
      : rewriteCompileBaselineSnapshotFiles(previousCompileBaseline, nextSnapshotFiles);

  await writeSyncManifest(input.statePaths.syncManifestPath, {
    ...input.manifest,
    compileBaseline,
    generatedFiles: [...generatedFiles.values()].sort((left, right) =>
      left.relativePath.localeCompare(right.relativePath),
    ),
    snapshotFiles: nextSnapshotFiles,
  });
}

async function classifyInterruptedPushFiles(input: {
  dataDirectory: string;
  pendingPush: PendingPush;
  statePaths: WorkspaceStatePaths;
}): Promise<Array<{ relativePath: string; state: InterruptedPushFileState }>> {
  return Promise.all(
    input.pendingPush.affectedFiles.map(async (entry) => {
      await assertPendingBackupIntegrity({
        entry,
        statePaths: input.statePaths,
      });
      await assertPendingGeneratedIntegrity({
        entry,
        statePaths: input.statePaths,
      });

      const currentHash = await readFileHashOrNull(
        resolve(input.dataDirectory, entry.relativePath),
      );
      if (currentHash === null) {
        return { relativePath: entry.relativePath, state: "missing" };
      }

      if (currentHash === entry.generatedHash) {
        return { relativePath: entry.relativePath, state: "generated" };
      }

      if (currentHash === entry.snapshotHash) {
        return { relativePath: entry.relativePath, state: "snapshot" };
      }

      return { relativePath: entry.relativePath, state: "unknown" };
    }),
  );
}

async function assertPendingBackupIntegrity(input: {
  entry: PendingPush["affectedFiles"][number];
  statePaths: WorkspaceStatePaths;
}): Promise<void> {
  const backupPath = resolve(
    input.statePaths.pendingPushBackupDirectory,
    input.entry.backupRelativePath,
  );
  const backupHash = await readFileHashOrNull(backupPath);

  if (backupHash !== input.entry.backupHash || backupHash !== input.entry.snapshotHash) {
    throw new Error(
      `Interrupted Push backup integrity check failed for ${input.entry.relativePath}. Restore affected Project Root files manually before continuing.`,
    );
  }
}

async function assertPendingGeneratedIntegrity(input: {
  entry: PendingPush["affectedFiles"][number];
  statePaths: WorkspaceStatePaths;
}): Promise<void> {
  const generatedHash = await readFileHashOrNull(
    resolve(input.statePaths.generatedProjectDataDirectory, input.entry.relativePath),
  );

  if (generatedHash !== input.entry.generatedHash) {
    throw new Error(
      `Interrupted Push generated data integrity check failed for ${input.entry.relativePath}. Run compile before retrying push after manual restoration.`,
    );
  }
}

async function readFileHashOrNull(filePath: string): Promise<string | null> {
  try {
    return createHash("sha256")
      .update(await readFile(filePath))
      .digest("hex");
  } catch (error) {
    if (isMissingFileError(error)) {
      return null;
    }

    throw error;
  }
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
  await refreshSnapshotAndManifestAfterPush({
    affectedFiles,
    manifest,
    statePaths,
    workspaceRoot: workspace.workspaceRoot,
    config: workspace.config,
  });
  await rm(statePaths.pendingPushDirectory, { force: true, recursive: true });
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

async function refreshSnapshotAndManifestAfterPush(input: {
  affectedFiles: readonly string[];
  manifest: SyncManifest;
  statePaths: WorkspaceStatePaths;
  workspaceRoot: string;
  config: WorkspaceConfig;
}): Promise<void> {
  const snapshotFiles = new Map(
    input.manifest.snapshotFiles.map((entry) => [entry.relativePath, entry]),
  );
  const generatedFiles = new Map(
    (input.manifest.generatedFiles ?? []).map((entry) => [entry.relativePath, entry]),
  );

  for (const relativePath of input.affectedFiles) {
    const content = await readFile(
      resolve(input.statePaths.generatedProjectDataDirectory, relativePath),
    );
    const snapshotPath = resolve(input.statePaths.projectDataSnapshotDirectory, relativePath);

    await mkdir(dirname(snapshotPath), { recursive: true });
    await writeFile(snapshotPath, content);
    snapshotFiles.set(relativePath, {
      hash: createHash("sha256").update(content).digest("hex"),
      relativePath,
    });
  }

  const nextSnapshotFiles = [...snapshotFiles.values()].sort((left, right) =>
    left.relativePath.localeCompare(right.relativePath),
  );
  const compileBaseline =
    input.manifest.compileBaseline === undefined
      ? undefined
      : rewriteCompileBaselineSnapshotFiles(input.manifest.compileBaseline, nextSnapshotFiles);

  await writeSyncManifest(input.statePaths.syncManifestPath, {
    ...input.manifest,
    ...(compileBaseline === undefined ? {} : { compileBaseline }),
    generatedFiles: [...generatedFiles.values()].sort((left, right) =>
      left.relativePath.localeCompare(right.relativePath),
    ),
    snapshotFiles: nextSnapshotFiles,
  });
}

function isSafeProjectDataFileName(relativePath: string): boolean {
  return (
    relativePath === "CommonEvents.json" ||
    relativePath === "System.json" ||
    isCanonicalMapFileName(relativePath)
  );
}

function rewriteCompileBaselineSnapshotFiles(
  baseline: CompileBaseline,
  snapshotFiles: readonly FileHashEntry[],
): CompileBaseline {
  const baselineWithoutHash = {
    ...(baseline.compileContractVersion === undefined
      ? {}
      : { compileContractVersion: baseline.compileContractVersion }),
    ...(baseline.typeInputs === undefined ? {} : { typeInputs: baseline.typeInputs }),
    projectRootBinding: baseline.projectRootBinding,
    config: baseline.config,
    snapshotFiles: [...snapshotFiles],
    sourceFiles: baseline.sourceFiles,
  };

  return {
    ...baselineWithoutHash,
    hash: hashUtf8Content(writeStableJson(baselineWithoutHash)),
  };
}
