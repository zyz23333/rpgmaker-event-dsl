const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const root = 'C:/Users/Shuen/.codex/worktrees/mv-ticket-32/rpgmaker-event-dsl';
const relative = '.scratch/complete-mv-events-implementation/evidence/requirements.json';
const index = JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const previous = JSON.parse(cp.execFileSync('git', ['show', `c2a40a41c094ccdda47faccd4399891952739008:${relative}`], { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }));
if (previous.requirements.length !== 286 || JSON.stringify(previous.requirements) !== JSON.stringify(index.requirements)) throw Error('Inherited requirements changed or own rows already appended');
const fixture = 'packages/rpgmaker-event-dsl/test/fixtures/mv-evidence/inventory-party.json';
const fixtureHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, fixture))).digest('hex');
const cases = [
 ['001', 'Complete native quantity mode and independent flag matrix through actual Workspace publication', 'MV-S6-INVENTORY-001: evaluates the complete native mode and inactive flag matrix and performs a real harmless Push', 'synthetic-support', ['A2','A4','A5','A7','A8']],
 ['002', 'Local const helper and direct node unknown fields fail without changing business state', 'MV-S6-INVENTORY-002: $helper $mode refuses source local const extra fields before publication', 'synthetic-rejection', ['A2','A5','A6','A8']],
 ['003', 'Native invalid saved slots fail before source publication including categorical negative zero', 'MV-S6-INVENTORY-003: E$code rejects native invalid saved input before source publication', 'synthetic-rejection', ['A2','A5','A6','A8']],
 ['004', 'Native fixed references must exist in their real project category before takeover', 'MV-S6-INVENTORY-004: E$code rejects missing fixed project references before source publication', 'synthetic-rejection', ['A2','A4','A5','A8']],
 ['005', 'Formal helpers, direct nodes, native and recognized raw share complete inventory and party domains', 'inventory quantities and inactive flags reconstruct their independently specified native records', 'synthetic-support', ['A2','A4','A6']],
];
for (const [id, title, name, sourceKind, dimensions] of cases) index.requirements.push({
  id: `MV-S6-INVENTORY-${id}`, title,
  sources: [
    { path: '.scratch/complete-mv-events-implementation/complete-mv-events-implementation-spec.md', section: '### I4 — 参数覆盖与结构化命令' },
    { path: '.scratch/complete-mv-events/research/command-parameters/core.md', section: '### E125 — Change Gold' },
    { path: '.scratch/complete-mv-events-implementation/issues/32-inventory-and-party-changes.md', section: '## Acceptance criteria' },
  ],
  dimensions, classifications: ['positive','negative','boundary','combination'], sourceKind,
  input: 'Self-authored independent E125–E129 literals: both operations and quantity modes; all equipment/initialization boolean saved combinations; 1/max constant boundaries; unnamed variable slot3; owned extras, invalid native slots and missing references.',
  fixture: { path: fixture, sha256: fixtureHash },
  expected: 'Complete native saved values and all15 project carriers preserve exact inactive flags and explicit mode references. Invalid inputs refuse with located diagnostics and preserve source, Discovery, Project Root, Snapshot, generated and manifest.',
  test: { path: `packages/rpgmaker-event-dsl/test/inventory-party${id === '005' ? '' : '-workspace'}.test.ts`, name },
  nativeGroups: [], execution: { environment: 'Windows / Node22; synthetic fixtures; native not executed', owner: 'Automated test runner', layer: id === '005' ? 'Public command compiler/decompiler and validation seams' : 'Actual public Workspace API and filesystem' },
  slice: '32 / S6 focused DEV; final acceptance pending', required: true,
});
index.requirements.push({
  id: 'MV-S6-INVENTORY-006', title: 'Same-identity E4 reverse-engineering product comparison and actual R4 inventory/party execution',
  sources: [{ path: '.scratch/complete-mv-events-implementation/issues/32-inventory-and-party-changes.md', section: '## Scope' }],
  dimensions: ['A2','A4','A5'], classifications: ['positive','boundary','combination'], sourceKind: 'game-observation',
  input: 'Final built product and independent native contexts with variable zero/negative quantities, runtime caps, insufficient stock/equipped loss, inactive gain+true/remove+true saved flags, duplicate add and actor initialization.',
  fixture: { path: fixture, sha256: fixtureHash },
  expected: 'Actual isolated normal-Scene literal and compiled games agree with original native semantics; E4 shipped editor code paths and final product output compare separately. Not executed by focused DEV.',
  review: { path: '.scratch/complete-mv-events-implementation/evidence/32-inventory-party-dev.md', section: '## Pending E4/R4 acceptance' },
  nativeGroups: ['E4','R4'], execution: { environment: 'MV1.6.1 / identified NW.js; hardened physical independent data trees', owner: 'Finalization implementer after root serialized gate release', layer: 'REA/product comparison and actual game runtime' },
  slice: '32 / S6 final acceptance pending', required: true,
});
fs.writeFileSync(path.join(root, relative), `${JSON.stringify(index, null, 2)}\n`);
const readme = path.join(root, '.scratch/complete-mv-events-implementation/evidence/README.md');
fs.appendFileSync(readme, '\n\n| Requirement | Case | Scope |\n| --- | --- | --- |\n' + [...cases.map(([id,title]) => `| MV-S6-INVENTORY-${id} | ${title} | Synthetic focused DEV; native:not-executed |`), '| MV-S6-INVENTORY-006 | Same-identity E4/product comparison and actual R4 execution | Pending; [DEV record](32-inventory-party-dev.md#pending-e4r4-acceptance) |'].join('\n') + '\n');
console.log(JSON.stringify({ inherited: previous.requirements.length, appended: 6, total: index.requirements.length, fixtureHash }));
