import { readFile, readdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it as test } from "vitest";
import { recordEvidence } from "./support/mv-evidence.js";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
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
    new URL("./fixtures/mv-evidence/battle-command-cases.json", import.meta.url),
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
            "Independent literal native enemy and battle input",
            "Real public Workspace operations and evaluated source",
            "Complete15-carrier data, diagnostics and applicable business-state assertions",
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

function savedJson(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) =>
    typeof item === "number" && Object.is(item, -0) ? "__AUDIO_SIGNED_ZERO__" : item,
  ).replaceAll('"__AUDIO_SIGNED_ZERO__"', "-0");
}

async function prepare(workspaceRoot: string) {
  const fixture = await createMinimalProject(workspaceRoot);
  const files: Record<string, unknown> = structuredClone(fixture.projectFiles);
  for (const file of [
    "Actors.json",
    "Animations.json",
    "Enemies.json",
    "Skills.json",
    "States.json",
  ])
    files[file] = [null, { id: 1, name: "Saved reference" }];
  (files["System.json"] as { variables: string[] }).variables = ["", ""];
  files["CommonEvents.json"] = [
    null,
    { id: 1, name: "Battle Common", trigger: 0, switchId: 1, list: commands },
  ];
  files["MapInfos.json"] = [null, { id: 1, name: "Battle Map" }];
  files["Tilesets.json"] = [null, { id: 1, name: "Field" }];
  files["Map001.json"] = {
    width: 17,
    height: 13,
    tilesetId: 1,
    external: { retain: [null, "", 9] },
    encounterList: [],
    events: [
      null,
      {
        ...structuredClone(blankEvent),
        name: "Battle Event",
        pages: [{ ...structuredClone(blankPage), list: commands }],
      },
      null,
    ],
  };
  files["Troops.json"] = [
    null,
    {
      id: 1,
      name: "External troop",
      members: [
        { enemyId: 1, x: 100, y: 200, hidden: true },
        { enemyId: 1, x: 300, y: 200, hidden: false },
      ],
      external: { retain: true },
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
          list: commands,
        },
      ],
    },
  ];
  for (const [name, value] of Object.entries(files))
    await writeFile(join(workspaceRoot, "Game/data", name), savedJson(value));
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
function parsed(files: Record<string, string> | null) {
  return files === null
    ? null
    : Object.fromEntries(Object.entries(files).map(([name, bytes]) => [name, JSON.parse(bytes)]));
}
async function tree(path: string): Promise<Record<string, unknown> | null> {
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
}
async function state(workspaceRoot: string) {
  const paths = getWorkspaceStatePaths(workspaceRoot),
    files = await discoverDefinitionFiles(workspaceRoot, discovery);
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

it("MV-S6-BATTLE-001: preserves Enemy selectors and nested Battle bodies through evaluated formal and raw source and complete Push", async () => {
  await withWindowsSandbox("battle-roundtrip", async ({ workspaceRoot }) => {
    const expected = await prepare(workspaceRoot);
    await decompileWorkspace({ workspaceRoot });
    const files = await discoverDefinitionFiles(workspaceRoot, discovery);
    expect(files).toHaveLength(4);
    const definitions = (await Promise.all(files.map((file) => loadDefinitionFile(file)))).flat();
    expect(
      definitions.filter((value) => ["mapEvent", "commonEvent", "troopEvent"].includes(value.kind)),
    ).toHaveLength(3);
    const sourcePath = join(workspaceRoot, "src/decompiled/common-events.events.ts");
    const source = await readFile(sourcePath, "utf8");
    for (const expression of [
      "index: 7 }, animation: animationRef({ id: 1 }), allEnemies: true",
      'kind: "fixed"',
      'kind: "variable"',
      'kind: "randomEncounter"',
      'kind: "lastTarget"',
      'kind: "random"',
      'kind: "index", index: 7',
      'endMarker: "absent"',
    ])
      expect(source).toContain(expression);
    expect(source).not.toContain("rawDslCommand");
    const before = await state(workspaceRoot);
    await compileWorkspace({ workspaceRoot, check: true });
    expect(await state(workspaceRoot)).toStrictEqual(before);
    await compileWorkspace({ workspaceRoot, check: false });
    const paths = getWorkspaceStatePaths(workspaceRoot);
    const generated = Object.fromEntries(
      ["CommonEvents.json", "Map001.json", "System.json", "Troops.json"].map((name) => [
        name,
        expected[name],
      ]),
    );
    expect(parsed(await directory(paths.generatedProjectDataDirectory))).toStrictEqual(generated);
    expect(await diffWorkspace({ workspaceRoot, short: true })).toContain("No changes.");
    const raw = commands
      .slice(0, -1)
      .map(
        ({ code, indent, parameters }) =>
          `rawDslCommand({code:${code},indent:${indent},parameters:${savedJson(parameters)}})`,
      )
      .join(",\n");
    await writeFile(
      sourcePath,
      `import {commonEvent,rawDslCommand} from "rpgmaker-event-dsl";\nexport const rawBattle=commonEvent({id:1,name:"Battle Common",trigger:"none",commands:[${raw}]});\n`,
    );
    await compileWorkspace({ workspaceRoot, check: false });
    expect(parsed(await directory(paths.generatedProjectDataDirectory))).toStrictEqual(generated);
    await writeFile(sourcePath, source.replace("Battle Common", "Battle Common edited"));
    await compileWorkspace({ workspaceRoot, check: false });
    expect(await diffWorkspace({ workspaceRoot })).toContain("[changed] commonEventId 1");
    await pushWorkspace({ workspaceRoot, allowDestructive: false });
    (expected["CommonEvents.json"] as Array<null | { name: string }>)[1]!.name =
      "Battle Common edited";
    const installed = await directory(join(workspaceRoot, "Game/data"));
    expect(Object.keys(installed!)).toHaveLength(15);
    expect(parsed(installed)).toStrictEqual(expected);
    expect(await directory(paths.projectDataSnapshotDirectory)).toStrictEqual(installed);
  });
});

it("MV-S6-BATTLE-002: rejects evaluated malformed helper direct raw reference and nested Gate sources without publishing business state", async () => {
  const cases: Array<[string, string, string, string?]> = [
    ["changeEnemyHp({...hp,allowDeath:undefined} as any)", "MV-E331", "changeEnemyHp.allowDeath"],
    ["enemyAppear({target:all} as any)", "MV-E335", "enemyAppear.target"],
    [
      'forceAction({subject:{kind:"runtimeSelector",scope:"battler",target:"actor",actor:actorRef({id:99})},skill:skillRef({id:1}),target:{kind:"random"}})',
      "MV-E339-REFERENCE",
      "commands[1].subject.actor",
    ],
    [
      '{kind:"forceAction",subject:{kind:"runtimeSelector",scope:"battler",target:"enemy",index:8},skill:skillRef({id:1}),target:{kind:"random"}} as any',
      "MV-E339",
      "commands[1].subject.index",
    ],
    [
      'battleProcessing({troop:{kind:"randomEncounter"},canEscape:true,win:{commands:[]},escape:{commands:[],endMarker:"absent"}} as any)',
      "MV-E301",
      "battleProcessing.escape.endMarker",
    ],
    [
      'battleProcessing({troop:{kind:"randomEncounter"},canLose:true,win:{commands:[]},lose:{commands:[script({code:"0"})]}})',
      "Script commands require explicit config enablement",
      "",
    ],
    ["rawDslCommand({code:337,parameters:[7,1,1]})", "MV-E337", "commands[1].parameters[2]"],
    [
      "call(value)",
      "MV-DSL-SHAPE",
      "enemyAppear",
      "const call=enemyAppear as any; const value={target:single,discarded:true};",
    ],
    [
      "call(value)",
      "MV-DSL-SHAPE",
      "enemyAppear.target",
      "const call=enemyAppear as any; const value={target:{...single,hidden:true}};",
    ],
    ['{kind:"abortBattle",extra:true} as any', "MV-DSL-SHAPE", "commands[1]"],
  ];
  await withWindowsSandbox("battle-source-refusal", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    await decompileWorkspace({ workspaceRoot });
    await compileWorkspace({ workspaceRoot, check: false });
    const path = join(workspaceRoot, "src/decompiled/common-events.events.ts");
    for (const [expression, code, location, prelude = ""] of cases) {
      await writeFile(
        path,
        `import {commonEvent,comment,changeEnemyHp,changeEnemyMp,enemyAppear,enemyTransform,showBattleAnimation,forceAction,battleProcessing,rawDslCommand,script,actorRef,enemyRef,animationRef,skillRef} from "rpgmaker-event-dsl";\nconst single={kind:"runtimeSelector",scope:"enemy",target:"enemy",index:7} as const;\nconst all={kind:"runtimeSelector",scope:"enemy",target:"all"} as const;\nconst hp={target:single,operation:"gain",value:{kind:"constant",value:1},allowDeath:false} as const;\n${prelude}\nexport const entry=commonEvent({id:1,name:"Battle Common",trigger:"none",commands:[comment({ lines: ["valid prefix"] }),${expression}]});\n`,
      );
      const before = await state(workspaceRoot);
      for (const check of [true, false]) {
        const error = await compileWorkspace({ workspaceRoot, check }).then(
          () => undefined,
          (error) => error,
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain(code);
        expect(error.message).toContain(location);
        expect(await state(workspaceRoot)).toStrictEqual(before);
      }
      await expect(pushWorkspace({ workspaceRoot, allowDestructive: false })).rejects.toThrow(
        /stale before push/,
      );
      expect(await state(workspaceRoot)).toStrictEqual(before);
    }
  });
});

it("MV-S6-BATTLE-003: refuses late malformed Enemy and Battle native records before Decompile publication", async () => {
  const cases: Array<[number, unknown[]]> = [
    [331, [0, 0, 0, 1]],
    [332, [0, 0, 0, 10000]],
    [333, [-2, 0, 1]],
    [334, [8]],
    [335, [-1]],
    [336, [-1, 1]],
    [337, [7, 1]],
    [342, [0, 0, 0, 101]],
    [339, [0, 0, 1, 8]],
    [340, [0]],
    [301, [2, 1, false, false]],
  ];
  await withWindowsSandbox("battle-native-refusal", async ({ workspaceRoot }) => {
    const expected = await prepare(workspaceRoot);
    await decompileWorkspace({ workspaceRoot });
    await rename(join(workspaceRoot, "src/decompiled"), join(workspaceRoot, "src/existing"));
    await compileWorkspace({ workspaceRoot, check: false });
    for (const [code, parameters] of cases) {
      const carrier = structuredClone(expected["CommonEvents.json"]) as Array<null | {
        list: SavedCommand[];
      }>;
      carrier[1]!.list.splice(12, 0, { code, indent: 0, parameters });
      await writeFile(join(workspaceRoot, "Game/data/CommonEvents.json"), savedJson(carrier));
      await cloneWorkspace({ workspaceRoot });
      const before = await state(workspaceRoot);
      await expect(decompileWorkspace({ workspaceRoot })).rejects.toMatchObject({
        code: `MV-E${code}`,
        stage: "decompile",
        identity: "commonEvent:1",
        location: {
          nativePath: expect.stringContaining("list[12].parameters"),
          expected: expect.any(String),
          actual: expect.any(String),
        },
      });
      expect(await state(workspaceRoot)).toStrictEqual(before);
    }
  });
});
