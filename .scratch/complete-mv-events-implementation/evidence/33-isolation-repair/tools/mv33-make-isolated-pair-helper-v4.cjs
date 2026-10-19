'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
let text=fs.readFileSync(path.join(__dirname,'mv33-native-pair-delivery-v3.cjs'),'utf8');
function replace(before,after){assert.equal(text.split(before).length,2,'Unique helper seam: '+before.slice(0,90));text=text.replace(before,after);}
replace('// Ticket33 delivery adapter v2. Retains v1/frozen-v5 process/profile/carrier/runtime checks.','// Ticket33 physical delivery adapter v4. Retains v1/frozen-v5 checks; guards replacement of privately copied startup files.');
replace("      await json(path.join(project,'package.json'),{name:'mv-native-pair-'+crypto.randomUUID(),main:'index.html',window:{show:false,width:816,height:624,icon:'icon/icon.png'},'chromium-args':'--mute-audio'});","      await isolation.writeDataFile(project,'package.json',JSON.stringify({name:'mv-native-pair-'+crypto.randomUUID(),main:'index.html',window:{show:false,width:816,height:624,icon:'icon/icon.png'},'chromium-args':'--mute-audio'},null,2)+'\\n');");
replace("assert.ok(index.includes(main));await fs.writeFile(path.join(project,'index.html'),index.replace(main,'<script type=\"text/javascript\" src=\"observer.js\"></script>'+main),{flag:'wx'});","assert.ok(index.includes(main));await isolation.writeDataFile(project,'index.html',index.replace(main,'<script type=\"text/javascript\" src=\"observer.js\"></script>'+main));");
fs.writeFileSync(path.join(__dirname,'mv33-native-pair-delivery-v4.cjs'),text,{flag:'wx'});
let loader=fs.readFileSync(path.join(__dirname,'mv33-bound-native-scenarios-v2.cjs'),'utf8');
for(const [before,after]of [['mv33-physical-seed-v2-pointer.json','mv33-physical-seed-v3-pointer.json'],['mv33-r1-route-waits-delivery-v3','mv33-r1-route-waits-delivery-v4'],['mv33-r6-r7-movement-delivery-v4','mv33-r6-r7-movement-delivery-v5'],['mv33-native-pair-delivery-v3.cjs','mv33-native-pair-delivery-v4.cjs']]){assert.equal(loader.split(before).length,2);loader=loader.replace(before,after);}
fs.writeFileSync(path.join(__dirname,'mv33-bound-native-scenarios-v3.cjs'),loader,{flag:'wx'});
for(const [file,id]of [['mv33-r1-route-waits-delivery-v4.cjs','r1'],['mv33-r6-r7-movement-delivery-v5.cjs','r6-r7']])fs.writeFileSync(path.join(__dirname,file),"'use strict';\nrequire('./mv33-bound-native-scenarios-v3.cjs').run('"+id+"',__filename).catch(error=>{console.error(error.stack||error);process.exitCode=1;});\n",{flag:'wx'});
console.log('New helper v4, loader v3 and R1-v4/R6-R7-v5 wrappers created; old tools remain untouched.');
