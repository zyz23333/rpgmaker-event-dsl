const fs = require('node:fs');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = 'M:/Shuen/Codex/mv-events-implementation-20261020/worktrees/mv-ticket-26-final';
const out = 'M:/Shuen/Codex/mv-events-implementation-20261020/ticket26-final';
const old = 'f27ee63f95f65b59a738460615c95b9afdf53e60';
const actual = '888b95019192806b88c73d7804f0662e4cce7e8b';
function git(...args) { return cp.execFileSync('git', ['-C', root, ...args], {maxBuffer: 16 * 1024 * 1024}); }
function sha(b) { return crypto.createHash('sha256').update(b).digest('hex'); }
const prefix = '.scratch/complete-mv-events-implementation/evidence/';
const base = git('merge-base', old, actual).toString().trim();
const file = prefix + 'requirements.json';
const oldRaw = git('show', old + ':' + file);
const currentRaw = git('show', actual + ':' + file);
const baseRaw = git('show', base + ':' + file);
fs.writeFileSync(out + '/requirements-dev-original.json', oldRaw);
fs.writeFileSync(out + '/requirements-actual888b950-original.json', currentRaw);
const oldDoc = JSON.parse(oldRaw), current = JSON.parse(currentRaw), ancestor = JSON.parse(baseRaw);
assert.deepEqual(oldDoc.requirements.slice(0, ancestor.requirements.length), ancestor.requirements);
assert.deepEqual(current.requirements.slice(0, ancestor.requirements.length), ancestor.requirements);
const ids = new Map(current.requirements.map(r => [r.id, r]));
const ownAdded = [];
for (const r of oldDoc.requirements) {
  if (ids.has(r.id)) assert.deepEqual(ids.get(r.id), r);
  else { current.requirements.push(r); ids.set(r.id, r); ownAdded.push(r.id); }
}
assert.deepEqual(current.requirements.slice(0, JSON.parse(currentRaw).requirements.length), JSON.parse(currentRaw).requirements);
fs.writeFileSync(root + '/' + file, JSON.stringify(current, null, 2) + '\n');
const readme = prefix + 'README.md';
const baseReadme = git('show', base + ':' + readme);
const ownReadme = git('show', old + ':' + readme);
const actualReadme = git('show', actual + ':' + readme);
assert(ownReadme.subarray(0, baseReadme.length).equals(baseReadme));
assert(actualReadme.subarray(0, baseReadme.length).equals(baseReadme));
fs.writeFileSync(root + '/' + readme, Buffer.concat([actualReadme, ownReadme.subarray(baseReadme.length)]));
const attrs = git('show', actual + ':.gitattributes').toString();
assert(!attrs.includes('26-history'));
fs.writeFileSync(root + '/.gitattributes', attrs + '\n# Preserve exact original Ticket26 focused-run captures and provenance hashes.\n/.scratch/complete-mv-events-implementation/evidence/26-history/** -text -whitespace\n');
const dslPath = root + '/packages/rpgmaker-event-dsl/src/validation/dsl-command-inputs.ts';
let dsl = fs.readFileSync(dslPath, 'utf8');
dsl = dsl.replace(/<<<<<<< HEAD\r?\n[\s\S]*?>>>>>>> 888b95019192806b88c73d7804f0662e4cce7e8b\r?\n/u, '        dslPath: path + (nativePath?.replace(/^list\\[0\\]/u, "") ?? ""),\n');
assert(!dsl.includes('<<<<<<<'));
fs.writeFileSync(dslPath, dsl);
const nativePath = root + '/packages/rpgmaker-event-dsl/src/validation/native-parameters.ts';
let native = fs.readFileSync(nativePath, 'utf8');
native = native.replace(/<<<<<<< HEAD\r?\n[\s\S]*?>>>>>>> 888b95019192806b88c73d7804f0662e4cce7e8b\r?\n/u, 'import {\n  assertNativeSwitchCommand,\n  assertNativeTimerParameters,\n} from "../commands/variables/validation.js";\nimport { assertNativeMapAppearanceParameters } from "../commands/map/native-validation.js";\n');
native = native.replace(/<<<<<<< HEAD\r?\n[\s\S]*?>>>>>>> 888b95019192806b88c73d7804f0662e4cce7e8b\r?\n/u, '  if (code === 124) {\n    assertNativeTimerParameters(parameters, path);\n    return;\n  }\n  assertNativeMapAppearanceParameters(code, parameters, path);\n');
assert(!native.includes('<<<<<<<'));
fs.writeFileSync(nativePath, native);
const audit = {at: new Date().toISOString(), base, old, actual, ancestorCount: ancestor.requirements.length, ownCount: oldDoc.requirements.length, incomingCount: JSON.parse(currentRaw).requirements.length, mergedCount: current.requirements.length, ownAdded, originalRequirements: {old:sha(oldRaw),actual:sha(currentRaw)}, incomingRowsDeepEqual:true, oldRowsRetainedDeepEqual:true, actualReadmePrefixExact:true, ownReadmeAppendExact:true, noHistoryBlobEdits:true};
fs.writeFileSync(out + '/merge-reconciliation-v1.json', JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify(audit,null,2));
