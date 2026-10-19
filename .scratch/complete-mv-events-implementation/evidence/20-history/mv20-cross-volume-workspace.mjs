import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {lstat,mkdtemp,readFile,readdir,readlink,stat,writeFile} from "node:fs/promises";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
const root="C:/Users/Shuen/.codex/worktrees/mv-ticket-20/rpgmaker-event-dsl";
const api=await import(pathToFileURL(join(root,"packages/rpgmaker-event-dsl/src/workspace-api.ts")));
const {createMinimalProject,withWindowsSandbox}=await import(pathToFileURL(join(root,"packages/rpgmaker-event-dsl/test/support/windows-sandbox.ts")));
const {discoverDefinitionFiles}=await import(pathToFileURL(join(root,"packages/rpgmaker-event-dsl/src/workspace/definitions.ts")));
async function tree(directory) {
 const result={};
 for(const entry of await readdir(directory,{withFileTypes:true}).catch(error=>{if(error.code==='ENOENT')return [];throw error;})) {
  if(entry.name==='operation.lock'||entry.name==='decompile-candidates')continue;
  const path=join(directory,entry.name),info=await lstat(path);
  if(info.isSymbolicLink())result[entry.name]='link:'+await readlink(path);
  else if(info.isDirectory()) {result[entry.name+'/']='directory';for(const [name,bytes]of Object.entries(await tree(path)))result[entry.name+'/'+name]=bytes;}
  else result[entry.name]=(await readFile(path)).toString('hex');
 }
 return result;
}
const report={native:'not-executed',purpose:'Actual public Workspace cross-volume refusal, separate from primitive probes',platform:process.platform,node:process.version,startedAt:new Date().toISOString(),scriptSha256:createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex')};
process.env.MV_KEEP_WINDOWS_SANDBOXES='1';
await withWindowsSandbox('mv20-cross-volume',async sandbox=>{
 const workspaceRoot=sandbox.workspaceRoot;
 const sourceRoot=await mkdtemp('F:/Shuen/RPG/mv20-cross-volume-');
 await createMinimalProject(workspaceRoot);
 await api.initWorkspace({workspaceRoot,projectRoot:'./Game'});
 await api.cloneWorkspace({workspaceRoot});
 const configPath=join(workspaceRoot,'rpgmaker-event-dsl.config.json');
 const config={...JSON.parse(await readFile(configPath,'utf8')),sourceRoot};
 await writeFile(configPath,JSON.stringify(config));
 const observe=async()=>({config:await readFile(configPath,'utf8'),source:await tree(join(workspaceRoot,'src')),externalSource:await tree(sourceRoot),project:await tree(join(workspaceRoot,'Game')),state:await tree(join(workspaceRoot,'.rpgmaker-event-dsl')),discovery:await discoverDefinitionFiles(workspaceRoot,config)});
 const before=await observe();let error;
 try{await api.decompileWorkspace({workspaceRoot});}catch(cause){error=cause.message;}
 assert.match(error,/same-filesystem.*cross-volume/s);
 const after=await observe();assert.deepEqual(after,before);
 Object.assign(report,{workspaceRoot,sourceRoot,volumes:{source:(await stat(sourceRoot)).dev,state:(await stat(join(workspaceRoot,'.rpgmaker-event-dsl'))).dev},before,after,error,passed:true});
});
report.completedAt=new Date().toISOString();
const output='C:/Users/Shuen/.codex/tmp/mv20-cross-volume-public-workspace-result.json';
await writeFile(output,JSON.stringify(report,null,2)+'\n');
process.stdout.write(output+'\n');
