'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root='C:/Users/Shuen/.codex/worktrees/mv-ticket-24/rpgmaker-event-dsl';
const temp='C:/Users/Shuen/.codex/tmp';
const evidence=path.join(root,'.scratch/complete-mv-events-implementation/evidence');
const archive=path.join(evidence,'24-merger-correction');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const copies=[];
function copy(source,destination){
 fs.mkdirSync(path.dirname(destination),{recursive:true});
 const before=fs.readFileSync(source);fs.copyFileSync(source,destination,fs.constants.COPYFILE_EXCL);
 const after=fs.readFileSync(destination);assert.deepEqual(after,before);
 copies.push({origin:'outside-copy',source,destination:path.relative(root,destination).split(path.sep).join('/'),bytes:before.length,sourceSha256:sha(before),destinationSha256:sha(after)});
}
for(const name of [
 'mv24-empty-events-red-v1.log','mv24-empty-events-red-v2.log','mv24-empty-events-green-v1.log',
 'mv24-correction-check-v1.log','mv24-correction-build-v1.log','mv24-correction-built-v1.log',
 'mv24-correction-unit-v1.json','mv24-correction-unit-v1.log',
 'mv24-correction-native-triggers-v1.log','mv24-correction-native-routes-v1.log','mv24-correction-audit-v1.log',
 'mv24-correction-audit-resources-and-native-v1.cjs','mv24-correction-record-results-v1.mts',
 'mv24-correction-verify-product-v1.cjs','mv24-correction-archive-v1.cjs','mv24-correction-verify-history-v1.cjs',
])copy(path.join(temp,name),path.join(archive,name));
copy(path.join(temp,'mv24-merger-empty-events-815eca02-b838-4338-a910-568094aaaa65/result.json'),path.join(archive,'original-merger-reproduction.json'));
copy(path.join(temp,'mv24-cdae5f8-built-preserved-dcb438c6-d68d-4cb5-ac0c-90a27663dee7/identity.json'),path.join(archive,'original-cdae5f8-build-identity.json'));
for(const name of ['editor-resource-revalidation.json','native-triggers-safe-summary.json','native-routes-safe-summary.json'])copy(path.join(temp,'mv24-correction-audit-v1',name),path.join(archive,name));
const inventories=[];
for(const [label,dirname,expected] of [
 ['source','mv24-correction-check-results-v1',75],['built','mv24-correction-built-results-v1',75],
 ['harness-red','mv24-empty-events-red-results-v1',1],['behavior-red','mv24-empty-events-red-results-v2',1],['green','mv24-empty-events-green-results-v1',1],
]){
 const directory=path.join(temp,dirname),entries=[];
 for(const name of fs.readdirSync(directory).sort()){
  if(!name.endsWith('.json'))continue;
  const source=path.join(directory,name),bytes=fs.readFileSync(source),r=JSON.parse(bytes);
  entries.push({path:source,sha256:sha(bytes),bytes:bytes.length,requirementId:r.requirementId,runId:r.runId,status:r.status});
  if(!r.requirementId.startsWith('MV-S5-MAP-'))continue;
  if(label==='source'||label==='built')assert.equal(r.status,'passed');
  copy(source,path.join(evidence,'results',name));
  if(label!=='source'&&label!=='built')copy(source,path.join(archive,'raw-tdd',label,name));
 }
 assert.equal(entries.filter(e=>e.requirementId.startsWith('MV-S5-MAP-')).length,expected,label);
 inventories.push({label,directory,entries});
}
const output={purpose:'Exact outside copies for ticket24 correction; excludes authored files and subsequently generated schema wrappers',at:new Date().toISOString(),node:process.version,copies,inventories};
fs.writeFileSync(path.join(archive,'outside-copy-map.json'),JSON.stringify(output,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({outsideCopies:copies.length,actualOutputDirectories:inventories.length,passed:true}));
