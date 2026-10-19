'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const old=path.join(__dirname,'mv33-native-pair-delivery-v2.cjs');
let text=fs.readFileSync(old,'utf8');
function replace(before,after){assert.equal(text.split(before).length,2,'Unique helper seam: '+before.slice(0,80));text=text.replace(before,after);}
replace("const assert = require('node:assert/strict');","const assert = require('node:assert/strict');\nconst isolation = require('./mv33-physical-isolation-v1.cjs');");
replace("const report = { purpose:'Ticket33 allocated representative delivery; not final49–54 acceptance'","const report = { purpose:'Ticket33 physically isolated replacement delivery; prior junction pairs rejected; not final49–54 acceptance'");
replace("  try {\n    const expected = await scenario.fixture(options.seedRoot);",`  const protectedRoots={reference:path.join(options.referenceRoot,'data'),seed:path.join(options.seedRoot,'data')};
  let protectedBaseline,literalBaseline;
  report.isolationCheckpoints=[];
  async function checkpoint(label){
    const roots={...protectedRoots};
    for(const side of ['literal','compiled'])if(report.sides[side])roots[side]=path.join(report.sides[side].project,'data');
    const state=await isolation.distinctTrees(roots);
    if(protectedBaseline)isolation.unchanged(protectedBaseline,state,['reference','seed']);
    if(literalBaseline)assert.deepEqual(state.trees.literal,literalBaseline,'Literal independent control changed at '+label);
    report.isolationCheckpoints.push({label,...state});return state;
  }
  try {
    assert.ok(['prepare','native'].includes(options.mode));
    if(options.mode==='native'){assert.ok(options.nativeGateRelease,'An explicit root native gate release must be recorded');report.nativeGateRelease=options.nativeGateRelease;}
    protectedBaseline=await checkpoint('initial protected physical reference and seed');
    const expected = await scenario.fixture(options.seedRoot);`);
replace("      const project=path.join(root,side,'Game');await fs.mkdir(project,{recursive:true});\n      await fs.cp(path.join(options.seedRoot,'data'),path.join(project,'data'),{recursive:true,errorOnExist:true,force:false});\n      for(const name of ['js','img','audio','fonts','icon'])await fs.symlink(path.join(options.seedRoot,name),path.join(project,name),'junction');\n      for(const [file,value]of Object.entries(expected.carriers))await fs.writeFile(path.join(project,'data',file),JSON.stringify(value,null,2)+'\\n');",`      const project=path.join(root,side,'Game');await fs.mkdir(path.dirname(project));
      await isolation.copyRegularTree(options.seedRoot,project);
      report.sides[side]={project};
      await checkpoint('before '+side+' fixture writes');
      for(const [file,value]of Object.entries(expected.carriers)){
        await checkpoint('before '+side+' carrier '+file);
        await isolation.writeDataFile(path.join(project,'data'),file,JSON.stringify(value,null,2)+'\\n');
        await checkpoint('after '+side+' carrier '+file);
      }`);
replace("      if(side==='compiled')await scenario.seedDifference(project);",`      if(side==='compiled'){
        await checkpoint('before compiled owned seed difference');
        await scenario.seedDifference(project);
        await checkpoint('after compiled owned seed difference');
      }
      if(side==='literal')literalBaseline=(await checkpoint('freeze literal independent complete input')).trees.literal;`);
replace("    await step('public Compile',()=>api.compileWorkspace({workspaceRoot,check:false}));",`    await checkpoint('before public Compile');
    await step('public Compile',()=>api.compileWorkspace({workspaceRoot,check:false}));
    await checkpoint('after public Compile');`);
replace("    await step('public Push',()=>api.pushWorkspace({workspaceRoot,allowDestructive:false}));",`    await checkpoint('before public Push');
    await step('public Push',()=>api.pushWorkspace({workspaceRoot,allowDestructive:false}));
    await checkpoint('after public Push');`);
replace("    await json(path.join(root,'before-native-data-identity.json'),report.completeCarrierComparison);\n    for(const side of ['literal','compiled']){",`    await json(path.join(root,'before-native-data-identity.json'),report.completeCarrierComparison);
    const finalPrepared=await checkpoint('after complete product publication');
    report.physicalIsolation={passed:true,referenceSeedLiteralUnchanged:true,distinctPhysicalDataRoots:true,allEntriesRegularAndUnlinked:true,completeDataFiles:Object.fromEntries(Object.entries(finalPrepared.trees).map(([name,tree])=>[name,tree.files.length]))};
    await json(path.join(root,'physical-isolation-proof.json'),{purpose:'Independent physical data before/after real Compile and Push; no games launched by prepare mode',mode:options.mode,protectedBaseline,literalBaseline,checkpoints:report.isolationCheckpoints,passed:true});
    if(options.mode==='prepare'){
      report.nativeExecution='not-executed; root native gate not released';
      report.prepared=true;report.passed=false;report.completedAt=new Date().toISOString();
      await json(path.join(root,'preparation-result.json'),report);
      console.log(JSON.stringify({root,prepared:true,nativeExecution:report.nativeExecution,isolation:report.physicalIsolation},null,2));
      return report;
    }
    for(const side of ['literal','compiled']){`);
replace("      item.native=await step('native '+side,()=>runNative(item.project,options.host,options.timeoutMs));",`      await checkpoint('before native '+side);
      item.native=await step('native '+side,()=>runNative(item.project,options.host,options.timeoutMs));
      await checkpoint('after native '+side);`);
replace("    report.passed=report.sides.literal.passed===true&&report.sides.compiled.passed===true&&report.runtimeComparison===true;", "    await checkpoint('final complete physical isolation');\n    report.passed=report.sides.literal.passed===true&&report.sides.compiled.passed===true&&report.runtimeComparison===true&&report.physicalIsolation.passed===true;");
assert.ok(!text.includes('fs.cp('));assert.ok(!text.includes("fs.symlink(path.join(options.seedRoot"));
fs.writeFileSync(path.join(__dirname,'mv33-native-pair-delivery-v3.cjs'),text,{flag:'wx'});
console.log('Created separately versioned helper v3; original v2 unchanged.');
