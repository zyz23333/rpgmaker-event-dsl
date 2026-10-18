import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { inspectWorkspaceMap, type MapInspectionSelector } from "../src/workspace-api.js";
import {
  compileMapWorkspace,
  createMapWorkspace,
  mapFixture,
  readWorkspaceFiles,
} from "./map-observation-fixture.js";

describe("Workspace Map Cell and area inspection", () => {
  it("reports exact boundary-cell layers, numeric Region/Terrain, and tile flag meanings without images", async () => {
    const { workspaceRoot } = await createMapWorkspace();
    try {
      const snapshot = join(workspaceRoot, ".rpgmaker-event-dsl", "project-data-snapshot");
      const map = mapFixture();
      map.data[5] = 1;
      map.data[11] = 2;
      map.data[17] = 3;
      map.data[23] = 4;
      map.data[29] = 10;
      map.data[35] = 27;
      await writeFile(join(snapshot, "Map001.json"), JSON.stringify(map));
      const tilesets = JSON.parse(await readFile(join(snapshot, "Tilesets.json"), "utf8"));
      // Native MV flag ledger: tile 1 has tag 1 + down/right; tile 2 has
      // ladder/bush/counter/damage; tile 3 has tag 2 + star + left/up.
      tilesets[1].flags[1] = 4101;
      tilesets[1].flags[2] = 480;
      tilesets[1].flags[3] = 8218;
      await writeFile(join(snapshot, "Tilesets.json"), JSON.stringify(tilesets));
      const before = await readWorkspaceFiles(workspaceRoot);

      const result = await inspectWorkspaceMap({
        workspaceRoot,
        mapId: 1,
        selector: { kind: "cell", x: 2, y: 1 },
      });

      expect(result).toMatchObject({
        schemaVersion: 1,
        kind: "map-cell",
        source: "snapshot",
        map: { id: 1, name: "Town" },
        width: 3,
        height: 2,
        cell: {
          x: 2,
          y: 1,
          regionId: 27,
          terrainTag: 2,
          shadowBits: 10,
          layers: [
            {
              layer: 0,
              tileId: 1,
              rawFlags: 4101,
              flags: {
                passageBlocked: { down: true, left: false, right: true, up: false },
                upperLayer: false,
                ladder: false,
                bush: false,
                counter: false,
                damageFloor: false,
                terrainTag: 1,
              },
            },
            {
              layer: 1,
              tileId: 2,
              rawFlags: 480,
              flags: { ladder: true, bush: true, counter: true, damageFloor: true },
            },
            {
              layer: 2,
              tileId: 3,
              rawFlags: 8218,
              flags: {
                passageBlocked: { down: false, left: true, right: false, up: true },
                upperLayer: true,
                terrainTag: 2,
              },
            },
            { layer: 3, tileId: 4, rawFlags: 0, flags: { terrainTag: 0 } },
          ],
        },
        warnings: [],
      });
      expect(result).not.toHaveProperty("passable");
      expect(result).not.toHaveProperty("reachable");
      expect(await readWorkspaceFiles(workspaceRoot)).toEqual(before);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("returns every requested area cell and events inside its definition-position rectangle", async () => {
    const { workspaceRoot } = await createMapWorkspace();
    try {
      const snapshot = join(workspaceRoot, ".rpgmaker-event-dsl", "project-data-snapshot");
      const map = mapFixture();
      map.data[31] = 7;
      map.data[32] = 8;
      map.data[34] = 9;
      map.data[35] = 10;
      map.events.push({ ...map.events[1]!, id: 2, name: "Outside area", x: 0, y: 0 });
      await writeFile(join(snapshot, "Map001.json"), JSON.stringify(map));

      const result = await inspectWorkspaceMap({
        workspaceRoot,
        mapId: 1,
        selector: { kind: "area", x: 1, y: 0, width: 2, height: 2 },
      });

      expect(result).toMatchObject({
        kind: "map-area",
        bounds: { x: 1, y: 0, width: 2, height: 2 },
        cells: [
          { x: 1, y: 0, regionId: 7, terrainTag: 0 },
          { x: 2, y: 0, regionId: 8, terrainTag: 0 },
          { x: 1, y: 1, regionId: 9, terrainTag: 0 },
          { x: 2, y: 1, regionId: 10, terrainTag: 0 },
        ],
        events: [{ id: 1, name: "Entrance", x: 2, y: 1 }],
      });
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("rejects invalid and out-of-bounds geometry even for looping maps", async () => {
    const { workspaceRoot } = await createMapWorkspace();
    try {
      const snapshot = join(workspaceRoot, ".rpgmaker-event-dsl", "project-data-snapshot");
      await writeFile(
        join(snapshot, "Map001.json"),
        JSON.stringify({ ...mapFixture(), scrollType: 3 }),
      );
      const selectors: MapInspectionSelector[] = [
        { kind: "cell", x: -1, y: 0 },
        { kind: "cell", x: 3, y: 0 },
        { kind: "cell", x: 0, y: 2 },
        { kind: "cell", x: 0.5, y: 0 },
        { kind: "cell", x: NaN, y: 0 },
        { kind: "cell", x: 0, y: Infinity },
        { kind: "area", x: 0, y: 0, width: 0, height: 1 },
        { kind: "area", x: 0, y: 0, width: 1, height: -1 },
        { kind: "area", x: 0, y: 0, width: 1.5, height: 1 },
        { kind: "area", x: 1, y: 1, width: 3, height: 1 },
        { kind: "area", x: 1, y: 1, width: 1, height: 2 },
        { kind: "area", x: -1, y: 0, width: 1, height: 1 },
        { kind: "area", x: 0, y: 0, width: Number.MAX_SAFE_INTEGER + 1, height: 1 },
      ];
      const before = await readWorkspaceFiles(workspaceRoot);
      for (const selector of selectors) {
        await expect(inspectWorkspaceMap({ workspaceRoot, mapId: 1, selector })).rejects.toThrow(
          /Invalid (cell|area).*integer|outside.*3 x 2|Invalid map inspection selector/iu,
        );
      }
      const origin = await inspectWorkspaceMap({
        workspaceRoot,
        mapId: 1,
        selector: { kind: "cell", x: 0, y: 0 },
      });
      expect(origin.cell).toMatchObject({ x: 0, y: 0, regionId: 0, terrainTag: 0 });
      expect(await readWorkspaceFiles(workspaceRoot)).toEqual(before);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("rejects ambiguous programmatic selectors instead of ignoring conflicting detail fields", async () => {
    const { workspaceRoot } = await createMapWorkspace();
    try {
      for (const selector of [
        { kind: "cell", x: 0, y: 0, eventId: 1 },
        { kind: "cell", x: 0, y: 0, commands: true },
        { kind: "area", x: 0, y: 0, width: 1, height: 1, eventId: 1 },
        { kind: "summary", x: 0 },
        { kind: "unknown" },
        [{ kind: "cell", x: 0, y: 0 }],
        null,
      ]) {
        await expect(
          inspectWorkspaceMap({
            workspaceRoot,
            mapId: 1,
            selector: selector as MapInspectionSelector,
          }),
        ).rejects.toThrow(/Invalid map inspection selector/u);
      }
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("uses verified generated carriers and baseline tileset data without restoring snapshot events", async () => {
    const { workspaceRoot } = await createMapWorkspace();
    try {
      const stateDirectory = join(workspaceRoot, ".rpgmaker-event-dsl");
      const snapshot = join(stateDirectory, "project-data-snapshot");
      const map = mapFixture();
      map.data[35] = 22;
      await writeFile(join(snapshot, "Map001.json"), JSON.stringify(map));
      await compileMapWorkspace(workspaceRoot);
      const before = await readWorkspaceFiles(workspaceRoot);
      const area = { kind: "area", x: 0, y: 0, width: 3, height: 2 } as const;
      const captured = await inspectWorkspaceMap({ workspaceRoot, mapId: 1, selector: area });
      const generated = await inspectWorkspaceMap({
        workspaceRoot,
        mapId: 1,
        source: "generated",
        selector: area,
      });
      expect(captured.events).toEqual([{ id: 1, name: "Entrance", x: 2, y: 1 }]);
      expect(generated.events).toEqual([{ id: 2, name: "Generated Entrance", x: 0, y: 0 }]);
      expect(generated.cells[5]).toMatchObject({ x: 2, y: 1, regionId: 22 });
      expect(
        generated.dataInputs.map(({ relativePath, source }) => ({ relativePath, source })),
      ).toEqual([
        { relativePath: "MapInfos.json", source: "snapshot" },
        { relativePath: "Map001.json", source: "generated" },
        { relativePath: "Tilesets.json", source: "snapshot" },
      ]);
      const cell = await inspectWorkspaceMap({
        workspaceRoot,
        mapId: 1,
        source: "generated",
        selector: { kind: "cell", x: 2, y: 1 },
      });
      expect(cell.cell).toMatchObject({ x: 2, y: 1, regionId: 22 });
      expect(cell.dataInputs).toEqual(generated.dataInputs);
      expect(await readWorkspaceFiles(workspaceRoot)).toEqual(before);
      const generatedPath = join(stateDirectory, "generated-project-data", "Map001.json");
      await writeFile(generatedPath, `${await readFile(generatedPath, "utf8")} `);
      for (const selector of [area, { kind: "cell", x: 0, y: 0 } as const]) {
        await expect(
          inspectWorkspaceMap({ workspaceRoot, mapId: 1, source: "generated", selector }),
        ).rejects.toThrow(/integrity check failed/u);
      }
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("reports unavailable tile flags explicitly instead of inventing zero flags", async () => {
    const { workspaceRoot } = await createMapWorkspace();
    try {
      const map = mapFixture();
      map.data[0] = 8192;
      await writeFile(
        join(workspaceRoot, ".rpgmaker-event-dsl", "project-data-snapshot", "Map001.json"),
        JSON.stringify(map),
      );
      await expect(
        inspectWorkspaceMap({
          workspaceRoot,
          mapId: 1,
          selector: { kind: "cell", x: 0, y: 0 },
        }),
      ).rejects.toThrow(/Tileset 1.*flags.*tile 8192.*clone or pull/u);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });
});
