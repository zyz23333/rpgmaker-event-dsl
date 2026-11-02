import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import { collectActorEnemyAssets } from "../src/validation/asset-actor-enemy-relations.js";
import { createMinimalProject, runCli, withWindowsSandbox } from "./support/windows-sandbox.js";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
const {
  initWorkspace,
  cloneWorkspace,
  compileWorkspace,
}: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const roots = new Map([
  [
    "CommonEvents.json",
    JSON.stringify([
      null,
      {
        id: 1,
        name: "Selected",
        list: [{ code: 301, indent: 0, parameters: [0, 1, false, false] }],
      },
    ]),
  ],
]);
const origin = {
  identity: "commonEvent:1",
  nativePath: "CommonEvents.json[1].list[0].parameters[1]",
  relatedNativePaths: [],
  conditions: ["All saved Troop members are selected, including hidden members."],
};
function external(members: unknown, mode: unknown = false) {
  return new Map([
    ["Troops.json", JSON.stringify([null, { members }])],
    ["Enemies.json", JSON.stringify([null, { battlerName: "First" }, { battlerName: "Later" }])],
    ["System.json", JSON.stringify({ optSideView: mode })],
  ]);
}
it("retains the complete Troop members relationship when its necessary container cannot be interpreted", () => {
  expect(collectActorEnemyAssets(roots, external(null))).toEqual({
    uses: [],
    problems: [
      {
        ...origin,
        dependencyChain: [
          { data: "Troops.json", id: 1, field: "members", relationship: "Troop member Enemies" },
        ],
        dataPath: "Troops.json[1].members",
        reason: "Necessary Troop members must be an array; member relationships are unchecked.",
      },
    ],
  });
});
it("reports selected malformed member IDs and absent Enemies without losing a later safe member", () => {
  for (const broken of [null, { enemyId: "1" }, { enemyId: 0 }, { enemyId: 99 }]) {
    const result = collectActorEnemyAssets(roots, external([broken, { enemyId: 2, hidden: true }]));
    expect(result.uses).toEqual([
      {
        ...origin,
        category: "image",
        folder: "enemies",
        name: "Later",
        dependencyChain: [
          {
            data: "Troops.json",
            id: 1,
            field: "members[1].enemyId",
            relationship: "Troop member Enemy",
          },
          {
            data: "Enemies.json",
            id: 2,
            field: "battlerName",
            relationship: "Enemy battler image",
          },
        ],
        conditions: [
          ...origin.conditions,
          "Enemy battlers use img/enemies when System.optSideView is false.",
        ],
      },
    ]);
    expect(result.problems).toHaveLength(1);
    expect(result.problems[0]!.dataPath).toBe(
      broken && typeof broken.enemyId === "number" && broken.enemyId === 99
        ? "Enemies.json[99]"
        : "Troops.json[1].members[0].enemyId",
    );
    expect(result.problems[0]!.dependencyChain).toEqual([
      {
        data: "Troops.json",
        id: 1,
        field: "members[0].enemyId",
        relationship: "Troop member Enemy",
      },
    ]);
  }
});
it("requires a selected Enemy directory boolean without inventing either namespace or a file finding", () => {
  for (const mode of [null, 0, "false", undefined]) {
    const captured = external([{ enemyId: 1 }], mode);
    if (mode === undefined) captured.set("System.json", "{}");
    const result = collectActorEnemyAssets(roots, captured);
    expect(result.uses).toEqual([]);
    expect(result.problems).toEqual([
      {
        ...origin,
        dependencyChain: [
          {
            data: "Troops.json",
            id: 1,
            field: "members[0].enemyId",
            relationship: "Troop member Enemy",
          },
          {
            data: "Enemies.json",
            id: 1,
            field: "battlerName",
            relationship: "Enemy battler image",
          },
          { data: "System.json", field: "optSideView", relationship: "Enemy battler directory" },
        ],
        dataPath: "System.json.optSideView",
        reason: "Necessary optSideView must be boolean; the Enemy battler directory is unchecked.",
      },
    ]);
  }
});
async function prepare(root: string, mode: unknown, characterName: unknown) {
  await createMinimalProject(root);
  for (const [file, value] of Object.entries({
    "System.json": { switches: [""], variables: [""], optSideView: mode },
    "Actors.json": [null, { id: 1, name: "Actor", characterName, battlerName: "SavedBattler" }],
    "Enemies.json": [null, { id: 1, name: "Enemy", battlerName: "SavedEnemy" }],
  }))
    await writeFile(join(root, "Game/data", file), JSON.stringify(value));
  await initWorkspace({ workspaceRoot: root, projectRoot: "./Game" });
  await cloneWorkspace({ workspaceRoot: root });
  await writeFile(
    join(root, "src/selected.events.ts"),
    'import {commonEvent,enemyTransform,enemyRef,changePartyMember,actorRef} from "rpgmaker-event-dsl";export const event=commonEvent({id:1,name:"Selected",trigger:"none",commands:[enemyTransform({target:{kind:"runtimeSelector",scope:"enemy",target:"enemy",index:7},enemy:enemyRef({id:1})}),changePartyMember({actor:actorRef({id:1}),operation:"add",initialize:false})]});',
  );
  await mkdir(join(root, "Game/img/sv_actors"), { recursive: true });
  await writeFile(join(root, "Game/img/sv_actors/SavedBattler.png"), "");
}
it("reports an invalid Enemy directory input together with a bad Actor candidate field through real Workspace and CLI", async () => {
  await withWindowsSandbox("asset-battler-input-siblings", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root, "false", 17);
    const manifestPath = join(root, ".rpgmaker-event-dsl/sync-manifest.json"),
      before = await readFile(manifestPath, "utf8");
    for (const check of [true, false]) {
      const failure = await compileWorkspace({ workspaceRoot: root, check }).then(() => "", String);
      expect(failure).toContain("error MV-ASSET-INVALID-DATA: System.json.optSideView");
      expect(failure).toContain("error MV-ASSET-INVALID-DATA: Actors.json[1].characterName");
      expect(failure).not.toContain("MV-ASSET-MISSING-FILE");
      expect(await readFile(manifestPath, "utf8")).toBe(before);
    }
    const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
    expect(cli.exitCode).toBe(1);
    expect(cli.stderr).toContain("System.json.optSideView");
    expect(cli.stderr).toContain("Actors.json[1].characterName");
    expect(await readFile(manifestPath, "utf8")).toBe(before);
  });
});
it("uses one captured Actor Enemy and System view instead of newer live fields", async () => {
  await withWindowsSandbox("asset-battler-captured-view", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root, false, "SavedCharacter");
    for (const [folder, name] of [
      ["enemies", "SavedEnemy"],
      ["characters", "SavedCharacter"],
    ]) {
      await mkdir(join(root, "Game/img", folder!), { recursive: true });
      await writeFile(join(root, "Game/img", folder!, `${name}.png`), "");
    }
    for (const [file, value] of Object.entries({
      "System.json": { switches: [""], variables: [""], optSideView: true },
      "Actors.json": [
        null,
        { id: 1, name: "Actor", characterName: "NewCharacter", battlerName: "NewBattler" },
      ],
      "Enemies.json": [null, { id: 1, name: "Enemy", battlerName: "NewEnemy" }],
    }))
      await writeFile(join(root, "Game/data", file), JSON.stringify(value));
    const manifest = await readFile(join(root, ".rpgmaker-event-dsl/sync-manifest.json"), "utf8");
    await compileWorkspace({ workspaceRoot: root, check: true });
    await runCli(sandbox, ["compile", "--check"]);
    expect(await readFile(join(root, ".rpgmaker-event-dsl/sync-manifest.json"), "utf8")).toBe(
      manifest,
    );
    await compileWorkspace({ workspaceRoot: root, check: false });
    expect(await readFile(join(root, "Game/data/Enemies.json"), "utf8")).toContain("NewEnemy");
    expect(
      await readFile(join(root, ".rpgmaker-event-dsl/project-data-snapshot/Enemies.json"), "utf8"),
    ).toContain("SavedEnemy");
  });
});

it("removing an Actor does not interpret initial image candidates or infer party reordering assets", async () => {
  await withWindowsSandbox("asset-remove-actor-scope", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root, "unneeded mode", 17);
    await writeFile(
      join(root, "src/selected.events.ts"),
      'import {commonEvent,changePartyMember,actorRef} from "rpgmaker-event-dsl";export const event=commonEvent({id:1,name:"Remove only",trigger:"none",commands:[changePartyMember({actor:actorRef({id:1}),operation:"remove",initialize:true})]});',
    );
    const before = await readFile(join(root, ".rpgmaker-event-dsl/sync-manifest.json"), "utf8");
    await compileWorkspace({ workspaceRoot: root, check: true });
    const cli = await runCli(sandbox, ["compile", "--check"]);
    expect(cli.stderr).not.toContain("MV-ASSET-");
    expect(await readFile(join(root, ".rpgmaker-event-dsl/sync-manifest.json"), "utf8")).toBe(
      before,
    );
    await compileWorkspace({ workspaceRoot: root, check: false });
    expect(
      await readFile(join(root, ".rpgmaker-event-dsl/project-data-snapshot/Actors.json"), "utf8"),
    ).toContain('"characterName":17');
  });
});
