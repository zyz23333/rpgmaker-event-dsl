const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");
const evidencePath = ".scratch/asset-validation-implementation/evidence/03-device-space-acceptance.json";
const bytes = fs.readFileSync(evidencePath);
const evidence = JSON.parse(bytes);
const sha = value => crypto.createHash("sha256").update(value).digest("hex");
const git = args => cp.execFileSync("git", args, { maxBuffer: 64 * 1024 * 1024 });
const source = evidence.implementationRevision;
for (const item of evidence.rawFiles) {
  const disk = fs.readFileSync(item.path);
  assert.equal(disk.length, item.bytes, item.path);
  assert.equal(sha(disk), item.sha256, item.path);
  assert.deepEqual(git(["show", `:${item.path}`]), disk, item.path);
  assert.equal(git(["rev-parse", `:${item.path}`]).toString().trim(), item.gitBlob, item.path);
}
for (const item of evidence.provenance.gitInputs) {
  const saved = git(["show", `${source}:${item.path}`]);
  assert.equal(saved.length, item.bytes, item.path);
  assert.equal(sha(saved), item.sha256, item.path);
  assert.equal(git(["rev-parse", `${source}:${item.path}`]).toString().trim(), item.gitBlob, item.path);
  assert.deepEqual(fs.readFileSync(item.path), saved, item.path);
}
for (const item of evidence.builtArtifacts) {
  const disk = fs.readFileSync(item.path);
  assert.equal(disk.length, item.bytes, item.path);
  assert.equal(sha(disk), item.sha256, item.path);
}
for (const item of evidence.receiptManifest) {
  const disk = fs.readFileSync(item.path);
  assert.equal(disk.length, item.bytes, item.path);
  assert.equal(sha(disk), item.sha256, item.path);
  assert.equal(git(["rev-parse", `:${item.path}`]).toString().trim(), item.gitBlob, item.path);
}
for (const item of evidence.supplementReceipts) {
  assert.deepEqual(JSON.parse(fs.readFileSync(item.path)), item.receipt, item.path);
  assert.equal(item.role, "supplementary-not-canonical");
}
const plan = evidence.provenance.independentPlan;
assert.equal(sha(fs.readFileSync(plan.path)), plan.sha256);
assert.equal(plan.counts.families, 97);
assert.equal(plan.counts.independentSemanticObligations, 1209);
const ledger = evidence.provenance.originalLedger;
assert.equal(sha(fs.readFileSync(ledger.path)), ledger.sha256);
assert.equal(ledger.passed, 332);
assert.equal(ledger.pending, 6);
assert.deepEqual(git(["show", `:${evidencePath}`]), bytes);
assert.equal(evidence.rawFiles.length, 395);
assert.equal(evidence.receiptManifest.length, 364);
assert.equal(evidence.supplementReceipts.length, 14);
let links = 0;
for (const document of [
  ".scratch/asset-validation-implementation/evidence/03-device-space-acceptance.md",
  ".scratch/asset-validation-implementation/issues/03-exact-file-observation.md",
]) {
  const text = fs.readFileSync(document, "utf8");
  for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
    const target = match[1].split("#")[0];
    if (!target || /^[a-z]+:/i.test(target)) continue;
    const resolved = path.resolve(path.dirname(document), target);
    // This audit is the only output created after all links have been inspected.
    if (!resolved.endsWith("03-device-space-git-verification.json")) {
      assert(fs.existsSync(resolved), `${document}: ${target}`);
    }
    links++;
  }
}
const audit = {
  schemaVersion: 1, ticket: "03", status: "passed", verifiedAt: new Date().toISOString(),
  implementationRevision: source, compileContractVersion: evidence.compileContractVersion,
  environment: { platform: process.platform, node: process.version, worktree: process.cwd() },
  mainEvidence: { path: evidencePath, bytes: bytes.length, sha256: sha(bytes),
    gitBlob: git(["rev-parse", `:${evidencePath}`]).toString().trim() },
  checked: { originalRawDiskAndIndexBytes: evidence.rawFiles.length,
    frozenGitInputs: evidence.provenance.gitInputs.length, builtArtifacts: evidence.builtArtifacts.length,
    currentArchivedReceipts: evidence.receiptManifest.length, embeddedSupplementaryReceipts: evidence.supplementReceipts.length,
    localLinks: links, originalLedgerPassed: ledger.passed, originalLedgerPending: ledger.pending,
    independentFamilies: plan.counts.families, independentObligations: plan.counts.independentSemanticObligations },
  filtering: "File suites source/built 178/178 with zero filtering. Targeted media source/built each 4 passed, 78 filtered. Historical focused filters excluded from passing totals.",
  validation: "All raw sizes, SHA-256 values and Git index blobs equal original disk bytes. Frozen Git inputs equal their recorded objects and current disk; build hashes, all364 receipt manifests,14 embedded supplementary objects and local links agree. Original332 passed plus6 pending ledger and97-family/1209-obligation plan bytes remain unchanged.",
};
fs.writeFileSync(".scratch/asset-validation-implementation/evidence/03-device-space-git-verification.json", JSON.stringify(audit, null, 2) + "\n");
console.log(JSON.stringify(audit, null, 2));
