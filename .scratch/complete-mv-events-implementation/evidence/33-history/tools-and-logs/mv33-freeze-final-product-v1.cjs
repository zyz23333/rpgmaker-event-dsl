const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const root='C:/Users/Shuen/.codex/worktrees/mv-ticket-33/rpgmaker-event-dsl';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const git=(...args)=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8',windowsHide:true,maxBuffer:64*1024*1024});
const out=path.join(__dirname,'mv33-final-product-preserved-'+crypto.randomUUID());
fs.mkdirSync(out);
const entries=[];
function save(relative){const file=path.join(root,relative),b=fs.readFileSync(file),target=path.join(out,'captured',relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,b,{flag:'wx'});entries.push({path:relative.replaceAll('\\','/'),sha256:sha(b),bytes:b.length,originalModifiedAt:fs.statSync(file).mtime.toISOString(),capturedPath:path.relative(out,target).replaceAll('\\','/')});}
function walk(relative){for(const e of fs.readdirSync(path.join(root,relative),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const name=path.join(relative,e.name);if(e.isDirectory())walk(name);else if(e.isFile())save(name);}}
for(const dir of ['packages/rpgmaker-event-dsl/src','packages/rpgmaker-event-dsl/dist','packages/rpgmaker-event-dsl/test'])walk(dir);
for(const file of ['package.json','pnpm-lock.yaml','tsconfig.base.json','.github/workflows/ci.yml','packages/rpgmaker-event-dsl/package.json','packages/rpgmaker-event-dsl/tsconfig.json','packages/rpgmaker-event-dsl/vitest.config.ts','packages/rpgmaker-event-dsl/vitest.windows.config.ts','.scratch/complete-mv-events-implementation/evidence/requirements.json'])save(file);
const fingerprints={};
for(const name of ['src','dist']){const prefix='packages/rpgmaker-event-dsl/'+name+'/';const subset=entries.filter(e=>e.path.startsWith(prefix)).map(e=>({path:e.path.slice(prefix.length),sha256:e.sha256}));assert.ok(subset.length>0);fingerprints[name]={entries:subset,sha256:sha(JSON.stringify(subset))};}
const manifest={purpose:'Immutable complete actual33 source and built output, including all imported chunks/types/maps; original clean/dirty Git state is retained. No first-party files.',at:new Date().toISOString(),root,gitHead:git('rev-parse','HEAD').trim(),gitTree:git('rev-parse','HEAD^{tree}').trim(),gitStatus:git('status','--short'),gitDiff:git('diff','--binary','HEAD'),contract:'mv-1.6.1/9',node:process.version,nodePath:process.execPath,nodeSha256:sha(fs.readFileSync(process.execPath)),fingerprints,entries};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
const pointer={root:out,manifest:path.join(out,'manifest.json'),sha256:sha(fs.readFileSync(path.join(out,'manifest.json'))),head:manifest.gitHead,status:manifest.gitStatus,srcFiles:fingerprints.src.entries.length,src:fingerprints.src.sha256,distFiles:fingerprints.dist.entries.length,dist:fingerprints.dist.sha256};
fs.writeFileSync(path.join(__dirname,'mv33-final-product-preserved-pointer-v1.json'),JSON.stringify(pointer,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(pointer,null,2));
