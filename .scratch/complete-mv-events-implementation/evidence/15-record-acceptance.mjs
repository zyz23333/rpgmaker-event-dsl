import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { copyFile, readFile, readdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { arch, release } from 'node:os';
import { join } from 'node:path';

const [fullPath, baselinePath, workspacePath] = process.argv.slice(2);
if (!workspacePath) throw new Error('Usage: node 15-record-acceptance.mjs FULL_JSON BUILT_BASELINE_JSON BUILT_BOUNDARY_JSON');
const root = '.scratch/complete-mv-events-implementation/evidence/';
const fixturePath = 'packages/rpgmaker-event-dsl/test/fixtures/mv-evidence/command-boundary-cases.json';
const readJson = async path => JSON.parse(await readFile(path, 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const reports = await Promise.all([fullPath, baselinePath, workspacePath].map(readJson));
for (const report of reports)
  if (!report.success || report.numFailedTests || report.numPendingTests || report.numFailedTestSuites)
    throw new Error('All recorded reports must have executed and passed completely');
if (reports[0].numPassedTests < 200 || reports[1].numPassedTests < 26 || reports[2].numPassedTests !== 5)
  throw new Error('Expected complete regression, built Windows baseline and all five built boundary Workspace tests');

const rows = [
  ['MV-S2-RAW-015', 'Finite unknown raw JSON preserves exact parsed values', 'synthetic-support',
    'preserves unknown single-record raw values with explicit absolute zero indentation', 'command-boundary.test.ts',
    'Unknown code999 remains one warned record; explicit absolute indent0, negative zero, own __proto__, null, empty containers, ordered slots and CR/CRLF survive actual source evaluation and complete Project Data comparison.'],
  ['MV-S2-KNOWN-015', 'Known raw and formal commands share the boundary', 'synthetic-rejection',
    'uses the same known parameter boundary for formal, handwritten raw and native input', 'command-boundary.test.ts',
    'Malformed known shapes, unsupported known saved variants, missing/null/undefined, holes, non-finite values, extra fields and unowned continuations fail explicitly; current fixed-reference and coarse family envelopes apply equally to formal and known raw commands. Later full family matrices remain required.'],
  ['MV-S2-MIRROR-015', 'Choice and route mirrors retain ownership and both locations', 'synthetic-rejection',
    'rejects orphan continuations and mismatched choice mirrors with both saved locations', 'command-boundary.test.ts',
    'Ordered choice indexes and exact saved text match their102 owner; every205/505 object agrees. Failures report stable code, stage, severity, identity, expected/actual and correctly Page-prefixed physical and related locations.'],
  ['MV-S2-GATE-015', 'All recognizable physical script positions require the Gate', 'synthetic-rejection',
    'recursively gates every recognizable native script location including empty raw continuations and mirrors', 'command-boundary.test.ts',
    '355/655,111 mode12,122 operand4,205 M45,505 M45 and Page saved routes are scanned regardless of emptiness, reachability or selected movement type; Decompile warns, Check/Compile reject with the Gate closed.'],
  ['MV-S2-WORKSPACE-015', 'Actual Workspace evaluation and failure state remain exact', 'synthetic-support',
    'decompiles with the Gate closed, reports every saved script location, and checks actual evaluated output without changing state', 'command-boundary-workspace.test.ts',
    'Actual Clone/Decompile/Discovery/typecheck/evaluation/Check/Compile reproduce independent complete CommonEvents and Map data; malformed edited known raw and disabled Gate preserve source, Project Root, Snapshot, Generated, manifest and Discovery byte-for-byte. Malformed native input publishes no source.'],
  ['MV-S2-CURRENT-SOURCE-015', 'Gate checks actual declarations while old Snapshot still contains scripts', 'synthetic-support',
    'checks the current declarations after every script is removed while the old Snapshot still contains scripts', 'command-boundary-workspace.test.ts',
    'Removing scripts from actual generated declarations, including a fixed Page saved route, permits closed-Gate Check and Compile; Project Root and Snapshot remain the original script-containing input.'],
  ['MV-S2-CANDIDATE-015', 'Complete owned candidate and unusual data remain usable', 'synthetic-support',
    'decompiles valid Common Event calls against the complete Snapshot owned candidate', 'command-boundary-workspace.test.ts',
    'Common1 calling actual Common2 decompiles and exactly recompiles. Direct and aliased __proto__ named exports are collected by actual Discovery; Array subclasses and known structural negative-zero codes fail before normalization. Page movement accessors are rejected before evaluation.'],
  ['MV-S2-BUILT-015', 'Built Windows CLI executes the same boundary workflow', 'synthetic-support',
    'decompiles with the Gate closed, reports every saved script location, and checks actual evaluated output without changing state', 'command-boundary-workspace.test.ts',
    'All five boundary Workspace cases execute separate built Windows CLI processes; the complete built Windows baseline including locking, Snapshot binding and compilation-input capture also passes.'],
];
const cases = report => report.testResults.flatMap(suite => suite.assertionResults.map(test => ({ ...test, file: suite.name })));
for (const [, , , name, file] of rows) {
  if (!cases(reports[0]).some(test => test.file.endsWith(file) && test.title === name && test.status === 'passed'))
    throw new Error('Missing executed linked test: '+name);
}
for (const test of cases(reports[2])) if (test.status !== 'passed') throw new Error('Built boundary test not passed');
const reportNames = ['15-full-vitest-report.json', '15-built-windows-report.json', '15-built-boundary-report.json'];
for (const [index, path] of [fullPath, baselinePath, workspacePath].entries()) await copyFile(path, root+reportNames[index]);
const fixture = { path: fixturePath, sha256: hash(await readFile(fixturePath)) };
const index = await readJson(root+'requirements.json');
const ids = new Set(rows.map(row => row[0]));
index.requirements = index.requirements.filter(row => !ids.has(row.id));
for (const [id, title, sourceKind, name, file, expected] of rows) index.requirements.push({
  id, title,
  sources: [{ path: '.scratch/complete-mv-events-implementation/issues/15-raw-validation-and-script-gate.md', section: '## Acceptance criteria' },
    { path: '.scratch/complete-mv-events-implementation/complete-mv-events-implementation-spec.md', section: '### I7' }],
  dimensions: ['A1', 'A3', 'A5', 'A6', 'A7'], classifications: sourceKind === 'synthetic-rejection' ? ['negative', 'boundary', 'combination'] : ['positive', 'boundary', 'combination'],
  sourceKind, input: title+'; original independent literal fixture plus focused malformed and direct-API cases in linked tests.', fixture, expected,
  test: { path: 'packages/rpgmaker-event-dsl/test/'+file, name }, nativeGroups: [],
  execution: { environment: 'Windows / Node22; native not executed', owner: 'Codex ticket15 implementer /root/ticket_01', layer: 'Actual command, Staged Data Graph, filesystem Workspace and source/built CLI seams' },
  slice: '15 / finite raw boundary and recursive Script Gate', required: true,
});
if (!index.scope.includes('Ticket15 adds')) index.scope += ' Ticket15 adds finite raw JSON, known-shape failures, recursive Script Gate and a minimum saved Page Autonomous Movement carrier; no complete later-family or final native acceptance is claimed.';
await writeFile(root+'requirements.json', JSON.stringify(index,null,2)+'\n');
const walk = async directory => (await Promise.all((await readdir(directory, { withFileTypes: true })).map(entry => entry.isDirectory() ? walk(join(directory,entry.name)) : join(directory,entry.name)))).flat();
const paths = [...await walk('packages/rpgmaker-event-dsl/src'), ...await walk('packages/rpgmaker-event-dsl/test'), ...await walk('packages/rpgmaker-event-dsl/dist'), 'package.json', 'pnpm-lock.yaml', root+'requirements.json', root+'15-record-acceptance.mjs', ...reportNames.map(name => root+name)];
const files = await Promise.all([...new Set(paths)].sort().map(async path => ({ path: path.replaceAll('\\','/'), sha256: hash(await readFile(path)) })));
const require = createRequire(join(process.cwd(),'package.json'));
const packageRequire = createRequire(join(process.cwd(),'packages/rpgmaker-event-dsl/package.json'));
const environment = { platform: process.platform, architecture: arch(), osRelease: release(), node: process.version, vitest: packageRequire('vitest/package.json').version, typescript: require('typescript/package.json').version, package: (await readJson('packages/rpgmaker-event-dsl/package.json')).version, native: 'not-executed' };
for (const [id, , , , , expected] of rows) {
  const result = {
    formatVersion: 1, requirementId: id, runId: new Date().toISOString().replaceAll(/[:.]/g,'-')+'-'+randomUUID(), status: 'passed',
    startedAt: new Date(reports[0].startTime).toISOString(), completedAt: new Date().toISOString(), operator: 'Codex ticket15 implementer /root/ticket_01',
    source: { revision: execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(), fingerprint: hash(JSON.stringify(files)), files }, fixture, environment,
    stages: ['Complete stable-tree Windows source regression', 'Actual built Windows baseline', 'Five actual built boundary Workspace cases'], expected,
    actual: reports.map((report, index) => ({ report: root+reportNames[index], sha256: files.find(file => file.path === root+reportNames[index]).sha256, passedTests: report.numPassedTests, passedSuites: report.numPassedTestSuites, failedTests: report.numFailedTests, success: report.success })), difference: null,
  };
  await writeFile(root+'results/'+id+'-'+result.runId+'.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
}
console.log('Recorded '+rows.length+' bounded requirements from '+reports.map(report => report.numPassedTests).join('/')+' passed source/built tests; native not executed.');
