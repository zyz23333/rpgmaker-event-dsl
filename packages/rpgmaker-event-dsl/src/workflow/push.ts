import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";

import { discoverDefinitionFiles } from "../definitions.js";
import {
  isCompileBaselineFresh,
  type CompileBaseline,
  type FileHashEntry,
} from "../materialization.js";
import {
  getWorkspaceStatePaths,
  hashUtf8Content,
  readPendingPush,
  writeSyncManifest,
  type PendingPush,
  type SyncManifest,
  type WorkspaceStatePaths,
} from "../state.js";
import { buildStructuredDiffReport, deriveAffectedProjectDataFiles } from "../structured-diff.js";
import { loadWorkspace, type LoadedWorkspace, type WorkspaceConfig } from "../workspace.js";
import { writeStableJson } from "../writer.js";
import type { PushWorkspaceOptions } from "../workflow.js";
import { assertProjectDataSnapshotExists, readCurrentSnapshotFileHashes } from "../workflow.js";

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

  const states = await classifyInterruptedPushFiles({
    dataDirectory: input.workspace.dataDirectory,
    pendingPush,
    statePaths: input.statePaths,
  });
  const stateSet = new Set(states.map(({ state }) => state));

  if (stateSet.size === 1 && stateSet.has("generated")) {
    await completeInterruptedPush({
      affectedFiles: pendingPush.affectedFiles.map(({ relativePath }) => relativePath),
      manifest: await assertProjectDataSnapshotExists(input.statePaths, "push"),
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
      const content = await readFile(snapshotPath, "utf8");
      const backupHash = hashUtf8Content(content);

      await mkdir(dirname(backupPath), { recursive: true });
      await writeFile(backupPath, content, "utf8");
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
        affectedFiles,
        startedAt: new Date().toISOString(),
        version: 1,
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
      "utf8",
    );
    const snapshotPath = resolve(input.statePaths.projectDataSnapshotDirectory, relativePath);

    await mkdir(dirname(snapshotPath), { recursive: true });
    await writeFile(snapshotPath, content, "utf8");
    snapshotFiles.set(relativePath, {
      hash: hashUtf8Content(content),
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
    return hashUtf8Content(await readFile(filePath, "utf8"));
  } catch (error) {
    if (isMissingFileError(error)) {
      return null;
    }

    throw error;
  }
}

export function isMissingFileError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string" &&
    (error as { code?: string }).code === "ENOENT"
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

  const currentGeneratedFiles = await Promise.all(
    manifest.generatedFiles.map(async ({ relativePath }) => ({
      hash: hashUtf8Content(
        await readFile(resolve(statePaths.generatedProjectDataDirectory, relativePath), "utf8"),
      ),
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
  const commandName = options.allowDestructive ? "push --allow-destructive" : "push";
  const workspace = await loadWorkspace(options.workspaceRoot);
  const statePaths = getWorkspaceStatePaths(workspace.workspaceRoot);

  await resolvePendingInterruptedPushForPush({ workspace, statePaths });

  const manifest = await assertProjectDataSnapshotExists(statePaths, commandName);

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
  if (affectedFiles.length === 0) {
    return;
  }

  await assertNoProjectDrift({
    affectedFiles,
    dataDirectory: workspace.dataDirectory,
    manifest,
  });

  const stagedWrite = await stageProjectRootWrites({
    affectedFiles,
    dataDirectory: workspace.dataDirectory,
    statePaths,
  });
  await createPendingPushState({
    affectedFiles,
    generatedFiles,
    manifest,
    statePaths,
  });
  const writtenFiles: string[] = [];
  const snapshotHashes = new Map(
    manifest.snapshotFiles.map((entry) => [entry.relativePath, entry.hash]),
  );

  try {
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
  } catch (error) {
    await rm(stagedWrite.directory, { force: true, recursive: true });
    const written = writtenFiles.length > 0 ? writtenFiles.join(", ") : "none";
    throw new Error(`Project Root replacement failed during push after writing: ${written}.`, {
      cause: error,
    });
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
  affectedFiles: readonly string[];
  dataDirectory: string;
  manifest: SyncManifest;
}): Promise<void> {
  const snapshotHashes = new Map(
    input.manifest.snapshotFiles.map((entry) => [entry.relativePath, entry.hash]),
  );

  for (const relativePath of input.affectedFiles) {
    const expectedHash = snapshotHashes.get(relativePath);
    if (expectedHash === undefined) {
      throw new Error(`Project Drift detected before push for ${relativePath}. Run pull first.`);
    }

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
    return hashUtf8Content(await readFile(resolve(dataDirectory, relativePath), "utf8"));
  } catch (error) {
    throw new Error(`Project Drift detected before push for ${relativePath}. Run pull first.`, {
      cause: error,
    });
  }
}

async function stageProjectRootWrites(input: {
  affectedFiles: readonly string[];
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
      await writeFile(stagedPath, await readFile(generatedPath, "utf8"), "utf8");
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

async function replaceProjectRootFile(
  stagedFile: {
    relativePath: string;
    stagedPath: string;
    targetPath: string;
    originalPath: string;
  },
  expectedHash: string,
): Promise<void> {
  const conflictPath = `${stagedFile.targetPath}.rpgmaker-event-dsl-conflict-${randomUUID()}`;
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

    const concurrentTargetHash = await readFileHashOrNull(stagedFile.targetPath);
    if (concurrentTargetHash !== null && concurrentTargetHash !== expectedHash) {
      throw new Error(
        `Project Drift detected during push for ${stagedFile.relativePath}. Run pull first.`,
      );
    }

    await rename(stagedFile.stagedPath, stagedFile.targetPath);
    replacementInstalled = true;
  } catch (error) {
    if (replacementInstalled) {
      await rm(stagedFile.targetPath, { force: true });
    } else if (originalCaptured && (await readFileHashOrNull(stagedFile.targetPath)) !== null) {
      await rename(stagedFile.targetPath, conflictPath);
    }
    if (originalCaptured) {
      try {
        await rename(stagedFile.originalPath, stagedFile.targetPath);
      } catch (restoreError) {
        if (!isMissingFileError(restoreError)) {
          throw new Error(`Failed to restore Project Root file ${stagedFile.relativePath}.`, {
            cause: restoreError,
          });
        }
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
      "utf8",
    );
    const snapshotPath = resolve(input.statePaths.projectDataSnapshotDirectory, relativePath);

    await mkdir(dirname(snapshotPath), { recursive: true });
    await writeFile(snapshotPath, content, "utf8");
    snapshotFiles.set(relativePath, {
      hash: hashUtf8Content(content),
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
    /^Map\d{3}\.json$/u.test(relativePath)
  );
}

function rewriteCompileBaselineSnapshotFiles(
  baseline: CompileBaseline,
  snapshotFiles: readonly FileHashEntry[],
): CompileBaseline {
  const baselineWithoutHash = {
    config: baseline.config,
    snapshotFiles: [...snapshotFiles],
    sourceFiles: baseline.sourceFiles,
  };

  return {
    ...baselineWithoutHash,
    hash: hashUtf8Content(writeStableJson(baselineWithoutHash)),
  };
}
