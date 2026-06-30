import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  cloneWorkspace,
  compileWorkspace,
  decompileWorkspace,
  diffWorkspace,
  isGeneratedProjectDataFresh,
  pullWorkspace,
  pushWorkspace,
} from "../src/workflow.js";
import { getWorkspaceStatePaths, hashUtf8Content, readSyncManifest } from "../src/state.js";
import { discoverDefinitionFiles, loadDefinitionFile } from "../src/definitions.js";

function createProjectRootFixture(workspaceRoot: string): string {
  return join(workspaceRoot, "Game");
}

async function writeWorkspaceConfig(
  workspaceRoot: string,
  overrides?: {
    scriptEnabled?: boolean;
    sourceInclude?: string[];
    sourceExclude?: string[];
  },
): Promise<void> {
  await writeFile(
    join(workspaceRoot, "rpgmaker-event-dsl.config.json"),
    JSON.stringify({
      projectRoot: "./Game",
      scriptEnabled: overrides?.scriptEnabled ?? false,
      sourceRoot: "src",
      sourceInclude: overrides?.sourceInclude ?? ["**/*.events.ts", "**/*.dsl.ts"],
      sourceExclude: overrides?.sourceExclude ?? ["**/*.test.ts", "**/*.spec.ts", "**/*.d.ts"],
    }),
    "utf8",
  );
}

async function writeProjectFixture(
  projectRoot: string,
  overrides?: {
    mapInfoName?: string;
    secondMap?: boolean;
    extraMapFile?: boolean;
    includeMissingMap?: boolean;
  },
): Promise<void> {
  const dataDirectory = join(projectRoot, "data");

  await mkdir(dataDirectory, { recursive: true });
  await writeFile(join(projectRoot, "Game.rpgproject"), "", "utf8");

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
    JSON.stringify([
      null,
      { id: 1, name: overrides?.mapInfoName ?? "MAP001", parentId: 0 },
      ...(overrides?.secondMap === true ? [{ id: 2, name: "MAP002", parentId: 0 }] : []),
    ]),
    "utf8",
  );
  await writeFile(join(dataDirectory, "Skills.json"), "[]", "utf8");
  await writeFile(join(dataDirectory, "States.json"), "[]", "utf8");
  await writeFile(
    join(dataDirectory, "System.json"),
    JSON.stringify({
      gameTitle: "Fixture Game",
      switches: ["", "Switch One", "Snapshot Only Switch"],
      variables: ["", "Variable One", "Snapshot Only Variable"],
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

  if (overrides?.secondMap === true) {
    await writeFile(
      join(dataDirectory, "Map002.json"),
      JSON.stringify({ id: 2, events: [null, { id: 1, name: "Snapshot Only" }], note: "keep" }),
      "utf8",
    );
  }

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
    const workspaceRoot = await mkdtemp(join(tmpdir(), "rpgmaker-event-dsl-clone-"));
    const projectRoot = createProjectRootFixture(workspaceRoot);

    await writeProjectFixture(projectRoot, { extraMapFile: true });
    await writeWorkspaceConfig(workspaceRoot);

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
    const workspaceRoot = await mkdtemp(join(tmpdir(), "rpgmaker-event-dsl-clone-missing-"));
    const projectRoot = createProjectRootFixture(workspaceRoot);

    await writeProjectFixture(projectRoot, { includeMissingMap: true });
    await writeWorkspaceConfig(workspaceRoot);

    await expect(cloneWorkspace({ workspaceRoot })).rejects.toThrow("Map002.json");
  });

  it("refreshes the snapshot on pull without touching non-standard project files", async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), "rpgmaker-event-dsl-pull-"));
    const projectRoot = createProjectRootFixture(workspaceRoot);

    await writeProjectFixture(projectRoot);
    await writeWorkspaceConfig(workspaceRoot);

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

describe("decompile workflow", () => {
  it("fails when no Project Data Snapshot exists", async () => {
    const workspaceRoot = await mkdtemp(
      join(tmpdir(), "rpgmaker-event-dsl-decompile-no-snapshot-"),
    );
    const projectRoot = createProjectRootFixture(workspaceRoot);

    await writeProjectFixture(projectRoot);
    await writeWorkspaceConfig(workspaceRoot);

    await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(
      "Project Data Snapshot is required before decompile",
    );
  });

  it("writes the fixed source layout with explicit Entry Identity and raw command fallback", async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), "rpgmaker-event-dsl-decompile-"));
    const projectRoot = createProjectRootFixture(workspaceRoot);

    await writeProjectFixture(projectRoot, { secondMap: true });
    await writeWorkspaceConfig(workspaceRoot);
    await writeDslPackageTypes(workspaceRoot);
    await writeFile(
      join(projectRoot, "data", "Map001.json"),
      JSON.stringify({
        id: 1,
        events: [
          null,
          {
            id: 1,
            name: "Gate",
            x: 4,
            y: 5,
            pages: [
              {
                conditions: {
                  switch1Id: 1,
                  switch1Valid: true,
                },
                list: [
                  { code: 101, indent: 0, parameters: ["", 0, 0, 2] },
                  { code: 401, indent: 0, parameters: ["Hello"] },
                  { code: 250, indent: 0, parameters: [{ name: "Bell", volume: 90 }] },
                  { code: 0, indent: 0, parameters: [] },
                ],
                trigger: 0,
              },
            ],
          },
        ],
      }),
      "utf8",
    );
    await writeFile(
      join(projectRoot, "data", "CommonEvents.json"),
      JSON.stringify([
        null,
        {
          id: 1,
          list: [
            { code: 117, indent: 0, parameters: [1] },
            { code: 0, indent: 0, parameters: [] },
          ],
          name: "Common",
          switchId: 1,
          trigger: 2,
        },
      ]),
      "utf8",
    );
    await writeFile(
      join(projectRoot, "data", "System.json"),
      JSON.stringify({
        gameTitle: "Fixture Game",
        switches: ["", "Switch One", ""],
        variables: ["", "", "Variable Two"],
      }),
      "utf8",
    );
    await cloneWorkspace({ workspaceRoot });

    await decompileWorkspace({ workspaceRoot });

    const mapSource = await readFile(
      join(workspaceRoot, "src", "decompiled", "maps", "Map001.events.ts"),
      "utf8",
    );
    const secondMapSource = await readFile(
      join(workspaceRoot, "src", "decompiled", "maps", "Map002.events.ts"),
      "utf8",
    );
    const commonEventsSource = await readFile(
      join(workspaceRoot, "src", "decompiled", "common-events.events.ts"),
      "utf8",
    );
    const systemSource = await readFile(
      join(workspaceRoot, "src", "decompiled", "system.dsl.ts"),
      "utf8",
    );

    expect(mapSource).toContain("mapId: 1");
    expect(mapSource).toContain("id: 1");
    expect(mapSource).toContain('name: "Gate"');
    expect(mapSource).toContain('showText(["Hello"])');
    expect(mapSource).toContain("rawDslCommand({");
    expect(mapSource).toContain("code: 250");
    expect(secondMapSource).toContain("mapId: 2");
    expect(secondMapSource).toContain("id: 1");
    expect(secondMapSource).toContain('name: "Snapshot Only"');
    expect(commonEventsSource).toContain("id: 1");
    expect(commonEventsSource).toContain('trigger: "parallel"');
    expect(commonEventsSource).toContain("callCommonEvent(commonEventRef({ id: 1 }))");
    expect(systemSource).toContain("switchDefinition({");
    expect(systemSource).toContain("id: 1");
    expect(systemSource).toContain('name: "Switch One"');
    expect(systemSource).toContain("variableDefinition({");
    expect(systemSource).toContain("id: 2");
    expect(systemSource).toContain('name: "Variable Two"');
    expect(systemSource).not.toContain("id: 0");

    const discoveredFiles = await discoverDefinitionFiles(workspaceRoot, {
      sourceRoot: "src",
      sourceInclude: ["**/*.events.ts", "**/*.dsl.ts"],
      sourceExclude: ["**/*.test.ts", "**/*.spec.ts", "**/*.d.ts"],
    });
    expect(discoveredFiles).toEqual([
      join(workspaceRoot, "src", "decompiled", "common-events.events.ts"),
      join(workspaceRoot, "src", "decompiled", "maps", "Map001.events.ts"),
      join(workspaceRoot, "src", "decompiled", "maps", "Map002.events.ts"),
      join(workspaceRoot, "src", "decompiled", "system.dsl.ts"),
    ]);

    const declarations = (
      await Promise.all(discoveredFiles.map((file) => loadDefinitionFile(file)))
    ).flat();
    expect(declarations.map((declaration) => declaration.kind)).toEqual([
      "commonEvent",
      "mapEvent",
      "mapEvent",
      "switchDefinition",
      "variableDefinition",
    ]);
  });

  it("preflights all target files and fails before writing when any output exists", async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), "rpgmaker-event-dsl-decompile-existing-"));
    const projectRoot = createProjectRootFixture(workspaceRoot);

    await writeProjectFixture(projectRoot, { secondMap: true });
    await writeWorkspaceConfig(workspaceRoot);
    await cloneWorkspace({ workspaceRoot });
    await mkdir(join(workspaceRoot, "src", "decompiled", "maps"), { recursive: true });
    await writeFile(
      join(workspaceRoot, "src", "decompiled", "common-events.events.ts"),
      "export const userOwned = true;\n",
      "utf8",
    );

    await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(
      "Decompile output already exists",
    );

    await expect(
      readFile(join(workspaceRoot, "src", "decompiled", "maps", "Map001.events.ts"), "utf8"),
    ).rejects.toThrow();
    await expect(
      readFile(join(workspaceRoot, "src", "decompiled", "maps", "Map002.events.ts"), "utf8"),
    ).rejects.toThrow();
    await expect(
      readFile(join(workspaceRoot, "src", "decompiled", "system.dsl.ts"), "utf8"),
    ).rejects.toThrow();
    expect(
      await readFile(join(workspaceRoot, "src", "decompiled", "common-events.events.ts"), "utf8"),
    ).toBe("export const userOwned = true;\n");
  });
});

describe("compile --check workflow", () => {
  it("fails before source evaluation when no Project Data Snapshot exists", async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), "rpgmaker-event-dsl-check-no-snapshot-"));
    const projectRoot = createProjectRootFixture(workspaceRoot);

    await writeProjectFixture(projectRoot);
    await writeWorkspaceConfig(workspaceRoot);
    await mkdir(join(workspaceRoot, "src"), { recursive: true });
    await writeFile(join(workspaceRoot, "src", "invalid.events.ts"), "export default 1;\n", "utf8");

    await expect(compileWorkspace({ workspaceRoot, check: true })).rejects.toThrow(
      "Project Data Snapshot is required before compile --check",
    );
  });

  it("discovers configured DSL declaration files and validates same-run references", async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), "rpgmaker-event-dsl-check-valid-"));
    const projectRoot = createProjectRootFixture(workspaceRoot);

    await writeProjectFixture(projectRoot);
    await writeWorkspaceConfig(workspaceRoot, {
      sourceInclude: ["owned/**/*.dsl.ts"],
    });
    await cloneWorkspace({ workspaceRoot });
    await mkdir(join(workspaceRoot, "src", "owned"), { recursive: true });
    await writeFile(
      join(workspaceRoot, "src", "ignored.events.ts"),
      `export const duplicate = {
  kind: "commonEvent",
  id: 1,
  name: "Ignored",
  trigger: "none",
  commands: [],
};
`,
      "utf8",
    );
    await writeFile(
      join(workspaceRoot, "src", "owned", "events.dsl.ts"),
      `export const alarm = {
  kind: "commonEvent",
  id: 1,
  name: "Alarm",
  trigger: "none",
  commands: [],
};

export const gate = {
  kind: "mapEvent",
  mapId: 1,
  id: 1,
  name: "Gate",
  x: 1,
  y: 2,
  pages: [
    {
      conditions: {},
      trigger: "action",
      commands: [{ kind: "commonEvent", ref: { kind: "commonEvent", name: "Alarm" } }],
    },
  ],
};
`,
      "utf8",
    );

    await expect(compileWorkspace({ workspaceRoot, check: true })).resolves.toBeUndefined();
  });

  it("rejects duplicate Entry Identity", async () => {
    const workspaceRoot = await createClonedWorkspaceWithSource(
      `export const first = {
  kind: "commonEvent",
  id: 1,
  name: "First",
  trigger: "none",
  commands: [],
};

export const second = {
  kind: "commonEvent",
  id: 1,
  name: "Second",
  trigger: "none",
  commands: [],
};
`,
    );

    await expect(compileWorkspace({ workspaceRoot, check: true })).rejects.toThrow(
      "Duplicate Common Event id: 1.",
    );
  });

  it("rejects ambiguous name references", async () => {
    const workspaceRoot = await createClonedWorkspaceWithSource(
      `export const first = {
  kind: "commonEvent",
  id: 1,
  name: "Shared",
  trigger: "none",
  commands: [],
};

export const second = {
  kind: "commonEvent",
  id: 2,
  name: "Shared",
  trigger: "none",
  commands: [],
};

export const caller = {
  kind: "mapEvent",
  mapId: 1,
  id: 1,
  name: "Caller",
  x: 0,
  y: 0,
  pages: [
    {
      conditions: {},
      trigger: "action",
      commands: [{ kind: "commonEvent", ref: { kind: "commonEvent", name: "Shared" } }],
    },
  ],
};
`,
    );

    await expect(compileWorkspace({ workspaceRoot, check: true })).rejects.toThrow(
      "Ambiguous commonEvent reference: Shared",
    );
  });

  it("rejects missing Explicit ID References", async () => {
    const workspaceRoot = await createClonedWorkspaceWithSource(
      `export const caller = {
  kind: "mapEvent",
  mapId: 1,
  id: 1,
  name: "Caller",
  x: 0,
  y: 0,
  pages: [
    {
      conditions: {},
      trigger: "action",
      commands: [{ kind: "commonEvent", ref: { kind: "commonEvent", id: 99 } }],
    },
  ],
};
`,
    );

    await expect(compileWorkspace({ workspaceRoot, check: true })).rejects.toThrow(
      "Unknown commonEvent reference id: 99",
    );
  });

  it("enforces Script Command Gate", async () => {
    const workspaceRoot = await createClonedWorkspaceWithSource(
      `export const gate = {
  kind: "mapEvent",
  mapId: 1,
  id: 1,
  name: "Gate",
  x: 0,
  y: 0,
  pages: [
    {
      conditions: {},
      trigger: "action",
      commands: [{ kind: "script", code: ["console.log(1);"] }],
    },
  ],
};
`,
    );

    await expect(compileWorkspace({ workspaceRoot, check: true })).rejects.toThrow(
      "Script commands require explicit config enablement.",
    );
  });

  it("does not write Generated Project Data or update manifest freshness metadata", async () => {
    const workspaceRoot = await createClonedWorkspaceWithSource(
      `export const gate = {
  kind: "mapEvent",
  mapId: 1,
  id: 1,
  name: "Gate",
  x: 0,
  y: 0,
  pages: [
    {
      conditions: {},
      trigger: "action",
      commands: [],
    },
  ],
};
`,
    );
    const statePaths = getWorkspaceStatePaths(workspaceRoot);
    const manifestBefore = await readFile(statePaths.syncManifestPath, "utf8");

    await compileWorkspace({ workspaceRoot, check: true });

    expect(await readFile(statePaths.syncManifestPath, "utf8")).toBe(manifestBefore);
    expect((await readdir(statePaths.workspaceStateDirectory)).sort()).toEqual([
      "project-data-snapshot",
      "sync-manifest.json",
    ]);
  });
});

describe("compile workflow", () => {
  it("fails before source evaluation when no Project Data Snapshot exists", async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), "rpgmaker-event-dsl-compile-no-snapshot-"));
    const projectRoot = createProjectRootFixture(workspaceRoot);

    await writeProjectFixture(projectRoot);
    await writeWorkspaceConfig(workspaceRoot);
    await mkdir(join(workspaceRoot, "src"), { recursive: true });
    await writeFile(join(workspaceRoot, "src", "invalid.events.ts"), "export default 1;\n", "utf8");

    await expect(compileWorkspace({ workspaceRoot, check: false })).rejects.toThrow(
      "Project Data Snapshot is required before compile",
    );
  });

  it("writes complete Generated Project Data carriers without mutating Project Root or snapshot", async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), "rpgmaker-event-dsl-compile-"));
    const projectRoot = createProjectRootFixture(workspaceRoot);

    await writeProjectFixture(projectRoot, { secondMap: true });
    await writeWorkspaceConfig(workspaceRoot);
    await cloneWorkspace({ workspaceRoot });
    await mkdir(join(workspaceRoot, "src"), { recursive: true });
    await writeFile(
      join(workspaceRoot, "src", "events.events.ts"),
      `export const gateSwitch = {
  kind: "switchDefinition",
  id: 1,
  name: "Gate Open",
};

export const visitCount = {
  kind: "variableDefinition",
  id: 3,
  name: "Visit Count",
};

export const alarm = {
  kind: "commonEvent",
  id: 2,
  name: "Alarm",
  trigger: "parallel",
  switch: { kind: "switch", id: 1 },
  commands: [{ kind: "showText", lines: ["Alarm"] }],
};

export const gate = {
  kind: "mapEvent",
  mapId: 1,
  id: 2,
  name: "Gate",
  x: 4,
  y: 5,
  pages: [
    {
      conditions: {},
      trigger: "action",
      commands: [{ kind: "commonEvent", ref: { kind: "commonEvent", id: 2 } }],
    },
  ],
};
`,
      "utf8",
    );

    const statePaths = getWorkspaceStatePaths(workspaceRoot);
    const projectMapBefore = await readFile(join(projectRoot, "data", "Map001.json"), "utf8");
    const snapshotMapBefore = await readFile(
      join(statePaths.projectDataSnapshotDirectory, "Map001.json"),
      "utf8",
    );

    await compileWorkspace({ workspaceRoot, check: false });

    expect(await readFile(join(projectRoot, "data", "Map001.json"), "utf8")).toBe(projectMapBefore);
    expect(
      await readFile(join(statePaths.projectDataSnapshotDirectory, "Map001.json"), "utf8"),
    ).toBe(snapshotMapBefore);

    const generatedMap001 = JSON.parse(
      await readFile(join(statePaths.generatedProjectDataDirectory, "Map001.json"), "utf8"),
    );
    const generatedMap002 = JSON.parse(
      await readFile(join(statePaths.generatedProjectDataDirectory, "Map002.json"), "utf8"),
    );
    const generatedCommonEvents = JSON.parse(
      await readFile(join(statePaths.generatedProjectDataDirectory, "CommonEvents.json"), "utf8"),
    );
    const generatedSystem = JSON.parse(
      await readFile(join(statePaths.generatedProjectDataDirectory, "System.json"), "utf8"),
    );

    expect(generatedMap001.events).toHaveLength(3);
    expect(generatedMap001.events[0]).toBeNull();
    expect(generatedMap001.events[1]).toBeNull();
    expect(generatedMap001.events[2]).toMatchObject({
      id: 2,
      name: "Gate",
      x: 4,
      y: 5,
    });
    expect(generatedMap001.events[2].pages[0].list).toContainEqual({
      code: 117,
      indent: 0,
      parameters: [2],
    });
    expect(generatedMap002).toEqual({
      events: [null, null],
      id: 2,
      note: "keep",
    });
    expect(generatedCommonEvents).toHaveLength(3);
    expect(generatedCommonEvents[0]).toBeNull();
    expect(generatedCommonEvents[1]).toBeNull();
    expect(generatedCommonEvents[2]).toMatchObject({
      id: 2,
      name: "Alarm",
      switchId: 1,
      trigger: 2,
    });
    expect(generatedSystem).toMatchObject({
      gameTitle: "Fixture Game",
      switches: ["", "Gate Open", ""],
      variables: ["", "", "", "Visit Count"],
    });
  });

  it("records generated output hashes and Compile Baseline freshness metadata", async () => {
    const workspaceRoot = await createClonedWorkspaceWithSource(
      `export const gate = {
  kind: "mapEvent",
  mapId: 1,
  id: 1,
  name: "Gate",
  x: 0,
  y: 0,
  pages: [
    {
      conditions: {},
      trigger: "action",
      commands: [],
    },
  ],
};
`,
    );
    const statePaths = getWorkspaceStatePaths(workspaceRoot);

    await compileWorkspace({ workspaceRoot, check: false });

    const manifest = await readSyncManifest(statePaths.syncManifestPath);
    expect(manifest?.generatedFiles?.map((entry) => entry.relativePath)).toEqual([
      "CommonEvents.json",
      "Map001.json",
      "System.json",
    ]);
    expect(manifest?.generatedFiles?.every((entry) => /^[0-9a-f]{64}$/u.test(entry.hash))).toBe(
      true,
    );
    expect(manifest?.compileBaseline?.hash).toMatch(/^[0-9a-f]{64}$/u);
    expect(manifest?.compileBaseline?.config).toEqual({
      scriptEnabled: false,
      sourceExclude: ["**/*.test.ts", "**/*.spec.ts", "**/*.d.ts"],
      sourceInclude: ["**/*.events.ts", "**/*.dsl.ts"],
      sourceRoot: "src",
    });
    expect(manifest?.compileBaseline?.sourceFiles).toEqual([
      {
        hash: expect.stringMatching(/^[0-9a-f]{64}$/u),
        relativePath: "src/events.events.ts",
      },
    ]);
    expect(manifest?.compileBaseline?.snapshotFiles.map((entry) => entry.relativePath)).toContain(
      "Map001.json",
    );
    await expect(isGeneratedProjectDataFresh({ workspaceRoot })).resolves.toBe(true);

    await writeFile(
      join(workspaceRoot, "src", "events.events.ts"),
      `export const gate = {
  kind: "mapEvent",
  mapId: 1,
  id: 1,
  name: "Changed Gate",
  x: 0,
  y: 0,
  pages: [
    {
      conditions: {},
      trigger: "action",
      commands: [],
    },
  ],
};
`,
      "utf8",
    );
    await expect(isGeneratedProjectDataFresh({ workspaceRoot })).resolves.toBe(false);

    await compileWorkspace({ workspaceRoot, check: false });
    await expect(isGeneratedProjectDataFresh({ workspaceRoot })).resolves.toBe(true);

    await writeWorkspaceConfig(workspaceRoot, { scriptEnabled: true });
    await expect(isGeneratedProjectDataFresh({ workspaceRoot })).resolves.toBe(false);

    await writeWorkspaceConfig(workspaceRoot);
    await compileWorkspace({ workspaceRoot, check: false });
    await expect(isGeneratedProjectDataFresh({ workspaceRoot })).resolves.toBe(true);

    await writeFile(
      join(statePaths.projectDataSnapshotDirectory, "Map001.json"),
      JSON.stringify({ id: 1, events: [null, { id: 1, name: "Snapshot Changed" }] }),
      "utf8",
    );
    await expect(isGeneratedProjectDataFresh({ workspaceRoot })).resolves.toBe(false);
  });
});

describe("diff workflow", () => {
  it("fails when Generated Project Data is missing", async () => {
    const workspaceRoot = await createClonedWorkspaceWithSource(
      `export const gate = {
  kind: "mapEvent",
  mapId: 1,
  id: 1,
  name: "Gate",
  x: 0,
  y: 0,
  pages: [
    {
      conditions: {},
      trigger: "action",
      commands: [],
    },
  ],
};
`,
    );

    await expect(diffWorkspace({ workspaceRoot })).rejects.toThrow(
      "Generated Project Data is required before diff. Run compile first.",
    );
  });

  it("fails when Generated Project Data is stale", async () => {
    const workspaceRoot = await createClonedWorkspaceWithSource(
      `export const gate = {
  kind: "mapEvent",
  mapId: 1,
  id: 1,
  name: "Gate",
  x: 0,
  y: 0,
  pages: [
    {
      conditions: {},
      trigger: "action",
      commands: [],
    },
  ],
};
`,
    );

    await compileWorkspace({ workspaceRoot, check: false });
    await writeFile(
      join(workspaceRoot, "src", "events.events.ts"),
      `export const gate = {
  kind: "mapEvent",
  mapId: 1,
  id: 1,
  name: "Changed Gate",
  x: 0,
  y: 0,
  pages: [
    {
      conditions: {},
      trigger: "action",
      commands: [],
    },
  ],
};
`,
      "utf8",
    );

    await expect(diffWorkspace({ workspaceRoot })).rejects.toThrow(
      "Generated Project Data is stale before diff. Run compile first.",
    );
  });

  it("compares Generated Project Data with the Project Data Snapshot without reading Project Root", async () => {
    const workspaceRoot = await createClonedWorkspaceWithSource(
      `export const gate = {
  kind: "mapEvent",
  mapId: 1,
  id: 1,
  name: "Gate",
  x: 0,
  y: 0,
  pages: [
    {
      conditions: {},
      trigger: "action",
      commands: [],
    },
  ],
};

export const gateSwitch = {
  kind: "switchDefinition",
  id: 1,
  name: "Gate Open",
};
`,
    );
    const projectRoot = createProjectRootFixture(workspaceRoot);

    await compileWorkspace({ workspaceRoot, check: false });
    await writeFile(join(projectRoot, "data", "Map001.json"), "{not-json", "utf8");

    const output = await diffWorkspace({ workspaceRoot });

    expect(output).toContain("Structured Diff Report");
    expect(output).toContain("Map Event");
    expect(output).toContain(
      "- [generated-only] mapId 1, eventId 1: Entry exists only in Generated Project Data.",
    );
    expect(output).toContain("Switch");
    expect(output).toContain(
      "- [changed] switchId 1: Generated entry differs from snapshot entry.",
    );
    expect(output).toContain(
      "- [snapshot-only] switchId 2 (destructive): Entry exists only in Project Data Snapshot.",
    );
    expect(output).toContain("Affected Project Data Files:");
    expect(output).toContain("- Map001.json");
    expect(output).toContain("- System.json");
    expect(output).toContain("Destructive Changes: yes");
  });

  it("renders a short Diff summary with Affected Project Data Files", async () => {
    const workspaceRoot = await createClonedWorkspaceWithSource(
      `export const gate = {
  kind: "mapEvent",
  mapId: 1,
  id: 1,
  name: "Gate",
  x: 0,
  y: 0,
  pages: [
    {
      conditions: {},
      trigger: "action",
      commands: [],
    },
  ],
};

export const gateSwitch = {
  kind: "switchDefinition",
  id: 1,
  name: "Gate Open",
};
`,
    );

    await compileWorkspace({ workspaceRoot, check: false });

    const output = await diffWorkspace({ workspaceRoot, short: true });

    expect(output).toContain("Structured Diff Summary");
    expect(output).toContain("Map Event: 1 generated-only");
    expect(output).toContain("Switch: 1 changed, 1 snapshot-only");
    expect(output).toContain("Affected Project Data Files:");
    expect(output).toContain("- Map001.json");
    expect(output).toContain("- System.json");
    expect(output).not.toContain("Entry exists only in Generated Project Data.");
    expect(output).toContain("Destructive Changes: yes");
  });

  it("filters Diff output by Project Data File", async () => {
    const workspaceRoot = await createClonedWorkspaceWithSource(
      `export const gate = {
  kind: "mapEvent",
  mapId: 1,
  id: 1,
  name: "Gate",
  x: 0,
  y: 0,
  pages: [
    {
      conditions: {},
      trigger: "action",
      commands: [],
    },
  ],
};

export const gateSwitch = {
  kind: "switchDefinition",
  id: 1,
  name: "Gate Open",
};
`,
    );

    await compileWorkspace({ workspaceRoot, check: false });

    const output = await diffWorkspace({ workspaceRoot, file: "Map001.json" });

    expect(output).toContain("Filter: Project Data File Map001.json");
    expect(output).toContain("Map Event");
    expect(output).toContain(
      "- [generated-only] mapId 1, eventId 1: Entry exists only in Generated Project Data.",
    );
    expect(output).not.toContain("Switch");
    expect(output).toContain("Affected Project Data Files:");
    expect(output).toContain("- Map001.json");
    expect(output).toContain("- System.json");
    expect(output).toContain("Destructive Changes In Filter: no");
    expect(output).toContain("Destructive Changes Overall: yes");
  });

  it("renders an empty filtered Diff for a known Project Data File with no changes", async () => {
    const workspaceRoot = await createClonedWorkspaceWithSource(
      `export const gateSwitch = {
  kind: "switchDefinition",
  id: 1,
  name: "Gate Open",
};
`,
    );

    await compileWorkspace({ workspaceRoot, check: false });

    const output = await diffWorkspace({ workspaceRoot, file: "Map001.json" });

    expect(output).toContain("Filter: Project Data File Map001.json");
    expect(output).toContain("No changes for selected Project Data File.");
    expect(output).toContain("Affected Project Data Files:");
    expect(output).toContain("- System.json");
    expect(output).toContain("Destructive Changes In Filter: no");
    expect(output).toContain("Destructive Changes Overall: yes");
  });

  it("rejects unknown or unsafe Diff file filters", async () => {
    const workspaceRoot = await createClonedWorkspaceWithSource(
      `export const gate = {
  kind: "mapEvent",
  mapId: 1,
  id: 1,
  name: "Gate",
  x: 0,
  y: 0,
  pages: [
    {
      conditions: {},
      trigger: "action",
      commands: [],
    },
  ],
};
`,
    );

    await compileWorkspace({ workspaceRoot, check: false });

    await expect(diffWorkspace({ workspaceRoot, file: "PluginData.json" })).rejects.toThrow(
      "Unknown or unsafe Project Data File for diff --file: PluginData.json.",
    );
    await expect(diffWorkspace({ workspaceRoot, file: "../System.json" })).rejects.toThrow(
      "Unknown or unsafe Project Data File for diff --file: ../System.json.",
    );
  });
});

describe("push workflow", () => {
  it("fails when Generated Project Data is missing", async () => {
    const workspaceRoot = await createClonedWorkspaceWithSource(buildCompleteCoverageSource());

    await expect(pushWorkspace({ workspaceRoot, allowDestructive: false })).rejects.toThrow(
      "Generated Project Data is required before push. Run compile first.",
    );
  });

  it("fails when Generated Project Data is stale", async () => {
    const workspaceRoot = await createClonedWorkspaceWithSource(buildCompleteCoverageSource());

    await compileWorkspace({ workspaceRoot, check: false });
    await writeFile(
      join(workspaceRoot, "src", "events.events.ts"),
      buildCompleteCoverageSource({
        mapEventName: "Changed Gate",
      }),
      "utf8",
    );

    await expect(pushWorkspace({ workspaceRoot, allowDestructive: false })).rejects.toThrow(
      "Generated Project Data is stale before push. Run compile first.",
    );
  });

  it("fails when Generated Project Data hashes do not match the Sync Manifest", async () => {
    const workspaceRoot = await createClonedWorkspaceWithSource(buildCompleteCoverageSource());
    const statePaths = getWorkspaceStatePaths(workspaceRoot);

    await compileWorkspace({ workspaceRoot, check: false });
    await writeFile(
      join(statePaths.generatedProjectDataDirectory, "Map001.json"),
      JSON.stringify({ id: 1, events: [null] }),
      "utf8",
    );

    await expect(pushWorkspace({ workspaceRoot, allowDestructive: false })).rejects.toThrow(
      "Generated Project Data integrity check failed before push. Run compile first.",
    );
  });

  it("reports Project Drift when an affected Project Root file is missing", async () => {
    const workspaceRoot = await createClonedWorkspaceWithSource(buildCompleteCoverageSource());
    const projectRoot = createProjectRootFixture(workspaceRoot);
    const statePaths = getWorkspaceStatePaths(workspaceRoot);

    await compileWorkspace({ workspaceRoot, check: false });
    const manifestBefore = await readFile(statePaths.syncManifestPath, "utf8");
    await rm(join(projectRoot, "data", "Map001.json"), { force: true });

    await expect(pushWorkspace({ workspaceRoot, allowDestructive: false })).rejects.toThrow(
      "Project Drift detected before push for Map001.json. Run pull first.",
    );
    expect(await readFile(statePaths.syncManifestPath, "utf8")).toBe(manifestBefore);
  });

  it("checks Project Drift only for affected Project Data files", async () => {
    const workspaceRoot = await createClonedWorkspaceWithSource(buildCompleteCoverageSource());
    const projectRoot = createProjectRootFixture(workspaceRoot);

    await compileWorkspace({ workspaceRoot, check: false });
    await writeFile(
      join(projectRoot, "data", "Actors.json"),
      JSON.stringify([null, { id: 1, name: "Edited Hero" }]),
      "utf8",
    );
    await writeFile(
      join(projectRoot, "data", "PluginData.json"),
      JSON.stringify({ edited: true }),
      "utf8",
    );

    await expect(
      pushWorkspace({ workspaceRoot, allowDestructive: false }),
    ).resolves.toBeUndefined();

    await writeFile(
      join(workspaceRoot, "src", "events.events.ts"),
      buildCompleteCoverageSource({
        mapEventName: "Changed Gate",
      }),
      "utf8",
    );
    await compileWorkspace({ workspaceRoot, check: false });
    await writeFile(
      join(projectRoot, "data", "Map001.json"),
      JSON.stringify({ id: 1, events: [null, { id: 1, name: "Editor Drift" }] }),
      "utf8",
    );

    await expect(pushWorkspace({ workspaceRoot, allowDestructive: false })).rejects.toThrow(
      "Project Drift detected before push for Map001.json. Run pull first.",
    );
  });

  it("rejects destructive changes unless explicitly allowed", async () => {
    const workspaceRoot = await createClonedWorkspaceWithSource(
      buildCompleteCoverageSource({
        includeSnapshotOnlySwitch: false,
        includeSnapshotOnlyVariable: false,
      }),
    );
    const statePaths = getWorkspaceStatePaths(workspaceRoot);
    const projectRoot = createProjectRootFixture(workspaceRoot);
    const projectSystemBefore = await readFile(join(projectRoot, "data", "System.json"), "utf8");
    const snapshotSystemBefore = await readFile(
      join(statePaths.projectDataSnapshotDirectory, "System.json"),
      "utf8",
    );

    await compileWorkspace({ workspaceRoot, check: false });

    await expect(pushWorkspace({ workspaceRoot, allowDestructive: false })).rejects.toThrow(
      "Destructive Changes detected before push. Re-run with --allow-destructive after review.",
    );
    expect(await readFile(join(projectRoot, "data", "System.json"), "utf8")).toBe(
      projectSystemBefore,
    );
    expect(
      await readFile(join(statePaths.projectDataSnapshotDirectory, "System.json"), "utf8"),
    ).toBe(snapshotSystemBefore);

    await expect(pushWorkspace({ workspaceRoot, allowDestructive: true })).resolves.toBeUndefined();

    const pushedSystem = JSON.parse(
      await readFile(join(projectRoot, "data", "System.json"), "utf8"),
    );
    expect(pushedSystem.switches).toEqual(["", "Switch One", ""]);
    expect(pushedSystem.variables).toEqual(["", "Variable One", ""]);
  });

  it("writes affected Project Root data and refreshes affected Snapshot and Manifest", async () => {
    const workspaceRoot = await createClonedWorkspaceWithSource(buildCompleteCoverageSource());
    const projectRoot = createProjectRootFixture(workspaceRoot);
    const statePaths = getWorkspaceStatePaths(workspaceRoot);
    const projectMapBefore = await readFile(join(projectRoot, "data", "Map001.json"), "utf8");

    await compileWorkspace({ workspaceRoot, check: false });
    const manifestBefore = await readSyncManifest(statePaths.syncManifestPath);

    await pushWorkspace({ workspaceRoot, allowDestructive: false });

    const generatedMap = await readFile(
      join(statePaths.generatedProjectDataDirectory, "Map001.json"),
      "utf8",
    );
    const projectMap = await readFile(join(projectRoot, "data", "Map001.json"), "utf8");
    const snapshotMap = await readFile(
      join(statePaths.projectDataSnapshotDirectory, "Map001.json"),
      "utf8",
    );
    const manifestAfter = await readSyncManifest(statePaths.syncManifestPath);

    expect(projectMapBefore).not.toBe(projectMap);
    expect(projectMap).toBe(generatedMap);
    expect(snapshotMap).toBe(generatedMap);
    expect(manifestAfter?.snapshotFiles).toContainEqual(
      manifestAfter?.generatedFiles?.find((entry) => entry.relativePath === "Map001.json"),
    );
    expect(manifestAfter?.compileBaseline).not.toEqual(manifestBefore?.compileBaseline);
    await expect(isGeneratedProjectDataFresh({ workspaceRoot })).resolves.toBe(true);
  });

  it("stops non-Push commands when an Interrupted Push is pending", async () => {
    const workspaceRoot = await createClonedWorkspaceWithSource(buildCompleteCoverageSource());

    await compileWorkspace({ workspaceRoot, check: false });
    await writePendingPushFixture(workspaceRoot);

    await expect(compileWorkspace({ workspaceRoot, check: true })).rejects.toThrow(
      "Interrupted Push is pending before compile --check. Run push to resolve it",
    );
    await expect(diffWorkspace({ workspaceRoot })).rejects.toThrow(
      "Interrupted Push is pending before diff. Run push to resolve it",
    );
    await expect(pullWorkspace({ workspaceRoot })).rejects.toThrow(
      "Interrupted Push is pending before pull. Run push to resolve it",
    );
    await expect(isGeneratedProjectDataFresh({ workspaceRoot })).rejects.toThrow(
      "Interrupted Push is pending before isGeneratedProjectDataFresh. Run push to resolve it",
    );
  });

  it("completes an all-generated Interrupted Push during push", async () => {
    const workspaceRoot = await createClonedWorkspaceWithSource(buildCompleteCoverageSource());
    const projectRoot = createProjectRootFixture(workspaceRoot);
    const statePaths = getWorkspaceStatePaths(workspaceRoot);

    await compileWorkspace({ workspaceRoot, check: false });
    await writePendingPushFixture(workspaceRoot);
    await writeFile(
      join(projectRoot, "data", "Map001.json"),
      await readFile(join(statePaths.generatedProjectDataDirectory, "Map001.json"), "utf8"),
      "utf8",
    );

    await pushWorkspace({ workspaceRoot, allowDestructive: false });

    await expect(readFile(statePaths.pendingPushManifestPath, "utf8")).rejects.toThrow();
    await expect(readFile(statePaths.pendingPushBackupDirectory, "utf8")).rejects.toThrow();
    expect(
      await readFile(join(statePaths.projectDataSnapshotDirectory, "Map001.json"), "utf8"),
    ).toBe(await readFile(join(statePaths.generatedProjectDataDirectory, "Map001.json"), "utf8"));
    await expect(isGeneratedProjectDataFresh({ workspaceRoot })).resolves.toBe(true);
  });

  it("abandons an all-snapshot Interrupted Push and continues normal push", async () => {
    const workspaceRoot = await createClonedWorkspaceWithSource(buildCompleteCoverageSource());
    const projectRoot = createProjectRootFixture(workspaceRoot);
    const statePaths = getWorkspaceStatePaths(workspaceRoot);

    await compileWorkspace({ workspaceRoot, check: false });
    await writePendingPushFixture(workspaceRoot);

    await pushWorkspace({ workspaceRoot, allowDestructive: false });

    await expect(readFile(statePaths.pendingPushManifestPath, "utf8")).rejects.toThrow();
    expect(await readFile(join(projectRoot, "data", "Map001.json"), "utf8")).toBe(
      await readFile(join(statePaths.generatedProjectDataDirectory, "Map001.json"), "utf8"),
    );
  });

  it("stops push for mixed or missing Interrupted Push file states", async () => {
    const workspaceRoot = await createClonedWorkspaceWithSource(
      buildCompleteCoverageSource({ includeSnapshotOnlySwitch: false }),
    );
    const projectRoot = createProjectRootFixture(workspaceRoot);
    const statePaths = getWorkspaceStatePaths(workspaceRoot);

    await compileWorkspace({ workspaceRoot, check: false });
    await writePendingPushFixture(workspaceRoot, ["Map001.json", "System.json"]);
    await writeFile(
      join(projectRoot, "data", "Map001.json"),
      await readFile(join(statePaths.generatedProjectDataDirectory, "Map001.json"), "utf8"),
      "utf8",
    );
    await rm(join(projectRoot, "data", "System.json"), { force: true });

    await expect(pushWorkspace({ workspaceRoot, allowDestructive: false })).rejects.toThrow(
      [
        "Interrupted Push cannot be recovered automatically.",
        "Restore affected Project Root files to either the pending backup state or Generated Project Data, then run push again.",
        "- Map001.json: generated",
        "- System.json: missing",
      ].join("\n"),
    );
  });
});

async function createClonedWorkspaceWithSource(sourceText: string): Promise<string> {
  const workspaceRoot = await mkdtemp(join(tmpdir(), "rpgmaker-event-dsl-check-"));
  const projectRoot = createProjectRootFixture(workspaceRoot);

  await writeProjectFixture(projectRoot);
  await writeWorkspaceConfig(workspaceRoot);
  await cloneWorkspace({ workspaceRoot });
  await mkdir(join(workspaceRoot, "src"), { recursive: true });
  await writeFile(join(workspaceRoot, "src", "events.events.ts"), sourceText, "utf8");

  return workspaceRoot;
}

async function writeDslPackageTypes(workspaceRoot: string): Promise<void> {
  const packageRoot = join(workspaceRoot, "node_modules", "rpgmaker-event-dsl");
  await mkdir(packageRoot, { recursive: true });
  await writeFile(
    join(packageRoot, "package.json"),
    JSON.stringify({
      name: "rpgmaker-event-dsl",
      type: "module",
      types: "./index.d.ts",
      exports: {
        ".": {
          types: "./index.d.ts",
          default: "./index.js",
        },
      },
    }),
    "utf8",
  );
  await writeFile(
    join(packageRoot, "index.d.ts"),
    `export declare function actorRef(value: { id: number } | { name: string }): unknown;
export declare function callCommonEvent(value: unknown): unknown;
export declare function comment(lines: readonly [string, ...string[]]): unknown;
export declare function commonEvent(input: {
  id: number;
  name: string;
  trigger: "none" | "autorun" | "parallel";
  switch?: unknown;
  commands: readonly unknown[];
}): { kind: "commonEvent"; id: number; name: string; trigger: string; commands: readonly unknown[] };
export declare function commonEventRef(value: { id: number } | { name: string }): unknown;
export declare function itemRef(value: { id: number } | { name: string }): unknown;
export declare function mapEvent(input: {
  mapId: number;
  id: number;
  name: string;
  x: number;
  y: number;
  pages: readonly unknown[];
}): { kind: "mapEvent"; mapId: number; id: number; name: string; x: number; y: number; pages: readonly unknown[] };
export declare function page(input: {
  conditions?: Record<string, unknown>;
  trigger?: string;
  commands: readonly unknown[];
}): unknown;
export declare function rawDslCommand(input: {
  code: number;
  indent?: number;
  parameters: readonly unknown[];
}): unknown;
export declare function showText(lines: readonly [string, ...string[]]): unknown;
export declare function switchDefinition(input: { id: number; name: string }): { kind: "switchDefinition"; id: number; name: string };
export declare function switchRef(value: { id: number } | { name: string }): unknown;
export declare function variableDefinition(input: { id: number; name: string }): { kind: "variableDefinition"; id: number; name: string };
export declare function variableRef(value: { id: number } | { name: string }): unknown;
`,
    "utf8",
  );
}

async function writePendingPushFixture(
  workspaceRoot: string,
  affectedFiles: readonly string[] = ["Map001.json"],
): Promise<void> {
  const statePaths = getWorkspaceStatePaths(workspaceRoot);
  const entries = [];

  await rm(statePaths.pendingPushDirectory, { force: true, recursive: true });
  await mkdir(statePaths.pendingPushBackupDirectory, { recursive: true });

  for (const relativePath of affectedFiles) {
    const snapshotPath = join(statePaths.projectDataSnapshotDirectory, relativePath);
    const generatedPath = join(statePaths.generatedProjectDataDirectory, relativePath);
    const backupPath = join(statePaths.pendingPushBackupDirectory, relativePath);
    const snapshotContent = await readFile(snapshotPath, "utf8");

    await mkdir(dirname(backupPath), { recursive: true });
    await writeFile(backupPath, snapshotContent, "utf8");
    entries.push({
      backupHash: hashUtf8Content(snapshotContent),
      backupRelativePath: relativePath,
      generatedHash: hashUtf8Content(await readFile(generatedPath, "utf8")),
      relativePath,
      snapshotHash: hashUtf8Content(snapshotContent),
    });
  }

  await writeFile(
    statePaths.pendingPushManifestPath,
    JSON.stringify({
      affectedFiles: entries,
      startedAt: "2026-06-30T00:00:00.000Z",
      version: 1,
    }),
    "utf8",
  );
}

function buildCompleteCoverageSource(overrides?: {
  includeSnapshotOnlySwitch?: boolean;
  includeSnapshotOnlyVariable?: boolean;
  mapEventName?: string;
}): string {
  return `export const switchOne = {
  kind: "switchDefinition",
  id: 1,
  name: "Switch One",
};

${
  overrides?.includeSnapshotOnlySwitch === false
    ? ""
    : `export const snapshotOnlySwitch = {
  kind: "switchDefinition",
  id: 2,
  name: "Snapshot Only Switch",
};
`
}
export const variableOne = {
  kind: "variableDefinition",
  id: 1,
  name: "Variable One",
};

${
  overrides?.includeSnapshotOnlyVariable === false
    ? ""
    : `export const snapshotOnlyVariable = {
  kind: "variableDefinition",
  id: 2,
  name: "Snapshot Only Variable",
};
`
}
export const common = {
  kind: "commonEvent",
  id: 1,
  name: "Common",
  trigger: "none",
  commands: [],
};

export const gate = {
  kind: "mapEvent",
  mapId: 1,
  id: 1,
  name: "${overrides?.mapEventName ?? "Gate"}",
  x: 0,
  y: 0,
  pages: [
    {
      conditions: {},
      trigger: "action",
      commands: [],
    },
  ],
};
`;
}
