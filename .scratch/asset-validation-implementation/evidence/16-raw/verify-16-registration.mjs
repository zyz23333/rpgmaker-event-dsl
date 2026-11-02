import ts from "typescript";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const path = resolve("packages/rpgmaker-event-dsl/test/asset-recovery-workspace.test.ts");
const bytes = await readFile(path);
const source = ts.createSourceFile(path, bytes.toString(), ts.ScriptTarget.Latest, true);
const declarations = [];
function visit(node) {
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "it") {
    let ancestor = node.parent;
    while (ancestor) {
      if (ts.isFunctionLike(ancestor)) throw new Error("Acceptance callback is nested inside a function/test");
      ancestor = ancestor.parent;
    }
    const name = node.arguments[0].getText(source).slice(1,-1).split(":")[0];
    declarations.push({ name, line: source.getLineAndCharacterOfPosition(node.getStart(source)).line+1 });
  }
  ts.forEachChild(node, visit);
}
visit(source);
const ids = declarations.flatMap(({name}) => name.includes("${mode}") ? ["api","cli"].map(mode=>name.replace("${mode}",mode)) : [name]).sort();
const originalPath = "M:/Shuen/Codex/asset-validation-notes/planned-acceptance-ids-12-16.json";
const finalPath = "M:/Shuen/Codex/asset-validation-notes/final-canonical-id-plan.json";
const originalBytes = await readFile(originalPath), finalBytes = await readFile(finalPath);
const original = JSON.parse(originalBytes), final = JSON.parse(finalBytes);
for (const planned of [original.tickets["16"].primaryIds, final.perTicket["16"].primaryIds])
  if (JSON.stringify([...planned].sort()) !== JSON.stringify(ids)) throw new Error("Static registered IDs differ from independent plan");
if(ids.length!==12 || new Set(ids).size!==12) throw new Error("Expected 12 unique canonical IDs");
await writeFile(resolve(import.meta.dirname,"16-registration-verified.json"),JSON.stringify({status:"static-registration-only-not-execution",source:path,sourceSha256:sha(bytes),declarations,ids,originalPlan:{path:originalPath,sha256:sha(originalBytes)},finalPlan:{path:finalPath,sha256:sha(finalBytes)}},null,2)+"\n");
console.log(JSON.stringify({topLevelDeclarations:declarations.length,uniqueExpandedIds:ids.length,nestedDeclarations:0,independentPlans:2}));
