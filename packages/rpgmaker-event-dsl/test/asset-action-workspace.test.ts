import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, test } from "vitest";
import { createAssetTest, recordAssetInput } from "./support/asset-evidence.js";
import { createMinimalProject, runCli, withWindowsSandbox } from "./support/windows-sandbox.js";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { getWorkspaceStatePaths } from "../src/workspace/state.js";
import { collectForcedActionAssets } from "../src/validation/asset-action-relations.js";
import type { EventAssetUse } from "../src/validation/asset-uses.js";
import { collectEventAssetUses } from "../src/validation/asset-uses.js";

const api: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const it = createAssetTest({ ownerTicket: "11", testSource: import.meta.url });
const imports =
  'import {commonEvent,forceAction,actorRef,skillRef,rawDslCommand,showPicture,imageAsset,callCommonEvent,commonEventRef} from "rpgmaker-event-dsl";';
const common = (id: number, commands: string) =>
  `export const event${id}=commonEvent({id:${id},name:"Action ${id}",trigger:"none",commands:[${commands}]});`;
const picture = (name: string, raw = false) =>
  raw
    ? `rawDslCommand({code:231,parameters:[1,"${name}",0,0,0,0,100,100,255,0]})`
    : `showPicture({pictureId:1,image:imageAsset({folder:"pictures",name:"${name}"}),origin:"upperLeft",position:{kind:"direct",x:0,y:0},scaleX:100,scaleY:100,opacity:255,blendMode:"normal"})`;
const force = (id = 1, enemy = false, raw = false) =>
  raw
    ? `rawDslCommand({code:339,parameters:[${enemy ? 0 : 1},${enemy ? 0 : 1},${id},-1]})`
    : `forceAction({subject:{kind:"runtimeSelector",scope:"battler",target:"${enemy ? "enemy" : "actor"}",${enemy ? "index:0" : "actor:actorRef({id:1})"}},skill:skillRef({id:${id}}),target:{kind:"random"}})`;
const audio = (name = "") => ({ name, volume: 17, pitch: 73, pan: -41 });
const animation = (id: number) => ({
  id,
  name: `Animation ${id}`,
  animation1Name: id === 1 ? "UnarmedFirst" : "SkillFirst",
  animation2Name: id === 1 ? "UnarmedSecond" : "SkillSecond",
  animation1Hue: 123,
  animation2Hue: 234,
  timings: [
    { frame: 0, se: audio(id === 1 ? "UnarmedSound0" : "SkillSound0"), unknown: 17 },
    { frame: 7, se: audio(id === 1 ? "UnarmedSound1" : "SkillSound1"), unknown: 23 },
  ],
  unknown: { keep: true },
});
const skills = () => [
  null,
  { id: 1, name: "Selected", animationId: 2, effects: [], unknown: { keep: true } },
  { id: 2, name: "Default", animationId: -1, effects: [], unknown: { keep: true } },
  { id: 3, name: "No animation", animationId: 0, effects: [], unknown: { keep: true } },
];
function effectSkills(animationId = 2, repeated = false) {
  const table = skills();
  table[1] = {
    ...table[1]!,
    animationId,
    effects: [
      { code: 44, dataId: 10, value1: 17, value2: 23 },
      { code: 44, dataId: repeated ? 10 : 11, value1: 31, value2: 47 },
    ] as never,
  };
  return table;
}
async function prepare(root: string, authored: string, overrides: Record<string, unknown> = {}) {
  const fixture = await createMinimalProject(root);
  const files = {
    "Actors.json": [null, { id: 1, name: "Actor", equips: [99], unknown: { keep: true } }],
    "Animations.json": [null, animation(1), animation(2)],
    "Skills.json": skills(),
    "System.json": {
      ...fixture.projectFiles["System.json"],
      sounds: Array.from({ length: 24 }, (_, index) => audio(index === 9 ? "EnemyAttack" : "")),
    },
    ...overrides,
  };
  recordAssetInput({ workspaceRoot: root, source: authored, projectOverrides: files });
  for (const [file, data] of Object.entries(files))
    await writeFile(join(root, "Game/data", file), JSON.stringify(data));
  await api.initWorkspace({ workspaceRoot: root, projectRoot: "./Game" });
  await api.cloneWorkspace({ workspaceRoot: root });
  await writeFile(join(root, "src/action.events.ts"), imports + authored);
}
async function media(root: string, category: string, folder: string, name: string) {
  const path = join(
    root,
    "Game",
    category === "image" ? "img" : "audio",
    folder,
    `${name}.${category === "image" ? "png" : "ogg"}`,
  );
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, "");
  recordAssetInput({ ordinaryZeroByteFile: path });
}
async function tree(path: string): Promise<Record<string, string> | null> {
  const entries = await readdir(path, { withFileTypes: true }).catch((error: unknown) => {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  });
  if (entries === null) return null;
  const result: Record<string, string> = {};
  for (const entry of entries)
    if (entry.isDirectory())
      for (const [name, value] of Object.entries((await tree(join(path, entry.name)))!))
        result[`${entry.name}/${name}`] = value;
    else result[entry.name] = (await readFile(join(path, entry.name))).toString("base64");
  return result;
}
async function state(root: string) {
  const paths = getWorkspaceStatePaths(root);
  return {
    project: await tree(join(root, "Game")),
    source: await tree(join(root, "src")),
    snapshot: await tree(paths.projectDataSnapshotDirectory),
    generated: await tree(paths.generatedProjectDataDirectory),
    manifest: await readFile(paths.syncManifestPath, "utf8"),
  };
}
async function observed(root: string) {
  const paths = getWorkspaceStatePaths(root);
  const files = new Map<string, string>(),
    external = new Map<string, string>();
  for (const file of await readdir(paths.generatedProjectDataDirectory))
    files.set(file, await readFile(join(paths.generatedProjectDataDirectory, file), "utf8"));
  for (const file of await readdir(paths.projectDataSnapshotDirectory))
    external.set(file, await readFile(join(paths.projectDataSnapshotDirectory, file), "utf8"));
  return { files, external, relations: collectForcedActionAssets(files, external) };
}
const unarmedCandidate = "Animation 1 applies only when the forced Actor has no current weapon.";
const weaponCondition =
  "Current equipped weapons are runtime state; initial Actor equipment does not determine them.";
const weaponStop =
  "The forced Actor's current weapons and their attack animations are runtime state; this branch is unchecked.";
const enemyCondition = "Enemy default attacks use System.sounds[9] rather than an Animation.";
const animationFields = [
  {
    token: "image1",
    field: "animation1Name",
    category: "image",
    folder: "animations",
    names: ["UnarmedFirst", "SkillFirst"],
  },
  {
    token: "image2",
    field: "animation2Name",
    category: "image",
    folder: "animations",
    names: ["UnarmedSecond", "SkillSecond"],
  },
  {
    token: "se0",
    field: "timings[0].se.name",
    category: "audio",
    folder: "se",
    names: ["UnarmedSound0", "SkillSound0"],
  },
  {
    token: "se1",
    field: "timings[1].se.name",
    category: "audio",
    folder: "se",
    names: ["UnarmedSound1", "SkillSound1"],
  },
];
const actionOrigin = {
  identity: "commonEvent:1",
  nativePath: "CommonEvents.json[1].list[0].parameters[2]",
  relatedNativePaths: [],
};
function animationExpected(unarmed: boolean): EventAssetUse[] {
  return animationFields.map((field) => ({
    ...actionOrigin,
    category: field.category as "image" | "audio",
    folder: field.folder as "animations" | "se",
    name: field.names[unarmed ? 0 : 1]!,
    dependencyChain: [
      {
        data: "Skills.json",
        id: unarmed ? 2 : 1,
        field: "animationId",
        relationship: "Forced action Skill animation",
      },
      {
        data: "Animations.json",
        id: unarmed ? 1 : 2,
        field: field.field,
        relationship:
          field.category === "image" ? "Animation image sheet" : "Animation timing sound effect",
      },
    ],
    conditions: [
      ...(unarmed ? [weaponCondition] : []),
      field.category === "image"
        ? "Animation image sheets may be preloaded before the command executes."
        : "Animation timing SE plays only when its frame is reached and duplicate suppression permits playback.",
    ],
    ...(unarmed ? { candidate: unarmedCandidate } : {}),
  }));
}
it("AV.B05.positive-animation.formal.image1.missing: fixed Skill reaches its Animation image before Compile publication", async () => {
  await withWindowsSandbox("asset-action-positive-tracer", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root, common(1, force()));
    await media(root, "image", "animations", "SkillSecond");
    await media(root, "audio", "se", "SkillSound0");
    await media(root, "audio", "se", "SkillSound1");
    const before = await state(root);
    for (const check of [true, false]) {
      const failure = await api
        .compileWorkspace({ workspaceRoot: root, check })
        .then(() => "", String);
      expect(failure).toContain("error MV-ASSET-MISSING-FILE");
      expect(failure).toContain("Skills.json[1].animationId");
      expect(failure).toContain("Animations.json[2].animation1Name");
      expect(await state(root)).toEqual(before);
    }
    const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
    expect(cli.exitCode).toBe(1);
    expect(cli.stderr).toContain("Animations.json[2].animation1Name");
    await media(root, "image", "animations", "SkillFirst");
    await api.compileWorkspace({ workspaceRoot: root, check: false });
    expect((await observed(root)).relations).toEqual(expectedRelations("B05"));
  });
});
it("AV.B06.actor-default.formal.image1.missing: unarmed Animation1 stays a warning candidate while current weapon selection stops explicitly", async () => {
  await withWindowsSandbox("asset-action-unarmed-tracer", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root, common(1, force(2)));
    for (const field of animationFields.slice(1))
      await media(root, field.category, field.folder, field.names[0]!);
    const before = await state(root);
    await api.compileWorkspace({ workspaceRoot: root, check: true });
    expect(await state(root)).toEqual(before);
    const cli = await runCli(sandbox, ["compile", "--check"]);
    expect(cli.stderr).toContain("warning MV-ASSET-MISSING-FILE");
    expect(cli.stderr).toContain(unarmedCandidate);
    expect(cli.stderr).toContain("info MV-ASSET-DYNAMIC-STOP");
    expect(cli.stderr).toContain(weaponStop);
    await api.compileWorkspace({ workspaceRoot: root, check: false });
    expect((await observed(root)).relations).toEqual(expectedRelations("B06"));
    expect(JSON.parse((await observed(root)).external.get("Actors.json")!)[1].equips).toEqual([99]);
  });
});
it("AV.B07.enemy-default.formal.sound9.missing: enemy default attack selects sound9 and never invents an Animation", async () => {
  await withWindowsSandbox("asset-action-enemy-default-tracer", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root, common(1, force(2, true)));
    await mkdir(join(root, "Game/audio/se"), { recursive: true });
    const before = await state(root);
    for (const check of [true, false]) {
      const failure = await api
        .compileWorkspace({ workspaceRoot: root, check })
        .then(() => "", String);
      expect(failure).toContain("error MV-ASSET-MISSING-FILE");
      expect(failure).toContain("System.json.sounds[9].name");
      expect(failure).toContain(enemyCondition);
      expect(failure).not.toContain("Animations.json");
      expect(await state(root)).toEqual(before);
    }
    const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
    expect(cli.exitCode).toBe(1);
    expect(cli.stderr).toContain("System.json.sounds[9].name");
    expect(cli.stderr).not.toContain("MV-ASSET-DYNAMIC-STOP");
    await media(root, "audio", "se", "EnemyAttack");
    await api.compileWorkspace({ workspaceRoot: root, check: false });
    expect((await observed(root)).relations.uses).toEqual([
      {
        ...actionOrigin,
        category: "audio",
        folder: "se",
        name: "EnemyAttack",
        dependencyChain: [
          {
            data: "Skills.json",
            id: 2,
            field: "animationId",
            relationship: "Forced action Skill animation",
          },
          {
            data: "System.json",
            field: "sounds[9].name",
            relationship: "Enemy default attack sound effect",
          },
        ],
        conditions: [enemyCondition],
      },
    ]);
    expect((await observed(root)).relations).toEqual(expectedRelations("B07"));
  });
});
it("AV.B16.skill-common-effects.formal.effect0-picture.missing: all Skill effects retain direct callers while each Common definition owns its picture", async () => {
  await withWindowsSandbox("asset-action-effects-tracer", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(
      root,
      common(1, force()) + common(10, picture("EffectFirst")) + common(11, picture("EffectSecond")),
      { "Skills.json": effectSkills() },
    );
    for (const use of animationExpected(false))
      await media(root, use.category, use.folder, use.name);
    await media(root, "image", "pictures", "EffectSecond");
    const before = await state(root);
    for (const check of [true, false]) {
      const failure = await api
        .compileWorkspace({ workspaceRoot: root, check })
        .then(() => "", String);
      expect(failure).toContain("commonEvent:10 CommonEvents.json[10].list[0].parameters[1]");
      expect(failure).toContain("1 use(s)");
      expect(failure).toContain(
        "commonEvent:1 CommonEvents.json[1].list[0].parameters[2] -> commonEvent:10",
      );
      expect(failure).toContain("Skills.json[1].effects[0].dataId");
      expect(failure).toContain("Skills.json[1].effects[1].dataId");
      expect(await state(root)).toEqual(before);
    }
    const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
    expect(cli.exitCode).toBe(1);
    expect(cli.stderr).toContain("Skills.json[1].effects[0].dataId");
    expect(cli.stderr).toContain("Skills.json[1].effects[1].dataId");
    await media(root, "image", "pictures", "EffectFirst");
    await api.compileWorkspace({ workspaceRoot: root, check: false });
    const actual = await observed(root);
    expect(actual.relations).toEqual(expectedRelations("B16"));
    expect(collectEventAssetUses(actual.files)).toEqual(pictureExpected());
  });
});
test("damaged selected effects report their own fields and continue the safe animation and later Common effects", () => {
  const selected = effectSkills();
  selected[1]!.effects = [
    null,
    { code: 44, dataId: 0 },
    { code: 44, dataId: 11 },
    { code: 21, dataId: "irrelevant" },
  ] as never;
  const files = new Map([
    [
      "CommonEvents.json",
      JSON.stringify([
        null,
        { list: [{ code: 339, indent: 0, parameters: [1, 1, 1, -1] }] },
        ...Array(9).fill(null),
        { list: [] },
      ]),
    ],
  ]);
  const external = new Map(
    Object.entries({
      "Skills.json": selected,
      "Animations.json": [null, animation(1), animation(2)],
    }).map(([file, value]) => [file, JSON.stringify(value)]),
  );
  const result = collectForcedActionAssets(files, external);
  expect(result.uses).toEqual(animationExpected(false));
  expect(result.problems.map(({ dataPath }) => dataPath)).toEqual([
    "Skills.json[1].effects[0].code",
    "Skills.json[1].effects[1].dataId",
  ]);
  expect(result.calls).toEqual([
    {
      caller: "commonEvent:1",
      nativePath: actionOrigin.nativePath,
      target: "commonEvent:11",
      targetId: 11,
      dependencyChain: [
        {
          data: "Skills.json",
          id: 1,
          field: "effects[2].dataId",
          relationship: "Skill Common Event effect",
        },
      ],
    },
  ]);
});

type Leaf = {
  family: string;
  branch: string;
  token: string;
  index: number;
  file: string;
  id?: number;
  field: string;
};
const reached: Leaf[] = [
  ...animationFields.map((field, index) => ({
    family: "B05",
    branch: "positive-animation",
    token: field.token,
    index,
    file: "Animations.json",
    id: 2,
    field: field.field,
  })),
  ...animationFields.map((field, index) => ({
    family: "B06",
    branch: "actor-default",
    token: field.token,
    index,
    file: "Animations.json",
    id: 1,
    field: field.field,
  })),
  {
    family: "B07",
    branch: "enemy-default",
    token: "sound9",
    index: 0,
    file: "System.json",
    field: "sounds[9].name",
  },
  {
    family: "B16",
    branch: "skill-common-effects",
    token: "effect0-picture",
    index: 0,
    file: "CommonEvents.json",
    id: 10,
    field: "list[0].parameters[1]",
  },
  {
    family: "B16",
    branch: "skill-common-effects",
    token: "effect1-picture",
    index: 1,
    file: "CommonEvents.json",
    id: 11,
    field: "list[0].parameters[1]",
  },
];
const leafPath = (field: Leaf) =>
  `${field.file}${field.id === undefined ? "" : `[${field.id}]`}.${field.field}`;
const effectCalls = (repeated = false) =>
  [0, 1].map((index) => ({
    caller: "commonEvent:1",
    nativePath: actionOrigin.nativePath,
    target: `commonEvent:${repeated || index === 0 ? 10 : 11}`,
    targetId: repeated || index === 0 ? 10 : 11,
    dependencyChain: [
      {
        data: "Skills.json",
        id: 1,
        field: `effects[${index}].dataId`,
        relationship: "Skill Common Event effect",
      },
    ],
  }));
const defaultStops = () => [
  {
    ...actionOrigin,
    dependencyChain: [
      {
        data: "Skills.json",
        id: 2,
        field: "animationId",
        relationship: "Forced action Skill animation",
      },
    ],
    conditions: [weaponCondition],
    reason: weaponStop,
  },
];
const enemyExpected = (): EventAssetUse[] => [
  {
    ...actionOrigin,
    category: "audio",
    folder: "se",
    name: "EnemyAttack",
    dependencyChain: [
      {
        data: "Skills.json",
        id: 2,
        field: "animationId",
        relationship: "Forced action Skill animation",
      },
      {
        data: "System.json",
        field: "sounds[9].name",
        relationship: "Enemy default attack sound effect",
      },
    ],
    conditions: [enemyCondition],
  },
];
const pictureExpected = (): EventAssetUse[] =>
  [10, 11].map((id) => ({
    category: "image",
    folder: "pictures",
    name: id === 10 ? "EffectFirst" : "EffectSecond",
    identity: `commonEvent:${id}`,
    nativePath: `CommonEvents.json[${id}].list[0].parameters[1]`,
    relatedNativePaths: [],
    dependencyChain: [],
    conditions: [],
  }));
const selectedUses = (family: string) =>
  family === "B07"
    ? enemyExpected()
    : family === "B16"
      ? pictureExpected()
      : animationExpected(family === "B06");
const expectedRelations = (family: string) => ({
  uses: family === "B16" ? animationExpected(false) : selectedUses(family),
  problems: [],
  calls: family === "B16" ? effectCalls() : [],
  stops: family === "B06" ? defaultStops() : [],
});
function commandFor(family: string, representation = "formal") {
  return force(
    family === "B06" || family === "B07" ? 2 : 1,
    family === "B07",
    representation === "raw",
  );
}
function sourceFor(
  family: string,
  representation = "formal",
  pictureCommand?: { index: number; command: string },
  omit?: number,
) {
  return (
    common(1, commandFor(family, representation)) +
    (family === "B16"
      ? [10, 11]
          .filter((id) => id !== omit)
          .map((id, index) =>
            common(
              id,
              pictureCommand?.index === index
                ? pictureCommand.command
                : picture(id === 10 ? "EffectFirst" : "EffectSecond", representation === "raw"),
            ),
          )
          .join("")
      : "")
  );
}
const basicTracerIds = new Set([
  "B05.positive-animation.formal.image1.missing",
  "B06.actor-default.formal.image1.missing",
  "B07.enemy-default.formal.sound9.missing",
  "B16.skill-common-effects.formal.effect0-picture.missing",
]);
for (const field of reached)
  for (const representation of ["formal", "raw"])
    for (const outcome of ["present", "missing"]) {
      const id = `${field.family}.${field.branch}.${representation}.${field.token}.${outcome}`;
      if (basicTracerIds.has(id)) continue;
      it(`AV.${id}: fixed Skill assets retain complete literal origin, conditions, candidate policy and every effect call`, async () => {
        await withWindowsSandbox(`asset-action-${id}`, async (sandbox) => {
          const root = sandbox.workspaceRoot,
            expected = selectedUses(field.family),
            target = expected[field.index]!;
          await prepare(
            root,
            sourceFor(field.family, representation),
            field.family === "B16" ? { "Skills.json": effectSkills() } : {},
          );
          for (const [index, use] of expected.entries())
            if (outcome !== "missing" || index !== field.index)
              await media(root, use.category, use.folder, use.name);
          if (field.family === "B16")
            for (const use of animationExpected(false))
              await media(root, use.category, use.folder, use.name);
          await mkdir(
            join(root, "Game", target.category === "image" ? "img" : "audio", target.folder),
            { recursive: true },
          );
          const before = await state(root),
            candidate = field.family === "B06";
          for (const check of [true, false]) {
            const failure = await api
              .compileWorkspace({ workspaceRoot: root, check })
              .then(() => "", String);
            if (outcome === "missing" && !candidate) {
              expect(failure).toContain("error MV-ASSET-MISSING-FILE");
              expect(failure).toContain(leafPath(field));
              expect(await state(root)).toEqual(before);
            } else {
              expect(failure).toBe("");
              if (check) expect(await state(root)).toEqual(before);
            }
          }
          const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
          expect(cli.exitCode).toBe(outcome === "missing" && !candidate ? 1 : 0);
          if (outcome === "missing") {
            expect(cli.stderr).toContain(
              `${candidate ? "warning" : "error"} MV-ASSET-MISSING-FILE`,
            );
            expect(cli.stderr).toContain(leafPath(field));
            if (field.family === "B16")
              for (const index of [0, 1])
                expect(cli.stderr).toContain(`Skills.json[1].effects[${index}].dataId`);
            else expect(cli.stderr).toContain(target.conditions.at(-1));
            if (candidate) expect(cli.stderr).toContain(unarmedCandidate);
            if (!candidate) expect(await state(root)).toEqual(before);
            await media(root, target.category, target.folder, target.name);
            await api.compileWorkspace({ workspaceRoot: root, check: false });
          }
          const actual = await observed(root);
          expect(actual.relations).toEqual(expectedRelations(field.family));
          expect(collectEventAssetUses(actual.files)).toEqual(
            field.family === "B16" ? pictureExpected() : [],
          );
          expect(JSON.parse(actual.files.get("CommonEvents.json")!)[1].list[0]).toEqual({
            code: 339,
            indent: 0,
            parameters: [
              field.family === "B07" ? 0 : 1,
              field.family === "B07" ? 0 : 1,
              field.family === "B06" || field.family === "B07" ? 2 : 1,
              -1,
            ],
          });
          expect(JSON.parse(actual.external.get("Skills.json")!)).toEqual(
            field.family === "B16" ? effectSkills() : skills(),
          );
          expect((await state(root)).project).toEqual(before.project);
          expect((await state(root)).source).toEqual(before.source);
          expect((await state(root)).snapshot).toEqual(before.snapshot);
        });
      });
    }

function changed(field: Leaf, value: unknown, remove = false): Record<string, unknown> {
  if (field.family === "B07") {
    const sounds = Array.from({ length: 24 }, (_, index) =>
      audio(index === 9 ? "EnemyAttack" : ""),
    );
    const selected = sounds[9]! as Record<string, unknown>;
    if (remove) delete selected.name;
    else selected.name = value;
    return { "System.json": { switches: [""], variables: [""], sounds, unknown: { keep: true } } };
  }
  const table = [null, animation(1), animation(2)],
    selected = table[field.id!]!;
  if (field.token === "image1" || field.token === "image2") {
    if (remove) delete (selected as Record<string, unknown>)[field.field];
    else (selected as Record<string, unknown>)[field.field] = value;
  } else {
    const sound = selected.timings[field.token === "se0" ? 0 : 1]!.se as Record<string, unknown>;
    if (remove) delete sound.name;
    else sound.name = value;
  }
  return { "Animations.json": table };
}
function synthetic(field: Leaf, overrides: Record<string, unknown>) {
  const table = Array.from({ length: 12 }, () => null as unknown);
  table[1] = {
    list: [
      {
        code: 339,
        indent: 0,
        parameters: [
          field.family === "B07" ? 0 : 1,
          field.family === "B07" ? 0 : 1,
          field.family === "B06" || field.family === "B07" ? 2 : 1,
          -1,
        ],
      },
    ],
  };
  for (const id of [10, 11])
    table[id] = {
      list: [
        {
          code: 231,
          indent: 0,
          parameters: [1, id === 10 ? "EffectFirst" : "EffectSecond", 0, 0, 0, 0, 100, 100, 255, 0],
        },
      ],
    };
  return collectForcedActionAssets(
    new Map([["CommonEvents.json", JSON.stringify(table)]]),
    new Map(
      Object.entries({
        "Skills.json": field.family === "B16" ? effectSkills() : skills(),
        "Animations.json": [null, animation(1), animation(2)],
        "System.json": {
          sounds: Array.from({ length: 24 }, (_, index) => audio(index === 9 ? "EnemyAttack" : "")),
        },
        ...overrides,
      }).map(([file, value]) => [file, JSON.stringify(value)]),
    ),
  );
}
const nonePicture =
  'showPicture({pictureId:1,image:null,origin:"upperLeft",position:{kind:"direct",x:0,y:0},scaleX:-73,scaleY:117,opacity:41,blendMode:"normal"})';
for (const field of reached) {
  const suffix = `${field.family}-${field.branch}-${field.token}`;
  it(`AV.C06.none-indirect.formal.${suffix}.expected: legal None keeps all independent Skill relations and saved controls`, async () => {
    await withWindowsSandbox(`asset-action-none-${suffix}`, async (sandbox) => {
      const root = sandbox.workspaceRoot,
        all = selectedUses(field.family),
        expected = all.filter((_, index) => index !== field.index);
      const overrides =
        field.family === "B16" ? { "Skills.json": effectSkills() } : changed(field, "");
      await prepare(
        root,
        sourceFor(
          field.family,
          "formal",
          field.family === "B16" ? { index: field.index, command: nonePicture } : undefined,
        ),
        overrides,
      );
      for (const use of expected) await media(root, use.category, use.folder, use.name);
      if (field.family === "B16")
        for (const use of animationExpected(false))
          await media(root, use.category, use.folder, use.name);
      const before = await state(root);
      await api.compileWorkspace({ workspaceRoot: root, check: true });
      expect(await state(root)).toEqual(before);
      await runCli(sandbox, ["compile", "--check"]);
      expect(await state(root)).toEqual(before);
      await api.compileWorkspace({ workspaceRoot: root, check: false });
      const actual = await observed(root);
      expect(actual.relations).toEqual({
        ...expectedRelations(field.family),
        uses: field.family === "B16" ? animationExpected(false) : expected,
      });
      expect(collectEventAssetUses(actual.files)).toEqual(field.family === "B16" ? expected : []);
      if (field.family === "B16")
        expect(
          JSON.parse(actual.files.get("CommonEvents.json")!)[field.id!].list[0].parameters,
        ).toEqual([1, "", 0, 0, 0, 0, -73, 117, 41, 0]);
      else expect(JSON.parse(actual.external.get(field.file)!)).toEqual(overrides[field.file]);
      expect((await state(root)).project).toEqual(before.project);
      expect((await state(root)).snapshot).toEqual(before.snapshot);
    });
  });
  for (const branch of [
    "target-missing",
    "field-missing",
    "field-wrong-type",
    "field-empty",
    "file-missing",
  ]) {
    if (branch === "target-missing" && field.family === "B07") continue;
    it(`AV.C07.${branch}.formal.${suffix}.expected: necessary references and fields remain errors while legal None and candidate file facts stay distinct`, async () => {
      await withWindowsSandbox(`asset-action-problem-${branch}-${suffix}`, async (sandbox) => {
        const root = sandbox.workspaceRoot,
          all = selectedUses(field.family),
          selected = all[field.index]!;
        let overrides: Record<string, unknown> =
          field.family === "B16" ? { "Skills.json": effectSkills() } : {};
        let authored = sourceFor(field.family);
        if (branch === "target-missing") {
          if (field.family === "B05") authored = common(1, force(99));
          else if (field.family === "B06")
            overrides = { "Animations.json": [null, null, animation(2)] };
          else authored = sourceFor(field.family, "formal", undefined, field.id);
        } else if (field.family === "B16" && branch.startsWith("field-")) {
          const bad =
            branch === "field-empty"
              ? nonePicture
              : `showPicture({pictureId:1,image:{kind:"asset",category:"image",folder:"pictures"${branch === "field-wrong-type" ? ",name:17" : ""}} as never,origin:"upperLeft",position:{kind:"direct",x:0,y:0},scaleX:100,scaleY:100,opacity:255,blendMode:"normal"})`;
          authored = sourceFor(field.family, "formal", { index: field.index, command: bad });
        } else if (branch.startsWith("field-"))
          overrides = changed(
            field,
            branch === "field-empty" ? "" : 17,
            branch === "field-missing",
          );
        await prepare(root, authored, overrides);
        for (const [index, use] of all.entries())
          if (branch !== "file-missing" || index !== field.index)
            await media(root, use.category, use.folder, use.name);
        if (field.family === "B16")
          for (const use of animationExpected(false))
            await media(root, use.category, use.folder, use.name);
        await mkdir(
          join(root, "Game", selected.category === "image" ? "img" : "audio", selected.folder),
          { recursive: true },
        );
        const before = await state(root),
          success =
            branch === "field-empty" || (branch === "file-missing" && field.family === "B06");
        const code =
          branch === "target-missing" && field.family === "B05"
            ? "MV-E339-REFERENCE"
            : field.family === "B16" && ["field-missing", "field-wrong-type"].includes(branch)
              ? "MV-E231-INPUT"
              : branch === "file-missing"
                ? "MV-ASSET-MISSING-FILE"
                : "MV-ASSET-INVALID-DATA";
        for (const check of [true, false]) {
          const failure = await api
            .compileWorkspace({ workspaceRoot: root, check })
            .then(() => "", String);
          if (success) {
            expect(failure).toBe("");
            if (check) expect(await state(root)).toEqual(before);
          } else {
            expect(failure).toContain(code);
            if (branch !== "target-missing" && code !== "MV-E231-INPUT")
              expect(failure).toContain(leafPath(field));
            if (code !== "MV-ASSET-MISSING-FILE")
              expect(failure).not.toContain("MV-ASSET-MISSING-FILE");
            expect(await state(root)).toEqual(before);
          }
        }
        const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
        expect(cli.exitCode).toBe(success ? 0 : 1);
        if (!success) {
          expect(cli.stderr).toContain(code);
          expect(await state(root)).toEqual(before);
        }
        if (branch === "file-missing" && field.family === "B06")
          expect(cli.stderr).toContain("warning MV-ASSET-MISSING-FILE");
        if (field.family !== "B16" && branch !== "target-missing") {
          const actual = synthetic(field, overrides),
            expected = expectedRelations(field.family);
          if (["field-empty", "field-missing", "field-wrong-type"].includes(branch)) {
            expect(actual.uses).toEqual(all.filter((_, index) => index !== field.index));
            if (branch === "field-empty") expect(actual.problems).toEqual([]);
            else {
              const { category: _category, folder: _folder, name: _name, ...origin } = selected;
              expect(actual.problems).toEqual([
                {
                  ...origin,
                  dataPath: leafPath(field),
                  reason: "Necessary asset name must be a string; this relationship is unchecked.",
                },
              ]);
            }
            expect(actual.calls).toEqual(expected.calls);
            expect(actual.stops).toEqual(expected.stops);
          } else expect(actual).toEqual(expected);
        }
        if (success) {
          const actual = await observed(root);
          expect(actual.relations).toEqual({
            ...expectedRelations(field.family),
            uses:
              field.family === "B16"
                ? animationExpected(false)
                : branch === "field-empty"
                  ? all.filter((_, index) => index !== field.index)
                  : all,
          });
          expect(collectEventAssetUses(actual.files)).toEqual(
            field.family === "B16" ? all.filter((_, index) => index !== field.index) : [],
          );
        }
      });
    });
  }
}

it("AV.C04.repeated-common-effect.formal.case.expected: repeated effects retain separate direct positions and only one defining picture use", async () => {
  await withWindowsSandbox("asset-action-repeated-effects", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root, common(1, force()) + common(10, picture("EffectFirst")), {
      "Skills.json": effectSkills(2, true),
    });
    for (const use of animationExpected(false))
      await media(root, use.category, use.folder, use.name);
    await media(root, "image", "pictures", "EffectFirst");
    await api.compileWorkspace({ workspaceRoot: root, check: false });
    const actual = await observed(root);
    expect(actual.relations).toEqual({
      uses: animationExpected(false),
      problems: [],
      stops: [],
      calls: effectCalls(true),
    });
    expect(collectEventAssetUses(actual.files)).toEqual([pictureExpected()[0]]);
    const before = await state(root);
    await api.compileWorkspace({ workspaceRoot: root, check: true });
    await runCli(sandbox, ["compile", "--check"]);
    expect(await state(root)).toEqual(before);
  });
});
it("AV.C12.initial-equipment.formal.case.expected: saved initial weapons never replace the runtime unknown weapon branch", async () => {
  await withWindowsSandbox("asset-action-initial-equipment", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root, common(1, force(2)), {
      "Weapons.json": [
        null,
        { id: 1, name: "Excluded initial", animationId: 99, unknown: { keep: true } },
      ],
      "Actors.json": [
        null,
        {
          id: 1,
          name: "Actor",
          equips: [1],
          characterName: "ExcludedCharacter",
          battlerName: "ExcludedBattler",
        },
      ],
    });
    for (const use of animationExpected(true))
      await media(root, use.category, use.folder, use.name);
    const before = await state(root);
    await api.compileWorkspace({ workspaceRoot: root, check: true });
    expect(await state(root)).toEqual(before);
    const cli = await runCli(sandbox, ["compile", "--check"]);
    expect(cli.stderr).toContain(weaponStop);
    expect(cli.stderr).not.toContain("Animations.json[99]");
    expect(cli.stderr).not.toContain("MV-ASSET-MISSING");
    await api.compileWorkspace({ workspaceRoot: root, check: false });
    const actual = await observed(root);
    expect(actual.relations).toEqual(expectedRelations("B06"));
    expect(JSON.parse(actual.external.get("Weapons.json")!)[1].animationId).toBe(99);
    expect((await state(root)).project).toEqual(before.project);
    expect((await state(root)).snapshot).toEqual(before.snapshot);
  });
});
