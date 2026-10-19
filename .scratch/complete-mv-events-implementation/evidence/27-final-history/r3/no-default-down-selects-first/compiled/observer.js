(function(){var fs=require('fs'),path=require('path');fs.writeFileSync(path.join(process.cwd(),'runtime-process-identity.json'),JSON.stringify({pid:process.pid,ppid:process.ppid,execPath:process.execPath,cwd:process.cwd(),appName:nw.App.manifest.name,appDataPath:nw.App.dataPath,at:new Date().toISOString()},null,2),{flag:'wx'});}());
(function(){
var fs=require('fs'),path=require('path'),crypto=require('crypto'),test={"id":"no-default-down-selects-first","list":[{"code":102,"indent":0,"parameters":[["one","two"],-1,-1,2,0]},{"code":402,"indent":0,"parameters":[0,"one"]},{"code":122,"indent":1,"parameters":[50,50,0,0,1]},{"code":0,"indent":1,"parameters":[]},{"code":402,"indent":0,"parameters":[1,"two"]},{"code":122,"indent":1,"parameters":[50,50,0,0,2]},{"code":0,"indent":1,"parameters":[]},{"code":404,"indent":0,"parameters":[]},{"code":122,"indent":0,"parameters":[51,51,0,0,1]},{"code":0,"indent":0,"parameters":[]}],"choice":{"savedDefault":-1,"nativeDefault":-1,"savedCancel":-1,"nativeCancel":-1,"index":-1},"actions":["down","ok"],"expected":{"value":1,"complete":1}},expected={"value":1,"complete":1,"started":1,"remainsRunning":false,"choice":{"savedDefault":-1,"nativeDefault":-1,"savedCancel":-1,"nativeCancel":-1,"index":-1},"waitingChecks":[],"savedSigns":{"cancel":false,"defaultChoice":false}},start=Date.now(),stage='title',loaded=null,actions=[],choice=null,waitingChecks=[],caseFrame=0,startedFrame=null,settledFrame=null,actionIndex=0,pressed=null,releaseFrame=0,nextActionFrame=0,finished=false;
function strictJson(value) {
  if (value === null) return 'null';
  if (typeof value === 'number') return Object.is(value, -0) ? '-0' : JSON.stringify(value);
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(function(v){var encoded=strictJson(v);return encoded===undefined?'null':encoded;}).join(',') + ']';
  if (typeof value === 'object') {var parts=[];Object.keys(value).forEach(function(k){var encoded=strictJson(value[k]);if(encoded!==undefined)parts.push(JSON.stringify(k)+':'+encoded);});return '{'+parts.join(',')+'}';}
  return undefined;
}
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
}());