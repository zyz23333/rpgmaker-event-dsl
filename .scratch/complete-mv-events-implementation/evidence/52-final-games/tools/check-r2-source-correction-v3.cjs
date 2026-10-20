'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {sha,strictJson}=require('./utilities-v1.cjs');
const before=require('./scenarios-v1.cjs'),after=require('./scenarios-v2.cjs');
async function main(){
 const id='r2-legal-full-seventeen-pages-three-turns',seed='F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/NewData';
 const a=await before.buildScenario(before.descriptors.find(d=>d.id===id)),b=await after.buildScenario(after.descriptors.find(d=>d.id===id));
 const fa=await a.fixture(seed),fb=await b.fixture(seed);assert.equal(strictJson(fa),strictJson(fb),'Entire complete fixture unchanged');assert.equal(a.observer,b.observer,'Every original predicate and observer byte unchanged');
 assert.deepEqual(a.affectedCarriers,['Map001.json','Troops.json']);assert.deepEqual(b.affectedCarriers,['Map001.json','CommonEvents.json','Troops.json']);
 const tools=[];for(const name of['conditional-scenarios-export-v2.cjs','conditional-scenarios-export-v3.cjs','scenarios-v1.cjs','scenarios-v2.cjs','run-final-v2.cjs','run-final-v3.cjs'])tools.push({path:path.join(__dirname,name),sha256:sha(await fs.readFile(path.join(__dirname,name)))});
 await fs.writeFile(path.join(__dirname,'full-r2-source-edits-correction-v3.json'),strictJson({at:new Date().toISOString(),id,reason:'Complete15-carrier fixture retains CommonEvent1, and unchanged seedDifference prefixes that Common name too. Formal source restoration correctly edits3 files; old expectedCount2 was wrong.',originalFailure:'M:/mv52/batch-587c0a87-fba2-4160-b9cb-d8560d1fd3c1/s-bb8bbcc98c4e-c65c0771/pair-result.json',fixtureSha256:sha(strictJson(fa)),observerSha256:sha(a.observer),completeFixtureUnchanged:true,completeObserverUnchanged:true,beforeAffected:a.affectedCarriers,afterAffected:b.affectedCarriers,tools})+'\n',{flag:'wx'});
 console.log(strictJson({passed:true,fixtureUnchanged:true,observerUnchanged:true,expectedSourceEdits:3,affectedCarriers:b.affectedCarriers}));
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
