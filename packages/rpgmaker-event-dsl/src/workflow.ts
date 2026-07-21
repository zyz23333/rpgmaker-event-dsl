import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import {
  discoverDefinitionFiles,
  loadDefinitionFile,
  type DefinitionSourceDiscovery,
} from "./definitions.js";
import { decompileProjectDataSnapshot } from "./decompiler.js";
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
import {
  buildStructuredDiffReport,
  deriveAffectedProjectDataFiles,
  renderStructuredDiffReport,
} from "./structured-diff.js";
import { loadWorkspace } from "./workspace.js";
export { pushWorkspace } from "./workflow/push.js";
import {
  assertKnownSafeProjectDataFile,
  assertGeneratedProjectDataIntegrity,
  assertNoPendingInterruptedPushForNonPush,
  isMissingFileError,
  readJsonFiles,
} from "./workflow/push.js";

export type WorkspaceCommandOptions = {
  workspaceRoot: string;
};

export type CompileWorkspaceOptions = WorkspaceCommandOptions & {
  check: boolean;
};

export type PushWorkspaceOptions = WorkspaceCommandOptions & {
  allowDestructive: boolean;
};

export type DiffWorkspaceOptions = WorkspaceCommandOptions & {
  file?: string;
  short?: boolean;
};

export async function cloneWorkspace(options: WorkspaceCommandOptions): Promise<void> {
  await captureWorkspaceSnapshot(options, "clone");
}

export async function pullWorkspace(options: WorkspaceCommandOptions): Promise<void> {
  await captureWorkspaceSnapshot(options, "pull");
}

async function captureWorkspaceSnapshot(
  options: WorkspaceCommandOptions,
  commandName: string,
): Promise<void> {
  const workspace = await loadWorkspace(options.workspaceRoot);
  const statePaths = getWorkspaceStatePaths(workspace.workspaceRoot);

  await assertNoPendingInterruptedPushForNonPush({ statePaths, commandName });
  await captureStandardProjectDataSnapshot({
    dataDirectory: workspace.dataDirectory,
    statePaths,
  });
}

export async function decompileWorkspace(options: WorkspaceCommandOptions): Promise<void> {
  const workspace = await loadWorkspace(options.workspaceRoot);
  const statePaths = getWorkspaceStatePaths(workspace.workspaceRoot);

  await assertNoPendingInterruptedPushForNonPush({ statePaths, commandName: "decompile" });
  await assertProjectDataSnapshotExists(statePaths, "decompile");
  await decompileProjectDataSnapshot({
    sourceRoot: workspace.config.sourceRoot,
    statePaths,
    workspaceRoot: workspace.workspaceRoot,
  });
}

export async function compileWorkspace(options: CompileWorkspaceOptions): Promise<void> {
  const workspace = await loadWorkspace(options.workspaceRoot);
  const statePaths = getWorkspaceStatePaths(workspace.workspaceRoot);
  const commandName = options.check ? "compile --check" : "compile";

  await assertNoPendingInterruptedPushForNonPush({ statePaths, commandName });
  const manifest = await assertProjectDataSnapshotExists(statePaths, commandName);
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

  await assertNoPendingInterruptedPushForNonPush({
    statePaths,
    commandName: "isGeneratedProjectDataFresh",
  });
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

export async function readCurrentSnapshotFileHashes(
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
    classes: await readSnapshotArray(statePaths, "Classes.json"),
    commonEvents: await readSnapshotArray(statePaths, "CommonEvents.json"),
    enemies: await readSnapshotArray(statePaths, "Enemies.json"),
    items: await readSnapshotArray(statePaths, "Items.json"),
    mapInfos: parseMapInfos(await readSnapshotFile(statePaths, "MapInfos.json")),
    skills: await readSnapshotArray(statePaths, "Skills.json"),
    states: await readSnapshotArray(statePaths, "States.json"),
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

export async function diffWorkspace(options: DiffWorkspaceOptions): Promise<string> {
  const workspace = await loadWorkspace(options.workspaceRoot);
  const statePaths = getWorkspaceStatePaths(workspace.workspaceRoot);

  await assertNoPendingInterruptedPushForNonPush({ statePaths, commandName: "diff" });
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
  if (options.file !== undefined) {
    assertKnownSafeProjectDataFile(options.file, generatedFiles);
  }

  const report = buildStructuredDiffReport({ generated, snapshot });
  const affectedFiles = deriveAffectedProjectDataFiles({ generated, snapshot });
  const renderOptions = {
    affectedFiles,
    ...(options.file === undefined ? {} : { file: options.file }),
    ...(options.short === undefined ? {} : { short: options.short }),
  };

  return renderStructuredDiffReport(report, renderOptions);
}
