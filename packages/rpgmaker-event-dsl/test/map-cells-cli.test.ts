import { execFile } from "node:child_process";
import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

import { compileMapWorkspace, createMapWorkspace } from "./map-observation-fixture.js";

const execFileAsync = promisify(execFile);
const cliPath = fileURLToPath(new URL("../src/cli.ts", import.meta.url));
const loader = import.meta.resolve("tsx");
const inspectArgs = ["--import", loader, cliPath, "map", "inspect", "--map", "1"];

describe("Map Cell and area CLI selectors", () => {
  it("prints targeted versioned cell/area results and readable numeric tile information", async () => {
    const { workspaceRoot } = await createMapWorkspace();
    try {
      const cell = await execFileAsync(
        process.execPath,
        [...inspectArgs, "--cell", "2,1", "--json"],
        {
          cwd: workspaceRoot,
        },
      );
      expect(JSON.parse(cell.stdout)).toMatchObject({
        schemaVersion: 1,
        kind: "map-cell",
        source: "snapshot",
        cell: { x: 2, y: 1, regionId: 0, terrainTag: 0 },
      });
      const area = await execFileAsync(
        process.execPath,
        [...inspectArgs, "--area", "1,0,2,2", "--json"],
        { cwd: workspaceRoot },
      );
      expect(JSON.parse(area.stdout)).toMatchObject({
        kind: "map-area",
        bounds: { x: 1, y: 0, width: 2, height: 2 },
        cells: [
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 1, y: 1 },
          { x: 2, y: 1 },
        ],
        events: [{ id: 1, name: "Entrance", x: 2, y: 1 }],
      });
      const human = await execFileAsync(process.execPath, [...inspectArgs, "--cell", "2,1"], {
        cwd: workspaceRoot,
      });
      expect(human.stdout).toContain("Cell (2, 1)");
      expect(human.stdout).toContain("Region ID: 0; Terrain Tag: 0");
      expect(human.stdout).toContain("passageBlocked");
      await compileMapWorkspace(workspaceRoot);
      const generated = await execFileAsync(
        process.execPath,
        [...inspectArgs, "--area", "0,0,3,2", "--source", "generated", "--json"],
        { cwd: workspaceRoot },
      );
      expect(JSON.parse(generated.stdout)).toMatchObject({
        kind: "map-area",
        source: "generated",
        bounds: { x: 0, y: 0, width: 3, height: 2 },
        events: [{ id: 2, name: "Generated Entrance", x: 0, y: 0 }],
      });
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("rejects incompatible selectors and malformed coordinate tuples with empty JSON stdout", async () => {
    const { workspaceRoot } = await createMapWorkspace();
    try {
      for (const [args, message] of [
        [["--cell", "0,0", "--area", "0,0,1,1"], "mutually exclusive"],
        [["--cell", "1,0,2"], "Invalid --cell"],
        [["--area", "0,0,1"], "Invalid --area"],
        [["--cell", "1.2,0"], "Invalid --cell"],
        [["--cell", "0,"], "Invalid --cell"],
      ] as const) {
        await expect(
          execFileAsync(process.execPath, [...inspectArgs, ...args, "--json"], {
            cwd: workspaceRoot,
          }),
        ).rejects.toMatchObject({ stdout: "", stderr: expect.stringContaining(message) });
      }
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });
});
