const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const {pathToFileURL} = require('node:url');
const {isDeepStrictEqual} = require('node:util');
const packageRoot = 'C:/Users/Shuen/.codex/worktrees/mv-ticket-23/rpgmaker-event-dsl/packages/rpgmaker-event-dsl';
const mode = process.argv[2];
if (!['empty', 'null-only', 'negative-zero-trigger'].includes(mode)) throw new Error('mode');
const root = 'C:/Users/Shuen/.codex/tmp/mv23-merger-common-' + mode + '-' + crypto.randomUUID();
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
async function tree(directory) {
  const result = {};
  async function visit(current, prefix) {
    for (const e of (await fs.readdir(current, {withFileTypes:true})).sort((a,b) => a.name.localeCompare(b.name))) {
      const key = prefix + e.name, file = path.join(current,e.name);
      if (e.isDirectory()) await visit(file,key+'/');
      else if (e.isFile()) result[key] = sha(await fs.readFile(file));
    }
  }
  try { await visit(directory,''); return result; } catch (error) { if(error.code==='ENOENT')return null; throw error; }
}
async function observe() {
  const state = path.join(root,'.rpgmaker-event-dsl');
  return {config:sha(await fs.readFile(path.join(root,'rpgmaker-event-dsl.config.json'))), descriptor:sha(await fs.readFile(path.join(root,'Game/Game.rpgproject'))), project:await tree(path.join(root,'Game/data')), snapshot:await tree(path.join(state,'project-data-snapshot')), generated:await tree(path.join(state,'generated-project-data')), source:await tree(path.join(root,'src')), manifest:sha(await fs.readFile(path.join(state,'sync-manifest.json')))};
}
(async () => {
  await fs.mkdir(path.join(root,'Game/data'),{recursive:true});
  await fs.writeFile(path.join(root,'Game/Game.rpgproject'),'RPGMV 1.6.1\n');
  const fixture = JSON.parse(await fs.readFile(path.join(packageRoot,'test/fixtures/mv-evidence/common-event-project.json'),'utf8'));
  for(const [name,value] of Object.entries(fixture.projectFiles)) await fs.writeFile(path.join(root,'Game/data',name),JSON.stringify(value));
  const original = mode==='empty' ? [] : mode==='null-only' ? [null] : [null,{id:1,name:'Boundary',trigger:-0,switchId:1,list:[{code:0,indent:0,parameters:[]}]}];
  const originalText = JSON.stringify(original).replace('"trigger":0','"trigger":-0');
  await fs.writeFile(path.join(root,'Game/data/CommonEvents.json'),originalText);
  await fs.writeFile(path.join(root,'package.json'),'{"type":"module"}\n');
  const localPackage = path.join(root,'node_modules/rpgmaker-event-dsl');
  await fs.mkdir(localPackage,{recursive:true});
  await fs.writeFile(path.join(localPackage,'package.json'),JSON.stringify({name:'rpgmaker-event-dsl',type:'module',exports:{'.':{types:'./dist/index.d.mts'}}}));
  await fs.symlink(path.join(packageRoot,'dist'),path.join(localPackage,'dist'),'junction');
  const api = await import(pathToFileURL(path.join(packageRoot,'dist/workspace-api.mjs')).href);
  const revision = cp.execFileSync('git',['rev-parse','HEAD'],{cwd:packageRoot,encoding:'utf8'}).trim();
  const dist = await tree(path.join(packageRoot,'dist'));
  let actual,before;
  try {
    await api.initWorkspace({workspaceRoot:root,projectRoot:'./Game'});
    await api.cloneWorkspace({workspaceRoot:root});
    before=await observe();
    await api.decompileWorkspace({workspaceRoot:root});
    await api.compileWorkspace({workspaceRoot:root,check:false});
    const generated = JSON.parse(await fs.readFile(path.join(root,'.rpgmaker-event-dsl/generated-project-data/CommonEvents.json'),'utf8'));
    actual = {ok:true,originalText,generated,deepEqual:isDeepStrictEqual(original,generated),originalNegativeZero:mode==='negative-zero-trigger'&&Object.is(original[1].trigger,-0),generatedNegativeZero:mode==='negative-zero-trigger'&&Object.is(generated[1].trigger,-0),diff:await api.diffWorkspace({workspaceRoot:root})};
  } catch (error) {
    const after=await observe();
    actual={ok:false,message:error.message,businessStateUnchanged:isDeepStrictEqual(before,after),before,after};
  }
  const report={root,node:process.version,packageRoot,revision,dist,mode,actual};
  await fs.copyFile(__filename,path.join(root,'reproduction-script.cjs'));
  const resultFile=path.join(root,'result.json');
  await fs.writeFile(resultFile,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({resultFile,root,mode,revision,actual}));
})().catch(error=>{console.error(error);process.exitCode=1;});
