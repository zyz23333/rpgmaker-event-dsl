'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {sha,json}=require('./utilities-v1.cjs');
const {descriptors,buildScenario}=require('./scenarios-v3.cjs');
const {runPair}=require('./native-pair-support-v3.cjs');
async function main(){
 const args=process.argv.slice(2);assert.ok(args[0],'Required explicit48 built candidate JSON; no historical/default product fallback');
 const candidate=JSON.parse(await fs.readFile(args[0],'utf8'));
 assert.equal(candidate.ticket48BuiltCandidate,true,'Only the candidate supplied by root after48');
 for(const k of['packageRoot','gitHead','workspaceApiSha256'])assert.ok(typeof candidate[k]==='string'&&candidate[k],k);
 assert.equal(cp.execFileSync('git',['-c','core.longpaths=true','rev-parse','HEAD'],{cwd:candidate.packageRoot,encoding:'utf8',windowsHide:true}).trim(),candidate.gitHead);
 assert.equal(sha(await fs.readFile(path.join(candidate.packageRoot,'dist/workspace-api.mjs'))),candidate.workspaceApiSha256);
 const selected=args[1]?descriptors.filter(d=>d.id===args[1]):descriptors;assert.ok(selected.length,'Unknown scenario');
 const output='M:/mv52';await fs.mkdir(output,{recursive:true});
 const batch=path.join(output,'batch-'+crypto.randomUUID());await fs.mkdir(batch);
 await json(path.join(batch,'candidate.json'),{inputCandidateFile:path.resolve(args[0]),...candidate});
 const results=[];let failed=false;
 for(const d of selected){
  const scenario=await buildScenario(d),refusal=d.execution==='expected-product-refusal';
  const options={packageRoot:candidate.packageRoot,seedRoot:candidate.seedRoot||'F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/NewData',host:candidate.host||'F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/nwjs-win-test/game.exe',outputRoot:batch,timeoutMs:60000,mode:refusal?'prepare':'native',purpose:'Final52 actual candidate: original invalid input refusal and independent ordinary native/compiled pairs'};
  let item;
  try{
   const report=await runPair(options,scenario);
   if(refusal){const detail=String(report.error?.message||'');const expectedRefusal=report.passed===false&&report.lifecycle.find(s=>s.name==='public Decompile')?.ok===false&&/MV-E331/.test(detail)&&/9999|constant/.test(detail)&&!report.lifecycle.some(s=>s.name.startsWith('native '));item={id:d.id,kind:'original-product-refusal',pairPassed:false,expectedRefusal,root:report.root,error:report.error};if(!expectedRefusal)failed=true;}
   else{item={id:d.id,kind:'actual-native-pair',pairPassed:report.passed===true,root:report.root,error:report.error};if(!item.pairPassed)failed=true;}
  }catch(error){failed=true;item={id:d.id,unhandledError:String(error.stack||error)};}
  results.push(item);await json(path.join(batch,'result-'+d.id+'.json'),item);
 }
 await json(path.join(batch,'summary.json'),{candidate,results,allRequiredOutcomesObserved:!failed,originalRefusalsAreNotNativePairPasses:true,completedAt:new Date().toISOString()});
 process.exitCode=failed?1:0;console.log(JSON.stringify({batch,allRequiredOutcomesObserved:!failed,count:results.length}));
}
if(require.main===module)main().catch(e=>{console.error(e.stack);process.exitCode=1;});
module.exports={main};
