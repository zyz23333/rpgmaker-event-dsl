'use strict';
// Canonical complete literal normal-Scene preparation v2 only; never product/final acceptance. Derived from preserved original23e28b16; strict isolated literal helper v4.
const fs = require('node:fs/promises');
const sync = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { files, sha } = require('./utilities-v1.cjs');
const {strictJson}=require('./utilities-v1.cjs');
// Historical generic literal-copy path removed; export only.
const definitions = require('./choices-independent-cases-v1.cjs');
const profile='complete';
const cmd = (code, parameters = [], indent = 0) => ({ code, indent, parameters });
const casesFile = path.join(__dirname, 'choices-independent-cases-v1.cjs');
async function buildScenario(original) {
  const test = structuredClone(original);
  // An explicitly different narrow input for old plumbing only. The complete
  // profile keeps native 403 [6,null] and canonical Map saved fields unchanged.
  if (profile === 'plumbing19') {
    for (const record of test.list) if (record.code === 403) record.parameters = [];
    test.list = test.list.filter(record => !(record.code === 0 && record.indent > 0));
  }
  const name = 'R3 ' + test.id;
  const list = [cmd(122, [52, 52, 0, 0, 1]), ...test.list];
  const expected = { value: test.expected.value, complete: test.expected.complete, started: 1,
    remainsRunning: test.expected.remainsRunning === true, choice: test.choice || null,
    waitingChecks: (test.actions || []).filter(action => action === 'assert-waiting').map(() => ({ running: true, messageBusy: true, value: 0, complete: 0 })) };
  expected.savedSigns={cancel:Object.is(test.list[0].parameters[1],-0),defaultChoice:Object.is(test.list[0].parameters[2],-0)};
  const observer = `(function(){
var fs=require('fs'),path=require('path'),crypto=require('crypto'),test=${strictJson(test)},expected=${strictJson(expected)},start=Date.now(),stage='title',loaded=null,actions=[],choice=null,waitingChecks=[],caseFrame=0,startedFrame=null,settledFrame=null,actionIndex=0,pressed=null,releaseFrame=0,nextActionFrame=0,finished=false;
${strictJson.toString()}
function copy(value){return JSON.parse(strictJson(value));}
function press(key){Input._currentState[key]=true;pressed=key;releaseFrame=Graphics.frameCount+6;actions.push({frame:Graphics.frameCount,key:key,down:true,stage:stage});}
function release(){if(pressed){Input._currentState[pressed]=false;actions.push({frame:Graphics.frameCount,key:pressed,down:false,stage:stage});pressed=null;nextActionFrame=Graphics.frameCount+18;}}
function finish(error){if(finished)return;finished=true;release();var interpreter=$gameMap&&$gameMap._interpreter;
 var actual={value:$gameVariables.value(50),complete:$gameVariables.value(51),started:$gameVariables.value(52),remainsRunning:interpreter.isRunning(),choice:choice,waitingChecks:waitingChecks,savedSigns:{cancel:Object.is(loaded["Map001.json"].events[1].pages[0].list[1].parameters[1],-0),defaultChoice:Object.is(loaded["Map001.json"].events[1].pages[0].list[1].parameters[2],-0)}};
 var engineFiles={};['rpg_core.js','rpg_managers.js','rpg_objects.js','rpg_scenes.js','rpg_sprites.js','rpg_windows.js','main.js'].forEach(function(file){engineFiles[file]=crypto.createHash('sha256').update(fs.readFileSync(path.join(process.cwd(),'js',file))).digest('hex');});
 fs.writeFileSync(path.join(process.cwd(),'runtime-result.json'),strictJson({purpose:'Ticket27 allocated R3 actual-game observation; final52 separate',timestamp:new Date().toISOString(),method:'actual-native-game',engine:Utils.RPGMAKER_VERSION,versions:process.versions,execPath:process.execPath,pid:process.pid,cwd:process.cwd(),frame:Graphics.frameCount,stage:stage,loaded:loaded,engineFiles:engineFiles,actions:actions,expected:expected,actual:actual,error:error,passed:!error&&strictJson(actual)===strictJson(expected),control:'Real Map action event, actual Input pulses and unmodified Scene_Map scheduling. Variable52 marker is an identical authored native command in both carriers. No interpreter setup/update or command callback is driven/replaced.'},null,2));clearInterval(timer);nw.App.quit();}
var timer=setInterval(function(){try{
 if(pressed&&Graphics.frameCount>=releaseFrame)release();
 if(stage==='title'&&SceneManager._scene instanceof Scene_Title){DataManager.setupNewGame();SceneManager.goto(Scene_Map);stage='map';}
 else if(stage==='map'&&SceneManager._scene instanceof Scene_Map&&Graphics.frameCount>120&&!SceneManager._scene.isBusy()){
  loaded={'Map001.json':copy($dataMap),'CommonEvents.json':copy($dataCommonEvents),'System.json':copy($dataSystem),'Troops.json':copy($dataTroops)};
  Object.keys(test.initialSwitches||{}).forEach(function(id){$gameSwitches.setValue(Number(id),test.initialSwitches[id]);});
  $gamePlayer.setDirection(6);caseFrame=Graphics.frameCount;stage='action';press('ok');
 }else if(stage==='action'){
  if($gameVariables.value(52)===1){startedFrame=Graphics.frameCount;stage='running';}
  else if(Graphics.frameCount-caseFrame>180)throw new Error('Map action did not execute authored start marker');
 }else if(stage==='running'){
  var interpreter=$gameMap._interpreter,windowChoice=SceneManager._scene._messageWindow._choiceWindow;
  if(test.choice&&windowChoice.active&&!choice){var header=$dataMap.events[1].pages[0].list[1];choice={savedDefault:header.parameters[2],nativeDefault:$gameMessage.choiceDefaultType(),savedCancel:header.parameters[1],nativeCancel:$gameMessage.choiceCancelType(),index:windowChoice.index()};}
  if(test.actions&&windowChoice.active&&!pressed&&Graphics.frameCount>=nextActionFrame&&actionIndex<test.actions.length){
   var action=test.actions[actionIndex++];if(action==='assert-waiting'){waitingChecks.push({running:interpreter.isRunning(),messageBusy:$gameMessage.isBusy(),value:$gameVariables.value(50),complete:$gameVariables.value(51)});nextActionFrame=Graphics.frameCount+18;}else press(action);
  }
  if(test.expected.remainsRunning){if(Graphics.frameCount-startedFrame>=(test.stagnationFrames||120))finish(null);}
  else if(!interpreter.isRunning()&&!$gameMessage.isBusy()){
   if(settledFrame===null)settledFrame=Graphics.frameCount;
   if(Graphics.frameCount-settledFrame>=12)finish(null);
  }
  if(Graphics.frameCount-startedFrame>900)throw new Error('Control-flow case timed out');
 }
 if(Date.now()-start>35000)throw new Error('Overall timeout '+stage);
}catch(error){finish(String(error.stack||error));}},25);
}());`;
  const scenario = { slug: 'mv-r3-complete-v2-' + test.id + '-preparation', scriptPath: __filename,
    plan: { test, expected, profile, entry: 'fresh Map001 action event id1; marker variable52 is actual first saved command' },
    observer, affectedCarriers: ['Map001.json'],
    async fixture(seed) {
      const map = JSON.parse(await fs.readFile(path.join(seed, 'data/Map001.json'), 'utf8'));
      const disabled = profile === 'complete' ? 1 : 0;
      const page = { conditions: { actorId: disabled, actorValid: false, itemId: disabled, itemValid: false, selfSwitchCh: 'A', selfSwitchValid: false, switch1Id: disabled, switch1Valid: false, switch2Id: disabled, switch2Valid: false, variableId: disabled, variableValid: false, variableValue: 0 },
        directionFix: false, image: { characterIndex: 0, characterName: '', direction: 2, pattern: 0, tileId: 0 }, list,
        moveFrequency: 3, moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false },
        moveSpeed: 3, moveType: 0, priorityType: 1, stepAnime: false, through: false, trigger: 0, walkAnime: true };
      map.events = [null, { id: 1, name, ...(profile === 'complete' ? { note: '' } : {}), x: 9, y: 6, pages: [page] }];
      const common = [null];
      const system = JSON.parse(await fs.readFile(path.join(seed, 'data/System.json'), 'utf8'));
      while (system.variables.length <= 52) system.variables.push('');
      while (system.switches.length <= 2) system.switches.push('');
      system.startMapId = 1; system.startX = 8; system.startY = 6;
      const carriers = { 'Map001.json': map, 'CommonEvents.json': common, 'System.json': system };
      const loadedCarriers = structuredClone(carriers); loadedCarriers['Map001.json'].meta = {};
      if (profile === 'complete') loadedCarriers['Map001.json'].events[1].meta = {};
      return { carriers, loadedCarriers, profile, independentDefinitionSha256: sha(await fs.readFile(casesFile)),
        profileLimit: profile === 'plumbing19' ? 'Narrow synthetic old-build input: absent event note, disabled IDs0, empty403 parameters and omitted nonempty Child Body End Markers; never final native-saved-shape acceptance' : 'Canonical complete saved Map fields and native403 [6,null]; fail any loss',
        provenance: definitions.provenance, expected };
    },
    async seedDifference(project) {
      const file = path.join(project, 'data/Map001.json'), map = JSON.parse(await fs.readFile(file, 'utf8'));
      map.events[1].name = 'PAIR-SEED ' + name; await fs.writeFile(file, strictJson(map) + '\n');
    },
    async editSources(workspace) {
      const edits = [];
      for (const file of await files(path.join(workspace, 'src'))) {
        if (!file.endsWith('.ts')) continue;
        const before = await fs.readFile(file, 'utf8');
        const after = before.split(JSON.stringify('PAIR-SEED ' + name)).join(JSON.stringify(name));
        if (after !== before) { await fs.writeFile(file, after); edits.push({ file: path.relative(workspace, file), beforeSha256: sha(before), afterSha256: sha(after) }); }
      }
      assert.equal(edits.length, 1, 'Actual formal Map source edit required'); return edits;
    } };
  return {scenario,test,expected};
}
module.exports={buildScenario,definitions};
