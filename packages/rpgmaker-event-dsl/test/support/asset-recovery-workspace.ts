import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect } from "vitest";
import type { SyncManifest } from "../../src/workspace/state.js";
import { recordAssetInput } from "./asset-evidence.js";
import {
  observePush,
  controlledPush,
  preparePush,
  pushApi,
  pushDirectSource,
  pushPicturePath,
} from "./asset-push-workspace.js";
import { startWorkspaceOperation } from "./workspace-operation-process.js";
import type { WindowsSandbox } from "./windows-sandbox.js";

export const recoveryAffected = ["CommonEvents.json", "System.json"] as const;
export type Observation = Awaited<ReturnType<typeof observePush>>;
export type FrozenManifest = SyncManifest & {
  generatedFiles: NonNullable<SyncManifest["generatedFiles"]>;
  compileBaseline: NonNullable<SyncManifest["compileBaseline"]>;
};
export const digest = (bytes: string | Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");
export const decoded = (value: string) => Buffer.from(value, "base64");
export const statePath = (root: string, path: string) => join(root, ".rpgmaker-event-dsl", path);
export const parsedManifest = (observation: Observation): FrozenManifest =>
  JSON.parse(decoded(observation.state!["sync-manifest.json"]!).toString());

// This fixture format is independently declared here. Never import the product
// baseline builder, JSON writer, recovery selector or pending-state constructor.
export function fixtureJson(value: unknown): string {
  return JSON.stringify(value, null, 2).replace(/^(\s*"[^"\n]+":) /gm, "$1") + "\n";
}
export function orderedFixture(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(orderedFixture);
  if (value !== null && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, orderedFixture(entry)]),
    );
  return value;
}
export function expectedBasis(manifest: FrozenManifest, snapshots = manifest.snapshotFiles) {
  const baseline = manifest.compileBaseline;
  return {
    ...(Object.hasOwn(baseline, "compileContractVersion")
      ? { compileContractVersion: baseline.compileContractVersion }
      : {}),
    ...(Object.hasOwn(baseline, "typeInputs") ? { typeInputs: baseline.typeInputs } : {}),
    projectRootBinding: baseline.projectRootBinding,
    config: baseline.config,
    snapshotFiles: snapshots,
    sourceFiles: baseline.sourceFiles,
  };
}
export function completedExpectation(original: FrozenManifest, before: Observation) {
  const snapshots = original.snapshotFiles.map((entry) => ({
    ...entry,
    hash: (recoveryAffected as readonly string[]).includes(entry.relativePath)
      ? digest(decoded(before.state![`generated-project-data/${entry.relativePath}`]!))
      : entry.hash,
  }));
  const basis = expectedBasis(original, snapshots);
  // Persisted Manifest field order is part of these frozen fixture bytes.
  return {
    version: original.version,
    projectRootBinding: original.projectRootBinding,
    compileBaseline: { ...basis, hash: digest(fixtureJson(basis)) },
    generatedFiles: original.generatedFiles,
    snapshotFiles: snapshots,
  };
}

export async function prepareRecovery(sandbox: WindowsSandbox) {
  const root = sandbox.workspaceRoot;
  await preparePush(sandbox, {
    source:
      pushDirectSource +
      '\nimport {switchDefinition} from "rpgmaker-event-dsl";\n' +
      'export const gate=switchDefinition({id:1,name:"Recovery switch"});\n',
  });
  await pushApi.compileWorkspace({ workspaceRoot: root, check: false });
  const before = await observePush(root);
  const original = parsedManifest(before);
  expect(fixtureJson({ a: 1, b: "colon: keep", c: [] })).toBe(
    '{\n  "a":1,\n  "b":"colon: keep",\n  "c":[]\n}\n',
  );
  expect(original.generatedFiles.map((entry) => entry.relativePath)).toEqual([
    "CommonEvents.json",
    "Map001.json",
    "System.json",
    "Troops.json",
  ]);
  const common = JSON.parse(
    decoded(before.state!["generated-project-data/CommonEvents.json"]!).toString(),
  );
  expect(common).toEqual([
    ...Array.from({ length: 10 }, () => null),
    {
      id: 10,
      name: "Push workflow",
      trigger: 0,
      switchId: 1,
      list: [
        { code: 231, indent: 0, parameters: [1, "PushPoster", 0, 0, 0, 0, 100, 100, 255, 0] },
        { code: 0, indent: 0, parameters: [] },
      ],
    },
  ]);
  const oldSystem = JSON.parse(
    decoded(before.state!["project-data-snapshot/System.json"]!).toString(),
  );
  expect(
    JSON.parse(decoded(before.state!["generated-project-data/System.json"]!).toString()),
  ).toEqual({
    ...oldSystem,
    switches: ["", "Recovery switch"],
  });
  for (const name of recoveryAffected) {
    expect(before.project![`data/${name}`]).toBe(before.state![`project-data-snapshot/${name}`]);
    expect(before.state![`generated-project-data/${name}`]).not.toBe(
      before.project![`data/${name}`],
    );
  }
  expect(original.compileBaseline.hash).toBe(digest(fixtureJson(expectedBasis(original))));
  recordAssetInput({
    provenance:
      "Synthetic temporary Workspace; explicit two-carrier O/N event and switch values; no historical authenticity claim",
    before,
    expectedAffected: recoveryAffected,
    expectedCompletedManifest: completedExpectation(original, before),
  });
  return { before, original };
}

export async function interruptRecovery(sandbox: WindowsSandbox, mode: "api" | "cli" = "api") {
  const child = startWorkspaceOperation(sandbox, {
    operation: "push",
    mode,
    boundary: "push-snapshot-installed",
    captureFile: "CommonEvents.json",
    observeAssets: true,
  });
  try {
    await child.waitFor("checkpoint");
  } finally {
    await child.stop("SIGTERM");
  }
  expect(child.messages.some((message) => message.kind === "asset-query")).toBe(true);
  expect(child.messages.some((message) => message.kind === "result")).toBe(false);
  recordAssetInput({ realInterruption: sandbox.processes.at(-1), messages: child.messages });
}

export function assertFrozenPending(
  observation: Observation,
  before: Observation,
  original: FrozenManifest,
) {
  const pendingBytes = decoded(observation.state!["pending-push/pending-push.json"]!);
  const pending = JSON.parse(pendingBytes.toString());
  expect(pending.version).toBe(3);
  expect(pending.projectRootBinding).toBe(original.projectRootBinding);
  expect(pending.originalManifest).toEqual(original);
  expect(pending.originalManifestHash).toBe(digest(fixtureJson(orderedFixture(original))));
  expect(pending.affectedFiles).toEqual(
    recoveryAffected.map((name) => ({
      relativePath: name,
      backupRelativePath: name,
      backupHash: digest(decoded(before.state![`project-data-snapshot/${name}`]!)),
      snapshotHash: digest(decoded(before.state![`project-data-snapshot/${name}`]!)),
      generatedHash: digest(decoded(before.state![`generated-project-data/${name}`]!)),
    })),
  );
  for (const name of recoveryAffected)
    expect(observation.state![`pending-push/backup/${name}`]).toBe(
      before.state![`project-data-snapshot/${name}`],
    );
  expect(
    Object.keys(observation.state!).filter(
      (key) => key.startsWith("pending-push/backup/") && !key.endsWith("/"),
    ),
  ).toEqual(recoveryAffected.map((name) => `pending-push/backup/${name}`));
  recordAssetInput({ frozenPendingBytes: pendingBytes.toString("base64"), pending });
  return pending;
}

export function expectedCompletedState(
  observation: Observation,
  before: Observation,
  original: FrozenManifest,
) {
  const state = Object.fromEntries(
    Object.entries(observation.state!).filter(([key]) => !key.startsWith("pending-push/")),
  );
  for (const name of recoveryAffected)
    state[`project-data-snapshot/${name}`] = before.state![`generated-project-data/${name}`]!;
  state["sync-manifest.json"] = Buffer.from(
    fixtureJson(completedExpectation(original, before)),
  ).toString("base64");
  return { ...observation, state };
}

export async function preconstructPending(
  root: string,
  before: Observation,
  original: FrozenManifest,
) {
  await mkdir(statePath(root, "pending-push/backup"), { recursive: true });
  for (const name of recoveryAffected)
    await writeFile(
      statePath(root, `pending-push/backup/${name}`),
      decoded(before.state![`project-data-snapshot/${name}`]!),
    );
  const pending = {
    version: 3,
    startedAt: "2026-10-19T00:00:00.000Z",
    projectRootBinding: original.projectRootBinding,
    originalManifest: original,
    originalManifestHash: digest(fixtureJson(orderedFixture(original))),
    affectedFiles: recoveryAffected.map((name) => ({
      relativePath: name,
      backupRelativePath: name,
      backupHash: digest(decoded(before.state![`project-data-snapshot/${name}`]!)),
      snapshotHash: digest(decoded(before.state![`project-data-snapshot/${name}`]!)),
      generatedHash: digest(decoded(before.state![`generated-project-data/${name}`]!)),
    })),
  };
  await writeFile(statePath(root, "pending-push/pending-push.json"), fixtureJson(pending));
  recordAssetInput({
    syntheticPending: pending,
    originalBasisBytes: fixtureJson(expectedBasis(original)),
    expectedCompletedManifest: completedExpectation(original, before),
  });
}

export async function syntheticHistoricalManifest(
  root: string,
  current: FrozenManifest,
  variant: "pre-policy" | "pre-contract" | "pre-troops",
): Promise<FrozenManifest> {
  // Explicitly synthetic: actual temporary binding and actual O/N digests, with
  // the historical config field set. No c:\\legacy-game or a/b/c placeholders.
  const basis = {
    ...(variant === "pre-contract"
      ? {}
      : { compileContractVersion: variant === "pre-troops" ? "mv-1.6.1/6" : "mv-1.6.1/35" }),
    ...(variant === "pre-contract" ? {} : { typeInputs: current.compileBaseline.typeInputs }),
    projectRootBinding: current.projectRootBinding,
    config: {
      scriptEnabled: false,
      sourceExclude: ["**/*.test.ts", "**/*.spec.ts", "**/*.d.ts"],
      sourceInclude: ["**/*.events.ts", "**/*.dsl.ts"],
      sourceRoot: "src",
    },
    snapshotFiles: current.snapshotFiles,
    sourceFiles: current.compileBaseline.sourceFiles,
  };
  const original: FrozenManifest = {
    version: 1,
    projectRootBinding: current.projectRootBinding,
    compileBaseline: { ...basis, hash: digest(fixtureJson(basis)) },
    generatedFiles: current.generatedFiles.filter(
      (entry) => variant !== "pre-troops" || entry.relativePath !== "Troops.json",
    ),
    snapshotFiles: current.snapshotFiles,
  };
  if (variant === "pre-troops") await rm(statePath(root, "generated-project-data/Troops.json"));
  await writeFile(statePath(root, "sync-manifest.json"), fixtureJson(original));
  recordAssetInput({
    provenance:
      "Independently constructed synthetic historical runtime evidence; not an authentic relocated old transaction",
    variant,
    original,
    originalBytes: fixtureJson(original),
    originalBasisBytes: fixtureJson(basis),
    originalManifestEvidenceHash: digest(fixtureJson(orderedFixture(original))),
  });
  return original;
}

export async function installGenerated(root: string, before: Observation) {
  for (const name of recoveryAffected)
    await writeFile(
      join(root, "Game/data", name),
      decoded(before.state![`generated-project-data/${name}`]!),
    );
}
export async function deleteRecoveryMedia(root: string) {
  await rm(join(root, pushPicturePath));
}
export async function readPending(root: string) {
  return JSON.parse(await readFile(statePath(root, "pending-push/pending-push.json"), "utf8"));
}

export async function refuseRecoveryUnchanged(sandbox: WindowsSandbox) {
  const before = await observePush(sandbox.workspaceRoot);
  const actual = await controlledPush(sandbox, { boundary: "asset-no-media-query" });
  expect(actual.exitCode).toBe(1);
  expect(actual.message + actual.stderr).toContain("Interrupted Push");
  expect(actual.message + actual.stderr).toContain("asset check not run");
  expect(actual.messages.filter((message) => message.kind === "asset-query")).toEqual([]);
  expect(
    actual.messages.filter((message) => message.kind === "asset-content-read-attempt"),
  ).toEqual([]);
  expect(await observePush(sandbox.workspaceRoot)).toEqual(before);
  recordAssetInput({
    recoveryInput: before,
    actual,
    after: await observePush(sandbox.workspaceRoot),
    expected:
      "Refuse before current media gate; preserve every remaining project/input/generated/Snapshot/Manifest/pending/backup/media byte.",
  });
  return actual;
}
