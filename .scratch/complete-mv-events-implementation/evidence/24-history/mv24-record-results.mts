import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {join,relative} from 'node:path';
import {arch,release} from 'node:os';
import {createHash,randomUUID} from 'node:crypto';
import {recordEvidence,resultSchema} from 'file:///C:/Users/Shuen/.codex/worktrees/mv-ticket-24/rpgmaker-event-dsl/packages/rpgmaker-event-dsl/test/support/mv-evidence.ts';
const root='C:/Users/Shuen/.codex/worktrees/mv-ticket-24/rpgmaker-event-dsl';
const dir=join(root,'.scratch/complete-mv-events-implementation/evidence');
const history=join(dir,'24-history');
const sha=(b:Uint8Array|string)=>createHash('sha256').update(b).digest('hex');
const read=async(p:string)=>JSON.parse(await readFile(p,'utf8'));
const mode=process.argv[2];
if(mode==='unit'){
 const reportPath=join(history,'mv24-focused-final-source-v1.json');const r=await read(reportPath);
 const suite=r.testResults.find((s:{name:string})=>s.name.endsWith('/test/map-event.test.ts'));
 assert(suite);assert.equal(suite.status,'passed');assert.equal(suite.assertionResults.length,45);
 process.env.MV_EVIDENCE_OUTPUT='C:/Users/Shuen/.codex/tmp/mv24-evidence-unit-v1';
 await recordEvidence({requirementId:'MV-S5-MAP-010',startedAt:new Date(suite.startTime).toISOString(),stages:['Actual source authoring/compiler/Staged Data Graph; complete independent fixture assertions and shape/range/reference/tile/page boundary matrix'],expected:{testCount:45,status:'passed'},actual:{report:{path:relative(root,reportPath).replaceAll('\\','/'),sha256:sha(await readFile(reportPath))},assertions:suite.assertionResults}});
}else if(mode==='native'){
 const index=await read(join(dir,'requirements.json'));
 for(const [slug,requirementId,script] of [['triggers','MV-S5-MAP-R1-TRIGGERS','mv24-r1-map-common-delivery-v1.cjs'],['routes','MV-S5-MAP-R1-ROUTES','mv24-r1-route-waits-delivery-v1.cjs']]){
  const safePath=join(history,`native-${slug}-safe-summary.json`);const s=await read(safePath);assert.equal(s.passed,true);
  const fixturePath=`.scratch/complete-mv-events-implementation/evidence/24-history/${script}`;
  const fixtureHash=sha(await readFile(join(root,fixturePath)));assert.equal(fixtureHash,s.build.scenarioSha256);
  const req=index.requirements.find((r:{id:string})=>r.id===requirementId);req.fixture={path:fixturePath,sha256:fixtureHash};
  const files=[...s.build.source.entries.map((e:{path:string,sha256:string})=>({path:`packages/rpgmaker-event-dsl/src/${e.path}`,sha256:e.sha256})),...s.build.dist.entries.map((e:{path:string,sha256:string})=>({path:`packages/rpgmaker-event-dsl/dist/${e.path}`,sha256:e.sha256})),{path:fixturePath,sha256:fixtureHash},{path:'.scratch/complete-mv-events-implementation/evidence/24-history/mv24-native-pair-delivery-v1.cjs',sha256:s.build.harnessSha256},{path:relative(root,safePath).replaceAll('\\','/'),sha256:sha(await readFile(safePath))}].sort((a,b)=>a.path.localeCompare(b.path));
  const result=resultSchema.parse({formatVersion:1,requirementId,runId:`${slug}-${randomUUID()}`,status:'passed',startedAt:s.startedAt,completedAt:s.completedAt,operator:'Codex actual native delivery adapter',source:{revision:s.build.gitHead,fingerprint:sha(JSON.stringify(files)),files},fixture:{path:fixturePath,sha256:fixtureHash},environment:{platform:process.platform,architecture:arch(),osRelease:release(),node:s.node,vitest:'not-applicable; actual built public API and native processes',typescript:'5.9.3',package:'0.1.2',native:{method:'game',mv:'1.6.1',runtime:'Node9.7.1 (native); tool Node22.23.0',nwjs:'0.29.0',tools:{adapter:'ticket24 delivery-v1 preserving strict v5 checks',hostSha256:s.nativeIdentity.host.sha256},artifacts:[{path:relative(root,safePath).replaceAll('\\','/'),sha256:sha(await readFile(safePath))}]}},stages:s.lifecycle.map((x:{name:string})=>x.name),expected:slug==='triggers'?'Ten cases per side match independent trigger/highest-page/Common expectations with exact complete native carriers.':'Thirteen route/wait/Parallel checks per side and fifteen markers match independent expected chronology and clean state.',actual:s,difference:null});
  await mkdir(join(dir,'results'),{recursive:true});await writeFile(join(dir,'results',`${requirementId}-${result.runId}.json`),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 }
 const old=execFileSync('git',['show','HEAD:.scratch/complete-mv-events-implementation/evidence/requirements.json'],{cwd:root,encoding:'utf8'});
 const oldIndex=JSON.parse(old);const added=index.requirements.slice(oldIndex.requirements.length);
 assert.deepEqual(index.requirements.slice(0,oldIndex.requirements.length),oldIndex.requirements);
 const end=old.lastIndexOf('\n  ]');assert(end>0);
 const suffix=added.map((r:unknown)=>JSON.stringify(r,null,2).split('\n').map(l=>'    '+l).join('\n')).join(',\n');
 await writeFile(join(dir,'requirements.json'),old.slice(0,end)+',\n'+suffix+'\n  ]\n}\n');
}else throw Error('Use unit or native');
