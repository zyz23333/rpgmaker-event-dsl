import { deepStrictEqual } from "node:assert/strict";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it, vi } from "vitest";
import { discoverDefinitionFiles } from "../src/workspace/definitions.js";
import { getWorkspaceStatePaths } from "../src/workspace/state.js";
import { writeStableJson } from "../src/project-data/writer.js";
import { createMinimalProject, runCli, withWindowsSandbox } from "./support/windows-sandbox.js";
import { operandCases, operationCases } from "./support/control-variable-cases.js";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { verifyVariableEvidence } from "./support/control-variable-evidence.js";

const api: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const discovery = {
  sourceRoot: "src",
  sourceInclude: ["**/*.events.ts", "**/*.dsl.ts"],
  sourceExclude: [],
};
const end = { code: 0, indent: 0, parameters: [] };
const nativeList = [
  ...operandCases.map(({ slots }) => ({ code: 122, indent: 0, parameters: [1, 3, 0, ...slots] })),
  ...operationCases.flatMap(([, code]) =>
    [
      [1, 3, code, 0, -1],
      [1, 3, code, 1, 2],
      [1, 3, code, 2, -1, 1],
      [1, 3, code, 3, 7, 2, 0],
      [1, 3, code, 4, ""],
    ].map((parameters) => ({ code: 122, indent: 0, parameters })),
  ),
  { code: 115, indent: 0, parameters: [] },
  { code: 112, indent: 0, parameters: [] },
  { code: 122, indent: 1, parameters: [1, 3, 0, 4, ""] },
  { code: 0, indent: 1, parameters: [] },
  { code: 413, indent: 0, parameters: [] },
  end,
];

async function tree(root: string): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  for (const entry of (await readdir(root, { withFileTypes: true }).catch(() => [])).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    if (entry.name === "operation.lock") continue;
    if (entry.isDirectory())
      for (const [name, bytes] of Object.entries(await tree(join(root, entry.name))))
        files[entry.name + "/" + name] = bytes;
    else files[entry.name] = (await readFile(join(root, entry.name))).toString("hex");
  }
  return files;
}
async function state(workspaceRoot: string) {
  return {
    config: await readFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8"),
    discovery: await discoverDefinitionFiles(workspaceRoot, discovery),
    source: await tree(join(workspaceRoot, "src")),
    project: await tree(join(workspaceRoot, "Game/data")),
    state: await tree(join(workspaceRoot, ".rpgmaker-event-dsl")),
  };
}
async function gate(workspaceRoot: string, enabled: boolean) {
  const file = join(workspaceRoot, "rpgmaker-event-dsl.config.json");
  await writeFile(
    file,
    JSON.stringify({ ...JSON.parse(await readFile(file, "utf8")), scriptEnabled: enabled }),
  );
}
async function prepare(workspaceRoot: string, list = nativeList) {
  const fixture = await createMinimalProject(workspaceRoot);
  const files = fixture.projectFiles as Record<string, unknown>;
  files["CommonEvents.json"] = [null, { id: 1, name: "Variables", trigger: 0, switchId: 1, list }];
  files["System.json"] = { switches: ["", ""], variables: ["", "", "", ""] };
  for (const name of ["Actors", "Items", "Weapons", "Armors"])
    files[name + ".json"] = [null, { id: 1, name: "" }];
  files["Enemies.json"] = [null, { id: 1, name: "Available Enemy" }];
  files["MapInfos.json"] = [null, { id: 1, name: "Map", parentId: 0 }];
  files["Map001.json"] = {
    width: 10,
    height: 10,
    tilesetId: 1,
    events: [
      null,
      {
        id: 1,
        name: "Map variables",
        x: 0,
        y: 0,
        note: "",
        pages: [
          {
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
            image: { characterIndex: 0, characterName: "", direction: 2, pattern: 0, tileId: 0 },
            moveType: 0,
            moveSpeed: 3,
            moveFrequency: 3,
            moveRoute: {
              list: [{ code: 0, parameters: [] }],
              repeat: true,
              skippable: false,
              wait: false,
            },
            priorityType: 0,
            walkAnime: true,
            stepAnime: false,
            directionFix: false,
            through: false,
            trigger: 0,
            list: [{ code: 122, indent: 0, parameters: [1, 1, 0, 3, 5, 999, 0] }, end],
          },
        ],
      },
    ],
  };
  files["Troops.json"] = [
    null,
    {
      id: 1,
      name: "External troop",
      members: [{ enemyId: 999 }, { enemyId: 1, hidden: true }],
      external: { kept: [null, -0] },
      pages: [
        {
          conditions: {
            actorHp: 50,
            actorId: 1,
            actorValid: false,
            enemyHp: 50,
            enemyIndex: 0,
            enemyValid: false,
            switchId: 1,
            switchValid: false,
            turnA: 0,
            turnB: 0,
            turnEnding: false,
            turnValid: false,
          },
          span: 0,
          list: [
            { code: 122, indent: 0, parameters: [1, 1, 0, 3, 4, 0, 0] },
            { code: 122, indent: 0, parameters: [1, 1, 0, 3, 4, 1, 0] },
            { code: 122, indent: 0, parameters: [1, 1, 0, 3, 4, 7, 0] },
            { code: 122, indent: 0, parameters: [1, 1, 0, 3, 5, -1, 0] },
            end,
          ],
        },
      ],
    },
  ];
  for (const [name, value] of Object.entries(files))
    await writeFile(join(workspaceRoot, "Game/data", name), writeStableJson(value));
  await api.initWorkspace({ workspaceRoot, projectRoot: "./Game" });
  await api.cloneWorkspace({ workspaceRoot });
  return files;
}

it("MV-S6-VARIABLES-002: roundtrips every E122 operand and status through actual source discovery, Check, Compile, Diff and real Push", async () => {
  await verifyVariableEvidence("002", () =>
    withWindowsSandbox("variables-workflow", async (sandbox) => {
      const { workspaceRoot } = sandbox;
      const expected = await prepare(workspaceRoot);
      const warnings = vi.spyOn(console, "error").mockImplementation(() => {});
      try {
        await api.decompileWorkspace({ workspaceRoot });
        const warningText = warnings.mock.calls.flat().join("\n");
        expect(warningText).toMatch(
          /MV-E122-RUNTIME-TARGET.*pages\[0\]\.list\[0\]\.parameters\[5\].*skips.*Enemy/,
        );
        expect(warningText).toMatch(
          /MV-E122-RUNTIME-TARGET.*pages\[0\]\.list\[1\]\.parameters\[5\].*returns 0/,
        );
      } finally {
        warnings.mockRestore();
      }
      const configBefore = await readFile(
        join(workspaceRoot, "rpgmaker-event-dsl.config.json"),
        "utf8",
      );
      const files = await discoverDefinitionFiles(workspaceRoot, discovery);
      expect(files).toHaveLength(4);
      const commonFile = files.find((file) => file.endsWith("common-events.events.ts"))!;
      const source = await readFile(commonFile, "utf8");
      expect(source).not.toContain("rawDslCommand");
      expect(source).toContain('kind: "constant", value: -0');
      const before = await state(workspaceRoot);
      for (const check of [true, false])
        await expect(api.compileWorkspace({ workspaceRoot, check })).rejects.toThrow(
          /MV-SCRIPT-GATE/,
        );
      expect(await state(workspaceRoot)).toEqual(before);
      expect(await readFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8")).toBe(
        configBefore,
      );
      await gate(workspaceRoot, true);
      const checkState = await state(workspaceRoot);
      await api.compileWorkspace({ workspaceRoot, check: true });
      expect(await state(workspaceRoot)).toEqual(checkState);
      await api.compileWorkspace({ workspaceRoot, check: false });
      const paths = getWorkspaceStatePaths(workspaceRoot);
      for (const [file, value] of Object.entries(expected)) {
        // Full fifteen carriers, including every external value and numeric -0.
        const candidateRoot = [
          "CommonEvents.json",
          "System.json",
          "Troops.json",
          "Map001.json",
        ].includes(file)
          ? paths.generatedProjectDataDirectory
          : paths.projectDataSnapshotDirectory;
        deepStrictEqual(JSON.parse(await readFile(join(candidateRoot, file), "utf8")), value);
      }
      expect(await api.diffWorkspace({ workspaceRoot })).toContain("- none");
      await api.pushWorkspace({ workspaceRoot, allowDestructive: false });
      for (const [file, value] of Object.entries(expected))
        deepStrictEqual(
          JSON.parse(await readFile(join(workspaceRoot, "Game/data", file), "utf8")),
          value,
        );
      const edited = source.replace('name: "Variables"', 'name: "Variables authored"');
      expect(edited).not.toBe(source);
      await writeFile(commonFile, edited);
      expect((await runCli(sandbox, ["compile", "--check"])).exitCode).toBe(0);
      await api.compileWorkspace({ workspaceRoot, check: false });
      expect(await api.diffWorkspace({ workspaceRoot })).toContain("CommonEvents.json");
      await api.pushWorkspace({ workspaceRoot, allowDestructive: false });
      const pushed = JSON.parse(
        await readFile(join(workspaceRoot, "Game/data/CommonEvents.json"), "utf8"),
      );
      deepStrictEqual(pushed[1].list, nativeList);
      expect(pushed[1].name).toBe("Variables authored");
      for (const [file, value] of Object.entries(expected).filter(
        ([file]) => file !== "CommonEvents.json",
      ))
        deepStrictEqual(
          JSON.parse(await readFile(join(workspaceRoot, "Game/data", file), "utf8")),
          value,
        );
    }),
  );
}, 60000);

it.each([
  {
    label: "malformed padding",
    parameters: [1, 1, 0, 3, 0, 1, -0],
    diagnostic: /MV-E122-PADDING.*list\[0\]\.parameters\[6\]/,
  },
  {
    label: "symbolic operation negative zero",
    parameters: [1, 1, -0, 0, 1],
    diagnostic: /MV-E122-ENUM.*list\[0\]\.parameters\[2\]/,
  },
  {
    label: "character symbolic negative zero",
    parameters: [1, 1, 0, 3, 5, -0, 0],
    diagnostic: /MV-E122-ENUM.*list\[0\]\.parameters\[5\]/,
  },
  {
    label: "missing actor",
    parameters: [1, 1, 0, 3, 3, 9, 0],
    diagnostic: /Unknown actor reference id: 9/,
  },
  {
    label: "missing item",
    parameters: [1, 1, 0, 3, 0, 9, 0],
    diagnostic: /Unknown item reference id: 9/,
  },
  {
    label: "missing weapon",
    parameters: [1, 1, 0, 3, 1, 9, 0],
    diagnostic: /Unknown weapon reference id: 9/,
  },
  {
    label: "missing armor",
    parameters: [1, 1, 0, 3, 2, 9, 0],
    diagnostic: /Unknown armor reference id: 9/,
  },
  {
    label: "missing variable source",
    parameters: [1, 1, 0, 1, 9],
    diagnostic: /Unknown variable reference id: 9/,
  },
  {
    label: "target outside capacity",
    parameters: [1, 9, 0, 0, 1],
    diagnostic: /Unknown variable reference id: 9/,
  },
])(
  "refuses $label before publishing any source or business-state change",
  async ({ parameters, diagnostic }) => {
    await verifyVariableEvidence("003", () =>
      withWindowsSandbox("variables-prepublication", async ({ workspaceRoot }) => {
        await prepare(workspaceRoot, [{ code: 122, indent: 0, parameters }, end]);
        await writeFile(join(workspaceRoot, "src/user.events.ts"), "export {};\n");
        const before = await state(workspaceRoot);
        await expect(api.decompileWorkspace({ workspaceRoot })).rejects.toThrow(diagnostic);
        expect(await state(workspaceRoot)).toEqual(before);
      }),
    );
  },
);

it.each([
  {
    label: "source-local const extra",
    setup: 'const value = {kind:"constant",value:1,extra:true} as const;',
    expression: 'controlVariables({variable:variableRef({id:1}),operation:"set",value})',
    diagnostic: /MV-DSL-SHAPE/,
  },
  {
    label: "spread helper extra",
    setup:
      'const base = {variable:variableRef({id:1}),operation:"set" as const,value:{kind:"constant" as const,value:1}}; const input = {...base,extra:true};',
    expression: "controlVariables(input)",
    diagnostic: /MV-DSL-SHAPE/,
  },
  {
    label: "asserted direct extra",
    setup: "",
    expression:
      '({kind:"controlVariables",variable:variableRef({id:1}),operation:"set",value:{kind:"constant",value:1,extra:true}} as never)',
    diagnostic: /MV-DSL-SHAPE/,
  },
  {
    label: "missing source variable",
    setup: "",
    expression:
      'controlVariables({variable:variableRef({id:1}),operation:"set",value:{kind:"variable",variable:variableRef({id:9})}})',
    diagnostic: /MV-E122-INPUT.*value.variable/,
  },
  {
    label: "reverse range",
    setup:
      'const input = {variable:{kind:"referenceRange",from:variableRef({id:3}),to:variableRef({id:1})},operation:"set",value:{kind:"constant",value:1}} as const;',
    expression: "controlVariables(input)",
    diagnostic: /MV-E122-INPUT/,
  },
  {
    label: "known raw operand Gate",
    setup: "",
    expression: 'rawDslCommand({code:122,parameters:[1,1,0,4,""]})',
    diagnostic: /MV-SCRIPT-GATE/,
  },
])(
  "validates actual evaluated $label and preserves every business file on Check/Compile failure",
  async ({ setup, expression, diagnostic, label }) => {
    await verifyVariableEvidence("004", () =>
      withWindowsSandbox("variables-source-input", async ({ workspaceRoot }) => {
        await prepare(workspaceRoot, [{ code: 122, indent: 0, parameters: [1, 1, 0, 0, 1] }, end]);
        await api.decompileWorkspace({ workspaceRoot });
        await api.compileWorkspace({ workspaceRoot, check: false });
        const sourceFile = (await discoverDefinitionFiles(workspaceRoot, discovery)).find((file) =>
          file.endsWith("common-events.events.ts"),
        )!;
        await writeFile(
          sourceFile,
          'import {commonEvent,controlVariables,variableRef,rawDslCommand} from "rpgmaker-event-dsl";\n' +
            setup +
            `\nexport const e=commonEvent({id:1,name:${JSON.stringify(label)},trigger:"none",commands:[${expression}]});\n`,
        );
        const before = await state(workspaceRoot);
        for (const check of [true, false]) {
          await expect(api.compileWorkspace({ workspaceRoot, check })).rejects.toThrow(diagnostic);
          expect(await state(workspaceRoot)).toEqual(before);
        }
      }),
    );
  },
);
