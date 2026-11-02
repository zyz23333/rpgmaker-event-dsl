// Evidence-only byte verification for the corrections integrated before freeze40.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
const prefix = ".scratch/asset-validation-implementation/evidence/";
const freeze = process.env.ASSET_VALIDATION_EXECUTION_FREEZE ?? "c5f7ead75ba78680b92ad81924ba8cb884d2b751";
const git = (...args) => execFileSync("git", args, { maxBuffer: 256 * 1024 * 1024 });
const sha = (value) => createHash("sha256").update(value).digest("hex");
const check = (value, message) => { if (!value) throw new Error(message); };
const json = (path) => JSON.parse(readFileSync(path));
const three = json(prefix + "03-device-space-acceptance.json");
const sixteen = json(prefix + "16-current-contract40-acceptance.json");
const nine = json(prefix + "09-grouping-compatibility/raw/manifest.json");
const rows = [...three.rawFiles.map((row) => ({ ...row, owner: "03" })),
  ...nine.artifacts.map((row) => ({ ...row, owner: "09" })),
  ...sixteen.rawFiles.map((row) => ({ ...row, owner: "16" }))];
const unique = [...new Map(rows.map((row) => [row.path, row])).values()];
check(unique.every((row) => row.path.startsWith(prefix) && row.bytes >= 0 && /^[a-f0-9]{64}$/u.test(row.sha256)), "Invalid raw artifact fingerprint");
const batch = execFileSync("git", ["cat-file", "--batch"], {
  input: unique.map((row) => freeze + ":" + row.path + "\n").join(""), maxBuffer: 512 * 1024 * 1024,
});
let offset = 0;
const fingerprints = unique.map((row) => {
  const end = batch.indexOf(10, offset), header = batch.subarray(offset, end).toString().split(" ");
  check(header.length === 3 && header[1] === "blob", "Raw artifact missing from Git " + row.path);
  const length = Number(header[2]), bytes = batch.subarray(end + 1, end + 1 + length);
  offset = end + 2 + length;
  const disk = readFileSync(row.path);
  check(length === row.bytes && sha(bytes) === row.sha256 && disk.equals(bytes), "Raw correction artifact bytes changed " + row.path);
  if (row.gitBlob) check(header[0] === row.gitBlob, "Raw correction Git identity changed " + row.path);
  return { ...row, gitBlob: header[0], byteIdenticalInFrozenGitAndDisk: true };
});
check(offset === batch.length, "Unread batch bytes");

const ts = createRequire(join(process.cwd(), "packages/rpgmaker-event-dsl/package.json"))("typescript");
function callbackRange(source, title) {
  const tree = ts.createSourceFile("audit.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS), matches = [];
  function visit(node) {
    if (ts.isCallExpression(node) && node.arguments.length > 1 && ts.isStringLiteral(node.arguments[0]) && node.arguments[0].text.startsWith(title + ":")) {
      const callback = node.arguments[1]; check(ts.isArrowFunction(callback), "Expected arrow callback");
      matches.push({ start: callback.getStart(tree), end: callback.end });
    }
    ts.forEachChild(node, visit);
  }
  visit(tree); check(matches.length === 1, "Correction callback not unique " + title); return matches[0];
}
const normalize = (text) => text.replaceAll("\r\n", "\n");
const ninePath = "packages/rpgmaker-event-dsl/test/asset-system-workspace.test.ts";
const oldNine = normalize(readFileSync(prefix + "09-grouping-compatibility/raw/original-badexpect-asset-system-workspace.test.ts.txt", "utf8"));
const currentNine = normalize(git("show", freeze + ":" + ninePath).toString());
const oldRange = callbackRange(oldNine, "AV.C07.shared-system-field.formal.case.expected");
const newRange = callbackRange(currentNine, "AV.C07.shared-system-field.formal.case.expected");
const oldOutside = oldNine.slice(0, oldRange.start) + "<reviewed-callback>" + oldNine.slice(oldRange.end);
const newOutside = currentNine.slice(0, newRange.start) + "<reviewed-callback>" + currentNine.slice(newRange.end);
check(oldOutside === newOutside, "09 changed bytes outside reviewed callback");
const sixteenPath = sixteen.change.source;
const oldSixteen = git("show", sixteen.sourceIdentity.originalTestFreeze + ":" + sixteenPath);
const currentSixteen = git("show", freeze + ":" + sixteenPath);
check(sha(oldSixteen) === sixteen.sourceIdentity.oldSha256 && sha(currentSixteen) === sixteen.sourceIdentity.currentSha256, "16 frozen source hashes differ");
check((oldSixteen.toString().match(/mv-1\.6\.1\/39/gu) ?? []).length === 2 &&
  oldSixteen.toString().replaceAll("mv-1.6.1/39", "mv-1.6.1/40") === currentSixteen.toString(), "16 changed more than two current literals");
const fileTests = git("show", freeze + ":packages/rpgmaker-event-dsl/test/asset-file-workspace.test.ts");
const tail = fileTests.subarray(fileTests.length - 3168);
check(sha(tail) === "21b202d79f5ce591d1b99d72381301cc7c7809c5ff2d11bacdc6ab4833e4f216", "Original F07 tail changed");
const productPaths = git("diff", "--name-only", three.baseIntegration, freeze, "--", "packages/rpgmaker-event-dsl/src").toString().trim().split("\n");
const docs = [
  { owner: "04", path: "packages/rpgmaker-event-dsl/README.md", required: "files are checked for exact ordinary-file existence under the shared asset rules" },
  { owner: "04", path: "skills/rpgmaker-event-authoring/references/event-patterns.md", required: "checks validate the selected file under the shared asset-file rules" },
  { owner: "06", path: "skills/rpgmaker-event-authoring/references/event-patterns.md", required: "Animation and Tileset relationships in captured standard data under the shared" },
].map((row) => { const bytes = git("show", freeze + ":" + row.path); check(bytes.toString().includes(row.required), "Stale documentation correction " + row.owner);
  return { ...row, sha256: sha(bytes), presentInFreeze: true }; });
const result = { schemaVersion: 1, executionFreeze: freeze, status: "verified-integrated-correction-evidence; no new test execution",
  rawArtifactCount: fingerprints.length, rawArtifactsByOwner: Object.fromEntries(["03", "09", "16"].map((owner) => [owner, fingerprints.filter((row) => row.owner === owner).length])),
  fingerprints, correction03: { contract: "mv-1.6.1/40", productPathsSincePreCorrectionIntegration: productPaths,
    originalF07Tail: { bytes: tail.length, sha256: sha(tail), unchanged: true }, canonicalIdsAdded: 0, supplementaryIds: three.scope.supplementaryLabels,
    preservedRed: three.history.red, actualCurrentFullRuns: "joined separately after command completion" },
  correction09: { callbackId: "AV.C07.shared-system-field.formal.case.expected", outsideCallbackUnchangedAfterLineEndingNormalization: true,
    outsideCallbackSha256: sha(oldOutside), intentionalExpectationChange: "two obsolete group-header expectations 2 -> 1; exact two members and no-write states retained and strengthened",
    originalFailureDoesNotEstablishLostOrigin: true },
  correction16: { ...sixteen.change, onlyTwoLiteralEdits: true, originalSourceSha256: sha(oldSixteen), currentSourceSha256: sha(currentSixteen),
    strictAssertionAndReceiptMetadataSeparatelyIdentified: true, historicalContractAndOmittedFieldsPreserved: true }, documentationCorrections: docs,
  maintainerApproval: null };
writeFileSync(prefix + "17-integrated-corrections-audit.json", JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({ status: result.status, artifacts: result.rawArtifactCount, byOwner: result.rawArtifactsByOwner,
  productPaths, correction09: result.correction09, correction16: result.correction16 }, null, 2));
