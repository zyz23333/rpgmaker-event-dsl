const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const root = 'C:/Users/Shuen/.codex/worktrees/mv-ticket-34/rpgmaker-event-dsl';
const out = 'M:/Shuen/Codex/mv-events-implementation-20261020/ticket34-temp';
const evidence = path.join(root, '.scratch/complete-mv-events-implementation/evidence');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const resultFiles = fs.readdirSync(path.join(out, 'results')).filter(name => name.endsWith('.json'));
const candidates = rel => {
  const current = fs.readFileSync(path.join(root, rel));
  const variants = [current];
  let before = current.toString('utf8');
  if (rel.endsWith('test/map-locations.test.ts')) before = before.replace('  mapEvent,', '  rawDslCommand,\n  mapEvent,');
  if (rel.endsWith('test/map-locations-workspace.test.ts')) {
    before = before.replace('import { mkdir, readFile, readdir, writeFile }', 'import { readFile, readdir, writeFile }');
    before = before.replace(/      await mkdir\(join\(workspaceRoot, "src"\), \{ recursive: true \}\);\r?\n      await writeFile\([\s\S]*?      \);\r?\n      await compileWorkspace\(\{ workspaceRoot, check: false \}\);/,
      '      await decompileWorkspace({ workspaceRoot });\n      await compileWorkspace({ workspaceRoot, check: false });');
  }
  variants.push(Buffer.from(before));
  variants.push(Buffer.from(before.replace(/\r\n/g, '\n')));
  variants.push(Buffer.from(before.replace(/\r?\n/g, '\r\n')));
  return variants;
};
const planned = resultFiles.map(name => {
  const bytes = fs.readFileSync(path.join(out, 'results', name));
  const result = JSON.parse(bytes);
  const inputs = result.source.files.map(file => {
    const archived = path.join(evidence, 'inputs/34-location-dev', result.source.fingerprint, file.path);
    const bytes = fs.existsSync(archived) ? fs.readFileSync(archived) : candidates(file.path).find(bytes => hash(bytes) === file.sha256);
    if (!bytes) throw new Error(`Cannot reproduce exact captured input ${name} ${file.path} ${file.sha256}`);
    if (hash(bytes) !== file.sha256) throw new Error('Previously captured input differs');
    return {file, bytes};
  });
  return {name, bytes, result, inputs};
});
const receipt = [];
for (const item of planned) {
  const resultPath = path.join(evidence, 'results/34-location-dev', item.name);
  fs.mkdirSync(path.dirname(resultPath), {recursive:true});
  if (!fs.existsSync(resultPath)) fs.writeFileSync(resultPath, item.bytes, {flag:'wx'});
  if (!fs.readFileSync(resultPath).equals(item.bytes)) throw new Error('Raw result mismatch');
  for (const {file, bytes} of item.inputs) {
    const target = path.join(evidence, 'inputs/34-location-dev', item.result.source.fingerprint, file.path);
    fs.mkdirSync(path.dirname(target), {recursive:true});
    if (!fs.existsSync(target)) fs.writeFileSync(target, bytes, {flag:'wx'});
    if (!fs.readFileSync(target).equals(bytes)) throw new Error('Captured input mismatch');
  }
  receipt.push({file:item.name,sha256:hash(item.bytes),status:item.result.status,fingerprint:item.result.source.fingerprint,inputs:item.inputs.length});
}
fs.writeFileSync(path.join(out, `archive-receipt-${Date.now()}.json`), JSON.stringify(receipt,null,2)+'\n', {flag:'wx'});
console.log(JSON.stringify(receipt,null,2));
