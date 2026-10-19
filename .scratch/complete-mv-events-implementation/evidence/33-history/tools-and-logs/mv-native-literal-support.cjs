'use strict';
// Real native controls only. This module never substitutes for product pairing.
const fs=require('node:fs/promises');
const sync=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const cp=require('node:child_process');
const assert=require('node:assert/strict');
const {files,json,sha}=require('./mv-native-pair-support.cjs');
async function dataSnapshot(root){const values={},hashes={};for(const file of await files(root)){const relative=path.relative(root,file).split(path.sep).join('/'),bytes=await fs.readFile(file);hashes[relative]=sha(bytes);if(file.endsWith('.json'))values[relative]=JSON.parse(bytes);}return{values,hashes};}
async function runLiteral(options,scenario){
assert.equal(Number(process.versions.node.split('.')[0]),22);
const root=path.join(options.outputRoot,scenario.slug+'-literal-'+crypto.randomUUID());await fs.mkdir(root);
await fs.copyFile(__filename,path.join(root,'literal-harness-original.cjs'),sync.constants.COPYFILE_EXCL);await fs.copyFile(scenario.scriptPath,path.join(root,'scenario-original.cjs'),sync.constants.COPYFILE_EXCL);
const report={root,purpose:'Literal native control preparation only; no product or ticket acceptance',startedAt:new Date().toISOString(),options,tooling:{node:process.version,path:process.execPath,sha256:sha(await fs.readFile(process.execPath))},scenarioSha256:sha(await fs.readFile(scenario.scriptPath)),harnessSha256:sha(await fs.readFile(__filename))};
try{
const expected=await scenario.fixture(options.seedRoot);await json(path.join(root,'independent-fixture.json'),expected);await json(path.join(root,'scenario.json'),scenario.plan);
const project=path.join(root,'Game');report.project=project;await fs.mkdir(project);await fs.cp(path.join(options.seedRoot,'data'),path.join(project,'data'),{recursive:true,errorOnExist:true,force:false});for(const name of ['js','img','audio','fonts','icon'])await fs.symlink(path.join(options.seedRoot,name),path.join(project,name),'junction');for(const[file,value]of Object.entries(expected.carriers))await fs.writeFile(path.join(project,'data',file),JSON.stringify(value,null,2)+'\n');
await fs.writeFile(path.join(project,'Game.rpgproject'),'RPGMV 1.6.1\n',{flag:'wx'});await json(path.join(project,'package.json'),{name:'native-literal-control-preparation',main:'index.html',window:{show:false,width:816,height:624},'chromium-args':'--mute-audio'});
const index=await fs.readFile(path.join(options.seedRoot,'index.html'),'utf8'),main='<script type="text/javascript" src="js/main.js"></script>';assert.ok(index.includes(main));await fs.writeFile(path.join(project,'index.html'),index.replace(main,'<script type="text/javascript" src="observer.js"></script>'+main),{flag:'wx'});await fs.writeFile(path.join(project,'observer.js'),scenario.observer,{flag:'wx'});
report.nativeIdentity={host:{path:options.host,sha256:sha(await fs.readFile(options.host))},modules:{},engine:{}};for(const name of ['nw.dll','node.dll']){const file=path.join(path.dirname(options.host),name),bytes=await fs.readFile(file).catch(()=>null);report.nativeIdentity.modules[name]=bytes?{path:file,sha256:sha(bytes)}:{absent:true};}for(const name of ['rpg_core.js','rpg_managers.js','rpg_objects.js','rpg_scenes.js','rpg_sprites.js','rpg_windows.js','main.js'])report.nativeIdentity.engine[name]=sha(await fs.readFile(path.join(project,'js',name)));
const before=await dataSnapshot(path.join(project,'data'));report.input=before;const stdout=sync.openSync(path.join(project,'stdout.txt'),'wx'),stderr=sync.openSync(path.join(project,'stderr.txt'),'wx');const child=cp.spawn(options.host,[project],{cwd:project,windowsHide:true,stdio:['ignore',stdout,stderr]});sync.closeSync(stdout);sync.closeSync(stderr);report.launch={pid:child.pid,host:options.host,args:[project],cwd:project,windowsHide:true,at:new Date().toISOString()};await json(path.join(project,'native-launch.json'),report.launch);
report.exit=await new Promise(resolve=>{const timer=setTimeout(()=>{child.kill();resolve({timedOut:true});},options.timeoutMs||50000);child.on('error',error=>{clearTimeout(timer);resolve({error:String(error.stack||error)});});child.on('exit',(exitCode,signal)=>{clearTimeout(timer);resolve({exitCode,signal});});});
for(const name of ['runtime-result.json','stdout.txt','stderr.txt']){const bytes=await fs.readFile(path.join(project,name)).catch(()=>null);if(bytes)report[name]={bytes:bytes.length,sha256:sha(bytes),...(name==='runtime-result.json'?{value:JSON.parse(bytes)}:{})};}
const after=await dataSnapshot(path.join(project,'data')),runtime=report['runtime-result.json']?.value;report.validation={exit0:report.exit.exitCode===0,runtimePassed:runtime?.passed===true,diskInputUnchanged:JSON.stringify(before.hashes)===JSON.stringify(after.hashes),loadedCarriersMatch:false,engineIdentityMatches:false,stdoutEmpty:report['stdout.txt']?.bytes===0,stderrEmpty:report['stderr.txt']?.bytes===0};
if(runtime){try{assert.deepEqual(runtime.loaded,expected.loadedCarriers||expected.carriers);report.validation.loadedCarriersMatch=true;}catch(error){report.loadedError=error.message;}report.validation.engineIdentityMatches=Object.entries(report.nativeIdentity.engine).every(([name,hash])=>runtime.engineFiles[name]===hash);}
report.passed=Object.values(report.validation).every(value=>value===true);
}catch(error){report.passed=false;report.error={message:error.message,stack:error.stack};}
report.completedAt=new Date().toISOString();await json(path.join(root,'literal-result.json'),report);console.log(JSON.stringify({root,passed:report.passed,validation:report.validation,error:report.error,loadedError:report.loadedError,actual:report['runtime-result.json']?.value?.actual,runtimeError:report['runtime-result.json']?.value?.error},null,2));if(!report.passed)process.exitCode=1;return report;
}
module.exports={runLiteral};
