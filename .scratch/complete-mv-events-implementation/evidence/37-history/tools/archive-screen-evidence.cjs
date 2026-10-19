const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]), external=path.resolve(process.argv[3]);
const history=path.join(root,'.scratch/complete-mv-events-implementation/evidence/37-history');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const walk=directory=>fs.existsSync(directory)?fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(directory,entry.name)):[path.join(directory,entry.name)]):[];
const copy=(source,target)=>{const bytes=fs.readFileSync(source);if(fs.existsSync(target)){if(!fs.readFileSync(target).equals(bytes))throw Error('Append-only archive conflict '+target);}else{fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);}return{source:source.replaceAll('\\','/'),target:path.relative(root,target).replaceAll('\\','/'),sha256:sha(bytes),bytes:bytes.length};};
fs.mkdirSync(history,{recursive:true});const attrs=path.join(history,'.gitattributes');if(!fs.existsSync(attrs))fs.writeFileSync(attrs,'* -text -whitespace\n');
const manifest=[];const captures=new Map();
for(const name of fs.readdirSync(external).filter(name=>/^capture-v\d+$/.test(name))){
  const source=path.join(external,name);const capture=JSON.parse(fs.readFileSync(path.join(source,'manifest.json'),'utf8'));captures.set(capture.fingerprint,{source,capture});
  for(const file of walk(source))manifest.push(copy(file,path.join(history,name,path.relative(source,file))));
}
for(const file of walk(path.join(external,'results')).filter(file=>file.endsWith('.json'))){
  const result=JSON.parse(fs.readFileSync(file,'utf8'));
  const match=captures.get(result.source.fingerprint);if(!match)throw Error('Result has no captured pre-run input '+file);
  if(JSON.stringify(match.capture.files)!==JSON.stringify(result.source.files))throw Error('Capture list differs '+file);
  for(const item of result.source.files)if(sha(fs.readFileSync(path.join(match.source,'inputs',item.path)))!==item.sha256)throw Error('Captured bytes changed '+item.path);
  const target=path.join(root,'.scratch/complete-mv-events-implementation/evidence/results',path.basename(file));manifest.push(copy(file,target));
}
for(const file of fs.readdirSync(external).filter(name=>/\.(log|cjs)$/.test(name))){const source=path.join(external,file);if(!fs.statSync(source).isFile())continue;manifest.push(copy(source,path.join(history,file.endsWith('.log')?'logs':'tools',file)));}
const out=path.join(external,'archive-manifest-v'+process.argv[4]+'.json');if(fs.existsSync(out))throw Error('Manifest already exists');
fs.writeFileSync(out,JSON.stringify({createdAt:new Date().toISOString(),files:manifest},null,2)+'\n');
copy(out,path.join(history,path.basename(out)));process.stdout.write(JSON.stringify({files:manifest.length,captures:captures.size,manifest:out})+'\n');
