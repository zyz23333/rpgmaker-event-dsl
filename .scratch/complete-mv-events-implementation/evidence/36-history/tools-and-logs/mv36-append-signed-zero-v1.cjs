const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = 'C:/Users/Shuen/.codex/worktrees/mv-ticket-36/rpgmaker-event-dsl';
const evidence = path.join(root, '.scratch/complete-mv-events-implementation/evidence');
const indexPath = path.join(evidence, 'requirements.json');
const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
const originalRows = structuredClone(index.requirements);
assert.equal(originalRows.length, 260);
const fixturePath = 'packages/rpgmaker-event-dsl/test/fixtures/mv-evidence/map-parallax-negative-zero.json';
const fixtureBytes = fs.readFileSync(path.join(root, fixturePath));
const fixture = JSON.parse(fixtureBytes);
assert.equal(Object.is(fixture.events[1].pages[0].list[0].parameters[3], -0), true);
const id = 'MV-S6-MAP-APPEARANCE-007';
const title = 'preserves E284 signed zero through formal and known raw source, native Decompile, evaluation and real Push';
assert.equal(index.requirements.some(row => row.id === id), false);
index.requirements.push({
  id,
  title,
  sources: [
    {path: '.scratch/complete-mv-events/research/command-parameters/visual-map.md', section: '### E284'},
    {path: '.scratch/complete-mv-events/issues/13-native-value-domain-boundaries.md', section: '## Answer'},
    {path: '.scratch/complete-mv-events-implementation/issues/36-map-appearance-settings.md', section: '## Acceptance criteria'},
  ],
  dimensions: ['A2', 'A4', 'A5', 'A6', 'A7', 'A8'],
  classifications: ['positive', 'boundary', 'combination'],
  sourceKind: 'synthetic-support',
  input: 'Self-authored complete Map carrier with literal -0 and +0 in both E284 speed slots; explicit image None/asset and inactive loop configurations. Public helper plus independently edited untyped formal and recognized raw sources and native Decompile are each exercised.',
  fixture: {path: fixturePath, sha256: crypto.createHash('sha256').update(fixtureBytes).digest('hex')},
  expected: 'Keep each signed zero through actual Discovery/evaluation, Check, Compile, complete carrier output, Diff and real Push; preserve inactive speed values without broadening any enum or ID domain.',
  test: {path: 'packages/rpgmaker-event-dsl/test/map-appearance-workspace.test.ts', name: `${id}: ${title}`},
  nativeGroups: [],
  execution: {environment: 'Windows / Node22 source and actual built Workspace API', owner: 'Codex automated verification', layer: 'Public helpers and actual Workspace native/source/filesystem boundary'},
  slice: '36 / S6',
  required: true,
});
assert.deepEqual(index.requirements.slice(0, originalRows.length), originalRows);
fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`);
fs.appendFileSync(path.join(evidence, 'README.md'), `\n| Requirement | Obligation | Evidence kind | Required layer |\n| --- | --- | --- | --- |\n| ${id} | ${title} | synthetic-support | Public source/built Workspace; literal signed-zero carrier and Object.is assertions |\n`);
process.stdout.write(JSON.stringify({requirements: index.requirements.length, priorRowsPreserved: true, fixtureSha256: index.requirements.at(-1).fixture.sha256})+'\n');
