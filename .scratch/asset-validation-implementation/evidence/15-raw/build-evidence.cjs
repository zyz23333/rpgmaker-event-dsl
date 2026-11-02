const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const cp = require("node:child_process");
const assert = require("node:assert/strict");
const root = process.cwd();
const history = ".scratch/asset-validation-implementation/evidence/15-raw";
const frozen = process.argv[2];
assert.match(frozen, /^[0-9a-f]{40}$/);
const sha = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const gitBlob = bytes => crypto.createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
const read = name => fs.readFileSync(path.join(root, name));
const json = name => JSON.parse(read(name).toString("utf8").replace(/^\uFEFF/, ""));
const primaryIds = [
  "AV.W06.delete-after-writes.api.case.expected",
  "AV.W06.delete-after-writes.cli.case.expected",
  "AV.W06.type-change-after-writes.api.case.expected",
  "AV.W13.binding.api.postwrite.expected",
  "AV.W13.config.api.postwrite.expected",
  "AV.W13.exception.api.postwrite.expected",
  "AV.W13.generated.api.postwrite.expected",
  "AV.W13.snapshot.api.postwrite.expected",
  "AV.W13.source.api.postwrite.expected",
  "AV.W13.source.cli.postwrite.expected",
  "AV.W13.validation-dependency.api.postwrite.expected",
  "AV.W19.push-failure.api.case.expected",
];
const supportingIds = ["AV.W19.push-success.api.case.expected"];
const planPath = "M:/Shuen/Codex/asset-validation-notes/final-canonical-id-plan.json";
const planBytes = fs.readFileSync(planPath);
const planHash = "869c6752eedb1997e0ccbca5e3bce81c74122ce68f4600c970822ce37b9841b6";
assert.equal(sha(planBytes), planHash);
const plan = JSON.parse(planBytes);
assert.deepEqual(primaryIds, plan.perTicket["15"].primaryIds);
assert.deepEqual(supportingIds, plan.perTicket["15"].supportingIds);
const sourceFile = "packages/rpgmaker-event-dsl/test/asset-push-workspace.test.ts";
const sourceBytes = cp.execFileSync("git", ["show", `${frozen}:${sourceFile}`]);
assert.deepEqual(read(sourceFile), sourceBytes);
const sourceHash = sha(sourceBytes);
const red = json(`${history}/red-source-receipt.json`);
assert.equal(red.status, "failed");
assert.equal(sha(read(`${history}/red-source-assertions.ts`)), red.expected.sha256);
const redCheckpoint = red.input.find(item => item.allInstalledBeforeBookkeeping);
const redOperation = red.input.find(item => item.actual);
assert.equal(redOperation.actual.exitCode, 0);
for (const file of ["CommonEvents.json", "Map001.json", "Troops.json"]) {
  assert.equal(redCheckpoint.allInstalledBeforeBookkeeping.project[`data/${file}`], redCheckpoint.before.state[`generated-project-data/${file}`]);
  assert.equal(redCheckpoint.allInstalledBeforeBookkeeping.state[`project-data-snapshot/${file}`], redCheckpoint.before.state[`project-data-snapshot/${file}`]);
  assert.equal(redCheckpoint.allInstalledBeforeBookkeeping.state[`pending-push/backup/${file}`], redCheckpoint.before.state[`project-data-snapshot/${file}`]);
}
assert.equal(redCheckpoint.allInstalledBeforeBookkeeping.state["sync-manifest.json"], redCheckpoint.before.state["sync-manifest.json"]);
const receipts = [];
const regressions = [];
const runnerSummary = name => {
  const reportPath = `${history}/${name}`;
  const report = json(reportPath);
  return {
    reportPath, bytes: read(reportPath).length, sha256: sha(read(reportPath)),
    success: report.success, total: report.numTotalTests, passed: report.numPassedTests,
    failed: report.numFailedTests, pending: report.numPendingTests,
    startedAt: new Date(report.startTime).toISOString(),
    completedAt: new Date(Math.max(...report.testResults.map(item => item.endTime))).toISOString(),
    suites: report.testResults.map(item => ({ name: item.name, status: item.status,
      total: item.assertionResults.length,
      passed: item.assertionResults.filter(test => test.status === "passed").length,
      filtered: item.assertionResults.filter(test => test.status === "pending").length })),
  };
};
for (const entry of ["source", "built"]) {
  const summary = runnerSummary(`final-${entry}-runner.json`);
  assert.equal(summary.success, true);
  assert.equal(summary.total, 45);
  assert.equal(summary.passed, 45);
  assert.equal(summary.pending, 0);
  const report = json(summary.reportPath);
  const assertions = report.testResults.flatMap(item => item.assertionResults);
  const canonical = assertions.filter(item => item.fullName.startsWith("AV."));
  assert.equal(canonical.length, 41);
  assert.equal(new Set(canonical.map(item => item.fullName.split(":")[0])).size, 41);
  for (const id of [...primaryIds, ...supportingIds]) {
    assert.equal(assertions.filter(item => item.fullName.startsWith(id + ":")).length, 1);
    const receiptPath = `${history}/${id}.${entry}.json`;
    const bytes = read(receiptPath);
    const receipt = JSON.parse(bytes);
    assert.equal(receipt.id, id);
    assert.equal(receipt.entry, entry);
    assert.equal(receipt.status, "passed");
    assert.equal(receipt.ownerTicket, id.startsWith("AV.W19.") ? "14,15" : "15");
    assert.equal(receipt.expected.sha256, sourceHash);
    assert.equal(receipt.environment.platform, "win32");
    assert.match(receipt.environment.node, /^v22\./);
    receipts.push({ id, entry, role: primaryIds.includes(id) ? "primary" : "supporting",
      receiptPath, bytes: bytes.length, sha256: sha(bytes), gitBlob: gitBlob(bytes), receipt });
  }
  const c13 = json(`${history}/AV.C13.push-success.formal.case.expected.${entry}.json`);
  assert.equal(c13.ownerTicket, "14");
  assert.equal(c13.status, "passed");
  assert.equal(c13.expected.sha256, sourceHash);
  let old;
  if (entry === "source") {
    const firstAttempt = runnerSummary("regression-source-first/runner.json");
    const recheck = runnerSummary("regression-source-recheck-runner.json");
    assert.equal(firstAttempt.total, 86);
    assert.equal(firstAttempt.passed, 85);
    assert.equal(firstAttempt.failed, 1);
    assert.equal(firstAttempt.pending, 0);
    assert.equal(firstAttempt.suites.length, 5);
    assert.equal(recheck.passed, 1);
    assert.equal(recheck.failed, 0);
    assert.equal(recheck.pending, 43);
    const originalCases = json(firstAttempt.reportPath).testResults.flatMap(item => item.assertionResults);
    const correctedCases = json(recheck.reportPath).testResults.flatMap(item => item.assertionResults);
    const failedNames = originalCases.filter(item => item.status === "failed").map(item => item.fullName);
    const correctedNames = correctedCases.filter(item => item.status === "passed").map(item => item.fullName);
    assert.deepEqual(failedNames, correctedNames);
    const unique = new Set([...originalCases.filter(item => item.status === "passed").map(item => item.fullName), ...correctedNames]);
    assert.equal(unique.size, 86);
    old = { execution: "two-execution-unique-union", total: 86, passed: 86,
      meaning: "85 original successes plus the sole corrected diagnostic branch; first attempt remains 85/86. The recheck's 43 filtered cases are not counted as passed.",
      firstAttempt, recheck, correctedNames };
  } else {
    old = runnerSummary("regression-built-runner.json");
    assert.equal(old.success, true);
    assert.equal(old.total, 86);
    assert.equal(old.failed, 0);
    assert.equal(old.pending, 0);
    assert.equal(old.suites.length, 5);
  }
  regressions.push({ entry, currentPushSuite: summary, existingSafetySuites: old });
}
const firstCommands = json(`${history}/verification-commands-first.json`);
const resumedCommands = json(`${history}/verification-commands-resume.json`);
const commands = [...firstCommands, ...resumedCommands];
assert.equal(commands.length, 7);
assert.deepEqual(commands.filter(command => command.exitCode !== 0).map(command => command.name), ["regression-source"]);
const builtArtifacts = json(`${history}/built-artifacts.json`);
for (const artifact of builtArtifacts) {
  const bytes = fs.readFileSync(artifact.path);
  assert.equal(bytes.length, artifact.bytes);
  assert.equal(sha(bytes), artifact.sha256);
}
const gitPaths = [
  ".gitattributes", "packages/rpgmaker-event-dsl/README.md",
  "packages/rpgmaker-event-dsl/src/workspace/push.ts",
  "packages/rpgmaker-event-dsl/src/workspace/push-recovery.ts",
  "packages/rpgmaker-event-dsl/src/workspace/type-inputs.ts",
  "packages/rpgmaker-event-dsl/src/workspace/config.ts",
  "packages/rpgmaker-event-dsl/src/workspace/checks.ts",
  "packages/rpgmaker-event-dsl/src/workspace/state.ts",
  "packages/rpgmaker-event-dsl/src/project-data/materialization.ts",
  "packages/rpgmaker-event-dsl/src/project-data/writer.ts",
  sourceFile,
  "packages/rpgmaker-event-dsl/test/push-recovery.test.ts",
  "packages/rpgmaker-event-dsl/test/support/asset-push-workspace.ts",
  "packages/rpgmaker-event-dsl/test/support/asset-push-graph.ts",
  "packages/rpgmaker-event-dsl/test/support/asset-evidence.ts",
  "packages/rpgmaker-event-dsl/test/support/windows-sandbox.ts",
  "packages/rpgmaker-event-dsl/test/support/workspace-operation-child.mjs",
  "packages/rpgmaker-event-dsl/test/support/workspace-operation-process.ts",
  "packages/rpgmaker-event-dsl/vitest.windows.config.ts",
];
const gitInputs = gitPaths.map(file => {
  const bytes = cp.execFileSync("git", ["show", `${frozen}:${file}`]);
  assert.deepEqual(read(file), bytes);
  return { path: file, revision: frozen, gitBlob: gitBlob(bytes), bytes: bytes.length, sha256: sha(bytes) };
});
const rawFiles = fs.readdirSync(path.join(root, history), { recursive: true, withFileTypes: true })
  .filter(item => item.isFile()).map(item => {
    const file = path.relative(root, path.join(item.parentPath, item.name)).replaceAll("\\", "/");
    const bytes = read(file);
    return { path: file, bytes: bytes.length, sha256: sha(bytes), gitBlob: gitBlob(bytes) };
  }).sort((a, b) => a.path.localeCompare(b.path));
const historical = [
  { report: runnerSummary("red-source-runner.json"), productRevision: "88fc6f95ead560784fd0128e951058f7f8eab008", assertionsPath: `${history}/red-source-assertions.ts`, assertionsSha256: red.expected.sha256, assertionsArchive: "Reconstructed from the original recorded insertion against the unchanged Git base; byte-for-byte SHA equality with the actual red receipt verified before archival. Original transformed callback is also retained in the receipt.", classification: "Product red: after three installed G0 files, source changed while S0/M0/pending remained; old product incorrectly returned exit 0." },
  { report: runnerSummary("initial-focused-runner.json"), classification: "12/13 passed. Binding changed too early: final installation staged-file cleanup encountered ENOENT before completion guard; retained as test seam failure, not a binding-guard pass." },
  { report: runnerSummary("binding-observer-runner.json"), classification: "Binding guard rejected correctly, but media observer omitted canonical A path behind junction; retained as observer failure. Explicit A/B roots now observed." },
  { report: runnerSummary("hash-order-failure/runner.json"), implementationRevision: "0d5152cf5c11ac59955a45a84d438927c621bf00", classification: "31/45 passed, 14 failed in exact baseline hash assertion. Test rebuilt Snapshot records in relativePath/hash order; persisted input order is hash/relativePath. Corrected test oracle preserves original record order and independently hashes captured generated bytes. Product did not change." },
];
const previous14Path = ".scratch/asset-validation-implementation/evidence/14-push-acceptance.json";
const canonicalRunRevision = "0212a757956f0aff0860c9e0e7a291703e8d59f4";
assert.equal(cp.execFileSync("git", ["diff", canonicalRunRevision, frozen, "--", "packages/rpgmaker-event-dsl/src", sourceFile, "packages/rpgmaker-event-dsl/test/support"]).length, 0);
const evidence = {
  schemaVersion: 1, ticket: "15", basis: "88fc6f95ead560784fd0128e951058f7f8eab008",
  implementationRevision: frozen, canonicalRunRevision,
  finalRevisionDifference: "Only the old recovery test's ordinary postwrite diagnostic expectation changed after canonical source/built 45/45 and build. Product, public/canonical assertions and test adapters are byte-identical; Git diff checked empty for those paths. No canonical rerun claimed at a different HEAD.",
  compileContractVersion: "mv-1.6.1/39",
  scope: { primaryCanonicalIds: 12, primaryReceipts: 24, supportingCanonicalIds: 1,
    supportingReceipts: 2, entries: ["source", "built"], actualCliPrimaryIdsPerEntry: 2,
    completePushSuitePerEntry: 45, canonicalPushCallbacksPerEntry: 41, supplementalTestsPerEntry: 4 },
  independentPlan: { path: planPath, sha256: planHash, authorityRevision: plan.authorityRevision,
    status: "Independent finite plan; execution status is established only by the receipts below.",
    primaryIds, supportingIds, cases: plan.cases.filter(item => [...primaryIds, ...supportingIds].includes(item.id)) },
  environment: { platform: process.platform, node: process.version, temp: process.env.TEMP,
    tmp: process.env.TMP, worktree: root, maxWorkers: 1,
    scheduling: "Final source, build, final built, old source regressions, old built regressions, and static checks run sequentially; no other agent broad-test window." },
  boundaries: { public: "Unchanged public Workspace API and actual CLI in real Windows subprocesses.",
    graphAffectedFiles: ["CommonEvents.json", "Map001.json", "Troops.json"],
    postwrite: "Real link of final Troops target; assert all three live files equal original G0, untouched standard files equal S0, original Snapshot/Manifest and original pending/backup evidence before mutation.",
    binding: "Real rm of final Troops captured original completes before checkpoint; config bytes unchanged, junction retargeted from real A to distinct valid B, both roots independently observed, A/B/alias media OS paths observed.",
    media: "Actual metadata queries before checkpoint; zero media queries after checkpoint through completion, content reads denied. W06 next separate no-diff command queries and fails current file facts, with no Compile or new pending.",
    bookkeeping: "Test-owned expected original source/type-input/config/exception/contract/binding basis, allowed affected Snapshot hashes from independently captured G0 bytes, exact persisted JSON hash; no product finalizer or baseline builder used.",
    recovery: "Historical content-proven recovery unchanged; current input guards are in ordinary Push only." },
  sharedOwnership: { failure: { id: primaryIds.at(-1), ownerTicket: "14,15", callbacks: 1,
    retained14: "Original indirect GraphSound asset-failure scenario and full-byte readonly assertions retained.",
    added15: "Postwrite external Actors data drift; three installed G0 files, external bytes, original S0/M0/pending/backups retained; no later media query or content read." },
    success: { id: supportingIds[0], ownerTicket: "14,15", callbacks: 1,
      retained14: "Original full graph successful Push assertions retained.",
      added15: "Pause after final live installation; prove original S0/M0 and pending/backups, no later media query, exact complete bookkeeping basis/hash." },
    c13: { id: "AV.C13.push-success.formal.case.expected", ownerTicket: "14", unchangedOwner: true },
    previous14Evidence: { path: previous14Path, sha256: sha(read(previous14Path)), gitBlob: gitBlob(read(previous14Path)), status: "Preserved historical ticket14 receipts; not rewritten as ticket15 evidence." } },
  historical, regressions, verificationCommands: commands,
  sourceRegressionCorrection: { originalAssertionRevision: canonicalRunRevision,
    originalAssertions: `${history}/regression-source-first/assertions.ts`,
    finalAssertionRevision: frozen, updatedBranch: "MV-S4-RECOVERY-010 (push-after-install)",
    change: "Expect ordinary Generated Project Data integrity diagnostic from new completion guard; both historical recovery consumption boundaries retain the original regex and all state/manifest/pending assertions remain.",
    narrowRecheckCommand: ["pnpm", "--filter", "rpgmaker-event-dsl", "test", "--maxWorkers=1", "test/push-recovery.test.ts", "-t", "RECOVERY-010.*push-after-install", "--reporter=json", "--outputFile=../../test-results/15-regression-source-recheck.json"],
    narrowLog: `${history}/regression-source-recheck.log` },
  builtArtifacts, gitInputs,
  nativeExecution: "Not applicable to ticket15 Workspace state/OS/API/CLI obligations; no editor/game result claimed.",
  receipts, rawFiles,
};
const destination = ".scratch/asset-validation-implementation/evidence/15-postwrite-acceptance.json";
fs.writeFileSync(destination, JSON.stringify(evidence, null, 2) + "\n");
console.log(JSON.stringify({ destination, frozen, primaryReceipts: receipts.filter(item => item.role === "primary").length,
  supportingReceipts: receipts.filter(item => item.role === "supporting").length,
  assertionsSha256: sourceHash, rawFiles: rawFiles.length,
  currentSuites: regressions.map(item => ({ entry: item.entry, push: item.currentPushSuite.passed, old: item.existingSafetySuites.passed })) }, null, 2));
