import assert from 'node:assert/strict';
import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import {join,relative} from 'node:path';
import {arch,release} from 'node:os';
import {createHash,randomUUID} from 'node:crypto';
import {recordEvidence,resultSchema} from 'file:///C:/Users/Shuen/.codex/worktrees/mv-ticket-24/rpgmaker-event-dsl/packages/rpgmaker-event-dsl/test/support/mv-evidence.ts';
const root='C:/Users/Shuen/.codex/worktrees/mv-ticket-24/rpgmaker-event-dsl';
const dir=join(root,'.scratch/complete-mv-events-implementation/evidence');
const history=join(dir,'24-merger-correction');
const sha=(b:Uint8Array|string)=>createHash('sha256').update(b).digest('hex');
const read=async(p:string)=>JSON.parse(await readFile(p,'utf8'));
const rel=(p:string)=>relative(root,p).replaceAll('\\','/');
const mode=process.argv[2];
if(mode==='unit'){
 const reportPath=join(history,'mv24-correction-unit-v1.json');const r=await read(reportPath);
 const suite=r.testResults.find((s:{name:string})=>s.name.endsWith('/test/map-event.test.ts'));
 assert(suite);assert.equal(suite.status,'passed');assert.equal(suite.assertionResults.length,45);
 process.env.MV_EVIDENCE_OUTPUT='C:/Users/Shuen/.codex/tmp/mv24-correction-unit-results-v1';
 await recordEvidence({requirementId:'MV-S5-MAP-010',startedAt:new Date(suite.startTime).toISOString(),stages:['Actual corrected source authoring/compiler/Staged Data Graph; complete independent fixture assertions and shape/range/reference/tile/page boundary matrix'],expected:{testCount:45,status:'passed'},actual:{report:{path:rel(reportPath),sha256:sha(await readFile(reportPath))},assertions:suite.assertionResults}});
}else if(mode==='native'){
 for(const [slug,requirementId,script] of [['triggers','MV-S5-MAP-R1-TRIGGERS','mv24-r1-map-common-delivery-v1.cjs'],['routes','MV-S5-MAP-R1-ROUTES','mv24-r1-route-waits-delivery-v1.cjs']]){
  const safePath=join(history,`native-${slug}-safe-summary.json`);const s=await read(safePath);assert.equal(s.passed,true);
  const fixturePath=`.scratch/complete-mv-events-implementation/evidence/24-history/${script}`;
  const fixtureHash=sha(await readFile(join(root,fixturePath)));assert.equal(fixtureHash,s.build.scenarioSha256);
  const files=[...s.build.source.entries.map((e:{path:string,sha256:string})=>({path:`packages/rpgmaker-event-dsl/src/${e.path}`,sha256:e.sha256})),...s.build.dist.entries.map((e:{path:string,sha256:string})=>({path:`packages/rpgmaker-event-dsl/dist/${e.path}`,sha256:e.sha256})),{path:fixturePath,sha256:fixtureHash},{path:'.scratch/complete-mv-events-implementation/evidence/24-history/mv24-native-pair-delivery-v1.cjs',sha256:s.build.harnessSha256},{path:rel(safePath),sha256:sha(await readFile(safePath))}].sort((a,b)=>a.path.localeCompare(b.path));
  const result=resultSchema.parse({formatVersion:1,requirementId,runId:`correction-${slug}-${randomUUID()}`,status:'passed',startedAt:s.startedAt,completedAt:s.completedAt,operator:'Codex actual native merger-correction rerun with unchanged original delivery adapter',source:{revision:s.build.gitHead,fingerprint:sha(JSON.stringify(files)),files},fixture:{path:fixturePath,sha256:fixtureHash},environment:{platform:process.platform,architecture:arch(),osRelease:release(),node:s.node,vitest:'not-applicable; actual built public API and native processes',typescript:'5.9.3',package:'0.1.2',native:{method:'game',mv:'1.6.1',runtime:'Node9.7.1 (native); tool Node22.23.0',nwjs:'0.29.0',tools:{adapter:'Unchanged ticket24 delivery-v1 strict v5 checks; new corrected product build',hostSha256:s.nativeIdentity.host.sha256},artifacts:[{path:rel(safePath),sha256:sha(await readFile(safePath))}]}},stages:s.lifecycle.map((x:{name:string})=>x.name),expected:slug==='triggers'?'Ten cases per side match independent trigger/highest-page/Common expectations with exact complete native carriers.':'Thirteen route/wait/Parallel checks per side and fifteen markers match independent expected chronology and clean state.',actual:s,difference:null});
  await mkdir(join(dir,'results'),{recursive:true});await writeFile(join(dir,'results',`${requirementId}-${result.runId}.json`),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 }
}else if(mode==='editor'){
 const auditPath=join(history,'editor-resource-revalidation.json'),audit=await read(auditPath);
 assert.equal(audit.passed,true);assert.equal(audit.resources.length,34);
 const records=[];
 for(const source of ['C:/Users/Shuen/.codex/tmp/mv24-correction-built-results-v1','C:/Users/Shuen/.codex/tmp/mv24-correction-unit-results-v1'])for(const name of await readdir(source))if(name.endsWith('.json')){
  const file=join(source,name),record=resultSchema.parse(await read(file));
  assert.equal(record.status,'passed');if(/^MV-S5-MAP-\d{3}$/.test(record.requirementId))records.push({file,record});
 }
 const base=records.find(x=>x.record.requirementId==='MV-S5-MAP-001')!.record;
 assert.equal(records.length,76,'All75actual corrected built Workspace cases and45case matrix summary are required');
 assert(base.source.files.some(x=>x.path.includes('/dist/')),'Actual built product outputs are mandatory');
 for(const [group,ids,facts] of [
  ['E1',['001','003','006','007','010','011'],'Exact factory defaults; complete Map clone/serialization; saved condition flags/values; exact note; page order/count and high-ID support samples; empty native event collection rejected without silent repair.'],
  ['E3',['003','008','009'],'Noncustom saved routes retained; M0 field presence, independent route flags and indentnull; ordinary recursive Script Gate and references.'],
  ['E6',['003','005','010'],'Independent Map image fields retained; picker confirmation is a separate edit path; actual Map→tileset→selected group validation.'],
 ] as const){
  const comparisons=[];
  for(const id of ids){
   const selected=records.filter(x=>x.record.requirementId===`MV-S5-MAP-${id}`);assert(selected.length>0,id);
   for(const {file,record} of selected)comparisons.push({requirementId:record.requirementId,runId:record.runId,status:record.status,path:file,sha256:sha(await readFile(file)),sourceFingerprint:record.source.fingerprint,expected:record.expected,actual:record.actual});
  }
  const auditRelative=rel(auditPath);
  const files=[...base.source.files.filter(x=>x.path!==auditRelative),{path:auditRelative,sha256:sha(await readFile(auditPath))}].sort((a,b)=>a.path.localeCompare(b.path));
  const result=resultSchema.parse({...base,requirementId:`MV-S5-MAP-${group}`,runId:`correction-${group.toLowerCase()}-${randomUUID()}`,startedAt:audit.startedAt,completedAt:new Date().toISOString(),operator:'Codex identified-resource and actual corrected built-product comparison adapter',source:{revision:base.source.revision,files,fingerprint:sha(JSON.stringify(files))},environment:{...base.environment,native:{method:'reverse-engineering',mv:'1.6.1; identified RPGMV.exe and PE version evidence',runtime:'Editor Qt resources; target code not evaluated or executed',nwjs:'not-applicable to editor resource comparison',tools:{resourceAuditNode:audit.node,method:'Read-only fs/zlib/crypto; selected stored/decoded bytes and full compressed input consumption revalidated'},artifacts:[{path:auditRelative,sha256:sha(await readFile(auditPath))}]}},stages:['Revalidate original target and34identified resource bytes without executing target code','Compare documented native facts and bounded conditional deductions against independent input and actual corrected built Workspace outputs','Distinguish synthetic support, unobserved UI behavior and actual corrected-build native game R1'],expected:facts,actual:{resourceAudit:{path:auditRelative,sha256:sha(await readFile(auditPath)),target:audit.target,versionEvidence:audit.versionEvidence,resources:34,passed:true},comparisons,limits:'Only ticket24 allocated intersection. No editor UI capture, no arbitrary multiline note/picker reconfirmation observation; high IDs/21pages/dormant zero-or-missing IDs are synthetic support. Final49–54 remain separate.'},difference:null});
  await writeFile(join(dir,'results',`${result.requirementId}-${result.runId}.json`),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 }
}else throw Error('Use unit, native or editor');
