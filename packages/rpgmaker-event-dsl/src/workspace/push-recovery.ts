import { createHash, randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import {
  expectedCompileOutputFileNames,
  type FileHashEntry,
} from "../project-data/materialization.js";
import { writeStableJson } from "../project-data/writer.js";
import { deriveAffectedProjectDataFiles } from "../project-data/structured-diff.js";
import { assertProjectRootBinding, readCurrentSnapshotFileHashes } from "./checks.js";
import type { LoadedWorkspace } from "./config.js";
import {
  collectStandardProjectDataSnapshotPlan,
  readPendingPushEvidence,
  readSyncManifest,
  writeSyncManifest,
  type PendingPush,
  type SyncManifest,
  type WorkspaceStatePaths,
} from "./state.js";

const hash = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");
const same = isDeepStrictEqual;
function ordered(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(ordered);
  if (value !== null && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, ordered(item)]),
    );
  return value;
}
const manifestEvidenceHash = (manifest: SyncManifest) => hash(writeStableJson(ordered(manifest)));
function fail(detail: string): never {
  throw new Error(
    `Interrupted Push ${detail}. Recovery stopped without changes to the Project Root.`,
  );
}

/** Freeze the original compilation and synchronization basis before any Project Root replacement. */
export async function createPendingPushState(input: {
  affectedFiles: readonly string[];
  generatedFiles: readonly FileHashEntry[];
  manifest: SyncManifest;
  statePaths: WorkspaceStatePaths;
}): Promise<void> {
  const directory = await mkdtemp(
    join(input.statePaths.workspaceStateDirectory, "pending-push.tmp-"),
  );
  try {
    await mkdir(join(directory, "backup"));
    const affectedFiles: PendingPush["affectedFiles"] = [];
    for (const relativePath of input.affectedFiles) {
      const snapshotHash = input.manifest.snapshotFiles.find(
        (entry) => entry.relativePath === relativePath,
      )?.hash;
      const generatedHash = input.generatedFiles.find(
        (entry) => entry.relativePath === relativePath,
      )?.hash;
      if (!snapshotHash || !generatedHash) fail(`cannot prepare ${relativePath}`);
      const content = await readFile(
        resolve(input.statePaths.projectDataSnapshotDirectory, relativePath),
      );
      if (hash(content) !== snapshotHash) fail(`Snapshot changed while preparing ${relativePath}`);
      await writeFile(join(directory, "backup", relativePath), content, { flag: "wx" });
      affectedFiles.push({
        relativePath,
        backupRelativePath: relativePath,
        backupHash: snapshotHash,
        snapshotHash,
        generatedHash,
      });
    }
    await writeFile(
      join(directory, "pending-push.json"),
      writeStableJson({
        version: 3,
        projectRootBinding: input.manifest.projectRootBinding,
        startedAt: new Date().toISOString(),
        originalManifest: input.manifest,
        originalManifestHash: manifestEvidenceHash(input.manifest),
        affectedFiles,
      }),
      { flag: "wx" },
    );
    await rename(directory, input.statePaths.pendingPushDirectory);
  } catch (error) {
    await rm(directory, { recursive: true, force: true });
    throw error;
  }
}

function baselineBasis(
  baseline: NonNullable<SyncManifest["compileBaseline"]>,
  snapshotFiles = baseline.snapshotFiles,
) {
  return {
    ...(baseline.compileContractVersion === undefined
      ? {}
      : { compileContractVersion: baseline.compileContractVersion }),
    ...(baseline.typeInputs === undefined ? {} : { typeInputs: baseline.typeInputs }),
    projectRootBinding: baseline.projectRootBinding,
    config: baseline.config,
    snapshotFiles,
    sourceFiles: baseline.sourceFiles,
  };
}
function completedManifest(pending: PendingPush): SyncManifest {
  const original = pending.originalManifest;
  const changed = new Map(
    pending.affectedFiles.map((entry) => [entry.relativePath, entry.generatedHash]),
  );
  const snapshotFiles = original.snapshotFiles.map((entry) => ({
    ...entry,
    hash: changed.get(entry.relativePath) ?? entry.hash,
  }));
  const baseline = original.compileBaseline!;
  const rewritten = baselineBasis(baseline, snapshotFiles);
  return {
    ...original,
    snapshotFiles,
    compileBaseline: { ...rewritten, hash: hash(writeStableJson(rewritten)) },
  };
}

/** Both normal Push and recovery use the same content-proven, deterministic local finalization. */
export async function resolvePendingInterruptedPushForPush(input: {
  workspace: LoadedWorkspace;
  statePaths: WorkspaceStatePaths;
}): Promise<void> {
  try {
    await resolvePending(input);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Interrupted Push")) throw error;
    throw new Error(
      `Interrupted Push recovery failed: ${error instanceof Error ? error.message : String(error)}. Preserve the pending evidence and restore its original files before retrying.`,
      { cause: error },
    );
  }
}

async function resolvePending(input: {
  workspace: LoadedWorkspace;
  statePaths: WorkspaceStatePaths;
}): Promise<void> {
  const paths = input.statePaths;
  const evidence = await readPendingPushEvidence(paths.pendingPushManifestPath);
  if (evidence === null) return;
  const { pending, bytes: pendingBytes } = evidence;
  if (pending.projectRootBinding !== input.workspace.projectRootBinding)
    fail("Project Root Binding mismatch; return to the original configured target before recovery");
  const original = pending.originalManifest;
  assertProjectRootBinding(
    original,
    input.workspace.projectRootBinding,
    "Interrupted Push recovery",
  );
  const baseline = original.compileBaseline;
  if (
    !baseline ||
    !original.generatedFiles ||
    manifestEvidenceHash(original) !== pending.originalManifestHash
  )
    fail("original compilation evidence is inconsistent");
  if (
    hash(writeStableJson(baselineBasis(baseline))) !== baseline.hash ||
    baseline.projectRootBinding !== original.projectRootBinding ||
    !same(baseline.snapshotFiles, original.snapshotFiles)
  )
    fail("original Compile Baseline is inconsistent");
  const oldHashes = new Map(
    original.snapshotFiles.map((entry) => [entry.relativePath, entry.hash]),
  );
  const newHashes = new Map(
    original.generatedFiles.map((entry) => [entry.relativePath, entry.hash]),
  );
  const seen = new Set<string>();
  const backups = new Map<string, Buffer>();
  for (const entry of pending.affectedFiles) {
    if (
      seen.has(entry.relativePath) ||
      entry.backupRelativePath !== entry.relativePath ||
      entry.snapshotHash !== oldHashes.get(entry.relativePath) ||
      entry.generatedHash !== newHashes.get(entry.relativePath) ||
      entry.backupHash !== entry.snapshotHash
    )
      fail(`metadata is inconsistent for ${entry.relativePath}`);
    seen.add(entry.relativePath);
    const bytes = await readFile(join(paths.pendingPushBackupDirectory, entry.backupRelativePath));
    if (hash(bytes) !== entry.snapshotHash)
      fail(
        `backup integrity check failed for ${entry.relativePath}; restore the original recovery evidence`,
      );
    backups.set(entry.relativePath, bytes);
  }
  const next = completedManifest(pending);
  let current = await readSyncManifest(paths.syncManifestPath);
  const alreadyCommitted = same(current, next);
  if (!same(current, original) && !alreadyCommitted)
    fail("Sync Manifest is neither the original nor the completed operation");
  const snapshot = await collectStandardProjectDataSnapshotPlan(paths.projectDataSnapshotDirectory);
  if (
    snapshot.length !== original.snapshotFiles.length ||
    snapshot.some((entry) => !oldHashes.has(entry.relativePath))
  )
    fail("Snapshot file set is inconsistent");
  const expectedSnapshot = new Map(snapshot.map((entry) => [entry.relativePath, entry.hash]));
  const expectedNames = await expectedCompileOutputFileNames(paths);
  const listed = original.generatedFiles.map((entry) => entry.relativePath).sort();
  const actualEntries = await readdir(paths.generatedProjectDataDirectory, { withFileTypes: true });
  if (
    !same(listed, expectedNames) ||
    !same(actualEntries.map((entry) => entry.name).sort(), listed) ||
    actualEntries.some((entry) => !entry.isFile())
  )
    fail("generated file set is inconsistent");
  const generated = new Map<string, Buffer>();
  for (const entry of original.generatedFiles) {
    const bytes = await readFile(resolve(paths.generatedProjectDataDirectory, entry.relativePath));
    if (hash(bytes) !== entry.hash)
      fail(
        `generated data integrity check failed for ${entry.relativePath}; restore the original recovery evidence`,
      );
    generated.set(entry.relativePath, bytes);
  }
  const originalData = new Map<string, unknown>();
  const generatedData = new Map<string, unknown>();
  try {
    for (const [name, bytes] of generated) {
      const old =
        backups.get(name) ?? snapshot.find((entry) => entry.relativePath === name)?.content;
      if (old === undefined) fail(`original Snapshot is missing ${name}`);
      originalData.set(name, JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(old)));
      generatedData.set(name, JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
    }
  } catch (error) {
    fail(
      `data evidence cannot be interpreted: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (
    !same(
      [...seen].sort(),
      deriveAffectedProjectDataFiles({ generated: generatedData, snapshot: originalData }).sort(),
    )
  )
    fail("affected file set is inconsistent with the original operation");
  const states = await Promise.all(
    pending.affectedFiles.map(async (entry) => {
      const bytes = await readFile(
        resolve(input.workspace.dataDirectory, entry.relativePath),
      ).catch(() => null);
      const digest = bytes === null ? null : hash(bytes);
      return digest === entry.generatedHash
        ? "generated"
        : digest === entry.snapshotHash
          ? "snapshot"
          : bytes === null
            ? "missing"
            : "unknown";
    }),
  );
  const allGenerated = states.every((state) => state === "generated");
  const allSnapshot = states.every((state) => state === "snapshot");
  if (!allGenerated && !allSnapshot)
    throw new Error(
      [
        "Interrupted Push cannot be recovered automatically.",
        "Restore affected Project Root files to either the pending backup state or Generated Project Data, then run push again.",
        ...pending.affectedFiles.map((entry, i) => `- ${entry.relativePath}: ${states[i]}`),
      ].join("\n"),
    );
  for (const entry of snapshot) {
    const old = oldHashes.get(entry.relativePath);
    const final = seen.has(entry.relativePath) ? newHashes.get(entry.relativePath) : old;
    if (
      alreadyCommitted
        ? entry.hash !== final
        : entry.hash !== old &&
          !(allGenerated && seen.has(entry.relativePath) && entry.hash === final)
    )
      fail(`Snapshot evidence is inconsistent for ${entry.relativePath}`);
  }
  if (allSnapshot && alreadyCommitted)
    fail("all-Snapshot live contents contradict a completed manifest");

  async function assertEvidenceUnchanged() {
    if (
      !(await readFile(paths.pendingPushManifestPath)).equals(pendingBytes) ||
      !same(await readSyncManifest(paths.syncManifestPath), current)
    )
      fail("recovery metadata changed before publication");
    const actual = await readCurrentSnapshotFileHashes(paths, original.snapshotFiles);
    if (
      actual.length !== expectedSnapshot.size ||
      actual.some((entry) => entry.hash !== expectedSnapshot.get(entry.relativePath))
    )
      fail("Snapshot changed before publication");
    const entries = await readdir(paths.generatedProjectDataDirectory, { withFileTypes: true });
    if (
      !same(entries.map((entry) => entry.name).sort(), listed) ||
      entries.some((entry) => !entry.isFile())
    )
      fail("generated file set changed before publication");
    for (const entry of original.generatedFiles!)
      if (
        hash(await readFile(resolve(paths.generatedProjectDataDirectory, entry.relativePath))) !==
        entry.hash
      )
        fail(`generated data changed before publication for ${entry.relativePath}`);
    for (const entry of pending!.affectedFiles) {
      if (
        hash(await readFile(join(paths.pendingPushBackupDirectory, entry.backupRelativePath))) !==
        entry.snapshotHash
      )
        fail(`backup changed before publication for ${entry.relativePath}`);
      const expected = allGenerated ? entry.generatedHash : entry.snapshotHash;
      if (
        hash(await readFile(resolve(input.workspace.dataDirectory, entry.relativePath))) !==
        expected
      )
        fail(`Project Root changed during recovery for ${entry.relativePath}`);
    }
  }
  await assertEvidenceUnchanged();
  if (allGenerated && !alreadyCommitted) {
    for (const entry of pending.affectedFiles) {
      if (expectedSnapshot.get(entry.relativePath) === entry.generatedHash) continue;
      const target = resolve(paths.projectDataSnapshotDirectory, entry.relativePath);
      const temporary = `${target}.push-${randomUUID()}`;
      try {
        const bytes = generated.get(entry.relativePath)!;
        await writeFile(temporary, bytes, { flag: "wx" });
        if (hash(await readFile(temporary)) !== entry.generatedHash)
          fail(`Snapshot candidate changed for ${entry.relativePath}`);
        await assertEvidenceUnchanged();
        await rename(temporary, target);
        expectedSnapshot.set(entry.relativePath, entry.generatedHash);
      } finally {
        await rm(temporary, { force: true });
      }
    }
    await writeSyncManifest(paths.syncManifestPath, next, assertEvidenceUnchanged);
    current = next;
  }
  await assertEvidenceUnchanged();
  const retired = await mkdtemp(join(paths.workspaceStateDirectory, "pending-push.retired-"));
  await assertEvidenceUnchanged();
  await rename(paths.pendingPushDirectory, join(retired, "operation"));
  try {
    await rm(retired, { recursive: true, force: true });
  } catch (error) {
    throw new Error(
      `Interrupted Push pending state retired, but evidence cleanup failed at ${retired}. Synchronization records were preserved.`,
      { cause: error },
    );
  }
}
