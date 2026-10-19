'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const key=file=>path.resolve(file).replaceAll('\\','/').toLowerCase();
async function physicalTree(root){
  const absolute=path.resolve(root),actual=await fs.realpath(absolute);
  assert.equal(key(actual),key(absolute),'Physical root cannot resolve through any alias: '+root);
  const entries=[];
  async function walk(file){
    const stat=await fs.lstat(file,{bigint:true});
    assert.equal(stat.isSymbolicLink(),false,'Refuse reparse/symbolic data entry: '+file);
    assert.equal(key(await fs.realpath(file)),key(file),'Refuse aliased data entry: '+file);
    const item={path:path.relative(absolute,file).replaceAll('\\','/')||'.',kind:stat.isDirectory()?'directory':'file',dev:stat.dev.toString(),ino:stat.ino.toString(),nlink:stat.nlink.toString()};
    assert.notEqual(item.ino,'0','A real file identity is required: '+file);
    if(stat.isDirectory()){
      entries.push(item);
      for(const name of (await fs.readdir(file)).sort())await walk(path.join(file,name));
    }else{
      assert.equal(stat.isFile(),true,'Only regular data bytes are allowed: '+file);
      assert.equal(stat.nlink,1n,'Refuse hardlinked data entry: '+file);
      const bytes=await fs.readFile(file);entries.push({...item,bytes:bytes.length,sha256:sha(bytes)});
    }
  }
  await walk(absolute);
  const files=entries.filter(e=>e.kind==='file').map(e=>({path:e.path,bytes:e.bytes,sha256:e.sha256}));
  return{root:absolute,realPath:actual,entries,files,sha256:sha(JSON.stringify(files))};
}
async function distinctTrees(roots){
  const trees={};const paths=[];const identities=new Map();
  for(const [name,root]of Object.entries(roots)){
    const tree=await physicalTree(root);trees[name]=tree;const physical=key(tree.realPath);
    for(const previous of paths)assert.ok(physical!==previous.path&&!physical.startsWith(previous.path+'/')&&!previous.path.startsWith(physical+'/'),'Data roots must be independent and non-nested: '+name+' / '+previous.name);
    paths.push({name,path:physical});
    for(const entry of tree.entries){const identity=entry.dev+':'+entry.ino;assert.ok(!identities.has(identity),'Shared physical file/directory identity: '+name+'/'+entry.path+' with '+identities.get(identity));identities.set(identity,name+'/'+entry.path);}
  }
  return{at:new Date().toISOString(),passed:true,trees};
}
async function copyRegularTree(source,destination){
  const before=await physicalTree(source);
  await fs.mkdir(destination); // Deliberately no recursive copy or symlink preservation.
  await physicalTree(destination);
  const ordered=before.entries.filter(e=>e.path!=='.').sort((a,b)=>a.path.split('/').length-b.path.split('/').length||a.path.localeCompare(b.path));
  for(const entry of ordered){
    const from=path.join(source,entry.path),to=path.join(destination,entry.path);
    assert.equal(key(await fs.realpath(path.dirname(to))),key(path.dirname(to)),'Destination parent aliases are forbidden');
    if(entry.kind==='directory')await fs.mkdir(to);
    else{
      const stat=await fs.lstat(from,{bigint:true});assert.equal(stat.isFile(),true);assert.equal(stat.isSymbolicLink(),false);assert.equal(stat.nlink,1n);
      assert.equal(stat.dev.toString(),entry.dev);assert.equal(stat.ino.toString(),entry.ino);
      const bytes=await fs.readFile(from);assert.equal(sha(bytes),entry.sha256,'Input changed during physical copy');
      await fs.writeFile(to,bytes,{flag:'wx'});
      const target=await fs.lstat(to,{bigint:true});assert.equal(target.isFile(),true);assert.equal(target.isSymbolicLink(),false);assert.equal(target.nlink,1n);assert.notEqual(target.dev+':'+target.ino,stat.dev+':'+stat.ino);
    }
  }
  const after=await physicalTree(source),copy=await physicalTree(destination);
  assert.deepEqual(after,before,'Read-only source changed while copying');assert.deepEqual(copy.files,before.files,'Complete copied bytes differ');
  await distinctTrees({source,destination});
  return{source:before,destination:copy,passed:true};
}
function unchanged(before,after,names){for(const name of names)assert.deepEqual(after.trees[name],before.trees[name],'Protected tree changed: '+name);}
async function writeDataFile(directory,name,bytes){
  assert.equal(path.basename(name),name,'Only direct carrier names are writable');
  await physicalTree(directory);
  const file=path.join(directory,name),stat=await fs.lstat(file,{bigint:true});
  assert.equal(stat.isFile(),true);assert.equal(stat.isSymbolicLink(),false);assert.equal(stat.nlink,1n);
  assert.equal(key(await fs.realpath(file)),key(file));
  await fs.writeFile(file,bytes);
  await physicalTree(directory);
}
module.exports={sha,key,physicalTree,distinctTrees,copyRegularTree,unchanged,writeDataFile};
