import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import * as api from "../src/workspace-api.js";
import { discoverDefinitionFiles } from "../src/workspace/definitions.js";
import {
  createMinimalProject,
  withWindowsSandbox,
  type WindowsSandbox,
} from "./support/windows-sandbox.js";
import { blankPage } from "./support/map-event-fixtures.js";
import { recordEvidence, sha256 } from "./support/mv-evidence.js";

const saved = JSON.parse(
  await readFile(new URL("./fixtures/mv-evidence/map-characters.json", import.meta.url), "utf8"),
);
const troopFixture = JSON.parse(
  await readFile(
    new URL("./fixtures/mv-evidence/troop-event-project.json", import.meta.url),
    "utf8",
  ),
);
const end = { code: 0, indent: 0, parameters: [] };

// Fixture materialization keeps numeric -0 independently of the product writer.
function nativeJson(value: unknown): string {
  return JSON.stringify(value, (_key, item) =>
    Object.is(item, -0) ? "__character_saved_negative_zero__" : item,
  ).replaceAll('"__character_saved_negative_zero__"', "-0");
}
async function tree(root: string): Promise<Record<string, string>> {
  const output: Record<string, string> = {};
  for (const entry of (await readdir(root, { withFileTypes: true }).catch(() => [])).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    if (entry.name === "operation.lock") continue;
    if (entry.isDirectory()) {
      output[entry.name + "/"] = "directory";
      for (const [path, bytes] of Object.entries(await tree(join(root, entry.name))))
        output[entry.name + "/" + path] = bytes;
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
    discovery: await discoverDefinitionFiles(workspaceRoot, JSON.parse(config)),
    source: await tree(join(workspaceRoot, "src")),
    project: await tree(join(workspaceRoot, "Game")),
    state,
  };
}
async function project(workspaceRoot: string, includeMatrix = true) {
  const fixture = await createMinimalProject(workspaceRoot);
  const files = fixture.projectFiles;
  files["Animations.json"] = [null, { id: 1, name: "", frames: [], fixture: { keep: [null, {}] } }];
  const matrix = includeMatrix ? saved.list : [end];
  files["CommonEvents.json"] = [
    null,
    { id: 1, name: "Character Common", trigger: 0, switchId: 1, list: structuredClone(matrix) },
  ];
  files["MapInfos.json"] = [null, { id: 1, name: "Character Map", order: 1, parentId: 0 }];
  files["Map001.json"] = {
    width: 5,
    height: 4,
    tilesetId: 1,
    fixture: { keep: [null, [], {}] },
    events: [
      null,
      {
        id: 1,
        name: "Character Map Event",
        note: "  <keep>\r\n",
        x: 0,
        y: 0,
        pages: [{ ...structuredClone(blankPage), list: structuredClone(matrix) }],
      },
      { id: 2, name: "Target", note: "", x: 1, y: 0, pages: [structuredClone(blankPage)] },
    ],
  };
  files["Tilesets.json"] = [
    null,
    { id: 1, name: "", tilesetNames: ["", "", "", "", "", "", "", "", ""] },
  ];
  files["Troops.json"] = [
    null,
    {
      id: 1,
      name: "External troop name",
      members: [],
      fixture: { keep: null },
      pages: [
        {
          ...structuredClone(troopFixture.defaultPage),
          conditions: { ...troopFixture.defaultPage.conditions, turnEnding: true },
          list: structuredClone(matrix),
        },
      ],
    },
  ];
  for (const [name, value] of Object.entries(files))
    await writeFile(join(workspaceRoot, "Game/data", name), nativeJson(value));
  await api.initWorkspace({ workspaceRoot, projectRoot: "./Game" });
  await api.cloneWorkspace({ workspaceRoot });
  return files;
}
async function evidence(
  id: string,
  label: string,
  verify: (s: WindowsSandbox, actual: Record<string, unknown>) => Promise<void>,
) {
  const startedAt = new Date().toISOString();
  const actual: Record<string, unknown> = {};
  let failure: unknown;
  try {
    await withWindowsSandbox(label, async (s) => {
      actual.sandbox = s.root;
      await verify(s, actual);
    });
  } catch (error) {
    failure = error;
    throw error;
  } finally {
    await recordEvidence({
      requirementId: `MV-S6-CHARACTER-${id}`,
      startedAt,
      stages: [
        "Independent synthetic saved parameters and complete 15-carrier project",
        "Actual public Workspace API, Discovery, package types and source evaluation",
        "Complete parsed data, exact diagnostic paths and full business-state preservation",
      ],
      expected:
        "All assertions in the linked independent saved-value and Workspace case hold; native execution is not performed.",
      actual,
      ...(failure === undefined ? {} : { error: failure }),
    });
  }
}

it("MV-S6-CHARACTER-001: preserves the complete native matrix through real Workspace evaluation and Push", async () => {
  await evidence("001", "character-matrix", async (s, actual) => {
    const expected = await project(s.workspaceRoot);
    expect(Object.keys(expected)).toHaveLength(15);
    await api.decompileWorkspace(s);
    await api.compileWorkspace({ ...s, check: true });
    await api.compileWorkspace({ ...s, check: false });
    const state = join(s.workspaceRoot, ".rpgmaker-event-dsl");
    const generated = (await readdir(join(state, "generated-project-data"))).sort();
    expect(generated).toEqual(["CommonEvents.json", "Map001.json", "System.json", "Troops.json"]);
    for (const [name, value] of Object.entries(expected)) {
      if (generated.includes(name))
        expect(
          JSON.parse(await readFile(join(state, "generated-project-data", name), "utf8")),
        ).toStrictEqual(value);
      expect(
        JSON.parse(await readFile(join(state, "project-data-snapshot", name), "utf8")),
      ).toStrictEqual(value);
    }
    expect(await api.diffWorkspace(s)).toContain("Affected Project Data Files:\n- none");
    const common = join(s.workspaceRoot, "src/decompiled/common-events.events.ts");
    await writeFile(
      common,
      (await readFile(common, "utf8")).replace("Character Common", "Character Common edited"),
    );
    const map = join(s.workspaceRoot, "src/decompiled/maps/Map001.events.ts");
    await writeFile(
      map,
      (await readFile(map, "utf8")).replace("Character Map Event", "Character Map Event edited"),
    );
    const troop = join(s.workspaceRoot, "src/decompiled/troop-events.events.ts");
    await writeFile(
      troop,
      (await readFile(troop, "utf8"))
        .replace("import {", "import { rawDslCommand,")
        .replace(
          "commands: [",
          'commands: [rawDslCommand({ code: 108, parameters: ["Character source evaluated"] }),',
        ),
    );
    expected["CommonEvents.json"][1].name = "Character Common edited";
    expected["Map001.json"].events[1].name = "Character Map Event edited";
    expected["Troops.json"][1].pages[0].list.unshift({
      code: 108,
      indent: 0,
      parameters: ["Character source evaluated"],
    });
    await api.compileWorkspace({ ...s, check: true });
    await api.compileWorkspace({ ...s, check: false });
    const diff = await api.diffWorkspace(s);
    for (const name of ["CommonEvents.json", "Map001.json", "Troops.json"])
      expect(diff).toContain(name);
    await api.pushWorkspace({ ...s, allowDestructive: false });
    for (const [name, value] of Object.entries(expected)) {
      for (const root of [
        join(s.workspaceRoot, "Game/data"),
        join(state, "project-data-snapshot"),
        ...(generated.includes(name) ? [join(state, "generated-project-data")] : []),
      ])
        expect(JSON.parse(await readFile(join(root, name), "utf8"))).toStrictEqual(value);
    }
    const observed = await observe(s.workspaceRoot);
    const manifest = JSON.parse(await readFile(join(state, "sync-manifest.json"), "utf8"));
    expect(
      manifest.compileBaseline.sourceFiles
        .map((file: { relativePath: string }) => file.relativePath)
        .sort(),
    ).toEqual(
      observed.discovery
        .map((path) => path.slice(s.workspaceRoot.length + 1).replaceAll("\\", "/"))
        .sort(),
    );
    actual.completeProject = expected;
    actual.discovery = observed.discovery;
    actual.diff = diff;
  });
});

const inputs = [
  ["scrollMap", '{direction:"down",distance:0,speed:1}'],
  ["getOnOffVehicle", null],
  ["changeTransparency", "{transparent:true}"],
  [
    "showAnimation",
    '{target:{kind:"runtimeSelector",scope:"character",target:"player"},animation:{kind:"animation",id:1},wait:false}',
  ],
  [
    "showBalloonIcon",
    '{target:{kind:"runtimeSelector",scope:"character",target:"player"},balloon:"userDefined5",wait:false}',
  ],
  ["eraseEvent", null],
  ["changePlayerFollowers", "{visible:false}"],
  ["gatherFollowers", null],
] as const;
for (const [helper, valid] of inputs)
  for (const form of ["local", "spread", "asserted", "direct"] as const)
    it(`MV-S6-CHARACTER-002: rejects evaluated ${helper} ${form} excess fields without changing business state`, async () => {
      await evidence("002", `character-${helper}-${form}`, async (s, actual) => {
        await project(s.workspaceRoot, false);
        await api.decompileWorkspace(s);
        await api.compileWorkspace({ ...s, check: false });
        const base = valid ?? "{}";
        const input = base.slice(0, -1) + `${base.length > 2 ? "," : ""}unexpected:true}`;
        const command =
          form === "direct"
            ? `({kind:"${helper}",...input} as any)`
            : form === "asserted"
              ? `${helper}(${input} as any)`
              : form === "spread"
                ? `${helper}({...input})`
                : `${helper}(input)`;
        const source = `import {commonEvent,${helper}} from "rpgmaker-event-dsl";\nconst input=${input} as const;\n${valid === null && form !== "direct" ? "// @ts-ignore intentional untyped extra-argument boundary\n" : ""}export const bad=commonEvent({id:1,name:"Invalid",trigger:"none",commands:[${command}]});`;
        // Replace the actual Common source, leaving all discovered Map/Troop sources intact.
        await writeFile(join(s.workspaceRoot, "src/decompiled/common-events.events.ts"), source);
        const before = await observe(s.workspaceRoot);
        const expected = form === "direct" || valid !== null ? /MV-DSL-SHAPE/ : /MV-E\d+-INPUT/;
        for (const check of [true, false]) {
          await expect(api.compileWorkspace({ ...s, check })).rejects.toThrow(expected);
          expect(await observe(s.workspaceRoot)).toStrictEqual(before);
        }
        await expect(api.diffWorkspace(s)).rejects.toThrow(/stale/);
        await expect(api.pushWorkspace({ ...s, allowDestructive: false })).rejects.toThrow(/stale/);
        expect(await observe(s.workspaceRoot)).toStrictEqual(before);
        actual.source = source;
        actual.beforeFingerprint = sha256(JSON.stringify(before));
        actual.afterFingerprint = sha256(JSON.stringify(await observe(s.workspaceRoot)));
      });
    });

it.each([
  [211, [-0], "MV-E211-PARAMETERS"],
  [212, [-0, 1, false], "MV-E212-PARAMETERS"],
  [213, [0, 16, false], "MV-E213-PARAMETERS"],
  [204, [2, 101, 1], "MV-E204-PARAMETERS"],
  [206, [0], "MV-E206-PARAMETERS"],
  [212, [0, 99, false], "MV-E212-REFERENCE"],
] as const)(
  "MV-S6-CHARACTER-003: refuses saved E%s %j before source publication",
  async (code, parameters, diagnostic) => {
    await evidence("003", `character-native-${code}`, async (s, actual) => {
      const files = await project(s.workspaceRoot, false);
      files["CommonEvents.json"][1].list = [{ code, indent: 0, parameters }, end];
      await writeFile(
        join(s.workspaceRoot, "Game/data/CommonEvents.json"),
        nativeJson(files["CommonEvents.json"]),
      );
      await api.pullWorkspace(s);
      await mkdir(join(s.workspaceRoot, "src"), { recursive: true });
      await writeFile(join(s.workspaceRoot, "src/keep.txt"), "Keep original source bytes\r\n");
      const before = await observe(s.workspaceRoot);
      try {
        await api.decompileWorkspace(s);
        expect.fail("Invalid native input was published");
      } catch (error) {
        actual.failure = String(error);
        expect(String(error)).toContain(diagnostic);
        expect(String(error)).toContain("parameters");
      }
      expect(await observe(s.workspaceRoot)).toStrictEqual(before);
      actual.native = { code, parameters };
      actual.diagnostic = diagnostic;
      actual.beforeFingerprint = sha256(JSON.stringify(before));
      actual.afterFingerprint = sha256(JSON.stringify(await observe(s.workspaceRoot)));
    });
  },
);

it.each([
  [
    "rawDslCommand({code:213,parameters:[0,16,false]})",
    "MV-E213-PARAMETERS",
    "commands[0].parameters[1]",
  ],
  ["rawDslCommand({code:212,parameters:[0,99,false]})", "MV-E212-REFERENCE", "parameters[1]"],
  [
    '({kind:"showAnimation",target:{kind:"runtimeSelector",scope:"character",target:"player"},animation:{kind:"animation",id:1},wait:undefined} as any)',
    "MV-E212-INPUT",
    "commands[0].wait",
  ],
])(
  "MV-S6-CHARACTER-002: rejects actual raw or undefined formal source %s",
  async (expression, diagnostic, path) => {
    await evidence("002", "character-source-domain", async (s, actual) => {
      await project(s.workspaceRoot, false);
      await api.decompileWorkspace(s);
      await api.compileWorkspace({ ...s, check: false });
      const source = `import {commonEvent,rawDslCommand} from "rpgmaker-event-dsl";export const bad=commonEvent({id:1,name:"Bad saved input",trigger:"none",commands:[${expression}]});`;
      await writeFile(join(s.workspaceRoot, "src/decompiled/common-events.events.ts"), source);
      const before = await observe(s.workspaceRoot);
      for (const check of [true, false]) {
        try {
          await api.compileWorkspace({ ...s, check });
          expect.fail("Invalid source accepted");
        } catch (error) {
          expect(String(error)).toContain(diagnostic);
          expect(String(error)).toContain(path);
          actual.failure = String(error);
        }
        expect(await observe(s.workspaceRoot)).toStrictEqual(before);
      }
      await expect(api.diffWorkspace(s)).rejects.toThrow(/stale/);
      await expect(api.pushWorkspace({ ...s, allowDestructive: false })).rejects.toThrow(/stale/);
      expect(await observe(s.workspaceRoot)).toStrictEqual(before);
      actual.source = source;
      actual.preservedState = sha256(JSON.stringify(before));
    });
  },
);

it.each([
  "scrollMap({direction:2,distance:0,speed:1})",
  'showAnimation({target:{kind:"runtimeSelector",scope:"character",target:"player"},animation:animationRef({id:1})})',
  'showBalloonIcon({target:{kind:"runtimeSelector",scope:"character",target:"player"},balloon:15,wait:false})',
])(
  "MV-S6-CHARACTER-004: public types reject incomplete or numeric aliases %s",
  async (expression) => {
    await evidence("004", "character-public-types", async (s, actual) => {
      await project(s.workspaceRoot, false);
      await mkdir(join(s.workspaceRoot, "src"), { recursive: true });
      await writeFile(
        join(s.workspaceRoot, "src/invalid.events.ts"),
        `import {commonEvent,scrollMap,showAnimation,animationRef,showBalloonIcon} from "rpgmaker-event-dsl";export const bad=commonEvent({id:1,name:"Types",trigger:"none",commands:[${expression}]});`,
      );
      const before = await observe(s.workspaceRoot);
      for (const check of [true, false])
        await expect(api.compileWorkspace({ ...s, check })).rejects.toThrow(
          /TypeScript diagnostics/,
        );
      expect(await observe(s.workspaceRoot)).toStrictEqual(before);
      actual.expression = expression;
      actual.preservedState = sha256(JSON.stringify(before));
    });
  },
);
