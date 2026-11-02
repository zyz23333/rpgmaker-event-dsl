import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { arch, release } from "node:os";
import { dirname, join, resolve } from "node:path";
import {
  createMinimalProject,
  withWindowsSandbox,
} from "../../../../../packages/rpgmaker-event-dsl/test/support/windows-sandbox.js";
import {
  startWorkspaceOperation,
  workspaceApiEntry,
} from "../../../../../packages/rpgmaker-event-dsl/test/support/workspace-operation-process.js";
import { getWorkspaceStatePaths } from "../../../../../packages/rpgmaker-event-dsl/src/workspace/state.js";

// Diagnostic-only: this script registers no AV ID and writes no canonical receipt.
// The original canonical callback, including both stale count=2 expectations,
// is frozen separately before this public API / actual CLI observation runs.
const destination = process.argv[2];
assert(destination, "Pass an absolute diagnostic JSON destination");
const api: typeof import("../../../../../packages/rpgmaker-event-dsl/src/workspace-api.js") =
  await import(workspaceApiEntry);
const audio = (name: string) => ({ name, volume: 21, pitch: 71, pan: -31 });
const authored =
  'import {mapEvent,commonEvent,troopEvent,gameOver,returnToTitleScreen,battleProcessing,troopRef,variableRef,rawDslCommand} from "rpgmaker-event-dsl";export const event=mapEvent({mapId:1,id:1,name:"System",x:0,y:0,pages:[{conditions:{},trigger:"action",commands:[gameOver(),gameOver(),returnToTitleScreen()]}]});';
const titleFiles = [
  "img/titles1/TitleOne.png",
  "img/titles2/TitleTwo.png",
  "audio/bgm/TitleMusic.ogg",
];
const expectedOrigins = [
  "Map001.json.events[1].pages[0].list[0]",
  "Map001.json.events[1].pages[0].list[1]",
];
const report: Record<string, unknown> = {
  purpose: "diagnostic-only; original Contract 39 input; no canonical AV pass claimed",
  sourceRevision: "126b1980014e5c9a4c9bd877505e04a30f097759",
  environment: { platform: process.platform, node: process.version, arch: arch(), release: release() },
  apiEntry: workspaceApiEntry,
  authored,
  expected: {
    groups: 1,
    files: 0,
    affectedUses: 2,
    origins: expectedOrigins,
    failurePath: "System.json.gameoverMe.name",
    chain: "System.json.gameoverMe.name (Game Over ME)",
    members: "two independent error members; base:error; effective:error",
    coverage: "incomplete",
    titleFiles,
  },
  operations: [],
};
async function save() {
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, JSON.stringify(report, null, 2) + "\n");
}
async function tree(path: string): Promise<Record<string, string> | null> {
  const entries = await readdir(path, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (entries === null) return null;
  const value: Record<string, string> = {};
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isDirectory()) {
      for (const [name, bytes] of Object.entries((await tree(join(path, entry.name)))!))
        value[`${entry.name}/${name}`] = bytes;
    } else value[entry.name] = (await readFile(join(path, entry.name))).toString("base64");
  }
  return value;
}
async function state(root: string) {
  const paths = getWorkspaceStatePaths(root);
  return {
    source: await tree(join(root, "src")),
    config: await readFile(join(root, "rpgmaker-event-dsl.config.json"), "utf8"),
    project: await tree(join(root, "Game")),
    snapshot: await tree(paths.projectDataSnapshotDirectory),
    generated: await tree(paths.generatedProjectDataDirectory),
    manifest: await readFile(paths.syncManifestPath, "utf8"),
    pending: await tree(paths.pendingPushDirectory),
  };
}
await withWindowsSandbox("asset-system-grouping-diagnostic", async (sandbox) => {
  const root = sandbox.workspaceRoot;
  report.sandboxRoot = sandbox.root;
  report.workspaceRoot = root;
  const fixture = await createMinimalProject(root);
  const files = {
    "System.json": {
      ...fixture.projectFiles["System.json"],
      gameoverMe: null,
      title1Name: "TitleOne",
      title2Name: "TitleTwo",
      titleBgm: audio("TitleMusic"),
      battleBgm: audio("BattleMusic"),
      victoryMe: audio("Victory"),
      defeatMe: audio("Defeat"),
      sounds: Array.from({ length: 10 }, (_, index) => audio(index === 7 ? "BattleStart" : "")),
      optSideView: false,
      hasEncryptedImages: false,
      hasEncryptedAudio: false,
    },
    "MapInfos.json": [null, { id: 1, name: "System" }],
    "Map001.json": {
      width: 1, height: 1, tilesetId: 1, specifyBattleback: true,
      battleback1Name: "BackOne", battleback2Name: "BackTwo", events: [],
      custom: { retain: [null, 17] },
    },
    "Troops.json": [null, { id: 1, name: "Selected troop", members: [], pages: [] }],
  };
  report.projectOverrides = files;
  for (const [name, data] of Object.entries(files))
    await writeFile(join(root, "Game/data", name), JSON.stringify(data));
  await api.initWorkspace({ workspaceRoot: root, projectRoot: "./Game" });
  await api.cloneWorkspace({ workspaceRoot: root });
  await writeFile(join(root, "src/system.events.ts"), authored);
  for (const name of titleFiles) {
    const path = join(root, "Game", name);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, "");
  }
  const before = await state(root);
  report.before = before;
  report.beforeSha256 = createHash("sha256").update(JSON.stringify(before)).digest("hex");
  await save();
  for (const input of [
    { operation: "check", mode: "api" },
    { operation: "compile", mode: "api" },
    { operation: "check", mode: "cli" },
  ] as const) {
    const child = startWorkspaceOperation(sandbox, { ...input, observeAssets: true });
    const timer = setTimeout(() => void child.stop(), 20_000);
    const exit = await child.ended.finally(() => clearTimeout(timer));
    const process = sandbox.processes.at(-1)!;
    const result = child.messages.find((message) => message.kind === "result");
    const text = input.mode === "api" ? result?.message ?? "" : process.stderr;
    const after = await state(root);
    const queries = (process.ipcMessages as { kind: string; path?: string }[])
      .filter((message) => message.kind === "asset-query").map((message) => message.path!);
    const memberLines = text.split("\n").filter((line) => line.startsWith("  - error map:1/event:1 "));
    const checks = {
      exitOne: exit.exitCode === 1,
      oneHeader: (text.match(/error MV-ASSET-INVALID-DATA/gu) ?? []).length === 1,
      exactMemberCount: memberLines.length === 2,
      originsExactlyOnce: expectedOrigins.every((origin) => memberLines.filter((line) => line.includes(origin + ";")).length === 1),
      allMemberChains: memberLines.every((line) => line.includes("chain: System.json.gameoverMe.name (Game Over ME)")),
      allMemberLevels: memberLines.every((line) => line.endsWith("; base: error; effective: error")),
      statistics: text.includes("1 problem group(s), 0 problem file(s), 2 affected use(s). Coverage: incomplete;"),
      failedField: text.includes("failed at: System.json.gameoverMe.name"),
      noFabricatedTarget: !text.includes("; target:"),
      noMissingFile: !text.includes("MV-ASSET-MISSING-FILE"),
      noQueryError: !text.includes("MV-ASSET-QUERY-FAILED"),
      titleFilesAllQueried: titleFiles.every((name) => queries.includes(resolve(root, "Game", name))),
      noContentRead: !(process.ipcMessages as { kind: string }[]).some((message) => message.kind === "asset-content-read-attempt"),
      unchanged: JSON.stringify(after) === JSON.stringify(before),
    };
    (report.operations as unknown[]).push({ input, process, text, memberLines, checks, after });
    await save();
    assert(Object.values(checks).every(Boolean), JSON.stringify(checks));
  }
  report.completed = true;
  await save();
});
console.log(`Diagnostic captured original input through API Check, API Compile and actual CLI Check: ${destination}`);
