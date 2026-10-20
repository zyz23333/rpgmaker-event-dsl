import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { createMinimalProject, runCli, withWindowsSandbox } from "./support/windows-sandbox.js";
import { discoverDefinitionFiles, loadDefinitionFile } from "../src/workspace/definitions.js";
import { getWorkspaceStatePaths } from "../src/workspace/state.js";
import { renderJsonValue } from "../src/project-data/json-values.js";
import { conditionCases } from "./support/conditional-cases.js";
import { blankEvent } from "./support/map-event-fixtures.js";
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

function evidenceTest(
  requirementId: string,
  name: string,
  verify: () => Promise<void>,
  timeout = 30_000,
) {
  it(
    name,
    async () => {
      const startedAt = new Date().toISOString();
      let failure: unknown;
      try {
        await verify();
      } catch (error) {
        failure = error;
        throw error;
      } finally {
        await recordEvidence({
          requirementId,
          startedAt,
          stages: [
            "Independent self-authored MV saved values",
            "Actual public Workspace API/CLI, Discovery and source evaluation",
            "Complete carrier, saved-value, diagnostics and business-file assertions",
          ],
          expected: "Every independent assertion in the linked Conditional Workspace case holds.",
          actual: {
            test: name,
            entry: process.env.MV_CLI_ENTRY === "built" ? "built" : "source",
            assertions: failure === undefined ? "passed" : "failed",
            nativeExecution: "not-executed",
          },
          ...(failure === undefined ? {} : { error: failure }),
        });
      }
    },
    timeout,
  );
}

async function fileState(workspaceRoot: string) {
  const paths = getWorkspaceStatePaths(workspaceRoot);
  const files = async (directory: string) =>
    Object.fromEntries(
      await Promise.all(
        (await readdir(directory).catch(() => []))
          .sort()
          .map(async (name) => [name, await readFile(join(directory, name), "utf8")]),
      ),
    );
  const sources = await discoverDefinitionFiles(workspaceRoot, discovery);
  return {
    project: await files(join(workspaceRoot, "Game/data")),
    snapshot: await files(paths.projectDataSnapshotDirectory),
    generated: await files(paths.generatedProjectDataDirectory),
    manifest: await readFile(paths.syncManifestPath, "utf8"),
    config: await readFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8"),
    sources: await Promise.all(sources.map(async (file) => [file, await readFile(file, "utf8")])),
  };
}

// Independent E122/E111/E121 saved input from the original R2 moment-repeat guard.
// The original full17-page/three-turn native fixture remains an additional delivery obligation.
const repeatGuard = [
  { code: 122, indent: 0, parameters: [10, 10, 1, 0, 1] },
  { code: 111, indent: 0, parameters: [1, 10, 0, 2, 1] },
  { code: 121, indent: 1, parameters: [6, 6, 1] },
  { code: 0, indent: 1, parameters: [] },
  { code: 412, indent: 0, parameters: [] },
  { code: 0, indent: 0, parameters: [] },
];

evidenceTest(
  "MV-S6-CONDITIONAL-R2-GUARD",
  "preserves the original R2 Conditional guard marker through actual discovered source and Workspace Push",
  async () => {
    await withWindowsSandbox("conditional-r2-marker", async ({ workspaceRoot }) => {
      await createMinimalProject(workspaceRoot);
      const common = [
        null,
        { id: 1, name: "R2 guard", trigger: 0, switchId: 1, list: repeatGuard },
      ];
      const project = join(workspaceRoot, "Game/data");
      await writeFile(join(project, "CommonEvents.json"), JSON.stringify(common));
      await writeFile(
        join(project, "System.json"),
        JSON.stringify({ switches: Array(7).fill(""), variables: Array(11).fill("") }),
      );
      await initWorkspace({ workspaceRoot, projectRoot: "./Game" });
      await cloneWorkspace({ workspaceRoot });
      await decompileWorkspace({ workspaceRoot });
      const sources = await discoverDefinitionFiles(workspaceRoot, discovery);
      const declarations = (
        await Promise.all(sources.map((source) => loadDefinitionFile(source)))
      ).flat();
      const event = declarations.find((value) => value.kind === "commonEvent");
      expect(event?.kind === "commonEvent" && event.commands[1]).toStrictEqual({
        kind: "conditional",
        condition: {
          kind: "variable",
          variable: { kind: "variable", id: 10 },
          operator: "ge",
          value: { kind: "constant", value: 2 },
        },
        then: {
          commands: [{ kind: "controlSwitches", switch: { kind: "switch", id: 6 }, value: false }],
        },
      });
      const paths = getWorkspaceStatePaths(workspaceRoot);
      const beforeCheck = await readdir(paths.generatedProjectDataDirectory).catch(() => []);
      await compileWorkspace({ workspaceRoot, check: true });
      expect(await readdir(paths.generatedProjectDataDirectory).catch(() => [])).toStrictEqual(
        beforeCheck,
      );
      await compileWorkspace({ workspaceRoot, check: false });
      expect(
        JSON.parse(
          await readFile(join(paths.generatedProjectDataDirectory, "CommonEvents.json"), "utf8"),
        ),
      ).toStrictEqual(common);
      expect(await diffWorkspace({ workspaceRoot })).toContain("- none");
      const source = sources.find((path) => path.endsWith("common-events.events.ts"))!;
      await writeFile(
        source,
        (await readFile(source, "utf8")).replace("R2 guard", "R2 installed guard"),
      );
      await compileWorkspace({ workspaceRoot, check: false });
      expect(await diffWorkspace({ workspaceRoot })).toContain("CommonEvents.json");
      await pushWorkspace({ workspaceRoot, allowDestructive: false });
      expect(JSON.parse(await readFile(join(project, "CommonEvents.json"), "utf8"))).toStrictEqual([
        null,
        { ...common[1], name: "R2 installed guard" },
      ]);
    });
  },
  30_000,
);

evidenceTest(
  "MV-S6-CONDITIONAL-ALL-CARRIERS",
  "round-trips every Conditional mode and numeric negative zero through actual source in all three carriers",
  async () => {
    await withWindowsSandbox("conditional-all-carriers", async (sandbox) => {
      const { workspaceRoot } = sandbox;
      await createMinimalProject(workspaceRoot);
      const project = join(workspaceRoot, "Game/data");
      const numeric = [
        [1, 1, 0, -0, 0],
        [3, -0, 0],
        [7, -0, 0],
        [5, -0, 0],
      ];
      const list = [...conditionCases.map(([, , parameters]) => parameters), ...numeric].flatMap(
        (parameters) => [
          { code: 111, indent: 0, parameters },
          { code: 108, indent: 1, parameters: ["then"] },
          { code: 0, indent: 1, parameters: [] },
          { code: 411, indent: 0, parameters: [] },
          { code: 0, indent: 1, parameters: [] },
          { code: 412, indent: 0, parameters: [] },
        ],
      );
      list.push({ code: 0, indent: 0, parameters: [] });
      const common = [null, { id: 1, name: "All conditions", trigger: 0, switchId: 1, list }];
      const map = {
        width: 1,
        height: 1,
        tilesetId: 1,
        events: [null, { ...blankEvent, pages: [{ ...blankEvent.pages[0], list }] }],
      };
      const troops = [
        null,
        {
          id: 1,
          name: "Conditional troop",
          members: [{ enemyId: 1, x: 0, y: 0, hidden: false }],
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
              list,
            },
          ],
        },
      ];
      const expected = new Map<string, unknown>([
        ["CommonEvents.json", common],
        ["Map001.json", map],
        ["Troops.json", troops],
      ]);
      for (const [file, value] of expected)
        await writeFile(join(project, file), renderJsonValue(value));
      await writeFile(join(project, "MapInfos.json"), '[null,{"id":1,"name":"Conditional map"}]');
      await writeFile(
        join(project, "System.json"),
        '{"switches":["","","Second"],"variables":["","","Second"]}',
      );
      for (const file of [
        "Actors",
        "Armors",
        "Classes",
        "Items",
        "Skills",
        "States",
        "Weapons",
        "Enemies",
      ])
        await writeFile(
          join(project, `${file}.json`),
          '[null,{"id":1,"name":""},{"id":2,"name":"Second"}]',
        );
      await initWorkspace({ workspaceRoot, projectRoot: "./Game" });
      await cloneWorkspace({ workspaceRoot });
      const decompile = await runCli(sandbox, ["decompile"]);
      for (const identity of ["map:1/event:1", "commonEvent:1", "troop:1"]) {
        expect(decompile.stderr).toContain(`decompile warning ${identity}: MV-SCRIPT-GATE`);
        expect(decompile.stderr).toContain(
          `decompile warning ${identity}: MV-E111-SCRIPT-RECONFIRM`,
        );
      }
      expect(decompile.stderr).not.toContain("list[66].parameters[3]");
      const sources = await discoverDefinitionFiles(workspaceRoot, discovery);
      const declarations = (
        await Promise.all(sources.map((source) => loadDefinitionFile(source)))
      ).flat();
      const event = declarations.find((value) => value.kind === "commonEvent");
      expect(
        event?.kind === "commonEvent" &&
          event.commands.slice(-4).map((node) => node.kind === "conditional" && node.condition),
      ).toStrictEqual([
        {
          kind: "variable",
          variable: { kind: "variable", id: 1 },
          operator: "eq",
          value: { kind: "constant", value: -0 },
        },
        { kind: "timer", seconds: -0, operator: "ge" },
        { kind: "gold", amount: -0, operator: "ge" },
        {
          kind: "enemy",
          enemy: { kind: "runtimeSelector", scope: "enemy", target: "enemy", index: -0 },
          check: { kind: "appeared" },
        },
      ]);
      const configPath = join(workspaceRoot, "rpgmaker-event-dsl.config.json");
      const closedGate = await fileState(workspaceRoot);
      for (const check of [true, false])
        await expect(compileWorkspace({ workspaceRoot, check })).rejects.toThrow(/MV-SCRIPT-GATE/u);
      expect(await fileState(workspaceRoot)).toStrictEqual(closedGate);
      const config = JSON.parse(await readFile(configPath, "utf8"));
      await writeFile(configPath, JSON.stringify({ ...config, scriptEnabled: true }));
      await compileWorkspace({ workspaceRoot, check: true });
      await compileWorkspace({ workspaceRoot, check: false });
      const paths = getWorkspaceStatePaths(workspaceRoot);
      for (const [file, value] of expected)
        expect(
          JSON.parse(await readFile(join(paths.generatedProjectDataDirectory, file), "utf8")),
        ).toStrictEqual(value);
      expect(await diffWorkspace({ workspaceRoot })).toContain("- none");
      for (const source of sources) {
        const text = await readFile(source, "utf8");
        await writeFile(
          source,
          text
            .replace("All conditions", "Installed conditions")
            .replace("Complete blank", "Installed map event")
            .replace('comment(["then"])', 'comment(["Installed body"])'),
        );
      }
      await compileWorkspace({ workspaceRoot, check: false });
      await pushWorkspace({ workspaceRoot, allowDestructive: false });
      const installedCommon = structuredClone(common);
      const installedMap = structuredClone(map);
      const installedTroops = structuredClone(troops);
      installedCommon[1]!.name = "Installed conditions";
      installedMap.events[1]!.name = "Installed map event";
      for (const commands of [
        installedCommon[1]!.list,
        installedMap.events[1]!.pages[0]!.list,
        installedTroops[1]!.pages[0]!.list,
      ])
        commands[1]!.parameters = ["Installed body"];
      const installedCarriers = new Map<string, unknown>([
        ["CommonEvents.json", installedCommon],
        ["Map001.json", installedMap],
        ["Troops.json", installedTroops],
      ]);
      for (const [file, installed] of installedCarriers) {
        expect(JSON.parse(await readFile(join(project, file), "utf8"))).toStrictEqual(installed);
        expect(await readFile(join(project, file), "utf8")).toBe(
          await readFile(join(paths.generatedProjectDataDirectory, file), "utf8"),
        );
      }
    });
  },
  30_000,
);

evidenceTest(
  "MV-S6-CONDITIONAL-NATIVE-REJECTION",
  "rejects malformed Conditional native inputs and missing fixed references before source publication",
  async () => {
    for (const [name, parameters] of [
      ["range", [3, 6000, 0]],
      ["mode-negative-zero", [-0, 1, 0]],
      ["actor-slot-count", [4, 1, 0, 0]],
      ["missing-fixed-reference", [8, 99]],
    ] as const)
      await withWindowsSandbox(`conditional-native-${name}`, async ({ workspaceRoot }) => {
        await createMinimalProject(workspaceRoot);
        const list = [
          { code: 111, indent: 0, parameters },
          { code: 0, indent: 1, parameters: [] },
          { code: 412, indent: 0, parameters: [] },
          { code: 0, indent: 0, parameters: [] },
        ];
        await writeFile(
          join(workspaceRoot, "Game/data/CommonEvents.json"),
          renderJsonValue([
            null,
            { id: 1, name: "Bad Conditional", trigger: 0, switchId: 1, list },
          ]),
        );
        await initWorkspace({ workspaceRoot, projectRoot: "./Game" });
        await cloneWorkspace({ workspaceRoot });
        const before = await fileState(workspaceRoot);
        await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(/MV-E111/u);
        expect(await fileState(workspaceRoot)).toStrictEqual(before);
      });
  },
  30_000,
);

evidenceTest(
  "MV-S6-CONDITIONAL-SOURCE-REJECTION",
  "rejects malformed actual discovered Conditional source with Check and Compile while preserving business files",
  async () => {
    await withWindowsSandbox("conditional-source-rejections", async ({ workspaceRoot }) => {
      await createMinimalProject(workspaceRoot);
      await initWorkspace({ workspaceRoot, projectRoot: "./Game" });
      await cloneWorkspace({ workspaceRoot });
      await decompileWorkspace({ workspaceRoot });
      const source = (await discoverDefinitionFiles(workspaceRoot, discovery)).find((file) =>
        file.endsWith("common-events.events.ts"),
      )!;
      for (const [command, code] of [
        [
          'conditional({ condition: { kind: "timer", seconds: 6000, operator: "ge" }, then: { commands: [] } } as never)',
          "MV-E111",
        ],
        [
          '({ kind: "conditional", condition: { kind: "weapon", weapon: { kind: "weapon", id: 1 } }, then: { commands: [] } } as never)',
          "MV-E111",
        ],
        [
          'conditional({ condition: { kind: "button", button: "ok" }, then: { commands: [] }, extra: undefined } as never)',
          "MV-E111",
        ],
        [
          'conditional({ condition: { kind: "button", button: "ok" }, then: { commands: [], endMarker: "absent" } })',
          "MV-CHILD-BODY",
        ],
        [
          'conditional({ condition: { kind: "button", button: "ok" }, then: { commands: [] }, else: { commands: [conditional({ condition: { kind: "script", script: scriptInput({ code: "" }) }, then: { commands: [] } })] } })',
          "MV-SCRIPT-GATE",
        ],
        [
          '({ kind: "rawDslCommand", code: 111, parameters: [12, ""] } as never), ({ kind: "rawDslCommand", code: 0, indent: 1, parameters: [] } as never), ({ kind: "rawDslCommand", code: 412, parameters: [] } as never)',
          "MV-SCRIPT-GATE",
        ],
      ]) {
        await writeFile(
          source,
          `import { commonEvent, conditional, scriptInput } from "rpgmaker-event-dsl";\nexport const event = commonEvent({ id: 1, name: "Invalid", trigger: "none", commands: [${command}] });\n`,
        );
        const before = await fileState(workspaceRoot);
        for (const check of [true, false])
          await expect(compileWorkspace({ workspaceRoot, check })).rejects.toThrow(
            new RegExp(code!),
          );
        expect(await fileState(workspaceRoot)).toStrictEqual(before);
      }
    });
  },
  30_000,
);
