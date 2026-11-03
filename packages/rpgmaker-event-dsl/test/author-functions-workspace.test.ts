import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { expect, it } from "vitest";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { createMinimalProject, withWindowsSandbox } from "./support/windows-sandbox.js";

const api: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);

it("resolves lexical undefined parameters and const bindings before the global value", async () => {
  await withWindowsSandbox("author-functions-undefined", async ({ workspaceRoot }) => {
    const paths = await prepare(workspaceRoot);
    await writeFile(
      paths.entry,
      `import { commonEvent, comment } from "rpgmaker-event-dsl";
function parameter(undefined: { text: string }) { return undefined.text; }
const local = () => { const undefined = { text: "Local" }; return undefined.text; };
const command = () => { const undefined = comment; return undefined({ lines: [local()] }); };
const settings = () => ({ trigger: "none", switch: undefined } as const);
export const event = commonEvent({ ...settings(), id: 1, name: parameter({ text: "Parameter" }), commands: [command()] });
`,
    );
    await api.compileWorkspace({ workspaceRoot, check: false });
    const events = JSON.parse(await readFile(paths.generated, "utf8"));
    expect(events[1]).toEqual({
      id: 1,
      name: "Parameter",
      trigger: 0,
      switchId: 1,
      list: [
        { code: 108, indent: 0, parameters: ["Local"] },
        { code: 0, indent: 0, parameters: [] },
      ],
    });
  });
}, 30_000);

async function prepare(workspaceRoot: string) {
  await createMinimalProject(workspaceRoot);
  await api.initWorkspace({ workspaceRoot, projectRoot: "./Game" });
  await api.cloneWorkspace({ workspaceRoot });
  await api.decompileWorkspace({ workspaceRoot });
  const shared = join(workspaceRoot, "src/shared");
  await mkdir(shared);
  return {
    shared,
    entry: join(workspaceRoot, "src/decompiled/common-events.events.ts"),
    generated: join(workspaceRoot, ".rpgmaker-event-dsl/generated-project-data/CommonEvents.json"),
    manifest: join(workspaceRoot, ".rpgmaker-event-dsl/sync-manifest.json"),
    project: join(workspaceRoot, "Game/data/CommonEvents.json"),
  };
}

it("compiles independent reward parameters through local and imported author functions", async () => {
  await withWindowsSandbox("author-functions-rewards", async ({ workspaceRoot }) => {
    const paths = await prepare(workspaceRoot);
    await writeFile(
      join(paths.shared, "rewards.ts"),
      `import { changeGold, comment, type DslCommand } from "rpgmaker-event-dsl";
export function reward(options: { gold: number; text: string }): DslCommand[] {
  const amount = { kind: "constant", value: options.gold } as const;
  return [comment({ lines: [options.text] }), changeGold({ operation: "gain", value: amount })];
}
export const settings = (() => ({ trigger: "none" } as const)) satisfies (() => { trigger: "none" });
`,
    );
    await writeFile(
      paths.entry,
      `const reward = (options: { gold: number; text: string }) => [...sharedReward(options), comment({ lines: ["Opened"] })];
export const first = commonEvent({ ...settings(), id: 1, name: "First chest", commands: reward({ gold: 25, text: "Copper chest" }) });
export const second = commonEvent({ ...settings(), id: 2, name: "Second chest", commands: reward({ gold: 90, text: "Silver chest" }) });
import { commonEvent, comment } from "rpgmaker-event-dsl";
import { reward as sharedReward, settings } from "../shared/rewards.js";
`,
    );
    const manifest = await readFile(paths.manifest, "utf8");
    await api.compileWorkspace({ workspaceRoot, check: true });
    expect(await readFile(paths.manifest, "utf8")).toBe(manifest);
    expect(await api.isGeneratedProjectDataFresh({ workspaceRoot })).toBe(false);
    await api.compileWorkspace({ workspaceRoot, check: false });
    const events = JSON.parse(await readFile(paths.generated, "utf8"));
    expect(events).toHaveLength(3);
    expect(events[1].list).toEqual([
      { code: 108, indent: 0, parameters: ["Copper chest"] },
      { code: 125, indent: 0, parameters: [0, 0, 25] },
      { code: 108, indent: 0, parameters: ["Opened"] },
      { code: 0, indent: 0, parameters: [] },
    ]);
    expect(events[2].list).toEqual([
      { code: 108, indent: 0, parameters: ["Silver chest"] },
      { code: 125, indent: 0, parameters: [0, 0, 90] },
      { code: 108, indent: 0, parameters: ["Opened"] },
      { code: 0, indent: 0, parameters: [] },
    ]);
    await api.diffWorkspace({ workspaceRoot });
    await api.pushWorkspace({ workspaceRoot, allowDestructive: false });
    expect(JSON.parse(await readFile(paths.project, "utf8"))).toEqual(events);
    const rewardSource = join(paths.shared, "rewards.ts");
    await writeFile(
      rewardSource,
      (await readFile(rewardSource, "utf8")).replace(
        "return [comment({ lines: [options.text] })",
        'return [comment({ lines: ["Revised reward"] }), comment({ lines: [options.text] })',
      ),
    );
    const beforeCheck = await Promise.all(
      [paths.generated, paths.manifest, paths.project, paths.entry, rewardSource].map((file) =>
        readFile(file, "utf8"),
      ),
    );
    expect(await api.isGeneratedProjectDataFresh({ workspaceRoot })).toBe(false);
    await expect(api.diffWorkspace({ workspaceRoot })).rejects.toThrow(/stale/iu);
    await expect(api.pushWorkspace({ workspaceRoot, allowDestructive: false })).rejects.toThrow(
      /stale/iu,
    );
    await api.compileWorkspace({ workspaceRoot, check: true });
    expect(
      await Promise.all(
        [paths.generated, paths.manifest, paths.project, paths.entry, rewardSource].map((file) =>
          readFile(file, "utf8"),
        ),
      ),
    ).toEqual(beforeCheck);
    expect(await api.isGeneratedProjectDataFresh({ workspaceRoot })).toBe(false);
    await api.compileWorkspace({ workspaceRoot, check: false });
    const updated = JSON.parse(await readFile(paths.generated, "utf8"));
    for (const id of [1, 2])
      expect(updated[id].list).toEqual([
        { code: 108, indent: 0, parameters: ["Revised reward"] },
        ...events[id].list,
      ]);
    await api.diffWorkspace({ workspaceRoot });
    await api.pushWorkspace({ workspaceRoot, allowDestructive: false });
    expect(JSON.parse(await readFile(paths.project, "utf8"))).toEqual(updated);
  });
}, 30_000);

it("compiles the documented parameterized reward example through the Workspace API", async () => {
  await withWindowsSandbox("author-functions-readme", async ({ workspaceRoot }) => {
    const paths = await prepare(workspaceRoot);
    const readme = await readFile(new URL("../../../README.md", import.meta.url), "utf8");
    const module = readme.match(/```ts\r?\n\/\/ src\/shared\/rewards\.ts\r?\n([\s\S]*?)```/u)?.[1];
    const entry = readme.match(/```ts\r?\n\/\/ src\/rewards\.events\.ts\r?\n([\s\S]*?)```/u)?.[1];
    expect(module).toBeDefined();
    expect(entry).toBeDefined();
    await writeFile(join(paths.shared, "rewards.ts"), module!);
    await writeFile(paths.entry, "export {};\n");
    await writeFile(join(workspaceRoot, "src/rewards.events.ts"), entry!);
    await api.compileWorkspace({ workspaceRoot, check: false });
    const events = JSON.parse(await readFile(paths.generated, "utf8"));
    expect(events[1].list).toEqual([
      { code: 108, indent: 0, parameters: ["Copper chest"] },
      { code: 125, indent: 0, parameters: [0, 0, 25] },
      { code: 108, indent: 0, parameters: ["Opened"] },
      { code: 0, indent: 0, parameters: [] },
    ]);
    expect(events[2].list).toEqual([
      { code: 108, indent: 0, parameters: ["Silver chest"] },
      { code: 125, indent: 0, parameters: [0, 0, 90] },
      { code: 108, indent: 0, parameters: ["Opened"] },
      { code: 0, indent: 0, parameters: [] },
    ]);
  });
}, 30_000);

it("compiles the standalone Agent Event Authoring Skill example", async () => {
  await withWindowsSandbox("author-functions-skill", async ({ workspaceRoot }) => {
    const paths = await prepare(workspaceRoot);
    const guide = await readFile(
      new URL(
        "../../../skills/rpgmaker-event-authoring/references/shared-authoring.md",
        import.meta.url,
      ),
      "utf8",
    );
    const module = guide.match(/```ts\r?\n\/\/ src\/shared\/rewards\.ts\r?\n([\s\S]*?)```/u)?.[1];
    const entry = guide.match(/```ts\r?\n\/\/ src\/rewards\.events\.ts\r?\n([\s\S]*?)```/u)?.[1];
    expect(module).toBeDefined();
    expect(entry).toBeDefined();
    await writeFile(join(paths.shared, "rewards.ts"), module!);
    await writeFile(paths.entry, "export {};\n");
    await writeFile(join(workspaceRoot, "src/rewards.events.ts"), entry!);
    await api.compileWorkspace({ workspaceRoot, check: false });
    const events = JSON.parse(await readFile(paths.generated, "utf8"));
    expect(events[1]).toEqual({
      id: 1,
      name: "Skill reward",
      trigger: 0,
      switchId: 1,
      list: [
        { code: 125, indent: 0, parameters: [0, 0, 25] },
        { code: 108, indent: 0, parameters: ["Reward complete"] },
        { code: 0, indent: 0, parameters: [] },
      ],
    });
  });
}, 30_000);

it("rejects non-object arguments, higher-order arguments and implicit array flattening", async () => {
  await withWindowsSandbox("author-functions-inputs", async ({ workspaceRoot }) => {
    const paths = await prepare(workspaceRoot);
    for (const [declarations, commands, expected] of [
      [
        'const helper = (value: number) => [comment({ lines: ["Unused"] })];',
        "helper(1)",
        /requires an options object/iu,
      ],
      [
        'const helper = (options: { fn: () => number }) => [comment({ lines: ["Unused"] })]; const supplied = () => 1;',
        "helper({ fn: supplied })",
        /does not accept functions/iu,
      ],
      ['const helper = () => [comment({ lines: ["Nested"] })];', "[helper()]", /not assignable/iu],
    ] as const) {
      await writeFile(
        paths.entry,
        `import { commonEvent, comment } from "rpgmaker-event-dsl";
${declarations}
export const event = commonEvent({ id: 1, name: "Safe", trigger: "none", commands: ${commands} });`,
      );
      await expect(api.compileWorkspace({ workspaceRoot, check: true })).rejects.toThrow(expected);
    }
  });
}, 30_000);

it("preserves the Script Command Gate and stores authored event JavaScript without execution", async () => {
  await withWindowsSandbox("author-functions-script-gate", async ({ workspaceRoot }) => {
    const paths = await prepare(workspaceRoot);
    await writeFile(
      join(paths.shared, "scripted.ts"),
      `import { script } from "rpgmaker-event-dsl";
export const scripted = () => script({ code: 'throw new Error("EVENT EXECUTED");' });`,
    );
    await writeFile(
      paths.entry,
      `import { commonEvent } from "rpgmaker-event-dsl";
import { scripted } from "../shared/scripted.js";
export const event = commonEvent({ id: 1, name: "Stored script", trigger: "none", commands: [scripted()] });`,
    );
    await expect(api.compileWorkspace({ workspaceRoot, check: true })).rejects.toThrow(
      /scriptEnabled/iu,
    );
    const configPath = join(workspaceRoot, "rpgmaker-event-dsl.config.json");
    const config = JSON.parse(await readFile(configPath, "utf8"));
    await writeFile(configPath, JSON.stringify({ ...config, scriptEnabled: true }));
    await api.compileWorkspace({ workspaceRoot, check: false });
    const events = JSON.parse(await readFile(paths.generated, "utf8"));
    expect(events[1].list).toEqual([
      { code: 355, indent: 0, parameters: ['throw new Error("EVENT EXECUTED");'] },
      { code: 0, indent: 0, parameters: [] },
    ]);
  });
}, 30_000);

it("reports shared function type and constructor errors with definition and call locations", async () => {
  await withWindowsSandbox("author-functions-diagnostics", async ({ workspaceRoot }) => {
    const paths = await prepare(workspaceRoot);
    const shared = join(paths.shared, "reference.ts");
    const entry = `import { commonEvent, callCommonEvent } from "rpgmaker-event-dsl";
import { reference } from "../shared/reference.js";
export const event = commonEvent({ id: 1, name: "Safe", trigger: "none", commands: [callCommonEvent({ commonEvent: reference({ id: 0 }) })] });`;
    await writeFile(paths.entry, entry);
    await writeFile(
      shared,
      `import { commonEventRef } from "rpgmaker-event-dsl";
export function reference(options: { id: number }) {
  return commonEventRef({ id: options.id, name: "Conflicting" } as { id: number });
}`,
    );
    const failure = await api
      .compileWorkspace({ workspaceRoot, check: true })
      .catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toMatch(
      /reference\.ts:3:10.*Invalid Project Data Reference shape/isu,
    );
    expect((failure as Error).message).toMatch(
      /common-events\.events\.ts:3:\d+ Author function reference defined at.*reference\.ts:2:1/isu,
    );

    await writeFile(paths.entry, entry.replace("id: 0", 'id: "wrong"'));
    await expect(api.compileWorkspace({ workspaceRoot, check: true })).rejects.toThrow(
      /common-events\.events\.ts:3:\d+.*not assignable/isu,
    );
    await writeFile(paths.entry, entry.replace("id: 0", "id: 1"));
    await writeFile(
      shared,
      `import { commonEventRef } from "rpgmaker-event-dsl";
export function reference(options: { id: number }) { return commonEventRef(options); }
function unused(): number { return "wrong"; }`,
    );
    await expect(api.compileWorkspace({ workspaceRoot, check: false })).rejects.toThrow(
      /reference\.ts:3:\d+.*not assignable/isu,
    );
  });
}, 30_000);

it.each(["label", "undefined"])(
  "keeps lexical %s initialization errors at the function read location",
  async (name) => {
    await withWindowsSandbox("author-functions-tdz", async ({ workspaceRoot }) => {
      const paths = await prepare(workspaceRoot);
      await writeFile(
        paths.entry,
        `import { commonEvent, comment } from "rpgmaker-event-dsl";
const commands = read();
const ${name} = "Later";
function read() { return [comment({ lines: [${name}] })]; }
export const event = commonEvent({ id: 1, name: "Safe", trigger: "none", commands });`,
      );
      await expect(api.compileWorkspace({ workspaceRoot, check: true })).rejects.toThrow(
        new RegExp(
          `common-events\\.events\\.ts:4:45 Cannot access binding "${name}" before initialization`,
          "isu",
        ),
      );
    });
  },
  30_000,
);

it("checks the complete loaded function syntax subset even when functions are unused", async () => {
  await withWindowsSandbox("author-functions-syntax", async ({ workspaceRoot }) => {
    const paths = await prepare(workspaceRoot);
    const cases = [
      'function unused(options = { text: "Default" }) { return options; }',
      "function unused(...options: object[]) { return options; }",
      "function unused({ nested: { text } }: { nested: { text: string } }) { return text; }",
      'function unused({ text = "Default" }: { text?: string }) { return text; }',
      "function unused(this: { text: string }) { return 1; }",
      "function unused(options: { text: string }) { if (true) return options; return options; }",
      "function unused() { for (;;) {} return 1; }",
      "function unused() { let value = 1; return value; }",
      'function unused() { const value = { text: "Old" }; value.text = "New"; return value; }',
      'const unused = () => true ? "A" : "B";',
      "const unused = (options: { text: string }) => `Text ${options.text}`;",
      "const unused = () => [1].map((value) => value);",
      "async function unused() { return []; }",
      "function* unused() { return []; }",
      "const unused = () => class Unsupported {};",
      "export default function unused() { return []; }",
    ];
    for (const source of cases) {
      await writeFile(
        paths.entry,
        `import { commonEvent } from "rpgmaker-event-dsl";
${source}
export const event = commonEvent({ id: 1, name: "Safe", trigger: "none", commands: [] });`,
      );
      await expect(api.compileWorkspace({ workspaceRoot, check: true }), source).rejects.toThrow(
        /common-events\.events\.ts:2:\d+.*(Unsupported|require|Only|Default)/isu,
      );
    }
  });
}, 30_000);

it("rejects author functions returning functions or complete Event Definitions", async () => {
  await withWindowsSandbox("author-functions-results", async ({ workspaceRoot }) => {
    const paths = await prepare(workspaceRoot);
    for (const source of [
      'function build() { return commonEvent({ id: 2, name: "Factory", trigger: "none", commands: [] }); }',
      'const helper = () => comment({ lines: ["Helper"] }); function build() { return helper; }',
      'const event = commonEvent({ id: 2, name: "Factory", trigger: "none", commands: [] }); function build() { return [event]; }',
    ]) {
      await writeFile(
        paths.entry,
        `import { commonEvent, comment } from "rpgmaker-event-dsl";
${source}
export const result = build();
export const first = commonEvent({ id: 1, name: "First", trigger: "none", commands: [] });`,
      );
      await expect(api.compileWorkspace({ workspaceRoot, check: true })).rejects.toThrow(
        /Author functions cannot return functions or Event Definitions/iu,
      );
    }
  });
}, 30_000);

it("rejects host methods in loaded unused function bodies without invoking them", async () => {
  await withWindowsSandbox("author-functions-host-method", async ({ workspaceRoot }) => {
    const paths = await prepare(workspaceRoot);
    await writeFile(
      paths.entry,
      `import { commonEvent } from "rpgmaker-event-dsl";
function unused() { const values = [1]; return values.slice(); }
export const event = commonEvent({ id: 1, name: "Safe", trigger: "none", commands: [] });`,
    );
    await expect(api.compileWorkspace({ workspaceRoot, check: true })).rejects.toThrow(
      /common-events\.events\.ts:2:48.*Only DSL helpers or supported author functions/isu,
    );
  });
}, 30_000);

it("rejects direct and indirect author recursion with a finite named call chain", async () => {
  await withWindowsSandbox("author-functions-recursion", async ({ workspaceRoot }) => {
    const paths = await prepare(workspaceRoot);
    for (const [source, expected, commands] of [
      ["function first(): DslCommand[] { return first(); }", /first.*->.*first/isu, "first()"],
      [
        "function first(): DslCommand[] { return second(); }\nfunction second(): DslCommand[] { return first(); }",
        /first.*->.*second.*->.*first/isu,
        "first()",
      ],
      [
        "function first(): DslCommand[] { return second(); }\nfunction second(): DslCommand[] { return first(); }",
        /first.*->.*second.*->.*first/isu,
        "[]",
      ],
    ] as const) {
      await writeFile(
        paths.entry,
        `import { commonEvent, type DslCommand } from "rpgmaker-event-dsl";
${source}
export const event = commonEvent({ id: 1, name: "Recursive", trigger: "none", commands: ${commands} });`,
      );
      const result = await api
        .compileWorkspace({ workspaceRoot, check: true })
        .catch((error: unknown) => error);
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toMatch(/Recursive author function call/iu);
      expect((result as Error).message).toMatch(expected);
    }
  });
}, 30_000);

it("checks unsupported expressions in an unused shared author function at their source position", async () => {
  await withWindowsSandbox("author-functions-unused", async ({ workspaceRoot }) => {
    const paths = await prepare(workspaceRoot);
    await writeFile(
      join(paths.shared, "unused.ts"),
      `export const label = "Valid event";
export function unused(options: { amount: number }) {
  return options.amount + 1;
}
`,
    );
    await writeFile(
      paths.entry,
      `import { commonEvent } from "rpgmaker-event-dsl";
import { label } from "../shared/unused.js";
export const event = commonEvent({ id: 1, name: label, trigger: "none", commands: [] });`,
    );
    await expect(api.compileWorkspace({ workspaceRoot, check: true })).rejects.toThrow(
      /unused\.ts:3:10.*Unsupported author function expression: BinaryExpression/isu,
    );
  });
}, 30_000);

it("preserves lexical bindings and explicit order across nested functions and shallow option destructuring", async () => {
  await withWindowsSandbox("author-functions-composition", async ({ workspaceRoot }) => {
    const paths = await prepare(workspaceRoot);
    await writeFile(
      join(paths.shared, "leaf.ts"),
      `import { comment, commonEventRef } from "rpgmaker-event-dsl";
const text = "Module constant";
export function note() { return comment({ lines: [text] }); }
export const reference = () => commonEventRef({ id: 1 });
export const settings = () => ({ trigger: "none" } as const);
export const label = () => text;
export const absent = () => undefined;
`,
    );
    await writeFile(
      join(paths.shared, "sequence.ts"),
      `import { comment, callCommonEvent, type DslCommand } from "rpgmaker-event-dsl";
import * as commands from "rpgmaker-event-dsl";
import { note, reference, label } from "./leaf.js";
export function sequence({ text: localText }: { text: string }): DslCommand[] {
  const text = localText;
  const helpers = { ...commands };
  const fragment = [helpers.comment({ lines: [text] }), note(), comment({ lines: [label()] })];
  return [...fragment, invoke()];
}
const invoke = () => callCommonEvent({ commonEvent: reference() });
`,
    );
    await writeFile(
      paths.entry,
      `import { commonEvent, comment, callCommonEvent, commonEventRef, type DslCommand } from "rpgmaker-event-dsl";
import { sequence } from "../shared/sequence.js";
import { settings } from "../shared/leaf.js";
const text = "Entry constant";
export const reference = commonEventRef({ id: 1 });
export const runtimeCall = callCommonEvent({ commonEvent: reference });
export const first = commonEvent({ ...settings(), id: 1, name: "First", commands: [] });
export const second = commonEvent({ ...settings(), id: 2, name: "Second", commands: [...local({ text: "A" }), ...local({ text: "B" })] });
function local({ text }: { text: string }): DslCommand[] { return [comment({ lines: [text] }), ...sequence({ text })]; }
export const inline = commonEvent({ ...settings(), id: 3, name: "Inline", commands: [
  comment({ lines: ["A"] }), comment({ lines: ["A"] }), comment({ lines: ["Module constant"] }), comment({ lines: ["Module constant"] }), callCommonEvent({ commonEvent: commonEventRef({ id: 1 }) }),
  comment({ lines: ["B"] }), comment({ lines: ["B"] }), comment({ lines: ["Module constant"] }), comment({ lines: ["Module constant"] }), callCommonEvent({ commonEvent: commonEventRef({ id: 1 }) })
] });
`,
    );
    await api.compileWorkspace({ workspaceRoot, check: false });
    const events = JSON.parse(await readFile(paths.generated, "utf8"));
    expect(events).toHaveLength(4);
    expect(events[2].list).toEqual([
      { code: 108, indent: 0, parameters: ["A"] },
      { code: 108, indent: 0, parameters: ["A"] },
      { code: 108, indent: 0, parameters: ["Module constant"] },
      { code: 108, indent: 0, parameters: ["Module constant"] },
      { code: 117, indent: 0, parameters: [1] },
      { code: 108, indent: 0, parameters: ["B"] },
      { code: 108, indent: 0, parameters: ["B"] },
      { code: 108, indent: 0, parameters: ["Module constant"] },
      { code: 108, indent: 0, parameters: ["Module constant"] },
      { code: 117, indent: 0, parameters: [1] },
      { code: 0, indent: 0, parameters: [] },
    ]);
    expect(events[3].list).toEqual(events[2].list);
  });
}, 30_000);
