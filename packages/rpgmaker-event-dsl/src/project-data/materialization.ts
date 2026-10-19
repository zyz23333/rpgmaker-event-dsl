import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, posix, relative, resolve } from "node:path";
import { randomUUID } from "node:crypto";

import type {
  CommonEventDefinition,
  DslOwnedDeclaration,
  MapEventDefinition,
  SwitchDefinition,
  VariableDefinition,
  TroopEventDefinition,
} from "../domain/types.js";
import { compileBattlePage, compileCommonEvent, compileMapEvent } from "../compiler/events.js";
import { blankBattleEventPage } from "../domain/battle-page-defaults.js";
import { parseMapInfos } from "./project.js";
import type { ReferenceResolver } from "../validation/types.js";
import {
  hashUtf8Content,
  readProjectDataSnapshotFile,
  type SyncManifest,
  type WorkspaceStatePaths,
} from "../workspace/state.js";
import type { WorkspaceConfig } from "../workspace/config.js";
import { writeStableJson } from "./writer.js";
import { assertCompileOutput } from "../validation/compile-output.js";
import {
  compileContractVersion,
  typeInputsUnchanged,
  type TypeInput,
} from "../workspace/type-inputs.js";

export type CompileBaseline = NonNullable<SyncManifest["compileBaseline"]>;
export type FileHashEntry = {
  hash: string;
  relativePath: string;
};

export type MaterializeCompileOutputOptions = {
  statePaths: WorkspaceStatePaths;
  declarations: readonly DslOwnedDeclaration[];
  resolver: ReferenceResolver;
  scriptEnabled: boolean;
};

export type MaterializedCompileOutput = {
  generatedFiles: FileHashEntry[];
};

export type CompileOutputCandidate = { files: ReadonlyMap<string, string> };

export type CompileBaselineInput = {
  projectRootBinding: string;
  workspaceRoot: string;
  config: WorkspaceConfig;
  sourceFiles: readonly string[];
  sourceFileHashes?: readonly FileHashEntry[];
  typeInputs?: readonly TypeInput[];
  snapshotFiles: readonly FileHashEntry[];
};

export async function expectedCompileOutputFileNames(
  statePaths: WorkspaceStatePaths,
): Promise<string[]> {
  return [
    "CommonEvents.json",
    "System.json",
    "Troops.json",
    ...parseMapInfos(await readSnapshotFile(statePaths, "MapInfos.json")).map(({ id }) =>
      formatMapFileName(id),
    ),
  ].sort();
}

export async function buildCompileOutput(
  options: MaterializeCompileOutputOptions,
): Promise<CompileOutputCandidate> {
  const mapInfos = parseMapInfos(await readSnapshotFile(options.statePaths, "MapInfos.json"));
  const files = new Map<string, unknown>();
  const troopDefinitions = new Map(
    options.declarations
      .filter(
        (declaration): declaration is TroopEventDefinition => declaration.kind === "troopEvent",
      )
      .map((declaration) => [declaration.troopId, declaration]),
  );
  files.set(
    "Troops.json",
    (await readSnapshotArray(options.statePaths, "Troops.json")).map((entry, index) => {
      if (entry === null) return null;
      if (
        !entry ||
        typeof entry !== "object" ||
        Array.isArray(entry) ||
        (entry as { id?: unknown }).id !== index ||
        index <= 0
      )
        throw new Error(
          `Snapshot Troops.json[${index}]: expected actual Troop with positive matching ID or null.`,
        );
      const definition = troopDefinitions.get(index);
      return {
        ...entry,
        pages: definition
          ? definition.pages.map((page) => compileBattlePage(page, options.resolver))
          : [blankBattleEventPage()],
      };
    }),
  );

  for (const mapInfo of mapInfos) {
    const relativePath = formatMapFileName(mapInfo.id);
    const mapData = await readSnapshotObject(options.statePaths, relativePath);
    files.set(
      relativePath,
      materializeMapCarrier(
        mapData,
        options.declarations.filter(
          (declaration): declaration is MapEventDefinition =>
            declaration.kind === "mapEvent" && declaration.mapId === mapInfo.id,
        ),
        options.resolver,
      ),
    );
  }

  files.set(
    "CommonEvents.json",
    materializeCommonEventsCarrier(
      await readSnapshotArray(options.statePaths, "CommonEvents.json"),
      options.declarations.filter(
        (declaration): declaration is CommonEventDefinition => declaration.kind === "commonEvent",
      ),
      options.resolver,
    ),
  );

  files.set(
    "System.json",
    materializeSystemCarrier(
      await readSnapshotObject(options.statePaths, "System.json"),
      options.declarations.filter(
        (declaration): declaration is SwitchDefinition => declaration.kind === "switchDefinition",
      ),
      options.declarations.filter(
        (declaration): declaration is VariableDefinition =>
          declaration.kind === "variableDefinition",
      ),
    ),
  );

  assertCompileOutput(files, options.resolver, options.scriptEnabled);
  return { files: new Map([...files].map(([path, value]) => [path, writeStableJson(value)])) };
}

export async function publishCompileOutput(
  statePaths: WorkspaceStatePaths,
  candidate: CompileOutputCandidate,
  assertInputsUnchanged: () => Promise<void>,
): Promise<MaterializedCompileOutput> {
  return writeGeneratedProjectData(statePaths, candidate.files, assertInputsUnchanged);
}

export async function buildCompileBaseline(input: CompileBaselineInput): Promise<CompileBaseline> {
  const sourceFiles =
    input.sourceFileHashes === undefined
      ? await Promise.all(
          input.sourceFiles.map(async (filePath) => ({
            hash: hashUtf8Content(await readFile(filePath, "utf8")),
            relativePath: toPosixPath(relative(input.workspaceRoot, filePath)),
          })),
        )
      : [...input.sourceFileHashes];
  sourceFiles.sort((left, right) => left.relativePath.localeCompare(right.relativePath));

  const snapshotFiles = [...input.snapshotFiles].sort((left, right) =>
    left.relativePath.localeCompare(right.relativePath),
  );
  const config = {
    scriptEnabled: input.config.scriptEnabled,
    sourceExclude: [...input.config.sourceExclude],
    sourceInclude: [...input.config.sourceInclude],
    sourceRoot: input.config.sourceRoot,
  };
  const baselineWithoutHash = {
    compileContractVersion,
    typeInputs: [...(input.typeInputs ?? [])],
    projectRootBinding: input.projectRootBinding,
    config,
    snapshotFiles,
    sourceFiles,
  };

  return {
    ...baselineWithoutHash,
    hash: hashUtf8Content(writeStableJson(baselineWithoutHash)),
  };
}

export async function isCompileBaselineFresh(input: {
  projectRootBinding: string;
  baseline: CompileBaseline;
  workspaceRoot: string;
  config: WorkspaceConfig;
  sourceFiles: readonly string[];
  snapshotFiles: readonly FileHashEntry[];
}): Promise<boolean> {
  if (
    input.baseline.compileContractVersion !== compileContractVersion ||
    input.baseline.typeInputs === undefined ||
    !typeInputsUnchanged(input.baseline.typeInputs)
  )
    return false;
  try {
    const currentBaseline = await buildCompileBaseline({
      ...input,
      typeInputs: input.baseline.typeInputs,
    });
    return currentBaseline.hash === input.baseline.hash;
  } catch {
    return false;
  }
}

function materializeMapCarrier(
  snapshotMapData: Record<string, unknown>,
  definitions: readonly MapEventDefinition[],
  resolver: ReferenceResolver,
): Record<string, unknown> {
  const snapshotEvents = Array.isArray(snapshotMapData.events) ? snapshotMapData.events : [];
  const highestDefinitionId = highestId(definitions);
  const length = Math.max(snapshotEvents.length, highestDefinitionId + 1, 1);
  const events = createDenseArray<unknown>(length, null);

  for (const definition of definitions) {
    events[definition.id] = compileMapEvent(definition, {
      nextId: definition.id,
      resolver,
    });
  }

  return {
    ...snapshotMapData,
    events,
  };
}

function materializeCommonEventsCarrier(
  snapshotCommonEvents: readonly unknown[],
  definitions: readonly CommonEventDefinition[],
  resolver: ReferenceResolver,
): unknown[] {
  const length = Math.max(snapshotCommonEvents.length, highestId(definitions) + 1, 1);
  const output = createDenseArray<unknown>(length, null);

  for (const definition of definitions) {
    output[definition.id] = compileCommonEvent(definition, {
      nextId: definition.id,
      resolver,
    });
  }

  return output;
}

function materializeSystemCarrier(
  snapshotSystem: Record<string, unknown>,
  switches: readonly SwitchDefinition[],
  variables: readonly VariableDefinition[],
): Record<string, unknown> {
  return {
    ...snapshotSystem,
    switches: materializeSystemNames(snapshotSystem.switches, switches),
    variables: materializeSystemNames(snapshotSystem.variables, variables),
  };
}

function materializeSystemNames(
  snapshotValue: unknown,
  definitions: readonly (SwitchDefinition | VariableDefinition)[],
): string[] {
  const snapshotLength = Array.isArray(snapshotValue) ? snapshotValue.length : 0;
  const length = Math.max(snapshotLength, highestId(definitions) + 1, 1);
  const output = createDenseArray(length, "");

  for (const definition of definitions) {
    output[definition.id] = definition.name;
  }

  return output;
}

async function writeGeneratedProjectData(
  statePaths: WorkspaceStatePaths,
  files: ReadonlyMap<string, string>,
  assertInputsUnchanged?: () => Promise<void>,
): Promise<MaterializedCompileOutput> {
  const tempDirectory = resolve(
    statePaths.workspaceStateDirectory,
    `generated-project-data.tmp-${process.pid}-${randomUUID()}`,
  );

  await rm(tempDirectory, { force: true, recursive: true });
  await mkdir(tempDirectory, { recursive: true });

  try {
    const generatedFiles: FileHashEntry[] = [];

    for (const [relativePath, content] of [...files.entries()].sort(([left], [right]) =>
      left.localeCompare(right),
    )) {
      const destinationPath = resolve(tempDirectory, relativePath);

      await mkdir(dirname(destinationPath), { recursive: true });
      await writeFile(destinationPath, content, "utf8");
      generatedFiles.push({
        hash: hashUtf8Content(content),
        relativePath,
      });
    }

    await assertInputsUnchanged?.();
    await replaceDirectory(tempDirectory, statePaths.generatedProjectDataDirectory);

    return { generatedFiles };
  } catch (error) {
    await rm(tempDirectory, { force: true, recursive: true });
    throw error;
  }
}

async function readSnapshotFile(
  statePaths: WorkspaceStatePaths,
  relativePath: string,
): Promise<string> {
  return readProjectDataSnapshotFile(statePaths, relativePath);
}

async function readSnapshotArray(
  statePaths: WorkspaceStatePaths,
  relativePath: string,
): Promise<unknown[]> {
  const parsed = JSON.parse(await readSnapshotFile(statePaths, relativePath));
  if (!Array.isArray(parsed)) {
    throw new Error(`Expected snapshot ${relativePath} to contain a JSON array.`);
  }

  return parsed;
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

function highestId(entries: readonly { id: number }[]): number {
  return entries.reduce((highest, entry) => Math.max(highest, entry.id), 0);
}

function createDenseArray<T>(length: number, value: T): T[] {
  return Array.from({ length }, () => value);
}

async function replaceDirectory(sourceDirectory: string, targetDirectory: string): Promise<void> {
  const backupDirectory = `${targetDirectory}.bak-${process.pid}-${randomUUID()}`;

  await rm(backupDirectory, { force: true, recursive: true });

  try {
    await rename(targetDirectory, backupDirectory);
  } catch (error) {
    if (!isMissingFileError(error)) {
      throw error;
    }
  }

  try {
    await rename(sourceDirectory, targetDirectory);
  } catch (error) {
    await rm(targetDirectory, { force: true, recursive: true });
    try {
      await rename(backupDirectory, targetDirectory);
    } catch (restoreError) {
      if (!isMissingFileError(restoreError)) {
        throw restoreError;
      }
    }
    throw error;
  }

  await rm(backupDirectory, { force: true, recursive: true });
}

function formatMapFileName(mapId: number): string {
  return `Map${mapId.toString().padStart(3, "0")}.json`;
}

function toPosixPath(path: string): string {
  return path.split(/[/\\]/u).join(posix.sep);
}

function isMissingFileError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string" &&
    (error as { code?: string }).code === "ENOENT"
  );
}
