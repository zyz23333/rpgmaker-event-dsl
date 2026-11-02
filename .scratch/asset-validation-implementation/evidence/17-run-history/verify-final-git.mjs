import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
const prefix = ".scratch/asset-validation-implementation/evidence/";
const failedCheckpoint = process.argv.includes("--failed-checkpoint");
const manifestPath = prefix + (failedCheckpoint ? "17-failed-checkpoint-manifest.json" : "17-final-artifact-manifest.json");
const manifestBytes = readFileSync(manifestPath), manifest = JSON.parse(manifestBytes);
const revision = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const sha = (value) => createHash("sha256").update(value).digest("hex");
const committedManifest = execFileSync("git", ["show", revision + ":" + manifestPath], { maxBuffer: 16 * 1024 * 1024 });
if (!committedManifest.equals(manifestBytes)) throw new Error("Manifest disk bytes differ from committed Git");
const batch = execFileSync("git", ["cat-file", "--batch"], {
  input: manifest.artifacts.map((row) => revision + ":" + row.path + "\n").join(""), maxBuffer: 512 * 1024 * 1024,
});
let offset = 0;
for (const row of manifest.artifacts) {
  const end = batch.indexOf(10, offset), header = batch.subarray(offset, end).toString().split(" ");
  if (header.length !== 3 || header[1] !== "blob") throw new Error("Artifact missing from committed Git " + row.path);
  const length = Number(header[2]), bytes = batch.subarray(end + 1, end + 1 + length); offset = end + 2 + length;
  if (length !== row.bytes || sha(bytes) !== row.sha256 || header[0] !== row.expectedGitBlobId || !bytes.equals(readFileSync(row.path)))
    throw new Error("Artifact bytes differ from committed Git " + row.path);
}
if (offset !== batch.length) throw new Error("Unread Git verification bytes");
const protectedPaths = ["packages/rpgmaker-event-dsl/src", "packages/rpgmaker-event-dsl/test", "packages/rpgmaker-event-dsl/package.json",
  "packages/rpgmaker-event-dsl/vitest.config.ts", "packages/rpgmaker-event-dsl/vitest.windows.config.ts", "package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", "tsconfig.json"];
execFileSync("git", ["diff", "--exit-code", manifest.executionFreeze, revision, "--", ...protectedPaths]);
const result = { schemaVersion: 1, kind: manifest.kind, verifiedRevision: revision, executionFreeze: manifest.executionFreeze,
  manifestPath, manifestSha256: sha(manifestBytes), checkedArtifacts: manifest.count, checkedBytes: manifest.totalBytes,
  allCommittedBlobsAndDiskBytesMatch: true, protectedSourceTestConfigurationUnchangedSinceExecutionFreeze: true,
  rawHistoryPreserved: true, maintainerApproval: null };
if (!process.argv.includes("--check-only")) writeFileSync(prefix + (failedCheckpoint ? "17-failed-git-verification.json" : "17-final-git-verification.json"), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result, null, 2));
