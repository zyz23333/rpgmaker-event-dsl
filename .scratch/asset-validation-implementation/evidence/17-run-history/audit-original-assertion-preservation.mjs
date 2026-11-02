// Static preservation audit: exact callback/token checks supplement manual semantic review.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
const root = process.cwd();
const prefix = ".scratch/asset-validation-implementation/evidence/";
const original = JSON.parse(readFileSync(prefix + "17-original-evidence-audit.json"));
const ts = createRequire(join(root, "packages/rpgmaker-event-dsl/package.json"))("typescript");
const sha = (value) => createHash("sha256").update(value).digest("hex");
const sourceCache = new Map();
function source(revision, path) {
  const key = revision + ":" + path;
  if (!sourceCache.has(key)) {
    const text = execFileSync("git", ["show", key], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
    sourceCache.set(key, ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS));
  }
  return sourceCache.get(key);
}
function callback(tree, expected) {
  const found = [];
  function visit(node) {
    if ((ts.isArrowFunction(node) || ts.isFunctionExpression(node)) && sha(node.getText(tree)) === expected) found.push(node);
    ts.forEachChild(node, visit);
  }
  visit(tree);
  if (found.length !== 1) throw new Error("Callback not unique: " + expected);
  return found[0];
}
function tokens(text) {
  const scan = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, text);
  const result = [];
  while (scan.scan() !== ts.SyntaxKind.EndOfFileToken) result.push(scan.getTokenText());
  return JSON.stringify(result);
}
function assertions(node, tree) {
  const result = [];
  function visit(child) {
    if (ts.isExpressionStatement(child) && /^(?:await\s+)?expect\s*\(/u.test(child.expression.getText(tree))) result.push(child.expression.getText(tree));
    ts.forEachChild(child, visit);
  }
  visit(node);
  return result;
}
const relevant = original.originalAutomatedEvidence.filter((row) => row.currentDefinition && row.historicalDefinition?.candidates?.length === 1);
const groups = new Map();
for (const row of relevant) {
  const oldSha = row.historicalDefinition.candidates[0].callbackSourceSha256;
  const key = [row.assertionSource, row.assertionSourceSha256, oldSha, row.currentDefinition.callbackSha256].join("@");
  if (groups.has(key)) { groups.get(key).originalReceiptRefs.push(row.ref); continue; }
  const binding = original.originalAssertionSourceBindings.find((item) => item.key === row.assertionSource + "@" + row.assertionSourceSha256);
  if (!binding) throw new Error("Original source binding missing " + row.ref);
  const oldTree = source(binding.historical[0].revision, row.assertionSource);
  const currentTree = source(original.executionFreeze, row.assertionSource);
  const old = callback(oldTree, oldSha), current = callback(currentTree, row.currentDefinition.callbackSha256);
  const oldExpectations = assertions(old, oldTree), currentExpectations = assertions(current, currentTree);
  const tokenSet = new Set(currentExpectations.map(tokens));
  const missing = oldExpectations.filter((expectation) => !tokenSet.has(tokens(expectation)));
  groups.set(key, { path: row.assertionSource, representativeId: row.id, originalReceiptRefs: [row.ref],
    originalRevision: binding.historical[0].revision, originalCallbackSha256: oldSha,
    currentRevision: original.executionFreeze, currentLine: row.currentDefinition.line,
    currentCallbackSha256: row.currentDefinition.callbackSha256,
    callbackTextUnchanged: oldSha === row.currentDefinition.callbackSha256,
    callbackTokensUnchanged: tokens(old.getText(oldTree)) === tokens(current.getText(currentTree)),
    originalAssertionExpressionCount: oldExpectations.length, currentAssertionExpressionCount: currentExpectations.length,
    originalAssertionExpressionsPreservedAsExactTokens: oldExpectations.length - missing.length,
    missingExactExpressionsRequireManualReview: missing,
    ...(oldSha === row.currentDefinition.callbackSha256 ? {} : { originalCallback: old.getText(oldTree), currentCallback: current.getText(currentTree) }) });
}
const result = { executionFreeze: original.executionFreeze, status: "static-assertion-preservation-audit; manual semantic findings remain separate",
  comparedOriginalReceiptLocations: relevant.length, uniqueCallbackVersionPairs: groups.size,
  changedCallbackVersionPairs: [...groups.values()].filter((row) => !row.callbackTextUnchanged).length,
  expressionDifferencesRequiringManualReview: [...groups.values()].filter((row) => row.missingExactExpressionsRequireManualReview.length).length,
  limitations: ["Exact token preservation demonstrates retained assertion text, not equivalent fixture/setup/helper semantics.", "Additional expectations and changed expression forms require semantic review; no execution pass is inferred."],
  callbacks: [...groups.values()] };
writeFileSync(prefix + "17-original-assertion-preservation.json", JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({ compared: result.comparedOriginalReceiptLocations, groups: groups.size,
  changed: result.changedCallbackVersionPairs, manual: result.callbacks.filter((row) => row.missingExactExpressionsRequireManualReview.length).map((row) => ({ id: row.representativeId, line: row.currentLine, missing: row.missingExactExpressionsRequireManualReview })) }, null, 2));
