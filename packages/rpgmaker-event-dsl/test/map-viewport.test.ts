import { execFile } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";

import { cloneWorkspace, renderWorkspaceMap } from "../src/workspace-api.js";
import { createMapWorkspace, mapFixture } from "./map-observation-fixture.js";

const palette = [
  [0, 0, 0],
  [220, 0, 0],
  [0, 220, 0],
  [0, 0, 220],
  [220, 220, 0],
  [0, 220, 220],
  [220, 0, 220],
] as const;

async function createViewportWorkspace() {
  const fixture = await createMapWorkspace({ clone: false });
  const atlas = new PNG({ width: 384, height: 48 });
  for (let y = 0; y < 48; y++) {
    for (let x = 0; x < 384; x++) {
      const color = palette[Math.floor(x / 48)] ?? palette[0];
      atlas.data.set([...color, 255], (y * 384 + x) * 4);
    }
  }
  await mkdir(join(fixture.projectRoot, "img", "tilesets"), { recursive: true });
  await writeFile(join(fixture.projectRoot, "img", "tilesets", "Cells.png"), PNG.sync.write(atlas));
  const tilesets = JSON.parse(await readFile(join(fixture.dataDirectory, "Tilesets.json"), "utf8"));
  tilesets[1].tilesetNames[5] = "Cells";
  await writeFile(join(fixture.dataDirectory, "Tilesets.json"), JSON.stringify(tilesets));
  await writeFile(
    join(fixture.dataDirectory, "Map001.json"),
    JSON.stringify({
      ...mapFixture(),
      width: 4,
      height: 3,
      events: [null],
      data: [1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6, ...Array<number>(60).fill(0)],
    }),
  );
  await cloneWorkspace({ workspaceRoot: fixture.workspaceRoot });
  return fixture;
}

function pixel(png: PNG, x: number, y: number): number[] {
  return [...png.data.subarray((y * png.width + x) * 4, (y * png.width + x) * 4 + 4)];
}

describe("Map Preview bounds and coordinates", () => {
  it("crops at native detail while retaining original-map coordinates in the pixel transform", async () => {
    const { workspaceRoot } = await createViewportWorkspace();
    try {
      const result = await renderWorkspaceMap({
        workspaceRoot,
        mapId: 1,
        crop: { x: 1, y: 1, width: 2, height: 2 },
        grid: false,
      });
      expect(result).toMatchObject({
        bounds: { x: 1, y: 1, width: 2, height: 2 },
        output: { width: 96, height: 96 },
        mapContent: { x: 0, y: 0, width: 96, height: 96 },
        transform: { scaleX: 48, scaleY: 48, offsetX: -48, offsetY: -48 },
      });
      const png = PNG.sync.read(await readFile(result.artifacts.png));
      expect([png.width, png.height]).toEqual([96, 96]);
      expect([
        pixel(png, 24, 24),
        pixel(png, 72, 24),
        pixel(png, 24, 72),
        pixel(png, 72, 72),
      ]).toEqual([
        [220, 0, 220, 255],
        [220, 0, 0, 255],
        [220, 220, 0, 255],
        [0, 220, 220, 255],
      ]);
      expect(JSON.parse(await readFile(result.artifacts.metadata, "utf8"))).toEqual(result);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("fits a large overview into the output budget before raster allocation and includes its final boundary cell", async () => {
    const { workspaceRoot, dataDirectory } = await createViewportWorkspace();
    try {
      const data = Array<number>(60_000).fill(0);
      data.fill(1, 0, 10_000);
      data[999] = 2;
      await writeFile(
        join(dataDirectory, "Map001.json"),
        JSON.stringify({
          ...mapFixture(),
          width: 1000,
          height: 10,
          events: [null],
          data,
        }),
      );
      await cloneWorkspace({ workspaceRoot });
      const result = await renderWorkspaceMap({ workspaceRoot, mapId: 1, grid: false });
      expect(result).toMatchObject({
        bounds: { x: 0, y: 0, width: 1000, height: 10 },
        originalMap: { width: 1000, height: 10 },
        output: { width: 4096, height: 40 },
        mapContent: { x: 0, y: 0, width: 4096, height: 40 },
        transform: { scaleX: 4.096, scaleY: 4, offsetX: 0, offsetY: 0 },
      });
      const png = PNG.sync.read(await readFile(result.artifacts.png));
      expect([png.width, png.height]).toEqual([4096, 40]);
      expect(pixel(png, 4095, 2)).toEqual([0, 220, 0, 255]);
      expect(pixel(png, 4095, 39)).toEqual([220, 0, 0, 255]);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("adds original-coordinate labels and grid by default with honest content bounds and margins", async () => {
    const { workspaceRoot } = await createViewportWorkspace();
    try {
      const result = await renderWorkspaceMap({
        workspaceRoot,
        mapId: 1,
        crop: { x: 1, y: 1, width: 2, height: 2 },
      });
      expect(result).toMatchObject({
        output: { width: 124, height: 116 },
        mapContent: { x: 28, y: 20, width: 96, height: 96 },
        transform: { scaleX: 48, scaleY: 48, offsetX: -20, offsetY: -28 },
        overlays: { grid: true, coordinateStep: { x: 1, y: 1 } },
      });
      const png = PNG.sync.read(await readFile(result.artifacts.png));
      expect([png.width, png.height]).toEqual([124, 116]);
      expect(pixel(png, 52, 44)).toEqual([220, 0, 220, 255]);
      expect(pixel(png, 76, 44)).toEqual([48, 64, 80, 255]);
      // The first X label is original column 1, whose top row is 010;
      // a crop-relative 0 would paint all three pixels in that row.
      expect(pixel(png, 51, 6)).toEqual([20, 24, 32, 255]);
      expect(pixel(png, 52, 6)).toEqual([240, 244, 248, 255]);
      expect(pixel(png, 0, 0)).toEqual([20, 24, 32, 255]);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("shows one looping-map definition rectangle and rejects invalid crops without wrapping", async () => {
    const { workspaceRoot, dataDirectory } = await createViewportWorkspace();
    try {
      const map = JSON.parse(await readFile(join(dataDirectory, "Map001.json"), "utf8"));
      await writeFile(
        join(dataDirectory, "Map001.json"),
        JSON.stringify({ ...map, scrollType: 3 }),
      );
      await cloneWorkspace({ workspaceRoot });
      const result = await renderWorkspaceMap({
        workspaceRoot,
        mapId: 1,
        crop: { x: 3, y: 2, width: 1, height: 1 },
        grid: false,
      });
      expect(result).toMatchObject({
        originalMap: { width: 4, height: 3 },
        bounds: { x: 3, y: 2, width: 1, height: 1 },
        output: { width: 48, height: 48 },
        looping: { horizontal: true, vertical: true },
      });
      const png = PNG.sync.read(await readFile(result.artifacts.png));
      expect(pixel(png, 24, 24)).toEqual([220, 0, 220, 255]);
      for (const crop of [
        { x: -1, y: 0, width: 1, height: 1 },
        { x: 0, y: 0, width: 0, height: 1 },
        { x: 0, y: 0, width: 1, height: -1 },
        { x: 0.5, y: 0, width: 1, height: 1 },
        { x: 3, y: 0, width: 2, height: 1 },
        { x: 0, y: 2, width: 1, height: 2 },
        { x: NaN, y: 0, width: 1, height: 1 },
        { x: 0, y: 0, width: Infinity, height: 1 },
      ]) {
        await expect(renderWorkspaceMap({ workspaceRoot, mapId: 1, crop })).rejects.toThrow(
          /Invalid crop|outside/iu,
        );
      }
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("exposes crops and the grid toggle through clean CLI output and rejects malformed crop tuples", async () => {
    const { workspaceRoot } = await createViewportWorkspace();
    try {
      const execute = promisify(execFile);
      const cli = fileURLToPath(new URL("../src/cli.ts", import.meta.url));
      const args = ["--import", import.meta.resolve("tsx"), cli, "map", "render", "--map", "1"];
      const result = await execute(
        process.execPath,
        [...args, "--crop", "1,1,2,2", "--no-grid", "--json"],
        { cwd: workspaceRoot },
      );
      expect(JSON.parse(result.stdout)).toMatchObject({
        bounds: { x: 1, y: 1, width: 2, height: 2 },
        output: { width: 96, height: 96 },
        overlays: { grid: false },
      });
      expect(result.stderr).toBe("");
      const human = await execute(process.execPath, [...args, "--crop", "1,1,2,2"], {
        cwd: workspaceRoot,
      });
      expect(human.stdout).toContain("Bounds: (1, 1), 2 x 2 cells");
      expect(human.stdout).toContain("124 x 116 pixels");
      for (const crop of ["1,1,2", "1.5,0,1,1", "0,,1,1"]) {
        await expect(
          execute(process.execPath, [...args, "--crop", crop, "--json"], { cwd: workspaceRoot }),
        ).rejects.toMatchObject({ stdout: "", stderr: expect.stringContaining("Invalid --crop") });
      }
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });
});
