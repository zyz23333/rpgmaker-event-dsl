const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const root = 'C:/Users/Shuen/.codex/worktrees/mv-ticket-32/rpgmaker-event-dsl';
const base = 'c2a40a41c094ccdda47faccd4399891952739008';
const evidence = '.scratch/complete-mv-events-implementation/evidence';
const external = 'M:/Shuen/Codex/mv-events-implementation-20261020/ticket32-temp';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const git = args => cp.execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const beforeRaw = git(['show', `${base}:${evidence}/requirements.json`]);
const afterRaw = fs.readFileSync(path.join(root, evidence, 'requirements.json'), 'utf8');
const before = JSON.parse(beforeRaw).requirements;
const after = JSON.parse(afterRaw).requirements;
assert.deepEqual(after.slice(0, before.length), before);
assert.equal(before.length, 286);
assert.equal(after.length, 292);
assert(afterRaw.startsWith(beforeRaw.slice(0, beforeRaw.lastIndexOf('\n  ]'))));
const readmeBefore = git(['show', `${base}:${evidence}/README.md`]);
assert(fs.readFileSync(path.join(root, evidence, 'README.md'), 'utf8').startsWith(readmeBefore));
let historicalFiles = 0;
for (const line of git(['ls-tree', '-r', base, '--', evidence]).trim().split('\n')) {
  const match = /^\d+ blob ([a-f0-9]+)\t(.*)$/.exec(line);
  if (!match) throw Error(`Unexpected history row: ${line}`);
  const [, expected, file] = match;
  if ([`${evidence}/README.md`, `${evidence}/requirements.json`].includes(file)) continue;
  const bytes = fs.readFileSync(path.join(root, file));
  const actual = crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  assert.equal(actual, expected, `Changed inherited bytes: ${file}`);
  historicalFiles++;
}
const output = path.join(root, evidence, 'results/32-dev');
fs.mkdirSync(output, { recursive: true });
const copied = [];
const records = [];
for (const name of fs.readdirSync(path.join(external, 'results')).filter(name => name.endsWith('.json'))) {
  const bytes = fs.readFileSync(path.join(external, 'results', name));
  const result = JSON.parse(bytes);
  fs.writeFileSync(path.join(output, name), bytes);
  assert.equal(hash(fs.readFileSync(path.join(output, name))), hash(bytes));
  copied.push({ path: `${evidence}/results/32-dev/${name}`, sha256: hash(bytes), requirementId: result.requirementId, status: result.status, sourceFingerprint: result.source.fingerprint });
  records.push(result);
}
const latestOwn = records.filter(result => result.requirementId === 'MV-S6-INVENTORY-001').sort((a,b) => a.completedAt.localeCompare(b.completedAt)).at(-1);
assert(latestOwn && latestOwn.status === 'passed');
const freeze = path.join(external, 'source-freeze-' + crypto.randomUUID());
fs.mkdirSync(freeze);
for (const file of latestOwn.source.files) {
  const bytes = fs.readFileSync(path.join(root, file.path));
  assert.equal(hash(bytes), file.sha256, `Final captured input no longer matches: ${file.path}`);
  const target = path.join(freeze, file.path);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, bytes);
}
const product = latestOwn.source.files.filter(file => file.path.startsWith('packages/rpgmaker-event-dsl/src/'));
const sourceManifest = { base, dirtyStatus: git(['status', '--short']), capturedFingerprint: latestOwn.source.fingerprint, files: latestOwn.source.files, productSourceFingerprint: hash(JSON.stringify(product)), productFiles: product, dist: 'Not built by this focused DEV checkpoint; no native execution' };
fs.writeFileSync(path.join(freeze, 'manifest.json'), JSON.stringify(sourceManifest, null, 2) + '\n');
const summary = { base, inheritedRequirements: before.length, appendedRequirements: after.length - before.length, totalRequirements: after.length, inheritedRequirementObjectsExact: true, inheritedRequirementRawPrefixExact: true, readmeAppendOnly: true, historicalEvidenceFilesExact: historicalFiles, capturedFilesCopiedExact: copied.length, ownRecords: copied.filter(file => file.requirementId.startsWith('MV-S6-INVENTORY-')).length, statusCounts: copied.reduce((acc, file) => (acc[file.status] = (acc[file.status] || 0) + 1, acc), {}), copied, finalSourceFreeze: freeze.replaceAll('\\','/'), finalCapturedSourceFingerprint: latestOwn.source.fingerprint, productSourceFiles: product.length, productSourceFingerprint: sourceManifest.productSourceFingerprint, compileContract: fs.readFileSync(path.join(root, 'packages/rpgmaker-event-dsl/src/workspace/type-inputs.ts'), 'utf8').match(/mv-1\.6\.1\/\d+/)?.[0] };
fs.writeFileSync(path.join(root, evidence, '32-inventory-party-history-audit.json'), JSON.stringify(summary, null, 2) + '\n');
fs.writeFileSync(path.join(external, 'dev-audit-result.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({ ...summary, copied: `${copied.length} records, exact sha256 listed in durable audit` }, null, 2));
