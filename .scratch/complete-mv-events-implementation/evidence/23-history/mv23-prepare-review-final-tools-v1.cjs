const fs=require('node:fs'),path=require('node:path');
const temp='C:/Users/Shuen/.codex/tmp';
function derive(from,to,edits){let text=fs.readFileSync(path.join(temp,from),'utf8');for(const[a,b]of edits){if(!text.includes(a))throw Error('missing transform '+a);text=text.replaceAll(a,b);}fs.writeFileSync(path.join(temp,to),text,{flag:'wx'});}
derive('mv23-final-audit-v1.cjs','mv23-review-final-audit-v2.cjs',[
 ["prior='e199e958c9c1adc48c8ccbf21718a8a39789fa8a'","prior='59d274eaeb8bb386cdb7110e1958a4a06d0efcad'"],
 ["const initial=JSON.parse", "const primary='233db5420d6cf83da0220c6aa5aed56626798f39',primaryIndex=JSON.parse(git(['show',primary+':'+rel+'/requirements.json']));for(const row of primaryIndex.requirements)assert.deepEqual(current.requirements.find(r=>r.id===row.id),row,'Actual primary requirement mutated: '+row.id);assert.equal(primaryIndex.requirements.length,251);const checkpoint='e199e958c9c1adc48c8ccbf21718a8a39789fa8a',checkpointIndex=JSON.parse(git(['show',checkpoint+':'+rel+'/requirements.json']));for(const row of checkpointIndex.requirements)assert.deepEqual(current.requirements.find(r=>r.id===row.id),row,'Own checkpoint requirement mutated: '+row.id);const initial=JSON.parse"],
 ["prior,head:git", "prior,actualPrimary:{revision:primary,requirementsUnchanged:primaryIndex.requirements.length},ownPreReviewCheckpoint:{revision:checkpoint,requirementsUnchanged:checkpointIndex.requirements.length},head:git"],
 ["mv23-final-immutable-build-audit-v1.json","mv23-review-final-immutable-build-audit-v2.json"],
 ["Ticket23 append-only historical evidence and executed source/dist correspondence audit","Ticket23 corrected candidate append-only audit; distinguish actual251 primary, own268 merge checkpoint and prior272 rejected READY"]
]);
derive('mv23-record-e1-final-v1.cjs','mv23-review-record-e1-final-v2.cjs',[
 ["mv23-e1-delivery-identity-rerun-v1.json","mv23-review-e1-delivery-identity-v1.json"],
 ["mv23-check-final-v1.txt","mv23-review-boundaries-red-v1.json"],
 ["mv23-check-final-v2.txt","mv23-review-check-final-v1.txt"],
 ["mv23-build-final-v1.txt","mv23-review-build-final-v1.txt"],
 ["mv23-windows-baseline-final-v1.txt","mv23-review-windows-baseline-final-v1.txt"],
 ["const captured=new Map();", "const boundaryResults=fs.readdirSync(path.join(base,'results')).filter(n=>/^MV-S5-COMMON-(CARRIER|TRIGGER)-BOUNDARY-/.test(n)).map(n=>{const bytes=fs.readFileSync(path.join(base,'results',n));return{path:rel+'/results/'+n,sha256:sha(bytes),value:JSON.parse(bytes)};});const boundary={source:boundaryResults.filter(r=>!r.value.source.files.some(f=>f.path.startsWith('packages/rpgmaker-event-dsl/dist/'))).sort((a,b)=>b.value.completedAt.localeCompare(a.value.completedAt)).slice(0,4),built:boundaryResults.filter(r=>r.value.source.files.some(f=>f.path.startsWith('packages/rpgmaker-event-dsl/dist/'))).sort((a,b)=>b.value.completedAt.localeCompare(a.value.completedAt)).slice(0,4)};for(const records of Object.values(boundary)){assert.equal(records.length,4);assert.equal(new Set(records.map(r=>r.value.requirementId)).size,2);for(const r of records)assert.equal(r.value.status,'passed');}const captured=new Map();"],
 ["for(const r of [...source,...built])capture", "for(const r of [...source,...built,...boundary.source,...boundary.built])capture"],
 ["sourceCount:100,builtCount:100,requirementCount:16", "sourceCount:100,builtCount:100,requirementCount:16,boundarySource:boundary.source.map(({path,sha256})=>({path,sha256})),boundaryBuilt:boundary.built.map(({path,sha256})=>({path,sha256})),boundarySourceCount:4,boundaryBuiltCount:4"],
 ["sourceRuns:source.length,builtRuns:built.length,passed:true", "sourceRuns:source.length,builtRuns:built.length,boundarySourceRuns:4,boundaryBuiltRuns:4,passed:true"]
]);
derive('mv23-preserve-executed-build-v1.cjs','mv23-review-preserve-executed-build-v2.cjs',[
 ["mv23-r1-triggers-actual-v1.json","mv23-review-r1-triggers-actual-v1.json"],
 ["mv23-executed-build-preserved-","mv23-review-executed-build-preserved-"],
 ["mv23-executed-build-preservation-v1.json","mv23-review-executed-build-preservation-v2.json"]
]);
console.log('Created new review-final audit, E1 comparison and preservation tools; originals unchanged.');
