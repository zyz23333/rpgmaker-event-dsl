// Final evidence-only join. This program reads source as syntax; it never imports
// product/test modules or infers a pass from a previous run.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, posix } from "node:path";

const root = process.cwd();
const prefix = ".scratch/asset-validation-implementation/evidence/";
const raw = prefix + "17-raw/";
const sha = (value) => createHash("sha256").update(value).digest("hex");
const objectSha = (value) => sha(JSON.stringify(value));
const check = (value, message) => { if (!value) throw new Error(message); };
const json = (path) => JSON.parse(readFileSync(path));
const git = (...args) => execFileSync("git", args, { cwd: root, maxBuffer: 128 * 1024 * 1024 });
const ts = createRequire(join(root, "packages/rpgmaker-event-dsl/package.json"))("typescript");
const history = json(raw + "command-history.json");
const original = json(prefix + "17-original-evidence-audit.json");
const plan = json(raw + "final-canonical-id-plan.json");
const freeze = history.frozenRevision;
check(freeze === original.executionFreeze && freeze === plan.authorityRevision, "Final evidence freeze differs");
check(history.initialStatus === "" && history.compileContractVersion === "mv-1.6.1/40", "Unclean or wrong final freeze");
check(history.environment.platform === "win32" && history.environment.node.startsWith("v22.") &&
  /^[Cc]:[\\/]/u.test(history.environment.temp) && history.environment.workerOverride === null &&
  history.environment.entryOverride === null, "Final command environment differs");
const expectedCommands = [
  ["pnpm build", "00-setup-build"], ["pnpm check", "01-pnpm-check"],
  ["pnpm build", "02-pnpm-build"],
  ["pnpm --filter rpgmaker-event-dsl test:windows-baseline", "03-windows-baseline"],
];
check(history.commands.length === expectedCommands.length, "Whole command sequence is not complete");
const commandSummaries = history.commands.map((command, index) => {
  const [text, label] = expectedCommands[index];
  check(command.command === text && command.label === label && command.exitCode === 0 && command.signal === null,
    "Wrong/incomplete command " + label);
  if (index) check(history.commands[index - 1].completedAt <= command.startedAt, "Commands overlap");
  const bytes = readFileSync(raw + command.log);
  check(bytes.length === command.logBytes && sha(bytes) === command.logSha256, "Raw command log changed " + label);
  const plain = bytes.toString().replace(/\x1b\[[0-?]*[ -/]*[@-~]/gu, "");
  const result = { command: text, label, startedAt: command.startedAt, completedAt: command.completedAt,
    exitCode: command.exitCode, log: raw + command.log, bytes: bytes.length, sha256: sha(bytes) };
  if (command.receipts) {
    for (const [key, marker] of [["testFiles", "Test Files"], ["tests", "Tests"]]) {
      const rows = [...plain.matchAll(new RegExp("^\\s*" + marker + "\\s+([^\\r\\n]+)$", "gmu"))];
      check(rows.length === 1, "No unique whole Vitest summary " + label + " " + marker);
      const passed = rows[0][1].trim().match(/^(\d+) passed\s+\((\d+)\)$/u);
      check(passed && passed[1] === passed[2], "Failed/skipped/filtered whole Vitest summary " + label + ": " + rows[0][1]);
      result[key] = { passed: Number(passed[1]), total: Number(passed[2]), failed: 0, skipped: 0, filtered: 0 };
    }
    result.receiptCount = command.receipts.length;
  }
  return result;
});

// Compare actual read bytes to both the recorder's initial snapshot and Git's
// frozen blob. No source/test/config mutation can be hidden by a stable HEAD.
const frozenInputs = history.frozenInputs.map((input) => {
  const current = readFileSync(input.path), blob = git("show", freeze + ":" + input.path);
  check(current.length === input.bytes && sha(current) === input.sha256, "Protected disk input changed " + input.path);
  check(blob.length === input.bytes && sha(blob) === input.sha256, "Protected input differs from frozen Git " + input.path);
  return input;
});
const frozenInputByPath = new Map(frozenInputs.map((input) => [input.path, input]));
const setupArtifacts = history.commands[0].builtArtifacts, formalArtifacts = history.commands[2].builtArtifacts;
check(setupArtifacts?.length && objectSha(setupArtifacts) === objectSha(formalArtifacts), "Setup/formal build artifacts differ");
for (const artifact of formalArtifacts) {
  const bytes = readFileSync(artifact.path);
  check(bytes.length === artifact.bytes && sha(bytes) === artifact.sha256, "Current built artifact changed " + artifact.path);
}

const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
function titleParts(node, tree) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return [{ literal: node.text }];
  if (ts.isTemplateExpression(node)) return [{ literal: node.head.text }, ...node.templateSpans.flatMap((span) =>
    [{ expression: span.expression.getText(tree) }, { literal: span.literal.text }])];
  if (ts.isParenthesizedExpression(node)) return titleParts(node.expression, tree);
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken)
    return [...titleParts(node.left, tree), ...titleParts(node.right, tree)];
  return [{ expression: node.getText(tree) }];
}
const syntaxCache = new Map();
function registrations(path) {
  if (syntaxCache.has(path)) return syntaxCache.get(path);
  const source = git("show", freeze + ":" + path).toString();
  const tree = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const factories = new Map(), declarations = new Map(), result = [], importedNames = new Map();
  function directFactory(node) {
    if (!node || !ts.isCallExpression(node) || node.expression.getText(tree) !== "createAssetTest") return null;
    const argument = node.arguments[0];
    if (!argument || !ts.isObjectLiteralExpression(argument)) return null;
    const owner = argument.properties.find((p) => ts.isPropertyAssignment(p) && p.name.getText(tree) === "ownerTicket");
    return owner && ts.isStringLiteral(owner.initializer) ? { ownerTicket: owner.initializer.text,
      line: tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1 } : null;
  }
  function collect(node) {
    if (ts.isImportSpecifier(node)) importedNames.set((node.propertyName ?? node.name).text, node.name.text);
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      const value = directFactory(node.initializer); if (value) factories.set(node.name.text, value);
      if (node.initializer) {
        const rows = declarations.get(node.name.text) ?? [];
        rows.push({ identifier: node.name.text, line: tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1,
          initializer: node.initializer.getText(tree), initializerSha256: sha(node.initializer.getText(tree)) });
        declarations.set(node.name.text, rows);
      }
    }
    ts.forEachChild(node, collect);
  }
  collect(tree);
  function factory(node, conditions = []) {
    if (ts.isParenthesizedExpression(node)) return factory(node.expression, conditions);
    if (ts.isConditionalExpression(node)) return [...factory(node.whenTrue, [...conditions, node.condition.getText(tree)]),
      ...factory(node.whenFalse, [...conditions, "!(" + node.condition.getText(tree) + ")"])];
    const value = ts.isIdentifier(node) ? factories.get(node.text) : directFactory(node);
    return value ? [{ ...value, conditions }] : [];
  }
  function visit(node, context = []) {
    let childrenContext = context;
    if (ts.isForOfStatement(node)) childrenContext = [...context, { kind: "finite-for-of-source",
      line: tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1,
      binding: node.initializer.getText(tree), iterable: node.expression.getText(tree) }];
    if (ts.isIfStatement(node)) childrenContext = [...context, { kind: "registration-guard-source",
      line: tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1, condition: node.expression.getText(tree) }];
    if (ts.isCallExpression(node) && node.arguments.length > 1) {
      const owners = factory(node.expression), callback = node.arguments[1];
      if (owners.length && (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback))) {
        const parts = titleParts(node.arguments[0], tree);
        const pattern = parts.map((part) => "literal" in part ? escape(part.literal) : "([\\s\\S]*?)").join("");
        const identifiers = new Set();
        function names(child) { if (ts.isIdentifier(child)) identifiers.add(child.text); ts.forEachChild(child, names); }
        names(callback); names(node.arguments[0]);
        result.push({ path, revision: freeze, line: tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1,
          endLine: tree.getLineAndCharacterOfPosition(node.end).line + 1,
          titleExpression: node.arguments[0].getText(tree), titlePattern: pattern,
          titleParts: parts, callbackSha256: sha(callback.getText(tree)), callback: callback.getText(tree),
          factoryAlternatives: owners, registrationContext: context,
          directlyReferencedInitializers: [...identifiers].flatMap((name) => declarations.get(name) ?? []) });
        // Test callback content cannot register more acceptance callbacks.
        return;
      }
    }
    ts.forEachChild(node, (child) => visit(child, childrenContext));
  }
  visit(tree);
  const value = { tree, importedNames, registrations: result }; syntaxCache.set(path, value); return value;
}

// A syntax comparison bridges TS source to the function actually serialized by
// Vite. Remove only TS syntax/formatting and Vite's named-import wrappers. It
// retains strings, numbers, operators, calls, property names and control flow.
function callbackShape(text, imports, transpile, modulePath) {
  const js = transpile ? ts.transpileModule("const auditedCallback = " + text + ";", {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
  }).outputText : "const auditedCallback = " + text + ";";
  const tree = ts.createSourceFile("callback.js", js, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  check(!tree.parseDiagnostics.length, "Runtime/source callback parse failed");
  const expression = tree.statements[0].declarationList.declarations[0].initializer;
  function shape(node) {
    if (ts.isParenthesizedExpression(node)) return shape(node.expression);
    if (ts.isEmptyStatement(node)) return null;
    if (ts.isMetaProperty(node) && node.getText(tree) === "import.meta" ||
      ts.isIdentifier(node) && node.text === "__vite_ssr_import_meta__") return { kind: "ImportMeta" };
    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
      ts.isIdentifier(node.expression) && node.expression.text === "__vite_ssr_dynamic_import__") &&
      node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0])) {
      const specifier = node.arguments[0].text;
      const sourceBase = "/" + modulePath.replace(/^packages\/rpgmaker-event-dsl\//u, "");
      const resolved = specifier.startsWith(".") ? posix.normalize(posix.join(posix.dirname(sourceBase), specifier)) : specifier;
      // Vite resolves the test's explicit .js import to its actual .ts module.
      // Only accept this rewrite when the target is a frozen tracked test file.
      const normalized = resolved.endsWith(".js") ? resolved.slice(0, -3) + ".ts" : resolved;
      const trackedTarget = "packages/rpgmaker-event-dsl" + normalized;
      git("cat-file", "-e", freeze + ":" + trackedTarget);
      return { kind: "DynamicImport", frozenTrackedTarget: trackedTarget };
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.CommaToken &&
      ts.isNumericLiteral(node.left) && node.left.text === "0" && ts.isPropertyAccessExpression(node.right) &&
      /^__vite_ssr_import_\d+__$/u.test(node.right.expression.getText(tree))) return { kind: "Identifier", text: imports.get(node.right.name.text) ?? node.right.name.text, children: [] };
    if (ts.isPropertyAccessExpression(node) && /^__vite_ssr_import_\d+__$/u.test(node.expression.getText(tree)))
      return { kind: "Identifier", text: imports.get(node.name.text) ?? node.name.text, children: [] };
    if (ts.isShorthandPropertyAssignment(node)) return { kind: "PropertyAssignment", name: node.name.text,
      value: { kind: "Identifier", text: node.name.text, children: [] } };
    if (ts.isPropertyAssignment(node)) return { kind: "PropertyAssignment", name: node.name.text ?? node.name.getText(tree), value: shape(node.initializer) };
    const children = []; ts.forEachChild(node, (child) => { const value = shape(child); if (value) children.push(value); });
    return { kind: ts.SyntaxKind[node.kind], ...(typeof node.text === "string" ? { text: node.text } : {}),
      ...(typeof node.operator === "number" ? { operator: node.operator } : {}), children };
  }
  return shape(expression);
}

const canonical = new Map(original.canonicalCases.filter((row) => row.requiredEntryAxes.receiptEntries.includes("source"))
  .map((row) => [row.canonicalId, row]));
check(canonical.size === 1195, "Wrong independent automated obligation count");
const activeSupplementary = new Set(original.originalAutomatedEvidence.filter((row) => row.identityClass === "active-supplementary-original-evidence").map((row) => row.id));
check(activeSupplementary.size === 39, "Active original supplementary set differs");
const deviceSupplementary = new Set(json(prefix + "03-device-space-acceptance.json").scope.supplementaryLabels);
check(deviceSupplementary.size === 7, "03 supplementary labels differ");
const retired = new Set(original.originalAutomatedEvidence.filter((row) => row.identityClass === "retired-history-only").map((row) => row.id));
const definitions = new Map(), receiptsByEntry = {}, sourceShapeCache = new Map(), syntaxDifferences = [];
for (const [entry, command] of [["source", history.commands[1]], ["built", history.commands[3]]]) {
  const seen = new Map();
  const actualNames = readdirSync(raw + `current-${entry}-receipts`).filter((name) => name.endsWith(".json")).sort();
  const recordedNames = command.receipts.map((row) => row.file.split("/").at(-1)).sort();
  check(objectSha(actualNames) === objectSha(recordedNames), "Unrecorded/missing current receipt file " + entry);
  for (const fingerprint of command.receipts) {
    const path = raw + fingerprint.file, bytes = readFileSync(path), row = JSON.parse(bytes);
    check(bytes.length === fingerprint.bytes && sha(bytes) === fingerprint.sha256, "Current receipt bytes changed " + path);
    check(row.entry === entry && row.status === "passed" && row.id === fingerprint.id && !seen.has(row.id), "Wrong/duplicate/failed receipt " + path);
    check(row.startedAt >= command.startedAt && row.completedAt <= command.completedAt && row.startedAt <= row.completedAt,
      "Stale/outside-command current receipt " + path);
    check(row.environment.platform === "win32" && row.environment.node === history.environment.node,
      "Current receipt runtime environment differs " + path);
    check(row.expected.sha256 === frozenInputByPath.get(row.expected.assertionsSource)?.sha256,
      "Current receipt assertion source hash is not frozen input " + path);
    check(!retired.has(row.id), "Retired alias was registered " + row.id);
    const identityClass = canonical.has(row.id) ? "canonical-automated" : activeSupplementary.has(row.id) ?
      "active-original-supplementary" : deviceSupplementary.has(row.id) ? "device-space-supplementary" : null;
    check(identityClass, "Unexpected current receipt ID " + row.id);
    const source = registrations(row.expected.assertionsSource), title = row.id + ": " + row.expected.description;
    let candidates = source.registrations.filter((def) => new RegExp("^" + def.titlePattern + "$", "u").test(title));
    if (candidates.length > 1) {
      const specificity = Math.max(...candidates.map((def) => def.titleParts.filter((part) => "literal" in part).reduce((sum, part) => sum + part.literal.length, 0)));
      candidates = candidates.filter((def) => def.titleParts.filter((part) => "literal" in part).reduce((sum, part) => sum + part.literal.length, 0) === specificity);
    }
    check(candidates.length === 1, "Current title callback is not unique " + row.id + ": " + candidates.length);
    const definition = candidates[0], ownerSet = row.ownerTicket.split(",").map((value) => value.trim()).sort();
    check(definition.factoryAlternatives.some((factory) => objectSha(factory.ownerTicket.split(",").map((value) => value.trim()).sort()) === objectSha(ownerSet)),
      "Current owner does not match source factory " + row.id);
    const obligation = canonical.get(row.id);
    if (obligation) check(obligation.primaryTickets.every((ticket) => ownerSet.includes(ticket)), "Missing required primary owner " + row.id);
    const captures = new RegExp("^" + definition.titlePattern + "$", "u").exec(title).slice(1);
    const titleBindings = definition.titleParts.filter((part) => "expression" in part).map((part, index) => ({ expression: part.expression, renderedValue: captures[index] }));
    const definitionKey = definition.path + ":" + definition.line + "@" + definition.callbackSha256;
    if (!definitions.has(definitionKey)) {
      const { callback, titleParts: _parts, ...stored } = definition;
      definitions.set(definitionKey, { key: definitionKey, ...stored });
    }
    if (!sourceShapeCache.has(definitionKey)) sourceShapeCache.set(definitionKey, callbackShape(definition.callback, source.importedNames, true, definition.path));
    const actualShape = callbackShape(row.expected.assertions, source.importedNames, false, definition.path);
    const sourceShape = sourceShapeCache.get(definitionKey), syntaxEqual = objectSha(sourceShape) === objectSha(actualShape);
    if (!syntaxEqual) syntaxDifferences.push({ id: row.id, entry, definitionKey,
      sourceShapeSha256: objectSha(sourceShape), runtimeShapeSha256: objectSha(actualShape) });
    seen.set(row.id, { id: row.id, entry, identityClass, ownerTicket: row.ownerTicket, status: row.status,
      path, bytes: bytes.length, sha256: sha(bytes), startedAt: row.startedAt, completedAt: row.completedAt,
      inputObjectSha256: objectSha(row.input), inputRecords: row.input.length,
      assertionSource: row.expected.assertionsSource, assertionSourceSha256: row.expected.sha256,
      runtimeAssertionSha256: sha(row.expected.assertions), definitionKey, titleBindings,
      runtimeCallbackMatchesFrozenSourceSyntax: syntaxEqual,
      independentSemanticKey: obligation?.semanticKey ?? null,
      originalEvidenceRefs: obligation?.originalEvidenceRefsByEntry[entry] ?? [] });
  }
  for (const id of [...canonical.keys(), ...activeSupplementary, ...deviceSupplementary]) check(seen.has(id), "Missing current " + entry + " receipt " + id);
  check(seen.size === canonical.size + activeSupplementary.size + deviceSupplementary.size, "Unexpected current receipt total " + entry);
  receiptsByEntry[entry] = seen;
}

const canonicalCases = [...canonical.values()].map((obligation) => {
  const source = receiptsByEntry.source.get(obligation.canonicalId), built = receiptsByEntry.built.get(obligation.canonicalId);
  check(source.definitionKey === built.definitionKey && source.ownerTicket === built.ownerTicket &&
    source.runtimeAssertionSha256 === built.runtimeAssertionSha256 && objectSha(source.titleBindings) === objectSha(built.titleBindings),
    "Source/built callback/owner/parameter/assertion pairing differs " + obligation.canonicalId);
  return { planEncodedId: obligation.planEncodedId, canonicalId: obligation.canonicalId, family: obligation.family,
    independentSemanticKey: obligation.semanticKey, primaryTickets: obligation.primaryTickets,
    supportingTickets: obligation.supportingTickets, currentRuntimeVerdict: "passed-source-and-built-whole-commands",
    receipts: { source, built } };
});
const supplementary = [...activeSupplementary, ...deviceSupplementary].map((id) => ({ id,
  canonicalId: null, contributesCanonicalCount: false,
  receipts: { source: receiptsByEntry.source.get(id), built: receiptsByEntry.built.get(id) } }));
const result = { schemaVersion: 1, status: syntaxDifferences.length ? "runtime-join-requires-callback-syntax-review" :
  "all-current-automated-obligations-passed; independent-review-and-maintainer-confirmation-pending",
  auditedAt: new Date().toISOString(), executionFreeze: freeze, integratedBase: original.integratedBase,
  compileContractVersion: history.compileContractVersion, maintainerApproval: null,
  counts: { families: 97, canonicalObligations: 1209, automatedCanonical: canonical.size, nativeCanonical: 14,
    activeOriginalSupplementary: activeSupplementary.size, newDeviceSpaceSupplementary: deviceSupplementary.size,
    sourceReceipts: receiptsByEntry.source.size, builtReceipts: receiptsByEntry.built.size,
    uniqueSourceCallbackDefinitions: definitions.size, unclassifiedRuntimeCallbackSyntaxDifferences: syntaxDifferences.length },
  environment: history.environment, commands: commandSummaries, frozenInputs, builtArtifacts: formalArtifacts,
  runtimeCallbackSyntaxNormalization: "TypeScript syntax erasure, parentheses/empty statements/shorthand formatting, Vite named-import/import.meta wrappers and tracked .js-to-.ts dynamic import resolution only; other literal/operator/control-flow shape retained",
  runtimeCallbackSyntaxDifferences: syntaxDifferences, definitions: [...definitions.values()], canonicalCases, supplementary,
  nativeAudit: { path: prefix + "17-native-evidence-audit.json", sha256: sha(readFileSync(prefix + "17-native-evidence-audit.json")),
    executionAt17: false, verdict: "separate original native evidence; no inferred new native run" },
  limitations: ["Title captures identify the exact rendered parameter expressions; independent semantic keys and recorded literal inputs remain separately inspectable.",
    "Syntax/source binding and command results supplement the family semantic audit; they are not a media-content or arbitrary-project guarantee.",
    "Current runs do not overwrite or reclassify original failed, pending, filtered, canceled, or native-counterexample evidence."] };
writeFileSync(prefix + "17-current-runtime-audit.json", JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({ status: result.status, counts: result.counts, commands: commandSummaries }, null, 2));
check(!syntaxDifferences.length, "Unclassified runtime callback syntax differences require review");
const currentById = new Map(canonicalCases.map((row) => [row.canonicalId, row]));
const joinedCases = original.canonicalCases.map((obligation) => {
  const current = currentById.get(obligation.canonicalId);
  if (current) return { ...obligation, finalCommandReceipts: current.receipts,
    currentRuntimeVerdict: current.currentRuntimeVerdict };
  check(obligation.family.startsWith("N"), "Final canonical join omitted automated ID " + obligation.canonicalId);
  const nativeRefs = obligation.originalEvidenceRefsByEntry["native-run"];
  check(nativeRefs?.length && nativeRefs.every((ref) => original.nativeEvidence.some((row) => row.ref === ref && row.originalRecordRechecked)),
    "Native final canonical reference is not verified " + obligation.canonicalId);
  return { ...obligation, finalCommandReceipts: "not-applicable-to-native-obligation",
    currentRuntimeVerdict: "original-actual-native-observation-rechecked-against-current-implementation",
    nativeEvidenceRefs: nativeRefs, nativeRerunAt17: false };
});
check(joinedCases.length === 1209, "Final joined canonical count differs");
const joined = { schemaVersion: 1, status: "all-finite-technical-evidence-joined; independent-review-and-maintainer-confirmation-pending",
  executionFreeze: freeze, integratedBase: original.integratedBase, compileContractVersion: history.compileContractVersion,
  counts: { families: 97, canonicalObligations: 1209, automated: 1195, native: 14 },
  maintainerApproval: null, ticket17Status: "claimed",
  authorityPlan: { path: raw + "final-canonical-id-plan.json", sha256: sha(readFileSync(raw + "final-canonical-id-plan.json")) },
  originalEvidenceAudit: { path: prefix + "17-original-evidence-audit.json", sha256: sha(readFileSync(prefix + "17-original-evidence-audit.json")) },
  currentRuntimeAudit: { path: prefix + "17-current-runtime-audit.json", sha256: sha(readFileSync(prefix + "17-current-runtime-audit.json")) },
  nativeAudit: result.nativeAudit, cases: joinedCases, supplementaryIdsCountedAsCanonical: false,
  originalEvidenceReclassifiedByCurrentSuccess: false };
writeFileSync(prefix + "17-final-canonical-evidence.json", JSON.stringify(joined, null, 2) + "\n");
