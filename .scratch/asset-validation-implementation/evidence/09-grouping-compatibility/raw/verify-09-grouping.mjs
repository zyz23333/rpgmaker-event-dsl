import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const raw = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(raw, "../../../../..");
const checkOnly = process.argv.includes("--check-only");
const currentFile = "packages/rpgmaker-event-dsl/test/asset-system-workspace.test.ts";
const id = "AV.C07.shared-system-field.formal.case.expected";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const json = (name) => JSON.parse(fs.readFileSync(path.join(raw, name), "utf8"));
const relative = (file) => path.relative(root, file).split(path.sep).join("/");
const write = (name, value) => { if (!checkOnly) fs.writeFileSync(path.join(raw, name), JSON.stringify(value, null, 2) + "\n"); };

function canonicalRange(text) {
  const source = ts.createSourceFile(currentFile, text, ts.ScriptTarget.Latest, true);
  const found = [];
  function visit(node) {
    if (ts.isCallExpression(node) && node.arguments[0] && ts.isStringLiteral(node.arguments[0]) && node.arguments[0].text.startsWith(id + ":")) {
      assert.equal(node.expression.getText(source), "it");
      assert(ts.isExpressionStatement(node.parent) && ts.isSourceFile(node.parent.parent), "Canonical declaration must be top-level");
      found.push({ start: node.parent.getStart(source), end: node.parent.end });
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.equal(found.length, 1, "Exactly one canonical callback; no aliases");
  return found[0];
}
const originalBytes = fs.readFileSync(path.join(raw, "original-badexpect-asset-system-workspace.test.ts.txt"));
const currentBytes = fs.readFileSync(path.join(root, currentFile));
const original = originalBytes.toString("utf8").replaceAll("\r\n", "\n");
const current = currentBytes.toString("utf8").replaceAll("\r\n", "\n");
const oldRange = canonicalRange(original);
const newRange = canonicalRange(current);
assert.equal(original.slice(0, oldRange.start), current.slice(0, newRange.start));
assert.equal(original.slice(oldRange.end), current.slice(newRange.end));
const originalCallback = original.slice(oldRange.start, oldRange.end);
const currentCallback = current.slice(newRange.start, newRange.end);
assert.equal((originalCallback.match(/toHaveLength\(2\)/gu) ?? []).length, 2);
assert.equal((currentCallback.match(/toHaveLength\(1\)/gu) ?? []).length, 3);
const frozen = path.join(raw, "frozen-asset-system-workspace.test.ts.txt");
if (process.argv.includes("--prepare")) fs.writeFileSync(frozen, currentBytes);
else assert.equal(hash(fs.readFileSync(frozen)), hash(currentBytes));
const registration = {
  id,
  ownerTicket: "09",
  uniqueTopLevelCanonicalCallbacks: 1,
  allOtherTestSourceUnchanged: true,
  originalSourceSha256: hash(originalBytes),
  frozenSourceSha256: hash(currentBytes),
  originalHeaderExpectations: [2, 2],
  newHeaderExpectations: [1, 1],
  expectedStatistics: { groups: 1, files: 0, affectedUses: 2 },
  expectedNativePaths: ["Map001.json.events[1].pages[0].list[0]", "Map001.json.events[1].pages[0].list[1]"],
  authority: ".scratch/asset-validation/asset-validation-spec.md section 7",
};
write("expected-and-registration.json", registration);
if (process.argv.includes("--prepare")) {
  console.log(JSON.stringify({ preparation: registration }, null, 2));
  process.exit(0);
}

const originalFailure = json("original-17-failed-receipt.json");
assert.equal(hash(fs.readFileSync(path.join(raw, "original-17-failed-receipt.json"))), "f34e8920dd1642e192a2664f8cdeb7f7f15f3d4559128c636f6f4f252adc1d8a");
assert.equal(originalFailure.id, id);
assert.equal(originalFailure.status, "failed");
assert.equal(originalFailure.expected.sha256, registration.originalSourceSha256);
assert.match(originalFailure.actual, /length of 2 but got 1/u);
const diagnostic = json("diagnostic-original-contract39.json");
assert.equal(diagnostic.completed, true);
assert.equal(diagnostic.sourceRevision, "126b1980014e5c9a4c9bd877505e04a30f097759");
assert.equal(diagnostic.operations.length, 3);
for (const operation of diagnostic.operations) assert(Object.values(operation.checks).every(Boolean));
for (const item of json("diagnostic-product-inputs.json").files) {
  assert.equal(hash(execFileSync("git", ["show", diagnostic.sourceRevision + ":" + item.path], { cwd: root })), item.sha256, item.path + " diagnostic Git blob");
}
assert.equal(hash(fs.readFileSync(path.join(root, ".scratch/asset-validation-implementation/evidence/09-system-acceptance.json"))), "b67414e9f45712cf31ca85ebce43dc4fd276adf14784ec3b45f0ff65e517c5e3");
const freeze = json("contract40-freeze.json");
assert.equal(freeze.contract, "mv-1.6.1/40");
assert.equal(freeze.canonicalTest.sha256, registration.frozenSourceSha256);
for (const item of [freeze.canonicalTest, ...freeze.sources, ...freeze.artifacts]) {
  assert.equal(hash(fs.readFileSync(path.join(root, item.path))), item.sha256, item.path);
}
for (const item of [freeze.canonicalTest, ...freeze.sources]) {
  assert.equal(hash(execFileSync("git", ["show", freeze.head + ":" + item.path], { cwd: root })), item.sha256, item.path + " frozen Git blob");
}
execFileSync("git", ["diff", "--quiet", freeze.integrationBase, "HEAD", "--", "packages/rpgmaker-event-dsl/src"], { cwd: root });

const finalResults = [];
for (const entry of ["source", "built"]) {
  const runner = json(`focused-${entry}.json`);
  assert.equal(runner.numPassedTests, 1);
  assert.equal(runner.numFailedTests, 0);
  assert.equal(runner.numTotalTests, 105);
  const assertions = runner.testResults.flatMap((item) => item.assertionResults);
  const passed = assertions.filter((item) => item.status === "passed");
  assert.equal(passed.length, 1);
  assert(passed[0].fullName.startsWith(id + ":"));
  const receipt = json(`focused-${entry}-receipt.json`);
  assert.equal(receipt.id, id);
  assert.equal(receipt.ownerTicket, "09");
  assert.equal(receipt.status, "passed");
  assert.equal(receipt.entry, entry);
  assert.equal(receipt.environment.platform, "win32");
  assert.match(receipt.environment.node, /^v22\./u);
  assert.equal(receipt.expected.sha256, registration.frozenSourceSha256);
  const api = receipt.input.flatMap((item) => item.groupingCompatibilityApi ? [item.groupingCompatibilityApi] : []);
  const cli = receipt.input.flatMap((item) => item.groupingCompatibilityCli ? [item.groupingCompatibilityCli] : []);
  assert.deepEqual(api.map((item) => item.check), [true, false]);
  assert.equal(cli.length, 1);
  for (const item of [...api, ...cli]) assert.deepEqual(item.after, item.before);
  assert.equal(cli[0].cli.exitCode, 1);
  const messages = [...api.map((item) => item.actual.failure), cli[0].cli.stderr];
  for (const text of messages) {
    assert.equal((text.match(/error MV-ASSET-INVALID-DATA/gu) ?? []).length, 1);
    const members = text.split(/\r?\n/u).filter((line) => line.startsWith("  - error map:1/event:1 "));
    assert.equal(members.length, 2);
    assert.deepEqual(members.map((line) => line.split("; chain:")[0]), registration.expectedNativePaths.map((nativePath) => "  - error map:1/event:1 " + nativePath));
    for (const member of members) {
      assert(member.includes("chain: System.json.gameoverMe.name (Game Over ME)"));
      assert(member.endsWith("; base: error; effective: error"));
    }
    assert(text.includes("1 problem group(s), 0 problem file(s), 2 affected use(s). Coverage: incomplete;"));
    assert(text.includes("failed at: System.json.gameoverMe.name"));
    assert(!text.includes("; target:"));
    assert(!text.includes("MV-ASSET-MISSING-FILE"));
  }
  finalResults.push({ entry, actualPassed: 1, actualFailed: 0, filteredNotPasses: 104, receipt: relative(path.join(raw, `focused-${entry}-receipt.json`)), sourceSha256: receipt.expected.sha256, operationsWithCompleteMessagesAndUnchangedState: 3 });
}

const verification = {
  id,
  verifiedAt: new Date().toISOString(),
  head: execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(),
  registration,
  originalFailurePreserved: { status: originalFailure.status, actual: originalFailure.actual, receiptSha256: hash(fs.readFileSync(path.join(raw, "original-17-failed-receipt.json"))) },
  diagnosticOnly: { revision: diagnostic.sourceRevision, contract: "mv-1.6.1/39", completedOperations: 3, originalTitleFilesAllQueriedPerOperation: true, noContentReads: true, noCanonicalPassClaim: true, firstAttemptObserverFailure: "CLI CRLF trailing carriage return; original full API/CLI bytes and failed observer artifacts preserved" },
  finalResults,
  finalFreeze: { head: freeze.head, integrationBase: freeze.integrationBase, contract: freeze.contract, sourceFilesVerifiedAgainstWorktreeAndGit: freeze.sources.length, builtArtifactsVerifiedAgainstFrozenBytes: freeze.artifacts.length, noTicket09ProductPatch: true },
};
write("verification.json", verification);
const artifacts = fs.readdirSync(raw).filter((name) => name !== "manifest.json").sort().map((name) => {
  const bytes = fs.readFileSync(path.join(raw, name));
  return { path: relative(path.join(raw, name)), bytes: bytes.length, sha256: hash(bytes) };
});
write("manifest.json", { artifacts });
if (checkOnly) {
  for (const item of json("manifest.json").artifacts) {
    const bytes = fs.readFileSync(path.join(root, item.path));
    assert.equal(hash(bytes), item.sha256, item.path);
    assert.equal(hash(execFileSync("git", ["show", "HEAD:" + item.path], { cwd: root })), item.sha256, item.path + " committed Git blob");
  }
}
console.log(JSON.stringify({ verified: id, finalResults, rawArtifacts: artifacts.length, manifestSha256: hash(fs.readFileSync(path.join(raw, "manifest.json"))) }, null, 2));
