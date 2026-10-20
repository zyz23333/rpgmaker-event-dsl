import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { createHash } from 'node:crypto';
import { initWorkspace, loadWorkspace, cloneWorkspace, decompileWorkspace, compileWorkspace } from '../../../../packages/rpgmaker-event-dsl/src/workspace-api.ts';
import { createMinimalProject } from '../../../../packages/rpgmaker-event-dsl/test/support/windows-sandbox.ts';

// Independent literal native records, composed without product compiler/decompiler helpers.
const c = (code:number, parameters:unknown[]=[], indent=0) => ({code, indent, parameters});
const conditions: unknown[][] = [
  [0,1,0], [1,1,0,-0,5], [2,'D',1], [3,-0,1], [4,1,0],
  [4,1,1,'\r\n leading  \ud800\u2028\u2029 trailing\t'], [4,1,2,1],
  [4,1,3,1], [4,1,4,1], [4,1,5,1], [4,1,6,1], [5,7,0], [5,-0,1,1],
  [6,0,8], [7,-0,2], [8,1], [9,1,true], [10,1,false], [11,'pagedown'],
  [12,' true\r\n/*preserved*/ '], [13,2],
];
const weird = '\r\n leading \ud800\u2028\u2029 trailing\t';
const route = {
  list: [{code:1,indent:null}, {code:14,parameters:[-0,99],indent:0},
    {code:41,parameters:['',-0]}, {code:44,parameters:[{name:'',volume:-0,pitch:150,pan:-0}],indent:null},
    {code:45,parameters:[weird],indent:0}, {code:0}],
  repeat:false, skippable:true, wait:true,
};
function inner(i:number) {
  const records = [c(101,['',0,2,1],1),c(401,['line\rwith CR'],1),c(401,[''],1),
    c(103,[1,8],1),c(205,[0,route],1),
    ...route.list.slice(0,-1).map(r=>c(505,[r],1)),
    c(118,[weird],1),c(119,[weird],1),c(356,['  Test  alpha\t\r\n '],1)];
  if (i%2===0) records.push(c(0,[],1));
  return records;
}
const events:any[] = [null];
for (const [i,p] of conditions.entries()) {
  const list = [c(111,p),...inner(i)];
  if (i%3!==0) list.push(c(411),c(112,[],1),c(113,[],2),...(i%2 ? []:[c(0,[],2)]),c(413,[],1),c(0,[],1));
  list.push(c(412),c(0));
  events.push({id:events.length,name:`Conditional composition ${i}`,trigger:0,switchId:1,list});
}
for (const canEscape of [false,true]) for (const canLose of [false,true]) {
  const list=[c(301,[2,0,canEscape,canLose])];
  if (canEscape||canLose) {
    for (const code of [601,...(canEscape?[602]:[]),...(canLose?[603]:[])]) {
      list.push(c(code),c(102,[['',' X\rY '],-2,5,0,2],1),
        c(402,[0,''],1),c(108,['first'],2),c(408,['tail\r'],2),
        c(402,[1,' X\rY '],1),c(0,[],2),c(403,[6,null],1),c(0,[],2),c(404,[],1));
    }
    list.push(c(604));
  }
  list.push(c(0));
  events.push({id:events.length,name:`Battle choices ${canEscape} ${canLose}`,trigger:0,switchId:1,list});
}
const probeRoot=resolve('.scratch/mv-native-support-audit/probes/commands');
const workspaceRoot=join('C:/Users/Shuen/.codex/tmp/mv-native-support-audit-20261020',`commands-workspace-${process.versions.node.replaceAll('.','-')}-${Date.now()}`);
await mkdir(workspaceRoot,{recursive:true});
const fixture=await createMinimalProject(workspaceRoot);
const files=fixture.projectFiles;
files['CommonEvents.json']=events;
files['System.json'].variables=['',''];
for (const name of ['Actors','Animations','Armors','Classes','Enemies','Items','Skills','States','Weapons'])
  files[`${name}.json`]=[null,{id:1,name:'First-party reference stand-in'}];
const saved=(v:unknown):string=>JSON.stringify(v,(_k,v)=>Object.is(v,-0)?'__MINUS_ZERO__':v).replaceAll('"__MINUS_ZERO__"','-0');
for (const [name,value] of Object.entries(files)) await writeFile(join(workspaceRoot,'Game/data',name),saved(value));
await initWorkspace({workspaceRoot,projectRoot:'./Game'});
const configPath=join(workspaceRoot,'rpgmaker-event-dsl.config.json');
const config=JSON.parse(await readFile(configPath,'utf8')); config.scriptEnabled=true;
await writeFile(configPath,JSON.stringify(config));
await cloneWorkspace({workspaceRoot});
let stage='decompile';
const result:any={platform:process.platform,node:process.version,workspaceRoot,eventCount:events.length-1,
  recordCount:events.slice(1).reduce((sum,e)=>sum+e.list.length,0),startedAt:new Date().toISOString()};
try {
  await decompileWorkspace({workspaceRoot});
  stage='compile';
  await compileWorkspace({workspaceRoot,check:false});
  stage='compare';
  const outputPath=join(workspaceRoot,'.rpgmaker-event-dsl/generated-project-data/CommonEvents.json');
  const outputText=await readFile(outputPath,'utf8');
  const output=JSON.parse(outputText);
  result.deepEqual=isDeepStrictEqual(output,events);
  result.outputSha256=createHash('sha256').update(outputText).digest('hex');
  result.changedEventIds=events.slice(1).filter(e=>!isDeepStrictEqual(e,output[e.id])).map(e=>e.id);
  result.success=result.deepEqual;
} catch(error) { result.success=false;result.stage=stage;result.error=String(error); }
result.completedAt=new Date().toISOString();
await writeFile(join(probeRoot,'composition-result.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
