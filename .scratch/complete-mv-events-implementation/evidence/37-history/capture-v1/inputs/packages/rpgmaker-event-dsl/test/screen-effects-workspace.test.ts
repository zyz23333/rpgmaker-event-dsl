import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it as test, vi } from "vitest";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { recordEvidence } from "./support/mv-evidence.js";
import { createMinimalProject, withWindowsSandbox } from "./support/windows-sandbox.js";
import { blankEvent, blankPage } from "./support/map-event-fixtures.js";
import { discoverDefinitionFiles, loadDefinitionFile } from "../src/workspace/definitions.js";
import { getWorkspaceStatePaths } from "../src/workspace/state.js";

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
type SavedCommand = { code: number; indent: number; parameters: unknown[] };
const commands: SavedCommand[] = JSON.parse(
  await readFile(
    new URL("./fixtures/mv-evidence/screen-effect-cases.json", import.meta.url),
    "utf8",
  ),
);

function it(name: string, body: () => Promise<void>) {
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
            "Independent literal saved input",
            "Actual public Workspace API, Discovery and source evaluation",
            "Complete saved values, diagnostics, all 15 carriers and unchanged failure state",
          ],
          expected: name,
          actual: { entry: workspaceApiEntry, assertionsCompleted: failure === undefined },
          ...(failure === undefined ? {} : { error: failure }),
        });
      }
    },
    30_000,
  );
}

// Fixture encoding only: the independent literal supplies every expected native slot.
function savedJson(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) =>
    typeof item === "number" && Object.is(item, -0) ? "__SCREEN_SIGNED_ZERO__" : item,
  ).replaceAll('"__SCREEN_SIGNED_ZERO__"', "-0");
}

async function prepare(workspaceRoot: string, list = commands) {
  const fixture = await createMinimalProject(workspaceRoot);
  const files: Record<string, unknown> = structuredClone(fixture.projectFiles);
  files["CommonEvents.json"] = [
    null,
    { id: 1, name: "Screen Common", trigger: 0, switchId: 1, list },
  ];
  files["MapInfos.json"] = [null, { id: 1, name: "Screen Map" }];
  files["Tilesets.json"] = [null, { id: 1, name: "Field" }];
  files["Map001.json"] = {
    width: 17,
    height: 13,
    tilesetId: 1,
    external: { keep: [null, "", 3] },
    events: [
      null,
      {
        ...structuredClone(blankEvent),
        name: "Screen Map Event",
        pages: [{ ...structuredClone(blankPage), list }],
      },
      null,
    ],
  };
  files["Troops.json"] = [
    null,
    {
      id: 1,
      name: "External troop",
      members: [],
      external: { keep: true },
      pages: [
        {
          conditions: {
            actorHp: 50,
            actorId: 1,
            actorValid: false,
            enemyHp: 50,
            enemyIndex: 0,
            enemyValid: false,
            switchId: 1,
            switchValid: false,
            turnA: 0,
            turnB: 0,
            turnEnding: false,
            turnValid: false,
          },
          span: 0,
          list,
        },
      ],
    },
  ];
  for (const [name, data] of Object.entries(files))
    await writeFile(join(workspaceRoot, "Game/data", name), savedJson(data));
  await initWorkspace({ workspaceRoot, projectRoot: "./Game" });
  await cloneWorkspace({ workspaceRoot });
  return structuredClone(files);
}

async function directory(path: string): Promise<Record<string, string> | null> {
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
}
function parseFiles(files: Record<string, string> | null) {
  return files === null
    ? null
    : Object.fromEntries(Object.entries(files).map(([name, bytes]) => [name, JSON.parse(bytes)]));
}
async function state(workspaceRoot: string) {
  const paths = getWorkspaceStatePaths(workspaceRoot);
  const files = await discoverDefinitionFiles(workspaceRoot, discovery);
  const tree = async (path: string): Promise<Record<string, unknown> | null> => {
    try {
      return Object.fromEntries(
        await Promise.all(
          (await readdir(path, { withFileTypes: true }))
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(async (entry) => [
              entry.name,
              entry.isDirectory()
                ? await tree(join(path, entry.name))
                : await readFile(join(path, entry.name), "utf8"),
            ]),
        ),
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  };
  return {
    project: await directory(join(workspaceRoot, "Game/data")),
    snapshot: await directory(paths.projectDataSnapshotDirectory),
    generated: await directory(paths.generatedProjectDataDirectory),
    manifest: await readFile(paths.syncManifestPath, "utf8"),
    config: await readFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8"),
    descriptor: await readFile(join(workspaceRoot, "Game/Game.rpgproject"), "utf8"),
    sourceTree: await tree(join(workspaceRoot, "src")),
    pendingPush: await tree(paths.pendingPushDirectory),
    files,
    sources: await Promise.all(files.map((file) => readFile(file, "utf8"))),
  };
}

it("MV-S6-SCREEN-001: reconstructs every Screen mode and signed zero through evaluated formal and known raw source and real 15-carrier Push", async () => {
  await withWindowsSandbox("screen-roundtrip", async ({ workspaceRoot }) => {
    const expected = await prepare(workspaceRoot);
    const warnings = vi.spyOn(console, "error");
    try {
      await decompileWorkspace({ workspaceRoot });
      expect(warnings).toHaveBeenCalledWith(expect.stringContaining("MV-E236-BATTLE"));
    } finally {
      warnings.mockRestore();
    }
    const files = await discoverDefinitionFiles(workspaceRoot, discovery);
    expect(files).toHaveLength(4);
    const definitions = (await Promise.all(files.map((file) => loadDefinitionFile(file)))).flat();
    expect(
      definitions.filter((value) => ["commonEvent", "mapEvent", "troopEvent"].includes(value.kind)),
    ).toHaveLength(3);
    const sourcePath = join(workspaceRoot, "src/decompiled/common-events.events.ts");
    const source = await readFile(sourcePath, "utf8");
    for (const expression of [
      "fadeoutScreen()",
      "fadeinScreen()",
      "wait({ frames: 999 })",
      "playMovie({ movie: null })",
      'movieAsset({ name: "Ending" })',
      "red: -255, green: 255, blue: -0, gray: 255",
      "red: -0, green: 0, blue: 255, alpha: -0",
      'weather: "none", power: 9, duration: 999, wait: false',
    ])
      expect(source).toContain(expression);
    const beforeCheck = await state(workspaceRoot);
    await compileWorkspace({ workspaceRoot, check: true });
    expect(await state(workspaceRoot)).toStrictEqual(beforeCheck);
    await compileWorkspace({ workspaceRoot, check: false });
    const paths = getWorkspaceStatePaths(workspaceRoot);
    const expectedGenerated = Object.fromEntries(
      ["CommonEvents.json", "Map001.json", "System.json", "Troops.json"].map((name) => [
        name,
        expected[name],
      ]),
    );
    expect(parseFiles(await directory(paths.generatedProjectDataDirectory))).toStrictEqual(
      expectedGenerated,
    );
    const raw = commands
      .slice(0, -1)
      .map(
        ({ code, indent, parameters }) =>
          `rawDslCommand({ code: ${code}, indent: ${indent}, parameters: ${savedJson(parameters)} })`,
      )
      .join(",\n");
    await writeFile(
      sourcePath,
      `import { commonEvent, rawDslCommand } from "rpgmaker-event-dsl";\nexport const original = commonEvent({ id: 1, name: "Screen Common", trigger: "none", commands: [${raw}] });\n`,
    );
    await compileWorkspace({ workspaceRoot, check: false });
    expect(parseFiles(await directory(paths.generatedProjectDataDirectory))).toStrictEqual(
      expectedGenerated,
    );
    await writeFile(sourcePath, source.replace("Screen Common", "Screen Common edited"));
    await compileWorkspace({ workspaceRoot, check: true });
    await compileWorkspace({ workspaceRoot, check: false });
    expect(await diffWorkspace({ workspaceRoot })).toContain("[changed] commonEventId 1");
    expect(
      JSON.parse(
        await readFile(join(paths.generatedProjectDataDirectory, "CommonEvents.json"), "utf8"),
      )[1].name,
    ).toBe("Screen Common edited");
    await pushWorkspace({ workspaceRoot, allowDestructive: false });
    (expected["CommonEvents.json"] as Array<{ name: string } | null>)[1]!.name =
      "Screen Common edited";
    const installed = await directory(join(workspaceRoot, "Game/data"));
    expect(Object.keys(installed!)).toHaveLength(15);
    expect(parseFiles(installed)).toStrictEqual(expected);
    expect(await directory(paths.projectDataSnapshotDirectory)).toStrictEqual(installed);
  });
});

it("MV-S6-SCREEN-002: rejects evaluated const spread as-any helper and direct Screen inputs while preserving complete Workspace state", async () => {
  await withWindowsSandbox("screen-authored-failure", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    await decompileWorkspace({ workspaceRoot });
    await compileWorkspace({ workspaceRoot, check: false });
    const sourcePath = join(workspaceRoot, "src/decompiled/common-events.events.ts");
    for (const [code, setup, expression, suffix] of [
      [221, "", "(fadeoutScreen as any)({wait:true})", ""],
      [222, "", '{kind:"fadeinScreen",duration:1} as any', ""],
      [
        223,
        "const tone={red:0,green:0,blue:0,gray:0}; const input={tone,duration:1,wait:false,extra:true};",
        "tintScreen({...input} as any)",
        "",
      ],
      [
        223,
        "",
        '{kind:"tintScreen",tone:{red:0,green:0,blue:0,gray:0},duration:1} as any',
        ".wait",
      ],
      [
        224,
        "",
        '{kind:"flashScreen",color:{red:0,green:0,blue:0,alpha:-1},duration:1,wait:false} as any',
        ".color.alpha",
      ],
      [225, "", '{kind:"shakeScreen",power:1,speed:10,duration:1,wait:false} as any', ".speed"],
      [230, "const frames=0; const input={frames};", "wait({...input} as any)", ""],
      [230, "", '{kind:"wait",frames:1000} as any', ".frames"],
      [
        236,
        "",
        '{kind:"setWeatherEffect",weather:"none",power:0,duration:1,wait:true} as any',
        ".power",
      ],
      [236, "", 'setWeatherEffect({weather:"snow",power:1,duration:1,wait:undefined} as any)', ""],
      [261, "const input={movie:null,other:true};", "playMovie({...input} as any)", ""],
      [261, "", '{kind:"playMovie"} as any', ".movie"],
      [261, "", 'playMovie({movie:movieAsset({name:"Ending",extension:"webm"} as any)})', ""],
      [223, "", "rawDslCommand({code:223,parameters:[[0,0,0,256],1,false]})", ".parameters[0][3]"],
      [236, "", 'rawDslCommand({code:236,parameters:["none",0,1,true]})', ".parameters[1]"],
    ] as const) {
      await writeFile(
        sourcePath,
        `import {commonEvent,fadeoutScreen,tintScreen,setWeatherEffect,wait,playMovie,movieAsset,rawDslCommand} from "rpgmaker-event-dsl";\n${setup}\nexport const bad=commonEvent({id:1,name:"Bad",trigger:"none",commands:[${expression}]});\n`,
      );
      const before = await state(workspaceRoot);
      for (const check of [true, false])
        await expect(compileWorkspace({ workspaceRoot, check })).rejects.toThrow(`MV-E${code}`);
      await expect(pushWorkspace({ workspaceRoot, allowDestructive: false })).rejects.toThrow();
      expect(await state(workspaceRoot)).toStrictEqual(before);
      if (suffix)
        await expect(compileWorkspace({ workspaceRoot, check: true })).rejects.toThrow(
          `commands[0]${suffix}`,
        );
    }
  });
});

it("MV-S6-SCREEN-003: rejects late malformed native Screen slots before source publication without changing existing business state", async () => {
  for (const [code, parameters, suffix] of [
    [221, [1], ""],
    [222, [false], ""],
    [223, [[0, 0, 0, 256], 1, true], "[0][3]"],
    [224, [[0, 0, 0, 0], 0, true], "[1]"],
    [225, [1, 10, 1, false], "[1]"],
    [230, [1000], "[0]"],
    [236, ["none", 0, 1, true], "[1]"],
    [261, [null], "[0]"],
  ] as const) {
    await withWindowsSandbox(`screen-late-${code}`, async ({ workspaceRoot }) => {
      const expected = await prepare(workspaceRoot);
      await mkdir(join(workspaceRoot, "src"), { recursive: true });
      await writeFile(join(workspaceRoot, "src/existing.events.ts"), "export {};\n");
      await compileWorkspace({ workspaceRoot, check: false });
      const map = expected["Map001.json"] as {
        events: Array<null | { pages: Array<{ list: SavedCommand[] }> }>;
      };
      map.events[1]!.pages[0]!.list = [
        ...commands.slice(0, -1),
        { code, indent: 0, parameters: [...parameters] },
        { code: 0, indent: 0, parameters: [] },
      ];
      await writeFile(join(workspaceRoot, "Game/data/Map001.json"), savedJson(map));
      await cloneWorkspace({ workspaceRoot });
      const before = await state(workspaceRoot);
      await expect(decompileWorkspace({ workspaceRoot })).rejects.toMatchObject({
        stage: "decompile",
        identity: "map:1/event:1",
        location: {
          nativePath: `pages[0].list[22].parameters${suffix}`,
          expected: expect.any(String),
          actual: expect.any(String),
        },
      });
      expect(await state(workspaceRoot)).toStrictEqual(before);
    });
  }
});
