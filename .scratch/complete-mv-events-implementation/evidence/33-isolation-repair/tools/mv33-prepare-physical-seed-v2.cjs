'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const isolation=require('./mv33-physical-isolation-v1.cjs');
async function main(){
  const reference='F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/NewData';
  const output=path.join(__dirname,'mv33-physical-seed-v2-'+crypto.randomUUID());
  await fs.mkdir(output);
  const seedRoot=path.join(output,'Seed');
  const copied=await isolation.copyRegularTree(reference,seedRoot);
  const assetSource=path.join(reference,'audio/bgm/Battle1.ogg'),bytes=await fs.readFile(assetSource);
  assert.equal(isolation.sha(bytes),'8bc028844de7792a07f36c4e080dfc2a585ee3f1a126074a1ef9e2c2408a98e7');
  const assetTarget=path.join(seedRoot,'audio/se/Movement33LongControl.ogg');
  await isolation.physicalTree(seedRoot);await fs.writeFile(assetTarget,bytes,{flag:'wx'});
  const fullSeed=await isolation.physicalTree(seedRoot);
  const dataIsolation=await isolation.distinctTrees({reference:path.join(reference,'data'),seed:path.join(seedRoot,'data')});
  assert.deepEqual(await isolation.physicalTree(reference),copied.source,'Reference changed during seed preparation');
  const manifest={purpose:'Physical private seed materialized from explicitly read current reference bytes. Current reference data may be altered by prior invalid runs; no claim of pristine shipped data. No reference writes or native launch.',at:new Date().toISOString(),reference,seedRoot,copy:copied,fullSeed,dataIsolation,asset:{source:assetSource,sha256:isolation.sha(bytes),target:assetTarget},nativeGate:'not-released',passed:true};
  const file=path.join(output,'manifest.json');await fs.writeFile(file,JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
  const pointer={seedRoot,reference,manifest:file,manifestSha256:isolation.sha(await fs.readFile(file)),dataFingerprint:dataIsolation.trees.seed.sha256,files:fullSeed.files.length,at:manifest.at,passed:true};
  await fs.writeFile(path.join(__dirname,'mv33-physical-seed-v2-pointer.json'),JSON.stringify(pointer,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(pointer,null,2));
}
main().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
