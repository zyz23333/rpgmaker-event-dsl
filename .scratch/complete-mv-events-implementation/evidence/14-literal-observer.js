(function(){
    var fs=require('fs'),path=require('path'),start=Date.now(),stage='title',cases=JSON.parse(fs.readFileSync(path.join(process.cwd(),'cases.json'),'utf8')),results=[],caseIndex=0,beginFrame=0,current;
    function state(){return {switches:[1,2,3].map(function(id){return $gameSwitches.value(id);}),running:$gameMap._interpreter.isRunning(),forcing:$gamePlayer.isMoveRouteForcing(),x:$gamePlayer.x,y:$gamePlayer.y,direction:$gamePlayer.direction()};}
    function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}
    function next(){
      DataManager.setupNewGame();$gamePlayer.performTransfer();$gameMap.setup(1);$gamePlayer.locate(0,0);$gamePlayer.setDirection(2);
      var test=cases[caseIndex],before=state(),list=$dataCommonEvents[test.eventId].list;
      $gameMap._interpreter.setup(list,0);$gameMap._interpreter.update();
      current={eventId:test.eventId,input:list,before:before,first:state(),expected:test.expected};beginFrame=Graphics.frameCount;stage='running';
    }
    var timer=setInterval(function(){try{
      if(stage==='title'&&SceneManager._scene instanceof Scene_Title){DataManager.setupNewGame();SceneManager.goto(Scene_Map);stage='map';}
      else if(stage==='map'&&SceneManager._scene instanceof Scene_Map&&Graphics.frameCount>120&&!SceneManager._scene.isBusy()){next();}
      else if(stage==='running'&&Graphics.frameCount-beginFrame>=cases[caseIndex].frames){
        var test=cases[caseIndex];current.actual=state();current.elapsedFrames=Graphics.frameCount-beginFrame;
        current.passed=same(current.actual,test.expected)&&same(current.before,{switches:[false,false,false],running:false,forcing:false,x:0,y:0,direction:2});
        if(test.first){var first={switches:current.first.switches,running:current.first.running,forcing:current.first.forcing};current.firstExpected=test.first;current.passed=current.passed&&same(first,test.first);}
        results.push(current);caseIndex++;
        if(caseIndex<cases.length){next();}else{
          fs.writeFileSync(path.join(process.cwd(),'runtime-result.json'),JSON.stringify({timestamp:new Date().toISOString(),method:'actual-native-game',mode:"literal",engine:Utils.RPGMAKER_VERSION,versions:process.versions,scene:SceneManager._scene.constructor.name,frameCount:Graphics.frameCount,results:results,passed:results.every(function(r){return r.passed;})},null,2));clearInterval(timer);nw.App.quit();
        }
      }
      if(Date.now()-start>35000){throw new Error('Timed out at '+stage+'/'+caseIndex);}
    }catch(error){fs.writeFileSync(path.join(process.cwd(),'runtime-failure.json'),JSON.stringify({stage:stage,caseIndex:caseIndex,error:String(error.stack||error),results:results},null,2));clearInterval(timer);nw.App.quit();}},16);
  }());