import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, readdir, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repo = fileURLToPath(new URL("../../../../", import.meta.url));
const audit = join(repo, ".scratch/mv-native-support-audit");
const packageRoot = join(repo, "packages/rpgmaker-event-dsl");
const nativeMapPath = join(audit, "probes/containers/first-party-new-map.json");
const nativeMapText = await readFile(nativeMapPath, "utf8");
const nativeMap = JSON.parse(nativeMapText);
assert.deepEqual(nativeMap.events, []);
const hash = (value) => createHash("sha256").update(value).digest("hex");
const files = async (root) => Object.fromEntries(await Promise.all(
  (await readdir(root)).sort().map(async (name) => [name, await readFile(join(root, name), "utf8")]),
));
const receipt = {
  startedAt: new Date().toISOString(), node: process.version, platform: process.platform,
  nativeMapSha256: hash(nativeMapText), source: {}, built: {}, cases: [],
};
for (const file of ["map-event/native.ts", "project-data/materialization.ts", "workspace/type-inputs.ts"])
  receipt.source[file] = hash(await readFile(join(packageRoot, "src", file)));
for (const file of (await readdir(join(packageRoot, "dist"))).sort())
  receipt.built[file] = hash(await readFile(join(packageRoot, "dist", file)));
const tempRoot = await mkdtemp(join(tmpdir(), "mv-empty-map-fixed-"));
for (const route of ["src", "dist"]) {
  const workspaceRoot = join(tempRoot, route);
  const projectData = join(workspaceRoot, "Game/data");
  await mkdir(projectData, { recursive: true });
  await cp(join(repo, "references/RPGMV/NewData/data"), projectData, { recursive: true });
  await writeFile(join(workspaceRoot, "Game/Game.rpgproject"), "RPGMV 1.6.1\n");
  await writeFile(join(workspaceRoot, "package.json"), '{"type":"module"}\n');
  const pkg = join(workspaceRoot, "node_modules/rpgmaker-event-dsl");
  await mkdir(pkg, { recursive: true });
  await writeFile(join(pkg, "package.json"), JSON.stringify({ name: "rpgmaker-event-dsl", type: "module",
    exports: { ".": { types: route === "src" ? "./src/index.ts" : "./dist/index.d.mts" } } }));
  await symlink(join(packageRoot, route), join(pkg, route), "junction");
  const infos = JSON.parse(await readFile(join(projectData, "MapInfos.json"), "utf8"));
  infos[2] = { ...infos[1], id: 2, name: "New blank native Map", order: 2 };
  await writeFile(join(projectData, "MapInfos.json"), JSON.stringify(infos));
  await writeFile(join(projectData, "Map002.json"), nativeMapText);
  const entry = join(packageRoot, route, route === "src" ? "workspace-api.ts" : "workspace-api.mjs");
  const api = await import(pathToFileURL(entry).href);
  const operations = [];
  await api.initWorkspace({ workspaceRoot, projectRoot: "./Game" });
  await api.cloneWorkspace({ workspaceRoot });
  const snapshot = join(workspaceRoot, ".rpgmaker-event-dsl/project-data-snapshot");
  const beforeProject = await files(projectData);
  const beforeSnapshot = await files(snapshot);
  await api.decompileWorkspace({ workspaceRoot }); operations.push("decompile");
  await api.compileWorkspace({ workspaceRoot, check: true }); operations.push("check");
  await api.compileWorkspace({ workspaceRoot, check: false }); operations.push("compile");
  const generated = join(workspaceRoot, ".rpgmaker-event-dsl/generated-project-data/Map002.json");
  assert.deepEqual(JSON.parse(await readFile(generated, "utf8")), nativeMap);
  const diff = await api.diffWorkspace({ workspaceRoot, short: true }); operations.push("diff");
  assert.match(diff, /No changes/);
  await api.pushWorkspace({ workspaceRoot, allowDestructive: false }); operations.push("push");
  assert.deepEqual(await files(projectData), beforeProject);
  assert.deepEqual(await files(snapshot), beforeSnapshot);
  const manifest = JSON.parse(await readFile(join(workspaceRoot, ".rpgmaker-event-dsl/sync-manifest.json"), "utf8"));
  assert.equal(manifest.compileBaseline.compileContractVersion, "mv-1.6.1/24");
  receipt.cases.push({ route, workspaceRoot, operations, diff, nativeMapExact: true,
    projectBytesUnchanged: true, snapshotBytesUnchanged: true, contract: "mv-1.6.1/24" });
}
receipt.completedAt = new Date().toISOString();
await writeFile(join(audit, "evidence/root-recheck-empty-map-fixed.json"), JSON.stringify(receipt, null, 2) + "\n");
console.log(JSON.stringify(receipt, null, 2));
