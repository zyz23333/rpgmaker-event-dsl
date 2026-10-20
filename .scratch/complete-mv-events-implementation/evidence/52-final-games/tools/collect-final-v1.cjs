'use strict';
// Capture only authored observations and identities; first-party game files stay external.
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {sha,strictJson}=require('./utilities-v1.cjs');
const {descriptors,buildScenario}=require('./scenarios-v1.cjs');
const read=async file=>JSON.parse(await fs.readFile(file,'utf8'));
const artifact=async file=>({path:file,sha256:sha(await fs.readFile(file))});
async function main(){
 const [output,...batches]=process.argv.slice(2);assert.ok(output&&batches.length,'Output and one or more actual completed batch directories required');
 const prep=await read(path.join(__dirname,'preparation-result-v3.json'));
 const contextCorrection=await read(path.join(__dirname,'context-premise-correction-v2.json'));
 for(const dependency of contextCorrection.tools)assert.equal(sha(await fs.readFile(dependency.path)),dependency.sha256,'Corrected context dependency unchanged');
 for(const dependency of prep.dependencies)assert.equal(sha(await fs.readFile(dependency.path)),dependency.sha256,'Prepared dependency unchanged: '+dependency.path);
 const scenarios=new Map();for(const d of descriptors)scenarios.set(d.id,await buildScenario(d));
 const correctedRegistry=require('./scenarios-v3.cjs'),correctedContext=await correctedRegistry.buildScenario(correctedRegistry.descriptors.find(d=>d.id===contextCorrection.id));
 const all=[];
 for(const batch of batches){
  for(const name of(await fs.readdir(batch)).filter(n=>/^result-.*\.json$/.test(n)).sort()){
   const item=await read(path.join(batch,name));
   const pairPath=path.join(item.root,'pair-result.json'),report=await read(pairPath);
   const record={...item,resultArtifact:await artifact(path.join(batch,name)),pairArtifact:await artifact(pairPath),startedAt:report.startedAt,completedAt:report.completedAt,build:{gitHead:report.build.gitHead,apiSha256:report.build.apiSha256,sourceFingerprint:report.build.source.sha256,distFingerprint:report.build.dist.sha256,harnessSha256:report.build.harnessSha256,scenarioSha256:report.build.scenarioSha256,toolNodeSha256:report.build.toolNodeSha256},nativeIdentity:report.nativeIdentity,lifecycle:report.lifecycle,checkStateUnchanged:report.checkStateUnchanged,publication:report.publication,completeCarrierComparison:report.completeCarrierComparison&&{passed:report.completeCarrierComparison.passed,files:report.completeCarrierComparison.files,literalHashes:report.completeCarrierComparison.literalHashes,compiledHashes:report.completeCarrierComparison.compiledHashes},input:await artifact(path.join(item.root,'independent-fixture.json')),sides:{}};
   const fixture=await read(record.input.path);record.savedCarriersSha256=sha(strictJson(fixture.carriers));record.savedCarrierCount=Object.keys(fixture.carriers).length;record.legalVariant=fixture.legalVariant;
   const originalDeclared=prep.inputs.find(i=>i.id===item.id);assert.ok(originalDeclared,item.id);
   const declared=item.id===contextCorrection.id&&record.savedCarriersSha256===contextCorrection.input.carriersSha256?contextCorrection.input:originalDeclared;
   assert.equal(record.savedCarriersSha256,declared.carriersSha256,'Actual saved input must match the explicit original or versioned full carriers: '+item.id);
   assert.equal(record.input.sha256,declared.inputSha256,'Complete executed fixture, loaded expectations and declared oracle match the prepared version');
   record.preparedInput=declared;
   for(const side of ['literal','compiled']){
    const original=report.sides[side];if(!original?.native)continue;
    const native=original.native,runtime=native['runtime-result.json']?.value;
    const observer=await fs.readFile(path.join(original.project,'observer.js'),'utf8'),scenario=declared===contextCorrection.input?correctedContext:scenarios.get(item.id);
    assert.equal(sha(scenario.observer),declared.observerSha256,'Prepared observer identity');assert.ok(observer.endsWith(scenario.observer),'Actual observer retains complete prepared oracle');assert.equal(sha(observer),original.observerSha256,'Actual observer captured before launch');
    record.sides[side]={passed:original.passed,validation:original.validation,native:{startedAt:native.startedAt,completedAt:native.completedAt,launchedPid:native.launchedPid,host:native.host,args:native.args,profile:native.profile,exitCode:native.exitCode,timedOut:native.timedOut,processIdentity:native['runtime-process-identity.json']?.value},runtime:runtime&&{passed:runtime.passed,method:runtime.method,engine:runtime.engine,versions:runtime.versions,expected:runtime.expected,actual:runtime.actual,error:runtime.error,results:runtime.results,checks:runtime.checks,trace:runtime.trace,actions:runtime.actions,transitions:runtime.transitions,control:runtime.control},artifacts:[]};
    for(const name of['observer.js','runtime-result.json','runtime-process-identity.json','native-launch.json','stdout.txt','stderr.txt']){
     const file=path.join(original.project,name);try{record.sides[side].artifacts.push(await artifact(file));}catch(error){if(error.code!=='ENOENT')throw error;}
    }
   }
   record.runtimeComparison=report.runtimeComparison;
   all.push(record);
  }
 }
 const latest=descriptors.map(d=>all.filter(r=>r.id===d.id).sort((a,b)=>Date.parse(b.completedAt)-Date.parse(a.completedAt))[0]);
 assert.ok(latest.every(Boolean),'Every one of the 37 prepared outcomes must have actual recorded execution');
 assert.equal(latest.length,37);
 const expected=latest.filter(r=>r.kind==='original-product-refusal'),native=latest.filter(r=>r.kind==='actual-native-pair');
 assert.equal(expected.length,4);assert.equal(native.length,33);
 for(const item of expected){assert.equal(item.expectedRefusal,true,item.id);assert.equal(item.pairPassed,false);assert.equal(Object.keys(item.sides).length,0,'Original refusal is never native game execution');}
 for(const item of native){assert.equal(item.pairPassed,true,item.id);assert.equal(item.savedCarrierCount,15);assert.equal(item.checkStateUnchanged,true);assert.equal(item.completeCarrierComparison.passed,true);assert.equal(item.runtimeComparison,true);for(const side of['literal','compiled']){assert.equal(item.sides[side].passed,true);for(const value of Object.values(item.sides[side].validation))assert.equal(value,true);}}
 const candidates=await Promise.all(batches.map(b=>read(path.join(b,'candidate.json'))));
 for(const c of candidates){assert.equal(c.gitHead,candidates[0].gitHead);assert.equal(c.workspaceApiSha256,candidates[0].workspaceApiSha256);}
 for(const r of all){assert.equal(r.build.gitHead,candidates[0].gitHead);assert.equal(r.build.apiSha256,candidates[0].workspaceApiSha256);assert.equal(r.build.sourceFingerprint,candidates[0].source.sha256);assert.equal(r.build.distFingerprint,candidates[0].dist.sha256);}
 const originalRoot=path.join(__dirname,'runs/batch-d0600ac1-4dad-4353-b709-c301ba925381'),originalResults=[];
 for(const name of(await fs.readdir(originalRoot)).filter(n=>/^result-.*\.json$/.test(n)).sort()){
  const old=await read(path.join(originalRoot,name)),reportPath=path.join(old.root,'pair-result.json'),oldReport=await read(reportPath);
  assert.equal(old.pairPassed,false);assert.ok(!oldReport.lifecycle.some(s=>s.name.startsWith('native ')),'Original path failure did not launch a game');
  originalResults.push({...old,artifact:await artifact(path.join(originalRoot,name)),pairArtifact:await artifact(reportPath),lifecycle:oldReport.lifecycle});
 }
 const value={formatVersion:1,purpose:'Final52 actual ordinary MV1.6.1/NW.js pairs and explicit original invalid amount refusals',completedAt:new Date().toISOString(),candidate:candidates[0],counts:{outcomes:37,nativePairs:33,nativeProcesses:66,expectedOriginalRefusals:4},allRequiredOutcomesObserved:true,originalRefusalsAreNotNativePairPasses:true,batches,originalPreparationFailure:{batch:originalRoot,interrupted:true,notAComplete37OutcomeRun:true,results:originalResults,log:await artifact(path.join(__dirname,'final37-original-v1.log'))},contextPremiseCorrection:contextCorrection,sourceEditCountCorrection:await read(path.join(__dirname,'full-r2-source-edits-correction-v3.json')),attempts:all,latest:latest.map(r=>({id:r.id,root:r.root,completedAt:r.completedAt})),tooling:await Promise.all(['run-final-v1.cjs','run-final-v2.cjs','run-final-v3.cjs','scenarios-v2.cjs','conditional-scenarios-export-v3.cjs','native-pair-support-v2.cjs','native-pair-support-v3.cjs','collect-final-v1.cjs','path-length-interruption-v1.json','path-length-correction-v2.json','check-r2-source-correction-v3.cjs','full-r2-source-edits-correction-v3.json','check-r2-source-correction-v3.log','final37-original-v2.log','full-r2-affected-rerun-v3.log','run-final-v4.cjs','scenarios-v3.cjs','battle-contexts-v2.cjs','context-premise-correction-v2.json','check-context-correction-v2.cjs','check-context-correction-v2.log','context-affected-rerun-v4.log'].map(n=>artifact(path.join(__dirname,n))))};
 await fs.writeFile(output,strictJson(value,null,2)+'\n',{flag:'wx'});
 console.log(strictJson({output,...value.counts,passed:true}));
}
if(require.main===module)main().catch(e=>{console.error(e.stack);process.exitCode=1;});
module.exports={main};
