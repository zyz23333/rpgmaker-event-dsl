import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { discoverDefinitionFiles, loadDefinitionFile } from "../src/workspace/definitions.js";
import { createMinimalProject, withWindowsSandbox } from "./support/windows-sandbox.js";
import { blankPage } from "./support/map-event-fixtures.js";
import { recordEvidence } from "./support/mv-evidence.js";

const api: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const fixture = JSON.parse(
  await readFile(
    new URL("./fixtures/mv-evidence/label-script-plugin-cases.json", import.meta.url),
    "utf8",
  ),
);
const end = { code: 0, indent: 0, parameters: [] };
async function tree(root: string): Promise<Record<string, string>> {
  const output: Record<string, string> = {};
  for (const entry of (await readdir(root, { withFileTypes: true }).catch(() => [])).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    if (entry.name === "operation.lock") continue;
    if (entry.isDirectory()) {
      output[entry.name + "/"] = "directory";
      for (const [path, value] of Object.entries(await tree(join(root, entry.name))))
        output[entry.name + "/" + path] = value;
    } else output[entry.name] = (await readFile(join(root, entry.name))).toString("hex");
  }
  return output;
}
async function observe(workspaceRoot: string) {
  const config = await readFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8");
  const state = await tree(join(workspaceRoot, ".rpgmaker-event-dsl"));
  delete state["decompile-candidates/"];
  return {
    config,
    state,
    source: await tree(join(workspaceRoot, "src")),
    project: await tree(join(workspaceRoot, "Game")),
    discovery: await discoverDefinitionFiles(workspaceRoot, JSON.parse(config)),
  };
}
async function prepare(workspaceRoot: string, scriptEnabled = true) {
  const minimal = await createMinimalProject(workspaceRoot);
  const files: Record<string, unknown> = { ...minimal.projectFiles };
  files["CommonEvents.json"] = [
    null,
    { id: 1, name: "Complete strings", trigger: 0, switchId: 1, list: fixture.list },
    { id: 2, name: "Separate scope", trigger: 0, switchId: 1, list: fixture.otherList },
  ];
  files["MapInfos.json"] = [
    null,
    { id: 1, name: "Synthetic", order: 1, parentId: 0, expanded: false, scrollX: 0, scrollY: 0 },
  ];
  files["Map001.json"] = {
    width: 2,
    height: 2,
    tilesetId: 1,
    external: { keep: [null, "\r\n"] },
    events: [
      null,
      {
        id: 1,
        name: "Map strings",
        note: "",
        x: 0,
        y: 0,
        pages: [{ ...blankPage, list: fixture.list }],
      },
    ],
  };
  files["Tilesets.json"] = [
    null,
    { id: 1, name: "Synthetic", tilesetNames: ["", "", "", "", "", "", "", "", ""] },
  ];
  files["Troops.json"] = [
    null,
    {
      id: 1,
      name: "External troop name",
      members: [],
      external: [null, "\r\n"],
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
          list: fixture.list,
        },
      ],
    },
  ];
  for (const [name, value] of Object.entries(files))
    await writeFile(join(workspaceRoot, "Game/data", name), JSON.stringify(value));
  await api.initWorkspace({ workspaceRoot, projectRoot: "./Game" });
  const configPath = join(workspaceRoot, "rpgmaker-event-dsl.config.json");
  const config = JSON.parse(await readFile(configPath, "utf8"));
  config.scriptEnabled = scriptEnabled;
  await writeFile(configPath, JSON.stringify(config));
  await api.cloneWorkspace({ workspaceRoot });
  return files;
}
async function evidence(
  id: string,
  label: string,
  body: (workspaceRoot: string, actual: Record<string, unknown>) => Promise<void>,
) {
  const startedAt = new Date().toISOString();
  const actual: Record<string, unknown> = {};
  let error: unknown;
  try {
    await withWindowsSandbox(label, async (s) => body(s.workspaceRoot, actual));
  } catch (caught) {
    error = caught;
    throw caught;
  } finally {
    await recordEvidence({
      requirementId: id,
      startedAt,
      stages: ["synthetic source-product Workspace", label],
      expected: "accepted saved records and complete business-state invariants",
      actual,
      ...(error === undefined ? {} : { error }),
    });
  }
}

it("MV-S6-TEXT-001: round trips exact Label Script and Plugin records in all three event containers and all fifteen carriers", async () => {
  await evidence("MV-S6-TEXT-001", "text-complete", async (workspaceRoot, actual) => {
    const expected = await prepare(workspaceRoot);
    actual.nativeInput = expected;
    expect(Object.keys(expected)).toHaveLength(15);
    const result = await api.decompileWorkspace({ workspaceRoot });
    actual.decompile = result;
    const before = await observe(workspaceRoot);
    const declarations = (
      await Promise.all(before.discovery.map((file) => loadDefinitionFile(file)))
    ).flat();
    expect(
      declarations.filter((d) => ["mapEvent", "commonEvent", "troopEvent"].includes(d.kind)),
    ).toHaveLength(4);
    await api.compileWorkspace({ workspaceRoot, check: true });
    expect(await observe(workspaceRoot)).toStrictEqual(before);
    await api.compileWorkspace({ workspaceRoot, check: false });
    const generatedCarriers: Record<string, unknown> = {};
    for (const [name, value] of Object.entries(expected)) {
      const generated = join(workspaceRoot, ".rpgmaker-event-dsl/generated-project-data", name);
      const bytes = await readFile(generated, "utf8").catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") throw error;
        return readFile(
          join(workspaceRoot, ".rpgmaker-event-dsl/project-data-snapshot", name),
          "utf8",
        );
      });
      expect(JSON.parse(bytes)).toStrictEqual(value);
      generatedCarriers[name] = JSON.parse(bytes);
    }
    actual.materializedCarriers = generatedCarriers;
    await api.diffWorkspace({ workspaceRoot });
    await api.pushWorkspace({ workspaceRoot, allowDestructive: false });
    for (const [name, value] of Object.entries(expected))
      expect(
        JSON.parse(await readFile(join(workspaceRoot, "Game/data", name), "utf8")),
      ).toStrictEqual(value);
    const sourcePath = join(workspaceRoot, "src/decompiled/common-events.events.ts");
    const source = await readFile(sourcePath, "utf8");
    await writeFile(
      sourcePath,
      source.replace('name: "Complete strings"', 'name: "Installed exact strings"'),
    );
    await api.compileWorkspace({ workspaceRoot, check: false });
    expect(await api.diffWorkspace({ workspaceRoot })).toContain("CommonEvents.json");
    await api.pushWorkspace({ workspaceRoot, allowDestructive: false });
    const changed = structuredClone(expected);
    (changed["CommonEvents.json"] as ({ name: string } | null)[])[1]!.name =
      "Installed exact strings";
    for (const [name, value] of Object.entries(changed))
      for (const directory of ["Game/data", ".rpgmaker-event-dsl/project-data-snapshot"])
        expect(
          JSON.parse(await readFile(join(workspaceRoot, directory, name), "utf8")),
        ).toStrictEqual(value);
    actual.completeCarriers = 15;
    actual.discoveredDefinitions = declarations.length;
    actual.installedOwnedDifference = true;
    actual.installedCarriers = changed;
  });
}, 30000);

it("MV-S6-TEXT-002: malformed known Script groups refuse complete Decompile publication", async () => {
  await evidence("MV-S6-TEXT-002", "text-invalid-native", async (workspaceRoot, actual) => {
    await prepare(workspaceRoot);
    await mkdir(join(workspaceRoot, "src"), { recursive: true });
    await writeFile(join(workspaceRoot, "src/sentinel.txt"), "retained source\r\n");
    const bad = [
      [{ code: 355, indent: 0, parameters: ["A\nB"] }, end],
      [{ code: 655, indent: 0, parameters: [""] }, end],
      [{ code: 355, indent: 0, parameters: [""] }, { code: 655, indent: 1, parameters: [""] }, end],
      [
        { code: 355, indent: 0, parameters: [""] },
        ...Array.from({ length: 12 }, () => ({ code: 655, indent: 0, parameters: [""] })),
        end,
      ],
    ];
    actual.rejectedInputs = bad;
    for (const list of bad) {
      await writeFile(
        join(workspaceRoot, "Game/data/CommonEvents.json"),
        JSON.stringify([null, { id: 1, name: "Invalid", trigger: 0, switchId: 1, list }]),
      );
      await api.cloneWorkspace({ workspaceRoot });
      const before = await observe(workspaceRoot);
      await expect(api.decompileWorkspace({ workspaceRoot })).rejects.toThrow(
        /MV-(?:SCRIPT-RECORDS|COMMAND-STRUCTURE)/,
      );
      expect(await observe(workspaceRoot)).toStrictEqual(before);
    }
    actual.rejectedGroupsWithUnchangedState = bad.length;
  });
}, 30000);

it("MV-S6-TEXT-003: closed Gate permits Decompile and complete Plugin lines but rejects nested and raw empty scripts without publication", async () => {
  await evidence("MV-S6-TEXT-003", "text-script-gate", async (workspaceRoot, actual) => {
    await prepare(workspaceRoot, false);
    const configPath = join(workspaceRoot, "rpgmaker-event-dsl.config.json");
    const config = await readFile(configPath, "utf8");
    const decompiled = await api.decompileWorkspace({ workspaceRoot });
    expect(await readFile(configPath, "utf8")).toBe(config);
    actual.decompile = decompiled;
    let before = await observe(workspaceRoot);
    for (const check of [true, false])
      await expect(api.compileWorkspace({ workspaceRoot, check })).rejects.toThrow(
        /MV-SCRIPT-GATE|explicit config enablement/,
      );
    expect(await observe(workspaceRoot)).toStrictEqual(before);
    const path = join(workspaceRoot, "src/decompiled/common-events.events.ts");
    // Replace the complete discovered set using its configured include/exclude patterns.
    for (const file of before.discovery) await writeFile(file, "export {};\n");
    for (const command of [
      'script({code:""})',
      'loop({body:{commands:[script({code:""})]}})',
      'loop({body:{commands:[rawDslCommand({code:355,parameters:[""]}),rawDslCommand({code:655,parameters:[""]})]}})',
    ]) {
      await writeFile(
        path,
        `import { commonEvent, script, loop, rawDslCommand } from "rpgmaker-event-dsl"; export const gated=commonEvent({id:1,name:"Gated",trigger:"none",commands:[${command}]});`,
      );
      before = await observe(workspaceRoot);
      for (const check of [true, false])
        await expect(api.compileWorkspace({ workspaceRoot, check })).rejects.toThrow(
          /MV-SCRIPT-GATE|explicit config enablement/,
        );
      expect(await observe(workspaceRoot)).toStrictEqual(before);
    }
    await writeFile(
      path,
      'import {commonEvent,pluginCommand} from "rpgmaker-event-dsl";export const plugin=commonEvent({id:1,name:"Plugin",trigger:"none",commands:[pluginCommand({line:" X  Y\\t\\r\\n "})]});',
    );
    await api.compileWorkspace({ workspaceRoot, check: true });
    await api.compileWorkspace({ workspaceRoot, check: false });
    actual.gatedFormalNestedAndRaw = true;
    actual.pluginGateClosedCompile = true;
  });
}, 30000);

it("MV-S6-TEXT-004: source const spread casts and direct untyped commands retain strict text validation", async () => {
  await evidence("MV-S6-TEXT-004", "text-source-shape", async (workspaceRoot, actual) => {
    await createMinimalProject(workspaceRoot);
    await api.initWorkspace({ workspaceRoot, projectRoot: "./Game" });
    await api.cloneWorkspace({ workspaceRoot });
    await mkdir(join(workspaceRoot, "src"), { recursive: true });
    const expressions = [
      "label(input as any)",
      "jumpToLabel(input as any)",
      'pluginCommand({...input,line:""} as any)',
      'script({...input,code:""} as any)',
      'script(scriptInput({...input,code:""} as any))',
      '({kind:"label",name:"",extra:7} as any)',
      '({kind:"pluginCommand",line:"",extra:7} as any)',
      '({kind:"script",script:{kind:"scriptInput",code:"",extra:7}} as any)',
      'label("old positional" as any)',
      'jumpToLabel("old positional" as any)',
      'pluginCommand({command:"Old",args:[]} as any)',
    ];
    for (const expression of expressions) {
      await writeFile(
        join(workspaceRoot, "src/invalid.events.ts"),
        `import {commonEvent,label,jumpToLabel,pluginCommand,script,scriptInput} from "rpgmaker-event-dsl"; const extra={extra:7}; const input={name:"",...extra};export const invalid=commonEvent({id:1,name:"Invalid",trigger:"none",commands:[${expression}]});`,
      );
      const before = await observe(workspaceRoot);
      for (const check of [true, false])
        await expect(api.compileWorkspace({ workspaceRoot, check })).rejects.toThrow(
          /MV-DSL-SHAPE/,
        );
      expect(await observe(workspaceRoot)).toStrictEqual(before);
    }
    actual.rejectedSourceExpressionsWithUnchangedState = expressions.length;
    actual.rejectedSourceExpressions = expressions;
  });
}, 30000);
