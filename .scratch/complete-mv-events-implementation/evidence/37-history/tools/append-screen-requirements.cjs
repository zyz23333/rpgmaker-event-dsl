const fs=require('node:fs'); const path=require('node:path'); const crypto=require('node:crypto');
const root=process.argv[2]; const base='.scratch/complete-mv-events-implementation/evidence/';
const file=path.join(root,base,'requirements.json'); const original=fs.readFileSync(file,'utf8');
const incoming=JSON.parse(original).requirements; if(incoming.length!==296) throw Error('Expected actual incoming296');
const fixture='packages/rpgmaker-event-dsl/test/fixtures/mv-evidence/screen-effect-cases.json';
const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,fixture))).digest('hex');
const test='packages/rpgmaker-event-dsl/test/screen-effects-workspace.test.ts';
const titles=[
  'reconstructs every Screen mode and signed zero through evaluated formal and known raw source and real 15-carrier Push',
  'rejects evaluated const spread as-any helper and direct Screen inputs while preserving complete Workspace state',
  'rejects late malformed native Screen slots before source publication without changing existing business state',
];
const additions=titles.map((title,i)=>({id:`MV-S6-SCREEN-00${i+1}`,title,
  sources:[{path:'.scratch/complete-mv-events/research/command-parameters/visual-map.md',section:'### E221'},{path:'.scratch/complete-mv-events-implementation/issues/37-screen-weather-waits-and-movies.md',section:'## Acceptance criteria'}],
  dimensions:['A1','A2','A4','A5','A6','A7','A8'], classifications:i===0?['positive','boundary','combination']:['negative','boundary','combination'],
  sourceKind:i===0?'synthetic-support':'synthetic-rejection', input:'Self-authored literal saved screen commands, signed zero and all owned modes; actual evaluated source or independently malformed native slots. No editor UI or game capture claim.',
  fixture:{path:fixture,sha256:hash},expected:title,test:{path:test,name:`MV-S6-SCREEN-00${i+1}: ${title}`},nativeGroups:[],
  execution:{environment:'Windows / Node22 source and actual built Workspace API',owner:'Codex automated verification',layer:'Public Workspace API, actual source evaluation and complete filesystem state'},slice:'37 / S6',required:true}));
additions.push({id:'MV-S6-SCREEN-R6',title:'Current built normal-Scene screen waits, parallel effects, Weather and Movie runtime acceptance',sources:[{path:'.scratch/complete-mv-events-implementation/issues/37-screen-weather-waits-and-movies.md',section:'## Acceptance criteria'}],dimensions:['A8'],classifications:['positive','boundary','combination'],sourceKind:'game-observation',input:'Current built public candidate and independent literal normal-Scene game pair, physically isolated under the ticket33 gate; not executed in focused DEV.',fixture:{path:fixture,sha256:hash},expected:'Actual deterministic per-side simulation and visible/native observations agree with independent expected behavior; preserve raw failures and candidate identities.',review:{path:base+'37-screen-weather-waits-and-movies-dev-checkpoint.md',section:'## R6 pending game observation'},nativeGroups:['R6'],execution:{environment:'Windows / MV1.6.1 / actual project runtime NW.js',owner:'Codex native verification',layer:'Actual game normal Scenes from current built Workspace output'},slice:'37 / S6',required:true});
const at=original.lastIndexOf('\n  ]'); if(at<0) throw Error('No append boundary');
const updated=original.slice(0,at)+',\n'+additions.map(row=>JSON.stringify(row,null,2).split('\n').map(line=>'    '+line).join('\n')).join(',\n')+original.slice(at);
const parsed=JSON.parse(updated).requirements;if(JSON.stringify(parsed.slice(0,296))!==JSON.stringify(incoming))throw Error('Incoming rows changed');
fs.writeFileSync(file,updated);
fs.appendFileSync(path.join(root,base,'README.md'),'\nTicket37 focused DEV appends independent screen cases; its R6 game gate remains pending.\n\n| Requirement | Obligation | Evidence kind | Required layer |\n| --- | --- | --- | --- |\n'+additions.map(row=>`| ${row.id} | ${row.title} | ${row.sourceKind} | ${row.execution.layer} |`).join('\n')+'\n');
fs.writeFileSync(path.join(process.env.TEMP,'37-incoming-rows.json'),JSON.stringify({count:incoming.length,incomingSha256:crypto.createHash('sha256').update(original).digest('hex'),finalCount:parsed.length,addedIds:additions.map(row=>row.id)},null,2));
