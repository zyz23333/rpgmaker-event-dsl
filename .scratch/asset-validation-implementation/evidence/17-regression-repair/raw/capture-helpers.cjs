const fs=require("node:fs"),assert=require("node:assert/strict");
const entry=process.argv[2],raw=".scratch/asset-validation-implementation/evidence/17-regression-repair/raw";
assert(["source","built"].includes(entry));
const command=JSON.parse(fs.readFileSync(`${raw}/${entry}-command.json`)),start=Date.parse(command.startedAt),end=Date.parse(command.completedAt);
const dir=`${raw}/${entry}-helpers`;fs.mkdirSync(dir,{recursive:true});let count=0;
for(const name of fs.readdirSync("test-results/mv-evidence")){const bytes=fs.readFileSync(`test-results/mv-evidence/${name}`),receipt=JSON.parse(bytes);
 if(Date.parse(receipt.startedAt)<start||Date.parse(receipt.completedAt)>end)continue;
 assert.equal(receipt.status,"passed");assert.equal(receipt.difference,null);
 assert(receipt.actual.entry.replaceAll("\\","/").includes(entry==="built"?"/dist/":"/src/"));
 fs.writeFileSync(`${dir}/${name}`,bytes);count++;
}
assert.equal(count,21);console.log(`${entry}: archived21 original fresh helper bytes using parsed UTC bounds; no test rerun`);
