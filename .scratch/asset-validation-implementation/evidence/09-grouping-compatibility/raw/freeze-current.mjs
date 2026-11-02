import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const raw = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(raw, "../../../../..");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const file = (name) => ({ path: name, bytes: fs.statSync(path.join(root, name)).size, sha256: hash(fs.readFileSync(path.join(root, name))) });
const contract = fs.readFileSync(path.join(root, "packages/rpgmaker-event-dsl/src/workspace/type-inputs.ts"), "utf8").match(/compileContractVersion = "([^"]+)"/u)[1];
assert.equal(contract, "mv-1.6.1/40");
const sources = execFileSync("git", ["ls-files", "packages/rpgmaker-event-dsl/src"], { cwd: root, encoding: "utf8" }).trim().split(/\r?\n/u).map(file);
const dist = "packages/rpgmaker-event-dsl/dist";
const artifacts = fs.readdirSync(path.join(root, dist)).sort().map((name) => file(dist + "/" + name));
const record = {
  head: execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(),
  integrationBase: "f79bacb496b18f59562663b7fc9e9d10e86c747f",
  contract,
  buildLog: path.relative(root, path.join(raw, "build-contract40.log")).split(path.sep).join("/"),
  canonicalTest: file("packages/rpgmaker-event-dsl/test/asset-system-workspace.test.ts"),
  sources,
  artifacts,
};
fs.writeFileSync(path.join(raw, "contract40-freeze.json"), JSON.stringify(record, null, 2) + "\n");
console.log(JSON.stringify({ head: record.head, contract, sourceFiles: sources.length, builtArtifacts: artifacts.length, canonicalSourceSha256: record.canonicalTest.sha256 }, null, 2));
