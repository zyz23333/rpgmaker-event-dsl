// Evidence assembly only. It imports no product collector, matcher, or policy.
import { createHash } from "node:crypto";
import { readFile, writeFile, readdir, mkdir, lstat, readlink, copyFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const root=resolve(import.meta.dirname,"../../../..");
const history=import.meta.dirname;
const notes="M:/Shuen/Codex/asset-validation-notes";
const implementationRevision="7e6970f61cfc29dd7f58d16c220cfc73d16332d5";
const sha=value=>createHash("sha256").update(value).digest("hex");
const json=async path=>JSON.parse((await readFile(path,"utf8")).replace(/^\uFEFF/u,""));
const save=async(path,value)=>writeFile(path,JSON.stringify(value,null,2)+"\n");
await mkdir(history,{recursive:true});
for(const name of await readdir(notes))
  if(name!=="ticket14-evidence-assembly.log"&&(/^ticket14-.*\.(?:log|json)$/u.test(name)||/^run-ticket14-.*\.ps1$/u.test(name)))
    await copyFile(join(notes,name),join(history,name));

// Repository text is LF. Preserve each actual original stream independently
// before normalization so its bytes and whitespace remain recoverable.
const originalText=[];
for(const name of await readdir(history)){
  if(!/\.(?:log|json|ps1)$/u.test(name)||name==="14-original-text-bytes.json")continue;
  const path=join(history,name),bytes=await readFile(path);
  if(!bytes.includes(Buffer.from("\r\n")))continue;
  const normalized=Buffer.from(bytes.toString("utf8").replaceAll("\r\n","\n"));
  originalText.push({name,originalBytes:bytes.length,originalSha256:sha(bytes),originalBase64:bytes.toString("base64"),gitNormalizedSha256:sha(normalized)});
  await writeFile(path,normalized);
}
await save(join(history,"14-original-text-bytes.json"),originalText);

const finalPlanPath=join(notes,"final-canonical-id-plan.json"),originalPlanPath=join(notes,"planned-acceptance-ids-12-16.json");
const finalPlan=await json(finalPlanPath),originalPlan=await json(originalPlanPath);
const ids=[...finalPlan.perTicket["14"].primaryIds].sort();
if(ids.length!==30||new Set(ids).size!==30)throw new Error("Expected thirty unique independently planned primary IDs");
const previous=[...originalPlan.tickets["14"].primaryIds,"AV.C13.push-success.formal.case.expected"].sort();
if(JSON.stringify(previous)!==JSON.stringify(ids))throw new Error("Independent primary expansions disagree");
const plan={status:"independent-plan-not-an-execution-result",authorityRevision:finalPlan.authorityRevision,finalPlan:{path:finalPlanPath,sha256:sha(await readFile(finalPlanPath))},originalPlan:{path:originalPlanPath,sha256:sha(await readFile(originalPlanPath))},primaryIds:ids,supportingIds:finalPlan.perTicket["14"].supportingIds,cases:originalPlan.cases.filter(item=>ids.includes(item.id)),c13:{id:"AV.C13.push-success.formal.case.expected",expected:"Only existing owned data may change; external necessary fields, names and custom fields are preserved; media never enters Snapshot, backup, copying or writes."},invariantContracts:originalPlan.invariantContracts,stateProfiles:originalPlan.stateProfiles};
await save(join(history,"14-independent-plan.json"),plan);

const matrices=[],entries=[],supporting=[];
for(const entry of ["source","built"]){
  const reportName=`ticket14-${entry}-final-serial.json`,report=await json(join(history,reportName));
  const tests=report.testResults.flatMap(suite=>suite.assertionResults),primary=tests.filter(test=>test.fullName.startsWith("AV.")&&test.status==="passed").map(test=>test.fullName.split(":")[0]).sort();
  if(JSON.stringify(primary)!==JSON.stringify(ids)||report.numPassedTests!==34||report.numFailedTests!==0||report.numPendingTests!==0)throw new Error(`Incomplete ${entry} final matrix`);
  matrices.push({entry,report:reportName,primaryPassed:30,supplementalPassed:4,totalPassed:34,filteredNotPassing:0,failed:0});
  for(const id of ids){
    const path=join(root,"test-results/asset-validation",`${id}.${entry}.json`),receipt=await json(path);
    if(receipt.id!==id||receipt.entry!==entry||receipt.status!=="passed"||receipt.environment.platform!=="win32"||!receipt.environment.node.startsWith("v22."))throw new Error(`Invalid receipt ${id}/${entry}`);
    const disk=await readFile(join(root,receipt.expected.assertionsSource));
    const blob=execFileSync("git",["show",`${implementationRevision}:${receipt.expected.assertionsSource}`],{cwd:root,maxBuffer:8*1024*1024});
    if(receipt.expected.sha256!==sha(disk)||sha(disk)!==sha(blob))throw new Error(`Assertion source differs from frozen Git blob ${id}/${entry}`);
    entries.push({id,entry,originalReceiptSha256:sha(await readFile(path)),receipt});
  }
  const supportName=`ticket14-${entry}-support-serial.json`,supportReport=await json(join(history,supportName));
  if(supportReport.numPassedTests!==1||supportReport.numFailedTests!==0||supportReport.numPendingTests!==64)throw new Error(`Incomplete ${entry} supporting run`);
  const id="AV.W12.next-command-fresh.api.case.expected",receipt=await json(join(history,`ticket14-${entry}-support-receipt.json`));
  if(receipt.status!=="passed"||receipt.ownerTicket!=="13"||receipt.expected.sha256!==sha(await readFile(join(root,receipt.expected.assertionsSource))))throw new Error(`Bad reference-only support receipt ${entry}`);
  supporting.push({id,entry,referenceOnly:true,originalOwnerTicket:"13",registrationUnchanged:true,report:supportName,passed:1,filteredNotPassing:64,receipt,pushProofReferences:["AV.W08.delete-diff-push-repair.api.case.expected","AV.W20.no-historical-report.api.case.expected","AV.W20.generated-roots-and-relations.api.case.expected"]});
}
const compatibility=[];
for(const entry of ["source","built"]){
  const reportName=`ticket14-${entry}-compatibility.json`,report=await json(join(history,reportName));
  if(report.numPendingTests!==0||report.testResults.length!==13)throw new Error(`Incomplete ${entry} compatibility`);
  if(entry==="source"){
    const repairName="ticket14-source-capability-repair.json",repair=await json(join(history,repairName));
    const failed=report.testResults.flatMap(suite=>suite.assertionResults).filter(test=>test.status==="failed").map(test=>test.fullName).sort();
    const repaired=repair.testResults.flatMap(suite=>suite.assertionResults).filter(test=>test.status==="passed").map(test=>test.fullName).sort();
    if(report.numPassedTests!==474||report.numFailedTests!==2||repair.numPassedTests!==2||repair.numFailedTests!==0||repair.numPendingTests!==169||JSON.stringify(failed)!==JSON.stringify(repaired))throw new Error("Source setup failures were not exactly repaired");
    compatibility.push({entry,reports:[reportName,repairName],suites:13,passedUnique:476,initialPassed:474,initialSetupFailures:2,repairPassed:2,repairFilteredNotPassing:169,unresolvedFailures:0,scope:"Existing regression checks only; two unchanged F03 case-coexistence callbacks rerun on capable default C TEMP after M fsutil access denial. No acceptance ownership transferred."});
  }else{
    if(report.numFailedTests!==0||report.numPassedTests!==476)throw new Error("Incomplete built compatibility");
    compatibility.push({entry,report:reportName,suites:13,passed:476,failed:0,filtered:0,scope:"Existing regression checks on default capable C TEMP; no acceptance ownership transferred"});
  }
}

async function capture(directory){
  const result={};
  async function walk(path,prefix=""){
    for(const entry of await readdir(path,{withFileTypes:true})){
      if(entry.name==="node_modules"||entry.name==="operation.lock")continue;
      const absolute=join(path,entry.name),key=prefix+entry.name;
      if((await lstat(absolute)).isSymbolicLink())result[key]={link:await readlink(absolute)};
      else if(entry.isDirectory()){result[key+"/"]={directory:true};await walk(absolute,key+"/");}
      else result[key]={base64:(await readFile(absolute)).toString("base64")};
    }
  }
  await walk(directory);return result;
}
const failedInputs=[];
for(const parent of await readdir(notes,{withFileTypes:true})){
  if(!parent.isDirectory()||!/^ticket14-.*workspaces$/u.test(parent.name))continue;
  for(const sandbox of await readdir(join(notes,parent.name),{withFileTypes:true})){
    if(!sandbox.isDirectory())continue;
    const directory=join(notes,parent.name,sandbox.name),record=await json(join(directory,"process-results.json")).catch(()=>null);
    if(record?.completed===false||record===null)failedInputs.push({originalSandbox:directory,processRecord:record,processRecordStatus:record===null?"Unavailable after interrupted attempt; not synthesized":"Original finalization record",retainedInputAndState:await capture(directory)});
  }
}
await save(join(history,"14-failed-attempt-inputs.json"),{scope:"Original post-failure sandbox bytes, source/data/config/state and process records; not reconstructed expected states",attempts:failedInputs});

const inputPaths=[".scratch/asset-validation/asset-validation-spec.md",".scratch/asset-validation/acceptance-matrix.md",".scratch/asset-validation/implementation-acceptance-cases.md","packages/rpgmaker-event-dsl/README.md","packages/rpgmaker-event-dsl/src/workspace/push.ts","packages/rpgmaker-event-dsl/src/workspace/config.ts","packages/rpgmaker-event-dsl/src/workspace/type-inputs.ts","packages/rpgmaker-event-dsl/test/asset-push-workspace.test.ts","packages/rpgmaker-event-dsl/test/support/asset-push-workspace.ts","packages/rpgmaker-event-dsl/test/support/asset-push-graph.ts","packages/rpgmaker-event-dsl/test/support/asset-evaluation-child.mjs","packages/rpgmaker-event-dsl/test/support/workspace-operation-child.mjs","packages/rpgmaker-event-dsl/test/support/workspace-operation-process.ts","packages/rpgmaker-event-dsl/vitest.windows.config.ts","packages/rpgmaker-event-dsl/dist/cli.mjs","packages/rpgmaker-event-dsl/dist/workspace-api.mjs","packages/rpgmaker-event-dsl/dist/index.d.mts",...(await readdir(join(root,"packages/rpgmaker-event-dsl/dist"))).filter(name=>/^operations-.*\.mjs$/u.test(name)).map(name=>`packages/rpgmaker-event-dsl/dist/${name}`)];
inputPaths.push("packages/rpgmaker-event-dsl/src/workspace/definitions.ts","packages/rpgmaker-event-dsl/src/workspace-api.ts","packages/rpgmaker-event-dsl/package.json","pnpm-lock.yaml");
const executionInputs=await Promise.all(inputPaths.map(async path=>({path,sha256:sha(await readFile(join(root,path)))})));
await save(join(history,"14-execution-inputs.json"),executionInputs);
const serialRuns=await json(join(history,"ticket14-serial-final-runs.json"));
for(let index=1;index<serialRuns.length;index++)if(serialRuns[index].startedAt<serialRuns[index-1].completedAt)throw new Error("Final scheduled queue was not serial");
const runs=[];
for(const name of (await readdir(history)).filter(name=>name.endsWith(".json"))){
  const report=await json(join(history,name));
  if(report.testResults)runs.push({path:name,passed:report.numPassedTests,failed:report.numFailedTests,filteredNotPassing:report.numPendingTests,failedCases:report.testResults.flatMap(suite=>suite.assertionResults).filter(test=>test.status==="failed").map(test=>({name:test.fullName,failureMessages:test.failureMessages}))});
}
await save(resolve(history,"../14-push-acceptance.json"),{schemaVersion:1,ticket:"14",basis:"81a4284ad674bd4e5f7e607ffd8d7e461bfd2161",implementationRevision,compileContractVersion:"mv-1.6.1/38",scope:{primaryW:29,primaryC:1,totalCanonicalIds:30,requiredEntries:["source","built"],receiptCount:60,actualCliIdsPerEntry:5,supplementalPerEntry:4,supportingReferenceOnlyPerEntry:1},independentPlan:plan,executionInputs,matrices,supporting,compatibility,serialRuns,runs,retainedFailedAttemptCount:failedInputs.length,observerScope:"Whole Project Root and complete workspace state trees, config/source/type dependency/package/public entry bytes; operation.lock skipped only as a kernel lease artifact. No media content reads by product. Rebound root compared independently. Debugger observer uniquely binds actual evaluator first executable statement and proves Compile >0 / normal Push ===0 / unchanged-source Check >0 with no pause, for both source and built.",historyNotes:["Original preparation failure is not a product red. Genuine red cases include missing-asset Push acceptance, changed source/config/generated prewrite authority, no-diff source guard, early not-run omission and duplicated CLI asset-report causes.","Two frozen 34/34 source/built runs had approximately five seconds of runner overlap. Both were valid passes in independent sandboxes; their real timestamps are preserved. An already dispatched same-shell queue completed acceptance and support checks and stopped after two M-volume case-capability setup failures in source regression. A second serial script repaired exactly those cases on capable default C TEMP and ran built regression, without manual process interruption or rewriting the prior timeline.","W12 supporting identity remains the original ticket13 callback and owner. Ticket14 cross-references actual Push W08/W20 proofs; it does not register another W12 callback.","Shared W19 push-failure currently covers ticket14 prewrite failure only. Ticket15 postwrite input failures and ticket16 recovery responsibilities remain unaccepted here."],entries});
const verifiedLinks=[];
for(const path of [resolve(history,"../14-push-acceptance.md"),resolve(history,"../../issues/14-push-generated-asset-preflight.md")]){
  for(const match of (await readFile(path,"utf8")).matchAll(/\]\(([^)]+)\)/gu)){
    const target=match[1].split("#")[0];
    if(!target||/^[a-z]+:/iu.test(target))continue;
    const absolute=resolve(dirname(path),decodeURIComponent(target));
    await lstat(absolute);verifiedLinks.push({source:path,target,exists:true});
  }
}
await save(join(history,"14-local-links.json"),verifiedLinks);
const files=await Promise.all((await readdir(history)).filter(name=>name!=="manifest.json").map(async name=>({name,bytes:(await lstat(join(history,name))).size,sha256:sha(await readFile(join(history,name)))})));
await save(join(history,"manifest.json"),{createdAt:new Date().toISOString(),scope:"Original red/failure/final runner logs, exact original text bytes, failed sandbox input/state, and validation records. Filtered tests never count as passing.",files});
process.stdout.write(JSON.stringify({primary:30,receipts:entries.length,matrices,compatibility,retainedFailedAttempts:failedInputs.length})+"\n");
