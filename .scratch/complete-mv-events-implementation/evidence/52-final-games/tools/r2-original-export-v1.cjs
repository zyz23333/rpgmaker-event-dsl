'use strict';
// Independent literal R2 controls. Troop product pairing is deliberately deferred.
const fs=require('node:fs/promises'),sync=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {files,json,sha}=require('./utilities-v1.cjs');
const cmd=(code,parameters=[],indent=0)=>({code,indent,parameters});
const battleDefaults={actorHp:50,actorId:1,actorValid:false,enemyHp:50,enemyIndex:0,enemyValid:false,switchId:1,switchValid:false,turnA:0,turnB:0,turnEnding:false,turnValid:false};
const mapDefaults={actorId:1,actorValid:false,itemId:1,itemValid:false,selfSwitchCh:'A',selfSwitchValid:false,switch1Id:1,switch1Valid:false,switch2Id:1,switch2Valid:false,variableId:1,variableValid:false,variableValue:0};
const battleTrace=id=>cmd(355,[`window.r2BattleTrace.push({id:${JSON.stringify(id)},turn:$gameTroop.turnCount(),phase:BattleManager._phase,frame:Graphics.frameCount,eventId:this._eventId,mapId:this._mapId,inBattle:$gameParty.inBattle(),enemyHp:$gameTroop.members().map(function(e){return e.hp;}),actorHp:$gameParty.members().map(function(a){return a.hp;})});`]);
const page=(id,conditions,span,after=[])=>({conditions:{...battleDefaults,...conditions},span,list:[battleTrace(id),...after,cmd(0)]});
const expectedTrace=[
 ['turn-zero-first',0],['turn-zero-following',0],['battle-span',1],['turn-span',1],['moment-repeat',1],['moment-repeat',1],['moment-first',1],['moment-following',1],['odd-turns',1],['even-turns',2],['exact-turn-two',2],['turn-span',2],['all-conditions-true',2],['turn-span',3],['odd-turns',3],['finish-turn-three',3]
].map(([id,turn])=>({id,turn,phase:turn===0?'start':(['even-turns','exact-turn-two'].includes(id)?'turn':'turnEnd')}));
const never=['all-disabled-never','and-switch-false-never','and-enemy-false-never','and-actor-false-never','and-turn-false-never'];
const plan={purpose:'R2 literal actual Scene_Battle scheduling preparation, no19 Troop product ownership',expectedTrace,never,expectedMomentCounter:2,expectedInputTurns:[0,1,2],finalTurn:3,battleId:1,launchSwitch:30,observerBoundary:'Only clean setupNewGame/goto Map, launch switch30 once, native Input Fight/Guard/OK, passive observations and quit. No interpreter setup/update, BattleManager setup/startTurn/update/endBattle, action.setGuard, event scheduling or engine replacement.'};
async function buildFixture(seedRoot){
 const carriers={};for(const file of await files(path.join(seedRoot,'data'))){const rel=path.relative(path.join(seedRoot,'data'),file).split(path.sep).join('/');if(rel.endsWith('.json'))carriers[rel]=JSON.parse(await fs.readFile(file,'utf8'));}
 const system=carriers['System.json'];system.partyMembers=[1];while(system.switches.length<=30)system.switches.push('');while(system.variables.length<=10)system.variables.push('');
 const actor=carriers['Actors.json'][1];actor.classId=1;actor.initialLevel=1;
 const enemy=carriers['Enemies.json'][1];enemy.params=[500,0,1,1,1,1,1,1];enemy.exp=0;enemy.gold=0;enemy.dropItems=[];enemy.actions=[{conditionParam1:0,conditionParam2:0,conditionType:0,rating:5,skillId:2}];
 const all={turnEnding:true,turnValid:true,turnA:2,turnB:0,enemyValid:true,enemyIndex:0,enemyHp:100,actorValid:true,actorId:1,actorHp:100,switchValid:true,switchId:2};
 const repeatAfter=[cmd(122,[10,10,1,0,1]),cmd(111,[1,10,0,2,1]),cmd(121,[6,6,1],1),cmd(0,[],1),cmd(412)];
 const pages=[
  page('all-disabled-never',{},0),
  page('turn-zero-first',{turnValid:true},0,[cmd(121,[1,1,0])]),
  page('turn-zero-following',{turnValid:true},0,[cmd(121,[2,2,0])]),
  page('and-switch-false-never',{...all,switchId:3},0),
  page('and-enemy-false-never',{...all,enemyHp:99},0),
  page('and-actor-false-never',{...all,actorHp:99},0),
  page('and-turn-false-never',{...all,turnA:99},0),
  page('battle-span',{turnEnding:true},0),
  page('turn-span',{turnEnding:true},1),
  page('moment-repeat',{turnEnding:true,switchValid:true,switchId:6},2,repeatAfter),
  page('moment-first',{turnEnding:true,switchValid:true,switchId:4},2,[cmd(121,[4,4,1]),cmd(121,[5,5,0])]),
  page('moment-following',{turnEnding:true,switchValid:true,switchId:5},2,[cmd(121,[5,5,1])]),
  page('odd-turns',{turnEnding:true,turnValid:true,turnA:1,turnB:2},1),
  page('even-turns',{turnValid:true,turnA:0,turnB:2},1),
  page('exact-turn-two',{turnValid:true,turnA:2,turnB:0},1),
  page('all-conditions-true',all,0),
  page('finish-turn-three',{turnEnding:true,turnValid:true,turnA:3,turnB:0},0,[cmd(331,[0,1,0,9999999,true])])
 ];
 carriers['Troops.json'][1]={id:1,name:'Original normal-input R2 scheduling control',members:[{enemyId:1,x:408,y:280,hidden:false}],pages};
 const mapTrace=id=>cmd(355,[`window.r2MapTrace.push({id:${JSON.stringify(id)},frame:Graphics.frameCount,scene:SceneManager._scene.constructor.name,inBattle:$gameParty.inBattle(),eventId:this._eventId,mapId:this._mapId});`]);
 const mapPage=(list,trigger,conditions)=>({conditions:{...mapDefaults,...conditions},directionFix:false,image:{tileId:0,characterName:'',direction:2,pattern:0,characterIndex:0},list,moveFrequency:3,moveRoute:{list:[{code:0,parameters:[]}],repeat:true,skippable:false,wait:false},moveSpeed:3,moveType:0,priorityType:0,stepAnime:false,through:true,trigger,walkAnime:true});
 const map=carriers['Map001.json'];map.encounterList=[];map.events=[null,{id:1,name:'Normal-input R2 battle launch',note:'',x:0,y:0,pages:[mapPage([mapTrace('before-battle'),cmd(121,[4,4,0]),cmd(121,[6,6,0]),cmd(301,[0,1,false,false]),mapTrace('after-battle'),cmd(123,['A',0]),cmd(0)],3,{switch1Valid:true,switch1Id:30}),mapPage([cmd(0)],0,{selfSwitchValid:true})]}];
 const loadedCarriers={'Map001.json':structuredClone(map),'Troops.json':structuredClone(carriers['Troops.json']),'System.json':structuredClone(system)};loadedCarriers['Map001.json'].meta={};loadedCarriers['Map001.json'].events[1].meta={};
 return{carriers,loadedCarriers,plan,provenance:'Independent complete native saved carriers. Self-authored Map autorun/17 Troop pages; party actor1 uses native Guard UI, enemy1 native AI Guard skill2. Native E331 defeats enemy at turnEnd3. All controls are loaded from real project data; no observed compiler output supplies expectations.'};
}
const observer=`(function(){
var fs=require('fs'),path=require('path'),crypto=require('crypto'),start=Date.now(),stage='title',loaded=null,seenBattle=false,returnFrame=null,finished=false,inputs=[],states=[],actions=[],lastState='',lastAction='',armedFrame=null;
window.r2BattleTrace=[];window.r2MapTrace=[];
function copy(value){return JSON.parse(JSON.stringify(value));}
function setInput(key,value){if(Input._currentState[key]!==value){Input._currentState[key]=value;inputs.push({frame:Graphics.frameCount,key:key,down:value,phase:BattleManager._phase,turn:$gameTroop?$gameTroop.turnCount():null});}}
function input(desired){var pulse=Math.floor(Date.now()/110)%2===0;['ok','down','up','left','right','cancel'].forEach(function(key){setInput(key,key===desired&&pulse);});}
function state(){var scene=SceneManager._scene,p=scene&&scene._partyCommandWindow,a=scene&&scene._actorCommandWindow,actor=BattleManager.actor();return{scene:scene&&scene.constructor.name,phase:BattleManager._phase,turn:$gameTroop?$gameTroop.turnCount():null,partyWindow:p&&p.active?{symbol:p.currentSymbol(),index:p.index(),enabled:p.isCurrentItemEnabled()}:null,actorWindow:a&&a.active?{actorId:actor?actor.actorId():null,symbol:a.currentSymbol(),index:a.index(),enabled:a.isCurrentItemEnabled()}:null};}
function record(){var value=state(),signature=JSON.stringify(value);if(signature!==lastState){states.push({frame:Graphics.frameCount,state:value});lastState=signature;}var action=BattleManager._action,subject=BattleManager._subject;if(BattleManager._phase==='action'&&action&&subject){var value2={turn:$gameTroop.turnCount(),subject:subject.isActor()?'actor'+subject.actorId():'enemy'+subject.index(),skillId:action.item()?action.item().id:null},sig=JSON.stringify(value2);if(sig!==lastAction){actions.push({frame:Graphics.frameCount,action:value2});lastAction=sig;}}}
function finish(error){if(finished)return;finished=true;input(null);var trace=window.r2BattleTrace,actualTrace=trace.map(function(entry){return{id:entry.id,turn:entry.turn,phase:entry.phase};}),expectedTrace=${JSON.stringify(expectedTrace)},never=${JSON.stringify(never)};
 var guardTurns=states.filter(function(entry){return entry.state.actorWindow&&entry.state.actorWindow.symbol==='guard';}).map(function(entry){return entry.state.turn;}).filter(function(value,index,array){return array.indexOf(value)===index;});
 var actual={trace:actualTrace,momentCounter:$gameVariables.value(10),neverSeen:trace.filter(function(entry){return never.indexOf(entry.id)>=0;}).map(function(entry){return entry.id;}),guardInputTurns:guardTurns,allTroopContext:trace.every(function(entry){return entry.inBattle&&entry.eventId===0&&entry.mapId===1;}),mapOrder:window.r2MapTrace.map(function(entry){return entry.id;}),mapAfterIsNormal:window.r2MapTrace.filter(function(entry){return entry.id==='after-battle';}).every(function(entry){return entry.scene==='Scene_Map'&&!entry.inBattle&&entry.eventId===1&&entry.mapId===1;}),switches:[1,2,3,4,5,6].map(function(id){return $gameSwitches.value(id);}),winCount:$gameSystem._winCount,enemyDead:$gameTroop.isAllDead(),partyAlive:!$gameParty.isAllDead(),finalTurn:$gameTroop.turnCount(),mapStopped:!$gameMap._interpreter.isRunning(),realBattleSeen:seenBattle};
 var expected={trace:expectedTrace,momentCounter:2,neverSeen:[],guardInputTurns:[0,1,2],allTroopContext:true,mapOrder:['before-battle','after-battle'],mapAfterIsNormal:true,switches:[true,true,false,false,false,false],winCount:1,enemyDead:true,partyAlive:true,finalTurn:3,mapStopped:true,realBattleSeen:true};
 var engineFiles={};['rpg_core.js','rpg_managers.js','rpg_objects.js','rpg_scenes.js','rpg_sprites.js','rpg_windows.js','main.js'].forEach(function(name){engineFiles[name]=crypto.createHash('sha256').update(fs.readFileSync(path.join(process.cwd(),'js',name))).digest('hex');});
 fs.writeFileSync(path.join(process.cwd(),'runtime-result.json'),JSON.stringify({purpose:'R2 independent literal normal Scene/Input control; future Troop product pair deferred',timestamp:new Date().toISOString(),method:'actual-native-game',engine:Utils.RPGMAKER_VERSION,versions:process.versions,pid:process.pid,execPath:process.execPath,cwd:process.cwd(),scene:SceneManager._scene.constructor.name,frame:Graphics.frameCount,stage:stage,armedFrame:armedFrame,loaded:loaded,engineFiles:engineFiles,trace:trace,mapTrace:window.r2MapTrace,inputChanges:inputs,stateChanges:states,actionObservations:actions,expected:expected,actual:actual,error:error,passed:!error&&JSON.stringify(actual)===JSON.stringify(expected),control:${JSON.stringify(plan.observerBoundary)}},null,2));clearInterval(timer);nw.App.quit();}
var timer=setInterval(function(){try{
 var scene=SceneManager._scene;
 if(stage==='title'&&scene instanceof Scene_Title){DataManager.setupNewGame();SceneManager.goto(Scene_Map);stage='map';}
 else if(stage==='map'&&scene instanceof Scene_Map&&Graphics.frameCount>120&&!scene.isBusy()){
  loaded={'Map001.json':copy($dataMap),'Troops.json':copy($dataTroops),'System.json':copy($dataSystem)};
  if(window.r2BattleTrace.length||window.r2MapTrace.length)throw new Error('Unexpected event before launch activation');armedFrame=Graphics.frameCount;$gameSwitches.setValue(30,true);stage='running';
 }
 if(stage==='running'){
  record();
  if(scene instanceof Scene_Battle){seenBattle=true;var desired=null;
   if($gameMessage.isBusy())desired='ok';
   else if(scene._partyCommandWindow&&scene._partyCommandWindow.active)desired=scene._partyCommandWindow.currentSymbol()==='fight'?'ok':'up';
   else if(scene._actorCommandWindow&&scene._actorCommandWindow.active)desired=scene._actorCommandWindow.currentSymbol()==='guard'?'ok':'down';
   input(desired);
  }else input(null);
  if(seenBattle&&scene instanceof Scene_Map){if(returnFrame===null)returnFrame=Graphics.frameCount;if(window.r2MapTrace.some(function(entry){return entry.id==='after-battle';})&&$gameSelfSwitches.value([1,1,'A'])&&!$gameMap._interpreter.isRunning()&&Graphics.frameCount>=returnFrame+3)finish(null);}
 }
 if(Date.now()-start>50000)throw new Error('Timeout: '+JSON.stringify(state()));
}catch(error){finish(String(error.stack||error));}},25);
}());`;
function makeFuturePairScenario(editSources){
 assert.equal(typeof editSources,'function','After Troop ownership exists, supply an actual discovered-source editor removing the owned marker and Map seed name');
 return{slug:'mv-r2-normal-scene-scheduling-pair',scriptPath:__filename,plan,observer,affectedCarriers:['Map001.json','Troops.json'],fixture:buildFixture,
  async seedDifference(project){const mapFile=path.join(project,'data/Map001.json'),map=JSON.parse(await fs.readFile(mapFile,'utf8'));map.events[1].name='PAIR-SEED Normal-input R2 battle launch';await fs.writeFile(mapFile,JSON.stringify(map,null,2)+'\n');const troopFile=path.join(project,'data/Troops.json'),troops=JSON.parse(await fs.readFile(troopFile,'utf8'));troops[1].pages[0].list.unshift(cmd(108,['PAIR-SEED owned harmless R2 comment']));await fs.writeFile(troopFile,JSON.stringify(troops,null,2)+'\n');},editSources};
}
async function fingerprint(directory){const entries=[];for(const file of await files(directory))entries.push({path:path.relative(directory,file).split(path.sep).join('/'),sha256:sha(await fs.readFile(file))});return{entries,sha256:sha(JSON.stringify(entries))};}
async function runLiteral(options){
 assert.equal(Number(process.versions.node.split('.')[0]),22,'Use recorded tooling Node22');const root=path.join(options.outputRoot,'mv-r2-normal-scene-literal-preparation-'+crypto.randomUUID());await fs.mkdir(root);await fs.copyFile(__filename,path.join(root,'scenario-original.cjs'),sync.constants.COPYFILE_EXCL);await fs.copyFile(path.join(__dirname,'mv-native-pair-support.cjs'),path.join(root,'pair-support-original.cjs'),sync.constants.COPYFILE_EXCL);
 const report={purpose:plan.purpose,root,options,node:process.version,toolNode:process.execPath,startedAt:new Date().toISOString(),passed:false,futurePair:{status:'not executed: retained19 has no Troop DSL ownership',entry:'makeFuturePairScenario(editSources)',formalSourceEdit:'Map owned name plus remove harmless owned comment in first Troop page; never edit external troop name',gateRequired:true,requiredBuild:'rebuild after24/25/46/48 as applicable; no raw or fabricated Troop output'}};
 try{
  const expected=await buildFixture(options.seedRoot);await json(path.join(root,'independent-fixture.json'),expected);await json(path.join(root,'future-product-pair-seam.json'),report.futurePair);
  const project=path.join(root,'literal','Game');report.project=project;await fs.mkdir(project,{recursive:true});await fs.cp(path.join(options.seedRoot,'data'),path.join(project,'data'),{recursive:true,errorOnExist:true,force:false});for(const name of ['js','img','audio','fonts','icon'])await fs.symlink(path.join(options.seedRoot,name),path.join(project,name),'junction');for(const [file,value]of Object.entries(expected.carriers))await fs.writeFile(path.join(project,'data',file),JSON.stringify(value,null,2)+'\n');
  await fs.writeFile(path.join(project,'Game.rpgproject'),'RPGMV 1.6.1\n',{flag:'wx'});await json(path.join(project,'package.json'),{name:'mv-r2-normal-scene-literal-preparation',main:'index.html',window:{show:false,width:816,height:624},'chromium-args':'--mute-audio'});const index=await fs.readFile(path.join(options.seedRoot,'index.html'),'utf8'),main='<script type="text/javascript" src="js/main.js"></script>';assert.ok(index.includes(main));await fs.writeFile(path.join(project,'index.html'),index.replace(main,'<script type="text/javascript" src="observer.js"></script>'+main),{flag:'wx'});await fs.writeFile(path.join(project,'observer.js'),observer,{flag:'wx'});
  report.identity={scriptSha256:sha(await fs.readFile(__filename)),supportSha256:sha(await fs.readFile(path.join(__dirname,'mv-native-pair-support.cjs'))),observerSha256:sha(observer),host:{path:options.host,sha256:sha(await fs.readFile(options.host))},modules:{},engine:{},toolNodeSha256:sha(await fs.readFile(process.execPath))};for(const name of ['nw.dll','node.dll'])report.identity.modules[name]=sha(await fs.readFile(path.join(path.dirname(options.host),name)));for(const name of ['rpg_core.js','rpg_managers.js','rpg_objects.js','rpg_scenes.js','rpg_sprites.js','rpg_windows.js','main.js'])report.identity.engine[name]=sha(await fs.readFile(path.join(options.seedRoot,'js',name)));
  report.beforeData=await fingerprint(path.join(project,'data'));for(const [file,value]of Object.entries(expected.carriers))assert.deepEqual(JSON.parse(await fs.readFile(path.join(project,'data',file),'utf8')),value);report.completeInputComparison={passed:true,count:Object.keys(expected.carriers).length};
  const stdout=sync.openSync(path.join(project,'stdout.txt'),'wx'),stderr=sync.openSync(path.join(project,'stderr.txt'),'wx'),child=cp.spawn(options.host,[project],{cwd:project,windowsHide:true,stdio:['ignore',stdout,stderr]});sync.closeSync(stdout);sync.closeSync(stderr);report.launch={pid:child.pid,host:options.host,cwd:project,args:[project],windowsHide:true,at:new Date().toISOString()};await json(path.join(project,'native-launch.json'),report.launch);
  report.exit=await new Promise(resolve=>{const timer=setTimeout(()=>{child.kill();resolve({timedOut:true});},60000);child.on('error',error=>{clearTimeout(timer);resolve({error:String(error.stack||error)});});child.on('exit',(exitCode,signal)=>{clearTimeout(timer);resolve({exitCode,signal});});});
  report.afterData=await fingerprint(path.join(project,'data'));report.diskInputUnchanged=JSON.stringify(report.beforeData)===JSON.stringify(report.afterData);const resultBytes=await fs.readFile(path.join(project,'runtime-result.json'));report.runtimeSha256=sha(resultBytes);report.runtime=JSON.parse(resultBytes);report.loadedMatch=false;try{assert.deepEqual(report.runtime.loaded,expected.loadedCarriers);report.loadedMatch=true;}catch(error){report.loadedError=error.message;}
  report.engineMatch=Object.entries(report.identity.engine).every(([name,hash])=>report.runtime.engineFiles[name]===hash);for(const name of ['stdout.txt','stderr.txt']){const bytes=await fs.readFile(path.join(project,name));report[name]={sha256:sha(bytes),bytes:bytes.length};}report.passed=report.exit.exitCode===0&&report.runtime.passed&&report.diskInputUnchanged&&report.loadedMatch&&report.engineMatch;
 }catch(error){report.error={message:error.message,stack:error.stack};}
 report.completedAt=new Date().toISOString();await json(path.join(root,'literal-result.json'),report);console.log(JSON.stringify({root,passed:report.passed,error:report.error,exit:report.exit,loadedMatch:report.loadedMatch,loadedError:report.loadedError,engineMatch:report.engineMatch,actual:report.runtime?.actual,runtimeError:report.runtime?.error},null,2));if(!report.passed)process.exitCode=1;return report;
}
module.exports={buildFixture,makeFuturePairScenario,observer,plan,runLiteral};
