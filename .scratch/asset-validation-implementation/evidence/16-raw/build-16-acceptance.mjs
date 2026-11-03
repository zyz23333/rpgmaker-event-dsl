// Evidence assembly and integrity checks only. No product recovery/policy imports.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, writeFile, readdir, lstat, readlink } from "node:fs/promises";
import { resolve, join, relative } from "node:path";
import { tmpdir } from "node:os";

const root = resolve(import.meta.dirname, "../../../..");
const history = import.meta.dirname;
const freeze = "f03e66e6e4550da8a72f98c118fbc36c3af4d1d5";
const integration = "5aab331ae7bf1f3d038a0fb7a595087b5d09156a";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const json = async path => JSON.parse((await readFile(path, "utf8")).replace(/^\uFEFF/u,""));
const save = async (path,value) => writeFile(path,JSON.stringify(value,null,2)+"\n");
const git = (...args) => execFileSync("git",args,{cwd:root});
git("merge-base","--is-ancestor",integration,freeze);

const firstPlanPath = "M:/Shuen/Codex/asset-validation-notes/planned-acceptance-ids-12-16.json";
const finalPlanPath = "M:/Shuen/Codex/asset-validation-notes/final-canonical-id-plan.json";
const firstPlan = await json(firstPlanPath), finalPlan = await json(finalPlanPath);
const ids = [...firstPlan.tickets["16"].primaryIds].sort();
if(ids.length!==12 || new Set(ids).size!==12 || JSON.stringify(ids)!==JSON.stringify([...finalPlan.perTicket["16"].primaryIds].sort())) throw new Error("Independent 12-ID plans disagree");
const registration = await json(join(history,"16-registration-verified.json"));
if(JSON.stringify(registration.ids)!==JSON.stringify(ids) || registration.declarations.length!==11) throw new Error("Registration does not match independent plans");
const sourcePaths = [
  "packages/rpgmaker-event-dsl/test/asset-recovery-workspace.test.ts",
  "packages/rpgmaker-event-dsl/test/support/asset-recovery-workspace.ts",
  "packages/rpgmaker-event-dsl/test/support/asset-push-workspace.ts",
  "packages/rpgmaker-event-dsl/test/support/workspace-operation-child.mjs",
  "packages/rpgmaker-event-dsl/test/support/workspace-operation-process.ts",
  "packages/rpgmaker-event-dsl/test/support/windows-sandbox.ts",
  "packages/rpgmaker-event-dsl/src/workspace/push.ts",
  "packages/rpgmaker-event-dsl/src/workspace/push-recovery.ts",
  "packages/rpgmaker-event-dsl/src/workspace/state.ts",
  "packages/rpgmaker-event-dsl/src/workspace/type-inputs.ts",
  "packages/rpgmaker-event-dsl/vitest.windows.config.ts",
  "packages/rpgmaker-event-dsl/test/push-recovery.test.ts",
  "packages/rpgmaker-event-dsl/test/snapshot-binding.test.ts",
  "packages/rpgmaker-event-dsl/test/workspace-locking.test.ts",
  "packages/rpgmaker-event-dsl/test/compile-inputs.test.ts",
  "packages/rpgmaker-event-dsl/test/push-drift.test.ts",
];
const sourceInputs = [];
for(const path of sourcePaths) {
  const bytes = await readFile(join(root,path)), committed = git("show",`${freeze}:${path}`);
  if(sha(bytes)!==sha(committed)) throw new Error(`Worktree differs from frozen Git bytes: ${path}`);
  sourceInputs.push({path,bytes:bytes.length,sha256:sha(bytes),gitRevision:freeze,gitBlobSha256:sha(committed)});
}
const testSha = sourceInputs[0].sha256;
if(registration.sourceSha256!==testSha) throw new Error("Static registration used a different source");
const productDiff = git("diff","--name-only",integration,freeze,"--","packages/rpgmaker-event-dsl/src").toString().trim();
if(productDiff) throw new Error("Unexpected product change; baseline-green claim needs revision");

const matrices = [], receipts = [];
for(const entry of ["source","built"]) {
  const reportName = `16-${entry}-final.json`, report = await json(join(history,reportName));
  const actual = report.testResults.flatMap(suite=>suite.assertionResults).filter(test=>test.status==="passed").map(test=>test.fullName.split(":")[0]).sort();
  if(report.numPassedTests!==12 || report.numTotalTests!==12 || report.numFailedTests!==0 || report.numPendingTests!==0 || JSON.stringify(actual)!==JSON.stringify(ids)) throw new Error(`Incomplete/duplicate/filtered ${entry} final matrix`);
  matrices.push({entry,report:reportName,passed:12,failed:0,filteredNotPassing:0,ids:actual});
  for(const id of ids) {
    const path = join(root,"test-results/asset-validation",`${id}.${entry}.json`), receipt = await json(path);
    if(receipt.id!==id || receipt.status!=="passed" || receipt.ownerTicket!=="16" || receipt.entry!==entry || receipt.environment.platform!=="win32" || !receipt.environment.node.startsWith("v22.") || receipt.expected.sha256!==testSha) throw new Error(`Invalid receipt: ${id}/${entry}`);
    receipts.push({id,entry,receiptSha256:sha(await readFile(path)),receipt});
  }
}
const compatibility = [];
for(const entry of ["source","built"]) {
  const name = `16-compatibility-${entry}.json`, report = await json(join(history,name));
  const assertions = report.testResults.flatMap(suite=>suite.assertionResults);
  if(report.numPassedTests!==86 || report.numTotalTests!==86 || report.numFailedTests!==0 || report.numPendingTests!==0 || report.testResults.length!==5 || assertions.some(test=>test.status!=="passed")) throw new Error(`Incomplete ${entry} compatibility run`);
  compatibility.push({entry,report:name,passed:86,failed:0,filteredNotPassing:0,suites:report.testResults.map(suite=>relative(root,suite.name).split(/[/\\]/u).join("/")),cases:assertions.map(test=>test.fullName)});
}

const focused = [];
const focusedDraftSha = sha(await readFile(join(history,"16-focused-first-assertions.ts.txt")));
for(let index=1;index<=12;index++) {
  const prefix = index<=8 ? "16-focused" : "16-registered-retry";
  const name = `${prefix}-${String(index).padStart(2,"0")}-source`;
  const report = await json(join(history,name+".json"));
  const passed = report.testResults.flatMap(suite=>suite.assertionResults).filter(test=>test.status==="passed");
  const receipt = await json(join(history,name+"-receipt.json"));
  if(report.numPassedTests!==1 || report.numFailedTests!==0 || report.numTotalTests!==12 || report.numPendingTests!==11 || passed.length!==1 || passed[0].fullName.split(":")[0]!==receipt.id || receipt.status!=="passed") throw new Error(`Focused run did not actually execute once: ${name}`);
  if(receipt.expected.sha256!==(index<=8?focusedDraftSha:testSha)) throw new Error(`Focused assertion source archive differs: ${name}`);
  focused.push({report:name+".json",receipt:name+"-receipt.json",id:receipt.id,passed:1,filteredNotPassing:11});
}
if(JSON.stringify(focused.map(run=>run.id).sort())!==JSON.stringify(ids)) throw new Error("Focused 12-ID execution union is incomplete");

async function capture(directory) {
  const files = {};
  async function walk(path,prefix="") {
    for(const entry of await readdir(path,{withFileTypes:true})) {
      if(entry.name==="node_modules" || entry.name==="operation.lock") continue;
      const absolute = join(path,entry.name), key = prefix+entry.name, info = await lstat(absolute);
      if(info.isSymbolicLink()) files[key]={link:await readlink(absolute)};
      else if(info.isDirectory()) { files[key+"/"]={directory:true}; await walk(absolute,key+"/"); }
      else files[key]={base64:(await readFile(absolute)).toString("base64")};
    }
  }
  await walk(directory); return files;
}
const failedSandboxes = [];
const sandboxParent = join(tmpdir(),"rpgmaker-event-dsl-windows");
for(const entry of await readdir(sandboxParent,{withFileTypes:true})) {
  if(!entry.isDirectory() || !entry.name.startsWith("asset-recovery-")) continue;
  const path = join(sandboxParent,entry.name);
  const processPath = join(path,"process-results.json"), processes = await json(processPath).catch(()=>null);
  if(processes?.completed===false || processes===null) failedSandboxes.push({originalSandbox:path,processes,processRecordAvailability:processes===null?"Unavailable; no process-results file existed at capture":"Original real sandbox finalization record",postFailureInputAndState:await capture(path)});
}
await save(join(history,"16-failed-attempt-inputs.json"),{scope:"Actual retained failed temporary sandboxes, not reconstructed expected states; directory junctions recorded without traversal",attempts:failedSandboxes});
for(const [receiptName,sourceName] of [["16-slice01-failed-receipt.json","16-slice01-test.ts.txt"],["16-focused-09-failed-receipt.json","16-focused-first-assertions.ts.txt"]]) {
  const receipt = await json(join(history,receiptName));
  if(receipt.status!=="failed" || receipt.expected.sha256!==sha(await readFile(join(history,sourceName)))) throw new Error(`Failed assertion source is not authentic: ${receiptName}`);
}

const runnerHistory = [];
for(const name of (await readdir(history)).filter(name=>name.endsWith(".json") && !name.includes("failed-attempt-inputs"))) {
  const report = await json(join(history,name));
  if(!report.testResults) continue;
  runnerHistory.push({path:name,passed:report.numPassedTests,failed:report.numFailedTests,filteredNotPassing:report.numPendingTests,executionClassification:report.numPassedTests===0&&report.numFailedTests===0?"zero-execution-filtered-report; not a pass":report.numFailedTests>0?"actual failed execution; preserved":"actual successful assertions; filtered registrations not passing",failedCases:report.testResults.flatMap(suite=>suite.assertionResults).filter(test=>test.status==="failed").map(test=>({name:test.fullName,failureMessages:test.failureMessages}))});
}
const artifacts = [];
for(const name of ["index.mjs","index.d.mts","workspace-api.mjs","workspace-api.d.mts","cli.mjs"]){
  const path = `packages/rpgmaker-event-dsl/dist/${name}`, bytes = await readFile(join(root,path));
  artifacts.push({path,bytes:bytes.length,sha256:sha(bytes)});
}
const authority = [];
for(const path of [".scratch/asset-validation/asset-validation-spec.md",".scratch/asset-validation/acceptance-matrix.md",".scratch/asset-validation/implementation-acceptance-cases.md","docs/adr/0006-interrupted-push-recovery.md","docs/adr/0013-bind-generated-data-to-compilation-assumptions.md","docs/adr/0019-asset-checks-at-workflow-boundaries.md"])
  authority.push({path,sha256:sha(await readFile(join(root,path)))});
const independentPlan = {
  status:"independent preimplementation expectations; not executions",
  first:{path:firstPlanPath,sha256:sha(await readFile(firstPlanPath))},
  final:{path:finalPlanPath,sha256:sha(await readFile(finalPlanPath))},
  ids,
  cases:firstPlan.cases.filter(entry=>ids.includes(entry.id)),
  stateProfiles:firstPlan.stateProfiles,
  invariantContracts:firstPlan.invariantContracts,
};
await save(join(history,"16-independent-plan.json"),independentPlan);
const aggregate = {
  schemaVersion:1,ticket:"16",status:"verified",integrationBase:integration,assertionFreeze:freeze,
  productBehaviorChange:false,compileContractVersion:"mv-1.6.1/39",baselineGreen:"All final required branches already satisfy the product contract; changes add independent Workspace/CLI verification, Windows include and documentation only.",
  authority,independentPlan,sourceInputs,builtArtifacts:artifacts,executionInputs:await json(join(history,"16-execution-inputs.json")),finalRunTimeline:await json(join(history,"16-final-run-timeline.json")),
  matrices,receipts,focused,compatibility,runnerHistory,
  failureHistory:{productContractFailures:0,actualTestPreparationFailures:[{report:"16-slice01-source.json",reason:"Test expected only backup file keys but the complete observer also represents the backup directory; corrected file-list assertion; product unchanged",authenticSource:"16-slice01-test.ts.txt",helperSource:"16-slice01-helper.ts.txt",receipt:"16-slice01-failed-receipt.json"},{report:"16-focused-09-source.json",reason:"Test omitted legitimate pre-pending data staging from the owner observation. Corrected exact two-N-file staging expectation, retained O live bytes and owner-death orphan evidence; product unchanged",authenticSource:"16-focused-first-assertions.ts.txt",helperSource:"16-focused-first-helper.ts.txt",receipt:"16-focused-09-failed-receipt.json"}],registrationMistake:{source:"16-registration-before-repair.ts.txt",repair:"repair-16-registration.mjs",description:"Draft callbacks were nested in the first test; initial03–10 selected no tests and produced zero actual passes. Exit0 was initially misread and explicitly corrected. Those reports remain zero-execution history. Static AST check now proves 11 top-level declarations, 12 unique expanded IDs, zero nested declarations; both independent plans and actual complete matrices are checked."},runnerInvocationMistake:{log:"16-built-invocation-error.log",script:"run-16-final-first-invocation.ps1.txt",description:"PowerShell inline arrays became one config argument. Vitest rejected option parsing before tests, so no test-result JSON exists. Correct array splatting ran the final built matrix; no source/product change."},failedSandboxInputs:"16-failed-attempt-inputs.json",retainedSandboxCount:failedSandboxes.length},
  scopeLimits:["Source/built are receipt axes, not extra canonical IDs","12 historical-policy goldens prove schema/hash structure only; runtime historical fixtures here are explicitly synthetic real temporary roots with actual O/N bytes","Current-config W16 uses current contract39 before changing one valid policy; stale contract is isolated in the other callback","One current asset pass per normal Push; no media hashing, postwrite scan or current freshness precondition added to historical recovery","No native editor/runtime IDs belong to ticket16; no native execution or final17 audit claimed","Related old suites only; no redundant unrelated F/D matrices run"],
};
await save(join(root,".scratch/asset-validation-implementation/evidence/16-recovery-acceptance.json"),aggregate);

const manifest = [];
async function list(directory,prefix="") {
  for(const entry of (await readdir(directory,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))) {
    const path = join(directory,entry.name), name = prefix+entry.name;
    if(entry.isDirectory()) await list(path,name+"/");
    else if(name!=="manifest.json") { const bytes = await readFile(path); manifest.push({path:name,bytes:bytes.length,sha256:sha(bytes)}); }
  }
}
await list(history);
await save(join(history,"manifest.json"),{scope:"Original runner, receipts, source archives, failed sandbox bytes and builder; -text attributes preserve exact Git bytes",assertionFreeze:freeze,files:manifest});
console.log(JSON.stringify({uniqueCanonicalIds:ids.length,finalReceipts:receipts.length,source:matrices[0],built:matrices[1],oldSource:compatibility[0].passed,oldBuilt:compatibility[1].passed,rawFiles:manifest.length,actualFailedSandboxes:failedSandboxes.length}));
