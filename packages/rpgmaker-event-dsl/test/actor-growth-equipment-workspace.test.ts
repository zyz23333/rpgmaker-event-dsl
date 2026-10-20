import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { createMinimalProject, withWindowsSandbox } from "./support/windows-sandbox.js";
import { blankEvent, blankPage } from "./support/map-event-fixtures.js";
import { discoverDefinitionFiles, loadDefinitionFile } from "../src/workspace/definitions.js";
import { getWorkspaceStatePaths } from "../src/workspace/state.js";

const { initWorkspace, cloneWorkspace, decompileWorkspace, compileWorkspace, diffWorkspace, pushWorkspace }:
  typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const discovery = { sourceRoot: "src", sourceInclude: ["**/*.events.ts", "**/*.dsl.ts"], sourceExclude: [] };
const fixture = JSON.parse(await readFile(new URL("./fixtures/mv-evidence/actor-growth-equipment-cases.json", import.meta.url), "utf8"));
const defaultBattlePage = JSON.parse(await readFile(new URL("./fixtures/mv-evidence/troop-event-project.json", import.meta.url), "utf8")).defaultPage;

async function prepare(workspaceRoot: string, commands = fixture.commands, threeContainers = false) {
  const { projectFiles } = await createMinimalProject(workspaceRoot);
  const files: Record<string, unknown> = structuredClone(projectFiles);
  files["Actors.json"] = [null, { id: 1, name: "Mira", classId: 1, external: [null, "keep"] }, { id: 2, name: "Noah", classId: 2 }];
  files["Classes.json"] = [null, { id: 1, name: "Fighter" }, { id: 2, name: "Mage" }];
  files["Skills.json"] = [null, { id: 1, name: "Heal" }, { id: 2, name: "Fire" }];
  files["Weapons.json"] = [null, null, null, { id: 3, name: "Weapon candidate", etypeId: 1 }];
  files["Armors.json"] = [null, null, null, { id: 3, name: "Armor candidate", etypeId: 2 }];
  Object.assign(files["System.json"] as object, { variables: ["", "", "", "TargetSlot", "AmountSlot"], equipTypes: ["", "Weapon", "Shield", "Head", "Body", "Ring", "Boots", "Cape"] });
  files["CommonEvents.json"] = [null, { id: 1, name: "Growth and equipment", trigger: 0, switchId: 1, list: structuredClone(commands) }];
  if (threeContainers) {
    files["MapInfos.json"] = [null, { id: 1, name: "Actor map" }];
    files["Tilesets.json"] = [null, { id: 1, name: "Field" }];
    files["Map001.json"] = { width: 17, height: 13, tilesetId: 1, external: "retain", events: [null, { ...structuredClone(blankEvent), pages: [{ ...structuredClone(blankPage), list: structuredClone(commands) }] }] };
    files["Troops.json"] = [null, { id: 1, name: "External troop", members: [], external: true, pages: [{ ...structuredClone(defaultBattlePage), list: structuredClone(commands) }] }];
  }
  for (const [name, value] of Object.entries(files)) await writeFile(join(workspaceRoot, "Game/data", name), JSON.stringify(value));
  await initWorkspace({ workspaceRoot, projectRoot: "./Game" });
  await cloneWorkspace({ workspaceRoot });
  return files;
}

async function tree(path: string): Promise<unknown> {
  try { return Object.fromEntries(await Promise.all((await readdir(path, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name)).map(async (entry) => [entry.name, entry.isDirectory() ? await tree(join(path, entry.name)) : await readFile(join(path, entry.name), "utf8")]))); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
}
async function data(path: string): Promise<Record<string, unknown>> {
  const files = await tree(path) as Record<string, string>;
  return Object.fromEntries(Object.entries(files).map(([name, value]) => [name, JSON.parse(value)]));
}
async function state(workspaceRoot: string) {
  const paths = getWorkspaceStatePaths(workspaceRoot);
  return {
    project: await tree(join(workspaceRoot, "Game/data")), snapshot: await tree(paths.projectDataSnapshotDirectory),
    generated: await tree(paths.generatedProjectDataDirectory), source: await tree(join(workspaceRoot, "src")),
    manifest: await readFile(paths.syncManifestPath, "utf8"), pending: await tree(paths.pendingPushDirectory),
    config: await readFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8"),
    descriptor: await readFile(join(workspaceRoot, "Game/Game.rpgproject"), "utf8"),
    discovery: await discoverDefinitionFiles(workspaceRoot, discovery),
  };
}

it("MV-S6-ACTOR-GROWTH-001: evaluates three-container growth and dynamic equipment source and installs complete independent carriers", async () => {
  await withWindowsSandbox("actor-batch-roundtrip", async ({ workspaceRoot }) => {
    const expected = await prepare(workspaceRoot, fixture.commands, true);
    await decompileWorkspace({ workspaceRoot });
    const files = await discoverDefinitionFiles(workspaceRoot, discovery);
    const declarations = (await Promise.all(files.map((file) => loadDefinitionFile(file)))).flat();
    expect(declarations.filter((value) => ["commonEvent", "mapEvent", "troopEvent"].includes(value.kind))).toHaveLength(3);
    const sourcePath = join(workspaceRoot, "src/decompiled/common-events.events.ts");
    const source = await readFile(sourcePath, "utf8");
    expect(source).toContain("showLevelUp: false");
    expect(source).toContain("keepExp: false");
    expect(source).toContain('scope: "equipment", target: "idForSlot", id: 999');
    expect(source).not.toMatch(/actorId:|equipmentTypeId|rawDslCommand/u);
    const before = await state(workspaceRoot);
    await compileWorkspace({ workspaceRoot, check: true });
    expect(await state(workspaceRoot)).toStrictEqual(before);
    await compileWorkspace({ workspaceRoot, check: false });
    const paths = getWorkspaceStatePaths(workspaceRoot);
    expect(await data(paths.generatedProjectDataDirectory)).toStrictEqual(Object.fromEntries(["CommonEvents.json", "Map001.json", "System.json", "Troops.json"].map((name) => [name, expected[name]])));
    await writeFile(sourcePath, source.replace("Growth and equipment", "Growth and equipment edited").replace('value: { kind: "constant", value: 1 }', 'value: { kind: "constant", value: 2 }'));
    await compileWorkspace({ workspaceRoot, check: false });
    expect(await diffWorkspace({ workspaceRoot })).toContain("[changed] commonEventId 1");
    const event = (expected["CommonEvents.json"] as Array<null | { name: string; list: Array<{ parameters: unknown[] }> }>)[1]!;
    event.name = "Growth and equipment edited";
    event.list[0]!.parameters[4] = 2;
    const beforePush = await state(workspaceRoot);
    await pushWorkspace({ workspaceRoot, allowDestructive: false });
    expect(Object.keys(await data(join(workspaceRoot, "Game/data")))).toHaveLength(15);
    expect(await data(join(workspaceRoot, "Game/data"))).toStrictEqual(expected);
    expect(await data(paths.projectDataSnapshotDirectory)).toStrictEqual(expected);
    const afterPush = await state(workspaceRoot);
    expect(afterPush.source).toStrictEqual(beforePush.source);
    expect(afterPush.discovery).toStrictEqual(beforePush.discovery);
    expect(afterPush.pending).toBeNull();
  });
});

for (const scenario of [
  { label: "growth", expression: 'const malformed: any = { target: { kind: "runtimeSelector", scope: "actor", target: "entireParty" }, operation: "gain", value: { kind: "constant", value: 1 } };', command: "changeExp(malformed)", error: /MV-E315-INPUT.*showLevelUp/u },
  { label: "equipment", expression: 'const malformed = { actor: actorRef({ id: 1 }), slotIndex: 7, equipment: null };', command: '{ kind: "changeEquipment", ...malformed }', error: /MV-E319-SLOTS.*parameters\[1\]/u },
]) it(`MV-S6-ACTOR-GROWTH-002: ${scenario.label} untyped source refuses Check Compile and stale Push without business writes`, async () => {
  await withWindowsSandbox(`actor-batch-refusal-${scenario.label}`, async ({ workspaceRoot }) => {
    await prepare(workspaceRoot, [{ code: 0, indent: 0, parameters: [] }]);
    await decompileWorkspace({ workspaceRoot });
    await compileWorkspace({ workspaceRoot, check: false });
    await writeFile(join(workspaceRoot, "src/decompiled/common-events.events.ts"), `import { commonEvent, actorRef, changeExp } from "rpgmaker-event-dsl";\n${scenario.expression}\nexport const invalid = commonEvent({ id: 1, name: "Invalid", trigger: "none", commands: [${scenario.command}] });\n`);
    const before = await state(workspaceRoot);
    await expect(compileWorkspace({ workspaceRoot, check: true })).rejects.toThrow(scenario.error);
    expect(await state(workspaceRoot)).toStrictEqual(before);
    await expect(compileWorkspace({ workspaceRoot, check: false })).rejects.toThrow(scenario.error);
    expect(await state(workspaceRoot)).toStrictEqual(before);
    await expect(pushWorkspace({ workspaceRoot, allowDestructive: false })).rejects.toThrow(/fresh|stale|compile|changed|baseline/iu);
    expect(await state(workspaceRoot)).toStrictEqual(before);
  });
});

it("MV-S6-ACTOR-EQUIPMENT-001: late native slot outside final System capacity fails before source publication", async () => {
  await withWindowsSandbox("actor-batch-native-slot-refusal", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot, [...fixture.commands.slice(0, -1), { code: 319, indent: 0, parameters: [1, 8, 0] }, { code: 0, indent: 0, parameters: [] }]);
    const before = await state(workspaceRoot);
    await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(/MV-E319-SLOTS.*list\[29\]\.parameters\[1\]/u);
    expect(await state(workspaceRoot)).toStrictEqual(before);
  });
});
