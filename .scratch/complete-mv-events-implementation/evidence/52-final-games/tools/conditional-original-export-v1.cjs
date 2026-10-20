'use strict';
// Independent native preparation for28/52/53/54. No product result is implied.
const fs=require('node:fs/promises');
const path=require('node:path');
const assert=require('node:assert/strict');
const {files,sha}=require('./utilities-v1.cjs');
// Legacy literal runner is not imported.
const c=(code,parameters=[],indent=0)=>({code,indent,parameters});
const cases=[];
const list=[];
function branch(id,parameters,map,battle=map){
  cases.push({id,parameters,map,battle});
  const trace=value=>c(355,[`window.conditionalTrace.push({id:${JSON.stringify(id)},value:${value},context:$gameParty.inBattle()?"battle":"map"});`],1);
  list.push(c(111,parameters),trace(true),c(0,[],1),c(411),trace(false),c(0,[],1),c(412));
}
branch('switch-on',[0,1,0],true);branch('switch-off',[0,1,1],false);
for(const [source,label,right]of [[0,'constant',3],[1,'variable',2]]){
  for(const[operator,name,result]of [[0,'eq',false],[1,'ge',true],[2,'le',false],[3,'gt',true],[4,'lt',false],[5,'ne',true]])branch('variable-'+label+'-'+name,[1,1,source,right,operator],result);
}
branch('variable-equal-reference',[1,1,1,3,0],true);
branch('self-switch-on-context',[2,'A',0],true,false);
branch('self-switch-off-context',[2,'A',1],false,false);
list.push(c(124,[1]));
branch('timer-stopped-ge-zero',[3,0,0],false);branch('timer-stopped-le-max',[3,5999,1],false);
list.push(c(124,[0,0]));branch('timer-running-zero-ge',[3,0,0],true);branch('timer-running-zero-le',[3,0,1],true);
list.push(c(124,[1,0]),c(124,[0,5999]));branch('timer-running-max-ge',[3,5999,0],true);branch('timer-running-max-le',[3,5999,1],true);branch('timer-running-max-not-zero',[3,0,1],false);list.push(c(124,[1,5999]));
for(const[id,parameters]of [
 ['in-party',[4,1,0]],['name',[4,1,1,'Cond \r\n native']],['class',[4,1,2,1]],['skill',[4,1,3,1]],['weapon',[4,1,4,1]],['armor',[4,1,5,1]],['state',[4,1,6,2]]
])branch('actor-'+id,parameters,true);
branch('actor-name-not-trimmed',[4,1,1,'Cond native'],false);
branch('enemy-alive',[5,0,0],false,true);branch('enemy-hidden',[5,1,0],false);branch('enemy-dead',[5,2,0],false);branch('enemy-state',[5,0,1,2],false,true);branch('enemy-missing',[5,7,0],false);
for(const[id,target]of [['player',-1],['current-event',0],['event',1]]){
  branch('character-'+id+'-down',[6,target,2],true,false);branch('character-'+id+'-left',[6,target,4],false);
}
branch('character-missing',[6,7,2],false);
for(const[id,p,result]of [['ge',[7,100,0],true],['le',[7,100,1],true],['lt-equal',[7,100,2],false],['lt-upper',[7,101,2],true],['ge-upper',[7,101,0],false]])branch('gold-'+id,p,result);
branch('item-owned',[8,1],true);branch('item-unowned',[8,2],false);
branch('weapon-inventory-only',[9,1,false],false);branch('weapon-including-equipped',[9,1,true],true);
branch('armor-inventory-only',[10,1,false],false);branch('armor-including-equipped',[10,1,true],true);
const buttons=['ok','cancel','shift','down','left','right','up','pageup','pagedown'];
for(const key of buttons)branch('button-'+key,[11,key],true);
branch('script-empty',[12,''],false);branch('script-crlf-truthy',[12,'({n:1})\r\n'],true);branch('script-crlf-falsy',[12,'0\r\n'],false);
branch('script-single-evaluation',[12,'++window.conditionalEvaluations\r\n'],true);
for(const[id,index]of [['boat',0],['ship',1],['airship',2]])branch('vehicle-not-boarded-'+id,[13,index],false);
list.push(c(355,['window.conditionalContexts.push({inBattle:$gameParty.inBattle(),eventId:this._eventId,mapId:this._mapId});']),c(0));
const expected={trace:['map','battle'].flatMap(context=>cases.map(item=>({id:item.id,value:item[context],context}))),contexts:[{inBattle:false,eventId:1,mapId:1},{inBattle:true,eventId:0,mapId:1}],evaluations:2,mapOrder:['before-common','after-common','after-battle'],winCount:1,partyAlive:true,enemyDead:false,enemyMembers:[{index:0,hp:0,hidden:false,alive:false},{index:1,hp:200,hidden:false,alive:true},{index:2,hp:0,hidden:false,alive:false}],returned:true,commonNoneSwitch9:9};
const plan={purpose:'Independent literal actual normal Scene/Input preparation v3; not28/52/53/54 acceptance',caseCount:cases.length,cases,expected,entry:'Map1 autorun→117 Common1→301→Troop turn0→117 same Common1→331 victory→Map',input:'Nine native Input states held only during each condition list. Release after Map callee; OK pulses acknowledge emergence. Saved Troop script signals then native12-frame Wait allows observer to hold all nine before second117. Release after battle callee, OK pulses for result messages.',boundary:'Observer clean-starts newgame, captures loaded carriers, sets launch switch30 once, supplies ordinary Input states and reads results. Every branch and trace is a saved E111/355 command executed by normal Scene updates. No interpreter, command111, battle schedule/results, RNG, timers, loaders or Scene methods replaced. No direct battle setup/kill/callback. Native E124/313/318/331/333/121/122/123/125/126 establish state. Vehicle cases intentionally cover not-boarded false only; no vehicle-success claim.'};
const defaults={actorId:1,actorValid:false,itemId:1,itemValid:false,selfSwitchCh:'A',selfSwitchValid:false,switch1Id:1,switch1Valid:false,switch2Id:1,switch2Valid:false,variableId:1,variableValid:false,variableValue:0};
function page(commands,trigger=0,conditions={}){return{conditions:{...defaults,...conditions},directionFix:false,image:{characterIndex:0,characterName:'',direction:2,pattern:0,tileId:0},list:commands,moveFrequency:3,moveRoute:{list:[{code:0,parameters:[]}],repeat:true,skippable:false,wait:false},moveSpeed:3,moveType:0,priorityType:0,stepAnime:false,through:true,trigger,walkAnime:true};}
async function fixture(seed){
  const carriers={};for(const file of await files(path.join(seed,'data'))){if(file.endsWith('.json'))carriers[path.basename(file)]=JSON.parse(await fs.readFile(file,'utf8'));}
  const system=carriers['System.json'];system.partyMembers=[1];system.startMapId=1;system.startX=8;system.startY=6;system.switches=Array.from({length:51},(_,i)=>i?'Conditional switch '+i:'');system.variables=Array.from({length:51},(_,i)=>i?'Conditional variable '+i:'');
  const actors=carriers['Actors.json'];actors[1].name='Cond \r\n native';actors[1].classId=1;actors[1].initialLevel=1;actors[1].equips=[1,1,0,0,0];
  const enemies=carriers['Enemies.json'];enemies[1].exp=0;enemies[1].gold=0;enemies[1].dropItems=[];
  const mapTrace=id=>c(355,[`window.conditionalMapOrder.push(${JSON.stringify(id)});`]);
  const map=carriers['Map001.json'];map.encounterList=[];
  map.events=[null,{id:1,name:'Conditional normal context caller',note:'',x:0,y:0,pages:[page([
    c(121,[1,1,0]),c(122,[1,1,0,0,5]),c(122,[2,2,0,0,3]),c(122,[3,3,0,0,5]),c(125,[0,0,100]),c(126,[1,0,0,1]),c(313,[0,1,0,2]),c(318,[0,1,0,1]),c(123,['A',0]),
    mapTrace('before-common'),c(117,[1]),mapTrace('after-common'),c(301,[0,1,false,false]),mapTrace('after-battle'),c(355,['window.conditionalReturned=true;']),c(123,['B',0]),c(0)
  ],3,{switch1Valid:true,switch1Id:30}),page([c(0)],0,{selfSwitchValid:true,selfSwitchCh:'B'})]}];
  carriers['CommonEvents.json']=[null,{id:1,name:'Conditional shared callee',trigger:0,switchId:9,list}];
  carriers['Troops.json'][1]={id:1,name:'Conditional native three-member carrier',members:[{enemyId:1,x:208,y:280,hidden:false},{enemyId:1,x:408,y:280,hidden:true},{enemyId:1,x:608,y:280,hidden:false}],pages:[{conditions:{actorHp:50,actorId:1,actorValid:false,enemyHp:50,enemyIndex:0,enemyValid:false,switchId:1,switchValid:false,turnA:0,turnB:0,turnEnding:false,turnValid:true},span:0,list:[c(333,[0,0,2]),c(331,[2,1,0,9999999,true]),c(355,['window.conditionalArmBattle=true;']),c(230,[12]),c(117,[1]),c(355,['window.conditionalBattleCalleeDone=true;']),c(331,[-1,1,0,9999999,true]),c(0)]}]};
  const loadedCarriers={};for(const name of ['Map001.json','CommonEvents.json','Troops.json','System.json'])loadedCarriers[name]=structuredClone(carriers[name]);loadedCarriers['Map001.json'].meta={};loadedCarriers['Map001.json'].events[1].meta={};
  return{carriers,loadedCarriers,expected,plan,provenance:'Independent self-authored native arrays and explicit branch-result table from accepted Conditional contracts; not compiler-derived. Actual clean first-party seed remains external. All15 disk carriers compared, complete Map/Common/Troop/System loaded captures checked.'};
}
const observer=`(function(){
var fs=require('fs'),path=require('path'),crypto=require('crypto'),expected=${JSON.stringify(expected)},buttons=${JSON.stringify(buttons)},start=Date.now(),stage='title',loaded=null,finished=false,inputs=[],transitions=[],lastScene=null,stateChanges=[],lastState='';
window.conditionalTrace=[];window.conditionalContexts=[];window.conditionalEvaluations=0;window.conditionalMapOrder=[];window.conditionalReturned=false;window.conditionalBattleCalleeDone=false;window.conditionalArmBattle=false;
function copy(v){return JSON.parse(JSON.stringify(v));}function input(key,value){if(Input._currentState[key]!==value){Input._currentState[key]=value;inputs.push({frame:Graphics.frameCount,key:key,down:value,stage:stage});}}
function finish(error){if(finished)return;finished=true;buttons.forEach(function(k){input(k,false);});var actual={trace:window.conditionalTrace,contexts:window.conditionalContexts,evaluations:window.conditionalEvaluations,mapOrder:window.conditionalMapOrder,winCount:$gameSystem._winCount,partyAlive:!$gameParty.isAllDead(),enemyDead:$gameTroop.isAllDead(),enemyMembers:$gameTroop.members().map(function(e){return{index:e.index(),hp:e.hp,hidden:e.isHidden(),alive:e.isAlive()};}),returned:window.conditionalReturned,commonNoneSwitch9:$dataCommonEvents[1].switchId},engineFiles={};['rpg_core.js','rpg_managers.js','rpg_objects.js','rpg_scenes.js','rpg_sprites.js','rpg_windows.js','main.js'].forEach(function(name){engineFiles[name]=crypto.createHash('sha256').update(fs.readFileSync(path.join(process.cwd(),'js',name))).digest('hex');});
fs.writeFileSync(path.join(process.cwd(),'runtime-result.json'),JSON.stringify({purpose:${JSON.stringify(plan.purpose)},timestamp:new Date().toISOString(),method:'actual-native-game',engine:Utils.RPGMAKER_VERSION,versions:process.versions,pid:process.pid,execPath:process.execPath,cwd:process.cwd(),frame:Graphics.frameCount,scene:SceneManager._scene.constructor.name,stage:stage,loaded:loaded,engineFiles:engineFiles,inputs:inputs,transitions:transitions,stateChanges:stateChanges,expected:expected,actual:actual,error:error,passed:!error&&JSON.stringify(actual)===JSON.stringify(expected),control:${JSON.stringify(plan.boundary)}},null,2));clearInterval(timer);nw.App.quit();}
var timer=setInterval(function(){try{var scene=SceneManager._scene,name=scene&&scene.constructor.name;if(name!==lastScene){transitions.push({frame:Graphics.frameCount,scene:name});lastScene=name;}
var state={stage:stage,scene:name,phase:BattleManager._phase,message:$gameMessage&&$gameMessage.isBusy(),mapInterpreter:$gameMap&&$gameMap._interpreter&&$gameMap._interpreter._index,troopInterpreter:$gameTroop&&$gameTroop._interpreter&&$gameTroop._interpreter._index};var signature=JSON.stringify(state);if(signature!==lastState){stateChanges.push({frame:Graphics.frameCount,state:state});lastState=signature;}
if(stage==='title'&&scene instanceof Scene_Title){DataManager.setupNewGame();SceneManager.goto(Scene_Map);stage='map';}
else if(stage==='map'&&scene instanceof Scene_Map&&Graphics.frameCount>120&&!scene.isBusy()){loaded={'Map001.json':copy($dataMap),'CommonEvents.json':copy($dataCommonEvents),'Troops.json':copy($dataTroops),'System.json':copy($dataSystem)};buttons.forEach(function(k){input(k,true);});$gameSwitches.setValue(30,true);stage='running';}
if(stage==='running'&&window.conditionalMapOrder.length>=2){buttons.forEach(function(k){input(k,false);});stage='entering-battle';}
if(stage==='entering-battle'){input('ok',$gameMessage.isBusy()&&Math.floor(Date.now()/120)%2===0);if(window.conditionalArmBattle){buttons.forEach(function(k){input(k,true);});stage='battle-held';}}
if(stage==='battle-held'&&window.conditionalBattleCalleeDone){buttons.forEach(function(k){input(k,false);});stage='returning';}
if(stage==='returning'){if($gameMessage.isBusy()){var down=Math.floor(Date.now()/120)%2===0;input('ok',down);}else input('ok',false);if(window.conditionalReturned&&scene instanceof Scene_Map&&!$gameMap._interpreter.isRunning()&&!scene.isBusy())finish(null);}
if(Date.now()-start>45000)throw new Error('Timeout at '+stage+' '+name);
}catch(error){finish(String(error.stack||error));}},20);
}());`;
function makeScenario(editSources){return{slug:'mv-r3-r4-conditional-native-v3-preparation',scriptPath:__filename,plan,observer,fixture,affectedCarriers:['Map001.json','CommonEvents.json','Troops.json'],
async seedDifference(project){for(const[file,index]of [['Map001.json',1],['CommonEvents.json',1]]){const target=path.join(project,'data',file),value=JSON.parse(await fs.readFile(target,'utf8'));const event=file==='Map001.json'?value.events[index]:value[index];event.name='PAIR-SEED '+event.name;await fs.writeFile(target,JSON.stringify(value,null,2)+'\n');}const target=path.join(project,'data/Troops.json'),troops=JSON.parse(await fs.readFile(target,'utf8'));troops[1].pages[0].list.unshift(c(108,['PAIR-SEED conditional owned harmless comment']));await fs.writeFile(target,JSON.stringify(troops,null,2)+'\n');},editSources};}
module.exports={cases,list,expected,plan,fixture,observer,makeScenario};
