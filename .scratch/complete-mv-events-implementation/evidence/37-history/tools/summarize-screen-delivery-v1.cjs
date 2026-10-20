const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]),external=path.resolve(process.argv[3]);
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const captures=fs.readdirSync(external).filter(name=>/^capture-v\d+$/.test(name)).map(name=>({name,...JSON.parse(fs.readFileSync(path.join(external,name,'manifest.json'),'utf8'))}));
const latest=captures.find(item=>item.name==='capture-v7');assert(latest);
for(const file of latest.files)assert.equal(sha(fs.readFileSync(path.join(root,file.path))),file.sha256,'Final current input changed '+file.path);
assert.equal(sha(JSON.stringify(latest.files)),latest.fingerprint);
const results=fs.readdirSync(path.join(external,'results')).filter(name=>name.endsWith('.json')).map(name=>({name,...JSON.parse(fs.readFileSync(path.join(external,'results',name),'utf8'))}));
const statuses={},perFingerprint={},perRequirement={};
for(const result of results){
  assert(captures.some(item=>item.fingerprint===result.source.fingerprint),'Uncaptured result '+result.name);
  statuses[result.status]=(statuses[result.status]??0)+1;
  perFingerprint[result.source.fingerprint]??={};perFingerprint[result.source.fingerprint][result.status]=(perFingerprint[result.source.fingerprint][result.status]??0)+1;
  perRequirement[result.requirementId]??={};perRequirement[result.requirementId][result.status]=(perRequirement[result.requirementId][result.status]??0)+1;
  assert.equal(result.environment.native,'not-executed');
}
const record={inputCount:latest.files.length,latestFingerprint:latest.fingerprint,captureCount:captures.length,resultCount:results.length,statuses,perFingerprint,perRequirement,allResultsHaveCapturedPreRunInputs:true,allResultsDeclareNativeNotExecuted:true,allCurrentInputBytesMatchLatestCapture:true};
const output=path.join(external,'screen-final-summary-v1.json');if(fs.existsSync(output))throw Error('Append-only output exists');fs.writeFileSync(output,JSON.stringify(record,null,2)+'\n');
const target=path.join(root,'.scratch/complete-mv-events-implementation/evidence/37-history/provenance',path.basename(output));fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(output,target);
process.stdout.write(JSON.stringify(record)+'\n');
