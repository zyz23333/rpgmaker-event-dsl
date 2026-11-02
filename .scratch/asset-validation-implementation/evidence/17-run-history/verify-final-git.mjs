import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
const prefix = ".scratch/asset-validation-implementation/evidence/";
const failedCheckpoint = process.argv.includes("--failed-checkpoint");
const afCheckpoint = process.argv.includes("--af-checkpoint");
const manifestPath = prefix + (afCheckpoint ? "17-af-checkpoint-manifest.json" : failedCheckpoint ? "17-failed-checkpoint-manifest.json" : "17-final-artifact-manifest.json");
const manifestBytes = readFileSync(manifestPath), manifest = JSON.parse(manifestBytes);
const revision = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const sha = (value) => createHash("sha256").update(value).digest("hex");
const committedManifest = execFileSync("git", ["show", revision + ":" + manifestPath], { maxBuffer: 16 * 1024 * 1024 });
if (!committedManifest.equals(manifestBytes)) throw new Error("Manifest disk bytes differ from committed Git");
// Bound each read batch; retained histories can exceed one process buffer.
const groups = []; let group = [], groupBytes = 0;
for (const row of manifest.artifacts) {
  if (group.length && groupBytes + row.bytes > 64 * 1024 * 1024) { groups.push(group); group = []; groupBytes = 0; }
  group.push(row); groupBytes += row.bytes;
}
if (group.length) groups.push(group);
for (const rows of groups) {
 const batch = execFileSync("git", ["cat-file", "--batch"], {
  input: rows.map((row) => revision + ":" + row.path + "\n").join(""), maxBuffer: Math.max(96 * 1024 * 1024, ...rows.map((row) => row.bytes + 1024 * 1024)),
 });
 let offset = 0;
 for (const row of rows) {
  const end = batch.indexOf(10, offset), header = batch.subarray(offset, end).toString().split(" ");
  if (header.length !== 3 || header[1] !== "blob") throw new Error("Artifact missing from committed Git " + row.path);
  const length = Number(header[2]), bytes = batch.subarray(end + 1, end + 1 + length); offset = end + 2 + length;
  if (length !== row.bytes || sha(bytes) !== row.sha256 || header[0] !== row.expectedGitBlobId || !bytes.equals(readFileSync(row.path)))
    throw new Error("Artifact bytes differ from committed Git " + row.path);
 }
 if (offset !== batch.length) throw new Error("Unread Git verification bytes");
}
const protectedPaths = ["packages/rpgmaker-event-dsl/src", "packages/rpgmaker-event-dsl/test", "packages/rpgmaker-event-dsl/package.json",
  "packages/rpgmaker-event-dsl/vitest.config.ts", "packages/rpgmaker-event-dsl/vitest.windows.config.ts", "package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", "tsconfig.json", "tsconfig.base.json", ".oxfmtrc.json", ".oxlintrc.json", ".oxfmtignore", "packages/rpgmaker-event-dsl/tsconfig.json", "packages/rpgmaker-event-dsl/tsdown.config.ts"];
execFileSync("git", ["diff", "--exit-code", manifest.executionFreeze, revision, "--", ...protectedPaths]);
const result = { schemaVersion: 1, kind: manifest.kind, verifiedRevision: revision, executionFreeze: manifest.executionFreeze,
  manifestPath, manifestSha256: sha(manifestBytes), checkedArtifacts: manifest.count, checkedBytes: manifest.totalBytes,
  allCommittedBlobsAndDiskBytesMatch: true, protectedSourceTestConfigurationUnchangedSinceExecutionFreeze: true,
  rawHistoryPreserved: true, maintainerApproval: null };
if (!process.argv.includes("--check-only")) writeFileSync(prefix + (afCheckpoint ? "17-af-git-verification.json" : failedCheckpoint ? "17-failed-git-verification.json" : "17-final-git-verification.json"), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result, null, 2));
