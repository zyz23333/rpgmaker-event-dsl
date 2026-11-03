// Re-read existing real native observations; this script does not launch MV/NW.js.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
const prefix = ".scratch/asset-validation-implementation/evidence/";
const check = (condition, message) => { if (!condition) throw new Error(message); };
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const inputs = [];
function load(path) {
  const bytes = readFileSync(prefix + path);
  inputs.push({ path: prefix + path, sha256: sha(bytes), bytes: bytes.length });
  return JSON.parse(bytes);
}
function environment(value) {
  check(value.mv === "1.6.1" && value.platform === "win32" && value.architecture === "ia32", "Unexpected native environment");
  check(value.versions.node === "9.7.1" && value.versions.nw === "0.29.0" && value.versions.chromium === "65.0.3325.146", "Unexpected native versions");
  return { mv: value.mv, platform: value.platform, architecture: value.architecture,
    node: value.versions.node, nw: value.versions.nw, chromium: value.versions.chromium };
}
const media = load("01-native-media/native-results.json");
const policy = load("01-native-media/policy-resolution-2026-11-02.json");
check(media.cases.length === 15 && media.cases.filter((row) => row.status === "observed").length === 13 && media.counterexamples.length === 2, "Original native media history changed");
check(policy.currentObligations.length === 7 && policy.currentObligations.every((row) => row.status === "satisfied-by-original-native-observation"), "Current native media policy obligation unresolved");
const nativeRuns = ["06-native-animation", "07-native-maps/change", "07-native-maps/tile-b", "07-native-maps/tile-c", "07-native-maps/tile-d", "07-native-maps/tile-e", "08-native-battlers/front", "08-native-battlers/side", "08-native-battlers/override"].map((directory) => {
  const file = directory + "/native-results.json", row = load(file);
  check(row.status === "observed" && row.events.length > 0 && row.assertions.every((item) => item.passed === true), "Native selected run failed " + directory);
  const sequences = new Set(row.events.map((item) => item.sequence));
  const references = [];
  for (const assertion of row.assertions) {
    // Assertion evidence may include selections from the original event stream.
    if (Array.isArray(assertion.actual)) for (const item of assertion.actual) if (item?.sequence !== undefined) {
      check(sequences.has(item.sequence), "Native assertion event absent " + directory);
      references.push(item.sequence);
    }
  }
  return { file: prefix + file, environment: environment(row.environment), status: row.status,
    events: row.events.length, assertionEventReferencesRechecked: references.length,
    assertions: row.assertions.map((item, index) => ({ index, label: item.label, passed: item.passed,
      actualRows: Array.isArray(item.actual) ? item.actual.length : null })), final: row.final };
});
const result = { schema: "asset-validation-native-existing-observation-audit/v1", auditedAt: new Date().toISOString(),
  executionAt17: "none; original actual runs and their byte-identical artifacts retained",
  originalMedia: { environment: environment(media.environment), samples: media.cases.map((row) => ({ id: row.id, category: row.category,
    savedName: row.savedName, status: row.status, diskSha256: row.disk.sha256, actualRequestCount: row.requests.length })),
    counterexamplesRetained: media.counterexamples, currentObligations: policy.currentObligations,
    excludedHistoricalObservations: policy.excludedHistoricalObservations },
  selectedRuns: nativeRuns, inputFingerprints: inputs,
  totalSelectedRunAssertions: nativeRuns.reduce((sum, row) => sum + row.assertions.length, 0),
  limitations: ["Native observations concern valid self-made samples, not arbitrary content or complete games.",
    "N01/N02 original raw exit1 and two image special-name counterexamples remain historical evidence; policy excludes images containing any percent/hash.",
    "Successful preload is kept distinct from actual frame, Canvas, and WebAudio consumption; product support still checks existence only."] };
writeFileSync(prefix + "17-native-evidence-audit.json", JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({ nativeMediaSamples: media.cases.length, observedMediaSamples: 13, retainedCounterexamples: 2,
  currentMediaIds: 7, selectedNativeRuns: nativeRuns.length, actualAssertions: result.totalSelectedRunAssertions,
  actualEvents: nativeRuns.reduce((sum, row) => sum + row.events, 0) }, null, 2));
