'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {files,sha,strictJson,assertStrictInput}=require('./utilities-v1.cjs');
const triggers=require('./r1-triggers-export-v1.cjs');
const routes=require('./r1-routes-export-v1.cjs');
const choices=require('./r3-choices-controls-export-v1.cjs');
const conditional=require('./conditional-scenarios-export-v3.cjs');
const battleResults=require('./battle-results-v1.cjs');
const battleContexts=require('./battle-contexts-v1.cjs');
const descriptors=[
 {id:'r1-triggers-pages-common',group:'R1',kind:'triggers'},
 {id:'r1-autonomous-forced-route-waits',group:'R1',kind:'routes'},
 ...choices.definitions.choiceCases.map((c,i)=>({id:'r3-choice-'+c.id,group:'R3',kind:'choice',index:i})),
 {id:'r3-choice-numeric-saved-both-negative-zero',group:'R3',kind:'numeric-choice'},
 ...choices.definitions.controlCases.map((c,i)=>({id:'r3-control-'+c.id,group:'R3',kind:'control',index:i})),
 ...conditional.descriptors.map((c,i)=>({id:'conditional-'+c.id,group:c.kind==='r2'?'R2':'R3',kind:'conditional',index:i,execution:['original-common','direct','supplement','r2'].includes(c.kind)?'expected-product-refusal':'native-pair'})),
 {id:'r2-legal-full-seventeen-pages-three-turns',group:'R2',kind:'legal-conditional',index:6},
 ...[0,1,2].map(index=>({id:'conditional-legal-'+conditional.descriptors[index].id,group:'R3',kind:'legal-conditional',index})),
 ...battleResults.descriptors,
 battleContexts.descriptor,
];
async function completeFixture(f,seed){
 for(const file of await files(path.join(seed,'data'))){const name=path.relative(path.join(seed,'data'),file).replaceAll('\\','/');if(name.endsWith('.json')&&!Object.hasOwn(f.carriers,name))f.carriers[name]=JSON.parse(await fs.readFile(file,'utf8'));}
 assert.equal(Object.keys(f.carriers).length,15,'All15 saved carriers required');
 f.loadedCarriers={};for(const name of['Map001.json','CommonEvents.json','Troops.json','System.json'])f.loadedCarriers[name]=structuredClone(f.carriers[name]);
 f.loadedCarriers['Map001.json'].meta={};for(const e of f.loadedCarriers['Map001.json'].events)if(e&&typeof e.note==='string')e.meta={};
 assertStrictInput(f.carriers);assertStrictInput(f.loadedCarriers);return f;
}
function differences(a,b,at='',result=[]){
 if(Object.is(a,b))return result;
 if(a&&b&&typeof a==='object'&&typeof b==='object'&&Array.isArray(a)===Array.isArray(b)){
  assert.deepEqual(Object.keys(a),Object.keys(b),'Same keys at '+at);
  for(const k of Object.keys(a))differences(a[k],b[k],at+'/'+k,result);
 }else result.push({path:at,before:a,after:b});return result;
}
function enemyHpViolations(carriers){const result=[];function visit(v,at){if(v&&typeof v==='object'){
 if(v.code===331&&Array.isArray(v.parameters)&&v.parameters[2]===0&&(v.parameters[3]<1||v.parameters[3]>9999))result.push({path:at+'/parameters/3',value:v.parameters[3],accepted:'Enemy HP constant integer1..9999'});
 for(const[k,child]of Object.entries(v))visit(child,at+'/'+k);
 }}visit(carriers,'');return result;}
function numericCase(){const c=structuredClone(choices.definitions.choiceCases[1]);c.id='numeric-saved-both-negative-zero';c.list[0].parameters[1]=-0;c.list[0].parameters[2]=-0;c.choice={savedDefault:-0,nativeDefault:-0,savedCancel:-0,nativeCancel:-0,index:-0};return c;}
async function buildScenario(d){
 let original;
 if(d.kind==='triggers')original=triggers.scenario;
 else if(d.kind==='routes')original=routes.scenario;
 else if(d.kind==='battle-result')original=await battleResults.buildScenario(d);
 else if(d.kind==='battle-contexts')original=await battleContexts.buildScenario();
 else if(['choice','control','numeric-choice'].includes(d.kind)){
  const definition=d.kind==='choice'?choices.definitions.choiceCases[d.index]:d.kind==='control'?choices.definitions.controlCases[d.index]:numericCase();
  original=(await choices.buildScenario(definition)).scenario;
 }else original=await conditional.buildScenario(conditional.descriptors[d.index]);
 const scenario={...original,slug:'final52-'+d.id,scriptPath:__filename,plan:{...original.plan,finalTicket:52,descriptor:d,preparationOnly:true}};
 scenario.fixture=async function(seed){
  const f=await completeFixture(structuredClone(await original.fixture(seed)),seed);
  if(d.kind==='legal-conditional'){
   const before=structuredClone(f.carriers),violations=enemyHpViolations(before);
   assert.equal(violations.length,d.index===6?1:2,'Original invalid amount locations retained');
   for(const item of violations){assert.equal(item.value,9999999);const keys=item.path.slice(1).split('/');let target=f.carriers;for(const key of keys.slice(0,-1))target=target[key];target[keys.at(-1)]=9999;}
   const diff=differences(before,f.carriers);assert.deepEqual(diff,violations.map(v=>({path:v.path,before:9999999,after:9999})),'Only documented Enemy HP constants may differ');
   const enemies=f.carriers['Enemies.json'].filter(Boolean);assert.ok(enemies.length>0);assert.ok(enemies.every(e=>!e.params||e.params[0]<=9999),'Legal kill amount still exceeds fixture enemy base HP');
   if(d.index===6){assert.equal(f.carriers['Troops.json'][1].pages.length,17);assert.deepEqual(diff,[{path:'/Troops.json/1/pages/16/list/1/parameters/3',before:9999999,after:9999}]);}
   f.legalVariant={baseScenario:conditional.descriptors[d.index].id,changes:diff,oracle:'Original observer and complete oracle unchanged',enemyBaseHp:enemies.map(e=>({id:e.id,hp:e.params?.[0]})),justification:'9999 remains sufficient to defeat the finite fixture target while remaining in the accepted Enemy HP constant domain. Actual native scheduling consequences still require final execution.'};
   await completeFixture(f,seed);
  }
  f.preparation={ticket:52,scenario:d.id,status:'static-only; no product/game execution',physicalPolicy:'Final support copies separate ordinary project files with dereference; no runtime assets/data links',savedInputViolations:enemyHpViolations(f.carriers)};
  return f;
 };
 // Preserve all saved numbers during name-only source-difference preparation.
 if(d.kind==='triggers'||d.kind==='routes'){
  scenario.observer=original.observer.replace('function copy(value){return JSON.parse(JSON.stringify(value));}',strictJson.toString()+'\nfunction copy(value){return JSON.parse(strictJson(value));}').replace("'System.json':copy($dataSystem)","'System.json':copy($dataSystem),'Troops.json':copy($dataTroops)").replace("'runtime-result.json'),JSON.stringify(","'runtime-result.json'),strictJson(");
 }
 return scenario;
}
module.exports={descriptors,buildScenario,enemyHpViolations,differences};
