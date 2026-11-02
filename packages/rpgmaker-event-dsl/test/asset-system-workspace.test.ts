import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, vi } from "vitest";
import { createAssetTest, recordAssetInput } from "./support/asset-evidence.js";
import { createMinimalProject, runCli, withWindowsSandbox } from "./support/windows-sandbox.js";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { getWorkspaceStatePaths } from "../src/workspace/state.js";
import { collectSystemAssets } from "../src/validation/asset-system-relations.js";
import { verifyForcedActionSibling } from "./support/asset-action-scenarios.js";

const {
  initWorkspace,
  cloneWorkspace,
  compileWorkspace,
}: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const it = createAssetTest({ ownerTicket: "09", testSource: import.meta.url });
const sharedIt = createAssetTest({ ownerTicket: "09,11", testSource: import.meta.url });
const source = (command: string) =>
  `import {mapEvent,commonEvent,troopEvent,gameOver,returnToTitleScreen,battleProcessing,troopRef,variableRef,rawDslCommand} from "rpgmaker-event-dsl";export const event=mapEvent({mapId:1,id:1,name:"System",x:0,y:0,pages:[{conditions:{},trigger:"action",commands:[${command}]}]});`;
const audio = (name: string) => ({ name, volume: 21, pitch: 71, pan: -31 });
const systemData = () => ({
  gameoverMe: audio("GameOver"),
  title1Name: "TitleOne",
  title2Name: "TitleTwo",
  titleBgm: audio("TitleMusic"),
  battleBgm: audio("BattleMusic"),
  victoryMe: audio("Victory"),
  defeatMe: audio("Defeat"),
  sounds: Array.from({ length: 10 }, (_, index) => audio(index === 7 ? "BattleStart" : "")),
  optSideView: false,
  hasEncryptedImages: false,
  hasEncryptedAudio: false,
});
// Canonical shared C05 callbacks: ticket11 appends independent Skill/weapon scenarios here.
sharedIt(
  "AV.C05.dynamic-target.formal.case.expected: variable and encounter Troop selections retain a finite unchecked stop and known System relationships",
  async () => {
    for (const selector of [
      '{kind:"variable",variable:variableRef({id:1})}',
      '{kind:"randomEncounter"}',
    ])
      await withWindowsSandbox("asset-dynamic-troop", async (sandbox) => {
        const root = sandbox.workspaceRoot;
        await prepare(
          root,
          source(battleCommand.replace('{kind:"fixed",troop:troopRef({id:1})}', selector)),
          { variables: ["", "Runtime troop"] },
        );
        for (const field of [...backgroundFields, ...battleFields]) await media(root, field);
        const before = await state(root);
        const cli = await runCli(sandbox, ["compile", "--check"]);
        expect(cli.stderr).toContain("info MV-ASSET-DYNAMIC-STOP");
        expect(cli.stderr).toContain(
          "Troop target is selected at runtime; the Troop/Enemy asset relationship is unchecked.",
        );
        expect(cli.stderr).toContain("Map001.json.events[1].pages[0].list[0].parameters[0]");
        expect(await state(root)).toEqual(before);
        await compileWorkspace({ workspaceRoot: root, check: false });
        const actual = (await observed(root)).relations;
        expect(actual.uses).toEqual(expected([...backgroundFields, ...battleFields]));
        expect(actual.problems).toEqual([]);
        expect(actual.stops).toEqual([
          {
            identity: "map:1/event:1",
            nativePath: "Map001.json.events[1].pages[0].list[0].parameters[0]",
            relatedNativePaths: [],
            dependencyChain: [],
            conditions: [],
            reason:
              "Troop target is selected at runtime; the Troop/Enemy asset relationship is unchecked.",
          },
        ]);
      });
    await verifyForcedActionSibling("dynamic-target");
  },
);
const mapData = () => ({
  width: 1,
  height: 1,
  tilesetId: 1,
  specifyBattleback: true,
  battleback1Name: "BackOne",
  battleback2Name: "BackTwo",
  events: [],
  custom: { retain: [null, 17] },
});
async function prepare(
  root: string,
  authored: string,
  system: Record<string, unknown> = {},
  overrides: Record<string, unknown> = {},
) {
  const fixture = await createMinimalProject(root);
  const files = {
    "System.json": { ...fixture.projectFiles["System.json"], ...systemData(), ...system },
    "MapInfos.json": [null, { id: 1, name: "System" }],
    "Map001.json": mapData(),
    "Troops.json": [null, { id: 1, name: "Selected troop", members: [], pages: [] }],
    ...overrides,
  };
  recordAssetInput({ source: authored, projectOverrides: files });
  for (const [file, data] of Object.entries(files))
    await writeFile(join(root, "Game/data", file), JSON.stringify(data));
  await initWorkspace({ workspaceRoot: root, projectRoot: "./Game" });
  await cloneWorkspace({ workspaceRoot: root });
  await writeFile(join(root, "src/system.events.ts"), authored);
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
    source: await tree(join(root, "src")),
    config: await readFile(join(root, "rpgmaker-event-dsl.config.json"), "utf8"),
    project: await tree(join(root, "Game")),
    snapshot: await tree(paths.projectDataSnapshotDirectory),
    generated: await tree(paths.generatedProjectDataDirectory),
    manifest: await readFile(paths.syncManifestPath, "utf8"),
    pending: await tree(paths.pendingPushDirectory),
  };
}
it("AV.B11.game-over.formal.gameover-me.missing: Game Over selects its saved System ME and fails Compile and Check before publication with the defining event origin", async () => {
  await withWindowsSandbox("asset-system-tracer", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root, source("gameOver()"));
    await mkdir(join(root, "Game/audio/me"), { recursive: true });
    const before = await state(root);
    for (const check of [true, false]) {
      const failure = await compileWorkspace({ workspaceRoot: root, check }).then(() => "", String);
      expect(failure).toContain("error MV-ASSET-MISSING-FILE");
      expect(failure).toContain("System.json.gameoverMe.name");
      expect(failure).toContain("Map001.json.events[1].pages[0].list[0]");
      expect(await state(root)).toEqual(before);
    }
    const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
    expect(cli.exitCode).not.toBe(0);
    expect(cli.stderr).toContain("System.json.gameoverMe.name");
    await media(root, gameoverFields[0]!);
    const repaired = await state(root);
    await compileWorkspace({ workspaceRoot: root, check: false });
    expect((await observed(root)).relations).toEqual({
      uses: expected(gameoverFields),
      problems: [],
      stops: [],
    });
    const after = await state(root);
    expect(after.project).toEqual(repaired.project);
    expect(after.snapshot).toEqual(before.snapshot);
  });
});

type Field = {
  family: string;
  branch: string;
  token: string;
  field: string;
  category: "image" | "audio";
  folder: string;
  name: string;
  relationship: string;
  conditions: string[];
  candidate?: string;
};
const titleFields: Field[] = [
  {
    family: "B12",
    branch: "return-title",
    token: "title1",
    field: "title1Name",
    category: "image",
    folder: "titles1",
    name: "TitleOne",
    relationship: "Title image",
    conditions: [],
  },
  {
    family: "B12",
    branch: "return-title",
    token: "title2",
    field: "title2Name",
    category: "image",
    folder: "titles2",
    name: "TitleTwo",
    relationship: "Title image",
    conditions: [],
  },
  {
    family: "B12",
    branch: "return-title",
    token: "title-bgm",
    field: "titleBgm.name",
    category: "audio",
    folder: "bgm",
    name: "TitleMusic",
    relationship: "Title BGM",
    conditions: [],
  },
];
const battleCandidate = "Saved System default may be replaced by runtime battle audio settings.";
const battleFields: Field[] = [
  {
    family: "B13",
    branch: "battle-system",
    token: "battle-bgm",
    field: "battleBgm.name",
    category: "audio",
    folder: "bgm",
    name: "BattleMusic",
    relationship: "Default battle BGM",
    conditions: ["Battle BGM applies when battle starts."],
    candidate: battleCandidate,
  },
  {
    family: "B13",
    branch: "battle-system",
    token: "victory-me",
    field: "victoryMe.name",
    category: "audio",
    folder: "me",
    name: "Victory",
    relationship: "Default victory ME",
    conditions: ["Victory ME applies only when the battle is won."],
    candidate: battleCandidate,
  },
  {
    family: "B13",
    branch: "battle-system",
    token: "defeat-me",
    field: "defeatMe.name",
    category: "audio",
    folder: "me",
    name: "Defeat",
    relationship: "Default defeat ME",
    conditions: ["Defeat ME applies only when the battle is lost."],
    candidate: battleCandidate,
  },
  {
    family: "B13",
    branch: "battle-system",
    token: "start-se",
    field: "sounds[7].name",
    category: "audio",
    folder: "se",
    name: "BattleStart",
    relationship: "Battle start SE",
    conditions: ["Battle start SE plays only when battle launches from the map scene."],
  },
];
const backgroundCandidate =
  "Saved host Map background applies only while this map remains current and runtime battle background settings have not replaced it.";
const backgroundFields: Field[] = [
  {
    family: "B14",
    branch: "map-battle-background",
    token: "battleback1",
    field: "battleback1Name",
    category: "image",
    folder: "battlebacks1",
    name: "BackOne",
    relationship: "Host Map battle background",
    conditions: ["Host Map specifyBattleback is true; the saved battle background is enabled."],
    candidate: backgroundCandidate,
  },
  {
    family: "B14",
    branch: "map-battle-background",
    token: "battleback2",
    field: "battleback2Name",
    category: "image",
    folder: "battlebacks2",
    name: "BackTwo",
    relationship: "Host Map battle background",
    conditions: ["Host Map specifyBattleback is true; the saved battle background is enabled."],
    candidate: backgroundCandidate,
  },
];
const battleCommand =
  'battleProcessing({troop:{kind:"fixed",troop:troopRef({id:1})},canEscape:true,canLose:true,win:{commands:[]},escape:{commands:[]},lose:{commands:[]}})';
async function media(root: string, field: Field) {
  const path = join(
    root,
    "Game",
    field.category === "image" ? "img" : "audio",
    field.folder,
    `${field.name}${field.category === "image" ? ".png" : ".ogg"}`,
  );
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, "");
  recordAssetInput({ ordinaryZeroByteFile: path });
  return path;
}
function expected(fields: Field[]) {
  return fields.map(
    ({ family, category, folder, name, relationship, field, conditions, candidate }) => ({
      identity: "map:1/event:1",
      nativePath: "Map001.json.events[1].pages[0].list[0]",
      relatedNativePaths: [],
      category,
      folder,
      name,
      dependencyChain: [
        { data: family === "B14" ? "Map001.json" : "System.json", field, relationship },
      ],
      conditions,
      ...(candidate === undefined ? {} : { candidate }),
    }),
  );
}
const gameoverFields: Field[] = [
  {
    family: "B11",
    branch: "game-over",
    token: "gameover-me",
    field: "gameoverMe.name",
    category: "audio",
    folder: "me",
    name: "GameOver",
    relationship: "Game Over ME",
    conditions: [],
  },
];
const allFields = [...gameoverFields, ...titleFields, ...battleFields, ...backgroundFields];
function fieldsFor(field: Field) {
  return field.family === "B11"
    ? gameoverFields
    : field.family === "B12"
      ? titleFields
      : [...backgroundFields, ...battleFields];
}
function commandFor(field: Field, representation = "formal") {
  if (representation === "raw")
    return `rawDslCommand({code:${field.family === "B11" ? 353 : field.family === "B12" ? 354 : 301},parameters:${field.family === "B11" || field.family === "B12" ? "[]" : "[0,1,false,false]"}})`;
  return field.family === "B11"
    ? "gameOver()"
    : field.family === "B12"
      ? "returnToTitleScreen()"
      : 'battleProcessing({troop:{kind:"fixed",troop:troopRef({id:1})}})';
}
async function capture(root: string, check: boolean) {
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    const failure = await compileWorkspace({ workspaceRoot: root, check }).then(() => "", String);
    return { failure, diagnostics: spy.mock.calls.flat().join("\n") };
  } finally {
    spy.mockRestore();
  }
}
function dataPath(field: Field) {
  return `${field.family === "B14" ? "Map001.json" : "System.json"}.${field.field}`;
}
const tracerIds = new Set([
  "B11.game-over.gameover-me",
  "B12.return-title.title1",
  "B13.battle-system.battle-bgm",
  "B14.map-battle-background.battleback1",
]);
for (const field of allFields)
  for (const representation of ["formal", "raw"])
    for (const outcome of ["present", "missing"]) {
      if (
        representation === "formal" &&
        outcome === "missing" &&
        tracerIds.has(`${field.family}.${field.branch}.${field.token}`)
      )
        continue;
      it(`AV.${field.family}.${field.branch}.${representation}.${field.token}.${outcome}: every selected saved field retains independent uses, origin, complete chain, conditions, file severity and Workspace state`, async () => {
        await withWindowsSandbox(
          `asset-system-${field.family}-${field.token}-${outcome}`,
          async (sandbox) => {
            const root = sandbox.workspaceRoot;
            await prepare(root, source(commandFor(field, representation)));
            const paths = new Map<string, string>();
            for (const item of fieldsFor(field)) paths.set(item.name, await media(root, item));
            if (outcome === "missing") await rm(paths.get(field.name)!);
            const before = await state(root),
              blocking = outcome === "missing" && field.candidate === undefined;
            const check = await capture(root, true);
            expect(await state(root)).toEqual(before);
            const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
            expect(cli.exitCode === 0).toBe(!blocking);
            if (outcome === "missing") {
              const level = blocking ? "error" : "warning";
              for (const text of [check.failure + check.diagnostics, cli.stderr]) {
                expect(text).toContain(`${level} MV-ASSET-MISSING-FILE`);
                expect(text).toContain(dataPath(field));
                expect(text).toContain("Map001.json.events[1].pages[0].list[0]");
                expect(text).toContain(JSON.stringify(field.name));
                for (const condition of field.conditions) expect(text).toContain(condition);
                if (field.candidate !== undefined) expect(text).toContain(field.candidate);
              }
            } else {
              expect(check).toEqual({ failure: "", diagnostics: "" });
              expect(cli.stderr).toBe("");
            }
            let expectedProject = before.project;
            const compile = await capture(root, false);
            expect(compile.failure === "").toBe(!blocking);
            if (blocking) {
              expect(await state(root)).toEqual(before);
              await media(root, field);
              expectedProject = (await state(root)).project;
              await compileWorkspace({ workspaceRoot: root, check: false });
            }
            const after = await state(root);
            expect(after.project).toEqual(expectedProject);
            expect(after.snapshot).toEqual(before.snapshot);
            const actual = await observed(root);
            expect(actual.relations).toEqual({
              uses: expected(fieldsFor(field)),
              problems: [],
              stops: [],
            });
            const saved = JSON.parse(actual.files.get("Map001.json")!).events[1].pages[0].list[0];
            expect(saved).toEqual({
              code: field.family === "B11" ? 353 : field.family === "B12" ? 354 : 301,
              indent: 0,
              parameters:
                field.family === "B11" || field.family === "B12" ? [] : [0, 1, false, false],
            });
            expect(JSON.parse(actual.external.get("System.json")!)).toMatchObject(systemData());
            expect(JSON.parse(actual.external.get("Map001.json")!)).toEqual(mapData());
          },
        );
      });
    }
function changed(field: Field, value: unknown, remove = false) {
  const system: Record<string, unknown> = systemData(),
    map: Record<string, unknown> = mapData();
  let container = field.family === "B14" ? map : system,
    key = field.field;
  if (field.field === "sounds[7].name") {
    container = (system.sounds as Record<string, unknown>[])[7]!;
    key = "name";
  } else if (field.field.endsWith(".name")) {
    container = system[field.field.split(".")[0]!] as Record<string, unknown>;
    key = "name";
  }
  // An explicit undefined override survives the setup merge and is omitted from saved JSON.
  container[key] = remove ? undefined : value;
  return { system, map };
}
function collected(field: Field, input: ReturnType<typeof changed>) {
  const command = {
    code: field.family === "B11" ? 353 : field.family === "B12" ? 354 : 301,
    indent: 0,
    parameters: field.family === "B11" || field.family === "B12" ? [] : [0, 1, false, false],
  };
  return collectSystemAssets(
    new Map([
      ["Map001.json", JSON.stringify({ events: [null, { pages: [{ list: [command] }] }] })],
    ]),
    new Map([
      ["System.json", JSON.stringify(input.system)],
      ["Map001.json", JSON.stringify(input.map)],
    ]),
  );
}
for (const field of allFields) {
  const suffix = `${field.family}-${field.branch}-${field.token}`;
  for (const branch of [
    "none-indirect",
    "field-missing",
    "field-wrong-type",
    "field-empty",
    "file-missing",
  ]) {
    const family = branch === "none-indirect" ? "C06" : "C07";
    it(`AV.${family}.${branch}.formal.${suffix}.expected: legal None, necessary-field failures and missing files remain distinct with independent siblings and saved controls preserved`, async () => {
      await withWindowsSandbox(`asset-system-${branch}-${field.token}`, async (sandbox) => {
        const root = sandbox.workspaceRoot,
          empty = branch === "none-indirect" || branch === "field-empty",
          invalid = branch === "field-missing" || branch === "field-wrong-type";
        const input = changed(
          field,
          empty ? "" : branch === "field-wrong-type" ? 17 : field.name,
          branch === "field-missing",
        );
        await prepare(root, source(commandFor(field)), input.system, { "Map001.json": input.map });
        for (const item of fieldsFor(field))
          if (item !== field || (!empty && branch !== "file-missing")) await media(root, item);
        // Ensure a missing file is distinguished from an absent category directory.
        await mkdir(
          join(root, "Game", field.category === "image" ? "img" : "audio", field.folder),
          { recursive: true },
        );
        const before = await state(root),
          blocking = invalid || (branch === "file-missing" && field.candidate === undefined);
        for (const check of [true, false]) {
          const actual = await capture(root, check);
          expect(actual.failure === "").toBe(!blocking);
          if (invalid) {
            expect(actual.failure).toContain("error MV-ASSET-INVALID-DATA");
            expect(actual.failure).toContain(dataPath(field));
            expect(actual.failure).not.toContain("MV-ASSET-MISSING-FILE");
          }
          if (branch === "file-missing") {
            expect(actual.failure + actual.diagnostics).toContain(
              `${blocking ? "error" : "warning"} MV-ASSET-MISSING-FILE`,
            );
            expect(actual.failure + actual.diagnostics).toContain(dataPath(field));
          }
          if (check || blocking) expect(await state(root)).toEqual(before);
        }
        const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
        expect(cli.exitCode === 0).toBe(!blocking);
        if (invalid) expect(cli.stderr).toContain("error MV-ASSET-INVALID-DATA");
        const uses = expected(fieldsFor(field)).filter(
          (use) => !((empty || invalid) && use.name === field.name),
        );
        const relations = collected(field, input);
        expect(relations.uses).toEqual(uses);
        expect(relations.stops).toEqual([]);
        if (invalid) {
          const failed = expected([field])[0]!;
          const { category: _category, folder: _folder, name: _name, ...origin } = failed;
          expect(relations.problems).toEqual([
            {
              ...origin,
              dataPath: dataPath(field),
              reason: "Necessary asset name must be a string; this relationship is unchecked.",
            },
          ]);
          expect(await state(root)).toEqual(before);
        } else {
          expect(relations.problems).toEqual([]);
          if (!blocking) {
            const actual = await observed(root);
            expect(actual.relations).toEqual({ uses, problems: [], stops: [] });
            expect(JSON.parse(actual.external.get("System.json")!)).toMatchObject(input.system);
            expect(JSON.parse(actual.external.get("Map001.json")!)).toEqual(input.map);
          }
        }
        const after = await state(root);
        expect(after.project).toEqual(before.project);
        expect(after.snapshot).toEqual(before.snapshot);
      });
    });
  }
}
async function observed(root: string) {
  const paths = getWorkspaceStatePaths(root),
    files = new Map<string, string>(),
    external = new Map<string, string>();
  for (const file of await readdir(paths.generatedProjectDataDirectory))
    files.set(file, await readFile(join(paths.generatedProjectDataDirectory, file), "utf8"));
  for (const file of await readdir(paths.projectDataSnapshotDirectory))
    external.set(file, await readFile(join(paths.projectDataSnapshotDirectory, file), "utf8"));
  return { files, external, relations: collectSystemAssets(files, external) };
}
sharedIt(
  "AV.C05.known-sibling.formal.case.expected: dynamic Troop selection does not conceal an independent System error or candidate warning",
  async () => {
    await withWindowsSandbox("asset-system-known-sibling", async (sandbox) => {
      const root = sandbox.workspaceRoot;
      await prepare(
        root,
        source(
          battleCommand.replace(
            '{kind:"fixed",troop:troopRef({id:1})}',
            '{kind:"randomEncounter"}',
          ),
        ),
      );
      for (const field of [...backgroundFields, ...battleFields]) await media(root, field);
      await rm(join(root, "Game/audio/se/BattleStart.ogg"));
      await rm(join(root, "Game/audio/me/Victory.ogg"));
      const before = await state(root);
      for (const check of [true, false]) {
        const actual = await capture(root, check);
        expect(actual.failure).toContain("error MV-ASSET-MISSING-FILE");
        expect(actual.failure).toContain("System.json.sounds[7].name");
        expect(actual.diagnostics).toContain("System.json.victoryMe.name");
        expect(actual.diagnostics).toContain("warning MV-ASSET-MISSING-FILE");
        expect(actual.diagnostics.match(/info MV-ASSET-DYNAMIC-STOP/gu)).toHaveLength(1);
        expect(await state(root)).toEqual(before);
      }
      const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
      expect(cli.exitCode).not.toBe(0);
      expect(cli.stderr).toContain("System.json.sounds[7].name");
      expect(cli.stderr).toContain("System.json.victoryMe.name");
      expect(cli.stderr.match(/info MV-ASSET-DYNAMIC-STOP/gu)).toHaveLength(1);
      expect(await state(root)).toEqual(before);
      await media(root, battleFields[3]!);
      await media(root, battleFields[1]!);
      await compileWorkspace({ workspaceRoot: root, check: false });
      const actual = (await observed(root)).relations;
      expect(actual.uses).toEqual(expected([...backgroundFields, ...battleFields]));
      expect(actual.problems).toEqual([]);
      expect(actual.stops).toHaveLength(1);
    });
    await verifyForcedActionSibling("known-sibling");
  },
);
it("AV.C08.battleback-off.formal.case.expected: disabled saved host backgrounds retain both candidate and inactive reasons while missing files remain warnings", async () => {
  await withWindowsSandbox("asset-background-off", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(
      root,
      source(commandFor(backgroundFields[0]!)),
      {},
      { "Map001.json": { ...mapData(), specifyBattleback: false } },
    );
    for (const field of battleFields) await media(root, field);
    for (const field of backgroundFields)
      await mkdir(join(root, "Game/img", field.folder), { recursive: true });
    const before = await state(root),
      check = await capture(root, true);
    expect(check.failure).toBe("");
    expect(check.diagnostics).toContain("warning MV-ASSET-MISSING-FILE");
    expect(check.diagnostics).toContain("inactive: Host Map specifyBattleback is false");
    expect(check.diagnostics).toContain(backgroundCandidate);
    expect(await state(root)).toEqual(before);
    const cli = await runCli(sandbox, ["compile", "--check"]);
    for (const field of backgroundFields) expect(cli.stderr).toContain(dataPath(field));
    await capture(root, false);
    const uses = [
      ...expected(backgroundFields).map((use) => ({
        ...use,
        conditions: [
          "Host Map specifyBattleback is false; the saved battle background is disabled.",
        ],
        inactive:
          "Host Map specifyBattleback is false; saved battle background names are inactive.",
      })),
      ...expected(battleFields),
    ];
    expect((await observed(root)).relations).toEqual({ uses, problems: [], stops: [] });
  });
});
for (const branch of ["hardcoded-system", "terrain-background", "battle-test-background"]) {
  it(`AV.C12.${branch}.formal.case.expected: only explicitly selected saved media fields are checked and excluded hardcoded, terrain or Battle Test relationships add no targets`, async () => {
    await withWindowsSandbox(`asset-excluded-${branch}`, async (sandbox) => {
      const root = sandbox.workspaceRoot,
        title = branch === "hardcoded-system";
      const system = {
        battleback1Name: "MissingTestOne",
        battleback2Name: "MissingTestTwo",
        testTroopId: 99,
        windowskin: "MissingWindow",
        titleUi: { name: "MissingUi" },
        unrelated: { retain: [null, 17] },
      };
      const map = {
        ...mapData(),
        ...(branch === "terrain-background"
          ? {
              specifyBattleback: false,
              battleback1Name: "",
              battleback2Name: "",
              data: [2816],
              scrollType: 3,
            }
          : {}),
      };
      await prepare(
        root,
        source(title ? "gameOver(),returnToTitleScreen()" : commandFor(battleFields[0]!)),
        system,
        {
          "Map001.json": map,
          "Tilesets.json": [
            null,
            { id: 1, name: "Field", tilesetNames: ["MissingTerrainSheet"], flags: [0, 4096] },
          ],
        },
      );
      const fields = title
        ? [...gameoverFields, ...titleFields]
        : branch === "terrain-background"
          ? battleFields
          : [...backgroundFields, ...battleFields];
      for (const field of fields) await media(root, field);
      const before = await state(root);
      const check = await capture(root, true);
      expect(check).toEqual({ failure: "", diagnostics: "" });
      expect(await state(root)).toEqual(before);
      expect((await runCli(sandbox, ["compile", "--check"])).stderr).toBe("");
      await compileWorkspace({ workspaceRoot: root, check: false });
      const uses = title
        ? [
            ...expected(gameoverFields),
            ...expected(titleFields).map((use) => ({
              ...use,
              nativePath: "Map001.json.events[1].pages[0].list[1]",
            })),
          ]
        : expected(fields);
      const actual = await observed(root);
      expect(actual.relations).toEqual({ uses, problems: [], stops: [] });
      expect(JSON.parse(actual.external.get("System.json")!)).toMatchObject(system);
      const after = await state(root);
      expect(after.project).toEqual(before.project);
      expect(after.snapshot).toEqual(before.snapshot);
    });
  });
}
it("AV.B14.non-map-roots.formal.case.expected: Common and Troop battle commands retain System origins without inferring any caller or host Map background", async () => {
  await withWindowsSandbox("asset-system-nonmap", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    const authored =
      source("").split("export const event=")[0] +
      `export const common=commonEvent({id:10,name:"Independent",trigger:"none",commands:[${commandFor(battleFields[0]!)}]});export const troop=troopEvent({troopId:1,pages:[{commands:[${commandFor(battleFields[0]!)}]}]});`;
    await prepare(
      root,
      authored,
      {},
      {
        "Map001.json": {
          ...mapData(),
          specifyBattleback: "uninterpreted without a Map root",
          battleback1Name: 17,
          battleback2Name: null,
        },
      },
    );
    for (const field of battleFields) await media(root, field);
    const before = await state(root);
    const check = await capture(root, true);
    expect(check.failure).toBe("");
    expect(check.diagnostics).toContain("MV-E301-CONTEXT");
    expect(check.diagnostics).not.toContain("MV-ASSET-");
    expect(await state(root)).toEqual(before);
    const cli = await runCli(sandbox, ["compile", "--check"]);
    expect(cli.stderr).toContain("MV-E301-CONTEXT");
    expect(cli.stderr).not.toContain("MV-ASSET-");
    await compileWorkspace({ workspaceRoot: root, check: false });
    const uses = [
      ...expected(battleFields).map((use) => ({
        ...use,
        identity: "commonEvent:10",
        nativePath: "CommonEvents.json[10].list[0]",
      })),
      ...expected(battleFields).map((use) => ({
        ...use,
        identity: "troop:1",
        nativePath: "Troops.json[1].pages[0].list[0]",
      })),
    ];
    expect((await observed(root)).relations).toEqual({ uses, problems: [], stops: [] });
  });
});
it("AV.C07.shared-system-field.formal.case.expected: one malformed System field retains every independent defining command and safe title sibling", async () => {
  await withWindowsSandbox("asset-system-shared-field", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root, source("gameOver(),gameOver(),returnToTitleScreen()"), {
      gameoverMe: null,
    });
    for (const field of titleFields) await media(root, field);
    const before = await state(root);
    const expectSharedFieldGroup = (message: string) => {
      const members = message
        .split(/\r?\n/u)
        .filter((line) => line.startsWith("  - error map:1/event:1 "));
      expect(members.map((line) => line.split("; chain:")[0])).toEqual([
        "  - error map:1/event:1 Map001.json.events[1].pages[0].list[0]",
        "  - error map:1/event:1 Map001.json.events[1].pages[0].list[1]",
      ]);
      for (const [index, member] of members.entries()) {
        expect(member).toContain("chain: System.json.gameoverMe.name (Game Over ME)");
        expect(member).toContain(`DSL: pages[0].commands[${index}]`);
        expect(member).toMatch(/; base: error; effective: error$/u);
      }
      expect(
        message.match(/1 problem group\(s\), 0 problem file\(s\), 2 affected use\(s\)/gu),
      ).toHaveLength(1);
      expect(message).toContain(
        "Coverage: incomplete; named relationships or file checks remain unchecked.",
      );
      expect(message).toContain("failed at: System.json.gameoverMe.name");
      expect(message).not.toContain("; target:");
      expect(message).not.toContain("MV-ASSET-QUERY-FAILED");
    };
    for (const check of [true, false]) {
      const actual = await capture(root, check);
      const after = await state(root);
      recordAssetInput({ groupingCompatibilityApi: { check, actual, before, after } });
      expect(actual.failure.match(/error MV-ASSET-INVALID-DATA/gu)).toHaveLength(1);
      expect(actual.failure).toContain("System.json.gameoverMe.name");
      expect(actual.failure).toContain("list[0]");
      expect(actual.failure).toContain("list[1]");
      expect(actual.failure).not.toContain("MV-ASSET-MISSING-FILE");
      expectSharedFieldGroup(actual.failure);
      expect(after).toEqual(before);
    }
    const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
    const afterCli = await state(root);
    recordAssetInput({ groupingCompatibilityCli: { cli, before, after: afterCli } });
    expect(cli.exitCode).not.toBe(0);
    expect(cli.exitCode).toBe(1);
    expect(cli.stderr.match(/error MV-ASSET-INVALID-DATA/gu)).toHaveLength(1);
    expectSharedFieldGroup(cli.stderr);
    expect(cli.stderr).not.toContain("MV-ASSET-MISSING-FILE");
    expect(afterCli).toEqual(before);
  });
});
for (const [token, override] of [
  ["absent", undefined],
  ["null", null],
  ["wrong-type", 17],
] as const) {
  it(`AV.C07.host-map-control.formal.${token}.expected: an uninterpretable specifyBattleback remains an error while both known background names retain their candidate origins`, async () => {
    await withWindowsSandbox(`asset-background-control-${token}`, async (sandbox) => {
      const root = sandbox.workspaceRoot,
        map = { ...mapData(), specifyBattleback: override };
      await prepare(root, source(commandFor(battleFields[0]!)), {}, { "Map001.json": map });
      for (const field of [...backgroundFields, ...battleFields]) await media(root, field);
      const before = await state(root);
      for (const check of [true, false]) {
        const actual = await capture(root, check);
        expect(actual.failure).toContain(
          "error MV-ASSET-INVALID-DATA: Map001.json.specifyBattleback",
        );
        expect(actual.failure).toContain("background activation is unchecked");
        expect(await state(root)).toEqual(before);
      }
      const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
      expect(cli.exitCode).not.toBe(0);
      expect(cli.stderr).toContain("Map001.json.specifyBattleback");
      const relation = collected(battleFields[0]!, { system: systemData(), map });
      expect(relation.uses).toEqual([
        ...expected(backgroundFields).map((use) => ({
          ...use,
          conditions: ["Host Map specifyBattleback is unchecked."],
        })),
        ...expected(battleFields),
      ]);
      expect(relation.problems).toEqual([
        {
          identity: "map:1/event:1",
          nativePath: "Map001.json.events[1].pages[0].list[0]",
          relatedNativePaths: [],
          dependencyChain: [],
          conditions: [],
          dataPath: "Map001.json.specifyBattleback",
          reason:
            "Necessary specifyBattleback must be boolean; background activation is unchecked.",
        },
      ]);
    });
  });
}
for (const [token, system] of [
  ["audio-object", { battleBgm: [] }],
  ["sound-array", { sounds: { 7: audio("WouldBeName") } }],
  ["sound-slot", { sounds: Array(7).fill(audio("")) }],
] as const) {
  it(`AV.C07.system-container.formal.${token}.expected: malformed necessary audio containers are errors without treating them as None or inventing missing file targets`, async () => {
    await withWindowsSandbox(`asset-system-container-${token}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      await prepare(root, source(commandFor(battleFields[0]!)), system);
      for (const field of [...backgroundFields, ...battleFields]) await media(root, field);
      const before = await state(root),
        path =
          token === "audio-object" ? "System.json.battleBgm.name" : "System.json.sounds[7].name";
      for (const check of [true, false]) {
        const actual = await capture(root, check);
        expect(actual.failure).toContain(`error MV-ASSET-INVALID-DATA: ${path}`);
        expect(actual.failure).not.toContain("MV-ASSET-MISSING-FILE");
        expect(await state(root)).toEqual(before);
      }
      const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
      expect(cli.exitCode).not.toBe(0);
      expect(cli.stderr).toContain(path);
      expect(await state(root)).toEqual(before);
    });
  });
}
it("AV.C07.host-map-required.formal.case.expected: a missing host Map cannot preserve a current Map Event root and fails the existing map reference prerequisite before an asset target is invented", async () => {
  await withWindowsSandbox("asset-host-map-required", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root, source(commandFor(backgroundFields[0]!)), {}, { "MapInfos.json": [null] });
    const before = await state(root);
    for (const check of [true, false]) {
      const actual = await capture(root, check);
      expect(actual.failure).toMatch(/map/iu);
      expect(actual.failure).toMatch(/reference|exist/iu);
      expect(actual.failure).not.toContain("MV-ASSET-");
      expect(await state(root)).toEqual(before);
    }
    const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
    expect(cli.exitCode).not.toBe(0);
    expect(cli.stderr).not.toContain("MV-ASSET-");
  });
});
it("AV.B12.return-title.formal.title1.missing: Return to Title checks three independent saved fields without expanding title UI", async () => {
  await withWindowsSandbox("asset-title-tracer", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root, source("returnToTitleScreen()"));
    for (const field of titleFields) await media(root, field);
    await rm(join(root, "Game/img/titles1/TitleOne.png"));
    const before = await state(root);
    for (const check of [true, false]) {
      const failure = await compileWorkspace({ workspaceRoot: root, check }).then(() => "", String);
      expect(failure).toContain("error MV-ASSET-MISSING-FILE");
      expect(failure).toContain("System.json.title1Name");
      expect(await state(root)).toEqual(before);
    }
    const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
    expect(cli.exitCode).not.toBe(0);
    await media(root, titleFields[0]!);
    await compileWorkspace({ workspaceRoot: root, check: false });
    expect((await observed(root)).relations).toEqual({
      uses: expected(titleFields),
      problems: [],
      stops: [],
    });
  });
});
it("AV.B13.battle-system.formal.battle-bgm.missing: a missing System battle BGM remains a warning candidate while result and map-launch conditions survive", async () => {
  await withWindowsSandbox("asset-battle-system-tracer", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root, source(battleCommand));
    for (const field of [...battleFields, ...backgroundFields]) await media(root, field);
    await rm(join(root, "Game/audio/bgm/BattleMusic.ogg"));
    const before = await state(root);
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await compileWorkspace({ workspaceRoot: root, check: true });
      expect(spy.mock.calls.flat().join("\n")).toContain("warning MV-ASSET-MISSING-FILE");
      expect(spy.mock.calls.flat().join("\n")).toContain(battleCandidate);
    } finally {
      spy.mockRestore();
    }
    expect(await state(root)).toEqual(before);
    const cli = await runCli(sandbox, ["compile", "--check"]);
    expect(cli.stderr).toContain("System.json.battleBgm.name");
    await compileWorkspace({ workspaceRoot: root, check: false });
    expect((await observed(root)).relations).toEqual({
      uses: expected([...backgroundFields, ...battleFields]),
      problems: [],
      stops: [],
    });
  });
});
it("AV.B14.map-battle-background.formal.battleback1.missing: a missing saved host Map battle background warns as a conditional candidate with both selected layers intact", async () => {
  await withWindowsSandbox("asset-background-tracer", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root, source(battleCommand));
    for (const field of [...battleFields, ...backgroundFields]) await media(root, field);
    await rm(join(root, "Game/img/battlebacks1/BackOne.png"));
    const before = await state(root);
    const apiCheck = await capture(root, true);
    expect(apiCheck.failure).toBe("");
    expect(apiCheck.diagnostics).toContain("warning MV-ASSET-MISSING-FILE");
    expect(await state(root)).toEqual(before);
    const cli = await runCli(sandbox, ["compile", "--check"]);
    expect(cli.stderr).toContain("warning MV-ASSET-MISSING-FILE");
    expect(cli.stderr).toContain("Map001.json.battleback1Name");
    expect(cli.stderr).toContain(backgroundCandidate);
    expect(await state(root)).toEqual(before);
    await compileWorkspace({ workspaceRoot: root, check: false });
    expect((await observed(root)).relations).toEqual({
      uses: expected([...backgroundFields, ...battleFields]),
      problems: [],
      stops: [],
    });
  });
});
