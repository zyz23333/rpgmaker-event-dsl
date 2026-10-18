import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  inspectWorkspaceMap,
  listWorkspaceMaps,
  renderWorkspaceMap,
} from "../src/workspace-api.js";
import { createMapWorkspace, readWorkspaceFiles } from "./map-observation-fixture.js";

describe("Map Observation required-data validation", () => {
  it("preserves null holes while selecting valid nonconsecutive map and event identities", async () => {
    const { workspaceRoot } = await createMapWorkspace();
    try {
      const snapshot = join(workspaceRoot, ".rpgmaker-event-dsl", "project-data-snapshot");
      const map = JSON.parse(await readFile(join(snapshot, "Map001.json"), "utf8"));
      map.events = [null, null, null, { ...map.events[1], id: 3 }];
      await writeFile(join(snapshot, "Map004.json"), JSON.stringify(map));
      await writeFile(
        join(snapshot, "MapInfos.json"),
        JSON.stringify([
          null,
          { id: 1, name: "Town", parentId: 0 },
          null,
          null,
          { id: 4, name: "Town", parentId: 1 },
        ]),
      );
      const before = await readWorkspaceFiles(workspaceRoot);
      expect((await listWorkspaceMaps({ workspaceRoot })).maps).toEqual([
        { id: 1, name: "Town", parentId: 0 },
        { id: 4, name: "Town", parentId: 1 },
      ]);
      expect((await inspectWorkspaceMap({ workspaceRoot, mapId: 4 })).events).toEqual([
        { id: 3, name: "Entrance", x: 2, y: 1 },
      ]);
      await expect(
        inspectWorkspaceMap({ workspaceRoot, mapId: 4, selector: { kind: "event", eventId: 3 } }),
      ).resolves.toMatchObject({ event: { id: 3 } });
      const preview = await renderWorkspaceMap({
        workspaceRoot,
        mapId: 4,
        eventPages: [{ eventId: 3, page: 1 }],
        grid: false,
        events: false,
      });
      expect(preview.previewPages).toEqual([{ eventId: 3, page: 1 }]);
      const after = await readWorkspaceFiles(workspaceRoot);
      for (const [path, content] of Object.entries(before)) expect(after[path]).toBe(content);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it.each([
    { scrollType: 0, allowMissingAssets: false },
    { scrollType: 0, allowMissingAssets: true },
    { scrollType: 1, allowMissingAssets: false },
    { scrollType: 1, allowMissingAssets: true },
    { scrollType: 3, allowMissingAssets: false },
    { scrollType: 3, allowMissingAssets: true },
  ])(
    "rejects unavailable A2 table-neighbor flags outside a crop (scroll=$scrollType, placeholders=$allowMissingAssets)",
    async ({ scrollType, allowMissingAssets }) => {
      const { workspaceRoot } = await createMapWorkspace();
      try {
        const snapshot = join(workspaceRoot, ".rpgmaker-event-dsl", "project-data-snapshot");
        const mapPath = join(snapshot, "Map001.json");
        const map = JSON.parse(await readFile(mapPath, "utf8"));
        map.scrollType = scrollType;
        const cropY = scrollType === 0 ? 1 : 0;
        const aboveY = cropY === 1 ? 0 : 1;
        map.data[6 + aboveY * 3] = 2816;
        await writeFile(mapPath, JSON.stringify(map));
        const tilesetPath = join(snapshot, "Tilesets.json");
        const tilesets = JSON.parse(await readFile(tilesetPath, "utf8"));
        tilesets[1].flags = [0];
        await writeFile(tilesetPath, JSON.stringify(tilesets));
        const before = await readWorkspaceFiles(workspaceRoot);
        await expect(
          renderWorkspaceMap({
            workspaceRoot,
            mapId: 1,
            crop: { x: 0, y: cropY, width: 1, height: 1 },
            grid: false,
            events: false,
            allowMissingAssets,
          }),
        ).rejects.toThrow(/Tileset flags.*required tile ID 2816/u);
        expect(await readWorkspaceFiles(workspaceRoot)).toEqual(before);
      } finally {
        await rm(workspaceRoot, { recursive: true, force: true });
      }
    },
  );

  it("rejects MapInfos IDs that differ from their native MV array slots before listing or resolving a Selected Map", async () => {
    const { workspaceRoot } = await createMapWorkspace();
    try {
      const path = join(
        workspaceRoot,
        ".rpgmaker-event-dsl",
        "project-data-snapshot",
        "MapInfos.json",
      );
      const maps = JSON.parse(await readFile(path, "utf8"));
      maps[1].id = 99;
      await writeFile(path, JSON.stringify(maps));
      const before = await readWorkspaceFiles(workspaceRoot);
      const error = /Malformed MapInfos.json.*map ID 99.*slot 1/u;
      await expect(listWorkspaceMaps({ workspaceRoot })).rejects.toThrow(error);
      await expect(inspectWorkspaceMap({ workspaceRoot, mapId: 1 })).rejects.toThrow(error);
      await expect(renderWorkspaceMap({ workspaceRoot, mapId: 99 })).rejects.toThrow(error);
      expect(await readWorkspaceFiles(workspaceRoot)).toEqual(before);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("rejects a declared event ID that differs from its native MV array slot before inspection or Preview Page selection", async () => {
    const { workspaceRoot } = await createMapWorkspace();
    try {
      const path = join(
        workspaceRoot,
        ".rpgmaker-event-dsl",
        "project-data-snapshot",
        "Map001.json",
      );
      const map = JSON.parse(await readFile(path, "utf8"));
      map.events[1].id = 99;
      await writeFile(path, JSON.stringify(map));
      const before = await readWorkspaceFiles(workspaceRoot);
      const error = /Malformed map 1.*event.*99.*slot 1/u;
      await expect(inspectWorkspaceMap({ workspaceRoot, mapId: 1 })).rejects.toThrow(error);
      await expect(
        inspectWorkspaceMap({ workspaceRoot, mapId: 1, selector: { kind: "event", eventId: 99 } }),
      ).rejects.toThrow(error);
      await expect(
        renderWorkspaceMap({ workspaceRoot, mapId: 1, eventPages: [{ eventId: 99, page: 1 }] }),
      ).rejects.toThrow(error);
      expect(await readWorkspaceFiles(workspaceRoot)).toEqual(before);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });
});
