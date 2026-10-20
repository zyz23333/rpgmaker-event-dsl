const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=process.argv[2],external=process.argv[3],out=path.join(external,'audio-final-dev-provenance-v2.json');
assert(!fs.existsSync(out),'Immutable output exists');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const old=JSON.parse(fs.readFileSync(path.join(external,'audio-final-dev-provenance-v1.json')));
const helper=JSON.parse(fs.readFileSync(path.join(external,'evidence-helper-after-v1.json')));
const capture=JSON.parse(fs.readFileSync(path.join(external,'capture-v6/manifest.json')));
assert.equal(sha(JSON.stringify(capture.files)),capture.fingerprint);
for(const f of capture.files)assert.equal(sha(fs.readFileSync(path.join(root,f.path))),f.sha256,f.path);
for(const f of old.sourceFiles)assert.equal(sha(fs.readFileSync(path.join(root,f.path))),f.sha256,f.path);
const results=fs.readdirSync(path.join(external,'results')).filter(f=>f.endsWith('.json'));
const statuses={};for(const f of results){const r=JSON.parse(fs.readFileSync(path.join(external,'results',f)));statuses[r.status]=(statuses[r.status]||0)+1;assert.equal(r.environment.native,'not-executed');}
const log56=fs.readFileSync(path.join(external,'56-final-index-v6.log'),'utf8'),log58=fs.readFileSync(path.join(external,'58-index-minimal-v6.log'),'utf8');
assert(log56.includes('1 failed | 2 passed')&&log56.includes('10000ms'));assert(log58.includes('1 passed | 2 skipped')&&log58.includes('tests 8.13s'));
const base=cp.execFileSync('git',['rev-parse','codex/complete-mv-events-implementation'],{cwd:root,encoding:'utf8'}).trim();assert.equal(base,old.base);
const manifests=fs.readdirSync(external).filter(f=>/^archive-manifest-v\d+\.json$/.test(f)).sort().map(name=>({name,sha256:sha(fs.readFileSync(path.join(external,name)))}));
const record={createdAt:new Date().toISOString(),base,headBeforeFinalMetadata:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),contract:'mv-1.6.1/12',ownDevContractBump:false,incomingRows:314,currentRows:319,ticketStatus:'claimed',focused449Execution:{capture:old.capture,fingerprint:old.executedInputFingerprint,files:old.finalFocusedFiles,tests:old.finalFocusedTests,batches:old.finalFocusedBatches,rerunAfterHelper:false},all100ProductSourceFilesByteIdenticalTo449Execution:true,productSourceFingerprint:helper.productSourceFingerprint,sharedEvidenceHelper:helper,currentInput:{capture:'capture-v6',count:capture.files.length,fingerprint:capture.fingerprint},publicIndexExecution:{originalLimitsUnchanged:true,firstCompleteFile:{log:'56-final-index-v6.log',exitCode:1,publicIndex:'timeout at original 10000ms',otherCases:'2 passed'},followupSingleCase:{log:'58-index-minimal-v6.log',exitCode:0,passed:1,skipped:2,testSeconds:8.13},cause:'not established; no product or evidence helper change between runs',allHistoryRetained:true},rawResults:{count:results.length,statuses,native:'not-executed'},archiveManifests:manifests,pending:['full checks','fresh build','built Audio Workspace execution','own relative semantic contract increment','E4 shipped editor reverse-engineering comparison','R6 actual final game observation','independent review and merge','closure']};
fs.writeFileSync(out,JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify({output:out,sha256:sha(fs.readFileSync(out)),results:record.rawResults,currentInput:record.currentInput}));
