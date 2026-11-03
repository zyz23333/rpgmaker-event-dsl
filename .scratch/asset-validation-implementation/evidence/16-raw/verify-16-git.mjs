import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { resolve, join } from "node:path";
const root = resolve(import.meta.dirname,"../../../..");
const git = (...args) => execFileSync("git",args,{cwd:root,maxBuffer:256*1024*1024});
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const json = async path => JSON.parse((await readFile(path,"utf8")).replace(/^\uFEFF/u,""));
const head = git("rev-parse","HEAD").toString().trim();
const rawRoot = ".scratch/asset-validation-implementation/evidence/16-raw/";
const manifest = await json(join(root,rawRoot,"manifest.json"));
for(const entry of manifest.files) {
  const path = rawRoot+entry.path, blob = git("show",`${head}:${path}`), disk = await readFile(join(root,path));
  if(blob.length!==entry.bytes || sha(blob)!==entry.sha256 || sha(disk)!==entry.sha256) throw new Error(`Raw Git byte mismatch: ${path}`);
}
const aggregatePath = ".scratch/asset-validation-implementation/evidence/16-recovery-acceptance.json";
const aggregateBytes = git("show",`${head}:${aggregatePath}`);
if(sha(aggregateBytes)!==sha(await readFile(join(root,aggregatePath)))) throw new Error("Aggregate Git bytes differ");
const aggregate = JSON.parse(aggregateBytes);
for(const input of aggregate.sourceInputs) {
  if(sha(git("show",`${head}:${input.path}`))!==input.sha256 || sha(git("show",`${aggregate.assertionFreeze}:${input.path}`))!==input.sha256) throw new Error(`Frozen assertion/input changed: ${input.path}`);
}
const receiptPairs = new Set();
for(const entry of aggregate.receipts) {
  if(entry.receipt.status!=="passed" || entry.receipt.expected.sha256!==aggregate.sourceInputs[0].sha256 || sha(JSON.stringify(entry.receipt,null,2)+"\n")!==entry.receiptSha256) throw new Error(`Receipt byte/source mismatch: ${entry.id}/${entry.entry}`);
  receiptPairs.add(entry.id+"/"+entry.entry);
}
if(receiptPairs.size!==24 || aggregate.matrices.some(matrix=>matrix.passed!==12 || matrix.failed!==0 || matrix.filteredNotPassing!==0)) throw new Error("Final receipt matrix incomplete");
git("merge-base","--is-ancestor",aggregate.integrationBase,head);
const result = {status:"verified",verifiedCommit:head,assertionFreeze:aggregate.assertionFreeze,rawGitBlobs:manifest.files.length,frozenSourceInputs:aggregate.sourceInputs.length,finalReceiptPairs:receiptPairs.size,aggregateSha256:sha(aggregateBytes),rawManifestSha256:sha(git("show",`${head}:${rawRoot}manifest.json`)),checks:["Every raw artifact byte length and SHA equals both worktree and committed Git blob","Final test/helper/product/control and old-regression sources equal assertion-freeze Git blobs","All24 embedded original receipt bytes and assertion-source SHA verified","Exact source/built12 matrices, zero filtered, and integration ancestry retained"]};
if(!process.argv.includes("--check-only")) await writeFile(resolve(root,".scratch/asset-validation-implementation/evidence/16-git-verification.json"),JSON.stringify(result,null,2)+"\n");
console.log(JSON.stringify(result));
