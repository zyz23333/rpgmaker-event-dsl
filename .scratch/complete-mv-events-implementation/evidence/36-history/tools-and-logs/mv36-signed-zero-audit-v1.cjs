const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = 'C:/Users/Shuen/.codex/worktrees/mv-ticket-36/rpgmaker-event-dsl';
const evidenceRel = '.scratch/complete-mv-events-implementation/evidence';
const evidence = path.join(root, evidenceRel);
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const git = args => cp.execFileSync('git', args, {cwd: root});
const before = JSON.parse(git(['show', `HEAD:${evidenceRel}/requirements.json`]));
const after = JSON.parse(fs.readFileSync(path.join(evidence, 'requirements.json')));
assert.equal(before.requirements.length, 260);
assert.equal(after.requirements.length, 261);
assert.deepEqual(after.requirements.slice(0, 260), before.requirements);
const existing = git(['ls-tree', '-r', '--name-only', 'HEAD', `${evidenceRel}/results`, `${evidenceRel}/history`]).toString().trim().split(/\r?\n/).filter(Boolean);
const preserved = existing.map(file => {
  const captured = git(['show', `HEAD:${file}`]);
  const current = fs.readFileSync(path.join(root, file));
  assert.deepEqual(current, captured, file);
  return {path: file, sha256: sha(current)};
});
const dirs = [
  'C:/Users/Shuen/.codex/tmp/mv36-signed-zero-red-v1-results',
  'C:/Users/Shuen/.codex/tmp/mv36-signed-zero-red-v2-results',
  'C:/Users/Shuen/.codex/tmp/mv36-signed-zero-green-v1-results',
];
const appended = [];
for (const dir of dirs) for (const name of fs.readdirSync(dir)) {
  const source = path.join(dir, name);
  const target = path.join(evidence, 'results', name);
  const bytes = fs.readFileSync(source);
  const result = JSON.parse(bytes);
  assert.equal(['MV-S6-MAP-APPEARANCE-005', 'MV-S6-MAP-APPEARANCE-007'].includes(result.requirementId), true);
  fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
  assert.deepEqual(fs.readFileSync(target), bytes);
  appended.push({source, target, sha256: sha(bytes), requirementId: result.requirementId, status: result.status, sourceFingerprint: result.source.fingerprint});
}
assert.equal(appended.length, 4);
assert.equal(appended.filter(result => result.status === 'failed').length, 2);
assert.equal(appended.filter(result => result.status === 'passed').length, 2);
const report = {formatVersion: 1, time: new Date().toISOString(), revision: git(['rev-parse','HEAD']).toString().trim(), dirtyStatus: git(['status','--short']).toString(), originalRequirementRows:260, appendedRequirementRows:1, priorRequirementRowsDeepEqual:true, preservedHistoricalFiles:preserved, appended};
const output = 'C:/Users/Shuen/.codex/tmp/mv36-signed-zero-audit-v1.json';
fs.writeFileSync(output, JSON.stringify(report,null,2)+'\n', {flag:'wx'});
process.stdout.write(JSON.stringify({output, sha256:sha(fs.readFileSync(output)), originalRows:260, newRows:261, preservedHistoricalFiles:preserved.length, appendedResults:appended.length, failedResults:2, passedResults:2})+'\n');
