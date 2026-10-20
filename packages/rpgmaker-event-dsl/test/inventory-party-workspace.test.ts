import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { discoverDefinitionFiles, loadDefinitionFile } from "../src/workspace/definitions.js";
import { getWorkspaceStatePaths } from "../src/workspace/state.js";
import { renderJsonValue } from "../src/project-data/json-values.js";
import {
  createMinimalProject,
  withWindowsSandbox,
  type WindowsSandbox,
} from "./support/windows-sandbox.js";
import { recordEvidence } from "./support/mv-evidence.js";

const {
  initWorkspace,
  cloneWorkspace,
  decompileWorkspace,
  compileWorkspace,
  diffWorkspace,
  pushWorkspace,
}: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const discovery = {
  sourceRoot: "src",
  sourceInclude: ["**/*.events.ts", "**/*.dsl.ts"],
  sourceExclude: [],
};
const fixture = JSON.parse(
  await readFile(new URL("./fixtures/mv-evidence/inventory-party.json", import.meta.url), "utf8"),
);

async function state(workspaceRoot: string) {
  const paths = getWorkspaceStatePaths(workspaceRoot);
  const data = async (directory: string) => {
    try {
      return Object.fromEntries(
        await Promise.all(
          (await readdir(directory))
            .sort()
            .map(async (name) => [name, await readFile(join(directory, name), "utf8")]),
        ),
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  };
  const files = await discoverDefinitionFiles(workspaceRoot, discovery);
  return {
    config: await readFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8"),
    descriptor: await readFile(join(workspaceRoot, "Game/Game.rpgproject"), "utf8"),
    project: await data(join(workspaceRoot, "Game/data")),
    snapshot: await data(paths.projectDataSnapshotDirectory),
    generated: await data(paths.generatedProjectDataDirectory),
    manifest: await readFile(paths.syncManifestPath, "utf8"),
    discovery: files,
    source: await Promise.all(files.map((file) => readFile(file, "utf8"))),
  };
}

async function withInventoryEvidence(
  id: string,
  label: string,
  body: (sandbox: WindowsSandbox) => Promise<void>,
) {
  await withWindowsSandbox(label, async (sandbox) => {
    const startedAt = new Date().toISOString();
    let failure: unknown;
    try {
      await body(sandbox);
    } catch (error) {
      failure = error;
      throw error;
    } finally {
      await recordEvidence({
        requirementId: `MV-S6-INVENTORY-${id}`,
        startedAt,
        stages: [
          "Actual Windows public Workspace API, discovered/evaluated TypeScript and real filesystem; independent native saved-slot literals; complete business state assertions",
        ],
        expected:
          "Exact E125–E129 mode/reference/inactive flag native records and complete carrier preservation; rejected inputs preserve source, Discovery, Project Root, Snapshot, generated and manifest bytes.",
        actual: {
          case: label,
          finalState: await state(sandbox.workspaceRoot),
          processes: sandbox.processes,
          entry: sandbox.cliEntry,
        },
        ...(failure === undefined ? {} : { error: failure }),
      });
    }
  });
}

async function prepare(workspaceRoot: string, list = fixture.list) {
  await createMinimalProject(workspaceRoot);
  for (const name of ["Actors", "Items", "Weapons", "Armors"])
    await writeFile(
      join(workspaceRoot, `Game/data/${name}.json`),
      JSON.stringify([null, { id: 1, name: "", outsideEvent: { exact: [null, [], ""] } }]),
    );
  const systemPath = join(workspaceRoot, "Game/data/System.json");
  const system = JSON.parse(await readFile(systemPath, "utf8"));
  system.variables = ["", "", "", ""];
  await writeFile(systemPath, JSON.stringify(system));
  await writeFile(
    join(workspaceRoot, "Game/data/CommonEvents.json"),
    renderJsonValue([null, { id: 1, name: "Inventory", trigger: 0, switchId: 1, list }]),
  );
  await initWorkspace({ workspaceRoot, projectRoot: "./Game" });
  await cloneWorkspace({ workspaceRoot });
}

it("MV-S6-INVENTORY-001: evaluates the complete native mode and inactive flag matrix and performs a real harmless Push", async () => {
  await withInventoryEvidence("001", "inventory-native-matrix", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    const original = await state(workspaceRoot);
    await decompileWorkspace({ workspaceRoot });
    const files = await discoverDefinitionFiles(workspaceRoot, discovery);
    const declarations = (await Promise.all(files.map((file) => loadDefinitionFile(file)))).flat();
    const event = declarations.find((value) => value.kind === "commonEvent")!;
    expect(event.commands).toHaveLength(28);
    expect(event.commands[0]).toStrictEqual({
      kind: "changeGold",
      operation: "gain",
      value: { kind: "constant", value: 1 },
    });
    expect(event.commands[27]).toStrictEqual({
      kind: "changePartyMember",
      actor: { kind: "actor", id: 1 },
      operation: "remove",
      initialize: true,
    });
    expect(files).toHaveLength(3);
    const before = await state(workspaceRoot);
    await compileWorkspace({ workspaceRoot, check: true });
    expect(await state(workspaceRoot)).toStrictEqual(before);
    await compileWorkspace({ workspaceRoot, check: false });
    const paths = getWorkspaceStatePaths(workspaceRoot);
    const generated = JSON.parse(
      await readFile(join(paths.generatedProjectDataDirectory, "CommonEvents.json"), "utf8"),
    );
    expect(generated).toStrictEqual([
      null,
      { id: 1, name: "Inventory", trigger: 0, switchId: 1, list: fixture.list },
    ]);
    expect((await state(workspaceRoot)).project).toStrictEqual(original.project);
    const sourcePath = files.find((file) => file.endsWith("common-events.events.ts"))!;
    const source = await readFile(sourcePath, "utf8");
    expect(source).toContain("includeEquipment: true");
    expect(source).toContain('operation: "remove", initialize: true');
    expect(source).toContain('kind: "variable", variable: variableRef({ id: 3 })');
    await writeFile(sourcePath, source.replace('name: "Inventory"', 'name: "Inventory pushed"'));
    await compileWorkspace({ workspaceRoot, check: false });
    expect(await diffWorkspace({ workspaceRoot })).toContain("CommonEvents.json");
    await pushWorkspace({ workspaceRoot, allowDestructive: false });
    const after = await state(workspaceRoot);
    expect(after.project).toStrictEqual({
      ...original.project,
      "CommonEvents.json": after.project!["CommonEvents.json"],
    });
    expect(JSON.parse(after.project!["CommonEvents.json"])).toStrictEqual([
      null,
      { id: 1, name: "Inventory pushed", trigger: 0, switchId: 1, list: fixture.list },
    ]);
    expect(after.snapshot).toStrictEqual(after.project);
    expect(await diffWorkspace({ workspaceRoot })).toBe(
      "Structured Diff Report\n\nAffected Project Data Files:\n- none\n\nDestructive Changes: no",
    );
  });
});

const authored = [
  { helper: "changeGold", fields: 'operation: "gain", value: { kind: "constant", value: 1 }' },
  {
    helper: "changeItems",
    fields: 'item: itemRef({ id: 1 }), operation: "gain", amount: { kind: "constant", value: 1 }',
  },
  {
    helper: "changeWeapons",
    fields:
      'weapon: weaponRef({ id: 1 }), operation: "gain", amount: { kind: "constant", value: 1 }, includeEquipment: true',
  },
  {
    helper: "changeArmors",
    fields:
      'armor: armorRef({ id: 1 }), operation: "gain", amount: { kind: "constant", value: 1 }, includeEquipment: true',
  },
  {
    helper: "changePartyMember",
    fields: 'actor: actorRef({ id: 1 }), operation: "remove", initialize: true',
  },
];

it.each(
  authored.flatMap((entry) =>
    ["helper", "direct", "spread", "asserted"].map((mode) => ({ ...entry, mode })),
  ),
)(
  "MV-S6-INVENTORY-002: $helper $mode refuses source local const extra fields before publication",
  async ({ helper, fields, mode }) => {
    await withInventoryEvidence(
      "002",
      `inventory-extra-${helper}-${mode}`,
      async ({ workspaceRoot }) => {
        await prepare(workspaceRoot, [{ code: 0, indent: 0, parameters: [] }]);
        const src = join(workspaceRoot, "src/inventory.events.ts");
        await mkdir(join(workspaceRoot, "src"), { recursive: true });
        const imports =
          'import { commonEvent, changeGold, changeItems, changeWeapons, changeArmors, changePartyMember, itemRef, weaponRef, armorRef, actorRef } from "rpgmaker-event-dsl";';
        const good = `${imports}\nexport const inventory = commonEvent({ id: 1, name: "Inventory", trigger: "none", commands: [${helper}({ ${fields} })] });\n`;
        await writeFile(src, good);
        await compileWorkspace({ workspaceRoot, check: false });
        const expression = mode === "direct" ? "input" : `${helper}(input)`;
        const assertion =
          mode === "asserted" ? `as unknown as Parameters<typeof ${helper}>[0]` : "as const";
        await writeFile(
          src,
          `${imports}\n${mode === "spread" ? "const extra = { extra: true };" : ""}\nconst input = { ${mode === "direct" ? `kind: "${helper}", ` : ""}${fields}, ${mode === "spread" ? "...extra" : "extra: true"} } ${assertion};\nexport const inventory = commonEvent({ id: 1, name: "Inventory", trigger: "none", commands: [${expression}] });\n`,
        );
        const before = await state(workspaceRoot);
        const expected =
          mode !== "direct"
            ? /unsupported field extra/u
            : /commands\[0\].*unsupported field extra/u;
        await expect(compileWorkspace({ workspaceRoot, check: true })).rejects.toThrow(expected);
        expect(await state(workspaceRoot)).toStrictEqual(before);
        await expect(compileWorkspace({ workspaceRoot, check: false })).rejects.toThrow(expected);
        expect(await state(workspaceRoot)).toStrictEqual(before);
        await expect(diffWorkspace({ workspaceRoot })).rejects.toThrow();
        expect(await state(workspaceRoot)).toStrictEqual(before);
        await expect(pushWorkspace({ workspaceRoot, allowDestructive: false })).rejects.toThrow();
        expect(await state(workspaceRoot)).toStrictEqual(before);
      },
    );
  },
);

it.each([
  { code: 125, parameters: [-0, 0, 1], slot: 0 },
  { code: 126, parameters: [1, 0, -0, 1], slot: 2 },
  { code: 127, parameters: [1, -0, 0, 1, true], slot: 1 },
  { code: 128, parameters: [1, 0, 0, 10000, true], slot: 3 },
  { code: 129, parameters: [1, -0, true], slot: 1 },
])(
  "MV-S6-INVENTORY-003: E$code rejects native invalid saved input before source publication",
  async ({ code, parameters, slot }) => {
    await withInventoryEvidence(
      "003",
      `inventory-invalid-native-${code}`,
      async ({ workspaceRoot }) => {
        await prepare(workspaceRoot, [
          { code, indent: 0, parameters },
          { code: 0, indent: 0, parameters: [] },
        ]);
        await mkdir(join(workspaceRoot, "src"), { recursive: true });
        await writeFile(
          join(workspaceRoot, "src/kept.events.ts"),
          'import { variableDefinition } from "rpgmaker-event-dsl";\nexport const kept = variableDefinition({ id: 1, name: "Kept source" });\n',
        );
        const before = await state(workspaceRoot);
        await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(
          new RegExp(`list\\[0\\]\\.parameters\\[${slot}\\]`, "u"),
        );
        expect(await state(workspaceRoot)).toStrictEqual(before);
      },
    );
  },
);

it.each([
  { code: 125, parameters: [0, 1, 4], slot: 2 },
  { code: 126, parameters: [2, 0, 0, 1], slot: 0 },
  { code: 127, parameters: [2, 0, 0, 1, true], slot: 0 },
  { code: 128, parameters: [2, 0, 0, 1, true], slot: 0 },
  { code: 129, parameters: [2, 1, true], slot: 0 },
])(
  "MV-S6-INVENTORY-004: E$code rejects missing fixed project references before source publication",
  async ({ code, parameters, slot }) => {
    await withInventoryEvidence(
      "004",
      `inventory-missing-ref-${code}`,
      async ({ workspaceRoot }) => {
        await prepare(workspaceRoot, [
          { code, indent: 0, parameters },
          { code: 0, indent: 0, parameters: [] },
        ]);
        const before = await state(workspaceRoot);
        await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(
          new RegExp(`list\\[0\\]\\.parameters\\[${slot}\\]`, "u"),
        );
        expect(await state(workspaceRoot)).toStrictEqual(before);
      },
    );
  },
);
