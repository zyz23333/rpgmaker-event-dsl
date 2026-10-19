'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=__dirname;let code=fs.readFileSync(path.join(base,'retain-profile-inputs-v1.cjs'),'utf8');
code=code.replaceAll('index-profile-inputs-v1','final-index-timeout-inputs-v1').replaceAll('index-profile-retained-inputs-v1','final-index-timeout-retained-v1');
const marker="function walk(rel){";assert.equal(code.split(marker).length,2);
code=code.replace(marker,"for(const r of JSON.parse(fs.readFileSync(path.join(base,'built-inputs-v1/manifest.json'),'utf8')).files)paths.add(r.path);for(const p of ['.gitattributes',evidence+'/27-choices-complete-branches.md',evidence+'/27-final-history/README.md'])paths.add(p);\n"+marker);
code=code.replace('assert.equal(manifest.resultCount,6429)','assert.equal(manifest.resultCount,8109)').replace('Complete original read-only index profile inputs retained physically after timing, without affecting measured cold reads; current bytes tied to original18e tree except separately captured exact pending-ID report','Complete8109-result final-index-v1 timeout inputs and328 requirements, all193 executed source/test/dist/config inputs plus actual dirty documentary state retained physically after the original failure and first read-only profile; no cold-cache attribution');
fs.writeFileSync(path.join(base,'retain-final-timeout-inputs-v1.cjs'),code,{flag:'wx'});console.log('derived complete timeout-input retention');
