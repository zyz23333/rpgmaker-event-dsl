import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import { discoverDefinitionFiles, loadDefinitionFile } from "../src/workspace/definitions.js";
import { getWorkspaceStatePaths } from "../src/workspace/state.js";
import { createMinimalProject, withWindowsSandbox } from "./support/windows-sandbox.js";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { recordEvidence } from "./support/mv-evidence.js";

const {
  initWorkspace,
  cloneWorkspace,
  decompileWorkspace,
  compileWorkspace,
  diffWorkspace,
  pushWorkspace,
}: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const fixture = JSON.parse(
  await readFile(
    new URL("./fixtures/mv-evidence/control-input-boundaries.json", import.meta.url),
    "utf8",
  ),
);
const discovery = {
  sourceRoot: "src",
  sourceInclude: ["**/*.events.ts", "**/*.dsl.ts"],
  sourceExclude: [],
};
const imports =
  'import { commonEvent, controlSwitches, controlSelfSwitch, loop, switchRef, rawDslCommand } from "rpgmaker-event-dsl";\n';
const declaration =
  'export const event = commonEvent({id:1,name:"Input boundaries",trigger:"none",commands:[command]});\n';

function evidenceIt(name: string, verify: () => Promise<void>) {
  it(name, async () => {
    const startedAt = new Date().toISOString();
    let failure: unknown;
    try {
      await verify();
    } catch (error) {
      failure = error;
      throw error;
    } finally {
      await recordEvidence({
        requirementId: name.split(":")[0]!,
        startedAt,
        stages: [
          "Independent native/source input",
          "Actual Discovery, public package evaluation and Workspace operations",
          "Complete source/Discovery/Project Root/Snapshot/generated/config/manifest state and precise diagnostic comparisons",
        ],
        expected: name,
        actual: { assertionsCompleted: failure === undefined, entry: workspaceApiEntry },
        ...(failure === undefined ? {} : { error: failure }),
      });
    }
  });
}

async function prepare(workspaceRoot: string, nativeText?: string) {
  await createMinimalProject(workspaceRoot);
  for (const [name, value] of Object.entries(fixture.projectFiles))
    await writeFile(
      join(workspaceRoot, "Game/data", name),
      name === "CommonEvents.json" && nativeText !== undefined ? nativeText : JSON.stringify(value),
    );
  await initWorkspace({ workspaceRoot, projectRoot: "./Game" });
  await cloneWorkspace({ workspaceRoot });
}

async function directory(path: string): Promise<Record<string, string> | null> {
  try {
    const entries = await readdir(path, { withFileTypes: true });
    const output: Record<string, string> = {};
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.isDirectory())
        for (const [name, bytes] of Object.entries((await directory(join(path, entry.name)))!))
          output[`${entry.name}/${name}`] = bytes;
      else output[entry.name] = (await readFile(join(path, entry.name))).toString("base64");
    }
    return output;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function state(workspaceRoot: string) {
  const paths = getWorkspaceStatePaths(workspaceRoot);
  return {
    sources: await directory(join(workspaceRoot, "src")),
    discovery: await discoverDefinitionFiles(workspaceRoot, discovery),
    project: await directory(join(workspaceRoot, "Game/data")),
    snapshot: await directory(paths.projectDataSnapshotDirectory),
    generated: await directory(paths.generatedProjectDataDirectory),
    manifest: await readFile(paths.syncManifestPath, "utf8"),
    config: await readFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8"),
    descriptor: await readFile(join(workspaceRoot, "Game/Game.rpgproject"), "utf8"),
  };
}

async function assertRejectedSource(
  workspaceRoot: string,
  source: string,
  diagnostic: string,
  path: string,
) {
  const sourcePath = join(workspaceRoot, "src/decompiled/common-events.events.ts");
  await writeFile(sourcePath, source);
  const before = await state(workspaceRoot);
  expect(before.discovery).toContain(sourcePath);
  for (const check of [true, false]) {
    let message = "";
    try {
      await compileWorkspace({ workspaceRoot, check });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toContain(diagnostic);
    expect(message).toContain(path);
    expect(await state(workspaceRoot)).toStrictEqual(before);
  }
  await expect(diffWorkspace({ workspaceRoot })).rejects.toThrow("Generated Project Data is stale");
  expect(await state(workspaceRoot)).toStrictEqual(before);
  await expect(pushWorkspace({ workspaceRoot, allowDestructive: false })).rejects.toThrow(
    "Generated Project Data is stale",
  );
  expect(await state(workspaceRoot)).toStrictEqual(before);
}

const topDefinitions = [
  ["controlSwitches", '{switch:switchRef({id:1}),value:true,unexpected:"must refuse"}'],
  ["controlSelfSwitch", '{selfSwitch:"A",value:true,unexpected:"must refuse"}'],
  ["loop", '{body:{commands:[]},unexpected:"must refuse"}'],
] as const;
for (const [helper, input] of topDefinitions) {
  for (const [index, expression] of ["input", "{...input}", "input as never"].entries())
    evidenceIt(
      `MV-S3-INPUT-002: rejects actual ${helper} helper extras via source expression ${index}`,
      async () => {
        await withWindowsSandbox(`control-top-${helper}-${index}`, async ({ workspaceRoot }) => {
          await prepare(workspaceRoot);
          await decompileWorkspace({ workspaceRoot });
          await compileWorkspace({ workspaceRoot, check: false });
          await assertRejectedSource(
            workspaceRoot,
            `${imports}const input=${input} as const;\nconst command=${helper}(${expression});\n${declaration}`,
            "MV-DSL-SHAPE",
            helper,
          );
        });
      },
    );
  evidenceIt(`MV-S3-INPUT-002: rejects actual direct ${helper} extras`, async () => {
    await withWindowsSandbox(`control-top-direct-${helper}`, async ({ workspaceRoot }) => {
      await prepare(workspaceRoot);
      await decompileWorkspace({ workspaceRoot });
      await compileWorkspace({ workspaceRoot, check: false });
      await assertRejectedSource(
        workspaceRoot,
        `${imports}const command={kind:"${helper}",${input.slice(1, -1)}} as const;\n${declaration}`,
        helper === "loop" ? "MV-CHILD-BODY" : "MV-DSL-SHAPE",
        "commands[0]",
      );
    });
  });
}

const referenceHelpers = [
  ["actorRef", "actor"],
  ["animationRef", "animation"],
  ["armorRef", "armor"],
  ["classRef", "class"],
  ["commonEventRef", "commonEvent"],
  ["enemyRef", "enemy"],
  ["itemRef", "item"],
  ["mapRef", "map"],
  ["skillRef", "skill"],
  ["stateRef", "state"],
  ["switchRef", "switch"],
  ["tilesetRef", "tileset"],
  ["troopRef", "troop"],
  ["variableRef", "variable"],
  ["weaponRef", "weapon"],
] as const;
for (const [helper, kind] of referenceHelpers)
  evidenceIt(
    `MV-S3-INPUT-003: ${helper} evaluates controls and rejects discarded actual source fields`,
    async () => {
      await withWindowsSandbox(`reference-input-${kind}`, async ({ workspaceRoot }) => {
        await prepare(workspaceRoot);
        await decompileWorkspace({ workspaceRoot });
        const prefix = `import {commonEvent,${helper}} from "rpgmaker-event-dsl";\n`;
        const suffix = `const reference=${helper}(input);\nexport const event=commonEvent({id:1,name:reference.kind,trigger:"none",commands:[]});\n`;
        const sourcePath = join(workspaceRoot, "src/decompiled/common-events.events.ts");
        await writeFile(sourcePath, `${prefix}const input={id:1};\n${suffix}`);
        const files = await discoverDefinitionFiles(workspaceRoot, discovery);
        const definitions = await loadDefinitionFile(sourcePath);
        expect(files).toContain(sourcePath);
        expect(definitions).toContainEqual(
          expect.objectContaining({ kind: "commonEvent", name: kind }),
        );
        const beforeCheck = await state(workspaceRoot);
        await compileWorkspace({ workspaceRoot, check: true });
        expect(await state(workspaceRoot)).toStrictEqual(beforeCheck);
        await compileWorkspace({ workspaceRoot, check: false });
        expect(await diffWorkspace({ workspaceRoot })).toContain("CommonEvents.json");
        await pushWorkspace({ workspaceRoot, allowDestructive: false });
        const expected = structuredClone(fixture.projectFiles);
        expected["CommonEvents.json"][1].name = kind;
        expected["CommonEvents.json"][1].list = [{ code: 0, indent: 0, parameters: [] }];
        for (const [name, value] of Object.entries(expected)) {
          expect(
            JSON.parse(await readFile(join(workspaceRoot, "Game/data", name), "utf8")),
          ).toStrictEqual(value);
          expect(
            JSON.parse(
              await readFile(
                join(getWorkspaceStatePaths(workspaceRoot).projectDataSnapshotDirectory, name),
                "utf8",
              ),
            ),
          ).toStrictEqual(value);
        }
        expect(Object.keys((await directory(join(workspaceRoot, "Game/data")))!)).toHaveLength(15);
        for (const [input, code] of [
          ['{id:1,unexpected:"must refuse"}', "MV-DSL-SHAPE"],
          ['{id:1,name:"must not discard"}', "MV-REFERENCE-INPUT"],
        ])
          await assertRejectedSource(
            workspaceRoot,
            `${prefix}const input=${input};\n${suffix}`,
            code!,
            helper,
          );
      });
    },
  );

const nestedTargets = [
  ['{kind:"switch",id:1,unexpected:"must refuse"}', ".switch", "MV-DSL-SHAPE"],
  ['{kind:"switch",id:1,name:"must not discard"}', ".switch", "MV-REFERENCE-INPUT"],
  [
    '{kind:"referenceRange",from:{kind:"switch",id:1},to:{kind:"switch",id:3},unexpected:"must refuse"}',
    ".switch",
    "MV-DSL-SHAPE",
  ],
  [
    '{kind:"referenceRange",from:{kind:"switch",id:1,unexpected:"must refuse"},to:{kind:"switch",id:3}}',
    ".switch.from",
    "MV-DSL-SHAPE",
  ],
  [
    '{kind:"referenceRange",from:{kind:"switch",id:1},to:{kind:"switch",id:3,unexpected:"must refuse"}}',
    ".switch.to",
    "MV-DSL-SHAPE",
  ],
] as const;
for (const [index, [target, suffix, code]] of nestedTargets.entries())
  for (const helper of [true, false])
    evidenceIt(
      `MV-S3-INPUT-004: rejects evaluated nested shape ${index} through ${helper ? "helper" : "direct"}`,
      async () => {
        await withWindowsSandbox(`control-nested-${index}-${helper}`, async ({ workspaceRoot }) => {
          await prepare(workspaceRoot);
          await decompileWorkspace({ workspaceRoot });
          await compileWorkspace({ workspaceRoot, check: false });
          const command = helper
            ? "controlSwitches({switch:target,value:true})"
            : '({kind:"controlSwitches",switch:target,value:true} as const)';
          await assertRejectedSource(
            workspaceRoot,
            `${imports}const target=${target} as const;\nconst command=${command};\n${declaration}`,
            code,
            `${helper ? "controlSwitches" : "commands[0]"}${suffix}`,
          );
        });
      },
    );

for (const invalid of fixture.negativeNative as {
  code: number;
  slot: number;
  recordText: string;
}[])
  evidenceIt(
    `MV-S3-INPUT-005: refuses native E${invalid.code} signed zero before publication with complete state preserved`,
    async () => {
      await withWindowsSandbox(`control-native-zero-${invalid.code}`, async ({ workspaceRoot }) => {
        const native = `[null,{"id":1,"name":"Native negative zero","trigger":0,"switchId":1,"list":[${invalid.recordText},{"code":0,"indent":0,"parameters":[]}]}]`;
        await prepare(workspaceRoot, native);
        await writeFile(join(workspaceRoot, "src/user.events.ts"), "export {};\n");
        const before = await state(workspaceRoot);
        let message = "";
        try {
          await decompileWorkspace({ workspaceRoot });
        } catch (error) {
          message = error instanceof Error ? error.message : String(error);
        }
        expect(message).toContain(`MV-E${invalid.code}-VALUE`);
        expect(message).toContain(`list[0].parameters[${invalid.slot}]`);
        expect(message).toContain("decompile");
        expect(message).toContain("commonEvent:1");
        expect(message).toContain("-0");
        expect(await state(workspaceRoot)).toStrictEqual(before);
        expect(
          Object.is(
            JSON.parse(
              await readFile(join(workspaceRoot, "Game/data/CommonEvents.json"), "utf8"),
            )[1].list[0].parameters[invalid.slot],
            -0,
          ),
        ).toBe(true);
      });
    },
  );

for (const [code, parameters, slot] of [
  [121, "[1,1,-0]", 2],
  [123, '["A",-0]', 1],
] as const)
  evidenceIt(
    `MV-S3-INPUT-006: rejects evaluated known raw E${code} signed zero at its precise slot`,
    async () => {
      await withWindowsSandbox(`control-raw-zero-${code}`, async ({ workspaceRoot }) => {
        await prepare(workspaceRoot);
        await decompileWorkspace({ workspaceRoot });
        await compileWorkspace({ workspaceRoot, check: false });
        await assertRejectedSource(
          workspaceRoot,
          `${imports}const command=rawDslCommand({code:${code},parameters:${parameters}});\n${declaration}`,
          `MV-E${code}-VALUE`,
          `commands[0].parameters[${slot}]`,
        );
      });
    },
  );

evidenceIt(
  "MV-S3-INPUT-005: preserves positive-zero switch and Loop controls through actual evaluation and real Push",
  async () => {
    await withWindowsSandbox("control-positive-matrix", async ({ workspaceRoot }) => {
      await prepare(workspaceRoot);
      await decompileWorkspace({ workspaceRoot });
      const sourcePath = join(workspaceRoot, "src/decompiled/common-events.events.ts");
      const original = await readFile(sourcePath, "utf8");
      expect(original).toContain("controlSwitches");
      expect(original).toContain("controlSelfSwitch");
      expect(original).toContain("loop({");
      const files = await discoverDefinitionFiles(workspaceRoot, discovery);
      expect(files).toContain(sourcePath);
      await loadDefinitionFile(sourcePath);
      const before = await state(workspaceRoot);
      await compileWorkspace({ workspaceRoot, check: true });
      expect(await state(workspaceRoot)).toStrictEqual(before);
      await compileWorkspace({ workspaceRoot, check: false });
      const paths = getWorkspaceStatePaths(workspaceRoot);
      expect(Object.keys((await directory(paths.generatedProjectDataDirectory))!).sort()).toEqual([
        "CommonEvents.json",
        "Map001.json",
        "System.json",
        "Troops.json",
      ]);
      for (const [name, value] of Object.entries(fixture.projectFiles)) {
        expect(
          JSON.parse(await readFile(join(workspaceRoot, "Game/data", name), "utf8")),
        ).toStrictEqual(value);
        expect(
          JSON.parse(await readFile(join(paths.projectDataSnapshotDirectory, name), "utf8")),
        ).toStrictEqual(value);
        if (["CommonEvents.json", "Map001.json", "System.json", "Troops.json"].includes(name))
          expect(
            JSON.parse(await readFile(join(paths.generatedProjectDataDirectory, name), "utf8")),
          ).toStrictEqual(value);
      }
      expect(await diffWorkspace({ workspaceRoot })).toContain("- none");
      await writeFile(sourcePath, original.replace("Input boundaries", "Installed controls"));
      await compileWorkspace({ workspaceRoot, check: false });
      await pushWorkspace({ workspaceRoot, allowDestructive: false });
      const expected = structuredClone(fixture.projectFiles);
      expected["CommonEvents.json"][1].name = "Installed controls";
      for (const [name, value] of Object.entries(expected)) {
        expect(
          JSON.parse(await readFile(join(workspaceRoot, "Game/data", name), "utf8")),
        ).toStrictEqual(value);
        expect(
          JSON.parse(await readFile(join(paths.projectDataSnapshotDirectory, name), "utf8")),
        ).toStrictEqual(value);
      }
    });
  },
);
