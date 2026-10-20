const fs=require('node:fs'),cp=require('node:child_process'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const base='888b95019192806b88c73d7804f0662e4cce7e8b',own='8e49010',incoming='73504ec28bad98ae424a9d452f68774b009579d0',temp='M:/Shuen/Codex/mv-events-implementation-20261020/ticket38-temp';
const git=p=>cp.execFileSync('git',['show',p],{maxBuffer:16*1024*1024}).toString(),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(cp.execFileSync('git',['rev-parse','MERGE_HEAD']).toString().trim(),incoming);
const req='.scratch/complete-mv-events-implementation/evidence/requirements.json',readme='.scratch/complete-mv-events-implementation/evidence/README.md';
const oldReq=git(base+':'+req),ownReq=git(own+':'+req),newReq=git(incoming+':'+req),prefix=oldReq.slice(0,oldReq.lastIndexOf('\n  ]'));
assert.ok(ownReq.startsWith(prefix));assert.ok(newReq.startsWith(prefix));const tail=ownReq.slice(prefix.length),merged=newReq.slice(0,newReq.lastIndexOf('\n  ]'))+tail;
const oldRows=JSON.parse(newReq).requirements,ownRows=JSON.parse(ownReq).requirements.slice(JSON.parse(oldReq).requirements.length),mergedRows=JSON.parse(merged).requirements;
assert.equal(oldRows.length,314);assert.equal(ownRows.length,9);assert.equal(mergedRows.length,323);assert.deepStrictEqual(mergedRows.slice(0,oldRows.length),oldRows);assert.deepStrictEqual(mergedRows.slice(oldRows.length),ownRows);
const oldReadme=git(base+':'+readme),ownReadme=git(own+':'+readme),newReadme=git(incoming+':'+readme);assert.ok(ownReadme.startsWith(oldReadme));assert.ok(newReadme.startsWith(oldReadme));const mergedReadme=newReadme+ownReadme.slice(oldReadme.length);
const conflicts=[];
for(const [p,label] of [[req,'requirements'],[readme,'readme'],['packages/rpgmaker-event-dsl/src/validation/native-parameters.ts','native-parameters'],['packages/rpgmaker-event-dsl/test/loop.test.ts','loop-test']]){
  const bytes=fs.readFileSync(p),destination=temp+'/merge73504ec-conflict-'+label+'.txt';assert.ok(!fs.existsSync(destination));fs.writeFileSync(destination,bytes);conflicts.push({path:p,preservedAt:destination,sha256:sha(bytes)});
}
fs.writeFileSync(req,merged);fs.writeFileSync(readme,mergedReadme);
const receipt={createdAt:new Date().toISOString(),base,own,incoming,incomingRequirements:oldRows.length,ownRequirements:ownRows.length,totalRequirements:mergedRows.length,incomingRawRequirementPrefixExact:true,ownRawRequirementTailExact:true,incomingReadmePrefixExact:true,ownReadmeSuffixExact:true,requirementsSha256:sha(merged),readmeSha256:sha(mergedReadme),originalConflicts:conflicts};
fs.writeFileSync(temp+'/merge73504ec-reconciliation.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
