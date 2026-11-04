import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import { createMinimalProject, runCli, withWindowsSandbox } from "./support/windows-sandbox.js";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
const api: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const imports =
  'import {mapEvent,troopEvent,gameOver,returnToTitleScreen,battleProcessing,troopRef,rawDslCommand} from "rpgmaker-event-dsl";';
const source = (command: string) =>
  `${imports}export const event=mapEvent({mapId:1,id:1,name:"System",x:0,y:0,pages:[{conditions:{},trigger:"action",commands:[${command}]}]});`;
const audio = (name: string) => ({ name, volume: 21, pitch: 71, pan: -31 });
const system = () => ({
  gameoverMe: audio("GameOver"),
  title1Name: "TitleOne",
  title2Name: "TitleTwo",
  titleBgm: audio("TitleMusic"),
  battleBgm: audio("ExcludedBattleMusic"),
  victoryMe: audio("ExcludedVictory"),
  defeatMe: audio("ExcludedDefeat"),
  sounds: Array.from({ length: 10 }, (_, index) => audio(index === 7 ? "ExcludedBattleStart" : "")),
  optSideView: false,
  hasEncryptedImages: false,
  hasEncryptedAudio: false,
});
const fields = [
  {
    family: "B11",
    branch: "game-over",
    token: "gameover-me",
    category: "audio",
    folder: "me",
    name: "GameOver",
    native: "gameoverMe.name",
  },
  {
    family: "B12",
    branch: "return-title",
    token: "title1",
    category: "image",
    folder: "titles1",
    name: "TitleOne",
    native: "title1Name",
  },
  {
    family: "B12",
    branch: "return-title",
    token: "title2",
    category: "image",
    folder: "titles2",
    name: "TitleTwo",
    native: "title2Name",
  },
  {
    family: "B12",
    branch: "return-title",
    token: "title-bgm",
    category: "audio",
    folder: "bgm",
    name: "TitleMusic",
    native: "titleBgm.name",
  },
] as const;
type Field = (typeof fields)[number];
const command = (family: Field["family"], representation: "formal" | "raw") =>
  representation === "raw"
    ? `rawDslCommand({code:${family === "B11" ? 353 : 354},parameters:[]})`
    : family === "B11"
      ? "gameOver()"
      : "returnToTitleScreen()";
async function prepare(
  root: string,
  authored: string,
  systemOverride: Record<string, unknown> = {},
  projectOverride: Record<string, unknown> = {},
) {
  const fixture = await createMinimalProject(root);
  const project = {
    "System.json": { ...fixture.projectFiles["System.json"], ...system(), ...systemOverride },
    "MapInfos.json": [null, { id: 1, name: "System" }],
    "Map001.json": {
      width: 1,
      height: 1,
      tilesetId: 1,
      specifyBattleback: true,
      battleback1Name: "ExcludedBackOne",
      battleback2Name: "ExcludedBackTwo",
      events: [],
    },
    "Troops.json": [null, { id: 1, name: "Selected troop", members: [], pages: [] }],
    ...projectOverride,
  };
  for (const [file, data] of Object.entries(project))
    await writeFile(join(root, "Game/data", file), JSON.stringify(data));
  await api.initWorkspace({ workspaceRoot: root, projectRoot: "./Game" });
  await api.cloneWorkspace({ workspaceRoot: root });
  await writeFile(join(root, "src/system.events.ts"), authored);
}
async function put(root: string, field: Field) {
  const path = join(
    root,
    "Game",
    field.category === "image" ? "img" : "audio",
    field.folder,
    `${field.name}.${field.category === "image" ? "png" : "ogg"}`,
  );
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, "");
  return path;
}
for (const representation of ["formal", "raw"] as const)
  for (const field of fields)
    for (const outcome of ["present", "missing"] as const)
      it(`only the selected System field is checked (${field.family}, ${field.branch}, ${representation}, ${field.token}, ${outcome})`, async () => {
        await withWindowsSandbox(
          `asset-system-${representation}-${field.token}-${outcome}`,
          async (sandbox) => {
            const root = sandbox.workspaceRoot;
            await prepare(root, source(command(field.family, representation)));
            for (const sibling of fields.filter((item) => item.family === field.family))
              await put(root, sibling);
            if (outcome === "missing")
              await rm(
                join(
                  root,
                  "Game",
                  field.category === "image" ? "img" : "audio",
                  field.folder,
                  `${field.name}.${field.category === "image" ? "png" : "ogg"}`,
                ),
              );
            const checked = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
            expect(checked.exitCode).toBe(outcome === "missing" ? 1 : 0);
            if (outcome === "missing") {
              expect(checked.stderr).toContain("MV-ASSET-MISSING-FILE");
              expect(checked.stderr).toContain(`System.json.${field.native}`);
              expect(checked.stderr).toContain(field.name);
              expect(checked.stderr).toContain(
                "map:1/event:1 Map001.json.events[1].pages[0].list[0]",
              );
            } else expect(checked.stderr).not.toContain("MV-ASSET-");
          },
        );
      });
it("Battle Processing does not check default System audio", async () => {
  await withWindowsSandbox("asset-battle-default-scope", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(
      root,
      source('battleProcessing({troop:{kind:"fixed",troop:troopRef({id:1})}})'),
      {
        battleBgm: ["malformed but unrelated"],
        victoryMe: 17,
        defeatMe: null,
        sounds: "unrelated",
      },
      {
        "Map001.json": { width: 1, height: 1, tilesetId: 1, specifyBattleback: false, events: [] },
      },
    );
    const checked = await runCli(sandbox, ["compile", "--check"]);
    expect(checked.exitCode).toBe(0);
    expect(checked.stderr).not.toContain("MV-ASSET-");
  });
});
it("Battle Processing does not check host Map battleback names", async () => {
  await withWindowsSandbox("asset-host-battleback-scope", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root, source('battleProcessing({troop:{kind:"fixed",troop:troopRef({id:1})}})'), {
      battleBgm: audio(""),
      victoryMe: audio(""),
      defeatMe: audio(""),
      sounds: [],
    });
    const checked = await runCli(sandbox, ["compile", "--check"]);
    expect(checked.exitCode).toBe(0);
    expect(checked.stderr).not.toContain("ExcludedBackOne");
    expect(checked.stderr).not.toContain("ExcludedBackTwo");
    expect(checked.stderr).not.toContain("MV-ASSET-");
  });
});
it("an unspecified battleback does not lead to terrain-derived asset checks", async () => {
  await withWindowsSandbox("asset-terrain-background-scope", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(
      root,
      source('battleProcessing({troop:{kind:"fixed",troop:troopRef({id:1})}})'),
      { battleBgm: audio(""), victoryMe: audio(""), defeatMe: audio(""), sounds: [] },
      {
        "Map001.json": {
          width: 1,
          height: 1,
          tilesetId: 1,
          specifyBattleback: false,
          battleback1Name: "",
          battleback2Name: "",
          events: [],
        },
      },
    );
    const checked = await runCli(sandbox, ["compile", "--check"]);
    expect(checked.exitCode).toBe(0);
    expect(checked.stderr).not.toContain("MV-ASSET-");
  });
});
it("a Troop Event root does not select battle-test backgrounds", async () => {
  await withWindowsSandbox("asset-battle-test-background-scope", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(
      root,
      `${imports}export const troop=troopEvent({troopId:1,pages:[{commands:[]}]});`,
    );
    const checked = await runCli(sandbox, ["compile", "--check"]);
    expect(checked.exitCode).toBe(0);
    expect(checked.stderr).not.toContain("MV-ASSET-");
  });
});
it("Game Over does not require a hardcoded system picture", async () => {
  await withWindowsSandbox("asset-hardcoded-game-over-scope", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root, source("gameOver()"));
    await put(root, fields[0]!);
    const checked = await runCli(sandbox, ["compile", "--check"]);
    expect(checked.exitCode).toBe(0);
    expect(checked.stderr).not.toContain("img/system/GameOver");
    expect(checked.stderr).not.toContain("MV-ASSET-");
  });
});
it("a selected System field still requires a name", async () => {
  await withWindowsSandbox("asset-title-field-required", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root, source("returnToTitleScreen()"), { title1Name: 17 });
    for (const field of fields.filter((item) => item.family === "B12")) await put(root, field);
    const checked = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
    expect(checked.exitCode).toBe(1);
    expect(checked.stderr).toContain("System.json.title1Name");
  });
});
