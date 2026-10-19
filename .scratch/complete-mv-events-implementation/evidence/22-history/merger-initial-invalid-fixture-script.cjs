const fs=require('node:fs/promises');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {syncBuiltinESMExports}=require('node:module');
const crypto=require('node:crypto');
const packageRoot='C:/Users/Shuen/.codex/worktrees/mv-ticket-22/rpgmaker-event-dsl/packages/rpgmaker-event-dsl';
const root='C:/Users/Shuen/.codex/tmp/mv22-merger-pending-capture-'+crypto.randomUUID();
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function ordered(v){return Array.isArray(v)?v.map(ordered):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>[k,ordered(x)])):v;}
(async()=>{
 await fs.mkdir(path.join(root,'Game/data'),{recursive:true});
 const fixture=JSON.parse(await fs.readFile(path.join(packageRoot,'test/fixtures/mv-evidence/common-event-project.json'),'utf8'));
 await fs.writeFile(path.join(root,'Game/Game.rpgproject'),'RPGMV 1.6.1\n');
 for(const [name,data]of Object.entries(fixture.projectFiles))await fs.writeFile(path.join(root,'Game/data',name),JSON.stringify(data));
 await fs.writeFile(path.join(root,'package.json'),'{"type":"module"}\n');
 const fixturePackage=path.join(root,'node_modules/rpgmaker-event-dsl');await fs.mkdir(fixturePackage,{recursive:true});
 await fs.writeFile(path.join(fixturePackage,'package.json'),JSON.stringify({name:'rpgmaker-event-dsl',type:'module',exports:{'.':{types:'./dist/index.d.mts'}}}));
 await fs.symlink(path.join(packageRoot,'dist'),path.join(fixturePackage,'dist'),'junction');
 const api=await import(pathToFileURL(path.join(packageRoot,'dist/workspace-api.mjs')).href);
 await api.initWorkspace({workspaceRoot:root,projectRoot:'./Game'});await api.cloneWorkspace({workspaceRoot:root});await api.decompileWorkspace({workspaceRoot:root});
 const sourcePath=path.join(root,'src/decompiled/common-events.events.ts');await fs.writeFile(sourcePath,(await fs.readFile(sourcePath,'utf8')).replace('Evidence Common Event','Authored merger capture'));
 await api.compileWorkspace({workspaceRoot:root,check:false});
 const state=path.join(root,'.rpgmaker-event-dsl'),manifestPath=path.join(state,'sync-manifest.json'),pendingPath=path.join(state,'pending-push/pending-push.json');
 const original=JSON.parse(await fs.readFile(manifestPath,'utf8'));
 const old=await fs.readFile(path.join(state,'project-data-snapshot/CommonEvents.json')),generated=await fs.readFile(path.join(state,'generated-project-data/CommonEvents.json'));
 await fs.mkdir(path.join(state,'pending-push/backup'),{recursive:true});await fs.writeFile(path.join(state,'pending-push/backup/CommonEvents.json'),old);
 const pending={version:3,startedAt:new Date().toISOString(),projectRootBinding:original.projectRootBinding,originalManifest:original,originalManifestHash:sha(JSON.stringify(ordered(original),null,2)+'\n'),affectedFiles:[{relativePath:'CommonEvents.json',backupRelativePath:'CommonEvents.json',snapshotHash:sha(old),backupHash:sha(old),generatedHash:sha(generated)}]};
 await fs.writeFile(pendingPath,JSON.stringify(pending,null,2)+'\n');await fs.writeFile(path.join(root,'Game/data/CommonEvents.json'),generated);
 const originalRead=fs.readFile;let injected=false,reads=0;
 fs.readFile=async function(file,...args){const bytes=await originalRead(file,...args);if(path.resolve(String(file))===pendingPath){reads++;if(!injected){injected=true;await fs.writeFile(pendingPath,JSON.stringify({...pending,version:999},null,2)+'\n');}}return bytes;};
 syncBuiltinESMExports();let actual;
 try{await api.pushWorkspace({workspaceRoot:root,allowDestructive:false});actual={ok:true};}catch(error){actual={ok:false,message:error.message};}
 fs.readFile=originalRead;syncBuiltinESMExports();
 const report={root,node:process.version,packageRoot,injected,reads,actual,pendingAfter:await originalRead(pendingPath,'utf8').catch(()=>null),snapshotEqualsGenerated:(await originalRead(path.join(state,'project-data-snapshot/CommonEvents.json'))).equals(generated),expected:'Reject observed pending replacement with unknown version999, preserve authoritative pending evidence and original synchronization metadata.'};
 await fs.writeFile(path.join(root,'result.json'),JSON.stringify(report,null,2)+'\n');process.stdout.write(JSON.stringify(report,null,2)+'\n');
})().catch(error=>{process.stderr.write(error.stack+'\n');process.exitCode=1;});
