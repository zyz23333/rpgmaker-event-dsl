import { deepStrictEqual } from "node:assert/strict";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
const {
  cloneWorkspace,
  compileWorkspace,
  decompileWorkspace,
  diffWorkspace,
  initWorkspace,
  pullWorkspace,
  pushWorkspace,
}: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
import { createMinimalProject, withWindowsSandbox } from "./support/windows-sandbox.js";
import { loadSnapshotValidationInput } from "../src/workspace/operations.js";
import { getWorkspaceStatePaths } from "../src/workspace/state.js";
import { loadDefinitionFile } from "../src/workspace/definitions.js";
import { buildStagedDataGraph, validateStagedDataGraph } from "../src/validation/staged-graph.js";
async function createContextProject(workspaceRoot: string, validBattleMembers = false) {
  await createMinimalProject(workspaceRoot);
  const fixture = JSON.parse(
    await readFile(
      new URL("./fixtures/mv-evidence/map-battle-context-project.json", import.meta.url),
      "utf8",
    ),
  );
  // The frozen S3 fixture treated Troops as external. Supply the now-owned complete
  // default page independently; preserve the original historical fixture bytes.
  const troopFixture = JSON.parse(
    await readFile(
      new URL("./fixtures/mv-evidence/troop-event-project.json", import.meta.url),
      "utf8",
    ),
  );
  fixture.projectFiles["Troops.json"] = fixture.projectFiles["Troops.json"].map(
    (troop: Record<string, unknown> | null) =>
      troop === null ? null : { ...troop, pages: [structuredClone(troopFixture.defaultPage)] },
  );
  Object.assign(fixture.projectFiles["System.json"], {
    battleBgm: { name: "", volume: 90, pitch: 100, pan: 0 },
    victoryMe: { name: "", volume: 90, pitch: 100, pan: 0 },
    defeatMe: { name: "", volume: 90, pitch: 100, pan: 0 },
    sounds: Array.from({ length: 8 }, () => ({ name: "", volume: 90, pitch: 100, pan: 0 })),
  });
  // Only the successful fixed-launch scenario needs every member to resolve.
  // Other contexts retain the original absent Enemy99 and its saved member position.
  if (validBattleMembers) fixture.projectFiles["Troops.json"][4].members[1].enemyId = 1;
  Object.assign(fixture.projectFiles["Animations.json"][3], {
    animation1Name: "ContextAnimation",
    animation2Name: "",
    timings: [],
  });
  fixture.projectFiles["Enemies.json"][1].battlerName = "ContextEnemy";
  fixture.projectFiles["System.json"].optSideView = false;
  for (const [folder, names] of [
    ["animations", ["ContextAnimation"]],
    ["enemies", ["ContextEnemy"]],
    ["tilesets", ["A1", "A2", "B", "D"]],
  ] as const) {
    await mkdir(join(workspaceRoot, "Game/img", folder), { recursive: true });
    for (const name of names)
      await writeFile(join(workspaceRoot, "Game/img", folder, `${name}.png`), "");
  }
  for (const [name, value] of Object.entries(fixture.projectFiles))
    await writeFile(join(workspaceRoot, "Game", "data", name), JSON.stringify(value));
  await initWorkspace({ workspaceRoot, projectRoot: "./Game" });
  await cloneWorkspace({ workspaceRoot });
  return fixture;
}
it("resolves empty-name external targets through actual Snapshot and evaluated Decompiled Source", async () => {
  await withWindowsSandbox("snapshot-context", async ({ workspaceRoot }) => {
    const fixture = await createContextProject(workspaceRoot);
    await decompileWorkspace({ workspaceRoot });
    await compileWorkspace({ workspaceRoot, check: true });
    await compileWorkspace({ workspaceRoot, check: false });
    const stateRoot = join(workspaceRoot, ".rpgmaker-event-dsl");
    for (const name of ["CommonEvents.json", "System.json", "Map001.json"]) {
      deepStrictEqual(
        JSON.parse(await readFile(join(stateRoot, "generated-project-data", name), "utf8")),
        fixture.projectFiles[name],
      );
    }
    await writeFile(
      join(workspaceRoot, "src", "decompiled", "common-events.events.ts"),
      `import { commonEvent, rawDslCommand, enemyAppear, changeEquipment, actorRef } from "rpgmaker-event-dsl";
export const context = commonEvent({ id: 1, name: "Snapshot contexts", trigger: "none", commands: [
  rawDslCommand({ code: 212, indent: 0, parameters: [0, 3, false] }),
  rawDslCommand({ code: 282, indent: 0, parameters: [2] }),
  rawDslCommand({ code: 336, indent: 0, parameters: [0, 1] }),
  enemyAppear({ target: { kind: "runtimeSelector", scope: "enemy", target: "enemy", index: 2 } }),
  changeEquipment({ actor: actorRef({ id: 1 }), slotIndex: 0, equipment: { kind: "runtimeSelector", scope: "equipment", target: "idForSlot", id: 77 } }),
] });\n`,
    );
    await compileWorkspace({ workspaceRoot, check: true });
    await compileWorkspace({ workspaceRoot, check: false });
    deepStrictEqual(
      JSON.parse(
        await readFile(join(stateRoot, "generated-project-data", "CommonEvents.json"), "utf8"),
      ),
      fixture.projectFiles["CommonEvents.json"],
    );
    expect(await diffWorkspace({ workspaceRoot, short: true })).toContain("No changes.");
    await pushWorkspace({ workspaceRoot, allowDestructive: false });
    for (const [name, expected] of Object.entries(fixture.projectFiles)) {
      deepStrictEqual(
        JSON.parse(await readFile(join(workspaceRoot, "Game", "data", name), "utf8")),
        expected,
      );
      deepStrictEqual(
        JSON.parse(await readFile(join(stateRoot, "project-data-snapshot", name), "utf8")),
        expected,
      );
    }
  });
}, 30000);
it("rejects missing native external targets before publishing any Decompiled Source", async () => {
  for (const record of [
    { code: 212, indent: 0, parameters: [0, 99, false] },
    { code: 282, indent: 0, parameters: [99] },
    { code: 336, indent: 0, parameters: [0, 99] },
  ]) {
    await withWindowsSandbox(
      `snapshot-context-decompile-${record.code}`,
      async ({ workspaceRoot }) => {
        const fixture = await createContextProject(workspaceRoot);
        const invalid = [
          null,
          {
            id: 1,
            name: "Missing target",
            trigger: 0,
            switchId: 1,
            list: [record, { code: 0, indent: 0, parameters: [] }],
          },
        ];
        await writeFile(
          join(workspaceRoot, "Game", "data", "CommonEvents.json"),
          JSON.stringify(invalid),
        );
        await pullWorkspace({ workspaceRoot });
        await writeFile(join(workspaceRoot, "src", "user.events.ts"), "export {};\n");
        const stateRoot = join(workspaceRoot, ".rpgmaker-event-dsl");
        const manifest = await readFile(join(stateRoot, "sync-manifest.json"), "utf8");
        await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(
          new RegExp(
            `decompile common event 1\\.list\\[0\\]: MV-E${record.code}-REFERENCE parameters\\[${record.code === 282 ? 0 : 1}\\]`,
          ),
        );
        expect(await readdir(join(workspaceRoot, "src"))).toEqual(["user.events.ts"]);
        expect(await readFile(join(workspaceRoot, "src", "user.events.ts"), "utf8")).toBe(
          "export {};\n",
        );
        expect(await readFile(join(stateRoot, "sync-manifest.json"), "utf8")).toBe(manifest);
        deepStrictEqual(
          JSON.parse(
            await readFile(join(stateRoot, "project-data-snapshot", "CommonEvents.json"), "utf8"),
          ),
          invalid,
        );
        for (const [name, expected] of Object.entries({
          ...fixture.projectFiles,
          "CommonEvents.json": invalid,
        }))
          deepStrictEqual(
            JSON.parse(await readFile(join(workspaceRoot, "Game", "data", name), "utf8")),
            expected,
          );
      },
    );
  }
}, 30000);
it("checks fixed external references while retaining unknown-caller runtime selectors", async () => {
  await withWindowsSandbox("snapshot-context-references", async ({ workspaceRoot }) => {
    await createContextProject(workspaceRoot, true);
    const sourcePath = join(workspaceRoot, "src", "context.events.ts");
    const source = (
      command: string,
    ) => `import { commonEvent, animationRef, showAnimation, changeTileset, tilesetRef, enemyTransform, enemyRef, battleProcessing, troopRef, rawDslCommand, changeEquipment, actorRef, enemyAppear } from "rpgmaker-event-dsl";
export const context = commonEvent({ id: 1, name: "Context check", trigger: "none", commands: [${command}] });\n`;
    await writeFile(
      sourcePath,
      source(`battleProcessing({ troop: { kind: 'fixed', troop: troopRef({ id: 4 }) } }),
enemyAppear({ target: { kind: "runtimeSelector", scope: "enemy", target: "enemy", index: 2 } }),
changeEquipment({ actor: actorRef({ id: 1 }), slotIndex: 5, equipment: { kind: "runtimeSelector", scope: "equipment", target: "idForSlot", id: 77 } })`),
    );
    const stateRoot = join(workspaceRoot, ".rpgmaker-event-dsl");
    const manifest = await readFile(join(stateRoot, "sync-manifest.json"), "utf8");
    await compileWorkspace({ workspaceRoot, check: true });
    expect(await readdir(stateRoot)).not.toContain("generated-project-data");
    expect(await readFile(join(stateRoot, "sync-manifest.json"), "utf8")).toBe(manifest);
    const missing = [
      [
        "showAnimation({ target: { kind: 'runtimeSelector', scope: 'character', target: 'currentEvent' }, animation: animationRef({ id: 99 }), wait: false })",
        "animation",
      ],
      ["changeTileset({ tileset: tilesetRef({ id: 99 }) })", "tileset"],
      [
        "enemyTransform({ target: { kind: 'runtimeSelector', scope: 'enemy', target: 'enemy', index: 0 }, enemy: enemyRef({ id: 99 }) })",
        "enemy",
      ],
      ["battleProcessing({ troop: { kind: 'fixed', troop: troopRef({ id: 99 }) } })", "troop"],
      ["rawDslCommand({ code: 212, parameters: [0, 99, false] })", "animation"],
      ["rawDslCommand({ code: 282, parameters: [99] })", "tileset"],
      ["rawDslCommand({ code: 336, parameters: [0, 99] })", "enemy"],
    ];
    for (const [command, kind] of missing) {
      for (const id of [0, 99]) {
        const currentSource = source(command!.replace("99", String(id)));
        await writeFile(sourcePath, currentSource);
        const diagnostic =
          id === 0 && (kind === "tileset" || kind === "animation")
            ? command!.startsWith("rawDslCommand")
              ? kind === "tileset"
                ? "MV-E282-PARAMETERS"
                : "MV-E212-PARAMETERS"
              : kind === "tileset"
                ? "MV-E282-INPUT"
                : "MV-E212-INPUT"
            : id === 0 && (kind === "enemy" || kind === "troop")
              ? `MV-E${kind === "enemy" ? 336 : 301}`
              : `Unknown ${kind} reference id: ${id}`;
        await expect(compileWorkspace({ workspaceRoot, check: true })).rejects.toThrow(diagnostic);
        await expect(compileWorkspace({ workspaceRoot, check: false })).rejects.toThrow(diagnostic);
        expect(await readdir(stateRoot)).not.toContain("generated-project-data");
        expect(await readFile(join(stateRoot, "sync-manifest.json"), "utf8")).toBe(manifest);
        expect(await readFile(sourcePath, "utf8")).toBe(currentSource);
      }
    }
  });
}, 30000);
it("assembles ordered hidden and missing-Enemy members, map tiles and all equipment slots from a captured Snapshot", async () => {
  await withWindowsSandbox("snapshot-context-adapter", async ({ workspaceRoot }) => {
    const fixture = await createContextProject(workspaceRoot);
    const captured = await loadSnapshotValidationInput(getWorkspaceStatePaths(workspaceRoot));
    deepStrictEqual(captured.maps, [
      { id: 1, width: 5, height: 4, tilesetId: 2, eventLocations: [] },
    ]);
    deepStrictEqual(captured.troops, [
      {
        id: 4,
        members: [
          { enemyId: 1, x: 80, y: 100, hidden: true, fixtureMember: null },
          { enemyId: 99, x: 160, y: 100, hidden: false },
          { enemyId: 1, x: 240, y: 100, hidden: false },
        ],
      },
    ]);
    deepStrictEqual(captured.references.enemies, [{ id: 1, name: "" }]);
    deepStrictEqual(captured.equipmentTypes, [
      "",
      "Weapon",
      "",
      "Accessory",
      "Extra slot",
      "Sixth slot",
      "Seventh slot",
    ]);
    deepStrictEqual(captured.tilesets, [
      { id: 2, tilesetNames: ["A1", "A2", "", "", "", "B", "", "D", ""] },
    ]);
    const graph = buildStagedDataGraph({
      declarations: [],
      snapshotReferences: captured.references,
      snapshotMaps: captured.maps,
      snapshotTroops: captured.troops,
      snapshotTilesets: captured.tilesets,
      snapshotEquipmentTypes: captured.equipmentTypes,
    });
    deepStrictEqual(graph.snapshotTroops, captured.troops);
    deepStrictEqual(graph.snapshotEquipmentTypes, captured.equipmentTypes);
    deepStrictEqual(graph.snapshotTilesets, captured.tilesets);
    // The adapter reads the captured state, even when the Project Root later changes.
    await writeFile(join(workspaceRoot, "Game", "data", "Troops.json"), "[null]");
    deepStrictEqual(
      (await loadSnapshotValidationInput(getWorkspaceStatePaths(workspaceRoot))).troops,
      captured.troops,
    );
    deepStrictEqual(
      JSON.parse(
        await readFile(
          join(workspaceRoot, ".rpgmaker-event-dsl", "project-data-snapshot", "Troops.json"),
          "utf8",
        ),
      ),
      fixture.projectFiles["Troops.json"],
    );
  });
}, 30000);
it("uses captured map dimensions and event positions for actual Workspace placement diagnostics", async () => {
  await withWindowsSandbox("snapshot-map-placement", async ({ workspaceRoot }) => {
    const fixture = await createContextProject(workspaceRoot);
    const map = {
      ...fixture.projectFiles["Map001.json"],
      events: [null, null, { id: 2, name: "Snapshot occupant", x: 3, y: 1, pages: [] }],
    };
    await writeFile(join(workspaceRoot, "Game", "data", "Map001.json"), JSON.stringify(map));
    await pullWorkspace({ workspaceRoot });
    const sourcePath = join(workspaceRoot, "src", "placement.events.ts");
    const source = (x: number) => `import { mapEvent, page } from "rpgmaker-event-dsl";
export const placement = mapEvent({ mapId: 1, id: 3, name: "Placement", x: ${x}, y: 1, pages: [page({ commands: [] })] });\n`;
    await writeFile(sourcePath, source(5));
    await expect(compileWorkspace({ workspaceRoot, check: true })).rejects.toThrow(
      'Map event "Placement" x coordinate 5 is outside map 1 bounds 0-4.',
    );
    await writeFile(sourcePath, source(3));
    await compileWorkspace({ workspaceRoot, check: true });
    const captured = await loadSnapshotValidationInput(getWorkspaceStatePaths(workspaceRoot));
    deepStrictEqual(captured.maps, [
      { id: 1, width: 5, height: 4, tilesetId: 2, eventLocations: [{ eventId: 2, x: 3, y: 1 }] },
    ]);
    const graph = buildStagedDataGraph({
      declarations: await loadDefinitionFile(sourcePath),
      snapshotReferences: captured.references,
      snapshotMaps: captured.maps,
    });
    deepStrictEqual(validateStagedDataGraph(graph, { scriptEnabled: false }).issues, [
      {
        level: "warning",
        message: 'Map event "Placement" uses occupied coordinate (3, 1) on map 1.',
      },
    ]);
    expect(await readdir(join(workspaceRoot, ".rpgmaker-event-dsl"))).not.toContain(
      "generated-project-data",
    );
    deepStrictEqual(
      JSON.parse(await readFile(join(workspaceRoot, "Game", "data", "Map001.json"), "utf8")),
      map,
    );
  });
}, 30000);
