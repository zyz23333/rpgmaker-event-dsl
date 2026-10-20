const fs=require('node:fs'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const e='.scratch/complete-mv-events-implementation/evidence/',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const git=(args,options={})=>cp.execFileSync('git',args,{maxBuffer:256*1024*1024,...options});
const audit=JSON.parse(fs.readFileSync(e+'35-map-characters-history-audit.json'));
const archive=JSON.parse(fs.readFileSync(e+'35-dev-tools/archive-manifest.json'));
const supplemental=JSON.parse(fs.readFileSync(e+'35-dev-tools/supplemental-manifest-v2.json'));
const files=[...audit.results,...audit.source.capturedInputFiles,...archive.files,...supplemental.files];
const output=git(['cat-file','--batch'],{input:files.map(f=>':'+f.path+'\n').join('')});let offset=0;
for(const f of files){const end=output.indexOf(10,offset);assert.ok(end>=0);const [blob,type,length]=output.subarray(offset,end).toString().split(' ');assert.equal(type,'blob','not a staged blob: '+f.path);const size=Number(length);offset=end+1;assert.equal(sha(output.subarray(offset,offset+size)),f.sha256,'staged bytes differ: '+f.path);offset+=size+1;}
assert.equal(offset,output.length);
const index=new Map(git(['ls-files','--stage','-z']).toString().split('\0').filter(Boolean).map(line=>{const [meta,p]=line.split('\t');const [mode,blob,stage]=meta.split(' ');assert.equal(stage,'0','unmerged path '+p);return [p,blob];}));
for(const history of Object.values(audit.histories))for(const f of history.files)assert.equal(index.get(f.path),f.blob,'historical staged blob differs '+f.path);
const actual=git(['rev-parse','codex/complete-mv-events-implementation']).toString().trim();assert.equal(actual,audit.base,'integration advanced before delivery');
const result={verifiedAt:new Date().toISOString(),base:audit.base,actualIntegration:actual,results:audit.results.length,capturedInputs:audit.source.capturedInputFiles.length,archivedTools:archive.files.length,supplementalTools:supplemental.files.length,historicalBlobs:audit.histories[audit.base].preservedBlobFiles,stagedResultBytesExact:true,stagedCapturedSourceBytesExact:true,stagedArchiveBytesExact:true,inheritedBlobsExact:true,contract:'mv-1.6.1/10',stage:'focused DEV only; no READY/native/build/built/full/contract delivery',method:'git cat-file --batch exact staged bytes plus complete git ls-files --stage object identities'};
fs.writeFileSync(e+'35-map-characters-staged-verification.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
