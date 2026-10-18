import { createHash } from "node:crypto";
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

async function createAutotileWorkspace(tileIds: number[], flags: Record<number, number> = {}) {
  const fixture = await createMapWorkspace({ clone: false });
  const map = { ...mapFixture(), width: tileIds.length, height: 1, events: [null] };
  map.data = [...tileIds, ...Array<number>(tileIds.length * 5).fill(0)];
  await writeFile(join(fixture.dataDirectory, "Map001.json"), JSON.stringify(map));
  const path = join(fixture.dataDirectory, "Tilesets.json");
  const tilesets = JSON.parse(await readFile(path, "utf8"));
  tilesets[1].tilesetNames = ["A1", "A2", "A3", "A4", "", "", "", "", ""];
  for (const [tile, flag] of Object.entries(flags)) tilesets[1].flags[Number(tile)] = flag;
  await writeFile(path, JSON.stringify(tilesets));
  const directory = join(fixture.projectRoot, "img", "tilesets");
  await mkdir(directory, { recursive: true });
  for (let sheet = 1; sheet <= 4; sheet++) {
    const png = new PNG({ width: 768, height: 768 });
    for (let y = 0; y < 768; y++) {
      for (let x = 0; x < 768; x++) {
        // Quarter coordinates are readable as red/green; upper/lower halves differ in blue.
        png.data.set(
          [Math.floor(x / 24) * 6, Math.floor(y / 24) * 6, sheet + (y % 24 >= 12 ? 120 : 0), 255],
          (y * 768 + x) * 4,
        );
      }
    }
    await writeFile(join(directory, `A${sheet}.png`), PNG.sync.write(png));
  }
  await cloneWorkspace({ workspaceRoot: fixture.workspaceRoot });
  return fixture;
}

function pixel(png: PNG, x: number, y: number) {
  return [...png.data.subarray((y * png.width + x) * 4, (y * png.width + x) * 4 + 4)];
}

describe("native MV autotile Map Preview", () => {
  it.each([4368, 6288, 2292])(
    "rejects tile %i with an undefined native shape without publishing artifacts",
    async (tileId) => {
      const { workspaceRoot } = await createAutotileWorkspace([tileId]);
      try {
        const before = await readWorkspaceFiles(workspaceRoot);
        await expect(renderWorkspaceMap({ grid: false, workspaceRoot, mapId: 1 })).rejects.toThrow(
          /Malformed autotile ID.*no native MV/u,
        );
        expect(await readWorkspaceFiles(workspaceRoot)).toEqual(before);
      } finally {
        await rm(workspaceRoot, { recursive: true, force: true });
      }
    },
  );

  it("preserves strict image failure and deterministic generated-source provenance for autotile scenes", async () => {
    const { workspaceRoot, projectRoot } = await createAutotileWorkspace([2816, 2048]);
    try {
      await compileMapWorkspace(workspaceRoot);
      const snapshot = await renderWorkspaceMap({ grid: false, workspaceRoot, mapId: 1 });
      const generated = await renderWorkspaceMap({
        grid: false,
        workspaceRoot,
        mapId: 1,
        source: "generated",
      });
      expect(generated.dataInputs[1]).toMatchObject({
        source: "generated",
        relativePath: "Map001.json",
      });
      expect(generated.imageInputs).toEqual(snapshot.imageInputs);
      expect(generated.compatibility.animationFrame).toBe(0);
      expect(await readFile(generated.artifacts.png)).toEqual(
        await readFile(snapshot.artifacts.png),
      );
      await rm(join(projectRoot, "img", "tilesets", "A1.png"));
      const before = await readWorkspaceFiles(workspaceRoot);
      await expect(
        renderWorkspaceMap({ grid: false, workspaceRoot, mapId: 1, source: "generated" }),
      ).rejects.toThrow(/required Map Image Asset img\/tilesets\/A1.png/u);
      expect(await readWorkspaceFiles(workspaceRoot)).toEqual(before);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("preserves native A2 table quarter underlay and half-height lip composition", async () => {
    const { workspaceRoot } = await createAutotileWorkspace([2863, 2844, 4352], {
      2863: 0x80,
      2844: 0x80,
      4352: 0x80,
    });
    try {
      const result = await renderWorkspaceMap({ grid: false, workspaceRoot, mapId: 1 });
      const png = PNG.sync.read(await readFile(result.artifacts.png));
      // Shape47 bottom quarters are (0,1)/(1,1). Native table underlay remaps
      // these to (0,3)/(3,3), then overlays the original top12px at y+12.
      expect([
        pixel(png, 6, 30),
        pixel(png, 30, 30),
        pixel(png, 6, 42),
        pixel(png, 30, 42),
      ]).toEqual([
        [0, 18, 2, 255],
        [18, 18, 2, 255],
        [0, 6, 2, 255],
        [6, 6, 2, 255],
      ]);
      // Shape28 bottom quarters are (2,5)/(1,5), using row3 below the table.
      expect([
        pixel(png, 54, 30),
        pixel(png, 78, 30),
        pixel(png, 54, 42),
        pixel(png, 78, 42),
      ]).toEqual([
        [12, 18, 2, 255],
        [6, 18, 2, 255],
        [12, 30, 2, 255],
        [6, 30, 2, 255],
      ]);
      // The same flag on A3 does not invoke table appearance.
      expect([pixel(png, 102, 30), pixel(png, 102, 42)]).toEqual([
        [12, 6, 3, 255],
        [12, 6, 123, 255],
      ]);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("composes stored floor, wall, roof, water, and waterfall shapes at frame zero", async () => {
    // Independent ledger from native Tilemap._drawAutotile and native shape tables,
    // github.com/rpgtkoolmv/corescript/blob/master/js/rpg_core/Tilemap.js.
    // Each row is TL/TR/BL/BR sampled in the upper half of that source quarter.
    // The expected coordinates/colors are literals, not imported renderer tables.
    const ledger = [
      {
        id: 2816,
        colors: [
          [12, 24, 2, 255],
          [6, 24, 2, 255],
          [12, 18, 2, 255],
          [6, 18, 2, 255],
        ],
      },
      {
        id: 2863,
        colors: [
          [0, 0, 2, 255],
          [6, 0, 2, 255],
          [0, 6, 2, 255],
          [6, 6, 2, 255],
        ],
      },
      {
        id: 4352,
        colors: [
          [12, 12, 3, 255],
          [6, 12, 3, 255],
          [12, 6, 3, 255],
          [6, 6, 3, 255],
        ],
      },
      {
        id: 4367,
        colors: [
          [0, 0, 3, 255],
          [18, 0, 3, 255],
          [0, 18, 3, 255],
          [18, 18, 3, 255],
        ],
      },
      {
        id: 5888,
        colors: [
          [12, 24, 4, 255],
          [6, 24, 4, 255],
          [12, 18, 4, 255],
          [6, 18, 4, 255],
        ],
      },
      {
        id: 6272,
        colors: [
          [12, 48, 4, 255],
          [6, 48, 4, 255],
          [12, 42, 4, 255],
          [6, 42, 4, 255],
        ],
      },
      {
        id: 2048,
        colors: [
          [12, 24, 1, 255],
          [6, 24, 1, 255],
          [12, 18, 1, 255],
          [6, 18, 1, 255],
        ],
      },
      {
        id: 2096,
        colors: [
          [12, 60, 1, 255],
          [6, 60, 1, 255],
          [12, 54, 1, 255],
          [6, 54, 1, 255],
        ],
      },
      {
        id: 2144,
        colors: [
          [84, 24, 1, 255],
          [78, 24, 1, 255],
          [84, 18, 1, 255],
          [78, 18, 1, 255],
        ],
      },
      {
        id: 2192,
        colors: [
          [84, 60, 1, 255],
          [78, 60, 1, 255],
          [84, 54, 1, 255],
          [78, 54, 1, 255],
        ],
      },
      {
        id: 2240,
        colors: [
          [108, 24, 1, 255],
          [102, 24, 1, 255],
          [108, 18, 1, 255],
          [102, 18, 1, 255],
        ],
      },
      {
        id: 2288,
        colors: [
          [180, 0, 1, 255],
          [174, 0, 1, 255],
          [180, 6, 1, 255],
          [174, 6, 1, 255],
        ],
      },
      {
        id: 2432,
        colors: [
          [12, 96, 1, 255],
          [6, 96, 1, 255],
          [12, 90, 1, 255],
          [6, 90, 1, 255],
        ],
      },
      {
        id: 2528,
        colors: [
          [12, 132, 1, 255],
          [6, 132, 1, 255],
          [12, 126, 1, 255],
          [6, 126, 1, 255],
        ],
      },
      {
        id: 2864,
        colors: [
          [36, 24, 2, 255],
          [30, 24, 2, 255],
          [36, 18, 2, 255],
          [30, 18, 2, 255],
        ],
      },
      {
        id: 5984,
        colors: [
          [60, 24, 4, 255],
          [54, 24, 4, 255],
          [60, 18, 4, 255],
          [54, 18, 4, 255],
        ],
      },
      {
        id: 2832,
        colors: [
          [0, 24, 2, 255],
          [6, 24, 2, 255],
          [0, 18, 2, 255],
          [6, 18, 2, 255],
        ],
      },
      {
        id: 2836,
        colors: [
          [12, 12, 2, 255],
          [6, 12, 2, 255],
          [12, 18, 2, 255],
          [6, 18, 2, 255],
        ],
      },
      {
        id: 2831,
        colors: [
          [12, 0, 2, 255],
          [18, 0, 2, 255],
          [12, 6, 2, 255],
          [18, 6, 2, 255],
        ],
      },
      {
        id: 2291,
        colors: [
          [168, 0, 1, 255],
          [186, 0, 1, 255],
          [168, 6, 1, 255],
          [186, 6, 1, 255],
        ],
      },
    ];
    const { workspaceRoot } = await createAutotileWorkspace(ledger.map(({ id }) => id));
    try {
      const result = await renderWorkspaceMap({ grid: false, workspaceRoot, mapId: 1 });
      expect(result.compatibility).toEqual({
        target: "rpg-maker-mv-native-static",
        animationFrame: 0,
      });
      const png = PNG.sync.read(await readFile(result.artifacts.png));
      for (const [index, entry] of ledger.entries()) {
        expect(
          [
            pixel(png, index * 48 + 6, 6),
            pixel(png, index * 48 + 30, 6),
            pixel(png, index * 48 + 6, 30),
            pixel(png, index * 48 + 30, 30),
          ],
          `tile ${entry.id}`,
        ).toEqual(entry.colors);
      }
      expect(result.imageInputs.map(({ relativePath }) => relativePath).sort()).toEqual([
        "img/tilesets/A1.png",
        "img/tilesets/A2.png",
        "img/tilesets/A3.png",
        "img/tilesets/A4.png",
      ]);
      for (const input of result.imageInputs)
        expect(input.hash).toBe(
          createHash("sha256")
            .update(await readFile(input.path))
            .digest("hex"),
        );
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });
});
