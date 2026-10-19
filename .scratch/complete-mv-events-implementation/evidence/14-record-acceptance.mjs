import { deepStrictEqual } from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { copyFile, readFile, readdir, writeFile } from 'node:fs/promises';
import { arch, release } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
const [unitReport, nativeRoot, builtReport] = process.argv.slice(2);
if (!builtReport) throw new Error('Usage: node recorder.mjs PRODUCT_VITEST_JSON NATIVE_OUTPUT_DIRECTORY BUILT_WORKSPACE_VITEST_JSON');
const repo = process.cwd();
const root = '.scratch/complete-mv-events-implementation/evidence/';
const fixturePath = 'packages/rpgmaker-event-dsl/test/fixtures/mv-evidence/movement-route-cases.json';
const readJson = async p => JSON.parse(await readFile(p,'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const report = await readJson(unitReport), built = await readJson(builtReport);
if (!report.success || report.numFailedTests || report.numPassedTests < 50) throw new Error('Movement Route product tests did not all pass');
if (!built.success || built.numFailedTests || built.numPassedTests < 5) throw new Error('Built Workspace tests did not all pass');
const comparison = await readJson(join(nativeRoot,'comparison.json'));
const fixture = await readJson(fixturePath);
if (!comparison.passed) throw new Error('Native comparison failed');
for (const key of ['literal','product']) {
  const {result, identity} = comparison[key];
  if (!result.passed || result.engine !== '1.6.1' || identity.exit.code !== 0 || identity.fixture.sha256 !== hash(await readFile(fixturePath))) throw new Error('Native identity or execution failed');
  const folder = key === 'literal' ? 'literal' : 'compiled';
  deepStrictEqual(await readJson(join(nativeRoot,folder,'data/CommonEvents.json')), fixture.events);
  for (const [i,test] of fixture.runtimeCases.entries()) {
    const observation = result.results[i];
    deepStrictEqual(observation.input, fixture.events[test.eventId].list);
    deepStrictEqual(observation.expected, test.expected);
    deepStrictEqual(observation.actual, test.expected);
    deepStrictEqual(observation.before,{switches:[false,false,false],running:false,forcing:false,x:0,y:0,direction:2});
    if (!observation.passed || observation.elapsedFrames < test.frames) throw new Error('Native frame observation did not complete');
    if (test.first) deepStrictEqual({switches:observation.first.switches,running:observation.first.running,forcing:observation.first.forcing}, test.first);
  }
}
deepStrictEqual(comparison.literal.result.results.map(r=>r.actual), comparison.product.result.results.map(r=>r.actual));
const artifacts = [];
for (const folder of ['literal','compiled']) for (const name of ['observer.js','cases.json','runtime-result.json','run-identity.json','stdout.txt','stderr.txt']) {
  const output = root+'14-'+folder+'-'+name;
  await copyFile(join(nativeRoot,folder,name),output);artifacts.push(output);
}
await copyFile(join(nativeRoot,'compiled/data/CommonEvents.json'),root+'14-compiled-common-events.json');
await copyFile(unitReport,root+'14-vitest-report.json');
await copyFile(builtReport,root+'14-built-workspace-report.json');
artifacts.push(root+'14-compiled-common-events.json',root+'14-vitest-report.json',root+'14-built-workspace-report.json',root+'14-movement-native-runner.cjs',root+'14-record-acceptance.mjs');
const rows = [
  ['MV-S2-ROUTE-014','Shared Movement Route defaults and finite saved shapes','synthetic-support','compiles a shared Movement Route with exact defaults, record envelopes and 505 mirrors','movement-route.test.ts','Exact missing parameter keys, finite indent states, M0 variants, optional undefined defaults and all eight route flag combinations compile to independent native expectations.'],
  ['MV-S2-MIRROR-014','Whole-object ordered E205/E505 mirror validation','synthetic-rejection','rejects a complete 205/505 mirror difference: %s','movement-route.test.ts','Missing, duplicate, reordered, wrong-indent, missing/null/zero, nested-value, extra-key and wrong-array-length mirror differences fail without choosing a copy.'],
  ['MV-S2-SHAPE-014','Bounded native and authored movement envelopes','synthetic-rejection','rejects an unsupported native movement envelope %j','movement-route.test.ts','Unknown movement code, extra fields, forbidden parameters, numeric indent, wrong arity, malformed M0, sparse/undefined and invalid authored saved descriptors fail.'],
  ['MV-S2-ROUTE-RAW-014','Known raw Movement Route inputs retain Gate and references','synthetic-rejection','validates Script Gate and switch references in recognized raw 205 and 505 routes','movement-route.test.ts','Known raw routes validate complete mirrors, nested Script Gate and switch references; malformed raw arrays fail before copying.'],
  ['MV-S2-ROUTE-WORKSPACE-014','Exact route roundtrip through actual Workspace source evaluation','synthetic-support','round trips independent Movement Routes through actual Discovery, evaluation, Check, Compile, Diff and Push','movement-route-workspace.test.ts','Real Discovery, package typecheck, evaluation, Check, Compile, Diff and Push reproduce all six literal Common Events; source edit and restoration prove evaluation.'],
  ['MV-S2-ROUTE-STATE-014','Route failures preserve all observable Workspace data','synthetic-rejection','preserves source, project, snapshot, manifest, generated data and Discovery after route Check and Compile failures','movement-route-workspace.test.ts','Invalid saved shape and disabled nested Script fail both Check and Compile with byte-identical source, Project Root, complete Snapshot, generated data, manifest and Discovery; native mirror conflict publishes no source.'],
  ['MV-S2-ROUTE-CLI-014','Movement Routes through built Windows CLI processes','synthetic-support','checks and compiles Movement Routes through separate actual Windows CLI processes','movement-route-workspace.test.ts','Separate built CLI Decompile, Check and Compile processes reproduce the literal fixture on Windows Node22; all five built Workspace tests pass.'],
  ['MV-R1-ROUTE-014','Actual native route wait, repeat, skip and finite-envelope controls','game-observation',null,null,'Literal and actual compiled lists match independent expected state over 90 native frames per case; no-wait continues early, repeat+wait and blocked unskippable remain waiting, and skippable advances.'],
];
const index = await readJson(root+'requirements.json');
const ids = new Set(rows.map(r=>r[0]));index.requirements=index.requirements.filter(r=>!ids.has(r.id));
for (const [id,title,sourceKind,name,testFile,expected] of rows) index.requirements.push({
  id,title,sources:[{path:'.scratch/complete-mv-events-implementation/issues/14-shared-movement-route-saved-shapes.md',section:'## Acceptance criteria'},{path:'docs/adr/0015-bounded-native-saved-shape.md',section:'# Represent native saved shape through bounded owned fields'}],
  dimensions:['A1','A3','A5','A6','A7'],classifications:sourceKind==='synthetic-rejection'?['negative','boundary','combination']:['positive','boundary','combination'],sourceKind,
  input:title+'; original independent native literals and separate expected runtime states; rejection mutations are in linked tests.',fixture:{path:fixturePath,sha256:hash(await readFile(fixturePath))},expected,
  ...(name?{test:{path:'packages/rpgmaker-event-dsl/test/'+testFile,name}}:{review:{path:root+'14-movement-acceptance.md',section:'## Actual MV execution'}}),
  nativeGroups:sourceKind==='game-observation'?['R1','R6']:[],execution:{environment:'Windows / Node22'+(sourceKind==='game-observation'?'; MV1.6.1 / NW0.29.0':''),owner:'Codex ticket14 implementer /root/ticket_01',layer:sourceKind==='game-observation'?'Actual Scene_Map and unchanged native engine':'Actual command, Staged Data Graph and Workspace seams'},slice:'14 / E205 shared route envelope',required:true,
});
await writeFile(root+'requirements.json',JSON.stringify(index,null,2)+'\n');
const walk = async dir => (await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?walk(join(dir,e.name)):join(dir,e.name)))).flat();
const sourcePaths=[...await walk('packages/rpgmaker-event-dsl/src'),...await walk('packages/rpgmaker-event-dsl/test'),'package.json','pnpm-lock.yaml',root+'requirements.json',...artifacts];
const files=await Promise.all([...new Set(sourcePaths)].sort().map(async path=>({path:path.replaceAll('\\','/'),sha256:hash(await readFile(path))})));
const require=createRequire(import.meta.url),packageRequire=createRequire(join(repo,'packages/rpgmaker-event-dsl/package.json'));
const environment={platform:process.platform,architecture:arch(),osRelease:release(),node:process.version,vitest:packageRequire('vitest/package.json').version,typescript:require('typescript/package.json').version,package:(await readJson('packages/rpgmaker-event-dsl/package.json')).version,native:'not-executed'};
for (const [id,,sourceKind,,,expected] of rows) {
  const native=sourceKind==='game-observation';
  const result={formatVersion:1,requirementId:id,runId:new Date().toISOString().replaceAll(/[:.]/g,'-')+'-'+randomUUID(),status:'passed',startedAt:native?comparison.literal.identity.startedAt:new Date(report.startTime).toISOString(),completedAt:new Date().toISOString(),operator:'Codex ticket14 implementer /root/ticket_01',source:{revision:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),fingerprint:hash(JSON.stringify(files)),files},fixture:{path:fixturePath,sha256:hash(await readFile(fixturePath))},environment:{...environment,...(native?{native:{method:'game',mv:comparison.product.result.engine,runtime:'Chromium '+comparison.product.result.versions.chromium+'; embedded Node '+comparison.product.result.versions.node,nwjs:comparison.product.result.versions.nw,tools:{launcher:'Node22 spawn windowsHide:true; hidden native window',observer:'Original ES5 scheduler and state collector; engine methods unchanged'},artifacts:[...files.filter(f=>artifacts.includes(f.path)),{path:comparison.product.identity.host,sha256:comparison.product.identity.hostSha256}]}}:{})},stages:native?['independent literal native game process','actual Workspace-compiled native game process','fresh setupNewGame/map/player state per case','90 actual frames and independently specified expected state']:['actual command and Staged Data Graph tests','actual Workspace Discovery/typecheck/evaluation','source and built Windows CLI processes','all linked product assertions executed'],expected,actual:native?{literal:comparison.literal,compiled:comparison.product}:{product:report,builtWorkspace:built},difference:null};
  await writeFile(root+'results/'+id+'-'+result.runId+'.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
}
console.log('Recorded '+rows.length+' requirements from '+report.numPassedTests+' product tests, '+built.numPassedTests+' built Workspace tests and two actual native processes.');
