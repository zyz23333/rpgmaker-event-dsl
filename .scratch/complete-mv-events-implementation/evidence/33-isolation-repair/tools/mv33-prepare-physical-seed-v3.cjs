'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const isolation=require('./mv33-physical-isolation-v1.cjs');
async function main(){
  const restorationPath=path.join(__dirname,'mv-native-reference-restoration-dc5069b8-0cf6-4c1d-8162-1187fc40a301/result.json');
  const restorationBytes=await fs.readFile(restorationPath);
  assert.equal(isolation.sha(restorationBytes),'879e83cfd01dd8022487aa571fc29fb75eeed001855d20e784d3306defa0b9b0');
  const restoration=JSON.parse(restorationBytes);assert.equal(restoration.all15EqualVerifiedOriginal,true);
  const provenancePath=path.join(__dirname,'mv-native-reference-provenance-audit-25000417-5679-4cb9-a191-039ec145d5d1/audit.json');
  const provenanceBytes=await fs.readFile(provenancePath);
  const reference='F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/NewData';
  const referenceData=await isolation.physicalTree(path.join(reference,'data'));
  assert.equal(referenceData.files.length,15);assert.equal(restoration.after.length,15);
  for(const expected of restoration.after){const actual=referenceData.files.find(e=>e.path===expected.name);assert.ok(actual);assert.equal(actual.sha256,expected.sha256);assert.equal(actual.bytes,expected.bytes);}
  const output=path.join(__dirname,'mv33-physical-seed-v3-'+crypto.randomUUID());await fs.mkdir(output);
  const seedRoot=path.join(output,'Seed'),copied=await isolation.copyRegularTree(reference,seedRoot);
  const assetSource=path.join(reference,'audio/bgm/Battle1.ogg'),bytes=await fs.readFile(assetSource);
  assert.equal(isolation.sha(bytes),'8bc028844de7792a07f36c4e080dfc2a585ee3f1a126074a1ef9e2c2408a98e7');
  const assetTarget=path.join(seedRoot,'audio/se/Movement33LongControl.ogg');
  await isolation.physicalTree(seedRoot);await fs.writeFile(assetTarget,bytes,{flag:'wx'});
  const fullSeed=await isolation.physicalTree(seedRoot);
  const dataIsolation=await isolation.distinctTrees({reference:path.join(reference,'data'),seed:path.join(seedRoot,'data')});
  assert.deepEqual(dataIsolation.trees.reference,referenceData);assert.deepEqual(dataIsolation.trees.seed.files,referenceData.files);
  assert.deepEqual(await isolation.physicalTree(reference),copied.source,'Reference changed during seed preparation');
  const manifest={purpose:'Physical independent private seed copied from the verified restored original reference. All15 match restoration provenance. No reference writes or native launch.',at:new Date().toISOString(),reference,seedRoot,verifiedRestoration:{path:restorationPath,sha256:isolation.sha(restorationBytes),all15EqualVerifiedOriginal:true},provenance:{path:provenancePath,sha256:isolation.sha(provenanceBytes)},copy:copied,fullSeed,dataIsolation,asset:{source:assetSource,sha256:isolation.sha(bytes),target:assetTarget},nativeGate:'not-released',passed:true};
  const file=path.join(output,'manifest.json');await fs.writeFile(file,JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
  const pointer={seedRoot,reference,manifest:file,manifestSha256:isolation.sha(await fs.readFile(file)),dataFingerprint:dataIsolation.trees.seed.sha256,files:fullSeed.files.length,verifiedRestoration:manifest.verifiedRestoration,at:manifest.at,passed:true};
  await fs.writeFile(path.join(__dirname,'mv33-physical-seed-v3-pointer.json'),JSON.stringify(pointer,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(pointer,null,2));
}
main().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
