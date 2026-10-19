// Actual product reproduction for future ticket22; no acceptance/closure claim.
const fs = require('node:fs/promises');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const packageRoot = 'C:/Users/Shuen/.codex/worktrees/mv-ticket-19/rpgmaker-event-dsl/packages/rpgmaker-event-dsl';
const root = path.join('C:/Users/Shuen/.codex/tmp', 'mv-partial-snapshot-recovery-preparation-' + crypto.randomUUID());
const workspaceRoot = path.join(root, 'Workspace');
const stateRoot = path.join(workspaceRoot, '.rpgmaker-event-dsl');
const game = path.join(workspaceRoot, 'Game');
const apiEntry = pathToFileURL(path.join(packageRoot, 'dist/workspace-api.mjs')).href;
const sha = content => crypto.createHash('sha256').update(content).digest('hex');
const report = { purpose: 'Preparation for ticket22: actual killed public Push at partial local Snapshot finalization, no ticket closure', startedAt: new Date().toISOString(), node: process.version, root, cases: [] };
const json = (file, value) => fs.writeFile(file, JSON.stringify(value, null, 2) + '\n');
async function files(directory) {
  const result = {};
  async function walk(current) {
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      const file = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (entry.isFile()) result[path.relative(directory, file).split(path.sep).join('/')] = sha(await fs.readFile(file));
    }
  }
  await walk(directory);
  return Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
}
async function observe() {
  return { source: await files(path.join(workspaceRoot, 'src')), project: await files(path.join(game, 'data')), snapshot: await files(path.join(stateRoot, 'project-data-snapshot')), generated: await files(path.join(stateRoot, 'generated-project-data')), manifest: sha(await fs.readFile(path.join(stateRoot, 'sync-manifest.json'))), pending: await files(path.join(stateRoot, 'pending-push')), config: sha(await fs.readFile(path.join(workspaceRoot, 'rpgmaker-event-dsl.config.json'))) };
}
(async () => {
  await fs.mkdir(path.join(game, 'data'), { recursive: true });
  await fs.writeFile(path.join(game, 'Game.rpgproject'), 'RPGMV 1.6.1\n');
  const fixture = JSON.parse(await fs.readFile(path.join(packageRoot, 'test/fixtures/mv-evidence/common-event-project.json'), 'utf8'));
  await json(path.join(root, 'independent-fixture.json'), fixture);
  for (const [name, value] of Object.entries(fixture.projectFiles)) await json(path.join(game, 'data', name), value);
  await json(path.join(workspaceRoot, 'package.json'), { type: 'module' });
  const localPackage = path.join(workspaceRoot, 'node_modules/rpgmaker-event-dsl');
  await fs.mkdir(localPackage, { recursive: true });
  await json(path.join(localPackage, 'package.json'), { name: 'rpgmaker-event-dsl', type: 'module', exports: { '.': { types: './dist/index.d.mts' } } });
  await fs.symlink(path.join(packageRoot, 'dist'), path.join(localPackage, 'dist'), 'junction');
  const api = await import(apiEntry);
  report.build = { packageRoot, apiEntry, apiSha256: sha(await fs.readFile(path.join(packageRoot, 'dist/workspace-api.mjs'))), gitHead: cp.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: packageRoot, encoding: 'utf8', windowsHide: true }).trim(), dist: await files(path.join(packageRoot, 'dist')), source: await files(path.join(packageRoot, 'src')) };
  await api.initWorkspace({ workspaceRoot, projectRoot: './Game' });
  await api.cloneWorkspace({ workspaceRoot });
  await api.decompileWorkspace({ workspaceRoot });
  for (const [name, before, after] of [['common-events.events.ts', 'Evidence Common Event', 'Changed Common Event'], ['system.dsl.ts', 'Saved switch', 'Changed switch']]) {
    const source = path.join(workspaceRoot, 'src/decompiled', name);
    const content = await fs.readFile(source, 'utf8');
    assert.ok(content.includes(before));
    await fs.writeFile(source, content.replace(before, after));
  }
  await api.compileWorkspace({ workspaceRoot, check: true });
  await api.compileWorkspace({ workspaceRoot, check: false });
  const commonGenerated = await fs.readFile(path.join(stateRoot, 'generated-project-data/CommonEvents.json'));
  const systemGenerated = await fs.readFile(path.join(stateRoot, 'generated-project-data/System.json'));
  const commonExpected = structuredClone(fixture.projectFiles['CommonEvents.json']); commonExpected[1].name = 'Changed Common Event';
  const systemExpected = structuredClone(fixture.projectFiles['System.json']); systemExpected.switches[1] = 'Changed switch';
  assert.deepEqual(JSON.parse(commonGenerated), commonExpected);
  assert.deepEqual(JSON.parse(systemGenerated), systemExpected);
  const originalSnapshot = await files(path.join(stateRoot, 'project-data-snapshot'));
  const originalManifest = sha(await fs.readFile(path.join(stateRoot, 'sync-manifest.json')));
  report.diff = await api.diffWorkspace({ workspaceRoot });
  const childFile = path.join(root, 'actual-push-child.mjs');
  await fs.writeFile(childFile, `import fs from 'node:fs/promises';
import {syncBuiltinESMExports} from 'node:module';
import {resolve} from 'node:path';
const options=JSON.parse(process.env.MV_PREPARATION);
const original=fs.writeFile;
fs.writeFile=async function(file,...args){
 const result=await original(file,...args);
 if(resolve(String(file))===options.stopAfterSnapshot){
  process.send({kind:'checkpoint',pid:process.pid,path:resolve(String(file)),phase:'after-real-snapshot-file-write'});
  await new Promise(()=>{process.on('message',()=>{});});
 }
 return result;
};
syncBuiltinESMExports();
const api=await import(options.apiEntry);
try{await api.pushWorkspace({workspaceRoot:options.workspaceRoot,allowDestructive:false});process.send({kind:'unexpected-completion'});process.disconnect();}
catch(error){process.send({kind:'error',message:error.message,stack:error.stack});process.disconnect();process.exitCode=1;}
`);
  const stdout = await fs.open(path.join(root, 'child-stdout.txt'), 'wx');
  const stderr = await fs.open(path.join(root, 'child-stderr.txt'), 'wx');
  const child = cp.fork(childFile, [], { env: { ...process.env, MV_PREPARATION: JSON.stringify({ apiEntry, workspaceRoot, stopAfterSnapshot: path.join(stateRoot, 'project-data-snapshot/CommonEvents.json') }) }, windowsHide: true, stdio: ['ignore', stdout.fd, stderr.fd, 'ipc'] });
  const checkpoint = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { child.kill(); reject(new Error('Checkpoint not reached')); }, 30000);
    child.on('message', message => { clearTimeout(timeout); message.kind === 'checkpoint' ? resolve(message) : reject(new Error(JSON.stringify(message))); });
    child.on('error', error => { clearTimeout(timeout); reject(error); });
  });
  const stopped = new Promise(resolve => child.once('exit', (exitCode, signal) => resolve({ exitCode, signal })));
  child.kill();
  report.interruption = { checkpoint, ...await stopped };
  await stdout.close(); await stderr.close();
  const beforeRetry = await observe();
  report.beforeRetry = beforeRetry;
  assert.equal(beforeRetry.project['CommonEvents.json'], sha(commonGenerated));
  assert.equal(beforeRetry.project['System.json'], sha(systemGenerated));
  assert.equal(beforeRetry.snapshot['CommonEvents.json'], sha(commonGenerated));
  assert.equal(beforeRetry.snapshot['System.json'], originalSnapshot['System.json']);
  assert.equal(beforeRetry.manifest, originalManifest);
  report.observedState = 'Both live affected files generated; only CommonEvents Snapshot refreshed; System Snapshot and manifest still original; complete pending retained';
  try { await api.pushWorkspace({ workspaceRoot, allowDestructive: false }); report.retry = { succeeded: true }; }
  catch (error) { report.retry = { succeeded: false, message: error.message, cause: error.cause?.message }; }
  const afterRetry = await observe();
  report.afterRetry = afterRetry;
  report.retryPreservedAllObservedState = JSON.stringify(beforeRetry) === JSON.stringify(afterRetry);
  report.expected = 'Future22 must verify original pending evidence, finish only local synchronization preserving old basis, retire pending, then continue ordinary checks';
  report.reproducedCurrentGap = !report.retry.succeeded && report.retryPreservedAllObservedState;
})().catch(error => { report.error = { message: error.message, stack: error.stack }; process.exitCode = 1; }).finally(async () => {
  report.completedAt = new Date().toISOString();
  await json(path.join(root, 'reproduction-result.json'), report);
  console.log(JSON.stringify({ root, observedState: report.observedState, interruption: report.interruption, retry: report.retry, retryPreservedAllObservedState: report.retryPreservedAllObservedState, reproducedCurrentGap: report.reproducedCurrentGap, error: report.error }, null, 2));
});
