const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const crypto = require('node:crypto');
const packageRoot = 'C:/Users/Shuen/.codex/worktrees/mv-ticket-20/rpgmaker-event-dsl/packages/rpgmaker-event-dsl';
const root = 'C:/Users/Shuen/.codex/tmp/mv20-merger-unrelated-import-' + crypto.randomUUID();
(async () => {
  await fs.mkdir(path.join(root, 'Game/data'), {recursive:true});
  const fixture = JSON.parse(await fs.readFile(path.join(packageRoot, 'test/fixtures/mv-evidence/common-event-project.json'), 'utf8'));
  await fs.writeFile(path.join(root, 'Game/Game.rpgproject'), 'RPGMV 1.6.1\n');
  for (const [name, data] of Object.entries(fixture.projectFiles)) await fs.writeFile(path.join(root, 'Game/data', name), JSON.stringify(data));
  await fs.writeFile(path.join(root, 'package.json'), '{"type":"module"}\n');
  const fixturePackage = path.join(root, 'node_modules/rpgmaker-event-dsl');
  await fs.mkdir(fixturePackage, {recursive:true});
  await fs.writeFile(path.join(fixturePackage, 'package.json'), JSON.stringify({name:'rpgmaker-event-dsl',type:'module',exports:{'.':{types:'./dist/index.d.mts'}}}));
  await fs.symlink(path.join(packageRoot, 'dist'), path.join(fixturePackage, 'dist'), 'junction');
  const api = await import(pathToFileURL(path.join(packageRoot, 'dist/workspace-api.mjs')).href);
  await api.initWorkspace({workspaceRoot:root,projectRoot:'./Game'});
  await api.cloneWorkspace({workspaceRoot:root});
  const source = `import { commonEvent, nonexistentCommand } from "rpgmaker-event-dsl";\nexport const existing = commonEvent({id:99,name:"Existing",trigger:"none",commands:[nonexistentCommand({})]});\n`;
  await fs.writeFile(path.join(root, 'src/existing.events.ts'), source);
  let actual;
  try { await api.decompileWorkspace({workspaceRoot:root}); actual={ok:true}; }
  catch (error) { actual={ok:false,message:String(error.message)}; }
  const report = {root,node:process.version,packageRoot,source,actual,expected:'Success: existing Entry Identity commonEvent:99 is reliably known, candidate commonEvent:1 does not collide; unrelated missing command import must not trigger full old-source type/reference validation.'};
  await fs.writeFile(path.join(root,'result.json'),JSON.stringify(report,null,2)+'\n');
  process.stdout.write(JSON.stringify(report,null,2)+'\n');
})().catch(error => {process.stderr.write(String(error.stack)+'\n');process.exitCode=1;});
