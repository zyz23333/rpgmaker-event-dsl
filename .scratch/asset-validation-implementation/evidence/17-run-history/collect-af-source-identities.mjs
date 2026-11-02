// Collection only: no test callback execution and no pass inferred from collection.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
const prefix = ".scratch/asset-validation-implementation/evidence/17-raw/";
const directory = prefix + "current-source-collection/";
mkdirSync(directory, { recursive: true });
const history = JSON.parse(readFileSync(prefix + "command-history.json"));
const sha = (value) => createHash("sha256").update(value).digest("hex");
const git = (...args) => execFileSync("git", args, { maxBuffer: 128 * 1024 * 1024 });
const freeze = "af748ee5067f41096a296a79f81b078415096606";
assert.equal(history.frozenRevision, freeze); assert.equal(git("rev-parse", "HEAD").toString().trim(), freeze);
assert.equal(history.commands[1].exitCode, 1); assert.equal(process.versions.node.split(".")[0], "22");
const files = [...history.frozenInputs, ...history.commands[1].receipts.map((row) => ({ ...row, path: prefix + row.file }))];
function verify() { for (const row of files) { const bytes = readFileSync(row.path); assert.equal(bytes.length, row.bytes, row.path); assert.equal(sha(bytes), row.sha256, row.path); } }
verify();
const command = "pnpm --filter rpgmaker-event-dsl exec vitest list --json=../../" + directory + "registrations.json --includeTaskLocation";
const startedAt = new Date().toISOString();
const run = spawnSync("cmd.exe", ["/d", "/s", "/c", command], { windowsHide: true, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const completedAt = new Date().toISOString();
writeFileSync(directory + "stdout.log", run.stdout ?? ""); writeFileSync(directory + "stderr.log", run.stderr ?? "");
writeFileSync(directory + "command.json", JSON.stringify({ command, startedAt, completedAt, exitCode: run.status, signal: run.signal, executionFreeze: freeze, environment: { node: process.version, nodeExecutable: process.execPath, TEMP: process.env.TEMP, TMP: process.env.TMP, entryOverride: process.env.MV_CLI_ENTRY ?? null }, kind: "Vitest-list-collection-only; no-test-callback-execution; not-pass-evidence", protectedInputAndSourceReceiptFilesVerifiedBeforeAndAfter: files.length }, null, 2) + "\n");
assert.equal(run.status, 0); assert.equal(run.signal, null); verify();
const registrations = JSON.parse(readFileSync(directory + "registrations.json"));
console.log(JSON.stringify({ command, executionFreeze: freeze, kind: "collection-only", registrations: Array.isArray(registrations) ? registrations.length : Object.keys(registrations), verifiedBeforeAfter: files.length }, null, 2));
