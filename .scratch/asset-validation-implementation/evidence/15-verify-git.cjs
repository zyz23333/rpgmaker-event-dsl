const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");
const root = process.cwd();
const evidencePath = ".scratch/asset-validation-implementation/evidence/15-postwrite-acceptance.json";
const bytes = fs.readFileSync(evidencePath);
const evidence = JSON.parse(bytes);
const sha = buffer => crypto.createHash("sha256").update(buffer).digest("hex");
const git = args => cp.execFileSync("git", args, { maxBuffer: 64 * 1024 * 1024 });
const source = evidence.implementationRevision;
for (const item of evidence.rawFiles) {
  const disk = fs.readFileSync(item.path);
  assert.equal(disk.length, item.bytes, item.path);
  assert.equal(sha(disk), item.sha256, item.path);
  const index = git(["show", `:${item.path}`]);
  assert.deepEqual(index, disk, item.path);
  assert.equal(git(["rev-parse", `:${item.path}`]).toString().trim(), item.gitBlob, item.path);
}
for (const item of evidence.gitInputs) {
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
for (const item of evidence.receipts) {
  const disk = fs.readFileSync(item.receiptPath);
  assert.equal(sha(disk), item.sha256, item.receiptPath);
  assert.deepEqual(JSON.parse(disk), item.receipt, item.receiptPath);
}
assert.deepEqual(git(["show", `:${evidencePath}`]), bytes);
const primary = evidence.receipts.filter(item => item.role === "primary");
const supporting = evidence.receipts.filter(item => item.role === "supporting");
assert.equal(primary.length, 24);
assert.equal(supporting.length, 2);
let links = 0;
for (const document of [
  ".scratch/asset-validation-implementation/evidence/15-postwrite-acceptance.md",
  ".scratch/asset-validation-implementation/issues/15-push-postwrite-consistency.md",
]) {
  const text = fs.readFileSync(document, "utf8");
  for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
    const target = match[1].split("#")[0];
    if (!target || /^[a-z]+:/i.test(target)) continue;
    assert(fs.existsSync(path.resolve(path.dirname(document), target)), `${document}: ${target}`);
    links++;
  }
}
const audit = {
  schemaVersion: 1, ticket: "15", status: "passed", verifiedAt: new Date().toISOString(),
  implementationRevision: source, canonicalRunRevision: evidence.canonicalRunRevision,
  environment: { platform: process.platform, node: process.version, worktree: root },
  mainEvidence: { path: evidencePath, bytes: bytes.length, sha256: sha(bytes),
    gitBlob: git(["rev-parse", `:${evidencePath}`]).toString().trim() },
  checked: { originalRawDiskAndIndexBytes: evidence.rawFiles.length,
    frozenGitInputs: evidence.gitInputs.length, builtArtifacts: evidence.builtArtifacts.length,
    primaryReceipts: primary.length, supportingReceipts: supporting.length, localLinks: links },
  sourceOldRegression: "85 original successes plus one exact failed-name recheck; 43 filtered cases excluded. 86 unique successes, not a single 86/86 execution.",
  builtOldRegression: "One 86/86 execution, zero filtering.",
  validation: "Raw Git blobs equal original disk bytes; all recorded sizes/SHA-256/Git objects and complete receipt objects agree. Frozen inputs equal their Git blobs and current disk; build hashes and local links agree.",
};
fs.writeFileSync(".scratch/asset-validation-implementation/evidence/15-git-verification.json", JSON.stringify(audit, null, 2) + "\n");
console.log(JSON.stringify(audit, null, 2));
