const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');const assert=require('node:assert/strict');
const repo='M:/Shuen/Codex/mv-events-implementation-20261020/worktrees/mv-battle-batch';
const task='M:/Shuen/Codex/mv-events-implementation-20261020/final-game-52';
const root='.scratch/complete-mv-events-implementation/evidence/';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const receipt=JSON.parse(fs.readFileSync(path.join(repo,root,'52-final-games/validation/published-new-records-check-v2.json'),'utf8'));
const binding=JSON.parse(fs.readFileSync(path.join(repo,root,'52-final-games/input-bindings-v1.json'),'utf8'));
const cache=new Map();const check=(file,sha)=>{let actual=cache.get(file);if(!actual){actual=hash(fs.readFileSync(path.join(repo,file)));cache.set(file,actual);}assert.equal(actual,sha,file);};
assert.equal(hash(JSON.stringify(binding.candidate.source.files)),binding.candidate.source.sha256);
for(const entry of binding.candidate.source.files)check('packages/rpgmaker-event-dsl/src/'+entry.path,entry.sha256);
for(const entry of binding.tools)check(entry.path,entry.sha256);
let sourceEntries=0;
for(const entry of receipt.results){check(entry.path,entry.sha256);const result=JSON.parse(fs.readFileSync(path.join(repo,entry.path),'utf8'));for(const file of result.source.files){check(file.path,file.sha256);sourceEntries++;}}
const copiedValidation=[];
for(const file of ['check-published-v1.mts','published-new-records-check-v1.log','check-published-v2.mts','published-new-records-check-v2.log','published-new-records-check-v2.json','evidence-index-v1.json','evidence-index-v1.log','final-collection-v1.log','final-publication-v1.log']){
 const external=fs.readFileSync(path.join(task,file));const archived=fs.readFileSync(path.join(repo,root,'52-final-games/validation',file));assert.ok(external.equals(archived),file);copiedValidation.push({path:root+'52-final-games/validation/'+file,sha256:hash(archived),bytes:archived.length});
}
const output={at:new Date().toISOString(),scope:'Lightweight publication bytes only; no native/full/build/index run',candidate:binding.candidate.revision,productSourceFiles:binding.candidate.source.files.length,archivedBoundTools:binding.tools.length,newResults:receipt.results.length,newResultSourceEntries:sourceEntries,uniqueFileHashesChecked:cache.size,copiedValidation,passed:true};
fs.writeFileSync(path.join(task,'publication-byte-check-v1.json'),JSON.stringify(output,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({passed:true,productSourceFiles:output.productSourceFiles,archivedBoundTools:output.archivedBoundTools,newResults:output.newResults,newResultSourceEntries:sourceEntries,uniqueFileHashesChecked:cache.size,copiedValidation:copiedValidation.length}));