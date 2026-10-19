'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const base=__dirname,root='M:/Shuen/Codex/mv-events-implementation-20261020/worktrees/mv-ticket-27-final',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const pointer=JSON.parse(fs.readFileSync(path.join(base,'final-index-timeout-retained-v1.json'),'utf8'));
assert.equal(sha(fs.readFileSync(pointer.manifest)),pointer.sha256);
const manifest=JSON.parse(fs.readFileSync(pointer.manifest,'utf8'));
assert.equal(manifest.files.length,8389);assert.equal(manifest.resultCount,8109);
for(const r of manifest.files){const s=fs.lstatSync(r.retainedPath,{bigint:true});assert(s.isFile()&&!s.isSymbolicLink());assert.equal(s.nlink,1n);assert.equal(sha(fs.readFileSync(r.retainedPath)),r.sha256,r.retainedPath);assert.equal(sha(fs.readFileSync(path.join(root,r.path))),r.sha256,r.path)}
const result={at:new Date().toISOString(),purpose:'Independent complete byte readback of final-index timeout corpus after diagnostics and original-CLI successful recheck, before documentary closure changes',manifest:{path:pointer.manifest,sha256:pointer.sha256},files:8389,results:8109,bytes:manifest.bytes,regularNlinkOneRetainedBytesExact:true,currentBytesStillExact:true,executedInputs:193,helperSha256:sha(fs.readFileSync(path.join(root,'packages/rpgmaker-event-dsl/test/support/mv-evidence.ts'))),passed:true};
const file=path.join(base,'final-timeout-inputs-byte-audit-v1.json');fs.writeFileSync(file,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({file,...result},null,2));
