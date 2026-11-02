import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect } from "vitest";
import { collectForcedActionAssets } from "../../src/validation/asset-action-relations.js";
import { collectCommonEventCalls } from "../../src/validation/asset-common-calls.js";
import {
  collectEventAssetUses,
  nativeAssetEvents,
  type EventAssetUse,
} from "../../src/validation/asset-uses.js";
import { getWorkspaceStatePaths } from "../../src/workspace/state.js";
import { recordAssetInput } from "./asset-evidence.js";
import { createMinimalProject, runCli, withWindowsSandbox } from "./windows-sandbox.js";
import { workspaceApiEntry } from "./workspace-operation-process.js";

const api: typeof import("../../src/workspace-api.js") = await import(workspaceApiEntry);
const imports =
  'import {commonEvent,forceAction,actorRef,skillRef,callCommonEvent,commonEventRef,showPicture,imageAsset} from "rpgmaker-event-dsl";';
const common = (id: number, commands: string) =>
  `export const event${id}=commonEvent({id:${id},name:"Action graph ${id}",trigger:"none",commands:[${commands}]});`;
const force = (id = 1) =>
  `forceAction({subject:{kind:"runtimeSelector",scope:"battler",target:"actor",actor:actorRef({id:1})},skill:skillRef({id:${id}}),target:{kind:"random"}})`;
const call = (id: number) => `callCommonEvent({commonEvent:commonEventRef({id:${id}})})`;
const picture =
  'showPicture({pictureId:1,image:imageAsset({folder:"pictures",name:"EffectGraphPoster"}),origin:"upperLeft",position:{kind:"direct",x:0,y:0},scaleX:100,scaleY:100,opacity:255,blendMode:"normal"})';
async function tree(path: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const entry of await readdir(path, { withFileTypes: true })) {
    if (entry.name === "operation.lock" || entry.name === "node_modules") continue;
    if (entry.isDirectory())
      for (const [name, value] of Object.entries(await tree(join(path, entry.name))))
        result[`${entry.name}/${name}`] = value;
    else result[entry.name] = (await readFile(join(path, entry.name))).toString("base64");
  }
  return result;
}
async function published(root: string) {
  const paths = getWorkspaceStatePaths(root),
    files = new Map<string, string>(),
    external = new Map<string, string>();
  for (const file of await readdir(paths.generatedProjectDataDirectory))
    files.set(file, await readFile(join(paths.generatedProjectDataDirectory, file), "utf8"));
  for (const file of await readdir(paths.projectDataSnapshotDirectory))
    external.set(file, await readFile(join(paths.projectDataSnapshotDirectory, file), "utf8"));
  return { files, external, relations: collectForcedActionAssets(files, external) };
}
async function prepare(root: string, source: string, project: Record<string, unknown>) {
  await createMinimalProject(root);
  for (const [file, value] of Object.entries({
    "Actors.json": [null, { id: 1, name: "Graph Actor", equips: [99] }],
    ...project,
  }))
    await writeFile(join(root, "Game/data", file), JSON.stringify(value));
  recordAssetInput({ workspaceRoot: root, source: imports + source, project });
  await api.initWorkspace({ workspaceRoot: root, projectRoot: "./Game" });
  await api.cloneWorkspace({ workspaceRoot: root });
  await writeFile(join(root, "src/action-graph.events.ts"), imports + source);
}
const graphCases = {
  "self-cycle": {
    source: common(10, `${force()},${picture}`),
    targets: [10],
    identities: ["commonEvent:10"],
    useId: 10,
    pictureIndex: 1,
    direct: [],
  },
  "mutual-cycle": {
    source: common(10, force()) + common(11, `${call(10)},${picture}`),
    targets: [11],
    identities: ["commonEvent:10", "commonEvent:11"],
    useId: 11,
    pictureIndex: 1,
    direct: [[11, 0, 10]],
  },
  "long-acyclic": {
    source:
      common(10, force()) +
      [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map((id) => common(id, call(id + 1))).join("") +
      common(22, picture),
    targets: [11],
    identities: [
      "commonEvent:10",
      "commonEvent:11",
      "commonEvent:12",
      "commonEvent:13",
      "commonEvent:14",
      "commonEvent:15",
      "commonEvent:16",
      "commonEvent:17",
      "commonEvent:18",
      "commonEvent:19",
      "commonEvent:20",
      "commonEvent:21",
      "commonEvent:22",
    ],
    useId: 22,
    pictureIndex: 0,
    direct: [
      [11, 0, 12],
      [12, 0, 13],
      [13, 0, 14],
      [14, 0, 15],
      [15, 0, 16],
      [16, 0, 17],
      [17, 0, 18],
      [18, 0, 19],
      [19, 0, 20],
      [20, 0, 21],
      [21, 0, 22],
    ],
  },
  "shared-dag": {
    source:
      common(10, force()) +
      common(11, `${call(13)},${call(14)}`) +
      common(12, `${call(13)},${call(14)}`) +
      common(13, call(15)) +
      common(14, call(15)) +
      common(15, picture),
    targets: [11, 12],
    identities: [
      "commonEvent:10",
      "commonEvent:11",
      "commonEvent:12",
      "commonEvent:13",
      "commonEvent:14",
      "commonEvent:15",
    ],
    useId: 15,
    pictureIndex: 0,
    direct: [
      [11, 0, 13],
      [11, 1, 14],
      [12, 0, 13],
      [12, 1, 14],
      [13, 0, 15],
      [14, 0, 15],
    ],
  },
} as const;

/** Adds a separate literal Skill/effect graph inside an already registered shared case. */
export async function verifyForcedActionGraph(branch: keyof typeof graphCases): Promise<void> {
  const graph = graphCases[branch];
  await withWindowsSandbox(`asset-action-graph-${branch}`, async (sandbox) => {
    const root = sandbox.workspaceRoot;
    const project = {
      "Skills.json": [
        null,
        {
          id: 1,
          name: "Zero animation with all effects",
          animationId: 0,
          effects: graph.targets.map((dataId) => ({ code: 44, dataId, value1: 17, value2: 23 })),
        },
      ],
      "Animations.json": [null],
    };
    const expectedCalls = graph.targets.map((targetId, index) => ({
      caller: "commonEvent:10",
      nativePath: "CommonEvents.json[10].list[0].parameters[2]",
      target: `commonEvent:${targetId}`,
      targetId,
      dependencyChain: [
        {
          data: "Skills.json",
          id: 1,
          field: `effects[${index}].dataId`,
          relationship: "Skill Common Event effect",
        },
      ],
    }));
    const expectedUse = {
      category: "image",
      folder: "pictures",
      name: "EffectGraphPoster",
      identity: `commonEvent:${graph.useId}`,
      nativePath: `CommonEvents.json[${graph.useId}].list[${graph.pictureIndex}].parameters[1]`,
      relatedNativePaths: [],
      dependencyChain: [],
      conditions: [],
    };
    recordAssetInput({
      graph,
      expectedCalls,
      expectedUse,
      expectedUseCount: 1,
      traversal: "finite direct effects and117 only, no caller paths",
    });
    await prepare(root, graph.source, project);
    await mkdir(join(root, "Game/img/pictures"), { recursive: true });
    await writeFile(join(root, "Game/img/pictures/EffectGraphPoster.png"), "");
    const before = await tree(root);
    await api.compileWorkspace({ workspaceRoot: root, check: true });
    expect(await tree(root)).toEqual(before);
    await runCli(sandbox, ["compile", "--check"]);
    expect(await tree(root)).toEqual(before);
    await api.compileWorkspace({ workspaceRoot: root, check: false });
    const actual = await published(root);
    expect(nativeAssetEvents(actual.files).map(({ identity }) => identity)).toEqual(
      graph.identities,
    );
    expect(actual.relations).toEqual({ uses: [], problems: [], stops: [], calls: expectedCalls });
    expect(collectCommonEventCalls(actual.files)).toEqual(
      graph.direct.map(([caller, index, targetId]) => ({
        caller: `commonEvent:${caller}`,
        nativePath: `CommonEvents.json[${caller}].list[${index}].parameters[0]`,
        target: `commonEvent:${targetId}`,
        targetId,
        dependencyChain: [],
      })),
    );
    expect(collectEventAssetUses(actual.files)).toEqual([expectedUse]);
    expect(JSON.parse(actual.external.get("Skills.json")!)).toEqual(project["Skills.json"]);
  });
}

const weaponCondition =
  "Current equipped weapons are runtime state; initial Actor equipment does not determine them.";
const weaponStop =
  "The forced Actor's current weapons and their attack animations are runtime state; this branch is unchecked.";
const candidate = "Animation 1 applies only when the forced Actor has no current weapon.";
const animationFields = [
  {
    field: "animation1Name",
    category: "image",
    folder: "animations",
    names: ["SiblingUnarmed1", "SiblingSkill1"],
  },
  {
    field: "animation2Name",
    category: "image",
    folder: "animations",
    names: ["SiblingUnarmed2", "SiblingSkill2"],
  },
  {
    field: "timings[0].se.name",
    category: "audio",
    folder: "se",
    names: ["SiblingUnarmedSe0", "SiblingSkillSe0"],
  },
  {
    field: "timings[1].se.name",
    category: "audio",
    folder: "se",
    names: ["SiblingUnarmedSe1", "SiblingSkillSe1"],
  },
];
function expectedSiblingAnimation(unarmed: boolean): EventAssetUse[] {
  return animationFields.map((field) => ({
    identity: "commonEvent:1",
    nativePath: `CommonEvents.json[1].list[${unarmed ? 0 : 1}].parameters[2]`,
    relatedNativePaths: [],
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
    ...(unarmed ? { candidate } : {}),
  }));
}
export async function verifyForcedActionSibling(
  branch: "dynamic-target" | "known-sibling",
): Promise<void> {
  await withWindowsSandbox(`asset-action-shared-${branch}`, async (sandbox) => {
    const root = sandbox.workspaceRoot,
      known = branch === "known-sibling";
    const animations = [null, 1, 2].map((id) =>
      id === null
        ? null
        : {
            id,
            name: `Sibling ${id}`,
            animation1Name: id === 1 ? "SiblingUnarmed1" : "SiblingSkill1",
            animation2Name: id === 1 ? "SiblingUnarmed2" : "SiblingSkill2",
            timings: [0, 1].map((index) => ({
              frame: index,
              se: {
                name: id === 1 ? `SiblingUnarmedSe${index}` : `SiblingSkillSe${index}`,
                volume: 17,
                pitch: 73,
                pan: -41,
              },
            })),
          },
    );
    const project = {
      "Skills.json": [
        null,
        {
          id: 1,
          name: "Known siblings",
          animationId: 2,
          effects: [
            { code: 44, dataId: 10 },
            { code: 44, dataId: 11 },
          ],
        },
        { id: 2, name: "Current weapons unknown", animationId: -1, effects: [] },
      ],
      "Animations.json": animations,
    };
    await prepare(
      root,
      common(1, `${force(2)}${known ? `,${force(1)}` : ""}`) +
        (known
          ? common(10, picture) +
            common(11, picture.replace("EffectGraphPoster", "SecondGraphPoster"))
          : ""),
      project,
    );
    const expectedUses = [
      ...expectedSiblingAnimation(true),
      ...(known ? expectedSiblingAnimation(false) : []),
    ];
    for (const use of expectedUses)
      if (!(known && use.name === "SiblingSkill1")) {
        const path = join(
          root,
          "Game",
          use.category === "image" ? "img" : "audio",
          use.folder,
          `${use.name}.${use.category === "image" ? "png" : "ogg"}`,
        );
        await mkdir(join(path, ".."), { recursive: true });
        await writeFile(path, "");
      }
    if (known) {
      await mkdir(join(root, "Game/img/pictures"), { recursive: true });
      await writeFile(join(root, "Game/img/pictures/SecondGraphPoster.png"), "");
    }
    recordAssetInput({
      expectedUses,
      dynamicStop: weaponStop,
      knownEffectTargets: known ? [10, 11] : [],
    });
    const before = await tree(root);
    for (const check of [true, false]) {
      const failure = await api
        .compileWorkspace({ workspaceRoot: root, check })
        .then(() => "", String);
      if (known) {
        expect(failure).toContain("error MV-ASSET-MISSING-FILE");
        expect(failure).toContain("Animations.json[2].animation1Name");
        expect(failure).toContain("commonEvent:10 CommonEvents.json[10].list[0].parameters[1]");
        for (const index of [0, 1])
          expect(failure).toContain(`Skills.json[1].effects[${index}].dataId`);
        expect(await tree(root)).toEqual(before);
      } else {
        expect(failure).toBe("");
        if (check) expect(await tree(root)).toEqual(before);
      }
    }
    const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
    expect(cli.exitCode).toBe(known ? 1 : 0);
    expect(cli.stderr).toContain("info MV-ASSET-DYNAMIC-STOP");
    expect(cli.stderr).toContain(weaponStop);
    if (known) {
      expect(await tree(root)).toEqual(before);
      await writeFile(join(root, "Game/img/animations/SiblingSkill1.png"), "");
      await writeFile(join(root, "Game/img/pictures/EffectGraphPoster.png"), "");
    } else expect(cli.stderr).not.toContain("MV-ASSET-MISSING");
    await api.compileWorkspace({ workspaceRoot: root, check: false });
    const actual = await published(root);
    const origin = {
      identity: "commonEvent:1",
      nativePath: "CommonEvents.json[1].list[0].parameters[2]",
      relatedNativePaths: [],
      dependencyChain: [
        {
          data: "Skills.json",
          id: 2,
          field: "animationId",
          relationship: "Forced action Skill animation",
        },
      ],
      conditions: [weaponCondition],
    };
    expect(actual.relations).toEqual({
      uses: expectedUses,
      problems: [],
      stops: [{ ...origin, reason: weaponStop }],
      calls: known
        ? [10, 11].map((targetId, index) => ({
            caller: "commonEvent:1",
            nativePath: "CommonEvents.json[1].list[1].parameters[2]",
            target: `commonEvent:${targetId}`,
            targetId,
            dependencyChain: [
              {
                data: "Skills.json",
                id: 1,
                field: `effects[${index}].dataId`,
                relationship: "Skill Common Event effect",
              },
            ],
          }))
        : [],
    });
    expect(collectEventAssetUses(actual.files)).toEqual(
      known
        ? [10, 11].map((id) => ({
            category: "image",
            folder: "pictures",
            name: id === 10 ? "EffectGraphPoster" : "SecondGraphPoster",
            identity: `commonEvent:${id}`,
            nativePath: `CommonEvents.json[${id}].list[0].parameters[1]`,
            relatedNativePaths: [],
            dependencyChain: [],
            conditions: [],
          }))
        : [],
    );
  });
}
