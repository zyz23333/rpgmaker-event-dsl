// Run only after the whole-command recorder has completed. The manifest excludes
// itself and the later Git verification to avoid circular fingerprints.
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
const prefix = ".scratch/asset-validation-implementation/evidence/";
const failedCheckpoint = process.argv.includes("--failed-checkpoint");
const afCheckpoint = process.argv.includes("--af-checkpoint");
const historyPath = afCheckpoint ? "17-raw/history/af748ee5-contract40-whole-check-failed/command-history.json" : failedCheckpoint ? "17-raw/history/c5f7ead7-contract40-whole-check-failed/command-history.json" : "17-raw/command-history.json";
const history = JSON.parse(readFileSync(prefix + historyPath));
if (failedCheckpoint || afCheckpoint) {
  if (history.commands.length !== 2 || history.commands[0].exitCode !== 0 || history.commands[1].exitCode !== 1)
    throw new Error("Natural failed checkpoint evidence not complete");
} else if (history.commands.length !== 4 || history.commands.some((row) => row.exitCode !== 0)) throw new Error("Final whole commands not complete");
const sha = (value) => createHash("sha256").update(value).digest("hex");
const blob = (value) => createHash("sha1").update(Buffer.from("blob " + value.length + "\0")).update(value).digest("hex");
const files = [];
function visit(path) {
  for (const entry of readdirSync(path, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, "en"))) {
    const child = path + "/" + entry.name;
    if (entry.isDirectory()) visit(child); else files.push(child);
  }
}
visit(prefix + "17-raw"); visit(prefix + "17-run-history");
if (!failedCheckpoint) visit(prefix + "17-regression-repair");
for (const entry of readdirSync(prefix, { withFileTypes: true }))
  if (entry.isFile() && entry.name.startsWith("17-") && !["17-final-artifact-manifest.json", "17-final-git-verification.json",
    "17-failed-checkpoint-manifest.json", "17-failed-git-verification.json", "17-af-checkpoint-manifest.json", "17-af-git-verification.json"].includes(entry.name)) files.push(prefix + entry.name);
files.push(".scratch/asset-validation-implementation/issues/17-integrated-acceptance.md");
const artifacts = [...new Set(files)].sort().map((path) => { const bytes = readFileSync(path);
  return { path, bytes: bytes.length, sha256: sha(bytes), expectedGitBlobId: blob(bytes) }; });
const result = { schemaVersion: 1, kind: afCheckpoint ? "af-failed-whole-source-checkpoint; composite-follow-up-pending" : failedCheckpoint ? "failed-whole-validation-checkpoint; not final acceptance" : "final-technical-evidence",
  executionFreeze: history.frozenRevision, generatedAt: new Date().toISOString(),
  scope: "all17 raw/current/history evidence, audit artifacts, recorder/auditor sources, narrative and issue17; final mode also includes original17-regression-repair evidence; self and later Git verification excluded",
  count: artifacts.length, totalBytes: artifacts.reduce((sum, row) => sum + row.bytes, 0), artifacts };
writeFileSync(prefix + (afCheckpoint ? "17-af-checkpoint-manifest.json" : failedCheckpoint ? "17-failed-checkpoint-manifest.json" : "17-final-artifact-manifest.json"), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({ count: result.count, bytes: result.totalBytes }, null, 2));
