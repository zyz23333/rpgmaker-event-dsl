import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { expect, it, vi } from "vitest";
import { blankPage } from "./support/map-event-fixtures.js";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { createMinimalProject, withWindowsSandbox } from "./support/windows-sandbox.js";

const api: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);

// Independent MV saved page, not produced by the compiler under test.
const battleConditions = {
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
};
const battlePage = {
  conditions: battleConditions,
  span: 0,
  list: [{ code: 0, indent: 0, parameters: [] }],
};

async function json(path: string) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function tree(root: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      for (const [name, bytes] of Object.entries(await tree(path)))
        result[`${entry.name}/${name}`] = bytes;
    } else result[entry.name] = (await readFile(path)).toString("hex");
  }
  return result;
}

async function observe(workspaceRoot: string) {
  return {
    source: await tree(join(workspaceRoot, "src")),
    project: await tree(join(workspaceRoot, "Game")),
    state: await tree(join(workspaceRoot, ".rpgmaker-event-dsl")),
    config: await readFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8"),
  };
}

async function prepare(workspaceRoot: string) {
  await createMinimalProject(workspaceRoot);
  const project = join(workspaceRoot, "Game/data");
  await writeFile(join(project, "MapInfos.json"), '[null,{"id":1,"name":"Shared map"}]');
  await writeFile(
    join(project, "Map001.json"),
    JSON.stringify({ width: 2, height: 2, tilesetId: 1, events: [null] }),
  );
  await writeFile(join(project, "Tilesets.json"), '[null,{"id":1,"name":"Tiles"}]');
  await writeFile(join(project, "Enemies.json"), '[null,{"id":1,"name":"Bat"}]');
  await writeFile(
    join(project, "Troops.json"),
    JSON.stringify([
      null,
      {
        id: 1,
        name: "Shared troop",
        members: [{ enemyId: 1, x: 0, y: 0, hidden: true }],
        pages: [battlePage],
      },
    ]),
  );
  await api.initWorkspace({ workspaceRoot, projectRoot: "./Game" });
  await api.cloneWorkspace({ workspaceRoot });
  await api.decompileWorkspace({ workspaceRoot });
  await writeFile(join(workspaceRoot, "src/decompiled/troop-events.events.ts"), "export {};\n");
  const shared = join(workspaceRoot, "src/shared");
  await mkdir(shared);
  return {
    shared,
    entry: join(workspaceRoot, "src/shared-containers.events.ts"),
    generated: join(workspaceRoot, ".rpgmaker-event-dsl/generated-project-data"),
    project,
  };
}

it("preserves shared command values and independent function calls in Map, Common and Troop Events through Check, Compile, Diff and Push", async () => {
  await withWindowsSandbox("shared-containers", async ({ workspaceRoot }) => {
    const paths = await prepare(workspaceRoot);
    await writeFile(
      join(paths.shared, "rewards.ts"),
      `import { comment, changeGold, callCommonEvent, commonEventRef } from "rpgmaker-event-dsl";
export const note = comment({ lines: ["Shared", "continuation"] });
export const fragment = [note, callCommonEvent({ commonEvent: commonEventRef({ id: 1 }) })];
export function reward(options: { gold: number }) {
  return [...fragment, changeGold({ operation: "gain", value: { kind: "constant", value: options.gold } })];
}
`,
    );
    await writeFile(
      paths.entry,
      `import { mapEvent, page, commonEvent, troopEvent, battlePage, comment } from "rpgmaker-event-dsl";
import { note, fragment, reward } from "./shared/rewards.js";
export const map = mapEvent({ mapId: 1, id: 1, name: "Map reward", x: 0, y: 0, pages: [page({ commands: [note, ...reward({ gold: 25 }), comment({ lines: ["Map only"] }), ...fragment] })] });
export const common = commonEvent({ id: 2, name: "Common reward", trigger: "none", commands: [...reward({ gold: 90 }), note] });
export const troop = troopEvent({ troopId: 1, pages: [battlePage({ commands: [...reward({ gold: 7 }), ...reward({ gold: 12 })] })] });
`,
    );
    const beforeCheck = await observe(workspaceRoot);
    await api.compileWorkspace({ workspaceRoot, check: true });
    expect(await observe(workspaceRoot)).toEqual(beforeCheck);
    expect(await api.isGeneratedProjectDataFresh({ workspaceRoot })).toBe(false);
    await api.compileWorkspace({ workspaceRoot, check: false });
    const map = await json(join(paths.generated, "Map001.json"));
    const common = await json(join(paths.generated, "CommonEvents.json"));
    const troops = await json(join(paths.generated, "Troops.json"));
    expect(map.events[1]).toEqual({
      id: 1,
      name: "Map reward",
      note: "",
      x: 0,
      y: 0,
      pages: [
        {
          ...blankPage,
          list: [
            { code: 108, indent: 0, parameters: ["Shared"] },
            { code: 408, indent: 0, parameters: ["continuation"] },
            { code: 108, indent: 0, parameters: ["Shared"] },
            { code: 408, indent: 0, parameters: ["continuation"] },
            { code: 117, indent: 0, parameters: [1] },
            { code: 125, indent: 0, parameters: [0, 0, 25] },
            { code: 108, indent: 0, parameters: ["Map only"] },
            { code: 108, indent: 0, parameters: ["Shared"] },
            { code: 408, indent: 0, parameters: ["continuation"] },
            { code: 117, indent: 0, parameters: [1] },
            { code: 0, indent: 0, parameters: [] },
          ],
        },
      ],
    });
    expect(common[2]).toEqual({
      id: 2,
      name: "Common reward",
      trigger: 0,
      switchId: 1,
      list: [
        { code: 108, indent: 0, parameters: ["Shared"] },
        { code: 408, indent: 0, parameters: ["continuation"] },
        { code: 117, indent: 0, parameters: [1] },
        { code: 125, indent: 0, parameters: [0, 0, 90] },
        { code: 108, indent: 0, parameters: ["Shared"] },
        { code: 408, indent: 0, parameters: ["continuation"] },
        { code: 0, indent: 0, parameters: [] },
      ],
    });
    expect(troops).toEqual([
      null,
      {
        id: 1,
        name: "Shared troop",
        members: [{ enemyId: 1, x: 0, y: 0, hidden: true }],
        pages: [
          {
            ...battlePage,
            list: [
              { code: 108, indent: 0, parameters: ["Shared"] },
              { code: 408, indent: 0, parameters: ["continuation"] },
              { code: 117, indent: 0, parameters: [1] },
              { code: 125, indent: 0, parameters: [0, 0, 7] },
              { code: 108, indent: 0, parameters: ["Shared"] },
              { code: 408, indent: 0, parameters: ["continuation"] },
              { code: 117, indent: 0, parameters: [1] },
              { code: 125, indent: 0, parameters: [0, 0, 12] },
              { code: 0, indent: 0, parameters: [] },
            ],
          },
        ],
      },
    ]);
    const diff = await api.diffWorkspace({ workspaceRoot });
    for (const file of ["Map001.json", "CommonEvents.json", "Troops.json"])
      expect(diff).toContain(file);
    await api.pushWorkspace({ workspaceRoot, allowDestructive: false });
    for (const file of ["Map001.json", "CommonEvents.json", "Troops.json"]) {
      expect(await json(join(paths.project, file))).toEqual(
        await json(join(paths.generated, file)),
      );
    }
    expect(await api.diffWorkspace({ workspaceRoot, short: true })).toContain("No changes.");
  });
}, 30_000);

it.each([
  { name: "formal Script Input", commands: 'script({ code: "var shared = 1;\\nshared += 2;" })' },
  {
    name: "recognized raw script records",
    commands:
      'rawDslCommand({ code: 355, parameters: ["var shared = 1;"] }), rawDslCommand({ code: 655, parameters: ["shared += 2;"] })',
  },
])(
  "enforces the Script Command Gate for $name returned by an author function",
  async ({ commands }) => {
    await withWindowsSandbox("shared-script-gate", async ({ workspaceRoot }) => {
      const paths = await prepare(workspaceRoot);
      await api.compileWorkspace({ workspaceRoot, check: false });
      await writeFile(
        join(paths.shared, "scripts.ts"),
        `import { script, rawDslCommand } from "rpgmaker-event-dsl";
export function commands() { return [${commands}]; }
`,
      );
      await writeFile(
        paths.entry,
        `import { commonEvent, conditional } from "rpgmaker-event-dsl";
import { commands } from "./shared/scripts.js";
export const event = commonEvent({ id: 2, name: "Script caller", trigger: "none", commands: [conditional({ condition: { kind: "button", button: "ok" }, then: { commands: commands() } })] });
`,
      );
      const beforeFailure = await observe(workspaceRoot);
      for (const check of [true, false]) {
        await expect(api.compileWorkspace({ workspaceRoot, check })).rejects.toThrow(
          /MV-SCRIPT-GATE|explicit config enablement/u,
        );
        expect(await observe(workspaceRoot)).toEqual(beforeFailure);
      }
      const configPath = join(workspaceRoot, "rpgmaker-event-dsl.config.json");
      const config = await json(configPath);
      await writeFile(configPath, JSON.stringify({ ...config, scriptEnabled: true }));
      const beforeCheck = await observe(workspaceRoot);
      await api.compileWorkspace({ workspaceRoot, check: true });
      expect(await observe(workspaceRoot)).toEqual(beforeCheck);
      expect(await api.isGeneratedProjectDataFresh({ workspaceRoot })).toBe(false);
      await api.compileWorkspace({ workspaceRoot, check: false });
      expect((await json(join(paths.generated, "CommonEvents.json")))[2].list).toEqual([
        { code: 111, indent: 0, parameters: [11, "ok"] },
        { code: 355, indent: 1, parameters: ["var shared = 1;"] },
        { code: 655, indent: 1, parameters: ["shared += 2;"] },
        { code: 0, indent: 1, parameters: [] },
        { code: 412, indent: 0, parameters: [] },
        { code: 0, indent: 0, parameters: [] },
      ]);
    });
  },
  30_000,
);

it("rejects unresolved Common Event references returned inside a Child Command Body without publishing", async () => {
  await withWindowsSandbox("shared-reference", async ({ workspaceRoot }) => {
    const paths = await prepare(workspaceRoot);
    await writeFile(
      join(paths.shared, "calls.ts"),
      `import { callCommonEvent, commonEventRef } from "rpgmaker-event-dsl";
export function calls(options: { id: number }) { return [callCommonEvent({ commonEvent: commonEventRef({ id: options.id }) })]; }
`,
    );
    const source = `import { commonEvent, loop, breakLoop } from "rpgmaker-event-dsl";
import { calls } from "./shared/calls.js";
export const event = commonEvent({ id: 2, name: "Calls", trigger: "none", commands: [loop({ body: { commands: [...calls({ id: 1 }), breakLoop()] } })] });
`;
    await writeFile(paths.entry, source);
    await api.compileWorkspace({ workspaceRoot, check: false });
    expect((await json(join(paths.generated, "CommonEvents.json")))[2].list).toEqual([
      { code: 112, indent: 0, parameters: [] },
      { code: 117, indent: 1, parameters: [1] },
      { code: 113, indent: 1, parameters: [] },
      { code: 0, indent: 1, parameters: [] },
      { code: 413, indent: 0, parameters: [] },
      { code: 0, indent: 0, parameters: [] },
    ]);
    await writeFile(paths.entry, source.replace("calls({ id: 1 })", "calls({ id: 99 })"));
    const beforeFailure = await observe(workspaceRoot);
    for (const check of [true, false]) {
      await expect(api.compileWorkspace({ workspaceRoot, check })).rejects.toThrow(
        /Unknown commonEvent reference id: 99/u,
      );
      expect(await observe(workspaceRoot)).toEqual(beforeFailure);
    }
    expect(await api.isGeneratedProjectDataFresh({ workspaceRoot })).toBe(false);
  });
}, 30_000);

it("retains each caller's Map, Common and Troop context when the same function returns shared commands", async () => {
  await withWindowsSandbox("shared-context", async ({ workspaceRoot }) => {
    const paths = await prepare(workspaceRoot);
    await writeFile(
      join(paths.shared, "context.ts"),
      `import { conditional, enemyAppear } from "rpgmaker-event-dsl";
const commands = [
  conditional({ condition: { kind: "selfSwitch", selfSwitch: "A", value: false }, then: { commands: [] } }),
  enemyAppear({ target: { kind: "runtimeSelector", scope: "enemy", target: "enemy", index: 0 } })
];
export function context() { return commands; }
`,
    );
    await writeFile(
      paths.entry,
      `import { mapEvent, page, commonEvent, troopEvent, battlePage } from "rpgmaker-event-dsl";
import { context } from "./shared/context.js";
export const map = mapEvent({ mapId: 1, id: 1, name: "Map context", x: 0, y: 0, pages: [page({ commands: context() })] });
export const common = commonEvent({ id: 2, name: "Common context", trigger: "none", commands: context() });
export const troop = troopEvent({ troopId: 1, pages: [battlePage({ commands: context() })] });
`,
    );
    const beforeCheck = await observe(workspaceRoot);
    const stderr = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await api.compileWorkspace({ workspaceRoot, check: true });
      const warnings = stderr.mock.calls
        .map((args) => args.join(" "))
        .filter((message) => /MV-E111-SELF-SWITCH-CONTEXT|MV-E335-ENEMY-CONTEXT/u.test(message));
      expect(warnings).toHaveLength(4);
      expect(warnings).toEqual(
        expect.arrayContaining([
          expect.stringMatching(
            /compile warning map:1\/event:1: MV-E335-ENEMY-CONTEXT at pages\[0\]\.list\[3\]\.parameters\[0\].*no declared current Troop/u,
          ),
          expect.stringMatching(
            /compile warning commonEvent:2: MV-E111-SELF-SWITCH-CONTEXT at list\[0\]\.parameters\[1\].*caller context is unknown/u,
          ),
          expect.stringMatching(
            /compile warning commonEvent:2: MV-E335-ENEMY-CONTEXT at list\[3\]\.parameters\[0\].*caller.*Troop is unknown/u,
          ),
          expect.stringMatching(
            /compile warning troop:1: MV-E111-SELF-SWITCH-CONTEXT at pages\[0\]\.list\[0\]\.parameters\[1\].*no positive map event ID.*evaluates false/u,
          ),
        ]),
      );
      expect(await observe(workspaceRoot)).toEqual(beforeCheck);
      await api.compileWorkspace({ workspaceRoot, check: false });
    } finally {
      stderr.mockRestore();
    }
    const expected = [
      { code: 111, indent: 0, parameters: [2, "A", 1] },
      { code: 0, indent: 1, parameters: [] },
      { code: 412, indent: 0, parameters: [] },
      { code: 335, indent: 0, parameters: [0] },
      { code: 0, indent: 0, parameters: [] },
    ];
    expect((await json(join(paths.generated, "Map001.json"))).events[1].pages[0].list).toEqual(
      expected,
    );
    expect((await json(join(paths.generated, "CommonEvents.json")))[2].list).toEqual(expected);
    expect((await json(join(paths.generated, "Troops.json")))[1].pages[0].list).toEqual(expected);
  });
}, 30_000);

it("preserves shared Child Command Body order, depth and explicit Body End Markers alongside an inline equivalent", async () => {
  await withWindowsSandbox("shared-child-bodies", async ({ workspaceRoot }) => {
    const paths = await prepare(workspaceRoot);
    await writeFile(
      join(paths.shared, "bodies.ts"),
      `import { comment, wait } from "rpgmaker-event-dsl";
export const note = comment({ lines: ["Shared"] });
export const fragment = [note, wait({ frames: 1 })];
export function body(options: { frames: number; text: string }) {
  return [note, wait({ frames: options.frames }), comment({ lines: [options.text] })];
}
`,
    );
    await writeFile(
      paths.entry,
      `import { commonEvent, comment, wait, conditional, showChoices, loop, breakLoop } from "rpgmaker-event-dsl";
import { note, fragment, body } from "./shared/bodies.js";
export const shared = commonEvent({ id: 2, name: "Shared bodies", trigger: "none", commands: [
  note,
  conditional({ condition: { kind: "button", button: "ok" }, then: {
    endMarker: "absent", commands: [...fragment, showChoices({
      choices: [{ text: "A", endMarker: "absent", commands: body({ frames: 3, text: "Choice only" }) }, { text: "B", commands: [] }],
      cancel: { kind: "branch", commands: [note] }
    })]
  }, else: { commands: [loop({ body: { endMarker: "absent", commands: [...body({ frames: 2, text: "Loop only" }), breakLoop()] } })] } }),
  ...fragment
] });
export const inline = commonEvent({ id: 3, name: "Inline bodies", trigger: "none", commands: [
  comment({ lines: ["Shared"] }),
  conditional({ condition: { kind: "button", button: "ok" }, then: {
    endMarker: "absent", commands: [comment({ lines: ["Shared"] }), wait({ frames: 1 }), showChoices({
      choices: [{ text: "A", endMarker: "absent", commands: [comment({ lines: ["Shared"] }), wait({ frames: 3 }), comment({ lines: ["Choice only"] })] }, { text: "B", commands: [] }],
      cancel: { kind: "branch", commands: [comment({ lines: ["Shared"] })] }
    })]
  }, else: { commands: [loop({ body: { endMarker: "absent", commands: [comment({ lines: ["Shared"] }), wait({ frames: 2 }), comment({ lines: ["Loop only"] }), breakLoop()] } })] } }),
  comment({ lines: ["Shared"] }), wait({ frames: 1 })
] });
`,
    );
    const beforeCheck = await observe(workspaceRoot);
    await api.compileWorkspace({ workspaceRoot, check: true });
    expect(await observe(workspaceRoot)).toEqual(beforeCheck);
    await api.compileWorkspace({ workspaceRoot, check: false });
    const events = await json(join(paths.generated, "CommonEvents.json"));
    // Worked MV record sequence: present markers remain at their own body's depth;
    // the nonempty then, first choice and loop bodies explicitly omit theirs.
    expect(events[2].list).toEqual([
      { code: 108, indent: 0, parameters: ["Shared"] },
      { code: 111, indent: 0, parameters: [11, "ok"] },
      { code: 108, indent: 1, parameters: ["Shared"] },
      { code: 230, indent: 1, parameters: [1] },
      { code: 102, indent: 1, parameters: [["A", "B"], -2, 0, 2, 0] },
      { code: 402, indent: 1, parameters: [0, "A"] },
      { code: 108, indent: 2, parameters: ["Shared"] },
      { code: 230, indent: 2, parameters: [3] },
      { code: 108, indent: 2, parameters: ["Choice only"] },
      { code: 402, indent: 1, parameters: [1, "B"] },
      { code: 0, indent: 2, parameters: [] },
      { code: 403, indent: 1, parameters: [6, null] },
      { code: 108, indent: 2, parameters: ["Shared"] },
      { code: 0, indent: 2, parameters: [] },
      { code: 404, indent: 1, parameters: [] },
      { code: 411, indent: 0, parameters: [] },
      { code: 112, indent: 1, parameters: [] },
      { code: 108, indent: 2, parameters: ["Shared"] },
      { code: 230, indent: 2, parameters: [2] },
      { code: 108, indent: 2, parameters: ["Loop only"] },
      { code: 113, indent: 2, parameters: [] },
      { code: 413, indent: 1, parameters: [] },
      { code: 0, indent: 1, parameters: [] },
      { code: 412, indent: 0, parameters: [] },
      { code: 108, indent: 0, parameters: ["Shared"] },
      { code: 230, indent: 0, parameters: [1] },
      { code: 0, indent: 0, parameters: [] },
    ]);
    expect(events[3].list).toEqual(events[2].list);
    await api.diffWorkspace({ workspaceRoot });
    await api.pushWorkspace({ workspaceRoot, allowDestructive: false });
    expect(await json(join(paths.project, "CommonEvents.json"))).toEqual(events);
  });
}, 30_000);
