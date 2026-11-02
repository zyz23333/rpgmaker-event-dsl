import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';
const [runtimeArg,nwArg,scenario,outputArg]=process.argv.slice(2);
if(!runtimeArg||!nwArg||!outputArg||!['front','side','override'].includes(scenario))throw new Error('Expected runtime directory, NW Game.exe, front|side|override, new output directory');
const runtime=resolve(runtimeArg),nw=resolve(nwArg),output=resolve(outputArg),probe=dirname(fileURLToPath(import.meta.url));
await mkdir(output);
await cp(dirname(nw),output,{recursive:true});
await cp(join(runtime,'js'),join(output,'js'),{recursive:true});
await cp(join(runtime,'data'),join(output,'data'),{recursive:true});
for(const file of ['index.html','native-battlers.js'])await cp(join(probe,file),join(output,file));
await writeFile(join(output,'package.json'),JSON.stringify({name:'mv-n05-n06-native-evidence',main:'index.html',window:{show:false,width:64,height:64},'chromium-args':'--autoplay-policy=no-user-gesture-required --disable-gpu'},null,2));
await writeFile(join(output,'scenario.json'),JSON.stringify({scenario}));
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let n=0;n<8;n++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^0xffffffff)>>>0;}
function chunk(type,data){const tag=Buffer.from(type),size=Buffer.alloc(4),crc=Buffer.alloc(4);size.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([tag,data])));return Buffer.concat([size,tag,data,crc]);}
function png(width,height,rgba){const header=Buffer.alloc(13);header.writeUInt32BE(width,0);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;const raw=Buffer.alloc((width*4+1)*height);for(let y=0;y<height;y++)for(let x=0;x<width;x++)for(let c=0;c<4;c++)raw[y*(width*4+1)+1+x*4+c]=rgba[c];return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
const generated=[];
async function image(relative,width,height,rgba,role){await mkdir(dirname(join(output,relative)),{recursive:true});await writeFile(join(output,relative),png(width,height,rgba));generated.push({relative,role,generator:{method:'self-made RGBA PNG with PNG CRC32 and zlib',width,height,rgba}});}
await image('img/enemies/ModeEnemy.png',80,96,[255,0,0,255],'N05 same Enemy front-view sample; N06 background battle support');
await image('img/sv_enemies/ModeEnemy.png',96,80,[0,255,0,255],'N05 same Enemy side-view sample; N06 background battle support');
for(const [name,rgba] of [['InitialCharacter',[255,0,255,255]],['CurrentCharacter',[0,255,255,255]]])await image(`img/characters/${name}.png`,576,384,rgba,'N06 saved initial versus current runtime character; N05 background party support');
for(const [name,rgba] of [['InitialBattler',[255,255,0,255]],['CurrentBattler',[0,0,255,255]]])await image(`img/sv_actors/${name}.png`,576,384,rgba,'N06 saved initial versus current runtime SV; N05 background party support');
await image('img/battlebacks1/ProbeBackdrop1.png',1000,740,[20,20,20,255],'background scene support, outside native relationship claim');
await image('img/battlebacks2/ProbeBackdrop2.png',1000,740,[40,40,40,255],'background scene support, outside native relationship claim');
for(const [name,w,h] of [['Window',192,192],['Loading',128,128],['Shadow1',48,48],['Shadow2',48,48],['Balloon',384,384],['States',768,96],['IconSet',512,512],['Damage',240,160],['Weapons1',576,384],['Weapons2',576,384],['Weapons3',576,384],['ButtonSet',288,96]])await image(`img/system/${name}.png`,w,h,[128,128,128,255],'background scene support, outside Event Asset Use selection');
const audio=()=>({name:'',volume:90,pitch:100,pan:0});
const command=(code,parameters=[],indent=0)=>({code,parameters,indent});
function page(list){return{conditions:{actorId:1,actorValid:false,itemId:1,itemValid:false,selfSwitchCh:'A',selfSwitchValid:false,switch1Id:1,switch1Valid:false,switch2Id:1,switch2Valid:false,variableId:1,variableValid:false,variableValue:0},directionFix:false,image:{characterIndex:0,characterName:'',direction:2,pattern:1,tileId:0},list,moveFrequency:3,moveRoute:{list:[command(0)],repeat:true,skippable:false,wait:false},moveSpeed:3,moveType:0,priorityType:1,stepAnime:false,through:false,trigger:0,walkAnime:true};}
const finished=page([command(0)]);finished.conditions.selfSwitchValid=true;
const launch=page([command(301,[0,1,false,true]),command(0)]);launch.trigger=3;
const change=page([command(322,[1,'CurrentCharacter',3,'',0,'CurrentBattler']),command(129,[1,0,false]),command(355,['window.nativeProbeOverrideCommandsComplete();']),command(123,['A',0]),command(0)]);change.trigger=3;
const gated=page([command(301,[0,1,false,true]),command(0)]);gated.trigger=3;gated.conditions.switch1Valid=true;
const events=scenario==='override'?[null,{id:1,name:'N06 override and add',note:'',x:9,y:6,pages:[change,finished]},{id:2,name:'N06 battle after observed map draw',note:'',x:10,y:6,pages:[gated]}]:[null,{id:1,name:'N05 real fixed Battle Processing',note:'',x:9,y:6,pages:[launch]}];
const map={autoplayBgm:false,autoplayBgs:false,battleback1Name:'ProbeBackdrop1',battleback2Name:'ProbeBackdrop2',bgm:audio(),bgs:audio(),disableDashing:false,displayName:'',encounterList:[],encounterStep:30,height:15,width:20,note:'',scrollType:0,parallaxLoopX:false,parallaxLoopY:false,parallaxName:'',parallaxShow:true,parallaxSx:0,parallaxSy:0,specifyBattleback:true,tilesetId:1,data:Array(20*15*6).fill(0),events};
const system=JSON.parse(await readFile(join(runtime,'data/System.json'),'utf8'));
system.partyMembers=scenario==='override'?[]:[1];system.optSideView=scenario!=='front';system.optFollowers=false;system.optTransparent=false;system.hasEncryptedImages=false;system.hasEncryptedAudio=false;system.encryptionKey='';system.title1Name='';system.title2Name='';system.battlerName='';system.battleback1Name='';system.battleback2Name='';
for(const key of ['battleBgm','victoryMe','defeatMe','gameoverMe','titleBgm'])system[key]=audio();system.sounds=system.sounds.map(audio);for(const key of ['boat','ship','airship'])system[key]={...system[key],characterName:'',startMapId:0,bgm:audio()};
const actorBase=JSON.parse(await readFile(join(runtime,'data/Actors.json'),'utf8'))[1];
const actor={...actorBase,id:1,name:'Native candidate Actor',characterName:'InitialCharacter',characterIndex:0,battlerName:'InitialBattler',faceName:'',faceIndex:0,equips:[0,0,0,0,0],traits:[]};
const enemyBase=JSON.parse(await readFile(join(runtime,'data/Enemies.json'),'utf8'))[1];
const enemy={...enemyBase,id:1,name:'Same mode Enemy',battlerName:'ModeEnemy',battlerHue:0,actions:[],traits:[],params:[100,10,10,10,10,10,10,10]};
const fixtures={'System.json':system,'Actors.json':[null,actor],'Enemies.json':[null,enemy],'Troops.json':[null,{id:1,name:'Fixed native Troop',members:[{enemyId:1,x:400,y:300,hidden:false}],pages:[]}],'Map001.json':map,'MapInfos.json':[null,{id:1,expanded:true,name:'N05 N06 probe',order:1,parentId:0,scrollX:0,scrollY:0}],'CommonEvents.json':[null],'Tilesets.json':[null,{id:1,name:'No tiles',mode:1,note:'',tilesetNames:Array(9).fill(''),flags:Array(8192).fill(0)}]};
for(const[file,value]of Object.entries(fixtures))await writeFile(join(output,'data',file),JSON.stringify(value));
const sha=async path=>createHash('sha256').update(await readFile(path)).digest('hex');
async function tree(dir,prefix=''){const rows=[];for(const entry of await readdir(dir,{withFileTypes:true})){const relative=prefix?`${prefix}/${entry.name}`:entry.name;if(entry.isDirectory())rows.push(...await tree(join(dir,entry.name),relative));else rows.push({relative,sha256:await sha(join(dir,entry.name))});}return rows;}
const runtimeHashes=[];for(const file of ['rpg_core.js','rpg_managers.js','rpg_objects.js','rpg_scenes.js','rpg_sprites.js','rpg_windows.js'])runtimeHashes.push({file,source:await sha(join(runtime,'js',file)),copy:await sha(join(output,'js',file))});
const launchOptions={executable:join(output,basename(nw)),args:[`--user-data-dir=${join(output,'nw-profile')}`,'--enable-logging',`--log-file=${join(output,'nw.log')}`],cwd:output,windowsHide:true,timeoutMs:60000};
const independentExpected=scenario==='override'?{id:'AV.N06.runtime-overrides-initial-candidate.native-run.case.observed',saved:{characterName:'InitialCharacter',characterIndex:0,battlerName:'InitialBattler'},runtime:{characterName:'CurrentCharacter',characterIndex:3,battlerName:'CurrentBattler'},initialize:false,characterConsumer:'img/characters/CurrentCharacter.png',battlerConsumer:'img/sv_actors/CurrentBattler.png',initialCharacterMayPreload:true,initialImagesDrawn:false}:{id:`AV.N05.enemy-${scenario}.native-run.case.observed`,enemyId:1,troopId:1,member:0,savedName:'ModeEnemy',optSideView:scenario==='side',selected:scenario==='front'?'img/enemies/ModeEnemy.png':'img/sv_enemies/ModeEnemy.png',width:scenario==='front'?80:96,height:scenario==='front'?96:80,pixel:scenario==='front'?'#ff0000':'#00ff00',bothDirectoriesExist:true};
await writeFile(join(output,'input-manifest.json'),JSON.stringify({created:new Date().toISOString(),baseIntegration:'898b87db05b47dda648bfa42e2f2ace0a26d3e67',runtime,nw,scenario,outerNode:process.version,command:{executable:process.execPath,args:process.argv.slice(1)},launch:launchOptions,runtimeHashes,nwSha256:await sha(nw),shellHashes:await Promise.all(['Game.exe','nw.dll'].map(async file=>({file,source:await sha(join(dirname(nw),file)),copy:await sha(join(output,file))}))),scriptHashes:await Promise.all(['run-battlers.mjs','native-battlers.js','index.html'].map(async file=>({file,sha256:await sha(join(probe,file))}))),projectScriptHashes:await tree(join(output,'js')),fixtures:await tree(join(output,'data')),generated:await Promise.all(generated.map(async row=>({...row,sha256:await sha(join(output,row.relative))}))),independentExpected},null,2));
const began=new Date().toISOString();let launchError=null,exit=null;
try{exit=await new Promise((resolveRun,reject)=>{const child=spawn(launchOptions.executable,launchOptions.args,{cwd:output,windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{child.kill();reject(new Error('NW run exceeded60seconds'));},60000);child.on('error',error=>{clearTimeout(timer);reject(error);});child.on('exit',(code,signal)=>{clearTimeout(timer);resolveRun({pid:child.pid,code,signal});});});}catch(error){launchError=String(error.stack||error);}
await writeFile(join(output,'launcher-result.json'),JSON.stringify({began,finished:new Date().toISOString(),exit,launchError},null,2));
if(launchError)throw new Error(launchError);const result=JSON.parse(await readFile(join(output,'native-results.json'),'utf8'));console.log(JSON.stringify({output,status:result.status,environment:result.environment,assertions:result.assertions,error:result.error},null,2));if(result.status!=='observed')process.exitCode=1;
