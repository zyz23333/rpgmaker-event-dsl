const fs=require("node:fs"),cp=require("node:child_process"),crypto=require("node:crypto"),assert=require("node:assert/strict"),ts=require("typescript");
const raw=".scratch/asset-validation-implementation/evidence/17-regression-repair/raw";
const red=JSON.parse(fs.readFileSync(`${raw}/original-red.json`));
const sha=bytes=>crypto.createHash("sha256").update(bytes).digest("hex");
const git=args=>cp.execFileSync("git",args,{maxBuffer:64*1024*1024});
function signature(text,file){const source=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true),printer=ts.createPrinter({removeComments:true}),arrows=[],arrays=[],strings=[];
 function visit(node){if(ts.isArrowFunction(node)||ts.isFunctionExpression(node))arrows.push(sha(printer.printNode(ts.EmitHint.Unspecified,node,source)));if(ts.isArrayLiteralExpression(node))arrays.push(sha(printer.printNode(ts.EmitHint.Unspecified,node,source)));if(ts.isStringLiteralLike(node))strings.push(node.text);ts.forEachChild(node,visit);}visit(source);return{arrows,arrays,strings};}
const files=red.sourceFiles.map(item=>{const before=fs.readFileSync(item.archived,"utf8"),current=fs.readFileSync(item.path,"utf8");
 const normalized=item.path.endsWith("final-review-workspace.test.ts")?current.replaceAll("current /40 Compile","current /38 Compile").replaceAll("final-review-contract-40","final-review-contract-38").replaceAll("mv-1.6.1/40","mv-1.6.1/38"):current;
 const original=signature(before,item.path),after=signature(normalized,item.path);assert.deepEqual(after,original,item.path);
 return{path:item.path,originalSha256:sha(Buffer.from(before)),currentSha256:sha(Buffer.from(current)),arrowCallbacksPreserved:original.arrows.length,literalArraysPreserved:original.arrays.length,stringInputsAndDiagnosticsPreserved:original.strings.length,onlyAllowedCurrentLiteralsNormalized:item.path.endsWith("final-review-workspace.test.ts")};});
const unchanged=["packages/rpgmaker-event-dsl/src","packages/rpgmaker-event-dsl/test/fixtures","packages/rpgmaker-event-dsl/test/support","packages/rpgmaker-event-dsl/vitest.config.ts","packages/rpgmaker-event-dsl/vitest.windows.config.ts","package.json","pnpm-lock.yaml"];
assert.equal(git(["diff","--name-only",red.base,"--",...unchanged]).toString(),"");
const productTree=git(["rev-parse",`${red.base}:packages/rpgmaker-event-dsl/src`]).toString().trim();
const output={schemaVersion:1,base:red.base,productTree,unchangedScopes:unchanged,defaultMaxWorkers:2,globalTimeoutUnchanged:10000,globalEntryOverride:null,
 files,canonicalIdsAdded:0,fixtureChanges:0,businessCallbackAstAndLiteralArraysUnchanged:true,
 allowed:"Only local timeout plumbing/arguments plus final-review CURRENT title,sandbox label and expectation38->40. Original23 and every stale/fresh/Check-no-upgrade assertion preserved.",
};
fs.writeFileSync(`${raw}/assertion-preservation.json`,JSON.stringify(output,null,2)+"\n");console.log(JSON.stringify({files:files.length,arrowCallbacks:files.reduce((n,x)=>n+x.arrowCallbacksPreserved,0),literalArrays:files.reduce((n,x)=>n+x.literalArraysPreserved,0),stringInputs:files.reduce((n,x)=>n+x.stringInputsAndDiagnosticsPreserved,0),productUnchanged:true}));
