const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const [repo, original, host, compiledPath, root] = process.argv.slice(2);
if (!root) throw new Error('Usage: node runner.cjs REPO NATIVE_TEMPLATE NATIVE_HOST COMPILED_COMMON_EVENTS OUTPUT');
const fixturePath = path.join(repo,'packages/rpgmaker-event-dsl/test/fixtures/mv-evidence/movement-route-cases.json');
const fixture = JSON.parse(fs.readFileSync(fixturePath,'utf8'));
const compiled = JSON.parse(fs.readFileSync(compiledPath,'utf8'));
assert.deepStrictEqual(compiled, fixture.events);
if (fs.existsSync(root)) throw new Error('Refusing to overwrite native evidence');
fs.mkdirSync(root);
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
async function run(mode, events) {
  const project = path.join(root, mode);
  fs.mkdirSync(project);
  fs.cpSync(path.join(original,'data'), path.join(project,'data'), {recursive:true});
  for (const name of ['js','img','audio','fonts','icon']) fs.symlinkSync(path.join(original,name),path.join(project,name),'junction');
  const systemPath = path.join(project,'data/System.json');
  const system = JSON.parse(fs.readFileSync(systemPath,'utf8'));
  system.startMapId = 1; system.startX = 0; system.startY = 0;
  fs.writeFileSync(systemPath,JSON.stringify(system));
  const mapPath = path.join(project,'data/Map001.json');
  const map = JSON.parse(fs.readFileSync(mapPath,'utf8'));
  map.events = [null]; map.width = 4; map.height = 4; map.data = Array(96).fill(0); map.scrollType = 0;
  fs.writeFileSync(mapPath, JSON.stringify(map));
  fs.writeFileSync(path.join(project,'data/CommonEvents.json'),JSON.stringify(events));
  fs.writeFileSync(path.join(project,'cases.json'),JSON.stringify(fixture.runtimeCases,null,2));
  fs.writeFileSync(path.join(project,'package.json'),JSON.stringify({name:'ticket14-'+mode,main:'index.html',window:{show:false,width:816,height:624,title:'MV Movement Route acceptance'}}));
  fs.writeFileSync(path.join(project,'index.html'),fs.readFileSync(path.join(original,'index.html'),'utf8').replace('<script type="text/javascript" src="js/main.js"></script>','<script type="text/javascript" src="observer.js"></script><script type="text/javascript" src="js/main.js"></script>'));
  const observer = `(function(){
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
          fs.writeFileSync(path.join(process.cwd(),'runtime-result.json'),JSON.stringify({timestamp:new Date().toISOString(),method:'actual-native-game',mode:${JSON.stringify(mode)},engine:Utils.RPGMAKER_VERSION,versions:process.versions,scene:SceneManager._scene.constructor.name,frameCount:Graphics.frameCount,results:results,passed:results.every(function(r){return r.passed;})},null,2));clearInterval(timer);nw.App.quit();
        }
      }
      if(Date.now()-start>35000){throw new Error('Timed out at '+stage+'/'+caseIndex);}
    }catch(error){fs.writeFileSync(path.join(process.cwd(),'runtime-failure.json'),JSON.stringify({stage:stage,caseIndex:caseIndex,error:String(error.stack||error),results:results},null,2));clearInterval(timer);nw.App.quit();}},16);
  }());`;
  fs.writeFileSync(path.join(project,'observer.js'),observer);
  const out=fs.openSync(path.join(project,'stdout.txt'),'w'),err=fs.openSync(path.join(project,'stderr.txt'),'w');
  const startedAt=new Date().toISOString();
  const child=cp.spawn(host,[project,'--mute-audio'],{cwd:project,windowsHide:true,stdio:['ignore',out,err]});
  fs.closeSync(out);fs.closeSync(err);
  const exit=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{child.kill();reject(new Error('45 second native deadline'));},45000);child.on('error',reject);child.on('exit',(code,signal)=>{clearTimeout(timeout);resolve({code,signal});});});
  const names=['observer.js','cases.json','data/CommonEvents.json','data/Map001.json','data/System.json','runtime-result.json','stdout.txt','stderr.txt'];
  const identity={startedAt,completedAt:new Date().toISOString(),host,hostSha256:hash(host),fixture:{path:fixturePath,sha256:hash(fixturePath)},compiledSource:{path:compiledPath,sha256:hash(compiledPath)},exit,engineFiles:['js/rpg_core.js','js/rpg_managers.js','js/rpg_objects.js','js/rpg_scenes.js','js/rpg_sprites.js','js/rpg_windows.js','js/main.js'].map(name=>({name,sha256:hash(path.join(project,name))})),files:Object.fromEntries(names.map(name=>[name,hash(path.join(project,name))]))};
  fs.writeFileSync(path.join(project,'run-identity.json'),JSON.stringify(identity,null,2));
  const result=JSON.parse(fs.readFileSync(path.join(project,'runtime-result.json'),'utf8'));
  assert.equal(exit.code,0);assert.equal(result.passed,true);
  return {identity,result};
}
(async()=>{const literal=await run('literal',fixture.events);const product=await run('compiled',compiled);assert.deepStrictEqual(product.result.results.map(r=>r.actual),literal.result.results.map(r=>r.actual));fs.writeFileSync(path.join(root,'comparison.json'),JSON.stringify({passed:true,literal,product},null,2));console.log(JSON.stringify({root,passed:true,results:product.result.results.map(({eventId,actual,elapsedFrames})=>({eventId,actual,elapsedFrames}))},null,2));})().catch(error=>{console.error(error);process.exitCode=1;});
