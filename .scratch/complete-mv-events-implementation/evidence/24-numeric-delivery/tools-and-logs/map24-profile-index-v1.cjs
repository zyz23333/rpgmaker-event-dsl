'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),cp=require('node:child_process'),{pathToFileURL}=require('node:url');
const repo='C:/Users/Shuen/.codex/worktrees/mv-map-numeric-fix/rpgmaker-event-dsl',root=__dirname;
const source=path.join(repo,'packages/rpgmaker-event-dsl/test/support/mv-evidence.ts'),bytes=fs.readFileSync(source),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
let text=bytes.toString();
function once(a,b){assert.equal(text.split(a).length,2,a);text=text.replace(a,b);}
once('export const repositoryRoot = fileURLToPath(new URL("../../../../", import.meta.url));','export const repositoryRoot = '+JSON.stringify(repo) + ';');
once('import { z } from "zod";','import { z } from '+JSON.stringify(pathToFileURL(require.resolve('zod',{paths:[path.join(repo,'packages/rpgmaker-event-dsl')]})).href)+';');
once('  const index = await readRequirements();','  const profileStart=performance.now(); const index = await readRequirements(); const requirementStart=performance.now();');
once('  const resultsRoot = join(evidenceRoot, "results");','  const requirementMs=performance.now()-requirementStart; const resultsRoot = join(evidenceRoot, "results");');
once('  for (const path of await listFiles(resultsRoot)) {','  const listStart=performance.now(); const resultPaths=await listFiles(resultsRoot); const listMs=performance.now()-listStart; let resultReadMs=0,resultParseMs=0,resultCheckMs=0,resultCount=0; const resultStart=performance.now();\n  for (const path of resultPaths) {');
once('    const result = resultSchema.parse(JSON.parse(await readFile(path, "utf8")));','    const readStart=performance.now(); const resultBytes=await readFile(path, "utf8"); resultReadMs+=performance.now()-readStart; const parseStart=performance.now(); const result = resultSchema.parse(JSON.parse(resultBytes)); resultParseMs+=performance.now()-parseStart; const checkStart=performance.now(); resultCount++;');
once('      throw new Error(`Passing result has a difference: ${path}`);','      throw new Error(`Passing result has a difference: ${path}`);\n    resultCheckMs+=performance.now()-checkStart;');
once('\nasync function listFiles(directory: string): Promise<string[]> {','\nasync function listFiles(directory: string): Promise<string[]> {');
// Insert at the original function end; keep every original validation and original sorted/list order.
once('  }\n}\n\nasync function listFiles', '  }\n  process.stdout.write(JSON.stringify({sourcePath:'+JSON.stringify(source)+',sourceSha256:'+JSON.stringify(sha(bytes))+',totalMs:performance.now()-profileStart,requirementMs,listMs,resultMs:performance.now()-resultStart,resultReadMs,resultParseMs,resultCheckMs,resultCount,requirements:index.requirements.length})+"\\n");\n}\n\nasync function listFiles');
const target=path.join(root,'profile-index-instrumented-'+crypto.randomUUID()+'.mts');fs.writeFileSync(target,text+'\nawait validateRequirements();\n',{flag:'wx'});
const snapshot=path.join(root,'profile-index-original-'+sha(bytes)+'.ts');if(!fs.existsSync(snapshot))fs.writeFileSync(snapshot,bytes,{flag:'wx'});
const loader=require.resolve('tsx',{paths:[path.join(repo,'packages/rpgmaker-event-dsl')]}),result=cp.spawnSync(process.execPath,['--import',pathToFileURL(loader).href,target],{cwd:repo,encoding:'utf8',windowsHide:true,env:process.env});
const out=path.join(root,'profile-index-result-'+crypto.randomUUID()+'.json');fs.writeFileSync(out,JSON.stringify({source:{path:source,sha256:sha(bytes),snapshot},instrumented:{path:target,sha256:sha(fs.readFileSync(target))},at:new Date().toISOString(),node:process.execPath,status:result.status,stdout:result.stdout,stderr:result.stderr},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({output:out,status:result.status,stdout:result.stdout,stderr:result.stderr}));process.exitCode=result.status||0;
