// Preserve the naturally completed failed whole check without rewriting any raw
// log/receipt. Only this run's explicitly listed evidence paths are moved.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";
const prefix = ".scratch/asset-validation-implementation/evidence/";
const raw = resolve(prefix + "17-raw");
const relativeArchive = "history/c5f7ead7-contract40-whole-check-failed";
const archive = resolve(raw, relativeArchive);
const sha = (value) => createHash("sha256").update(value).digest("hex");
const check = (value, message) => { if (!value) throw new Error(message); };
const history = JSON.parse(readFileSync(resolve(raw, "command-history.json")));
check(history.frozenRevision === "c5f7ead75ba78680b92ad81924ba8cb884d2b751" &&
  history.commands.length === 2 && history.commands[0].exitCode === 0 && history.commands[1].exitCode === 1,
  "Wrong/incomplete failed run");
const sourceCommand = history.commands[1];
check(sourceCommand.receipts.length === 1241 && sourceCommand.receipts.every((row) => row.status === "passed"), "Unexpected source receipt set");
const log = readFileSync(resolve(raw, sourceCommand.log));
check(sha(log) === sourceCommand.logSha256 && log.length === sourceCommand.logBytes, "Failed command raw log differs");
const text = log.toString().replace(/\x1b\[[0-?]*[ -/]*[@-~]/gu, "");
check(text.includes("6 failed | 97 passed (103)") && text.includes("6 failed | 3403 passed (3409)"), "Expected actual complete summary missing");
check(!existsSync(archive), "Failed run archive already exists");
const names = ["00-setup-build.log", "01-pnpm-check.log", "command-history.json", "current-source-receipts", "current-legacy-regression-evidence",
  "final-canonical-id-plan.json", "final-canonical-id-plan.md"];
const operations = names.map((name) => ({ source: resolve(raw, name), target: resolve(archive, name) }));
for (const operation of operations) {
  check(operation.source.startsWith(raw + "\\") && operation.target.startsWith(archive + "\\") && archive.startsWith(raw + "\\history\\"),
    "Evidence move escapes exact17 raw workspace");
  check(existsSync(operation.source), "Failed run evidence absent " + operation.source);
}
mkdirSync(archive, { recursive: true });
for (const operation of operations) renameSync(operation.source, operation.target);
for (const name of ["17-original-evidence-audit.json", "17-original-assertion-preservation.json", "17-native-evidence-audit.json", "17-integrated-corrections-audit.json"])
  copyFileSync(prefix + name, resolve(archive, name));
const files = [];
function visit(directory, relative = "") {
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, "en"))) {
    const path = resolve(directory, entry.name), child = relative ? relative + "/" + entry.name : entry.name;
    if (entry.isDirectory()) visit(path, child); else { const bytes = readFileSync(path); files.push({ path: child, bytes: bytes.length, sha256: sha(bytes) }); }
  }
}
visit(archive);
const protectedPaths = ["packages/rpgmaker-event-dsl/src", "packages/rpgmaker-event-dsl/test", "packages/rpgmaker-event-dsl/package.json",
  "packages/rpgmaker-event-dsl/vitest.config.ts", "packages/rpgmaker-event-dsl/vitest.windows.config.ts", "package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", "tsconfig.json"];
execFileSync("git", ["diff", "--exit-code", history.frozenRevision, "--", ...protectedPaths]);
const disposition = { schemaVersion: 1, executionFreeze: history.frozenRevision, compileContractVersion: history.compileContractVersion,
  outcome: "naturally-completed-whole-pnpm-check-failed; not final acceptance", commandHistory: "command-history.json", rawLog: "01-pnpm-check.log",
  environment: history.environment, commandsExecuted: history.commands.map((row) => ({ command: row.command, label: row.label, startedAt: row.startedAt, completedAt: row.completedAt, exitCode: row.exitCode })),
  actualSourceSummary: { testFiles: { total: 103, passed: 97, failed: 6 }, tests: { total: 3409, passed: 3403, failed: 6 }, durationSeconds: 2750.83, skipped: 0, filtered: 0 },
  actualSourceAssetReceipts: { total: 1241, passed: 1241, canonical: 1195, activeOriginalSupplementary: 39, newDeviceSpaceSupplementary: 7,
    receiptAxisDoesNotMultiplyCanonicalIds: true, wholeCheckVerdict: "failed regardless of asset receipt passes" },
  failures: [
    { file: "audio-commands-workspace.test.ts", test: "MV-S6-AUDIO-002 batch2", actual: "Test timed out in30000ms", causeBeyondTimeoutEstablished: false },
    { file: "control-input-workspace.test.ts", test: "MV-S3-INPUT-003 actorRef", actual: "Test timed out in10000ms", causeBeyondTimeoutEstablished: false },
    { file: "final-review-workspace.test.ts", test: "old/23 stale until current/38 Compile", actual: "strict CURRENT expectation38 received40 at line136; later historical23/state assertions were not reached" },
    { file: "movement-instructions-workspace.test.ts", test: "MV-S6-MOVEMENT-003", actual: "Test timed out in30000ms", causeBeyondTimeoutEstablished: false },
    { file: "pictures-workspace.test.ts", test: "MV-S6-PICTURE-007", actual: "Test timed out in10000ms", causeBeyondTimeoutEstablished: false },
    { file: "screen-effects-workspace.test.ts", test: "MV-S6-SCREEN-002", actual: "Test timed out in30000ms", causeBeyondTimeoutEstablished: false },
  ], helperReceiptsDoNotOverrideRunnerFailures: true,
  commandsNotStarted: ["pnpm build (formal second command)", "pnpm --filter rpgmaker-event-dsl test:windows-baseline"],
  noTerminationNoTestRepeatNoProductTestConfigurationMutation: true, originalFiles: files,
  originalRootRelativePathsMovedUnder: prefix + "17-raw/" + relativeArchive,
  currentFinalAcceptanceClaimed: false, maintainerApproval: null };
writeFileSync(resolve(archive, "disposition.json"), JSON.stringify(disposition, null, 2) + "\n");
console.log(JSON.stringify({ archive, originalFiles: files.length, bytes: files.reduce((sum, row) => sum + row.bytes, 0), outcome: disposition.outcome }, null, 2));
