const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const root='C:/Users/Shuen/.codex/worktrees/mv-ticket-33/rpgmaker-event-dsl';
const git=(args,extra={})=>cp.execFileSync('git',args,{cwd:root,maxBuffer:128*1024*1024,windowsHide:true,...extra});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const names=git(['diff','--cached','--name-only','-z']).toString('utf8').split('\0').filter(Boolean);
const table=new Map(git(['ls-files','--stage','-z']).toString('utf8').split('\0').filter(Boolean).map(s=>{const m=s.match(/^\d+ (\w+) 0\t(.+)$/);assert.ok(m,s);return[m[2],m[1]];}));
const records=[];
for(let at=0;at<names.length;at+=32){const group=names.slice(at,at+32);const raw=git(['cat-file','--batch'],{input:group.map(p=>table.get(p)).join('\n')+'\n'});let cursor=0;for(const name of group){const end=raw.indexOf(10,cursor),header=raw.subarray(cursor,end).toString('utf8').split(' '),bytes=Number(header[2]);assert.equal(header[0],table.get(name));assert.equal(header[1],'blob');cursor=end+1;const actual=fs.readFileSync(path.join(root,name));assert.ok(actual.equals(raw.subarray(cursor,cursor+bytes)),'Staged content differs from exact original bytes '+name);records.push({path:name,gitBlob:header[0],sha256:sha(actual),bytes});cursor+=bytes+1;}assert.equal(cursor,raw.length);}
const receipt={purpose:'Every staged delivery blob equals actual worktree bytes; own scoped historical attributes preserve original CRLF/whitespace. Product sources/dist and incoming historical blobs were independently verified by final-delivery-audit-v3.',at:new Date().toISOString(),base:git(['rev-parse','HEAD']).toString('utf8').trim(),files:records.length,records,passed:true};
const file=path.join(root,'.scratch/complete-mv-events-implementation/evidence/33-history/staged-byte-receipt-v1.json');
fs.writeFileSync(file,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({files:records.length,passed:true,receipt:file}));
