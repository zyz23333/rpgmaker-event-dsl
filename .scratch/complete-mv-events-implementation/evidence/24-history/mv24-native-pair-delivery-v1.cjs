'use strict';
// Ticket24 delivery-v1; exact v5 safety checks. Only report purpose differs from frozen v5.
const fs = require('node:fs/promises');
const sync = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const identityPrelude="(function(){var fs=require('fs'),path=require('path');fs.writeFileSync(path.join(process.cwd(),'runtime-process-identity.json'),JSON.stringify({pid:process.pid,ppid:process.ppid,execPath:process.execPath,cwd:process.cwd(),appName:nw.App.manifest.name,appDataPath:nw.App.dataPath,at:new Date().toISOString()},null,2),{flag:'wx'});}());\n";
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const json = async (file, value) => fs.writeFile(file, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
async function files(directory) {
  const result = [];
  async function walk(current) {
    for (const entry of (await fs.readdir(current, { withFileTypes: true })).sort((a,b) => a.name.localeCompare(b.name))) {
      const file = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (entry.isFile()) result.push(file);
    }
  }
  await walk(directory); return result;
}
async function fingerprint(directory) {
  const entries = [];
  for (const file of await files(directory)) entries.push({ path: path.relative(directory,file).split(path.sep).join('/'), sha256: sha(await fs.readFile(file)) });
  return { entries, sha256: sha(JSON.stringify(entries)) };
}
async function snapshotData(directory) {
  const values = {}, hashes = {};
  for (const file of await files(directory)) {
    const relative = path.relative(directory,file).split(path.sep).join('/');
    const bytes = await fs.readFile(file); hashes[relative] = sha(bytes);
    if (relative.endsWith('.json')) values[relative] = JSON.parse(bytes);
  }
  return { values, hashes };
}
async function freshNativeProfile(project){
  const directory=path.join(project,'NativeProfile');
  try{await fs.lstat(directory);}catch(error){if(error.code==='ENOENT')return{directory,absentBeforeLaunch:true,checkedAt:new Date().toISOString()};throw error;}
  throw new Error('Refusing to reuse native profile '+directory);
}
async function runNative(project, host, timeoutMs = 50000) {
  const profile=await freshNativeProfile(project),args=[project,"--user-data-dir="+profile.directory];
  const stdout = sync.openSync(path.join(project,'stdout.txt'),'wx');
  const stderr = sync.openSync(path.join(project,'stderr.txt'),'wx');
  const startedAt = new Date().toISOString();
  const child = cp.spawn(host,args,{ cwd:project,windowsHide:true,stdio:['ignore',stdout,stderr] });
  sync.closeSync(stdout); sync.closeSync(stderr);
  const launch = { startedAt, launchedPid:child.pid,host,args,profile,cwd:project,windowsHide:true };
  await json(path.join(project,'native-launch.json'),launch);
  const exit = await new Promise(resolve => {
    const timer = setTimeout(() => { child.kill(); resolve({ timedOut:true }); },timeoutMs);
    child.on('error',error => { clearTimeout(timer); resolve({ error:String(error.stack||error) }); });
    child.on('exit',(exitCode,signal) => { clearTimeout(timer); resolve({ exitCode,signal }); });
  });
  const result = { ...launch,...exit,completedAt:new Date().toISOString() };
  for (const name of ['runtime-result.json','runtime-process-identity.json','stdout.txt','stderr.txt']) {
    const bytes = await fs.readFile(path.join(project,name)).catch(() => null);
    if (bytes) result[name] = { sha256:sha(bytes),bytes:bytes.length,...((name==='runtime-result.json'||name==='runtime-process-identity.json')?{value:JSON.parse(bytes)}:{}) };
  }
  return result;
}
async function runPair(options, scenario) {
  assert.equal(Number(process.versions.node.split('.')[0]),22,'Run tooling with the recorded Node22 binary');
  const root = path.join(options.outputRoot,scenario.slug+'-'+crypto.randomUUID());
  await fs.mkdir(root); // Refuse an existing run; no earlier evidence is overwritten.
  await fs.copyFile(__filename,path.join(root,'harness-original.cjs'),sync.constants.COPYFILE_EXCL);
  await fs.copyFile(scenario.scriptPath,path.join(root,'scenario-original.cjs'),sync.constants.COPYFILE_EXCL);
  const report = { purpose:'Ticket24 allocated representative R1 delivery; not final52 or complete-spec acceptance',scenario:scenario.slug,root,startedAt:new Date().toISOString(),node:process.version,toolNode:process.execPath,options,lifecycle:[],sides:{} };
  async function step(name, callback) {
    const item = { name,startedAt:new Date().toISOString() }; report.lifecycle.push(item);
    try { const result=await callback(); item.completedAt=new Date().toISOString();item.ok=true;return result; }
    catch(error) { item.completedAt=new Date().toISOString();item.ok=false;item.error=String(error.stack||error);throw error; }
  }
  try {
    const expected = await scenario.fixture(options.seedRoot);
    await json(path.join(root,'independent-fixture.json'),expected);
    await json(path.join(root,'scenario.json'),scenario.plan);
    const apiPath=path.join(options.packageRoot,'dist/workspace-api.mjs');
    report.build={gitHead:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:options.packageRoot,encoding:'utf8',windowsHide:true}).trim(),gitStatus:cp.execFileSync('git',['status','--short'],{cwd:options.packageRoot,encoding:'utf8',windowsHide:true}),source:await fingerprint(path.join(options.packageRoot,'src')),dist:await fingerprint(path.join(options.packageRoot,'dist')),apiSha256:sha(await fs.readFile(apiPath)),harnessSha256:sha(await fs.readFile(__filename)),scenarioSha256:sha(await fs.readFile(scenario.scriptPath)),toolNodeSha256:sha(await fs.readFile(process.execPath))};
    report.nativeIdentity={host:{path:options.host,sha256:sha(await fs.readFile(options.host))},modules:{},engine:{}};
    for(const name of ['nw.dll','node.dll']){
      const file=path.join(path.dirname(options.host),name),bytes=await fs.readFile(file).catch(()=>null);
      report.nativeIdentity.modules[name]=bytes?{path:file,sha256:sha(bytes)}:{absent:true};
    }
    for(const name of ['rpg_core.js','rpg_managers.js','rpg_objects.js','rpg_scenes.js','rpg_sprites.js','rpg_windows.js','main.js'])report.nativeIdentity.engine[name]=sha(await fs.readFile(path.join(options.seedRoot,'js',name)));
    for(const side of ['literal','compiled']){
      const project=path.join(root,side,'Game');await fs.mkdir(project,{recursive:true});
      await fs.cp(path.join(options.seedRoot,'data'),path.join(project,'data'),{recursive:true,errorOnExist:true,force:false});
      for(const name of ['js','img','audio','fonts','icon'])await fs.symlink(path.join(options.seedRoot,name),path.join(project,name),'junction');
      for(const [file,value]of Object.entries(expected.carriers))await fs.writeFile(path.join(project,'data',file),JSON.stringify(value,null,2)+'\n');
      if(side==='compiled')await scenario.seedDifference(project);
      await json(path.join(project,'package.json'),{name:'mv-native-pair-'+crypto.randomUUID(),main:'index.html',window:{show:false,width:816,height:624,icon:'icon/icon.png'},'chromium-args':'--mute-audio'});
      await fs.writeFile(path.join(project,'Game.rpgproject'),'RPGMV 1.6.1\n',{flag:'wx'});
      const index=await fs.readFile(path.join(options.seedRoot,'index.html'),'utf8');
      const main='<script type="text/javascript" src="js/main.js"></script>';
      assert.ok(index.includes(main));await fs.writeFile(path.join(project,'index.html'),index.replace(main,'<script type="text/javascript" src="observer.js"></script>'+main),{flag:'wx'});
      await fs.writeFile(path.join(project,'observer.js'),identityPrelude+scenario.observer,{flag:'wx'});
      report.sides[side]={project,beforeWorkspace:await snapshotData(path.join(project,'data')),observerSha256:sha(await fs.readFile(path.join(project,'observer.js')))};
    }
    const workspaceRoot=path.join(root,'compiled','Workspace');await fs.mkdir(workspaceRoot);
    await json(path.join(workspaceRoot,'package.json'),{type:'module'});
    const local=path.join(workspaceRoot,'node_modules/rpgmaker-event-dsl');await fs.mkdir(local,{recursive:true});
    await json(path.join(local,'package.json'),{name:'rpgmaker-event-dsl',type:'module',exports:{'.':{types:'./dist/index.d.mts'}}});
    await fs.symlink(path.join(options.packageRoot,'dist'),path.join(local,'dist'),'junction');
    const api=await import(pathToFileURL(apiPath).href),compiled=report.sides.compiled.project;
    await step('public init',()=>api.initWorkspace({workspaceRoot,projectRoot:compiled}));
    const configPath=path.join(workspaceRoot,'rpgmaker-event-dsl.config.json');
    const config=JSON.parse(await fs.readFile(configPath,'utf8'));config.scriptEnabled=true;await fs.writeFile(configPath,JSON.stringify(config,null,2)+'\n');
    await step('public Clone',()=>api.cloneWorkspace({workspaceRoot}));
    await step('public Decompile',()=>api.decompileWorkspace({workspaceRoot}));
    report.sourceEdits=await step('formal owned source edits',()=>scenario.editSources(workspaceRoot));
    report.sources=await fingerprint(path.join(workspaceRoot,'src'));
    const stateRoot=path.join(workspaceRoot,'.rpgmaker-event-dsl');
    const checkBefore=await fingerprint(stateRoot);
    await step('public Check',()=>api.compileWorkspace({workspaceRoot,check:true}));
    const checkAfter=await fingerprint(stateRoot);assert.deepEqual(checkAfter,checkBefore,'Check must not publish workspace state');
    report.checkStateUnchanged=true;
    await step('public Compile',()=>api.compileWorkspace({workspaceRoot,check:false}));
    report.diff=await step('public Diff',()=>api.diffWorkspace({workspaceRoot}));
    await fs.writeFile(path.join(root,'compiled-diff.txt'),report.diff,{flag:'wx'});
    const generatedRoot=path.join(stateRoot,'generated-project-data');report.generated=await snapshotData(generatedRoot);
    const publication={workspaceRoot,files:{}};
    for(const file of scenario.affectedCarriers){
      assert.ok(report.diff.includes(file),'Diff must report '+file);
      const before=await fs.readFile(path.join(compiled,'data',file)),generated=await fs.readFile(path.join(generatedRoot,file));
      assert.notEqual(sha(before),sha(generated),'Real replacement required for '+file);
      assert.deepEqual(JSON.parse(generated),expected.carriers[file],'Complete independent generated carrier '+file);
      publication.files[file]={beforePushSha256:sha(before),generatedSha256:sha(generated)};
    }
    await step('public Push',()=>api.pushWorkspace({workspaceRoot,allowDestructive:false}));
    for(const [file,item]of Object.entries(publication.files)){
      const after=await fs.readFile(path.join(compiled,'data',file));assert.equal(sha(after),item.generatedSha256,'Push exact bytes '+file);item.afterPushSha256=sha(after);item.actualReplacementProven=true;
    }
    const literalData=await snapshotData(path.join(report.sides.literal.project,'data')),compiledData=await snapshotData(path.join(compiled,'data'));
    assert.deepEqual(compiledData.values,literalData.values,'Every complete data JSON carrier must match the independent literal side');
    for(const [file,value]of Object.entries(report.generated.values))if(file.endsWith('.json')&&Object.hasOwn(compiledData.values,file))assert.deepEqual(compiledData.values[file],value,'Installed generated '+file);
    report.completeCarrierComparison={passed:true,files:Object.keys(literalData.values),literalHashes:literalData.hashes,compiledHashes:compiledData.hashes};
    report.publication=publication;report.workspaceState=await fingerprint(stateRoot);
    await json(path.join(root,'before-native-data-identity.json'),report.completeCarrierComparison);
    for(const side of ['literal','compiled']){
      const item=report.sides[side],before=await snapshotData(path.join(item.project,'data'));
      item.native=await step('native '+side,()=>runNative(item.project,options.host,options.timeoutMs));
      const after=await snapshotData(path.join(item.project,'data'));item.diskInputUnchanged=JSON.stringify(before.hashes)===JSON.stringify(after.hashes);
      const runtime=item.native['runtime-result.json']?.value,runtimeIdentity=item.native['runtime-process-identity.json']?.value,packageManifest=JSON.parse(await fs.readFile(path.join(item.project,'package.json'),'utf8'));
      const project=item.project;
      item.validation={freshExplicitProfile:item.native.profile.absentBeforeLaunch===true,declaredProfile:!!runtimeIdentity&&path.resolve(runtimeIdentity.appDataPath).toLowerCase()===path.resolve(item.native.profile.directory,'Default').toLowerCase(),identityParsed:!!runtimeIdentity,declaredHost:!!runtimeIdentity&&path.resolve(runtimeIdentity.execPath).toLowerCase()===path.resolve(options.host).toLowerCase(),declaredProject:!!runtimeIdentity&&path.resolve(runtimeIdentity.cwd).toLowerCase()===path.resolve(project).toLowerCase(),ownedProcess:!!runtimeIdentity&&(runtimeIdentity.pid===item.native.launchedPid||runtimeIdentity.ppid===item.native.launchedPid),isolatedAppName:!!runtimeIdentity&&runtimeIdentity.appName===packageManifest.name,appDataPathRecorded:!!runtimeIdentity&&typeof runtimeIdentity.appDataPath==='string'&&runtimeIdentity.appDataPath.length>0,stdoutEmpty:item.native['stdout.txt']?.bytes===0,stderrEmpty:item.native['stderr.txt']?.bytes===0,exit0:item.native.exitCode===0,runtimePassed:runtime?.passed===true,diskInputUnchanged:item.diskInputUnchanged,loadedCarriersMatch:false,engineIdentityMatches:false};
      if(runtime){
        try{assert.deepEqual(runtime.loaded,expected.loadedCarriers||expected.carriers);item.validation.loadedCarriersMatch=true;}catch(error){item.validation.loadedError=error.message;}
        item.validation.engineIdentityMatches=Object.entries(report.nativeIdentity.engine).every(([name,hash])=>runtime.engineFiles[name]===hash);
      }
      item.passed=Object.entries(item.validation).filter(([name])=>!name.endsWith('Error')).every(([,value])=>value===true);
    }
    const actual=side=>report.sides[side].native?.['runtime-result.json']?.value?.actual;
    report.runtimeComparison=scenario.compareNativeRuntimeResults
      ? await scenario.compareNativeRuntimeResults(report.sides.literal.native['runtime-result.json'].value,report.sides.compiled.native['runtime-result.json'].value)
      : JSON.stringify(actual('literal'))===JSON.stringify(actual('compiled'));
    assert.equal(typeof report.runtimeComparison,'boolean','Native semantic comparator must return a boolean; retain diagnostic details separately');
    report.passed=report.sides.literal.passed===true&&report.sides.compiled.passed===true&&report.runtimeComparison===true;
  }catch(error){report.passed=false;report.error={message:error.message,stack:error.stack};}
  report.completedAt=new Date().toISOString();await json(path.join(root,'pair-result.json'),report);
  console.log(JSON.stringify({root,passed:report.passed,error:report.error,checks:report.checkStateUnchanged,publication:report.publication,sides:Object.fromEntries(Object.entries(report.sides).map(([side,item])=>[side,{passed:item.passed,validation:item.validation,actual:item.native?.['runtime-result.json']?.value?.actual,error:item.native?.['runtime-result.json']?.value?.error}]))},null,2));
  if(!report.passed)process.exitCode=1;return report;
}
module.exports={runPair,files,json,sha};
