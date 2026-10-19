import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it as test } from "vitest";
import { recordEvidence } from "./support/mv-evidence.js";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { discoverDefinitionFiles, loadDefinitionFile } from "../src/workspace/definitions.js";
import { getWorkspaceStatePaths } from "../src/workspace/state.js";
import { createMinimalProject, withWindowsSandbox } from "./support/windows-sandbox.js";
import { blankEvent, blankPage } from "./support/map-event-fixtures.js";
import {
  changeMapNameDisplay,
  changeTileset,
  changeBattleBack,
  changeParallax,
  imageAsset,
} from "../src/index.js";

const {
  initWorkspace,
  cloneWorkspace,
  decompileWorkspace,
  compileWorkspace,
  diffWorkspace,
  pushWorkspace,
}: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const discovery = {
  sourceRoot: "src",
  sourceInclude: ["**/*.events.ts", "**/*.dsl.ts"],
  sourceExclude: [],
};

function it(name: string, body: () => Promise<void>, timeout: number) {
  test(
    name,
    async () => {
      const startedAt = new Date().toISOString();
      let failure: unknown;
      try {
        await body();
      } catch (error) {
        failure = error;
        throw error;
      } finally {
        await recordEvidence({
          requirementId: name.split(":")[0]!,
          startedAt,
          stages: [
            "Actual public helpers and Workspace API; native Decompile; Discovery/evaluation; Check/Compile; exact independent data and complete failure-state comparisons; Diff/Push where applicable",
          ],
          expected: name,
          actual: {
            case: name,
            assertionsCompleted: failure === undefined,
            entry: workspaceApiEntry,
          },
          ...(failure === undefined ? {} : { error: failure }),
        });
      }
    },
    timeout,
  );
}

type SavedCommand = { code: number; indent: number; parameters: unknown[] };
const saved: SavedCommand[] = JSON.parse(
  await readFile(
    new URL("./fixtures/mv-evidence/map-appearance-cases.json", import.meta.url),
    "utf8",
  ),
).commands;

async function prepare(workspaceRoot: string, list: SavedCommand[] = saved) {
  await createMinimalProject(workspaceRoot);
  const carrier = {
    width: 17,
    height: 13,
    tilesetId: 1,
    external: { exact: [null, "", 3] },
    events: [
      null,
      {
        ...structuredClone(blankEvent),
        pages: [{ ...structuredClone(blankPage), list: structuredClone(list) }],
      },
      null,
    ],
  };
  await writeFile(
    join(workspaceRoot, "Game/data/MapInfos.json"),
    JSON.stringify([null, { id: 1, name: "Map" }]),
  );
  await writeFile(join(workspaceRoot, "Game/data/Map001.json"), JSON.stringify(carrier));
  await writeFile(
    join(workspaceRoot, "Game/data/Tilesets.json"),
    JSON.stringify([null, { id: 1, name: "Field" }, { id: 2, name: "" }]),
  );
  await initWorkspace({ workspaceRoot, projectRoot: "./Game" });
  await cloneWorkspace({ workspaceRoot });
  return carrier;
}

it("MV-S6-MAP-APPEARANCE-001: preserves independent None and inactive map appearance values through discovered source and real Push", async () => {
  await withWindowsSandbox("map-appearance-roundtrip", async ({ workspaceRoot }) => {
    const expected = await prepare(workspaceRoot);
    await decompileWorkspace({ workspaceRoot });
    const files = await discoverDefinitionFiles(workspaceRoot, discovery);
    const values = (await Promise.all(files.map((file) => loadDefinitionFile(file)))).flat();
    expect(values.filter((value) => value.kind === "mapEvent")).toHaveLength(1);
    const sourcePath = join(workspaceRoot, "src/decompiled/maps/Map001.events.ts");
    const source = await readFile(sourcePath, "utf8");
    expect(source).toContain("battleback1: null, battleback2: null");
    expect(source).toContain("image: null, loopX: false, loopY: true, sx: -32, sy: 32");
    await compileWorkspace({ workspaceRoot, check: true });
    await compileWorkspace({ workspaceRoot, check: false });
    const generated = join(
      getWorkspaceStatePaths(workspaceRoot).generatedProjectDataDirectory,
      "Map001.json",
    );
    expect(JSON.parse(await readFile(generated, "utf8"))).toStrictEqual(expected);
    const rawSource = `import { rawDslCommand } from "rpgmaker-event-dsl";\n${source}`
      .replace(
        "changeMapNameDisplay({ enabled: true })",
        "rawDslCommand({ code: 281, parameters: [0] })",
      )
      .replace(
        "changeTileset({ tileset: tilesetRef({ id: 2 }) })",
        "rawDslCommand({ code: 282, parameters: [2] })",
      )
      .replace(
        "changeBattleBack({ battleback1: null, battleback2: null })",
        'rawDslCommand({ code: 283, parameters: ["", ""] })',
      )
      .replace(
        "changeParallax({ image: null, loopX: false, loopY: true, sx: -32, sy: 32 })",
        'rawDslCommand({ code: 284, parameters: ["", false, true, -32, 32] })',
      );
    await writeFile(sourcePath, rawSource);
    await compileWorkspace({ workspaceRoot, check: false });
    expect(JSON.parse(await readFile(generated, "utf8"))).toStrictEqual(expected);
    await writeFile(
      sourcePath,
      source
        .replace("Complete blank", "Appearance changed")
        .replace("sx: -32, sy: 32", "sx: 31, sy: -31"),
    );
    await compileWorkspace({ workspaceRoot, check: false });
    expect(await diffWorkspace({ workspaceRoot })).toBeDefined();
    await pushWorkspace({ workspaceRoot, allowDestructive: false });
    expected.events[1]!.name = "Appearance changed";
    expected.events[1]!.pages[0]!.list[9]!.parameters = ["", false, true, 31, -31];
    expect(
      JSON.parse(await readFile(join(workspaceRoot, "Game/data/Map001.json"), "utf8")),
    ).toStrictEqual(expected);
  });
}, 30_000);

it("MV-S6-MAP-APPEARANCE-006: rejects malformed known native and raw appearance slots at their actual native and authored paths", async () => {
  const cases: Array<[number, unknown[], number | undefined]> = [
    [281, [2], 0],
    [281, [true], 0],
    [281, [], undefined],
    [282, [0], 0],
    [282, [1.5], 0],
    [283, [""], undefined],
    [283, [null, ""], 0],
    [284, ["", false, false, 33, 0], 3],
    [284, ["", false, false, 0, -33], 4],
    [284, ["", false, false, 0.5, 0], 3],
    [284, ["", 0, false, 0, 0], 1],
    [284, ["", false, false, 0], undefined],
  ];
  await withWindowsSandbox("map-appearance-native", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    await decompileWorkspace({ workspaceRoot });
    await compileWorkspace({ workspaceRoot, check: false });
    const sourcePath = join(workspaceRoot, "src/decompiled/maps/Map001.events.ts");
    const source = await readFile(sourcePath, "utf8");
    for (const [code, parameters, slot] of cases) {
      await writeFile(
        sourcePath,
        source.replace(
          "changeMapNameDisplay({ enabled: true })",
          `{ kind: "rawDslCommand", code: ${code}, parameters: ${JSON.stringify(parameters)} } as never`,
        ),
      );
      const before = await state(workspaceRoot);
      for (const check of [true, false])
        await expect(compileWorkspace({ workspaceRoot, check })).rejects.toThrow(
          new RegExp(
            `MV-E${code}-PARAMETERS:.*pages\\[0\\]\\.commands\\[0\\]\\.parameters${slot === undefined ? "" : `\\[${slot}\\]`}.*expected.*actual`,
            "s",
          ),
        );
      expect(await state(workspaceRoot)).toStrictEqual(before);
    }
  });
  for (const [code, parameters, slot] of cases)
    await withWindowsSandbox(`map-appearance-native-${code}`, async ({ workspaceRoot }) => {
      await prepare(workspaceRoot, [
        { code, indent: 0, parameters },
        { code: 0, indent: 0, parameters: [] },
      ]);
      const before = await state(workspaceRoot);
      await expect(decompileWorkspace({ workspaceRoot })).rejects.toMatchObject({
        code: `MV-E${code}-PARAMETERS`,
        stage: "decompile",
        identity: "map:1/event:1",
        location: {
          nativePath: `pages[0].list[0].parameters${slot === undefined ? "" : `[${slot}]`}`,
          expected: expect.any(String),
          actual: expect.any(String),
        },
      });
      expect(await state(workspaceRoot)).toStrictEqual(before);
    });
}, 60_000);

it("MV-S6-MAP-APPEARANCE-005: requires all E284 fields and enforces saved speed bounds even with None and disabled looping", async () => {
  const good = { image: null, loopX: false, loopY: false, sx: 32, sy: -32 };
  for (const field of Object.keys(good)) {
    const missing = { ...good } as Record<string, unknown>;
    delete missing[field];
    expect(() => changeParallax(missing as never)).toThrow(/MV-E284-INPUT/);
  }
  for (const field of ["sx", "sy"])
    for (const value of [-33, 33, 0.5, NaN, Infinity, -Infinity, -0])
      expect(() => changeParallax({ ...good, [field]: value })).toThrow(/MV-E284-INPUT/);
  for (const field of ["loopX", "loopY"])
    expect(() => changeParallax({ ...good, [field]: 0 } as never)).toThrow(/MV-E284-INPUT/);
  for (const image of [
    imageAsset({ folder: "pictures", name: "Sky" }),
    { kind: "asset", category: "image", folder: "parallaxes", name: "" },
  ])
    expect(() => changeParallax({ ...good, image } as never)).toThrow(/MV-E284-INPUT/);
  expect(() => changeParallax({ ...good, extra: true } as never)).toThrow(/MV-DSL-SHAPE/);
  await withWindowsSandbox("map-appearance-284", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    await decompileWorkspace({ workspaceRoot });
    await compileWorkspace({ workspaceRoot, check: false });
    const sourcePath = join(workspaceRoot, "src/decompiled/maps/Map001.events.ts");
    const source = await readFile(sourcePath, "utf8");
    for (const [fields, field] of [
      ["image: null, loopX: false, loopY: true, sx: 33, sy: 32", "sx"],
      ["image: null, loopX: false, loopY: true, sx: -32", "sy"],
      ["image: null, loopX: false, loopY: 1, sx: -32, sy: 32", "loopY"],
    ]) {
      await writeFile(
        sourcePath,
        source.replace(
          "changeParallax({ image: null, loopX: false, loopY: true, sx: -32, sy: 32 })",
          `{ kind: "changeParallax", ${fields} } as never`,
        ),
      );
      const before = await state(workspaceRoot);
      for (const check of [true, false])
        await expect(compileWorkspace({ workspaceRoot, check })).rejects.toThrow(
          new RegExp(
            `compile error map:1/event:1: MV-E284-INPUT:.*pages\\[0\\]\\.commands\\[9\\]\\.${field}.*expected.*actual`,
            "s",
          ),
        );
      expect(await state(workspaceRoot)).toStrictEqual(before);
    }
  });
}, 30_000);

it("MV-S6-MAP-APPEARANCE-004: requires both independent E283 asset-or-None slots with exact folders and nonempty names", async () => {
  const good = imageAsset({ folder: "battlebacks1", name: "Castle1" });
  for (const input of [
    { battleback1: good },
    { battleback1: good, battleback2: good },
    { battleback1: { ...good, name: "" }, battleback2: null },
    { battleback1: null, battleback2: 0 },
  ])
    expect(() => changeBattleBack(input as never)).toThrow(/MV-E283-INPUT/);
  expect(() =>
    changeBattleBack({ battleback1: null, battleback2: null, extra: 1 } as never),
  ).toThrow(/MV-DSL-SHAPE/);
  await withWindowsSandbox("map-appearance-283", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    await decompileWorkspace({ workspaceRoot });
    await compileWorkspace({ workspaceRoot, check: false });
    const sourcePath = join(workspaceRoot, "src/decompiled/maps/Map001.events.ts");
    const source = await readFile(sourcePath, "utf8");
    await writeFile(
      sourcePath,
      source.replace(
        "changeBattleBack({ battleback1: null, battleback2: null })",
        '{ kind: "changeBattleBack", battleback1: null } as never',
      ),
    );
    const before = await state(workspaceRoot);
    for (const check of [true, false])
      await expect(compileWorkspace({ workspaceRoot, check })).rejects.toThrow(
        /compile error map:1\/event:1: MV-E283-INPUT:.*pages\[0\]\.commands\[6\]\.battleback2.*expected.*actual/s,
      );
    expect(await state(workspaceRoot)).toStrictEqual(before);
  });
}, 30_000);

it("MV-S6-MAP-APPEARANCE-003: rejects E282 None, zero, wrong scope and absent actual Tilesets with precise source paths", async () => {
  expect(() => changeTileset({ tileset: { kind: "tileset", id: 2 }, extra: 1 } as never)).toThrow(
    /MV-DSL-SHAPE/,
  );
  await withWindowsSandbox("map-appearance-282", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    await decompileWorkspace({ workspaceRoot });
    await compileWorkspace({ workspaceRoot, check: false });
    const sourcePath = join(workspaceRoot, "src/decompiled/maps/Map001.events.ts");
    const source = await readFile(sourcePath, "utf8");
    for (const [value, code] of [
      ["null", "INPUT"],
      ['{ kind: "tileset", id: 0 }', "INPUT"],
      ['{ kind: "actor", id: 2 }', "INPUT"],
      ['{ kind: "tileset", id: 99 }', "REFERENCE"],
    ]) {
      await writeFile(
        sourcePath,
        source.replace(
          "changeTileset({ tileset: tilesetRef({ id: 2 }) })",
          `{ kind: "changeTileset", tileset: ${value} } as never`,
        ),
      );
      const before = await state(workspaceRoot);
      for (const check of [true, false])
        await expect(compileWorkspace({ workspaceRoot, check })).rejects.toThrow(
          new RegExp(
            `compile error map:1/event:1: MV-E282-${code}:.*pages\\[0\\]\\.commands\\[2\\]\\.tileset.*expected.*actual`,
            "s",
          ),
        );
      expect(await state(workspaceRoot)).toStrictEqual(before);
    }
  });
}, 30_000);

async function state(workspaceRoot: string) {
  const paths = getWorkspaceStatePaths(workspaceRoot);
  const directory = async (path: string) => {
    try {
      return Object.fromEntries(
        await Promise.all(
          (await readdir(path))
            .sort()
            .map(async (name) => [name, await readFile(join(path, name), "utf8")]),
        ),
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  };
  const files = await discoverDefinitionFiles(workspaceRoot, discovery);
  return {
    project: await directory(join(workspaceRoot, "Game/data")),
    snapshot: await directory(paths.projectDataSnapshotDirectory),
    generated: await directory(paths.generatedProjectDataDirectory),
    manifest: await readFile(paths.syncManifestPath, "utf8"),
    config: await readFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8"),
    descriptor: await readFile(join(workspaceRoot, "Game/Game.rpgproject"), "utf8"),
    files,
    sources: await Promise.all(files.map((file) => readFile(file, "utf8"))),
  };
}

it("MV-S6-MAP-APPEARANCE-002: rejects missing and untyped E281 values and helper unknown fields without changing complete Workspace state", async () => {
  expect(() => changeMapNameDisplay({ enabled: true, extra: 1 } as never)).toThrow(/MV-DSL-SHAPE/);
  await withWindowsSandbox("map-appearance-281", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    await decompileWorkspace({ workspaceRoot });
    await compileWorkspace({ workspaceRoot, check: false });
    const sourcePath = join(workspaceRoot, "src/decompiled/maps/Map001.events.ts");
    const source = await readFile(sourcePath, "utf8");
    for (const expression of [
      '{ kind: "changeMapNameDisplay", enabled: "yes" }',
      '{ kind: "changeMapNameDisplay" }',
    ]) {
      await writeFile(
        sourcePath,
        source.replace("changeMapNameDisplay({ enabled: true })", `${expression} as never`),
      );
      const before = await state(workspaceRoot);
      for (const check of [true, false])
        await expect(compileWorkspace({ workspaceRoot, check })).rejects.toThrow(
          /compile error map:1\/event:1: MV-E281-INPUT:.*pages\[0\]\.commands\[0\]\.enabled.*expected.*actual/s,
        );
      expect(await state(workspaceRoot)).toStrictEqual(before);
    }
  });
}, 30_000);
