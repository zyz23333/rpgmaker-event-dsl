import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { discoverDefinitionFiles } from "../src/workspace/definitions.js";
import { createMinimalProject, runCli, withWindowsSandbox } from "./support/windows-sandbox.js";
import { recordEvidence } from "./support/mv-evidence.js";

const api: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const { commonEvent, collectDslOwnedDeclarations }: typeof import("../src/index.js") = await import(
  new URL(
    process.env.MV_CLI_ENTRY === "built" ? "../dist/index.mjs" : "../src/index.ts",
    import.meta.url,
  ).href
);
const end = { code: 0, indent: 0, parameters: [] };

async function tree(root: string): Promise<Record<string, string>> {
  const entries = await readdir(root, { withFileTypes: true }).catch(() => []);
  const files: Record<string, string> = {};
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name === "operation.lock") continue;
    if (entry.isDirectory()) {
      files[entry.name + "/"] = "directory";
      for (const [key, bytes] of Object.entries(await tree(join(root, entry.name))))
        files[entry.name + "/" + key] = bytes;
    } else files[entry.name] = (await readFile(join(root, entry.name))).toString("hex");
  }
  return files;
}
async function observe(workspaceRoot: string) {
  const config = await readFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8");
  const state = await tree(join(workspaceRoot, ".rpgmaker-event-dsl"));
  // An empty tool-owned isolation parent is not business state; retain every child byte.
  delete state["decompile-candidates/"];
  return {
    config,
    discovery: await discoverDefinitionFiles(workspaceRoot, JSON.parse(config)),
    source: await tree(join(workspaceRoot, "src")),
    project: await tree(join(workspaceRoot, "Game")),
    state,
  };
}

const evidenceIds: Record<string, string> = {
  "common-named-call": "001",
  "common-complete-roundtrip": "002",
  "common-invalid-native": "003",
  "common-invalid-authored": "004",
  "common-invalid-call": "005",
  "common-saved-reference": "006",
  "common-native-reference": "007",
  "common-diff-removal": "008",
  "common-staged-scope": "009",
  "common-native-list": "010",
  "common-candidate-scope": "011",
  "common-distant-id": "012",
  "common-gate-and-raw": "013",
  "common-public-types": "014",
  "common-forged-definition": "015",
  "common-unbound-context": "016",
};
it("MV-S5-COMMON-015: public collection validates forged definitions without evaluating accessors", async () => {
  await commonEvidence("common-forged-definition", async (s) => {
    await createMinimalProject(s.workspaceRoot);
    await api.initWorkspace({ ...s, projectRoot: "./Game" });
    await api.cloneWorkspace(s);
    const before = await observe(s.workspaceRoot);
    expect(() =>
      collectDslOwnedDeclarations({
        bad: { kind: "commonEvent", id: 1, name: "Bad", trigger: "none", commands: [], extra: 7 },
      }),
    ).toThrow(/MV-COMMON-EVENT/u);
    let reads = 0;
    const accessor = {
      kind: "commonEvent",
      get id(): number {
        reads++;
        throw Error("getter executed");
      },
      name: "Accessor",
      trigger: "none",
      commands: [],
    };
    expect(() => collectDslOwnedDeclarations({ accessor })).toThrow(/MV-COMMON-EVENT/u);
    expect(reads).toBe(0);
    expect(await observe(s.workspaceRoot)).toStrictEqual(before);
  });
});
it.each(["none", "autorun", "parallel"] as const)(
  "MV-S5-COMMON-006: optional saved Switch undefined follows trigger requirements (%s)",
  async (trigger) => {
    await commonEvidence("common-saved-reference", async (s) => {
      const fixture = await createMinimalProject(s.workspaceRoot);
      fixture.projectFiles["System.json"].switches = [""];
      await writeFile(
        join(s.workspaceRoot, "Game/data/System.json"),
        JSON.stringify(fixture.projectFiles["System.json"]),
      );
      await api.initWorkspace({ ...s, projectRoot: "./Game" });
      await api.cloneWorkspace(s);
      await mkdir(join(s.workspaceRoot, "src"), { recursive: true });
      await writeFile(
        join(s.workspaceRoot, "src/undefined.events.ts"),
        `import {commonEvent} from "rpgmaker-event-dsl";export const saved=commonEvent({id:1,name:"Undefined saved switch",trigger:"${trigger}",switch:undefined,commands:[]}${trigger === "none" ? "" : " as any"});`,
      );
      const before = await observe(s.workspaceRoot);
      if (trigger !== "none") {
        for (const check of [true, false])
          await expect(api.compileWorkspace({ ...s, check })).rejects.toThrow(/MV-COMMON-EVENT/u);
        expect(await observe(s.workspaceRoot)).toStrictEqual(before);
        return;
      }
      const expected = [
        null,
        { id: 1, name: "Undefined saved switch", trigger: 0, switchId: 1, list: [end] },
      ];
      await api.compileWorkspace({ ...s, check: true });
      expect(await observe(s.workspaceRoot)).toStrictEqual(before);
      await api.compileWorkspace({ ...s, check: false });
      expect(
        JSON.parse(
          await readFile(
            join(s.workspaceRoot, ".rpgmaker-event-dsl/generated-project-data/CommonEvents.json"),
            "utf8",
          ),
        ),
      ).toStrictEqual(expected);
      await api.diffWorkspace(s);
      await api.pushWorkspace({ ...s, allowDestructive: false });
      expect(
        JSON.parse(await readFile(join(s.workspaceRoot, "Game/data/CommonEvents.json"), "utf8")),
      ).toStrictEqual(expected);
    });
  },
);
it.each([
  'commonEvent({id:1,name:"Autorun",trigger:"autorun",commands:[]})',
  'commonEvent({id:1,name:"Parallel",trigger:"parallel",commands:[]})',
  'commonEvent({id:1,name:"Caller",trigger:"none",commands:[callCommonEvent(commonEventRef({id:1}))]})',
])(
  "MV-S5-COMMON-014: public types require an active trigger Switch and the named E117 input (%s)",
  async (expression) => {
    await commonEvidence("common-public-types", async (s) => {
      await createMinimalProject(s.workspaceRoot);
      await api.initWorkspace({ ...s, projectRoot: "./Game" });
      await api.cloneWorkspace(s);
      await mkdir(join(s.workspaceRoot, "src"), { recursive: true });
      await writeFile(
        join(s.workspaceRoot, "src/typed.events.ts"),
        `import {commonEvent,callCommonEvent,commonEventRef} from "rpgmaker-event-dsl"; export const event=${expression};`,
      );
      const before = await observe(s.workspaceRoot);
      for (const check of [true, false])
        await expect(api.compileWorkspace({ ...s, check })).rejects.toThrow(
          /TypeScript diagnostics/u,
        );
      expect(await observe(s.workspaceRoot)).toStrictEqual(before);
    });
  },
);
it.each([
  { kind: "commonEvent", id: 1, name: null, trigger: "none", commands: [] },
  { kind: "commonEvent", id: 1, name: "Forged", trigger: "none", commands: [], extra: 7 },
  { kind: "commonEvent", id: 1, name: "Forged", trigger: "none", commands: null },
  { kind: "commonEvent", id: 1, name: "Forged", trigger: "parallel", commands: [] },
])(
  "MV-S5-COMMON-015: validates direct exported Common definitions before scope construction (%j)",
  async (input) => {
    await commonEvidence("common-forged-definition", async (s) => {
      await createMinimalProject(s.workspaceRoot);
      await api.initWorkspace({ ...s, projectRoot: "./Game" });
      await api.cloneWorkspace(s);
      await mkdir(join(s.workspaceRoot, "src"), { recursive: true });
      await writeFile(
        join(s.workspaceRoot, "src/forged.events.ts"),
        `export const forged=${JSON.stringify(input)} as any;`,
      );
      const before = await observe(s.workspaceRoot);
      for (const check of [true, false])
        await expect(api.compileWorkspace({ ...s, check })).rejects.toThrow(/MV-COMMON-EVENT/u);
      expect(await observe(s.workspaceRoot)).toStrictEqual(before);
    });
  },
);
it("MV-S5-COMMON-016: preserves caller-dependent current-event operations without inventing a fixed Map context", async () => {
  await commonEvidence("common-unbound-context", async (s) => {
    const fixture = await createMinimalProject(s.workspaceRoot);
    fixture.projectFiles["System.json"].variables = ["", ""];
    await writeFile(
      join(s.workspaceRoot, "Game/data/System.json"),
      JSON.stringify(fixture.projectFiles["System.json"]),
    );
    const expected = [
      null,
      {
        id: 1,
        name: "Reusable context",
        trigger: 0,
        switchId: 1,
        list: [
          { code: 203, indent: 0, parameters: [0, 0, 2, 1, 0] },
          { code: 285, indent: 0, parameters: [1, 0, 0, 2, 1] },
          { code: 123, indent: 0, parameters: ["A", 0] },
          end,
        ],
      },
    ];
    await writeFile(join(s.workspaceRoot, "Game/data/CommonEvents.json"), JSON.stringify(expected));
    await api.initWorkspace({ ...s, projectRoot: "./Game" });
    await api.cloneWorkspace(s);
    await api.decompileWorkspace(s);
    const before = await observe(s.workspaceRoot);
    const check = await runCli(s, ["compile", "--check"]);
    expect(check.exitCode).toBe(0);
    expect(check.stderr).not.toMatch(/unknown.*map|outside.*bounds|requires.*context/iu);
    expect(await observe(s.workspaceRoot)).toStrictEqual(before);
    await api.compileWorkspace({ ...s, check: false });
    expect(
      JSON.parse(
        await readFile(
          join(s.workspaceRoot, ".rpgmaker-event-dsl/generated-project-data/CommonEvents.json"),
          "utf8",
        ),
      ),
    ).toStrictEqual(expected);
  });
}, 30000);
async function commonEvidence(label: string, body: Parameters<typeof withWindowsSandbox>[1]) {
  return withWindowsSandbox(label, async (s) => {
    const startedAt = new Date().toISOString();
    let failure: unknown;
    try {
      await body(s);
    } catch (error) {
      failure = error;
      throw error;
    } finally {
      await recordEvidence({
        requirementId: `MV-S5-COMMON-${evidenceIds[label]}`,
        startedAt,
        stages: [
          "Actual discovered TypeScript source evaluation and public Workspace operations on real Windows filesystem",
        ],
        expected:
          "Complete independent Common saved state, ordinary references, conservative publication and Push; no business mutation on failed or check-only paths",
        actual: {
          finalState: await observe(s.workspaceRoot),
          processes: s.processes,
          entry: s.cliEntry,
        },
        ...(failure === undefined ? {} : { error: failure }),
      });
    }
  });
}

const invalidNativeContainers: Array<[string, unknown]> = [
  ["scalar", 7],
  ["array", []],
  ...Object.entries({
    id: [undefined, 0, -1, 1.5, 3],
    name: [undefined, null, 7],
    trigger: [undefined, null, "none", -1, 3, 0.5],
    switchId: [undefined, null, 0, -1, 1.5],
  }).flatMap(([field, values]) =>
    values.map((value) => {
      const event: Record<string, unknown> = {
        id: 2,
        name: "Late",
        trigger: 0,
        switchId: 1,
        list: [end],
      };
      if (value === undefined) delete event[field];
      else event[field] = value;
      return [`${field} ${String(value)}`, event] as [string, unknown];
    }),
  ),
  ["unknown key", { id: 2, name: "Late", trigger: 0, switchId: 1, list: [end], extra: 7 }],
];

const invalidAuthoredContainers: Array<[string, Record<string, unknown>]> = [
  ...Object.entries({
    id: [undefined, 0, -1, 1.5],
    name: [undefined, null, 7],
    trigger: [undefined, null, "other"],
    commands: [undefined, null, {}],
  }).flatMap(([field, values]) =>
    values.map((value) => {
      const event: Record<string, unknown> = {
        id: 1,
        name: "Invalid authored",
        trigger: "none",
        commands: [],
      };
      if (value === undefined) delete event[field];
      else event[field] = value;
      return [`${field} ${String(value)}`, event] as [string, Record<string, unknown>];
    }),
  ),
  ["unknown owned field", { id: 1, name: "Invalid", trigger: "none", commands: [], extra: 1 }],
  ["null saved switch", { id: 1, name: "Invalid", trigger: "none", commands: [], switch: null }],
  [
    "wrong saved switch kind",
    { id: 1, name: "Invalid", trigger: "none", commands: [], switch: { kind: "actor", id: 1 } },
  ],
  ["autorun missing switch", { id: 1, name: "Invalid", trigger: "autorun", commands: [] }],
  ["parallel missing switch", { id: 1, name: "Invalid", trigger: "parallel", commands: [] }],
];
const invalidCalls = [
  "callCommonEvent(null as any)",
  "callCommonEvent({} as any)",
  "callCommonEvent(commonEventRef({id:2}) as any)",
  "callCommonEvent({commonEvent:commonEventRef({id:2}),extra:7} as any)",
  "callCommonEvent({commonEvent:null} as any)",
  'callCommonEvent({commonEvent:{kind:"actor",id:1}} as any)',
  'callCommonEvent({commonEvent:{kind:"commonEvent",id:0}} as any)',
  'callCommonEvent({commonEvent:{kind:"commonEvent",id:2,name:"Target"}} as any)',
  'callCommonEvent({commonEvent:{kind:"commonEvent",name:7}} as any)',
  'callCommonEvent({commonEvent:{kind:"commonEvent",id:2,extra:7}} as any)',
  '({kind:"commonEvent",ref:commonEventRef({id:2})} as any)',
  '({kind:"commonEvent",commonEvent:{kind:"actor",id:1}} as any)',
  '({kind:"commonEvent",commonEvent:commonEventRef({id:2}),extra:7} as any)',
];
it.each(invalidCalls)(
  "MV-S5-COMMON-005: rejects invalid E117 shape through real source (%s)",
  async (expression) => {
    await commonEvidence("common-invalid-call", async (s) => {
      await createMinimalProject(s.workspaceRoot);
      await api.initWorkspace({ ...s, projectRoot: "./Game" });
      await api.cloneWorkspace(s);
      await mkdir(join(s.workspaceRoot, "src"), { recursive: true });
      await writeFile(
        join(s.workspaceRoot, "src/call.events.ts"),
        `import {commonEvent,callCommonEvent,commonEventRef} from "rpgmaker-event-dsl";
export const caller=commonEvent({id:1,name:"Caller",trigger:"none",commands:[${expression}]});
export const target=commonEvent({id:2,name:"Target",trigger:"none",commands:[]});`,
      );
      const before = await observe(s.workspaceRoot);
      for (const check of [true, false])
        await expect(api.compileWorkspace({ ...s, check })).rejects.toThrow(/MV-E117/u);
      expect(await observe(s.workspaceRoot)).toStrictEqual(before);
    });
  },
);
it.each([
  {
    label: "omitted none default outside capacity",
    switches: [""],
    trigger: "none",
    field: "",
    declarations: "",
    ok: true,
  },
  {
    label: "explicit none requires existence",
    switches: [""],
    trigger: "none",
    field: "switch:switchRef({id:1}),",
    declarations: "",
    ok: false,
  },
  {
    label: "explicit none unnamed capacity slot",
    switches: ["", "", ""],
    trigger: "none",
    field: "switch:switchRef({id:2}),",
    declarations: "",
    ok: true,
  },
  {
    label: "autorun unnamed capacity slot",
    switches: ["", "", ""],
    trigger: "autorun",
    field: "switch:switchRef({id:2}),",
    declarations: "",
    ok: true,
  },
  {
    label: "parallel unnamed capacity slot",
    switches: ["", "", ""],
    trigger: "parallel",
    field: "switch:switchRef({id:2}),",
    declarations: "",
    ok: true,
  },
  {
    label: "reference cannot expand capacity",
    switches: ["", "", ""],
    trigger: "none",
    field: "switch:switchRef({id:3}),",
    declarations: "",
    ok: false,
  },
  {
    label: "Snapshot name is not staged name",
    switches: ["", "Snapshot"],
    trigger: "none",
    field: 'switch:switchRef({name:"Snapshot"}),',
    declarations: "",
    ok: false,
  },
  {
    label: "unnamed slot is not named target",
    switches: ["", ""],
    trigger: "none",
    field: 'switch:switchRef({name:""}),',
    declarations: "",
    ok: false,
  },
  {
    label: "unique staged name",
    switches: [""],
    trigger: "none",
    field: 'switch:switchRef({name:"Active"}),',
    declarations: 'export const active=switchDefinition({id:2,name:"Active"});',
    ok: true,
  },
  {
    label: "ambiguous staged name",
    switches: [""],
    trigger: "none",
    field: 'switch:switchRef({name:"Same"}),',
    declarations:
      'export const a=switchDefinition({id:1,name:"Same"}); export const b=switchDefinition({id:2,name:"Same"});',
    ok: false,
  },
])("MV-S5-COMMON-006: applies ordinary Switch reference rules ($label)", async (c) => {
  await commonEvidence("common-saved-reference", async (s) => {
    const fixture = await createMinimalProject(s.workspaceRoot);
    fixture.projectFiles["System.json"].switches = c.switches;
    await writeFile(
      join(s.workspaceRoot, "Game/data/System.json"),
      JSON.stringify(fixture.projectFiles["System.json"]),
    );
    await api.initWorkspace({ ...s, projectRoot: "./Game" });
    await api.cloneWorkspace(s);
    await mkdir(join(s.workspaceRoot, "src"), { recursive: true });
    await writeFile(
      join(s.workspaceRoot, "src/saved.events.ts"),
      `import {commonEvent,switchDefinition,switchRef} from "rpgmaker-event-dsl";
${c.declarations}
export const saved=commonEvent({id:1,name:"Saved",trigger:"${c.trigger}",${c.field}commands:[]});`,
    );
    const before = await observe(s.workspaceRoot);
    if (!c.ok) {
      for (const check of [true, false])
        await expect(api.compileWorkspace({ ...s, check })).rejects.toThrow(
          /(?:Unknown|Ambiguous) switch reference/u,
        );
      expect(await observe(s.workspaceRoot)).toStrictEqual(before);
    } else {
      await api.compileWorkspace({ ...s, check: true });
      expect(await observe(s.workspaceRoot)).toStrictEqual(before);
      await api.compileWorkspace({ ...s, check: false });
      expect(
        JSON.parse(
          await readFile(
            join(s.workspaceRoot, ".rpgmaker-event-dsl/generated-project-data/CommonEvents.json"),
            "utf8",
          ),
        ),
      ).toStrictEqual([
        null,
        {
          id: 1,
          name: "Saved",
          trigger: c.trigger === "none" ? 0 : c.trigger === "autorun" ? 1 : 2,
          switchId: c.field ? 2 : 1,
          list: [end],
        },
      ]);
    }
  });
});
it.each([
  { label: "none nondefault", trigger: 0, switchId: 2 },
  { label: "autorun default", trigger: 1, switchId: 1 },
  { label: "parallel default", trigger: 2, switchId: 1 },
])(
  "MV-S5-COMMON-007: rejects saved Switch references outside actual capacity ($label)",
  async (c) => {
    await commonEvidence("common-native-reference", async (s) => {
      const fixture = await createMinimalProject(s.workspaceRoot);
      fixture.projectFiles["System.json"].switches = [""];
      await writeFile(
        join(s.workspaceRoot, "Game/data/System.json"),
        JSON.stringify(fixture.projectFiles["System.json"]),
      );
      await writeFile(
        join(s.workspaceRoot, "Game/data/CommonEvents.json"),
        JSON.stringify([
          null,
          { id: 1, name: "Saved", trigger: c.trigger, switchId: c.switchId, list: [end] },
        ]),
      );
      await api.initWorkspace({ ...s, projectRoot: "./Game" });
      await api.cloneWorkspace(s);
      const before = await observe(s.workspaceRoot);
      await expect(api.decompileWorkspace(s)).rejects.toThrow(/commonEvent:1.*switchId/u);
      expect(await observe(s.workspaceRoot)).toStrictEqual(before);
    });
  },
);
it("MV-S5-COMMON-008: reports independent saved-field changes and safely removes entries without compacting IDs", async () => {
  await commonEvidence("common-diff-removal", async (s) => {
    const fixture = await createMinimalProject(s.workspaceRoot);
    fixture.projectFiles["System.json"].switches = ["", "", ""];
    await writeFile(
      join(s.workspaceRoot, "Game/data/System.json"),
      JSON.stringify(fixture.projectFiles["System.json"]),
    );
    const original = { id: 1, name: "Original", trigger: 0, switchId: 1, list: [end] };
    const neighbor = { id: 3, name: "Neighbor", trigger: 0, switchId: 1, list: [end] };
    await writeFile(
      join(s.workspaceRoot, "Game/data/CommonEvents.json"),
      JSON.stringify([null, original, null, neighbor, null, null]),
    );
    await api.initWorkspace({ ...s, projectRoot: "./Game" });
    await api.cloneWorkspace(s);
    await api.decompileWorkspace(s);
    const file = join(s.workspaceRoot, "src/decompiled/common-events.events.ts");
    const header = 'import {commonEvent,switchRef,wait} from "rpgmaker-event-dsl";\n';
    const neighborSource =
      'export const neighbor=commonEvent({id:3,name:"Neighbor",trigger:"none",commands:[]});';
    const cases = [
      {
        input: 'name:"Edited",trigger:"none",commands:[]',
        expected: { id: 1, name: "Edited", trigger: 0, switchId: 1, list: [end] },
      },
      {
        input: 'name:"Original",trigger:"none",switch:switchRef({id:2}),commands:[]',
        expected: { id: 1, name: "Original", trigger: 0, switchId: 2, list: [end] },
      },
      {
        input: 'name:"Original",trigger:"parallel",switch:switchRef({id:2}),commands:[]',
        expected: { id: 1, name: "Original", trigger: 2, switchId: 2, list: [end] },
      },
      {
        input: 'name:"Original",trigger:"none",commands:[wait({ frames: 3 })]',
        expected: {
          id: 1,
          name: "Original",
          trigger: 0,
          switchId: 1,
          list: [{ code: 230, indent: 0, parameters: [3] }, end],
        },
      },
    ];
    for (const c of cases) {
      await writeFile(
        file,
        header + `export const saved=commonEvent({id:1,${c.input}});\n` + neighborSource,
      );
      await api.compileWorkspace({ ...s, check: false });
      const diff = await api.diffWorkspace(s);
      expect(diff).toContain("CommonEvents.json");
      expect(diff).toContain("[changed] commonEventId 1");
      expect(diff).toContain("Destructive Changes: no");
      await api.pushWorkspace({ ...s, allowDestructive: false });
      for (const path of [
        "Game/data/CommonEvents.json",
        ".rpgmaker-event-dsl/project-data-snapshot/CommonEvents.json",
      ])
        expect(JSON.parse(await readFile(join(s.workspaceRoot, path), "utf8"))).toStrictEqual([
          null,
          c.expected,
          null,
          neighbor,
          null,
          null,
        ]);
    }
    await writeFile(file, header + `export const saved=commonEvent({id:1,${cases[3]!.input}});`);
    await api.compileWorkspace({ ...s, check: false });
    const diff = await api.diffWorkspace(s);
    expect(diff).toContain("[snapshot-only] commonEventId 3 (destructive)");
    expect(diff).toContain("Destructive Changes: yes");
    const before = await observe(s.workspaceRoot);
    await expect(api.pushWorkspace({ ...s, allowDestructive: false })).rejects.toThrow(
      /destructive/iu,
    );
    expect(await observe(s.workspaceRoot)).toStrictEqual(before);
    await api.pushWorkspace({ ...s, allowDestructive: true });
    for (const path of [
      "Game/data/CommonEvents.json",
      ".rpgmaker-event-dsl/project-data-snapshot/CommonEvents.json",
    ])
      expect(JSON.parse(await readFile(join(s.workspaceRoot, path), "utf8"))).toStrictEqual([
        null,
        cases[3]!.expected,
        null,
        null,
        null,
        null,
      ]);
  });
}, 30000);
it.each([
  { label: "Snapshot-only ID", call: "commonEventRef({id:2})", other: "", ok: false },
  {
    label: "Snapshot-only name",
    call: 'commonEventRef({name:"Old target"})',
    other: "",
    ok: false,
  },
  {
    label: "duplicate names",
    call: 'commonEventRef({name:"Same"})',
    other:
      'export const a=commonEvent({id:2,name:"Same",trigger:"none",commands:[]});export const b=commonEvent({id:3,name:"Same",trigger:"none",commands:[]});',
    ok: false,
  },
  {
    label: "duplicate empty names",
    call: 'commonEventRef({name:""})',
    other:
      'export const a=commonEvent({id:2,name:"",trigger:"none",commands:[]});export const b=commonEvent({id:3,name:"",trigger:"none",commands:[]});',
    ok: false,
  },
  {
    label: "unique empty name and mutual references",
    call: 'commonEventRef({name:""})',
    other:
      'export const target=commonEvent({id:2,name:"",trigger:"none",commands:[callCommonEvent({commonEvent:commonEventRef({id:1})})]});',
    ok: true,
  },
])(
  "MV-S5-COMMON-009: resolves E117 only against current complete declarations ($label)",
  async (c) => {
    await commonEvidence("common-staged-scope", async (s) => {
      await createMinimalProject(s.workspaceRoot);
      await writeFile(
        join(s.workspaceRoot, "Game/data/CommonEvents.json"),
        JSON.stringify([
          null,
          null,
          { id: 2, name: "Old target", trigger: 0, switchId: 1, list: [end] },
        ]),
      );
      await api.initWorkspace({ ...s, projectRoot: "./Game" });
      await api.cloneWorkspace(s);
      await mkdir(join(s.workspaceRoot, "src"), { recursive: true });
      await writeFile(
        join(s.workspaceRoot, "src/call.events.ts"),
        `import {commonEvent,callCommonEvent,commonEventRef} from "rpgmaker-event-dsl";
export const caller=commonEvent({id:1,name:"Caller",trigger:"none",commands:[callCommonEvent({commonEvent:${c.call}})]});${c.other}`,
      );
      const before = await observe(s.workspaceRoot);
      if (!c.ok) {
        for (const check of [true, false])
          await expect(api.compileWorkspace({ ...s, check })).rejects.toThrow(
            /MV-E117-REFERENCE.*commands\[0\]\.commonEvent/u,
          );
        expect(await observe(s.workspaceRoot)).toStrictEqual(before);
      } else {
        await api.compileWorkspace({ ...s, check: true });
        expect(await observe(s.workspaceRoot)).toStrictEqual(before);
        await api.compileWorkspace({ ...s, check: false });
        expect(
          JSON.parse(
            await readFile(
              join(s.workspaceRoot, ".rpgmaker-event-dsl/generated-project-data/CommonEvents.json"),
              "utf8",
            ),
          ),
        ).toStrictEqual([
          null,
          {
            id: 1,
            name: "Caller",
            trigger: 0,
            switchId: 1,
            list: [{ code: 117, indent: 0, parameters: [2] }, end],
          },
          {
            id: 2,
            name: "",
            trigger: 0,
            switchId: 1,
            list: [{ code: 117, indent: 0, parameters: [1] }, end],
          },
        ]);
      }
    });
  },
);
it("MV-S5-COMMON-013: preserves known calls and opaque raw payloads while the Script Gate remains effective", async () => {
  await commonEvidence("common-gate-and-raw", async (s) => {
    await createMinimalProject(s.workspaceRoot);
    const expected = [
      null,
      {
        id: 1,
        name: "Gate and raw\r",
        trigger: 0,
        switchId: 1,
        list: [
          { code: 117, indent: 0, parameters: [2] },
          {
            code: 355,
            indent: 0,
            parameters: ['throw new Error("event script must not execute during compilation");\r'],
          },
          { code: 655, indent: 0, parameters: [""] },
          { code: 999, indent: 0, parameters: [-0, { nested: [null, [], {}, " \r\n ", -0] }] },
          end,
        ],
      },
      { id: 2, name: "", trigger: 0, switchId: 1, list: [end] },
    ];
    const { writeStableJson } = await import("../src/project-data/writer.js");
    await writeFile(
      join(s.workspaceRoot, "Game/data/CommonEvents.json"),
      writeStableJson(expected),
    );
    await api.initWorkspace({ ...s, projectRoot: "./Game" });
    await api.cloneWorkspace(s);
    const decompile = await runCli(s, ["decompile"]);
    expect(decompile.exitCode).toBe(0);
    expect(decompile.stderr).toContain("MV-SCRIPT-GATE");
    expect(decompile.stderr).toContain("MV-UNKNOWN-COMMAND");
    const before = await observe(s.workspaceRoot);
    for (const check of [true, false])
      await expect(api.compileWorkspace({ ...s, check })).rejects.toThrow(/MV-SCRIPT-GATE/u);
    expect(await observe(s.workspaceRoot)).toStrictEqual(before);
    const configPath = join(s.workspaceRoot, "rpgmaker-event-dsl.config.json");
    await writeFile(
      configPath,
      JSON.stringify({ ...JSON.parse(await readFile(configPath, "utf8")), scriptEnabled: true }),
    );
    const beforeEnabledCheck = await observe(s.workspaceRoot);
    await api.compileWorkspace({ ...s, check: true });
    expect(await observe(s.workspaceRoot)).toStrictEqual(beforeEnabledCheck);
    await api.compileWorkspace({ ...s, check: false });
    expect(
      JSON.parse(
        await readFile(
          join(s.workspaceRoot, ".rpgmaker-event-dsl/generated-project-data/CommonEvents.json"),
          "utf8",
        ),
      ),
    ).toStrictEqual(expected);
    await api.pushWorkspace({ ...s, allowDestructive: false });
    expect(
      JSON.parse(await readFile(join(s.workspaceRoot, "Game/data/CommonEvents.json"), "utf8")),
    ).toStrictEqual(expected);
  });
}, 30000);
it.each([
  ["missing list", undefined],
  ["null list", null],
  ["empty unterminated", []],
  ["missing final marker", [{ code: 230, indent: 0, parameters: [1] }]],
  ["E117 missing parameter", [{ code: 117, indent: 0, parameters: [] }, end]],
  ["E117 None", [{ code: 117, indent: 0, parameters: [0] }, end]],
  ["E117 string", [{ code: 117, indent: 0, parameters: ["1"] }, end]],
  ["E117 fractional", [{ code: 117, indent: 0, parameters: [1.5] }, end]],
  ["E117 extra parameter", [{ code: 117, indent: 0, parameters: [1, 2] }, end]],
  ["command unknown envelope field", [{ code: 230, indent: 0, parameters: [1], extra: 7 }, end]],
] as Array<[string, unknown]>)(
  "MV-S5-COMMON-010: rejects malformed late Common command lists (%s)",
  async (_label, list) => {
    await commonEvidence("common-native-list", async (s) => {
      await createMinimalProject(s.workspaceRoot);
      await writeFile(
        join(s.workspaceRoot, "Game/data/CommonEvents.json"),
        JSON.stringify([
          null,
          { id: 1, name: "Early", trigger: 0, switchId: 1, list: [end] },
          { id: 2, name: "Late", trigger: 0, switchId: 1, ...(list === undefined ? {} : { list }) },
        ]),
      );
      await api.initWorkspace({ ...s, projectRoot: "./Game" });
      await api.cloneWorkspace(s);
      const before = await observe(s.workspaceRoot);
      await expect(api.decompileWorkspace(s)).rejects.toThrow(/commonEvent:2/u);
      expect(await observe(s.workspaceRoot)).toStrictEqual(before);
    });
  },
);
it("MV-S5-COMMON-011: existing handwritten declarations cannot repair an incomplete native candidate", async () => {
  await commonEvidence("common-candidate-scope", async (s) => {
    await createMinimalProject(s.workspaceRoot);
    await writeFile(
      join(s.workspaceRoot, "Game/data/CommonEvents.json"),
      JSON.stringify([
        null,
        {
          id: 1,
          name: "Caller",
          trigger: 0,
          switchId: 1,
          list: [{ code: 117, indent: 0, parameters: [2] }, end],
        },
        null,
      ]),
    );
    await api.initWorkspace({ ...s, projectRoot: "./Game" });
    await api.cloneWorkspace(s);
    await mkdir(join(s.workspaceRoot, "src"), { recursive: true });
    await writeFile(
      join(s.workspaceRoot, "src/hand.events.ts"),
      'import {commonEvent} from "rpgmaker-event-dsl";export const hand=commonEvent({id:2,name:"Hand target",trigger:"none",commands:[]});',
    );
    const before = await observe(s.workspaceRoot);
    await expect(api.decompileWorkspace(s)).rejects.toThrow(/Unknown commonEvent reference id: 2/u);
    expect(await observe(s.workspaceRoot)).toStrictEqual(before);
  });
});
it("MV-S5-COMMON-012: preserves a distant explicit identity and omitted none default without a picker cap", async () => {
  await commonEvidence("common-distant-id", async (s) => {
    const fixture = await createMinimalProject(s.workspaceRoot);
    fixture.projectFiles["System.json"].switches = [""];
    await writeFile(
      join(s.workspaceRoot, "Game/data/System.json"),
      JSON.stringify(fixture.projectFiles["System.json"]),
    );
    const expected: Array<unknown> = Array.from({ length: 1002 }, () => null);
    expected[1001] = { id: 1001, name: " \r\n ", trigger: 0, switchId: 1, list: [end] };
    await writeFile(join(s.workspaceRoot, "Game/data/CommonEvents.json"), JSON.stringify(expected));
    await api.initWorkspace({ ...s, projectRoot: "./Game" });
    await api.cloneWorkspace(s);
    await api.decompileWorkspace(s);
    const before = await observe(s.workspaceRoot);
    await api.compileWorkspace({ ...s, check: true });
    expect(await observe(s.workspaceRoot)).toStrictEqual(before);
    await api.compileWorkspace({ ...s, check: false });
    expect(
      JSON.parse(
        await readFile(
          join(s.workspaceRoot, ".rpgmaker-event-dsl/generated-project-data/CommonEvents.json"),
          "utf8",
        ),
      ),
    ).toStrictEqual(expected);
    await api.pushWorkspace({ ...s, allowDestructive: false });
    expect(
      JSON.parse(await readFile(join(s.workspaceRoot, "Game/data/CommonEvents.json"), "utf8")),
    ).toStrictEqual(expected);
  });
}, 30000);
it.each(invalidAuthoredContainers)(
  "MV-S5-COMMON-004: rejects malformed formal Common containers without publishing output (%s)",
  async (_label, input) => {
    await commonEvidence("common-invalid-authored", async (s) => {
      await createMinimalProject(s.workspaceRoot);
      await api.initWorkspace({ ...s, projectRoot: "./Game" });
      await api.cloneWorkspace(s);
      await mkdir(join(s.workspaceRoot, "src"), { recursive: true });
      await writeFile(
        join(s.workspaceRoot, "src/invalid.events.ts"),
        `import {commonEvent} from "rpgmaker-event-dsl";\nexport const event=commonEvent(${JSON.stringify(input)} as any);\n`,
      );
      const before = await observe(s.workspaceRoot);
      for (const check of [true, false])
        await expect(api.compileWorkspace({ ...s, check })).rejects.toThrow(/MV-COMMON-EVENT/u);
      expect(await observe(s.workspaceRoot)).toStrictEqual(before);
    });
  },
);
it("MV-S5-COMMON-004: rejects accessor fields without invoking them for diagnostics", async () => {
  await commonEvidence("common-invalid-authored", async (s) => {
    await createMinimalProject(s.workspaceRoot);
    await api.initWorkspace({ ...s, projectRoot: "./Game" });
    await api.cloneWorkspace(s);
    const before = await observe(s.workspaceRoot);
    let reads = 0;
    const input = {
      get id(): number {
        reads++;
        throw Error("getter executed");
      },
      name: "Accessor",
      trigger: "none" as const,
      commands: [],
    };
    expect(() => commonEvent(input)).toThrow(/MV-COMMON-EVENT/u);
    expect(reads).toBe(0);
    expect(await observe(s.workspaceRoot)).toStrictEqual(before);
  });
});
it.each(invalidNativeContainers)(
  "MV-S5-COMMON-003: rejects malformed owned Common metadata before any source publication (%s)",
  async (_label, bad) => {
    await commonEvidence("common-invalid-native", async (s) => {
      await createMinimalProject(s.workspaceRoot);
      await writeFile(
        join(s.workspaceRoot, "Game/data/CommonEvents.json"),
        JSON.stringify([
          null,
          { id: 1, name: "Valid early", trigger: 0, switchId: 1, list: [end] },
          bad,
        ]),
      );
      await api.initWorkspace({ ...s, projectRoot: "./Game" });
      await api.cloneWorkspace(s);
      const before = await observe(s.workspaceRoot);
      await expect(api.decompileWorkspace(s)).rejects.toThrow(/MV-COMMON-EVENT/u);
      expect(await observe(s.workspaceRoot)).toStrictEqual(before);
    });
  },
);

it("MV-S5-COMMON-002: preserves every trigger and independent saved switch through editable source and safe Push", async () => {
  await commonEvidence("common-complete-roundtrip", async (s) => {
    const fixture = await createMinimalProject(s.workspaceRoot);
    const expected = [
      null,
      {
        id: 1,
        name: "Saved\r\n ",
        trigger: 0,
        switchId: 3,
        list: [{ code: 117, indent: 0, parameters: [4] }, end],
      },
      { id: 2, name: "Autorun", trigger: 1, switchId: 2, list: [end] },
      {
        id: 3,
        name: "Parallel",
        trigger: 2,
        switchId: 2,
        list: [{ code: 230, indent: 0, parameters: [1] }, end],
      },
      { id: 4, name: "", trigger: 0, switchId: 1, list: [end] },
      null,
      { id: 6, name: "Duplicate", trigger: 0, switchId: 2, list: [end] },
      null,
      { id: 8, name: "Duplicate", trigger: 0, switchId: 1, list: [end] },
      null,
    ];
    fixture.projectFiles["System.json"].switches = ["", "", "Active", ""];
    await writeFile(
      join(s.workspaceRoot, "Game/data/System.json"),
      JSON.stringify(fixture.projectFiles["System.json"]),
    );
    await writeFile(join(s.workspaceRoot, "Game/data/CommonEvents.json"), JSON.stringify(expected));
    await api.initWorkspace({ ...s, projectRoot: "./Game" });
    await api.cloneWorkspace(s);
    await api.decompileWorkspace(s);
    const beforeCheck = await observe(s.workspaceRoot);
    await api.compileWorkspace({ ...s, check: true });
    expect(await observe(s.workspaceRoot)).toStrictEqual(beforeCheck);
    await api.compileWorkspace({ ...s, check: false });
    const generated = join(
      s.workspaceRoot,
      ".rpgmaker-event-dsl/generated-project-data/CommonEvents.json",
    );
    expect(JSON.parse(await readFile(generated, "utf8"))).toStrictEqual(expected);
    await api.pushWorkspace({ ...s, allowDestructive: false });
    const source = join(s.workspaceRoot, "src/decompiled/common-events.events.ts");
    const original = await readFile(source, "utf8");
    const edited = original.replace(JSON.stringify("Saved\r\n "), JSON.stringify("Edited\r\n "));
    expect(edited).not.toBe(original);
    await writeFile(source, edited);
    await api.compileWorkspace({ ...s, check: false });
    expect(await api.diffWorkspace(s)).toContain("CommonEvents.json");
    await api.pushWorkspace({ ...s, allowDestructive: false });
    const changed = structuredClone(expected);
    changed[1]!.name = "Edited\r\n ";
    for (const path of [
      "Game/data/CommonEvents.json",
      ".rpgmaker-event-dsl/project-data-snapshot/CommonEvents.json",
    ])
      expect(JSON.parse(await readFile(join(s.workspaceRoot, path), "utf8"))).toStrictEqual(
        changed,
      );
    await writeFile(source, original);
    await api.compileWorkspace({ ...s, check: false });
    await api.pushWorkspace({ ...s, allowDestructive: false });
    expect(
      JSON.parse(await readFile(join(s.workspaceRoot, "Game/data/CommonEvents.json"), "utf8")),
    ).toStrictEqual(expected);
  });
}, 30000);

it("MV-S5-COMMON-001: evaluates named-object Common calls against complete current declarations", async () => {
  await commonEvidence("common-named-call", async (s) => {
    await createMinimalProject(s.workspaceRoot);
    await api.initWorkspace({ ...s, projectRoot: "./Game" });
    await api.cloneWorkspace(s);
    await mkdir(join(s.workspaceRoot, "src"), { recursive: true });
    await writeFile(
      join(s.workspaceRoot, "src/common.events.ts"),
      `import { commonEvent, callCommonEvent, commonEventRef } from "rpgmaker-event-dsl";
export const caller = commonEvent({id:1,name:"Caller",trigger:"none",commands:[
  callCommonEvent({commonEvent:commonEventRef({id:2})}),
  callCommonEvent({commonEvent:commonEventRef({name:"Caller"})}),
]});
export const laterEmptyName = commonEvent({id:2,name:"",trigger:"none",commands:[]});
`,
    );
    await api.compileWorkspace({ ...s, check: true });
    await api.compileWorkspace({ ...s, check: false });
    expect(
      JSON.parse(
        await readFile(
          join(s.workspaceRoot, ".rpgmaker-event-dsl/generated-project-data/CommonEvents.json"),
          "utf8",
        ),
      ),
    ).toStrictEqual([
      null,
      {
        id: 1,
        name: "Caller",
        trigger: 0,
        switchId: 1,
        list: [
          { code: 117, indent: 0, parameters: [2] },
          { code: 117, indent: 0, parameters: [1] },
          end,
        ],
      },
      { id: 2, name: "", trigger: 0, switchId: 1, list: [end] },
    ]);
  });
}, 30000);
