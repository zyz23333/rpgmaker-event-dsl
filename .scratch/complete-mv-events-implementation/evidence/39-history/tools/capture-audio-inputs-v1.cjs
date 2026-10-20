const fs=require('node:fs'), path=require('node:path'), crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.resolve(process.argv[2]), destination=path.resolve(process.argv[3]);
if(fs.existsSync(destination))throw Error('Capture is append-only: destination exists');
const walk=directory=>fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(directory,entry.name)):[path.join(directory,entry.name)]);
const sourcePaths=[...walk(path.join(root,'packages/rpgmaker-event-dsl/src')),...walk(path.join(root,'packages/rpgmaker-event-dsl/test')),...[
  '.github/workflows/ci.yml','package.json','packages/rpgmaker-event-dsl/vitest.config.ts','packages/rpgmaker-event-dsl/vitest.windows.config.ts','pnpm-lock.yaml','packages/rpgmaker-event-dsl/package.json','packages/rpgmaker-event-dsl/tsconfig.json','tsconfig.base.json','.scratch/complete-mv-events-implementation/evidence/requirements.json',
].map(file=>path.join(root,file))].sort();
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const files=sourcePaths.map(file=>{const relative=path.relative(root,file).replaceAll('\\','/'), bytes=fs.readFileSync(file);const target=path.join(destination,'inputs',relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);return{path:relative,sha256:sha(bytes)};});
const manifest={formatVersion:1,revision:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),capturedAt:new Date().toISOString(),fingerprint:sha(JSON.stringify(files)),files};
fs.writeFileSync(path.join(destination,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
process.stdout.write(JSON.stringify({destination,sourceCount:files.length,fingerprint:manifest.fingerprint})+'\n');
