// Evidence assembly only. Expected identities are copied from the independent
// preimplementation plan; product collectors/policy functions are never imported.
import { createHash } from "node:crypto";
import { readFile, writeFile, readdir, lstat, readlink } from "node:fs/promises";
import { resolve, join, relative } from "node:path";
import { tmpdir } from "node:os";

const root = resolve(import.meta.dirname, "../../../..");
const history = import.meta.dirname;
const sha = (value) => createHash("sha256").update(value).digest("hex");
const json = async (path) => JSON.parse(await readFile(path, "utf8"));
const save = async (path, value) => writeFile(path, JSON.stringify(value, null, 2) + "\n");
// Git requires LF for evidence text. Keep the exact original PowerShell bytes as
// base64 before normalizing, then hash the text that is actually stored in Git.
const originalTextPath=join(history,"13-original-text-bytes.json");
const originalText=await json(originalTextPath).catch(()=>[]);
for(const name of await readdir(history)) {
  if(!/\.(log|json)$/u.test(name)||name==="13-original-text-bytes.json") continue;
  const path=join(history,name);const bytes=await readFile(path);
  if(!bytes.includes(Buffer.from("\r\n"))) continue;
  const normalized=Buffer.from(bytes.toString("utf8").replaceAll("\r\n","\n"));
  if(!originalText.some(entry=>entry.name===name&&entry.originalSha256===sha(bytes)))
    originalText.push({name,originalBytes:bytes.length,originalSha256:sha(bytes),originalBase64:bytes.toString("base64"),gitNormalizedSha256:sha(normalized),reason:"Repository text attributes normalize CRLF to LF; original byte stream retained independently"});
  await writeFile(path,normalized);
}
await save(originalTextPath,originalText);
const planPath = "M:/Shuen/Codex/asset-validation-notes/planned-acceptance-ids-12-16.json";
const originalPlan = await json(planPath);
const related = [
  "AV.C03.repeated-command.formal.image.expected",
  "AV.C03.repeated-command.formal.se.expected",
  "AV.C13.check-success.formal.case.expected",
  "AV.C13.check-failure.formal.case.expected",
];
const ids = [...originalPlan.tickets["13"].primaryIds, ...related].sort();
if (ids.length !== 67 || new Set(ids).size !== 67) throw new Error("Independent plan is not 67 unique IDs");
const finalPlanPath="M:/Shuen/Codex/asset-validation-notes/final-canonical-id-plan.json";
const finalPlan=await json(finalPlanPath);
if(JSON.stringify([...finalPlan.perTicket["13"].primaryIds].sort())!==JSON.stringify(ids)) throw new Error("Final independent authority differs from original13 expansion");
const plan = {
  status: "independent-plan-not-execution",
  original: { path: planPath, sha256: sha(await readFile(planPath)) },
  finalIndependentConfirmation:{path:finalPlanPath,authorityRevision:finalPlan.authorityRevision,sha256:sha(await readFile(finalPlanPath)),primaryIds:finalPlan.perTicket["13"].primaryIds},
  authority: [".scratch/asset-validation/asset-validation-spec.md", ".scratch/asset-validation/acceptance-matrix.md", ".scratch/asset-validation/implementation-acceptance-cases.md"],
  invariantContracts: originalPlan.invariantContracts,
  stateProfiles: originalPlan.stateProfiles,
  cases: originalPlan.cases.filter((entry) => ids.includes(entry.id)),
  relatedC: related.map((id) => ({ id, source: ".scratch/asset-validation/implementation-acceptance-cases.md C03/C13", status: "planned-not-executed", expected: id.includes("C03") ? "Two real repeated commands retain two defining uses and independent mirror locations on new Check/Compile commands; counts do not accumulate" : "Check retains original external necessary names, custom/unknown fields and every persistent state carrier without media copying, backup or writes" })),
  ids,
};
await save(join(history, "13-independent-plan.json"), plan);

const entries = [];
const matrices = [];
for (const entry of ["source", "built"]) {
  const reportName = `13-${entry}-final-composed.json`;
  const report = await json(join(history, reportName));
  const passed = report.testResults.flatMap((suite) => suite.assertionResults).filter((test) => test.status === "passed").map((test) => test.fullName.split(":")[0]).sort();
  if (JSON.stringify(passed) !== JSON.stringify(ids) || report.numFailedTests !== 0) throw new Error(`Incomplete/duplicate ${entry} matrix`);
  matrices.push({entry, report:reportName, passed:passed.length, filteredNotPassing:report.numPendingTests, failed:report.numFailedTests});
  for (const id of ids) {
    const path = join(root, "test-results/asset-validation", `${id}.${entry}.json`);
    const receipt = await json(path);
    if (receipt.id !== id || receipt.entry !== entry || receipt.status !== "passed" || receipt.environment.platform !== "win32" || !receipt.environment.node.startsWith("v22.")) throw new Error(`Bad receipt ${path}`);
    if (receipt.expected.sha256 !== sha(await readFile(join(root,receipt.expected.assertionsSource)))) throw new Error(`Receipt source differs from final artifact: ${id}/${entry}`);
    entries.push({ id, entry, originalReceiptSha256:sha(await readFile(path)), receipt });
  }
}

// Retain inputs and process records of the real failed sandbox attempts. Junctions
// are recorded as links; dependency junctions are never recursively traversed.
async function capture(path) {
  const result = {};
  async function walk(directory, prefix = "") {
    for (const item of await readdir(directory,{withFileTypes:true})) {
      if (item.name === "node_modules" || item.name === "operation.lock") continue;
      const absolute=join(directory,item.name); const key=prefix+item.name;
      if ((await lstat(absolute)).isSymbolicLink()) result[key]={link:await readlink(absolute)};
      else if (item.isDirectory()) {result[key+"/"]={directory:true};await walk(absolute,key+"/");}
      else result[key]={base64:(await readFile(absolute)).toString("base64")};
    }
  }
  await walk(path);return result;
}
const failedInputs=[];
const sandboxParent=join(tmpdir(),"rpgmaker-event-dsl-windows");
for(const entry of await readdir(sandboxParent,{withFileTypes:true})) {
  if(!entry.isDirectory()||!entry.name.startsWith("asset-workflow-")) continue;
  const path=join(sandboxParent,entry.name);
  const result=await json(join(path,"process-results.json")).catch(()=>null);
  if(result?.completed===false || result===null) failedInputs.push({originalSandbox:path,processes:result,processRecordStatus:result===null?"No process-results written before failed runner termination; original timeout report retained":"Original sandbox finalization record",retainedInputAndState:await capture(path)});
}
await save(join(history,"13-failed-attempt-inputs.json"),{scope:"Actual failed attempts retained by Windows sandbox; post-failure bytes and original process records, never reconstructed expected state",attempts:failedInputs});

const runs=[];
for(const name of (await readdir(history)).filter(name=>name.endsWith(".json")&&!name.includes("independent-plan")&&!name.includes("failed-attempt")&&!name.includes("manifest"))) {
  const report=await json(join(history,name));
  if(report.testResults) runs.push({path:name,passed:report.numPassedTests,failed:report.numFailedTests,filteredNotPassing:report.numPendingTests,failedCases:report.testResults.flatMap(suite=>suite.assertionResults).filter(test=>test.status==="failed").map(test=>({name:test.fullName,failureMessages:test.failureMessages}))});
}
const inputPaths=[
  ...plan.authority,"packages/rpgmaker-event-dsl/README.md","packages/rpgmaker-event-dsl/vitest.windows.config.ts","packages/rpgmaker-event-dsl/test/asset-workflow-workspace.test.ts","packages/rpgmaker-event-dsl/test/asset-image-workspace.test.ts","packages/rpgmaker-event-dsl/test/asset-media-workspace.test.ts","packages/rpgmaker-event-dsl/test/support/workspace-operation-child.mjs","packages/rpgmaker-event-dsl/test/support/workspace-operation-process.ts","packages/rpgmaker-event-dsl/test/support/asset-evidence.ts","packages/rpgmaker-event-dsl/dist/cli.mjs","packages/rpgmaker-event-dsl/dist/workspace-api.mjs","packages/rpgmaker-event-dsl/dist/index.d.mts",
];
const executionInputs=await Promise.all(inputPaths.map(async path=>({path,sha256:sha(await readFile(join(root,path)))})));
await save(join(history,"13-execution-inputs.json"),executionInputs);
const compatibility=[];
for(const entry of ["source","built"]) {
  const path=`13-${entry}-compatibility.json`;const report=await json(join(history,path));
  if(report.numPassedTests!==299||report.numFailedTests!==0||report.numPendingTests!==0||report.testResults.length!==8) throw new Error(`Incomplete ${entry} compatibility`);
  compatibility.push({entry,report:path,suites:8,passed:299,failed:0,filtered:0,scope:"Existing compatibility regression; no new acceptance ownership transferred"});
}
const files=await Promise.all((await readdir(history)).filter(name=>name!=="manifest.json").map(async name=>({name,bytes:(await lstat(join(history,name))).size,sha256:sha(await readFile(join(history,name)))})));
await save(join(history,"manifest.json"),{createdAt:new Date().toISOString(),scope:"Original red/failure/final runner outputs and check logs. Filtered cases never count as passing; fixture and test-driver corrections are described in the human evidence.",files});
await save(resolve(history,"../13-workflow-acceptance.json"),{
  schemaVersion:1,ticket:"13",basis:"1f01ba534e5eee1047a1f3cc6665370924707f32",testSourceRevision:"789fef614fae06115ca16f1601ea46704edb8241",historicalRunRevisions:await json(join(history,"13-run-revisions.json")),compileContractVersion:"mv-1.6.1/37",productBehaviorChanged:false,
  scope:{primaryW:63,relatedC:4,totalCanonicalIds:67,requiredEntries:["source","built"],receiptCount:entries.length,actualCliIdsPerEntry:12},
  independentPlan:plan,executionInputs,matrices,compatibility,runs,
  stateObserverScope:"Exact config/source/self-authored type input/package/public index bytes; whole Project Root and .rpgmaker-event-dsl trees excluding retained zero-byte kernel operation.lock during a live lease. Other rebound root compared separately. Existing compile-inputs and publication suites verify broader TypeScript lookup/input mutation protections.",
  allowedDecompilationStateChange:"Only the normal empty decompile-candidates/ directory plus published DSL source; Snapshot/Manifest/generated authority unchanged",
  reportLimit:"Only ticket13 identities are accepted here. Push/pending/recovery families owned by14-16 remain unclaimed; existing compatibility regression is not acceptance ownership transfer.",
  entries,
});
process.stdout.write(JSON.stringify({canonicalIds:ids.length,receipts:entries.length,matrices,retainedFailedAttempts:failedInputs.length})+"\n");
