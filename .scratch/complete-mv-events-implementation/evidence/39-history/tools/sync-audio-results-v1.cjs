const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const root = process.argv[2], external = process.argv[3];
const destination = path.join(root, '.scratch/complete-mv-events-implementation/evidence/results');
fs.mkdirSync(destination, { recursive: true });
const records = [];
for (const name of fs.readdirSync(path.join(external, 'results')).filter(name => name.endsWith('.json')).sort()) {
  const bytes = fs.readFileSync(path.join(external, 'results', name));
  const target = path.join(destination, name);
  const existed = fs.existsSync(target);
  if (existed) assert.deepStrictEqual(fs.readFileSync(target), bytes, 'Existing original differs: ' + name);
  else fs.writeFileSync(target, bytes);
  records.push({ name, existed, sha256: crypto.createHash('sha256').update(bytes).digest('hex') });
}
console.log(JSON.stringify({ count: records.length, copied: records.filter(record => !record.existed).length, records }));
