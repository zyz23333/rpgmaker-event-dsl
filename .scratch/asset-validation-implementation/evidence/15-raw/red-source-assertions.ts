import { rm, appendFile, readFile, writeFile, cp, mkdir, rename, symlink } from "node:fs/promises";
import { join } from "node:path";
import { expect, test } from "vitest";
import { createAssetTest, recordAssetInput } from "./support/asset-evidence.js";
import { withWindowsSandbox } from "./support/windows-sandbox.js";
import {
  pushApi,
  preparePush,
  observePush,
  putPushFile,
  pushPicturePath,
  pushSourceName,
  controlledPush,
  pushTree,
  observedEvaluationPush,
} from "./support/asset-push-workspace.js";
import { preparePushGraph, verifyPushGraph, graphMedia } from "./support/asset-push-graph.js";

const it = createAssetTest({ ownerTicket: "14", testSource: import.meta.url });
const postwrite = createAssetTest({ ownerTicket: "15", testSource: import.meta.url });
const graphAffected = ["CommonEvents.json", "Map001.json", "Troops.json"];
type PushObservation = Awaited<ReturnType<typeof observePush>>;

function assertAllGraphWritesInstalled(before: PushObservation, checkpoint: PushObservation) {
  const expectedProject = { ...before.project };
  for (const file of graphAffected) {
    expectedProject[`data/${file}`] = before.state![`generated-project-data/${file}`]!;
    expect(checkpoint.state![`pending-push/backup/${file}`]).toBe(
      before.state![`project-data-snapshot/${file}`],
    );
  }
  expect(withoutStage(checkpoint.project)).toEqual(expectedProject);
  expect(withoutPending(checkpoint.state)).toEqual(before.state);
  const pending = JSON.parse(
    Buffer.from(checkpoint.state!["pending-push/pending-push.json"]!, "base64").toString(),
  );
  expect(pending.affectedFiles.map((entry: { relativePath: string }) => entry.relativePath)).toEqual(
    graphAffected,
  );
  expect(pending.originalManifest).toEqual(
    JSON.parse(Buffer.from(before.state!["sync-manifest.json"]!, "base64").toString()),
  );
  recordAssetInput({ before, allInstalledBeforeBookkeeping: checkpoint, graphAffected });
}

function assertNoPostwriteMediaQuery(actual: Awaited<ReturnType<typeof controlledPush>>) {
  const checkpoint = actual.messages.findIndex((message) => message.kind === "checkpoint");
  expect(checkpoint).toBeGreaterThanOrEqual(0);
  expect(actual.messages.slice(0, checkpoint).some((message) => message.kind === "asset-query")).toBe(
    true,
  );
  expect(actual.messages.slice(checkpoint + 1).filter((message) => message.kind === "asset-query")).toEqual([]);
  expect(actual.messages.filter((message) => message.kind === "asset-content-read-attempt")).toEqual([]);
}

postwrite("AV.W13.source.api.postwrite.expected: changed source after all live installations refuses normal bookkeeping and retains evidence", async () => {
  await withWindowsSandbox("asset-push-postwrite-source", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await preparePushGraph(sandbox);
    await pushApi.compileWorkspace({ workspaceRoot: root, check: false });
    await verifyPushGraph(root);
    const before = await observePush(root);
    let changed!: PushObservation;
    const actual = await controlledPush(
      sandbox,
      { boundary: "push-after-install", captureFile: "Troops.json", allowDestructive: true },
      async () => {
        assertAllGraphWritesInstalled(before, await observePush(root));
        await appendFile(join(root, pushSourceName), "\n// postwrite source change\n");
        changed = await observePush(root);
        recordAssetInput({ driverChanged: changed });
      },
    );
    expect(actual.exitCode).toBe(1);
    expect(actual.message + actual.stderr).toMatch(/stale|changed/i);
    expect(actual.message + actual.stderr).not.toContain("asset check not run");
    assertNoPostwriteMediaQuery(actual);
    expect(await observePush(root)).toEqual({ ...changed, project: withoutStage(changed.project) });
  });
});
for (const mode of ["api", "cli"] as const)
  it(`AV.W20.generated-roots-and-relations.${mode}.case.expected: Push rebuilds current generated roots and captured direct shared/cyclic relations`, async () => {
    await withWindowsSandbox(`asset-push-generated-${mode}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      await preparePushGraph(sandbox);
      await pushApi.compileWorkspace({ workspaceRoot: root, check: false });
      const expected = await verifyPushGraph(root);
      for (const path of graphMedia) await rm(join(root, "Game", path));
      const before = await observePush(root),
        actual = await controlledPush(sandbox, { mode, allowDestructive: true });
      expect(actual.exitCode).toBe(1);
      const text = actual.message + actual.stderr;
      expect(text).toContain("6 problem group(s), 6 problem file(s), 6 affected use(s)");
      expect(text).not.toContain("ObsoletePoster");
      expect(text).not.toContain("Unselected");
      for (const use of [...expected.expectedUses, ...expected.expectedActionUses])
        expect(text).toContain(`${use.identity} ${use.nativePath}`);
      expect((text.match(/  - error /gu) ?? []).length).toBe(6);
      const callLines = text
        .split("\n")
        .filter((line) => /^  - (?:commonEvent:|map:|troop:).* -> commonEvent:/u.test(line));
      expect(callLines).toHaveLength(8);
      for (const edge of [...expected.expectedCalls, ...expected.expectedActionCalls])
        expect(
          callLines.filter((line) =>
            line.includes(`${edge.caller} ${edge.nativePath} -> ${edge.target}`),
          ),
        ).toHaveLength(1);
      expect(text).toContain(
        "Skills.json[1].animationId (Forced action Skill animation) -> Animations.json[2].animation1Name (Animation image sheet)",
      );
      expect(text).toContain("Skills.json[1].effects[0].dataId (Skill Common Event effect)");
      expect(text).toContain("Skills.json[1].effects[1].dataId (Skill Common Event effect)");
      expect(actual.messages.some((m) => m.kind === "asset-query")).toBe(true);
      expect(actual.messages.filter((m) => m.kind === "asset-content-read-attempt")).toEqual([]);
      expect(await observePush(root)).toEqual(before);
      for (const path of graphMedia) await putPushFile(root, `Game/${path}`);
      const repaired = await observePush(root),
        retry = await controlledPush(sandbox, { mode, allowDestructive: true });
      expect(retry.exitCode).toBe(0);
      await successfulPush(root, repaired, ["CommonEvents.json", "Map001.json", "Troops.json"]);
    });
  });
it("AV.W19.push-failure.api.case.expected: a prewrite indirect asset error preserves every project and state byte", async () => {
  await withWindowsSandbox("asset-push-media-failure", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await preparePushGraph(sandbox);
    await pushApi.compileWorkspace({ workspaceRoot: root, check: false });
    await rm(join(root, "Game/audio/se/GraphSound.ogg"));
    const before = await observePush(root),
      actual = await controlledPush(sandbox, { allowDestructive: true });
    expect(actual.exitCode).toBe(1);
    expect(actual.message).toContain('audio/se "GraphSound"');
    expect(actual.message).toContain("Animation timing sound effect");
    expect(await observePush(root)).toEqual(before);
    expect(actual.messages.filter((m) => m.kind === "asset-content-read-attempt")).toEqual([]);
    recordAssetInput({
      before,
      after: await observePush(root),
      expected:
        "Prewrite asset failure: no media, data, Snapshot, Manifest, generated or backup publication; no pending/staging remains.",
    });
  });
});
for (const [id, label] of [
  ["AV.W19.push-success.api.case.expected", "asset-push-media-success"],
  ["AV.C13.push-success.formal.case.expected", "asset-push-owned-boundary"],
] as const)
  it(`${id}: successful Push changes only affected owned data and normal bookkeeping`, async () => {
    await withWindowsSandbox(label, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      await preparePushGraph(sandbox);
      await pushApi.compileWorkspace({ workspaceRoot: root, check: false });
      await verifyPushGraph(root);
      const before = await observePush(root);
      const actual = await controlledPush(sandbox, { allowDestructive: true });
      expect(actual.exitCode).toBe(0);
      expect(actual.messages.filter((m) => m.kind === "asset-content-read-attempt")).toEqual([]);
      await successfulPush(root, before, ["CommonEvents.json", "Map001.json", "Troops.json"]);
    });
  });
it("AV.W20.no-historical-report.api.case.expected: each new Push queries media afresh despite a recorded successful Compile", async () => {
  await withWindowsSandbox("asset-push-no-history", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await preparePush(sandbox);
    await pushApi.compileWorkspace({ workspaceRoot: root, check: false });
    const compiled = await observePush(root);
    recordAssetInput({
      historicalCompile: { success: true, state: compiled.state },
      expected: "Historical success is evidence only and never authorizes current Push.",
    });
    await rm(join(root, pushPicturePath));
    const missing = await observePush(root),
      failed = await controlledPush(sandbox, {});
    expect(failed.exitCode).toBe(1);
    expect(failed.message).toContain("MV-ASSET-MISSING-FILE");
    expect(failed.messages.some((m) => m.kind === "asset-query")).toBe(true);
    expect(await observePush(root)).toEqual(missing);
    await putPushFile(root);
    const repaired = await observePush(root),
      success = await controlledPush(sandbox, {});
    expect(success.exitCode).toBe(0);
    expect(success.messages.some((m) => m.kind === "asset-query")).toBe(true);
    await successfulPush(root, repaired);
    const synchronized = await observePush(root),
      noDiff = await controlledPush(sandbox, {});
    expect(noDiff.exitCode).toBe(0);
    expect(noDiff.messages.some((m) => m.kind === "asset-query")).toBe(true);
    expect(await observePush(root)).toEqual(synchronized);
  });
});
it("AV.W20.no-dsl-reevaluation.api.case.expected: the actual evaluator observer hits Compile, stays explicitly zero through Push, and hits unchanged-source Check again", async () => {
  await withWindowsSandbox("asset-push-no-evaluation", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await preparePush(sandbox);
    await pushApi.compileWorkspace({ workspaceRoot: root, check: false });
    const before = await observePush(root);
    const actual = await observedEvaluationPush(sandbox);
    expect(actual.report.error).toBeUndefined();
    expect(actual.exitCode).toBe(0);
    expect(actual.report.ok).toBe(true);
    expect(actual.report.pauses).toEqual([]);
    expect(actual.report.phases).toEqual([
      { operation: "warm Compile", observed: false },
      { operation: "Compile positive control", count: expect.any(Number) },
      { operation: "Push", count: 0 },
      { operation: "unchanged-source Check positive control", count: expect.any(Number) },
    ]);
    expect(actual.report.phases[1].count).toBeGreaterThan(0);
    expect(actual.report.phases[3].count).toBeGreaterThan(0);
    expect(actual.report.observer.runtimeSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(actual.report.observer.diskSha256).toMatch(/^[a-f0-9]{64}$/);
    await successfulPush(root, before);
  });
});
for (const branch of ["freshness", "integrity", "invalid-exception"] as const)
  test(`Push prerequisite ${branch} failure reports the asset check was not run`, async () => {
    await withWindowsSandbox(`asset-push-notrun-${branch}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      await preparePush(sandbox);
      await pushApi.compileWorkspace({ workspaceRoot: root, check: false });
      if (branch === "freshness")
        await appendFile(join(root, pushSourceName), "\n// stale input\n");
      if (branch === "integrity")
        await appendFile(
          join(root, ".rpgmaker-event-dsl/generated-project-data/CommonEvents.json"),
          "\n",
        );
      if (branch === "invalid-exception") {
        const path = join(root, "rpgmaker-event-dsl.config.json"),
          config = JSON.parse(await readFile(path, "utf8"));
        config.assetCheckExceptions = [
          { category: "image", folder: "pictures", name: "*", reason: "invalid" },
        ];
        await writeFile(path, JSON.stringify(config));
      }
      const before = await observePush(root),
        actual = await controlledPush(sandbox, { boundary: "asset-no-media-query" });
      expect(actual.exitCode).toBe(1);
      expect(actual.message + actual.stderr).toContain("push asset check not run");
      expect(actual.message + actual.stderr).not.toContain("compile asset check");
      expect(actual.messages.filter((m) => m.kind === "asset-query")).toEqual([]);
      expect(await observePush(root)).toEqual(before);
    });
  });

for (const branch of [
  "presence",
  "case-match",
  "path-type",
  "path-link",
  "queryability",
  "failure-location",
  "improvement",
] as const)
  it(`AV.W11.${branch}.api.push-gate.expected: the sole staged asset gate uses current file facts`, async () => {
    await withWindowsSandbox(`asset-push-current-${branch}`, async (sandbox) => {
      const root = sandbox.workspaceRoot,
        warning = branch === "failure-location",
        initialMissing = warning || branch === "improvement";
      await preparePush(sandbox, {
        ...(initialMissing
          ? {
              exceptions: [
                {
                  category: "image",
                  folder: "pictures",
                  name: "PushPoster",
                  reason: "optional test image",
                },
              ],
            }
          : {}),
      });
      if (initialMissing) await rm(join(root, pushPicturePath));
      await pushApi.compileWorkspace({ workspaceRoot: root, check: false });
      let changed!: Awaited<ReturnType<typeof observePush>>;
      const actual = await controlledPush(
        sandbox,
        {
          boundary: "asset-before-pass",
          ...(branch === "queryability" ? { assetFault: "enumeration" as const } : {}),
        },
        async () => {
          if (branch === "presence") await rm(join(root, pushPicturePath));
          if (branch === "case-match") {
            await rename(
              join(root, pushPicturePath),
              join(root, "Game/img/pictures/temporary.png"),
            );
            await rename(
              join(root, "Game/img/pictures/temporary.png"),
              join(root, "Game/img/pictures/pushposter.png"),
            );
          }
          if (branch === "path-type") {
            await rm(join(root, pushPicturePath));
            await mkdir(join(root, pushPicturePath));
          }
          if (branch === "path-link") {
            await rm(join(root, pushPicturePath));
            const target = join(sandbox.root, "external image directory");
            await mkdir(target);
            await symlink(target, join(root, pushPicturePath), "junction");
          }
          if (warning) await rm(join(root, "Game/img/pictures"), { recursive: true });
          if (branch === "improvement") await putPushFile(root);
          changed = await observePush(root);
          expect(
            Object.keys(changed.project!).some((key) => key.startsWith("data/push-staging.tmp-")),
          ).toBe(true);
        },
      );
      const succeeds = warning || branch === "improvement",
        text = actual.message + actual.stderr + actual.stdout;
      expect(actual.exitCode).toBe(succeeds ? 0 : 1);
      const codes = {
        presence: "MISSING-FILE",
        "case-match": "NAME-MISMATCH",
        "path-type": "PATH-TYPE",
        "path-link": "UNSUPPORTED-LINK",
        queryability: "QUERY-FAILED",
        "failure-location": "MISSING-DIRECTORY",
        improvement: null,
      };
      if (codes[branch])
        expect(text).toContain(`${warning ? "warning" : "error"} MV-ASSET-${codes[branch]}`);
      if (branch === "improvement") expect(text).not.toContain("error MV-ASSET-");
      if (branch === "queryability")
        expect(text).toContain("Controlled asset workflow enumeration denied");
      expect(text).not.toMatch(/changed during.*asset|asset.*changed during/i);
      expect(actual.messages.some((m) => m.kind === "asset-query")).toBe(true);
      expect(actual.messages.filter((m) => m.kind === "asset-content-read-attempt")).toEqual([]);
      const cleanBefore = { ...changed, project: withoutStage(changed.project) };
      if (succeeds) await successfulPush(root, cleanBefore);
      else expect(await observePush(root)).toEqual(cleanBefore);
      recordAssetInput({
        branch,
        driverChanged: changed,
        expected: succeeds
          ? "current valid/warning facts permit normal Push"
          : "current asset error leaves no replacement, pending or staging",
      });
    });
  });
function withoutStage(project: Record<string, string> | null) {
  return Object.fromEntries(
    Object.entries(project ?? {}).filter(([key]) => !key.startsWith("data/push-staging.tmp-")),
  );
}
async function successfulPush(
  root: string,
  before: Awaited<ReturnType<typeof observePush>>,
  changedFiles = ["CommonEvents.json"],
) {
  const after = await observePush(root),
    expectedProject = { ...before.project };
  for (const file of changedFiles)
    expectedProject[`data/${file}`] = before.state![`generated-project-data/${file}`]!;
  expect(after.project).toEqual(expectedProject);
  expect({ ...after, project: before.project, state: before.state }).toEqual(before);
  const retained = (state: Record<string, string> | null) =>
    Object.fromEntries(
      Object.entries(state ?? {}).filter(
        ([key]) =>
          key !== "sync-manifest.json" &&
          !changedFiles.some((file) => key === `project-data-snapshot/${file}`),
      ),
    );
  expect(retained(after.state)).toEqual(retained(before.state));
  for (const file of changedFiles)
    expect(after.state![`project-data-snapshot/${file}`]).toBe(
      before.state![`generated-project-data/${file}`],
    );
  const original = JSON.parse(
      Buffer.from(before.state!["sync-manifest.json"]!, "base64").toString(),
    ),
    current = JSON.parse(Buffer.from(after.state!["sync-manifest.json"]!, "base64").toString());
  const expectedSnapshot = original.snapshotFiles.map(
    (entry: { relativePath: string; hash: string }) =>
      changedFiles.includes(entry.relativePath)
        ? original.generatedFiles.find(
            (generated: { relativePath: string }) => generated.relativePath === entry.relativePath,
          )
        : entry,
  );
  expect(current).toEqual({
    ...original,
    snapshotFiles: expectedSnapshot,
    compileBaseline: {
      ...original.compileBaseline,
      snapshotFiles: expectedSnapshot,
      hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    },
  });
  expect(current.compileBaseline.hash).not.toBe(original.compileBaseline.hash);
  if (changedFiles.includes("Map001.json")) {
    const oldMap = JSON.parse(
        Buffer.from(before.project!["data/Map001.json"]!, "base64").toString(),
      ),
      newMap = JSON.parse(Buffer.from(after.project!["data/Map001.json"]!, "base64").toString());
    expect({ ...newMap, events: oldMap.events }).toEqual(oldMap);
  }
  if (changedFiles.includes("Troops.json")) {
    const oldTroop = JSON.parse(
        Buffer.from(before.project!["data/Troops.json"]!, "base64").toString(),
      )[1],
      newTroop = JSON.parse(
        Buffer.from(after.project!["data/Troops.json"]!, "base64").toString(),
      )[1];
    expect({ ...newTroop, pages: oldTroop.pages }).toEqual(oldTroop);
  }
  expect(await pushApi.isGeneratedProjectDataFresh({ workspaceRoot: root })).toBe(true);
  recordAssetInput({
    before,
    after,
    allowedChangedData: changedFiles,
    expected:
      "Only affected owned data, matching Snapshot files and normal Manifest bookkeeping; media/inputs/external data preserved; no staging or pending remains.",
  });
  return after;
}
it("AV.W08.delete-diff-push-repair.api.case.expected: current missing media blocks Push and a repair permits retry without Compile", async () => {
  await withWindowsSandbox("asset-push-retry", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await preparePush(sandbox);
    await pushApi.compileWorkspace({ workspaceRoot: root, check: false });
    await rm(join(root, pushPicturePath));
    const before = await observePush(root);
    expect(await pushApi.isGeneratedProjectDataFresh({ workspaceRoot: root })).toBe(true);
    await pushApi.diffWorkspace({ workspaceRoot: root });
    expect(await observePush(root)).toEqual(before);
    await expect(
      pushApi.pushWorkspace({ workspaceRoot: root, allowDestructive: false }),
    ).rejects.toThrow("MV-ASSET-MISSING-FILE");
    expect(await observePush(root)).toEqual(before);
    await putPushFile(root);
    const repaired = await observePush(root);
    await pushApi.pushWorkspace({ workspaceRoot: root, allowDestructive: false });
    await successfulPush(root, repaired);
    recordAssetInput({
      before,
      after: await observePush(root),
      expected:
        "Diff only; Push missing rejects without publication/pending; repair succeeds using existing generated bytes.",
    });
  });
});
for (const mode of ["api", "cli"] as const)
  it(`AV.W05.error-after-staging.${mode}.case.expected: a missing current asset after staging leaves no pending or replacements`, async () => {
    await withWindowsSandbox(`asset-push-stage-${mode}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      await preparePush(sandbox);
      await pushApi.compileWorkspace({ workspaceRoot: root, check: false });
      let changed!: Awaited<ReturnType<typeof observePush>>;
      const actual = await controlledPush(
        sandbox,
        { mode, boundary: "asset-before-pass" },
        async () => {
          const staged = await observePush(root);
          expect(
            Object.keys(staged.project!).some((key) => key.startsWith("data/push-staging.tmp-")),
          ).toBe(true);
          expect(staged.state!["pending-push/"]).toBeUndefined();
          await rm(join(root, pushPicturePath));
          changed = await observePush(root);
          recordAssetInput({ staged, driverChanged: changed });
        },
      );
      expect(actual.exitCode).toBe(1);
      const text = actual.message + actual.stderr;
      expect(text).toContain("error MV-ASSET-MISSING-FILE");
      expect(text).toContain("before pending state or Project Root replacement");
      expect(text).not.toContain("Project Root replacement failed");
      const after = await observePush(root);
      expect(after).toEqual({ ...changed, project: withoutStage(changed.project) });
      expect(after.state!["pending-push/"]).toBeUndefined();
      expect(actual.messages.some((m) => m.kind === "asset-query")).toBe(true);
      expect(actual.messages.filter((m) => m.kind === "asset-content-read-attempt")).toEqual([]);
    });
  });
it("AV.W05.repair-after-staging.api.case.expected: a file repaired before the single staged gate permits normal Push", async () => {
  await withWindowsSandbox("asset-push-stage-repair", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await preparePush(sandbox);
    await pushApi.compileWorkspace({ workspaceRoot: root, check: false });
    await rm(join(root, pushPicturePath));
    let changed!: Awaited<ReturnType<typeof observePush>>;
    const actual = await controlledPush(sandbox, { boundary: "asset-before-pass" }, async () => {
      await putPushFile(root);
      changed = await observePush(root);
    });
    expect(actual.exitCode).toBe(0);
    await successfulPush(root, { ...changed, project: withoutStage(changed.project) });
  });
});
for (const mode of ["api", "cli"] as const)
  it(`AV.W07.no-diff-asset-error.${mode}.case.expected: synchronized data still checks current media and creates no pending on asset error`, async () => {
    await withWindowsSandbox(`asset-push-no-diff-${mode}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      await preparePush(sandbox);
      await pushApi.compileWorkspace({ workspaceRoot: root, check: false });
      await pushApi.pushWorkspace({ workspaceRoot: root, allowDestructive: false });
      await rm(join(root, pushPicturePath));
      const before = await observePush(root),
        actual = await controlledPush(sandbox, { mode });
      expect(actual.exitCode).toBe(1);
      expect(actual.message + actual.stderr).toContain("error MV-ASSET-MISSING-FILE");
      expect(await observePush(root)).toEqual(before);
      expect(actual.messages.some((m) => m.kind === "asset-query")).toBe(true);
    });
  });
it("AV.W07.no-diff-data-drift.api.case.expected: full standard data drift rejects before the asset pass", async () => {
  await withWindowsSandbox("asset-push-no-diff-drift", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await preparePush(sandbox);
    await pushApi.compileWorkspace({ workspaceRoot: root, check: false });
    await pushApi.pushWorkspace({ workspaceRoot: root, allowDestructive: false });
    await writeFile(
      join(root, "Game/data/Actors.json"),
      JSON.stringify([null, { id: 1, name: "External drift" }]),
    );
    await rm(join(root, pushPicturePath));
    const before = await observePush(root),
      actual = await controlledPush(sandbox, { boundary: "asset-no-media-query" });
    expect(actual.exitCode).toBe(1);
    expect(actual.message + actual.stderr).toContain("Project Drift");
    expect(actual.message + actual.stderr).toContain("push asset check not run");
    expect(actual.messages.filter((m) => m.kind === "asset-query")).toEqual([]);
    expect(await observePush(root)).toEqual(before);
  });
});
it("AV.W08.delete-diff-push-repair.cli.case.expected: actual CLI queries the repaired current file without requiring Compile", async () => {
  await withWindowsSandbox("asset-push-cli-retry", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await preparePush(sandbox);
    await pushApi.compileWorkspace({ workspaceRoot: root, check: false });
    await rm(join(root, pushPicturePath));
    const before = await observePush(root);
    const { runPushOperation } = await import("./support/asset-push-workspace.js");
    const actualDiff = await runPushOperation(sandbox, {
      operation: "diff",
      mode: "cli",
      observeAssets: true,
      boundary: "asset-no-media-query",
    });
    expect(actualDiff.exitCode).toBe(0);
    expect(actualDiff.messages.filter((m) => m.kind === "asset-query")).toEqual([]);
    const failed = await controlledPush(sandbox, { mode: "cli" });
    expect(failed.exitCode).toBe(1);
    expect(failed.stderr).toContain("error MV-ASSET-MISSING-FILE");
    expect(await observePush(root)).toEqual(before);
    await putPushFile(root);
    const repaired = await observePush(root),
      success = await controlledPush(sandbox, { mode: "cli" });
    expect(success.exitCode).toBe(0);
    await successfulPush(root, repaired);
  });
});
it("AV.W13.source.cli.prewrite.expected: actual CLI retains the changed source and stops before replacement", async () => {
  await withWindowsSandbox("asset-push-source-cli", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await preparePush(sandbox);
    await pushApi.compileWorkspace({ workspaceRoot: root, check: false });
    const before = await observePush(root);
    let changed!: Awaited<ReturnType<typeof observePush>>;
    const actual = await controlledPush(
      sandbox,
      { mode: "cli", boundary: "push-prewrite" },
      async () => {
        await appendFile(join(root, pushSourceName), "\n// CLI driver change\n");
        changed = await observePush(root);
      },
    );
    expect(actual.exitCode).toBe(1);
    expect(actual.stderr).toContain("stale");
    const after = await observePush(root);
    expect(after.project).toEqual(before.project);
    expect({ ...after, project: changed.project, state: changed.state }).toEqual(changed);
    expect(withoutPending(after.state)).toEqual(withoutPending(changed.state));
    recordAssetInput({
      before,
      driverChanged: changed,
      after,
      expected:
        "Changed source preserved; no replacement or normal bookkeeping; pending already established may remain.",
    });
  });
});
test("no-write completion retains input guards after the sole asset pass", async () => {
  await withWindowsSandbox("asset-push-no-diff-input", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await preparePush(sandbox);
    await pushApi.compileWorkspace({ workspaceRoot: root, check: false });
    await pushApi.pushWorkspace({ workspaceRoot: root, allowDestructive: false });
    const actual = await controlledPush(sandbox, { boundary: "asset-before-pass" }, async () => {
      await appendFile(join(root, pushSourceName), "\n// changed at no-write gate\n");
    });
    expect(actual.exitCode).toBe(1);
    expect(actual.message + actual.stderr).toMatch(/stale|changed/i);
  });
});
function withoutPending(state: Record<string, string> | null) {
  return Object.fromEntries(
    Object.entries(state ?? {}).filter(([key]) => !key.startsWith("pending-push/")),
  );
}
for (const branch of [
  "validation-dependency",
  "config",
  "exception",
  "snapshot",
  "generated",
  "binding",
] as const)
  it(`AV.W13.${branch}.api.prewrite.expected: changed captured inputs or write authority stop before the first replacement`, async () => {
    await withWindowsSandbox(`asset-push-input-${branch}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      await preparePush(sandbox);
      await pushApi.compileWorkspace({ workspaceRoot: root, check: false });
      const before = await observePush(root);
      let changed!: Awaited<ReturnType<typeof observePush>>,
        other: Record<string, string> | null = null;
      const actual = await controlledPush(sandbox, { boundary: "push-prewrite" }, async () => {
        const configPath = join(root, "rpgmaker-event-dsl.config.json");
        if (branch === "validation-dependency")
          await appendFile(join(root, "types/push-input.ts"), "\n// dependency changed\n");
        if (branch === "snapshot")
          await appendFile(
            join(root, ".rpgmaker-event-dsl/project-data-snapshot/Actors.json"),
            "\n",
          );
        if (branch === "generated")
          await appendFile(
            join(root, ".rpgmaker-event-dsl/generated-project-data/CommonEvents.json"),
            "\n",
          );
        if (branch === "config" || branch === "exception" || branch === "binding") {
          const config = JSON.parse(await readFile(configPath, "utf8"));
          if (branch === "config") config.scriptEnabled = true;
          if (branch === "exception")
            config.assetCheckExceptions = [
              {
                category: "image",
                folder: "pictures",
                name: "Other",
                reason: "driver policy change",
              },
            ];
          if (branch === "binding") {
            await cp(join(root, "Game"), join(root, "OtherGame"), { recursive: true });
            config.projectRoot = "./OtherGame";
            other = await pushTree(join(root, "OtherGame"));
          }
          await writeFile(configPath, JSON.stringify(config));
        }
        changed = await observePush(root);
      });
      expect(actual.exitCode).toBe(1);
      expect(actual.message + actual.stderr).toMatch(
        /stale|changed|integrity|configuration|binding/i,
      );
      const after = await observePush(root);
      expect(after.project).toEqual(before.project);
      expect({ ...after, project: changed.project, state: changed.state }).toEqual(changed);
      expect(withoutPending(after.state)).toEqual(withoutPending(changed.state));
      if (branch === "binding") expect(await pushTree(join(root, "OtherGame"))).toEqual(other);
      recordAssetInput({
        before,
        driverChanged: changed,
        after,
        other,
        expected:
          "No Project Root data replacement; changed input is preserved; normal bookkeeping is refused; an already created pending is allowed.",
      });
    });
  });
it("AV.W13.source.api.prewrite.expected: source changes after pending installation stop all data replacement", async () => {
  await withWindowsSandbox("asset-push-source", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await preparePush(sandbox);
    await pushApi.compileWorkspace({ workspaceRoot: root, check: false });
    const before = await observePush(root);
    let changed!: Awaited<ReturnType<typeof observePush>>;
    const actual = await controlledPush(sandbox, { boundary: "push-prewrite" }, async () => {
      await appendFile(join(root, pushSourceName), "\n// changed by driver\n");
      changed = await observePush(root);
    });
    expect(actual.exitCode).toBe(1);
    expect(actual.message + actual.stderr).toMatch(/stale|changed/i);
    const after = await observePush(root);
    expect(after.project).toEqual(before.project);
    expect({ ...after, project: changed.project, state: changed.state }).toEqual(changed);
    expect(withoutPending(after.state)).toEqual(withoutPending(changed.state));
    recordAssetInput({
      before,
      driverChanged: changed,
      after,
      expected:
        "Changed source preserved; no replacement or normal bookkeeping; pending already established may remain.",
    });
  });
});
