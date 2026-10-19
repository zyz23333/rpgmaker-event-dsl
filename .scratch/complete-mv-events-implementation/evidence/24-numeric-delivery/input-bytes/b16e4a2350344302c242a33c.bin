'use strict';
// New ticket24 delivery adapter; frozen original preparation remains unchanged.
const fs=require('node:fs/promises');
const path=require('node:path');
const assert=require('node:assert/strict');
const {runPair,files,sha}=require('./mv24-native-pair-delivery-v1.cjs');
const args=Object.fromEntries(process.argv.slice(2).map(value=>{const at=value.indexOf('=');assert.ok(at>2,'Use --key=value');return[value.slice(2,at),value.slice(at+1)];}));
const repo=args.repo||'F:/Shuen/RPG/rpgmaker-event-dsl';
const profile='complete';assert.ok(!args.profile || args.profile === 'complete');
const options={profile,packageRoot:args.packageRoot||'C:/Users/Shuen/.codex/worktrees/mv-ticket-24/rpgmaker-event-dsl/packages/rpgmaker-event-dsl',seedRoot:args.seedRoot||path.join(repo,'references/RPGMV/NewData'),host:args.host||path.join(repo,'references/RPGMV/nwjs-win-test/game.exe'),outputRoot:args.outputRoot||'C:/Users/Shuen/.codex/tmp',timeoutMs:Number(args.timeoutMs||50000)};
const cmd=(code,parameters=[])=>({code,indent:0,parameters});
const trace=id=>cmd(355,[`window.mvR1Trace.push({id:${JSON.stringify(id)},eventId:this._eventId,mapId:this._mapId,pageIndex:this._eventId?$gameMap.event(this._eventId)._pageIndex:null,inBattle:$gameParty.inBattle(),frame:Graphics.frameCount});`]);
const disabledSavedId=1;
const conditions=switchId=>({actorId:disabledSavedId,actorValid:false,itemId:disabledSavedId,itemValid:false,selfSwitchCh:'A',selfSwitchValid:false,switch1Id:switchId,switch1Valid:true,switch2Id:disabledSavedId,switch2Valid:false,variableId:disabledSavedId,variableValid:false,variableValue:0});
const page=(id,switchId,trigger,list,custom=false)=>({conditions:conditions(switchId),directionFix:false,image:{characterIndex:0,characterName:'',direction:2,pattern:0,tileId:0},list:list||[trace(id),cmd(121,[switchId,switchId,1]),cmd(0)],moveFrequency:5,moveRoute:{list:custom?[{code:2},{code:15,parameters:[10]},{code:0,parameters:[]}]:[{code:0,parameters:[]}],repeat:true,skippable:false,wait:false},moveSpeed:4,moveType:custom?3:0,priorityType:1,stepAnime:false,through:false,trigger,walkAnime:true});
const event=(id,name,pages)=>({id,name,...(profile==='complete'?{note:''}:{}),x:2,y:id,pages});
const plan=[
 {id:'action',switches:[11],eventId:1,pageIndex:0,input:'ok'},
 {id:'player-touch',switches:[12],eventId:2,pageIndex:0,input:'right'},
 {id:'event-touch',switches:[13],eventId:3,pageIndex:0,input:'none'},
 {id:'autorun',switches:[14],eventId:4,pageIndex:0,input:'none'},
 {id:'parallel',switches:[15],eventId:5,pageIndex:0,input:'none'},
 {id:'highest-page-low',switches:[16],eventId:6,pageIndex:0,input:'ok'},
 {id:'highest-page-high',switches:[16,20],eventId:6,pageIndex:1,input:'ok'},
 {id:'common-none-called',switches:[17],eventId:7,pageIndex:0,input:'ok'},
 {id:'common-autorun',switches:[18],eventId:0,pageIndex:null,input:'none'},
 {id:'common-parallel',switches:[19],eventId:0,pageIndex:null,input:'none'}
];
const observer=`(function(){
var fs=require('fs'),path=require('path'),crypto=require('crypto'),start=Date.now(),stage='title',caseIndex=-1,caseFrame=0,settledFrame=null,loaded=null,results=[],actions=[],finished=false;
var cases=${JSON.stringify(plan)};window.mvR1Trace=[];
function copy(value){return JSON.parse(JSON.stringify(value));}
function input(key,value){if(Input._currentState[key]!==value){Input._currentState[key]=value;actions.push({frame:Graphics.frameCount,key:key,down:value,caseIndex:caseIndex});}}
function release(){['ok','right','left','up','down','cancel'].forEach(function(key){input(key,false);});}
function begin(){release();caseIndex++;settledFrame=null;if(caseIndex===cases.length){finish(null);return;}var test=cases[caseIndex],playerY=test.eventId||1;$gamePlayer.locate(1,playerY);$gamePlayer.setDirection(6);test.switches.forEach(function(id){$gameSwitches.setValue(id,true);});caseFrame=Graphics.frameCount;stage='case';actions.push({frame:caseFrame,fixture:'explicit-player-position-and-switches',caseIndex:caseIndex,switches:test.switches,player:[1,playerY],direction:6});}
function finish(error){if(finished)return;finished=true;release();
 var expected=cases.map(function(test){return{id:test.id,eventId:test.eventId,mapId:1,pageIndex:test.pageIndex,inBattle:false};});
 var actual=window.mvR1Trace.map(function(item){return{id:item.id,eventId:item.eventId,mapId:item.mapId,pageIndex:item.pageIndex,inBattle:item.inBattle};});
 var engineFiles={};['rpg_core.js','rpg_managers.js','rpg_objects.js','rpg_scenes.js','rpg_sprites.js','rpg_windows.js','main.js'].forEach(function(name){engineFiles[name]=crypto.createHash('sha256').update(fs.readFileSync(path.join(process.cwd(),'js',name))).digest('hex');});
 var passed=!error&&results.length===cases.length&&results.every(function(result){return result.passed;})&&JSON.stringify(expected)===JSON.stringify(actual);
 fs.writeFileSync(path.join(process.cwd(),'runtime-result.json'),JSON.stringify({purpose:'Ticket24 representative Map/Common R1 delivery; not final52 acceptance',timestamp:new Date().toISOString(),method:'actual-native-game',engine:Utils.RPGMAKER_VERSION,versions:process.versions,execPath:process.execPath,pid:process.pid,cwd:process.cwd(),frame:Graphics.frameCount,stage:stage,caseIndex:caseIndex,loaded:loaded,engineFiles:engineFiles,plan:cases,actions:actions,trace:window.mvR1Trace,results:results,expected:expected,actual:actual,error:error,passed:passed,control:'Unmodified engine. Observer clean-starts newgame, explicitly positions player and activates fixture switches, supplies Input OK/right states, reads actual loaded records and state. No interpreter setup/update, event.start, player.moveStraight, Scene update or trigger method is called/replaced.'},null,2));clearInterval(timer);nw.App.quit();}
var timer=setInterval(function(){try{
 if(stage==='title'&&SceneManager._scene instanceof Scene_Title){DataManager.setupNewGame();SceneManager.goto(Scene_Map);stage='map';}
 else if(stage==='map'&&SceneManager._scene instanceof Scene_Map&&Graphics.frameCount>120&&!SceneManager._scene.isBusy()){
  loaded={'Map001.json':copy($dataMap),'CommonEvents.json':copy($dataCommonEvents),'System.json':copy($dataSystem)};
  if(window.mvR1Trace.length!==0)throw new Error('Unexpected automatic execution before fixture activation');begin();
 }else if(stage==='case'){
  var test=cases[caseIndex],elapsed=Graphics.frameCount-caseFrame,matches=window.mvR1Trace.filter(function(entry){return entry.id===test.id;});
  if(matches.length===0&&elapsed>=4){input('ok',test.input==='ok'&&elapsed%24<6);input('right',test.input==='right');}else release();
  if(matches.length>0&&test.switches.every(function(id){return !$gameSwitches.value(id);})&&!$gameMap.isEventRunning()){
   if(settledFrame===null)settledFrame=Graphics.frameCount;
   if(Graphics.frameCount-settledFrame>=12){results.push({id:test.id,count:matches.length,trace:copy(matches),player:{x:$gamePlayer.x,y:$gamePlayer.y,direction:$gamePlayer.direction()},event:test.eventId?{x:$gameMap.event(test.eventId).x,y:$gameMap.event(test.eventId).y}:null,passed:matches.length===1});begin();}
  }
  if(elapsed>480)throw new Error('Case timed out: '+test.id);
 }
 if(Date.now()-start>40000)throw new Error('Overall timeout at '+stage);
}catch(error){finish(String(error.stack||error));}},25);
}());`;
const names=['action','player-touch','event-touch','autorun','parallel','highest-page','call-common','Call only','Common autorun','Common parallel'];
const scenario={slug:'mv24-r1-map-common-delivery-v1',scriptPath:__filename,plan,observer,affectedCarriers:['Map001.json','CommonEvents.json'],
 async fixture(seed){
  const map=JSON.parse(await fs.readFile(path.join(seed,'data/Map001.json'),'utf8'));
  map.events=[null,event(1,'action',[page('action',11,0)]),event(2,'player-touch',[page('player-touch',12,1)]),event(3,'event-touch',[page('event-touch',13,2,undefined,true)]),event(4,'autorun',[page('autorun',14,3)]),event(5,'parallel',[page('parallel',15,4)]),event(6,'highest-page',[page('highest-page-low',16,0),page('highest-page-high',20,0,[trace('highest-page-high'),cmd(121,[16,16,1]),cmd(121,[20,20,1]),cmd(0)])]),event(7,'call-common',[page('call-common',17,0,[cmd(117,[1]),cmd(121,[17,17,1]),cmd(0)])])];
  const common=[null,{id:1,name:'Call only',trigger:0,switchId:1,list:[trace('common-none-called'),cmd(0)]},{id:2,name:'Common autorun',trigger:1,switchId:18,list:[trace('common-autorun'),cmd(121,[18,18,1]),cmd(0)]},{id:3,name:'Common parallel',trigger:2,switchId:19,list:[trace('common-parallel'),cmd(121,[19,19,1]),cmd(0)]}];
  const system=JSON.parse(await fs.readFile(path.join(seed,'data/System.json'),'utf8'));assert.ok(system.switches.length>20,'Seed requires System switches through20');system.startX=1;system.startY=1;
  const carriers={'Map001.json':map,'CommonEvents.json':common,'System.json':system};
  const loadedCarriers=structuredClone(carriers);loadedCarriers['Map001.json'].meta={};for(const entry of loadedCarriers['Map001.json'].events)if(entry&&entry.note!==undefined)entry.meta={};
  return{carriers,loadedCarriers,profile,profileLimit:profile==='plumbing19'?'Deliberately narrower independent synthetic fixture: absent event note and disabled saved IDs0. Complete profile retains note and IDs1 and is known to fail on19. No normalization or acceptance claim.':'Native-complete saved fields retained; any compiler loss must fail before native launch.',loadedExpectation:'Unchanged DataManager.onLoad adds map.meta and event.meta only when event.note exists (rpg_managers.js onLoad). Empty notes yield {}. Raw loaded carriers retained; no saved field is removed or normalized.',provenance:'Self-authored literal event records; untouched first-party seed context, copied data and read-only asset/runtime junctions'};
 },
 async seedDifference(project){for(const file of ['Map001.json','CommonEvents.json']){const full=path.join(project,'data',file),value=JSON.parse(await fs.readFile(full,'utf8'));for(const entry of file==='Map001.json'?value.events:value)if(entry)entry.name='PAIR-SEED '+entry.name;await fs.writeFile(full,JSON.stringify(value,null,2)+'\n');}},
 async editSources(workspace){const edits=[];for(const file of await files(path.join(workspace,'src'))){if(!file.endsWith('.ts'))continue;const before=await fs.readFile(file,'utf8');let after=before;for(const name of names)after=after.split(JSON.stringify('PAIR-SEED '+name)).join(JSON.stringify(name));if(after!==before){assert.ok(!after.includes('PAIR-SEED '),'Every seed name must become formal final source');await fs.writeFile(file,after);edits.push({file:path.relative(workspace,file),beforeSha256:sha(before),afterSha256:sha(after)});}}assert.ok(edits.length>=2,'Actual Map and Common source must be changed');return edits;}
};
runPair(options,scenario).catch(error=>{console.error(error.stack||error);process.exitCode=1;});
