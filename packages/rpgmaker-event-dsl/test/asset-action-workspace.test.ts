import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect } from "vitest";
import { createAssetTest, recordAssetInput } from "./support/asset-evidence.js";
import { createMinimalProject, runCli, withWindowsSandbox } from "./support/windows-sandbox.js";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";

const api: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const it = createAssetTest({ ownerTicket: "06", testSource: import.meta.url });
const imports =
  'import {commonEvent,forceAction,actorRef,skillRef,rawDslCommand,showPicture,imageAsset} from "rpgmaker-event-dsl";';
const common = (id: number, commands: string) =>
  `export const event${id}=commonEvent({id:${id},name:"Action ${id}",trigger:"none",commands:[${commands}]});`;
const force = (skillId = 1, representation: "formal" | "raw" = "formal") =>
  representation === "raw"
    ? `rawDslCommand({code:339,parameters:[1,1,${skillId},-1]})`
    : `forceAction({subject:{kind:"runtimeSelector",scope:"battler",target:"actor",actor:actorRef({id:1})},skill:skillRef({id:${skillId}}),target:{kind:"random"}})`;
const picture =
  'showPicture({pictureId:1,image:imageAsset({folder:"pictures",name:"EffectPoster"}),origin:"upperLeft",position:{kind:"direct",x:0,y:0},scaleX:100,scaleY:100,opacity:255,blendMode:"normal"})';
const audio = (name = "") => ({ name, volume: 17, pitch: 73, pan: -41 });
const fields = [
  {
    token: "image1",
    category: "image",
    folder: "animations",
    name: "SkillFirst",
    native: "animation1Name",
  },
  {
    token: "image2",
    category: "image",
    folder: "animations",
    name: "SkillSecond",
    native: "animation2Name",
  },
  {
    token: "se0",
    category: "audio",
    folder: "se",
    name: "SkillSound0",
    native: "timings[0].se.name",
  },
  {
    token: "se1",
    category: "audio",
    folder: "se",
    name: "SkillSound1",
    native: "timings[1].se.name",
  },
] as const;

async function prepare(
  root: string,
  authored: string,
  effects: unknown = [],
  actorEquips: unknown = [99],
) {
  const fixture = await createMinimalProject(root);
  const project = {
    "Actors.json": [null, { id: 1, name: "Actor", equips: actorEquips }],
    "Animations.json": [
      null,
      {
        id: 1,
        name: "Excluded default",
        animation1Name: "UnarmedFirst",
        animation2Name: "UnarmedSecond",
        timings: [],
      },
      {
        id: 2,
        name: "Selected",
        animation1Name: "SkillFirst",
        animation2Name: "SkillSecond",
        animation1Hue: 123,
        animation2Hue: 234,
        timings: [
          { frame: 0, se: audio("SkillSound0") },
          { frame: 7, se: audio("SkillSound1") },
        ],
      },
    ],
    "Skills.json": [
      null,
      { id: 1, name: "Selected", animationId: 2, effects },
      { id: 2, name: "Default attack", animationId: -1, effects: [] },
      { id: 3, name: "No animation", animationId: 0, effects: [] },
    ],
    "System.json": {
      ...fixture.projectFiles["System.json"],
      sounds: Array.from({ length: 24 }, (_, index) => audio(index === 9 ? "EnemyAttack" : "")),
    },
  };
  for (const [file, data] of Object.entries(project))
    await writeFile(join(root, "Game/data", file), JSON.stringify(data));
  await api.initWorkspace({ workspaceRoot: root, projectRoot: "./Game" });
  await api.cloneWorkspace({ workspaceRoot: root });
  await writeFile(join(root, "src/action.events.ts"), imports + authored);
  recordAssetInput({ source: authored, projectOverrides: project });
}

async function put(root: string, field: (typeof fields)[number]) {
  const path = join(
    root,
    "Game",
    field.category === "image" ? "img" : "audio",
    field.folder,
    `${field.name}.${field.category === "image" ? "png" : "ogg"}`,
  );
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, "");
  recordAssetInput({ ordinaryZeroByteFile: path });
  return path;
}

for (const representation of ["formal", "raw"] as const)
  for (const field of fields)
    for (const outcome of ["present", "missing"] as const)
      it(`AV.B05.positive-animation.${representation}.${field.token}.${outcome}: fixed Skill checks the selected Animation field`, async () => {
        await withWindowsSandbox(
          `asset-skill-${representation}-${field.token}-${outcome}`,
          async (sandbox) => {
            const root = sandbox.workspaceRoot;
            await prepare(root, common(1, force(1, representation)));
            for (const item of fields) await put(root, item);
            if (outcome === "missing")
              await rm(
                join(
                  root,
                  "Game",
                  field.category === "image" ? "img" : "audio",
                  field.folder,
                  `${field.name}.${field.category === "image" ? "png" : "ogg"}`,
                ),
              );
            const result = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
            expect(result.exitCode).toBe(outcome === "missing" ? 1 : 0);
            if (outcome === "missing") {
              expect(result.stderr).toContain("MV-ASSET-MISSING-FILE");
              expect(result.stderr).toContain(`Skills.json[1].animationId`);
              expect(result.stderr).toContain(`Animations.json[2].${field.native}`);
              expect(result.stderr).toContain(field.name);
            } else expect(result.stderr).not.toContain("MV-ASSET-");
          },
        );
      });

it("AV.C12.actor-default-attack.formal.case.expected: Actor default attack does not inspect fallback Animation", async () => {
  await withWindowsSandbox("asset-skill-default-scope", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root, common(1, force(2)));
    const result = await runCli(sandbox, ["compile", "--check"]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("MV-ASSET-DYNAMIC-STOP");
    expect(result.stderr).toContain("Skills.json[2].animationId");
    expect(result.stderr).not.toContain("UnarmedFirst");
    expect(result.stderr).not.toContain("EnemyAttack");
    expect(result.stderr).not.toContain("candidate:");
  });
});

it("AV.C12.initial-equipment.formal.case.expected: saved Actor equipment cannot resolve a runtime default attack", async () => {
  await withWindowsSandbox("asset-initial-equipment-scope", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root, common(1, force(2)), [], [1]);
    const result = await runCli(sandbox, ["compile", "--check"]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("MV-ASSET-DYNAMIC-STOP");
    expect(result.stderr).not.toContain("UnarmedFirst");
    expect(result.stderr).not.toContain("Weapons.json");
    expect(result.stderr).not.toContain("candidate:");
  });
});

it("AV.C06.zero-skill-animation.formal.case.expected: zero animation selects no Animation assets", async () => {
  await withWindowsSandbox("asset-skill-zero-scope", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root, common(1, force(3)));
    const result = await runCli(sandbox, ["compile", "--check"]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).not.toContain("MV-ASSET-");
  });
});

it("AV.C12.enemy-default-attack.formal.case.expected: an enemy default attack does not select System attack audio", async () => {
  await withWindowsSandbox("asset-enemy-default-scope", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    const enemyForce =
      'forceAction({subject:{kind:"runtimeSelector",scope:"battler",target:"enemy",index:0},skill:skillRef({id:2}),target:{kind:"random"}})';
    await prepare(root, common(1, enemyForce));
    const result = await runCli(sandbox, ["compile", "--check"]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("MV-ASSET-DYNAMIC-STOP");
    expect(result.stderr).not.toContain("EnemyAttack");
    expect(result.stderr).not.toContain("UnarmedFirst");
  });
});

it("AV.C12.skill-effects-field.formal.case.expected: an unselected Skill effects field is not necessary to check positive Animation assets", async () => {
  await withWindowsSandbox("asset-skill-effects-unselected", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root, common(1, force()), "not an effects array");
    for (const field of fields) await put(root, field);
    const result = await runCli(sandbox, ["compile", "--check"]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).not.toContain("MV-ASSET-");
  });
});

it("AV.C12.skill-effect.formal.case.expected: Skill Common Event effects do not add asset caller relationships", async () => {
  await withWindowsSandbox("asset-skill-effect-scope", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root, common(1, force()) + common(10, picture) + common(11, ""), [
      { code: 44, dataId: 10, value1: 17, value2: 23 },
      { code: 44, dataId: 11, value1: 31, value2: 47 },
    ]);
    for (const field of fields) await put(root, field);
    await mkdir(join(root, "Game/img/pictures"), { recursive: true });
    const result = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("commonEvent:10 CommonEvents.json[10].list[0].parameters[1]");
    expect(result.stderr).not.toContain("effects[0].dataId");
    expect(result.stderr).not.toContain(" -> commonEvent:");
  });
});

it("AV.C04.repeated-common-effect.formal.case.expected: repeated Skill effects do not duplicate a Common Event asset use", async () => {
  await withWindowsSandbox("asset-repeated-common-effect", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root, common(1, force()) + common(10, picture), [
      { code: 44, dataId: 10, value1: 17, value2: 23 },
      { code: 44, dataId: 10, value1: 31, value2: 47 },
    ]);
    for (const field of fields) await put(root, field);
    await mkdir(join(root, "Game/img/pictures"), { recursive: true });
    const result = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("MV-ASSET-MISSING-FILE");
    expect(
      result.stderr.match(
        /^\s*- error commonEvent:10 CommonEvents\.json\[10\]\.list\[0\]\.parameters\[1\]/gmu,
      ),
    ).toHaveLength(1);
    expect(result.stderr).not.toContain("Skill Common Event effect");
    expect(result.stderr).not.toContain(" -> commonEvent:");
  });
});
