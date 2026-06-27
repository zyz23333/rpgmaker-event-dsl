import { mkdir, mkdtemp, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { initWorkspace, loadWorkspace } from "../src/workspace.js";

describe("loadWorkspace", () => {
  it("loads a workspace config and resolves the project root relative to the workspace root", async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), "rmmv-event-dsl-workspace-"));
    const projectRoot = join(workspaceRoot, "..", "MyGame");
    const dataDirectory = join(projectRoot, "data");

    await writeFile(
      join(workspaceRoot, "rmmv-event-dsl.config.json"),
      JSON.stringify({
        projectRoot: "../MyGame",
        scriptEnabled: false,
        definitionTargets: [],
      }),
      "utf8",
    );
    await mkdir(projectRoot, { recursive: true });
    await writeFile(join(projectRoot, ".rpgproject"), "", "utf8");
    await mkdir(dataDirectory, { recursive: true });

    const workspace = await loadWorkspace(workspaceRoot);

    expect(workspace.workspaceRoot).toBe(workspaceRoot);
    expect(workspace.projectRoot).toBe(projectRoot);
    expect(workspace.dataDirectory).toBe(dataDirectory);
    expect(workspace.config.projectRoot).toBe("../MyGame");
    expect(workspace.config.scriptEnabled).toBe(false);
    expect(workspace.config.definitionTargets).toEqual([]);
  });

  it("rejects duplicate definition targets", async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), "rmmv-event-dsl-workspace-dup-"));
    const projectRoot = join(workspaceRoot, "..", "MyGame-dup");
    const dataDirectory = join(projectRoot, "data");

    await writeFile(
      join(workspaceRoot, "rmmv-event-dsl.config.json"),
      JSON.stringify({
        projectRoot: "../MyGame-dup",
        scriptEnabled: false,
        definitionTargets: [
          { src: "events/a.ts", target: { type: "map", mapId: 1 } },
          { src: "events/a.ts", target: { type: "map", mapId: 2 } },
        ],
      }),
      "utf8",
    );
    await mkdir(projectRoot, { recursive: true });
    await writeFile(join(projectRoot, ".rpgproject"), "", "utf8");
    await mkdir(dataDirectory, { recursive: true });

    await expect(loadWorkspace(workspaceRoot)).rejects.toThrow("Duplicate definition source");
  });
});

describe("initWorkspace", () => {
  it("creates the workspace structure and writes a workspace config", async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), "rmmv-event-dsl-init-"));
    const projectRoot = join(workspaceRoot, "..", "MyGame-init");
    const dataDirectory = join(projectRoot, "data");

    await mkdir(projectRoot, { recursive: true });
    await writeFile(join(projectRoot, ".rpgproject"), "", "utf8");
    await mkdir(dataDirectory, { recursive: true });

    const result = await initWorkspace({
      workspaceRoot,
      projectRoot: "../MyGame-init",
    });

    const srcStat = await stat(join(workspaceRoot, "src"));
    const configStat = await stat(join(workspaceRoot, "rmmv-event-dsl.config.json"));

    expect(srcStat.isDirectory()).toBe(true);
    expect(configStat.isFile()).toBe(true);
    expect(result.workspaceRoot).toBe(workspaceRoot);
    expect(result.projectRoot).toBe(projectRoot);
    expect(result.dataDirectory).toBe(dataDirectory);
  });
});
