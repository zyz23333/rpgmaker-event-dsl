import { appendFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { inspectWorkspaceMap, listWorkspaceMaps } from "../src/workspace-api.js";
import {
  compileMapWorkspace,
  createMapWorkspace,
  readWorkspaceFiles,
} from "./map-observation-fixture.js";

describe("generated Map Inspection", () => {
  it("observes compiled event replacement with snapshot map-directory and tileset provenance", async () => {
    const { workspaceRoot } = await createMapWorkspace();
    try {
      await compileMapWorkspace(workspaceRoot);
      const before = await readWorkspaceFiles(workspaceRoot);
      const list = await listWorkspaceMaps({ workspaceRoot, source: "generated" });
      expect(list).toMatchObject({
        kind: "map-list",
        source: "generated",
        maps: [
          { id: 1, name: "Town" },
          { id: 2, name: "Town" },
        ],
      });
      expect(list.dataInputs.map(({ source, relativePath }) => ({ source, relativePath }))).toEqual(
        [{ source: "snapshot", relativePath: "MapInfos.json" }],
      );
      const result = await inspectWorkspaceMap({ workspaceRoot, source: "generated", mapId: 1 });
      expect(result).toMatchObject({
        kind: "map-summary",
        source: "generated",
        map: { id: 1, name: "Town" },
        tileset: { id: 1, name: "Outside" },
      });
      expect(result.events).toEqual([{ id: 2, name: "Generated Entrance", x: 0, y: 0 }]);
      expect(
        result.dataInputs.map(({ source, relativePath }) => ({ source, relativePath })),
      ).toEqual([
        { source: "snapshot", relativePath: "MapInfos.json" },
        { source: "generated", relativePath: "Map001.json" },
        { source: "snapshot", relativePath: "Tilesets.json" },
      ]);
      const snapshot = await inspectWorkspaceMap({ workspaceRoot, mapId: 1 });
      expect(snapshot.events).toEqual([{ id: 1, name: "Entrance", x: 2, y: 1 }]);
      expect(result.dataInputs[1]?.hash).not.toBe(snapshot.dataInputs[1]?.hash);
      expect(
        (await inspectWorkspaceMap({ workspaceRoot, source: "generated", mapId: 2 })).events,
      ).toEqual([]);
      expect(await readWorkspaceFiles(workspaceRoot)).toEqual(before);
    } finally {
      await rm(workspaceRoot, { force: true, recursive: true });
    }
  });

  it("requires generated state for both listing and summary without implicit compilation", async () => {
    const { workspaceRoot } = await createMapWorkspace();
    try {
      const before = await readWorkspaceFiles(workspaceRoot);
      await expect(listWorkspaceMaps({ workspaceRoot, source: "generated" })).rejects.toThrow(
        /Generated Project Data.*Run compile first/u,
      );
      await expect(
        inspectWorkspaceMap({ workspaceRoot, source: "generated", mapId: 1 }),
      ).rejects.toThrow(/Generated Project Data.*Run compile first/u);
      expect(await readWorkspaceFiles(workspaceRoot)).toEqual(before);
    } finally {
      await rm(workspaceRoot, { force: true, recursive: true });
    }
  });

  it.each([
    "missing directory",
    "missing map",
    "altered map",
    "altered System",
    "altered CommonEvents",
    "changed Definition Source",
    "changed snapshot",
    "changed config",
    "pending Interrupted Push",
    "missing snapshot",
  ])("rejects %s for every generated observation without mutating state", async (damage) => {
    const { workspaceRoot } = await createMapWorkspace();
    const state = join(workspaceRoot, ".rpgmaker-event-dsl");
    const generated = join(state, "generated-project-data");
    try {
      await compileMapWorkspace(workspaceRoot);
      if (damage === "missing directory") await rm(generated, { recursive: true });
      if (damage === "missing map") await rm(join(generated, "Map001.json"));
      if (damage === "altered map") await appendFile(join(generated, "Map001.json"), " ");
      if (damage === "altered System") await appendFile(join(generated, "System.json"), " ");
      if (damage === "altered CommonEvents")
        await appendFile(join(generated, "CommonEvents.json"), " ");
      if (damage === "changed Definition Source") {
        await appendFile(
          join(workspaceRoot, "src", "entrance.events.ts"),
          "\nthrow new Error('observation must not evaluate Definition Source');\n",
        );
      }
      if (damage === "changed snapshot")
        await appendFile(join(state, "project-data-snapshot", "Tilesets.json"), " ");
      if (damage === "missing snapshot")
        await rm(join(state, "project-data-snapshot", "Tilesets.json"));
      if (damage === "changed config") {
        const path = join(workspaceRoot, "rpgmaker-event-dsl.config.json");
        const config = JSON.parse(await readFile(path, "utf8"));
        await writeFile(path, JSON.stringify({ ...config, scriptEnabled: true }));
      }
      if (damage === "pending Interrupted Push") {
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
      const message =
        damage === "pending Interrupted Push"
          ? /Interrupted Push.*Run push/u
          : damage === "missing snapshot"
            ? /Snapshot input.*Run clone or pull.*compile/u
            : damage.startsWith("changed")
              ? /stale.*Run compile first/u
              : /Generated Project Data.*Run compile first/u;
      await expect(listWorkspaceMaps({ workspaceRoot, source: "generated" })).rejects.toThrow(
        message,
      );
      await expect(
        inspectWorkspaceMap({ workspaceRoot, source: "generated", mapId: 1 }),
      ).rejects.toThrow(message);
      expect(await readWorkspaceFiles(workspaceRoot)).toEqual(before);
    } finally {
      await rm(workspaceRoot, { force: true, recursive: true });
    }
  });
});
