import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import cp from 'node:child_process';
import {pathToFileURL} from 'node:url';

const repo='C:/Users/Shuen/.codex/worktrees/mv-ticket-27/rpgmaker-event-dsl';
const pkg=path.join(repo,'packages/rpgmaker-event-dsl');
const root=path.join('C:/Users/Shuen/.codex/tmp','mv27-choice-saved-indices-public-green-'+crypto.randomUUID());
const sha=(data:Buffer|string)=>crypto.createHash('sha256').update(data).digest('hex');
async function fingerprint(directory:string):Promise<{rows:{path:string;sha256:string}[];sha256:string}>{
 const rows:{path:string;sha256:string}[]=[];
 async function walk(at:string){for(const e of (await fs.readdir(at,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const file=path.join(at,e.name);if(e.isDirectory())await walk(file);else if(e.isFile())rows.push({path:path.relative(directory,file).replaceAll('\\','/'),sha256:sha(await fs.readFile(file))});}}
 await walk(directory);return{rows,sha256:sha(JSON.stringify(rows))};
}
function encode(value:unknown){return JSON.stringify(value,(_key,v)=>Object.is(v,-0)?'__NEGZERO_c87e__':v,2).replaceAll('"__NEGZERO_c87e__"','-0')+'\n';}
const git=(args:string[])=>cp.execFileSync('git',args,{cwd:repo,encoding:'utf8',windowsHide:true}).trim();

assert.equal(process.version,'v22.23.0');assert.equal(git(['status','--porcelain=v1']),'');assert.equal(git(['rev-parse','HEAD']),process.env.MV27_EXPECTED_HEAD);
const originalAudit='C:/Users/Shuen/.codex/tmp/mv27-choice-saved-indices-public-audit-02b9f2d3-14ff-40f4-887b-cb87c7462e3e/audit.json';
const originalAuditSha='0866753d775225aedd12b27295ad767e8d7bc1cba88c9aefdc86006ac109345f';
assert.equal(sha(await fs.readFile(originalAudit)),originalAuditSha);
const originalSource=path.join(path.dirname(originalAudit),'original-source');
const originalSourceSha='b5907b6b90554bc20ae255ac2fb8653e552cda00c2033504605986d4511223e6';
assert.equal((await fingerprint(originalSource)).sha256,originalSourceSha);
await fs.mkdir(root);await fs.copyFile(new URL(import.meta.url),path.join(root,'auditor-original.mts.txt'));
const beforeSource=await fingerprint(path.join(pkg,'src'));
await fs.cp(path.join(pkg,'src'),path.join(root,'original-source'),{recursive:true,errorOnExist:true,force:false});
const api=await import(pathToFileURL(path.join(pkg,'src/workspace-api.ts')).href);
const {createMinimalProject}=await import(pathToFileURL(path.join(pkg,'test/support/windows-sandbox.ts')).href);
const cases=[
 {name:'native-positive-zero-control',kind:'native',cancel:0,default:0},
 {name:'native-cancel-negative-zero',kind:'native',cancel:-0,default:0},
 {name:'native-default-negative-zero',kind:'native',cancel:0,default:-0},
 {name:'native-both-negative-zero',kind:'native',cancel:-0,default:-0},
 {name:'formal-positive-zero-control',kind:'formal',cancel:0,default:0},
 {name:'formal-cancel-negative-zero',kind:'formal',cancel:-0,default:0},
 {name:'formal-default-negative-zero',kind:'formal',cancel:0,default:-0},
];
const results=[];
for(const item of cases){
 const workspaceRoot=path.join(root,item.name),projectRoot=path.join(workspaceRoot,'Game');await fs.mkdir(workspaceRoot);await createMinimalProject(workspaceRoot);
 const native=[null,{id:1,name:'Independent saved choice indices',trigger:0,switchId:1,list:[{code:102,indent:0,parameters:[[''],item.cancel,item.default,2,0]},{code:402,indent:0,parameters:[0,'']},{code:0,indent:1,parameters:[]},{code:404,indent:0,parameters:[]},{code:0,indent:0,parameters:[]}]}];
 const common=path.join(projectRoot,'data/CommonEvents.json');await fs.writeFile(common,encode(item.kind==='native'?native:[null]));
 await api.initWorkspace({workspaceRoot,projectRoot:'./Game'});await api.cloneWorkspace({workspaceRoot});
 if(item.kind==='formal'){
  await api.decompileWorkspace({workspaceRoot});
  const source='import {commonEvent,showChoices} from "rpgmaker-event-dsl";export const probe=commonEvent({id:1,name:"Independent saved choice indices",trigger:"none",commands:[showChoices({choices:[{text:"",commands:[]}],cancel:{kind:"choice",index:'+encode(item.cancel).trim()+'},defaultChoice:{kind:"choice",index:'+encode(item.default).trim()+'}})]});\n';
  await fs.writeFile(path.join(workspaceRoot,'src/probe.events.ts'),source);
 }
 const before={workspace:await fingerprint(workspaceRoot),project:await fingerprint(projectRoot)};let stage=item.kind==='native'?'Decompile':'Check',outcome;
 try{
  if(item.kind==='native')await api.decompileWorkspace({workspaceRoot});
  stage='Check';const preCheck=await fingerprint(workspaceRoot);await api.compileWorkspace({workspaceRoot,check:true});assert.deepEqual(await fingerprint(workspaceRoot),preCheck);
  stage='Compile';await api.compileWorkspace({workspaceRoot});const generated=JSON.parse(await fs.readFile(path.join(workspaceRoot,'.rpgmaker-event-dsl/generated-project-data/CommonEvents.json'),'utf8'));
  stage='Diff/Push';const diff=await api.diffWorkspace({workspaceRoot});await api.pushWorkspace({workspaceRoot});const pushed=JSON.parse(await fs.readFile(common,'utf8'));
  const actual=generated[1].list[0].parameters,pushedActual=pushed[1].list[0].parameters;
  const exact=Object.is(actual[1],item.cancel)&&Object.is(actual[2],item.default)&&Object.is(pushedActual[1],item.cancel)&&Object.is(pushedActual[2],item.default);
  outcome={accepted:true,exact,generatedParameters:encode(actual).trim(),pushedParameters:encode(pushedActual).trim(),diff};assert(exact);
 }catch(error){const e=error as Error&{code?:unknown;location?:unknown;issues?:unknown};outcome={accepted:false,stage,name:e.name,message:e.message,code:e.code,location:e.location,issues:e.issues};if(stage==='Decompile'||stage==='Check')assert.deepEqual({workspace:await fingerprint(workspaceRoot),project:await fingerprint(projectRoot)},before);}
 if(!Object.is(item.cancel,-0)&&!Object.is(item.default,-0))assert(outcome.accepted);
 const result={name:item.name,kind:item.kind,inputCancel:encode(item.cancel).trim(),inputDefault:encode(item.default).trim(),expected:'exact numeric saved index preservation; categorical enums and402mirrors remain strict',outcome,before,after:{workspace:await fingerprint(workspaceRoot),project:await fingerprint(projectRoot)}};
 results.push(result);await fs.writeFile(path.join(workspaceRoot,'audit-result.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({name:item.name,outcome}));
}
assert.deepEqual(await fingerprint(path.join(pkg,'src')),beforeSource);assert.deepEqual(await fingerprint(path.join(root,'original-source')),beforeSource);assert.equal(git(['status','--porcelain=v1']),'');
assert(results.length===7&&results.every(item=>item.outcome.accepted&&item.outcome.exact));assert.equal(sha(await fs.readFile(originalAudit)),originalAuditSha);
assert.equal((await fingerprint(originalSource)).sha256,originalSourceSha);
const report={originalAudit,originalAuditSha,originalSource,originalSourceSha,purpose:'Corrected actual27 DEV source public Workspace green audit for explicit numeric choice index -0, no product edits/build/native game execution',at:new Date().toISOString(),root,head:git(['rev-parse','HEAD']),source:beforeSource,results};await fs.writeFile(path.join(root,'audit.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({root,auditSha256:sha(await fs.readFile(path.join(root,'audit.json')))},null,2));
