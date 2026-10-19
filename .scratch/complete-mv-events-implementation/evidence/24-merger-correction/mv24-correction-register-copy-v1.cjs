'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root='C:/Users/Shuen/.codex/worktrees/mv-ticket-24/rpgmaker-event-dsl';
const archive=path.join(root,'.scratch/complete-mv-events-implementation/evidence/24-merger-correction');
const mapPath=path.join(archive,'outside-copy-map.json'),map=JSON.parse(fs.readFileSync(mapPath));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(process.argv.length%2,0,'Supply source/destination pairs');
for(let i=2;i<process.argv.length;i+=2){
 const source=process.argv[i],destination=path.resolve(archive,process.argv[i+1]);
 assert.ok(!path.relative(archive,destination).startsWith('..'));
 const relative=path.relative(root,destination).split(path.sep).join('/');assert.ok(!map.copies.some(c=>c.destination===relative));
 const bytes=fs.readFileSync(source);if(!fs.existsSync(destination))fs.copyFileSync(source,destination,fs.constants.COPYFILE_EXCL);
 assert.deepEqual(fs.readFileSync(destination),bytes);
 map.copies.push({origin:'outside-copy',source,destination:relative,bytes:bytes.length,sourceSha256:sha(bytes),destinationSha256:sha(bytes)});
}
map.completedAt=new Date().toISOString();fs.writeFileSync(mapPath,JSON.stringify(map,null,2)+'\n');
console.log(JSON.stringify({outsideCopies:map.copies.length,passed:true}));
