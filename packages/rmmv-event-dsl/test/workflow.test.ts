import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { cloneWorkspace, pullWorkspace } from "../src/workflow.js";
import { getWorkspaceStatePaths, readSyncManifest } from "../src/state.js";

function createProjectRootFixture(workspaceRoot: string): string {
  return join(workspaceRoot, "Game");
}

async function writeProjectFixture(
  projectRoot: string,
  overrides?: {
    mapInfoName?: string;
    extraMapFile?: boolean;
    includeMissingMap?: boolean;
  },
): Promise<void> {
  const dataDirectory = join(projectRoot, "data");

  await mkdir(dataDirectory, { recursive: true });
  await writeFile(join(projectRoot, ".rpgproject"), "", "utf8");

  await writeFile(
    join(dataDirectory, "Actors.json"),
    JSON.stringify([null, { id: 1, name: "Hero" }]),
    "utf8",
  );
  await writeFile(join(dataDirectory, "Animations.json"), "[]", "utf8");
  await writeFile(join(dataDirectory, "Armors.json"), "[]", "utf8");
  await writeFile(join(dataDirectory, "Classes.json"), "[]", "utf8");
  await writeFile(
    join(dataDirectory, "CommonEvents.json"),
    JSON.stringify([null, { id: 1, name: "Common" }]),
    "utf8",
  );
  await writeFile(join(dataDirectory, "Enemies.json"), "[]", "utf8");
  await writeFile(
    join(dataDirectory, "Items.json"),
    JSON.stringify([null, { id: 1, name: "Potion" }]),
    "utf8",
  );
  await writeFile(
    join(dataDirectory, "MapInfos.json"),
    JSON.stringify([null, { id: 1, name: overrides?.mapInfoName ?? "MAP001", parentId: 0 }]),
    "utf8",
  );
  await writeFile(join(dataDirectory, "Skills.json"), "[]", "utf8");
  await writeFile(join(dataDirectory, "States.json"), "[]", "utf8");
  await writeFile(
    join(dataDirectory, "System.json"),
    JSON.stringify({
      switches: ["", "Switch One"],
      variables: ["", "Variable One"],
    }),
    "utf8",
  );
  await writeFile(join(dataDirectory, "Tilesets.json"), "[]", "utf8");
  await writeFile(join(dataDirectory, "Troops.json"), "[]", "utf8");
  await writeFile(join(dataDirectory, "Weapons.json"), "[]", "utf8");
  await writeFile(
    join(dataDirectory, "Map001.json"),
    JSON.stringify({ id: 1, events: [null] }),
    "utf8",
  );

  if (overrides?.extraMapFile === true) {
    await writeFile(
      join(dataDirectory, "Map999.json"),
      JSON.stringify({ id: 999, events: [null] }),
      "utf8",
    );
  }

  if (overrides?.includeMissingMap === true) {
    await writeFile(
      join(dataDirectory, "MapInfos.json"),
      JSON.stringify([
        null,
        { id: 1, name: overrides?.mapInfoName ?? "MAP001", parentId: 0 },
        { id: 2, name: "MAP002", parentId: 0 },
      ]),
      "utf8",
    );
  }
}

describe("workspace snapshot workflow", () => {
  it("clones the standard MV snapshot and writes snapshot hashes", async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), "rmmv-event-dsl-clone-"));
    const projectRoot = createProjectRootFixture(workspaceRoot);

    await writeProjectFixture(projectRoot, { extraMapFile: true });
    await writeFile(
      join(workspaceRoot, "rmmv-event-dsl.config.json"),
      JSON.stringify({
        projectRoot: "./Game",
        scriptEnabled: false,
        sourceRoot: "src",
        sourceInclude: ["**/*.events.ts", "**/*.dsl.ts"],
        sourceExclude: ["**/*.test.ts", "**/*.spec.ts", "**/*.d.ts"],
      }),
      "utf8",
    );

    await cloneWorkspace({ workspaceRoot });

    const statePaths = getWorkspaceStatePaths(workspaceRoot);
    const manifest = await readSyncManifest(statePaths.syncManifestPath);

    expect(manifest).not.toBeNull();
    expect(manifest?.snapshotFiles.map((entry) => entry.relativePath)).toEqual([
      "Actors.json",
      "Animations.json",
      "Armors.json",
      "Classes.json",
      "CommonEvents.json",
      "Enemies.json",
      "Items.json",
      "Map001.json",
      "MapInfos.json",
      "Skills.json",
      "States.json",
      "System.json",
      "Tilesets.json",
      "Troops.json",
      "Weapons.json",
    ]);
    expect(
      JSON.parse(
        await readFile(join(statePaths.projectDataSnapshotDirectory, "Map001.json"), "utf8"),
      ),
    ).toEqual({
      events: [null],
      id: 1,
    });
    expect(
      manifest?.snapshotFiles.find((entry) => entry.relativePath === "Map001.json")?.hash,
    ).toMatch(/^[0-9a-f]{64}$/u);
    await expect(
      readFile(join(statePaths.projectDataSnapshotDirectory, "Map999.json"), "utf8"),
    ).rejects.toThrow();
  });

  it("fails clone when MapInfos references a missing map file", async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), "rmmv-event-dsl-clone-missing-"));
    const projectRoot = createProjectRootFixture(workspaceRoot);

    await writeProjectFixture(projectRoot, { includeMissingMap: true });
    await writeFile(
      join(workspaceRoot, "rmmv-event-dsl.config.json"),
      JSON.stringify({
        projectRoot: "./Game",
        scriptEnabled: false,
        sourceRoot: "src",
        sourceInclude: ["**/*.events.ts", "**/*.dsl.ts"],
        sourceExclude: ["**/*.test.ts", "**/*.spec.ts", "**/*.d.ts"],
      }),
      "utf8",
    );

    await expect(cloneWorkspace({ workspaceRoot })).rejects.toThrow("Map002.json");
  });

  it("refreshes the snapshot on pull without touching non-standard project files", async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), "rmmv-event-dsl-pull-"));
    const projectRoot = createProjectRootFixture(workspaceRoot);

    await writeProjectFixture(projectRoot);
    await writeFile(
      join(workspaceRoot, "rmmv-event-dsl.config.json"),
      JSON.stringify({
        projectRoot: "./Game",
        scriptEnabled: false,
        sourceRoot: "src",
        sourceInclude: ["**/*.events.ts", "**/*.dsl.ts"],
        sourceExclude: ["**/*.test.ts", "**/*.spec.ts", "**/*.d.ts"],
      }),
      "utf8",
    );

    await cloneWorkspace({ workspaceRoot });

    await writeFile(
      join(projectRoot, "data", "Map001.json"),
      JSON.stringify({ id: 1, events: [null, { id: 1 }] }),
      "utf8",
    );
    await writeFile(
      join(projectRoot, "data", "Map999.json"),
      JSON.stringify({ id: 999, events: [] }),
      "utf8",
    );

    await pullWorkspace({ workspaceRoot });

    const statePaths = getWorkspaceStatePaths(workspaceRoot);
    expect(
      JSON.parse(
        await readFile(join(statePaths.projectDataSnapshotDirectory, "Map001.json"), "utf8"),
      ),
    ).toEqual({
      events: [null, { id: 1 }],
      id: 1,
    });
    await expect(
      readFile(join(statePaths.projectDataSnapshotDirectory, "Map999.json"), "utf8"),
    ).rejects.toThrow();
  });
});
