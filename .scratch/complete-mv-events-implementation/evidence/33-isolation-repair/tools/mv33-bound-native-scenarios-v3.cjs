'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function run(id,scriptPath){
  const prior=require('./mv33-bound-native-scenarios-v1.cjs').createScenario(id,scriptPath);
  const seedPointer=JSON.parse(await fs.readFile(path.join(__dirname,'mv33-physical-seed-v3-pointer.json'),'utf8'));
  assert.equal(sha(await fs.readFile(seedPointer.manifest)),seedPointer.manifestSha256);
  const scenario={...prior.scenario,slug:id==='r1'?'mv33-r1-route-waits-delivery-v4':'mv33-r6-r7-movement-delivery-v5',plan:{...prior.scenario.plan,isolationRepair:'Physical independent seed/projects/data, inode/nlink/realpath guards and unchanged reference/seed/literal across actual Compile/Push; original observer and13/19 predicates unchanged.'},async fixture(seed){assert.equal(path.resolve(seed).toLowerCase(),path.resolve(seedPointer.seedRoot).toLowerCase());const binding=await prior.scenario.inputBinding();const bundleBytes=await fs.readFile(binding.independentFixture.path);assert.equal(sha(bundleBytes),binding.independentFixture.sha256);return structuredClone(JSON.parse(bundleBytes).fixture);},async inputBinding(){const binding=await prior.scenario.inputBinding();return{...binding,physicalSeed:{manifest:seedPointer.manifest,sha256:seedPointer.manifestSha256,seedRoot:seedPointer.seedRoot},additionalOriginalTools:[...binding.additionalOriginalTools,__filename,path.join(__dirname,'mv33-physical-isolation-v1.cjs')]};}};
  const args=Object.fromEntries(process.argv.slice(2).map(text=>{const at=text.indexOf('=');assert.ok(at>2);return[text.slice(2,at),text.slice(at+1)];}));
  const options={...prior.options,seedRoot:seedPointer.seedRoot,referenceRoot:seedPointer.reference,mode:args.mode||'prepare',nativeGateRelease:args.nativeGateRelease||null};
  return require('./mv33-native-pair-delivery-v4.cjs').runPair(options,scenario);
}
module.exports={run};
