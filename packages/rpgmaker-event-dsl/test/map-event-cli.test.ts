import { execFile } from "node:child_process";
import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

import { createMapWorkspace } from "./map-observation-fixture.js";

const execFileAsync = promisify(execFile);
const cliPath = fileURLToPath(new URL("../src/cli.ts", import.meta.url));
const loader = import.meta.resolve("tsx");

describe("event Map Inspection CLI", () => {
  it("selects one event and includes raw commands only when requested", async () => {
    const { workspaceRoot } = await createMapWorkspace();
    try {
      const args = ["--import", loader, cliPath, "map", "inspect", "--map", "1", "--event", "1"];
      const summary = await execFileAsync(process.execPath, [...args, "--json"], {
        cwd: workspaceRoot,
      });
      const detail = await execFileAsync(process.execPath, [...args, "--commands", "--json"], {
        cwd: workspaceRoot,
      });
      expect(JSON.parse(summary.stdout)).toMatchObject({
        kind: "map-event",
        event: { id: 1, pages: [{ page: 1, triggerName: "action" }] },
      });
      expect(JSON.parse(summary.stdout).event.pages[0]).not.toHaveProperty("commands");
      expect(JSON.parse(detail.stdout).event.pages[0].commands).toEqual([
        { code: 0, indent: 0, parameters: [] },
      ]);
      const human = await execFileAsync(process.execPath, args, { cwd: workspaceRoot });
      expect(human.stdout).toContain("Event 1: Entrance at (2, 1)");
      expect(human.stdout).toContain("Page 1: action");
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("rejects command detail without an event selector", async () => {
    await expect(
      execFileAsync(process.execPath, [
        "--import",
        loader,
        cliPath,
        "map",
        "inspect",
        "--map",
        "1",
        "--commands",
        "--json",
      ]),
    ).rejects.toMatchObject({
      stdout: "",
      stderr: expect.stringContaining("--commands requires --event"),
    });
  });
});
