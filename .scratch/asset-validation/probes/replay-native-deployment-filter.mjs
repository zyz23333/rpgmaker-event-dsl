import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import zlib from "node:zlib";
import vm from "node:vm";

// Controlled replay of the embedded JavaScript predicate with synthetic inputs.
// This does not run RPGMV.exe, Qt, the editor, or a game deployment.
const root = process.cwd();
const artifact = path.join(root, "references/RPGMV/RPGMV.exe");
const bytes = fs.readFileSync(artifact);
const sha256 = (data) => crypto.createHash("sha256").update(data).digest("hex");
const expectedArtifact = "1b7d685fd302505b104f51cc539e2d6c997b5164d4a6a55e745283536503d281";
if (sha256(bytes) !== expectedArtifact) throw new Error("Unexpected editor artifact");

const resources = [
  { name: "packaging", offset: 393812, decodedSha256: "248435cfcd038d50a484c8a6d48077652fa074d88b898f19a51665bfc0e5d5f8" },
  { name: "assetRules", offset: 401493, decodedSha256: "79fb5f2d2a36feb46ff26d3ab69125f7a4292a9fed8c9c772591162278463cdf" },
  { name: "deploymentOption", offset: 425759, decodedSha256: "69e37055b8998ca48b40f76606ec78a18b7ba79e6a98263fa09038ff5def27fa" },
];
const decoded = {};
const identities = resources.map((resource) => {
  const storedLength = bytes.readUInt32BE(resource.offset);
  const decodedLength = bytes.readUInt32BE(resource.offset + 4);
  const payload = bytes.subarray(resource.offset + 8, resource.offset + 4 + storedLength);
  const inflated = zlib.inflateSync(payload, { info: true, maxOutputLength: 100000 });
  if (inflated.buffer.length !== decodedLength || inflated.engine.bytesWritten !== payload.length) {
    throw new Error(`Invalid qCompress envelope: ${resource.name}`);
  }
  if (sha256(inflated.buffer) !== resource.decodedSha256) throw new Error("Resource digest mismatch");
  decoded[resource.name] = inflated.buffer.toString("utf8");
  return { ...resource, storedBytes: storedLength + 4, decodedBytes: decodedLength };
});

const source = decoded.packaging;
const start = source.indexOf("function needToCopy2(name)");
const end = source.indexOf("function needToEncrypt(name)", start);
if (start < 0 || end < 0) throw new Error("Expected predicate boundaries not found");
const predicateSource = source.slice(start, end).trim();
const context = vm.createContext({ assetStrip: true, assetStripper: { requiredFileList: [] } });
vm.runInContext(`var nativePredicate = (${predicateSource});`, context, { timeout: 1000 });

const scenarios = [
  { name: "listed image", file: "img/pictures/Used.png", required: ["img/pictures/Used"], keep: true },
  { name: "unlisted image", file: "img/pictures/Unused.png", required: [], keep: false },
  { name: "listed audio", file: "audio/bgm/Theme.ogg", required: ["audio/bgm/Theme"], keep: true },
  { name: "unlisted audio", file: "audio/se/Unused.ogg", required: [], keep: false },
  { name: "unlisted movie", file: "movies/Unused.webm", required: [], keep: true },
  { name: "listed dot in stem", file: "img/pictures/Scene.v2.png", required: ["img/pictures/Scene.v2"], keep: false },
  { name: "shorter listed stem keeps dotted file", file: "img/pictures/Scene.v2.png", required: ["img/pictures/Scene"], keep: true },
  { name: "dot in directory", file: "img/custom.v2/Scene.png", required: ["img/custom.v2/Scene"], keep: false },
  { name: "name case differs", file: "img/pictures/Used.png", required: ["img/pictures/used"], keep: false },
  { name: "extension case differs", file: "img/pictures/Used.PNG", required: ["img/pictures/Used"], keep: true },
  { name: "unlisted plugin JS", file: "js/plugins/Plugin.js", required: [], keep: true },
  { name: "strip disabled", file: "img/pictures/Unused.png", required: [], strip: false, keep: true },
];
const results = scenarios.map((scenario) => {
  context.assetStrip = scenario.strip ?? true;
  context.assetStripper.requiredFileList = scenario.required;
  context.inputFile = scenario.file;
  const actual = vm.runInContext("nativePredicate(inputFile)", context, { timeout: 1000 });
  return { ...scenario, actual, passed: actual === scenario.keep };
});
const receipt = {
  evidenceType: "controlled replay of an exact embedded QML JavaScript function",
  editorExecuted: false,
  scope: "needToCopy2 predicate only; not complete packaging, Qt, native I/O, encryption or runtime loading",
  artifact,
  artifactSha256: sha256(bytes),
  sourceResource: { offset: 393812, decodedSha256: sha256(Buffer.from(source, "utf8")) },
  predicateSha256: sha256(Buffer.from(predicateSource, "utf8")),
  identities,
  results,
  allPassed: results.every((result) => result.passed),
};
const destination = path.join(root, ".scratch/asset-validation/evidence/native-deployment-filter-replay.json");
fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.writeFileSync(destination, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify({ destination, allPassed: receipt.allPassed, scenarios: results.length, results }, null, 2));
if (!receipt.allPassed) process.exitCode = 1;
