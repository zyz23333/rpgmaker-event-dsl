const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const root = path.resolve(process.argv[2]), output = process.argv[3];
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const index = JSON.parse(fs.readFileSync(path.join(root, '.scratch/complete-mv-events-implementation/evidence/requirements.json'), 'utf8'));
const changed = index.requirements.flatMap(row => {
  const actual = sha(fs.readFileSync(path.join(root, row.fixture.path)));
  return actual === row.fixture.sha256 ? [] : [{ id: row.id, path: row.fixture.path, indexed: row.fixture.sha256, actual }];
});
const report = { requirementCount: index.requirements.length, mismatches: changed };
fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
process.stdout.write(JSON.stringify(report) + '\n');
