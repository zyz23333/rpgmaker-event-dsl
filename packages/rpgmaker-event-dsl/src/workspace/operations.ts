import { readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

import {
  discoverDefinitionFiles,
  loadDefinitionFile,
  type DefinitionSourceDiscovery,
} from "./definitions.js";
import { decompileProjectDataSnapshot } from "../decompiler/project.js";
import type { DslOwnedDeclaration } from "../domain/types.js";
import {
  buildCompileBaseline,
  isCompileBaselineFresh,
  materializeCompileOutput,
  type FileHashEntry,
} from "../project-data/materialization.js";
import { parseMapInfos } from "../project-data/project.js";
import {
  captureStandardProjectDataSnapshot,
  getWorkspaceStatePaths,
  hashUtf8Content,
  readSyncManifest,
  writeSyncManifest,
  type WorkspaceStatePaths,
} from "./state.js";
import {
  buildStagedDataGraph,
  buildSnapshotReferenceInput,
  validateStagedDataGraph,
  type SnapshotReferenceInput,
  type SnapshotReferenceSource,
} from "../validation/staged-graph.js";
import type { SnapshotMapValidationEntry } from "../validation/types.js";
import {
  buildStructuredDiffReport,
  deriveAffectedProjectDataFiles,
  renderStructuredDiffReport,
} from "../project-data/structured-diff.js";
import { loadWorkspace } from "./config.js";
import {
  assertKnownSafeProjectDataFile,
  assertGeneratedProjectDataIntegrity,
  assertNoPendingInterruptedPushForNonPush,
  readJsonFiles,
} from "./push.js";
import { assertProjectDataSnapshotExists, readCurrentSnapshotFileHashes } from "./checks.js";
import type {
  CompileWorkspaceOptions,
  DiffWorkspaceOptions,
  WorkspaceCommandOptions,
} from "./types.js";

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

  const snapshotInput = await loadSnapshotValidationInput(statePaths);
  const graph = buildStagedDataGraph({
    declarations: definitionInput.declarations,
    snapshotReferences: snapshotInput.references,
    snapshotMaps: snapshotInput.maps,
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
    sourceFileHashes: definitionInput.sourceFileHashes,
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

async function loadDiscoveredDefinitionInput(
  workspaceRoot: string,
  discovery: DefinitionSourceDiscovery,
): Promise<{
  declarations: DslOwnedDeclaration[];
  files: string[];
  sourceFileHashes: FileHashEntry[];
}> {
  const files = await discoverDefinitionFiles(workspaceRoot, discovery);
  const declarations: DslOwnedDeclaration[] = [];
  const sourceFileHashes: FileHashEntry[] = [];

  for (const file of files) {
    const sourceBefore = await readFile(file, "utf8");
    declarations.push(...(await loadDefinitionFile(file)));
    const sourceAfter = await readFile(file, "utf8");
    const beforeHash = hashUtf8Content(sourceBefore);
    if (beforeHash !== hashUtf8Content(sourceAfter)) {
      throw new Error(`Definition Source changed while compiling: ${file}. Run compile again.`);
    }
    sourceFileHashes.push({
      hash: beforeHash,
      relativePath: relative(workspaceRoot, file).split(/[/\\]/u).join("/"),
    });
  }

  sourceFileHashes.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
  return { declarations, files, sourceFileHashes };
}

async function loadSnapshotValidationInput(
  statePaths: WorkspaceStatePaths,
): Promise<{ references: SnapshotReferenceInput; maps: SnapshotMapValidationEntry[] }> {
  const mapInfos = parseMapInfos(await readSnapshotFile(statePaths, "MapInfos.json"));
  const snapshotSource: SnapshotReferenceSource = {
    actors: await readSnapshotArray(statePaths, "Actors.json"),
    armors: await readSnapshotArray(statePaths, "Armors.json"),
    classes: await readSnapshotArray(statePaths, "Classes.json"),
    commonEvents: await readSnapshotArray(statePaths, "CommonEvents.json"),
    enemies: await readSnapshotArray(statePaths, "Enemies.json"),
    items: await readSnapshotArray(statePaths, "Items.json"),
    mapInfos,
    skills: await readSnapshotArray(statePaths, "Skills.json"),
    states: await readSnapshotArray(statePaths, "States.json"),
    troops: await readSnapshotArray(statePaths, "Troops.json"),
    system: await readSnapshotObject(statePaths, "System.json"),
    weapons: await readSnapshotArray(statePaths, "Weapons.json"),
  };

  const maps = await Promise.all(
    mapInfos.map(async ({ id }) => readSnapshotMapValidationEntry(statePaths, id)),
  );

  return { references: buildSnapshotReferenceInput(snapshotSource), maps };
}

async function readSnapshotMapValidationEntry(
  statePaths: WorkspaceStatePaths,
  mapId: number,
): Promise<SnapshotMapValidationEntry> {
  const relativePath = `Map${mapId.toString().padStart(3, "0")}.json`;
  const map = await readSnapshotObject(statePaths, relativePath);
  const width = readOptionalMapDimension(map.width, relativePath, "width");
  const height = readOptionalMapDimension(map.height, relativePath, "height");
  const events = Array.isArray(map.events) ? map.events : [];
  const eventLocations = events.flatMap((event) => {
    if (event === null || typeof event !== "object" || Array.isArray(event)) {
      return [];
    }
    const record = event as Record<string, unknown>;
    if (
      typeof record.id !== "number" ||
      !Number.isInteger(record.id) ||
      typeof record.x !== "number" ||
      !Number.isInteger(record.x) ||
      typeof record.y !== "number" ||
      !Number.isInteger(record.y)
    ) {
      return [];
    }
    return [{ eventId: record.id, x: record.x, y: record.y }];
  });

  return {
    id: mapId,
    ...(width === undefined ? {} : { width }),
    ...(height === undefined ? {} : { height }),
    eventLocations,
  };
}

function readOptionalMapDimension(
  value: unknown,
  relativePath: string,
  fieldName: string,
): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error(`Expected snapshot ${relativePath} ${fieldName} to be a positive integer.`);
  }
  return value;
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
