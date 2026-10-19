// Original local acceptance recorder. Run from the repository after the four game runs.
import { deepStrictEqual } from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
const evidence = '.scratch/complete-mv-events-implementation/evidence/';
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const records = (await readdir('test-results/mv-evidence')).filter((name) => name.startsWith('MV-S3-SLOTS-001-')).sort();
const sourceRun = await readJson('test-results/mv-evidence/' + records.at(-1));
if (sourceRun.status !== 'passed') throw new Error('Latest Workspace evidence is not passing');
const expected = await readJson(evidence + '11-switch-expected.json');
const compiled = await readJson(evidence + '11-switch-final-compiled.json');
const fixture = await readJson('packages/rpgmaker-event-dsl/test/fixtures/mv-evidence/system-slots-project.json');
deepStrictEqual(compiled[1], fixture.projectFiles['CommonEvents.json'][1]);
const artifacts = ['11-switch-observer.js', '11-switch-expected.json', '11-switch-final-compiled.json', '11-switch-final-provenance.json', '11-record-native-result.mjs'];
const actual = {};
for (const origin of ['literal-control', 'compiled-workspace']) {
  for (const mode of ['direct', 'common-call']) {
    const name = '11-final-' + origin + '-' + mode + '.json';
    artifacts.push(name);
    const run = await readJson(evidence + name);
    if (!run.passed || run.engine !== '1.6.1') throw new Error('Native failure: ' + name);
    deepStrictEqual(run.input, origin === 'literal-control' ? fixture.projectFiles['CommonEvents.json'][1].list : compiled[1].list);
    deepStrictEqual(run.actual, mode === 'direct' ? expected : { ...expected, steps: [] });
    actual[origin + '/' + mode] = run;
  }
}
deepStrictEqual(actual['literal-control/direct'].actual, actual['compiled-workspace/direct'].actual);
deepStrictEqual(actual['literal-control/common-call'].actual, actual['compiled-workspace/common-call'].actual);
const nativeArtifacts = await Promise.all(artifacts.map(async (name) => ({ path: evidence + name, sha256: digest(await readFile(evidence + name)) })));
for (const name of ['game.exe', 'nw.dll', 'node.dll']) {
  const path = 'F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/nwjs-win-test/' + name;
  nativeArtifacts.push({ path, sha256: digest(await readFile(path)) });
}
const sourceFiles = [...sourceRun.source.files, ...nativeArtifacts.filter(({ path }) => path.startsWith(evidence))].sort((left, right) => left.path.localeCompare(right.path));
const nativeRun = actual['compiled-workspace/direct'];
const result = {
  ...sourceRun,
  requirementId: 'MV-R1-SWITCH-011',
  runId: new Date().toISOString().replaceAll(/[:.]/g, '-') + '-' + randomUUID(),
  startedAt: Object.values(actual).map(({ timestamp }) => timestamp).sort()[0],
  completedAt: new Date().toISOString(),
  operator: 'Codex ticket11 implementer /root/ticket_02',
  source: { revision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), fingerprint: digest(JSON.stringify(sourceFiles)), files: sourceFiles },
  fixture: nativeArtifacts.find(({ path }) => path.endsWith('/11-switch-expected.json')),
  environment: { ...sourceRun.environment, native: {
    method: 'game', mv: nativeRun.engine,
    runtime: 'Chromium ' + nativeRun.versions.chromium + '; embedded Node ' + nativeRun.versions.node,
    nwjs: nativeRun.versions.nw,
    tools: { launcher: 'PowerShell 7.4.14 Start-Process -WindowStyle Hidden', observer: 'Original ES5 observer using native Game_Interpreter methods', recorder: 'Node ' + process.version },
    artifacts: nativeArtifacts,
  } },
  stages: ['fresh boot x4 and native Scene_Map', 'independent literal and actual compiled inputs checked', '11 direct per-command states each', 'native117 Common Event caller inheritance', 'complete independent state comparison and cross-input equality'],
  expected: { direct: expected, commonCall: { ...expected, steps: [] } }, actual, difference: null,
};
await writeFile(evidence + 'results/' + result.requirementId + '-' + result.runId + '.json', JSON.stringify(result, null, 2) + '\n');
console.log('Recorded passing ' + result.requirementId + ' from actual game output');
