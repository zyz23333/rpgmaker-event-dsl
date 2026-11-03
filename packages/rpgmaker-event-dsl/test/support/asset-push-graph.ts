import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { expect } from "vitest";
import { recordAssetInput } from "./asset-evidence.js";
import { preparePush, putPushFile, pushImports, pushPicture } from "./asset-push-workspace.js";
import type { WindowsSandbox } from "./windows-sandbox.js";

const call = (id: number) => `callCommonEvent({commonEvent:commonEventRef({id:${id}})})`;
const common = (id: number, commands: string) =>
  `export const event${id}=commonEvent({id:${id},name:"Graph ${id}",trigger:"none",commands:[${commands}]});\n`;
const picture = (name: string) => pushPicture.replace('name:"PushPoster"', `name:"${name}"`);
const force =
  'forceAction({subject:{kind:"runtimeSelector",scope:"battler",target:"actor",actor:actorRef({id:1})},skill:skillRef({id:1}),target:{kind:"random"}})';
export const graphSource =
  pushImports +
  common(10, `${call(11)},${call(12)},${force}`) +
  common(11, `${call(12)},${pushPicture}`) +
  common(12, call(11)) +
  `export const map=mapEvent({mapId:1,id:1,name:"Current map",x:0,y:0,pages:[{conditions:{},trigger:"action",commands:[${call(11)},${picture("MapPoster")}]}]});\n` +
  `export const troop=troopEvent({troopId:1,pages:[{commands:[${call(12)},${picture("TroopPoster")}]}]});\n`;
const oldCommands = [
  { code: 231, indent: 0, parameters: [1, "ObsoletePoster", 0, 0, 0, 0, 100, 100, 255, 0] },
  { code: 0, indent: 0, parameters: [] },
];
const oldPage = {
  conditions: {
    actorId: 1,
    actorValid: false,
    itemId: 1,
    itemValid: false,
    selfSwitchCh: "A",
    selfSwitchValid: false,
    switch1Id: 1,
    switch1Valid: false,
    switch2Id: 1,
    switch2Valid: false,
    variableId: 1,
    variableValid: false,
    variableValue: 0,
  },
  directionFix: false,
  image: { tileId: 0, characterName: "", characterIndex: 0, direction: 2, pattern: 1 },
  list: oldCommands,
  moveFrequency: 3,
  moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false },
  moveSpeed: 3,
  moveType: 0,
  priorityType: 1,
  stepAnime: false,
  through: false,
  trigger: 0,
  walkAnime: true,
};
const oldCommon = Array.from({ length: 10 }, (_, id) =>
  id === 9 ? { id: 9, name: "Removed common", trigger: 0, switchId: 1, list: oldCommands } : null,
);
const oldMap = Array.from({ length: 10 }, (_, id) =>
  id === 9 ? { id: 9, name: "Removed map event", x: 0, y: 0, pages: [oldPage] } : null,
);
export const graphMedia = [
  "img/pictures/PushPoster.png",
  "img/pictures/MapPoster.png",
  "img/pictures/TroopPoster.png",
  "img/animations/GraphFirst.png",
  "img/animations/GraphSecond.png",
  "audio/se/GraphSound.ogg",
];
export async function preparePushGraph(sandbox: WindowsSandbox) {
  const project = {
    "Actors.json": [
      null,
      { id: 1, name: "Graph actor", equips: [99], unknown: { preserve: true } },
    ],
    "CommonEvents.json": oldCommon,
    "Map001.json": {
      id: 1,
      width: 1,
      height: 1,
      tilesetId: 1,
      events: oldMap,
      custom: { preserved: ["opaque", null] },
    },
    "Troops.json": [
      null,
      {
        id: 1,
        name: "Graph troop",
        members: [],
        pages: [
          { conditions: {}, span: 0, list: oldCommands },
          { conditions: {}, span: 0, list: oldCommands },
        ],
        unknown: { preserve: true },
      },
    ],
    "Skills.json": [
      null,
      {
        id: 1,
        name: "Captured skill",
        animationId: 2,
        effects: [
          { code: 44, dataId: 11, value1: 17, value2: 23 },
          { code: 44, dataId: 12, value1: 31, value2: 47 },
        ],
        unknown: { preserve: true },
      },
      { id: 2, name: "Unselected missing asset", animationId: 99, effects: [] },
    ],
    "Animations.json": [
      null,
      null,
      {
        id: 2,
        name: "Captured animation",
        animation1Name: "GraphFirst",
        animation2Name: "GraphSecond",
        animation1Hue: 123,
        animation2Hue: 234,
        timings: [
          { frame: 7, se: { name: "GraphSound", volume: 17, pitch: 73, pan: -41 }, unknown: 23 },
        ],
        unknown: { preserve: true },
      },
    ],
  };
  await preparePush(sandbox, { source: graphSource, project });
  for (const path of graphMedia) await putPushFile(sandbox.workspaceRoot, `Game/${path}`);
  recordAssetInput({
    source: graphSource,
    project,
    graphMedia,
    obsoleteMedia:
      "ObsoletePoster.png intentionally absent; Snapshot-only Map/Common/Troop uses must not return",
  });
}
export async function verifyPushGraph(root: string) {
  async function readDirectory(name: string) {
    const directory = join(root, ".rpgmaker-event-dsl", name);
    return new Map(
      await Promise.all(
        (await readdir(directory)).map(
          async (file) => [file, await readFile(join(directory, file), "utf8")] as const,
        ),
      ),
    );
  }
  const files = await readDirectory("generated-project-data"),
    external = await readDirectory("project-data-snapshot");
  const expectedRoots = [
    "commonEvent:10",
    "commonEvent:11",
    "commonEvent:12",
    "map:1/event:1",
    "troop:1",
  ];
  const expectedUses = [
    ["PushPoster", "commonEvent:11", "CommonEvents.json[11].list[1].parameters[1]"],
    ["MapPoster", "map:1/event:1", "Map001.json.events[1].pages[0].list[1].parameters[1]"],
    ["TroopPoster", "troop:1", "Troops.json[1].pages[0].list[1].parameters[1]"],
  ].map(([name, identity, nativePath]) => ({
    category: "image",
    folder: "pictures",
    name,
    identity,
    nativePath,
    relatedNativePaths: [],
    dependencyChain: [],
    conditions: [],
  }));
  const actionOrigin = {
    identity: "commonEvent:10",
    nativePath: "CommonEvents.json[10].list[2].parameters[2]",
    relatedNativePaths: [],
  };
  const skillStep = {
    data: "Skills.json",
    id: 1,
    field: "animationId",
    relationship: "Forced action Skill animation",
  };
  const expectedActionUses = [
    {
      category: "image",
      folder: "animations",
      name: "GraphFirst",
      field: "animation1Name",
      relationship: "Animation image sheet",
      condition: "Animation image sheets may be preloaded before the command executes.",
    },
    {
      category: "image",
      folder: "animations",
      name: "GraphSecond",
      field: "animation2Name",
      relationship: "Animation image sheet",
      condition: "Animation image sheets may be preloaded before the command executes.",
    },
    {
      category: "audio",
      folder: "se",
      name: "GraphSound",
      field: "timings[0].se.name",
      relationship: "Animation timing sound effect",
      condition:
        "Animation timing SE plays only when its frame is reached and duplicate suppression permits playback.",
    },
  ].map(({ field, relationship, condition, ...asset }) => ({
    ...asset,
    ...actionOrigin,
    dependencyChain: [skillStep, { data: "Animations.json", id: 2, field, relationship }],
    conditions: [condition],
  }));
  const currentCommon = JSON.parse(files.get("CommonEvents.json")!);
  const currentMap = JSON.parse(files.get("Map001.json")!);
  const currentTroop = JSON.parse(files.get("Troops.json")!);
  const capturedSkills = JSON.parse(external.get("Skills.json")!);
  expect(currentCommon[9]).toBeNull();
  expect(currentCommon[10].list[2].parameters[2]).toBe(1);
  expect(currentCommon[11].list[1].parameters[1]).toBe("PushPoster");
  expect(currentMap.events[9]).toBeNull();
  expect(currentMap.events[1].pages[0].list[1].parameters[1]).toBe("MapPoster");
  expect(currentTroop[1].pages[0].list[1].parameters[1]).toBe("TroopPoster");
  expect(capturedSkills[1].animationId).toBe(2);
  recordAssetInput({
    generated: Object.fromEntries(files),
    capturedExternal: Object.fromEntries(external),
    expectedRoots,
    expectedUses,
    expectedActionUses,
    expected:
      "five current roots and six defining asset uses; Common calls and Skill effects do not add asset caller reports",
  });
  return { expectedUses, expectedActionUses };
}
