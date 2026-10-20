'use strict';
// Independent result-branch supplements. They do not replace the original full R2.
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {strictJson,files,sha}=require('./utilities-v1.cjs');
const r2=require('./r2-original-export-v1.cjs');
const c=(code,parameters=[],indent=0)=>({code,indent,parameters});
const descriptors=['win','escape','lose'].map(outcome=>({id:'r2-result-'+outcome,group:'R2',kind:'battle-result',outcome}));
async function buildScenario(descriptor){
 const outcome=descriptor.outcome;assert.ok(['win','escape','lose'].includes(outcome));
 const expected={trace:['before','branch-'+outcome,'after'],realBattleSeen:true,gameOverSeen:false,partyAlive:true,enemyDead:outcome==='win',battleCount:1,winCount:outcome==='win'?1:0,escapeCount:outcome==='escape'?1:0,mapStopped:true,returnedOutsideBattle:true,finalScene:'Scene_Map',escapeInputUsed:outcome==='escape',escapeRatioSafe:true};
 const observer=`(function(){
 ${strictJson.toString()}
 var fs=require('fs'),path=require('path'),crypto=require('crypto'),outcome=${JSON.stringify(outcome)},expected=${strictJson(expected)},start=Date.now(),stage='title',loaded=null,finished=false,seenBattle=false,seenGameOver=false,escapeUsed=false,ratioSafe=true,pressed=null,releaseAt=0,nextInput=0,transitions=[],lastScene=null;
 window.final52ResultTrace=[];window.final52ResultDone=false;
 function copy(v){return JSON.parse(strictJson(v));}
 function press(key){if(pressed)return;Input._currentState[key]=true;pressed=key;releaseAt=Graphics.frameCount+6;nextInput=Graphics.frameCount+24;}
 function release(){if(pressed){Input._currentState[pressed]=false;pressed=null;}}
 function finish(error){if(finished)return;finished=true;release();var actual={trace:window.final52ResultTrace,realBattleSeen:seenBattle,gameOverSeen:seenGameOver,partyAlive:$gameParty.members().every(function(a){return a.isAlive();}),enemyDead:$gameTroop.isAllDead(),battleCount:$gameSystem.battleCount(),winCount:$gameSystem.winCount(),escapeCount:$gameSystem.escapeCount(),mapStopped:!$gameMap._interpreter.isRunning(),returnedOutsideBattle:!$gameParty.inBattle(),finalScene:SceneManager._scene.constructor.name,escapeInputUsed:escapeUsed,escapeRatioSafe:ratioSafe},engineFiles={};
 ['rpg_core.js','rpg_managers.js','rpg_objects.js','rpg_scenes.js','rpg_sprites.js','rpg_windows.js','main.js'].forEach(function(n){engineFiles[n]=crypto.createHash('sha256').update(fs.readFileSync(path.join(process.cwd(),'js',n))).digest('hex');});
 fs.writeFileSync(path.join(process.cwd(),'runtime-result.json'),strictJson({purpose:'Final52 normal battle result branches supplement; original17page3turn pair remains separate',method:'actual-native-game',engine:Utils.RPGMAKER_VERSION,versions:process.versions,loaded:loaded,engineFiles:engineFiles,transitions:transitions,expected:expected,actual:actual,error:error,passed:!error&&strictJson(actual)===strictJson(expected),control:'Clean setupNewGame/gotoMap, launch switch30, passive observation and actual native Input only. Authored turn0 native E331/E311 determines victory/defeat; ordinary party Escape UI determines escape. Native agility data makes escape ratio>=1; no RNG/Scene/interpreter/command/wait/loader patch or direct BattleManager operation.'}));clearInterval(timer);nw.App.quit();}
 var timer=setInterval(function(){try{var scene=SceneManager._scene,name=scene&&scene.constructor.name;if(name!==lastScene){transitions.push({frame:Graphics.frameCount,scene:name});lastScene=name;}if(pressed&&Graphics.frameCount>=releaseAt)release();if(scene instanceof Scene_Battle){seenBattle=true;if(outcome==='escape')ratioSafe=ratioSafe&&BattleManager._escapeRatio>=1;}if(scene instanceof Scene_Gameover)seenGameOver=true;
 if(stage==='title'&&scene instanceof Scene_Title){DataManager.setupNewGame();SceneManager.goto(Scene_Map);stage='map';}
 else if(stage==='map'&&scene instanceof Scene_Map&&Graphics.frameCount>120&&!scene.isBusy()){loaded={'Map001.json':copy($dataMap),'CommonEvents.json':copy($dataCommonEvents),'Troops.json':copy($dataTroops),'System.json':copy($dataSystem)};$gameSwitches.setValue(30,true);stage='running';}
 else if(stage==='running'){
  if(!pressed&&Graphics.frameCount>=nextInput){if($gameMessage.isBusy())press('ok');else if(outcome==='escape'&&scene instanceof Scene_Battle&&scene._partyCommandWindow&&scene._partyCommandWindow.active){if(scene._partyCommandWindow.currentSymbol()==='escape'){escapeUsed=true;press('ok');}else press('down');}}
  if(window.final52ResultDone&&scene instanceof Scene_Map&&!scene.isBusy()&&!$gameMap._interpreter.isRunning())finish(null);
 }
 if(Date.now()-start>45000)throw new Error('Result branch timeout '+outcome+' '+stage+' '+name);
 }catch(e){finish(String(e.stack||e));}},20);
 }());`;
 return {slug:'final52-'+descriptor.id,scriptPath:__filename,plan:{descriptor,expected,preparationOnly:true,scope:'Independent three result bodies, native victory/escape/canLose return; does not discharge17page scheduling'},observer,affectedCarriers:['Map001.json','Troops.json'],
 async fixture(seed){
  const f=structuredClone(await r2.buildFixture(seed)),carriers=f.carriers,system=carriers['System.json'];
  const actor=carriers['Actors.json'][1];actor.traits=[];actor.equips=[0,0,0,0,0];
  const klass=carriers['Classes.json'][1];klass.traits=[];for(const row of klass.params)for(let i=0;i<row.length;i++)row[i]=100;for(let i=0;i<klass.params[6].length;i++)klass.params[6][i]=1000;
  const enemy=carriers['Enemies.json'][1];enemy.params=[100,0,1,1,1,1,1,1];enemy.traits=[];enemy.actions=[];enemy.exp=0;enemy.gold=0;enemy.dropItems=[];
  const troop=carriers['Troops.json'][1],template=structuredClone(troop.pages[1]);template.conditions={...template.conditions,turnValid:true,turnA:0,turnB:0};template.span=0;
  template.list=outcome==='win'?[c(331,[0,1,0,9999,true]),c(0)]:outcome==='lose'?[c(311,[0,0,1,0,9999,true]),c(0)]:[c(0)];troop.pages=[template];troop.members=[{enemyId:1,x:408,y:280,hidden:false}];
  const event=carriers['Map001.json'].events[1],trace=(id,indent=0)=>c(355,[`window.final52ResultTrace.push(${JSON.stringify(id)});`],indent);
  event.name='Final52 result '+outcome;event.pages[0].list=[trace('before'),c(301,[0,1,true,true]),c(601),trace('branch-win',1),c(0,[],1),c(602),trace('branch-escape',1),c(0,[],1),c(603),trace('branch-lose',1),c(0,[],1),c(604),trace('after'),c(355,['window.final52ResultDone=true;']),c(123,['A',0]),c(0)];
  system.partyMembers=[1];f.expected=expected;f.provenance='Self-authored finite supplemental battle results; complete native runtime commands, three real callback branches. Static preparation only.';return f;
 },async seedDifference(project){for(const file of['Map001.json','Troops.json']){const target=path.join(project,'data',file),data=JSON.parse(await fs.readFile(target,'utf8'));if(file==='Map001.json')data.events[1].name='PAIR-SEED '+data.events[1].name;else data[1].pages[0].list.unshift(c(108,['52 result harmless seed comment']));await fs.writeFile(target,strictJson(data)+'\n');}},
 async editSources(workspace){const edits=[];for(const file of await files(path.join(workspace,'src'))){if(!file.endsWith('.ts'))continue;const before=await fs.readFile(file,'utf8');let after=before.replaceAll('PAIR-SEED ','');after=after.replace(/^\s*comment\((?:\["52 result harmless seed comment"\]|\{\s*lines:\s*\["52 result harmless seed comment"\]\s*\})\),?\r?\n/m,'');if(after!==before){await fs.writeFile(file,after);edits.push({file,beforeSha256:sha(before),afterSha256:sha(after)});}}assert.equal(edits.length,2);return edits;},compareNativeRuntimeResults:(a,b)=>a.passed===true&&b.passed===true&&strictJson(a.actual)===strictJson(b.actual)};
}
module.exports={descriptors,buildScenario};
