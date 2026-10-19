'use strict';
// Root's independent read-only audit. No delivery module or physical guard is loaded.
// This script never launches games or writes to projects, references or seeds.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const cp = require('node:child_process');
const base = 'M:/Shuen/Codex/mv-events-implementation-20261020/ticket27-final';
const repo = 'M:/Shuen/Codex/mv-events-implementation-20261020/worktrees/mv-ticket-27-final';
const originalCases = 'C:/Users/Shuen/.codex/tmp/mv-r3-independent-cases.cjs';
const fixedTools = {
  'choices-physical-delivery-v1.cjs': '841f14c60fe9c746053a338c3bd8520a1d46200656e494dbda926c0ca6752a09',
  'choices-native-pair-adapter-v1.cjs': '0daef3e6640af9e962a5d953aca7b2c2d8d195f2297c085c7925ecda61d15647',
  'choices-scenario-export-v1.cjs': '5a51c9e62d8c4b0c24a83b6ffc619771f318a25b294337e66bd293620111563c',
  'choices-json-v1.cjs': 'f56dbcd4e0896e0ae91fa7b44fe53338aaae7db30f80be5c2a4fd7026ce8bc13',
  'choices-independent-cases-v1.cjs': '0a10cbc94608cf2be0672815ec59654d0336f14621e523435bb169c0919f4737',
  'mv33-physical-isolation-v1.cjs': '22719922029ef212ff34058fead532a3523d96fcb3d649e51bc081dc9b43d786'
};
const key = p => path.resolve(p).replaceAll('\\', '/').toLowerCase();
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const read = async p => JSON.parse(await fs.readFile(p, 'utf8'));
const identify = async p => ({ path:p, sha256:sha(await fs.readFile(p)) });
const generatedNames = ['CommonEvents.json', 'Map001.json', 'System.json', 'Troops.json'];
function signedJson(v) {
  if (typeof v === 'number') { assert.ok(Number.isFinite(v)); return Object.is(v,-0)?'-0':JSON.stringify(v); }
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '['+v.map(signedJson).join(',')+']';
  return '{'+Object.keys(v).map(k=>JSON.stringify(k)+':'+signedJson(v[k])).join(',')+'}';
}
async function physical(root) {
  root=path.resolve(root); const realPath=await fs.realpath(root);
  assert.equal(key(root),key(realPath),'Aliased physical root '+root);
  const entries=[];
  async function walk(file) {
    const stat=await fs.lstat(file,{bigint:true});
    assert.equal(stat.isSymbolicLink(),false,'Link '+file);
    assert.equal(key(await fs.realpath(file)),key(file),'Reparse alias '+file);
    assert.notEqual(stat.ino,0n);
    const entry={path:path.relative(root,file).replaceAll('\\','/')||'.',kind:stat.isDirectory()?'directory':'file',dev:String(stat.dev),ino:String(stat.ino),nlink:String(stat.nlink)};
    if(stat.isDirectory()) {entries.push(entry);for(const name of (await fs.readdir(file)).sort())await walk(path.join(file,name));}
    else {assert.ok(stat.isFile());assert.equal(stat.nlink,1n,'Hardlink '+file);const bytes=await fs.readFile(file);entries.push({...entry,bytes:bytes.length,sha256:sha(bytes)});}
  }
  await walk(root);
  const files=entries.filter(e=>e.kind==='file').map(e=>({path:e.path,bytes:e.bytes,sha256:e.sha256}));
  return {root,realPath,entries,files,sha256:sha(JSON.stringify(files))};
}
function disjoint(trees) {
  const roots=[],identities=new Set();
  for(const tree of Object.values(trees)) {
    const root=key(tree.root);assert.equal(root,key(tree.realPath));
    for(const old of roots)assert.ok(root!==old&&!root.startsWith(old+'/')&&!old.startsWith(root+'/'),'Identical/nested roots');
    roots.push(root);
    assert.deepEqual(tree.entries.filter(e=>e.kind==='file').map(e=>({path:e.path,bytes:e.bytes,sha256:e.sha256})),tree.files);
    assert.equal(sha(JSON.stringify(tree.files)),tree.sha256);
    for(const e of tree.entries) {assert.notEqual(e.ino,'0');const id=e.dev+':'+e.ino;assert.ok(!identities.has(id),'Shared physical identity '+id);identities.add(id);if(e.kind==='file')assert.equal(e.nlink,'1');}
  }
}
async function fingerprint(root) {
  const entries=[];
  async function walk(current) {for(const e of (await fs.readdir(current,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))) {const p=path.join(current,e.name);if(e.isDirectory())await walk(p);else {assert.ok(e.isFile());entries.push({path:path.relative(root,p).replaceAll('\\','/'),sha256:sha(await fs.readFile(p))});}}}
  await walk(root);return {entries,sha256:sha(JSON.stringify(entries))};
}
async function compareFreeze(frozen) {
  assert.equal(key(frozen.root),key(repo));assert.equal(frozen.node.version,'v22.23.0');
  assert.equal(frozen.contract,'mv-1.6.1/13');assert.equal(frozen.git.status,'');assert.equal(frozen.groups.dist.count,15);
  assert.equal(frozen.git.head,cp.execFileSync('git',['-C',repo,'rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim());
  assert.equal(cp.execFileSync('git',['-C',repo,'status','--porcelain=v1'],{encoding:'utf8',windowsHide:true}),'');
  const actualGroups={};
  for(const row of frozen.files) {
    const current=path.join(repo,row.path);assert.equal(key(await fs.realpath(current)),key(row.originalRealpath));
    const retainedStat=await fs.lstat(row.retainedPath,{bigint:true});const currentStat=await fs.lstat(current,{bigint:true});
    assert.ok(retainedStat.isFile()&&!retainedStat.isSymbolicLink());assert.equal(retainedStat.nlink,1n);
    assert.ok(currentStat.isFile()&&!currentStat.isSymbolicLink());assert.equal(currentStat.nlink,1n);
    assert.notEqual(retainedStat.dev+':'+retainedStat.ino,currentStat.dev+':'+currentStat.ino);
    assert.equal(String(retainedStat.dev),row.retainedIdentity.dev);assert.equal(String(retainedStat.ino),row.retainedIdentity.ino);assert.equal(String(retainedStat.nlink),row.retainedIdentity.nlink);
    assert.equal(key(await fs.realpath(row.retainedPath)),key(row.retainedRealpath));
    for(const p of [current,row.retainedPath]) {const bytes=await fs.readFile(p);assert.equal(bytes.length,row.bytes);assert.equal(sha(bytes),row.sha256,'Current/retained '+row.path);}
  }
  for(const [group,dir] of [['source','src'],['tests','test'],['dist','dist']]) {
    const prefix='packages/rpgmaker-event-dsl/'+dir+'/';
    const expected=frozen.files.filter(r=>r.path.startsWith(prefix)).map(r=>({path:r.path,sha256:r.sha256}));
    const actual=await fingerprint(path.join(repo,'packages/rpgmaker-event-dsl',dir));
    assert.deepEqual(actual.entries.map(e=>({path:prefix+e.path,sha256:e.sha256})).sort((a,b)=>a.path.localeCompare(b.path)),[...expected].sort((a,b)=>a.path.localeCompare(b.path)));
    assert.equal(frozen.groups[group].count,expected.length);assert.equal(frozen.groups[group].fingerprint,sha(JSON.stringify(expected)));
    actualGroups[group]=actual;
  }
  const metadataPaths=['.github/workflows/ci.yml','package.json','pnpm-lock.yaml','pnpm-workspace.yaml','tsconfig.base.json','.oxlintrc.json','.oxfmtrc.json','.oxfmtignore','packages/rpgmaker-event-dsl/package.json','packages/rpgmaker-event-dsl/vitest.config.ts','packages/rpgmaker-event-dsl/vitest.windows.config.ts','packages/rpgmaker-event-dsl/tsconfig.json','packages/rpgmaker-event-dsl/tsdown.config.ts','.scratch/complete-mv-events-implementation/evidence/requirements.json'];
  const allPaths=[...metadataPaths,...Object.entries(actualGroups).flatMap(([name,group])=>group.entries.map(e=>'packages/rpgmaker-event-dsl/'+({source:'src',tests:'test',dist:'dist'})[name]+'/'+e.path))].sort();
  assert.deepEqual(frozen.files.map(e=>e.path),allPaths,'Complete execution source/test/config/dist membership');
  assert.equal(frozen.groups.all.count,frozen.files.length);assert.equal(frozen.groups.all.fingerprint,sha(JSON.stringify(frozen.files.map(({path,sha256})=>({path,sha256})))));
  for(const link of frozen.links) {assert.equal(key(await fs.realpath(link.path)),key(link.realpath));const s=await fs.stat(link.path,{bigint:true});assert.equal(String(s.dev),link.dev);assert.equal(String(s.ino),link.ino);}
  return actualGroups;
}
async function main(indexPath,freezePath,freezeHash) {
  assert.equal(process.version,'v22.23.0');assert.match(freezeHash,/^[a-f0-9]{64}$/);
  assert.equal((await identify(freezePath)).sha256,freezeHash);
  const frozen=await read(freezePath),actualGroups=await compareFreeze(frozen);
  for(const [name,hash] of Object.entries(fixedTools))assert.equal((await identify(path.join(base,name))).sha256,hash,name);
  assert.equal((await identify(originalCases)).sha256,fixedTools['choices-independent-cases-v1.cjs']);
  const originals=require(originalCases).choiceCases;assert.equal(originals.length,7);
  const numeric=structuredClone(originals[1]);numeric.id='numeric-saved-both-negative-zero';numeric.list[0].parameters[1]=-0;numeric.list[0].parameters[2]=-0;numeric.choice={savedDefault:-0,nativeDefault:-0,savedCancel:-0,nativeCancel:-0,index:-0};
  const allCases=[...originals,numeric],index=await read(indexPath);
  assert.equal(index.prepared,true);assert.equal(index.passed,false);assert.equal(index.results.length,8);
  assert.equal((await identify(index.pointer.manifest)).sha256,index.pointer.sha256);
  const manifest=await read(index.pointer.manifest);assert.equal(manifest.bound.length,8);
  assert.equal(key(manifest.builtInput.path),key(freezePath));assert.equal(manifest.builtInput.sha256,freezeHash);assert.deepEqual(manifest.builtInput.groups,frozen.groups);
  assert.equal(manifest.wrapper.sha256,fixedTools['choices-physical-delivery-v1.cjs']);assert.equal(key(manifest.wrapper.path),key(path.join(base,'choices-physical-delivery-v1.cjs')));
  assert.deepEqual(manifest.tools.map(t=>path.basename(t.path)).sort(),Object.keys(fixedTools).filter(n=>n!=='choices-physical-delivery-v1.cjs').sort());
  for(const tool of manifest.tools) {assert.equal(key(tool.path),key(path.join(base,path.basename(tool.path))));assert.equal(tool.sha256,fixedTools[path.basename(tool.path)]);}
  const full={reference:await physical(manifest.reference),seed:await physical(manifest.seedRoot)};disjoint(full);
  assert.equal(full.reference.files.length,1100);assert.deepEqual(full.reference.files,full.seed.files);assert.deepEqual(full,manifest.before.trees);assert.deepEqual(full,manifest.after.trees);assert.deepEqual(manifest.copy.source,full.reference);assert.deepEqual(manifest.copy.destination,full.seed);
  const allIdentities=new Set();for(const tree of Object.values(full))for(const e of tree.entries)allIdentities.add(e.dev+':'+e.ino);
  const cases=[],appNames=new Set();
  for(let ordinal=0;ordinal<8;ordinal++) {
    const item=index.results[ordinal],bound=manifest.bound[ordinal];assert.equal(item.id,allCases[ordinal].id);assert.equal(bound.id,item.id);assert.equal(item.prepared,true);assert.equal(item.passed,false);
    assert.equal((await identify(bound.path)).sha256,bound.sha256);const bundle=await read(bound.path);assert.deepEqual(bundle.test,allCases[ordinal]);
    const reportPath=path.join(item.root,'preparation-result.json'),report=await read(reportPath);
    assert.equal(report.prepared,true);assert.equal(report.passed,false);assert.equal(report.options.mode,'prepare');assert.ok(report.nativeExecution.startsWith('not-executed'));
    assert.deepEqual(report.lifecycle.map(x=>{assert.equal(x.ok,true);return x.name;}),['public init','public Clone','public Decompile','formal owned source edits','public Check','public Compile','public Diff','public Push']);
    assert.equal(report.build.gitHead,frozen.git.head);assert.equal(report.build.gitStatus,'');assert.equal(report.build.toolNodeSha256,frozen.node.sha256);
    assert.deepEqual(report.build.source,actualGroups.source);assert.deepEqual(report.build.dist,actualGroups.dist);assert.equal(report.build.harnessSha256,fixedTools['choices-native-pair-adapter-v1.cjs']);assert.equal(report.build.scenarioSha256,fixedTools['choices-physical-delivery-v1.cjs']);
    assert.equal(report.inputBinding.independentFixture.sha256,bound.sha256);assert.equal(key(report.inputBinding.independentFixture.path),key(bound.path));assert.deepEqual(report.inputBinding.completeInputIdentities,bundle.completeInputIdentities);
    assert.equal(Object.keys(bundle.fixture.carriers).length,15);assert.deepEqual(Object.keys(bundle.fixture.loadedCarriers).sort(),generatedNames);assert.deepEqual(report.inputBinding.expectedGeneratedCarriers,generatedNames);
    assert.equal(report.checkStateUnchanged,true);assert.equal(report.sourceEdits.length,1);assert.equal(report.completeGeneratedCarrierComparison.passed,true);assert.deepEqual(report.completeGeneratedCarrierComparison.files,generatedNames);
    assert.equal(report.completeCarrierComparison.passed,true);assert.equal(report.completeCarrierComparison.files.length,15);assert.deepEqual(Object.keys(report.generated.values).sort(),generatedNames);
    const publication=report.publication.files['Map001.json'];assert.equal(publication.actualReplacementProven,true);assert.notEqual(publication.beforePushSha256,publication.afterPushSha256);assert.equal(publication.generatedSha256,publication.afterPushSha256);
    const current={reference:await physical(path.join(manifest.reference,'data')),seed:await physical(path.join(manifest.seedRoot,'data'))};
    for(const side of ['literal','compiled']) {
      assert.equal(Object.hasOwn(report.sides[side],'native'),false);const project=report.sides[side].project;
      current[side]=await physical(path.join(project,'data'));assert.equal(current[side].files.length,15);
      for(const f of current[side].files) {assert.deepEqual(await read(path.join(current[side].root,f.path)),bundle.fixture.carriers[f.path],item.id+' '+side+' '+f.path);assert.equal(f.sha256,report.completeCarrierComparison[side+'Hashes'][f.path]);}
      const fullSide=await physical(project),copy=report.fullPhysicalCopies[side];assert.equal(copy.passed,true);assert.deepEqual(copy.source,full.seed);assert.deepEqual(copy.destination.files,full.seed.files);disjoint({reference:full.reference,seed:full.seed,sideAtCopy:copy.destination});
      for(const e of fullSide.entries) {const id=e.dev+':'+e.ino;assert.ok(!allIdentities.has(id),'Cross-case or protected full identity '+id);allIdentities.add(id);}
      const originalEntries=new Map(copy.destination.entries.map(e=>[e.path,e]));
      for(const e of fullSide.entries) {const old=originalEntries.get(e.path);if(old) {if(!(e.kind==='file'&&e.path.startsWith('data/'))) {assert.equal(e.dev,old.dev);assert.equal(e.ino,old.ino);}if(e.kind==='file'&&!['index.html','package.json','Game.rpgproject'].includes(e.path)&&!e.path.startsWith('data/'))assert.equal(e.sha256,old.sha256);}}
      assert.equal(fullSide.files.length,copy.destination.files.length+2); // Game.rpgproject and observer.js only.
      const packageManifest=await read(path.join(project,'package.json'));assert.match(packageManifest.name,/^mv-native-pair-[a-f0-9-]{36}$/);assert.ok(!appNames.has(packageManifest.name));appNames.add(packageManifest.name);
      assert.deepEqual(packageManifest,{name:packageManifest.name,main:'index.html',window:{show:false,width:816,height:624,icon:'icon/icon.png'},'chromium-args':'--mute-audio'});
      assert.equal(await fs.readFile(path.join(project,'Game.rpgproject'),'utf8'),'RPGMV 1.6.1\n');
      const sourceIndex=await fs.readFile(path.join(manifest.seedRoot,'index.html'),'utf8'),mainTag='<script type="text/javascript" src="js/main.js"></script>';
      assert.ok(sourceIndex.includes(mainTag));assert.equal(await fs.readFile(path.join(project,'index.html'),'utf8'),sourceIndex.replace(mainTag,'<script type="text/javascript" src="observer.js"></script>'+mainTag));
      assert.equal((await identify(path.join(project,'observer.js'))).sha256,report.sides[side].observerSha256);
      await fs.access(path.join(project,'runtime-result.json')).then(()=>assert.fail('Native report exists during preparation'),e=>assert.equal(e.code,'ENOENT'));
      await fs.access(path.join(project,'NativeProfile')).then(()=>assert.fail('Native profile exists during preparation'),e=>assert.equal(e.code,'ENOENT'));
    }
    assert.equal(key(report.options.host),key('F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/nwjs-win-test/game.exe'));
    assert.equal((await identify(report.options.host)).sha256,report.nativeIdentity.host.sha256);
    for(const [name,hash] of Object.entries(report.nativeIdentity.engine))assert.equal((await identify(path.join(manifest.seedRoot,'js',name))).sha256,hash);
    disjoint(current);
    for(const name of generatedNames)assert.deepEqual(report.generated.values[name],bundle.fixture.carriers[name]);
    assert.equal(report.isolationCheckpoints.length,71);let literalBaseline;
    for(const checkpoint of report.isolationCheckpoints) {assert.equal(checkpoint.passed,true);disjoint(checkpoint.trees);for(const name of ['reference','seed'])assert.deepEqual(checkpoint.trees[name],report.isolationCheckpoints[0].trees[name]);if(checkpoint.label==='freeze literal independent complete input')literalBaseline=checkpoint.trees.literal;if(literalBaseline)assert.deepEqual(checkpoint.trees.literal,literalBaseline);}
    assert.equal(report.isolationCheckpoints.at(-1).label,'after complete product publication');assert.deepEqual(report.isolationCheckpoints.at(-1).trees,current);assert.deepEqual(literalBaseline,current.literal);
    assert.ok(report.fullProtectedCheckpoints.length>=6);for(const checkpoint of report.fullProtectedCheckpoints) {assert.equal(checkpoint.passed,true);assert.deepEqual(checkpoint.trees,full);}
    const proofPath=path.join(item.root,'physical-isolation-proof.json'),proof=await read(proofPath);assert.equal(proof.passed,true);assert.equal(proof.mode,'prepare');assert.deepEqual(proof.checkpoints,report.isolationCheckpoints);assert.deepEqual(proof.literalBaseline,current.literal);
    const list=bundle.fixture.carriers['Map001.json'].events[1].pages[0].list;
    assert.equal(list[0].code,122);assert.deepEqual(list.slice(1),allCases[ordinal].list);
    if(ordinal===7) {for(const slot of [1,2]) {assert.ok(Object.is(list[1].parameters[slot],-0));assert.ok(Object.is(report.generated.values['Map001.json'].events[1].pages[0].list[1].parameters[slot],-0));assert.ok(Object.is(bundle.fixture.loadedCarriers['Map001.json'].events[1].pages[0].list[1].parameters[slot],-0));}}
    cases.push({id:item.id,prepared:true,report:await identify(reportPath),proof:await identify(proofPath),input:await identify(bound.path),dataCheckpoints:report.isolationCheckpoints.length,fullCheckpoints:report.fullProtectedCheckpoints.length});
  }
  assert.equal(appNames.size,16);
  return {at:new Date().toISOString(),purpose:'Root read-only independent exact Choices27 prepare-only release audit; no games launched',index:await identify(indexPath),manifest:await identify(index.pointer.manifest),freeze:await identify(freezePath),revision:frozen.git.head,contract:frozen.contract,inputGroups:frozen.groups,tools:fixedTools,originalSevenRetained:true,numericNegativeZeroPrepared:true,referenceFiles:full.reference.files.length,seedFiles:full.seed.files.length,cases,passed:true};
}
if(require.main===module) {
  const out=path.join(__dirname,'choices27-root-prepare-release-'+crypto.randomUUID()+'.json');
  main(process.argv[2],process.argv[3],process.argv[4]).then(async result=>{await fs.writeFile(out,signedJson(result)+'\n',{flag:'wx'});console.log(JSON.stringify({out,sha256:sha(await fs.readFile(out)),passed:true,cases:result.cases.length}));}).catch(async error=>{const failure={at:new Date().toISOString(),purpose:'Original root prepare-only audit failure; no games launched',index:process.argv[2],passed:false,error:String(error.stack||error)};await fs.writeFile(out,JSON.stringify(failure,null,2)+'\n',{flag:'wx'});console.error(JSON.stringify({out,...failure}));process.exitCode=1;});
}
module.exports={main};
