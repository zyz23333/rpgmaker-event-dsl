const fs = require("node:fs");
const cp = require("node:child_process");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");
const history = ".scratch/asset-validation-implementation/evidence/03-device-space";
const base = "29f19dfd3ed943df2e0c9ae2b7c446ada248d501";
const frozen = "15b893b3c36df545eafa4d0e621bd0df7986f1a2";
const sha = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const blob = bytes => crypto.createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
const git = args => cp.execFileSync("git", args, { maxBuffer: 64*1024*1024 });
const testFile = "packages/rpgmaker-event-dsl/test/asset-file-workspace.test.ts";
const oldTest = git(["show", `${base}:${testFile}`]).toString();
const newTest = fs.readFileSync(testFile,"utf8");
const marker = "function unsupportedNameCase(";
assert(oldTest.includes(marker) && newTest.includes(marker));
const oldFragment = oldTest.slice(oldTest.indexOf(marker));
const newFragment = newTest.slice(newTest.indexOf(marker));
assert.equal(newFragment, oldFragment);
const oldLedgerPath = ".scratch/asset-validation-implementation/evidence/03-file-observation-acceptance.json";
const oldLedgerBytes = fs.readFileSync(oldLedgerPath);
assert.equal(sha(oldLedgerBytes), "a8652ef3feda52e3677af8d8d52f9fd3fbbedbbf4a1dacfea453af802e14d071");
assert.deepEqual(oldLedgerBytes, git(["show", `${base}:${oldLedgerPath}`]));
const oldLedger = JSON.parse(oldLedgerBytes);
assert.equal(oldLedger.results.filter(item => item.status === "passed").length, 332);
assert.equal(oldLedger.pending.filter(item => item.status === "not-executed-policy-pending").length, 6);
const planPath = "M:/Shuen/Codex/asset-validation-notes/final-canonical-id-plan.json";
const planBytes = fs.readFileSync(planPath);
assert.equal(sha(planBytes), "869c6752eedb1997e0ccbca5e3bce81c74122ce68f4600c970822ce37b9841b6");
const plan = JSON.parse(planBytes);
const probes = ["device-name-space-probe.ps1", "device-name-space-probe.json"].map(name => {
  const source = fs.readFileSync(`M:/Shuen/Codex/asset-validation-notes/${name}`);
  const saved = fs.readFileSync(`${history}/${name}`);
  assert.deepEqual(saved, source);
  return { path: `${history}/${name}`, sourcePath:`M:/Shuen/Codex/asset-validation-notes/${name}`, bytes:saved.length, sha256:sha(saved), gitBlob:blob(saved) };
});
const paths = [
  ".gitattributes", "packages/rpgmaker-event-dsl/README.md",
  "packages/rpgmaker-event-dsl/src/workspace/asset-files.ts",
  "packages/rpgmaker-event-dsl/src/workspace/type-inputs.ts",
  "packages/rpgmaker-event-dsl/src/workspace/asset-check.ts",
  "packages/rpgmaker-event-dsl/src/workspace/config.ts",
  "packages/rpgmaker-event-dsl/src/workspace/operations.ts",
  "packages/rpgmaker-event-dsl/src/validation/asset-report.ts",
  "packages/rpgmaker-event-dsl/src/validation/asset-policy.ts",
  "packages/rpgmaker-event-dsl/src/validation/asset-exceptions.ts",
  "packages/rpgmaker-event-dsl/src/validation/asset-uses.ts",
  testFile, "packages/rpgmaker-event-dsl/test/asset-media-workspace.test.ts",
  "packages/rpgmaker-event-dsl/test/support/asset-evidence.ts",
  "packages/rpgmaker-event-dsl/test/support/windows-sandbox.ts",
  "packages/rpgmaker-event-dsl/test/support/workspace-operation-child.mjs",
  "packages/rpgmaker-event-dsl/test/support/workspace-operation-process.ts",
  "packages/rpgmaker-event-dsl/vitest.windows.config.ts",
  ".scratch/asset-validation/asset-validation-spec.md",
  ".scratch/asset-validation/acceptance-matrix.md",
  ".scratch/asset-validation/implementation-acceptance-cases.md",
  oldLedgerPath,
  ".scratch/asset-validation-implementation/evidence/03-image-policy-acceptance.json",
];
const gitInputs = paths.map(file => {
  const bytes = git(["show",`${frozen}:${file}`]);
  assert.deepEqual(fs.readFileSync(file), bytes);
  return { path:file, revision:frozen, bytes:bytes.length, sha256:sha(bytes), gitBlob:blob(bytes) };
});
const output = { base, implementationRevision:frozen,
  f07OriginalFragment: { marker, sha256:sha(Buffer.from(oldFragment)), bytes:Buffer.byteLength(oldFragment), unchanged:true,
    meaning:"Original F07 callbacks, IDs, transcribed inputs and assertions are byte-identical; supplementary tests precede this fragment." },
  originalLedger: { path:oldLedgerPath, bytes:oldLedgerBytes.length, sha256:sha(oldLedgerBytes), passed:332, pending:6, unchanged:true },
  independentPlan: { path:planPath, sha256:sha(planBytes), counts:plan.counts, unchanged:true },
  probes, gitInputs };
fs.writeFileSync(`${history}/frozen-inputs.json`,JSON.stringify(output,null,2)+"\n");
console.log(JSON.stringify({ f07:output.f07OriginalFragment, originalLedger:output.originalLedger, plan:output.independentPlan, gitInputs:gitInputs.length, probes:probes.length },null,2));
