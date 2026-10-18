import { appendFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";

import { cloneWorkspace, inspectWorkspaceMap, renderWorkspaceMap } from "../src/workspace-api.js";
import {
  compileMapWorkspace,
  createMapWorkspace,
  mapFixture,
  readWorkspaceFiles,
} from "./map-observation-fixture.js";

async function createUnavailableAssetWorkspace() {
  const fixture = await createMapWorkspace({ clone: false });
  const map = mapFixture();
  map.data[0] = 1;
  map.data[1] = 1;
  await writeFile(join(fixture.dataDirectory, "Map001.json"), JSON.stringify(map));
  const path = join(fixture.dataDirectory, "Tilesets.json");
  const tilesets = JSON.parse(await readFile(path, "utf8"));
  tilesets[1].tilesetNames[5] = "Missing_B";
  await writeFile(path, JSON.stringify(tilesets));
  await cloneWorkspace({ workspaceRoot: fixture.workspaceRoot });
  return fixture;
}

function pixel(png: PNG, x: number, y: number) {
  return [...png.data.subarray((y * png.width + x) * 4, (y * png.width + x) * 4 + 4)];
}

describe("explicitly Incomplete Map Preview", () => {
  it.each(["undecodable", "unreadable"])(
    "reports %s assets explicitly while structured inspection remains independent of images",
    async (reason) => {
      const { workspaceRoot, projectRoot } = await createUnavailableAssetWorkspace();
      try {
        const directory = join(projectRoot, "img", "tilesets");
        await mkdir(directory, { recursive: true });
        if (reason === "undecodable")
          await writeFile(join(directory, "Missing_B.png"), "invalid PNG bytes");
        else await mkdir(join(directory, "Missing_B.png"));
        await expect(inspectWorkspaceMap({ workspaceRoot, mapId: 1 })).resolves.toMatchObject({
          kind: "map-summary",
          map: { id: 1 },
        });
        await expect(renderWorkspaceMap({ workspaceRoot, mapId: 1 })).rejects.toThrow(
          /Missing_B.png/u,
        );
        const result = await renderWorkspaceMap({
          workspaceRoot,
          mapId: 1,
          allowMissingAssets: true,
        });
        expect(result.complete).toBe(false);
        expect(result.imageInputs).toHaveLength(1);
        expect(result.imageInputs[0]).toMatchObject({ status: "unavailable", reason });
        expect(result.imageInputs[0]).not.toHaveProperty("hash");
        expect(result.warnings[0]).toMatchObject({ code: "map-image-unavailable", reason });
      } finally {
        await rm(workspaceRoot, { recursive: true, force: true });
      }
    },
  );

  it("keeps image-free events complete when diagnostic mode is enabled", async () => {
    const { workspaceRoot } = await createMapWorkspace();
    try {
      const result = await renderWorkspaceMap({
        workspaceRoot,
        mapId: 1,
        allowMissingAssets: true,
      });
      expect(result.complete).toBe(true);
      expect(result.imageInputs).toEqual([]);
      expect(result.warnings).toEqual([]);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it.each([
    "malformed map",
    "missing tileset filename",
    "invalid asset path",
    "invalid autotile shape",
    "image resource limit",
  ])("never relaxes %s in diagnostic mode", async (damage) => {
    const { workspaceRoot, projectRoot } = await createUnavailableAssetWorkspace();
    try {
      const snapshot = join(workspaceRoot, ".rpgmaker-event-dsl", "project-data-snapshot");
      const mapPath = join(snapshot, "Map001.json");
      const tilesetPath = join(snapshot, "Tilesets.json");
      if (damage === "malformed map") {
        const map = JSON.parse(await readFile(mapPath, "utf8"));
        map.data = [];
        await writeFile(mapPath, JSON.stringify(map));
      }
      if (damage === "invalid autotile shape") {
        const map = JSON.parse(await readFile(mapPath, "utf8"));
        map.data[0] = 4368;
        await writeFile(mapPath, JSON.stringify(map));
      }
      if (damage === "missing tileset filename" || damage === "invalid asset path") {
        const tilesets = JSON.parse(await readFile(tilesetPath, "utf8"));
        tilesets[1].tilesetNames[5] = damage === "invalid asset path" ? "../Outside" : "";
        await writeFile(tilesetPath, JSON.stringify(tilesets));
      }
      if (damage === "image resource limit") {
        const header = Buffer.alloc(33);
        header.set([137, 80, 78, 71, 13, 10, 26, 10]);
        header.write("IHDR", 12, "ascii");
        header.writeUInt32BE(65536, 16);
        header.writeUInt32BE(65536, 20);
        const directory = join(projectRoot, "img", "tilesets");
        await mkdir(directory, { recursive: true });
        await writeFile(join(directory, "Missing_B.png"), header);
      }
      const before = await readWorkspaceFiles(workspaceRoot);
      await expect(
        renderWorkspaceMap({ workspaceRoot, mapId: 1, allowMissingAssets: true }),
      ).rejects.toThrow(/Malformed|no filename|Invalid tilesets image|resource limit/u);
      expect(await readWorkspaceFiles(workspaceRoot)).toEqual(before);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it.each(["missing compile", "stale source", "altered generated map", "Interrupted Push"])(
    "preserves the %s guard before fallback images are considered",
    async (damage) => {
      const { workspaceRoot } = await createUnavailableAssetWorkspace();
      try {
        const state = join(workspaceRoot, ".rpgmaker-event-dsl");
        if (damage !== "missing compile") await compileMapWorkspace(workspaceRoot);
        if (damage === "stale source")
          await appendFile(
            join(workspaceRoot, "src", "entrance.events.ts"),
            '\nthrow new Error("observation must not execute source");',
          );
        if (damage === "altered generated map")
          await appendFile(join(state, "generated-project-data", "Map001.json"), " ");
        if (damage === "Interrupted Push") {
          await mkdir(join(state, "pending-push"));
          await writeFile(
            join(state, "pending-push", "pending-push.json"),
            JSON.stringify({
              version: 1,
              startedAt: "2026-10-18T00:00:00.000Z",
              affectedFiles: [
                {
                  relativePath: "Map001.json",
                  backupRelativePath: "Map001.json",
                  backupHash: "snapshot",
                  generatedHash: "generated",
                  snapshotHash: "snapshot",
                },
              ],
            }),
          );
        }
        const before = await readWorkspaceFiles(workspaceRoot);
        await expect(
          renderWorkspaceMap({
            workspaceRoot,
            mapId: 1,
            source: "generated",
            allowMissingAssets: true,
          }),
        ).rejects.toThrow(/Generated Project Data|Interrupted Push/u);
        expect(await readWorkspaceFiles(workspaceRoot)).toEqual(before);
      } finally {
        await rm(workspaceRoot, { recursive: true, force: true });
      }
    },
  );

  it("publishes no partial artifacts if the dedicated artifact area is unavailable", async () => {
    const { workspaceRoot } = await createUnavailableAssetWorkspace();
    try {
      await writeFile(
        join(workspaceRoot, ".rpgmaker-event-dsl", "map-previews"),
        "existing user file",
      );
      const before = await readWorkspaceFiles(workspaceRoot);
      await expect(
        renderWorkspaceMap({ workspaceRoot, mapId: 1, allowMissingAssets: true }),
      ).rejects.toThrow();
      expect(await readWorkspaceFiles(workspaceRoot)).toEqual(before);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("exposes explicit diagnostic mode and visible incomplete status through the CLI", async () => {
    const { workspaceRoot } = await createUnavailableAssetWorkspace();
    try {
      const execute = promisify(execFile);
      const cli = fileURLToPath(new URL("../src/cli.ts", import.meta.url));
      const args = ["--import", import.meta.resolve("tsx"), cli, "map", "render", "--map", "1"];
      await expect(
        execute(process.execPath, [...args, "--json"], { cwd: workspaceRoot }),
      ).rejects.toMatchObject({ stdout: "", stderr: expect.stringContaining("Missing_B.png") });
      const json = await execute(process.execPath, [...args, "--allow-missing-assets", "--json"], {
        cwd: workspaceRoot,
      });
      expect(JSON.parse(json.stdout)).toMatchObject({
        kind: "map-preview",
        complete: false,
        warnings: [{ code: "map-image-unavailable", reason: "missing" }],
      });
      expect(json.stderr).toBe("");
      const human = await execute(process.execPath, [...args, "--allow-missing-assets"], {
        cwd: workspaceRoot,
      });
      expect(human.stdout).toContain("INCOMPLETE");
      expect(human.stdout).toContain("Missing_B.png");
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("uses visible checker placeholders and a notice only after explicit opt-in, with unavailable provenance", async () => {
    const { workspaceRoot, projectRoot } = await createUnavailableAssetWorkspace();
    try {
      const before = await readWorkspaceFiles(workspaceRoot);
      await expect(renderWorkspaceMap({ workspaceRoot, mapId: 1 })).rejects.toThrow(
        /Missing_B.png/u,
      );
      expect(await readWorkspaceFiles(workspaceRoot)).toEqual(before);
      const result = await renderWorkspaceMap({
        workspaceRoot,
        mapId: 1,
        allowMissingAssets: true,
      });
      expect(result.complete).toBe(false);
      expect(result.imageInputs).toEqual([
        {
          status: "unavailable",
          reason: "missing",
          relativePath: "img/tilesets/Missing_B.png",
          path: join(projectRoot, "img", "tilesets", "Missing_B.png"),
        },
      ]);
      expect(result.warnings).toEqual([
        {
          code: "map-image-unavailable",
          reason: "missing",
          relativePath: "img/tilesets/Missing_B.png",
          path: join(projectRoot, "img", "tilesets", "Missing_B.png"),
          message: expect.stringContaining("Missing_B.png"),
        },
      ]);
      const png = PNG.sync.read(await readFile(result.artifacts.png));
      // Unavailable tiles are marked by opaque magenta/dark checker cells.
      expect([pixel(png, 4, 36), pixel(png, 12, 36)]).toEqual([
        [255, 0, 255, 255],
        [32, 0, 32, 255],
      ]);
      // Yellow INCOMPLETE glyph over a dark-red notice, separate from the checker.
      expect(pixel(png, 0, 0)).toEqual([160, 0, 0, 255]);
      expect(
        [...png.data].some(
          (value, index) =>
            value === 255 &&
            png.data[index + 1] === 255 &&
            png.data[index + 2] === 0 &&
            index % 4 === 0,
        ),
      ).toBe(true);
      expect(result.transform).toEqual({ scaleX: 48, scaleY: 48, offsetX: 0, offsetY: 0 });
      expect(JSON.parse(await readFile(result.artifacts.metadata, "utf8"))).toEqual(result);
      const after = await readWorkspaceFiles(workspaceRoot);
      for (const [path, content] of Object.entries(before)) expect(after[path]).toBe(content);
      expect(Object.keys(after).filter((path) => !(path in before))).toHaveLength(2);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });
});
