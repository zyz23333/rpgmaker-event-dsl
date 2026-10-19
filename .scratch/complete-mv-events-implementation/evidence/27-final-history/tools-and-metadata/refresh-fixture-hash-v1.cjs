const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root='M:/Shuen/Codex/mv-events-implementation-20261020/worktrees/mv-ticket-27-final';
const file=path.join(root,'.scratch/complete-mv-events-implementation/evidence/requirements.json');
const index=JSON.parse(fs.readFileSync(file,'utf8').replace(/`n$/,''));
const incoming=JSON.parse(fs.readFileSync(path.join(path.dirname(process.argv[1]),'requirements-actual73504ec-original.json'),'utf8'));
assert.deepEqual(index.requirements.slice(0,314),incoming.requirements);
const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'packages/rpgmaker-event-dsl/test/fixtures/mv-evidence/choices-complete.json'))).digest('hex');
for(const r of index.requirements)if(r.id.startsWith('MV-S6-CHOICES-'))r.fixture.sha256=hash;
fs.writeFileSync(file,JSON.stringify(index,null,2)+'\n');console.log(JSON.stringify({hash,count:index.requirements.length,incomingExact:true}));
