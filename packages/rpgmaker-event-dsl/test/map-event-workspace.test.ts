import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { discoverDefinitionFiles, loadDefinitionFile } from "../src/workspace/definitions.js";
import { getWorkspaceStatePaths } from "../src/workspace/state.js";
import {
  createMinimalProject,
  withWindowsSandbox,
  type WindowsSandbox,
} from "./support/windows-sandbox.js";
import { recordEvidence } from "./support/mv-evidence.js";

import { blankPage, blankEvent } from "./support/map-event-fixtures.js";

const {
  initWorkspace,
  cloneWorkspace,
  compileWorkspace,
  decompileWorkspace,
  diffWorkspace,
  pushWorkspace,
}: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);

const discovery = {
  sourceRoot: "src",
  sourceInclude: ["**/*.events.ts", "**/*.dsl.ts"],
  sourceExclude: [],
};

const evidenceCases: Record<string, string> = {
  "map-page-blank": "MV-S5-MAP-001",
  "map-native-shape": "MV-S5-MAP-002",
  "map-page-full": "MV-S5-MAP-003",
  "map-authored-shape": "MV-S5-MAP-004",
  "map-tile-context": "MV-S5-MAP-005",
  "map-high-id-diff-removal": "MV-S5-MAP-006",
  "map-native-required": "MV-S5-MAP-007",
  "map-fixed-route-gate": "MV-S5-MAP-008",
  "map-route-reference": "MV-S5-MAP-009",
};

async function withMapEvidence(label: string, body: (sandbox: WindowsSandbox) => Promise<void>) {
  await withWindowsSandbox(label, async (sandbox) => {
    const startedAt = new Date().toISOString();
    let failure: unknown;
    try {
      await body(sandbox);
    } catch (error) {
      failure = error;
      throw error;
    } finally {
      await recordEvidence({
        requirementId: evidenceCases[label]!,
        startedAt,
        stages: [
          "Actual Workspace API and filesystem; public Discovery/evaluation where source is published; independent complete literals, exact saved fields and complete failure-state comparisons",
        ],
        expected:
          "The linked case assertions compare complete independent native state and diagnostics; rejected operations preserve source, Project Root, Snapshot, generated output, manifest and Discovery.",
        actual: {
          case: label,
          finalState: await state(sandbox.workspaceRoot),
          processes: sandbox.processes,
          entry: sandbox.cliEntry,
        },
        ...(failure === undefined ? {} : { error: failure }),
      });
    }
  });
}

async function prepareMap(
  workspaceRoot: string,
  events: unknown[] = [null, blankEvent],
  mapId = 1,
) {
  await createMinimalProject(workspaceRoot);
  const mapInfos = Array(mapId + 1).fill(null);
  mapInfos[mapId] = { id: mapId, name: "Map" };
  await writeFile(join(workspaceRoot, "Game/data/MapInfos.json"), JSON.stringify(mapInfos));
  await writeFile(
    join(workspaceRoot, `Game/data/Map${String(mapId).padStart(3, "0")}.json`),
    JSON.stringify({ width: 17, height: 13, events, tilesetId: 1, opaque: { preserved: true } }),
  );
  await initWorkspace({ workspaceRoot, projectRoot: "./Game" });
  await cloneWorkspace({ workspaceRoot });
}

async function state(workspaceRoot: string) {
  const paths = getWorkspaceStatePaths(workspaceRoot);
  const data = async (directory: string) => {
    try {
      return Object.fromEntries(
        await Promise.all(
          (await readdir(directory))
            .sort()
            .map(async (name) => [name, await readFile(join(directory, name), "utf8")]),
        ),
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  };
  const files = await discoverDefinitionFiles(workspaceRoot, discovery);
  return {
    config: await readFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8"),
    projectDescriptor: await readFile(join(workspaceRoot, "Game/Game.rpgproject"), "utf8"),
    project: await data(join(workspaceRoot, "Game/data")),
    snapshot: await data(paths.projectDataSnapshotDirectory),
    generated: await data(paths.generatedProjectDataDirectory),
    manifest: await readFile(paths.syncManifestPath, "utf8"),
    discovery: files,
    source: await Promise.all(files.map((file) => readFile(file, "utf8"))),
  };
}

it("round trips the complete native blank Map Event and exact note through actual Workspace operations", async () => {
  await withMapEvidence("map-page-blank", async ({ workspaceRoot }) => {
    await createMinimalProject(workspaceRoot);
    const mapPath = join(workspaceRoot, "Game/data/Map001.json");
    const carrier = {
      width: 17,
      height: 13,
      tilesetId: 1,
      events: [null, structuredClone(blankEvent), null, null],
      externalCarrier: { opaque: ["", null, { preserved: true }] },
    };
    await writeFile(
      join(workspaceRoot, "Game/data/MapInfos.json"),
      JSON.stringify([null, { id: 1, name: "Map" }]),
    );
    await writeFile(mapPath, JSON.stringify(carrier));
    await initWorkspace({ workspaceRoot, projectRoot: "./Game" });
    await cloneWorkspace({ workspaceRoot });
    await decompileWorkspace({ workspaceRoot });
    const files = await discoverDefinitionFiles(workspaceRoot, discovery);
    const declarations = (await Promise.all(files.map((file) => loadDefinitionFile(file)))).flat();
    expect(declarations.filter((value) => value.kind === "mapEvent")).toHaveLength(1);
    const sourcePath = join(workspaceRoot, "src/decompiled/maps/Map001.events.ts");
    const source = await readFile(sourcePath, "utf8");
    expect(source).toContain("note:");
    for (const group of ["conditions", "image", "movement", "priority", "options", "trigger"])
      expect(source).not.toContain(`${group}:`);
    await compileWorkspace({ workspaceRoot, check: true });
    await compileWorkspace({ workspaceRoot, check: false });
    const generatedPath = join(
      getWorkspaceStatePaths(workspaceRoot).generatedProjectDataDirectory,
      "Map001.json",
    );
    expect(JSON.parse(await readFile(generatedPath, "utf8"))).toStrictEqual(carrier);
    await writeFile(sourcePath, source.replace("Complete blank", "Actual replacement"));
    await compileWorkspace({ workspaceRoot, check: false });
    await expect(diffWorkspace({ workspaceRoot })).resolves.toBeDefined();
    await pushWorkspace({ workspaceRoot, allowDestructive: false });
    carrier.events[1]!.name = "Actual replacement";
    expect(JSON.parse(await readFile(mapPath, "utf8"))).toStrictEqual(carrier);
  });
}, 30_000);

it("rejects a malformed late native page without publishing any candidate or changing Workspace state", async () => {
  await withMapEvidence("map-native-shape", async ({ workspaceRoot }) => {
    const malformed = { ...structuredClone(blankPage), unownedPageField: true };
    await prepareMap(workspaceRoot, [null, { ...blankEvent, pages: [blankPage, malformed] }]);
    const before = await state(workspaceRoot);
    await expect(decompileWorkspace({ workspaceRoot })).rejects.toMatchObject({
      code: "MV-MAP-PAGE-SHAPE",
      stage: "decompile",
      identity: "map:1/event:1",
      location: { nativePath: "pages[1].unownedPageField" },
    });
    expect(await state(workspaceRoot)).toStrictEqual(before);
  });
});

it("preserves disabled condition settings, independent images and every saved page field", async () => {
  await withMapEvidence("map-page-full", async ({ workspaceRoot }) => {
    await createMinimalProject(workspaceRoot);
    const pages = [
      {
        ...structuredClone(blankPage),
        conditions: {
          actorId: 0,
          actorValid: false,
          itemId: 9999,
          itemValid: false,
          selfSwitchCh: "D",
          selfSwitchValid: false,
          switch1Id: 0,
          switch1Valid: false,
          switch2Id: 9999,
          switch2Valid: false,
          variableId: 9999,
          variableValid: false,
          variableValue: -99999999,
        },
        image: {
          characterName: "!$Big",
          characterIndex: 7,
          tileId: 1023,
          direction: 8,
          pattern: 2,
        },
        directionFix: true,
        stepAnime: true,
        walkAnime: false,
        through: true,
        priorityType: 2,
        trigger: 4,
        moveType: 0,
        moveSpeed: 6,
        moveFrequency: 5,
        moveRoute: {
          list: [{ code: 15, parameters: [2], indent: null }, { code: 0 }],
          repeat: false,
          skippable: true,
          wait: true,
        },
      },
      {
        ...structuredClone(blankPage),
        conditions: {
          actorId: 1,
          actorValid: true,
          itemId: 1,
          itemValid: true,
          selfSwitchCh: "B",
          selfSwitchValid: true,
          switch1Id: 1,
          switch1Valid: true,
          switch2Id: 2,
          switch2Valid: true,
          variableId: 1,
          variableValid: true,
          variableValue: 99999999,
        },
        image: { characterName: "", characterIndex: 6, tileId: 0, direction: 4, pattern: 1 },
        priorityType: 1,
        trigger: 3,
        moveType: 3,
        moveSpeed: 1,
        moveFrequency: 1,
      },
      { ...structuredClone(blankPage), trigger: 2, moveType: 2 },
      { ...structuredClone(blankPage), trigger: 1, moveType: 1 },
      structuredClone(blankPage),
    ];
    const carrier = {
      width: 17,
      height: 13,
      tilesetId: 1,
      events: [null, { ...blankEvent, pages }],
    };
    await writeFile(
      join(workspaceRoot, "Game/data/MapInfos.json"),
      JSON.stringify([null, { id: 1, name: "Map" }]),
    );
    await writeFile(join(workspaceRoot, "Game/data/Map001.json"), JSON.stringify(carrier));
    await writeFile(
      join(workspaceRoot, "Game/data/Actors.json"),
      JSON.stringify([null, { id: 1, name: "Actor" }]),
    );
    await writeFile(
      join(workspaceRoot, "Game/data/Items.json"),
      JSON.stringify([null, { id: 1, name: "Item" }]),
    );
    await writeFile(
      join(workspaceRoot, "Game/data/System.json"),
      JSON.stringify({ switches: ["", "One", "Two"], variables: ["", "Value"] }),
    );
    await writeFile(
      join(workspaceRoot, "Game/data/Tilesets.json"),
      JSON.stringify([
        null,
        { id: 1, name: "Tile", tilesetNames: ["", "", "", "", "", "B", "C", "D", "E"] },
      ]),
    );
    await initWorkspace({ workspaceRoot, projectRoot: "./Game" });
    await cloneWorkspace({ workspaceRoot });
    await decompileWorkspace({ workspaceRoot });
    const sourcePath = join(workspaceRoot, "src/decompiled/maps/Map001.events.ts");
    const source = await readFile(sourcePath, "utf8");
    expect(source).toContain("enabled: false");
    expect(source).toContain("atLeast: -99999999");
    expect(source).toContain('imageAsset({ folder: "characters", name: "!$Big" })');
    await compileWorkspace({ workspaceRoot, check: true });
    await compileWorkspace({ workspaceRoot, check: false });
    const generatedPath = join(
      getWorkspaceStatePaths(workspaceRoot).generatedProjectDataDirectory,
      "Map001.json",
    );
    expect(JSON.parse(await readFile(generatedPath, "utf8"))).toStrictEqual(carrier);
    await writeFile(sourcePath, source.replace("Complete blank", "Full saved replacement"));
    await compileWorkspace({ workspaceRoot, check: false });
    await pushWorkspace({ workspaceRoot, allowDestructive: false });
    carrier.events[1]!.name = "Full saved replacement";
    expect(
      JSON.parse(await readFile(join(workspaceRoot, "Game/data/Map001.json"), "utf8")),
    ).toStrictEqual(carrier);
  });
}, 30_000);

it("rejects malformed authored page options in Check and Compile without changing Workspace state", async () => {
  await withMapEvidence("map-authored-shape", async ({ workspaceRoot }) => {
    await prepareMap(workspaceRoot);
    await decompileWorkspace({ workspaceRoot });
    await compileWorkspace({ workspaceRoot, check: false });
    const sourcePath = join(workspaceRoot, "src/decompiled/maps/Map001.events.ts");
    const source = await readFile(sourcePath, "utf8");
    await writeFile(
      sourcePath,
      source.replace("page({", "page({ options: { through: null as never },"),
    );
    const before = await state(workspaceRoot);
    await expect(compileWorkspace({ workspaceRoot, check: true })).rejects.toThrow(
      /MV-MAP-PAGE-INPUT/,
    );
    await expect(compileWorkspace({ workspaceRoot, check: false })).rejects.toThrow(
      /MV-MAP-PAGE-INPUT/,
    );
    expect(await state(workspaceRoot)).toStrictEqual(before);
  });
}, 30_000);

it("requires the active tile's actual Map and Tilesets Snapshot context before publishing source", async () => {
  await withMapEvidence("map-tile-context", async ({ workspaceRoot }) => {
    await prepareMap(workspaceRoot, [
      null,
      { ...blankEvent, pages: [{ ...blankPage, image: { ...blankPage.image, tileId: 256 } }] },
    ]);
    const before = await state(workspaceRoot);
    await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(/MV-MAP-TILESET/);
    expect(await state(workspaceRoot)).toStrictEqual(before);
  });
});

it("reports page positions and native paths on Map1001 and removes a high-ID entry without compacting the carrier", async () => {
  await withMapEvidence("map-high-id-diff-removal", async ({ workspaceRoot }) => {
    const events = Array(1004).fill(null);
    events[1001] = { ...blankEvent, id: 1001 };
    await prepareMap(workspaceRoot, events, 1001);
    await decompileWorkspace({ workspaceRoot });
    const sourcePath = join(workspaceRoot, "src/decompiled/maps/Map1001.events.ts");
    const source = await readFile(sourcePath, "utf8");
    await writeFile(
      sourcePath,
      `import { actorRef } from "rpgmaker-event-dsl";\n${source.replace("page({", 'page({ priority: "same", image: { pattern: 2 }, conditions: { actor: { enabled: false, ref: actorRef({ id: 0 }) } },').replace("<tag: x>", "<tag: changed>")}`,
    );
    await compileWorkspace({ workspaceRoot, check: false });
    const diff = await diffWorkspace({ workspaceRoot });
    expect(diff).toContain("mapId 1001, eventId 1001");
    expect(diff).toContain("pages[0].image.pattern");
    expect(diff).toContain("pages[0].conditions.actorId");
    expect(diff).toContain("page 1");
    expect(diff).toContain("note");
    await pushWorkspace({ workspaceRoot, allowDestructive: false });
    const mapPath = join(workspaceRoot, "Game/data/Map1001.json");
    const before = JSON.parse(await readFile(mapPath, "utf8"));
    await writeFile(sourcePath, "export {};\n");
    await compileWorkspace({ workspaceRoot, check: false });
    await expect(pushWorkspace({ workspaceRoot, allowDestructive: false })).rejects.toThrow(
      /Destructive/,
    );
    await pushWorkspace({ workspaceRoot, allowDestructive: true });
    before.events[1001] = null;
    expect(JSON.parse(await readFile(mapPath, "utf8"))).toStrictEqual(before);
  });
}, 30_000);

it.each([
  ...["id", "name", "note", "x", "y", "pages"].map(
    (field) =>
      [
        field,
        (event: Record<string, unknown>) => {
          delete event[field];
        },
      ] as const,
  ),
  [
    "event extra",
    (event: Record<string, unknown>) => {
      event.meta = {};
    },
  ],
  [
    "null page",
    (event: Record<string, unknown>) => {
      event.pages = [null];
    },
  ],
  [
    "empty pages",
    (event: Record<string, unknown>) => {
      event.pages = [];
    },
  ],
  ...[
    ["note", null],
    ["x", -1],
    ["y", 0.5],
    ["name", 1],
    ["id", 2],
  ].map(
    ([field, value]) =>
      [
        `event invalid ${field}`,
        (event: Record<string, unknown>) => {
          event[field as string] = value;
        },
      ] as const,
  ),
  ...[
    ["conditions", null],
    ["image", []],
    ["priorityType", 3],
    ["trigger", 5],
    ["walkAnime", 1],
    ["stepAnime", null],
    ["directionFix", "false"],
    ["through", {}],
    ["moveType", 4],
    ["moveSpeed", 0],
    ["moveFrequency", 6],
  ].map(
    ([field, value]) =>
      [
        `page invalid ${field}`,
        (event: Record<string, unknown>) => {
          (event.pages as Record<string, unknown>[])[0]![field as string] = value;
        },
      ] as const,
  ),
  ...[
    ["conditions", "extra", true],
    ["conditions", "actorValid", 1],
    ["conditions", "variableValue", -100000000],
    ["conditions", "selfSwitchCh", "E"],
    ["image", "extra", true],
    ["image", "characterName", null],
    ["image", "characterIndex", 8],
    ["image", "tileId", 1024],
    ["image", "direction", 3],
    ["image", "pattern", 3],
  ].map(
    ([group, field, value]) =>
      [
        `nested invalid ${group}.${field}`,
        (event: Record<string, unknown>) => {
          (
            (event.pages as Record<string, unknown>[])[0]![group as string] as Record<
              string,
              unknown
            >
          )[field as string] = value;
        },
      ] as const,
  ),
  ...[
    "conditions",
    "image",
    "moveType",
    "moveSpeed",
    "moveFrequency",
    "moveRoute",
    "priorityType",
    "walkAnime",
    "stepAnime",
    "directionFix",
    "through",
    "trigger",
    "list",
  ].map(
    (field) =>
      [
        `page missing ${field}`,
        (event: Record<string, unknown>) => {
          delete (event.pages as Record<string, unknown>[])[0]![field];
        },
      ] as const,
  ),
  ...[
    "actorId",
    "actorValid",
    "itemId",
    "itemValid",
    "selfSwitchCh",
    "selfSwitchValid",
    "switch1Id",
    "switch1Valid",
    "switch2Id",
    "switch2Valid",
    "variableId",
    "variableValid",
    "variableValue",
  ].map(
    (field) =>
      [
        `condition missing ${field}`,
        (event: Record<string, unknown>) => {
          delete (
            (event.pages as Record<string, unknown>[])[0]!.conditions as Record<string, unknown>
          )[field];
        },
      ] as const,
  ),
  ...["characterName", "characterIndex", "tileId", "direction", "pattern"].map(
    (field) =>
      [
        `image missing ${field}`,
        (event: Record<string, unknown>) => {
          delete ((event.pages as Record<string, unknown>[])[0]!.image as Record<string, unknown>)[
            field
          ];
        },
      ] as const,
  ),
] as const)("rejects incomplete native Map saved shape: %s", async (_label, mutate) => {
  await withMapEvidence("map-native-required", async ({ workspaceRoot }) => {
    const invalid = structuredClone(blankEvent) as unknown as Record<string, unknown>;
    mutate(invalid);
    await prepareMap(workspaceRoot, [null, invalid]);
    const before = await state(workspaceRoot);
    await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(
      /MV-MAP-|MV-COMMAND-|MV-PAGE-MOVEMENT|MV-MOVEMENT/,
    );
    expect(await state(workspaceRoot)).toStrictEqual(before);
  });
});

it("recursively gates a saved empty script in a fixed page route while Decompile retains the source", async () => {
  await withMapEvidence("map-fixed-route-gate", async ({ workspaceRoot }) => {
    const saved = {
      ...structuredClone(blankPage),
      moveRoute: {
        list: [
          { code: 45, parameters: [""] },
          { code: 0, parameters: [] },
        ],
        repeat: true,
        skippable: false,
        wait: true,
      },
    };
    await prepareMap(workspaceRoot, [null, { ...blankEvent, pages: [saved] }]);
    await decompileWorkspace({ workspaceRoot });
    const source = await readFile(
      join(workspaceRoot, "src/decompiled/maps/Map001.events.ts"),
      "utf8",
    );
    expect(source).toContain('scriptInput({ code: "" })');
    const before = await state(workspaceRoot);
    await expect(compileWorkspace({ workspaceRoot, check: true })).rejects.toThrow(
      /MV-SCRIPT-GATE/,
    );
    await expect(compileWorkspace({ workspaceRoot, check: false })).rejects.toThrow(
      /MV-SCRIPT-GATE/,
    );
    expect(await state(workspaceRoot)).toStrictEqual(before);
    const configPath = join(workspaceRoot, "rpgmaker-event-dsl.config.json");
    const config = JSON.parse(await readFile(configPath, "utf8"));
    config.scriptEnabled = true;
    await writeFile(configPath, JSON.stringify(config));
    await compileWorkspace({ workspaceRoot, check: true });
    await compileWorkspace({ workspaceRoot, check: false });
    const generated = JSON.parse(
      await readFile(
        join(getWorkspaceStatePaths(workspaceRoot).generatedProjectDataDirectory, "Map001.json"),
        "utf8",
      ),
    );
    expect(generated.events[1].pages).toStrictEqual([saved]);
  });
}, 30_000);

it("does not extend the disabled-condition ID exception to a noncustom saved route", async () => {
  await withMapEvidence("map-route-reference", async ({ workspaceRoot }) => {
    const saved = {
      ...structuredClone(blankPage),
      moveRoute: {
        ...blankPage.moveRoute,
        list: [
          { code: 27, parameters: [999] },
          { code: 0, parameters: [] },
        ],
      },
    };
    await prepareMap(workspaceRoot, [null, { ...blankEvent, pages: [saved] }]);
    const before = await state(workspaceRoot);
    await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(
      /Unknown switch reference|MV-MOVEMENT/,
    );
    expect(await state(workspaceRoot)).toStrictEqual(before);
  });
});
