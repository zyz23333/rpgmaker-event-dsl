const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const root = 'C:/Users/Shuen/.codex/worktrees/mv-ticket-32/rpgmaker-event-dsl';
const evidence = '.scratch/complete-mv-events-implementation/evidence';
const audit = JSON.parse(fs.readFileSync(path.join(root, evidence, '32-inventory-party-history-audit.json')));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const staged = file => cp.execFileSync('git', ['show', ':' + file], {cwd: root, maxBuffer: 32 * 1024 * 1024});
for (const result of audit.copied) assert.equal(hash(staged(result.path)), result.sha256, result.path);
let tools = 0;
for (const name of ['archive-manifest.json', 'archive-manifest-v2.json']) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, evidence, '32-dev-tools', name)));
  for (const file of manifest.files) {
    assert.equal(hash(staged(`${evidence}/32-dev-tools/${file.file}`)), file.sha256, file.file);
    tools++;
  }
}
const freeze = JSON.parse(fs.readFileSync(path.join(audit.finalSourceFreeze, 'manifest.json')));
for (const file of freeze.files) assert.equal(hash(staged(file.path)), file.sha256, file.path);
console.log(JSON.stringify({stagedResultsExact: audit.copied.length, stagedOriginalToolsAndLogsExact: tools, stagedCapturedInputsExact: freeze.files.length, stagedProductSourceExact: freeze.productFiles.length, productSourceFingerprint: audit.productSourceFingerprint, capturedFingerprint: audit.finalCapturedSourceFingerprint}, null, 2));
