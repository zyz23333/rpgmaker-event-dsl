'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root='C:/Users/Shuen/.codex/worktrees/mv-ticket-24/rpgmaker-event-dsl',temp='C:/Users/Shuen/.codex/tmp';
const evidence=path.join(root,'.scratch/complete-mv-events-implementation/evidence'),archive=path.join(evidence,'24-merger-correction');
const mapPath=path.join(archive,'outside-copy-map.json'),map=JSON.parse(fs.readFileSync(mapPath));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function copy(source,destination){const bytes=fs.readFileSync(source);fs.copyFileSync(source,destination,fs.constants.COPYFILE_EXCL);assert.deepEqual(fs.readFileSync(destination),bytes);map.copies.push({origin:'outside-copy',source,destination:path.relative(root,destination).split(path.sep).join('/'),bytes:bytes.length,sourceSha256:sha(bytes),destinationSha256:sha(bytes)});}
const unit=path.join(temp,'mv24-correction-unit-results-v1'),names=fs.readdirSync(unit).filter(n=>n.endsWith('.json'));assert.equal(names.length,1);
copy(path.join(unit,names[0]),path.join(evidence,'results',names[0]));
for(const name of ['mv24-correction-product-correspondence-v1.json','mv24-correction-finalize-copy-v1.cjs'])copy(path.join(temp,name),path.join(archive,name));
map.inventories.push({label:'unit',directory:unit,entries:names.map(name=>{const bytes=fs.readFileSync(path.join(unit,name)),r=JSON.parse(bytes);return{path:path.join(unit,name),sha256:sha(bytes),bytes:bytes.length,requirementId:r.requirementId,runId:r.runId,status:r.status};})});
map.completedAt=new Date().toISOString();fs.writeFileSync(mapPath,JSON.stringify(map,null,2)+'\n');
console.log(JSON.stringify({outsideCopies:map.copies.length,passed:true}));
