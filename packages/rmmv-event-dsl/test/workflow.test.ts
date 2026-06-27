import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { runWorkflow } from "../src/workflow.js";

async function createWorkspaceFixture() {
  const workspaceRoot = await mkdtemp(join(tmpdir(), "rmmv-event-dsl-workflow-"));
  const projectRoot = join(workspaceRoot, "project");
  const dataDirectory = join(projectRoot, "data");
  const srcDirectory = join(workspaceRoot, "src");

  await mkdir(srcDirectory, { recursive: true });
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(join(projectRoot, ".rpgproject"), "", "utf8");
  await writeFile(
    join(workspaceRoot, "rmmv-event-dsl.config.json"),
    JSON.stringify({
      projectRoot: "project",
      scriptEnabled: false,
      definitionTargets: [{ src: "src/map.ts", target: { type: "map", mapId: 1 } }],
    }),
    "utf8",
  );
  await writeFile(
    join(dataDirectory, "MapInfos.json"),
    JSON.stringify([null, { id: 1, name: "Map001", parentId: 0 }]),
    "utf8",
  );
  await writeFile(join(dataDirectory, "CommonEvents.json"), JSON.stringify([null]), "utf8");
  await writeFile(join(dataDirectory, "Actors.json"), JSON.stringify([null]), "utf8");
  await writeFile(join(dataDirectory, "Items.json"), JSON.stringify([null]), "utf8");
  await writeFile(join(dataDirectory, "Weapons.json"), JSON.stringify([null]), "utf8");
  await writeFile(join(dataDirectory, "Armors.json"), JSON.stringify([null]), "utf8");
  await writeFile(join(dataDirectory, "Troops.json"), JSON.stringify([null]), "utf8");
  await writeFile(
    join(dataDirectory, "System.json"),
    JSON.stringify({ switches: ["", "Gate"], variables: ["", "Count"] }),
    "utf8",
  );
  await writeFile(
    join(dataDirectory, "Map001.json"),
    JSON.stringify({
      events: [null, { id: 1, name: "Old", note: "", pages: [], x: 0, y: 0 }],
      width: 17,
      height: 13,
    }),
    "utf8",
  );
  await writeFile(
    join(srcDirectory, "map.ts"),
    `export const gate = {
  kind: "mapEvent",
  name: "Gate",
  x: 1,
  y: 2,
  pages: [
    {
      conditions: {},
      trigger: "action",
      commands: [
        {
          kind: "showText",
          lines: ["Hello"],
        },
      ],
    },
  ],
};
`,
    "utf8",
  );

  return { workspaceRoot, projectRoot, dataDirectory };
}

describe("runWorkflow", () => {
  it("validates definitions in lint mode without writing", async () => {
    const { workspaceRoot, dataDirectory } = await createWorkspaceFixture();
    const output = await runWorkflow({
      workspaceRoot,
      mode: "lint",
    });

    expect(output[0]).toContain("src/map.ts");
    const mapBefore = await readFile(join(dataDirectory, "Map001.json"), "utf8");
    expect(mapBefore).toContain('"events"');
  });

  it("writes map data in create mode", async () => {
    const { workspaceRoot, dataDirectory } = await createWorkspaceFixture();
    const output = await runWorkflow({
      workspaceRoot,
      mode: "create",
    });

    expect(output[0]).toContain("Map001.json");

    const mapAfter = JSON.parse(await readFile(join(dataDirectory, "Map001.json"), "utf8")) as {
      events: Array<{ id: number; name: string } | null>;
    };

    expect(mapAfter.events[2]?.name).toBe("Gate");
  });

  it("creates multiple definitions from the same source file", async () => {
    const { workspaceRoot, dataDirectory } = await createWorkspaceFixture();
    await writeFile(
      join(workspaceRoot, "src", "map.ts"),
      `export const gate = {
  kind: "mapEvent",
  name: "Gate",
  x: 1,
  y: 2,
  pages: [
    {
      conditions: {},
      trigger: "action",
      commands: [],
    },
  ],
};

export const secondGate = {
  kind: "mapEvent",
  name: "GateTwo",
  x: 3,
  y: 4,
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

    await runWorkflow({
      workspaceRoot,
      mode: "create",
    });

    const mapAfter = JSON.parse(await readFile(join(dataDirectory, "Map001.json"), "utf8")) as {
      events: Array<{ id: number; name: string } | null>;
    };

    expect(mapAfter.events[2]?.name).toBe("Gate");
    expect(mapAfter.events[3]?.name).toBe("GateTwo");
  });

  it("replaces an existing map event by name", async () => {
    const { workspaceRoot, dataDirectory } = await createWorkspaceFixture();
    await writeFile(
      join(workspaceRoot, "src", "map.ts"),
      `export const gate = {
  kind: "mapEvent",
  name: "Old",
  x: 7,
  y: 8,
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

    await runWorkflow({
      workspaceRoot,
      mode: "replace",
    });

    const mapAfter = JSON.parse(await readFile(join(dataDirectory, "Map001.json"), "utf8")) as {
      events: Array<{ id: number; name: string; x: number; y: number } | null>;
    };

    expect(mapAfter.events[1]?.x).toBe(7);
    expect(mapAfter.events[1]?.y).toBe(8);
  });

  it("rejects invalid page condition references before writing", async () => {
    const { workspaceRoot } = await createWorkspaceFixture();
    await writeFile(
      join(workspaceRoot, "src", "map.ts"),
      `export const gate = {
  kind: "mapEvent",
  name: "Gate",
  x: 1,
  y: 2,
  pages: [
    {
      conditions: {
        switch1: { kind: "switch", name: "MissingSwitch" },
      },
      trigger: "action",
      commands: [],
    },
  ],
};
`,
      "utf8",
    );

    await expect(
      runWorkflow({
        workspaceRoot,
        mode: "lint",
      }),
    ).rejects.toThrow("Unknown switch reference: MissingSwitch");
  });

  it("rejects create mode when the target name already exists", async () => {
    const { workspaceRoot } = await createWorkspaceFixture();

    await writeFile(
      join(workspaceRoot, "src", "map.ts"),
      `export const gate = {
  kind: "mapEvent",
  name: "Old",
  x: 1,
  y: 2,
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

    await expect(
      runWorkflow({
        workspaceRoot,
        mode: "create",
      }),
    ).rejects.toThrow("Duplicate target name: Old");
  });

  it("keeps diff mode read-only", async () => {
    const { workspaceRoot, dataDirectory } = await createWorkspaceFixture();
    const before = await readFile(join(dataDirectory, "Map001.json"), "utf8");

    const output = await runWorkflow({
      workspaceRoot,
      mode: "create",
      diff: true,
    });

    const after = await readFile(join(dataDirectory, "Map001.json"), "utf8");

    expect(output[0]).toContain("diff --");
    expect(after).toBe(before);
  });
});
