const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=process.cwd(),temp='M:/Shuen/Codex/mv-events-implementation-20261020/ticket35-temp',e='.scratch/complete-mv-events-implementation/evidence/',base='38542767606ff9712e45d2a8e4894558e3a7d385';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const git=args=>cp.execFileSync('git',args,{cwd:root,maxBuffer:64*1024*1024});
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(path.join(d,x.name)):[path.join(d,x.name)]).sort();
const reqBytes=fs.readFileSync(e+'requirements.json'), incoming=git(['show',base+':'+e+'requirements.json']),rows=JSON.parse(reqBytes).requirements,oldRows=JSON.parse(incoming).requirements;
assert.deepStrictEqual(rows.slice(0,oldRows.length),oldRows);assert.equal(rows.length,oldRows.length+6);
assert.equal(reqBytes.toString().slice(0,incoming.toString().lastIndexOf('\n  ]')),incoming.toString().slice(0,incoming.toString().lastIndexOf('\n  ]')));
assert.ok(fs.readFileSync(e+'README.md','utf8').startsWith(git(['show',base+':'+e+'README.md']).toString()));
const histories={};
for(const revision of ['c2a40a41c094ccdda47faccd4399891952739008',base]) {
 const entries=git(['ls-tree','-r','-z',revision,'--',e]).toString().split('\0').filter(Boolean).map(x=>{const [meta,p]=x.split('\t');return {path:p,blob:meta.split(' ')[2]};}).filter(x=>![e+'requirements.json',e+'README.md'].includes(x.path));
 for(const x of entries){const bytes=fs.readFileSync(x.path),blob=crypto.createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');assert.equal(blob,x.blob,'historical bytes changed: '+x.path);}
 histories[revision]={preservedBlobFiles:entries.length,manifestSha256:sha(JSON.stringify(entries)),files:entries};
}
const resultInputs=walk(path.join(temp,'results')).filter(p=>p.endsWith('.json'));
const resultManifest=resultInputs.map(p=>{const bytes=fs.readFileSync(p),r=JSON.parse(bytes);assert.equal(r.environment.native,'not-executed');const target=e+'results/35-dev/'+path.basename(p);fs.mkdirSync(path.dirname(target),{recursive:true});if(fs.existsSync(target))assert.deepStrictEqual(fs.readFileSync(target),bytes);else fs.writeFileSync(target,bytes);return {path:target,sha256:sha(bytes),requirementId:r.requirementId,status:r.status};});
const byStatus={};for(const r of resultManifest)byStatus[r.status]=(byStatus[r.status]??0)+1;
const latest=resultInputs.map(p=>({p,r:JSON.parse(fs.readFileSync(p))})).filter(x=>x.r.requirementId==='MV-S6-CHARACTER-001'&&x.r.status==='passed'&&x.r.source.revision===base).sort((a,b)=>a.r.completedAt.localeCompare(b.r.completedAt)).at(-1);assert.ok(latest,'no latest matrix result');
const freeze=path.join(temp,'final-actual3854-source-freeze');if(fs.existsSync(freeze))throw Error('immutable freeze exists');fs.mkdirSync(freeze,{recursive:true});
for(const f of latest.r.source.files){const bytes=fs.readFileSync(f.path);assert.equal(sha(bytes),f.sha256,'current input changed since execution: '+f.path);const target=path.join(freeze,'files',f.path);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);}
const productFiles=latest.r.source.files.filter(f=>f.path.startsWith('packages/rpgmaker-event-dsl/src/'));
const source={dirtyBase:base,status:git(['status','--porcelain=v1']).toString(),executionResult:latest.p,capturedInputFingerprint:latest.r.source.fingerprint,capturedInputFiles:latest.r.source.files,productSourceFingerprint:sha(JSON.stringify(productFiles)),productSourceFiles:productFiles,contract:'mv-1.6.1/10',dist:'not-built / no dist in this worktree',freeze};
fs.writeFileSync(path.join(freeze,'manifest.json'),JSON.stringify(source,null,2)+'\n');
const audit={createdAt:new Date().toISOString(),base,incomingRequirements:oldRows.length,ownRequirements:6,totalRequirements:rows.length,inheritedObjectsDeepEqual:true,inheritedRawRequirementPrefixExact:true,inheritedReadmePrefixExact:true,histories,resultCount:resultManifest.length,resultsByStatus:byStatus,results:resultManifest,source};
fs.writeFileSync(e+'35-map-characters-history-audit.json',JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify({incomingRequirements:oldRows.length,totalRequirements:rows.length,historicalFiles:Object.fromEntries(Object.entries(histories).map(([r,v])=>[r,v.preservedBlobFiles])),resultCount:resultManifest.length,resultsByStatus:byStatus,sourceFiles:productFiles.length,inputFiles:latest.r.source.files.length,productSourceFingerprint:source.productSourceFingerprint,capturedInputFingerprint:source.capturedInputFingerprint,freeze,auditSha256:sha(fs.readFileSync(e+'35-map-characters-history-audit.json'))}));
