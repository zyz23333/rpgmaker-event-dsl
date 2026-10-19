const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const root='C:/Users/Shuen/.codex/worktrees/mv-ticket-33/rpgmaker-event-dsl';
const history=path.join(root,'.scratch/complete-mv-events-implementation/evidence/33-history');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const entries=[];
for(const entry of fs.readdirSync(__dirname,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){if(!entry.isFile()||!entry.name.startsWith('mv33-'))continue;const original=path.join(__dirname,entry.name),bytes=fs.readFileSync(original);let target=path.join(history,'tools-and-logs',entry.name);if(entry.name==='mv33-record-delivery-reviews-v1.mts')target+='.txt';if(fs.existsSync(target)){assert.equal(sha(fs.readFileSync(target)),sha(bytes),'Existing original bytes '+target);continue;}fs.writeFileSync(target,bytes,{flag:'wx'});entries.push({original,archive:path.relative(root,target).replaceAll('\\','/'),sha256:sha(bytes),bytes:bytes.length});}
fs.writeFileSync(path.join(history,'archive-supplement-v1.json'),JSON.stringify({purpose:'Append-only later review/index/lint/audit tools and original failure/success logs; original main archive remains intact with its separately recorded inert historical-tool storage mapping.',at:new Date().toISOString(),entries},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({newOriginals:entries.length,passed:true}));
