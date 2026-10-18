import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";

import { cloneWorkspace, renderWorkspaceMap } from "../src/workspace-api.js";
import {
  compileMapWorkspace,
  createMapWorkspace,
  mapFixture,
  readWorkspaceFiles,
} from "./map-observation-fixture.js";

function pixel(png: PNG, x: number, y: number): number[] {
  return [...png.data.subarray((y * png.width + x) * 4, (y * png.width + x) * 4 + 4)];
}

async function createLayerWorkspace() {
  const fixture = await createMapWorkspace({ clone: false });
  const map = mapFixture();
  // Native-source ledger: Tilemap._paintTiles assigns flagged tiles to z4,
  // shadows follow lower planes0/1, and lower planes2/3 cover those shadows.
  map.data = [
    1, 2, 1, 1, 1, 1, 2, 0, 4, 0, 0, 0, 3, 0, 3, 0, 3, 0, 0, 1, 5, 0, 0, 4, 0, 0, 0, 5, 1, 15, 10,
    20, 30, 40, 50, 60,
  ];
  await writeFile(join(fixture.dataDirectory, "Map001.json"), JSON.stringify(map));
  const tilesetsPath = join(fixture.dataDirectory, "Tilesets.json");
  const tilesets = JSON.parse(await readFile(tilesetsPath, "utf8"));
  tilesets[1].tilesetNames[5] = "Layers";
  tilesets[1].flags[2] = 0x10;
  await writeFile(tilesetsPath, JSON.stringify(tilesets));
  const atlas = new PNG({ width: 384, height: 48 });
  for (let y = 0; y < 48; y++) {
    for (let x = 0; x < 48; x++) {
      atlas.data.set([200, 100, 0, 255], (y * 384 + 48 + x) * 4);
      atlas.data.set([0, 200, 0, 255], (y * 384 + 96 + x) * 4);
      if (x < 24) atlas.data.set([0, 0, 200, 255], (y * 384 + 144 + x) * 4);
      atlas.data.set([0, 200, 0, 128], (y * 384 + 192 + x) * 4);
      if (x >= 36) atlas.data.set([200, 200, 0, 255], (y * 384 + 240 + x) * 4);
    }
  }
  await mkdir(join(fixture.projectRoot, "img", "tilesets"), { recursive: true });
  await writeFile(
    join(fixture.projectRoot, "img", "tilesets", "Layers.png"),
    PNG.sync.write(atlas),
  );
  await cloneWorkspace({ workspaceRoot: fixture.workspaceRoot });
  return fixture;
}

async function createParallaxWorkspace() {
  const fixture = await createMapWorkspace({ clone: false });
  const map = mapFixture();
  map.parallaxName = "!Sky";
  map.parallaxLoopX = true;
  map.parallaxLoopY = false;
  map.parallaxSx = 7;
  map.parallaxSy = -3;
  map.parallaxShow = false; // Native Spriteset_Map uses the name, not this editor setting.
  map.data[0] = 1;
  await writeFile(join(fixture.dataDirectory, "Map001.json"), JSON.stringify(map));
  const tilesetsPath = join(fixture.dataDirectory, "Tilesets.json");
  const tilesets = JSON.parse(await readFile(tilesetsPath, "utf8"));
  tilesets[1].tilesetNames[5] = "Glass";
  await writeFile(tilesetsPath, JSON.stringify(tilesets));
  const atlas = new PNG({ width: 96, height: 48 });
  for (let y = 0; y < 48; y++)
    for (let x = 0; x < 24; x++) atlas.data.set([200, 0, 0, 128], (y * 96 + 48 + x) * 4);
  const sky = new PNG({ width: 64, height: 64 });
  const colors = [
    [20, 40, 60, 255],
    [80, 100, 120, 255],
    [140, 160, 180, 255],
    [200, 220, 240, 255],
  ];
  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 64; x++)
      sky.data.set(colors[(y < 32 ? 0 : 2) + (x < 32 ? 0 : 1)]!, (y * 64 + x) * 4);
  await mkdir(join(fixture.projectRoot, "img", "tilesets"), { recursive: true });
  await mkdir(join(fixture.projectRoot, "img", "parallaxes"));
  await writeFile(join(fixture.projectRoot, "img", "tilesets", "Glass.png"), PNG.sync.write(atlas));
  await writeFile(join(fixture.projectRoot, "img", "parallaxes", "!Sky.png"), PNG.sync.write(sky));
  await mkdir(join(fixture.projectRoot, "js"));
  await writeFile(
    join(fixture.projectRoot, "js", "plugins.js"),
    'throw new Error("must not execute project scripts");',
  );
  await cloneWorkspace({ workspaceRoot: fixture.workspaceRoot });
  return fixture;
}

describe("native Map Preview layer composition", () => {
  it.each(["missing", "undecodable"])(
    "fails strict rendering for %s required parallax without partial artifacts",
    async (damage) => {
      const { workspaceRoot, projectRoot } = await createParallaxWorkspace();
      try {
        const path = join(projectRoot, "img", "parallaxes", "!Sky.png");
        if (damage === "missing") await rm(path);
        else await writeFile(path, "invalid parallax image");
        const before = await readWorkspaceFiles(workspaceRoot);
        await expect(renderWorkspaceMap({ workspaceRoot, mapId: 1 })).rejects.toThrow(
          /Map Image Asset img\/parallaxes\/!Sky.png/u,
        );
        expect(await readWorkspaceFiles(workspaceRoot)).toEqual(before);
      } finally {
        await rm(workspaceRoot, { recursive: true, force: true });
      }
    },
  );

  it("records changed live parallax bytes without altering generated freshness or synchronization", async () => {
    const { workspaceRoot, projectRoot } = await createParallaxWorkspace();
    try {
      await compileMapWorkspace(workspaceRoot);
      const first = await renderWorkspaceMap({ workspaceRoot, mapId: 1, source: "generated" });
      const manifestPath = join(workspaceRoot, ".rpgmaker-event-dsl", "sync-manifest.json");
      const manifest = await readFile(manifestPath);
      const path = join(projectRoot, "img", "parallaxes", "!Sky.png");
      const changed = PNG.sync.read(await readFile(path));
      changed.data.set([1, 2, 3, 255], (12 * changed.width + 4) * 4);
      await writeFile(path, PNG.sync.write(changed));
      const second = await renderWorkspaceMap({ workspaceRoot, mapId: 1, source: "generated" });
      expect(second.dataInputs).toEqual(first.dataInputs);
      expect(second.imageInputs[0]?.hash).not.toBe(first.imageInputs[0]?.hash);
      expect(pixel(PNG.sync.read(await readFile(second.artifacts.png)), 68, 12)).toEqual([
        1, 2, 3, 255,
      ]);
      expect(await readFile(manifestPath)).toEqual(manifest);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("tiles parallax behind transparent tiles from fixed map origin and time zero", async () => {
    const { workspaceRoot, projectRoot } = await createParallaxWorkspace();
    try {
      const before = await readWorkspaceFiles(workspaceRoot);
      const result = await renderWorkspaceMap({ workspaceRoot, mapId: 1 });
      const png = PNG.sync.read(await readFile(result.artifacts.png));
      // Native Spriteset_Map places a TilingSprite behind tiles; Game_Map.setupParallax
      // initializes both offsets to zero. These samples use an independently colored 64px bitmap.
      expect(pixel(png, 12, 12)).toEqual([110, 20, 30, 255]);
      expect(pixel(png, 36, 12)).toEqual([80, 100, 120, 255]);
      expect(pixel(png, 68, 12)).toEqual([20, 40, 60, 255]);
      expect(pixel(png, 132, 84)).toEqual([20, 40, 60, 255]);
      expect(pixel(png, 100, 40)).toEqual([200, 220, 240, 255]);
      expect(result.parallax).toEqual({
        name: "!Sky",
        originX: 0,
        originY: 0,
        time: 0,
        loopX: true,
        loopY: false,
        scrollX: 7,
        scrollY: -3,
      });
      expect(result.imageInputs.map(({ relativePath }) => relativePath)).toEqual([
        "img/parallaxes/!Sky.png",
        "img/tilesets/Glass.png",
      ]);
      expect(result.imageInputs[0]?.path).toBe(join(projectRoot, "img", "parallaxes", "!Sky.png"));
      const after = await readWorkspaceFiles(workspaceRoot);
      for (const [path, content] of Object.entries(before)) expect(after[path]).toBe(content);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("composes lower/upper tiles, transparency, and shadow quarters in native MV order", async () => {
    const { workspaceRoot } = await createLayerWorkspace();
    try {
      const before = await readWorkspaceFiles(workspaceRoot);
      const result = await renderWorkspaceMap({ workspaceRoot, mapId: 1 });
      const png = PNG.sync.read(await readFile(result.artifacts.png));
      // Starred plane1 covers later lower plane2; starred plane0 covers plane3.
      expect(pixel(png, 12, 12)).toEqual([0, 200, 0, 255]);
      expect(pixel(png, 60, 12)).toEqual([0, 200, 0, 255]);
      // Plane2's opaque half covers plane1; transparent parts preserve its blend.
      expect(pixel(png, 108, 12)).toEqual([0, 0, 200, 255]);
      expect(pixel(png, 126, 12)).toEqual([100, 150, 0, 255]);
      expect(pixel(png, 138, 12)).toEqual([200, 200, 0, 255]);
      // Bits 0/2 shade only the left quarters. Lower plane2 covers shadows.
      expect(pixel(png, 12, 60)).toEqual([100, 50, 0, 255]);
      expect(pixel(png, 12, 84)).toEqual([100, 50, 0, 255]);
      expect(pixel(png, 36, 60)).toEqual([200, 100, 0, 255]);
      expect(pixel(png, 60, 60)).toEqual([0, 0, 200, 255]);
      expect(pixel(png, 84, 60)).toEqual([200, 100, 0, 255]);
      expect(pixel(png, 108, 60)).toEqual([50, 125, 0, 255]);
      const after = await readWorkspaceFiles(workspaceRoot);
      for (const [path, content] of Object.entries(before)) expect(after[path]).toBe(content);
      expect(Object.keys(after).filter((path) => !(path in before))).toHaveLength(2);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });
});
