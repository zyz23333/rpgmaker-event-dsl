'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const isolation=require('./mv33-physical-isolation-v1.cjs');
async function main(){
  const root=path.join(__dirname,'mv33-physical-isolation-guard-probes-v1-'+crypto.randomUUID());await fs.mkdir(root);
  const source=path.join(root,'source');await fs.mkdir(source);await fs.writeFile(path.join(source,'carrier.json'),'original\n',{flag:'wx'});
  const baseline=await isolation.physicalTree(source),probes=[];
  async function reject(name,action){let error;try{await action();}catch(caught){error=caught;}assert.ok(error,name+' must reject');probes.push({name,passed:true,error:String(error.message)});}
  const junction=path.join(root,'junction');await fs.symlink(source,junction,'junction');
  await reject('junction root refused before write',()=>isolation.physicalTree(junction));
  await reject('junction source physical copy refused',()=>isolation.copyRegularTree(junction,path.join(root,'junction-copy-refused')));
  await reject('same physical root refused',()=>isolation.distinctTrees({a:source,b:source}));
  const nested=path.join(root,'nested');await fs.mkdir(nested);await fs.mkdir(path.join(nested,'inner'));
  await reject('nested roots refused',()=>isolation.distinctTrees({a:nested,b:path.join(nested,'inner')}));
  const hard=path.join(root,'hard');await fs.mkdir(hard);const hardFile=path.join(hard,'hard.json');await fs.writeFile(hardFile,'linked\n',{flag:'wx'});await fs.link(hardFile,path.join(hard,'alias.json'));
  await reject('hardlink count refused before write',()=>isolation.physicalTree(hard));
  await reject('hardlinked carrier write refused',()=>isolation.writeDataFile(hard,'hard.json','must not write\n'));
  assert.equal(await fs.readFile(hardFile,'utf8'),'linked\n');
  const copy=await isolation.copyRegularTree(source,path.join(root,'copy'));
  const pair=await isolation.distinctTrees({source,copy:path.join(root,'copy')});
  await isolation.writeDataFile(path.join(root,'copy'),'carrier.json','private changed\n');
  assert.deepEqual(await isolation.physicalTree(source),baseline);assert.equal(await fs.readFile(path.join(root,'copy/carrier.json'),'utf8'),'private changed\n');
  probes.push({name:'physical copy identities independent and destination write preserves source',passed:true});
  const report={purpose:'Negative physical isolation guards exercised only in fresh synthetic temporary trees; no reference/seed/game mutation',at:new Date().toISOString(),root,probes,copy,pair,passed:true};
  const file=path.join(root,'result.json');await fs.writeFile(file,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({file,sha256:isolation.sha(await fs.readFile(file)),passed:true,probes:probes.length},null,2));
}
main().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
