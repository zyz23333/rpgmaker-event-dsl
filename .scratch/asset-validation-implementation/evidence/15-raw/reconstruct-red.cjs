// Reproduce the original recorded insertion against its unchanged Git base, then
// require equality with the SHA recorded by the actual red execution before saving.
const fs = require("node:fs");
const cp = require("node:child_process");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");
const folder = ".scratch/asset-validation-implementation/evidence/15-raw/";
const base = cp.execFileSync("git", ["show", "88fc6f95ead560784fd0128e951058f7f8eab008:packages/rpgmaker-event-dsl/test/asset-push-workspace.test.ts"], { encoding: "utf8" });
const marker = 'const it = createAssetTest({ ownerTicket: "14", testSource: import.meta.url });\n';
const file = "${file}";
const insertion = String.raw`const postwrite = createAssetTest({ ownerTicket: "15", testSource: import.meta.url });
const graphAffected = ["CommonEvents.json", "Map001.json", "Troops.json"];
type PushObservation = Awaited<ReturnType<typeof observePush>>;

function assertAllGraphWritesInstalled(before: PushObservation, checkpoint: PushObservation) {
  const expectedProject = { ...before.project };
  for (const file of graphAffected) {
    expectedProject[§data/${file}§] = before.state![§generated-project-data/${file}§]!;
    expect(checkpoint.state![§pending-push/backup/${file}§]).toBe(
      before.state![§project-data-snapshot/${file}§],
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
`.replaceAll("§", "`");
const reconstructed = base.replace(marker, marker + insertion);
const receipt = JSON.parse(fs.readFileSync(folder + "red-source-receipt.json", "utf8"));
assert.equal(crypto.createHash("sha256").update(reconstructed).digest("hex"), receipt.expected.sha256);
fs.writeFileSync(folder + "red-source-assertions.ts", reconstructed);
console.log("Original red assertions reconstructed byte-for-byte and verified against the original execution SHA-256.");
