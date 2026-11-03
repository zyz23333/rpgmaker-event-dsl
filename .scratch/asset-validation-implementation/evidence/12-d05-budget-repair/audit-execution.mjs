import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const evidence = dirname(fileURLToPath(import.meta.url));
const root = resolve(evidence, "../../../..");
const ts = createRequire(join(root, "package.json"))("typescript");
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const git = (...args) => execFileSync("git", args, { cwd: root, maxBuffer: 128 * 1024 * 1024 });
const baseline = readJson(join(evidence, "red-and-baseline.json"));
const ast = readJson(join(evidence, "ast-preservation-audit.json"));
const history = readJson(join(evidence, "raw/green/command-history.json"));
const runner = readJson(join(evidence, "raw/green/source-d05-runner.json"));
assert.equal(history.commands.length, 4);
assert.ok(history.commands.every((command) => command.exitCode === 0 && command.signal === null));
const sourceCommand = history.commands.find((command) => command.name === "04-source-d05");
assert.ok(sourceCommand);
assert.equal(sourceCommand.argv.includes("--maxWorkers"), false);
assert.equal(sourceCommand.argv.some((arg) => /testTimeout|MV_CLI_ENTRY|windows-baseline/u.test(arg)), false);
assert.equal(sourceCommand.argv[sourceCommand.argv.indexOf("-t") + 1], "^AV[.]D05[.]");
assert.equal(runner.success, true);
assert.equal(runner.numTotalTests, 99);
assert.equal(runner.numPassedTests, 4);
assert.equal(runner.numFailedTests, 0);
assert.equal(runner.numPendingTests, 95);
const assertions = runner.testResults.flatMap((suite) => suite.assertionResults);
const passed = assertions.filter((test) => test.status === "passed");
const filtered = assertions.filter((test) => test.status === "skipped" || test.status === "pending");
const id = (name) => name.slice(0, name.indexOf(":"));
const expectedIds = baseline.boundedPlan.sourceIds.toSorted();
assert.equal(JSON.stringify(passed.map((test) => id(test.fullName)).sort()), JSON.stringify(expectedIds));
assert.equal(filtered.length, 95);
assert.ok(filtered.every((test) => !test.duration));
assert.equal(assertions.length, 99);
for (const item of history.frozenFiles) {
  const bytes = readFileSync(join(root, item.file));
  assert.equal(bytes.length, item.bytes);
  assert.equal(sha(bytes), item.sha256, `Frozen execution file changed: ${item.file}`);
}
git("diff", "--exit-code", history.frozenRevision, "--", "packages", "package.json", "pnpm-lock.yaml");
const diagnosticHash = history.frozenFiles.find((item) => item.file.endsWith("asset-diagnostics-workspace.test.ts")).sha256;
const receipts = [];
for (const test of passed) {
  const testId = id(test.fullName);
  const file = `${testId}.source.json`;
  const source = join(root, "test-results/asset-validation", file);
  const data = readFileSync(source);
  const receipt = JSON.parse(data.toString());
  assert.equal(receipt.id, testId);
  assert.equal(receipt.ownerTicket, "12");
  assert.equal(receipt.status, "passed");
  assert.equal(receipt.entry, "source");
  assert.equal(receipt.environment.platform, "win32");
  assert.equal(receipt.environment.node, "v22.23.4");
  assert.ok(Date.parse(receipt.startedAt) >= Date.parse(sourceCommand.startedAt));
  assert.ok(Date.parse(receipt.completedAt) <= Date.parse(sourceCommand.completedAt));
  assert.equal(receipt.expected.sha256, diagnosticHash);
  assert.equal(receipt.actual, "All independent assertions passed.");
  const destination = join(evidence, "raw/green/current-source-receipts", file);
  mkdirSync(dirname(destination), { recursive: true });
  if (existsSync(destination)) assert.equal(sha(readFileSync(destination)), sha(data));
  else writeFileSync(destination, data);
  receipts.push({ id: testId, file: relative(evidence, destination).replaceAll("\\", "/"), bytes: data.length, sha256: sha(data), runnerStatus: test.status, runnerDurationMs: test.duration, startedAt: receipt.startedAt, completedAt: receipt.completedAt, helperDurationMs: Date.parse(receipt.completedAt) - Date.parse(receipt.startedAt), inputObjects: receipt.input.length, receipt });
}
const incomplete = receipts.find((receipt) => receipt.id === "AV.D05.incomplete.native.case.expected");
const oldReceipt = readJson(join(evidence, "raw/af-whole-source/current-source-receipts/AV.D05.incomplete.native.case.expected.source.json"));
const canonical = (node) => {
  const children = [];
  ts.forEachChild(node, (child) => { children.push(canonical(child)); });
  return [ts.SyntaxKind[node.kind], !ts.isSourceFile(node) && typeof node.text === "string" ? node.text : null, children];
};
const assertionDigest = (source) => sha(JSON.stringify(canonical(ts.createSourceFile("callback.ts", `(${source})`, ts.ScriptTarget.Latest, true))));
assert.equal(assertionDigest(incomplete.receipt.expected.assertions), assertionDigest(oldReceipt.expected.assertions));
const literalInputs = (receipt) => receipt.input.filter((input) => !input.actualApi && !input.actualProcess).map((input) => input.target
  ? { ...input, target: input.target.replaceAll("\\", "/").split("/Game/").at(-1) }
  : input);
assert.equal(JSON.stringify(literalInputs(incomplete.receipt)), JSON.stringify(literalInputs(oldReceipt)));
assert.equal(incomplete.inputObjects, oldReceipt.input.length);
const childInputs = incomplete.receipt.input.filter((input) => input.actualProcess);
assert.equal(childInputs.length, 6);
const expectedPairs = ["repaired/api", "repaired/cli", "unused/api", "unused/cli", "warning-only/api", "warning-only/cli"];
assert.equal(JSON.stringify(childInputs.map((input) => `${input.sibling}/${input.mode}`)), JSON.stringify(expectedPairs));
const childResults = childInputs.map((input) => {
  const child = input.actualProcess;
  assert.equal(child.exitCode, 1);
  assert.equal(child.signal, null);
  assert.equal(child.command.replaceAll("\\", "/"), "M:/Shuen/Codex/tools/node-v22.23.4-win-x64/node.exe");
  assert.ok(/^C:[/\\]/iu.test(child.cwd));
  const result = child.ipcMessages.find((message) => message.kind === "result");
  const output = child.stderr + (input.mode === "cli" ? "" : result.message);
  assert.ok(output.includes("error MV-ASSET-QUERY-FAILED"));
  assert.ok(output.includes("MV-ASSET-INEFFECTIVE-EXCEPTION: assetCheckExceptions[1]"));
  assert.ok(!output.includes("MV-ASSET-INEFFECTIVE-EXCEPTION: assetCheckExceptions[0]"));
  assert.ok(output.includes("Independent exact sibling"));
  assert.ok(output.includes("Coverage: incomplete"));
  if (input.sibling === "warning-only") assert.ok(output.includes("warning MV-ASSET-MISSING-FILE"));
  return { sibling: input.sibling, mode: input.mode, command: child.command, arguments: child.arguments, cwd: child.cwd, exitCode: child.exitCode, signal: child.signal, startedAt: child.startedAt, completedAt: child.completedAt, expectedDiagnosticsVerified: true, fullResult: incomplete.file };
});
for (const item of baseline.originalTicket12History) {
  const bytes = readFileSync(join(root, item.file));
  assert.equal(bytes.length, item.bytes);
  assert.equal(sha(bytes), item.sha256);
  const blob = git("show", `HEAD:${item.file}`);
  assert.equal(blob.length, item.gitBytes);
  assert.equal(sha(blob), item.gitSha256);
}
const rawFiles = readdirSync(join(evidence, "raw"), { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile()).map((entry) => {
  const path = join(entry.parentPath ?? entry.path, entry.name);
  const bytes = readFileSync(path);
  return { file: relative(evidence, path).replaceAll("\\", "/"), bytes: bytes.length, sha256: sha(bytes) };
}).sort((a, b) => a.file.localeCompare(b.file));
const outcome = {
  schemaVersion: 1, title: "Ticket12 D05 incomplete local test-budget repair", status: "passed", recordedAt: new Date().toISOString(), worktree: root, branch: history.branch, originalWholeSourceFrozenRevision: baseline.originalWholeSourceFrozenRevision, repairBaseRevision: baseline.repairBaseRevision, codeAndTestExecutionFrozenRevision: history.frozenRevision,
  change: { helper: "Optional timeout?: number is forwarded to Vitest; omitted/undefined retains configured default.", registration: "Only existing D05 incomplete supplies 30000ms; repaired/unused/warning-only retain default 10000ms.", productPolicyContractInputsAssertionsFixturesIdsAndActualBoundariesUnchanged: true },
  originalRed: { runner: baseline.originalRunner, eventualHelperCompletion: baseline.eventualHelperCompletion, interpretation: "Original pnpm check remains failed; eventual helper completion is not substituted for the runner result." },
  boundedVerification: { environment: history.environment, sourceRunner: { command: sourceCommand.displayCommand, startedAt: sourceCommand.startedAt, completedAt: sourceCommand.completedAt, exitCode: sourceCommand.exitCode, totalRegistered: 99, passed: 4, failed: 0, filtered: 95, filteredArePasses: false, fullDiagnosticSuiteExecuted: false, fullRepositorySourceExecuted: false, builtExecuted: false }, checks: history.commands.filter((command) => command !== sourceCommand).map(({ displayCommand, exitCode, durationMs, log }) => ({ command: displayCommand, exitCode, durationMs, log })) },
  freshReceipts: receipts.map(({ receipt, ...metadata }) => metadata),
  incompleteActualChildResults: childResults,
  preservation: { diagnosticCallbackCount: ast.diagnosticCallbacks.countAfter, allDiagnosticCallbacksAstEqual: true, fullDiagnosticAstEqualAfterTimeoutProjection: true, wholeHelperAstEqualAfterOptionalTimeoutProjection: true, helperAsyncCallbackAndFinallyEqual: true, siblingWorkloadByteIdentical: true, runtimeIncompleteAssertionCallbackAstEqualToAf: true, runtimeIncompleteInputObjectsBefore: oldReceipt.input.length, runtimeIncompleteInputObjectsAfter: incomplete.inputObjects, literalInputsEquivalent: true, literalInputComparison: "Exact source/project/policy/fact values and order; fact.target compares the unchanged relative suffix beneath each independently created Game root. Original and current raw receipts are never rewritten.", actualChildBoundaries: 6, originalTicket12HistoricalFilesPreserved: baseline.originalTicket12History.length, codeTestConfigFrozenFilesUnchangedAfterExecution: true, original12OutcomePreserved: true },
  scope: { ticket12: "resolved after the bounded green result is recorded", ticket17: "claimed; full final acceptance remains independently owned", contract: "mv-1.6.1/40 unchanged", noAdditionalProductInvocationsForEvidenceOnlyMerge: true },
  evidence: { originalRedAndBaseline: "red-and-baseline.json", preservationAudit: "ast-preservation-audit.json", actualCommands: "raw/green/command-history.json", actualSourceRunner: "raw/green/source-d05-runner.json", rawFiles },
  administrativeNotes: ["Evidence preparation initially hit Node execFileSync default maxBuffer while reading existing 12 acceptance JSON. The buffer was increased and already archived originals were hash-checked, without rewriting them. No product/test invocation occurred in this preparation failure.", "The AST audit initially included SourceFile.text (whole formatted source) as a scalar, incorrectly treating formatter trivia as semantic AST. SourceFile.text was excluded; all actual node kinds, child order and identifier/literal text remain compared. No business or test change resulted."],
};
writeFileSync(join(evidence, "12-d05-budget-repair.json"), `${JSON.stringify(outcome, null, 2)}\n`);
console.log(JSON.stringify({ status: outcome.status, frozenRevision: history.frozenRevision, sourcePassed: 4, sourceFailed: 0, sourceFiltered: 95, incompleteRunnerDurationMs: incomplete.runnerDurationMs, freshReceipts: receipts.length, actualChildBoundaries: childResults.length, oldHistoryFilesPreserved: baseline.originalTicket12History.length, rawFiles: rawFiles.length }, null, 2));
