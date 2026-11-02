const fs = require("node:fs");
const cp = require("node:child_process");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");
const base = "f79bacb496b18f59562663b7fc9e9d10e86c747f";
const original = "f03e66e6e4550da8a72f98c118fbc36c3af4d1d5";
const root = ".scratch/asset-validation-implementation/evidence";
const output = `${root}/16-current-contract40`;
const source = "packages/rpgmaker-event-dsl/test/asset-recovery-workspace.test.ts";
const sha = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const git = args => cp.execFileSync("git",args,{maxBuffer:64*1024*1024});
const json = file => JSON.parse(fs.readFileSync(file,"utf8"));
const manifest = json(`${root}/16-raw/manifest.json`);
assert.equal(manifest.files.length,100);
const paths = [
  `${root}/16-recovery-acceptance.md`, `${root}/16-recovery-acceptance.json`,
  `${root}/16-git-verification.json`, `${root}/16-final-local-links.json`,
  `${root}/16-raw/manifest.json`, ...manifest.files.map(item=>`${root}/16-raw/${item.path}`),
];
const history = paths.map(file=>{
  const bytes=fs.readFileSync(file), saved=git(["show",`${base}:${file}`]);
  assert.deepEqual(bytes,saved,file);
  const old=manifest.files.find(item=>`${root}/16-raw/${item.path}`===file);
  if(old){assert.equal(bytes.length,old.bytes,file);assert.equal(sha(bytes),old.sha256,file);}
  return {path:file,bytes:bytes.length,sha256:sha(bytes),gitBlob:git(["rev-parse",`${base}:${file}`]).toString().trim()};
});
const sourceBytes=fs.readFileSync(source);
assert.deepEqual(sourceBytes,git(["show",`${original}:${source}`]));
assert.equal((sourceBytes.toString().match(/mv-1\.6\.1\/39/g)||[]).length,2);
assert.equal(json(`${root}/16-git-verification.json`).rawGitBlobs,100);
fs.writeFileSync(`${output}/compatibility-red-assertions.ts`,sourceBytes);
fs.writeFileSync(`${output}/original-history.json`,JSON.stringify({base,originalAssertionFreeze:original,
  source:{path:source,bytes:sourceBytes.length,sha256:sha(sourceBytes),gitBlob:git(["rev-parse",`${base}:${source}`]).toString().trim()},
  historicalArtifacts:history,originalRawCount:100,originalFinalReceiptCount:24,
  classification:"Current-fixture literal expectation compatibility; no product violation or original-history rewrite.",
},null,2)+"\n");
console.log(JSON.stringify({base,original,originalRawCount:100,preservedArtifacts:history.length,sourceSha256:sha(sourceBytes)}));
