// Preserve the naturally completed af source run and build the explicit
// inference base for later composite validation. Does not run tests.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve, relative } from "node:path";
const prefix = ".scratch/asset-validation-implementation/evidence/", raw = prefix + "17-raw/";
const archive = raw + "history/af748ee5-contract40-whole-check-failed/";
const freeze = "af748ee5067f41096a296a79f81b078415096606";
const sha = (value) => createHash("sha256").update(value).digest("hex");
const blob = (value) => createHash("sha1").update(Buffer.from("blob " + value.length + "\0")).update(value).digest("hex");
const json = (path) => JSON.parse(readFileSync(path));
const git = (...args) => execFileSync("git", args, { maxBuffer: 128 * 1024 * 1024 });
const history = json(raw + "command-history.json"), command = history.commands[1];
assert.equal(history.frozenRevision, freeze); assert.equal(history.initialStatus, "");
assert.equal(history.commands.length, 2); assert.equal(history.commands[0].exitCode, 0); assert.equal(command.exitCode, 1);
const logBytes = readFileSync(raw + command.log); assert.equal(sha(logBytes), command.logSha256); assert.equal(logBytes.length, command.logBytes);
const log = logBytes.toString().replace(/\x1b\[[0-?]*[ -/]*[@-~]/gu, "").replace(/^packages\/rpgmaker-event-dsl test: /gmu, "");
assert.match(log, /Test Files\s+1 failed \| 102 passed \(103\)/u); assert.match(log, /Tests\s+1 failed \| 3408 passed \(3409\)/u);
assert.match(log, /Error: Test timed out in 10000ms\./u); assert.match(log, /Duration\s+2380\.17s/u);
const failed = [...log.matchAll(/^\s*FAIL\s+(test\/[^\r\n]+\.test\.ts) > ([^\r\n]+)$/gmu)].map((match) => ({ file: "packages/rpgmaker-event-dsl/" + match[1], name: match[2].trim() }));
assert.equal(failed.length, 1); assert(failed[0].name.startsWith("AV.D05.incomplete.native.case.expected:"));
for (const row of history.frozenInputs) { const bytes = readFileSync(row.path); assert.equal(sha(bytes), row.sha256); assert.deepEqual(bytes, git("show", freeze + ":" + row.path)); }
const collection = json(raw + "current-source-collection/registrations.json"), collectionCommand = json(raw + "current-source-collection/command.json");
assert.equal(collectionCommand.executionFreeze, freeze); assert.equal(collectionCommand.exitCode, 0); assert.equal(collection.length, 3409);
const paths = new Set(), identities = collection.map((row, index) => {
  const file = relative(process.cwd(), row.file).replaceAll("\\", "/"); paths.add(file);
  assert(history.frozenInputs.some((input) => input.path === file));
  const isFailed = failed.some((failure) => failure.file === file && failure.name === row.name);
  return { collectionOrdinal: index + 1, file, name: row.name, location: row.location, executionFreeze: freeze,
    runnerVerdict: isFailed ? "failed-explicitly-named-by-original-runner" : "passed-inferred-from-complete-runner-summary-and-identical-collection-minus-explicit-failures",
    perNamePassLogObserved: false };
});
assert.equal(paths.size, 103); assert.equal(identities.filter((row) => row.runnerVerdict.startsWith("failed-")).length, 1);
const original = json(prefix + "17-original-evidence-audit.json"), canonical = new Set(original.canonicalCases.filter((row) => row.requiredEntryAxes.receiptEntries.includes("source")).map((row) => row.canonicalId));
assert.equal(original.executionFreeze, freeze); assert.equal(canonical.size, 1195);
assert.equal(command.receipts.length, 1241);
const assets = command.receipts.map((row) => {
  const bytes = readFileSync(raw + row.file), receipt = JSON.parse(bytes), fullName = receipt.id + ": " + receipt.expected.description;
  assert.equal(sha(bytes), row.sha256); assert.equal(bytes.length, row.bytes); assert.equal(receipt.entry, "source"); assert.equal(receipt.status, "passed");
  assert(receipt.startedAt >= command.startedAt && receipt.completedAt <= command.completedAt);
  const matches = identities.filter((identity) => identity.name === fullName && identity.file === receipt.expected.assertionsSource); assert.equal(matches.length, 1, receipt.id);
  const accepted = !matches[0].runnerVerdict.startsWith("failed-");
  return { id: receipt.id, identityClass: canonical.has(receipt.id) ? "canonical-automated" : receipt.id.startsWith("SUPPLEMENT.device-space-") ? "device-space-supplementary" : "active-original-supplementary", path: archive + row.file, bytes: bytes.length, sha256: sha(bytes), sourceSha256: receipt.expected.sha256, ownerTicket: receipt.ownerTicket, helperStatus: receipt.status, runnerVerdict: matches[0].runnerVerdict, acceptedAsPassedSourceEvidence: accepted };
});
assert.equal(assets.filter((row) => row.identityClass === "canonical-automated").length, 1195);
assert.equal(assets.filter((row) => !row.acceptedAsPassedSourceEvidence).length, 1);
assert(!existsSync(archive), "Do not overwrite an existing immutable af archive");
mkdirSync(archive, { recursive: true });
for (const name of ["00-setup-build.log", "01-pnpm-check.log", "command-history.json", "current-source-receipts", "current-source-collection", "final-canonical-id-plan.json", "final-canonical-id-plan.md"]) {
  const source = resolve(raw, name), target = resolve(archive, name);
  assert(source.startsWith(resolve(raw) + "\\") && target.startsWith(resolve(archive) + "\\"));
  cpSync(source, target, { recursive: true, errorOnExist: true, force: false });
}
for (const name of ["17-original-evidence-audit.json", "17-original-assertion-preservation.json", "17-native-evidence-audit.json", "17-integrated-corrections-audit.json", "17-regression-repair-audit.json"]) copyFileSync(prefix + name, archive + name);
const legacyDirectory = archive + "current-legacy-helper-receipts/"; mkdirSync(legacyDirectory);
let legacyHelpers = 0;
for (const name of readdirSync("test-results/mv-evidence").filter((name) => name.endsWith(".json"))) {
  const path = "test-results/mv-evidence/" + name, row = json(path);
  if (row.source?.revision === freeze && row.startedAt >= command.startedAt && row.completedAt <= command.completedAt) { copyFileSync(path, legacyDirectory + name); legacyHelpers++; }
}
const base = { schemaVersion: 1, kind: "composite-validation-source-base; not-whole-check-success", executionFreeze: freeze, compileContractVersion: history.compileContractVersion, userInstruction: "完整跑一次耗时太长了，尽量减少全量运行", policy: "Preserve af full-check exit1. Reuse only its actual passed set after product/input/assertion identity audit; repair the failed and directly affected source subset and run the as-yet-unexecuted built responsibility. No third full-source run authorized by this plan.", originalRunner: { log: archive + command.log, commandHistory: archive + "command-history.json", exitCode: 1, files: { total: 103, passed: 102, failed: 1 }, tests: { total: 3409, passed: 3408, failed: 1 }, skipped: 0, filtered: 0, durationSeconds: 2380.17 }, inferenceMethod: "The original complete runner reports3409 tests/3408 passed/one explicitly named failure and no skips or filters. The same frozen protected inputs produce3409 collected registrations across103 files. Each registration except the uniquely matched explicit failure is therefore classified as passed by set subtraction. These are inferred per-name passes, not observed per-name pass log lines. Collection itself does not execute callbacks or prove a pass.", collection: { path: archive + "current-source-collection/registrations.json", command: archive + "current-source-collection/command.json", callbackExecution: false }, counts: { collectedIdentities: 3409, inferredPassed: 3408, explicitlyFailed: 1, actualAssetHelperReceipts: 1241, canonicalHelpers: 1195, supplementaryHelpers: 46, acceptedPassedCanonicalSource: 1194, acceptedPassedSupplementarySource: 46, excludedRunnerFailedCanonicalSource: 1 }, failures: failed, commandsNotStarted: ["pnpm build (formal second build)", "pnpm --filter rpgmaker-event-dsl test:windows-baseline"], legacyHelpersPreserved: legacyHelpers, sourceCases: identities, assetReceipts: assets, wholeCheckPassed: false, finalCompositeCoverageComplete: false, maintainerApproval: null, ticket17Status: "claimed" };
writeFileSync(archive + "source-case-identities.json", JSON.stringify(base, null, 2) + "\n");
const originals = [];
function visit(directory) { for (const entry of readdirSync(directory, { withFileTypes: true })) { const path = directory + entry.name; if (entry.isDirectory()) visit(path + "/"); else { const bytes = readFileSync(path); originals.push({ path, bytes: bytes.length, sha256: sha(bytes), expectedGitBlobId: blob(bytes) }); } } }
visit(archive);
const disposition = { schemaVersion: 1, executionFreeze: freeze, outcome: "naturally-completed-whole-source-check-failed; composite-follow-up-pending", archivedOriginals: originals.sort((a, b) => a.path.localeCompare(b.path)), count: originals.length, bytes: originals.reduce((sum, row) => sum + row.bytes, 0), sourceSummary: base.originalRunner, onlyFailure: failed[0], helperPassedDoesNotOverrideRunnerTimeout: true, noTerminationNoTestRerun: true, userInstruction: base.userInstruction, sourceIdentityMethod: base.inferenceMethod, sourceCompositeBase: archive + "source-case-identities.json", finalAcceptanceClaimed: false, maintainerApproval: null };
writeFileSync(archive + "disposition.json", JSON.stringify(disposition, null, 2) + "\n");
writeFileSync(prefix + "17-af-source-composite-base.json", JSON.stringify({ ...base, sourceCases: undefined, assetReceipts: undefined, immutableFullIndex: archive + "source-case-identities.json", disposition: archive + "disposition.json", immutableArchiveFiles: originals.length, immutableArchiveBytes: disposition.bytes }, null, 2) + "\n");
console.log(JSON.stringify({ archive, count: originals.length, bytes: disposition.bytes, legacyHelpers, counts: base.counts, failure: failed[0] }, null, 2));
