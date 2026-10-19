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
    new URL("./fixtures/mv-evidence/actor-resource-cases.json", import.meta.url),
    "utf8",
  ),
).commands;

function it(name: string, body: () => Promise<void>) {
  test(name, async () => {
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
          "Independent literal actor resource native input",
          "Real public Workspace operations and evaluated source",
          "Complete15-carrier data and applicable refusal-state assertions",
        ],
        expected: name,
        actual: {
          entry: workspaceApiEntry,
          scenario: name.slice(name.indexOf(":") + 1).trim(),
          assertionsCompleted: failure === undefined,
        },
        ...(failure === undefined ? {} : { error: failure }),
      });
    }
  });
}

function savedJson(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) =>
    typeof item === "number" && Object.is(item, -0) ? "__ACTOR_RESOURCE_SIGNED_ZERO__" : item,
  ).replaceAll('"__ACTOR_RESOURCE_SIGNED_ZERO__"', "-0");
}

async function prepare(workspaceRoot: string) {
  const fixture = await createMinimalProject(workspaceRoot);
  const files: Record<string, unknown> = structuredClone(fixture.projectFiles);
  files["Actors.json"] = [
    null,
    { id: 1, name: "Mira", external: { retain: [null, "", 4] } },
    { id: 2, name: "", external: true },
  ];
  files["States.json"] = [
    null,
    { id: 1, name: "Death", external: "retained" },
    { id: 2, name: "", external: [1, null] },
  ];
  const system = files["System.json"] as Record<string, unknown>;
  system.variables = ["", "Unused", "", "TargetSlot", "AmountSlot", ""];
  files["CommonEvents.json"] = [
    null,
    { id: 1, name: "Actor Resources Common", trigger: 0, switchId: 1, list: commands },
  ];
  files["MapInfos.json"] = [null, { id: 1, name: "Actor Resources Map" }];
  files["Tilesets.json"] = [null, { id: 1, name: "Field" }];
  files["Map001.json"] = {
    width: 17,
    height: 13,
    tilesetId: 1,
    external: { retain: [null, "", 9] },
    events: [
      null,
      {
        ...structuredClone(blankEvent),
        name: "Actor Resources Event",
        pages: [{ ...structuredClone(blankPage), list: commands }],
      },
      null,
    ],
  };
  files["Troops.json"] = [
    null,
    {
      id: 1,
      name: "External Actor Resources Troop",
      members: [],
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

function generatedCarriers(expected: Record<string, unknown>) {
  return Object.fromEntries(
    ["CommonEvents.json", "Map001.json", "System.json", "Troops.json"].map((name) => [
      name,
      expected[name],
    ]),
  );
}

function completeCounts(value: Awaited<ReturnType<typeof state>>, generated: boolean) {
  expect(Object.keys(value.project!)).toHaveLength(15);
  expect(Object.keys(value.snapshot!)).toHaveLength(15);
  expect(value.files).toHaveLength(4);
  if (generated) expect(Object.keys(value.generated!)).toHaveLength(4);
}

it("MV-S6-ACTOR-RESOURCES-001: formal actor source evaluates all27 commands in three containers and Check preserves complete state before exact Compile", async () => {
  await withWindowsSandbox("actor-resources-formal", async ({ workspaceRoot }) => {
    const expected = await prepare(workspaceRoot);
    expect(commands).toHaveLength(28);
    await decompileWorkspace({ workspaceRoot });
    const files = await discoverDefinitionFiles(workspaceRoot, discovery);
    expect(files).toHaveLength(4);
    const definitions = (await Promise.all(files.map((file) => loadDefinitionFile(file)))).flat();
    const owned = definitions.filter((value) =>
      ["mapEvent", "commonEvent", "troopEvent"].includes(value.kind),
    );
    expect(owned).toHaveLength(3);
    for (const declaration of owned) {
      const list =
        declaration.kind === "commonEvent"
          ? declaration.commands
          : declaration.kind === "mapEvent"
            ? declaration.pages[0]!.commands
            : declaration.kind === "troopEvent"
              ? declaration.pages[0]!.commands
              : [];
      expect(list).toHaveLength(27);
      expect(list[0]).toStrictEqual({
        kind: "changeHp",
        target: { kind: "runtimeSelector", scope: "actor", target: "entireParty" },
        operation: "gain",
        value: { kind: "constant", value: 1 },
        allowDeath: true,
      });
      expect(list[1]).toStrictEqual({
        kind: "changeHp",
        target: {
          kind: "runtimeSelector",
          scope: "actor",
          target: "actor",
          actor: { kind: "actor", id: 2 },
        },
        operation: "lose",
        value: { kind: "constant", value: 9999 },
        allowDeath: false,
      });
      expect(list[2]).toStrictEqual({
        kind: "changeHp",
        target: {
          kind: "runtimeSelector",
          scope: "actor",
          target: "actorFromVariable",
          variable: { kind: "variable", id: 3 },
        },
        operation: "gain",
        value: { kind: "variable", variable: { kind: "variable", id: 4 } },
        allowDeath: true,
      });
    }
    const sourcePath = join(workspaceRoot, "src/decompiled/common-events.events.ts"),
      source = await readFile(sourcePath, "utf8");
    expect(source).not.toContain("rawDslCommand");
    expect(source).toContain("allowDeath: false");
    expect(source).toContain("actor: actorRef({ id: 2 })");
    expect(source).toContain('value: { kind: "variable", variable: variableRef({ id: 4 }) }');
    const beforeCheck = await state(workspaceRoot);
    completeCounts(beforeCheck, false);
    await compileWorkspace({ workspaceRoot, check: true });
    expect(await state(workspaceRoot)).toStrictEqual(beforeCheck);
    await compileWorkspace({ workspaceRoot, check: false });
    const paths = getWorkspaceStatePaths(workspaceRoot);
    const afterCompile = await state(workspaceRoot);
    completeCounts(afterCompile, true);
    expect(parsed(await directory(paths.generatedProjectDataDirectory))).toStrictEqual(
      generatedCarriers(expected),
    );
    expect(afterCompile.project).toStrictEqual(beforeCheck.project);
    expect(afterCompile.snapshot).toStrictEqual(beforeCheck.snapshot);
    expect(afterCompile.sourceTree).toStrictEqual(beforeCheck.sourceTree);
    expect(afterCompile.files).toStrictEqual(beforeCheck.files);
  });
});

it("MV-S6-ACTOR-RESOURCES-001: named Actor State and Variable references Compile to the complete independently saved carriers", async () => {
  await withWindowsSandbox("actor-resources-named", async ({ workspaceRoot }) => {
    const expected = await prepare(workspaceRoot);
    await decompileWorkspace({ workspaceRoot });
    const sourcePath = join(workspaceRoot, "src/decompiled/common-events.events.ts"),
      source = await readFile(sourcePath, "utf8");
    const namedSource = source
      .replaceAll("actorRef({ id: 1 })", 'actorRef({ name: "Mira" })')
      .replaceAll("variableRef({ id: 3 })", 'variableRef({ name: "TargetSlot" })')
      .replaceAll("variableRef({ id: 4 })", 'variableRef({ name: "AmountSlot" })')
      .replaceAll("stateRef({ id: 1 })", 'stateRef({ name: "Death" })');
    expect(namedSource).not.toBe(source);
    await writeFile(sourcePath, namedSource);
    const before = await state(workspaceRoot);
    completeCounts(before, false);
    await compileWorkspace({ workspaceRoot, check: false });
    const after = await state(workspaceRoot);
    completeCounts(after, true);
    expect(parsed(after.generated)).toStrictEqual(generatedCarriers(expected));
    expect(after.project).toStrictEqual(before.project);
    expect(after.snapshot).toStrictEqual(before.snapshot);
    expect(after.sourceTree).toStrictEqual(before.sourceTree);
    expect(after.files).toStrictEqual(before.files);
  });
});

it("MV-S6-ACTOR-RESOURCES-001: independently authored known raw actor source passes Check without mutation and exactly Compiles all four carriers", async () => {
  await withWindowsSandbox("actor-resources-known-raw", async ({ workspaceRoot }) => {
    const expected = await prepare(workspaceRoot);
    await decompileWorkspace({ workspaceRoot });
    const sourcePath = join(workspaceRoot, "src/decompiled/common-events.events.ts");
    const raw = commands
      .slice(0, -1)
      .map(
        ({ code, indent, parameters }) =>
          `rawDslCommand({ code:${code}, indent:${indent}, parameters:${savedJson(parameters)} })`,
      )
      .join(",\n");
    await writeFile(
      sourcePath,
      `import {commonEvent,rawDslCommand} from "rpgmaker-event-dsl";\nexport const rawResources=commonEvent({id:1,name:"Actor Resources Common",trigger:"none",commands:[${raw}]});\n`,
    );
    const rawBeforeCheck = await state(workspaceRoot);
    completeCounts(rawBeforeCheck, false);
    await compileWorkspace({ workspaceRoot, check: true });
    expect(await state(workspaceRoot)).toStrictEqual(rawBeforeCheck);
    await compileWorkspace({ workspaceRoot, check: false });
    const after = await state(workspaceRoot);
    completeCounts(after, true);
    expect(parsed(after.generated)).toStrictEqual(generatedCarriers(expected));
    expect(after.project).toStrictEqual(rawBeforeCheck.project);
    expect(after.snapshot).toStrictEqual(rawBeforeCheck.snapshot);
    expect(after.sourceTree).toStrictEqual(rawBeforeCheck.sourceTree);
    expect(after.files).toStrictEqual(rawBeforeCheck.files);
  });
});

it("MV-S6-ACTOR-RESOURCES-001: a real actor Common Event edit appears in Diff and Push preserves all15 carriers and source Discovery", async () => {
  await withWindowsSandbox("actor-resources-edit-push", async ({ workspaceRoot }) => {
    const expected = await prepare(workspaceRoot);
    await decompileWorkspace({ workspaceRoot });
    const sourcePath = join(workspaceRoot, "src/decompiled/common-events.events.ts"),
      source = await readFile(sourcePath, "utf8");
    await writeFile(
      sourcePath,
      source.replace("Actor Resources Common", "Actor Resources Common edited"),
    );
    await compileWorkspace({ workspaceRoot, check: false });
    expect(await diffWorkspace({ workspaceRoot })).toContain("[changed] commonEventId 1");
    const beforePush = await state(workspaceRoot);
    completeCounts(beforePush, true);
    (expected["CommonEvents.json"] as Array<null | { name: string }>)[1]!.name =
      "Actor Resources Common edited";
    expect(parsed(beforePush.generated)).toStrictEqual(generatedCarriers(expected));
    await pushWorkspace({ workspaceRoot, allowDestructive: false });
    const paths = getWorkspaceStatePaths(workspaceRoot);
    const installed = await directory(join(workspaceRoot, "Game/data"));
    expect(Object.keys(installed!)).toHaveLength(15);
    expect(parsed(installed)).toStrictEqual(expected);
    expect(await directory(paths.projectDataSnapshotDirectory)).toStrictEqual(installed);
    const afterPush = await state(workspaceRoot);
    completeCounts(afterPush, true);
    expect(afterPush.sourceTree).toStrictEqual(beforePush.sourceTree);
    expect(afterPush.files).toStrictEqual(beforePush.files);
    expect(afterPush.generated).toStrictEqual(beforePush.generated);
  });
});

type SourceCase = [expression: string, code: string, path: string, prelude?: string];
async function refuseSource(label: string, [expression, code, path, prelude = ""]: SourceCase) {
  await withWindowsSandbox(label, async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    await decompileWorkspace({ workspaceRoot });
    await compileWorkspace({ workspaceRoot, check: false });
    const sourcePath = join(workspaceRoot, "src/decompiled/common-events.events.ts");
    await writeFile(
      sourcePath,
      `import {commonEvent,changeHp,changeMp,changeTp,changeState,recoverAll,rawDslCommand,actorRef,stateRef,variableRef} from "rpgmaker-event-dsl";\nconst target={kind:"runtimeSelector",scope:"actor",target:"entireParty"};\nconst quantity={target,operation:"gain",value:{kind:"constant",value:1}};\nconst hp={...quantity,allowDeath:false};\n${prelude}\nexport const entry=commonEvent({id:1,name:"Actor Resources Common",trigger:"none",commands:[recoverAll({target:{kind:"runtimeSelector",scope:"actor",target:"entireParty"}}),${expression}]});\n`,
    );
    const before = await state(workspaceRoot);
    completeCounts(before, true);
    for (const check of [true, false]) {
      const failure: unknown = await compileWorkspace({ workspaceRoot, check }).then(
        () => undefined,
        (error: unknown) => error,
      );
      expect(failure).toBeInstanceOf(Error);
      if (!(failure instanceof Error)) throw new Error("Expected authoritative source refusal");
      expect(failure.message).toContain(code);
      expect(failure.message).toContain(path);
      expect(failure.message).toContain("expected");
      expect(failure.message).toContain("actual");
      expect(await state(workspaceRoot)).toStrictEqual(before);
    }
    await expect(pushWorkspace({ workspaceRoot, allowDestructive: false })).rejects.toThrow(
      /stale before push/u,
    );
    expect(await state(workspaceRoot)).toStrictEqual(before);
  });
}

const helperCases: SourceCase[] = [
  ["changeHp({...quantity} as any)", "MV-E311-INPUT", "changeHp.allowDeath"],
  ["changeHp({...hp,extra:1} as any)", "MV-DSL-SHAPE", "changeHp"],
  [
    "changeHp({...hp,value:{kind:'constant',value:0}} as any)",
    "MV-E311-INPUT",
    "changeHp.value.value",
  ],
  [
    "changeMp({...quantity,value:{kind:'constant',value:10000}} as any)",
    "MV-E312-INPUT",
    "changeMp.value.value",
  ],
  [
    "changeTp({...quantity,value:{kind:'constant',value:101}} as any)",
    "MV-E326-INPUT",
    "changeTp.value.value",
  ],
  ["changeMp({...quantity,value:undefined} as any)", "MV-DSL-SHAPE", "changeMp.value"],
  ["changeMp({...quantity,value:1} as any)", "MV-DSL-SHAPE", "changeMp.value"],
  [
    "changeTp({...quantity,value:{kind:'variable',variable:{kind:'variable',id:0}}} as any)",
    "MV-E326-INPUT",
    "changeTp.value.variable",
  ],
  ["changeState({target,operation:'add'} as any)", "MV-DSL-SHAPE", "changeState.state"],
  [
    "changeState({target,operation:'add',state:{kind:'skill',id:1}} as any)",
    "MV-E313-INPUT",
    "changeState.state",
  ],
  [
    "changeState({target,operation:'remove',state:{kind:'state',id:0}} as any)",
    "MV-E313-INPUT",
    "changeState.state",
  ],
  ["recoverAll({target,operation:'gain'} as any)", "MV-DSL-SHAPE", "recoverAll"],
  ["call({target,discarded:1})", "MV-DSL-SHAPE", "recoverAll", "const call=recoverAll as any;"],
];
for (const [index, value] of helperCases.entries()) {
  it(`MV-S6-ACTOR-RESOURCES-002: original helper case ${index + 1} rejects ${value[0]} through Check Compile and stale Push without complete-state changes`, () =>
    refuseSource(`actor-resources-helper-${index + 1}`, value));
}

const directRawCases: SourceCase[] = [
  [
    "{kind:'changeHp',...hp,allowDeath:undefined} as any",
    "MV-E311-INPUT",
    "commands[1].allowDeath",
  ],
  [
    "{kind:'changeMp',...quantity,operation:'set'} as any",
    "MV-E312-INPUT",
    "commands[1].operation",
  ],
  [
    "{kind:'changeMp',...quantity,target:{kind:'runtimeSelector',scope:'actor',target:'actor',actorId:1}} as any",
    "MV-DSL-SHAPE",
    "commands[1].target",
  ],
  [
    "{kind:'changeTp',...quantity,target:{...target,scope:'enemy'}} as any",
    "MV-E326-INPUT",
    "commands[1].target",
  ],
  [
    "{kind:'changeMp',...quantity,target:{kind:'runtimeSelector',scope:'actor',target:'actor',actor:{kind:'actor',id:3}}} as any",
    "MV-E312-REFERENCE",
    "commands[1].target.actor",
  ],
  [
    "{kind:'changeTp',...quantity,value:{kind:'variable',variable:{kind:'variable',id:9}}} as any",
    "MV-E326-REFERENCE",
    "commands[1].value.variable",
  ],
  [
    "{kind:'changeState',target,operation:'add',state:{kind:'state',id:3}} as any",
    "MV-E313-REFERENCE",
    "commands[1].state",
  ],
  ["{kind:'recoverAll'} as any", "MV-DSL-SHAPE", "commands[1].target"],
  [
    "rawDslCommand({code:311,parameters:[0,0,-0,0,1,false]})",
    "MV-E311-PARAMETERS",
    "commands[1].parameters[2]",
  ],
  [
    "{kind:'rawDslCommand',code:312,parameters:[0,0,0,0,1,0]} as any",
    "MV-E312-PARAMETERS",
    "commands[1].parameters",
  ],
  [
    "rawDslCommand({code:313,parameters:[0,0,0,0]})",
    "MV-E313-PARAMETERS",
    "commands[1].parameters[3]",
  ],
  [
    "{kind:'rawDslCommand',code:314,parameters:[1,0]} as any",
    "MV-E314-PARAMETERS",
    "commands[1].parameters[1]",
  ],
  [
    "rawDslCommand({code:326,parameters:[0,0,0,0,101]})",
    "MV-E326-PARAMETERS",
    "commands[1].parameters[4]",
  ],
  [
    "rawDslCommand({code:311,parameters:[0,3,0,0,1,false]})",
    "MV-E311-REFERENCE",
    "commands[1].parameters[1]",
  ],
  [
    "{kind:'rawDslCommand',code:314,parameters:[1,9]} as any",
    "MV-E314-REFERENCE",
    "commands[1].parameters[1]",
  ],
];
for (const [index, value] of directRawCases.entries()) {
  it(`MV-S6-ACTOR-RESOURCES-003: direct or known raw case ${index + 1} rejects ${value[0]} through Check Compile and stale Push without complete-state changes`, () =>
    refuseSource(`actor-resources-direct-raw-${index + 1}`, value));
}

const nativeCases: [number, unknown[], string, string][] = [
  [311, [-0, 0, 0, 0, 1, false], "PARAMETERS", "[0]"],
  [311, [0, -0, 0, 0, 1, false], "PARAMETERS", "[1]"],
  [311, [0, 0, -0, 0, 1, true], "PARAMETERS", "[2]"],
  [311, [0, 0, 0, -0, 1, false], "PARAMETERS", "[3]"],
  [311, [0, 0, 0, 0, 0, false], "PARAMETERS", "[4]"],
  [311, [0, 2, 0, 0, 10000, false], "PARAMETERS", "[4]"],
  [311, [0, 0, 0, 0, 1, 0], "PARAMETERS", "[5]"],
  [311, [0, 0, 0, 0, 1], "PARAMETERS", ""],
  [312, [0, 0, 0, 0, 10000], "PARAMETERS", "[4]"],
  [312, [1, 0, 0, 0, 1], "PARAMETERS", "[1]"],
  [312, [0, 3, 0, 0, 1], "REFERENCE", "[1]"],
  [313, [0, 0, 2, 1], "PARAMETERS", "[2]"],
  [313, [0, 0, 0, 0], "PARAMETERS", "[3]"],
  [313, [0, 0, 0, 3], "REFERENCE", "[3]"],
  [313, [0, 0, 0], "PARAMETERS", ""],
  [314, [0, 0, 0], "PARAMETERS", ""],
  [314, [2, 0], "PARAMETERS", "[0]"],
  [314, [1, 9], "REFERENCE", "[1]"],
  [326, [0, 0, 0, 0, 101], "PARAMETERS", "[4]"],
  [326, [0, 0, 0, 1, 0], "PARAMETERS", "[4]"],
  [326, [0, 0, 0, 1, 9], "REFERENCE", "[4]"],
];
for (const [index, [code, parameters, diagnostic, suffix]] of nativeCases.entries()) {
  it(`MV-S6-ACTOR-RESOURCES-004: native case ${index + 1} rejects E${code} ${savedJson(parameters)} at list[27].parameters${suffix} before Decompile publication without complete-state changes`, async () => {
    await withWindowsSandbox(`actor-resources-native-${index + 1}`, async ({ workspaceRoot }) => {
      const expected = await prepare(workspaceRoot);
      await decompileWorkspace({ workspaceRoot });
      await rename(join(workspaceRoot, "src/decompiled"), join(workspaceRoot, "src/existing"));
      await compileWorkspace({ workspaceRoot, check: false });
      const carrier = structuredClone(expected["CommonEvents.json"]) as Array<null | {
        list: SavedCommand[];
      }>;
      carrier[1]!.list.splice(27, 0, { code, indent: 0, parameters });
      await writeFile(join(workspaceRoot, "Game/data/CommonEvents.json"), savedJson(carrier));
      await cloneWorkspace({ workspaceRoot });
      const before = await state(workspaceRoot);
      completeCounts(before, true);
      await expect(decompileWorkspace({ workspaceRoot })).rejects.toMatchObject({
        code: `MV-E${code}-${diagnostic}`,
        stage: "decompile",
        identity: "commonEvent:1",
        location: {
          nativePath: `list[27].parameters${suffix}`,
          expected: expect.any(String),
          actual: expect.any(String),
        },
      });
      expect(await state(workspaceRoot)).toStrictEqual(before);
    });
  });
}
