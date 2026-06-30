import { mkdir, mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  defaultSourceExclude,
  defaultSourceInclude,
  defaultSourceRoot,
  initWorkspace,
  loadWorkspace,
} from "../src/workspace.js";

describe("loadWorkspace", () => {
  it("loads a workspace config and resolves the project root relative to the workspace root", async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), "rpgmaker-event-dsl-workspace-"));
    const projectRoot = join(workspaceRoot, "..", "MyGame");
    const dataDirectory = join(projectRoot, "data");

    await writeFile(
      join(workspaceRoot, "rpgmaker-event-dsl.config.json"),
      JSON.stringify({
        projectRoot: "../MyGame",
        scriptEnabled: false,
        sourceRoot: "src",
        sourceInclude: ["**/*.events.ts", "**/*.dsl.ts"],
        sourceExclude: ["**/*.test.ts", "**/*.spec.ts", "**/*.d.ts"],
      }),
      "utf8",
    );
    await mkdir(projectRoot, { recursive: true });
    await writeFile(join(projectRoot, "Game.rpgproject"), "", "utf8");
    await mkdir(dataDirectory, { recursive: true });

    const workspace = await loadWorkspace(workspaceRoot);

    expect(workspace.workspaceRoot).toBe(workspaceRoot);
    expect(workspace.projectRoot).toBe(projectRoot);
    expect(workspace.dataDirectory).toBe(dataDirectory);
    expect(workspace.config.projectRoot).toBe("../MyGame");
    expect(workspace.config.scriptEnabled).toBe(false);
    expect(workspace.config.sourceRoot).toBe("src");
    expect(workspace.config.sourceInclude).toEqual(["**/*.events.ts", "**/*.dsl.ts"]);
    expect(workspace.config.sourceExclude).toEqual(["**/*.test.ts", "**/*.spec.ts", "**/*.d.ts"]);
  });

  it("rejects configs that still include removed legacy workflow fields", async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), "rpgmaker-event-dsl-workspace-legacy-"));
    const projectRoot = join(workspaceRoot, "..", "MyGame-legacy");
    const dataDirectory = join(projectRoot, "data");

    await writeFile(
      join(workspaceRoot, "rpgmaker-event-dsl.config.json"),
      JSON.stringify({
        projectRoot: "../MyGame-legacy",
        scriptEnabled: false,
        sourceRoot: "src",
        sourceInclude: ["**/*.events.ts", "**/*.dsl.ts"],
        sourceExclude: ["**/*.test.ts", "**/*.spec.ts", "**/*.d.ts"],
        legacyWorkflow: true,
      }),
      "utf8",
    );
    await mkdir(projectRoot, { recursive: true });
    await writeFile(join(projectRoot, "Game.rpgproject"), "", "utf8");
    await mkdir(dataDirectory, { recursive: true });

    await expect(loadWorkspace(workspaceRoot)).rejects.toThrow("Unrecognized key");
  });

  it("rejects a project root without an RPG Maker project marker", async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), "rpgmaker-event-dsl-workspace-marker-"));
    const projectRoot = join(workspaceRoot, "..", "MyGame-missing-marker");

    await writeFile(
      join(workspaceRoot, "rpgmaker-event-dsl.config.json"),
      JSON.stringify({
        projectRoot: "../MyGame-missing-marker",
        scriptEnabled: false,
        sourceRoot: "src",
        sourceInclude: ["**/*.events.ts", "**/*.dsl.ts"],
        sourceExclude: ["**/*.test.ts", "**/*.spec.ts", "**/*.d.ts"],
      }),
      "utf8",
    );
    await mkdir(join(projectRoot, "data"), { recursive: true });

    await expect(loadWorkspace(workspaceRoot)).rejects.toThrow("to contain a *.rpgproject file");
  });
});

describe("initWorkspace", () => {
  it("creates the workspace structure and writes a workspace config", async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), "rpgmaker-event-dsl-init-"));
    const projectRoot = join(workspaceRoot, "..", "MyGame-init");
    const dataDirectory = join(projectRoot, "data");

    await mkdir(projectRoot, { recursive: true });
    await writeFile(join(projectRoot, "Game.rpgproject"), "", "utf8");
    await mkdir(dataDirectory, { recursive: true });

    const result = await initWorkspace({
      workspaceRoot,
      projectRoot: "../MyGame-init",
    });

    const srcStat = await stat(join(workspaceRoot, "src"));
    const configStat = await stat(join(workspaceRoot, "rpgmaker-event-dsl.config.json"));

    expect(srcStat.isDirectory()).toBe(true);
    expect(configStat.isFile()).toBe(true);
    expect(result.workspaceRoot).toBe(workspaceRoot);
    expect(result.projectRoot).toBe(projectRoot);
    expect(result.dataDirectory).toBe(dataDirectory);
    expect(result.config).toEqual({
      projectRoot: "../MyGame-init",
      scriptEnabled: false,
      sourceRoot: defaultSourceRoot,
      sourceInclude: [...defaultSourceInclude],
      sourceExclude: [...defaultSourceExclude],
    });
    await expect(
      readFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8").then((content) =>
        JSON.parse(content),
      ),
    ).resolves.toEqual(result.config);
  });
});
