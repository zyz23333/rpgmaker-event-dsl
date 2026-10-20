const fs=require('node:fs'),crypto=require('node:crypto');
const temp='M:/Shuen/Codex/mv-events-implementation-20261020/ticket38-temp',profile=temp+'/index-profile-v1/evidence-index-v1.cpuprofile',bytes=fs.readFileSync(profile),p=JSON.parse(bytes),nodes=new Map(p.nodes.map(n=>[n.id,n])),times=new Map();
for(let i=0;i<p.samples.length;i++){const n=nodes.get(p.samples[i]),f=n.callFrame,key=JSON.stringify({function:f.functionName,url:f.url,line:f.lineNumber+1});times.set(key,(times.get(key)??0)+(p.timeDeltas[i]??0));}
const top=[...times].map(([key,microseconds])=>({...JSON.parse(key),milliseconds:microseconds/1000})).sort((a,b)=>b.milliseconds-a.milliseconds);
const result={profile,profileSha256:crypto.createHash('sha256').update(bytes).digest('hex'),durationMs:(p.endTime-p.startTime)/1000,samples:p.samples.length,topSelfTime:top.slice(0,30)};
fs.writeFileSync(temp+'/evidence-index-cpu-summary-v1.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
