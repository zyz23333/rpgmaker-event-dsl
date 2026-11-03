const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");
const history = ".scratch/asset-validation-implementation/evidence/03-device-space";
const read = file => fs.readFileSync(file);
const json = file => JSON.parse(read(file).toString("utf8").replace(/^\uFEFF/, ""));
const sha = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const blob = bytes => crypto.createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
const git = args => cp.execFileSync("git", args, { maxBuffer:64*1024*1024 });
const provenance = json(`${history}/frozen-inputs.json`);
const frozen = provenance.implementationRevision;
const testFile = "packages/rpgmaker-event-dsl/test/asset-file-workspace.test.ts";
const testHash = provenance.gitInputs.find(item => item.path === testFile).sha256;
const mediaHash = provenance.gitInputs.find(item => item.path.endsWith("test/asset-media-workspace.test.ts")).sha256;
for (const item of provenance.gitInputs) {
  const bytes = git(["show",`${frozen}:${item.path}`]);
  assert.equal(sha(bytes),item.sha256);
  assert.deepEqual(read(item.path),bytes);
}
const supplements = ["exception","image","audio","movie","candidate","inactive","supported-controls"].map(label=>`SUPPLEMENT.device-space-${label}`);
const prior = json(provenance.originalLedger.path);
const legacyIds = [...new Set(prior.results.map(item=>item.id)),
  "AV.F06.image-percent.input.case.expected", "AV.F06.image-hash.input.case.expected", "AV.F06.literal-percent20.input.case.expected",
  "AV.F06.image-candidate.input.case.expected", "AV.F06.image-inactive.input.case.expected"].sort();
assert.equal(new Set(legacyIds).size,171);
const mediaIds = ["AV.F06.audio-percent.filesystem.case.expected","AV.F06.audio-hash.filesystem.case.expected","AV.F06.movie-percent.input.case.expected","AV.F06.movie-hash.input.case.expected"].sort();
function runner(name) {
  const reportPath = `${history}/${name}`;
  const bytes = read(reportPath), report = JSON.parse(bytes);
  return { report, summary: {path:reportPath,bytes:bytes.length,sha256:sha(bytes),success:report.success,
    total:report.numTotalTests,passed:report.numPassedTests,failed:report.numFailedTests,filtered:report.numPendingTests,
    startedAt:new Date(report.startTime).toISOString(),completedAt:new Date(Math.max(...report.testResults.map(item=>item.endTime))).toISOString()} };
}
const executions = [], supplementReceipts = [], receiptManifest = [];
for (const entry of ["source","built"]) {
  const {report,summary} = runner(`final-${entry}-runner.json`);
  assert.equal(summary.success,true); assert.equal(summary.total,178); assert.equal(summary.passed,178); assert.equal(summary.failed,0); assert.equal(summary.filtered,0);
  const names = report.testResults.flatMap(item=>item.assertionResults).map(item=>item.fullName.split(":")[0]);
  assert.deepEqual([...names].sort(),[...legacyIds,...supplements].sort());
  for (const id of names) {
    const receiptPath = `${history}/final-${entry}-receipts/${id}.${entry}.json`, bytes = read(receiptPath), receipt = JSON.parse(bytes);
    assert.equal(receipt.id,id); assert.equal(receipt.entry,entry); assert.equal(receipt.status,"passed"); assert.equal(receipt.ownerTicket,"03");
    assert.equal(receipt.expected.sha256,testHash); assert.equal(receipt.environment.platform,"win32"); assert.match(receipt.environment.node,/^v22\./);
    const description = {id,entry,role:id.startsWith("SUPPLEMENT.")?"supplementary-not-canonical":"unchanged-existing-callback",path:receiptPath,bytes:bytes.length,sha256:sha(bytes),gitBlob:blob(bytes)};
    receiptManifest.push(description);
    if (id.startsWith("SUPPLEMENT.")) supplementReceipts.push({...description,receipt});
  }
  const media = runner(`media-${entry}-runner.json`);
  assert.equal(media.summary.success,true); assert.equal(media.summary.passed,4); assert.equal(media.summary.failed,0);
  const passedMedia = media.report.testResults.flatMap(item=>item.assertionResults).filter(item=>item.status==="passed").map(item=>item.fullName.split(":")[0]).sort();
  assert.deepEqual(passedMedia,mediaIds);
  for (const id of passedMedia) {
    const receiptPath = `${history}/media-${entry}-receipts/${id}.${entry}.json`, bytes = read(receiptPath), receipt = JSON.parse(bytes);
    assert.equal(receipt.status,"passed"); assert.equal(receipt.ownerTicket,"05"); assert.equal(receipt.expected.sha256,mediaHash);
    receiptManifest.push({id,entry,role:"existing-media-regression-owner05",path:receiptPath,bytes:bytes.length,sha256:sha(bytes),gitBlob:blob(bytes)});
  }
  executions.push({entry,fileSuite:summary,existingMediaNameRegression:media.summary});
}
assert.equal(supplementReceipts.length,14); assert.equal(receiptManifest.length,364);
const commands = json(`${history}/verification-commands.json`);
assert.equal(commands.length,8); assert(commands.every(item=>item.exitCode===0));
const artifacts = json(`${history}/built-artifacts.json`);
for (const item of artifacts) { const bytes = read(item.path); assert.equal(bytes.length,item.bytes); assert.equal(sha(bytes),item.sha256); }
const red = json(`${history}/red-receipt.source.json`);
assert.equal(red.status,"failed");
const redSource = git(["show",`c728e56b711d43044b956c24b1a6731b273b2d57:${testFile}`]);
assert.equal(sha(redSource),red.expected.sha256); assert.deepEqual(redSource,read(`${history}/red-assertions.ts`));
const redInput = red.input.find(item=>item.appendedName === "NUL .png");
assert.equal(redInput.actualCompileFailure,"");
assert.notEqual(redInput.before.state["sync-manifest.json"],redInput.after.state["sync-manifest.json"]);
assert.equal(redInput.before.state["generated-project-data/CommonEvents.json"],undefined);
assert.equal(typeof redInput.after.state["generated-project-data/CommonEvents.json"],"string");
assert.deepEqual(redInput.before.project,redInput.after.project);
const firstGreen = json(`${history}/first-green-receipt.source.json`); assert.equal(firstGreen.status,"passed"); assert.equal(firstGreen.expected.sha256,red.expected.sha256);
const probe = json(`${history}/device-name-space-probe.json`);
assert.equal(probe.results.length,16);
for (const item of provenance.probes) assert.equal(sha(read(item.path)),item.sha256);
const rawFiles = fs.readdirSync(history,{recursive:true,withFileTypes:true}).filter(item=>item.isFile()).map(item=>{
  const file = path.join(item.parentPath,item.name).replaceAll("\\","/"), bytes = read(file);
  return {path:file,bytes:bytes.length,sha256:sha(bytes),gitBlob:blob(bytes)};
}).sort((a,b)=>a.path.localeCompare(b.path));
const output = {
  schemaVersion:1,ticket:"03",reason:"Reopened ordinary Windows reserved-device contract bug; no new policy or ADR revision.",
  baseIntegration:provenance.base,implementationRevision:frozen,compileContractVersion:"mv-1.6.1/40",
  scope:{canonicalIdsAdded:0,independentPlanFamilies:97,independentSemanticObligations:1209,
    existingFileCallbacksPerEntry:171,supplementaryCallbacksPerEntry:7,totalFileCallbacksPerEntry:178,
    supplementaryReceipts:14,existingMediaNameCallbacksPerEntry:4,totalArchivedCurrentReceipts:364,
    entries:["source","built"],supplementaryLabels:supplements,legacyIds,mediaRegressionOwner:"05"},
  product:{change:"Device token permits only U+0020 ASCII spaces before the first dot in the complete appended filename.",
    unchanged:"Original saved strings, ordinary spaces, leading spaces, literal audio characters and Unicode spelling are preserved. No trim, Unicode whitespace matching, target construction, media query or eligible exception for unsupported device names.",
    publicBoundary:"Existing public Workspace Compile/Check API and actual CLI in real Windows projects. All query denial and observation remain in the existing test-child OS adapter; no product test hooks.",
    warningPolicy:"Candidate/inactive unsupported warnings stay incomplete, base/effective warning with original saved origins; matching exceptions neither downgrade nor produce false ineffective findings.",
    positiveControl:"Eight actual ordinary PNG filenames preserve exact spelling; after deleting COM0 .png, its exact exception still downgrades confirmed missing-file error with complete coverage and normal publication."},
  independentOracles:{acceptedContract:"ADR0017, ADR0018 and asset-validation-spec section 5; all28 tokens independently transcribed, no product matcher imported as expected.",
    windowsProbe:{path:`${history}/device-name-space-probe.json`,observedAtUtc:probe.observedAtUtc,api:probe.api,results:probe.results,
      classification:"Read-only Windows API name classification, archived original bytes; no MV editor/game/native acceptance rerun claimed."},
    unsupportedInputs:spacedInputs(),supportedInputs:["Poster ","Poster  ","NULx"," NUL","NUL x","COM0 ","NUL\u00a0","NUL\u3000"]},
  history:{red:{revision:"c728e56b711d43044b956c24b1a6731b273b2d57",report:runner("red-runner.json").summary,
      assertionsPath:`${history}/red-assertions.ts`,assertionsSha256:red.expected.sha256,receiptPath:`${history}/red-receipt.source.json`,
      result:"Public Compile incorrectly succeeded and published generated data/Manifest for NUL-space with exact exception and empty pictures. Original live project bytes unchanged; raw before/after data retained."},
    firstGreen:{report:runner("first-green-runner.json").summary,receiptPath:`${history}/first-green-receipt.source.json`,
      runtimeHead:"c728e56b711d43044b956c24b1a6731b273b2d57",productBytesFrozenAfterAt:"64c99c765cb5c7c061a22aff119660694f365e4d",
      result:"Same tracer passes after minimal ASCII-space rule/Contract40 change; original assertions unchanged. Product edits were uncommitted during this first green, then frozen byte-equivalently."},
    focused:runner("focused-runner.json").summary,eligibleControls:runner("eligible-controls-runner.json").summary,
    filtering:"Historical focused/green/recheck filters are recorded, not counted as passing or as additional canonical identities."},
  provenance,executions,verificationCommands:commands,builtArtifacts:artifacts,
  environment:{platform:process.platform,node:process.version,temp:process.env.TEMP,tmp:process.env.TMP,worktree:process.cwd(),maxWorkers:1,
    scheduling:"Root released the test window after stopping old39 check. Final source -> build -> final built -> targeted media source/built -> static checks execute sequentially."},
  nativeExecution:"Not applicable to this public Workspace/name-regression correction; the independent Windows API probe is not MV native acceptance.",
  receiptManifest,supplementReceipts,rawFiles,
};
function spacedInputs(){ return ["cOn   ","PRN ","aux  .extra","NUL .png","COM1 ","com2  ","COM3 .foo","COM4 ","COM5 ","COM6 ","COM7 ","COM8 ","COM9 ","lpt1 ","LPT2 ","LPT3 ","LPT4 ","LPT5 ","LPT6 ","LPT7 ","LPT8 ","LPT9 ","COM¹ ","com²  .foo","COM³ ","LPT¹ ","lpt²  ","LPT³ "]; }
const destination = ".scratch/asset-validation-implementation/evidence/03-device-space-acceptance.json";
fs.writeFileSync(destination,JSON.stringify(output,null,2)+"\n");
console.log(JSON.stringify({destination,frozen,fileTests:executions.map(item=>({entry:item.entry,passed:item.fileSuite.passed,filtered:item.fileSuite.filtered})),supplementaryReceipts:14,currentReceipts:receiptManifest.length,rawFiles:rawFiles.length,gitInputs:provenance.gitInputs.length,builtArtifacts:artifacts.length,oldPending:provenance.originalLedger.pending},null,2));
