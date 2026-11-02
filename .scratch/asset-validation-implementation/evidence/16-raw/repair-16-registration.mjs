// Preserve and repair the actual erroneous draft: callback declarations belonged
// at file scope. This is authoring history, not an acceptance execution.
import ts from "typescript";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const path = resolve("packages/rpgmaker-event-dsl/test/asset-recovery-workspace.test.ts");
const code = await readFile(path, "utf8");
const source = ts.createSourceFile(path, code, ts.ScriptTarget.Latest, true);
const declarations = [];
function visit(node) {
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "it")
    declarations.push(node);
  ts.forEachChild(node, visit);
}
visit(source);
if (declarations.length !== 9) throw new Error(`Expected one main and eight nested callbacks, got ${declarations.length}`);
const [main, ...nested] = declarations;
if (!nested.every(node => node.getStart(source) > main.getStart(source) && node.getEnd() < main.getEnd()))
  throw new Error("Unexpected registration shape; preserve original source");
let repaired = code;
for (const node of [...nested].sort((a,b)=>b.getStart(source)-a.getStart(source))) {
  const statement = node.parent;
  if (!ts.isExpressionStatement(statement)) throw new Error("Not a standalone callback expression");
  repaired = repaired.slice(0, statement.getStart(source)) + repaired.slice(statement.getEnd());
}
repaired = repaired.trimEnd() + "\n\n" + nested.map(node=>node.getText(source)+";\n").join("\n");
await writeFile(path, repaired);
console.log(JSON.stringify({ correctedDeclarations: declarations.length, nestedMovedToTopLevel: nested.length }));
