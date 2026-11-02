import { readFile, writeFile, stat } from "node:fs/promises";
import { resolve, dirname } from "node:path";
const root = resolve(import.meta.dirname,"../../../..");
const targets = [
  ".scratch/asset-validation-implementation/evidence/16-recovery-acceptance.md",
  ".scratch/asset-validation-implementation/issues/16-recovery-and-current-asset-policy.md",
];
const checked = [];
for(const file of targets) {
  const text = await readFile(resolve(root,file),"utf8");
  for(const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/gu)) {
    const link = match[1].replace(/^<|>$/gu,"");
    if(/^[a-z][a-z\d+.-]*:\/\//iu.test(link) || link.startsWith("#")) continue;
    const path = resolve(dirname(resolve(root,file)),link.split("#")[0]);
    const info = await stat(path);
    checked.push({file,link,path,exists:info.isFile()||info.isDirectory()});
  }
}
if(checked.some(link=>!link.exists)) throw new Error("Missing local artifact link");
const output = process.argv[2] ? resolve(root,process.argv[2]) : resolve(import.meta.dirname,"16-local-links.json");
await writeFile(output,JSON.stringify({status:"verified",checked},null,2)+"\n");
console.log(JSON.stringify({localLinks:checked.length,broken:0,output}));
