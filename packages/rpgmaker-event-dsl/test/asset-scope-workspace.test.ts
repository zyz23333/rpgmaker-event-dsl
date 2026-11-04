import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, vi, it } from "vitest";
import { createMinimalProject, runCli, withWindowsSandbox } from "./support/windows-sandbox.js";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
const api: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
async function prepare(root: string, source: string, overrides: Record<string, unknown>) {
  await createMinimalProject(root);
  for (const [file, value] of Object.entries(overrides))
    await writeFile(join(root, "Game/data", file), JSON.stringify(value));
  await api.initWorkspace({ workspaceRoot: root, projectRoot: "./Game" });
  await api.cloneWorkspace({ workspaceRoot: root });
  await writeFile(join(root, "src/scope.events.ts"), source);
}
it("Transfer Player does not inspect destination Map media, while a direct picture is checked", async () => {
  await withWindowsSandbox("asset-scope-transfer", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    const source =
      'import {mapEvent,transferPlayer,mapRef,showPicture,imageAsset} from "rpgmaker-event-dsl";export const event=mapEvent({mapId:1,id:1,name:"Scope",x:0,y:0,pages:[{conditions:{},trigger:"action",commands:[transferPlayer({destination:{kind:"direct",map:mapRef({id:2}),x:0,y:0}}),showPicture({pictureId:1,image:imageAsset({folder:"pictures",name:"DirectPoster"}),origin:"upperLeft",position:{kind:"direct",x:0,y:0},scaleX:100,scaleY:100,opacity:255,blendMode:"normal"})]}]});';
    await prepare(root, source, {
      "MapInfos.json": [null, { id: 1, name: "Current" }, { id: 2, name: "Destination" }],
      "Map001.json": { width: 1, height: 1, tilesetId: 1, events: [] },
      "Map002.json": {
        width: 1,
        height: 1,
        tilesetId: 1,
        parallaxName: "AbsentParallax",
        bgm: { name: "AbsentBgm", volume: 90, pitch: 100, pan: 0 },
        bgs: { name: "AbsentBgs", volume: 90, pitch: 100, pan: 0 },
        autoplayBgm: true,
        autoplayBgs: true,
        events: [],
      },
    });
    const first = await api
      .compileWorkspace({ workspaceRoot: root, check: true })
      .then(() => "", String);
    expect(first).toContain('image/pictures "DirectPoster"');
    expect(first).not.toContain("AbsentParallax");
    expect(first).not.toContain("AbsentBgm");
    const path = join(root, "Game/img/pictures/DirectPoster.png");
    await mkdir(join(path, ".."), { recursive: true });
    await writeFile(path, "");
    await api.compileWorkspace({ workspaceRoot: root, check: true });
    const cli = await runCli(sandbox, ["compile", "--check"]);
    expect(cli.exitCode).toBe(0);
    expect(cli.stderr).not.toContain("AbsentParallax");
    expect(cli.stderr).not.toContain("AbsentBgm");
  });
});
it("negative Skill animation records a local stop without reading Animation 1 or Skill effects", async () => {
  await withWindowsSandbox("asset-scope-default-attack", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    const source =
      'import {commonEvent,forceAction,actorRef,skillRef} from "rpgmaker-event-dsl";export const event=commonEvent({id:1,name:"Default action",trigger:"none",commands:[forceAction({subject:{kind:"runtimeSelector",scope:"battler",target:"actor",actor:actorRef({id:1})},skill:skillRef({id:1}),target:{kind:"random"}})]});';
    await prepare(root, source, {
      "Actors.json": [null, { id: 1, name: "Actor", equips: [99] }],
      "Skills.json": [
        null,
        { id: 1, name: "Default attack", animationId: -1, effects: "unrelated damaged field" },
      ],
      "Animations.json": [null, { id: 1, animation1Name: "AbsentAnimation" }],
    });
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await api.compileWorkspace({ workspaceRoot: root, check: true });
      const text = errors.mock.calls.flat().join("\n");
      expect(text).toContain("info MV-ASSET-DYNAMIC-STOP");
      expect(text).toContain("Skills.json[1].animationId");
      expect(text).not.toContain("AbsentAnimation");
      expect(text).not.toContain("effects");
    } finally {
      errors.mockRestore();
    }
    const cli = await runCli(sandbox, ["compile", "--check"]);
    expect(cli.exitCode).toBe(0);
    expect(cli.stderr).toContain("info MV-ASSET-DYNAMIC-STOP");
    expect(cli.stderr).not.toContain("AbsentAnimation");
    expect(cli.stderr).not.toContain("effects");
    expect(await readFile(join(root, "Game/data/Skills.json"), "utf8")).toContain(
      "unrelated damaged field",
    );
  });
});
