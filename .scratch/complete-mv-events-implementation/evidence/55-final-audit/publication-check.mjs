import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
const base = 'M:/Shuen/Codex/mv-events-implementation-20261020';
const output = base + '/final55-audit';
const repo = base + '/worktrees/mv-docs-example-55';
const prefix = '.scratch/complete-mv-events-implementation/evidence/';
const directory = repo + '/' + prefix + '55-final-audit';
const startedAt = new Date().toISOString();
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const cache = new Map();
async function read(file) { const full = path.isAbsolute(file) ? file : path.join(repo, file); if (!cache.has(full)) cache.set(full, await fs.readFile(full)); return cache.get(full); }
async function json(file) { return JSON.parse(await read(file)); }
async function bound(ref) { assert.match(ref.sha256, /^[a-f0-9]{64}$/); assert.equal(hash(await read(ref.path)), ref.sha256, ref.path); }
async function main() {
  assert.match(process.version, /^v22\./);
  const { requirementsSchema, resultSchema } = await import(pathToFileURL(repo + '/packages/rpgmaker-event-dsl/test/support/mv-evidence.ts').href);
  const publication = await json(output + '/publication-receipt.json');
  const incoming = requirementsSchema.parse(await json(output + '/incoming-requirements-before55.json'));
  const index = requirementsSchema.parse(await json(prefix + 'requirements.json'));
  const matrix = await json(prefix + '55-final-audit/effective-matrix.json');
  const native = await json(prefix + '55-final-audit/native-obligations.json');
  assert.equal(index.requirements.length, incoming.requirements.length + 1);
  assert.equal(publication.totalRequirements, index.requirements.length);
  assert.equal(matrix.rows.length, incoming.requirements.length);
  assert.equal(matrix.counts.unresolved, 0); assert.equal(native.remaining.length, 0); assert.equal(native.rows.length, 34);
  assert.ok(native.rows.every(row => row.status === 'passed'));
  const incomingIds = incoming.requirements.map(row => row.id), currentIds = index.requirements.map(row => row.id);
  assert.equal(new Set(currentIds).size, currentIds.length);
  assert.deepStrictEqual(currentIds.slice(0, -1), incomingIds);
  assert.deepStrictEqual(matrix.rows.map(row => row.id), incomingIds);
  assert.ok(matrix.rows.every(row => row.status === 'passed'));
  const reviewIds = new Set(publication.modifiedReviewIds);
  assert.ok(reviewIds.size <= 34);
  for (const [number, old] of incoming.requirements.entries()) {
    const after = structuredClone(index.requirements[number]);
    if (reviewIds.has(old.id)) { assert.ok(old.review); assert.deepStrictEqual(after.review, { path: prefix + '55-final-audit.md', section: '## Native obligation audit' }); after.review = old.review; }
    assert.deepStrictEqual(after, old, old.id + ' accepted domain metadata changed');
    const projection = matrix.rows[number];
    for (const field of ['id','title','required','dimensions','nativeGroups','sourceKind']) assert.deepStrictEqual(projection[field], old[field], old.id + ':' + field);
  }
  assert.equal(index.requirements.at(-1).id, 'MV-S7-COMPLETION-AUDIT-055');
  const checklist = (await read(prefix + 'README.md')).toString('utf8');
  const listed = [...checklist.matchAll(/^\|\s*(MV-[A-Z0-9-]+)\s*\|/gmu)].map(match => match[1]);
  assert.equal(listed.length, currentIds.length); assert.deepStrictEqual([...listed].sort(), [...currentIds].sort());
  const changed = index.requirements.filter(row => reviewIds.has(row.id) || !incomingIds.includes(row.id));
  for (const requirement of changed) {
    for (const source of requirement.sources) assert.ok((await read(source.path)).toString('utf8').includes(source.section), source.path + ':' + source.section);
    await bound(requirement.fixture);
    if (requirement.review) { const review = (await read(requirement.review.path)).toString('utf8'); assert.ok(review.includes(requirement.review.section)); assert.ok(review.includes(requirement.id), requirement.id); }
    if (requirement.test) assert.ok((await read(requirement.test.path)).toString('utf8').includes(requirement.test.name));
  }
  for (const ref of matrix.receipts) await bound(ref);
  for (const ref of matrix.selectedCurrentEvidence) await bound(ref);
  await bound(publication.fixture);
  const results = [], runIds = new Set();
  for (const ref of publication.newResults) {
    await bound(ref); const result = resultSchema.parse(await json(ref.path));
    assert.equal(result.requirementId, ref.id); assert.equal(result.status, 'passed'); assert.ok(!runIds.has(result.runId)); runIds.add(result.runId);
    assert.ok(path.basename(ref.path) === result.requirementId + '-' + result.runId + '.json');
    assert.equal(result.source.fingerprint, hash(JSON.stringify(result.source.files)));
    for (const source of result.source.files) await bound(source);
    const requirement = index.requirements.find(row => row.id === ref.id); assert.ok(requirement); assert.deepStrictEqual(result.fixture, requirement.fixture);
    assert.deepStrictEqual(result.expected, requirement.expected); assert.equal(result.difference, null);
    assert.equal(result.actual.auditOnly, true); assert.equal(result.actual.newGameExecutions, 0); assert.equal(result.actual.newTestExecutions, 0);
    assert.equal(result.actual.candidate, '2dc639015f908de6fd524e50236e5422b5f8e990'); assert.equal(result.actual.compileContractVersion, 'mv-1.6.1/22');
    results.push({ requirementId: ref.id, path: ref.path, sha256: ref.sha256, schema: 'actual resultSchema passed', sourceFingerprint: result.source.fingerprint });
  }
  const resultExpected = new Set([...native.rows.map(row => row.id), ...matrix.automation.missingActorRecords.map(row => row.id), ...Object.keys(matrix.automation.replacements), 'MV-S7-COMPLETION-AUDIT-055']);
  assert.deepStrictEqual(results.map(row => row.requirementId).sort(), [...resultExpected].sort());
  assert.equal(results.length, 48);
  const files = execFileSync('git', ['-c','core.longpaths=true','diff','--name-only','HEAD'], {cwd:repo,encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
  assert.ok(files.every(file => file.startsWith(prefix) || file === '.scratch/complete-mv-events-implementation/issues/55-completion-evidence-audit.md' || file === '.scratch/complete-mv-events-implementation/tickets.md'));
  assert.ok(files.every(file => !file.startsWith(prefix + 'results/')), 'Existing result changed');
  const tree = execFileSync('git',['-c','core.longpaths=true','rev-parse','HEAD:packages/rpgmaker-event-dsl/src'],{cwd:repo,encoding:'utf8'}).trim();
  assert.equal(tree, 'b3129c0fc5814e35b71bd203ad48a40c813e5c63');
  const productDiff = execFileSync('git',['-c','core.longpaths=true','diff','--name-only','2dc639015f908de6fd524e50236e5422b5f8e990','HEAD','--','packages/rpgmaker-event-dsl'],{cwd:repo,encoding:'utf8'}).trim();
  assert.equal(productDiff, '');
  const manifest = await json(base + '/final48-candidate.json');
  for (const entry of manifest.dist.files) assert.equal(hash(await read('F:/Shuen/RPG/rpgmaker-event-dsl/packages/rpgmaker-event-dsl/dist/' + entry.path)), entry.sha256);
  const issue = (await read('.scratch/complete-mv-events-implementation/issues/55-completion-evidence-audit.md')).toString('utf8');
  assert.ok(issue.includes('Status: resolved')); assert.ok(!issue.includes('- [ ]'));
  const tickets = (await read('.scratch/complete-mv-events-implementation/tickets.md')).toString('utf8'); assert.ok(tickets.includes('### 2026-10-20 最终当前状态')); assert.ok(tickets.includes('73 个有效实际 native pair / 146 个进程'));
  const parent = (await read('.scratch/complete-mv-events-implementation/complete-mv-events-implementation-spec.md')).toString('utf8'); assert.ok(parent.includes('Status: ready-for-agent'));
  const markdownLinks = [];
  const reportFile = prefix + '55-final-audit.md';
  for (const match of (await read(reportFile)).toString('utf8').matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1].split('#')[0];
    if (!target || /^[a-z]+:/i.test(target)) continue;
    await fs.access(path.resolve(repo, path.dirname(reportFile), target));
    markdownLinks.push(target);
  }
  const archivedTools = [];
  const tools = ['publish-final55.cjs','publication-check.mjs','compare-location-reuse.cjs','compare-location-reuse-v1.cjs','compare-common-reuse.cjs','compare-map-reuse.cjs','assemble-native-obligation-map.cjs','finalize-native-map.cjs'];
  for (const tool of tools) archivedTools.push({ path: output + '/' + tool, sha256: hash(await read(output + '/' + tool)) });
  assert.equal(hash(await read(directory + '/publication-script.cjs')), hash(await read(output + '/publish-final55.cjs')));
  await fs.copyFile(output + '/publication-check.mjs', directory + '/publication-check.mjs');
  const receipt = { formatVersion:1, startedAt, completedAt:new Date().toISOString(), status:'passed', method:'Affected actual schema/link/hash and accepted-domain metadata audit; no test runner, build, game or historical payload scan', node:process.version, command:[process.execPath,...process.execArgv,...process.argv.slice(1)], markdownLinksChecked:markdownLinks, requirements:index.requirements.length, precedingRequirements:incoming.requirements.length, nativeRows:34, unresolved:0, newAuditResults:results.length, changedRequirementLinks:changed.length, originalRequirementDomainFieldsUnchanged:true, oldResultsUnmodified:true, productSourceTree:tree, productPackageUnchanged:true, distFilesMatched:manifest.dist.files.length, parentRemainsOpen:true, schemaSource:{path:'packages/rpgmaker-event-dsl/test/support/mv-evidence.ts',sha256:hash(await read('packages/rpgmaker-event-dsl/test/support/mv-evidence.ts'))}, archivedTools, inputs:{publicationReceipt:{path:output+'/publication-receipt.json',sha256:hash(await read(output+'/publication-receipt.json'))}, baseline:{path:output+'/incoming-requirements-before55.json',sha256:hash(await read(output+'/incoming-requirements-before55.json'))}}, results, limits:['Existing successful current-index run reused; this check reads only new48 audit result payloads and explicitly selected receipt/fixture files.', 'The original source and built failed runs remain failed; no whole-suite pass is inferred.', 'Native reused observations and new supplement retain actual execution times, exact host/code identities and concrete oracles.'] };
  await fs.writeFile(directory + '/publication-check.json', JSON.stringify(receipt,null,2)+'\n');
  await fs.writeFile(output + '/publication-check.json', JSON.stringify(receipt,null,2)+'\n');
  console.log(JSON.stringify({status:'passed',path:directory+'/publication-check.json',sha256:hash(await fs.readFile(directory+'/publication-check.json')),requirements:index.requirements.length,newAuditResults:results.length}));
}
main().catch(async error => { await fs.writeFile(output+'/publication-check-failure-'+Date.now()+'.json',JSON.stringify({status:'failed',error:String(error),stack:error.stack},null,2)+'\n'); console.error(error); process.exitCode=1; });
