'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const assert=require('node:assert/strict');
const isolation=require('./mv33-physical-isolation-v1.cjs');
const repo='C:/Users/Shuen/.codex/worktrees/mv-ticket-33/rpgmaker-event-dsl';
const relative='.scratch/complete-mv-events-implementation/evidence/33-isolation-repair',root=path.join(repo,relative);
async function copy(name,destination){const source=path.join(__dirname,name),bytes=await fs.readFile(source),output=path.join(root,destination);await fs.mkdir(path.dirname(output),{recursive:true});await fs.writeFile(output,bytes,{flag:'wx'});assert.deepEqual(await fs.readFile(output),bytes);return{source,archive:relative+'/'+destination,sha256:isolation.sha(bytes),bytes:bytes.length};}
async function main(){
  if(process.argv[2]==='stage'){
    const entries=[];
    for(const name of ['mv33-record-isolation-repair-v1.mts','mv33-record-isolation-repair-v2.mts','mv33-audit-isolation-repair-v1.cjs','mv33-archive-isolation-supplement-v1.cjs'])entries.push(await copy(name,'tools/'+name+(name.endsWith('.mts')?'.txt':'')));
    const storage={purpose:'Exact external evidence operator sources preserved inert where appropriate; no lint rule or scope exclusion. Recorderv1 transform failed before any execution; recorderv2 uses an async preparation callback without changing assertions.',at:new Date().toISOString(),entries};await fs.writeFile(path.join(root,'tool-storage-provenance-v1.json'),JSON.stringify(storage,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({staged:entries.length}));return;
  }
  assert.equal(process.argv[2],'receipt');
  const entries=[];
  for(const name of ['mv33-isolation-repair-archive-v1-original.log','mv33-isolation-repair-records-v1-original.log','mv33-isolation-repair-records-v2-original.log','mv33-isolation-index-v1-original.log','mv33-isolation-final-audit-v1-original.log','mv33-isolation-final-lint-v1-original.log'])entries.push(await copy(name,'logs/'+name));
  const all=[];async function walk(directory){for(const item of (await fs.readdir(directory,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const file=path.join(directory,item.name);if(item.isDirectory())await walk(file);else{assert.equal(item.isFile(),true);const bytes=await fs.readFile(file);all.push({path:path.relative(repo,file).replaceAll('\\','/'),bytes:bytes.length,sha256:isolation.sha(bytes)});}}}await walk(root);
  const manifest={purpose:'Append-only final repair supplement; every current repair archive file including original recorder bytes and generated metadata is covered. No first-party carriers/engine/assets included.',at:new Date().toISOString(),entries,files:all,passed:true};await fs.writeFile(path.join(root,'archive-supplement-v1.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({files:all.length,entries:entries.length,passed:true}));
}
main().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
