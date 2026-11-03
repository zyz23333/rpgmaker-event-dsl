const fs=require("node:fs"),path=require("node:path"),cp=require("node:child_process"),crypto=require("node:crypto"),assert=require("node:assert/strict");
const raw=".scratch/asset-validation-implementation/evidence/17-regression-repair/raw";
const originalRoot="M:/Shuen/Codex/asset-validation-17-acceptance/.scratch/asset-validation-implementation/evidence/17-raw/history/c5f7ead7-contract40-whole-check-failed";
const base="f30d64d635eddc832879e1536bb72f89e82ad015",red="c5f7ead75ba78680b92ad81924ba8cb884d2b751";
const sha=bytes=>crypto.createHash("sha256").update(bytes).digest("hex");
const git=args=>cp.execFileSync("git",args,{maxBuffer:64*1024*1024});
assert.equal(git(["diff","--name-only",base,red,"--","packages/rpgmaker-event-dsl/src","packages/rpgmaker-event-dsl/test"]).toString(),"");
const sourceFiles=["pictures-workspace","control-input-workspace","audio-commands-workspace","movement-instructions-workspace","screen-effects-workspace","final-review-workspace"].map(name=>`packages/rpgmaker-event-dsl/test/${name}.test.ts`);
fs.mkdirSync(`${raw}/original-tests`,{recursive:true});fs.mkdirSync(`${raw}/original-helpers`,{recursive:true});
const sources=sourceFiles.map(file=>{const bytes=fs.readFileSync(file);assert.deepEqual(bytes,git(["show",`${red}:${file}`]));const archived=`${raw}/original-tests/${path.basename(file)}`;fs.writeFileSync(archived,bytes);return{path:file,archived,bytes:bytes.length,sha256:sha(bytes)};});
const copies=["01-pnpm-check.log","command-history.json","disposition.json"].map(name=>{const bytes=fs.readFileSync(`${originalRoot}/${name}`),archived=`${raw}/original-${name}`;fs.writeFileSync(archived,bytes);return{path:`${originalRoot}/${name}`,archived,bytes:bytes.length,sha256:sha(bytes)};});
const disposition=JSON.parse(fs.readFileSync(`${raw}/original-disposition.json`));
assert.equal(disposition.executionFreeze,red);assert.equal(disposition.actualSourceSummary.tests.failed,6);assert.equal(disposition.actualSourceSummary.tests.passed,3403);
const log=fs.readFileSync(`${raw}/original-01-pnpm-check.log`,"utf8");assert.equal((log.match(/Error: Test timed out in/g)||[]).length,5);assert(log.includes("expected 'mv-1.6.1/40' to be 'mv-1.6.1/38'"));
const helpers=[];for(const name of fs.readdirSync(`${originalRoot}/current-legacy-regression-evidence`).filter(name=>name.endsWith(".json"))){
 const file=`${originalRoot}/current-legacy-regression-evidence/${name}`,bytes=fs.readFileSync(file),receipt=JSON.parse(bytes);
 const selected=receipt.requirementId==="MV-S6-PICTURE-007"||receipt.requirementId==="MV-S6-MOVEMENT-003"||receipt.requirementId==="MV-S6-SCREEN-002"||receipt.requirementId==="MV-S3-INPUT-003"&&String(receipt.expected).includes("actorRef")||receipt.requirementId==="MV-S6-AUDIO-002"&&String(receipt.expected).includes("batch 2");
 if(!selected)continue;assert.equal(receipt.status,"passed");assert.equal(receipt.difference,null);const archived=`${raw}/original-helpers/${name}`;fs.writeFileSync(archived,bytes);helpers.push({path:file,archived,bytes:bytes.length,sha256:sha(bytes),requirementId:receipt.requirementId,startedAt:receipt.startedAt,completedAt:receipt.completedAt,actual:receipt.actual});
}
assert.equal(helpers.length,5);
fs.writeFileSync(`${raw}/original-red.json`,JSON.stringify({base,red,originalRoot,wholeRunVerdict:"failed naturally; helpers do not override runner failures",sourceFiles:sources,copiedOriginalArtifacts:copies,helperReceipts:helpers,failures:disposition.failures,sourceSummary:disposition.actualSourceSummary,originalArchivedFiles:disposition.originalFiles.length,sourceReceipts:disposition.actualSourceAssetReceipts},null,2)+"\n");
console.log(JSON.stringify({sourceFiles:sources.length,originalArtifacts:copies.length,helpers:helpers.length,failures:disposition.failures.length,archivedFiles:disposition.originalFiles.length}));
