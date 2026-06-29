import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import {
  discoverDefinitionFiles,
  loadDefinitionFile,
  type DefinitionSourceDiscovery,
} from "./definitions.js";
import type { DslOwnedDeclaration } from "./dsl.js";
import { parseMapInfos } from "./project.js";
import {
  captureStandardProjectDataSnapshot,
  getWorkspaceStatePaths,
  readSyncManifest,
  type WorkspaceStatePaths,
} from "./state.js";
import {
  buildSnapshotReferenceInput,
  validateDslOwnedDeclarations,
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
  if (!options.check) {
    throw new Error(
      `compile workflow is not implemented yet for workspace ${options.workspaceRoot}.`,
    );
  }

  const workspace = await loadWorkspace(options.workspaceRoot);
  const statePaths = getWorkspaceStatePaths(workspace.workspaceRoot);
  await assertProjectDataSnapshotExists(statePaths);

  const declarations = await loadDiscoveredDeclarations(workspace.workspaceRoot, {
    sourceRoot: workspace.config.sourceRoot,
    sourceInclude: workspace.config.sourceInclude,
    sourceExclude: workspace.config.sourceExclude,
  });
  const snapshotReferences = await loadSnapshotReferenceInput(statePaths);
  const validation = validateDslOwnedDeclarations(declarations, {
    scriptEnabled: workspace.config.scriptEnabled,
    snapshotReferences,
  });

  const errors = validation.issues.filter((issue) => issue.level === "error");
  if (errors.length > 0) {
    throw new Error(
      ["compile --check validation failed:", ...errors.map((issue) => `- ${issue.message}`)].join(
        "\n",
      ),
    );
  }
}

async function assertProjectDataSnapshotExists(statePaths: WorkspaceStatePaths): Promise<void> {
  const manifest = await readSyncManifest(statePaths.syncManifestPath);
  if (manifest === null) {
    throw new Error(
      "Project Data Snapshot is required before compile --check. Run clone or pull first.",
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
      "Project Data Snapshot is required before compile --check. Run clone or pull first.",
    );
  }
}

async function loadDiscoveredDeclarations(
  workspaceRoot: string,
  discovery: DefinitionSourceDiscovery,
): Promise<DslOwnedDeclaration[]> {
  const files = await discoverDefinitionFiles(workspaceRoot, discovery);
  const declarations: DslOwnedDeclaration[] = [];

  for (const file of files) {
    declarations.push(...(await loadDefinitionFile(file)));
  }

  return declarations;
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
