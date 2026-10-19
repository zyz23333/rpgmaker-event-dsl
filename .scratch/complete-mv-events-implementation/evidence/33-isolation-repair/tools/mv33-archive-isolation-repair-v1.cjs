'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const assert=require('node:assert/strict');
const isolation=require('./mv33-physical-isolation-v1.cjs');
const repo='C:/Users/Shuen/.codex/worktrees/mv-ticket-33/rpgmaker-event-dsl';
const relative='.scratch/complete-mv-events-implementation/evidence/33-isolation-repair';
async function main(){
  const [r1,r67,l1,l67]=process.argv.slice(2);for(const input of [r1,r67,l1,l67])assert.ok(input);
  const target=path.join(repo,relative);await fs.mkdir(target);
  const records=[];
  async function copy(source,destination){
    const stat=await fs.lstat(source);assert.equal(stat.isFile(),true);assert.equal(stat.isSymbolicLink(),false);assert.equal(stat.nlink,1);
    const bytes=await fs.readFile(source),output=path.join(target,destination);await fs.mkdir(path.dirname(output),{recursive:true});await fs.writeFile(output,bytes,{flag:'wx'});assert.deepEqual(await fs.readFile(output),bytes);
    records.push({source,archive:relative+'/'+destination,bytes:bytes.length,sha256:isolation.sha(bytes)});
  }
  await fs.writeFile(path.join(target,'.gitattributes'),'# Preserve original repair execution, tool, metadata and recorder bytes.\n* -text -whitespace\n',{flag:'wx'});
  const tools=['mv33-physical-isolation-v1.cjs','mv33-prepare-physical-seed-v2.cjs','mv33-prepare-physical-seed-v3.cjs','mv33-make-isolated-pair-helper-v3.cjs','mv33-make-isolated-pair-helper-v4.cjs','mv33-native-pair-delivery-v3.cjs','mv33-native-pair-delivery-v4.cjs','mv33-bound-native-scenarios-v2.cjs','mv33-bound-native-scenarios-v3.cjs','mv33-r1-route-waits-delivery-v3.cjs','mv33-r1-route-waits-delivery-v4.cjs','mv33-r6-r7-movement-delivery-v4.cjs','mv33-r6-r7-movement-delivery-v5.cjs','mv33-physical-isolation-guard-probes-v1.cjs','mv33-launch-physical-native-v1.cjs','mv33-archive-isolation-repair-v1.cjs'];
  for(const name of tools)await copy(path.join(__dirname,name),'tools/'+name);
  const logs=['mv33-physical-seed-v2-preparation-original.log','mv33-physical-seed-v3-preparation-original.log','mv33-r1-physical-prepare-v1-original.log','mv33-r1-physical-prepare-v2-original.log','mv33-r6-r7-physical-prepare-v1-original.log','mv33-physical-isolation-guard-probes-v1-original.log','mv33-r1-physical-native-v1-original.log','mv33-r6-r7-physical-native-v1-original.log'];
  for(const name of logs)await copy(path.join(__dirname,name),'logs/'+name);
  const metadata=[
    ['mv33-native-isolation-repair-guide-20261020.md','incident/root-guide.md'],
    ['mv33-merger-native-isolation-finding-a75f9dde-a015-4825-aae2-2da8cc0b0a13.json','incident/independent-finding.json'],
    ['mv33-merger-related-native-copy-scope-ce265bd2-404a-400b-8fe5-b02cfd26051c.json','incident/related-copy-scope.json'],
    ['mv33-merger-isolation-preserved-e26de23e-aacc-481a-a2d8-c6db192b7304/manifest.json','incident/preserved-originals-manifest.json'],
    ['mv33-merger-metadata-audit-ee8a22a1-3ee1-4c6d-bbea-9050906befad.json','incident/prior-metadata-audit.json'],
    ['mv-native-reference-restoration-dc5069b8-0cf6-4c1d-8162-1187fc40a301/result.json','incident/reference-restoration-result.json'],
    ['mv-native-reference-provenance-audit-25000417-5679-4cb9-a191-039ec145d5d1/audit.json','incident/reference-provenance-audit.json'],
    ['mv33-root-physical-gate-audit-476d3333-b4d1-4a62-b3c2-88497b1331da.json','incident/root-physical-gate-audit.json'],
    ['mv33-physical-seed-v3-pointer.json','preparation/restored-seed-pointer.json'],
    ['mv33-physical-seed-v2-pointer.json','preparation/interim-seed-pointer.json'],
    ['mv33-physical-isolation-guard-probes-v1-aad84c44-8643-409d-be9b-d3138d891b67/result.json','preparation/negative-guard-probes.json'],
  ];
  for(const [source,destination]of metadata)await copy(path.join(__dirname,source),destination);
  for(const version of ['v2','v3']){const pointer=JSON.parse(await fs.readFile(path.join(__dirname,'mv33-physical-seed-'+version+'-pointer.json'),'utf8'));await copy(pointer.manifest,'preparation/'+(version==='v3'?'restored':'interim')+'-seed-manifest.json');}
  for(const [name,root]of [['r1-prepare','mv33-r1-route-waits-delivery-v4-f2a43840-8e7c-411d-b907-c269a4ad2764'],['r6-r7-prepare','mv33-r6-r7-movement-delivery-v5-ea3e1ced-fa1d-4845-b94a-74b6155b1990']])await copy(path.join(__dirname,root,'physical-isolation-proof.json'),'preparation/'+name+'-physical-isolation-proof.json');
  const failureRoot=path.join(__dirname,'mv33-r1-route-waits-delivery-v3-5a6fe076-00f7-4764-b7e2-12a798b989ac');
  const failureBytes=await fs.readFile(path.join(failureRoot,'pair-result.json')),failure=JSON.parse(failureBytes);
  const failureSummary={purpose:'Preserved prepare-only harness premise failure; complete copied package.json already existed, no native launch',raw:{path:path.join(failureRoot,'pair-result.json'),sha256:isolation.sha(failureBytes)},error:failure.error,startedAt:failure.startedAt,completedAt:failure.completedAt,lifecycle:failure.lifecycle,checkpoints:failure.isolationCheckpoints,passed:false};
  await fs.writeFile(path.join(target,'preparation/first-physical-prepare-failure.json'),JSON.stringify(failureSummary,null,2)+'\n',{flag:'wx'});
  for(const [name,root]of [['r1-native',r1],['r6-r7-native',r67]]){
    const rawPath=path.join(root,'pair-result.json'),raw=await fs.readFile(rawPath),run=JSON.parse(raw);assert.equal(run.passed,true);
    const summary={purpose:'Safe replacement native summary; hashes and observations only, complete first-party carriers remain external',root,raw:{path:rawPath,sha256:isolation.sha(raw)},startedAt:run.startedAt,completedAt:run.completedAt,build:run.build,nativeIdentity:run.nativeIdentity,nativeGateRelease:run.nativeGateRelease,inputBinding:run.inputBinding,lifecycle:run.lifecycle,checkStateUnchanged:run.checkStateUnchanged,publication:run.publication,completeCarrierComparison:run.completeCarrierComparison,completeGeneratedCarrierComparison:run.completeGeneratedCarrierComparison,physicalIsolation:run.physicalIsolation,isolationCheckpointLabels:run.isolationCheckpoints.map(e=>e.label),sides:Object.fromEntries(Object.entries(run.sides).map(([side,item])=>[side,{project:item.project,validation:item.validation,passed:item.passed,native:{launchedPid:item.native.launchedPid,exitCode:item.native.exitCode,profile:item.native.profile},actual:item.native['runtime-result.json'].value.actual,runtimeIdentity:item.native['runtime-process-identity.json'].value,versions:item.native['runtime-result.json'].value.versions,engine:item.native['runtime-result.json'].value.engine}])),runtimeComparison:run.runtimeComparison,passed:run.passed};
    const bytes=JSON.stringify(summary,null,2)+'\n',destination='native/'+name+'-safe-summary.json';await fs.mkdir(path.join(target,'native'),{recursive:true});await fs.writeFile(path.join(target,destination),bytes,{flag:'wx'});records.push({source:rawPath,archive:relative+'/'+destination,bytes:Buffer.byteLength(bytes),sha256:isolation.sha(bytes),derivative:true,originalSha256:isolation.sha(raw)});
    await copy(path.join(root,'physical-isolation-proof.json'),'native/'+name+'-physical-isolation-proof.json');
    const checkpoints={purpose:'All physical metadata checkpoints including before/after native execution; complete carrier bytes stay external',raw:{path:rawPath,sha256:isolation.sha(raw)},checkpoints:run.isolationCheckpoints,passed:run.passed};
    const checkpointsBytes=JSON.stringify(checkpoints,null,2)+'\n',checkpointsDestination='native/'+name+'-complete-isolation-checkpoints.json';
    await fs.writeFile(path.join(target,checkpointsDestination),checkpointsBytes,{flag:'wx'});records.push({source:rawPath,archive:relative+'/'+checkpointsDestination,bytes:Buffer.byteLength(checkpointsBytes),sha256:isolation.sha(checkpointsBytes),derivative:true,originalSha256:isolation.sha(raw)});
  }
  for(const [name,root]of [['r1',l1],['r6-r7',l67]])await copy(path.join(root,'result.json'),'native/'+name+'-complete-reference-seed-protection.json');
  const manifest={purpose:'Append-only33 native isolation repair archive. Tools/logs/metadata are preserved; no first-party engine/data/audio carriers are included. Old33-history/results remain untouched.',at:new Date().toISOString(),root:target,records,passed:true};
  await fs.writeFile(path.join(target,'archive-manifest-v1.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({archive:target,records:records.length,passed:true},null,2));
}
main().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
