import fs from 'node:fs/promises';
import {createRequire,syncBuiltinESMExports} from 'node:module';
import {performance} from 'node:perf_hooks';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),fsp=require('node:fs/promises'),originalRead=fsp.readFile,originalDirectory=fsp.readdir,root=process.argv[2]??process.cwd();
const originalParse=JSON.parse,originalStringify=JSON.stringify;
let measuring=false,started=0,firstResult=null,lastResult=null,maxActive=0,active=0;
const calls=[],directories=[],json={parseCalls:0,parseMs:0,stringifyCalls:0,stringifyMs:0};
fsp.readFile=async function(...args){
  if(!measuring)return originalRead.apply(this,args);
  const file=String(args[0]),begin=performance.now(),resultFile=file.replaceAll('\\','/').includes('/evidence/results/');
  active++;maxActive=Math.max(maxActive,active);if(resultFile&&firstResult===null)firstResult=begin;
  try{const bytes=await originalRead.apply(this,args),end=performance.now();calls.push({path:path.relative(root,file).replaceAll('\\','/'),startMs:begin-started,durationMs:end-begin,bytes:typeof bytes==='string'?Buffer.byteLength(bytes):bytes.length,resultFile});if(resultFile)lastResult=end;return bytes;}finally{active--;}
};
fsp.readdir=async function(...args){
  if(!measuring)return originalDirectory.apply(this,args);
  const begin=performance.now(),entries=await originalDirectory.apply(this,args);directories.push({path:path.relative(root,String(args[0])).replaceAll('\\','/'),durationMs:performance.now()-begin,entries:entries.length});return entries;
};
syncBuiltinESMExports();
JSON.parse=function(...args){if(!measuring)return originalParse.apply(this,args);const begin=performance.now();try{return originalParse.apply(this,args);}finally{json.parseCalls++;json.parseMs+=performance.now()-begin;}};
JSON.stringify=function(...args){if(!measuring)return originalStringify.apply(this,args);const begin=performance.now();try{return originalStringify.apply(this,args);}finally{json.stringifyCalls++;json.stringifyMs+=performance.now()-begin;}};
const {validateRequirements}=await import(pathToFileURL(path.join(root,'packages/rpgmaker-event-dsl/test/support/mv-evidence.ts')).href);
started=performance.now();measuring=true;let failure=null;
try{await validateRequirements();}catch(error){failure={name:error.name,message:error.message};}
const elapsedMs=performance.now()-started;measuring=false;
const results=calls.filter(c=>c.resultFile),artifacts=calls.filter(c=>!c.resultFile),paths=new Map();for(const call of calls)paths.set(call.path,(paths.get(call.path)??0)+1);
const durations=results.map(c=>c.durationMs).sort((a,b)=>a-b),percentile=p=>durations[Math.floor((durations.length-1)*p)]??null;
const hashed=async file=>createHash('sha256').update(await originalRead(path.join(root,file))).digest('hex');
const report={kind:'read-only timing diagnostic; no Vitest deadline or passing-test claim',createdAt:new Date().toISOString(),root,node:process.version,sourceHash:await hashed('packages/rpgmaker-event-dsl/test/support/mv-evidence.ts'),requirementsHash:await hashed('.scratch/complete-mv-events-implementation/evidence/requirements.json'),elapsedMs,failure,firstResultReadMs:firstResult===null?null:firstResult-started,lastResultReadMs:lastResult===null?null:lastResult-started,maxConcurrentReads:maxActive,resultReads:results.length,resultBytes:results.reduce((n,c)=>n+c.bytes,0),resultReadLatencyMs:{p50:percentile(.5),p95:percentile(.95),max:durations.at(-1)},artifactReads:artifacts.length,artifactPhaseLastReadMs:Math.max(0,...artifacts.map(c=>c.startMs+c.durationMs)),duplicateFileReads:[...paths].filter(([,count])=>count>1),directoryReads:directories.length,directoryElapsedSumMs:directories.reduce((n,d)=>n+d.durationMs,0),json,slowestFileReads:[...calls].sort((a,b)=>b.durationMs-a.durationMs).slice(0,12),directories};
const out='M:/Shuen/Codex/mv-events-implementation-20261020/ticket38-temp/evidence-index-profile-v1.json';
await fs.writeFile(out,originalStringify(report,null,2)+'\n');
console.log(originalStringify({...report,slowestFileReads:report.slowestFileReads.slice(0,3),directories:undefined,out}));
