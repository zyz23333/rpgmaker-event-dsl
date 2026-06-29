import { mkdir, mkdtemp, readdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  cloneWorkspace,
  compileWorkspace,
  isGeneratedProjectDataFresh,
  pullWorkspace,
} from "../src/workflow.js";
import { getWorkspaceStatePaths, readSyncManifest } from "../src/state.js";

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
    join(workspaceRoot, "rmmv-event-dsl.config.json"),
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
    const workspaceRoot = await mkdtemp(join(tmpdir(), "rmmv-event-dsl-clone-"));
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
    const workspaceRoot = await mkdtemp(join(tmpdir(), "rmmv-event-dsl-clone-missing-"));
    const projectRoot = createProjectRootFixture(workspaceRoot);

    await writeProjectFixture(projectRoot, { includeMissingMap: true });
    await writeWorkspaceConfig(workspaceRoot);

    await expect(cloneWorkspace({ workspaceRoot })).rejects.toThrow("Map002.json");
  });

  it("refreshes the snapshot on pull without touching non-standard project files", async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), "rmmv-event-dsl-pull-"));
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

describe("compile --check workflow", () => {
  it("fails before source evaluation when no Project Data Snapshot exists", async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), "rmmv-event-dsl-check-no-snapshot-"));
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
    const workspaceRoot = await mkdtemp(join(tmpdir(), "rmmv-event-dsl-check-valid-"));
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
    const workspaceRoot = await mkdtemp(join(tmpdir(), "rmmv-event-dsl-compile-no-snapshot-"));
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
    const workspaceRoot = await mkdtemp(join(tmpdir(), "rmmv-event-dsl-compile-"));
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

async function createClonedWorkspaceWithSource(sourceText: string): Promise<string> {
  const workspaceRoot = await mkdtemp(join(tmpdir(), "rmmv-event-dsl-check-"));
  const projectRoot = createProjectRootFixture(workspaceRoot);

  await writeProjectFixture(projectRoot);
  await writeWorkspaceConfig(workspaceRoot);
  await cloneWorkspace({ workspaceRoot });
  await mkdir(join(workspaceRoot, "src"), { recursive: true });
  await writeFile(join(workspaceRoot, "src", "events.events.ts"), sourceText, "utf8");

  return workspaceRoot;
}
