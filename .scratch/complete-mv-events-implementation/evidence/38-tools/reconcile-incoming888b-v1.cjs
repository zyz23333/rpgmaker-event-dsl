const fs=require('node:fs'),cp=require('node:child_process'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const base='38542767606ff9712e45d2a8e4894558e3a7d385',own='4d37538',incoming='888b95019192806b88c73d7804f0662e4cce7e8b',temp='M:/Shuen/Codex/mv-events-implementation-20261020/ticket38-temp';
const git=p=>cp.execFileSync('git',['show',p],{maxBuffer:16*1024*1024}).toString(),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const req='.scratch/complete-mv-events-implementation/evidence/requirements.json',readme='.scratch/complete-mv-events-implementation/evidence/README.md';
const oldReq=git(base+':'+req),ownReq=git(own+':'+req),newReq=git(incoming+':'+req),prefix=oldReq.slice(0,oldReq.lastIndexOf('\n  ]'));
assert.ok(ownReq.startsWith(prefix));const tail=ownReq.slice(prefix.length),merged=newReq.slice(0,newReq.lastIndexOf('\n  ]'))+tail;
const oldRows=JSON.parse(newReq).requirements,ownRows=JSON.parse(ownReq).requirements.slice(JSON.parse(oldReq).requirements.length),mergedRows=JSON.parse(merged).requirements;
assert.equal(ownRows.length,8);assert.deepStrictEqual(mergedRows.slice(0,oldRows.length),oldRows);assert.deepStrictEqual(mergedRows.slice(oldRows.length),ownRows);
const oldReadme=git(base+':'+readme),ownReadme=git(own+':'+readme),newReadme=git(incoming+':'+readme);assert.ok(ownReadme.startsWith(oldReadme));const mergedReadme=newReadme+ownReadme.slice(oldReadme.length);
for(const [p,bytes] of [[req,merged],[readme,mergedReadme]]){fs.writeFileSync(temp+'/merge888b-conflict-'+(p===req?'requirements':'readme')+'.txt',fs.readFileSync(p));fs.writeFileSync(p,bytes);}
const receipt={createdAt:new Date().toISOString(),base,own,incoming,incomingRequirements:oldRows.length,ownRequirements:ownRows.length,totalRequirements:mergedRows.length,incomingRawRequirementPrefixExact:true,ownRawRequirementTailExact:true,incomingReadmePrefixExact:true,ownReadmeSuffixExact:true,requirementsSha256:sha(merged),readmeSha256:sha(mergedReadme)};
fs.writeFileSync(temp+'/merge888b-reconciliation.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
