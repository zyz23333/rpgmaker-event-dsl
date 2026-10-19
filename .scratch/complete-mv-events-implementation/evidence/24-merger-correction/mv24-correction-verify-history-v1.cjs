'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root='C:/Users/Shuen/.codex/worktrees/mv-ticket-24/rpgmaker-event-dsl';
const prefix='.scratch/complete-mv-events-implementation/evidence';
const history=path.join(root,prefix,'24-merger-correction');
const oldRevision='cdae5f8046a79ea926c90ecc68855c74d08b870d';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const git=(args,encoding)=>cp.execFileSync('git',args,{cwd:root,windowsHide:true,...(encoding?{encoding}: {})});
const originalIndex=JSON.parse(git(['show',`${oldRevision}:${prefix}/requirements.json`],'utf8'));
const currentIndex=JSON.parse(fs.readFileSync(path.join(root,prefix,'requirements.json')));
assert.equal(originalIndex.requirements.length,225);assert.equal(currentIndex.requirements.length,226);
assert.deepEqual(currentIndex.requirements.slice(0,225),originalIndex.requirements);
assert.equal(currentIndex.requirements[225].id,'MV-S5-MAP-011');
const originalNames=git(['ls-tree','-r','--name-only',oldRevision,'--',`${prefix}/results`,`${prefix}/24-history`],'utf8').trim().split(/\r?\n/).filter(Boolean);
const originals=originalNames.map(name=>{
 const before=git(['show',`${oldRevision}:${name}`]),after=fs.readFileSync(path.join(root,name));
 assert.deepEqual(after,before,`Historical byte mismatch ${name}`);
 return{path:name,bytes:after.length,sha256:sha(after),unchanged:true};
});
const copied=JSON.parse(fs.readFileSync(path.join(history,'outside-copy-map.json'))).copies;
const copiedByPath=new Map(copied.map(x=>[x.destination,x]));
function files(directory){return fs.readdirSync(directory,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(directory,e.name)):[path.join(directory,e.name)]);}
const candidates=[...files(history),...files(path.join(root,prefix,'results')).filter(file=>!originalNames.includes(path.relative(root,file).split(path.sep).join('/')))];
const authored=new Set([`${prefix}/24-merger-correction/.gitattributes`,`${prefix}/24-merger-correction/README.md`]);
const entries=candidates.map(file=>{
 const name=path.relative(root,file).split(path.sep).join('/'),bytes=fs.readFileSync(file),copy=copiedByPath.get(name);
 if(copy){assert.equal(sha(fs.readFileSync(copy.source)),copy.sourceSha256);assert.equal(sha(bytes),copy.sourceSha256);}
 return{path:name,origin:copy?'outside-copy':authored.has(name)?'authored':'repository-generated',bytes:bytes.length,sha256:sha(bytes),...(copy?{source:copy.source,sourceSha256:copy.sourceSha256}: {})};
}).sort((a,b)=>a.path.localeCompare(b.path));
const nativeRecords=entries.filter(e=>e.path.includes('/results/')&&e.origin==='repository-generated');
assert.equal(nativeRecords.length,5,'Two native and three E comparison wrappers are first-created in repository');
const addedResults=entries.filter(e=>e.path.includes('/results/'));assert.equal(addedResults.length,159);
const result={purpose:'Immutable initial ticket24 evidence and prior225 requirement verification; exact correction artifact origins',at:new Date().toISOString(),node:process.version,oldRevision,priorRequirementObjects:225,addedRequirement:'MV-S5-MAP-011',originalArtifacts:originals,entries,addedResults:159,limits:'The map omits itself to avoid a self-referential hash; it is a repository-generated audit. Product code and current explanatory docs intentionally change. No old captured result or24-history artifact changes.',passed:true};
fs.writeFileSync(path.join(history,'archive-origin-map.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({priorRequirementObjects:225,originalArtifacts:originals.length,addedResults:159,origins:Object.fromEntries(['outside-copy','repository-generated','authored'].map(origin=>[origin,entries.filter(e=>e.origin===origin).length])),passed:true}));
