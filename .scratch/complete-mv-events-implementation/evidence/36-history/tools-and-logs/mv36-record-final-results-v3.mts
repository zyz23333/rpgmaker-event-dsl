import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { resultSchema, readRequirements } from "file:///C:/Users/Shuen/.codex/worktrees/mv-ticket-36/rpgmaker-event-dsl/packages/rpgmaker-event-dsl/test/support/mv-evidence.ts";

const repo = "C:/Users/Shuen/.codex/worktrees/mv-ticket-36/rpgmaker-event-dsl";
const base = "C:/Users/Shuen/.codex/tmp";
const hash = (bytes: string | Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const load = async (file: string) => JSON.parse(await readFile(file, "utf8"));
const artifact = async (file: string) => ({ path: file, sha256: hash(await readFile(file)) });
const [nativePointerPath, auditPath] = process.argv.slice(2);
assert.ok(nativePointerPath && auditPath, "Pass actual native index pointer and successful immutable audit paths");
assert.equal(process.versions.node.split(".")[0], "22");
const nativePointer = await load(nativePointerPath);
assert.equal(hash(await readFile(nativePointer.index)), nativePointer.sha256);
const nativeIndex = await load(nativePointer.index);
assert.equal(nativeIndex.results.length, 10);
const audit = await load(auditPath);
assert.equal(audit.passed, true);
assert.equal(audit.pairs.length, 10);
const builtDir = path.join(base, "mv36-final-built-results-v1");
const captures = [];
for (const file of await readdir(builtDir)) {
  if (!file.startsWith("MV-S6-MAP-APPEARANCE-") || !file.endsWith(".json")) continue;
  const absolute = path.join(builtDir, file);
  const result = resultSchema.parse(await load(absolute));
  if (result.requirementId.match(/-00[1-7]$/u)) {
    assert.equal(result.status, "passed");
    assert.equal(result.source.revision, "7407e5cefa87639030b0dde6ce56eeb87219924d");
    captures.push({ path: absolute, result });
  }
}
assert.equal(captures.length, 7);
const captured = captures.find(({ result }) => result.requirementId.endsWith("-007"))!.result;
assert.equal(captured.source.files.filter(({path: file}) => file.startsWith("packages/rpgmaker-event-dsl/src/")).length, 99);
assert.equal(captured.source.files.filter(({path: file}) => file.startsWith("packages/rpgmaker-event-dsl/dist/")).length, 15);
const requirements = await readRequirements();
const pairs = [];
for (const item of nativeIndex.results) {
  const file = path.join(item.root, "pair-result.json");
  const report = await load(file);
  assert.equal(report.passed, true);
  assert.equal(report.build.gitHead, captured.source.revision);
  assert.equal(report.build.gitStatus, "");
  for (const [name, group] of [["source", "src"], ["dist", "dist"]]) {
    for (const entry of report.build[name].entries) {
      const source = captured.source.files.find(({ path: file }) => file === `packages/rpgmaker-event-dsl/${group}/${entry.path}`);
      assert.equal(source?.sha256, entry.sha256);
    }
  }
  const artifacts = [await artifact(file)];
  const sides: Record<string, unknown> = {};
  for (const side of ["literal", "compiled"]) {
    const value = report.sides[side];
    assert.equal(value.passed, true);
    assert.equal(Object.keys(value.validation).length, 15);
    for (const flag of Object.values(value.validation)) assert.equal(flag, true);
    const runtime = value.native["runtime-result.json"].value;
    assert.equal(runtime.passed, true);
    assert.equal(runtime.engine, "1.6.1");
    assert.equal(runtime.versions.nw, "0.29.0");
    assert.equal(runtime.versions.node, "9.7.1");
    artifacts.push(await artifact(path.join(value.project, "runtime-result.json")));
    artifacts.push(await artifact(path.join(value.project, "runtime-process-identity.json")));
    artifacts.push(await artifact(path.join(value.project, "native-launch.json")));
    sides[side] = { validation: value.validation, engine: runtime.engine, versions: runtime.versions, expected: runtime.expected, actual: runtime.actual, error: runtime.error, passed: runtime.passed };
  }
  pairs.push({ case: item.case, artifacts, actual: { case: item.case, root: item.root, build: report.build, lifecycle: report.lifecycle, sourceEdits: report.sourceEdits, checkStateUnchanged: report.checkStateUnchanged, generated: report.completeGeneratedCarrierComparison, disk: report.completeCarrierComparison, publication: report.publication, physicalIsolation: report.physicalIsolation, protectedCheckpoints: report.fullProtectedCheckpoints.length, sides, runtimeComparison: report.runtimeComparison, passed: true } });
}
const resourcePath = path.join(base, "mv36-resource-audit-5fd1d566-7814-456c-9593-20f0034372bd/resource-audit.json");
const resource = await load(resourcePath);
assert.equal(resource.passed, true);
assert.equal(resource.resources.length, 9);
for (const item of resource.resources) assert.equal(item.passed, true);
const visualPath = path.join("M:/Shuen/Codex/mv-events-implementation-20261020/ticket36-delivery-v4", "native-png-observation-v1.json");
const visualObservation = await load(visualPath);
assert.equal(visualObservation.passed, true);
const commonArtifacts = [await artifact(nativePointerPath), await artifact(nativePointer.index), await artifact(auditPath), await artifact(visualPath), await artifact(visualObservation.inputs.path), ...visualObservation.contactSheets];
const definitions = [
  { id: "MV-S6-MAP-APPEARANCE-E6", method: "reverse-engineering", selected: pairs, artifacts: [await artifact(resourcePath), ...await Promise.all(captures.map(({path: file}) => artifact(file)))], expected: { exactResources: 9, currentBuiltProductCases: 7, physicallyIsolatedNativeProductPairs: 10, uiCapture: false }, actual: { resourceAudit: resource, builtProductCases: captures.map(({path: file, result}) => ({path: file, requirementId: result.requirementId, status: result.status, source: result.source.fingerprint})), pairs: pairs.map(({actual}) => actual), uiCapture: false } },
  { id: "MV-S6-MAP-APPEARANCE-R6", method: "game", selected: pairs.filter(item => item.case !== "missing-tileset"), artifacts: [], expected: { mapAndBattlePairs: 9, completeDiskCarriersPerPair: 15, mandatoryGeneratedCarriers: ["CommonEvents.json", "Map001.json", "System.json", "Troops.json"], strictRuntimeFlagsPerSide: 15, nativeComparator: true }, actual: { pairs: pairs.filter(item => item.case !== "missing-tileset").map(({actual}) => actual) } },
  { id: "MV-S6-MAP-APPEARANCE-R6-MISSING", method: "game", selected: pairs.filter(item => item.case === "missing-tileset"), artifacts: [], expected: { allocatedMissingTilesetImagePairs: 1, loadingErrorAndRetryPending: true, existingTilesetAcceptedByWorkspace: true, interpreterStallsOn282AndFollowingSwitchNotExecuted: true }, actual: { pairs: pairs.filter(item => item.case === "missing-tileset").map(({actual}) => actual) } },
];
const outputs = [];
for (const definition of definitions) {
  const requirement = requirements.requirements.find(({id}) => id === definition.id)!;
  assert.equal(captured.source.files.find(({path: file}) => file === requirement.fixture.path)?.sha256, requirement.fixture.sha256);
  const runId = `${new Date().toISOString().replaceAll(/[:.]/gu, "-")}-${randomUUID()}`;
  const result = resultSchema.parse({
    formatVersion: 1, requirementId: definition.id, runId, status: "passed",
    startedAt: definition.method === "reverse-engineering" ? resource.at : definition.selected[0].actual.lifecycle[0].startedAt,
    completedAt: new Date().toISOString(), operator: "Codex automated actual product and native verification",
    source: captured.source, fixture: requirement.fixture,
    environment: { ...captured.environment, native: { method: definition.method, mv: "RPG Maker MV 1.6.1", runtime: "Actual game.exe / embedded Node 9.7.1 / Chromium 65; read-only editor resource revalidation is separately identified", nwjs: "0.29.0", tools: { toolingNode: process.version, productRevision: captured.source.revision, versionEvidence: resource.reusedVersionEvidence, finalAudit: auditPath }, artifacts: [...commonArtifacts, ...definition.artifacts, ...definition.selected.flatMap(({artifacts}) => artifacts)] } },
    stages: ["fresh actual build and immutable source/test/dist/config preservation", "complete built Windows baseline", "independent literal inputs bound before product execution", "init→Clone→Decompile→formal source edit→Check→Compile→Diff→real Push", "complete generated and all15 disk carrier comparison", "physical isolation and full reference/seed guards", definition.method === "game" ? "actual normal-Scene native literal and product pair" : "identified read-only resource audit and corresponding actual built/native product comparison", "strict per-side native validation and Boolean semantic comparison", "append-only history and actual product byte audit"],
    expected: definition.expected, actual: { ...definition.actual, visualObservation }, difference: null,
  });
  const output = path.join(repo, ".scratch/complete-mv-events-implementation/evidence/results", `${definition.id}-${runId}.json`);
  await writeFile(output, JSON.stringify(result, null, 2) + "\n", {flag: "wx"});
  outputs.push(await artifact(output));
}
console.log(JSON.stringify({outputs, passed: true}, null, 2));
