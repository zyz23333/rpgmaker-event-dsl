import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

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
import { loadWorkspace } from "./workspace.js";

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

export async function diffWorkspace(options: WorkspaceCommandOptions): Promise<never> {
  throw new Error(`diff workflow is not implemented yet for workspace ${options.workspaceRoot}.`);
}

export async function pushWorkspace(options: PushWorkspaceOptions): Promise<never> {
  const commandName = options.allowDestructive ? "push --allow-destructive" : "push";
  throw new Error(
    `${commandName} workflow is not implemented yet for workspace ${options.workspaceRoot}.`,
  );
}
