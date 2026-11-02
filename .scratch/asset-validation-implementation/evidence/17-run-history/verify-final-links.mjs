import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, relative } from "node:path";
const root = process.cwd();
const prefix = ".scratch/asset-validation-implementation/";
const files = [prefix + "issues/17-integrated-acceptance.md", prefix + "evidence/17-integrated-acceptance.md"];
const links = [];
for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/gu)) {
    const target = match[1].replace(/^<|>$/gu, "");
    if (/^[a-z]+:\/\//iu.test(target) || target.startsWith("#")) continue;
    const path = target.split("#")[0];
    const absolute = resolve(dirname(file), decodeURIComponent(path));
    if (!existsSync(absolute)) throw new Error("Missing final local evidence link " + file + " -> " + target);
    links.push({ source: file, line: text.slice(0, match.index).split("\n").length,
      target, resolvedPath: relative(root, absolute).split(/[\\/]/u).join("/"), exists: true });
  }
}
const result = { schemaVersion: 1, scope: "ticket17 final narrative and issue local-path links; fragments preserved, no anchor correctness claimed",
  sources: files, count: links.length, allLocalTargetsExist: true, links };
writeFileSync(prefix + "evidence/17-final-local-links.json", JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({ sources: files.length, localLinks: result.count, allExist: true }));
