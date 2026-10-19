'use strict';
// Ticket23 allocated shared-switch Common Parallel delivery; independent none saved9.
const fs=require('node:fs/promises');
const path=require('node:path');
const assert=require('node:assert/strict');
const {runPair,files,sha}=require('./mv23-native-pair-support-delivery-v1.cjs');
const args=Object.fromEntries(process.argv.slice(2).map(value=>{const at=value.indexOf('=');assert.ok(at>2,'Use --key=value');return[value.slice(2,at),value.slice(at+1)];}));
const repo=args.repo||'F:/Shuen/RPG/rpgmaker-event-dsl';
const options={packageRoot:args.packageRoot||'C:/Users/Shuen/.codex/worktrees/mv-ticket-23/rpgmaker-event-dsl/packages/rpgmaker-event-dsl',seedRoot:args.seedRoot||path.join(repo,'references/RPGMV/NewData'),host:args.host||path.join(repo,'references/RPGMV/nwjs-win-test/game.exe'),outputRoot:args.outputRoot||'C:/Users/Shuen/.codex/tmp',timeoutMs:Number(args.timeoutMs||50000)};
const cmd=(code,parameters=[])=>({code,indent:0,parameters});
const trace=id=>cmd(355,[`window.sharedParallelTrace.push({id:${JSON.stringify(id)},frame:Graphics.frameCount,eventId:this._eventId,mapId:this._mapId,inBattle:$gameParty.inBattle(),switch21:$gameSwitches.value(21)});`]);
const plan={sharedSwitch:21,A:{commonId:1,waitFrames:60,closesSharedSwitch:true},B:{commonId:2,waitFrames:120,closesSharedSwitch:false},inactiveSavedSwitch:{commonId:3,trigger:0,switchId:9},expectedOrder:['A-start','B-start','A-end'],expectedMissing:['B-end'],observationFramesAfterStart:150};
const observer=`(function(){
var fs=require('fs'),path=require('path'),crypto=require('crypto'),started=Date.now(),stage='title',loaded=null,armedFrame=null,finished=false,samples=[],lastSignature=null;
window.sharedParallelTrace=[];
function copy(value){return JSON.parse(JSON.stringify(value));}
function commonState(id){var value=$gameMap._commonEvents.filter(function(item){return item._commonEventId===id;})[0];return{commonId:id,exists:!!value,active:value?value.isActive():false,interpreterPresent:!!(value&&value._interpreter),index:value&&value._interpreter?value._interpreter._index:null,waitCount:value&&value._interpreter?value._interpreter._waitCount:null};}
function sample(){var state={switch21:$gameSwitches.value(21),A:commonState(1),B:commonState(2)};var signature=JSON.stringify({switch21:state.switch21,A:{active:state.A.active,interpreterPresent:state.A.interpreterPresent,index:state.A.index},B:{active:state.B.active,interpreterPresent:state.B.interpreterPresent,index:state.B.index}});if(signature!==lastSignature){samples.push({frame:Graphics.frameCount,state:state});lastSignature=signature;}return state;}
function finish(error){if(finished)return;finished=true;var trace=window.sharedParallelTrace,state=sample(),first=trace.filter(function(item){return item.id==='A-start';})[0],b=trace.filter(function(item){return item.id==='B-start';})[0],end=trace.filter(function(item){return item.id==='A-end';})[0];
 var actual={order:trace.map(function(item){return item.id;}),contexts:trace.map(function(item){return{eventId:item.eventId,mapId:item.mapId,inBattle:item.inBattle,switch21:item.switch21};}),AWaitDelta:first&&end?end.frame-first.frame:null,BStartedSameFrame:!!(first&&b&&first.frame===b.frame),BEndCount:trace.filter(function(item){return item.id==='B-end';}).length,switch21:state.switch21,AInactive:state.A.exists&&!state.A.active&&!state.A.interpreterPresent,BInactive:state.B.exists&&!state.B.active&&!state.B.interpreterPresent,noneSwitch9:$gameSwitches.value(9),observedPastBDeadline:!!(first&&Graphics.frameCount>=first.frame+150)};
 var context={eventId:0,mapId:1,inBattle:false,switch21:true},expected={order:['A-start','B-start','A-end'],contexts:[context,context,context],AWaitDelta:60,BStartedSameFrame:true,BEndCount:0,switch21:false,AInactive:true,BInactive:true,noneSwitch9:false,observedPastBDeadline:true};
 var engineFiles={};['rpg_core.js','rpg_managers.js','rpg_objects.js','rpg_scenes.js','rpg_sprites.js','rpg_windows.js','main.js'].forEach(function(name){engineFiles[name]=crypto.createHash('sha256').update(fs.readFileSync(path.join(process.cwd(),'js',name))).digest('hex');});
 fs.writeFileSync(path.join(process.cwd(),'runtime-result.json'),JSON.stringify({purpose:'Ticket23 allocated R1 shared Parallel delivery; final52 remains separate',timestamp:new Date().toISOString(),method:'actual-native-game',engine:Utils.RPGMAKER_VERSION,versions:process.versions,execPath:process.execPath,pid:process.pid,cwd:process.cwd(),scene:SceneManager._scene.constructor.name,frame:Graphics.frameCount,armedFrame:armedFrame,loaded:loaded,engineFiles:engineFiles,trace:copy(trace),samples:samples,expected:expected,actual:actual,error:error,passed:!error&&JSON.stringify(actual)===JSON.stringify(expected),control:'Observer clean-starts native newgame, captures actual loaded Map/Common/System, sets fixture switch21 once, passively reads normal Scene_Map/Common state, then quits. All trace writes are formal event355 records. No interpreter setup/update, command/scene/wait methods, active switch state after activation, RNG or resource behavior is driven/replaced.'},null,2));clearInterval(timer);nw.App.quit();}
var timer=setInterval(function(){try{
 if(stage==='title'&&SceneManager._scene instanceof Scene_Title){DataManager.setupNewGame();SceneManager.goto(Scene_Map);stage='map';}
 else if(stage==='map'&&SceneManager._scene instanceof Scene_Map&&Graphics.frameCount>120&&!SceneManager._scene.isBusy()){
  loaded={'Map001.json':copy($dataMap),'CommonEvents.json':copy($dataCommonEvents),'System.json':copy($dataSystem)};
  if(window.sharedParallelTrace.length!==0)throw new Error('Unexpected trace before activation');
  armedFrame=Graphics.frameCount;sample();$gameSwitches.setValue(21,true);stage='observe';
 }else if(stage==='observe'){
  sample();var first=window.sharedParallelTrace.filter(function(item){return item.id==='A-start';})[0];
  if(first&&Graphics.frameCount>=first.frame+150)finish(null);
  else if(Graphics.frameCount-armedFrame>300)throw new Error('Expected shared Common start was not observed');
 }
 if(Date.now()-started>30000)throw new Error('Timeout at '+stage);
}catch(error){finish(String(error.stack||error));}},25);
}());`;
const scenario={slug:'mv23-r1-shared-parallel-delivery-v1',scriptPath:__filename,plan,observer,affectedCarriers:['CommonEvents.json'],
 async fixture(seed){
  const map=JSON.parse(await fs.readFile(path.join(seed,'data/Map001.json'),'utf8'));map.events=[null];
  const common=[null,{id:1,name:'Shared parallel A',trigger:2,switchId:21,list:[trace('A-start'),cmd(230,[60]),trace('A-end'),cmd(121,[21,21,1]),cmd(0)]},{id:2,name:'Shared parallel B',trigger:2,switchId:21,list:[trace('B-start'),cmd(230,[120]),trace('B-end'),cmd(0)]},{id:3,name:'Untriggered saved switch control',trigger:0,switchId:9,list:[cmd(0)]}];
  const system=JSON.parse(await fs.readFile(path.join(seed,'data/System.json'),'utf8'));while(system.switches.length<=21)system.switches.push('');
  const carriers={'Map001.json':map,'CommonEvents.json':common,'System.json':system};const loadedCarriers=structuredClone(carriers);loadedCarriers['Map001.json'].meta={};
  return{carriers,loadedCarriers,expected:plan,provenance:'Independent self-authored Common1/2 formal records share final addressable unnamed switch21. Common3 trigger0 retains independent nondefault saved switch9; no map event saved fields are involved. Engine onLoad adds only blank Map meta; all saved fields retained. Earlier separate saved switch9 fixture failed complete comparison on19 and remains failed.'};
 },
 async seedDifference(project){const file=path.join(project,'data/CommonEvents.json'),value=JSON.parse(await fs.readFile(file,'utf8'));value[1].name='PAIR-SEED Shared parallel A';value[2].name='PAIR-SEED Shared parallel B';await fs.writeFile(file,JSON.stringify(value,null,2)+'\n');},
 async editSources(workspace){const edits=[];for(const file of await files(path.join(workspace,'src'))){if(!file.endsWith('.ts'))continue;const before=await fs.readFile(file,'utf8');let after=before;for(const name of ['Shared parallel A','Shared parallel B'])after=after.split(JSON.stringify('PAIR-SEED '+name)).join(JSON.stringify(name));if(after!==before){assert.ok(!after.includes('PAIR-SEED '));await fs.writeFile(file,after);edits.push({file:path.relative(workspace,file),beforeSha256:sha(before),afterSha256:sha(after)});}}assert.equal(edits.length,1,'The discovered formal Common source must actually change');return edits;}
};
runPair(options,scenario).catch(error=>{console.error(error.stack||error);process.exitCode=1;});
