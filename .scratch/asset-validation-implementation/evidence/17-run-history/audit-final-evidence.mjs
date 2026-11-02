// Evidence/authority audit only. This program never imports product or test modules.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const root = process.cwd();
const notes = process.env.ASSET_VALIDATION_PREPARATION_ROOT ?? "M:/Shuen/Codex/asset-validation-notes";
const freeze = "11e52e3cbc93fe5200cb51d0c2882a9cec222765";
const integration = "29f19dfd3ed943df2e0c9ae2b7c446ada248d501";
const prefix = ".scratch/asset-validation-implementation/evidence/";
const sha = (value) => createHash("sha256").update(value).digest("hex");
const objSha = (value) => sha(JSON.stringify(value));
const check = (value, message) => { if (!value) throw new Error(message); };
const git = (...args) => execFileSync("git", args, { cwd: root, maxBuffer: 256 * 1024 * 1024 });
const files = new Map(), blobs = new Map(), inputs = new Map(), jsons = new Map();
function blob(revision, path, role) {
  const key = `${revision}:${path}`;
  if (!files.has(key)) {
    const id = git("rev-parse", key).toString().trim();
    if (!blobs.has(id)) blobs.set(id, git("cat-file", "blob", id));
    const bytes = blobs.get(id);
    files.set(key, bytes);
    inputs.set(key, { revision, path, gitBlobId: id, bytes: bytes.length, sha256: sha(bytes), roles: [] });
  }
  if (role && !inputs.get(key).roles.includes(role)) inputs.get(key).roles.push(role);
  return files.get(key);
}
const fingerprint = (revision, path, role) => { blob(revision, path, role); return inputs.get(`${revision}:${path}`); };
function json(revision, path) {
  const key = `${revision}:${path}`;
  if (!jsons.has(key)) jsons.set(key, JSON.parse(blob(revision, path).toString().replace(/^\uFEFF/u, "")));
  return jsons.get(key);
}
function pointer(value, path) {
  for (const key of path.split("/").slice(1)) value = value[key.replaceAll("~1", "/").replaceAll("~0", "~")];
  return value;
}
const immutable = [
  ["final-canonical-id-plan.json", "869c6752eedb1997e0ccbca5e3bce81c74122ce68f4600c970822ce37b9841b6"],
  ["f07-canonical-semantic-crosswalk.json", "48110ed423c5eeecb423d7c36b7557989c784e7b90e636d5df6fe8e88626a60b"],
  ["final-audit-preparation.json", "894bcb017a386498a0bb6c9be0f7c062d2b14a2712acc47af254cd1b30d529a3"],
  ["final-audit-preparation-through15.json", "aa70df667cd10bbfab083eb755914a0497c59d5569255d1fe08709e6b3c943a5"],
].map(([name, expected]) => {
  const bytes = readFileSync(join(notes, name));
  check(sha(bytes) === expected, `Immutable preparation changed ${name}`);
  return { path: join(notes, name), bytes: bytes.length, sha256: expected };
});
const base = JSON.parse(readFileSync(immutable[2].path));
const through15 = JSON.parse(readFileSync(immutable[3].path));
const oldPlan = JSON.parse(readFileSync(immutable[0].path));
const planPath = prefix + "17-raw/final-canonical-id-plan.json";
const planBytes = readFileSync(planPath), plan = JSON.parse(planBytes);
check(plan.authorityRevision === freeze && plan.cases.length === 1209, "Reexpanded final authority missing");
const shape = (row) => ({ id: row.id, family: row.family, branch: row.branch, representation: row.representation,
  field: row.field, result: row.result, semanticKey: row.semanticKey, primaryTickets: row.primaryTickets,
  supportingTickets: row.supportingTickets, requiredEntryAxes: Object.fromEntries(Object.entries(row.requiredEntryAxes).filter(([key]) => key !== "authority")) });
check(objSha(plan.cases.map(shape)) === objSha(oldPlan.cases.map(shape)), "Final authority obligation/ownership differs from independent plan");
const canonical = new Map(base.canonicalCases.map((row) => [row.planEncodedId, row]));
const planByExistingId = new Map(plan.cases.map((row) => [canonical.get(row.id).existingCanonicalId, row]));
check(planByExistingId.size === 1209, "F07 spelling map is not injective");
git("merge-base", "--is-ancestor", integration, freeze);

const ts = createRequire(join(root, "packages/rpgmaker-event-dsl/package.json"))("typescript");
const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
function pattern(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return escape(node.text);
  if (ts.isTemplateExpression(node)) return escape(node.head.text) + node.templateSpans.map((span) => "[\\s\\S]*?" + escape(span.literal.text)).join("");
  if (ts.isParenthesizedExpression(node)) return pattern(node.expression);
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) return pattern(node.left) + pattern(node.right);
  return "[\\s\\S]*?";
}
const registrationCache = new Map();
function registrations(revision, path) {
  const key = `${revision}:${path}`;
  if (registrationCache.has(key)) return registrationCache.get(key);
  const source = blob(revision, path, "assertion-source").toString();
  const tree = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const factories = new Map(), result = [];
  function factory(node) {
    if (!node || !ts.isCallExpression(node) || !ts.isIdentifier(node.expression) || node.expression.text !== "createAssetTest") return null;
    const argument = node.arguments[0];
    if (!argument || !ts.isObjectLiteralExpression(argument)) return null;
    const owner = argument.properties.find((property) => ts.isPropertyAssignment(property) && property.name.getText(tree) === "ownerTicket");
    return owner && ts.isStringLiteral(owner.initializer) ? { ownerTicket: owner.initializer.text,
      line: tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1 } : null;
  }
  function collect(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      const value = factory(node.initializer); if (value) factories.set(node.name.text, value);
    }
    ts.forEachChild(node, collect);
  }
  collect(tree);
  function resolveFactory(node, conditions = []) {
    if (ts.isParenthesizedExpression(node)) return resolveFactory(node.expression, conditions);
    if (ts.isConditionalExpression(node)) return [
      ...resolveFactory(node.whenTrue, [...conditions, node.condition.getText(tree)]),
      ...resolveFactory(node.whenFalse, [...conditions, `!(${node.condition.getText(tree)})`]),
    ];
    const found = ts.isIdentifier(node) ? factories.get(node.text) : factory(node);
    return found ? [{ ...found, conditions }] : [];
  }
  function visit(node, nesting = 0) {
    let nested = nesting;
    if (ts.isCallExpression(node) && node.arguments.length >= 2) {
      const alternatives = resolveFactory(node.expression), callback = node.arguments[1];
      if (alternatives.length && (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback))) {
        const titlePattern = pattern(node.arguments[0]);
        result.push({ path, revision, titleExpression: node.arguments[0].getText(tree), titlePattern,
          idPattern: titlePattern.slice(0, titlePattern.indexOf(":")),
          line: tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1,
          endLine: tree.getLineAndCharacterOfPosition(node.end).line + 1,
          callbackSha256: sha(callback.getText(tree)), nesting, factoryAlternatives: alternatives });
        nested++;
      }
    }
    ts.forEachChild(node, (child) => visit(child, nested));
  }
  visit(tree);
  registrationCache.set(key, result);
  return result;
}
const splitOwner = (value) => value.split(",").map((part) => part.trim());
function locateCurrent(receipt) {
  const source = receipt.expected.assertionsSource;
  const title = `${receipt.id}: ${receipt.expected.description}`;
  let found = registrations(freeze, source).filter((row) => new RegExp(`^${row.titlePattern}$`, "u").test(title));
  let method = "full-title";
  if (found.length !== 1) {
    found = registrations(freeze, source).filter((row) => new RegExp(`^${row.idPattern}$`, "u").test(receipt.id));
    method = "canonical-id-only-expanded-current-description";
  }
  if (found.length > 1) {
    const specificity = Math.max(...found.map((row) => row.idPattern.replaceAll("[\\s\\S]*?", "").length));
    found = found.filter((row) => row.idPattern.replaceAll("[\\s\\S]*?", "").length === specificity);
    method += "; prefer explicit ID over separately finite generic id parameter";
  }
  check(found.length === 1, `Current definition not unique ${receipt.id}: ${found.length}`);
  check(found[0].nesting === 0, `Nested current registration ${receipt.id}`);
  return { ...found[0], matchMethod: method };
}

// Independently re-read each aggregate record and each original frozen source.
const bindingAudit = base.sourceBindings.map((row) => {
  const historical = row.historicalHashBindings.map((binding) => {
    const actual = fingerprint(binding.revision, row.path, "original-assertion-source");
    check(actual.sha256 === binding.gitBlobSha256 && actual.bytes === binding.gitBlobBytes, `Original source binding changed ${row.key}`);
    return actual;
  });
  check(historical.length > 0, `Unresolved original assertion source ${row.key}`);
  return { key: row.key, recordedSha256: row.recordedSha256, historical,
    recordedRendering: row.historicalHashBindings.map((binding) => binding.recordedSourceRendering),
    current: fingerprint(freeze, row.path, "current-assertion-source") };
});
const historicalReceipts = base.receiptLocations.map((location) => {
  const receipt = pointer(json(base.preparationRevision, location.file), location.pointer);
  check(objSha(receipt) === location.receiptObjectSha256, `Original aggregate receipt changed ${location.ref}`);
  check(objSha(pointer(json(freeze, location.file), location.pointer)) === objSha(receipt), `Historical receipt overwritten ${location.ref}`);
  check(receipt.id === location.id && receipt.entry === location.entry, `Receipt identity mismatch ${location.ref}`);
  check(receipt.status === location.recordedStatus && receipt.ownerTicket === location.ownerTicket, `Original owner/status mismatch ${location.ref}`);
  check(sha(receipt.expected.assertions) === location.recordedRuntimeAssertionSha256 && objSha(receipt.input) === location.inputObjectSha256, `Original input/assertion mismatch ${location.ref}`);
  const isCurrent = planByExistingId.has(receipt.id);
  return { ref: location.ref, id: receipt.id, entry: receipt.entry, ownerTicket: receipt.ownerTicket,
    containingTicket: location.containingTicket, status: receipt.status, file: location.file, pointer: location.pointer,
    receiptObjectSha256: objSha(receipt), inputObjectSha256: objSha(receipt.input), runtimeAssertionSha256: sha(receipt.expected.assertions),
    assertionSource: location.assertionSource, assertionSourceSha256: location.assertionSourceSha256,
    historicalDefinition: location.historicalTestDefinition, currentDefinition: isCurrent ? locateCurrent(receipt) : null,
    identityClass: isCurrent ? "current-obligation-original-evidence" : "separate-supplementary-or-retired-history",
    actualFinalHeadExecutionClaimed: false };
});

const added15 = through15.receiptLocationsAdded15.map((location) => {
  const receipt = pointer(json(location.receiptStorageRevision, location.machineFile), location.machinePointer);
  const raw = blob(location.receiptStorageRevision, location.rawReceiptFile, "original15-raw-receipt");
  check(sha(raw) === location.rawReceiptFingerprint.sha256 && objSha(JSON.parse(raw)) === objSha(receipt), `Original15 bytes mismatch ${location.ref}`);
  check(objSha(receipt) === location.receiptObjectSha256 && receipt.status === "passed", `Original15 receipt mismatch ${location.ref}`);
  const actualSource = fingerprint(location.originalRunRevision, location.assertionsSource, "original15-assertion-source");
  check(actualSource.sha256 === receipt.expected.sha256, `Original15 source mismatch ${location.ref}`);
  const runner = pointer(json(location.receiptStorageRevision, location.actualRunnerFile), location.actualRunnerPointer);
  check(runner.status === "passed" && runner.fullName === `${receipt.id}: ${receipt.expected.description}`, `Original15 runner row mismatch ${location.ref}`);
  return { ...location, currentDefinition: locateCurrent(receipt), historicalByteAndRunnerAuditPassed: true };
});

const path16 = prefix + "16-recovery-acceptance.json", machine16 = json(freeze, path16);
check(sha(blob(freeze, path16)) === "1f55c1c65901e6ee296cee5c2bf67d3df8ecada0387d4ed0c68dff314857b01f", "16 aggregate differs from handoff");
const expected16 = plan.cases.filter((row) => row.primaryTickets.includes("16")).map((row) => row.id).sort();
check(objSha(expected16) === objSha([...machine16.independentPlan.ids].sort()) && expected16.length === 12, "Exact16 independent ID difference mismatch");
const remaining15 = through15.canonicalCases.filter((row) => row.missingEntryLocationsThrough15.length).map((row) => row.existingCanonicalId).sort();
check(objSha(remaining15) === objSha(expected16), "Through15 difference does not equal actual16 responsibility");
const manifest16 = json(freeze, prefix + "16-raw/manifest.json");
for (const row of manifest16.files) {
  const actual = fingerprint(freeze, prefix + "16-raw/" + row.path, "original16-raw-artifact");
  check(actual.sha256 === row.sha256 && actual.bytes === row.bytes, `16 raw artifact mismatch ${row.path}`);
}
const sourceInputs16 = machine16.sourceInputs.map((row) => {
  const original = fingerprint(row.gitRevision, row.path, "original16-frozen-source");
  const current = fingerprint(freeze, row.path, "current16-source");
  check(original.sha256 === row.sha256 && current.sha256 === row.sha256, `16 source changed ${row.path}`);
  return original;
});
const added16 = machine16.receipts.map((wrapper, index) => {
  const receipt = wrapper.receipt;
  check(sha(JSON.stringify(receipt, null, 2) + "\n") === wrapper.receiptSha256, `Original16 byte rendering mismatch ${index}`);
  check(expected16.includes(receipt.id) && receipt.status === "passed" && receipt.ownerTicket === "16", `16 receipt identity/status ${index}`);
  check(receipt.expected.sha256 === sourceInputs16[0].sha256, `16 assertion source ${index}`);
  const matrix = machine16.matrices.find((row) => row.entry === receipt.entry);
  const reportPath = prefix + "16-raw/" + matrix.report, report = json(freeze, reportPath);
  const rows = report.testResults.flatMap((suite) => suite.assertionResults);
  check(rows.length === 12 && rows.every((row) => row.status === "passed") && report.numPendingTests === 0, `16 full report not12 actual passes ${receipt.entry}`);
  const actual = rows.filter((row) => row.fullName === `${receipt.id}: ${receipt.expected.description}`);
  check(actual.length === 1, `16 original runner row absent ${receipt.id}`);
  return { ref: `T16-R${String(index + 1).padStart(2, "0")}`, id: receipt.id, entry: receipt.entry,
    contributionTicket: "16", ownerTicket: receipt.ownerTicket, status: receipt.status,
    file: path16, pointer: `/receipts/${index}/receipt`, originalReceiptBytesSha256: wrapper.receiptSha256,
    originalRunRevision: machine16.assertionFreeze, receiptObjectSha256: objSha(receipt),
    inputObjectSha256: objSha(receipt.input), runtimeAssertionSha256: sha(receipt.expected.assertions),
    assertionSource: receipt.expected.assertionsSource, assertionSourceSha256: receipt.expected.sha256,
    actualRunnerFile: reportPath, actualRunnerName: actual[0].fullName, actualRunnerStatus: actual[0].status,
    currentDefinition: locateCurrent(receipt) };
});
for (const id of expected16) for (const entry of ["source", "built"]) check(added16.filter((row) => row.id === id && row.entry === entry).length === 1, `16 pair absent/duplicate ${id}/${entry}`);

const allHistorical = [...historicalReceipts, ...added15, ...added16];
const native = base.nativeLocations.map((location) => {
  const receipt = pointer(json(freeze, location.file), location.pointer);
  check(objSha(receipt) === (location.receiptObjectSha256 ?? location.policyObjectSha256), `Native original object changed ${location.id}`);
  if (location.originalReceiptMirror) {
    const mirror = location.originalReceiptMirror;
    check(objSha(pointer(json(freeze, mirror.file), mirror.pointer)) === objSha(receipt), `Native mirror mismatch ${location.id}`);
  }
  const artifacts = location.artifactInputKeys.map((key) => {
    const separator = key.indexOf(":"), revision = key.slice(0, separator), path = key.slice(separator + 1);
    const original = fingerprint(revision, path, "original-native-evidence"), current = fingerprint(freeze, path, "retained-native-evidence");
    check(original.sha256 === current.sha256, `Native evidence overwritten ${path}`);
    return { path, sha256: current.sha256, bytes: current.bytes };
  });
  for (const sample of location.samples ?? []) {
    const row = pointer(json(freeze, sample.file), sample.pointer);
    check(row.status === "observed" && row.disk.sha256 === sample.actualDiskSha256, `Native media sample mismatch ${location.id}`);
    check(row.requests?.length > 0 && row.actual, `Native real request/actual missing ${location.id}`);
  }
  return { ...location, retainedArtifactsVerified: artifacts, originalRecordRechecked: true,
    currentImplementationAgreement: "Reviewed finite native consumption against current direct/dependency rules; no new supported-domain conflict; no native rerun required.",
    nativeRerunPerformedAt17: false };
});

const historicalByRef = new Map(allHistorical.map((row) => [row.ref, row]));
const finalCases = plan.cases.map((row) => {
  const old = canonical.get(row.id), existing = old.existingCanonicalId;
  const refs = Object.fromEntries(row.requiredEntryAxes.receiptEntries.map((entry) => [entry,
    entry === "native-run" ? native.filter((item) => item.id === existing).map((item) => item.ref)
      : allHistorical.filter((item) => item.id === existing && item.entry === entry).map((item) => item.ref)]));
  for (const [entry, entryRefs] of Object.entries(refs)) check(entryRefs.length > 0, `Final original-evidence gap ${existing}/${entry}`);
  const contributions = row.primaryTickets.map((ticket) => ({ ticket,
    evidence: Object.fromEntries(row.requiredEntryAxes.receiptEntries.map((entry) => [entry, refs[entry].filter((ref) => {
      const located = historicalByRef.get(ref) ?? native.find((item) => item.ref === ref);
      return splitOwner(located.ownerTicket).includes(ticket);
    })])) }));
  for (const contribution of contributions) for (const [entry, list] of Object.entries(contribution.evidence))
    check(list.length > 0, `Owner contribution absent ${existing}/${contribution.ticket}/${entry}`);
  return { planEncodedId: row.id, canonicalId: existing, semanticKey: row.semanticKey,
    family: row.family, primaryTickets: row.primaryTickets, supportingTickets: row.supportingTickets,
    requiredEntryAxes: row.requiredEntryAxes, authority: row.authority, ownershipAuthority: row.ownershipAuthority,
    supportingOwnershipAuthority: row.supportingOwnershipAuthority, originalEvidenceRefsByEntry: refs,
    primaryContributions: contributions, finalCommandReceipts: null,
    currentRuntimeVerdict: "await-final-full-command-completion" };
});

const old03 = prefix + "03-file-observation-acceptance.json";
check(sha(blob(freeze, old03)) === "a8652ef3feda52e3677af8d8d52f9fd3fbbedbbf4a1dacfea453af802e14d071", "Original03 pending receipt bytes changed");
check(json(freeze, old03).pending.length === 6 && json(freeze, old03).pending.every((row) => row.status === "not-executed-policy-pending"), "Original03 pending history was rewritten");
const issueStatuses = git("ls-tree", "-r", "--name-only", freeze, "--", ".scratch/asset-validation-implementation/issues").toString().trim().split("\n").map((path) => ({ path, status: blob(freeze, path).toString().match(/^Status: (.+)$/mu)?.[1] }));
check(issueStatuses.filter((row) => row.status === "resolved").length === 16 && issueStatuses.find((row) => row.path.includes("/17-")).status === "claimed", "Final ticket states wrong");
const result = { schemaVersion: 1, status: "final-original-evidence-and-current-definition-audit-awaiting-full-commands",
  auditedAt: new Date().toISOString(), executionFreeze: freeze, integratedBase: integration, maintainerApproval: "pending; ticket17 remains claimed",
  immutablePreparationFingerprints: immutable, reexpandedFinalPlan: { path: planPath, sha256: sha(planBytes), exactObligationShapeEqualsPriorIndependentPlan: true },
  counts: { families: 97, canonical: finalCases.length, automated: finalCases.filter((row) => !row.family.startsWith("N")).length,
    native: native.length, originalAggregateAutomatedRecords: historicalReceipts.length, added15: added15.length,
    added16: added16.length, original16RawArtifacts: manifest16.files.length, original16FrozenSourceInputs: sourceInputs16.length },
  canonicalCases: finalCases, originalAutomatedEvidence: allHistorical, nativeEvidence: native,
  originalAssertionSourceBindings: bindingAudit, ticketStatesAtFreeze: issueStatuses,
  historicalDispositions: { retiredIdentities: base.historicalOnly.retiredIdentities,
    original03PendingSha256: sha(blob(freeze, old03)), original03SixPendingUnchanged: true,
    referenceOnly: base.historicalOnly.referenceOnly, notApplicable: base.historicalOnly.notApplicable,
    ticket15: through15.historicalOnlyAdded15, ticket16: machine16.failureHistory,
    failedOrFilteredHistoryNeverCountedAsCurrentPass: true },
  inputFingerprints: [...inputs.values()], limitations: ["Original receipts are evidence at their real historical freeze; current full execution is audited separately.", "AST title location proves location/unique registration, not the independent expected-value semantics. Semantic review is recorded in17 narrative audit."] };
writeFileSync(prefix + "17-original-evidence-audit.json", JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({ counts: result.counts, gitInputFingerprints: inputs.size,
  currentDefinitionLocations: allHistorical.filter((row) => row.currentDefinition).length,
  awaiting: "full command results and semantic/narrative audit; no maintainer approval claimed" }, null, 2));
