import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const receiptPath = path.resolve('.scratch/mv-native-support-audit/probes/containers/new-empty-map-receipt.json');
const original = JSON.parse(await fs.readFile(receiptPath, 'utf8'));
const testCase = original.cases.find(value => value.route === 'dist' && value.shape === 'empty-native');
const api = await import(pathToFileURL(testCase.entry).href);
const savedMap = JSON.parse(await fs.readFile(path.join(testCase.workspaceRoot, 'Game/data/Map002.json'), 'utf8'));
assert.deepEqual(savedMap.events, []);
const result = { node: process.version, platform: process.platform, workspaceRoot: testCase.workspaceRoot, events: savedMap.events };
try {
  await api.decompileWorkspace({ workspaceRoot: testCase.workspaceRoot });
  result.decompilePassed = true;
} catch (error) {
  result.decompilePassed = false;
  result.error = { name: error.name, message: error.message };
}
assert.equal(result.decompilePassed, false);
assert.match(result.error.message, /MV-MAP-EVENT-SHAPE/);
await fs.writeFile(path.resolve('.scratch/mv-native-support-audit/evidence/root-recheck-empty-map.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
