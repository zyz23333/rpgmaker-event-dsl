const fs=require('node:fs'),path=require('node:path');
const root=process.argv[2];
const files=['src/authoring/index.ts','src/domain/command.ts','src/domain/types.ts','src/commands/audio/authoring.ts','src/decompiler/dispatch.ts','src/compiler/dispatch.ts','test/decompiler.test.ts','test/dsl.test.ts','test/events.test.ts'];
for(const file of files){const target=path.join(root,'packages/rpgmaker-event-dsl',file),before=fs.readFileSync(target,'utf8');fs.writeFileSync(target,before.replaceAll('ResumeBgm','ReplayBgm').replaceAll('resumeBgm','replayBgm'));}
process.stdout.write(JSON.stringify({files})+'\n');
