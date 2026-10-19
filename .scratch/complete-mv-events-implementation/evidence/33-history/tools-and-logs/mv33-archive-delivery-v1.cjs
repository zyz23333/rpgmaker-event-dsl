const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const root='C:/Users/Shuen/.codex/worktrees/mv-ticket-33/rpgmaker-event-dsl';
const evidence=path.join(root,'.scratch/complete-mv-events-implementation/evidence');
const history=path.join(evidence,'33-history');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const entries=[];
function copy(original,relative){const bytes=fs.readFileSync(original),to=path.join(history,relative);fs.mkdirSync(path.dirname(to),{recursive:true});if(fs.existsSync(to))assert.equal(sha(fs.readFileSync(to)),sha(bytes),'Never overwrite original '+to);else fs.writeFileSync(to,bytes,{flag:'wx'});entries.push({original,archive:path.relative(root,to).replaceAll('\\','/'),bytes:bytes.length,sha256:sha(bytes),originalModifiedAt:fs.statSync(original).mtime.toISOString()});}
for(const entry of fs.readdirSync(__dirname,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)))if(entry.isFile()&&entry.name.startsWith('mv33-'))copy(path.join(__dirname,entry.name),'tools-and-logs/'+entry.name);
for(const name of ['mv-native-pair-support-v5.cjs','mv-native-literal-support-v4.cjs','mv-native-literal-support.cjs'])copy(path.join(__dirname,name),'tools-and-logs/'+name);
const checkpoint='mv33-checkpoint-preserved-edb056b2-662a-4ab7-be77-3b8655a6ad4f';
const preformat='mv33-saved-numbers-preformat-preserved-a810e12d-046e-49c9-9d3d-c9267e91803e';
for(const name of [checkpoint,preformat])copy(path.join(__dirname,name,'manifest.json'),'provenance/'+name+'-manifest.json');
copy(path.join(__dirname,preformat,'worktree-dirty-diff.patch'),'provenance/saved-numbers-preformat-dirty-diff.patch');
copy(path.join(__dirname,preformat,'source-inputs/packages/rpgmaker-event-dsl/test/fixtures/mv-evidence/movement-saved-numbers.json'),'provenance/movement-saved-numbers-preformat.json');
const frozen=JSON.parse(fs.readFileSync(path.join(__dirname,'mv33-final-product-preserved-pointer-v1.json')));
copy(frozen.manifest,'provenance/final-product-preserved-manifest.json');
copy(path.join(__dirname,'mv33-editor-resources-v1-82386c37-8ceb-42b7-8474-005a52ae526a/audit.json'),'editor-52-resource-identity-audit.json');
const results=[];
for(const name of fs.readdirSync(path.join(root,'test-results/mv-evidence')).sort())if(name.startsWith('MV-S6-MOVEMENT-')||/^MV-S0-(?:CE|COMPARE)-001-2026-10-19T15-50-/.test(name)){const from=path.join(root,'test-results/mv-evidence',name),to=path.join(evidence,'results',name),bytes=fs.readFileSync(from);if(fs.existsSync(to))assert.equal(sha(fs.readFileSync(to)),sha(bytes));else fs.writeFileSync(to,bytes,{flag:'wx'});results.push({original:from,archive:path.relative(root,to).replaceAll('\\','/'),sha256:sha(bytes),bytes:bytes.length});}
const manifest={purpose:'Append-only permitted33 self-authored tooling/logs/safe summaries and original schema results. Native first-party carriers/engine/assets and raw float samples remain external. Full original source/dist preserved externally with complete manifests.',at:new Date().toISOString(),entries,results};
fs.writeFileSync(path.join(history,'archive-manifest-v1.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({entries:entries.length,results:results.length,manifest:path.join(history,'archive-manifest-v1.json')}));
