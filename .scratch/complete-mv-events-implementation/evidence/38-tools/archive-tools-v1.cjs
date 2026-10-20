const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const temp='M:/Shuen/Codex/mv-events-implementation-20261020/ticket38-temp',target='.scratch/complete-mv-events-implementation/evidence/38-tools',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
fs.mkdirSync(target,{recursive:true});const files=[];
function copy(from,to){const b=fs.readFileSync(from),p=target+'/'+to;fs.mkdirSync(path.dirname(p),{recursive:true});if(fs.existsSync(p))assert.deepStrictEqual(fs.readFileSync(p),b);else fs.writeFileSync(p,b);files.push({path:p,sha256:sha(b),original:from});}
for(const e of fs.readdirSync(temp,{withFileTypes:true}))if(e.isFile())copy(temp+'/'+e.name,e.name);
for(const e of fs.readdirSync(temp+'/source-snapshots',{withFileTypes:true}))if(e.isDirectory())copy(temp+'/source-snapshots/'+e.name+'/manifest.json','snapshot-manifests/'+e.name+'.json');
copy(temp+'/final-source-freeze-v1/manifest.json','final-source-freeze-manifest.json');
copy(temp+'/premerge-3854-source-freeze/manifest.json','premerge-3854-source-freeze-manifest.json');
copy(temp+'/image-asset-red-green-freeze-v1/manifest.json','image-asset-red-green-freeze-manifest.json');
copy(temp+'/index-profile-v1/evidence-index-v1.cpuprofile','index-profile/evidence-index-v1.cpuprofile');
const attr=target+'/.gitattributes';fs.writeFileSync(attr,'* -text whitespace=-blank-at-eol,-blank-at-eof,-space-before-tab,cr-at-eol\n');files.push({path:attr,sha256:sha(fs.readFileSync(attr)),original:'self-authored archive byte-preservation rule'});
fs.writeFileSync(target+'/archive-manifest.json',JSON.stringify({createdAt:new Date().toISOString(),purpose:'Exact self-authored Picture tools, original failed/passed raw logs and immutable source snapshot manifests. Full source snapshots and sandboxes remain external on M; no first-party target code/runtime/assets.',files},null,2)+'\n');console.log(JSON.stringify({files:files.length,manifestSha256:sha(fs.readFileSync(target+'/archive-manifest.json'))}));
