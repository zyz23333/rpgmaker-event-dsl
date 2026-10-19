'use strict';
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = 'C:/Users/Shuen/.codex/worktrees/mv-ticket-33/rpgmaker-event-dsl';
const primary = 'F:/Shuen/RPG/rpgmaker-event-dsl';
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const output = path.join(__dirname, 'mv33-editor-resources-v1-' + crypto.randomUUID());
fs.mkdirSync(output);
const target = path.join(primary, 'references/RPGMV/RPGMV.exe');
const bytes = fs.readFileSync(target);
assert.equal(bytes.length, 19595264);
assert.equal(sha(bytes), '1b7d685fd302505b104f51cc539e2d6c997b5164d4a6a55e745283536503d281');
const records = new Map();
for (const source of ['.scratch/complete-mv-events/research/command-parameters/movement.md', '.scratch/complete-mv-events/research/command-parameters/shared-controls.md']) {
  for (const line of fs.readFileSync(path.join(root, source), 'utf8').split(/\r?\n/u)) {
    const match = /^\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(plain|zlib)\s*\|\s*(\d+)\s*\|\s*`([a-f0-9]{64})`\s*\|/u.exec(line);
    if (match) records.set(Number(match[1]), { offset: Number(match[1]), stored: Number(match[2]), compressed: match[3] === 'zlib', decoded: Number(match[4]), sha256: match[5], sources: [source] });
  }
}
for (const name of ['04-resource-identities.json', '09-resource-identities.json']) {
  const source = '.scratch/complete-mv-events-implementation/evidence/' + name;
  const identity = JSON.parse(fs.readFileSync(path.join(root, source), 'utf8'));
  assert.equal(identity.artifacts[0].sha256, sha(bytes));
  for (const old of identity.artifacts[0].records) {
    const candidate = { offset: old.offset, stored: old.stored, compressed: old.compressed ?? old.encoding === 'zlib', decoded: old.decoded ?? old.decodedBytes, sha256: old.sha256, sources: [source] };
    const previous = records.get(candidate.offset);
    if (previous) {
      for (const field of ['stored', 'compressed', 'decoded', 'sha256']) assert.deepEqual(previous[field], candidate[field]);
      previous.sources.push(source);
    } else records.set(candidate.offset, candidate);
  }
}
const actual = [];
for (const record of [...records.values()].sort((a, b) => a.offset - b.offset)) {
  assert.equal(bytes.readUInt32BE(record.offset), record.stored - 4);
  const stored = bytes.subarray(record.offset, record.offset + record.stored);
  let decoded = stored.subarray(4);
  if (record.compressed) {
    const inflated = zlib.inflateSync(decoded.subarray(4), { info: true });
    assert.equal(inflated.buffer.length, decoded.readUInt32BE(0));
    assert.equal(inflated.engine.bytesWritten, record.stored - 8);
    decoded = inflated.buffer;
  }
  assert.equal(decoded.length, record.decoded);
  assert.equal(sha(decoded), record.sha256);
  fs.writeFileSync(path.join(output, record.offset + '.qml.txt'), decoded, { flag: 'wx' });
  actual.push({ ...record, storedSha256: sha(stored), verified: true });
}
const result = { purpose: 'Ticket33 E3/E5 exact shipped identities, not UI execution', at: new Date().toISOString(), node: process.version, target: { path: target, bytes: bytes.length, sha256: sha(bytes) }, reusedVersionEvidence: 'ev_007ba386e622855bf771049084c3103afebbcc6b5d813f18c441f3ecf1d16d24', method: 'Read-only identified fs/zlib/crypto resource boundary and decoded identity comparison; no target execution or fabricated REA Evidence ID', records: actual, rawLocalDirectory: output, passed: actual.every(row => row.verified === true), editorUi: 'not-executed', parameterReconfirmation: 'not-executed' };
fs.writeFileSync(path.join(output, 'audit.json'), JSON.stringify(result, null, 2), { flag: 'wx' });
fs.writeFileSync(path.join(__dirname, 'mv33-editor-resources-latest-v1.json'), JSON.stringify({ output, audit: path.join(output, 'audit.json'), sha256: sha(JSON.stringify(result, null, 2)), count: actual.length, passed: result.passed }, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ output, count: actual.length, passed: result.passed }));
