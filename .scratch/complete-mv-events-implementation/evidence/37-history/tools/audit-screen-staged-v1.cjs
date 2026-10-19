const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]),external=path.resolve(process.argv[3]),base=process.argv[4],target=process.argv[5],output=process.argv[6];
const evidence='.scratch/complete-mv-events-implementation/evidence/',history=evidence+'37-history/';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const git=args=>cp.execFileSync('git',['-c','core.longpaths=true',...args],{cwd:root,maxBuffer:128*1024*1024});
const targetPrefix=target==='INDEX'?':':target+':';
const diff=target==='INDEX'?['diff','--cached','--name-only',base]:['diff','--name-only',base,target];
const files=git(diff).toString().trim().split(/\r?\n/).filter(Boolean).sort();
const batch=cp.spawnSync('git',['-c','core.longpaths=true','cat-file','--batch'],{cwd:root,input:files.map(file=>targetPrefix+file).join('\n')+'\n',maxBuffer:128*1024*1024});
assert.equal(batch.status,0,batch.stderr.toString());let offset=0;const blobs=new Map(),records=[];
for(const file of files){
  const end=batch.stdout.indexOf(10,offset),header=batch.stdout.subarray(offset,end).toString(),match=/^([a-f0-9]+) blob (\d+)$/.exec(header);assert(match,'Missing staged blob '+file+' '+header);
  const size=Number(match[2]),bytes=batch.stdout.subarray(end+1,end+1+size);offset=end+1+size+1;
  assert.deepStrictEqual(bytes,fs.readFileSync(path.join(root,file)),'Physical/staged bytes differ '+file);
  const record={path:file,gitBlob:match[1],sha256:sha(bytes),bytes:size};blobs.set(file,record);records.push(record);
}
const manifests=fs.readdirSync(external).filter(file=>/^archive-manifest-v\d+\.json$/.test(file)).sort(),archived=[];
for(const file of manifests){
  const manifestBytes=fs.readFileSync(path.join(external,file)),stored=evidence+'37-history/'+file;
  assert.deepStrictEqual(fs.readFileSync(path.join(root,stored)),manifestBytes);assert.equal(blobs.get(stored)?.sha256,sha(manifestBytes),'Manifest missing from candidate '+file);
  const manifest=JSON.parse(manifestBytes);
  for(const entry of manifest.files){
    const original=fs.readFileSync(entry.source),captured=fs.readFileSync(path.join(root,entry.target));
    assert.equal(sha(original),entry.sha256,'External original changed '+entry.source);assert.deepStrictEqual(captured,original,'Archive differs '+entry.target);
    assert.equal(blobs.get(entry.target)?.sha256,entry.sha256,'Candidate archive blob differs '+entry.target);archived.push(entry.target);
  }
}
const repair=JSON.parse(fs.readFileSync(path.join(external,'active-index-repair-v1.json'),'utf8'));
const oldIndex=JSON.parse(git(['show',`${base}:${evidence}requirements.json`])),newIndex=JSON.parse(fs.readFileSync(path.join(root,evidence,'requirements.json'),'utf8'));
assert.equal(oldIndex.requirements.length,296);assert.equal(newIndex.requirements.length,300);
const restored=structuredClone(newIndex.requirements.slice(0,296));
for(const allow of repair.allowlist){const row=restored.find(item=>item.id===allow.id);assert.equal(row.fixture.sha256,allow.after);assert.equal(row.fixture.path,allow.path);row.fixture.sha256=allow.before;}
assert.deepStrictEqual(restored,oldIndex.requirements);
for(const proof of repair.originalProofs){const original=git(['show',`${base}:${proof.path}`]),copied=fs.readFileSync(path.join(root,proof.archived));assert.deepStrictEqual(original,copied);assert.equal(sha(copied),proof.sha256);assert.equal(blobs.get(proof.archived)?.gitBlob,proof.gitBlob);}
const incoming=git(['ls-tree','-r',base,'--',evidence]).toString().trim().split('\n').map(line=>line.split('\t')[1]);
assert.deepStrictEqual(files.filter(file=>incoming.includes(file)&&file!==evidence+'requirements.json'&&file!==evidence+'README.md'),[],'Incoming historical evidence changed');
const capture=JSON.parse(fs.readFileSync(path.join(external,'capture-v7/manifest.json'),'utf8'));
for(const file of capture.files)assert.equal(sha(fs.readFileSync(path.join(root,file.path))),file.sha256,'Current final input changed '+file.path);
assert.equal(sha(JSON.stringify(capture.files)),capture.fingerprint);
const product=JSON.parse(fs.readFileSync(path.join(external,'screen-source-provenance-v1.json'),'utf8'));
for(const file of product.productFiles){assert.equal(sha(fs.readFileSync(path.join(root,file.path))),file.sha256);assert.equal(blobs.get(file.path)?.sha256,file.sha256,'Product staged bytes differ '+file.path);}
assert.equal(git(['rev-parse','codex/complete-mv-events-implementation']).toString().trim(),base,'Actual integration advanced: merge before clean handoff');
git(['merge-base','--is-ancestor',base,target==='INDEX'?'HEAD':target]);
const record={target,base,actualIntegration:base,candidateFiles:records.length,uniqueArchivedFiles:new Set(archived).size,archiveManifests:manifests,allPhysicalExternalAndCandidateBytesMatch:true,allIncomingHistoryUnchanged:true,incomingRows:296,currentRows:300,onlyIncomingRowException:repair.allowlist,currentInputFingerprint:capture.fingerprint,productFingerprint:product.productFingerprint,originalGitBlobProofs:repair.originalProofs,records};
if(fs.existsSync(output))throw Error('Append-only audit output exists');fs.writeFileSync(output,JSON.stringify(record,null,2)+'\n');
process.stdout.write(JSON.stringify({target,base,candidateFiles:records.length,uniqueArchivedFiles:new Set(archived).size,archiveManifests:manifests,allPhysicalExternalAndCandidateBytesMatch:true,currentInputFingerprint:capture.fingerprint,output})+'\n');
