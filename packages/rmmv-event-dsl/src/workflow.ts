import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";

import {
  discoverDefinitionFiles,
  loadDefinitionFile,
  type DefinitionSourceDiscovery,
} from "./definitions.js";
import type { DslOwnedDeclaration } from "./dsl.js";
import {
  buildCompileBaseline,
  isCompileBaselineFresh,
  materializeCompileOutput,
  type FileHashEntry,
} from "./materialization.js";
import { parseMapInfos } from "./project.js";
import {
  captureStandardProjectDataSnapshot,
  getWorkspaceStatePaths,
  hashUtf8Content,
  readSyncManifest,
  writeSyncManifest,
  type SyncManifest,
  type WorkspaceStatePaths,
} from "./state.js";
import {
  buildStagedDataGraph,
  buildSnapshotReferenceInput,
  validateStagedDataGraph,
  type SnapshotReferenceInput,
  type SnapshotReferenceSource,
} from "./staged-graph.js";
import { buildStructuredDiffReport, renderStructuredDiffReport } from "./structured-diff.js";
import { loadWorkspace, type LoadedWorkspace, type WorkspaceConfig } from "./workspace.js";
import { writeStableJson } from "./writer.js";

export type WorkspaceCommandOptions = {
  workspaceRoot: string;
};

export type CompileWorkspaceOptions = WorkspaceCommandOptions & {
  check: boolean;
};

export type PushWorkspaceOptions = WorkspaceCommandOptions & {
  allowDestructive: boolean;
};

export async function cloneWorkspace(options: WorkspaceCommandOptions): Promise<void> {
  const workspace = await loadWorkspace(options.workspaceRoot);
  const statePaths = getWorkspaceStatePaths(workspace.workspaceRoot);

  await captureStandardProjectDataSnapshot({
    dataDirectory: workspace.dataDirectory,
    statePaths,
  });
}

export async function pullWorkspace(options: WorkspaceCommandOptions): Promise<void> {
  await cloneWorkspace(options);
}

export async function decompileWorkspace(options: WorkspaceCommandOptions): Promise<never> {
  throw new Error(
    `decompile workflow is not implemented yet for workspace ${options.workspaceRoot}.`,
  );
}

export async function compileWorkspace(options: CompileWorkspaceOptions): Promise<void> {
  const workspace = await loadWorkspace(options.workspaceRoot);
  const statePaths = getWorkspaceStatePaths(workspace.workspaceRoot);
  const manifest = await assertProjectDataSnapshotExists(
    statePaths,
    options.check ? "compile --check" : "compile",
  );
  const definitionInput = await loadDiscoveredDefinitionInput(workspace.workspaceRoot, {
    sourceRoot: workspace.config.sourceRoot,
    sourceInclude: workspace.config.sourceInclude,
    sourceExclude: workspace.config.sourceExclude,
  });

  const snapshotReferences = await loadSnapshotReferenceInput(statePaths);
  const graph = buildStagedDataGraph({
    declarations: definitionInput.declarations,
    snapshotReferences,
  });
  const validation = validateStagedDataGraph(graph, {
    scriptEnabled: workspace.config.scriptEnabled,
  });

  const errors = validation.issues.filter((issue) => issue.level === "error");
  if (errors.length > 0) {
    const commandName = options.check ? "compile --check" : "compile";
    throw new Error(
      [`${commandName} validation failed:`, ...errors.map((issue) => `- ${issue.message}`)].join(
        "\n",
      ),
    );
  }

  if (options.check) {
    return;
  }

  const snapshotFiles = await readCurrentSnapshotFileHashes(statePaths, manifest.snapshotFiles);
  const output = await materializeCompileOutput({
    declarations: definitionInput.declarations,
    resolver: graph.resolver,
    statePaths,
  });
  const compileBaseline = await buildCompileBaseline({
    config: workspace.config,
    snapshotFiles,
    sourceFiles: definitionInput.files,
    workspaceRoot: workspace.workspaceRoot,
  });

  await writeSyncManifest(statePaths.syncManifestPath, {
    ...manifest,
    compileBaseline,
    generatedFiles: output.generatedFiles,
    snapshotFiles,
  });
}

export async function isGeneratedProjectDataFresh(
  options: WorkspaceCommandOptions,
): Promise<boolean> {
  const workspace = await loadWorkspace(options.workspaceRoot);
  const statePaths = getWorkspaceStatePaths(workspace.workspaceRoot);
  const manifest = await readSyncManifest(statePaths.syncManifestPath);

  if (manifest?.compileBaseline === undefined) {
    return false;
  }

  const files = await discoverDefinitionFiles(workspace.workspaceRoot, {
    sourceRoot: workspace.config.sourceRoot,
    sourceInclude: workspace.config.sourceInclude,
    sourceExclude: workspace.config.sourceExclude,
  });
  const snapshotFiles = await readCurrentSnapshotFileHashes(statePaths, manifest.snapshotFiles);

  return isCompileBaselineFresh({
    baseline: manifest.compileBaseline,
    config: workspace.config,
    snapshotFiles,
    sourceFiles: files,
    workspaceRoot: workspace.workspaceRoot,
  });
}

async function assertProjectDataSnapshotExists(
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

async function loadDiscoveredDefinitionInput(
  workspaceRoot: string,
  discovery: DefinitionSourceDiscovery,
): Promise<{ declarations: DslOwnedDeclaration[]; files: string[] }> {
  const files = await discoverDefinitionFiles(workspaceRoot, discovery);
  const declarations: DslOwnedDeclaration[] = [];

  for (const file of files) {
    declarations.push(...(await loadDefinitionFile(file)));
  }

  return { declarations, files };
}

async function readCurrentSnapshotFileHashes(
  statePaths: WorkspaceStatePaths,
  snapshotFiles: readonly FileHashEntry[],
): Promise<FileHashEntry[]> {
  const entries = await Promise.all(
    snapshotFiles.map(async ({ relativePath }) => ({
      hash: hashUtf8Content(await readSnapshotFile(statePaths, relativePath)),
      relativePath,
    })),
  );

  return entries.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

async function loadSnapshotReferenceInput(
  statePaths: WorkspaceStatePaths,
): Promise<SnapshotReferenceInput> {
  const snapshotSource: SnapshotReferenceSource = {
    actors: await readSnapshotArray(statePaths, "Actors.json"),
    armors: await readSnapshotArray(statePaths, "Armors.json"),
    commonEvents: await readSnapshotArray(statePaths, "CommonEvents.json"),
    items: await readSnapshotArray(statePaths, "Items.json"),
    mapInfos: parseMapInfos(await readSnapshotFile(statePaths, "MapInfos.json")),
    troops: await readSnapshotArray(statePaths, "Troops.json"),
    system: await readSnapshotObject(statePaths, "System.json"),
    weapons: await readSnapshotArray(statePaths, "Weapons.json"),
  };

  return buildSnapshotReferenceInput(snapshotSource);
}

async function readSnapshotArray(
  statePaths: WorkspaceStatePaths,
  relativePath: string,
): Promise<(Record<string, unknown> | null | undefined)[]> {
  const parsed = JSON.parse(await readSnapshotFile(statePaths, relativePath));
  if (!Array.isArray(parsed)) {
    throw new Error(`Expected snapshot ${relativePath} to contain a JSON array.`);
  }

  return parsed as (Record<string, unknown> | null | undefined)[];
}

async function readSnapshotObject(
  statePaths: WorkspaceStatePaths,
  relativePath: string,
): Promise<Record<string, unknown>> {
  const parsed = JSON.parse(await readSnapshotFile(statePaths, relativePath));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Expected snapshot ${relativePath} to contain a JSON object.`);
  }

  return parsed as Record<string, unknown>;
}

async function readSnapshotFile(
  statePaths: WorkspaceStatePaths,
  relativePath: string,
): Promise<string> {
  return readFile(resolve(statePaths.projectDataSnapshotDirectory, relativePath), "utf8");
}

function isMissingFileError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string" &&
    (error as { code?: string }).code === "ENOENT"
  );
}

export async function diffWorkspace(options: WorkspaceCommandOptions): Promise<string> {
  const workspace = await loadWorkspace(options.workspaceRoot);
  const statePaths = getWorkspaceStatePaths(workspace.workspaceRoot);
  const manifest = await assertProjectDataSnapshotExists(statePaths, "diff");

  await assertGeneratedProjectDataIntegrity(statePaths, manifest, "diff");

  const files = await discoverDefinitionFiles(workspace.workspaceRoot, {
    sourceRoot: workspace.config.sourceRoot,
    sourceInclude: workspace.config.sourceInclude,
    sourceExclude: workspace.config.sourceExclude,
  });
  const snapshotFiles = await readCurrentSnapshotFileHashes(statePaths, manifest.snapshotFiles);

  if (
    manifest.compileBaseline === undefined ||
    !(await isCompileBaselineFresh({
      baseline: manifest.compileBaseline,
      config: workspace.config,
      snapshotFiles,
      sourceFiles: files,
      workspaceRoot: workspace.workspaceRoot,
    }))
  ) {
    throw new Error("Generated Project Data is stale before diff. Run compile first.");
  }

  const generatedFiles = manifest.generatedFiles ?? [];
  const generated = await readJsonFiles(statePaths.generatedProjectDataDirectory, generatedFiles);
  const snapshot = await readJsonFiles(statePaths.projectDataSnapshotDirectory, generatedFiles);
  const report = buildStructuredDiffReport({ generated, snapshot });

  return renderStructuredDiffReport(report);
}

async function assertGeneratedProjectDataIntegrity(
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

async function readJsonFiles(
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
  const writtenFiles: string[] = [];

  try {
    for (const stagedFile of stagedWrite.files) {
      await rm(stagedFile.targetPath, { force: true });
      await rename(stagedFile.stagedPath, stagedFile.targetPath);
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

function deriveAffectedProjectDataFiles(input: {
  generated: ReadonlyMap<string, unknown>;
  snapshot: ReadonlyMap<string, unknown>;
}): string[] {
  return [...input.generated.keys()]
    .filter((relativePath) => {
      return !isJsonEqual(input.generated.get(relativePath), input.snapshot.get(relativePath));
    })
    .sort((left, right) => left.localeCompare(right));
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
  files: Array<{ relativePath: string; stagedPath: string; targetPath: string }>;
}> {
  const stagingDirectory = resolve(
    input.dataDirectory,
    `push-staging.tmp-${process.pid}-${randomUUID()}`,
  );
  const files: Array<{ relativePath: string; stagedPath: string; targetPath: string }> = [];

  await rm(stagingDirectory, { force: true, recursive: true });
  await mkdir(stagingDirectory, { recursive: true });

  try {
    for (const relativePath of input.affectedFiles) {
      const generatedPath = resolve(input.statePaths.generatedProjectDataDirectory, relativePath);
      const stagedPath = resolve(stagingDirectory, relativePath);

      await mkdir(dirname(stagedPath), { recursive: true });
      await writeFile(stagedPath, await readFile(generatedPath, "utf8"), "utf8");
      files.push({
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
  const sourceFiles = await discoverDefinitionFiles(input.workspaceRoot, {
    sourceRoot: input.config.sourceRoot,
    sourceInclude: input.config.sourceInclude,
    sourceExclude: input.config.sourceExclude,
  });
  const compileBaseline = await buildCompileBaseline({
    config: input.config,
    snapshotFiles: nextSnapshotFiles,
    sourceFiles,
    workspaceRoot: input.workspaceRoot,
  });

  await writeSyncManifest(input.statePaths.syncManifestPath, {
    ...input.manifest,
    compileBaseline,
    generatedFiles: [...generatedFiles.values()].sort((left, right) =>
      left.relativePath.localeCompare(right.relativePath),
    ),
    snapshotFiles: nextSnapshotFiles,
  });
}

function isJsonEqual(left: unknown, right: unknown): boolean {
  return writeStableJson(left) === writeStableJson(right);
}
