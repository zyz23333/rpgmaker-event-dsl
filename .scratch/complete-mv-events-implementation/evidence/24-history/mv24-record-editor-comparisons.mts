import assert from 'node:assert/strict';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {join,relative} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {resultSchema} from 'file:///C:/Users/Shuen/.codex/worktrees/mv-ticket-24/rpgmaker-event-dsl/packages/rpgmaker-event-dsl/test/support/mv-evidence.ts';
const root='C:/Users/Shuen/.codex/worktrees/mv-ticket-24/rpgmaker-event-dsl';
const dir=join(root,'.scratch/complete-mv-events-implementation/evidence');
const history=join(dir,'24-history');
const built='C:/Users/Shuen/.codex/tmp/mv24-evidence-built-final-v1';
const unit='C:/Users/Shuen/.codex/tmp/mv24-evidence-unit-v1';
const sha=(b:Uint8Array|string)=>createHash('sha256').update(b).digest('hex');
const read=async(p:string)=>JSON.parse(await readFile(p,'utf8'));
const auditPath=join(history,'editor-resource-revalidation.json'),audit=await read(auditPath);
assert.equal(audit.passed,true);assert.equal(audit.resources.length,34);
const records=[];
for(const source of [built,unit])for(const name of await readdir(source))if(name.endsWith('.json')){
 const file=join(source,name),record=resultSchema.parse(await read(file));
 assert.equal(record.status,'passed');records.push({file,record});
}
const base=records.find(x=>x.record.requirementId==='MV-S5-MAP-001')!.record;
assert.equal(records.filter(x=>/^MV-S5-MAP-\d{3}$/.test(x.record.requirementId)).length,75,'All74actual built Workspace cases and45case unit summary are required');
assert(base.source.files.some(x=>x.path.includes('/dist/')),'Actual built product outputs are mandatory');
for(const [group,ids,facts] of [
 ['E1',['001','003','006','007','010'],'Exact factory defaults; complete Map clone/serialization; saved condition flags/values; exact note; page order/count and high-ID support samples.'],
 ['E3',['003','008','009'],'Noncustom saved routes retained; M0 field presence, independent route flags and indentnull; ordinary recursive Script Gate and references.'],
 ['E6',['003','005','010'],'Independent Map image fields retained; picker confirmation is a separate edit path; actual Map→tileset→selected group validation.'],
] as const){
 const comparisons=[];
 for(const id of ids){
  const selected=records.filter(x=>x.record.requirementId===`MV-S5-MAP-${id}`);assert(selected.length>0,id);
  for(const {file,record} of selected)comparisons.push({requirementId:record.requirementId,runId:record.runId,status:record.status,path:file,sha256:sha(await readFile(file)),sourceFingerprint:record.source.fingerprint,expected:record.expected,actual:record.actual});
 }
 const auditRelative=relative(root,auditPath).replaceAll('\\','/');
 const files=[...base.source.files.filter(x=>x.path!==auditRelative),{path:auditRelative,sha256:sha(await readFile(auditPath))}].sort((a,b)=>a.path.localeCompare(b.path));
 const result=resultSchema.parse({...base,requirementId:`MV-S5-MAP-${group}`,runId:`${group.toLowerCase()}-${randomUUID()}`,startedAt:audit.startedAt,completedAt:new Date().toISOString(),operator:'Codex identified-resource and actual built-product comparison adapter',source:{revision:base.source.revision,files,fingerprint:sha(JSON.stringify(files))},environment:{...base.environment,native:{method:'reverse-engineering',mv:'1.6.1; identified RPGMV.exe and PE version evidence',runtime:'Editor Qt resources; target code not evaluated or executed',nwjs:'not-applicable to editor resource comparison',tools:{resourceAuditNode:audit.node,method:'Read-only fs/zlib/crypto; selected stored/decoded bytes and full compressed input consumption revalidated'},artifacts:[{path:auditRelative,sha256:sha(await readFile(auditPath))}]}},stages:['Revalidate original target and34identified resource bytes without executing target code','Compare documented native facts and bounded conditional deductions against independent input and actual current built Workspace outputs','Distinguish synthetic support, unobserved UI behavior and native game R1'],expected:facts,actual:{resourceAudit:{path:auditRelative,sha256:sha(await readFile(auditPath)),target:audit.target,versionEvidence:audit.versionEvidence,resources:34,passed:true},comparisons,limits:'Only ticket24 allocated intersection. No editor UI capture, no arbitrary multiline note/picker reconfirmation observation; high IDs/21pages/dormant zero-or-missing IDs are synthetic support. Final49–54 remain separate.'},difference:null});
 await writeFile(join(dir,'results',`${result.requirementId}-${result.runId}.json`),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
}
