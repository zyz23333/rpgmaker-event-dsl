'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),cp=require('node:child_process');
const root='M:/Shuen/Codex/mv-events-implementation-20261020/worktrees/mv-ticket-27-final',base=__dirname,pnpm='C:/Users/Shuen/AppData/Local/node/corepack/v1/pnpm/10.33.0/bin/pnpm.cjs',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const frozen=JSON.parse(fs.readFileSync(path.join(base,'built-inputs-v1/manifest.json'),'utf8'));
for(const r of frozen.files)assert.equal(sha(fs.readFileSync(path.join(root,r.path))),r.sha256,r.path);
const tools=JSON.parse(fs.readFileSync(path.join(base,'choices-physical-inputs-v1-a57d9d5d-2d29-4dc6-9fc2-3ca4451d6fe8/manifest.json'),'utf8'));
for(const r of [tools.wrapper,...tools.tools])assert.equal(sha(fs.readFileSync(r.path)),r.sha256,r.path);
const commands=[];for(const args of [['lint'],['format:check']]){const r=cp.spawnSync(process.execPath,[pnpm,...args],{cwd:root,env:process.env,windowsHide:true,stdio:'inherit'});commands.push({args,exitCode:r.status,signal:r.signal});assert.equal(r.status,0,args.join(' '))}
const check=cp.spawnSync('git',['-C',root,'diff','--check'],{windowsHide:true,stdio:'inherit'});assert.equal(check.status,0);
const record={at:new Date().toISOString(),executedInputCount:frozen.files.length,sourceDistGroups:frozen.groups,nativeFrozenTools:6,allCurrentExecutedBytesExact:true,commands,diffCheckExit:check.status,passed:true};fs.writeFileSync(path.join(base,'final-static-validation-v1.json'),JSON.stringify(record,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(record,null,2));
