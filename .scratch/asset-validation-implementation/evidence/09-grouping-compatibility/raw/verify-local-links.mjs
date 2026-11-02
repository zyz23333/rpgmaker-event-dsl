import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const raw = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(raw, "../../../../..");
const files = [
  ".scratch/asset-validation-implementation/evidence/09-grouping-compatibility/acceptance.md",
  ".scratch/asset-validation-implementation/issues/09-system-and-battle-defaults.md",
];
const targets = [];
for (const file of files) {
  const text = fs.readFileSync(path.join(root, file), "utf8");
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].replace(/^<|>$/g, "");
    if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("#")) continue;
    const absolute = path.resolve(root, path.dirname(file), decodeURIComponent(target.split("#")[0]));
    assert(fs.existsSync(absolute), `${file}: ${target}`);
    targets.push({ file, target });
  }
}
fs.writeFileSync(path.join(raw, "local-links.json"), JSON.stringify({ localLinksChecked: targets.length, errors: [], targets }, null, 2) + "\n");
console.log(JSON.stringify({ localLinksChecked: targets.length, errors: [] }));
