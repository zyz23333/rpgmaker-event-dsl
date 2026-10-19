'use strict';
const fs=require('node:fs/promises'), path=require('node:path'), crypto=require('node:crypto'), cp=require('node:child_process'), assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const support=require('./mv-native-pair-support-v5.cjs');
async function fingerprint(root){const rows=[];for(const file of await support.files(root)) rows.push({path:path.relative(root,file).replaceAll('\\','/'),sha256:sha(await fs.readFile(file))});return{sha256:sha(JSON.stringify(rows)),files:rows};}
const clone=value=>JSON.parse(JSON.stringify(value));
(async()=>{
 const packageRoot=process.argv[2], repoRoot=path.resolve(packageRoot,'../..'), root=path.join('C:/Users/Shuen/.codex/tmp','mv25-e1-troop-product-'+crypto.randomUUID()),workspaceRoot=path.join(root,'Workspace'),game=path.join(workspaceRoot,'Game');
 await fs.mkdir(path.join(game,'data'),{recursive:true});
 const report={purpose:'Ticket25 allocated E1 reverse/product comparison, not editor UI capture and not final49',root,startedAt:new Date().toISOString(),node:process.version,passed:false,steps:[]};
 try{
  const metadataPath='C:/Users/Shuen/.codex/tmp/mv-e1-editor-container-identities.json', metadata=JSON.parse(await fs.readFile(metadataPath,'utf8')),target=await fs.readFile(metadata.target.path);
  assert.equal(sha(target),metadata.target.sha256); report.reverse={target:metadata.target,reusedVersionEvidence:metadata.reusedVersionEvidence,newReaOperation:false,metadataSha256:sha(await fs.readFile(metadataPath)),resources:[]};
  const roles=['templates','troop-editor','battle-conditions','data','database','database-list','page-buttons','Troop parent editor'];
  for(const item of metadata.resources.filter(r=>roles.includes(r.role))){assert.equal(sha(target.subarray(item.offset,item.offset+item.storedBytes)),item.storedSha256);assert.equal(sha(await fs.readFile(item.destination)),item.decodedSha256);report.reverse.resources.push(item);}
  const known=JSON.parse(await fs.readFile(path.join(packageRoot,'test/fixtures/mv-evidence/troop-event-project.json'),'utf8')),fixture=JSON.parse(await fs.readFile(path.join(packageRoot,'test/fixtures/mv-evidence/common-event-project.json'),'utf8')).projectFiles,blank=known.defaultPage;
  const factories=JSON.parse(await fs.readFile('C:/Users/Shuen/.codex/tmp/mv-e1-editor-container-raw/factory-data.json','utf8')).factories;assert.deepEqual(blank,factories.BattleEventPage);report.reverse.factoryComparedToIndependentLiteral=true;
  fixture['Actors.json']=[null,{id:1,name:'Hero'}];fixture['Enemies.json']=[null,{id:1,name:'Visible'},{id:2,name:''}];fixture['System.json'].switches=['','Condition',''];
  const defaultPage=()=>clone(blank),saved=defaultPage();Object.assign(saved.conditions,{turnA:9999,turnB:12,enemyIndex:99,enemyHp:0,actorId:0,actorHp:100,switchId:999});saved.span=2;saved.list=[{code:108,indent:0,parameters:['E1 CR\rkept']},{code:0,indent:0,parameters:[]}];
  const enabled=defaultPage();Object.assign(enabled.conditions,{turnEnding:true,turnValid:true,turnA:0,turnB:9999,enemyValid:true,enemyIndex:1,enemyHp:100,actorValid:true,actorId:1,actorHp:0,switchValid:true,switchId:2});enabled.span=1;
  const troops=Array.from({length:2002},()=>null);
  troops[1]={id:1,name:'',members:[],unknown:{retained:[null,'CR\r']},pages:[defaultPage()]};
  troops[2]={id:2,name:'External troop',members:[{enemyId:2,hidden:true,x:12,y:34},{enemyId:1,hidden:false,x:56,y:78}],opaque:{keep:true},pages:[saved,enabled,defaultPage()]};
  troops[3]={id:3,name:'21 pages',members:[],pages:Array.from({length:21},(_,index)=>({...defaultPage(),span:index%3,list:[{code:108,indent:0,parameters:['Ordered page '+index]},{code:0,indent:0,parameters:[]}]}))};
  troops[2001]={id:2001,name:'',members:[],pages:[defaultPage()]};fixture['Troops.json']=troops;
  await fs.writeFile(path.join(root,'independent-fixture.json'),JSON.stringify(fixture,null,2)+'\n',{flag:'wx'});report.fixtureSha256=sha(await fs.readFile(path.join(root,'independent-fixture.json')));
  for(const [name,value]of Object.entries(fixture))await fs.writeFile(path.join(game,'data',name),JSON.stringify(value));await fs.writeFile(path.join(game,'Game.rpgproject'),'RPGMV 1.6.1\n');await fs.writeFile(path.join(workspaceRoot,'package.json'),'{"type":"module"}\n');
  const local=path.join(workspaceRoot,'node_modules/rpgmaker-event-dsl');await fs.mkdir(local,{recursive:true});await fs.writeFile(path.join(local,'package.json'),JSON.stringify({name:'rpgmaker-event-dsl',type:'module',exports:{'.':{types:'./dist/index.d.mts'}}}));await fs.symlink(path.join(packageRoot,'dist'),path.join(local,'dist'),'junction');
  report.build={head:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:repoRoot,encoding:'utf8',windowsHide:true}).trim(),status:cp.execFileSync('git',['status','--short'],{cwd:repoRoot,encoding:'utf8',windowsHide:true}),source:await fingerprint(path.join(packageRoot,'src')),dist:await fingerprint(path.join(packageRoot,'dist'))};
  const api=await import(pathToFileURL(path.join(packageRoot,'dist/workspace-api.mjs')));
  async function step(name,callback){const item={name,startedAt:new Date().toISOString()};report.steps.push(item);try{const value=await callback();item.passed=true;return value;}finally{item.completedAt=new Date().toISOString();}}
  await step('public Init',()=>api.initWorkspace({workspaceRoot,projectRoot:'./Game'}));await step('public Clone',()=>api.cloneWorkspace({workspaceRoot}));await step('public Decompile',()=>api.decompileWorkspace({workspaceRoot}));
  const sourcePath=path.join(workspaceRoot,'src/decompiled/troop-events.events.ts');report.generatedSource=await fs.readFile(sourcePath,'utf8');for(const id of [1,2,3,2001])assert.ok(report.generatedSource.includes('troopId: '+id));
  const state=path.join(workspaceRoot,'.rpgmaker-event-dsl'),before=await fingerprint(state);await step('public Check discovered/evaluated source',()=>api.compileWorkspace({workspaceRoot,check:true}));assert.deepEqual(await fingerprint(state),before);
  await step('public Compile',()=>api.compileWorkspace({workspaceRoot,check:false}));const generated=JSON.parse(await fs.readFile(path.join(state,'generated-project-data/Troops.json'),'utf8'));assert.deepEqual(generated,troops);report.completeTroopsComparison={expected:troops,actual:generated,passed:true};report.diff=await step('public no-change Diff',()=>api.diffWorkspace({workspaceRoot}));assert.ok(report.diff.includes('Affected Project Data Files:\n- none'));await step('public no-op Push',()=>api.pushWorkspace({workspaceRoot,allowDestructive:false}));
  report.passed=true;
 }catch(error){report.error={message:error.message,stack:error.stack};}
 report.completedAt=new Date().toISOString();await fs.writeFile(path.join(root,'e1-product-result.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({root,passed:report.passed,error:report.error}));if(!report.passed)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
