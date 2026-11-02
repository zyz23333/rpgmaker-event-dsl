import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect } from "vitest";
import { createAssetTest, recordAssetInput } from "./support/asset-evidence.js";
import { createMinimalProject, runCli, withWindowsSandbox } from "./support/windows-sandbox.js";
import {
  startWorkspaceOperation,
  workspaceApiEntry,
} from "./support/workspace-operation-process.js";
import { getWorkspaceStatePaths } from "../src/workspace/state.js";
import { collectEventAssetUses } from "../src/validation/asset-uses.js";
import { collectMapAssetRelations } from "../src/validation/asset-map-relations.js";

const {
  initWorkspace,
  cloneWorkspace,
  compileWorkspace,
}: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const it = createAssetTest({ ownerTicket: "04", testSource: import.meta.url });
const routeIt = createAssetTest({ ownerTicket: "04,05", testSource: import.meta.url });
const tileIt = createAssetTest({ ownerTicket: "04,07", testSource: import.meta.url });
const imports =
  'import {mapEvent,showText,imageAsset,audioAsset,rawDslCommand,changeBattleBack,changeParallax,changeActorImages,changeVehicleImage,actorRef,setMovementRoute,scriptInput} from "rpgmaker-event-dsl";\n';
const source = (command: string, pageFields = "") =>
  `${imports}export const event=mapEvent({mapId:1,id:1,name:"Images",x:0,y:0,pages:[{conditions:{},trigger:"action",commands:[${command}]${pageFields}}]});`;
async function prepare(root: string, authored: string, overrides: Record<string, unknown> = {}) {
  await createMinimalProject(root);
  const project = {
    "MapInfos.json": [null, { id: 1, name: "Images" }],
    "Map001.json": { width: 1, height: 1, tilesetId: 1, events: [] },
    "Tilesets.json": [null, { id: 1, name: "Tiles" }],
    "Actors.json": [null, { id: 1, name: "Actor" }],
    ...overrides,
  };
  recordAssetInput({
    baseFixture: "packages/rpgmaker-event-dsl/test/fixtures/mv-evidence/common-event-project.json",
    source: authored,
    projectOverrides: project,
  });
  for (const [file, value] of Object.entries(project))
    await writeFile(join(root, "Game/data", file), JSON.stringify(value));
  await initWorkspace({ workspaceRoot: root, projectRoot: "./Game" });
  await cloneWorkspace({ workspaceRoot: root });
  await writeFile(join(root, "src/assets.events.ts"), authored);
}

const routeSource =
  'setMovementRoute({target:{kind:"runtimeSelector",scope:"character",target:"player"},route:{commands:[{kind:"changeImage",character:imageAsset({folder:"characters",name:"Route"}),characterIndex:7}]}})';
tileIt(
  "AV.C08.tile-with-character.formal.case.expected: tile page retains its inactive saved character name and independently selects its initial B-sheet candidate",
  async () => {
    await withWindowsSandbox("asset-tile-character", async (sandbox) => {
      const root = sandbox.workspaceRoot;
      await prepare(
        root,
        source("", `,image:{character:${image("characters", "Saved")},characterIndex:7,tileId:1}`),
        {
          "Tilesets.json": [
            null,
            { id: 1, name: "Tiles", tilesetNames: ["", "", "", "", "", "BaseB", "", "", ""] },
          ],
        },
      );
      await mkdir(join(root, "Game/img/characters"), { recursive: true });
      await mkdir(join(root, "Game/img/tilesets"), { recursive: true });
      await writeFile(join(root, "Game/img/tilesets/BaseB.png"), "");
      recordAssetInput({ ordinaryZeroByteFile: "Game/img/tilesets/BaseB.png" });
      const before = await state(root);
      const result = await runCli(sandbox, ["compile", "--check"]);
      recordAssetInput({ cliResult: result });
      expect(result.stderr).toContain("warning MV-ASSET-MISSING-FILE");
      expect(result.stderr).toContain("saved characterName is inactive");
      expect(await state(root)).toEqual(before);
      await compileWorkspace({ workspaceRoot: root, check: false });
      expect(await uses(root)).toEqual([
        {
          category: "image",
          folder: "characters",
          name: "Saved",
          identity: "map:1/event:1",
          nativePath: "Map001.json.events[1].pages[0].image.characterName",
          relatedNativePaths: [],
          dependencyChain: [],
          conditions: [],
          inactive: "Map Event Page uses a tile image; the saved characterName is inactive.",
        },
      ]);
      const paths = getWorkspaceStatePaths(root);
      const current = new Map<string, string>(),
        captured = new Map<string, string>();
      for (const file of await readdir(paths.generatedProjectDataDirectory))
        if (file.endsWith(".json"))
          current.set(
            file,
            await readFile(join(paths.generatedProjectDataDirectory, file), "utf8"),
          );
      for (const file of await readdir(paths.projectDataSnapshotDirectory))
        if (file.endsWith(".json"))
          captured.set(
            file,
            await readFile(join(paths.projectDataSnapshotDirectory, file), "utf8"),
          );
      expect(collectMapAssetRelations(current, captured)).toEqual({
        uses: [
          {
            category: "image",
            folder: "tilesets",
            name: "BaseB",
            identity: "map:1/event:1",
            nativePath: "Map001.json.events[1].pages[0].image.tileId",
            relatedNativePaths: [],
            dependencyChain: [
              {
                data: "Map001.json",
                field: "tilesetId",
                relationship: "Map Event Page initial host Tileset",
              },
              {
                data: "Tilesets.json",
                id: 1,
                field: "tilesetNames[5]",
                relationship: "Map Event Page tile image sheet",
              },
            ],
            conditions: [
              "Page tile bitmap is selected from the host Map's initial Tileset; map rendering may separately request every sheet.",
            ],
            candidate:
              "Map Event Page uses the host Map's initial Tileset; runtime tileset changes may override it.",
          },
        ],
        problems: [],
        stops: [],
      });
      expect([
        ...(await uses(root)),
        ...collectMapAssetRelations(current, captured).uses,
      ]).toHaveLength(2);
    });
  },
);

type ImageField = { token: string; folder: string; name: string; parameter: number };
type ImageVector = {
  family: string;
  code: number;
  parameters: unknown[];
  formal: string;
  fields: ImageField[];
  continuation?: { code: number; parameters: unknown[] }[];
};
const vectors: ImageVector[] = [];
const image = (folder: string, name: string) =>
  `imageAsset({folder:${JSON.stringify(folder)},name:${JSON.stringify(name)}})`;
async function tree(path: string): Promise<Record<string, string> | null> {
  const entries = await readdir(path, { withFileTypes: true }).catch((error: unknown) => {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  });
  if (entries === null) return null;
  const result: Record<string, string> = {};
  for (const entry of entries) {
    if (entry.isDirectory())
      for (const [name, bytes] of Object.entries((await tree(join(path, entry.name)))!))
        result[`${entry.name}/${name}`] = bytes;
    else result[entry.name] = (await readFile(join(path, entry.name))).toString("base64");
  }
  return result;
}
async function state(root: string) {
  const paths = getWorkspaceStatePaths(root);
  return {
    source: await tree(join(root, "src")),
    project: await tree(join(root, "Game")),
    snapshot: await tree(paths.projectDataSnapshotDirectory),
    generated: await tree(paths.generatedProjectDataDirectory),
    manifest: await readFile(paths.syncManifestPath, "utf8"),
    config: await readFile(join(root, "rpgmaker-event-dsl.config.json"), "utf8"),
  };
}
async function uses(root: string) {
  const path = getWorkspaceStatePaths(root).generatedProjectDataDirectory;
  const files = new Map<string, string>();
  for (const name of await readdir(path)) files.set(name, await readFile(join(path, name), "utf8"));
  return collectEventAssetUses(files);
}
async function page(root: string) {
  return JSON.parse(
    await readFile(
      join(getWorkspaceStatePaths(root).generatedProjectDataDirectory, "Map001.json"),
      "utf8",
    ),
  ).events[1].pages[0];
}
const expectedUse = (field: ImageField) => ({
  category: "image",
  folder: field.folder,
  name: field.name,
  identity: "map:1/event:1",
  nativePath: `Map001.json.events[1].pages[0].list[0].parameters[${field.parameter}]`,
  relatedNativePaths: [],
  dependencyChain: [],
  conditions: [],
});
async function materialize(root: string, fields: readonly ImageField[], omit?: ImageField) {
  recordAssetInput({
    files: fields.map((field) => ({
      path: `Game/img/${field.folder}/${field.name}.png`,
      ordinaryZeroByte: field !== omit,
    })),
    timing: "before the asset gate",
  });
  for (const field of fields) {
    await mkdir(join(root, "Game/img", field.folder), { recursive: true });
    if (field !== omit)
      await writeFile(join(root, "Game/img", field.folder, `${field.name}.png`), "");
  }
}
function matrix(vector: ImageVector) {
  vectors.push(vector);
  for (const field of vector.fields)
    for (const representation of ["formal", "raw"] as const)
      for (const outcome of ["present", "missing"] as const)
        it(`AV.${vector.family}.base.${representation}.${field.token}.${outcome}: each direct image field keeps its complete native origin`, async () => {
          await withWindowsSandbox(
            `asset-${vector.family}-${representation}-${field.token}-${outcome}`,
            async ({ workspaceRoot: root }) => {
              const raw = [
                { code: vector.code, parameters: vector.parameters },
                ...(vector.continuation ?? []),
              ]
                .map((record) => `rawDslCommand(${JSON.stringify(record)})`)
                .join(",");
              await prepare(root, source(representation === "formal" ? vector.formal : raw));
              await materialize(root, vector.fields);
              await compileWorkspace({ workspaceRoot: root, check: false });
              expect(await uses(root)).toEqual(vector.fields.map(expectedUse));
              expect((await page(root)).list[0].parameters).toEqual(vector.parameters);
              if (outcome === "missing") {
                await rm(join(root, "Game/img", field.folder, `${field.name}.png`));
                recordAssetInput({
                  removedFile: `Game/img/${field.folder}/${field.name}.png`,
                  timing: "before Check and Compile gates; after successful publication",
                });
              }
              const before = await state(root);
              if (outcome === "missing") {
                for (const check of [true, false]) {
                  const failure = await compileWorkspace({ workspaceRoot: root, check }).then(
                    () => "",
                    String,
                  );
                  expect(failure).toContain("MV-ASSET-MISSING-FILE");
                  expect(failure).toContain(expectedUse(field).nativePath);
                  expect(failure).toContain(JSON.stringify(field.name));
                  expect(await state(root)).toEqual(before);
                }
              } else {
                await compileWorkspace({ workspaceRoot: root, check: true });
                expect(await state(root)).toEqual(before);
                await compileWorkspace({ workspaceRoot: root, check: false });
                expect(await uses(root)).toEqual(vector.fields.map(expectedUse));
              }
            },
          );
        });
}

matrix({
  family: "A02",
  code: 101,
  parameters: ["Face", 9, 0, 2],
  continuation: [{ code: 401, parameters: ["Text"] }],
  formal: `showText({face:{image:${image("faces", "Face")},index:9},background:"window",position:"bottom",lines:["Text"]})`,
  fields: [{ token: "p0", folder: "faces", name: "Face", parameter: 0 }],
});
matrix({
  family: "A13",
  code: 283,
  parameters: ["Back1", "Back2"],
  formal: `changeBattleBack({battleback1:${image("battlebacks1", "Back1")},battleback2:${image("battlebacks2", "Back2")}})`,
  fields: [
    { token: "p0", folder: "battlebacks1", name: "Back1", parameter: 0 },
    { token: "p1", folder: "battlebacks2", name: "Back2", parameter: 1 },
  ],
});
matrix({
  family: "A14",
  code: 284,
  parameters: ["Sky", true, false, 3, -7],
  formal: `changeParallax({image:${image("parallaxes", "Sky")},loopX:true,loopY:false,sx:3,sy:-7})`,
  fields: [{ token: "p0", folder: "parallaxes", name: "Sky", parameter: 0 }],
});
matrix({
  family: "A15",
  code: 322,
  parameters: [1, "Character", 7, "Face", 9, "Battler"],
  formal: `changeActorImages({actor:actorRef({id:1}),character:{image:${image("characters", "Character")},index:7},face:{image:${image("faces", "Face")},index:9},battler:${image("sv_actors", "Battler")}})`,
  fields: [
    { token: "p1", folder: "characters", name: "Character", parameter: 1 },
    { token: "p3", folder: "faces", name: "Face", parameter: 3 },
    { token: "p5", folder: "sv_actors", name: "Battler", parameter: 5 },
  ],
});
matrix({
  family: "A16",
  code: 323,
  parameters: [0, "Vehicle", 7],
  formal: `changeVehicleImage({vehicle:"boat",image:${image("characters", "Vehicle")},index:7})`,
  fields: [{ token: "p1", folder: "characters", name: "Vehicle", parameter: 1 }],
});

for (const outcome of ["present", "missing"] as const)
  it(`AV.A01.base.page.characterName.${outcome}: page image is selected from saved state`, async () => {
    await withWindowsSandbox(`asset-page-${outcome}`, async ({ workspaceRoot: root }) => {
      const field = { token: "characterName", folder: "characters", name: "Page", parameter: 0 };
      await prepare(
        root,
        source("", `,image:{character:${image("characters", "Page")},characterIndex:7}`),
      );
      await materialize(root, [field]);
      await compileWorkspace({ workspaceRoot: root, check: false });
      expect(await uses(root)).toEqual([
        { ...expectedUse(field), nativePath: "Map001.json.events[1].pages[0].image.characterName" },
      ]);
      expect((await page(root)).image).toEqual({
        characterName: "Page",
        characterIndex: 7,
        tileId: 0,
        direction: 2,
        pattern: 0,
      });
      if (outcome === "missing") await rm(join(root, "Game/img/characters/Page.png"));
      const before = await state(root);
      if (outcome === "missing") {
        for (const check of [true, false]) {
          const failure = await compileWorkspace({ workspaceRoot: root, check }).then(
            () => "",
            String,
          );
          expect(failure).toContain("MV-ASSET-MISSING-FILE");
          expect(failure).toContain("Map001.json.events[1].pages[0].image.characterName");
          expect(await state(root)).toEqual(before);
        }
      } else {
        await compileWorkspace({ workspaceRoot: root, check: true });
        expect(await state(root)).toEqual(before);
        await compileWorkspace({ workspaceRoot: root, check: false });
        expect(await uses(root)).toEqual([
          {
            ...expectedUse(field),
            nativePath: "Map001.json.events[1].pages[0].image.characterName",
          },
        ]);
      }
    });
  });

const routeRecord = { code: 41, parameters: ["Route", 7] };
const nativeRoute = {
  list: [routeRecord, { code: 0 }],
  repeat: false,
  skippable: false,
  wait: false,
};
const formalRoute = {
  list: [
    { code: 41, parameters: ["Route", 7] },
    { code: 0, parameters: [] },
  ],
  repeat: true,
  skippable: false,
  wait: false,
};
const rawRoute = [
  { code: 205, parameters: [-1, nativeRoute] },
  { code: 505, parameters: [routeRecord] },
]
  .map((record) => `rawDslCommand(${JSON.stringify(record)})`)
  .join(",");
const routeUse = {
  category: "image",
  folder: "characters",
  name: "Route",
  identity: "map:1/event:1",
  nativePath: "Map001.json.events[1].pages[0].list[0].parameters[1].list[0].parameters[0]",
  relatedNativePaths: ["Map001.json.events[1].pages[0].list[1].parameters[0].parameters[0]"],
  dependencyChain: [],
  conditions: [],
};
const autonomousUse = {
  ...routeUse,
  nativePath: "Map001.json.events[1].pages[0].moveRoute.list[0].parameters[0]",
  relatedNativePaths: [],
};
for (const [branch, representation, command, pageFields] of [
  [
    "autonomous",
    "page",
    "",
    `,movement:{type:"custom",route:{commands:[{kind:"changeImage",character:${image("characters", "Route")},characterIndex:7}]}}`,
  ],
  ["set-route", "formal", routeSource, ""],
  ["set-route", "raw", rawRoute, ""],
] as const)
  for (const outcome of ["present", "missing"] as const)
    it(`AV.A17.${branch}.${representation}.p0.${outcome}: route image keeps its original saved position and mirror`, async () => {
      await withWindowsSandbox(
        `asset-route-${branch}-${representation}-${outcome}`,
        async ({ workspaceRoot: root }) => {
          await prepare(root, source(command, pageFields));
          await materialize(root, [
            { token: "p0", folder: "characters", name: "Route", parameter: 0 },
          ]);
          await compileWorkspace({ workspaceRoot: root, check: false });
          expect(await uses(root)).toEqual([branch === "autonomous" ? autonomousUse : routeUse]);
          const actual = await page(root);
          if (branch === "autonomous") expect(actual.moveRoute).toEqual(formalRoute);
          else {
            expect(actual.list[0]).toEqual({
              code: 205,
              indent: 0,
              parameters: [-1, representation === "raw" ? nativeRoute : formalRoute],
            });
            expect(actual.list[1]).toEqual({ code: 505, indent: 0, parameters: [routeRecord] });
          }
          if (outcome === "missing") await rm(join(root, "Game/img/characters/Route.png"));
          const before = await state(root);
          for (const check of [true, false]) {
            if (outcome === "missing") {
              const failure = await compileWorkspace({ workspaceRoot: root, check }).then(
                () => "",
                String,
              );
              expect(failure).toContain("MV-ASSET-MISSING-FILE");
              expect(failure).toContain(
                (branch === "autonomous" ? autonomousUse : routeUse).nativePath,
              );
              if (branch === "set-route") expect(failure).toContain(routeUse.relatedNativePaths[0]);
              expect(failure).toContain("1 use(s)");
              expect(await state(root)).toEqual(before);
            } else {
              await compileWorkspace({ workspaceRoot: root, check });
              if (check) expect(await state(root)).toEqual(before);
            }
          }
        },
      );
    });

for (const vector of vectors)
  for (const field of vector.fields)
    it(`AV.C06.none-direct.formal.${vector.family}-base-${field.token}.expected: None omits only this field and preserves every other saved slot`, async () => {
      await withWindowsSandbox(
        `asset-none-${vector.family}-${field.token}`,
        async ({ workspaceRoot: root }) => {
          const authored = vector.formal.replace(image(field.folder, field.name), "null");
          const remaining = vector.fields.filter((value) => value !== field);
          await prepare(root, source(authored));
          await materialize(root, remaining);
          const before = await state(root);
          await compileWorkspace({ workspaceRoot: root, check: true });
          expect(await state(root)).toEqual(before);
          await compileWorkspace({ workspaceRoot: root, check: false });
          const parameters = [...vector.parameters];
          parameters[field.parameter] = "";
          expect((await page(root)).list[0].parameters).toEqual(parameters);
          expect(await uses(root)).toEqual(remaining.map(expectedUse));
        },
      );
    });

for (const [branch, fields, expectedImage, expectedRoute] of [
  [
    "none-direct",
    `,image:{character:null,characterIndex:7}`,
    { tileId: 0, characterName: "", characterIndex: 7, direction: 2, pattern: 0 },
    formalRoute,
  ],
  [
    "default-page-image",
    "",
    { tileId: 0, characterName: "", characterIndex: 0, direction: 2, pattern: 0 },
    formalRoute,
  ],
  [
    "default-page-route",
    "",
    { tileId: 0, characterName: "", characterIndex: 0, direction: 2, pattern: 0 },
    { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false },
  ],
  [
    "saved-image-index",
    `,image:{character:null,characterIndex:7}`,
    { tileId: 0, characterName: "", characterIndex: 7, direction: 2, pattern: 0 },
    formalRoute,
  ],
] as const)
  it(`AV.C06.${branch}.formal.${branch === "none-direct" ? "A01-base-characterName" : "case"}.expected: page defaults and explicit None keep independent image indices`, async () => {
    await withWindowsSandbox(`asset-page-${branch}`, async ({ workspaceRoot: root }) => {
      await prepare(root, source("", fields));
      await compileWorkspace({ workspaceRoot: root, check: false });
      expect(await uses(root)).toEqual([]);
      const actual = await page(root);
      expect(actual.image).toEqual(expectedImage);
      if (branch === "default-page-route") expect(actual.moveRoute).toEqual(expectedRoute);
    });
  });

for (const branch of ["autonomous", "set-route"] as const)
  it(`AV.C06.none-direct.formal.A17-${branch}-p0.expected: route None keeps nondefault index without querying an image folder`, async () => {
    await withWindowsSandbox(`asset-route-none-${branch}`, async ({ workspaceRoot: root }) => {
      const noneRoute = routeSource.replace(
        'imageAsset({folder:"characters",name:"Route"})',
        "null",
      );
      await prepare(
        root,
        source(
          branch === "set-route" ? noneRoute : "",
          branch === "autonomous"
            ? `,movement:{type:"custom",route:{commands:[{kind:"changeImage",character:null,characterIndex:7}]}}`
            : "",
        ),
      );
      await compileWorkspace({ workspaceRoot: root, check: false });
      expect(await uses(root)).toEqual([]);
      const actual = await page(root);
      const route = branch === "autonomous" ? actual.moveRoute : actual.list[0].parameters[1];
      expect(route.list).toEqual([
        { code: 41, parameters: ["", 7] },
        { code: 0, parameters: [] },
      ]);
      if (branch === "set-route")
        expect(actual.list[1].parameters).toEqual([{ code: 41, parameters: ["", 7] }]);
    });
  });

it("AV.C06.none-direct.raw.A07-base-p1.expected: recognized raw Show Picture None preserves every saved control", async () => {
  await withWindowsSandbox("asset-picture-raw-none", async ({ workspaceRoot: root }) => {
    const parameters = [9, "", 1, 0, -7, 13, 23, 41, 91, 2];
    await prepare(
      root,
      source(`rawDslCommand({code:231,parameters:${JSON.stringify(parameters)}})`),
    );
    await compileWorkspace({ workspaceRoot: root, check: false });
    expect(await uses(root)).toEqual([]);
    expect((await page(root)).list[0].parameters).toEqual(parameters);
  });
});

for (const branch of ["route-mirror", "independent-command", "repeated-command"] as const)
  it(`AV.C03.${branch}.formal.image.expected: mirrored route records count once and real commands retain independent origins on every run`, async () => {
    await withWindowsSandbox(`asset-count-${branch}`, async ({ workspaceRoot: root }) => {
      const second =
        branch === "route-mirror"
          ? ""
          : branch === "independent-command"
            ? `,changeVehicleImage({vehicle:"boat",image:${image("characters", "Route")},index:7})`
            : ` ,${routeSource}`;
      await prepare(root, source(routeSource + second));
      await materialize(root, [{ token: "p0", folder: "characters", name: "Route", parameter: 0 }]);
      await compileWorkspace({ workspaceRoot: root, check: false });
      const expected = [routeUse];
      if (branch === "independent-command")
        expected.push({
          ...routeUse,
          nativePath: "Map001.json.events[1].pages[0].list[2].parameters[1]",
          relatedNativePaths: [],
        });
      if (branch === "repeated-command")
        expected.push({
          ...routeUse,
          nativePath: "Map001.json.events[1].pages[0].list[2].parameters[1].list[0].parameters[0]",
          relatedNativePaths: [
            "Map001.json.events[1].pages[0].list[3].parameters[0].parameters[0]",
          ],
        });
      expect(await uses(root)).toEqual(expected);
      await rm(join(root, "Game/img/characters/Route.png"));
      const before = await state(root);
      for (const check of [true, false, true]) {
        const failure = await compileWorkspace({ workspaceRoot: root, check }).then(
          () => "",
          String,
        );
        expect(failure).toContain(`${expected.length} use(s)`);
        for (const use of expected) expect(failure).toContain(use.nativePath);
        expect(await state(root)).toEqual(before);
      }
    });
  });

for (const type of ["fixed", "random", "approach"] as const)
  routeIt(
    `AV.C08.route-${type}.formal.case.expected: inactive saved image and SE routes report warnings through the actual CLI`,
    async () => {
      await withWindowsSandbox(`asset-warning-${type}`, async (sandbox) => {
        const root = sandbox.workspaceRoot;
        await prepare(
          root,
          source(
            "",
            `,movement:{type:"${type}",route:{commands:[{kind:"changeImage",character:${image("characters", "Route")},characterIndex:7}]}}`,
          ),
        );
        await mkdir(join(root, "Game/img/characters"), { recursive: true });
        const before = await state(root);
        const result = await runCli(sandbox, ["compile", "--check"]);
        recordAssetInput({ cliResult: result });
        expect(result.exitCode).toBe(0);
        expect(result.stderr).toContain("asset check warning");
        expect(result.stderr).toContain("warning MV-ASSET-MISSING-FILE");
        expect(result.stderr).toContain(
          `Autonomous Movement is ${type}; the saved route is inactive.`,
        );
        expect(result.stderr).toContain(autonomousUse.nativePath);
        expect(await state(root)).toEqual(before);
        await compileWorkspace({ workspaceRoot: root, check: false });
        expect(await uses(root)).toEqual([
          {
            ...autonomousUse,
            inactive: `Autonomous Movement is ${type}; the saved route is inactive.`,
          },
        ]);
      });
      await withWindowsSandbox(`asset-warning-se-${type}`, async (sandbox) => {
        const root = sandbox.workspaceRoot;
        await prepare(
          root,
          source(
            "",
            `,movement:{type:"${type}",route:{commands:[{kind:"playSe",audio:{asset:audioAsset({folder:"se",name:"RouteSE"}),volume:17,pitch:73,pan:-41}}]}}`,
          ),
        );
        await mkdir(join(root, "Game/audio/se"), { recursive: true });
        const before = await state(root);
        const result = await runCli(sandbox, ["compile", "--check"]);
        recordAssetInput({ cliResult: result });
        expect(result.exitCode).toBe(0);
        expect(result.stderr).toContain("asset check warning");
        expect(result.stderr).toContain("warning MV-ASSET-MISSING-FILE");
        expect(result.stderr).toContain(
          `Autonomous Movement is ${type}; the saved route is inactive.`,
        );
        expect(result.stderr).toContain(
          "Map001.json.events[1].pages[0].moveRoute.list[0].parameters[0].name",
        );
        expect(await state(root)).toEqual(before);
        await compileWorkspace({ workspaceRoot: root, check: false });
        expect(await uses(root)).toEqual([
          {
            category: "audio",
            folder: "se",
            name: "RouteSE",
            identity: "map:1/event:1",
            nativePath: "Map001.json.events[1].pages[0].moveRoute.list[0].parameters[0].name",
            relatedNativePaths: [],
            dependencyChain: [],
            conditions: [],
            inactive: `Autonomous Movement is ${type}; the saved route is inactive.`,
          },
        ]);
      });
    },
  );

it("AV.C08.shared-active-inactive.formal.image.expected: the strongest level blocks a shared target while each origin retains its own level", async () => {
  await withWindowsSandbox("asset-shared-level", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(
      root,
      source(
        routeSource,
        `,movement:{type:"fixed",route:{commands:[{kind:"changeImage",character:${image("characters", "Route")},characterIndex:7}]}}`,
      ),
    );
    await mkdir(join(root, "Game/img/characters"), { recursive: true });
    const before = await state(root);
    const result = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
    recordAssetInput({ cliResult: result });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("error MV-ASSET-MISSING-FILE");
    expect(result.stderr).toContain(`warning map:1/event:1 ${autonomousUse.nativePath}`);
    expect(result.stderr).toContain(`error map:1/event:1 ${routeUse.nativePath}`);
    expect(result.stderr).toContain(routeUse.relatedNativePaths[0]);
    expect(result.stderr).toContain("2 use(s)");
    expect(await state(root)).toEqual(before);
  });
});

for (const [branch, name, system, expected, level] of [
  ["unsupported-name", "Bad/Name", undefined, "MV-ASSET-UNSUPPORTED-NAME", "warning"],
  [
    "unsupported-encryption",
    "Route",
    { switches: [""], variables: [""], hasEncryptedImages: true },
    "MV-ASSET-UNSUPPORTED-ENCRYPTION",
    "warning",
  ],
  [
    "invalid-data",
    "Route",
    { switches: [""], variables: [""], hasEncryptedImages: null },
    "MV-ASSET-INVALID-DATA",
    "error",
  ],
] as const)
  it(`AV.C08.inactive-${branch}.formal.image.expected: inactivity changes only allowed file-policy problems`, async () => {
    await withWindowsSandbox(`asset-inactive-${branch}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      await prepare(
        root,
        source(
          "",
          `,movement:{type:"fixed",route:{commands:[{kind:"changeImage",character:${image("characters", name)},characterIndex:7}]}}`,
        ),
        system ? { "System.json": system } : {},
      );
      const before = await state(root);
      const result = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
      recordAssetInput({ cliResult: result });
      expect(result.exitCode).toBe(level === "error" ? 1 : 0);
      expect(result.stderr).toContain(`${level} ${expected}`);
      expect(result.stderr).toContain("inactive");
      if (branch !== "invalid-data") expect(result.stderr).toContain("unchecked");
      expect(await state(root)).toEqual(before);
    });
  });

it("AV.C11.route-script.formal.case.expected: route scripts retain the Script Gate and their strings do not become image targets", async () => {
  await withWindowsSandbox("asset-route-script", async ({ workspaceRoot: root }) => {
    await prepare(
      root,
      source(
        'setMovementRoute({target:{kind:"runtimeSelector",scope:"character",target:"player"},route:{commands:[{kind:"script",script:scriptInput({code:"ImageManager.loadCharacter(\\\"Missing\\\");"})}]}})',
      ),
    );
    const before = await state(root);
    await expect(compileWorkspace({ workspaceRoot: root, check: true })).rejects.toThrow(/script/i);
    expect(await state(root)).toEqual(before);
    const config = join(root, "rpgmaker-event-dsl.config.json");
    const values = JSON.parse(await readFile(config, "utf8"));
    await writeFile(config, JSON.stringify({ ...values, scriptEnabled: true }));
    await compileWorkspace({ workspaceRoot: root, check: false });
    expect(await uses(root)).toEqual([]);
    expect((await page(root)).list[0].parameters[1].list[0]).toEqual({
      code: 45,
      parameters: ['ImageManager.loadCharacter("Missing");'],
    });
  });
});

it("AV.C08.inactive-query-failure.injected.image.expected: an inactive image cannot downgrade an inconclusive metadata query", async () => {
  await withWindowsSandbox("asset-inactive-query", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(
      root,
      source(
        "",
        `,movement:{type:"fixed",route:{commands:[{kind:"changeImage",character:${image("characters", "Route")},characterIndex:7}]}}`,
      ),
    );
    await materialize(root, [{ token: "p0", folder: "characters", name: "Route", parameter: 0 }]);
    const before = await state(root);
    const child = startWorkspaceOperation(sandbox, {
      operation: "check",
      mode: "cli",
      boundary: "asset-io-failure",
      assetPath: "img/characters/Route.png",
    });
    try {
      expect((await child.ended).exitCode).toBe(1);
      const result = sandbox.processes.at(-1)!;
      recordAssetInput({
        injected: "OS lstat throws EIO at Route.png; not a real ACL claim",
        result,
      });
      expect(result.stderr).toContain("error MV-ASSET-QUERY-FAILED");
      expect(result.stderr).toContain("inactive");
      expect(result.stderr).toContain(`error map:1/event:1 ${autonomousUse.nativePath}`);
    } finally {
      await child.stop();
    }
    expect(await state(root)).toEqual(before);
  });
});
