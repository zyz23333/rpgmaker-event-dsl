import { readFile, writeFile, mkdir, cp, symlink, readdir, mkdtemp } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { pathToFileURL, fileURLToPath } from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const repo = fileURLToPath(new URL('../../../../', import.meta.url));
const output = resolve(repo, '.scratch/mv-native-support-audit/probes/containers');
const decoded = 'C:/Users/Shuen/.codex/tmp/mv-native-support-audit-20261020/editor';
const sha = (b: string | Buffer) => createHash('sha256').update(b).digest('hex');
const templateSource = await readFile(join(decoded, '346222.js'), 'utf8');
const mapTree = await readFile(join(decoded, '8672102.qml'), 'utf8');
const dataManager = await readFile(join(decoded, '909009.qml'), 'utf8');
function functionText(text: string, name: string, next: string) {
  const start = text.indexOf(`    function ${name}(`);
  const end = text.indexOf(`    function ${next}(`, start);
  assert(start >= 0 && end > start);
  return text.slice(start, end).trim();
}
const allocate = functionText(mapTree, 'allocateMapData', 'resizeMap');
const stringifyDatabase = functionText(dataManager, 'stringifyDatabase', 'sortObjectKeys');
const stringifyMap = functionText(dataManager, 'stringifyMap', 'removeDataFile');
const mapTemplate = templateSource.match(/^var Map = '(.*)';$/m)![1];
const nativeMap = JSON.parse(mapTemplate);
const sandbox: Record<string, unknown> = { map: nativeMap };
// Execute these exact extracted JavaScript function bodies in isolation. This is
// not a claim of launching QML, observing Qt signals, or observing editor disk I/O.
vm.runInNewContext(`${allocate}\n${stringifyDatabase}\n${stringifyMap}\nallocateMapData(map); saved = stringifyMap(map);`, sandbox);
const savedMap = String(sandbox.saved);
assert.deepEqual(JSON.parse(savedMap).events, []);
assert.equal(JSON.parse(savedMap).data.length, 6 * 17 * 13);
await writeFile(join(output, 'first-party-new-map.json'), savedMap);

async function tree(root: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const e of await readdir(root, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'operation.lock') continue;
    const p = join(root, e.name);
    if (e.isDirectory()) for (const [k, h] of Object.entries(await tree(p))) result[`${e.name}/${k}`] = h;
    else result[e.name] = sha(await readFile(p));
  }
  return result;
}
const base = await mkdtemp(join(tmpdir(), 'mv-empty-map-audit-'));
const receipt: any = {
  startedAt: new Date().toISOString(), node: process.version, platform: process.platform,
  repo, base, source: {
    targetSha256: sha(await readFile(resolve(repo, 'references/RPGMV/RPGMV.exe'))),
    template: { offset: 346222, sha256: sha(templateSource) },
    mapTree: { offset: 8672102, sha256: sha(mapTree), allocateFunctionSha256: sha(allocate) },
    dataManager: { offset: 909009, sha256: sha(dataManager), stringifyDatabaseSha256: sha(stringifyDatabase), stringifyMapSha256: sha(stringifyMap) },
    savedMapSha256: sha(savedMap),
  }, cases: []
};
await writeFile(join(output, 'new-empty-map-receipt.json'), JSON.stringify(receipt, null, 2));
for (const route of ['src', 'dist']) {
  const entry = resolve(repo, `packages/rpgmaker-event-dsl/${route}/${route === 'src' ? 'workspace-api.ts' : 'workspace-api.mjs'}`);
  const api = await import(pathToFileURL(entry).href);
  for (const shape of ['empty-native', 'null-control']) {
    const workspaceRoot = join(base, `${route}-${shape}`);
    const game = join(workspaceRoot, 'Game');
    await mkdir(game, { recursive: true });
    await cp(resolve(repo, 'references/RPGMV/NewData/data'), join(game, 'data'), { recursive: true });
    await writeFile(join(game, 'Game.rpgproject'), 'RPGMV 1.6.1\n');
    await writeFile(join(workspaceRoot, 'package.json'), '{"type":"module"}\n');
    const pkg = join(workspaceRoot, 'node_modules/rpgmaker-event-dsl');
    await mkdir(pkg, { recursive: true });
    await writeFile(join(pkg, 'package.json'), JSON.stringify({ name: 'rpgmaker-event-dsl', type: 'module', exports: { '.': { types: route === 'src' ? './src/index.ts' : './dist/index.d.mts' } } }));
    await symlink(resolve(repo, `packages/rpgmaker-event-dsl/${route}`), join(pkg, route), 'junction');
    const infos = JSON.parse(await readFile(join(game, 'data/MapInfos.json'), 'utf8'));
    infos[2] = { ...infos[1], id: 2, name: 'New blank native Map', order: 2 };
    await writeFile(join(game, 'data/MapInfos.json'), JSON.stringify(infos));
    const map2 = JSON.parse(savedMap);
    if (shape === 'null-control') map2.events = [null];
    await writeFile(join(game, 'data/Map002.json'), JSON.stringify(map2));
    await api.initWorkspace({ workspaceRoot, projectRoot: './Game' });
    await api.cloneWorkspace({ workspaceRoot });
    const before = await tree(workspaceRoot);
    const rec: any = { route, shape, workspaceRoot, entry, entrySha256: sha(await readFile(entry)), operations: [] };
    try {
      const result = await api.decompileWorkspace({ workspaceRoot });
      rec.operations.push({ stage: 'decompile', ok: true, result });
      await api.compileWorkspace({ workspaceRoot, check: true });
      rec.operations.push({ stage: 'compile-check', ok: true });
      await api.compileWorkspace({ workspaceRoot, check: false });
      rec.operations.push({ stage: 'compile', ok: true });
      const diff = await api.diffWorkspace({ workspaceRoot, short: true });
      rec.operations.push({ stage: 'diff', ok: true, result: diff });
      await api.pushWorkspace({ workspaceRoot, allowDestructive: false });
      rec.operations.push({ stage: 'push', ok: true });
      assert.deepEqual(JSON.parse(await readFile(join(game, 'data/Map002.json'), 'utf8')), map2);
      rec.map2Exact = true;
    } catch (error) {
      rec.error = error instanceof Error ? { name: error.name, message: error.message } : String(error);
      const after = await tree(workspaceRoot);
      rec.allBusinessFilesUnchanged = JSON.stringify(before) === JSON.stringify(after);
      rec.changedFiles = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(k => before[k] !== after[k]);
    }
    receipt.cases.push(rec);
    await writeFile(join(output, 'new-empty-map-receipt.json'), JSON.stringify(receipt, null, 2));
  }
}
receipt.completedAt = new Date().toISOString();
await writeFile(join(output, 'new-empty-map-receipt.json'), JSON.stringify(receipt, null, 2));
console.log(JSON.stringify(receipt, null, 2));
