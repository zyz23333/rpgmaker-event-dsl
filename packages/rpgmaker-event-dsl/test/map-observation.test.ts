import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  inspectWorkspaceMap,
  listWorkspaceMaps,
  type MapObservationSource,
} from "../src/workspace-api.js";
import { createMapWorkspace, mapFixture, readWorkspaceFiles } from "./map-observation-fixture.js";

describe("Workspace Map Inspection", () => {
  it("summarizes the Selected Map without dumping cells, pages, or commands", async () => {
    const { workspaceRoot } = await createMapWorkspace();
    try {
      const before = await readWorkspaceFiles(workspaceRoot);
      const result = await inspectWorkspaceMap({ workspaceRoot, mapId: 1 });
      expect(result).toMatchObject({
        schemaVersion: 1,
        kind: "map-summary",
        source: "snapshot",
        map: { id: 1, name: "Town", parentId: 0 },
        width: 3,
        height: 2,
        tileset: { id: 1, name: "Outside", mode: 1 },
        settings: { displayName: "Town Square", scrollType: 0, note: "Town layout" },
        events: [{ id: 1, name: "Entrance", x: 2, y: 1 }],
        warnings: [],
      });
      expect(result.dataInputs.map(({ relativePath }) => relativePath)).toEqual([
        "MapInfos.json",
        "Map001.json",
        "Tilesets.json",
      ]);
      expect(result).not.toHaveProperty("data");
      expect(result.events[0]).not.toHaveProperty("pages");
      expect(await readWorkspaceFiles(workspaceRoot)).toEqual(before);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("lists snapshot map identities and parents even when display names are duplicated", async () => {
    const { workspaceRoot, dataDirectory } = await createMapWorkspace();
    try {
      await writeFile(join(dataDirectory, "MapInfos.json"), "[null]");
      const before = await readWorkspaceFiles(workspaceRoot);
      const result = await listWorkspaceMaps({ workspaceRoot });
      expect(result).toMatchObject({
        schemaVersion: 1,
        kind: "map-list",
        source: "snapshot",
        maps: [
          { id: 1, name: "Town", parentId: 0 },
          { id: 2, name: "Town", parentId: 1 },
        ],
        warnings: [],
        dataInputs: [
          {
            source: "snapshot",
            relativePath: "MapInfos.json",
            hash: expect.stringMatching(/^[a-f0-9]{64}$/u),
          },
        ],
      });
      expect(await readWorkspaceFiles(workspaceRoot)).toEqual(before);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("requires snapshot initialization without implicitly cloning the project", async () => {
    const { workspaceRoot } = await createMapWorkspace({ clone: false });
    try {
      const before = await readWorkspaceFiles(workspaceRoot);
      await expect(listWorkspaceMaps({ workspaceRoot })).rejects.toThrow(
        /Run clone or pull first/u,
      );
      await expect(inspectWorkspaceMap({ workspaceRoot, mapId: 1 })).rejects.toThrow(
        /Run clone or pull first/u,
      );
      expect(await readWorkspaceFiles(workspaceRoot)).toEqual(before);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("rejects invalid identities and unknown sources without observing another map", async () => {
    const { workspaceRoot } = await createMapWorkspace();
    try {
      const before = await readWorkspaceFiles(workspaceRoot);
      for (const mapId of [0, -1, 1.2, Number.MAX_SAFE_INTEGER + 1]) {
        await expect(inspectWorkspaceMap({ workspaceRoot, mapId })).rejects.toThrow(
          /positive integer map ID/u,
        );
      }
      await expect(inspectWorkspaceMap({ workspaceRoot, mapId: 3 })).rejects.toThrow(
        /Map 3 does not exist/u,
      );
      await expect(
        listWorkspaceMaps({ workspaceRoot, source: "project" as MapObservationSource }),
      ).rejects.toThrow(/Unknown map source/u);
      expect(await readWorkspaceFiles(workspaceRoot)).toEqual(before);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("stops for a pending Interrupted Push without resolving synchronization state", async () => {
    const { workspaceRoot } = await createMapWorkspace();
    try {
      const pendingDirectory = join(workspaceRoot, ".rpgmaker-event-dsl", "pending-push");
      await mkdir(pendingDirectory);
      await writeFile(
        join(pendingDirectory, "pending-push.json"),
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
      const before = await readWorkspaceFiles(workspaceRoot);
      await expect(listWorkspaceMaps({ workspaceRoot })).rejects.toThrow(
        /Interrupted Push.*Run push/u,
      );
      await expect(inspectWorkspaceMap({ workspaceRoot, mapId: 1 })).rejects.toThrow(
        /Interrupted Push.*Run push/u,
      );
      expect(await readWorkspaceFiles(workspaceRoot)).toEqual(before);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("rejects damaged map and supporting data with actionable errors", async () => {
    const { workspaceRoot } = await createMapWorkspace();
    const snapshot = join(workspaceRoot, ".rpgmaker-event-dsl", "project-data-snapshot");
    try {
      const path = join(snapshot, "Map001.json");
      await writeFile(path, JSON.stringify({ ...mapFixture(), data: [0] }));
      const before = await readWorkspaceFiles(workspaceRoot);
      await expect(inspectWorkspaceMap({ workspaceRoot, mapId: 1 })).rejects.toThrow(
        /Malformed map 1.*six layers/u,
      );
      expect(await readWorkspaceFiles(workspaceRoot)).toEqual(before);
      await writeFile(path, JSON.stringify(mapFixture()));
      await rm(join(snapshot, "Tilesets.json"));
      await expect(inspectWorkspaceMap({ workspaceRoot, mapId: 1 })).rejects.toThrow(
        /Tilesets.json.*Run clone or pull/u,
      );
      await writeFile(join(snapshot, "MapInfos.json"), "[null,{}]");
      await expect(listWorkspaceMaps({ workspaceRoot })).rejects.toThrow(
        /Malformed MapInfos.json/u,
      );
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("identifies the actual snapshot bytes used instead of trusting manifest hashes", async () => {
    const { workspaceRoot } = await createMapWorkspace();
    try {
      const first = await inspectWorkspaceMap({ workspaceRoot, mapId: 1 });
      const snapshot = join(workspaceRoot, ".rpgmaker-event-dsl", "project-data-snapshot");
      const manifestPath = join(workspaceRoot, ".rpgmaker-event-dsl", "sync-manifest.json");
      const manifest = await readFile(manifestPath, "utf8");
      await writeFile(
        join(snapshot, "Map001.json"),
        JSON.stringify({ ...mapFixture(), note: "Changed captured note" }),
      );
      const second = await inspectWorkspaceMap({ workspaceRoot, mapId: 1 });
      expect(second.settings.note).toBe("Changed captured note");
      expect(second.dataInputs[1]?.hash).not.toBe(first.dataInputs[1]?.hash);
      expect(second.dataInputs[0]).toEqual(first.dataInputs[0]);
      expect(second.dataInputs[1]?.path).toBe(join(snapshot, "Map001.json"));
      expect(await readFile(manifestPath, "utf8")).toBe(manifest);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });
});
