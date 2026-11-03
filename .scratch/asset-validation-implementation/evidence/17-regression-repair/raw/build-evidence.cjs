const fs=require("node:fs"),path=require("node:path"),cp=require("node:child_process"),crypto=require("node:crypto"),assert=require("node:assert/strict");
const root=".scratch/asset-validation-implementation/evidence/17-regression-repair",raw=`${root}/raw`;
const freeze="14ef1dddaecc8df069a07277f449013b0cdb475c",base="f30d64d635eddc832879e1536bb72f89e82ad015";
const read=file=>fs.readFileSync(file),json=file=>JSON.parse(read(file));
const sha=bytes=>crypto.createHash("sha256").update(bytes).digest("hex");
const blob=bytes=>crypto.createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
const git=args=>cp.execFileSync("git",args,{maxBuffer:64*1024*1024});
const red=json(`${raw}/original-red.json`),preservation=json(`${raw}/assertion-preservation.json`);
const product="packages/rpgmaker-event-dsl/src";
assert.equal(git(["rev-parse",`${freeze}:${product}`]).toString(),git(["rev-parse",`${base}:${product}`]).toString());
const changed=git(["diff","--name-only",base,freeze,"--","packages/rpgmaker-event-dsl/test"]).toString().trim().split("\n").sort();
assert.deepEqual(changed,red.sourceFiles.map(item=>item.path).sort());
for(const item of [...red.sourceFiles,...red.copiedOriginalArtifacts,...red.helperReceipts]){const bytes=read(item.archived);assert.equal(bytes.length,item.bytes);assert.equal(sha(bytes),item.sha256);}
const refs=["actorRef","animationRef","armorRef","classRef","commonEventRef","enemyRef","itemRef","mapRef","skillRef","stateRef","switchRef","tilesetRef","troopRef","variableRef","weaponRef"];
const expected=[...refs.map(name=>`MV-S3-INPUT-003: ${name} evaluates controls and rejects discarded actual source fields`),
 ...[1,2,3].map(n=>`MV-S6-AUDIO-002: refuses evaluated malformed audio source batch ${n} without changing complete business state`),
 "MV-S6-PICTURE-007: preserves Picture commands in Map and Battle pages with inactive saved values and real Push",
 "MV-S6-MOVEMENT-003: rejects malformed evaluated untyped movement values without changing any complete Workspace carrier or publication state",
 "MV-S6-SCREEN-002: rejects evaluated const spread as-any helper and direct Screen inputs while preserving complete Workspace state",
 "keeps an explicit old /23 contract stale until a normal current /40 Compile"].sort();
assert.equal(expected.length,22);
const inputs=[...red.sourceFiles.map(item=>item.path),"packages/rpgmaker-event-dsl/test/support/mv-evidence.ts","packages/rpgmaker-event-dsl/test/support/windows-sandbox.ts","packages/rpgmaker-event-dsl/test/support/workspace-operation-process.ts",
 "packages/rpgmaker-event-dsl/vitest.config.ts","packages/rpgmaker-event-dsl/vitest.windows.config.ts","packages/rpgmaker-event-dsl/src/workspace/type-inputs.ts","package.json","pnpm-lock.yaml","packages/rpgmaker-event-dsl/package.json",`${raw}/source.config.ts`,`${raw}/built.config.ts`,`${raw}/run-targeted.ps1`].map(file=>{
 const bytes=read(file);assert.deepEqual(bytes,git(["show",`${freeze}:${file}`]),file);return{path:file,bytes:bytes.length,sha256:sha(bytes),gitBlob:blob(bytes)};});
const executions=[],helpers=[];
for(const entry of ["source","built"]){
 const reportPath=`${raw}/${entry}-runner.json`,report=json(reportPath),command=json(`${raw}/${entry}-command.json`);
 assert.equal(command.head,freeze);assert.equal(command.exitCode,0);assert.equal(command.workerOverride,null);assert(!command.globalEntryOverride);
 assert.equal(report.testResults.length,6);assert.equal(report.numPassedTests,22);assert.equal(report.numFailedTests,0);assert.equal(report.success,true);
 const passed=report.testResults.flatMap(item=>item.assertionResults).filter(item=>item.status==="passed");
 assert.deepEqual(passed.map(item=>item.fullName).sort(),expected);
 assert.equal(report.numPendingTests,report.numTotalTests-22);
 const dir=`${raw}/${entry}-helpers`,files=fs.readdirSync(dir).filter(name=>name.endsWith(".json"));assert.equal(files.length,21);
 const receiptNames=[];
 for(const name of files){const file=`${dir}/${name}`,bytes=read(file),receipt=JSON.parse(bytes);
  assert.equal(receipt.status,"passed");assert.equal(receipt.difference,null);assert.equal(receipt.source.revision,freeze);
  assert.equal(receipt.environment.platform,"win32");assert.match(receipt.environment.node,/^v22\./);assert.equal(receipt.environment.native,"not-executed");
  assert(receipt.startedAt>=command.startedAt&&receipt.completedAt<=command.completedAt);
  const expectedEntry=entry==="built"?"/dist/":"/src/";assert(receipt.actual.entry.replaceAll("\\","/").includes(expectedEntry));
  for(const source of red.sourceFiles){const input=inputs.find(item=>item.path===source.path),fingerprint=receipt.source.files.find(item=>item.path===source.path);assert.equal(fingerprint.sha256,input.sha256);}
  receiptNames.push(receipt.requirementId==="MV-S6-MOVEMENT-003"?expected.find(name=>name.startsWith("MV-S6-MOVEMENT-003:")):receipt.requirementId==="MV-S6-PICTURE-007"?`${receipt.requirementId}: ${receipt.expected}`:receipt.expected);
  helpers.push({entry,path:file,bytes:bytes.length,sha256:sha(bytes),gitBlob:blob(bytes),requirementId:receipt.requirementId,status:receipt.status,actual:receipt.actual,sourceFingerprint:receipt.source.fingerprint,sourceFileCount:receipt.source.files.length,startedAt:receipt.startedAt,completedAt:receipt.completedAt});
 }
 assert.deepEqual(receiptNames.sort(),expected.filter(name=>!name.startsWith("keeps an explicit old")));
 executions.push({entry,command,report:{path:reportPath,bytes:read(reportPath).length,sha256:sha(read(reportPath)),success:true,files:6,total:report.numTotalTests,passed:22,failed:0,filtered:report.numPendingTests},selected:passed.map(item=>({name:item.fullName,status:item.status,durationMs:item.duration}))});
}
const build=json(`${raw}/build-command.json`);assert.equal(build.exitCode,0);assert.equal(build.head,freeze);
const staticChecks=json(`${raw}/static-commands.json`);assert.equal(staticChecks.length,3);assert(staticChecks.every(item=>item.exitCode===0));
const dist="packages/rpgmaker-event-dsl/dist",builtArtifacts=fs.readdirSync(dist,{recursive:true,withFileTypes:true}).filter(item=>item.isFile()).map(item=>{const file=path.join(item.parentPath,item.name).replaceAll("\\","/"),bytes=read(file);return{path:file,bytes:bytes.length,sha256:sha(bytes)};});assert.equal(builtArtifacts.length,15);
const nodeModules=fs.realpathSync("node_modules/.pnpm");assert(nodeModules.toLowerCase().startsWith(process.cwd().toLowerCase()));
const rawFiles=fs.readdirSync(raw,{recursive:true,withFileTypes:true}).filter(item=>item.isFile()).map(item=>{const file=path.join(item.parentPath,item.name).replaceAll("\\","/"),bytes=read(file);return{path:file,bytes:bytes.length,sha256:sha(bytes),gitBlob:blob(bytes)};}).sort((a,b)=>a.path.localeCompare(b.path));
const evidence={schemaVersion:1,kind:"ticket17-legacy-regression-support",status:"narrow-repair-verified-not-final-acceptance",baseIntegration:base,implementationRevision:freeze,compileContractVersion:"mv-1.6.1/40",productBehaviorChanged:false,contractBumped:false,
 scope:{originalFailures:6,deadlineFailures:5,currentExpectationCompatibility:1,selectedCallbacksPerEntry:22,freshHelpersPerEntry:21,canonicalIdsAdded:0,defaultWorkers:2,globalTimeoutChanged:false,globalEntryOverride:false,ticket17RemainsClaimed:true,
  notExecuted:"No repeat of whole103 source files or42 Windows-baseline files. Final17 must rerun exact three commands at its new freeze; support does not resolve17 or certify1195 canonical/14 native obligations."},
 originalRed:red,originalVersusHelper:"Natural full runner is authoritative:103files97passed6failed;3409tests3403passed6failed. Five eventually-passed helpers do not make failed runner tests pass. Current38 expectation failed before writing23; historical23 assertions were not reached in red.",
 budgets:[{scope:"Picture007",from:10000,to:30000,work:"15-carrier Map/Troop/Common workflow; four evaluated Definition Sources; Check, two normal Compiles, Diff, Push; complete pre/post carriers; sandbox cleanup and full provenance."},
 {scope:"INPUT003 all15 reference-helper parameters",from:10000,to:30000,work:"Each equal-shape parameter executes Discovery/evaluation, Check/Compile/Diff/Push, all15 data/Snapshot comparisons, two independent malformed sources with Check/Compile plus stale Diff/Push and complete state, cleanup/provenance."},
 {scope:"AUDIO002 all3 bounded malformed batches",from:30000,to:60000,work:"23 original inputs remain8/8/7. Each full batch has16 Check/Compile,8 stale Push,32 complete states plus setup and initial Compile; all evidence finalization retained."},
 {scope:"MOVEMENT003",from:30000,to:60000,work:"Seven malformed movement instructions;14 Check/Compile calls and14 before/after complete states; setup, initial Compile, final-state evidence and cleanup."},
 {scope:"SCREEN002",from:30000,to:90000,work:"16 original malformed Screen inputs;32 Check/Compile,16 stale Push and32 complete states; setup/initial Compile, cleanup and provenance."}],
 budgetMeaning:"Finite per-case/group budgets for complete integration wrappers under normal two-worker execution. No product performance repair, timing SLA, hidden phase cost attribution, skipped input, weakened assertion or global budget increase.",
 currentContractCompatibility:"Only final-review current expectation,title,sandbox38->40. Explicit old23 and all stale/fresh/Check-no-upgrade assertions remain unchanged;16 CURRENT40 unchanged.",
 evidenceCollectionRepairs:"Source runner passed22, then original PowerShell helper filter compared deserialized DateTime to raw ISO strings and wrongly selected0. UTC parsing copied the21 retained JSONs without test rerun. First UTC copy also corrected Movement Windows backslash entry matching. Aggregate initially assumed Picture helper expected included its ID; actual Picture stores its description separately, so matching now combines the unchanged requirementId and expected fields. Original error summaries/types/comparison and first-name-assumption builder retained. No raw receipt or runner result was changed.",
 preservation,productSourceTree:preservation.productTree,gitInputs:inputs,build,builtArtifacts,staticChecks,executions,helpers,rawFiles,
 environment:{platform:process.platform,node:process.version,nodeExecutable:process.execPath,worktree:process.cwd(),TEMP:process.env.TEMP,TMP:process.env.TMP,independentPnpmVirtualStore:nodeModules,frozenLockInstall:true,workerOverride:null,globalEntryOverride:null},
 nativeExecution:"No native MV execution; these are legacy public Workspace API/actual CLI test boundaries. Original native and functional evidence remains owned by01–16 and17 independent audit."};
fs.writeFileSync(`${root}/acceptance.json`,JSON.stringify(evidence,null,2)+"\n");
console.log(JSON.stringify({freeze,selected:executions.map(item=>item.report),helpers:helpers.length,rawFiles:rawFiles.length,gitInputs:inputs.length,builtArtifacts:15},null,2));
