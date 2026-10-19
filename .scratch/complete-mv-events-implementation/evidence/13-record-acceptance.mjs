// Record only actual Vitest and native outputs; never synthesize execution status.
import { deepStrictEqual } from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { copyFile, readFile, readdir, writeFile } from 'node:fs/promises';
import { arch, release } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
const [unitReport, nativeRoot] = process.argv.slice(2);
if (!nativeRoot) throw new Error('Usage: node recorder.mjs VITEST_JSON NATIVE_OUTPUT_DIRECTORY');
const repo = process.cwd();
const root = '.scratch/complete-mv-events-implementation/evidence/';
const fixturePath = 'packages/rpgmaker-event-dsl/test/fixtures/mv-evidence/loop-cases.json';
const readJson = async p => JSON.parse(await readFile(p,'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const report = await readJson(unitReport);
if (!report.success || report.numFailedTests || report.numPassedTests < 34) throw new Error('Loop product tests did not all pass');
const comparison = await readJson(join(nativeRoot,'comparison.json'));
const fixture = await readJson(fixturePath);
if (!comparison.passed) throw new Error('Native comparison failed');
for (const key of ['literal','product']) {
  const {result, identity} = comparison[key];
  if (!result.passed || result.engine !== '1.6.1' || identity.exit.code !== 0) throw new Error('Native game failed');
  const folder = key === 'literal' ? 'literal' : 'compiled';
  deepStrictEqual(await readJson(join(nativeRoot,folder,'data/CommonEvents.json')), fixture.events);
  for (const [i,test] of fixture.runtimeCases.entries()) {
    const observation = result.results[i];
    deepStrictEqual(observation.input, fixture.events[test.eventId].list);
    deepStrictEqual(observation.expected, test.expected);
    deepStrictEqual(observation.actual, test.expected);
    deepStrictEqual(observation.before, test.switches.map(()=>false));
    if (observation.isRunning) throw new Error('Interpreter is still running');
  }
}
deepStrictEqual(comparison.literal.result.results.map(r=>r.actual), comparison.product.result.results.map(r=>r.actual));
const artifacts = [];
for (const folder of ['literal','compiled']) {
  for (const name of ['observer.js','cases.json','runtime-result.json','run-identity.json','stdout.txt','stderr.txt']) {
    const output = root + '13-' + folder + '-' + name;
    await copyFile(join(nativeRoot,folder,name),output);
    artifacts.push(output);
  }
}
await copyFile(join(nativeRoot,'compiled/data/CommonEvents.json'),root+'13-compiled-common-events.json');
await copyFile(unitReport,root+'13-vitest-report.json');
artifacts.push(root+'13-compiled-common-events.json',root+'13-vitest-report.json',root+'13-loop-native-runner.cjs',root+'13-record-acceptance.mjs');
const rows = [
  ['MV-S3-LOOP-013','Complete Loop saved lists through actual Workspace Discovery and evaluation','synthetic-support','round trips complete Loop saved lists through actual Discovery, Check, Compile, Diff and Push','loop-workspace.test.ts','Complete saved objects, nested marker state and formal helpers equal the independent literal fixture through Check/Compile/Diff/Push.'],
  ['MV-S3-FLOW-REJECT-013','Malformed native flow fails without publishing source','synthetic-rejection','rejects malformed known native flow before publishing any source and preserves project and snapshot','loop-workspace.test.ts','Missing E115 parameters fails at commonEvent:5/list[2]; source discovery remains empty and Project Root/Snapshot/manifest remain byte-identical.'],
  ['MV-S3-LOOP-BODY-013','Required Child Command Body fields and bounded marker state','synthetic-rejection','rejects invalid Loop body $path through the public validation seam','loop.test.ts','Required/unknown fields, invalid marker enum, null/undefined/sparse children and empty-absent bodies fail; empty present compiles to an exact own marker.'],
  ['MV-S3-LOOP-RAW-013','Final formal/raw body marker state and legal nested raw records','synthetic-support','checks the final declared body state after formal and raw records are combined','loop.test.ts','Owning raw tail marker contradicting absent or duplicating present fails, while valid nested raw structures and a handwritten complete event terminator remain legal.'],
  ['MV-S3-LOOP-STRUCTURE-013','Loop structure diagnostics and exact known flow shapes','synthetic-rejection','rejects $name in known raw output and native decompilation with an exact location','loop.test.ts','Orphan/missing close, wrong indent, middle marker, missing empty marker and extra known parameter fail at exact native list indexes; malformed envelopes and parameterless extra fields also fail.'],
  ['MV-S3-LOOP-RECURSION-013','Recursive Script Gate and contextual references inside Loop','synthetic-rejection','recursively validates Script Command Gate and contextual switch references inside Loop','loop.test.ts','Disabled Script and missing switch are reported inside the Loop; full child DSL paths are retained through other parents.'],
  ['MV-S3-BREAK-WARNING-013','Outside Loop Break warns without changing saved output','synthetic-support','warns about formal and raw Break Loop outside a Loop while preserving native output','loop.test.ts','Formal and raw outside Break each warn at their native list position; inside Break is allowed without that warning.'],
  ['MV-R3-LOOP-013','Actual native Loop/Break/Exit control flow and Common Event caller continuation','game-observation',null,null,'Independent literal and actual compiled lists produce the same fresh-state switch values and stopped interpreter for all four cases; child Exit permits caller continuation.'],
];
const index = await readJson(root+'requirements.json');
const ids = new Set(rows.map(r=>r[0]));
index.requirements = index.requirements.filter(r=>!ids.has(r.id));
const fixtureHash=hash(await readFile(fixturePath));
for (const [id,title,sourceKind,name,testFile,expected] of rows) index.requirements.push({
  id,title,
  sources:[{path:'.scratch/complete-mv-events-implementation/issues/13-loop-and-child-body-boundaries.md',section:'## Acceptance criteria'},{path:'.scratch/complete-mv-events-implementation/complete-mv-events-implementation-spec.md',section:'### T3 — 夹具、索引和结果'}],
  dimensions:sourceKind==='game-observation'?['A1','A3','A5','A7']:['A1','A3','A5','A6','A7'],
  classifications:sourceKind==='synthetic-rejection'?['negative','boundary','combination']:['positive','boundary','combination'],
  sourceKind,input:title+'; independent native literals and separate runtime expectations in the fixture; negative inputs are literal mutations in the linked tests.',
  fixture:{path:fixturePath,sha256:fixtureHash},expected,
  ...(name?{test:{path:'packages/rpgmaker-event-dsl/test/'+testFile,name}}:{review:{path:root+'13-loop-acceptance.md',section:'## Actual MV execution'}}),
  nativeGroups:sourceKind==='game-observation'?['R1','R3']:[],
  execution:{environment:'Windows / Node 22'+(sourceKind==='game-observation'?'; actual MV1.6.1 / NW0.29.0 game processes':''),owner:'Codex ticket13 implementer /root/ticket_01',layer:sourceKind==='game-observation'?'Native Scene_Map and unchanged Game_Interpreter':'Actual command/Staged Data Graph and Workspace filesystem seams'},
  slice:'13 / E112 E113 E115',required:true,
});
await writeFile(root+'requirements.json',JSON.stringify(index,null,2)+'\n');
const walk = async dir => (await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?walk(join(dir,e.name)):join(dir,e.name)))).flat();
const sourcePaths=[...await walk('packages/rpgmaker-event-dsl/src'),...await walk('packages/rpgmaker-event-dsl/test'),'package.json','pnpm-lock.yaml',root+'requirements.json',...artifacts];
const files=await Promise.all([...new Set(sourcePaths)].sort().map(async path=>({path:path.replaceAll('\\','/'),sha256:hash(await readFile(path))})));
const require = createRequire(import.meta.url);
const packageRequire=createRequire(join(repo,'packages/rpgmaker-event-dsl/package.json'));
const environment={platform:process.platform,architecture:arch(),osRelease:release(),node:process.version,vitest:packageRequire('vitest/package.json').version,typescript:require('typescript/package.json').version,package:(await readJson('packages/rpgmaker-event-dsl/package.json')).version,native:'not-executed'};
for (const [id,,sourceKind,,,expected] of rows) {
  const native=sourceKind==='game-observation';
  const result={formatVersion:1,requirementId:id,runId:new Date().toISOString().replaceAll(/[:.]/g,'-')+'-'+randomUUID(),status:'passed',startedAt:native?comparison.literal.identity.startedAt:new Date(report.startTime).toISOString(),completedAt:new Date().toISOString(),operator:'Codex ticket13 implementer /root/ticket_01',source:{revision:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),fingerprint:hash(JSON.stringify(files)),files},fixture:{path:fixturePath,sha256:fixtureHash},environment:{...environment,...(native?{native:{method:'game',mv:comparison.product.result.engine,runtime:'Chromium '+comparison.product.result.versions.chromium+'; embedded Node '+comparison.product.result.versions.node,nwjs:comparison.product.result.versions.nw,tools:{launcher:'Node22 child_process.spawn, windowsHide true',observer:'Original ES5 scheduler/state collector, unchanged native engine'},artifacts:[...files.filter(f=>artifacts.includes(f.path)),{path:comparison.product.identity.host,sha256:comparison.product.identity.hostSha256}]}}:{})},stages:native?['independent literal game process','actual compiled saved-list game process','fresh setupNewGame/setup map per scenario','all expected states and input lists compared']:['Vitest command/Staged Data Graph seam','actual Workspace Discovery/typecheck/evaluation','all product assertions executed'],expected,actual:native?{literal:comparison.literal,compiled:comparison.product}:{numPassedTests:report.numPassedTests,numFailedTests:report.numFailedTests,testResults:report.testResults},difference:null};
  await writeFile(root+'results/'+id+'-'+result.runId+'.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
}
console.log('Recorded '+rows.length+' passing requirements from '+report.numPassedTests+' actual product tests and two native processes.');
