"use strict";
// Importing this module does not launch a game. All carriers are independently authored.
const assert = require("node:assert/strict");
const { makeScenarios } = require("./53-runtime-scenarios.cjs");
const common = require("./53-common-context-input.cjs");
const command = (code, parameters = []) => ({ code, indent: 0, parameters });
const expectedState = {
  scene: "Scene_Battle",
  inBattle: true,
  mapId: 1,
  playerPosition: [8, 6],
  playerDirection: 6,
  interpreter: { index: 2, code: 201, waitMode: "", running: true, eventId: 0 },
  transfer: { reserved: false, mapId: 0, x: 0, y: 0, direction: 0 },
  enemyAlive: true,
};
const expected = {
  ...common.expected,
  mapTraces: ["before-call", "after-call"],
  victoryCount: 0,
  returned: false,
  traceCounts: { map: 2, common: 2 },
  transferMarkers: { before: 1, after: 0 },
  state: expectedState,
  sameInterpreterThroughoutObservation: true,
  observedAtLeast60AdvancingFrames: true,
  observedAtLeast60DistinctFrames: true,
};
const observer = `(function(){
var fs=require('fs'),path=require('path'),crypto=require('crypto');
var expected=${JSON.stringify(expected)},expectedState=${JSON.stringify(expectedState)};
var started=Date.now(),stage='title',loaded=null,transitions=[],lastScene=null,pressed=false,releaseFrame=0,nextFrame=0,finished=false,actions=[],samples=[],stallInterpreter=null,firstFrame=null,lastFrame=null,sameInterpreter=true;
window.commonContextTrace=[];window.commonContextMapTraces=[];window.commonContextReturned=false;window.locationTransferBefore=0;window.locationTransferAfter=0;
function copy(value){return JSON.parse(JSON.stringify(value));}
function press(){Input._currentState.ok=true;pressed=true;releaseFrame=Graphics.frameCount+6;actions.push({frame:Graphics.frameCount,key:'ok',down:true,stage:stage});}
function release(){if(pressed){Input._currentState.ok=false;pressed=false;nextFrame=Graphics.frameCount+18;actions.push({frame:Graphics.frameCount,key:'ok',down:false,stage:stage});}}
function readState(){var i=$gameTroop._interpreter,c=i.currentCommand();return{scene:SceneManager._scene.constructor.name,inBattle:$gameParty.inBattle(),mapId:$gameMap.mapId(),playerPosition:[$gamePlayer.x,$gamePlayer.y],playerDirection:$gamePlayer.direction(),interpreter:{index:i._index,code:c?c.code:null,waitMode:i._waitMode,running:i.isRunning(),eventId:i._eventId},transfer:{reserved:$gamePlayer.isTransferring(),mapId:$gamePlayer._newMapId,x:$gamePlayer._newX,y:$gamePlayer._newY,direction:$gamePlayer._newDirection},enemyAlive:$gameTroop.members()[0].isAlive()};}
function finish(error){if(finished)return;finished=true;release();var actual={contexts:window.commonContextTrace,mapTraces:window.commonContextMapTraces,victoryCount:$gameSystem._winCount,returned:window.commonContextReturned,realBattle:transitions.some(function(item){return item.scene==='Scene_Battle';}),savedNoneSwitch9:$dataCommonEvents[1].switchId,traceCounts:{map:window.commonContextMapTraces.length,common:window.commonContextTrace.length},transferMarkers:{before:window.locationTransferBefore,after:window.locationTransferAfter},state:readState(),sameInterpreterThroughoutObservation:sameInterpreter,observedAtLeast60AdvancingFrames:firstFrame!==null&&lastFrame-firstFrame>=60,observedAtLeast60DistinctFrames:samples.length>=60},engineFiles={};
['rpg_core.js','rpg_managers.js','rpg_objects.js','rpg_scenes.js','rpg_sprites.js','rpg_windows.js','main.js'].forEach(function(name){engineFiles[name]=crypto.createHash('sha256').update(fs.readFileSync(path.join(process.cwd(),'js',name))).digest('hex');});
fs.writeFileSync(path.join(process.cwd(),'runtime-result.json'),JSON.stringify({purpose:'Final LOCATION-004 controlled Battle Transfer native stall supplement',timestamp:new Date().toISOString(),method:'actual-native-game',engine:Utils.RPGMAKER_VERSION,versions:process.versions,execPath:process.execPath,pid:process.pid,cwd:process.cwd(),scene:SceneManager._scene.constructor.name,frame:Graphics.frameCount,loaded:loaded,engineFiles:engineFiles,actions:actions,transitions:transitions,observation:{firstFrame:firstFrame,lastFrame:lastFrame,span:firstFrame===null?null:lastFrame-firstFrame,samples:samples},expected:expected,actual:actual,error:error,passed:!error&&JSON.stringify(actual)===JSON.stringify(expected),control:'Normal Map7 action Input invokes native117 Common1 and native301. Native Troop turn0 page invokes same Common1, saved before marker, then native201. Passive requestAnimationFrame observer records stable state for at least60 advancing Graphics frames and60 distinct frames, and quits cleanly. It never advances or replaces interpreters, commands, Scenes, waits, transfer, BattleManager, RNG or loaders. No natural continuation or Map return is expected: native201 returnsfalse in Battle without advancing its index.'},null,2));nw.App.quit();}
function observe(){if(finished)return;try{
if(pressed&&Graphics.frameCount>=releaseFrame)release();var name=SceneManager._scene&&SceneManager._scene.constructor.name;if(name!==lastScene){transitions.push({scene:name,frame:Graphics.frameCount});lastScene=name;}
if(stage==='title'&&SceneManager._scene instanceof Scene_Title){DataManager.setupNewGame();SceneManager.goto(Scene_Map);stage='map';}
else if(stage==='map'&&SceneManager._scene instanceof Scene_Map&&Graphics.frameCount>120&&!SceneManager._scene.isBusy()){
loaded={'Map001.json':copy($dataMap),'CommonEvents.json':copy($dataCommonEvents),'System.json':copy($dataSystem),'Troops.json':copy($dataTroops)};$gamePlayer.setDirection(6);stage='running';press();
}else if(stage==='running'){
if(!pressed&&Graphics.frameCount>=nextFrame&&$gameMessage.isBusy())press();
if(window.locationTransferBefore===1&&SceneManager._scene instanceof Scene_Battle){var state=readState();if(JSON.stringify(state)!==JSON.stringify(expectedState))throw new Error('Native Battle201 state drift '+JSON.stringify(state));
if(stallInterpreter===null){stallInterpreter=$gameTroop._interpreter;firstFrame=Graphics.frameCount;}sameInterpreter=sameInterpreter&&stallInterpreter===$gameTroop._interpreter;if(!sameInterpreter)throw new Error('Troop interpreter replaced during observation');
if(lastFrame!==Graphics.frameCount){lastFrame=Graphics.frameCount;samples.push({frame:lastFrame,state:state,sameInterpreter:true});}if(lastFrame-firstFrame>=60&&samples.length>=60){finish(null);return;}}
}if(Date.now()-started>45000)throw new Error('Timeout at '+stage+' '+name);
}catch(error){finish(String(error.stack||error));return;}requestAnimationFrame(observe);}
requestAnimationFrame(observe);
}());`;

function makeScenario() {
  const base = makeScenarios().find(
    (entry) => entry.slug === "final-r4-common-complete-variable99",
  );
  assert.ok(base);
  return {
    ...base,
    slug: "final-location-battle-transfer-native-stall",
    scriptPath: __filename,
    observer,
    plan: {
      expected,
      entry:
        "Normal Map7 action Input → native117 Common1 → native301 → Troop turn0 → native117 Common1 → native201",
      scope:
        "Only the previously missing controlled Battle Transfer portion of MV-S6-LOCATION-004. The expected native stall is observed, without forcing continuation or returning to Map.",
      independentOracle:
        "Shipped MV1.6.1 command201 returns false in Battle without incrementing the interpreter index. Direct target [1,2,3], direction6, fade2 remain unreserved and player remains at [8,6].",
      minimumObservation: { advancingGraphicsFrames: 60, distinctObservedGraphicsFrames: 60 },
    },
    async fixture(seed) {
      const fixture = structuredClone(await base.fixture(seed));
      for (const carriers of [fixture.carriers, fixture.loadedCarriers]) {
        const list = carriers["Troops.json"][1].pages[0].list;
        assert.deepEqual(
          list.map((entry) => entry.code),
          [117, 331, 0],
        );
        list.splice(
          1,
          0,
          command(355, ["window.locationTransferBefore++;"]),
          command(201, [0, 1, 2, 3, 6, 2]),
          command(355, ["window.locationTransferAfter++;"]),
        );
        assert.deepEqual(list[4].parameters, [0, 1, 1, 99, true]);
      }
      return {
        ...fixture,
        expected,
        provenance:
          fixture.provenance +
          " This supplement inserts independently authored literal201 and before/after markers into the original complete normal-entry Troop page; following legal variable99 HP cleanup must remain unexecuted.",
      };
    },
  };
}
module.exports = { makeScenario, expected, expectedState };
