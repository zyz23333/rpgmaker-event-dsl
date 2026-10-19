const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=process.argv[2],temp='C:/Users/Shuen/.codex/tmp',base=path.join(root,'.scratch/complete-mv-events-implementation/evidence'),history=path.join(base,'23-history'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function preserve(source,target){const bytes=fs.readFileSync(source);if(fs.existsSync(target))assert.equal(sha(fs.readFileSync(target)),sha(bytes),target);else fs.writeFileSync(target,bytes,{flag:'wx'});}
function run(name,args=[]){process.stdout.write(cp.execFileSync(process.execPath,[path.join(temp,name),root,...args],{cwd:root,encoding:'utf8',windowsHide:true}));}
for(const name of ['mv23-check-final-v1','mv23-check-final-v2','mv23-build-final-v1','mv23-windows-baseline-final-v1'])preserve(path.join(temp,name+'.log'),path.join(history,name+'.txt'));
preserve(path.join(temp,'mv23-e1-recheck-v3-3758c63b-5217-4b7c-ab39-1c8e90ea32ab/identity-recheck.json'),path.join(history,'mv23-e1-delivery-identity-rerun-v1.json'));
preserve(path.join(temp,'mv23-pre25-build-archive-69f738cf-d009-4200-ad34-ece3249e37c8/preservation-provenance.json'),path.join(history,'mv23-pre25-source-preservation-provenance-v1.json'));
for(const name of ['mv23-native-pair-support-delivery-v1.cjs','mv23-r1-map-common-delivery-v1.cjs','mv23-r1-shared-parallel-delivery-v1.cjs','mv23-r1-low-autorun-delivery-v1.cjs','mv23-r4-common-context-delivery-v1.cjs','mv23-delivery-preflight-v1.cjs','mv23-prebuild-provenance-v1.cjs','mv23-register-native-v1.cjs','mv23-final-audit-v1.cjs','mv23-record-e1-final-v1.cjs','mv23-update-report-final-v1.cjs','mv23-preserve-executed-build-v1.cjs','mv23-finish-evidence-v1.cjs'])preserve(path.join(temp,name),path.join(history,name));
run('mv23-update-report-final-v1.cjs');
const names=['r1-triggers','r1-parallel','r1-autorun','r4-context'],suffixes=['R1-TRIGGERS','R1-PARALLEL','R1-AUTORUN','R4-CONTEXT'],runs=[];
for(let i=0;i<names.length;i++){const r=JSON.parse(fs.readFileSync(path.join(temp,'mv23-'+names[i]+'-actual-v1.json'),'utf8'));assert.equal(r.passed,true);runs.push(r.root);run('mv23-register-native-v1.cjs',[r.root,suffixes[i]]);}
run('mv23-index-and-archive.cjs');
const file=path.join(base,'23-common-event-roundtrip.md'),existing=fs.readdirSync(path.join(base,'results')).filter(n=>n.startsWith('MV-S5-COMMON-')).length,requirements=JSON.parse(fs.readFileSync(path.join(base,'requirements.json'),'utf8'));
const preservation=JSON.parse(fs.readFileSync(path.join(temp,'mv23-executed-build-preservation-v1.json'),'utf8'));
fs.appendFileSync(file,`\n最终验收索引为${requirements.requirements.length}行，Common本票21行；Common标准结果将在本次E1追加后达到${existing+1}份，旧结果保留其原状态。实际执行构建另完整保存在 \`${preservation.archive}\`，97个source与15个dist均与四组原生捕获逐文件相同，provenance见23-history/mv23-executed-build-preservation-v1.json。\n`);
run('mv23-record-e1-final-v1.cjs');
run('mv23-final-audit-v1.cjs',runs);
