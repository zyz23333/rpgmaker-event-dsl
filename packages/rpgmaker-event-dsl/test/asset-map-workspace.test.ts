import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect } from "vitest";
import { createAssetTest, recordAssetInput } from "./support/asset-evidence.js";
import { createMinimalProject, runCli, withWindowsSandbox } from "./support/windows-sandbox.js";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";

const api: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const it = createAssetTest({ ownerTicket: "06", testSource: import.meta.url });
const imports = 'import {mapEvent,transferPlayer,mapRef,rawDslCommand} from "rpgmaker-event-dsl";';
const transfer = (raw: boolean) =>
  raw
    ? "rawDslCommand({code:201,parameters:[0,2,0,0,0,0]})"
    : 'transferPlayer({destination:{kind:"direct",map:mapRef({id:2}),x:0,y:0}})';
const source = (command: string, pageFields = "") =>
  `${imports}export const event=mapEvent({mapId:1,id:1,name:"Map assets",x:0,y:0,pages:[{conditions:{},trigger:"action",commands:[${command}]${pageFields}}]});`;

async function prepare(root: string, authored: string, overrides: Record<string, unknown> = {}) {
  await createMinimalProject(root);
  const files = {
    "MapInfos.json": [null, { id: 1, name: "Host" }, { id: 2, name: "Transfer" }],
    "Map001.json": { width: 1, height: 1, tilesetId: 1, events: [] },
    "Map002.json": {
      width: 1,
      height: 1,
      tilesetId: 2,
      parallaxName: "MissingSky",
      autoplayBgm: true,
      autoplayBgs: true,
      bgm: { name: "MissingBgm", volume: 20, pitch: 80, pan: 0 },
      bgs: { name: "MissingBgs", volume: 20, pitch: 80, pan: 0 },
      events: [
        null,
        {
          id: 1,
          name: "Target-only event",
          x: 0,
          y: 0,
          pages: [
            {
              list: [
                {
                  code: 231,
                  indent: 0,
                  parameters: [1, "MissingTargetPicture", 0, 0, 0, 0, 100, 100, 255, 0],
                },
                { code: 0, indent: 0, parameters: [] },
              ],
            },
          ],
        },
      ],
    },
    "Tilesets.json": [
      null,
      { id: 1, name: "Host tiles", tilesetNames: ["", "", "", "", "", "MissingHostTile"] },
      { id: 2, name: "Target tiles", tilesetNames: ["MissingTransferTile"] },
    ],
    ...overrides,
  };
  for (const [file, data] of Object.entries(files))
    await writeFile(join(root, "Game/data", file), JSON.stringify(data));
  await api.initWorkspace({ workspaceRoot: root, projectRoot: "./Game" });
  await api.cloneWorkspace({ workspaceRoot: root });
  await writeFile(join(root, "src/map-assets.events.ts"), authored);
  recordAssetInput({ source: authored, projectOverrides: files });
}

for (const representation of ["formal", "raw"] as const)
  it(`AV.C12.${representation === "formal" ? "transfer-network" : "transfer-initial-assets"}.${representation}.case.expected: a fixed Transfer retains its Map reference without checking destination assets`, async () => {
    await withWindowsSandbox(`asset-transfer-scope-${representation}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      await prepare(root, source(transfer(representation === "raw")));
      const checked = await runCli(sandbox, ["compile", "--check"]);
      expect(checked.exitCode).toBe(0);
      expect(checked.stderr).not.toContain("MV-ASSET-");
      expect(checked.stderr).not.toContain("MissingTargetPicture");
      await api.compileWorkspace({ workspaceRoot: root, check: false });
      const generated = JSON.parse(
        await readFile(
          join(root, ".rpgmaker-event-dsl/generated-project-data/Map001.json"),
          "utf8",
        ),
      );
      expect(generated.events[1].pages[0].list[0].parameters[1]).toBe(2);
      expect(generated.events[1].pages[0].list[0].code).toBe(201);
    });
  });

it("AV.C12.page-initial-tileset.formal.case.expected: a page tile does not check the host's initial Tileset", async () => {
  await withWindowsSandbox("asset-page-tile-scope", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root, source("", ",image:{tileId:1,pattern:1}"));
    const checked = await runCli(sandbox, ["compile", "--check"]);
    expect(checked.exitCode).toBe(0);
    expect(checked.stderr).not.toContain("MV-ASSET-");
    await api.compileWorkspace({ workspaceRoot: root, check: false });
    const generated = JSON.parse(
      await readFile(join(root, ".rpgmaker-event-dsl/generated-project-data/Map001.json"), "utf8"),
    );
    expect(generated.events[1].pages[0].image.tileId).toBe(1);
  });
});
