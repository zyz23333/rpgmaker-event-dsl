import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const evidence = dirname(fileURLToPath(import.meta.url));
const frozenRevision = "af748ee5067f41096a296a79f81b078415096606";
const integrationRevision = "0b5195c4095e9b21b8e345541c4ae7859bc2d66a";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const git = (...args) => execFileSync("git", args, { cwd: root, maxBuffer: 128 * 1024 * 1024 });
assert.equal(git("rev-parse", "HEAD").toString().trim(), integrationRevision);
const sourceRoot = "M:/Shuen/Codex/asset-validation-17-acceptance/.scratch/asset-validation-implementation/evidence/17-raw";
const archive = join(sourceRoot, "history/af748ee5-contract40-whole-check-failed");
const originals = [
  ["01-pnpm-check.log", 3541, "2dd29c82d9929d84c713d9812d1130ac31cf67342f2753e24cfdb2e7ab96fd72"],
  ["command-history.json", 938285, "de2a7c1c0f426e807dc0bdc3a9eb88990ca55ac3625a51c109ec050de48345ea"],
  ["current-source-receipts/AV.D05.incomplete.native.case.expected.source.json", 33221, "0f3710cf4adc4973eb5dd5c9c64bc622978abf0c7edb590041ff73d661382d75"],
];
const rawManifest = [];
for (const [file, bytes, hash] of originals) {
  const candidates = [join(archive, file), join(sourceRoot, file)];
  const source = candidates.find((path) => existsSync(path) && sha256(readFileSync(path)) === hash);
  assert.ok(source, `Exact original af bytes not found: ${file}`);
  const data = readFileSync(source);
  assert.equal(data.length, bytes);
  const destination = join(evidence, "raw/af-whole-source", file);
  mkdirSync(dirname(destination), { recursive: true });
  if (existsSync(destination)) assert.equal(sha256(readFileSync(destination)), hash);
  else writeFileSync(destination, data);
  rawManifest.push({ file: relative(evidence, destination).replaceAll("\\", "/"), source, bytes, sha256: hash });
}

const snapshotFiles = [
  "packages/rpgmaker-event-dsl/test/support/asset-evidence.ts",
  "packages/rpgmaker-event-dsl/test/asset-diagnostics-workspace.test.ts",
];
const baseline = [];
for (const file of snapshotFiles) {
  const af = git("show", `${frozenRevision}:${file}`);
  const current = readFileSync(join(root, file));
  assert.equal(af.toString().replaceAll("\r\n", "\n"), current.toString().replaceAll("\r\n", "\n"));
  const destination = join(evidence, "raw/before", file);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, current);
  baseline.push({ file, bytes: current.length, sha256: sha256(current), afGitBytes: af.length, afGitSha256: sha256(af), normalizedEolSameAsAf: true });
}

const historyRoot = ".scratch/asset-validation-implementation/evidence";
const historyFiles = [
  `${historyRoot}/12-exception-acceptance.json`,
  `${historyRoot}/12-exception-acceptance.md`,
  ...readdirSync(join(root, historyRoot, "12-run-history"), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(root, join(entry.parentPath ?? entry.path, entry.name)).replaceAll("\\", "/")),
].sort();
const originalTicket12History = historyFiles.map((file) => {
  const bytes = readFileSync(join(root, file));
  const blob = git("show", `${integrationRevision}:${file}`);
  return { file, bytes: bytes.length, sha256: sha256(bytes), gitBytes: blob.length, gitSha256: sha256(blob) };
});
const receipt = JSON.parse(readFileSync(join(evidence, "raw/af-whole-source", originals[2][0]), "utf8"));
assert.equal(receipt.status, "passed");
assert.equal(Date.parse(receipt.completedAt) - Date.parse(receipt.startedAt), 11547);
const red = {
  schemaVersion: 1,
  recordedAt: new Date().toISOString(),
  worktree: root,
  branch: git("branch", "--show-current").toString().trim(),
  originalWholeSourceFrozenRevision: frozenRevision,
  repairBaseRevision: integrationRevision,
  originalRunner: { command: "pnpm check", exitCode: 1, files: { passed: 102, failed: 1, total: 103 }, tests: { passed: 3408, failed: 1, total: 3409 }, onlyFailure: receipt.id, error: "Error: Test timed out in 10000ms.", runnerDurationMs: 10037 },
  eventualHelperCompletion: { status: receipt.status, startedAt: receipt.startedAt, completedAt: receipt.completedAt, durationMs: 11547, actual: receipt.actual, inputObjects: receipt.input.length, assertionsSourceSha256: receipt.expected.sha256, interpretation: "The helper completed after Vitest timed out. This is not a runner pass and does not change the original failed whole-source result." },
  rawManifest,
  baseline,
  originalTicket12History,
  boundedPlan: { sourceIds: ["repaired", "unused", "warning-only", "incomplete"].map((branch) => `AV.D05.${branch}.native.case.expected`), newIncompleteBudgetMs: 30000, allOtherDefaultBudgetMs: 10000, maxWorkers: 2, completeSourceRerun: false, complete99DiagnosticSuiteRerun: false, builtRerun: false },
};
writeFileSync(join(evidence, "red-and-baseline.json"), `${JSON.stringify(red, null, 2)}\n`);
console.log(JSON.stringify({ status: "original red and historical baseline archived", rawFiles: rawManifest.length, originalTicket12HistoricalFiles: originalTicket12History.length, baselineFiles: baseline.length, originalRunner: red.originalRunner, eventualHelperCompletion: red.eventualHelperCompletion }, null, 2));
