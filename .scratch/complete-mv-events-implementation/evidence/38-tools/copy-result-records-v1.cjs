const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const temp='M:/Shuen/Codex/mv-events-implementation-20261020/ticket38-temp',source=path.join(temp,'results'),target='.scratch/complete-mv-events-implementation/evidence/results/38-dev',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
fs.mkdirSync(target,{recursive:true});const records=[];
for(const name of fs.readdirSync(source).filter(n=>n.endsWith('.json')).sort()){
  const original=path.join(source,name),bytes=fs.readFileSync(original),record=JSON.parse(bytes),destination=target+'/'+name;
  assert.equal(record.environment.native,'not-executed');
  if(fs.existsSync(destination))assert.deepStrictEqual(fs.readFileSync(destination),bytes);else fs.writeFileSync(destination,bytes);
  records.push({path:destination,original,sha256:sha(bytes),requirementId:record.requirementId,status:record.status});
}
const statusCounts=records.reduce((counts,r)=>(counts[r.status]=(counts[r.status]??0)+1,counts),{}),manifest={createdAt:new Date().toISOString(),records:records.length,statusCounts,files:records};
const bytes=Buffer.from(JSON.stringify(manifest,null,2)+'\n');fs.writeFileSync(temp+'/result-records-copy-v1.json',bytes);console.log(JSON.stringify({records:records.length,statusCounts,manifestSha256:sha(bytes),target}));
