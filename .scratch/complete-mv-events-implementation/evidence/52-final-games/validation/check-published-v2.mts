import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { requirementsSchema, resultSchema, sha256 } from 'file:///M:/Shuen/Codex/mv-events-implementation-20261020/worktrees/mv-battle-batch/packages/rpgmaker-event-dsl/test/support/mv-evidence.ts';

const repo='M:/Shuen/Codex/mv-events-implementation-20261020/worktrees/mv-battle-batch';
const root='.scratch/complete-mv-events-implementation/evidence/';
const index=requirementsSchema.parse(JSON.parse(await readFile(join(repo,root,'requirements.json'),'utf8')));
const original=JSON.parse(execFileSync('git',['-c','core.longpaths=true','show','2dc639015f908de6fd524e50236e5422b5f8e990:'+root+'requirements.json'],{cwd:repo,encoding:'utf8',windowsHide:true,maxBuffer:8*1024*1024}));
assert.deepEqual(index.requirements.slice(0,original.requirements.length),original.requirements);
const added=index.requirements.slice(original.requirements.length);assert.equal(added.length,9);
assert.equal(new Set(index.requirements.map(r=>r.id)).size,index.requirements.length);
const cache=new Map<string,Buffer>();
const artifact=async(path:string)=>{let bytes=cache.get(path);if(!bytes){bytes=await readFile(join(repo,path));cache.set(path,bytes);}return bytes;};
const checklist=await readFile(join(repo,root,'README.md'),'utf8');
const listed=[...checklist.matchAll(/^\|\s*(MV-[A-Z0-9-]+)\s*\|/gmu)].map(m=>m[1]);
assert.equal(listed.length,index.requirements.length);assert.equal(new Set(listed).size,listed.length);
for(const r of added){assert.ok(listed.includes(r.id));for(const source of r.sources)assert.ok((await artifact(source.path)).toString('utf8').includes(source.section));assert.equal(sha256(await artifact(r.fixture.path)),r.fixture.sha256);assert.ok(r.review);const review=(await artifact(r.review.path)).toString('utf8');assert.ok(review.includes(r.review.section)&&review.includes(r.id));}
const results=[];
for(const name of(await readdir(join(repo,root,'results'))).filter(n=>n.includes('-2026-10-20T03-13-28-'))){
 const bytes=await readFile(join(repo,root,'results',name)),result=resultSchema.parse(JSON.parse(bytes.toString('utf8'))),r=index.requirements.find(r=>r.id===result.requirementId);assert.ok(r);assert.deepEqual(result.fixture,r.fixture);assert.equal(sha256(await artifact(r.fixture.path)),r.fixture.sha256);assert.equal(sha256(JSON.stringify(result.source.files)),result.source.fingerprint);assert.equal(result.source.files.find(f=>f.path===r.fixture.path)?.sha256,r.fixture.sha256);assert.equal(result.source.revision,'2dc639015f908de6fd524e50236e5422b5f8e990');assert.equal(result.status,'passed');assert.equal(result.difference,null);results.push({path:root+'results/'+name,sha256:sha256(bytes),id:result.requirementId});
}
assert.equal(results.length,15);
const receipt={at:new Date().toISOString(),purpose:'Lightweight new52 requirement/schema/link/fixture/source-fingerprint validation only; no repeated current/historical index or native/full/build run',requirementsParsed:index.requirements.length,oldRequirementObjectsUnchanged:original.requirements.length,newRequirementLinksAndHashesChecked:added.length,newResultsSchemaAndFixtureChecked:results.length,results,passed:true,originalTargetedIndexFailureRetained:{path:'M:/Shuen/Codex/mv-events-implementation-20261020/final-game-52/evidence-index-v1.json',deadlineMs:10000,durationMs:10010.155600000002,message:'STACK_TRACE_ERROR',status:'failed',cause:'Not diagnosed; root concurrent I/O is not asserted as the cause'},pending:'Merger/final55 integrated current index'};
await writeFile('M:/Shuen/Codex/mv-events-implementation-20261020/final-game-52/published-new-records-check-v2.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({passed:true,newRequirements:added.length,newResults:results.length,oldRequirementObjectsUnchanged:original.requirements.length}));
