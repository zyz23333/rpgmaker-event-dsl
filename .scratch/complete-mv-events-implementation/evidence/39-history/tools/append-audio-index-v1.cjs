const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=process.argv[2], evidence=path.join(root,'.scratch/complete-mv-events-implementation/evidence');
const indexPath=path.join(evidence,'requirements.json'),original=fs.readFileSync(indexPath,'utf8'),index=JSON.parse(original);
if(index.requirements.length!==296)throw Error('Unexpected incoming count');
const fixture='packages/rpgmaker-event-dsl/test/fixtures/mv-evidence/audio-command-cases.json';
const sha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,fixture))).digest('hex');
const names={
 '001':'reconstructs all audio modes and signed zero through evaluated formal and raw source with real15-carrier Push',
 E4:'Ticket39 allocated E4 shipped audio editor resources and current built product comparison',
 R6:'Ticket39 allocated R6 current built normal-Scene audio and system audio pairs',
};
const rows=Object.entries(names).map(([key,title])=>({
 id:`MV-S6-AUDIO-${key}`,title,
 sources:[{path:'.scratch/complete-mv-events/research/command-parameters/visual-map.md',section:'| AUDIO(folder) |'},{path:'.scratch/complete-mv-events-implementation/issues/39-audio-and-system-audio-settings.md',section:'## Acceptance criteria'}],
 dimensions:['A2','A4','A5','A6','A7','A8'],classifications:['positive','boundary','combination'],
 sourceKind:key==='E4'?'reverse-engineering-observation':key==='R6'?'game-observation':'synthetic-support',
 input:'Self-authored independent literal audio saved records: all13 codes, matching asset categories or explicit None, independent volume/pitch/pan, boundaries and non-step values, numeric negative zero, all three vehicles and seconds fades. Complete15-carrier Map/Common/Troop project.',
 fixture:{path:fixture,sha256},expected:title,
 ...(key==='001'?{test:{path:'packages/rpgmaker-event-dsl/test/audio-commands-workspace.test.ts',name:`MV-S6-AUDIO-001: ${title}`}}:{review:{path:'.scratch/complete-mv-events-implementation/evidence/39-audio-and-system-audio-dev-checkpoint.md',section:key==='E4'?'## E4 pending reverse-engineering comparison':'## R6 pending game observation'}}),
 nativeGroups:key==='001'?[]:[key],execution:{environment:key==='001'?'Windows / Node22 source and current built Workspace API':'Actual identified MV1.6.1 editor resources / native NW0.29.0 and Node22 tooling',owner:'Codex automated verification',layer:key==='001'?'Public helpers and actual Workspace native/source/filesystem boundary':'Pending allocated current built product/native comparison; no DEV acceptance claim'},slice:'39 / S6',required:true,
}));
const closing=original.lastIndexOf('  ]');if(closing<0)throw Error('Index shape');
fs.writeFileSync(indexPath,original.slice(0,closing).replace(/\s*$/u,'')+',\n'+rows.map(row=>JSON.stringify(row,null,2).split('\n').map(line=>'    '+line).join('\n')).join(',\n')+'\n'+original.slice(closing));
fs.appendFileSync(path.join(evidence,'README.md'),'\nTicket39 focused DEV adds independent audio saved literals and public Workspace obligations. E4/R6 remain pending finalization.\n\n| Requirement | Obligation | Evidence kind | Required layer |\n| --- | --- | --- | --- |\n'+rows.map(row=>`| ${row.id} | ${row.title} | ${row.sourceKind} | ${row.execution.layer} |`).join('\n')+'\n');
console.log(JSON.stringify({old:index.requirements.length,added:rows.length,total:299,fixtureSha256:sha256}));
