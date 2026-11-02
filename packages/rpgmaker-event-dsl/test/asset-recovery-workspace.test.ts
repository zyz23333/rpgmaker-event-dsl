import { expect, vi } from "vitest";
import { cp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createAssetTest, recordAssetInput } from "./support/asset-evidence.js";
import {
  observePush,
  controlledPush,
  pushApi,
  runPushOperation,
  pushTree,
} from "./support/asset-push-workspace.js";
import { withWindowsSandbox } from "./support/windows-sandbox.js";
import { startWorkspaceOperation } from "./support/workspace-operation-process.js";
import {
  assertFrozenPending,
  decoded,
  deleteRecoveryMedia,
  expectedCompletedState,
  fixtureJson,
  interruptRecovery,
  installGenerated,
  parsedManifest,
  prepareRecovery,
  preconstructPending,
  refuseRecoveryUnchanged,
  recoveryAffected,
  readPending,
  statePath,
  syntheticHistoricalManifest,
} from "./support/asset-recovery-workspace.js";

const it = createAssetTest({ ownerTicket: "16", testSource: import.meta.url });
vi.setConfig({ testTimeout: 60_000 });

for (const mode of ["api", "cli"] as const)
  it(`AV.W15.all-generated-missing-asset.${mode}.case.expected: real interrupted data writes complete bookkeeping before the current no-diff asset error and never recreate pending`, async () => {
    await withWindowsSandbox(`asset-recovery-all-generated-${mode}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      const { before, original } = await prepareRecovery(sandbox);
      await interruptRecovery(sandbox, mode);
      const interrupted = await observePush(root);
      assertFrozenPending(interrupted, before, original);
      for (const name of recoveryAffected)
        expect(interrupted.project![`data/${name}`]).toBe(
          before.state![`generated-project-data/${name}`],
        );
      expect(interrupted.state!["project-data-snapshot/CommonEvents.json"]).toBe(
        before.state!["generated-project-data/CommonEvents.json"],
      );
      expect(interrupted.state!["project-data-snapshot/System.json"]).toBe(
        before.state!["project-data-snapshot/System.json"],
      );
      expect(parsedManifest(interrupted)).toEqual(original);
      await deleteRecoveryMedia(root);
      const recoveryInput = await observePush(root);
      const actual = await controlledPush(sandbox, { mode });
      expect(actual.exitCode).toBe(1);
      expect(actual.message + actual.stderr).toContain("MV-ASSET-MISSING-FILE");
      expect(actual.message + actual.stderr).not.toContain("Interrupted Push");
      expect(actual.messages.some((message) => message.kind === "asset-query")).toBe(true);
      expect(
        actual.messages.filter((message) => message.kind === "asset-content-read-attempt"),
      ).toEqual([]);
      const expected = expectedCompletedState(recoveryInput, before, original);
      expect(await observePush(root)).toEqual(expected);
      expect(expected.state["pending-push/"]).toBeUndefined();
      recordAssetInput({
        recoveryInput,
        actual,
        after: await observePush(root),
        expected:
          "Data recovery completed exactly; subsequent fresh no-diff Push fails missing current media, with no new pending or data writes.",
      });
    });
  });

it("AV.W18.pending-non-push.api.case.expected: every non-Push operation preserves all-old and all-generated pending evidence and stops before any asset query", async () => {
  for (const liveState of ["snapshot", "generated"] as const)
    await withWindowsSandbox(`asset-recovery-non-push-${liveState}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      const { before, original } = await prepareRecovery(sandbox);
      await preconstructPending(root, before, original);
      if (liveState === "generated") await installGenerated(root, before);
      await deleteRecoveryMedia(root);
      const pending = await observePush(root);
      assertFrozenPending(pending, before, original);
      for (const operation of [
        "clone",
        "pull",
        "decompile",
        "compile",
        "check",
        "diff",
        "fresh",
      ] as const) {
        const actual = await runPushOperation(sandbox, {
          operation,
          boundary: "asset-no-media-query",
          observeAssets: true,
        });
        expect(actual.exitCode).toBe(1);
        expect(actual.message + actual.stderr).toContain("Interrupted Push is pending");
        expect(actual.messages.filter((message) => message.kind === "asset-query")).toEqual([]);
        expect(
          actual.messages.filter((message) => message.kind === "asset-content-read-attempt"),
        ).toEqual([]);
        expect(await observePush(root)).toEqual(pending);
        recordAssetInput({
          liveState,
          operation,
          pending,
          actual,
          expected:
            "Non-Push stops at pending guard without recovery or asset success and preserves the complete tree.",
        });
      }
    });
});

it("AV.W18.concurrent-workspace.api.case.expected: a live owner holding genuine pending excludes immediate same-Workspace and junction-alias competitors until the lease ends", async () => {
  await withWindowsSandbox("asset-recovery-concurrent", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    const { before, original } = await prepareRecovery(sandbox);
    const alias = join(sandbox.root, "Workspace directory junction");
    await symlink(root, alias, "junction");
    const owner = startWorkspaceOperation(sandbox, {
      operation: "push",
      boundary: "push-prewrite",
      observeAssets: true,
    });
    let pending!: Awaited<ReturnType<typeof observePush>>;
    try {
      await owner.waitFor("checkpoint");
      pending = await observePush(root);
      assertFrozenPending(pending, before, original);
      const stages = Object.keys(pending.project!).filter((key) =>
        /^data\/push-staging\.tmp-[^/]+\/$/u.test(key),
      );
      expect(stages).toHaveLength(1);
      const stagedProject = { ...before.project, [stages[0]!]: "directory" };
      for (const name of recoveryAffected)
        stagedProject[stages[0]! + name] = before.state![`generated-project-data/${name}`]!;
      expect(pending.project).toEqual(stagedProject);
      expect({ ...pending, project: before.project, state: before.state }).toEqual(before);
      expect(
        Object.fromEntries(
          Object.entries(pending.state!).filter(([key]) => !key.startsWith("pending-push/")),
        ),
      ).toEqual(before.state);
      for (const [target, mode] of [
        [root, "api"],
        [alias, "api"],
        [alias, "cli"],
      ] as const) {
        const competitor = startWorkspaceOperation(
          { ...sandbox, workspaceRoot: target },
          { operation: "push", mode, boundary: "asset-no-media-query", observeAssets: true },
        );
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          const ended = await Promise.race([
            competitor.ended,
            new Promise<never>((_, reject) => {
              timer = setTimeout(
                () =>
                  reject(
                    new Error("Workspace competitor queued instead of immediately refusing busy"),
                  ),
                5_000,
              );
            }),
          ]);
          expect(ended.exitCode).toBe(1);
          const process = sandbox.processes.at(-1)!;
          const text =
            process.stderr +
            (competitor.messages.find((message) => message.kind === "result")?.message ?? "");
          expect(text).toContain("Workspace is busy");
          expect(competitor.messages.filter((message) => message.kind === "asset-query")).toEqual(
            [],
          );
          expect(await observePush(root)).toEqual(pending);
          recordAssetInput({
            target,
            mode,
            competitor: process,
            messages: competitor.messages,
            expected:
              "Immediate busy refusal while the genuine owner still holds its lease; pending and the entire tree preserved.",
          });
        } finally {
          clearTimeout(timer);
          await competitor.stop();
        }
      }
    } finally {
      await owner.stop("SIGTERM");
    }
    expect(await observePush(root)).toEqual(pending);
    const actual = await controlledPush(sandbox, {});
    expect(actual.exitCode).toBe(0);
    const project = { ...pending.project };
    for (const name of recoveryAffected)
      project[`data/${name}`] = before.state![`generated-project-data/${name}`]!;
    expect(await observePush(root)).toEqual(
      expectedCompletedState({ ...pending, project }, before, original),
    );
    recordAssetInput({
      deadOwner: sandbox.processes.find((process) => process.signal === "SIGTERM"),
      pendingAfterOwnerDeath: pending,
      permittedSuccessor: actual,
      after: await observePush(root),
    });
  });
});

it("AV.W16.changed-current-config.api.case.expected: otherwise-current pending completes under its frozen original policy while a valid changed current policy independently prevents new writes", async () => {
  await withWindowsSandbox("asset-recovery-current-config", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    const { before, original } = await prepareRecovery(sandbox);
    expect(original.compileBaseline.compileContractVersion).toBe("mv-1.6.1/39");
    expect(original.compileBaseline.config.assetCheckExceptions).toEqual([]);
    expect(await pushApi.isGeneratedProjectDataFresh({ workspaceRoot: root })).toBe(true);
    await preconstructPending(root, before, original);
    await installGenerated(root, before);
    const configPath = join(root, "rpgmaker-event-dsl.config.json");
    const config = JSON.parse(await readFile(configPath, "utf8"));
    config.assetCheckExceptions = [
      {
        category: "image",
        folder: "pictures",
        name: "PushPoster",
        reason: "A valid newly changed current policy",
      },
    ];
    await writeFile(configPath, JSON.stringify(config));
    await deleteRecoveryMedia(root);
    const recoveryInput = await observePush(root);
    assertFrozenPending(recoveryInput, before, original);
    const actual = await controlledPush(sandbox, { boundary: "asset-no-media-query" });
    expect(actual.exitCode).toBe(1);
    expect(actual.message + actual.stderr).toContain("is stale");
    expect(actual.message + actual.stderr).toContain("asset check not run");
    expect(actual.message + actual.stderr).not.toContain("MV-ASSET-MISSING-FILE");
    expect(actual.messages.filter((message) => message.kind === "asset-query")).toEqual([]);
    const after = await observePush(root);
    expect(after).toEqual(expectedCompletedState(recoveryInput, before, original));
    expect(parsedManifest(after).compileBaseline.config.assetCheckExceptions).toEqual([]);
    expect(JSON.parse(after.config).assetCheckExceptions).toEqual(config.assetCheckExceptions);
    expect(await pushApi.isGeneratedProjectDataFresh({ workspaceRoot: root })).toBe(false);
    recordAssetInput({
      currentContract: "mv-1.6.1/39",
      driverChangedConfig: config,
      recoveryInput,
      actual,
      after,
      expected:
        "Recovery preserves original current-contract config and completes its data bookkeeping; the independently changed valid current policy makes the subsequent Push stale, before any media query or new write.",
    });
  });
});

it("AV.W16.stale-original-basis.api.case.expected: synthetic historical original hashes, policy omissions and optional version/type-input fields survive completed recovery without granting current authority", async () => {
  for (const variant of ["pre-policy", "pre-contract", "pre-troops"] as const)
    await withWindowsSandbox(`asset-recovery-historical-${variant}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      const { before, original: current } = await prepareRecovery(sandbox);
      const original = await syntheticHistoricalManifest(root, current, variant);
      expect(original.compileBaseline.config).not.toHaveProperty("assetCheckExceptions");
      if (variant === "pre-contract") {
        expect(original.compileBaseline).not.toHaveProperty("compileContractVersion");
        expect(original.compileBaseline).not.toHaveProperty("typeInputs");
      }
      await preconstructPending(root, before, original);
      await installGenerated(root, before);
      await deleteRecoveryMedia(root);
      const recoveryInput = await observePush(root);
      assertFrozenPending(recoveryInput, before, original);
      const actual = await controlledPush(sandbox, { boundary: "asset-no-media-query" });
      expect(actual.exitCode).toBe(1);
      const text = actual.message + actual.stderr;
      expect(text).toContain(variant === "pre-troops" ? "integrity check failed" : "is stale");
      expect(text).toContain("asset check not run");
      expect(text).not.toContain("MV-ASSET-MISSING-FILE");
      expect(actual.messages.filter((message) => message.kind === "asset-query")).toEqual([]);
      const after = await observePush(root);
      expect(after).toEqual(expectedCompletedState(recoveryInput, before, original));
      const completed = parsedManifest(after);
      expect(completed.compileBaseline.config).not.toHaveProperty("assetCheckExceptions");
      expect(completed.compileBaseline.config).toEqual(original.compileBaseline.config);
      if (variant === "pre-contract") {
        expect(completed.compileBaseline).not.toHaveProperty("compileContractVersion");
        expect(completed.compileBaseline).not.toHaveProperty("typeInputs");
      }
      expect(completed.compileBaseline.hash).not.toBe(original.compileBaseline.hash);
      recordAssetInput({
        variant,
        recoveryInput,
        actual,
        after,
        expected:
          "Verify old evidence, complete only its specified Snapshot hash changes, preserve original config/version/source/type/binding shape, clear pending, then refuse current stale/incomplete output before the asset gate.",
      });
    });
});

it("AV.W15.unknown.api.case.expected: third live contents, unknown pending version and inconsistent original evidence preserve all state and never reach assets", async () => {
  for (const mutation of [
    "third-live",
    "pending-version",
    "manifest-hash",
    "baseline-hash",
  ] as const)
    await withWindowsSandbox(`asset-recovery-unknown-${mutation}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      const { before, original } = await prepareRecovery(sandbox);
      if (mutation === "baseline-hash") {
        original.compileBaseline.hash = "0".repeat(64);
        await writeFile(statePath(root, "sync-manifest.json"), fixtureJson(original));
      }
      await preconstructPending(root, before, original);
      if (mutation === "third-live") await writeFile(join(root, "Game/data/System.json"), "[]\n");
      if (mutation === "pending-version" || mutation === "manifest-hash") {
        const pending = await readPending(root);
        if (mutation === "pending-version") pending.version = 999;
        else pending.originalManifestHash = "0".repeat(64);
        await writeFile(statePath(root, "pending-push/pending-push.json"), fixtureJson(pending));
      }
      await deleteRecoveryMedia(root);
      recordAssetInput({ independentlyCorruptedEvidence: mutation });
      const actual = await refuseRecoveryUnchanged(sandbox);
      const text = actual.message + actual.stderr;
      if (mutation === "third-live") expect(text).toContain("System.json: unknown");
      if (mutation === "pending-version") expect(text).toContain("Unknown or corrupt");
      if (mutation === "manifest-hash")
        expect(text).toContain("original compilation evidence is inconsistent");
      if (mutation === "baseline-hash")
        expect(text).toContain("original Compile Baseline is inconsistent");
    });
});

it("AV.W15.missing.api.case.expected: missing affected live data or required backup evidence refuses without changing the complete remaining tree", async () => {
  for (const missing of ["live", "backup"] as const)
    await withWindowsSandbox(`asset-recovery-missing-${missing}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      const { before, original } = await prepareRecovery(sandbox);
      await preconstructPending(root, before, original);
      await rm(
        missing === "live"
          ? join(root, "Game/data/System.json")
          : statePath(root, "pending-push/backup/System.json"),
      );
      await deleteRecoveryMedia(root);
      recordAssetInput({ missingRequiredEvidence: missing });
      const actual = await refuseRecoveryUnchanged(sandbox);
      if (missing === "live")
        expect(actual.message + actual.stderr).toContain("System.json: missing");
      else expect(actual.message + actual.stderr).toContain("System.json");
    });
});

it("AV.W15.mixed.api.case.expected: generated and original live carriers cannot be recovered automatically and media never supplies data evidence", async () => {
  await withWindowsSandbox("asset-recovery-mixed", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    const { before, original } = await prepareRecovery(sandbox);
    await preconstructPending(root, before, original);
    await writeFile(
      join(root, "Game/data/CommonEvents.json"),
      decoded(before.state!["generated-project-data/CommonEvents.json"]!),
    );
    await deleteRecoveryMedia(root);
    const actual = await refuseRecoveryUnchanged(sandbox);
    expect(actual.message + actual.stderr).toContain("CommonEvents.json: generated");
    expect(actual.message + actual.stderr).toContain("System.json: snapshot");
  });
});

it("AV.W15.all-snapshot.api.case.expected: independently frozen all-old evidence is retired before a separately permitted normal Push checks assets and writes", async () => {
  await withWindowsSandbox("asset-recovery-all-snapshot", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    const { before, original } = await prepareRecovery(sandbox);
    await preconstructPending(root, before, original);
    const recoveryInput = await observePush(root);
    assertFrozenPending(recoveryInput, before, original);
    let retiredObservation: Awaited<ReturnType<typeof observePush>> | undefined;
    const actual = await controlledPush(
      sandbox,
      { boundary: "push-retirement-installed" },
      async () => {
        retiredObservation = await observePush(root);
        expect({ ...retiredObservation, state: before.state }).toEqual(before);
        const state = retiredObservation.state!;
        const retirement = Object.keys(state).filter((key) =>
          /^pending-push\.retired-[^/]+\/$/u.test(key),
        );
        expect(retirement).toHaveLength(1);
        const prefix = retirement[0]!;
        const expectedState = {
          ...before.state,
          [prefix]: "directory",
          [prefix + "operation/"]: "directory",
        };
        for (const [key, value] of Object.entries(recoveryInput.state!))
          if (key.startsWith("pending-push/"))
            expectedState[prefix + "operation/" + key.slice("pending-push/".length)] = value;
        expect(state).toEqual(expectedState);
        recordAssetInput({ abandonedBeforeNewPush: retiredObservation });
      },
    );
    expect(actual.exitCode).toBe(0);
    const checkpoint = actual.messages.findIndex((message) => message.kind === "checkpoint");
    expect(checkpoint).toBeGreaterThanOrEqual(0);
    expect(
      actual.messages.slice(0, checkpoint).filter((message) => message.kind === "asset-query"),
    ).toEqual([]);
    expect(
      actual.messages.slice(checkpoint + 1).some((message) => message.kind === "asset-query"),
    ).toBe(true);
    const project = { ...before.project };
    for (const name of recoveryAffected)
      project[`data/${name}`] = before.state![`generated-project-data/${name}`]!;
    const expected = expectedCompletedState({ ...recoveryInput, project }, before, original);
    expect(await observePush(root)).toEqual(expected);
    recordAssetInput({
      recoveryInput,
      retiredObservation,
      actual,
      after: expected,
      expected:
        "Old attempt abandoned without data/Manifest/Snapshot changes; only the subsequent fresh, drift-free, media-valid ordinary Push installs the two N carriers and completes bookkeeping.",
    });
  });
});

it("AV.W18.pending-rebind.api.case.expected: another configured Project Root cannot inherit original pending authority and restoring the original binding permits recovery", async () => {
  await withWindowsSandbox("asset-recovery-rebind", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    const { before, original } = await prepareRecovery(sandbox);
    await interruptRecovery(sandbox);
    const interrupted = await observePush(root);
    assertFrozenPending(interrupted, before, original);
    const otherRoot = join(root, "OtherGame");
    await cp(join(root, "Game"), otherRoot, { recursive: true });
    const otherBefore = await pushTree(otherRoot);
    const configPath = join(root, "rpgmaker-event-dsl.config.json");
    const reboundConfig = { ...JSON.parse(before.config), projectRoot: "./OtherGame" };
    await writeFile(configPath, JSON.stringify(reboundConfig));
    const rebound = await observePush(root);
    const refused = await controlledPush(sandbox, {
      boundary: "asset-no-media-query",
      assetProjectRoots: [otherRoot],
    });
    expect(refused.exitCode).toBe(1);
    expect(refused.message + refused.stderr).toContain("Project Root Binding mismatch");
    expect(refused.message + refused.stderr).toContain("asset check not run");
    expect(refused.messages.filter((message) => message.kind === "asset-query")).toEqual([]);
    expect(await observePush(root)).toEqual(rebound);
    expect(await pushTree(otherRoot)).toEqual(otherBefore);
    await writeFile(configPath, before.config);
    const restored = await observePush(root);
    const resumed = await controlledPush(sandbox, { assetProjectRoots: [otherRoot] });
    expect(resumed.exitCode).toBe(0);
    expect(resumed.messages.some((message) => message.kind === "asset-query")).toBe(true);
    expect(await observePush(root)).toEqual(expectedCompletedState(restored, before, original));
    expect(await pushTree(otherRoot)).toEqual(otherBefore);
    recordAssetInput({
      interrupted,
      reboundConfig,
      rebound,
      otherBefore,
      refused,
      restored,
      resumed,
      after: await observePush(root),
      otherAfter: await pushTree(otherRoot),
      expected:
        "Reject wrong binding with both real project/media trees and original pending intact; only restoration of the exact original target permits completing old bookkeeping and a separate current no-diff asset pass.",
    });
  });
});

it("AV.W19.recovery.api.case.expected: completed, abandoned and refused recovery each preserve the full media/input/external-data tree and allow only their specified data bookkeeping", async () => {
  for (const outcome of ["completed", "abandoned", "refused"] as const)
    await withWindowsSandbox(`asset-recovery-state-${outcome}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      const { before, original } = await prepareRecovery(sandbox);
      await preconstructPending(root, before, original);
      if (outcome === "completed") await installGenerated(root, before);
      if (outcome === "refused")
        await writeFile(
          join(root, "Game/data/CommonEvents.json"),
          decoded(before.state!["generated-project-data/CommonEvents.json"]!),
        );
      await deleteRecoveryMedia(root);
      const recoveryInput = await observePush(root);
      assertFrozenPending(recoveryInput, before, original);
      if (outcome === "refused") {
        await refuseRecoveryUnchanged(sandbox);
        expect(await observePush(root)).toEqual(recoveryInput);
      } else {
        const actual = await controlledPush(sandbox, {});
        expect(actual.exitCode).toBe(1);
        expect(actual.message + actual.stderr).toContain("MV-ASSET-MISSING-FILE");
        expect(actual.message + actual.stderr).not.toContain("Interrupted Push");
        expect(actual.messages.some((message) => message.kind === "asset-query")).toBe(true);
        expect(
          actual.messages.filter((message) => message.kind === "asset-content-read-attempt"),
        ).toEqual([]);
        const expected =
          outcome === "completed"
            ? expectedCompletedState(recoveryInput, before, original)
            : { ...recoveryInput, state: before.state };
        expect(await observePush(root)).toEqual(expected);
        recordAssetInput({
          outcome,
          recoveryInput,
          actual,
          after: await observePush(root),
          expectedState: expected,
          expected:
            "Completed: only the two specified Snapshot rows and frozen-basis Manifest change. Abandoned: only old pending is retired; the current missing-media gate prohibits new writes. Both preserve all source/config/dependency/generated/external/media bytes.",
        });
      }
    });
});
