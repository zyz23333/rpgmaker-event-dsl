const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]),base=process.argv[3],repairPath=process.argv[4],output=process.argv[5];
const git=args=>cp.execFileSync('git',['-c','core.longpaths=true',...args],{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024});
const evidence='.scratch/complete-mv-events-implementation/evidence/',index=evidence+'requirements.json';
const original=git(['show',`${base}:${index}`]),current=fs.readFileSync(path.join(root,index),'utf8'),repair=JSON.parse(fs.readFileSync(repairPath,'utf8'));
const oldRows=JSON.parse(original).requirements,newRows=JSON.parse(current).requirements,restored=structuredClone(newRows.slice(0,oldRows.length));
for(const allowance of repair.allowlist){const row=restored.find(row=>row.id===allowance.id);assert.equal(row.fixture.path,allowance.path);assert.equal(row.fixture.sha256,allowance.after);row.fixture.sha256=allowance.before;}
assert.deepStrictEqual(restored,oldRows);
const firstOwn=current.indexOf(',\n    {\n      "id": "MV-S6-SCREEN-001"'),tail=current.lastIndexOf('\n  ]');
let restoredBytes=current.slice(0,firstOwn)+current.slice(tail);for(const allowance of repair.allowlist)restoredBytes=restoredBytes.replace(allowance.after,allowance.before);
assert.equal(restoredBytes,original);
const tree=git(['ls-tree','-r',base,'--',evidence]).trim().split('\n').map(line=>line.split('\t')[1]);
const changed=git(['diff','--name-only',base,'--',evidence]).trim().split(/\r?\n/).filter(Boolean),incoming=new Set(tree);
const invalid=changed.filter(file=>incoming.has(file)&&![index,evidence+'README.md'].includes(file));assert.deepStrictEqual(invalid,[]);
const record={base,incomingRequirements:oldRows.length,finalRequirements:newRows.length,addedRequirements:newRows.slice(oldRows.length).map(row=>row.id),activeIndexException:{allowlistEntries:repair.allowlist.length,onlyFixtureSha256:true,allOtherIncomingRowFieldsDeepEqual:true,reversingExactAllowedPinsReconstructsOriginalIndexBytes:true,physicalOriginalIndexAndFixture:repair.originalProofs},incomingHistoricalEvidenceFiles:tree.filter(file=>![index,evidence+'README.md'].includes(file)).length,preservedIncomingEvidence:true};
if(fs.existsSync(output))throw Error('Append-only output exists');fs.writeFileSync(output,JSON.stringify(record,null,2)+'\n');process.stdout.write(JSON.stringify(record)+'\n');
