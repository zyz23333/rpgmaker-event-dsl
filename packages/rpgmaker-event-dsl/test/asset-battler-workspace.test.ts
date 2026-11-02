import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect } from "vitest";
import { createAssetTest, recordAssetInput } from "./support/asset-evidence.js";
import { createMinimalProject, runCli, withWindowsSandbox } from "./support/windows-sandbox.js";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { getWorkspaceStatePaths } from "../src/workspace/state.js";
import { collectActorEnemyAssets } from "../src/validation/asset-actor-enemy-relations.js";
import type { EventAssetUse } from "../src/validation/asset-uses.js";

const {
  initWorkspace,
  cloneWorkspace,
  compileWorkspace,
}: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const it = createAssetTest({ ownerTicket: "08", testSource: import.meta.url });
const imports =
  'import {commonEvent,battleProcessing,troopRef,enemyTransform,enemyRef,changePartyMember,actorRef,rawDslCommand,setVehicleLocation,troopEvent,changeHp,mapRef,comment} from "rpgmaker-event-dsl";';
const source = (command: string) =>
  `${imports}export const event=commonEvent({id:1,name:"Battlers",trigger:"none",commands:[${command}]});`;
const fixed = 'battleProcessing({troop:{kind:"fixed",troop:troopRef({id:1})}})';
const audio = () => ({ name: "", volume: 17, pitch: 73, pan: -41 });
const enemy = (id: number, name: string) => ({
  id,
  name: `Enemy ${id}`,
  battlerName: name,
  battlerHue: 123,
  actions: [{ skillId: 1 }],
  custom: { keep: true },
});
const actor = () => ({
  id: 1,
  name: "Actor",
  characterName: "InitialCharacter",
  characterIndex: 7,
  battlerName: "InitialBattler",
  faceName: "ExcludedFace",
  equips: [1],
  custom: { keep: true },
});
const troop = () => ({
  id: 1,
  name: "Troop",
  members: [
    { enemyId: 1, x: 100, y: 200, hidden: false },
    { enemyId: 2, x: 300, y: 400, hidden: true },
  ],
  pages: [],
});
async function prepare(
  root: string,
  authored: string,
  overrides: Record<string, unknown> = {},
  side = false,
) {
  const fixture = await createMinimalProject(root);
  const files = {
    "Troops.json": [null, troop()],
    "Enemies.json": [null, enemy(1, "VisibleEnemy"), enemy(2, "HiddenEnemy")],
    "Actors.json": [null, actor()],
    "System.json": {
      ...fixture.projectFiles["System.json"],
      optSideView: side,
      battleBgm: audio(),
      victoryMe: audio(),
      defeatMe: audio(),
      sounds: Array.from({ length: 24 }, audio),
    },
    ...overrides,
  };
  recordAssetInput({ source: authored, projectOverrides: files });
  for (const [file, data] of Object.entries(files))
    await writeFile(join(root, "Game/data", file), JSON.stringify(data));
  await initWorkspace({ workspaceRoot: root, projectRoot: "./Game" });
  await cloneWorkspace({ workspaceRoot: root });
  await writeFile(join(root, "src/battlers.events.ts"), authored);
}
async function media(root: string, folder: string, name: string) {
  const path = join(root, "Game/img", folder, `${name}.png`);
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
it("AV.B03.front.formal.member0-battler.missing: fixed Troop uses the selected front Enemy with complete member origin before Compile publication", async () => {
  await withWindowsSandbox("asset-front-member-tracer", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root, source(fixed));
    await media(root, "enemies", "HiddenEnemy");
    const before = await state(root);
    for (const check of [true, false]) {
      const failure = await compileWorkspace({ workspaceRoot: root, check }).then(() => "", String);
      expect(failure).toContain("error MV-ASSET-MISSING-FILE");
      expect(failure).toContain("Troops.json[1].members[0].enemyId");
      expect(failure).toContain("Enemies.json[1].battlerName");
      expect(await state(root)).toEqual(before);
    }
    const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
    expect(cli.exitCode).not.toBe(0);
    expect(cli.stderr).toContain("Enemies.json[1].battlerName");
    await media(root, "enemies", "VisibleEnemy");
    await compileWorkspace({ workspaceRoot: root, check: true });
    await compileWorkspace({ workspaceRoot: root, check: false });
    const actual = await observed(root);
    expect(actual.relations).toEqual({ uses: expectedUses("B03", "front"), problems: [] });
    expect(JSON.parse(actual.external.get("Enemies.json")!)).toEqual([
      null,
      enemy(1, "VisibleEnemy"),
      enemy(2, "HiddenEnemy"),
    ]);
    expect(JSON.parse(actual.files.get("CommonEvents.json")!)[1].list[0]).toEqual({
      code: 301,
      indent: 0,
      parameters: [0, 1, false, false],
    });
  });
});

const commonOrigin = {
  identity: "commonEvent:1",
  nativePath: "CommonEvents.json[1].list[0].parameters[1]",
  relatedNativePaths: [],
};
const memberConditions = ["All saved Troop members are selected, including hidden members."];
const transformConditions = [
  "The runtime enemy target may be absent; the saved replacement Enemy remains selected.",
];
const frontCondition = "Enemy battlers use img/enemies when System.optSideView is false.";
const sideCondition = "Enemy battlers use img/sv_enemies when System.optSideView is true.";
const characterCandidate =
  "Actor initial character image may be replaced by runtime image settings.";
const battlerCandidate = "Actor initial battler image may be replaced by runtime image settings.";
const characterConditions = [
  "The added Actor supplies a player or follower image only when effective in the current party.",
];
const battlerConditions = [
  "Actor battler images apply only in side-view battle and while the Actor is an effective battle member.",
];
function expectedUses(family: string, branch: string): EventAssetUse[] {
  if (family === "B10")
    return [
      {
        ...commonOrigin,
        nativePath: "CommonEvents.json[1].list[0].parameters[0]",
        category: "image",
        folder: "characters",
        name: "InitialCharacter",
        dependencyChain: [
          {
            data: "Actors.json",
            id: 1,
            field: "characterName",
            relationship: "Actor initial character image",
          },
        ],
        conditions: characterConditions,
        candidate: characterCandidate,
      },
      {
        ...commonOrigin,
        nativePath: "CommonEvents.json[1].list[0].parameters[0]",
        category: "image",
        folder: "sv_actors",
        name: "InitialBattler",
        dependencyChain: [
          {
            data: "Actors.json",
            id: 1,
            field: "battlerName",
            relationship: "Actor initial battler image",
          },
        ],
        conditions: battlerConditions,
        candidate: battlerCandidate,
      },
    ];
  const leaf = (
    id: number,
    name: string,
    chain: { data: string; id: number; field: string; relationship: string }[],
    conditions: string[],
  ): EventAssetUse => ({
    ...commonOrigin,
    category: "image",
    folder: branch === "front" ? "enemies" : "sv_enemies",
    name,
    dependencyChain: [
      ...chain,
      { data: "Enemies.json", id, field: "battlerName", relationship: "Enemy battler image" },
    ],
    conditions: [...conditions, branch === "front" ? frontCondition : sideCondition],
  });
  return family === "B04"
    ? [leaf(2, "HiddenEnemy", [], transformConditions)]
    : [
        leaf(
          1,
          "VisibleEnemy",
          [
            {
              data: "Troops.json",
              id: 1,
              field: "members[0].enemyId",
              relationship: "Troop member Enemy",
            },
          ],
          memberConditions,
        ),
        leaf(
          2,
          "HiddenEnemy",
          [
            {
              data: "Troops.json",
              id: 1,
              field: "members[1].enemyId",
              relationship: "Troop member Enemy",
            },
          ],
          memberConditions,
        ),
      ];
}
async function observed(root: string) {
  const paths = getWorkspaceStatePaths(root);
  const files = new Map<string, string>(),
    external = new Map<string, string>();
  for (const file of await readdir(paths.generatedProjectDataDirectory))
    files.set(file, await readFile(join(paths.generatedProjectDataDirectory, file), "utf8"));
  for (const file of await readdir(paths.projectDataSnapshotDirectory))
    external.set(file, await readFile(join(paths.projectDataSnapshotDirectory, file), "utf8"));
  return { files, external, relations: collectActorEnemyAssets(files, external) };
}
type Leaf = {
  family: string;
  branch: string;
  token: string;
  index: number;
  file: string;
  id: number;
  field: string;
};
const reached: Leaf[] = [
  {
    family: "B03",
    branch: "front",
    token: "member0-battler",
    index: 0,
    file: "Enemies.json",
    id: 1,
    field: "battlerName",
  },
  {
    family: "B03",
    branch: "front",
    token: "member1-battler",
    index: 1,
    file: "Enemies.json",
    id: 2,
    field: "battlerName",
  },
  {
    family: "B03",
    branch: "side",
    token: "member0-battler",
    index: 0,
    file: "Enemies.json",
    id: 1,
    field: "battlerName",
  },
  {
    family: "B03",
    branch: "side",
    token: "member1-battler",
    index: 1,
    file: "Enemies.json",
    id: 2,
    field: "battlerName",
  },
  {
    family: "B04",
    branch: "front",
    token: "transformed-battler",
    index: 0,
    file: "Enemies.json",
    id: 2,
    field: "battlerName",
  },
  {
    family: "B04",
    branch: "side",
    token: "transformed-battler",
    index: 0,
    file: "Enemies.json",
    id: 2,
    field: "battlerName",
  },
  {
    family: "B10",
    branch: "add-actor",
    token: "character",
    index: 0,
    file: "Actors.json",
    id: 1,
    field: "characterName",
  },
  {
    family: "B10",
    branch: "add-actor",
    token: "battler",
    index: 1,
    file: "Actors.json",
    id: 1,
    field: "battlerName",
  },
];
function commandFor(field: Leaf, representation: string) {
  if (field.family === "B03")
    return representation === "formal"
      ? fixed
      : "rawDslCommand({code:301,parameters:[0,1,false,false]})";
  if (field.family === "B04")
    return representation === "formal"
      ? 'enemyTransform({target:{kind:"runtimeSelector",scope:"enemy",target:"enemy",index:7},enemy:enemyRef({id:2})})'
      : "rawDslCommand({code:336,parameters:[7,2]})";
  return representation === "formal"
    ? 'changePartyMember({actor:actorRef({id:1}),operation:"add",initialize:false})'
    : "rawDslCommand({code:129,parameters:[1,0,false]})";
}
function leafCase(field: Leaf, representation: string, outcome: string) {
  it(`AV.${field.family}.${field.branch}.${representation}.${field.token}.${outcome}: selected battler field retains exact native directory, complete chain, conditions and candidate policy`, async () => {
    await withWindowsSandbox(
      `asset-${field.family}-${field.branch}-${field.token}-${outcome}`,
      async (sandbox) => {
        const root = sandbox.workspaceRoot,
          expected = expectedUses(field.family, field.branch),
          target = expected[field.index]!;
        await prepare(root, source(commandFor(field, representation)), {}, field.branch === "side");
        for (const [index, item] of expected.entries())
          if (outcome !== "missing" || index !== field.index)
            await media(root, item.folder, item.name);
        await mkdir(join(root, "Game/img", target.folder), { recursive: true });
        if (field.family !== "B10")
          await media(root, field.branch === "front" ? "sv_enemies" : "enemies", target.name);
        const before = await state(root),
          candidate = field.family === "B10";
        for (const check of [true, false]) {
          const failure = await compileWorkspace({ workspaceRoot: root, check }).then(
            () => "",
            String,
          );
          if (outcome === "missing" && !candidate) {
            expect(failure).toContain("error MV-ASSET-MISSING-FILE");
            expect(failure).toContain(`${field.file}[${field.id}].${field.field}`);
            expect(failure).toContain(target.nativePath);
            expect(await state(root)).toEqual(before);
          } else {
            expect(failure).toBe("");
            if (check) expect(await state(root)).toEqual(before);
          }
        }
        const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
        expect(cli.exitCode).toBe(outcome === "missing" && !candidate ? 1 : 0);
        if (outcome === "missing") {
          expect(cli.stderr).toContain(`${candidate ? "warning" : "error"} MV-ASSET-MISSING-FILE`);
          expect(cli.stderr).toContain(`${field.file}[${field.id}].${field.field}`);
          expect(cli.stderr).toContain(target.conditions[0]);
          if (candidate) expect(cli.stderr).toContain(target.candidate);
          else expect(await state(root)).toEqual(before);
          await media(root, target.folder, target.name);
          await compileWorkspace({ workspaceRoot: root, check: false });
        }
        const actual = await observed(root);
        expect(actual.relations).toEqual({ uses: expected, problems: [] });
        expect(JSON.parse(actual.external.get(field.file)!)).toEqual(
          field.family === "B10"
            ? [null, actor()]
            : [null, enemy(1, "VisibleEnemy"), enemy(2, "HiddenEnemy")],
        );
        expect(JSON.parse(actual.files.get("CommonEvents.json")!)[1].list[0]).toEqual(
          field.family === "B03"
            ? { code: 301, indent: 0, parameters: [0, 1, false, false] }
            : field.family === "B04"
              ? { code: 336, indent: 0, parameters: [7, 2] }
              : { code: 129, indent: 0, parameters: [1, 0, false] },
        );
      },
    );
  });
}
leafCase(reached[2]!, "formal", "missing");
leafCase(reached[4]!, "formal", "missing");
leafCase(reached[6]!, "formal", "missing");
for (const field of reached)
  for (const representation of ["formal", "raw"])
    for (const outcome of ["present", "missing"]) {
      if (
        representation === "formal" &&
        outcome === "missing" &&
        [reached[0], reached[2], reached[4], reached[6]].includes(field)
      )
        continue;
      leafCase(field, representation, outcome);
    }

function changed(field: Leaf, value: unknown, remove = false): Record<string, unknown> {
  const table =
    field.family === "B10"
      ? [null, actor()]
      : [null, enemy(1, "VisibleEnemy"), enemy(2, "HiddenEnemy")];
  const entry = table[field.id] as Record<string, unknown>;
  if (remove) delete entry[field.field];
  else entry[field.field] = value;
  return { [field.file]: table };
}
function collected(field: Leaf, overrides: Record<string, unknown>) {
  const command =
    field.family === "B03"
      ? { code: 301, indent: 0, parameters: [0, 1, false, false] }
      : field.family === "B04"
        ? { code: 336, indent: 0, parameters: [7, 2] }
        : { code: 129, indent: 0, parameters: [1, 0, false] };
  const files = new Map([
    ["CommonEvents.json", JSON.stringify([null, { id: 1, name: "Selected", list: [command] }])],
  ]);
  const external = new Map(
    Object.entries({
      "Troops.json": [null, troop()],
      "Enemies.json": [null, enemy(1, "VisibleEnemy"), enemy(2, "HiddenEnemy")],
      "Actors.json": [null, actor()],
      "System.json": { optSideView: field.branch === "side" },
      ...overrides,
    }).map(([file, value]) => [file, JSON.stringify(value)]),
  );
  return collectActorEnemyAssets(files, external);
}
for (const field of reached) {
  const suffix = `${field.family}-${field.branch}-${field.token}`;
  it(`AV.C06.none-indirect.formal.${suffix}.expected: legal empty reached image emits no target and preserves independent saved data`, async () => {
    await withWindowsSandbox(`asset-none-${suffix}`, async (sandbox) => {
      const root = sandbox.workspaceRoot,
        overrides = changed(field, ""),
        all = expectedUses(field.family, field.branch),
        expected = all.filter((_, index) => index !== field.index);
      await prepare(root, source(commandFor(field, "formal")), overrides, field.branch === "side");
      for (const item of expected) await media(root, item.folder, item.name);
      recordAssetInput({ workspaceRoot: root });
      const before = await state(root);
      expect(collected(field, overrides)).toEqual({ uses: expected, problems: [] });
      await compileWorkspace({ workspaceRoot: root, check: true });
      expect(await state(root)).toEqual(before);
      await runCli(sandbox, ["compile", "--check"]);
      await compileWorkspace({ workspaceRoot: root, check: false });
      expect((await observed(root)).relations).toEqual({ uses: expected, problems: [] });
      expect(JSON.parse((await observed(root)).external.get(field.file)!)).toEqual(
        overrides[field.file],
      );
    });
  });
  for (const branch of [
    "target-missing",
    "field-missing",
    "field-wrong-type",
    "field-empty",
    "file-missing",
  ]) {
    it(`AV.C07.${branch}.formal.${suffix}.expected: fixed target, damaged necessary field, None and file fact remain distinct with candidate-independent input errors`, async () => {
      await withWindowsSandbox(`asset-problem-${branch}-${suffix}`, async (sandbox) => {
        const root = sandbox.workspaceRoot,
          all = expectedUses(field.family, field.branch),
          selected = all[field.index]!;
        const overrides =
          branch === "field-missing"
            ? changed(field, undefined, true)
            : branch === "field-wrong-type"
              ? changed(field, 17)
              : branch === "field-empty"
                ? changed(field, "")
                : {};
        const authored =
          branch === "target-missing"
            ? commandFor(field, "formal").replace(field.family === "B04" ? "id:2" : "id:1", "id:3")
            : commandFor(field, "formal");
        await prepare(root, source(authored), overrides, field.branch === "side");
        for (const [index, item] of all.entries())
          if (branch !== "file-missing" || index !== field.index)
            await media(root, item.folder, item.name);
        await mkdir(join(root, "Game/img", selected.folder), { recursive: true });
        recordAssetInput({ workspaceRoot: root });
        const before = await state(root),
          success =
            branch === "field-empty" || (branch === "file-missing" && field.family === "B10");
        for (const check of [true, false]) {
          const failure = await compileWorkspace({ workspaceRoot: root, check }).then(
            () => "",
            String,
          );
          if (success) {
            expect(failure).toBe("");
            if (check) expect(await state(root)).toEqual(before);
          } else {
            expect(failure).toContain(
              branch === "target-missing"
                ? "reference"
                : branch === "file-missing"
                  ? "error MV-ASSET-MISSING-FILE"
                  : "error MV-ASSET-INVALID-DATA",
            );
            if (branch !== "target-missing")
              expect(failure).toContain(`${field.file}[${field.id}].${field.field}`);
            else expect(failure).not.toContain("MV-ASSET-MISSING-FILE");
            expect(await state(root)).toEqual(before);
          }
        }
        const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
        expect(cli.exitCode).toBe(success ? 0 : 1);
        if (branch === "file-missing" && field.family === "B10")
          expect(cli.stderr).toContain("warning MV-ASSET-MISSING-FILE");
        if (!success) expect(await state(root)).toEqual(before);
        if (branch !== "target-missing") {
          const result = collected(field, overrides);
          if (["field-empty", "field-missing", "field-wrong-type"].includes(branch)) {
            expect(result.uses).toEqual(all.filter((_, index) => index !== field.index));
            if (branch === "field-empty") expect(result.problems).toEqual([]);
            else {
              const { category: _category, folder: _folder, name: _name, ...origin } = selected;
              expect(result.problems).toEqual([
                {
                  ...origin,
                  dataPath: `${field.file}[${field.id}].${field.field}`,
                  reason: "Necessary asset name must be a string; this relationship is unchecked.",
                },
              ]);
            }
          } else expect(result).toEqual({ uses: all, problems: [] });
        }
      });
    });
  }
}

it("AV.C04.repeated-enemy.formal.case.expected: repeated Enemy members retain both member chains and one grouped target", async () => {
  await withWindowsSandbox("asset-repeated-enemy", async (sandbox) => {
    const root = sandbox.workspaceRoot,
      selected = troop();
    selected.members[1]!.enemyId = 1;
    await prepare(root, source(fixed), { "Troops.json": [null, selected] });
    recordAssetInput({ workspaceRoot: root });
    await mkdir(join(root, "Game/img/enemies"), { recursive: true });
    const before = await state(root);
    for (const check of [true, false]) {
      const failure = await compileWorkspace({ workspaceRoot: root, check }).then(() => "", String);
      expect(failure).toContain("2 use(s)");
      expect(failure).toContain("Troops.json[1].members[0].enemyId");
      expect(failure).toContain("Troops.json[1].members[1].enemyId");
      expect(await state(root)).toEqual(before);
    }
    const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
    expect(cli.exitCode).toBe(1);
    expect(cli.stderr).toContain("2 use(s)");
    await media(root, "enemies", "VisibleEnemy");
    await compileWorkspace({ workspaceRoot: root, check: false });
    const expected = expectedUses("B03", "front");
    expected[1] = {
      ...expected[1]!,
      name: "VisibleEnemy",
      dependencyChain: [
        {
          data: "Troops.json",
          id: 1,
          field: "members[1].enemyId",
          relationship: "Troop member Enemy",
        },
        { data: "Enemies.json", id: 1, field: "battlerName", relationship: "Enemy battler image" },
      ],
    };
    expect((await observed(root)).relations).toEqual({ uses: expected, problems: [] });
  });
});
for (const [family, branch] of [
  ["C09", "actor-hp"],
  ["C09", "vehicle-position"],
  ["C10", "unrelated-actor"],
  ["C10", "troop-host-only"],
  ["C12", "enemy-ai"],
]) {
  it(`AV.${family}.${branch}.formal.case.expected: excluded operations and associations do not widen asset relationships or external ownership`, async () => {
    await withWindowsSandbox(`asset-scope-${branch}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      const overrides: Record<string, unknown> =
        branch === "vehicle-position"
          ? {
              "MapInfos.json": [null, { id: 1, name: "Destination" }],
              "Map001.json": { width: 1, height: 1, tilesetId: 1, events: [] },
              "Tilesets.json": [null, { id: 1, name: "Tiles" }],
              "System.json": {
                switches: ["", "Switch"],
                variables: [""],
                boat: { characterName: "ExcludedVehicle", bgm: { name: "ExcludedVehicleBgm" } },
              },
            }
          : branch === "unrelated-actor"
            ? {
                "Actors.json": [
                  null,
                  actor(),
                  {
                    id: 2,
                    name: "Unrelated",
                    characterName: 17,
                    battlerName: { invalid: true },
                    faceName: "MissingUnused",
                  },
                ],
              }
            : {};
      const authored =
        branch === "troop-host-only"
          ? `${imports}export const event=troopEvent({troopId:1,pages:[{commands:[]}]});`
          : source(
              branch === "actor-hp"
                ? 'changeHp({target:{kind:"runtimeSelector",scope:"actor",target:"actor",actor:actorRef({id:1})},operation:"lose",value:{kind:"constant",value:99},allowDeath:true})'
                : branch === "vehicle-position"
                  ? 'setVehicleLocation({vehicle:"boat",destination:{kind:"direct",map:mapRef({id:1}),x:0,y:0}})'
                  : branch === "enemy-ai"
                    ? fixed
                    : 'comment({lines:["No selected Actor operation"]})',
            );
      await prepare(root, authored, overrides);
      if (branch === "enemy-ai") {
        await media(root, "enemies", "VisibleEnemy");
        await media(root, "enemies", "HiddenEnemy");
      }
      recordAssetInput({ workspaceRoot: root });
      const before = await state(root);
      await compileWorkspace({ workspaceRoot: root, check: true });
      expect(await state(root)).toEqual(before);
      const cli = await runCli(sandbox, ["compile", "--check"]);
      expect(cli.stderr).not.toContain("MV-ASSET-");
      await compileWorkspace({ workspaceRoot: root, check: false });
      const actual = await observed(root);
      expect(actual.relations).toEqual({
        uses: branch === "enemy-ai" ? expectedUses("B03", "front") : [],
        problems: [],
      });
      if (branch === "troop-host-only")
        expect(JSON.parse(actual.external.get("Troops.json")!)[1].members).toEqual(troop().members);
      if (branch === "unrelated-actor")
        expect(JSON.parse(actual.external.get("Actors.json")!)).toEqual(overrides["Actors.json"]);
      if (branch === "actor-hp")
        expect(JSON.parse(actual.external.get("Actors.json")!)[1]).toEqual(actor());
    });
  });
}
