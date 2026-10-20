const fs=require('node:fs'), cp=require('node:child_process');
const get=(rev,p)=>cp.execFileSync('git',['show',`${rev}:${p}`],{maxBuffer:32*1024*1024}).toString('utf8');
const freeze='M:/Shuen/Codex/mv-events-implementation-20261020/ticket35-temp/premerge-c2-freeze/files/';
const evidence='.scratch/complete-mv-events-implementation/evidence/';
const base='c2a40a41c094ccdda47faccd4399891952739008';
const latest='38542767606ff9712e45d2a8e4894558e3a7d385';
for(const p of [evidence+'README.md',evidence+'requirements.json']) {
 const old=get(base,p), own=fs.readFileSync(freeze+p,'utf8'), incoming=get(latest,p);
 if(p.endsWith('README.md')) {if(!own.startsWith(old))throw Error('old readme prefix');fs.writeFileSync(p,incoming+own.slice(old.length));}
 else {const oldEnd=old.lastIndexOf('\n  ]'),ownEnd=own.lastIndexOf('\n  ]'),incomingEnd=incoming.lastIndexOf('\n  ]');if(own.slice(0,oldEnd)!==old.slice(0,oldEnd))throw Error('old requirements prefix');fs.writeFileSync(p,incoming.slice(0,incomingEnd)+own.slice(oldEnd,ownEnd)+incoming.slice(incomingEnd));}
}
const both=['packages/rpgmaker-event-dsl/README.md','packages/rpgmaker-event-dsl/src/commands/map/authoring.ts','packages/rpgmaker-event-dsl/src/compiler/dispatch.ts','packages/rpgmaker-event-dsl/src/validation/native-parameters.ts'];
const conflict=/^<<<<<<< Updated upstream\r?\n([\s\S]*?)^=======\r?\n([\s\S]*?)^>>>>>>> Stashed changes\r?\n/gm;
for(const p of both)fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace(conflict,(_,a,b)=>a+'\n'+b));
const p='packages/rpgmaker-event-dsl/src/validation/commands.ts';
fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace(conflict,(_,a,b)=>a+(a.includes('assertMapAppearanceInput(node.kind')?'    }\n':'\n')+b));
const d='packages/rpgmaker-event-dsl/src/validation/dsl-command-inputs.ts';
fs.writeFileSync(d,fs.readFileSync(d,'utf8').replace(conflict,(_,a,b)=>b));
const t='packages/rpgmaker-event-dsl/test/snapshot-context.test.ts';
fs.writeFileSync(t,fs.readFileSync(t,'utf8').replace(conflict,()=>`          const diagnostic =
            id === 0 && (kind === "tileset" || kind === "animation")
              ? command!.startsWith("rawDslCommand")
                ? kind === "tileset" ? "MV-E282-PARAMETERS" : "MV-E212-PARAMETERS"
                : kind === "tileset" ? "MV-E282-INPUT" : "MV-E212-INPUT"
              : \`Unknown \${kind} reference id: \${id}\`;
          await expect(compileWorkspace({ workspaceRoot, check: true })).rejects.toThrow(diagnostic);
          await expect(compileWorkspace({ workspaceRoot, check: false })).rejects.toThrow(diagnostic);
`));
const rows=JSON.parse(fs.readFileSync(evidence+'requirements.json')).requirements;
if(rows.length!==302)throw Error('row count '+rows.length);
console.log(JSON.stringify({incomingRows:296,ownRows:6,total:rows.length,contract:'mv-1.6.1/10',rawSuffix:'all recognized commands retain native parameter suffix'}));
