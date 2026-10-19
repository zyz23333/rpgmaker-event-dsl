'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
(async () => {
  const source = __dirname;
  const root = path.join(source, 'mv33-checkpoint-preserved-' + crypto.randomUUID());
  await fs.mkdir(root);
  const inputs = (await fs.readdir(source, { withFileTypes: true })).filter(item => item.isFile() && item.name.startsWith('mv33-')).map(item => path.join(source, item.name));
  const results = 'C:/Users/Shuen/.codex/worktrees/mv-ticket-33/rpgmaker-event-dsl/test-results/mv-evidence';
  for (const item of await fs.readdir(results)) if (item.endsWith('.json')) inputs.push(path.join(results, item));
  const entries = [];
  for (const original of inputs) {
    const bytes = await fs.readFile(original), stat = await fs.stat(original);
    const destination = path.join(root, original.startsWith(results) ? 'indexed-source-results' : 'original-tools-and-logs', path.basename(original));
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, bytes, { flag: 'wx' });
    assert.equal(sha(await fs.readFile(destination)), sha(bytes));
    entries.push({ original, preserved: destination, bytes: bytes.length, sha256: sha(bytes), originalModifiedAt: stat.mtime.toISOString() });
  }
  await fs.writeFile(path.join(root, 'manifest.json'), JSON.stringify({ purpose: 'Clean ticket33 checkpoint preservation before25integration; no build/native product acceptance', revision: '5aec79a581dda64ebdc8062ae5661c5abcf0262c', at: new Date().toISOString(), entries }, null, 2), { flag: 'wx' });
  console.log(JSON.stringify({ root, entries: entries.length, resultRecords: inputs.filter(input => input.startsWith(results)).length }));
})().catch(error => { console.error(error); process.exitCode = 1; });
