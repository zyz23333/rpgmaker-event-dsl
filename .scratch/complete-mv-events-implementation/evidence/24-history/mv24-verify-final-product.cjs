'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=process.argv[2]||'C:/Users/Shuen/.codex/worktrees/mv-ticket-24/rpgmaker-event-dsl';
const output=process.argv[3]||'C:/Users/Shuen/.codex/tmp/mv24-final-product-correspondence-v1.json';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function files(directory){return fs.readdirSync(directory,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(directory,e.name)):[path.join(directory,e.name)]);}
const results=[];
for(const kind of ['triggers','routes']){
 const report=JSON.parse(fs.readFileSync(path.join(__dirname,`native-${kind}-safe-summary.json`)));
 const groups={};
 for(const group of ['source','dist']){
  const directory=path.join(root,'packages/rpgmaker-event-dsl',group==='source'?'src':'dist');
  const captured=report.build[group].entries;
  assert.deepEqual(files(directory).map(f=>path.relative(directory,f).split(path.sep).join('/')).sort(),captured.map(f=>f.path).sort(),`${kind}/${group} file membership`);
  groups[group]=captured.map(entry=>{
   const current=sha(fs.readFileSync(path.join(directory,entry.path)));assert.equal(current,entry.sha256,`${kind}/${group}/${entry.path}`);
   return{...entry,finalSha256:current,matches:true};
  });
 }
 results.push({kind,capturedRevision:report.build.gitHead,capturedDirtyStatus:report.build.gitStatus,capturedSourceFingerprint:report.build.source.sha256,capturedDistFingerprint:report.build.dist.sha256,groups,passed:true});
}
const result={purpose:'Final fresh product source/build correspondence to both actually executed ticket24 R1 pairs; does not relabel dirty execution as clean commit',at:new Date().toISOString(),node:process.version,root,results,passed:true};
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({output,passed:true}));
