import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect } from "vitest";
import { createAssetTest, recordAssetInput } from "./support/asset-evidence.js";
import { createMinimalProject, runCli, withWindowsSandbox } from "./support/windows-sandbox.js";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { getWorkspaceStatePaths } from "../src/workspace/state.js";
import { collectMapAssetRelations } from "../src/validation/asset-map-relations.js";
import { collectEventAssetUses } from "../src/validation/asset-uses.js";

const {
  initWorkspace,
  cloneWorkspace,
  compileWorkspace,
}: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const it = createAssetTest({ ownerTicket: "07", testSource: import.meta.url });
const imports =
  'import {mapEvent,transferPlayer,mapRef,rawDslCommand,variableDefinition,variableRef} from "rpgmaker-event-dsl";';
const transfer = (representation = "formal", id = 2) =>
  representation === "raw"
    ? `rawDslCommand({code:201,parameters:[0,${id},0,0,0,0]})`
    : `transferPlayer({destination:{kind:"direct",map:mapRef({id:${id}}),x:0,y:0}})`;
const source = (command = transfer(), pageFields = "") =>
  `${imports}export const event=mapEvent({mapId:1,id:1,name:"Map assets",x:0,y:0,pages:[{conditions:{},trigger:"action",commands:[${command}]${pageFields}}]});`;
const audio = (name: string) => ({ name, volume: 17, pitch: 73, pan: -41 });
const targetMap = () => ({
  width: 1,
  height: 1,
  tilesetId: 2,
  parallaxName: "TransferSky",
  autoplayBgm: true,
  autoplayBgs: true,
  bgm: audio("TransferBgm"),
  bgs: audio("TransferBgs"),
  battleback1Name: "ExcludedBack1",
  battleback2Name: "ExcludedBack2",
  events: [],
  custom: { untouched: true },
});
const tileset = (id = 2) => ({
  id,
  name: "Map tiles",
  tilesetNames: [
    "Transfer0",
    "Transfer1",
    "Transfer2",
    "Transfer3",
    "Transfer4",
    "Transfer5",
    "Transfer6",
    "Transfer7",
    "Transfer8",
  ],
  custom: { untouched: true },
});
const fields = [
  {
    token: "slot0",
    field: "tilesetNames[0]",
    category: "image",
    folder: "tilesets",
    name: "Transfer0",
  },
  {
    token: "slot1",
    field: "tilesetNames[1]",
    category: "image",
    folder: "tilesets",
    name: "Transfer1",
  },
  {
    token: "slot2",
    field: "tilesetNames[2]",
    category: "image",
    folder: "tilesets",
    name: "Transfer2",
  },
  {
    token: "slot3",
    field: "tilesetNames[3]",
    category: "image",
    folder: "tilesets",
    name: "Transfer3",
  },
  {
    token: "slot4",
    field: "tilesetNames[4]",
    category: "image",
    folder: "tilesets",
    name: "Transfer4",
  },
  {
    token: "slot5",
    field: "tilesetNames[5]",
    category: "image",
    folder: "tilesets",
    name: "Transfer5",
  },
  {
    token: "slot6",
    field: "tilesetNames[6]",
    category: "image",
    folder: "tilesets",
    name: "Transfer6",
  },
  {
    token: "slot7",
    field: "tilesetNames[7]",
    category: "image",
    folder: "tilesets",
    name: "Transfer7",
  },
  {
    token: "slot8",
    field: "tilesetNames[8]",
    category: "image",
    folder: "tilesets",
    name: "Transfer8",
  },
  {
    token: "parallax",
    field: "parallaxName",
    category: "image",
    folder: "parallaxes",
    name: "TransferSky",
  },
  { token: "bgm", field: "bgm.name", category: "audio", folder: "bgm", name: "TransferBgm" },
  { token: "bgs", field: "bgs.name", category: "audio", folder: "bgs", name: "TransferBgs" },
];
type Field = (typeof fields)[number];
async function prepare(root: string, authored: string, overrides: Record<string, unknown> = {}) {
  await createMinimalProject(root);
  const files = {
    "MapInfos.json": [null, { id: 1, name: "Host" }, { id: 2, name: "Transfer" }],
    "Map001.json": { width: 1, height: 1, tilesetId: 1, events: [] },
    "Map002.json": targetMap(),
    "Tilesets.json": [null, tileset(1), tileset()],
    ...overrides,
  };
  recordAssetInput({ source: authored, projectOverrides: files });
  for (const [file, data] of Object.entries(files))
    await writeFile(join(root, "Game/data", file), JSON.stringify(data));
  await initWorkspace({ workspaceRoot: root, projectRoot: "./Game" });
  await cloneWorkspace({ workspaceRoot: root });
  await writeFile(join(root, "src/map-assets.events.ts"), authored);
}
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
async function allMedia(root: string, selected = fields) {
  const paths = new Map<string, string>();
  for (const f of selected) paths.set(f.token, await media(root, f));
  return paths;
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
      for (const [file, bytes] of Object.entries((await tree(join(path, entry.name)))!))
        result[`${entry.name}/${file}`] = bytes;
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

it("AV.B08.transfer-fixed.formal.parallax.missing: fixed Transfer Map's saved parallax is checked before Check returns or Compile publishes", async () => {
  await withWindowsSandbox("asset-transfer-tracer", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root, source());
    const paths = await allMedia(root);
    await rm(paths.get("parallax")!);
    const before = await state(root);
    for (const check of [true, false]) {
      const failure = await compileWorkspace({ workspaceRoot: root, check }).then(() => "", String);
      expect(failure).toContain("error MV-ASSET-MISSING-FILE");
      expect(failure).toContain("Map002.json.parallaxName");
      expect(failure).toContain("Map001.json.events[1].pages[0].list[0].parameters[1]");
      expect(await state(root)).toEqual(before);
    }
    const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
    recordAssetInput({ cliResult: cli });
    expect(cli.exitCode).not.toBe(0);
    expect(cli.stderr).toContain("Map002.json.parallaxName");
    expect(await state(root)).toEqual(before);
    await media(root, fields[9]!);
    await compileWorkspace({ workspaceRoot: root, check: true });
    await compileWorkspace({ workspaceRoot: root, check: false });
    await verifyTransfer(root);
  });
});

function transferCase(representation: string, field: Field, outcome: string) {
  it(`AV.B08.transfer-fixed.${representation}.${field.token}.${outcome}: fixed Map use retains its exact field, source, condition and operation state`, async () => {
    await withWindowsSandbox(
      `asset-transfer-${representation}-${field.token}-${outcome}`,
      async (sandbox) => {
        const root = sandbox.workspaceRoot;
        await prepare(root, source(transfer(representation)));
        const paths = await allMedia(root);
        if (outcome === "missing") await rm(paths.get(field.token)!);
        const before = await state(root);
        for (const check of [true, false]) {
          const failure = await compileWorkspace({ workspaceRoot: root, check }).then(
            () => "",
            String,
          );
          if (outcome === "missing") {
            expect(failure).toContain("error MV-ASSET-MISSING-FILE");
            expect(failure).toContain(
              field.token.startsWith("slot")
                ? `Tilesets.json[2].${field.field}`
                : `Map002.json.${field.field}`,
            );
            expect(failure).toContain("Map001.json.events[1].pages[0].list[0].parameters[1]");
            expect(await state(root)).toEqual(before);
          } else {
            expect(failure).toBe("");
            if (check) expect(await state(root)).toEqual(before);
          }
        }
        const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
        recordAssetInput({ cliResult: cli });
        if (outcome === "missing") {
          expect(cli.exitCode).not.toBe(0);
          expect(cli.stderr).toContain(JSON.stringify(field.name));
          expect(await state(root)).toEqual(before);
          await media(root, field);
          await compileWorkspace({ workspaceRoot: root, check: false });
        } else expect(cli.exitCode).toBe(0);
        await verifyTransfer(root);
      },
    );
  });
}
transferCase("formal", fields[0]!, "missing");
transferCase("formal", fields[10]!, "missing");
transferCase("formal", fields[11]!, "missing");

const pageFields = [
  { branch: "tile-b", tileId: 1, slot: 5, name: "Transfer5" },
  { branch: "tile-c", tileId: 256, slot: 6, name: "Transfer6" },
  { branch: "tile-d", tileId: 512, slot: 7, name: "Transfer7" },
  { branch: "tile-e", tileId: 768, slot: 8, name: "Transfer8" },
];
function pageCase(field: (typeof pageFields)[number], outcome: string) {
  it(`AV.B09.${field.branch}.page.selected-slot.${outcome}: page tile selects only one initial host sheet and a missing candidate warns without changing saved values`, async () => {
    await withWindowsSandbox(`asset-page-${field.branch}-${outcome}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      await prepare(root, source("", `,image:{tileId:${field.tileId},pattern:1}`));
      if (outcome === "present") await media(root, fields[field.slot]!);
      else await mkdir(join(root, "Game/img/tilesets"), { recursive: true });
      const before = await state(root);
      await compileWorkspace({ workspaceRoot: root, check: true });
      expect(await state(root)).toEqual(before);
      const cli = await runCli(sandbox, ["compile", "--check"]);
      recordAssetInput({ cliResult: cli });
      expect(cli.exitCode).toBe(0);
      if (outcome === "missing") {
        expect(cli.stderr).toContain("warning MV-ASSET-MISSING-FILE");
        expect(cli.stderr).toContain(`Tilesets.json[1].tilesetNames[${field.slot}]`);
        expect(cli.stderr).toContain("candidate:");
        expect(cli.stderr).toContain("initial Tileset");
      } else expect(cli.stderr).not.toContain("MV-ASSET-");
      expect(await state(root)).toEqual(before);
      await compileWorkspace({ workspaceRoot: root, check: false });
      const actual = await observed(root);
      expect(actual.relations).toEqual({ uses: pageExpected(field), problems: [], stops: [] });
      expect(collectEventAssetUses(actual.files)).toEqual([]);
      expect(JSON.parse(actual.files.get("Map001.json")!).events[1].pages[0].image).toEqual({
        characterName: "",
        characterIndex: 0,
        tileId: field.tileId,
        direction: 2,
        pattern: 1,
      });
    });
  });
}

const transferCondition = "Transfer destination configuration may be overridden at runtime.";
const pageCondition =
  "Page tile bitmap is selected from the host Map's initial Tileset; map rendering may separately request every sheet.";
const pageCandidate =
  "Map Event Page uses the host Map's initial Tileset; runtime tileset changes may override it.";
const transferOrigin = {
  identity: "map:1/event:1",
  nativePath: "Map001.json.events[1].pages[0].list[0].parameters[1]",
  relatedNativePaths: [],
};
const transferExpected = () =>
  fields.map((field) => ({
    ...transferOrigin,
    category: field.category,
    folder: field.folder,
    name: field.name,
    dependencyChain: field.token.startsWith("slot")
      ? [
          {
            data: "Map002.json",
            field: "tilesetId",
            relationship: "Transfer destination Map tileset",
          },
          { data: "Tilesets.json", id: 2, field: field.field, relationship: "Tileset image sheet" },
        ]
      : [
          {
            data: "Map002.json",
            field: field.field,
            relationship:
              field.token === "parallax"
                ? "Transfer destination Map parallax"
                : "Transfer destination Map autoplay audio",
          },
        ],
    conditions: field.token.startsWith("slot")
      ? [
          transferCondition,
          "All named tileset sheets are requested independently of tiles placed on the map.",
        ]
      : field.token === "parallax"
        ? [transferCondition]
        : [
            transferCondition,
            `Map ${field.token.toUpperCase()} plays only when its saved autoplay setting is enabled.`,
          ],
  }));
const pageExpected = (field: (typeof pageFields)[number]) => [
  {
    identity: "map:1/event:1",
    nativePath: "Map001.json.events[1].pages[0].image.tileId",
    relatedNativePaths: [],
    category: "image",
    folder: "tilesets",
    name: field.name,
    dependencyChain: [
      {
        data: "Map001.json",
        field: "tilesetId",
        relationship: "Map Event Page initial host Tileset",
      },
      {
        data: "Tilesets.json",
        id: 1,
        field: `tilesetNames[${field.slot}]`,
        relationship: "Map Event Page tile image sheet",
      },
    ],
    conditions: [pageCondition],
    candidate: pageCandidate,
  },
];
async function observed(root: string) {
  const paths = getWorkspaceStatePaths(root),
    files = new Map<string, string>(),
    external = new Map<string, string>();
  for (const file of await readdir(paths.generatedProjectDataDirectory))
    if (file.endsWith(".json"))
      files.set(file, await readFile(join(paths.generatedProjectDataDirectory, file), "utf8"));
  for (const file of await readdir(paths.projectDataSnapshotDirectory))
    if (file.endsWith(".json"))
      external.set(file, await readFile(join(paths.projectDataSnapshotDirectory, file), "utf8"));
  return { files, external, relations: collectMapAssetRelations(files, external) };
}
async function verifyTransfer(root: string) {
  const actual = await observed(root);
  expect(actual.relations).toEqual({ uses: transferExpected(), problems: [], stops: [] });
  expect(collectEventAssetUses(actual.files)).toEqual([]);
  expect(JSON.parse(actual.files.get("Map001.json")!).events[1].pages[0].list[0]).toEqual({
    code: 201,
    indent: 0,
    parameters: [0, 2, 0, 0, 0, 0],
  });
  expect(JSON.parse(actual.external.get("Map002.json")!)).toEqual(targetMap());
  expect(JSON.parse(actual.external.get("Tilesets.json")!)[2]).toEqual(tileset());
}

for (const representation of ["formal", "raw"])
  for (const field of fields)
    for (const outcome of ["present", "missing"]) {
      if (
        representation === "formal" &&
        outcome === "missing" &&
        ["slot0", "parallax", "bgm", "bgs"].includes(field.token)
      )
        continue;
      transferCase(representation, field, outcome);
    }
for (const field of pageFields)
  for (const outcome of ["present", "missing"]) {
    if (field.branch === "tile-b" && outcome === "missing") continue;
    pageCase(field, outcome);
  }

type ReachedField = Field & {
  family: "B08" | "B09";
  branch: string;
  slot?: number;
  tileId?: number;
};
const reached: ReachedField[] = [
  ...fields.map((field) => ({ ...field, family: "B08" as const, branch: "transfer-fixed" })),
  ...pageFields.map((field) => ({
    family: "B09" as const,
    branch: field.branch,
    slot: field.slot,
    tileId: field.tileId,
    token: "selected-slot",
    field: `tilesetNames[${field.slot}]`,
    category: "image",
    folder: "tilesets",
    name: field.name,
  })),
];
function changed(field: ReachedField, value: unknown, remove = false): Record<string, unknown> {
  if (field.family === "B09" || field.token.startsWith("slot")) {
    const selected = tileset(field.family === "B09" ? 1 : 2);
    (selected.tilesetNames as unknown[])[field.slot ?? Number(field.token.slice(4))] = value;
    return {
      "Tilesets.json":
        field.family === "B09" ? [null, selected, tileset()] : [null, tileset(1), selected],
    };
  }
  const selected = targetMap() as Record<string, unknown>;
  if (field.token === "parallax") {
    if (remove) delete selected.parallaxName;
    else selected.parallaxName = value;
  } else {
    const saved = selected[field.token] as Record<string, unknown>;
    if (remove) delete saved.name;
    else saved.name = value;
  }
  return { "Map002.json": selected };
}
const authoredFor = (field: ReachedField, id = 2) =>
  field.family === "B08"
    ? source(transfer("formal", id))
    : source("", `,image:{tileId:${field.tileId}}`);
const expectedFor = (field: ReachedField) =>
  field.family === "B08"
    ? transferExpected()
    : pageExpected(pageFields.find((f) => f.branch === field.branch)!);
const dataPathFor = (field: ReachedField) =>
  field.family === "B09" || field.token.startsWith("slot")
    ? `Tilesets.json[${field.family === "B09" ? 1 : 2}].${field.field}`
    : `Map002.json.${field.field}`;
function collected(field: ReachedField, overrides: Record<string, unknown>) {
  const roots = new Map([
    [
      "Map001.json",
      JSON.stringify({
        events: [
          null,
          {
            pages: [
              {
                image: { tileId: field.family === "B09" ? field.tileId : 0 },
                list:
                  field.family === "B08"
                    ? [{ code: 201, indent: 0, parameters: [0, 2, 0, 0, 0, 0] }]
                    : [],
              },
            ],
          },
        ],
      }),
    ],
  ]);
  const external = new Map(
    Object.entries({
      "Map001.json": { tilesetId: 1 },
      "Map002.json": targetMap(),
      "Tilesets.json": [null, tileset(1), tileset()],
      ...overrides,
    }).map(([file, value]) => [file, JSON.stringify(value)]),
  );
  return collectMapAssetRelations(roots, external);
}
for (const field of reached) {
  const suffix = `${field.family}-${field.branch}-${field.token}`;
  it(`AV.C06.none-indirect.formal.${suffix}.expected: legal saved None skips only its reached field, preserving independent siblings and values`, async () => {
    await withWindowsSandbox(`asset-map-none-${suffix}`, async (sandbox) => {
      const root = sandbox.workspaceRoot,
        overrides = changed(field, "");
      await prepare(root, authoredFor(field), overrides);
      await allMedia(
        root,
        field.family === "B08" ? fields.filter((f) => f.token !== field.token) : [],
      );
      const expected = expectedFor(field).filter((use) => use.name !== field.name);
      expect(collected(field, overrides)).toEqual({ uses: expected, problems: [], stops: [] });
      const before = await state(root);
      await compileWorkspace({ workspaceRoot: root, check: true });
      expect(await state(root)).toEqual(before);
      const cli = await runCli(sandbox, ["compile", "--check"]);
      recordAssetInput({ cliResult: cli });
      expect(cli.stderr).not.toContain("MV-ASSET-");
      expect(await state(root)).toEqual(before);
      await compileWorkspace({ workspaceRoot: root, check: false });
      const actual = await observed(root);
      expect(actual.relations).toEqual({ uses: expected, problems: [], stops: [] });
      for (const [file, value] of Object.entries(overrides))
        expect(JSON.parse(actual.external.get(file)!)).toEqual(JSON.parse(JSON.stringify(value)));
    });
  });
  for (const branch of [
    "target-missing",
    "field-missing",
    "field-wrong-type",
    "field-empty",
    "file-missing",
  ]) {
    it(`AV.C07.${branch}.formal.${suffix}.expected: reference, necessary field, legal empty value and missing file remain distinct with complete safe sibling origins`, async () => {
      await withWindowsSandbox(`asset-map-problem-${branch}-${suffix}`, async (sandbox) => {
        const root = sandbox.workspaceRoot;
        const overrides =
          branch === "field-missing"
            ? changed(field, undefined, true)
            : branch === "field-wrong-type"
              ? changed(field, 17)
              : branch === "field-empty"
                ? changed(field, "")
                : branch === "target-missing" && field.family === "B09"
                  ? { "Map001.json": { width: 1, height: 1, tilesetId: 99, events: [] } }
                  : {};
        await prepare(
          root,
          authoredFor(field, branch === "target-missing" && field.family === "B08" ? 3 : 2),
          overrides,
        );
        await allMedia(
          root,
          field.family === "B08"
            ? fields.filter((f) => branch !== "file-missing" || f.token !== field.token)
            : branch === "file-missing"
              ? []
              : [fields[field.slot!]!],
        );
        if (branch === "file-missing" && field.family === "B09")
          await mkdir(join(root, "Game/img/tilesets"), { recursive: true });
        const before = await state(root);
        const successful =
          branch === "field-empty" || (branch === "file-missing" && field.family === "B09");
        for (const check of [true, false]) {
          const failure = await compileWorkspace({ workspaceRoot: root, check }).then(
            () => "",
            String,
          );
          if (successful) {
            expect(failure).toBe("");
            if (check) expect(await state(root)).toEqual(before);
          } else {
            expect(failure).not.toBe("");
            if (branch === "target-missing") {
              expect(failure).toMatch(field.family === "B09" ? /MV-MAP-TILESET/ : /reference/iu);
              expect(failure).not.toContain("MV-ASSET-MISSING");
            } else if (field.family === "B09" && branch !== "file-missing") {
              expect(failure).toContain("MV-MAP-TILESET");
              expect(failure).not.toContain("MV-ASSET-MISSING");
            } else {
              expect(failure).toContain(
                branch === "file-missing"
                  ? "error MV-ASSET-MISSING-FILE"
                  : "error MV-ASSET-INVALID-DATA",
              );
              expect(failure).toContain(dataPathFor(field));
              expect(failure).toContain(transferOrigin.nativePath);
            }
            expect(await state(root)).toEqual(before);
          }
        }
        const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
        recordAssetInput({ cliResult: cli });
        expect(cli.exitCode === 0).toBe(successful);
        if (branch === "file-missing")
          expect(cli.stderr).toContain(
            `${field.family === "B09" ? "warning" : "error"} MV-ASSET-MISSING-FILE`,
          );
        if (!successful) expect(await state(root)).toEqual(before);
        if (branch !== "target-missing") {
          const expected = expectedFor(field),
            failed = expected.find((use) => use.name === field.name)!;
          if (branch === "field-empty") {
            expect((await observed(root)).relations).toEqual({
              uses: expected.filter((use) => use.name !== field.name),
              problems: [],
              stops: [],
            });
          } else if (branch === "field-missing" || branch === "field-wrong-type") {
            const { category: _category, folder: _folder, name: _name, ...origin } = failed;
            expect(collected(field, overrides)).toEqual({
              uses: expected.filter((use) => use.name !== field.name),
              problems: [
                {
                  ...origin,
                  dataPath: dataPathFor(field),
                  reason: "Necessary asset name must be a string; this relationship is unchecked.",
                },
              ],
              stops: [],
            });
          } else {
            expect(collected(field, {})).toEqual({ uses: expected, problems: [], stops: [] });
          }
        }
      });
    });
  }
}

for (const audioField of ["bgm", "bgs"] as const)
  it(`AV.C08.autoplay-${audioField}-off.formal.case.expected: disabled saved autoplay remains an explicit inactive use with a warning and unchanged Check state`, async () => {
    await withWindowsSandbox(`asset-map-autoplay-${audioField}`, async (sandbox) => {
      const root = sandbox.workspaceRoot,
        flag = audioField === "bgm" ? "autoplayBgm" : "autoplayBgs",
        saved = { ...targetMap(), [flag]: false };
      await prepare(root, source(), { "Map002.json": saved });
      await allMedia(
        root,
        fields.filter((f) => f.token !== audioField),
      );
      const before = await state(root);
      await compileWorkspace({ workspaceRoot: root, check: true });
      expect(await state(root)).toEqual(before);
      const cli = await runCli(sandbox, ["compile", "--check"]);
      recordAssetInput({ cliResult: cli });
      expect(cli.stderr).toContain("warning MV-ASSET-MISSING-FILE");
      expect(cli.stderr).toContain(`Map ${flag} is false`);
      expect(cli.stderr).toContain("inactive:");
      expect(await state(root)).toEqual(before);
      await compileWorkspace({ workspaceRoot: root, check: false });
      const expected = transferExpected().map((use) =>
        use.folder === audioField
          ? { ...use, inactive: `Map ${flag} is false; the saved ${audioField} is inactive.` }
          : use,
      );
      expect((await observed(root)).relations).toEqual({ uses: expected, problems: [], stops: [] });
    });
  });

it("AV.C12.transfer-network.formal.case.expected: target Map's event network, battlebacks and live newer metadata never expand captured fixed transfer uses", async () => {
  await withWindowsSandbox("asset-map-transfer-network", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    const target = {
      ...targetMap(),
      events: [
        null,
        {
          id: 1,
          name: "Removed target network",
          x: 0,
          y: 0,
          pages: [
            {
              list: [
                {
                  code: 231,
                  indent: 0,
                  parameters: [1, "ExcludedPicture", 0, 0, 0, 0, 100, 100, 255, 0],
                },
                { code: 0, indent: 0, parameters: [] },
              ],
            },
          ],
        },
      ],
    };
    await prepare(root, source(), { "Map002.json": target });
    await allMedia(root);
    await writeFile(
      join(root, "Game/data/Map002.json"),
      JSON.stringify({ ...targetMap(), parallaxName: "LiveNewSky" }),
    );
    const before = await state(root);
    await compileWorkspace({ workspaceRoot: root, check: true });
    expect(await state(root)).toEqual(before);
    const cli = await runCli(sandbox, ["compile", "--check"]);
    recordAssetInput({ cliResult: cli });
    expect(cli.stderr).not.toContain("MV-ASSET-");
    await compileWorkspace({ workspaceRoot: root, check: false });
    const actual = await observed(root);
    expect(actual.relations).toEqual({ uses: transferExpected(), problems: [], stops: [] });
    expect(collectEventAssetUses(actual.files)).toEqual([]);
    expect(JSON.parse(actual.external.get("Map002.json")!)).toEqual(target);
    expect(JSON.parse(actual.files.get("Map002.json")!).events.filter(Boolean)).toEqual([]);
    expect(await readFile(join(root, "Game/data/Map002.json"), "utf8")).toContain("LiveNewSky");
  });
});
pageCase(pageFields[0]!, "missing");

for (const representation of ["formal", "raw"]) {
  it(`AV.C05.dynamic-transfer.${representation}.case.expected: variable destination stops with its saved origin while fixed Map siblings remain independently checked`, async () => {
    await withWindowsSandbox(`asset-dynamic-transfer-${representation}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      const dynamic =
        representation === "raw"
          ? "rawDslCommand({code:201,parameters:[1,1,1,1,0,0]})"
          : 'transferPlayer({destination:{kind:"variables",map:variableRef({id:1}),x:variableRef({id:1}),y:variableRef({id:1})}})';
      await prepare(
        root,
        source(`${dynamic},${transfer(representation)}`) +
          'export const destinationVariable=variableDefinition({id:1,name:"Destination"});',
      );
      const paths = await allMedia(root);
      const before = await state(root);
      await compileWorkspace({ workspaceRoot: root, check: true });
      expect(await state(root)).toEqual(before);
      const cli = await runCli(sandbox, ["compile", "--check"]);
      recordAssetInput({ cliResult: cli });
      expect(cli.stderr).toContain("info MV-ASSET-DYNAMIC-STOP");
      expect(cli.stderr).toContain("Map001.json.events[1].pages[0].list[0].parameters[1]");
      expect(cli.stderr).toContain("variable");
      expect(cli.stderr).not.toContain("MV-ASSET-MISSING");
      expect(await state(root)).toEqual(before);
      await compileWorkspace({ workspaceRoot: root, check: false });
      const actual = await observed(root);
      expect(actual.relations).toEqual({
        uses: transferExpected().map((use) => ({
          ...use,
          nativePath: "Map001.json.events[1].pages[0].list[1].parameters[1]",
        })),
        problems: [],
        stops: [
          {
            identity: "map:1/event:1",
            nativePath: "Map001.json.events[1].pages[0].list[0].parameters[1]",
            relatedNativePaths: [],
            dependencyChain: [],
            conditions: [],
            reason:
              "Transfer destination Map is selected by a runtime variable; this path has no fixed Map candidate and is unchecked.",
          },
        ],
      });
      await rm(paths.get("parallax")!);
      const missing = await state(root);
      const failure = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
      recordAssetInput({ cliResult: failure });
      expect(failure.exitCode).not.toBe(0);
      expect(failure.stderr).toContain("info MV-ASSET-DYNAMIC-STOP");
      expect(failure.stderr).toContain("Map002.json.parallaxName");
      expect(failure.stderr).toContain("list[1].parameters[1]");
      expect(await state(root)).toEqual(missing);
    });
  });
}

for (const field of ["bgm", "bgs"] as const)
  for (const variant of ["missing", "wrong-type"]) {
    it(`AV.C07.map-autoplay-${field}-${variant}.formal.case.expected: unreadable saved autoplay is a necessary-field error and safe Map siblings remain checked`, async () => {
      await withWindowsSandbox(`asset-map-flag-${field}-${variant}`, async (sandbox) => {
        const root = sandbox.workspaceRoot,
          flag = field === "bgm" ? "autoplayBgm" : "autoplayBgs",
          saved = targetMap() as Record<string, unknown>;
        if (variant === "missing") delete saved[flag];
        else saved[flag] = 17;
        await prepare(root, source(), { "Map002.json": saved });
        await allMedia(root);
        const before = await state(root);
        for (const check of [true, false]) {
          const failure = await compileWorkspace({ workspaceRoot: root, check }).then(
            () => "",
            String,
          );
          expect(failure).toContain(`error MV-ASSET-INVALID-DATA: Map002.json.${flag}`);
          expect(await state(root)).toEqual(before);
          expect(
            collected(reached.find((item) => item.family === "B08" && item.token === field)!, {
              "Map002.json": saved,
            }),
          ).toEqual({
            uses: transferExpected().filter((use) => use.folder !== field),
            problems: [
              {
                ...transferOrigin,
                dependencyChain: [
                  {
                    data: "Map002.json",
                    field: flag,
                    relationship: "Transfer destination Map autoplay setting",
                  },
                ],
                conditions: [transferCondition],
                dataPath: `Map002.json.${flag}`,
                reason:
                  "Necessary Map autoplay setting must be boolean; this audio relationship is unchecked.",
              },
            ],
            stops: [],
          });
        }
        const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
        recordAssetInput({ cliResult: cli });
        expect(cli.exitCode).not.toBe(0);
        expect(cli.stderr).toContain(`Map002.json.${flag}`);
        expect(await state(root)).toEqual(before);
      });
    });
  }

for (const variant of ["missing", "wrong-type", "absent-tileset"]) {
  it(`AV.C07.map-tileset-${variant}.formal.case.expected: transfer's required Map tileset relation fails explicitly while parallax and audio siblings survive collection`, async () => {
    await withWindowsSandbox(`asset-map-tileset-${variant}`, async (sandbox) => {
      const root = sandbox.workspaceRoot,
        saved = targetMap() as Record<string, unknown>;
      if (variant === "missing") delete saved.tilesetId;
      else saved.tilesetId = variant === "wrong-type" ? "2" : 99;
      const overrides = { "Map002.json": saved };
      await prepare(root, source(), overrides);
      await allMedia(root);
      const before = await state(root);
      const dataPath = variant === "absent-tileset" ? "Tilesets.json[99]" : "Map002.json.tilesetId";
      for (const check of [true, false]) {
        const failure = await compileWorkspace({ workspaceRoot: root, check }).then(
          () => "",
          String,
        );
        expect(failure).toContain(`error MV-ASSET-INVALID-DATA: ${dataPath}`);
        expect(failure).not.toContain("MV-ASSET-MISSING");
        expect(await state(root)).toEqual(before);
      }
      const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
      recordAssetInput({ cliResult: cli });
      expect(cli.exitCode).not.toBe(0);
      expect(cli.stderr).toContain(dataPath);
      expect(await state(root)).toEqual(before);
      expect(collected(reached[0]!, overrides)).toEqual({
        uses: transferExpected().filter((use) => use.folder !== "tilesets"),
        problems: [
          {
            ...transferOrigin,
            dependencyChain: [
              {
                data: "Map002.json",
                field: "tilesetId",
                relationship: "Transfer destination Map tileset",
              },
            ],
            conditions: [transferCondition],
            dataPath,
            reason:
              variant === "absent-tileset"
                ? "Selected standard-data entry must be an object; this relationship is unchecked."
                : "Necessary Map tilesetId must be a positive integer; this relationship is unchecked.",
          },
        ],
        stops: [],
      });
    });
  });
}
it("AV.C06.none-map-audio-ignores-autoplay.formal.case.expected: absent audio name makes an unrelated autoplay value unnecessary without normalizing saved data", async () => {
  await withWindowsSandbox("asset-map-none-autoplay", async (sandbox) => {
    const root = sandbox.workspaceRoot,
      saved = { ...targetMap(), bgm: audio(""), autoplayBgm: 17 };
    await prepare(root, source(), { "Map002.json": saved });
    await allMedia(
      root,
      fields.filter((field) => field.token !== "bgm"),
    );
    const before = await state(root);
    await compileWorkspace({ workspaceRoot: root, check: true });
    expect(await state(root)).toEqual(before);
    const cli = await runCli(sandbox, ["compile", "--check"]);
    recordAssetInput({ cliResult: cli });
    expect(cli.stderr).not.toContain("MV-ASSET-");
    expect(await state(root)).toEqual(before);
    await compileWorkspace({ workspaceRoot: root, check: false });
    const actual = await observed(root);
    expect(actual.relations).toEqual({
      uses: transferExpected().filter((use) => use.folder !== "bgm"),
      problems: [],
      stops: [],
    });
    expect(JSON.parse(actual.external.get("Map002.json")!)).toEqual(saved);
  });
});
