const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = 'M:/Shuen/Codex/mv-events-implementation-20261020/worktrees/mv-ticket-38';
const relative = 'packages/rpgmaker-event-dsl/test/fixtures/mv-evidence/picture-parameters.json';
const sha256 = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relative))).digest('hex');
const cases = [
 ['001','Complete Picture public command and native parameter domains','pictures.test.ts','preserves explicit Show Picture None and every independent display field','synthetic-support'],
 ['002','Complete Picture matrix through actual Workspace and real Push','pictures-workspace.test.ts','preserves complete independent Picture matrix through discovered source and real Push','synthetic-support'],
 ['003','Actual Picture helper/direct/nested fields reject projection loss','pictures-workspace.test.ts','rejects evaluated','synthetic-rejection'],
 ['004','Picture malformed native and known raw refusal preserves complete state','pictures-workspace.test.ts','refuses ${origin} Picture shape','synthetic-rejection'],
 ['005','Picture signed numeric zero through formal direct and raw real Push','pictures-workspace.test.ts','preserves signed Picture values from actual','synthetic-support'],
 ['006','Picture current public types reject incomplete and legacy forms','pictures-workspace.test.ts','public types reject incomplete or legacy Picture form','synthetic-rejection'],
 ['R6','Picture allocated R6 actual current built game validation pending',null,null,'game-observation']
];
const rows = cases.map(([suffix,title,file,name,kind])=>({
 id:`MV-S6-PICTURE-${suffix}`, title,
 sources:[{path:'.scratch/complete-mv-events/research/command-parameters/visual-map.md',section:'### E231'},{path:'.scratch/complete-mv-events-implementation/issues/38-picture-complete-parameters.md',section:'## Acceptance criteria'}],
 dimensions:['A1','A2','A3','A4','A5','A6','A7','A8'], classifications:['positive','negative','boundary','combination'], sourceKind:kind,
 input:suffix==='R6'?'Current built product and independent native pair with self-authored picture assets, not executed in focused DEV.':'Independent complete native Picture literals and actual public source, including None, signed zero, exact mode/enum/reserved slots and negative inputs; not editor or game captures.',
 fixture:{path:relative,sha256}, expected:title,
 ...(file?{test:{path:`packages/rpgmaker-event-dsl/test/${file}`,name}}:{review:{path:'.scratch/complete-mv-events-implementation/evidence/38-picture-complete-parameters.md',section:'## R6 — pending actual game validation'}}),
 nativeGroups:suffix==='R6'?['R6']:[], execution:{environment:'Windows / Node22 source and actual built Workspace API; native layer pending',owner:'Codex automated verification',layer:suffix==='R6'?'Pending actual current built product and literal native game pair':'Public command and actual Workspace source/filesystem boundary'},slice:'38 / S6',required:true
}));
const requirementsPath=path.join(root,'.scratch/complete-mv-events-implementation/evidence/requirements.json');
const original=fs.readFileSync(requirementsPath,'utf8');
if(original.includes('MV-S6-PICTURE-001'))throw Error('already appended');
const end=original.match(/\r?\n  \]\r?\n\}\r?\n?$/);
if(!end)throw Error('unexpected index ending');
const addition=rows.map(row=>JSON.stringify(row,null,2).split('\n').map(line=>'    '+line).join('\n')).join(',\n');
fs.writeFileSync(requirementsPath,original.slice(0,end.index)+',\n'+addition+end[0]);
const readmePath=path.join(root,'.scratch/complete-mv-events-implementation/evidence/README.md');
fs.appendFileSync(readmePath,'\nTicket38 focused DEV uses independent Picture literals and actual Workspace operations. Full/build/built/native remain pending.\n\n| Requirement | Obligation | Evidence kind | Required layer |\n| --- | --- | --- | --- |\n'+rows.map(row=>`| ${row.id} | ${row.title} | ${row.sourceKind} | ${row.execution.layer} |`).join('\n')+'\n');
console.log(JSON.stringify({sha256,incoming:JSON.parse(original).requirements.length,appended:rows.length,total:JSON.parse(fs.readFileSync(requirementsPath,'utf8')).requirements.length}));
