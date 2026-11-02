import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const [runtimeArg, nwArg, ffmpegArg, outputArg] = process.argv.slice(2);
if (!outputArg || !runtimeArg || !nwArg || !ffmpegArg) throw new Error('Expected runtime, NW Game.exe, ffmpeg.exe, new output directory');
const [runtime, nw, ffmpeg, output] = [runtimeArg, nwArg, ffmpegArg, outputArg].map(value=>resolve(value));
const probe = dirname(fileURLToPath(import.meta.url));
await mkdir(output); // A previous run must never be overwritten.
await cp(dirname(nw), output, { recursive: true });
await cp(join(runtime, 'js'), join(output, 'js'), { recursive: true });
await cp(join(runtime, 'data'), join(output, 'data'), { recursive: true });
for (const file of ['index.html', 'native-n03.js']) await cp(join(probe, file), join(output, file));
await writeFile(join(output, 'package.json'), JSON.stringify({name:'mv-n03-native-evidence',main:'index.html',window:{show:false,width:64,height:64},'chromium-args':'--autoplay-policy=no-user-gesture-required --disable-gpu'},null,2));

function crc32(bytes) { let crc=0xffffffff; for(const byte of bytes) {crc^=byte;for(let n=0;n<8;n++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0; }
function chunk(type,data) {const tag=Buffer.from(type);const size=Buffer.alloc(4);size.writeUInt32BE(data.length);const checksum=Buffer.alloc(4);checksum.writeUInt32BE(crc32(Buffer.concat([tag,data])));return Buffer.concat([size,tag,data,checksum]);}
function png(width,height,rgba) {const header=Buffer.alloc(13);header.writeUInt32BE(width,0);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;const raw=Buffer.alloc((width*4+1)*height);for(let y=0;y<height;y++)for(let x=0;x<width;x++)for(let c=0;c<4;c++)raw[y*(width*4+1)+1+x*4+c]=rgba[c];return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
const generated=[];
async function image(relative,width,height,rgba,role) {await mkdir(dirname(join(output,relative)),{recursive:true});await writeFile(join(output,relative),png(width,height,rgba));generated.push({relative,role,generator:{method:'self-made RGBA PNG using zlib and PNG CRC32',width,height,rgba}});}
await image('img/animations/N03-first.png',960,192,[255,0,0,255],'selected Animation1.animation1Name');
await image('img/animations/N03-second.png',960,192,[0,0,255,255],'selected Animation1.animation2Name');
await image('img/animations/N03-control-first.png',960,192,[0,255,0,255],'unexecuted-branch preload control');
await image('img/animations/N03-control-second.png',960,192,[255,255,0,255],'unexecuted-branch preload control');
for(const [name,w,h] of [['Window',192,192],['Loading',128,128],['Shadow1',48,48],['Shadow2',48,48],['Balloon',384,384],['States',768,96],['IconSet',512,512],['Damage',240,160],['Weapons1',576,384],['Weapons2',576,384],['Weapons3',576,384],['ButtonSet',288,96]])await image(`img/system/${name}.png`,w,h,[128,128,128,255],'background scene support, not selected Event Asset Use');
await mkdir(join(output,'audio/se'),{recursive:true});
for(const [name,frequency] of [['N03-se-first',440],['N03-se-second',660],['N03-control-se-first',880],['N03-control-se-second',990]]) {
  const relative=`audio/se/${name}.ogg`;const args=['-hide_banner','-loglevel','error','-f','lavfi','-i',`sine=frequency=${frequency}:duration=0.3`,'-c:a','libvorbis',join(output,relative)];const result=spawnSync(ffmpeg,args,{windowsHide:true,encoding:'utf8'});if(result.status!==0)throw new Error(result.stderr||String(result.error));generated.push({relative,role:name.includes('control')?'unexecuted-branch audio control':'selected timing SE',generator:{executable:ffmpeg,args}});
}

const audio=(name='',volume=90,pan=0)=>({name,volume,pitch:100,pan});
const command=(code,parameters=[],indent=0)=>({code,indent,parameters});
function page(list) {return {conditions:{actorId:1,actorValid:false,itemId:1,itemValid:false,selfSwitchCh:'A',selfSwitchValid:false,switch1Id:1,switch1Valid:false,switch2Id:1,switch2Valid:false,variableId:1,variableValid:false,variableValue:0},directionFix:false,image:{characterIndex:0,characterName:'',direction:2,pattern:1,tileId:0},list,moveFrequency:3,moveRoute:{list:[{code:0,parameters:[]}],repeat:true,skippable:false,wait:false},moveSpeed:3,moveType:0,priorityType:1,stepAnime:false,through:false,trigger:0,walkAnime:true};}
const target=page([command(0)]);const controller=page([command(111,[0,1,0]),command(212,[1,2,true],1),command(412),command(212,[1,1,true]),command(355,['window.nativeProbeEventComplete("N03");']),command(123,['A',0]),command(0)]);controller.trigger=3;const finished=page([command(0)]);finished.conditions.selfSwitchValid=true;
const map={autoplayBgm:false,autoplayBgs:false,battleback1Name:'',battleback2Name:'',bgm:audio(),bgs:audio(),disableDashing:false,displayName:'',encounterList:[],encounterStep:30,height:15,width:20,note:'',scrollType:0,parallaxLoopX:false,parallaxLoopY:false,parallaxName:'',parallaxShow:true,parallaxSx:0,parallaxSy:0,specifyBattleback:false,tilesetId:1,data:Array(20*15*6).fill(0),events:[null,{id:1,name:'N03 target',note:'',pages:[target],x:8,y:6},{id:2,name:'N03 controller',note:'',pages:[controller,finished],x:9,y:6}]};
const cells=[[0,-96,0,100,0,false,255,0],[100,96,0,100,0,false,255,0]];
function animation(id,control=false){return {id,name:control?'N03 unexecuted control':'N03 dual native',position:2,animation1Name:control?'N03-control-first':'N03-first',animation1Hue:0,animation2Name:control?'N03-control-second':'N03-second',animation2Hue:0,frames:[cells,cells,cells,cells],timings:[{frame:0,flashScope:0,flashColor:[0,0,0,0],flashDuration:0,se:audio(control?'N03-control-se-first':'N03-se-first',70,-25)},{frame:2,flashScope:0,flashColor:[0,0,0,0],flashDuration:0,se:audio(control?'N03-control-se-second':'N03-se-second',80,25)}]};}
const system=JSON.parse(await readFile(join(runtime,'data/System.json'),'utf8'));
system.partyMembers=[];system.optFollowers=false;system.optTransparent=true;system.hasEncryptedImages=false;system.hasEncryptedAudio=false;system.encryptionKey='';system.title1Name='';system.title2Name='';system.battlerName='';system.battleback1Name='';system.battleback2Name='';
for(const key of ['battleBgm','victoryMe','defeatMe','gameoverMe','titleBgm'])system[key]=audio();
system.sounds=system.sounds.map(()=>audio());for(const key of ['boat','ship','airship'])system[key]={...system[key],characterName:'',startMapId:0,bgm:audio()};
const fixtures={'System.json':system,'Map001.json':map,'Animations.json':[null,animation(1),animation(2,true)],'Tilesets.json':[null,{id:1,name:'N03 no tiles',mode:1,note:'',tilesetNames:Array(9).fill(''),flags:Array(8192).fill(0)}],'MapInfos.json':[null,{id:1,expanded:true,name:'N03 probe',order:1,parentId:0,scrollX:0,scrollY:0}],'CommonEvents.json':[null]};
for(const [file,value] of Object.entries(fixtures))await writeFile(join(output,'data',file),JSON.stringify(value));
const sha=async path=>createHash('sha256').update(await readFile(path)).digest('hex');
async function tree(dir,prefix=''){const rows=[];for(const entry of await readdir(dir,{withFileTypes:true})){const rel=prefix?`${prefix}/${entry.name}`:entry.name;if(entry.isDirectory())rows.push(...await tree(join(dir,entry.name),rel));else rows.push({relative:rel,sha256:await sha(join(dir,entry.name))});}return rows;}
const launch={executable:join(output,basename(nw)),args:[`--user-data-dir=${join(output,'nw-profile')}`,'--enable-logging',`--log-file=${join(output,'nw.log')}`],cwd:output,windowsHide:true,stdio:'ignore',timeoutMs:60000};
const runtimeHashes=[];for(const file of ['rpg_core.js','rpg_managers.js','rpg_objects.js','rpg_scenes.js','rpg_sprites.js','rpg_windows.js'])runtimeHashes.push({file,source:await sha(join(runtime,'js',file)),copy:await sha(join(output,'js',file))});
const manifest={created:new Date().toISOString(),baseIntegration:'4a8fbe712f2f5da567632bb7d80dfa666e9fb96b',runtime,nw,ffmpeg,outerNode:process.version,command:{executable:process.execPath,args:process.argv.slice(1)},launch,runtimeHashes,nwSha256:await sha(nw),ffmpegSha256:await sha(ffmpeg),scriptHashes:await Promise.all(['run-n03.mjs','native-n03.js','index.html'].map(async file=>({file,sha256:await sha(join(probe,file))}))),projectScriptHashes:await tree(join(output,'js')),fixtures:await tree(join(output,'data')),generated:await Promise.all(generated.map(async row=>({...row,sha256:await sha(join(output,row.relative))}))),independentExpected:{images:[{field:'Animations[1].animation1Name',relative:'img/animations/N03-first.png',pattern:0,width:960,height:192,pixel:'#ff0000'},{field:'Animations[1].animation2Name',relative:'img/animations/N03-second.png',pattern:100,width:960,height:192,pixel:'#0000ff'}],timings:[{field:'Animations[1].timings[0].se.name',frame:0,relative:'audio/se/N03-se-first.ogg',volume:70,pitch:100,pan:-25},{field:'Animations[1].timings[1].se.name',frame:2,relative:'audio/se/N03-se-second.ogg',volume:80,pitch:100,pan:25}],control:{switch1:false,animationId:2,preloadImages:true,executed:false,frameEvents:0,seCalls:0}}};
await writeFile(join(output,'input-manifest.json'),JSON.stringify(manifest,null,2));
const began=new Date().toISOString();let launchError=null;let exit=null;
try{exit=await new Promise((resolveRun,reject)=>{const child=spawn(launch.executable,launch.args,{cwd:launch.cwd,windowsHide:true,stdio:'ignore'});const timer=setTimeout(()=>{child.kill();reject(new Error('NW run exceeded 60 seconds'));},60000);child.on('error',error=>{clearTimeout(timer);reject(error);});child.on('exit',(code,signal)=>{clearTimeout(timer);resolveRun({pid:child.pid,code,signal});});});}catch(error){launchError=String(error.stack||error);}
await writeFile(join(output,'launcher-result.json'),JSON.stringify({began,finished:new Date().toISOString(),exit,launchError},null,2));
if(launchError)throw new Error(launchError);const report=JSON.parse(await readFile(join(output,'native-results.json'),'utf8'));console.log(JSON.stringify({output,exit,environment:report.environment,status:report.status,assertions:report.assertions.map(({label,passed})=>({label,passed})),error:report.error},null,2));if(report.status!=='observed')process.exitCode=1;
