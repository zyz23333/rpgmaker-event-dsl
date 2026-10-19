const fs=require('node:fs'), cp=require('node:child_process');
const root=process.argv[2], action=process.argv[3], log=process.argv[4];
const files=[...new Set([
  cp.execFileSync('git',['-c','core.longpaths=true','diff','--name-only','3854276','--','packages/rpgmaker-event-dsl','example','skills'],{cwd:root,encoding:'utf8'}),
  cp.execFileSync('git',['-c','core.longpaths=true','ls-files','--others','--exclude-standard','--','packages/rpgmaker-event-dsl'],{cwd:root,encoding:'utf8'})
].flatMap(text=>text.trim().split(/\r?\n/).filter(Boolean)))].filter(file=>action==='lint'?file.endsWith('.ts'):/\.(ts|json|md)$/.test(file));
const args=action==='lint'?['node_modules/oxlint/bin/oxlint',...files]:['node_modules/oxfmt/bin/oxfmt',action==='format'?'--write':'--check','--threads=1',...files];
const result=cp.spawnSync(process.execPath,args,{cwd:root,encoding:'utf8'});
const output=`Files: ${files.length}\n${result.stdout||''}${result.stderr||''}${result.error||''}`;
fs.writeFileSync(log,output); process.stdout.write(output); process.exit(result.status??1);
