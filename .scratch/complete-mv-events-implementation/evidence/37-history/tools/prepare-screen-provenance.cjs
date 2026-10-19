const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.resolve(process.argv[2]),external=path.resolve(process.argv[3]),base=process.argv[4];
const evidence='.scratch/complete-mv-events-implementation/evidence',history=path.join(root,evidence,'37-history');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const git=args=>cp.execFileSync('git',['-c','core.longpaths=true',...args],{cwd:root,maxBuffer:64*1024*1024});
const copyBytes=(bytes,target)=>{fs.mkdirSync(path.dirname(target),{recursive:true});if(fs.existsSync(target)&&!fs.readFileSync(target).equals(bytes))throw Error('Archive conflict '+target);fs.writeFileSync(target,bytes);return{path:path.relative(root,target).replaceAll('\\','/'),sha256:sha(bytes),bytes:bytes.length};};
const originals=[evidence+'/requirements.json','packages/rpgmaker-event-dsl/test/common-event-workspace.test.ts'].map(file=>copyBytes(git(['show',`${base}:${file}`]),path.join(history,'incoming-fixtures',file)));
const changes=[...new Set([...git(['diff','--name-only',base,'--','packages','example','skills']).toString().trim().split(/\r?\n/),...git(['ls-files','--others','--exclude-standard','--','packages','example','skills']).toString().trim().split(/\r?\n/)])].filter(Boolean).sort();
const changedFiles=changes.map(file=>({path:file,sha256:sha(fs.readFileSync(path.join(root,file)))}));
const productFiles=changedFiles.filter(file=>file.path.startsWith('packages/rpgmaker-event-dsl/src/'));
const captures=fs.readdirSync(external).filter(name=>/^capture-v\d+$/.test(name)).map(name=>{const file=JSON.parse(fs.readFileSync(path.join(external,name,'manifest.json'),'utf8'));return{name,fingerprint:file.fingerprint,files:file.files.length};});
const results=fs.readdirSync(path.join(external,'results')).filter(name=>name.endsWith('.json')).map(name=>JSON.parse(fs.readFileSync(path.join(external,'results',name),'utf8')));
const statuses={};const requirements={};
for(const result of results){statuses[result.status]=(statuses[result.status]??0)+1;requirements[result.requirementId]??={};requirements[result.requirementId][result.status]=(requirements[result.requirementId][result.status]??0)+1;}
const record={base,head:git(['rev-parse','HEAD']).toString().trim(),contract:'mv-1.6.1/10',originals,productFiles,productFingerprint:sha(JSON.stringify(productFiles)),changedFiles,changedFingerprint:sha(JSON.stringify(changedFiles)),captures,resultCount:results.length,statuses,requirements};
const output=path.join(external,'screen-source-provenance-v1.json');if(fs.existsSync(output))throw Error('Append-only output exists');fs.writeFileSync(output,JSON.stringify(record,null,2)+'\n');
copyBytes(fs.readFileSync(output),path.join(history,'provenance',path.basename(output)));
process.stdout.write(JSON.stringify({productFiles:productFiles.length,productFingerprint:record.productFingerprint,changedFiles:changedFiles.length,captures,resultCount:record.resultCount,statuses,screenRequirements:Object.fromEntries(Object.entries(requirements).filter(([id])=>id.startsWith('MV-S6-SCREEN'))),output})+'\n');
