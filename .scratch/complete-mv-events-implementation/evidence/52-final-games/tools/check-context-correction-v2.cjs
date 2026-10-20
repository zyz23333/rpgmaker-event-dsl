'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const {sha,strictJson,assertStrictInput}=require('./utilities-v1.cjs');
const before=require('./scenarios-v1.cjs'),after=require('./scenarios-v3.cjs');
async function main(){
 const id='r2-battle-skip-name-skip-residual-troop-and-abort',seed='F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/NewData';
 const a=await before.buildScenario(before.descriptors.find(d=>d.id===id)),b=await after.buildScenario(after.descriptors.find(d=>d.id===id)),fa=await a.fixture(seed),fb=await b.fixture(seed);
 assertStrictInput(fb.carriers);assertStrictInput(fb.loadedCarriers);new vm.Script(b.observer);
 const oldList=fa.carriers['Map001.json'].events[1].pages[0].list,newList=fb.carriers['Map001.json'].events[1].pages[0].list;
 const added=newList.filter(r=>r.code===334||r.code===331&&r.parameters[1]===1&&r.parameters[3]===5||r.code===355&&/map-after-residual-(recover|live-hp)/.test(r.parameters[0]));
 assert.equal(added.length,4);assert.deepEqual(added.filter(r=>r.code!==355),[{code:334,indent:0,parameters:[0]},{code:331,indent:0,parameters:[0,1,0,5,false]}]);
 const originalCommands=newList.filter(r=>!added.includes(r));assert.deepEqual(originalCommands,oldList,'Every original saved command retained unchanged and in order');
 const restored=structuredClone(fb.carriers);restored['Map001.json'].events[1].pages[0].list=oldList;assert.deepEqual(restored,fa.carriers,'No other saved input changes');
 assert.deepEqual(fb.expected.order.filter(id=>!['map-after-residual-recover','map-after-residual-live-hp'].includes(id)),fa.expected.order);
 const expectedCopy={...fb.expected};delete expectedCopy.residualDeadTroopHpSkipped;expectedCopy.order=fa.expected.order;expectedCopy.escapeCount=0;assert.deepEqual(expectedCopy,fa.expected,'All original expectation keys retained; only independently justified escape count changes and new predicate/markers');
 const inputFile=path.join(__dirname,'inputs',id+'-v2.json');await fs.writeFile(inputFile,strictJson(fb)+'\n',{flag:'wx'});
 const tools=[];for(const name of['battle-contexts-v1.cjs','battle-contexts-v2.cjs','scenarios-v1.cjs','scenarios-v3.cjs','run-final-v4.cjs'])tools.push({path:path.join(__dirname,name),sha256:sha(await fs.readFile(path.join(__dirname,name)))});
 const record={at:new Date().toISOString(),id,kind:'Explicit synthetic fixture and oracle premise correction; no product/domain/engine change',originalFailure:'M:/mv52/batch-587c0a87-fba2-4160-b9cb-d8560d1fd3c1/result-'+id+'.json',facts:[{file:'rpg_objects.js',lines:'9045-9055',fact:'changeHp acts only on alive targets; dead residual E331gain stays0'},{file:'rpg_objects.js',lines:'10403-10407',fact:'Native E334 recoverAll revives the residual target'},{file:'rpg_managers.js',lines:'2624-2629/2662-2665',fact:'checkAbort sets escaped true before processAbort/result1'}],savedChanges:'Retain every original command in order; insert only native E334recover, its trace, native E331lose5 and its trace after original dead-target HP trace',expectedChanges:'Add dead-target no-op predicate and two markers; strengthen residualHP predicate to0→0→100→95; escapeCount0→1 according to shipped code and both original native observations; all other predicates unchanged',tools,input:{id,group:'R2',execution:'native-pair',inputFile,inputSha256:sha(await fs.readFile(inputFile)),savedCarriers:Object.keys(fb.carriers).sort(),carriersSha256:sha(strictJson(fb.carriers)),observerSha256:sha(b.observer),affectedCarriers:b.affectedCarriers,expected:fb.expected,violations:[]}};
 await fs.writeFile(path.join(__dirname,'context-premise-correction-v2.json'),strictJson(record)+'\n',{flag:'wx'});console.log(strictJson({passed:true,id,originalCommandsRetained:true,onlyAddedSavedCommands:added.length,expectedCount:fb.expected.escapeCount,inputFile}));
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
