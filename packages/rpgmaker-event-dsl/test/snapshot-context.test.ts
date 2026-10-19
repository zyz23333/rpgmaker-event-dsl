import { deepStrictEqual } from "node:assert/strict";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { expect, it } from "vitest";

import {
  cloneWorkspace,
  compileWorkspace,
  decompileWorkspace,
  diffWorkspace,
  initWorkspace,
  pullWorkspace,
  pushWorkspace,
} from "../src/workspace-api.js";
import { createMinimalProject, withWindowsSandbox } from "./support/windows-sandbox.js";
import { loadSnapshotValidationInput } from "../src/workspace/operations.js";
import { getWorkspaceStatePaths } from "../src/workspace/state.js";
import { loadDefinitionFile } from "../src/workspace/definitions.js";
import { buildStagedDataGraph, validateStagedDataGraph } from "../src/validation/staged-graph.js";
import { readRequirements, recordEvidence } from "./support/mv-evidence.js";

function evidenceIt(name: string, verify: () => Promise<unknown>, timeout?: number) {
  it(
    name,
    async () => {
      const requirementId = name.split(":")[0]!;
      const startedAt = new Date().toISOString();
      const expected = (await readRequirements()).requirements.find(
        ({ id }) => id === requirementId,
      )!.expected;
      const stages = [
        "independent synthetic project captured through public Clone/Pull",
        "actual Workspace discovery/evaluation or captured Snapshot adapter",
        "strict complete-data, diagnostic and file-state assertions",
      ];
      try {
        const actual = await verify();
        await recordEvidence({ requirementId, startedAt, stages, expected, actual });
      } catch (error) {
        await recordEvidence({
          requirementId,
          startedAt,
          stages,
          expected,
          actual: "Verification did not complete",
          error,
        });
        throw error;
      }
    },
    timeout,
  );
}

async function createContextProject(workspaceRoot: string) {
  await createMinimalProject(workspaceRoot);
  const fixture = JSON.parse(
    await readFile(
      new URL("./fixtures/mv-evidence/map-battle-context-project.json", import.meta.url),
      "utf8",
    ),
  );
  for (const [name, value] of Object.entries(fixture.projectFiles))
    await writeFile(join(workspaceRoot, "Game", "data", name), JSON.stringify(value));
  await initWorkspace({ workspaceRoot, projectRoot: "./Game" });
  await cloneWorkspace({ workspaceRoot });
  return fixture;
}

evidenceIt(
  "MV-S3-CONTEXT-001: resolves empty-name external targets through actual Snapshot and evaluated Decompiled Source",
  async () => {
    let actual: unknown;
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
  changeEquipment({ actor: actorRef({ id: 1 }), equipmentTypeId: 1, itemId: 77 }),
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
      actual = {
        projectAndSnapshot: fixture.projectFiles,
        generatedDomains: ["CommonEvents.json", "System.json", "Map001.json"],
        diff: await diffWorkspace({ workspaceRoot, short: true }),
      };
    });
    return actual;
  },
  30_000,
);

evidenceIt(
  "MV-S3-CONTEXT-004: rejects missing native external targets before publishing any Decompiled Source",
  async () => {
    const actual: unknown[] = [];
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
          actual.push({
            rejectedCode: record.code,
            sourceFiles: await readdir(join(workspaceRoot, "src")),
            projectAndSnapshotUnchanged: true,
            manifestUnchanged: true,
          });
        },
      );
    }
    return actual;
  },
  30_000,
);

evidenceIt(
  "MV-S3-CONTEXT-003: checks fixed external references while retaining unknown-caller runtime selectors",
  async () => {
    let actual: unknown;
    await withWindowsSandbox("snapshot-context-references", async ({ workspaceRoot }) => {
      await createContextProject(workspaceRoot);
      const sourcePath = join(workspaceRoot, "src", "context.events.ts");
      const source = (
        command: string,
      ) => `import { commonEvent, animationRef, showAnimation, changeTileset, tilesetRef, enemyTransform, enemyRef, battleProcessing, troopRef, rawDslCommand, changeEquipment, actorRef, enemyAppear } from "rpgmaker-event-dsl";
export const context = commonEvent({ id: 1, name: "Context check", trigger: "none", commands: [${command}] });\n`;
      await writeFile(
        sourcePath,
        source(`battleProcessing({ troop: troopRef({ id: 4 }) }),
enemyAppear({ target: { kind: "runtimeSelector", scope: "enemy", target: "enemy", index: 2 } }),
changeEquipment({ actor: actorRef({ id: 1 }), equipmentTypeId: 6, itemId: 77 })`),
      );
      const stateRoot = join(workspaceRoot, ".rpgmaker-event-dsl");
      const manifest = await readFile(join(stateRoot, "sync-manifest.json"), "utf8");
      await compileWorkspace({ workspaceRoot, check: true });
      expect(await readdir(stateRoot)).not.toContain("generated-project-data");
      expect(await readFile(join(stateRoot, "sync-manifest.json"), "utf8")).toBe(manifest);
      const missing = [
        [
          "showAnimation({ target: { kind: 'runtimeSelector', scope: 'character', target: 'currentEvent' }, animation: animationRef({ id: 99 }) })",
          "animation",
        ],
        ["changeTileset({ tileset: tilesetRef({ id: 99 }) })", "tileset"],
        [
          "enemyTransform({ target: { kind: 'runtimeSelector', scope: 'enemy', target: 'enemy', index: 0 }, enemy: enemyRef({ id: 99 }) })",
          "enemy",
        ],
        ["battleProcessing({ troop: troopRef({ id: 99 }) })", "troop"],
        ["rawDslCommand({ code: 212, parameters: [0, 99, false] })", "animation"],
        ["rawDslCommand({ code: 282, parameters: [99] })", "tileset"],
        ["rawDslCommand({ code: 336, parameters: [0, 99] })", "enemy"],
      ];
      for (const [command, kind] of missing) {
        for (const id of [0, 99]) {
          const currentSource = source(command!.replace("99", String(id)));
          await writeFile(sourcePath, currentSource);
          await expect(compileWorkspace({ workspaceRoot, check: true })).rejects.toThrow(
            `Unknown ${kind} reference id: ${id}`,
          );
          await expect(compileWorkspace({ workspaceRoot, check: false })).rejects.toThrow(
            `Unknown ${kind} reference id: ${id}`,
          );
          expect(await readdir(stateRoot)).not.toContain("generated-project-data");
          expect(await readFile(join(stateRoot, "sync-manifest.json"), "utf8")).toBe(manifest);
          expect(await readFile(sourcePath, "utf8")).toBe(currentSource);
        }
      }
      actual = {
        accepted: [
          "empty-name troop4",
          "Common unknown-caller enemy position2",
          "dynamic equipment candidate77",
        ],
        rejected: missing,
        rejectedIds: [0, 99],
        generatedPublished: false,
        sourceAndManifestUnchanged: true,
      };
    });
    return actual;
  },
  30_000,
);

evidenceIt(
  "MV-S3-CONTEXT-002: assembles ordered hidden and missing-Enemy members, map tiles and all equipment slots from a captured Snapshot",
  async () => {
    let actual: unknown;
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
      actual = captured;
    });
    return actual;
  },
  30_000,
);

evidenceIt(
  "MV-S3-CONTEXT-005: uses captured map dimensions and event positions for actual Workspace placement diagnostics",
  async () => {
    let actual: unknown;
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
      actual = {
        maps: captured.maps,
        rejectedX: 5,
        issues: validateStagedDataGraph(graph, { scriptEnabled: false }).issues,
        generatedPublished: false,
      };
    });
    return actual;
  },
  30_000,
);
