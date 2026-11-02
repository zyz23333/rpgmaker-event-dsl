import { expect, it } from "vitest";
import { collectAnimationAndTilesetAssets } from "../src/validation/asset-dependencies.js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createMinimalProject, runCli, withWindowsSandbox } from "./support/windows-sandbox.js";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
const {
  initWorkspace,
  cloneWorkspace,
  compileWorkspace,
}: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);

const roots = new Map([
  [
    "CommonEvents.json",
    JSON.stringify([
      null,
      {
        id: 1,
        name: "Selected",
        list: [
          { code: 212, indent: 0, parameters: [-1, 1, false] },
          { code: 282, indent: 0, parameters: [1] },
        ],
      },
    ]),
  ],
]);
const imageOrigin = {
  identity: "commonEvent:1",
  nativePath: "CommonEvents.json[1].list[0].parameters[1]",
  relatedNativePaths: [],
  conditions: [],
};
const external = (animation: unknown, tileset: unknown = { tilesetNames: [] }) =>
  new Map([
    ["Animations.json", JSON.stringify([null, animation])],
    ["Tilesets.json", JSON.stringify([null, tileset])],
  ]);

it("retains image siblings and complete selected timing chain when the timings container is uninterpretable", () => {
  const result = collectAnimationAndTilesetAssets(
    roots,
    external({ animation1Name: "First", animation2Name: "Second", timings: null }),
  );
  expect(result.uses.map((use) => use.name)).toEqual(["First", "Second"]);
  expect(result.problems).toEqual([
    {
      ...imageOrigin,
      dependencyChain: [
        {
          data: "Animations.json",
          id: 1,
          field: "timings",
          relationship: "Animation timing sound effects",
        },
      ],
      dataPath: "Animations.json[1].timings",
      reason: "Necessary animation timings must be an array; timing relationships are unchecked.",
    },
  ]);
});
it("retains later timing uses when an earlier timing record or audio record is invalid", () => {
  for (const damaged of [null, { se: null }, { se: {} }]) {
    const result = collectAnimationAndTilesetAssets(
      roots,
      external({
        animation1Name: "",
        animation2Name: "",
        timings: [damaged, { se: { name: "Later" } }],
      }),
    );
    expect(result.uses.map((use) => use.name)).toEqual(["Later"]);
    expect(result.problems).toHaveLength(1);
    expect(result.problems[0]).toMatchObject({
      dataPath: "Animations.json[1].timings[0].se.name",
      dependencyChain: [
        {
          data: "Animations.json",
          id: 1,
          field: "timings[0].se.name",
          relationship: "Animation timing sound effect",
        },
      ],
    });
  }
});
it("retains complete selected Tileset chain when the names container is uninterpretable", () => {
  const result = collectAnimationAndTilesetAssets(
    roots,
    external({ animation1Name: "", animation2Name: "", timings: [] }, { tilesetNames: 17 }),
  );
  expect(result.uses).toEqual([]);
  expect(result.problems).toEqual([
    {
      identity: "commonEvent:1",
      nativePath: "CommonEvents.json[1].list[1].parameters[0]",
      relatedNativePaths: [],
      conditions: [],
      dependencyChain: [
        {
          data: "Tilesets.json",
          id: 1,
          field: "tilesetNames",
          relationship: "Tileset image sheets",
        },
      ],
      dataPath: "Tilesets.json[1].tilesetNames",
      reason: "Necessary tilesetNames must be an array; tileset relationships are unchecked.",
    },
  ]);
});

it("reports a necessary-field failure together with an independently missing sibling through real Workspace and CLI gates", async () => {
  await withWindowsSandbox("asset-damaged-and-missing-sibling", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await createMinimalProject(root);
    for (const [file, data] of Object.entries({
      "MapInfos.json": [null, { id: 1, name: "Map" }],
      "Map001.json": { width: 1, height: 1, tilesetId: 1, events: [] },
      "Tilesets.json": [null, { id: 1, name: "Tiles" }],
      "Animations.json": [
        null,
        {
          id: 1,
          name: "Animation",
          animation1Name: 17,
          animation2Name: "MissingSibling",
          timings: [],
        },
      ],
    }))
      await writeFile(join(root, "Game/data", file), JSON.stringify(data));
    await initWorkspace({ workspaceRoot: root, projectRoot: "./Game" });
    await cloneWorkspace({ workspaceRoot: root });
    await writeFile(
      join(root, "src/damaged.events.ts"),
      'import {mapEvent,showAnimation,animationRef} from "rpgmaker-event-dsl";export const event=mapEvent({mapId:1,id:1,name:"Selected",x:0,y:0,pages:[{conditions:{},trigger:"action",commands:[showAnimation({target:{kind:"runtimeSelector",scope:"character",target:"player"},animation:animationRef({id:1}),wait:false})]}]});',
    );
    await mkdir(join(root, "Game/img/animations"), { recursive: true });
    const manifest = await readFile(join(root, ".rpgmaker-event-dsl/sync-manifest.json"), "utf8");
    for (const check of [true, false]) {
      const failure = await compileWorkspace({ workspaceRoot: root, check }).then(() => "", String);
      expect(failure).toContain("MV-ASSET-INVALID-DATA: Animations.json[1].animation1Name");
      expect(failure).toContain("MV-ASSET-MISSING-FILE");
      expect(failure).toContain("Animations.json[1].animation2Name");
    }
    const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
    expect(cli.exitCode).not.toBe(0);
    expect(cli.stderr).toContain("MV-ASSET-INVALID-DATA");
    expect(cli.stderr).toContain("MV-ASSET-MISSING-FILE");
    expect(await readFile(join(root, ".rpgmaker-event-dsl/sync-manifest.json"), "utf8")).toBe(
      manifest,
    );
  });
});
