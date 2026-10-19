'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const repo=process.argv[2]||'C:/Users/Shuen/.codex/worktrees/mv-ticket-24/rpgmaker-event-dsl';
const output=process.argv[3]||'C:/Users/Shuen/.codex/tmp/mv24-correction-audit-v1';
const tmp='C:/Users/Shuen/.codex/tmp';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const write=(name,value)=>fs.writeFileSync(path.join(output,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
fs.mkdirSync(output,{recursive:true});
const startedAt=new Date().toISOString();
const identityPath=path.join(tmp,'mv-e1-editor-container-identities.json');
const index=JSON.parse(fs.readFileSync(identityPath));
const target=fs.readFileSync(index.target.path);assert.equal(sha(target),index.target.sha256);assert.equal(target.length,index.target.bytes);
const resources=index.resources.map(r=>{
 const record=target.subarray(r.offset,r.offset+r.storedBytes);assert.equal(record.readUInt32BE(0)+4,r.storedBytes);assert.equal(sha(record),r.storedSha256);
 const payload=record.subarray(4);let decoded,consumed=null;
 if(r.encoding==='zlib'){const info=zlib.inflateSync(payload.subarray(4),{info:true});decoded=info.buffer;consumed=info.engine.bytesWritten;assert.equal(decoded.length,payload.readUInt32BE(0));assert.equal(consumed,payload.length-4);}else decoded=payload;
 assert.equal(decoded.length,r.decodedBytes);assert.equal(sha(decoded),r.decodedSha256);assert.equal(consumed,r.compressedInputBytesConsumed);assert.equal(sha(fs.readFileSync(r.destination)),r.decodedSha256);
 return {...r,revalidated:true};
});
write('editor-resource-revalidation.json',{purpose:'Ticket24 E1/E3/E6 identified resources revalidated read-only; no UI capture and no target code execution',startedAt,completedAt:new Date().toISOString(),node:process.version,target:index.target,input:{path:identityPath,sha256:sha(fs.readFileSync(identityPath))},versionEvidence:index.reusedVersionEvidence,resources,passed:true});
for(const [slug,directory] of [
 ['triggers',process.argv[4]],
 ['routes',process.argv[5]],
]){
 assert.ok(directory,'Supply actual correction pair directory arguments'); const reportPath=path.join(tmp,directory,'pair-result.json'),bytes=fs.readFileSync(reportPath),r=JSON.parse(bytes);
 assert.equal(r.passed,true);assert.equal(r.runtimeComparison,true);assert.equal(r.checkStateUnchanged,true);assert.equal(r.completeCarrierComparison.passed,true);
 const source=r.build.source.entries.map(entry=>{const current=sha(fs.readFileSync(path.join(repo,'packages/rpgmaker-event-dsl/src',entry.path)));assert.equal(current,entry.sha256,`Native/source mismatch ${entry.path}`);return{...entry,currentSha256:current,matches:true};});
 const sides={};
 for(const [name,s] of Object.entries(r.sides)){
  assert.equal(s.passed,true);for(const [k,v] of Object.entries(s.validation))assert.equal(v,true,`${name}.${k}`);
  const runtime=s.native['runtime-result.json'].value;assert.equal(runtime.passed,true);assert.equal(runtime.error,null);
  const loadedHashes=Object.fromEntries(Object.entries(runtime.loaded).map(([k,v])=>[k,sha(JSON.stringify(v))]));
  const runtimeSafe={...runtime,loaded:undefined,loadedHashes};
  sides[name]={project:s.project,observerSha256:s.observerSha256,native:{...s.native,'runtime-result.json':{...s.native['runtime-result.json'],value:runtimeSafe}},diskInputUnchanged:s.diskInputUnchanged,validation:s.validation,passed:s.passed};
 }
 write(`native-${slug}-safe-summary.json`,{purpose:r.purpose,raw:{path:reportPath,sha256:sha(bytes),bytes:bytes.length},startedAt:r.startedAt,completedAt:r.completedAt,node:r.node,toolNode:r.toolNode,options:r.options,lifecycle:r.lifecycle,build:r.build,currentSourceCorrespondence:source,nativeIdentity:r.nativeIdentity,sourceEdits:r.sourceEdits,sources:r.sources,checkStateUnchanged:r.checkStateUnchanged,completeCarrierComparison:r.completeCarrierComparison,publication:r.publication,workspaceState:r.workspaceState,sides,runtimeComparison:r.runtimeComparison,passed:r.passed,redaction:'Only first-party input database contents and runtime loaded database values are omitted. Raw originals remain local; all carrier hashes, comparison verdicts, process identities, source/dist hashes and original fixture traces remain.'});
}
console.log(JSON.stringify({output,resourceCount:resources.length,nativePairs:2,passed:true}));
