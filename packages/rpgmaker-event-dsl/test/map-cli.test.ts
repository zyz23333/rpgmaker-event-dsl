import { execFile } from "node:child_process";
import { appendFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

import { compileMapWorkspace, createMapWorkspace } from "./map-observation-fixture.js";

const execFileAsync = promisify(execFile);
const cliPath = fileURLToPath(new URL("../src/cli.ts", import.meta.url));
const loader = import.meta.resolve("tsx");

describe("map CLI", () => {
  it("selects generated content and rejects altered output with empty JSON stdout", async () => {
    const { workspaceRoot } = await createMapWorkspace();
    try {
      await compileMapWorkspace(workspaceRoot);
      const args = [
        "--import",
        loader,
        cliPath,
        "map",
        "inspect",
        "--map",
        "1",
        "--source",
        "generated",
        "--json",
      ];
      const result = await execFileAsync(process.execPath, args, { cwd: workspaceRoot });
      expect(JSON.parse(result.stdout)).toMatchObject({
        kind: "map-summary",
        source: "generated",
        map: { id: 1 },
        events: [{ id: 2, name: "Generated Entrance", x: 0, y: 0 }],
      });
      await appendFile(
        join(workspaceRoot, ".rpgmaker-event-dsl", "generated-project-data", "Map001.json"),
        " ",
      );
      await expect(
        execFileAsync(process.execPath, args, { cwd: workspaceRoot }),
      ).rejects.toMatchObject({
        stdout: "",
        stderr: expect.stringContaining("Generated Project Data integrity check failed"),
      });
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("rejects missing map selection and unknown source options", async () => {
    await expect(
      execFileAsync(process.execPath, ["--import", loader, cliPath, "map", "inspect", "--json"]),
    ).rejects.toMatchObject({
      stderr: expect.stringContaining("required option '--map <id>' not specified"),
      stdout: "",
    });
    await expect(
      execFileAsync(process.execPath, [
        "--import",
        loader,
        cliPath,
        "map",
        "list",
        "--source",
        "project",
        "--json",
      ]),
    ).rejects.toMatchObject({
      stderr: expect.stringContaining("Allowed choices are snapshot, generated"),
      stdout: "",
    });
  });

  it("prints clean versioned JSON and readable map summaries from a Workspace", async () => {
    const { workspaceRoot } = await createMapWorkspace();
    try {
      const list = await execFileAsync(
        process.execPath,
        ["--import", loader, cliPath, "map", "list", "--json"],
        { cwd: workspaceRoot },
      );
      expect(JSON.parse(list.stdout)).toMatchObject({
        schemaVersion: 1,
        kind: "map-list",
        source: "snapshot",
        maps: [{ id: 1 }, { id: 2 }],
      });
      const summary = await execFileAsync(
        process.execPath,
        ["--import", loader, cliPath, "map", "inspect", "--map", "1", "--json"],
        { cwd: workspaceRoot },
      );
      expect(JSON.parse(summary.stdout)).toMatchObject({
        schemaVersion: 1,
        kind: "map-summary",
        map: { id: 1 },
        width: 3,
        height: 2,
      });
      const human = await execFileAsync(
        process.execPath,
        ["--import", loader, cliPath, "map", "inspect", "--map", "1"],
        { cwd: workspaceRoot },
      );
      expect(human.stdout).toContain("Map 1: Town (snapshot)");
      expect(human.stdout).toContain("3 x 2 cells");
      expect(human.stdout).toContain("Entrance");
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });
});
