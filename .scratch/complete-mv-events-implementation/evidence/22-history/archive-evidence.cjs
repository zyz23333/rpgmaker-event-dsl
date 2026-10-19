const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const { createHash } = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const root = 'C:/Users/Shuen/.codex/worktrees/mv-ticket-22/rpgmaker-event-dsl';
const temp = 'C:/Users/Shuen/.codex/tmp';
const evidence = path.join(root, '.scratch/complete-mv-events-implementation/evidence');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const prefix = 'MV-S4-RECOVERY-';
const copies = [];
function copy(original, target) {
  fs.copyFileSync(original, target, fs.constants.COPYFILE_EXCL);
  const bytes = fs.readFileSync(original);
  if (!bytes.equals(fs.readFileSync(target))) throw Error('Copy changed bytes: ' + target);
  copies.push({ original, target: path.relative(root, target).replaceAll('\\', '/'), bytes: bytes.length, sha256: digest(bytes) });
}
function records(directory) {
  return fs.readdirSync(directory).filter(name => name.startsWith(prefix) && name.endsWith('.json')).map(name => ({ name, original:path.join(directory,name), value:JSON.parse(fs.readFileSync(path.join(directory,name),'utf8')) }));
}
const source = records(path.join(temp,'mv22-capture-final-source-records'));
const built = records(path.join(temp,'mv22-capture-final-built-records'));
const superseded = [...records(path.join(temp,'mv22-final-source-records')), ...records(path.join(temp,'mv22-final-built-records'))];
const historical = records(path.join(root,'test-results/mv-evidence')).filter(item=>item.value.status==='failed');
if(source.length!==39||built.length!==39)throw Error('Unexpected final record counts '+source.length+'/'+built.length);
for(const kind of [source,built])for(const item of kind){
  if(item.value.status!=='passed'||item.value.environment.native!=='not-executed')throw Error('Final evidence is not a synthetic pass '+item.name);
  for(const entry of item.value.source.files){if(digest(fs.readFileSync(path.join(root,entry.path)))!==entry.sha256)throw Error('Captured source differs '+entry.path);}
}
for(const item of [...source,...built,...superseded,...historical])copy(item.original,path.join(evidence,'results',item.name));
const history = path.join(evidence,'22-history');fs.mkdirSync(history);
fs.writeFileSync(path.join(history,'.gitattributes'),'# Preserve exact original report/log bytes, including CRLF.\n* -text whitespace=blank-at-eol,blank-at-eof,space-before-tab,cr-at-eol\n*.txt -diff\n',{flag:'wx'});
const reports=fs.readdirSync(temp).filter(name=>/^mv22-.*\.(json|txt)$/.test(name)&&name!=='mv22-archive-audit.json');
for(const name of reports)copy(path.join(temp,name),path.join(history,name));
copy(__filename,path.join(history,'archive-evidence.cjs'));
copy(path.join(temp,'mv-partial-snapshot-recovery-held-preparation.cjs'),path.join(history,'original-held-reproduction.cjs'));
copy(path.join(temp,'mv-partial-snapshot-recovery-preparation-ccb9fce9-41ec-4b74-b186-cb4bf0016713/reproduction-result.json'),path.join(history,'original-held-reproduction-result.json'));
copy(path.join(temp,'mv22-pre-capture-dist/artifact-manifest.json'),path.join(history,'pre-capture-dist-artifact-manifest.json'));
for(const [suffix,label] of [['49cfda5a-f51a-49c7-ac33-59254e25bcea','merger-initial-invalid-fixture'],['5d8f97de-0ccc-41da-87c9-b04aa0652629','merger-pending-capture-product-red'],['35fc7589-9ddc-4d5a-ae00-5186d27793fe','merger-pending-capture-green']]){
  const directory=path.join(temp,'mv22-merger-pending-capture-'+suffix);
  copy(path.join(directory,'result.json'),path.join(history,label+'-result.json'));
  copy(path.join(directory,'reproduction-script.cjs'),path.join(history,label+'-script.cjs'));
}
const base = 'a64dc2e0fc8b79ff3ddd45ce214fd2ded08b6bf6';
const requirementPath='.scratch/complete-mv-events-implementation/evidence/requirements.json';
const originalIndex=JSON.parse(cp.execFileSync('git',['show',base+':'+requirementPath],{cwd:root,encoding:'utf8'}));
const currentIndex=JSON.parse(fs.readFileSync(path.join(root,requirementPath),'utf8'));
for(const item of originalIndex.requirements)if(!isDeepStrictEqual(item,currentIndex.requirements.find(row=>row.id===item.id)))throw Error('Original requirement changed '+item.id);
const baselineResults=cp.execFileSync('git',['ls-tree','-r',base,'--','.scratch/complete-mv-events-implementation/evidence/results'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean).map(line=>{const [metadata,file]=line.split('\t');return{file,blob:metadata.split(' ')[2]};});
for(const item of baselineResults){const blob=cp.execFileSync('git',['hash-object','--path',item.file,item.file],{cwd:root,encoding:'utf8'}).trim();if(blob!==item.blob)throw Error('Historical blob changed '+item.file);}
const artifactDirectory=path.join(root,'packages/rpgmaker-event-dsl/dist');
const artifacts=fs.readdirSync(artifactDirectory).filter(name=>fs.statSync(path.join(artifactDirectory,name)).isFile()).map(name=>({path:'packages/rpgmaker-event-dsl/dist/'+name,sha256:digest(fs.readFileSync(path.join(artifactDirectory,name)))}));
const audit={base,source:{count:source.length,fingerprints:[...new Set(source.map(item=>item.value.source.fingerprint))],revisions:[...new Set(source.map(item=>item.value.source.revision))],first:source.map(item=>item.value.startedAt).sort()[0],last:source.map(item=>item.value.completedAt).sort().at(-1)},built:{count:built.length,fingerprints:[...new Set(built.map(item=>item.value.source.fingerprint))],revisions:[...new Set(built.map(item=>item.value.source.revision))],first:built.map(item=>item.value.startedAt).sort()[0],last:built.map(item=>item.value.completedAt).sort().at(-1)},supersededPassesPreserved:superseded.length,historicalFailures:historical.length,originalRequirementsUnchanged:originalIndex.requirements.length,addedRequirements:currentIndex.requirements.length-originalIndex.requirements.length,originalResultBlobsUnchanged:baselineResults.length,artifacts,copies};
const auditPath=path.join(temp,'mv22-archive-audit.json');fs.writeFileSync(auditPath,JSON.stringify(audit,null,2)+'\n',{flag:'wx'});copy(auditPath,path.join(history,'archive-audit.json'));
process.stdout.write(JSON.stringify({...audit,copies:copies.length},null,2)+'\n');
