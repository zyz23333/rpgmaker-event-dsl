import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {inflateSync} from 'node:zlib';
import assert from 'node:assert/strict';
const root='M:/Shuen/Codex/mv-events-implementation-20261020/worktrees/mv-ticket-26-final';
const output='M:/Shuen/Codex/mv-events-implementation-20261020/ticket26-final';
const run=path.join(output,'e4-built-v1-'+randomUUID());
await fs.mkdir(run,{recursive:false});
const startedAt=new Date().toISOString();
const hash=b=>createHash('sha256').update(b).digest('hex');
const json=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const git=(...a)=>execFileSync('git',['-C',root,...a],{encoding:'utf8'}).trimEnd();
const report={startedAt,run,kind:'Actual built public product versus same-identity bounded REA contract; synthetic inputs, no editor UI or game observation',tool:{path:process.argv[1],sha256:hash(await fs.readFile(process.argv[1]))},git:{head:git('rev-parse','HEAD'),status:git('status','--porcelain=v1')},environment:{node:process.version,nodePath:process.execPath,nodeSha256:hash(await fs.readFile(process.execPath)),platform:process.platform,TEMP:process.env.TEMP,TMP:process.env.TMP},steps:[],negative:[]};
const save=async(name,v)=>fs.writeFile(path.join(run,name),JSON.stringify(v,null,2)+'\n',{flag:'wx'});
function nativeText(value){if(typeof value==='number'&&Object.is(value,-0))return'-0';if(Array.isArray(value))return'['+value.map(nativeText).join(',')+']';if(value&&typeof value==='object')return'{'+Object.entries(value).map(([k,v])=>JSON.stringify(k)+':'+nativeText(v)).join(',')+'}';return JSON.stringify(value);}
async function fileTree(dir,base=dir){const rows={};for(const e of await fs.readdir(dir,{withFileTypes:true}).catch(e=>{if(e.code==='ENOENT')return[];throw e})){if(e.name==='operation.lock')continue;const p=path.join(dir,e.name),rel=path.relative(base,p).replaceAll('\\','/');if(e.isDirectory())Object.assign(rows,await fileTree(p,base));else rows[rel]=hash(await fs.readFile(p));}return rows;}
async function observe(w){return{config:hash(await fs.readFile(path.join(w,'rpgmaker-event-dsl.config.json'))),source:await fileTree(path.join(w,'src')),project:await fileTree(path.join(w,'Game')),state:await fileTree(path.join(w,'.rpgmaker-event-dsl'))};}
async function data(w,rel='Game/data'){const d=path.join(w,rel);return Object.fromEntries(await Promise.all((await fs.readdir(d)).sort().map(async n=>[n,await json(path.join(d,n))])));}
const steps=async(name,action)=>{const s={name,startedAt:new Date().toISOString()};report.steps.push(s);try{const r=await action();s.completedAt=new Date().toISOString();s.passed=true;s.result=r;return r}catch(e){s.completedAt=new Date().toISOString();s.passed=false;s.error=String(e?.stack??e);throw e}};
try{
 assert.equal(process.platform,'win32');assert.equal(process.version,'v22.23.0');
 const frozen=await json(path.join(output,'built-inputs-v1/manifest.json'));
 assert.equal(frozen.contract,'mv-1.6.1/12');assert.equal(frozen.groups.dist.count,15);
 for(const r of frozen.files)assert.equal(hash(await fs.readFile(path.join(root,r.path))),r.sha256,r.path);
 report.frozenManifest={path:path.join(output,'built-inputs-v1/manifest.json'),sha256:hash(await fs.readFile(path.join(output,'built-inputs-v1/manifest.json'))),groups:frozen.groups};
 const metaPath=path.join(root,'.scratch/complete-mv-events-implementation/evidence/05-resource-identities.json');
 const meta=await json(metaPath);const identities=[];
 for(const a of meta.artifacts){const p=path.join('F:/Shuen/RPG/rpgmaker-event-dsl',a.path),b=await fs.readFile(p);assert.equal(b.length,a.bytes);assert.equal(hash(b),a.sha256);const records=[];for(const r of a.records){const raw=b.subarray(r.offset,r.offset+r.stored);assert.equal(raw.length,r.stored);assert.equal(raw.readUInt32BE(0),r.stored-4);let decoded;if(r.compressed){const result=inflateSync(raw.subarray(8),{info:true});assert.equal(result.engine.bytesWritten,r.stored-8);assert.equal(result.buffer.length,raw.readUInt32BE(4));decoded=result.buffer;}else decoded=raw.subarray(4);assert.equal(decoded.length,r.decoded);assert.equal(hash(decoded),r.sha256);records.push({name:r.name,offset:r.offset,stored:r.stored,decodedBytes:decoded.length,sha256:hash(decoded),passed:true});}identities.push({path:p,bytes:b.length,sha256:hash(b),records,passed:true});}
 report.reusedRea={metadataPath:metaPath,metadataSha256:hash(await fs.readFile(metaPath)),identities,existingEvidenceIds:meta.reusedEvidence,newEvidenceIdCreated:false,boundaries:['Existing matching EXE/Qt identities and complete load/save/container report reused','Decoded content read only for identity; no eval/QML/native process','New Stop/default initialization deductions remain conditional, container/onSave logic remains static fact','TkoolAPI disk success/Qt timing/editor UI/game not established by this comparison']};
 const scenarios=[
  {id:'MV-E05-NEW-STOP',parameters:[1],evidence:'Conditional new empty parameters then Stop onSave'},
  {id:'MV-E05-SAVED-START-ZERO',parameters:[1,0],evidence:'Saved Start0 reloaded then Stop; p1 retained'},
  {id:'MV-E05-SAVED-START-NONZERO',parameters:[1,83],evidence:'Saved Start83 reloaded then Stop; p1 retained'},
  {id:'MV-E05-STOP-RECONFIRM-ABSENT',parameters:[1],evidence:'Existing Stop one-slot load/save retains absence'},
  {id:'MV-E05-STOP-RECONFIRM-ZERO',parameters:[1,0],evidence:'Existing Stop0 load/save retains p1'},
  {id:'MV-E05-STOP-RECONFIRM-NONZERO',parameters:[1,83],evidence:'Existing Stop83 load/save retains p1'},
  {id:'MV-E05-UNSAVED-TOGGLE',parameters:[1],evidence:'Conditional unconfirmed new Start83 toggled Stop; no p1 yet'},
  {id:'MV-E05-CONTAINER-ABSENT',parameters:[1],evidence:'Container stringify preserves one-slot Stop'},
  {id:'MV-E05-CONTAINER-ZERO',parameters:[1,0],evidence:'Container stringify preserves two-slot Stop0'},
  {id:'MV-E05-CONTAINER-NONZERO',parameters:[1,83],evidence:'Container stringify preserves two-slot Stop83'},
  {id:'MV-E05-START-BOUNDS-ZERO',parameters:[0,0],evidence:'Independent control/domain lower bound'},
  {id:'MV-E05-START-BOUNDS-MAX',parameters:[0,5999],evidence:'Independent 99minutes59seconds upper bound'},
  {id:'SYNTHETIC-STOP-NUMERIC-NEGATIVE-ZERO',parameters:[1,-0],evidence:'Accepted numeric saved-value capability; no editor-origin claim'},
  {id:'SYNTHETIC-START-NUMERIC-NEGATIVE-ZERO',parameters:[0,-0],evidence:'Accepted numeric saved-value capability; no editor-origin claim'}
 ];
 report.independentScenarios=scenarios.map(s=>({...s,slotCount:s.parameters.length,secondSlotPresent:1 in s.parameters,secondSlotNegativeZero:Object.is(s.parameters[1],-0)}));
 const base=await json(path.join(root,'packages/rpgmaker-event-dsl/test/fixtures/mv-evidence/common-event-project.json'));
 const troop=await json(path.join(root,'packages/rpgmaker-event-dsl/test/fixtures/mv-evidence/troop-event-project.json'));
 const end={code:0,indent:0,parameters:[]};
 const page={conditions:{actorId:1,actorValid:false,itemId:1,itemValid:false,selfSwitchCh:'A',selfSwitchValid:false,switch1Id:1,switch1Valid:false,switch2Id:1,switch2Valid:false,variableId:1,variableValid:false,variableValue:0},directionFix:false,image:{characterIndex:0,characterName:'',direction:2,pattern:0,tileId:0},list:[end],moveFrequency:3,moveRoute:{list:[{code:0,parameters:[]}],repeat:true,skippable:false,wait:false},moveSpeed:3,moveType:0,priorityType:0,stepAnime:false,through:false,trigger:0,walkAnime:true};
 function expectedCarriers(list){return{...structuredClone(base.projectFiles),'CommonEvents.json':[null,{id:1,name:'E4 Saved Timer',trigger:0,switchId:1,list:structuredClone(list)}],'MapInfos.json':[null,{id:1,name:'E4 Timer Map'}],'Map001.json':{width:17,height:13,tilesetId:1,opaque:{retained:[null,[],{}]},events:[null,{id:1,name:'E4 Saved Map',note:'E4\r\nTimer\n',x:0,y:0,pages:[{...structuredClone(page),list:structuredClone(list)}]}]},'Troops.json':[null,{...structuredClone(troop.carrier),pages:[{...structuredClone(troop.defaultPage),list:structuredClone(list)}]}]};}
 const api=await import(pathToFileURL(path.join(root,'packages/rpgmaker-event-dsl/dist/workspace-api.mjs')).href);
 async function prepare(label,carriers){const w=path.join(run,label,'Workspace with spaces');await fs.mkdir(path.join(w,'Game/data'),{recursive:true});await fs.writeFile(path.join(w,'Game/Game.rpgproject'),'RPGMV 1.6.1\n');await fs.writeFile(path.join(w,'package.json'),'{"type":"module"}\n');const pkg=path.join(w,'node_modules/rpgmaker-event-dsl');await fs.mkdir(pkg,{recursive:true});await fs.writeFile(path.join(pkg,'package.json'),JSON.stringify({name:'rpgmaker-event-dsl',type:'module',exports:{'.':{types:'./dist/index.d.mts'}}}));await fs.symlink(path.join(root,'packages/rpgmaker-event-dsl/dist'),path.join(pkg,'dist'),'junction');for(const[name,v]of Object.entries(carriers))await fs.writeFile(path.join(w,'Game/data',name),nativeText(v));await api.initWorkspace({workspaceRoot:w,projectRoot:'./Game'});await api.cloneWorkspace({workspaceRoot:w});return w;}
 const list=[...scenarios.map(s=>({code:124,indent:0,parameters:s.parameters})),end];const input=expectedCarriers(list);
 await save('independent-scenarios.json',report.independentScenarios);await fs.writeFile(path.join(run,'independent-input-carriers.json'),nativeText(input),{flag:'wx'});
 const w=await steps('Built public init and Clone complete independent15 carriers',()=>prepare('positive',input));
 assert.deepEqual(await data(w),input);report.inputCarriers=await fileTree(path.join(w,'Game/data'));
 await steps('Built public Decompile publishes complete formal source',()=>api.decompileWorkspace({workspaceRoot:w}));
 const sourcePaths=Object.keys(await fileTree(path.join(w,'src'))).filter(p=>p.endsWith('.ts'));
 const sources=await Promise.all(sourcePaths.map(async rel=>({path:rel,text:await fs.readFile(path.join(w,'src',rel),'utf8')})));
 assert.equal(sources.filter(s=>s.text.includes('controlTimer(')).length,3);
 for(const s of sources.filter(s=>s.text.includes('controlTimer('))){assert(s.text.includes('controlTimer({ action: "stop" })'));assert(s.text.includes('controlTimer({ action: "stop", seconds: 0 })'));assert(s.text.includes('controlTimer({ action: "stop", seconds: 83 })'));assert(s.text.includes('seconds: -0'));assert(!s.text.includes('rawDslCommand'));}
 const preCheck=await observe(w);await steps('Built public Check uses actual generated source without business writes',()=>api.compileWorkspace({workspaceRoot:w,check:true}));assert.deepEqual(await observe(w),preCheck);
 const expected=structuredClone(input);expected['CommonEvents.json'][1].name='E4 Installed Timer';expected['Map001.json'].events[1].name='E4 Installed Map';expected['Troops.json'][1].pages[0].list.unshift({code:108,indent:0,parameters:['E4 Installed Timer']});
 await steps('Formal source edit for all3 owned carriers',async()=>{for(const s of sources){let t=s.text.replace('name: "E4 Saved Timer"','name: "E4 Installed Timer"').replace('name: "E4 Saved Map"','name: "E4 Installed Map"');if(t.includes('troopEvent('))t='import {comment} from "rpgmaker-event-dsl";\n'+t.replace('commands: [','commands: [comment(["E4 Installed Timer"]),');await fs.writeFile(path.join(w,'src',s.path),t);}return sourcePaths});
 const edited=await observe(w);await steps('Built public Check evaluates edited formal source without business writes',()=>api.compileWorkspace({workspaceRoot:w,check:true}));assert.deepEqual(await observe(w),edited);
 await steps('Built public Compile materializes complete4 independent expected carriers',()=>api.compileWorkspace({workspaceRoot:w,check:false}));
 const generatedExpected=Object.fromEntries(['CommonEvents.json','Map001.json','System.json','Troops.json'].map(n=>[n,expected[n]]));
 assert.deepEqual(await data(w,'.rpgmaker-event-dsl/generated-project-data'),generatedExpected);assert.deepEqual(await data(w),input);
 report.generatedCarriers=await fileTree(path.join(w,'.rpgmaker-event-dsl/generated-project-data'));await fs.writeFile(path.join(run,'actual-generated-four-carriers.json'),nativeText(await data(w,'.rpgmaker-event-dsl/generated-project-data')),{flag:'wx'});
 report.diff=await steps('Built public Diff shows actual owned changes',()=>api.diffWorkspace({workspaceRoot:w,short:true}));assert(!report.diff.includes('No changes.'));
 await steps('Built public real Push installs all3 owned carrier differences',()=>api.pushWorkspace({workspaceRoot:w,allowDestructive:false}));
 const live=await data(w);assert.equal(Object.keys(live).length,15);assert.deepEqual(live,expected);assert.deepEqual((await observe(w)).source,edited.source);assert.equal((await observe(w)).config,edited.config);assert.equal(await api.isGeneratedProjectDataFresh({workspaceRoot:w}),true);
 for(const name of ['CommonEvents.json','Map001.json','Troops.json']){const l=name==='CommonEvents.json'?live[name][1].list:name==='Map001.json'?live[name].events[1].pages[0].list:live[name][1].pages[0].list.slice(1);for(const[i,s]of scenarios.entries()){assert.deepEqual(l[i].parameters,s.parameters);assert.equal(1 in l[i].parameters,1 in s.parameters);assert.equal(Object.is(l[i].parameters[1],-0),Object.is(s.parameters[1],-0));}}
 await fs.writeFile(path.join(run,'actual-live-fifteen-carriers.json'),nativeText(live),{flag:'wx'});report.positive={passed:true,sourcePaths,inputCarrierCount:15,generatedCarrierCount:4,liveCarrierCount:15,completeCarrierEquality:true,exactSlotPresence:true,objectIsNegativeZero:true,checkBusinessStateUnchanged:true,actualOwnedChanges:['CommonEvents.json name','Map001.json event name','Troops.json owned Comment'],workspace:w,liveHashes:await fileTree(path.join(w,'Game/data'))};
 const invalid=[[0],[1,null],[1,6000],[0,-1],[0,0.5],[1,0,83],[-0,83],[2,83]];
 for(const[i,params]of invalid.entries()){const carriers=expectedCarriers([{code:124,indent:0,parameters:params},end]);const nw=await prepare('invalid-native-'+i,carriers);const before=await observe(nw);let error;try{await api.decompileWorkspace({workspaceRoot:nw})}catch(e){error=e}assert(error instanceof Error);assert.match(error.message,/MV-E124-(?:PARAMETERS|ACTION|SECONDS)/);assert.match(error.message,/list\[0\]\.parameters/);assert.deepEqual(await observe(nw),before);report.negative.push({kind:'native',parameters:nativeText(params),diagnostic:error.message,unchangedCompleteBusinessState:true,before,passed:true,workspace:nw});}
 for(const[i,expression]of ['controlTimer({action:"stop",seconds:6000})','rawDslCommand({code:124,parameters:[1,null]})'].entries()){const nw=await prepare('invalid-authored-'+i,expectedCarriers([{code:124,indent:0,parameters:[1]},end]));await api.decompileWorkspace({workspaceRoot:nw});for(const rel of Object.keys(await fileTree(path.join(nw,'src')))){const p=path.join(nw,'src',rel);let s=await fs.readFile(p,'utf8');if(s.includes('commonEvent(')){s='import {rawDslCommand} from "rpgmaker-event-dsl";\n'+s.replace('controlTimer({ action: "stop" })',expression);await fs.writeFile(p,s)}}const before=await observe(nw);const errors=[];for(const check of [true,false]){let error;try{await api.compileWorkspace({workspaceRoot:nw,check})}catch(e){error=e}assert(error instanceof Error);assert.match(error.message,/MV-E124-SECONDS/);assert.match(error.message,i===0?/controlTimer\.seconds/:/commands\[0\]\.parameters\[1\]/);assert.deepEqual(await observe(nw),before);errors.push(error.message);}report.negative.push({kind:'actual-authored-loader',expression,diagnostics:errors,unchangedCompleteBusinessState:true,passed:true,workspace:nw});}
 for(const r of frozen.files)assert.equal(hash(await fs.readFile(path.join(root,r.path))),r.sha256,r.path);
 report.finalProductBindingsUnchanged=true;report.passed=true;
}catch(e){report.passed=false;report.error=String(e?.stack??e);process.exitCode=1;}
report.completedAt=new Date().toISOString();await save('report.json',report);console.log(JSON.stringify({report:path.join(run,'report.json'),passed:report.passed,steps:report.steps.length,negative:report.negative.length,error:report.error},null,2));
