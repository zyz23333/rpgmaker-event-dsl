import { execFile } from "node:child_process";
import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

import { createMapWorkspace } from "./map-observation-fixture.js";

const execFileAsync = promisify(execFile);
const cliPath = fileURLToPath(new URL("../src/cli.ts", import.meta.url));
const loader = import.meta.resolve("tsx");

describe("map CLI", () => {
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
