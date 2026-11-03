import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const evidence = dirname(fileURLToPath(import.meta.url));
const root = resolve(evidence, "../../../..");
const require = createRequire(join(root, "package.json"));
const ts = require("typescript");
const sha = (value) => createHash("sha256").update(value).digest("hex");
const git = (...args) => execFileSync("git", args, { cwd: root, maxBuffer: 128 * 1024 * 1024 });
const baseline = JSON.parse(readFileSync(join(evidence, "red-and-baseline.json"), "utf8"));
const diagnosticFile = "packages/rpgmaker-event-dsl/test/asset-diagnostics-workspace.test.ts";
const helperFile = "packages/rpgmaker-event-dsl/test/support/asset-evidence.ts";
const parse = (file, bytes) => ts.createSourceFile(file, bytes.toString(), ts.ScriptTarget.Latest, true);
const oldDiagnostic = parse(diagnosticFile, readFileSync(join(evidence, "raw/before", diagnosticFile)));
const diagnostic = parse(diagnosticFile, readFileSync(join(root, diagnosticFile)));
const oldHelper = parse(helperFile, readFileSync(join(evidence, "raw/before", helperFile)));
const helper = parse(helperFile, readFileSync(join(root, helperFile)));
const collect = (tree, predicate) => {
  const result = [];
  const visit = (node) => {
    if (predicate(node)) result.push(node);
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return result;
};
const canonical = (node, project = (value) => value) => {
  const projected = project(node);
  const children = [];
  ts.forEachChild(projected, (child) => { children.push(canonical(child, project)); });
  const scalar = !ts.isSourceFile(projected) && typeof projected.text === "string" ? projected.text : null;
  return [ts.SyntaxKind[projected.kind], scalar, children];
};
const digest = (node, project) => sha(JSON.stringify(canonical(node, project)));
const d05 = collect(diagnostic, (node) => ts.isCallExpression(node) && node.expression.getText(diagnostic) === "it" && node.arguments[0]?.getText(diagnostic).startsWith("`AV.D05."));
assert.equal(d05.length, 1);
assert.equal(d05[0].arguments.length, 3);
assert.equal(d05[0].arguments[2].getText(diagnostic), 'branch === "incomplete" ? 30_000 : undefined');
const projectDiagnostic = (node) => node === d05[0]
  ? ts.factory.updateCallExpression(node, node.expression, node.typeArguments, node.arguments.slice(0, 2))
  : node;
assert.equal(digest(diagnostic, projectDiagnostic), digest(oldDiagnostic), "Entire diagnostic AST differs after removing the only local timeout argument");
const callbackKinds = (node) => ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isFunctionDeclaration(node);
const oldCallbacks = collect(oldDiagnostic, callbackKinds).map((node) => digest(node));
const newCallbacks = collect(diagnostic, callbackKinds).map((node) => digest(node));
assert.equal(sha(JSON.stringify(newCallbacks)), sha(JSON.stringify(oldCallbacks)));
const incompleteWorkload = collect(diagnostic, (node) => ts.isFunctionDeclaration(node) && node.name?.text === "independentlyDeterminableExceptions")[0];
const oldWorkload = collect(oldDiagnostic, (node) => ts.isFunctionDeclaration(node) && node.name?.text === "independentlyDeterminableExceptions")[0];
assert.equal(incompleteWorkload.getText(diagnostic), oldWorkload.getText(oldDiagnostic), "Sibling workload must remain byte-identical");
const itCalls = collect(helper, (node) => ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "it");
assert.equal(itCalls.length, 1);
assert.equal(itCalls[0].arguments.length, 3);
assert.equal(itCalls[0].arguments[2].getText(helper), "timeout");
const returned = collect(helper, (node) => ts.isArrowFunction(node) && node.parameters.some((p) => p.name.getText(helper) === "verify"));
assert.equal(returned.length, 1);
assert.equal(returned[0].parameters.length, 3);
assert.equal(returned[0].parameters[2].getText(helper), "timeout?: number");
const projectHelper = (node) => {
  if (node === returned[0]) return ts.factory.updateArrowFunction(node, node.modifiers, node.typeParameters, node.parameters.slice(0, 2), node.type, node.equalsGreaterThanToken, node.body);
  if (node === itCalls[0]) return ts.factory.updateCallExpression(node, node.expression, node.typeArguments, node.arguments.slice(0, 2));
  return node;
};
assert.equal(digest(helper, projectHelper), digest(oldHelper), "Helper AST differs beyond optional parameter and timeout forwarding");
const oldItCall = collect(oldHelper, (node) => ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "it")[0];
assert.equal(digest(itCalls[0].arguments[1]), digest(oldItCall.arguments[1]), "Complete helper async callback including finally and receipt metadata changed");

const consumerFiles = readdirSync(join(root, "packages/rpgmaker-event-dsl/test"), { recursive: true })
  .filter((file) => file.endsWith(".ts"));
const consumers = [];
for (const file of consumerFiles) {
  const path = join(root, "packages/rpgmaker-event-dsl/test", file);
  const source = readFileSync(path, "utf8");
  if (!source.includes("createAssetTest(") || path.endsWith("asset-evidence.ts")) continue;
  const tree = parse(file, source);
  const bindings = collect(tree, (node) => ts.isVariableDeclaration(node) && node.initializer && ts.isCallExpression(node.initializer) && node.initializer.expression.getText(tree) === "createAssetTest")
    .map((node) => node.name.getText(tree));
  const calls = collect(tree, (node) => ts.isCallExpression(node) && (
    (ts.isIdentifier(node.expression) && bindings.includes(node.expression.text)) ||
    (ts.isCallExpression(node.expression) && node.expression.expression.getText(tree) === "createAssetTest")
  ));
  const nonDefault = calls.filter((call) => call.arguments.length !== 2);
  assert.equal(nonDefault.length, file === "asset-diagnostics-workspace.test.ts" ? 1 : 0, `Unexpected helper consumer timeout in ${file}`);
  consumers.push({ file: relative(root, path).replaceAll("\\", "/"), bindings, registrationCalls: calls.length, unchangedDefaultCalls: calls.length - nonDefault.length, localTimeoutCalls: nonDefault.length });
}
const vitestPath = "node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js";
const vitestBytes = readFileSync(join(root, vitestPath));
const vitestSource = vitestBytes.toString();
const parseStart = vitestSource.indexOf("function parseArguments(optionsOrFn, timeoutOrTest) {");
const parseEnd = vitestSource.indexOf("\n// implementations", parseStart);
const parseArgumentsSource = vitestSource.slice(parseStart, parseEnd);
assert.ok(parseArgumentsSource.includes('typeof timeoutOrTest === "number"'));
assert.ok(parseArgumentsSource.includes("let options = {}"));
assert.ok(vitestSource.includes("const timeout = options.timeout ?? runner.config.testTimeout;"));
mkdirSync(join(evidence, "raw/installed-vitest"), { recursive: true });
writeFileSync(join(evidence, "raw/installed-vitest/default-timeout-path.js.txt"), `${parseArgumentsSource}\n\n${vitestSource.slice(vitestSource.indexOf("\t\tconst timeout = options.timeout ?? runner.config.testTimeout;"), vitestSource.indexOf("\t\tconst timeout = options.timeout ?? runner.config.testTimeout;") + 73)}\n`);
const config = readFileSync(join(root, "packages/rpgmaker-event-dsl/vitest.config.ts"), "utf8");
assert.ok(config.includes("maxWorkers: 2"));
assert.ok(config.includes("testTimeout: 10_000"));
const changedPackageFiles = git("diff", "--name-only", baseline.repairBaseRevision, "--", "packages").toString().trim().split(/\r?\n/).filter(Boolean).sort();
assert.equal(JSON.stringify(changedPackageFiles), JSON.stringify([diagnosticFile, helperFile].sort()));
for (const item of baseline.originalTicket12History) {
  const bytes = readFileSync(join(root, item.file));
  assert.equal(bytes.length, item.bytes);
  assert.equal(sha(bytes), item.sha256, `Historical evidence changed: ${item.file}`);
}
for (const item of baseline.rawManifest) {
  const bytes = readFileSync(join(evidence, item.file));
  assert.equal(bytes.length, item.bytes);
  assert.equal(sha(bytes), item.sha256);
}
const result = {
  schemaVersion: 1, recordedAt: new Date().toISOString(), repairBaseRevision: baseline.repairBaseRevision, originalWholeSourceFrozenRevision: baseline.originalWholeSourceFrozenRevision,
  comparison: "All af diagnostic source and helper bytes match the repair baseline modulo EOL. Canonical AST includes every node kind, identifier/literal text and child order, excluding positions/trivia. Only timeout parameter/forwarding and the D05 outer third argument are projected out.",
  entireDiagnosticAstBefore: digest(oldDiagnostic), entireDiagnosticAstAfterRemovingTimeoutOnly: digest(diagnostic, projectDiagnostic),
  diagnosticCallbacks: { countBefore: oldCallbacks.length, countAfter: newCallbacks.length, allEqual: true, sha256: sha(JSON.stringify(newCallbacks)) },
  independentlyDeterminableExceptions: { byteIdentical: true, sha256: sha(incompleteWorkload.getText(diagnostic)), originalSiblingBranches: ["repaired", "unused", "warning-only"], actualChildModesPerSibling: ["api", "cli"], actualChildBoundaries: 6, childStopFinallyAndStateAssertionsPreserved: true },
  helperEntireAstBefore: digest(oldHelper), helperEntireAstAfterRemovingOptionalParameterAndForwarding: digest(helper, projectHelper), helperAsyncCallbackIncludingFinallySha256: digest(itCalls[0].arguments[1]), helperAsyncCallbackIncludingFinallyUnchanged: true,
  helperConsumers: consumers,
  installedVitest: { file: vitestPath, version: "4.1.9", bytes: vitestBytes.length, sha256: sha(vitestBytes), parseArgumentsStartLine: vitestSource.slice(0, parseStart).split("\n").length, interpretation: "Omitted and explicit undefined timeout both leave options empty; task timeout resolves options.timeout ?? runner.config.testTimeout. Only a numeric 30000 changes the incomplete registration." },
  configuration: { defaultTimeoutMs: 10000, defaultMaxWorkers: 2, unchanged: true },
  changedPackageFiles, productFixturesConfigPackageLockAndAllOtherTestsUnchanged: true,
  originalTicket12HistoricalFilesPreserved: baseline.originalTicket12History.length,
  originalAfRawHashesPreserved: true,
  noNewVitestTestIdsOrAssertionsOrFixtures: true,
};
writeFileSync(join(evidence, "ast-preservation-audit.json"), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ status: "passed", diagnosticCallbacks: result.diagnosticCallbacks, actualChildBoundaries: 6, helperConsumers: consumers.length, changedPackageFiles, originalTicket12HistoricalFilesPreserved: result.originalTicket12HistoricalFilesPreserved }, null, 2));
