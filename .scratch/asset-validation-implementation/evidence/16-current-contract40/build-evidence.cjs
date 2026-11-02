const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");
const root = ".scratch/asset-validation-implementation/evidence";
const raw = `${root}/16-current-contract40`;
const source = "packages/rpgmaker-event-dsl/test/asset-recovery-workspace.test.ts";
const freeze = "0fb8b677c1c8679a334cae034b6823a776ace789";
const redRevision = "631ff14bb4755a5c396885f050d41ec35a04b45d";
const id = "AV.W16.changed-current-config.api.case.expected";
const read = file => fs.readFileSync(file);
const json = file => JSON.parse(read(file));
const sha = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const blob = bytes => crypto.createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
const git = args => cp.execFileSync("git",args,{maxBuffer:64*1024*1024});
const history = json(`${raw}/original-history.json`);
const prior = json(`${root}/16-recovery-acceptance.json`);
for (const item of history.historicalArtifacts) {
  const bytes=read(item.path); assert.equal(bytes.length,item.bytes,item.path); assert.equal(sha(bytes),item.sha256,item.path);
  assert.deepEqual(git(["show",`${history.base}:${item.path}`]),bytes,item.path);
}
const original = read(`${raw}/compatibility-red-assertions.ts`);
assert.equal(sha(original),history.source.sha256);
assert.deepEqual(git(["show",`${redRevision}:${source}`]),original);
const current = read(source), currentHash=sha(current);
assert.deepEqual(current,git(["show",`${freeze}:${source}`]));
assert.equal((original.toString().match(/mv-1\.6\.1\/39/g)||[]).length,2);
assert.equal((current.toString().match(/mv-1\.6\.1\/40/g)||[]).length,2);
assert.equal(original.toString().replaceAll("mv-1.6.1/39","mv-1.6.1/40"),current.toString());
const productTree = "packages/rpgmaker-event-dsl/src";
const productTreeBlob=git(["rev-parse",`${freeze}:${productTree}`]).toString().trim();
assert.equal(git(["rev-parse",`${history.base}:${productTree}`]).toString().trim(),productTreeBlob);
assert.equal(git(["diff","--name-only",history.base,freeze,"--","packages/rpgmaker-event-dsl/test"]).toString().trim(),source);
const inputs = [...new Set([...prior.sourceInputs.map(item=>item.path),
  ".gitattributes", ".scratch/asset-validation/asset-validation-spec.md",
  ".scratch/asset-validation/implementation-acceptance-cases.md",
  "packages/rpgmaker-event-dsl/src/workspace/asset-files.ts",
])].map(file=>{
  const bytes=git(["show",`${freeze}:${file}`]);assert.deepEqual(bytes,read(file),file);
  return {path:file,bytes:bytes.length,sha256:sha(bytes),gitBlob:blob(bytes)};
});
const oldReport=json(`${root}/16-raw/16-source-final.json`);
const oldIds=oldReport.testResults.flatMap(item=>item.assertionResults).map(item=>item.fullName.split(":")[0]).sort();
assert.equal(oldIds.length,12);assert.equal(new Set(oldIds).size,12);
const executions=[],receipts=[];
for (const phase of ["compatibility-red","source","built"]) {
  const entry=phase==="built"?"built":"source";
  const reportPath=`${raw}/${phase}-runner.json`,report=json(reportPath);
  const assertions=report.testResults.flatMap(item=>item.assertionResults);
  assert.deepEqual(assertions.map(item=>item.fullName.split(":")[0]).sort(),oldIds);
  assert.equal(report.numTotalTests,12);assert.equal(report.numPendingTests,11);
  assert.equal(report.numPassedTests,phase==="compatibility-red"?0:1);
  assert.equal(report.numFailedTests,phase==="compatibility-red"?1:0);
  const receiptPath=`${raw}/${phase}-receipt.${entry}.json`,bytes=read(receiptPath),receipt=JSON.parse(bytes);
  assert.equal(receipt.id,id);assert.equal(receipt.ownerTicket,"16");assert.equal(receipt.entry,entry);
  assert.equal(receipt.environment.platform,"win32");assert.match(receipt.environment.node,/^v22\./);
  assert.equal(receipt.expected.sha256,phase==="compatibility-red"?history.source.sha256:currentHash);
  const originalInput=receipt.input.find(item=>item.before&&item.expectedCompletedManifest);
  const originalManifest=JSON.parse(Buffer.from(originalInput.before.state["sync-manifest.json"],"base64").toString());
  assert.equal(originalManifest.compileBaseline.compileContractVersion,"mv-1.6.1/40");
  assert.deepEqual(originalManifest.compileBaseline.config.assetCheckExceptions,[]);
  if(phase==="compatibility-red") {
    assert.equal(receipt.status,"failed");assert.match(receipt.actual,/expected 'mv-1\.6\.1\/40' to be 'mv-1\.6\.1\/39'/);
  } else {
    assert.equal(receipt.status,"passed");
    const result=receipt.input.find(item=>item.currentContract);
    assert.equal(result.currentContract,"mv-1.6.1/40");
    assert.equal(result.actual.exitCode,1);assert.match(result.actual.message+result.actual.stderr,/is stale/);
    assert.match(result.actual.message+result.actual.stderr,/asset check not run/);
    assert.doesNotMatch(result.actual.message+result.actual.stderr,/MV-ASSET-MISSING-FILE/);
    assert.deepEqual(result.actual.messages.filter(item=>item.kind==="asset-query"),[]);
    assert(!Object.keys(result.after.state).some(file=>file.startsWith("pending-push/")));
    const completed=JSON.parse(Buffer.from(result.after.state["sync-manifest.json"],"base64").toString());
    assert.deepEqual(completed,originalInput.expectedCompletedManifest);
    assert.equal(completed.compileBaseline.compileContractVersion,"mv-1.6.1/40");
    assert.deepEqual(completed.compileBaseline.config.assetCheckExceptions,[]);
    assert.deepEqual(JSON.parse(result.after.config).assetCheckExceptions,result.driverChangedConfig.assetCheckExceptions);
    assert.deepEqual(result.after.project,result.recoveryInput.project);
  }
  const command=json(`${raw}/${phase}-command.json`);
  assert.equal(command.head,phase==="compatibility-red"?redRevision:freeze);
  assert.equal(command.exitCode,phase==="compatibility-red"?1:0);
  executions.push({phase,entry,command,report:{path:reportPath,bytes:read(reportPath).length,sha256:sha(read(reportPath)),
    success:report.success,total:report.numTotalTests,passed:report.numPassedTests,failed:report.numFailedTests,filtered:report.numPendingTests}});
  receipts.push({phase,path:receiptPath,bytes:bytes.length,sha256:sha(bytes),gitBlob:blob(bytes),receipt});
}
const build=json(`${raw}/build-command.json`);assert.equal(build.exitCode,0);assert.equal(build.head,freeze);
const staticChecks=json(`${raw}/static-commands.json`);assert.equal(staticChecks.length,3);assert(staticChecks.every(item=>item.exitCode===0));
const dist="packages/rpgmaker-event-dsl/dist";
const builtArtifacts=fs.readdirSync(dist,{recursive:true,withFileTypes:true}).filter(item=>item.isFile()).map(item=>{
  const file=path.join(item.parentPath,item.name).replaceAll("\\","/"),bytes=read(file);
  return {path:file,bytes:bytes.length,sha256:sha(bytes)};
}).sort((a,b)=>a.path.localeCompare(b.path));
assert.equal(builtArtifacts.length,15);
const rawFiles=fs.readdirSync(raw,{recursive:true,withFileTypes:true}).filter(item=>item.isFile()).map(item=>{
  const file=path.join(item.parentPath,item.name).replaceAll("\\","/"),bytes=read(file);
  return {path:file,bytes:bytes.length,sha256:sha(bytes),gitBlob:blob(bytes)};
}).sort((a,b)=>a.path.localeCompare(b.path));
const evidence={schemaVersion:1,ticket:"16",kind:"current-contract-fixture-compatibility",status:"passed",
  baseIntegration:history.base,implementationRevision:freeze,compatibilityRedRevision:redRevision,
  compileContractVersion:"mv-1.6.1/40",productBehaviorChanged:false,contractBumped:false,
  classification:"Tool contract advanced to40 in ticket03. Existing current-config test incorrectly expected39. Compatibility-red is obsolete fixture expectation, not a product violation.",
  scope:{canonicalIdsAdded:0,callback:id,canonicalIdSet:oldIds,source:{passed:1,filtered:11},built:{passed:1,filtered:11},
    unrepeated:"Other11 recovery callbacks, old86 compatibility suites and unrelated matrices are not current reruns. Final17 owns full validation.",
    historicalVariants:"Original35 policy omission, absent contract/type-inputs and pre-Troops6 variants unchanged; never rewritten as current."},
  change:{literalCount:2,from:"mv-1.6.1/39",to:"mv-1.6.1/40",source,
    retained:"Fresh-original precondition, original empty policy, all-N bookkeeping with frozen basis, current config freshness refusal, no media query, pending cleared, whole-state preservation and legacy variants."},
  sourceIdentity:{oldSha256:history.source.sha256,currentSha256:currentHash,bytes:current.length,onlyTwoCurrentLiteralChanges:true,
    originalTestFreeze:history.originalAssertionFreeze,productSourceTree:{path:productTree,gitTree:productTreeBlob,unchangedFromBase:true}},
  provenance:{history,gitInputs:inputs},build,builtArtifacts,staticChecks,executions,receipts,rawFiles,
  environment:{platform:process.platform,node:process.version,worktree:process.cwd(),TEMP:process.env.TEMP,TMP:process.env.TMP,maxWorkers:1,
    schedule:"Exclusive targeted window released by09; compatibility-red -> two literal changes -> build40 -> source -> built. Then static/evidence only, no broad regression."},
  nativeExecution:"Not applicable; existing public Workspace API callback in real Windows temporary projects and real test-child OS boundary. No native MV execution claimed.",
};
const destination=`${root}/16-current-contract40-acceptance.json`;
fs.writeFileSync(destination,JSON.stringify(evidence,null,2)+"\n");
console.log(JSON.stringify({destination,freeze,sourceSha256:currentHash,raw:rawFiles.length,oldHistory:history.historicalArtifacts.length,inputs:inputs.length,built:builtArtifacts.length,executions:executions.map(item=>({phase:item.phase,...item.report}))},null,2));
