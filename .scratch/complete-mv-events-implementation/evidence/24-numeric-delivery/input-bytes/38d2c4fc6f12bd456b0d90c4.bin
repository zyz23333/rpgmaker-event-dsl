import assert from 'node:assert/strict';
import {readFile, readdir, mkdir, writeFile} from 'node:fs/promises';
import {join, basename} from 'node:path';
import {createHash, randomUUID} from 'node:crypto';
import {arch, release} from 'node:os';
import {resultSchema} from 'file:///C:/Users/Shuen/.codex/worktrees/mv-map-numeric-fix/rpgmaker-event-dsl/packages/rpgmaker-event-dsl/test/support/mv-evidence.ts';

const base='M:/Shuen/Codex/mv-events-implementation-20261020/map24-final';
const repo='C:/Users/Shuen/.codex/worktrees/mv-map-numeric-fix/rpgmaker-event-dsl';
const delivery='.scratch/complete-mv-events-implementation/evidence/24-numeric-delivery';
const evidence=join(repo,'.scratch/complete-mv-events-implementation/evidence');
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const read=async(file:string)=>JSON.parse(await readFile(file,'utf8'));
const args=Object.fromEntries(process.argv.slice(2).map(text=>{const i=text.indexOf('=');assert(i>2);return[text.slice(2,i),text.slice(i+1)];}));
assert(args.nativeIndex&&args.nativeAudit&&args.rootNativeAudit);
const index=await read(args.nativeIndex),nativeAudit=await read(args.nativeAudit),rootAudit=await read(args.rootNativeAudit);
assert.equal(nativeAudit.passed,true);assert.equal(rootAudit.passed,true);
assert.equal(nativeAudit.mode,'native');assert.equal(nativeAudit.index.path,args.nativeIndex);
assert.equal(nativeAudit.index.sha256,sha(await readFile(args.nativeIndex)));
assert.equal(index.results.length,2);for(const item of index.results)assert.equal(item.passed,true);
const productPointer=await read(join(base,'product-freeze-v1-pointer.json'));
assert.equal(sha(await readFile(productPointer.manifest)),productPointer.sha256);
const product=await read(productPointer.manifest);
assert.equal(product.git.head,'71098b7a6647c15f57337a416cee176823037eed');
assert.match(product.git.status,/mv-evidence\.ts/);
for(const entry of product.entries)assert.equal(sha(await readFile(entry.original)),entry.sha256);
const inputPointer=await read(join(base,'map24-physical-inputs-v2-pointer.json'));
assert.equal(sha(await readFile(inputPointer.manifest)),inputPointer.sha256);
const inputs=await read(inputPointer.manifest);
const requirements=(await read(join(evidence,'requirements.json'))).requirements;
assert.equal(requirements.length,300);
const built=[];
for(const name of (await readdir(join(base,'built-results-v1'))).sort()){
 if(!name.endsWith('.json'))continue;const file=join(base,'built-results-v1',name),record=resultSchema.parse(await read(file));
 assert.equal(record.status,'passed');built.push({file,record});
}
const baseline=built.find(item=>item.record.requirementId==='MV-S5-MAP-001')!.record;
assert(baseline);assert.equal(baseline.source.revision,product.git.head);
assert(baseline.source.files.some(entry=>entry.path.includes('/dist/')));
const resourcePath=join(base,'resource-revalidation-v1/editor-resource-revalidation.json'),resource=await read(resourcePath);
assert.equal(resource.passed,true);assert.equal(resource.resources.length,34);
const summaries=await read(join(base,'safe-native-summaries-v1/manifest.json'));
assert.equal(summaries.index.path,args.nativeIndex);assert.equal(summaries.index.sha256,sha(await readFile(args.nativeIndex)));
const extra: {path:string,sha256:string}[]=[];
async function bind(file:string,path:string){extra.push({path,sha256:sha(await readFile(file))});}
await bind(productPointer.manifest,delivery+'/provenance/product-freeze-manifest.json');
await bind(inputPointer.manifest,delivery+'/provenance/physical-inputs-v2-manifest.json');
await bind(resourcePath,delivery+'/resource-revalidation.json');
for(const file of [args.nativeIndex,args.nativeAudit,args.rootNativeAudit,join(base,'map24-record-manual-v1.mts'),join(base,'map24-audit-physical-delivery-v1.cjs'),join(base,'map24-safe-native-summaries-v1.cjs'),inputs.script.path,inputs.adapter.path,...inputs.supportTools.map((tool:{path:string})=>tool.path)]){
 assert.equal(join(base,basename(file)).replaceAll('\\','/'),file.replaceAll('\\','/'),'Audit/tool must be archived from exact M root');
 await bind(file,delivery+'/tools-and-logs/'+basename(file));
}
if(args.rootNativeTool)await bind(args.rootNativeTool,delivery+'/tools-and-logs/'+basename(args.rootNativeTool));
for(const item of summaries.results){assert.equal(sha(await readFile(item.path)),item.sha256);await bind(item.path,delivery+'/native/'+basename(item.path));}
function sources(fixture:{path:string,sha256:string}){
 const members=new Map<string,string>();for(const entry of [...baseline.source.files,...extra,fixture]){
  if(members.has(entry.path))assert.equal(members.get(entry.path),entry.sha256);members.set(entry.path,entry.sha256);
 }
 const files=[...members].map(([path,sha256])=>({path,sha256})).sort((a,b)=>a.path.localeCompare(b.path));
 return {revision:product.git.head,fingerprint:sha(JSON.stringify(files)),files};
}
const output=join(base,'manual-results-v1');await mkdir(output);const captured=[];
async function save(result:unknown){const value=resultSchema.parse(result),file=join(output,value.requirementId+'-'+value.runId+'.json');
 assert.equal(value.source.files.find(entry=>entry.path===value.fixture.path)?.sha256,value.fixture.sha256);
 await writeFile(file,JSON.stringify(value,null,2)+'\n',{flag:'wx'});captured.push({file,sha256:sha(await readFile(file)),requirementId:value.requirementId});
}
for(const [group,ids,facts] of [
 ['E1',['001','003','006','007','NUMERIC-001','NUMERIC-002'],'Current complete native Map page defaults, conditions, note, page ordering and exact scoped numeric saved values match the independent built Workspace expectations.'],
 ['E3',['003','008','009'],'Current noncustom saved routes, terminal saved shape, route flags, recursive Script Gate and references match the independent built Workspace expectations.'],
 ['E6',['003','005','NUMERIC-001','NUMERIC-002'],'Current independent Map image values, tileset context and exact scoped numeric saved values match the independent built Workspace expectations.'],
] as const){
 const requirement=requirements.find((item:{id:string})=>item.id==='MV-S5-MAP-'+group);assert(requirement);
 assert.equal(sha(await readFile(join(repo,requirement.fixture.path))),requirement.fixture.sha256);
 const comparisons=[];for(const id of ids){const selected=built.filter(item=>item.record.requirementId==='MV-S5-MAP-'+id);assert(selected.length>0,id);
  for(const item of selected)comparisons.push({requirementId:item.record.requirementId,runId:item.record.runId,status:item.record.status,path:'.scratch/complete-mv-events-implementation/evidence/results/'+basename(item.file),sha256:sha(await readFile(item.file)),sourceFingerprint:item.record.source.fingerprint,expected:item.record.expected,actual:item.record.actual});
 }
 await save({...baseline,requirementId:requirement.id,runId:group.toLowerCase()+'-current-'+randomUUID(),startedAt:resource.startedAt,completedAt:new Date().toISOString(),operator:'Codex identified-resource and current frozen built-product comparison',source:sources(requirement.fixture),fixture:requirement.fixture,
  environment:{...baseline.environment,native:{method:'reverse-engineering',mv:'1.6.1; exact identified RPGMV.exe and retained PE version evidence',runtime:'Read-only Qt resource bytes; editor code not executed',nwjs:'not-applicable to editor resource comparison',tools:{method:'fs/zlib/crypto identified resource revalidation',node:process.version},artifacts:[{path:delivery+'/resource-revalidation.json',sha256:sha(await readFile(resourcePath))}]}},
  stages:['Read-only revalidation of34 original identified editor resources','Compare retained facts and bounded deductions with actual current frozen built Workspace results','Preserve distinction between synthetic saved-state support, editor deductions and actual R1 runtime observation'],expected:facts,
  actual:{resource:{path:delivery+'/resource-revalidation.json',sha256:sha(await readFile(resourcePath)),target:resource.target,versionEvidence:resource.versionEvidence,resources:34,passed:true},comparisons,productFreeze:productPointer,executedDirtyRevision:product.git,limits:'No editor UI observation; the ten -0 states are explicit synthetic saved-state inputs, not a claim that the editor generated them. R1 reports actual loaded values separately. Final49–54 remain separate.'},difference:null});
}
for(const slug of ['triggers','routes']){
 const requirement=requirements.find((item:{id:string})=>item.id==='MV-S5-MAP-R1-'+slug.toUpperCase());assert(requirement);
 assert.equal(sha(await readFile(join(repo,requirement.fixture.path))),requirement.fixture.sha256);
 const entry=summaries.results.find((item:{case:string})=>item.case===slug);assert(entry);const summary=await read(entry.path);assert.equal(summary.passed,true);
 assert.equal(summary.build.gitHead,product.git.head);assert.equal(summary.runtimeComparison,true);
 type NativeSide={passed:boolean;validation:Record<string,boolean>;native:Record<string,{value:{engine:string;versions:{node:string;nw:string};loadedCarrierNames:string[]}}>};
 for(const side of Object.values(summary.sides) as NativeSide[]){assert.equal(side.passed,true);assert.equal(Object.keys(side.validation).length,15);for(const flag of Object.values(side.validation))assert.equal(flag,true);const runtime=side.native['runtime-result.json'].value;assert.equal(runtime.engine,'1.6.1');assert.equal(runtime.versions.node,'9.7.1');assert.equal(runtime.versions.nw,'0.29.0');assert.equal(runtime.loadedCarrierNames.length,4);}
 await save({...baseline,requirementId:requirement.id,runId:slug+'-current-'+randomUUID(),startedAt:summary.startedAt,completedAt:summary.completedAt,operator:'Codex current frozen build public Workspace and four actual native processes',source:sources(requirement.fixture),fixture:requirement.fixture,
  environment:{platform:process.platform,architecture:arch(),osRelease:release(),node:process.version,vitest:'not-applicable; actual built public Workspace and native processes',typescript:'5.9.3',package:'0.1.2',native:{method:'game',mv:'1.6.1',runtime:'Node9.7.1 native; tool Node22.23.0',nwjs:'0.29.0',tools:{adapter:inputs.adapter.sha256,physicalGuard:inputs.supportTools.find((item:{path:string})=>item.path.endsWith('mv33-physical-isolation-v1.cjs')).sha256,hostSha256:summary.nativeIdentity.host.sha256},artifacts:[{path:delivery+'/native/'+basename(entry.path),sha256:entry.sha256},{path:delivery+'/tools-and-logs/'+basename(args.nativeAudit),sha256:sha(await readFile(args.nativeAudit))},{path:delivery+'/tools-and-logs/'+basename(args.rootNativeAudit),sha256:sha(await readFile(args.rootNativeAudit))}]}},
  stages:summary.lifecycle.map((step:{name:string})=>step.name),expected:slug==='triggers'?'Original ten trigger/highest-page/Common gameplay cases per side; exact all15disk and4generated/loaded carriers; actual formal source edit and Push.':'Original thirteen route/wait/Parallel predicates per side and fifteen chronology markers; exact all15disk and4generated/loaded carriers; all10 finite -0 paths survive generated/disk/actual native loaded values.',
  actual:{summary,exactNumericAudit:nativeAudit.pairs.find((item:{case:string})=>item.case===slug),executedDirtyRevision:product.git,limits:'Synthetic saved inputs plus actual retained native loaded values; no editor UI/generated-state claim. This closes ticket24 R1 only, not final49–54.'},difference:null});
}
const manifest=join(base,'manual-results-v1-manifest.json');await writeFile(manifest,JSON.stringify({purpose:'Five new exact current E1/E3/E6 and actual R1 evidence records; prior results/requirements unchanged',at:new Date().toISOString(),revision:product.git,records:captured},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({manifest,sha256:sha(await readFile(manifest)),records:captured.length,passed:true}));
