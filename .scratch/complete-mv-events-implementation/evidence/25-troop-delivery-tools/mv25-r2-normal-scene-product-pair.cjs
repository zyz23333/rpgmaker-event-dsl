'use strict';
const fs=require('node:fs/promises'), path=require('node:path'),crypto=require('node:crypto'), assert=require('node:assert/strict');
const support=require('./mv-native-pair-support-v5.cjs');
const base=require('./mv-r2-normal-scene-scheduling-native.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function editSources(workspaceRoot){
 const changes=[];
 for(const [relative,marker,replacement]of [
  ['src/decompiled/maps/Map001.events.ts','PAIR-SEED Normal-input R2 battle launch','Normal-input R2 battle launch'],
  ['src/decompiled/troop-events.events.ts','PAIR-SEED owned harmless R2 comment',null],
 ]){
  const target=path.join(workspaceRoot,relative),before=await fs.readFile(target,'utf8');assert.ok(before.includes(marker),'actual formal source has marker '+relative);
  const after=replacement===null?before.replace(/^\s*comment\(\["PAIR-SEED owned harmless R2 comment"\]\),?\r?\n/m,''):before.replace(marker,replacement);
  assert.notEqual(after,before);assert.ok(!after.includes(marker));await fs.writeFile(target,after);changes.push({relative,beforeSha256:sha(before),afterSha256:sha(after),before,after});
 }
 return changes;
}
(async()=>{
 const packageRoot=process.argv[2],scenario=base.makeFuturePairScenario(editSources);
 scenario.slug='mv25-r2-normal-scene-product-pair';scenario.scriptPath=__filename;
 scenario.plan={...scenario.plan,purpose:'Ticket25 allocated R2 actual literal/formal-DSL normal Scene/Input product comparison; final52 remains separate',baseScenarioPath:require.resolve('./mv-r2-normal-scene-scheduling-native.cjs'),baseScenarioSha256:sha(await fs.readFile(require.resolve('./mv-r2-normal-scene-scheduling-native.cjs'))),harnessPath:require.resolve('./mv-native-pair-support-v5.cjs'),harnessSha256:sha(await fs.readFile(require.resolve('./mv-native-pair-support-v5.cjs')))};
 scenario.observer=base.observer.replace('R2 independent literal normal Scene/Input control; future Troop product pair deferred','Ticket25 allocated R2 normal Scene/Input actual game observation');
 const report=await support.runPair({packageRoot,seedRoot:'F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/NewData',host:'F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/nwjs-win-test/game.exe',outputRoot:'C:/Users/Shuen/.codex/tmp',timeoutMs:60000},scenario);
 await fs.writeFile(path.join(report.root,'delivery-assessment.json'),JSON.stringify({purpose:scenario.plan.purpose,passed:report.passed,at:new Date().toISOString(),sourceLayer:'New delivery runner derives a fresh independent input from the frozen scenario; old reports and tool bytes unchanged',baseScenarioSha256:scenario.plan.baseScenarioSha256,harnessSha256:scenario.plan.harnessSha256,allocatedTicket:'25',finalRegression:'52 still required'},null,2)+'\n',{flag:'wx'});
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
