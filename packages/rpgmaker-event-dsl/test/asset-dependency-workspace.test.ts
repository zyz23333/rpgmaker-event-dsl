import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect } from "vitest";
import { createAssetTest, recordAssetInput } from "./support/asset-evidence.js";
import { createMinimalProject, runCli, withWindowsSandbox } from "./support/windows-sandbox.js";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { getWorkspaceStatePaths } from "../src/workspace/state.js";
import { collectAnimationAndTilesetAssets } from "../src/validation/asset-dependencies.js";

const {
  initWorkspace,
  cloneWorkspace,
  compileWorkspace,
}: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const it = createAssetTest({ ownerTicket: "06", testSource: import.meta.url });
const imports =
  'import {mapEvent,showAnimation,showBattleAnimation,changeTileset,animationRef,tilesetRef,rawDslCommand} from "rpgmaker-event-dsl";';
const source = (command: string) =>
  `${imports}export const event=mapEvent({mapId:1,id:1,name:"Dependencies",x:0,y:0,pages:[{conditions:{},trigger:"action",commands:[${command}]}]});`;
const animation = () => ({
  id: 1,
  name: "Animation",
  animation1Name: "First",
  animation2Name: "Second",
  timings: [
    { frame: 0, se: { name: "Timing0", volume: 17, pitch: 73, pan: -41 } },
    { frame: 2, se: { name: "Timing1", volume: 23, pitch: 80, pan: 31 } },
  ],
  custom: { untouched: true },
});
const tileset = () => ({
  id: 1,
  name: "Tiles",
  tilesetNames: ["Tile0", "Tile1", "Tile2", "Tile3", "Tile4", "Tile5", "Tile6", "Tile7", "Tile8"],
  custom: { untouched: true },
});
async function prepare(root: string, authored: string, overrides: Record<string, unknown> = {}) {
  await createMinimalProject(root);
  const files = {
    "MapInfos.json": [null, { id: 1, name: "Dependencies" }],
    "Map001.json": { width: 1, height: 1, tilesetId: 1, events: [] },
    "Animations.json": [null, animation()],
    "Tilesets.json": [null, tileset()],
    ...overrides,
  };
  recordAssetInput({ source: authored, projectOverrides: files });
  for (const [file, data] of Object.entries(files))
    await writeFile(join(root, "Game/data", file), JSON.stringify(data));
  await initWorkspace({ workspaceRoot: root, projectRoot: "./Game" });
  await cloneWorkspace({ workspaceRoot: root });
  await writeFile(join(root, "src/dependencies.events.ts"), authored);
}
async function media(root: string, category: string, folder: string, name: string) {
  const path = join(
    root,
    "Game",
    category === "image" ? "img" : "audio",
    folder,
    `${name}${category === "image" ? ".png" : ".ogg"}`,
  );
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, "");
  recordAssetInput({ ordinaryZeroByteFile: path });
  return path;
}
async function tree(path: string): Promise<Record<string, string> | null> {
  const entries = await readdir(path, { withFileTypes: true }).catch((error: unknown) => {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  });
  if (entries === null) return null;
  const result: Record<string, string> = {};
  for (const entry of entries)
    if (entry.isDirectory()) {
      for (const [name, value] of Object.entries((await tree(join(path, entry.name)))!))
        result[`${entry.name}/${name}`] = value;
    } else result[entry.name] = (await readFile(join(path, entry.name))).toString("base64");
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
const formalAnimation =
  'showAnimation({target:{kind:"runtimeSelector",scope:"character",target:"player"},animation:animationRef({id:1}),wait:false})';
it("AV.B01.show-animation.formal.image1.missing: selected Animation image fails Compile and Check before publication with its defining origin and complete field chain", async () => {
  await withWindowsSandbox("asset-animation-tracer", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root, source(formalAnimation));
    await media(root, "image", "animations", "Second");
    await media(root, "audio", "se", "Timing0");
    await media(root, "audio", "se", "Timing1");
    const before = await state(root);
    for (const check of [true, false]) {
      const failure = await compileWorkspace({ workspaceRoot: root, check }).then(() => "", String);
      expect(failure).toContain("MV-ASSET-MISSING-FILE");
      expect(failure).toContain("Map001.json.events[1].pages[0].list[0].parameters[1]");
      expect(failure).toContain("Animations.json[1].animation1Name");
      expect(failure).toContain("preloaded");
      expect(await state(root)).toEqual(before);
    }
    const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
    expect(cli.exitCode).not.toBe(0);
    expect(cli.stderr).toContain("Animations.json[1].animation1Name");
    await media(root, "image", "animations", "First");
    await compileWorkspace({ workspaceRoot: root, check: true });
  });
});

const origin = {
  identity: "map:1/event:1",
  nativePath: "Map001.json.events[1].pages[0].list[0].parameters[1]",
  relatedNativePaths: [],
};
const imageConditions = ["Animation image sheets may be preloaded before the command executes."];
const timingConditions = [
  "Animation timing SE plays only when its frame is reached and duplicate suppression permits playback.",
];
const animationFields = [
  {
    token: "image1",
    field: "animation1Name",
    category: "image",
    folder: "animations",
    name: "First",
    relationship: "Animation image sheet",
    conditions: imageConditions,
  },
  {
    token: "image2",
    field: "animation2Name",
    category: "image",
    folder: "animations",
    name: "Second",
    relationship: "Animation image sheet",
    conditions: imageConditions,
  },
  {
    token: "se0",
    field: "timings[0].se.name",
    category: "audio",
    folder: "se",
    name: "Timing0",
    relationship: "Animation timing sound effect",
    conditions: timingConditions,
  },
  {
    token: "se1",
    field: "timings[1].se.name",
    category: "audio",
    folder: "se",
    name: "Timing1",
    relationship: "Animation timing sound effect",
    conditions: timingConditions,
  },
];
const animationExpected = () =>
  animationFields.map((field) => ({
    ...origin,
    category: field.category,
    folder: field.folder,
    name: field.name,
    dependencyChain: [
      { data: "Animations.json", id: 1, field: field.field, relationship: field.relationship },
    ],
    conditions: field.conditions,
  }));
async function observed(root: string) {
  const paths = getWorkspaceStatePaths(root);
  const files = new Map<string, string>(),
    external = new Map<string, string>();
  for (const file of await readdir(paths.generatedProjectDataDirectory))
    files.set(file, await readFile(join(paths.generatedProjectDataDirectory, file), "utf8"));
  for (const file of await readdir(paths.projectDataSnapshotDirectory))
    external.set(file, await readFile(join(paths.projectDataSnapshotDirectory, file), "utf8"));
  return { relations: collectAnimationAndTilesetAssets(files, external), files, external };
}
it("AV.B01.show-animation.formal.image2.missing: second Animation image is independent and preserves both timing fields and all event-local origins", async () => {
  await withWindowsSandbox("asset-animation-second", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root, source(formalAnimation));
    await media(root, "image", "animations", "First");
    await mkdir(join(root, "Game/img/animations"), { recursive: true });
    await media(root, "audio", "se", "Timing0");
    await media(root, "audio", "se", "Timing1");
    const before = await state(root);
    const failure = await compileWorkspace({ workspaceRoot: root, check: true }).then(
      () => "",
      String,
    );
    expect(failure).toContain("MV-ASSET-MISSING-FILE");
    expect(failure).toContain("Animations.json[1].animation2Name");
    expect(await state(root)).toEqual(before);
    await media(root, "image", "animations", "Second");
    await compileWorkspace({ workspaceRoot: root, check: false });
    expect((await observed(root)).relations.uses.slice(0, 2)).toEqual(
      animationExpected().slice(0, 2),
    );
  });
});

function animationCommand(branch: string, representation: string) {
  if (representation === "raw")
    return `rawDslCommand({code:${branch === "show-animation" ? 212 : 337},parameters:${branch === "show-animation" ? "[-1,1,false]" : "[0,1,true]"}})`;
  return branch === "show-animation"
    ? formalAnimation
    : 'showBattleAnimation({target:{kind:"runtimeSelector",scope:"enemy",target:"enemy",index:0},animation:animationRef({id:1}),allEnemies:true})';
}
function animationCase(
  branch: string,
  representation: string,
  field: (typeof animationFields)[number],
  outcome: string,
) {
  it(`AV.B01.${branch}.${representation}.${field.token}.${outcome}: each selected Animation field has its own complete origin, condition, file fact and unchanged Check state`, async () => {
    await withWindowsSandbox(`asset-${branch}-${field.token}-${outcome}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      await prepare(root, source(animationCommand(branch, representation)));
      const files = new Map<string, string>();
      for (const item of animationFields)
        files.set(item.token, await media(root, item.category, item.folder, item.name));
      if (outcome === "missing") await rm(files.get(field.token)!);
      const before = await state(root);
      for (const check of [true, false]) {
        const failure = await compileWorkspace({ workspaceRoot: root, check }).then(
          () => "",
          String,
        );
        if (outcome === "missing") {
          expect(failure).toContain("error MV-ASSET-MISSING-FILE");
          expect(failure).toContain(`Animations.json[1].${field.field}`);
          expect(failure).toContain(origin.nativePath);
          expect(failure).toContain(field.conditions[0]);
          expect(failure).toContain(JSON.stringify(field.name));
          expect(await state(root)).toEqual(before);
        } else {
          expect(failure).toBe("");
          if (check) expect(await state(root)).toEqual(before);
        }
      }
      const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
      if (outcome === "missing") {
        expect(cli.exitCode).not.toBe(0);
        expect(cli.stderr).toContain(`Animations.json[1].${field.field}`);
        expect(await state(root)).toEqual(before);
        await media(root, field.category, field.folder, field.name);
        await compileWorkspace({ workspaceRoot: root, check: false });
      } else expect(cli.exitCode).toBe(0);
      const actual = await observed(root);
      expect(actual.relations).toEqual({ uses: animationExpected(), problems: [] });
      expect(JSON.parse(actual.external.get("Animations.json")!)[1]).toEqual(animation());
      expect(JSON.parse(actual.files.get("Map001.json")!).events[1].pages[0].list[0]).toEqual({
        code: branch === "show-animation" ? 212 : 337,
        indent: 0,
        parameters: branch === "show-animation" ? [-1, 1, false] : [0, 1, true],
      });
    });
  });
}
for (const branch of ["show-animation", "show-battle-animation"])
  for (const representation of ["formal", "raw"])
    for (const field of animationFields)
      for (const outcome of ["present", "missing"]) {
        if (
          branch === "show-animation" &&
          representation === "formal" &&
          outcome === "missing" &&
          ["image1", "image2"].includes(field.token)
        )
          continue;
        animationCase(branch, representation, field, outcome);
      }
const tilesetConditions = [
  "All named tileset sheets are requested independently of tiles placed on the map.",
];
const tilesetFields = [
  {
    token: "slot0",
    field: "tilesetNames[0]",
    category: "image",
    folder: "tilesets",
    name: "Tile0",
  },
  {
    token: "slot1",
    field: "tilesetNames[1]",
    category: "image",
    folder: "tilesets",
    name: "Tile1",
  },
  {
    token: "slot2",
    field: "tilesetNames[2]",
    category: "image",
    folder: "tilesets",
    name: "Tile2",
  },
  {
    token: "slot3",
    field: "tilesetNames[3]",
    category: "image",
    folder: "tilesets",
    name: "Tile3",
  },
  {
    token: "slot4",
    field: "tilesetNames[4]",
    category: "image",
    folder: "tilesets",
    name: "Tile4",
  },
  {
    token: "slot5",
    field: "tilesetNames[5]",
    category: "image",
    folder: "tilesets",
    name: "Tile5",
  },
  {
    token: "slot6",
    field: "tilesetNames[6]",
    category: "image",
    folder: "tilesets",
    name: "Tile6",
  },
  {
    token: "slot7",
    field: "tilesetNames[7]",
    category: "image",
    folder: "tilesets",
    name: "Tile7",
  },
  {
    token: "slot8",
    field: "tilesetNames[8]",
    category: "image",
    folder: "tilesets",
    name: "Tile8",
  },
];
const tilesetExpected = () =>
  tilesetFields.map((field) => ({
    ...origin,
    nativePath: "Map001.json.events[1].pages[0].list[0].parameters[0]",
    category: field.category,
    folder: field.folder,
    name: field.name,
    dependencyChain: [
      { data: "Tilesets.json", id: 1, field: field.field, relationship: "Tileset image sheet" },
    ],
    conditions: tilesetConditions,
  }));
const tilesetCommand = (representation: string) =>
  representation === "raw"
    ? "rawDslCommand({code:282,parameters:[1]})"
    : "changeTileset({tileset:tilesetRef({id:1})})";
for (const representation of ["formal", "raw"])
  for (const field of tilesetFields)
    for (const outcome of ["present", "missing"]) {
      it(`AV.B02.change-tileset.${representation}.${field.token}.${outcome}: whole-group Tileset sheets retain every native slot independently of map drawing`, async () => {
        await withWindowsSandbox(`asset-tileset-${field.token}-${outcome}`, async (sandbox) => {
          const root = sandbox.workspaceRoot;
          await prepare(root, source(tilesetCommand(representation)));
          const paths = new Map<string, string>();
          for (const item of tilesetFields)
            paths.set(item.token, await media(root, item.category, item.folder, item.name));
          if (outcome === "missing") await rm(paths.get(field.token)!);
          const before = await state(root);
          for (const check of [true, false]) {
            const failure = await compileWorkspace({ workspaceRoot: root, check }).then(
              () => "",
              String,
            );
            if (outcome === "missing") {
              expect(failure).toContain("error MV-ASSET-MISSING-FILE");
              expect(failure).toContain(`Tilesets.json[1].${field.field}`);
              expect(failure).toContain(tilesetExpected()[0]!.nativePath);
              expect(failure).toContain(tilesetConditions[0]);
              expect(await state(root)).toEqual(before);
            } else {
              expect(failure).toBe("");
              if (check) expect(await state(root)).toEqual(before);
            }
          }
          const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
          if (outcome === "missing") {
            expect(cli.exitCode).not.toBe(0);
            expect(cli.stderr).toContain(`Tilesets.json[1].${field.field}`);
            await media(root, field.category, field.folder, field.name);
            await compileWorkspace({ workspaceRoot: root, check: false });
          } else expect(cli.exitCode).toBe(0);
          const actual = await observed(root);
          expect(actual.relations).toEqual({ uses: tilesetExpected(), problems: [] });
          expect(JSON.parse(actual.external.get("Tilesets.json")!)[1]).toEqual(tileset());
          expect(JSON.parse(actual.files.get("Map001.json")!).events[1].pages[0].list[0]).toEqual({
            code: 282,
            indent: 0,
            parameters: [1],
          });
        });
      });
    }

type ReachedField = {
  family: string;
  branch: string;
  token: string;
  field: string;
  category: string;
  folder: string;
  name: string;
};
const reached: ReachedField[] = [
  ...animationFields.map((field) => ({ ...field, family: "B01", branch: "show-animation" })),
  ...animationFields.map((field) => ({ ...field, family: "B01", branch: "show-battle-animation" })),
  ...tilesetFields.map((field) => ({ ...field, family: "B02", branch: "change-tileset" })),
];
const fieldsFor = (field: ReachedField) =>
  field.family === "B01" ? animationFields : tilesetFields;
const expectedFor = (field: ReachedField) =>
  field.family === "B01" ? animationExpected() : tilesetExpected();
const fileFor = (field: ReachedField) =>
  field.family === "B01" ? "Animations.json" : "Tilesets.json";
const commandFor = (field: ReachedField) =>
  field.family === "B01" ? animationCommand(field.branch, "formal") : tilesetCommand("formal");
function changeField(field: ReachedField, value: unknown, remove = false): Record<string, unknown> {
  const data = field.family === "B01" ? animation() : tileset();
  if (field.token === "image1" || field.token === "image2") {
    if (remove) delete (data as Record<string, unknown>)[field.field];
    else (data as Record<string, unknown>)[field.field] = value;
  } else if (field.token === "se0" || field.token === "se1") {
    const audio = (data as ReturnType<typeof animation>).timings[field.token === "se0" ? 0 : 1]!
      .se as Record<string, unknown>;
    if (remove) delete audio.name;
    else audio.name = value;
  } else
    (data as ReturnType<typeof tileset>).tilesetNames[Number(field.token.slice(4))] =
      value as string;
  return { [fileFor(field)]: [null, data] };
}
function collected(field: ReachedField, overrides: Record<string, unknown>) {
  const command =
    field.family === "B02"
      ? { code: 282, indent: 0, parameters: [1] }
      : {
          code: field.branch === "show-animation" ? 212 : 337,
          indent: 0,
          parameters: field.branch === "show-animation" ? [-1, 1, false] : [0, 1, true],
        };
  const events = new Map([
    ["Map001.json", JSON.stringify({ events: [null, { pages: [{ list: [command] }] }] })],
  ]);
  const external = new Map(
    Object.entries({
      "Animations.json": [null, animation()],
      "Tilesets.json": [null, tileset()],
      ...overrides,
    }).map(([file, value]) => [file, JSON.stringify(value)]),
  );
  return collectAnimationAndTilesetAssets(events, external);
}
for (const field of reached) {
  const suffix = `${field.family}-${field.branch}-${field.token}`;
  it(`AV.C06.none-indirect.formal.${suffix}.expected: legal empty reached name emits no target while independent names and saved controls survive Compile and Check`, async () => {
    await withWindowsSandbox(`asset-none-${suffix}`, async (sandbox) => {
      const root = sandbox.workspaceRoot,
        overrides = changeField(field, "");
      await prepare(root, source(commandFor(field)), overrides);
      for (const sibling of fieldsFor(field))
        if (sibling.token !== field.token)
          await media(root, sibling.category, sibling.folder, sibling.name);
      const expected = expectedFor(field).filter((item) => item.name !== field.name);
      expect(collected(field, overrides)).toEqual({ uses: expected, problems: [] });
      const before = await state(root);
      await compileWorkspace({ workspaceRoot: root, check: true });
      expect(await state(root)).toEqual(before);
      const cli = await runCli(sandbox, ["compile", "--check"]);
      expect(cli.exitCode).toBe(0);
      await compileWorkspace({ workspaceRoot: root, check: false });
      const actual = await observed(root);
      expect(actual.relations).toEqual({ uses: expected, problems: [] });
      expect(JSON.parse(actual.external.get(fileFor(field))!)).toEqual(overrides[fileFor(field)]);
    });
  });
  for (const branch of [
    "target-missing",
    "field-missing",
    "field-wrong-type",
    "field-empty",
    "file-missing",
  ]) {
    it(`AV.C07.${branch}.formal.${suffix}.expected: fixed reference, necessary name, legal None and actual missing file retain distinct outcomes and safe siblings`, async () => {
      await withWindowsSandbox(`asset-problem-${branch}-${suffix}`, async (sandbox) => {
        const root = sandbox.workspaceRoot;
        const overrides =
          branch === "target-missing"
            ? {}
            : branch === "field-missing"
              ? changeField(field, undefined, true)
              : branch === "field-wrong-type"
                ? changeField(field, 17)
                : branch === "field-empty"
                  ? changeField(field, "")
                  : {};
        // Keep host Map's own tileset valid; only the command's fixed target is absent.
        const expression =
          branch === "target-missing"
            ? commandFor(field).replace("id:1", "id:2")
            : commandFor(field);
        await prepare(root, source(expression), overrides);
        for (const item of fieldsFor(field))
          if (branch !== "file-missing" || item.token !== field.token)
            await media(root, item.category, item.folder, item.name);
        const before = await state(root);
        if (branch === "field-empty") {
          await compileWorkspace({ workspaceRoot: root, check: true });
          expect(await state(root)).toEqual(before);
          await runCli(sandbox, ["compile", "--check"]);
          await compileWorkspace({ workspaceRoot: root, check: false });
          expect((await observed(root)).relations).toEqual({
            uses: expectedFor(field).filter((item) => item.name !== field.name),
            problems: [],
          });
        } else {
          for (const check of [true, false]) {
            const failure = await compileWorkspace({ workspaceRoot: root, check }).then(
              () => "",
              String,
            );
            expect(failure).not.toBe("");
            if (branch === "target-missing") {
              expect(failure).toMatch(/reference/iu);
              expect(failure).toMatch(field.family === "B01" ? /animation/iu : /tileset/iu);
              expect(failure).not.toContain("MV-ASSET-MISSING-FILE");
            } else {
              expect(failure).toContain(
                branch === "file-missing"
                  ? "error MV-ASSET-MISSING-FILE"
                  : "error MV-ASSET-INVALID-DATA",
              );
              expect(failure).toContain(`${fileFor(field)}[1].${field.field}`);
              expect(failure).toContain(expectedFor(field)[0]!.nativePath);
            }
            expect(await state(root)).toEqual(before);
          }
          const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
          expect(cli.exitCode).not.toBe(0);
          expect(cli.stderr).toContain(
            branch === "target-missing" ? "reference" : `${fileFor(field)}[1].${field.field}`,
          );
          expect(await state(root)).toEqual(before);
          if (branch !== "target-missing" && branch !== "file-missing") {
            const actual = collected(field, overrides);
            const expected = expectedFor(field),
              failed = expected.find((item) => item.name === field.name)!;
            expect(actual.uses).toEqual(expected.filter((item) => item.name !== field.name));
            expect(actual.problems).toEqual([
              {
                identity: failed.identity,
                nativePath: failed.nativePath,
                relatedNativePaths: [],
                dependencyChain: failed.dependencyChain,
                conditions: failed.conditions,
                dataPath: `${fileFor(field)}[1].${field.field}`,
                reason: "Necessary asset name must be a string; this relationship is unchecked.",
              },
            ]);
          }
        }
      });
    });
  }
}

it("AV.C04.repeated-tileset-name.formal.case.expected: nine same-name slots remain nine different dependency chains within one file diagnostic group", async () => {
  await withWindowsSandbox("asset-repeated-tileset", async (sandbox) => {
    const root = sandbox.workspaceRoot,
      repeated = { ...tileset(), tilesetNames: Array(9).fill("Shared") };
    await prepare(root, source(tilesetCommand("formal")), { "Tilesets.json": [null, repeated] });
    await mkdir(join(root, "Game/img/tilesets"), { recursive: true });
    for (const check of [true, false]) {
      const failure = await compileWorkspace({ workspaceRoot: root, check }).then(() => "", String);
      expect(failure).toContain("9 use(s)");
      for (const field of tilesetFields)
        expect(failure).toContain(`Tilesets.json[1].${field.field}`);
    }
    const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
    expect(cli.exitCode).not.toBe(0);
    expect(cli.stderr).toContain("9 use(s)");
    await media(root, "image", "tilesets", "Shared");
    await compileWorkspace({ workspaceRoot: root, check: false });
    expect((await observed(root)).relations).toEqual({
      uses: tilesetExpected().map((item) => ({ ...item, name: "Shared" })),
      problems: [],
    });
  });
});
for (const branch of ["unrelated-animation", "unrelated-field"]) {
  it(`AV.C10.${branch}.formal.case.expected: only selected necessary fields are interpreted and external unknown values remain untouched`, async () => {
    await withWindowsSandbox(`asset-${branch}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      const selected =
        branch === "unrelated-field"
          ? {
              ...animation(),
              animation1Hue: { notNeeded: true },
              frames: 17,
              timings: animation().timings.map((timing) => ({
                ...timing,
                frame: "not-interpreted",
                flashScope: { custom: true },
              })),
            }
          : animation();
      const unrelated = {
        id: 2,
        name: "Unselected",
        animation1Name: { broken: true },
        animation2Name: 17,
        timings: null,
      };
      await prepare(root, source(formalAnimation), {
        "Animations.json": [null, selected, unrelated],
      });
      for (const field of animationFields)
        await media(root, field.category, field.folder, field.name);
      // The live standard data is deliberately newer; Compile uses the captured Snapshot.
      await writeFile(
        join(root, "Game/data/Animations.json"),
        JSON.stringify([null, { ...animation(), animation1Name: "NewLiveName" }]),
      );
      const before = await state(root);
      await compileWorkspace({ workspaceRoot: root, check: true });
      expect(await state(root)).toEqual(before);
      await runCli(sandbox, ["compile", "--check"]);
      await compileWorkspace({ workspaceRoot: root, check: false });
      const actual = await observed(root);
      expect(actual.relations).toEqual({ uses: animationExpected(), problems: [] });
      expect(JSON.parse(actual.external.get("Animations.json")!)).toEqual([
        null,
        selected,
        unrelated,
      ]);
      expect(await readFile(join(root, "Game/data/Animations.json"), "utf8")).toContain(
        "NewLiveName",
      );
      // No captured external event carrier can introduce roots absent from candidate events.
      const polluted = new Map(actual.external);
      polluted.set(
        "CommonEvents.json",
        JSON.stringify([
          null,
          { id: 9, name: "Removed", list: [{ code: 212, indent: 0, parameters: [-1, 2, false] }] },
        ]),
      );
      expect(collectAnimationAndTilesetAssets(actual.files, polluted)).toEqual({
        uses: animationExpected(),
        problems: [],
      });
    });
  });
}
