import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.resolve(root, p), 'utf8');
const lineOf = (s, index) => s.slice(0, index).split('\n').length;
const runtimePath = 'references/rmmv-local-runtime-1.6.1/js/rpg_objects.js';
const runtime = read(runtimePath);
const helpPath = 'references/RPGMV/Help/page/01_10.html';
const help = read(helpPath);
const dispatchPath = 'packages/rpgmaker-event-dsl/src/decompiler/dispatch.ts';
const dispatch = read(dispatchPath);
const compilerPath = 'packages/rpgmaker-event-dsl/src/compiler/dispatch.ts';
const compiler = read(compilerPath);
const movementCompilePath = 'packages/rpgmaker-event-dsl/src/commands/movement/compile.ts';
const movementCompile = read(movementCompilePath);
const movementDecompilePath = 'packages/rpgmaker-event-dsl/src/commands/movement/decompile.ts';
const movementDecompile = read(movementDecompilePath);
const handlers = [...runtime.matchAll(/(?:\/\/ ([^\r\n]+)\r?\n)?Game_Interpreter\.prototype\.command(\d+) = function\(\) \{/g)].map(m => ({code: Number(m[2]), name: m[1], line: lineOf(runtime,m.index)}));
const main = handlers.filter(h => h.code < 400);
const continuations = [0,401,402,403,404,405,408,411,412,413,505,601,602,603,604,605,655];
const helpNames = [...help.matchAll(/<a href="(01_10_\d+\.html#p\d+)">([^<]+)<\/a>/g)].map(m => ({name:m[2],href:m[1],line:lineOf(help,m.index)}));
const aliases = {'Change Encounter Disable':'Change Encounter','Getting On and Off Vehicles':'Get on/off Vehicle','Resume BGM':'Replay BGM'};
const norm = n => (n??'').replace(/\s+/g,' ').trim().toLowerCase();
const allSourceFiles = fs.readdirSync(path.resolve(root,'packages/rpgmaker-event-dsl/src/commands'),{recursive:true}).filter(p=>p.endsWith('compile.ts')).map(p=>'packages/rpgmaker-event-dsl/src/commands/'+p.replaceAll('\\','/'));
const compileSources = [{path:compilerPath,source:compiler},...allSourceFiles.map(p=>({path:p,source:read(p)}))];
const result = {
  identity: {runtimePath, runtimeSha256: crypto.createHash('sha256').update(fs.readFileSync(path.resolve(root,runtimePath))).digest('hex'), helpPath,helpSha256: crypto.createHash('sha256').update(fs.readFileSync(path.resolve(root,helpPath))).digest('hex')},
  totals:{runtimeHandlers:handlers.length,primaryRuntimeHandlers:main.length,helpFamilyLinks:helpNames.length,continuations:continuations.length},
  families:main.map(h=>({...h, help:helpNames.find(n=>norm(n.name)===norm(aliases[h.name]??h.name))??null, formalDecompileLines:[...dispatch.matchAll(new RegExp(`case ${h.code}:`,'g'))].map(m=>lineOf(dispatch,m.index)),compileLocations:compileSources.flatMap(s=>[...s.source.matchAll(new RegExp(`code: ${h.code}(?!\\d)`,'g'))].map(m=>({path:s.path,line:lineOf(s.source,m.index)})))})),
  helperInventoryNotes: 'Presence is static dispatch coverage, not a full semantic/parameter test. Structural and continuation records are owned by parent helpers.',
  continuations:continuations.map(code=>({code})),
  movement:[...runtime.matchAll(/Game_Character\.(ROUTE_\w+)\s*=\s*(\d+);/g)].map(m=>({code:Number(m[2]),name:m[1],line:lineOf(runtime,m.index),compileLiteralPresent:movementCompile.includes(`code: ${m[2]},`)||[31,32,33,34,35,36,37,38,39,40].includes(Number(m[2])),decompilerMentionsCode:new RegExp(`(?:case ${m[2]}:|${m[2]}:)`).test(movementDecompile)})),
};
fs.writeFileSync(path.resolve(root,'.scratch/mv-native-support-audit/probes/inventory/inventory.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({totals:result.totals,helpUnmatched:helpNames.filter(n=>!main.some(h=>norm(n.name)===norm(aliases[h.name]??h.name))),missingFormal:result.families.filter(f=>f.formalDecompileLines.length===0),missingCompileLiterals:result.families.filter(f=>f.compileLocations.length===0),movement:result.movement.length},null,2));
