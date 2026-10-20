const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = 'C:/Users/Shuen/.codex/worktrees/mv-ticket-34/rpgmaker-event-dsl';
const evidence = path.join(root, '.scratch/complete-mv-events-implementation/evidence');
const indexPath = path.join(evidence, 'requirements.json');
const fixture = 'packages/rpgmaker-event-dsl/test/support/map-location-fixtures.ts';
const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, fixture))).digest('hex');
const names = [
  'round trips all Location modes through actual discovered sources, Check, Compile, Diff and real Push with all fifteen carriers',
  'rejects actual untyped Location sources at Check, Compile and Push without changing complete business state',
  'refuses native Location coordinate and unsupported exchange states before source publication while retaining every carrier',
];
const inputs = [
  'Independent literal numeric saved records for 30 Transfer, 6 Vehicle, 15 Event and 14 Location Info combinations, in both Map and Common carriers, plus a harmless actual source name edit.',
  'All four helpers and direct nodes evaluated from actual local-constant/spread/as-any source containing an extra own field, with complete business state retained.',
  'Independent native JSON contains negative-zero Transfer x or unsupported Event exchange padding 42, after an existing successful source publication.',
  'Final built Location product compared with E4/E6 shipped editor code facts and an independently bound R5 native game product pair; not executed by this DEV checkpoint.',
];
const expected = [
  'Actual Discovery/evaluation, Check, Compile, Diff and real Push preserve all independent numeric records and all fifteen complete project carriers; generated output includes all four mandatory owned carriers.',
  'Check, Compile and Push refuse all eight actual evaluated invalid source forms, preserving source, Project Root, Snapshot, generated output, manifest and Discovery.',
  'Decompile refuses precise native coordinate and unsupported padding diagnostics before source publication, preserving complete business state and every carrier.',
  'E4/E6 exact target and code evidence compared with final built output; actual hardened R5 game pair exercises direct/variables/exchange/query and controlled battle Transfer, with all physical protection gates. This requirement remains pending.',
];
const titles = ['Complete Location modes through actual Workspace installation', 'Reject evaluated untyped Location sources without changing business state', 'Reject native Location coordinates and unsupported exchange padding atomically', 'Pending final E4/E6 product comparison and R5 native game acceptance'];
const rows = titles.map((title, i) => ({
  id: `MV-S6-LOCATION-${String(i + 1).padStart(3, '0')}`, title,
  sources: [{path: '.scratch/complete-mv-events-implementation/issues/34-map-locations-and-location-info.md', section: '## Acceptance criteria'}, {path: '.scratch/complete-mv-events-implementation/complete-mv-events-implementation-spec.md', section: '### T3 — 夹具、索引和结果'}],
  dimensions: ['A1', 'A3', 'A5', 'A6', 'A7', 'A8'],
  classifications: i === 1 || i === 2 ? ['negative', 'boundary', 'combination'] : ['positive', 'boundary', 'combination'],
  sourceKind: i === 1 || i === 2 ? 'synthetic-rejection' : i === 3 ? 'game-observation' : 'synthetic-support',
  input: inputs[i], fixture: {path: fixture, sha256: hash}, expected: expected[i],
  ...(i < 3 ? {test: {path: 'packages/rpgmaker-event-dsl/test/map-locations-workspace.test.ts', name: names[i]}} : {review: {path: '.scratch/complete-mv-events-implementation/evidence/34-map-locations-dev-checkpoint.md', section: '## Pending native comparison and game acceptance'}}),
  nativeGroups: i === 3 ? ['E4', 'E6', 'R5'] : [],
  execution: {environment: i === 3 ? 'Pending Windows / Node22 final built Workspace and identified MV1.6.1 native game runtime' : 'Windows / Node22 source Workspace API; native not-executed', owner: i === 3 ? 'Codex finalization queue; pending' : 'Codex focused automated verification', layer: i === 3 ? 'Pending exact REA comparison and actual game product pair' : 'Actual public Workspace API and complete filesystem values'},
  slice: '34 / S6 focused DEV checkpoint', required: true,
}));
const original = fs.readFileSync(indexPath, 'utf8');
const before = JSON.parse(original);
if (before.requirements.length !== 286 || original.includes('MV-S6-LOCATION-001')) throw new Error('Unexpected original index');
const marker = /\r?\n  \]\r?\n}\r?\n?$/;
const tail = original.match(marker)?.[0];
if (!tail) throw new Error('Index tail missing');
const inserted = rows.map(row => JSON.stringify(row, null, 2).split('\n').map(line => `    ${line}`).join('\n')).join(',\n');
fs.writeFileSync(indexPath, original.slice(0, -tail.length) + ',\n' + inserted + tail);
const after = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
if (JSON.stringify(after.requirements.slice(0, 286)) !== JSON.stringify(before.requirements)) throw new Error('Historical rows changed');
const checklist = '\n\n## Ticket34 — focused Map Location development\n\n| Requirement | Case | Scope |\n| --- | --- | --- |\n' + rows.map(row => `| ${row.id} | ${row.title} | ${row.id.endsWith('004') ? 'Pending E4/E6/R5; not executed' : 'Synthetic source Workspace; native not executed'}; [record](34-map-locations-dev-checkpoint.md) |`).join('\n') + '\n';
fs.appendFileSync(path.join(evidence, 'README.md'), checklist);
console.log(JSON.stringify({old: before.requirements.length, current: after.requirements.length, fixtureHash: hash}));
