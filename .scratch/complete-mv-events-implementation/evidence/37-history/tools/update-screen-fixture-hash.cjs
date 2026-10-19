const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');const root=process.argv[2];
const fixture='packages/rpgmaker-event-dsl/test/fixtures/mv-evidence/screen-effect-cases.json';const file=path.join(root,'.scratch/complete-mv-events-implementation/evidence/requirements.json');
const bytes=fs.readFileSync(file,'utf8');const rows=JSON.parse(bytes).requirements;const old=new Set(rows.filter(row=>row.id.startsWith('MV-S6-SCREEN-')).map(row=>row.fixture.sha256));if(old.size!==1)throw Error('Unexpected screen hashes');
const sha=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,fixture))).digest('hex');const before=[...old][0];if(rows.filter(row=>row.fixture.sha256===before).length!==4)throw Error('Incoming hash conflict');
fs.writeFileSync(file,bytes.replaceAll(before,sha));process.stdout.write(sha+'\n');
