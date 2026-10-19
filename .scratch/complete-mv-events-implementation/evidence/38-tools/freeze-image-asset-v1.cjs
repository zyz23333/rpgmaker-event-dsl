const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const temp='M:/Shuen/Codex/mv-events-implementation-20261020/ticket38-temp',out=path.join(temp,'image-asset-red-green-freeze-v1');
assert.ok(!fs.existsSync(out),'immutable imageAsset freeze exists');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const labels=['image-asset-helper-red-v1','image-asset-workspace-red-v1','image-asset-five-green-v1'];
const snapshots=labels.map(label=>{
  const directory=path.join(temp,'source-snapshots',label),manifestPath=path.join(directory,'manifest.json'),bytes=fs.readFileSync(manifestPath),manifest=JSON.parse(bytes);
  assert.equal(sha(JSON.stringify(manifest.files)),manifest.fingerprint);
  for(const file of manifest.files)assert.equal(sha(fs.readFileSync(path.join(directory,file.path))),file.sha256,'captured input changed '+file.path);
  return {label,directory,manifestSha256:sha(bytes),fingerprint:manifest.fingerprint,files:manifest.files};
});
assert.equal(snapshots[0].fingerprint,snapshots[1].fingerprint);
const changed=snapshots[0].files.filter(f=>snapshots[2].files.find(g=>g.path===f.path)?.sha256!==f.sha256).map(f=>f.path);
assert.deepStrictEqual(changed,['packages/rpgmaker-event-dsl/src/authoring/references.ts']);
const candidates=fs.readdirSync(path.join(temp,'results')).filter(name=>name.startsWith('MV-S6-PICTURE-008-')&&name.endsWith('.json'));
assert.equal(candidates.length,10);
const results=candidates.map(name=>{
  const original=path.join(temp,'results',name),bytes=fs.readFileSync(original),record=JSON.parse(bytes),snapshot=record.status==='failed'?snapshots[0]:snapshots[2],files=new Map(snapshot.files.map(f=>[f.path,f.sha256]));
  assert.equal(record.requirementId,'MV-S6-PICTURE-008');assert.equal(record.environment.native,'not-executed');
  assert.equal(sha(JSON.stringify(record.source.files)),record.source.fingerprint);
  for(const file of record.source.files)assert.equal(files.get(file.path),file.sha256,'result source differs from preserved snapshot '+file.path);
  return {original,name,bytes,sha256:sha(bytes),status:record.status,expected:record.expected,recordedSourceFingerprint:record.source.fingerprint,recordedSourceFiles:record.source.files.length,snapshotLabel:snapshot.label};
});
assert.equal(results.filter(r=>r.status==='failed').length,5);assert.equal(results.filter(r=>r.status==='passed').length,5);
fs.mkdirSync(path.join(out,'results'),{recursive:true});
for(const result of results)fs.writeFileSync(path.join(out,'results',result.name),result.bytes);
const logs=[];
for(const label of labels)for(const suffix of ['.log','-driver.log','-freeze.log']){
  const original=path.join(temp,label+suffix),bytes=fs.readFileSync(original),destination=path.join(out,'logs',label+suffix);
  fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,bytes);logs.push({original,destination,sha256:sha(bytes)});
}
const manifest={createdAt:new Date().toISOString(),scope:'imageAsset public constructor and four actual Workspace source inputs; no whole READY claim',snapshots,results:results.map(({bytes,...record})=>record),logs,originalFailedResults:5,passingResults:5,changedCapturedInputs:changed};
const bytes=Buffer.from(JSON.stringify(manifest,null,2)+'\n');fs.writeFileSync(path.join(out,'manifest.json'),bytes);
console.log(JSON.stringify({out,manifestSha256:sha(bytes),originalFailedResults:5,passingResults:5,snapshotFingerprints:snapshots.map(s=>({label:s.label,fingerprint:s.fingerprint,files:s.files.length})),recordedSourceFingerprints:[...new Set(results.map(r=>r.recordedSourceFingerprint))],changedCapturedInputs:changed}));
