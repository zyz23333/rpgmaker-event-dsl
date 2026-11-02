// Independent, evidence-only acceptance of the narrow legacy regression repair.
// Reads TypeScript as syntax and original JSON; does not run/import any test.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
const prefix = ".scratch/asset-validation-implementation/evidence/";
const support = prefix + "17-regression-repair/", raw = support + "raw/";
const freeze = process.env.ASSET_VALIDATION_EXECUTION_FREEZE ?? "0b5195c4095e9b21b8e345541c4ae7859bc2d66a";
const git = (...args) => execFileSync("git", args, { maxBuffer: 128 * 1024 * 1024 });
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const json = (path) => JSON.parse(readFileSync(path));
const ts = createRequire(join(process.cwd(), "packages/rpgmaker-event-dsl/package.json"))("typescript");
const evidence = json(support + "acceptance.json"), red = json(raw + "original-red.json");
assert.equal(sha(readFileSync(support + "acceptance.json")), "5d0943651ed051c63b47e33aa044cd3662ad4d37d44df411f149926f036a3524");
const parse = (text, path) => ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
const printer = ts.createPrinter({ removeComments: true });
const shape = (text, path) => printer.printFile(parse(text, path));
const fileAudit = [];
for (const input of red.sourceFiles) {
  const old = git("show", red.red + ":" + input.path).toString(), currentBytes = git("show", freeze + ":" + input.path);
  const current = currentBytes.toString(), tree = parse(current, input.path), edits = [], changes = [];
  assert.deepEqual(readFileSync(input.archived), Buffer.from(old));
  assert.deepEqual(readFileSync(input.path), currentBytes);
  const name = input.path.split("/").at(-1), wrapper = /^(?:pictures|control-input)-/u.test(name) ? "evidenceIt" : /^(?:audio-commands|screen-effects)-/u.test(name) ? "it" : null;
  const target = name.startsWith("pictures-") ? ["MV-S6-PICTURE-007", 30000, null] : name.startsWith("control-input-") ? ["MV-S3-INPUT-003", 30000, null] : name.startsWith("audio-") ? ["MV-S6-AUDIO-002", 60000, null] : name.startsWith("movement-") ? ["MV-S6-MOVEMENT-003", 60000, "30_000"] : name.startsWith("screen-") ? ["MV-S6-SCREEN-002", 90000, null] : null;
  const edit = (start, end, text, reason) => { edits.push({ start, end, text }); changes.push(reason); };
  function removeLast(list, reason) { assert(list.length > 1); edit(list.at(-2).end, list.at(-1).end, "", reason); }
  function visit(node, owner = null) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === wrapper) {
      const last = node.parameters.at(-1); assert.equal(last.name.getText(tree), "timeout");
      removeLast(node.parameters, "local wrapper timeout parameter only"); owner = wrapper;
    }
    if (ts.isCallExpression(node)) {
      const last = node.arguments.at(-1), title = node.arguments[0]?.getText(tree) ?? "";
      if (owner && last && ts.isIdentifier(last) && last.text === "timeout") {
        if (/^(?:audio-commands|screen-effects)-/u.test(name)) edit(last.getStart(tree), last.end, "30_000", "unchanged original wrapper default30s; added argument forwarding only");
        else removeLast(node.arguments, "optional local deadline forwarding only");
      }
      if (target && title.includes(target[0])) {
        assert(last && ts.isNumericLiteral(last)); assert.equal(Number(last.text), target[1]);
        if (target[2]) edit(last.getStart(tree), last.end, target[2], "selected callback local deadline30s->60s");
        else removeLast(node.arguments, "selected callback/group local deadline only");
      }
    }
    if (name === "final-review-workspace.test.ts" && ts.isStringLiteralLike(node)) {
      const values = new Map([["keeps an explicit old /23 contract stale until a normal current /40 Compile", "keeps an explicit old /23 contract stale until a normal current /38 Compile"], ["final-review-contract-40", "final-review-contract-38"], ["mv-1.6.1/40", "mv-1.6.1/38"]]);
      if (values.has(node.text)) edit(node.getStart(tree), node.end, JSON.stringify(values.get(node.text)), "explicit legacy CURRENT38->40 compatibility string");
    }
    ts.forEachChild(node, (child) => visit(child, owner));
  }
  visit(tree);
  assert.equal(edits.length, name === "final-review-workspace.test.ts" ? 3 : wrapper ? 3 : 1, input.path);
  let normalized = current;
  for (const edit of edits.sort((a, b) => b.start - a.start)) normalized = normalized.slice(0, edit.start) + edit.text + normalized.slice(edit.end);
  assert.equal(shape(normalized, input.path), shape(old, input.path), "Unexpected full-file AST change " + input.path);
  const counts = { callbacks: 0, arrays: 0, strings: 0, expectations: 0 };
  function count(node) { if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) counts.callbacks++; if (ts.isArrayLiteralExpression(node)) counts.arrays++; if (ts.isStringLiteralLike(node)) counts.strings++; if (ts.isCallExpression(node) && node.expression.getText(tree) === "expect") counts.expectations++; ts.forEachChild(node, count); }
  count(tree);
  fileAudit.push({ path: input.path, originalRevision: red.red, originalSha256: sha(Buffer.from(old)), currentRevision: freeze, currentSha256: sha(currentBytes), fullFileAstEqualAfterExactWhitelistedMetadataNormalization: true, counts, changes });
}
const protectedScopes = ["packages/rpgmaker-event-dsl/src", "packages/rpgmaker-event-dsl/test/fixtures", "packages/rpgmaker-event-dsl/test/support", "packages/rpgmaker-event-dsl/vitest.config.ts", "packages/rpgmaker-event-dsl/vitest.windows.config.ts", "packages/rpgmaker-event-dsl/package.json", "package.json", "pnpm-lock.yaml"];
assert.equal(git("diff", "--name-only", red.red, freeze, "--", ...protectedScopes).toString(), "");
assert.deepEqual(git("diff", "--name-only", red.red, freeze, "--", "packages/rpgmaker-event-dsl/test").toString().trim().split("\n").sort(), red.sourceFiles.map((row) => row.path).sort());
const rawFiles = evidence.rawFiles.map((row) => { const bytes = readFileSync(row.path); assert.equal(bytes.length, row.bytes); assert.equal(sha(bytes), row.sha256); assert.deepEqual(git("show", "11fdc39f6498041b4511bcd486bb36ac26ffddf8:" + row.path), bytes); return row; });
for (const input of evidence.gitInputs) assert.deepEqual(git("show", freeze + ":" + input.path), git("show", evidence.implementationRevision + ":" + input.path));
const knownSources = new Map(), executions = [];
for (const entry of ["source", "built"]) {
  const command = json(raw + entry + "-command.json"), runner = json(raw + entry + "-runner.json");
  assert.equal(command.head, evidence.implementationRevision); assert.equal(command.exitCode, 0); assert.equal(command.workerOverride, null); assert.equal(command.globalEntryOverride, null);
  assert.equal(runner.success, true); assert.equal(runner.testResults.length, 6); assert.equal(runner.numTotalTests, 137); assert.equal(runner.numPassedTests, 22); assert.equal(runner.numFailedTests, 0); assert.equal(runner.numPendingTests, 115);
  assert.deepEqual(runner.testResults.map((suite) => "packages/rpgmaker-event-dsl/test/" + suite.name.replaceAll("\\", "/").split("/").at(-1)).sort(), red.sourceFiles.map((row) => row.path).sort());
  const assertions = runner.testResults.flatMap((suite) => suite.assertionResults), passed = assertions.filter((row) => row.status === "passed");
  assert.equal(passed.length, 22); assert.equal(assertions.filter((row) => row.status === "skipped").length, 115);
  assert.deepEqual(passed.map((row) => row.fullName).sort(), evidence.executions.find((row) => row.entry === entry).selected.map((row) => row.name).sort());
  assert.equal(passed.filter((row) => row.fullName.startsWith("MV-S3-INPUT-003:")).length, 15);
  assert.equal(passed.filter((row) => row.fullName.startsWith("MV-S6-AUDIO-002:")).length, 3);
  assert(passed.some((row) => row.fullName === "keeps an explicit old /23 contract stale until a normal current /40 Compile"));
  const helpers = evidence.helpers.filter((row) => row.entry === entry); assert.equal(helpers.length, 21);
  for (const helper of helpers) {
    const row = json(helper.path); assert.equal(sha(readFileSync(helper.path)), helper.sha256);
    assert.equal(row.source.revision, evidence.implementationRevision); assert.equal(row.status, "passed"); assert.deepEqual(row.actual, helper.actual); assert.equal(row.difference, null);
    if (row.requirementId === "MV-S6-MOVEMENT-003") { assert.equal(row.actual.case, "movement-untyped"); assert(row.actual.finalState); }
    else assert.equal(row.actual.assertionsCompleted, true);
    assert(row.startedAt >= command.startedAt && row.completedAt <= command.completedAt);
    const actualEntry = row.actual.entry.replaceAll("\\", "/");
    assert(actualEntry.endsWith(row.requirementId === "MV-S6-MOVEMENT-003" ? entry === "source" ? "/src/cli.ts" : "/dist/cli.mjs" : entry === "source" ? "/src/workspace-api.ts" : "/dist/workspace-api.mjs"));
    const normalizedSources = row.source.files.map((file) => ({ path: file.path, sha256: file.sha256 }));
    assert.equal(sha(JSON.stringify(normalizedSources)), row.source.fingerprint);
    for (const file of normalizedSources) {
      if (!knownSources.has(file.path)) { const bytes = readFileSync(file.path); assert.equal(sha(bytes), file.sha256); knownSources.set(file.path, file); }
      else assert.equal(knownSources.get(file.path).sha256, file.sha256);
    }
  }
  executions.push({ entry, command, actualFiles: 6, registered: 137, passed: 22, failed: 0, filtered: 115, helpers: 21, actualPassedNames: passed.map((row) => row.fullName).sort() });
}
const compatibility = { path: "packages/rpgmaker-event-dsl/test/final-review-workspace.test.ts", originalRevision: red.red, currentRevision: freeze, originalCurrent: "mv-1.6.1/38", requiredCurrent: "mv-1.6.1/40", exactChangedStrings: 3, strictAssertionChanges: 1, titleChanges: 1, sandboxLabelChanges: 1, historicalContract: "mv-1.6.1/23", historicalAndStaleFreshCheckDoesNotUpgradeAssertionsPreserved: true, binding: fileAudit.find((row) => row.path.endsWith("final-review-workspace.test.ts")), independentOf09And16Corrections: true };
const result = { schemaVersion: 1, status: "independently-verified-selected-repair-evidence; not-whole-command-acceptance", executionFreeze: freeze, supportExecutionFreeze: evidence.implementationRevision, supportTip: "11fdc39f6498041b4511bcd486bb36ac26ffddf8", supportEvidence: { path: support + "acceptance.json", sha256: sha(readFileSync(support + "acceptance.json")) }, protectedScopesUnchanged: protectedScopes, fullFileAudits: fileAudit, aggregatePreservedSyntax: fileAudit.reduce((sum, row) => ({ callbacks: sum.callbacks + row.counts.callbacks, arrays: sum.arrays + row.counts.arrays, strings: sum.strings + row.counts.strings }), { callbacks: 0, arrays: 0, strings: 0 }), explicitLegacyCurrentCompatibility: compatibility, localBudgets: evidence.budgets, rawFilesChecked: rawFiles.length, originalFrozenInputsChecked: evidence.gitInputs.length, independentlyHashedHelperSourceFiles: knownSources.size, executions, qualifications: ["Exact whitelisted deadline plumbing is outside business callbacks; full-file normalized AST comparison also retains all input numbers, arrays, conditions and assertions.", "Local budgets do not prove a product performance fix, future timing guarantee, or the cause of the earlier whole-run failures. Global2workers/10s/defaultTEMP remain unchanged.", "Five historical eventual-body-passed helpers remain distinct from runner timeouts; old CURRENT38 failure stopped before the23 workflow. Later selected passes do not overwrite original failures.", "22 selected passes and115 filtered per entry are narrow support evidence only. No new native or selected execution occurred in this audit."] };
assert.deepEqual(result.aggregatePreservedSyntax, { callbacks: 122, arrays: 295, strings: 936 });
writeFileSync(prefix + "17-regression-repair-audit.json", JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({ executionFreeze: freeze, syntax: result.aggregatePreservedSyntax, sources: knownSources.size, actualSelectedPasses: executions.map((row) => ({ entry: row.entry, passed: row.passed, filtered: row.filtered })) }, null, 2));
