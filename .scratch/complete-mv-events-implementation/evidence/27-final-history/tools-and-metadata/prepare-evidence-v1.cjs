const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');const assert=require('node:assert/strict');
const root='M:/Shuen/Codex/mv-events-implementation-20261020/worktrees/mv-ticket-27-final';
const testRoot='packages/rpgmaker-event-dsl/test/';const evidence='.scratch/complete-mv-events-implementation/evidence/';
const unitGroups=[
 ['001',['preserves numeric saved choice indices with negative zero','preserves saved default and cancel index','locates preserved out-of-count saved indices']],
 ['002',['preserves named $position/$background modes','treats optional undefined as omission']],
 ['003',["keeps a valid nested raw body's marker",'refuses a $name','rejects a raw own marker','rejects a %s cancel branch','rejects empty absent','rejects unsupported 403']],
 ['004',['visits unreachable choice and cancel bodies']],
 ['005',['rejects unsupported E102 slot','rejects forged Choices','rejects non-data own fields']],
];
const workspaceGroups=[
 ['006',['preserves numeric saved choice indices through Workspace']],
 ['007',['round trips native cancel and nested body markers','round trips all one-to-six item lists']],
 ['008',['preserves the fixed one-choice defaults']],
 ['009',['rejects a removed field','refuses native $name']],
 ['010',['keeps nested saved scripts']],
];
const mappings=[];
for(const [file,groups] of [['choices.test.ts',unitGroups],['choices-workspace.test.ts',workspaceGroups]]){
 let source=fs.readFileSync(path.join(root,testRoot,file),'utf8');
 if(file==='choices.test.ts'){
  source=source.replace('import { expect, it } from "vitest";','import { afterEach, expect, it } from "vitest";\nimport { recordEvidence } from "./support/mv-evidence.js";');
  const hook=fs.readFileSync(path.join(root,testRoot,'choices-workspace.test.ts'),'utf8').match(/afterEach\(async \(\{ task \}\) => \{[\s\S]*?\n\}\);/)[0];
  source+='\n'+hook+'\n';
 }
 for(const [id,starts] of groups){let names=[];for(const start of starts){const pattern=new RegExp('"('+start.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'[^"\\n]*)"','g');let found=0;source=source.replace(pattern,(_,name)=>{names.push(name);found++;return '"MV-S6-CHOICES-'+id+': '+name+'"'});assert.equal(found,1,start);}
  mappings.push({id:'MV-S6-CHOICES-'+id,path:testRoot+file,name:'MV-S6-CHOICES-'+id+': '+names[0],names});}
 fs.writeFileSync(path.join(root,testRoot,file),source);
}
const list=[
 {code:102,indent:0,parameters:[[' first\r\n',''],-2,5,0,2]},
 {code:402,indent:0,parameters:[0,' first\r\n']},
 {code:102,indent:1,parameters:[[''],-1,-1,1,1]},
 {code:402,indent:1,parameters:[0,'']},
 {code:0,indent:2,parameters:[]},
 {code:404,indent:1,parameters:[]},
 {code:0,indent:1,parameters:[]},
 {code:402,indent:0,parameters:[1,'']},
 {code:230,indent:1,parameters:[1]},
 {code:403,indent:0,parameters:[6,null]},
 {code:0,indent:1,parameters:[]},
 {code:404,indent:0,parameters:[]},
 {code:102,indent:0,parameters:[[''],-0,-0,2,0]},
 {code:402,indent:0,parameters:[0,'']},
 {code:0,indent:1,parameters:[]},
 {code:404,indent:0,parameters:[]},
 {code:0,indent:0,parameters:[]},
];
const nativeText=v=>typeof v==='number'&&Object.is(v,-0)?'-0':Array.isArray(v)?'['+v.map(nativeText).join(',')+']':v&&typeof v==='object'?'{'+Object.entries(v).map(([k,x])=>JSON.stringify(k)+':'+nativeText(x)).join(',')+'}':JSON.stringify(v);
const fixturePath=testRoot+'fixtures/mv-evidence/choices-complete.json';
const fixture={provenance:'Self-authored synthetic saved arrays, independently transcribed from accepted E102/402/403/404 and child-body contract; not native UI capture or compiler output',list,headerMatrix:[[[''],1,0,2,0],[['a',''],0,1,0,2],[['a','',''],-1,-1,1,1],[[' \t','\r','\n',''],2,3,2,2],[['a','b','c','d',''],5,5,1,0],[['',' ','\r','\n','\r\n',''],-2,4,0,1]]};
fs.writeFileSync(path.join(root,fixturePath),nativeText(fixture)+'\n');
for(const [id,name]of [['011','independent Choices roundtrip all three containers and install exact complete carriers'],['012','invalid native mirror has a precise diagnostic and preserves complete state (%s)']])mappings.push({id:'MV-S6-CHOICES-'+id,path:testRoot+'choices-workspace.test.ts',name:'MV-S6-CHOICES-'+id+': '+name,names:[name]});
fs.writeFileSync(path.join(path.dirname(process.argv[1]),'requirement-test-map-v1.json'),JSON.stringify({fixturePath,fixtureSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,fixturePath))).digest('hex'),mappings},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({fixturePath,mappings:mappings.length}));
