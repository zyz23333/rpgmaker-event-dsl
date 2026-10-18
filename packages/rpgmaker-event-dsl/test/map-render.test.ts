import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { isAbsolute, join } from "node:path";

import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";

import { cloneWorkspace, renderWorkspaceMap } from "../src/workspace-api.js";
import {
  compileMapWorkspace,
  createMapWorkspace,
  mapFixture,
  readWorkspaceFiles,
} from "./map-observation-fixture.js";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

async function createOrdinaryTileWorkspace() {
  const fixture = await createMapWorkspace({ clone: false });
  const map = mapFixture();
  map.data.splice(0, 6, 8, 128, 256, 512, 768, 1536);
  await writeFile(join(fixture.dataDirectory, "Map001.json"), JSON.stringify(map));
  const tilesetsPath = join(fixture.dataDirectory, "Tilesets.json");
  const tilesets = JSON.parse(await readFile(tilesetsPath, "utf8"));
  tilesets[1].tilesetNames = ["", "", "", "", "A5", "B", "C", "D", "E"];
  await writeFile(tilesetsPath, JSON.stringify(tilesets));
  const imageDirectory = join(fixture.projectRoot, "img", "tilesets");
  await mkdir(imageDirectory, { recursive: true });
  for (const [name, color] of [
    ["A5", [220, 0, 220, 255]],
    ["B", [220, 0, 0, 255]],
    ["C", [0, 220, 0, 255]],
    ["D", [0, 0, 220, 255]],
    ["E", [220, 220, 0, 255]],
  ] as const) {
    const png = new PNG({ width: 768, height: 768 });
    for (let y = 0; y < 48; y++) {
      for (let x = 0; x < 48; x++) {
        const sx = name === "B" ? x + 384 : x;
        png.data.set(color, (y * 768 + sx) * 4);
        if (name === "B") png.data.set([0, 220, 220, 255], ((y + 48) * 768 + x) * 4);
      }
    }
    await writeFile(join(imageDirectory, `${name}.png`), PNG.sync.write(png));
  }
  await cloneWorkspace({ workspaceRoot: fixture.workspaceRoot });
  return fixture;
}

function pixel(png: PNG, x: number, y: number) {
  return [...png.data.subarray((y * png.width + x) * 4, (y * png.width + x) * 4 + 4)];
}

describe("Workspace Map Preview", () => {
  it("renders generated ordinary tiles with generated event pages and baseline supporting inputs", async () => {
    const { workspaceRoot } = await createOrdinaryTileWorkspace();
    try {
      await compileMapWorkspace(workspaceRoot);
      const result = await renderWorkspaceMap({ workspaceRoot, mapId: 1, source: "generated" });
      expect(result.source).toBe("generated");
      expect(result.previewPages).toEqual([{ eventId: 2, page: 1 }]);
      expect(
        result.dataInputs.map(({ relativePath, source }) => ({ relativePath, source })),
      ).toEqual([
        { relativePath: "MapInfos.json", source: "snapshot" },
        { relativePath: "Map001.json", source: "generated" },
        { relativePath: "Tilesets.json", source: "snapshot" },
      ]);
      const png = PNG.sync.read(await readFile(result.artifacts.png));
      expect(pixel(png, 72, 24)).toEqual([220, 0, 0, 255]);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("treats image-free events and unused image slots as valid without executing source or project scripts", async () => {
    const { workspaceRoot, projectRoot } = await createMapWorkspace();
    try {
      await writeFile(
        join(workspaceRoot, "src", "broken.events.ts"),
        'throw new Error("Definition Source was executed");',
      );
      await mkdir(join(projectRoot, "js"));
      await writeFile(
        join(projectRoot, "js", "plugins.js"),
        'throw new Error("Project scripts were executed");',
      );
      const result = await renderWorkspaceMap({ workspaceRoot, mapId: 1 });
      expect(result.imageInputs).toEqual([]);
      expect(result.complete).toBe(true);
      expect(result.previewPages).toEqual([{ eventId: 1, page: 1 }]);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it.each(["missing", "undecodable", "undersized", "oversized"])(
    "fails actionably for a %s required asset without publishing a partial result",
    async (damage) => {
      const { workspaceRoot, projectRoot } = await createOrdinaryTileWorkspace();
      try {
        const path = join(projectRoot, "img", "tilesets", "A5.png");
        if (damage === "missing") await rm(path);
        if (damage === "undecodable") await writeFile(path, "not a PNG");
        if (damage === "undersized")
          await writeFile(path, PNG.sync.write(new PNG({ width: 1, height: 1 })));
        if (damage === "oversized") {
          const oversizedHeader = Buffer.alloc(33);
          oversizedHeader.set([137, 80, 78, 71, 13, 10, 26, 10]);
          oversizedHeader.write("IHDR", 12, "ascii");
          oversizedHeader.writeUInt32BE(65_536, 16);
          oversizedHeader.writeUInt32BE(65_536, 20);
          await writeFile(path, oversizedHeader);
        }
        const before = await readWorkspaceFiles(workspaceRoot);
        await expect(renderWorkspaceMap({ workspaceRoot, mapId: 1 })).rejects.toThrow(/A5/u);
        expect(await readWorkspaceFiles(workspaceRoot)).toEqual(before);
      } finally {
        await rm(workspaceRoot, { recursive: true, force: true });
      }
    },
  );

  it("records replaced live image bytes separately without changing the Compile Baseline", async () => {
    const { workspaceRoot, projectRoot } = await createOrdinaryTileWorkspace();
    try {
      await compileMapWorkspace(workspaceRoot);
      const first = await renderWorkspaceMap({ workspaceRoot, mapId: 1, source: "generated" });
      const state = join(workspaceRoot, ".rpgmaker-event-dsl");
      const manifest = await readFile(join(state, "sync-manifest.json"));
      const imagePath = join(projectRoot, "img", "tilesets", "C.png");
      const png = PNG.sync.read(await readFile(imagePath));
      for (let y = 0; y < 48; y++)
        for (let x = 0; x < 48; x++) png.data.set([42, 52, 62, 255], (y * png.width + x) * 4);
      await writeFile(imagePath, PNG.sync.write(png));
      const second = await renderWorkspaceMap({ workspaceRoot, mapId: 1, source: "generated" });
      expect(second.dataInputs).toEqual(first.dataInputs);
      expect(
        second.imageInputs.find(({ relativePath }) => relativePath.endsWith("C.png"))?.hash,
      ).not.toBe(
        first.imageInputs.find(({ relativePath }) => relativePath.endsWith("C.png"))?.hash,
      );
      expect(second.artifacts.png).not.toBe(first.artifacts.png);
      expect(pixel(PNG.sync.read(await readFile(second.artifacts.png)), 120, 24)).toEqual([
        42, 52, 62, 255,
      ]);
      expect(await readFile(join(state, "sync-manifest.json"))).toEqual(manifest);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it.each(["upper tile", "layer", "shadow", "parallax", "event image", "large output"])(
    "rejects unsupported %s rather than silently producing an incomplete scene",
    async (feature) => {
      const { workspaceRoot, dataDirectory } = await createMapWorkspace({ clone: false });
      try {
        const map = mapFixture();
        if (feature === "upper tile") {
          map.data[0] = 1;
          const path = join(dataDirectory, "Tilesets.json");
          const tilesets = JSON.parse(await readFile(path, "utf8"));
          tilesets[1].flags[1] = 0x10;
          await writeFile(path, JSON.stringify(tilesets));
        }
        if (feature === "layer") map.data[6] = 1;
        if (feature === "shadow") map.data[24] = 1;
        if (feature === "parallax") map.parallaxName = "Sky";
        if (feature === "event image") map.events[1]!.pages[0]!.image.characterName = "Actor1";
        if (feature === "large output") {
          map.width = 100;
          map.data = Array<number>(1200).fill(0);
        }
        await writeFile(join(dataDirectory, "Map001.json"), JSON.stringify(map));
        await cloneWorkspace({ workspaceRoot });
        const before = await readWorkspaceFiles(workspaceRoot);
        await expect(renderWorkspaceMap({ workspaceRoot, mapId: 1 })).rejects.toThrow(
          /not implemented|resource limit/u,
        );
        expect(await readWorkspaceFiles(workspaceRoot)).toEqual(before);
      } finally {
        await rm(workspaceRoot, { recursive: true, force: true });
      }
    },
  );

  it("exposes artifact locations through clean CLI JSON and readable human output", async () => {
    const { workspaceRoot } = await createOrdinaryTileWorkspace();
    try {
      const execute = promisify(execFile);
      const cli = fileURLToPath(new URL("../src/cli.ts", import.meta.url));
      const args = ["--import", import.meta.resolve("tsx"), cli, "map", "render", "--map", "1"];
      const json = await execute(process.execPath, [...args, "--json"], { cwd: workspaceRoot });
      expect(JSON.parse(json.stdout)).toMatchObject({
        kind: "map-preview",
        source: "snapshot",
        artifacts: { png: expect.any(String), metadata: expect.any(String) },
      });
      expect(json.stderr).toBe("");
      const human = await execute(process.execPath, args, { cwd: workspaceRoot });
      expect(human.stdout).toContain("Map 1: Town (snapshot)");
      expect(human.stdout).toContain("144 x 96 pixels");
      expect(human.stdout).toContain("preview.png");
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("renders native ordinary atlas tiles into matching PNG and provenance artifacts", async () => {
    const { workspaceRoot, projectRoot } = await createOrdinaryTileWorkspace();
    try {
      const before = await readWorkspaceFiles(workspaceRoot);
      const result = await renderWorkspaceMap({ workspaceRoot, mapId: 1 });
      expect(result).toMatchObject({
        schemaVersion: 1,
        kind: "map-preview",
        source: "snapshot",
        map: { id: 1, name: "Town" },
        originalMap: { width: 3, height: 2, tileWidth: 48, tileHeight: 48 },
        bounds: { x: 0, y: 0, width: 3, height: 2 },
        output: { width: 144, height: 96 },
        mapContent: { x: 0, y: 0, width: 144, height: 96 },
        transform: { scaleX: 48, scaleY: 48, offsetX: 0, offsetY: 0 },
        compatibility: { target: "rpg-maker-mv-native-static", animationFrame: 0 },
        previewPages: [{ eventId: 1, page: 1 }],
        complete: true,
        warnings: [],
      });
      expect(isAbsolute(result.artifacts.png)).toBe(true);
      expect(isAbsolute(result.artifacts.metadata)).toBe(true);
      expect(JSON.parse(await readFile(result.artifacts.metadata, "utf8"))).toEqual(result);
      const png = PNG.sync.read(await readFile(result.artifacts.png));
      expect([png.width, png.height]).toEqual([144, 96]);
      // Hand-selected MV ordinary atlas coordinates: B8=(0,48), B128=(384,0),
      // C/D/E first tiles=(0,0), A5 first tile=(0,0).
      expect([pixel(png, 24, 24), pixel(png, 72, 24), pixel(png, 120, 24)]).toEqual([
        [0, 220, 220, 255],
        [220, 0, 0, 255],
        [0, 220, 0, 255],
      ]);
      expect([pixel(png, 24, 72), pixel(png, 72, 72), pixel(png, 120, 72)]).toEqual([
        [0, 0, 220, 255],
        [220, 220, 0, 255],
        [220, 0, 220, 255],
      ]);
      expect(result.imageInputs).toHaveLength(5);
      for (const input of result.imageInputs) {
        expect(input.path).toBe(join(projectRoot, ...input.relativePath.split("/")));
        expect(input.hash).toBe(
          createHash("sha256")
            .update(await readFile(input.path))
            .digest("hex"),
        );
      }
      for (const input of result.dataInputs) {
        expect(input.hash).toBe(
          createHash("sha256")
            .update(await readFile(input.path))
            .digest("hex"),
        );
      }
      const after = await readWorkspaceFiles(workspaceRoot);
      for (const [path, content] of Object.entries(before)) expect(after[path]).toBe(content);
      expect(Object.keys(after).filter((path) => !(path in before))).toHaveLength(2);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });
});
