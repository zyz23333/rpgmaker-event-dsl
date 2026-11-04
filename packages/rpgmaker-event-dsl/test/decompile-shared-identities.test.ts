import {
  lstat,
  mkdir,
  readFile,
  readdir,
  readlink,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import { createMinimalProject, withWindowsSandbox } from "./support/windows-sandbox.js";
import {
  startWorkspaceOperation,
  workspaceApiEntry,
} from "./support/workspace-operation-process.js";

const {
  cloneWorkspace,
  compileWorkspace,
  decompileWorkspace,
  initWorkspace,
}: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);

async function prepare(workspaceRoot: string) {
  await createMinimalProject(workspaceRoot);
  await initWorkspace({ workspaceRoot, projectRoot: "./Game" });
  await cloneWorkspace({ workspaceRoot });
  await mkdir(join(workspaceRoot, "src/shared"));
}

async function tree(root: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const entry of await readdir(root, { withFileTypes: true }).catch(() => [])) {
    if (entry.name === "operation.lock" || entry.name === "decompile-candidates") continue;
    const path = join(root, entry.name);
    const info = await lstat(path);
    if (info.isSymbolicLink()) result[entry.name] = "link:" + (await readlink(path));
    else if (info.isDirectory()) {
      result[entry.name + "/"] = "directory";
      for (const [name, content] of Object.entries(await tree(path)))
        result[entry.name + "/" + name] = content;
    } else result[entry.name] = (await readFile(path)).toString("hex");
  }
  return result;
}

async function state(workspaceRoot: string) {
  return {
    source: await tree(join(workspaceRoot, "src")),
    project: await tree(join(workspaceRoot, "Game")),
    metadata: await tree(join(workspaceRoot, ".rpgmaker-event-dsl")),
    config: await readFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8"),
  };
}

it.each(["direct", "transitive"] as const)(
  "Decompile preserves source and Snapshot when an identity function reads an uninitialized module const (%s)",
  async (dependency) => {
    await withWindowsSandbox("decompile-module-initialization", async ({ workspaceRoot }) => {
      await prepare(workspaceRoot);
      await writeFile(
        join(workspaceRoot, "src/shared/ids.ts"),
        "export const identity = pick(); function pick() { return { id }; } const id = 99;",
      );
      if (dependency === "transitive")
        await writeFile(
          join(workspaceRoot, "src/shared/config.ts"),
          `import { identity } from "./ids.js"; export const config = { ...identity };`,
        );
      await writeFile(
        join(workspaceRoot, "src/existing.events.ts"),
        `import { commonEvent } from "rpgmaker-event-dsl";
import { ${dependency === "direct" ? "identity" : "config as identity"} } from "./shared/${dependency === "direct" ? "ids" : "config"}.js";
export const existing = commonEvent({ ...identity, commands: invalidCommands });`,
      );
      const before = await state(workspaceRoot);
      await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(
        /MV-DECOMPILE-IDENTITY.*id.*before initialization/s,
      );
      expect(await state(workspaceRoot)).toStrictEqual(before);
      await expect(lstat(join(workspaceRoot, "src/decompiled"))).rejects.toThrow();
    });
  },
  30_000,
);

it("Decompile reads identity functions after their module constants initialize while leaving commands lazy", async () => {
  await withWindowsSandbox("decompile-initialized-function", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    await writeFile(
      join(workspaceRoot, "src/shared/ids.ts"),
      `export function pick() { return { id, commands: invalidCommands }; }
export const arrow = () => pick();
const id = 99;
export const initialized = arrow();`,
    );
    await writeFile(
      join(workspaceRoot, "src/shared/config.ts"),
      `import { arrow, initialized } from "./ids.js";
export const identity = { ...initialized, id: arrow().id };`,
    );
    await writeFile(
      join(workspaceRoot, "src/existing.events.ts"),
      `import { commonEvent } from "rpgmaker-event-dsl";
import { identity } from "./shared/config.js";
import { pick } from "./shared/ids.js";
export const existing = commonEvent({ ...identity, id: pick().id, commands: invalidCommands });
function local() { return { id }; }
const id = 100;
export const localExisting = commonEvent({ ...local(), commands: invalidCommands });`,
    );
    const before = await state(workspaceRoot);
    await decompileWorkspace({ workspaceRoot });
    const after = await state(workspaceRoot);
    expect(after.project).toStrictEqual(before.project);
    expect(after.metadata).toStrictEqual(before.metadata);
    expect(after.config).toBe(before.config);
    for (const [path, contents] of Object.entries(before.source))
      expect(after.source[path]).toBe(contents);
    expect(await readdir(join(workspaceRoot, "src/decompiled"))).toHaveLength(3);
  });
}, 30_000);

it("Decompile resolves shared undefined bindings and function scopes without reading commands", async () => {
  await withWindowsSandbox("decompile-identity-undefined", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    await writeFile(
      join(workspaceRoot, "src/shared/ids.ts"),
      `const undefined = { id: 99 };
function parameter(undefined: { id: number }) { return undefined.id; }
function local() { const undefined = { id: 100 }; return parameter(undefined); }
export const identity = { id: parameter(undefined) };
export const other = local();
`,
    );
    await writeFile(
      join(workspaceRoot, "src/existing.events.ts"),
      `import { commonEvent } from "rpgmaker-event-dsl";
import { identity, other } from "./shared/ids.js";
export const existing = commonEvent({ ...identity, id: other, commands: invalidCommands });
export const moduleBinding = commonEvent({ ...identity, commands: invalidCommands });
`,
    );
    const before = await state(workspaceRoot);
    await decompileWorkspace({ workspaceRoot });
    const after = await state(workspaceRoot);
    expect(after.project).toStrictEqual(before.project);
    expect(after.metadata).toStrictEqual(before.metadata);
    expect(after.source["existing.events.ts"]).toBe(before.source["existing.events.ts"]);
    expect(await readdir(join(workspaceRoot, "src/decompiled"))).toContain(
      "common-events.events.ts",
    );
  });
}, 30_000);

it("Decompile reads shared identity constants without validating unrelated command functions or types", async () => {
  await withWindowsSandbox("decompile-shared-lazy", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    await writeFile(
      join(workspaceRoot, "src/shared/ids.ts"),
      `export const ids = { existing: 99 };\nconst unrelated: number = "bad type";`,
    );
    await writeFile(
      join(workspaceRoot, "src/shared/rewards.ts"),
      `import { ids } from "./ids.js";
import { script } from "rpgmaker-event-dsl";
export const identity = { id: ids.existing };
export function commands() { return [script({ code: "throw new Error('never execute')" })]; }
export const arrow = () => commands();
`,
    );
    const source = `import { commonEvent } from "rpgmaker-event-dsl";
import { identity as sharedIdentity, arrow } from "./shared/rewards.js";
export function localCommands() { return arrow(); }
export const localArrow = () => localCommands();
const unrelated: number = "bad type";
export const existing = commonEvent({ ...sharedIdentity, name: "Existing", trigger: "none", commands: [missingIdentifier, ...localArrow()] });
`;
    await writeFile(join(workspaceRoot, "src/existing.events.ts"), source);
    const before = await state(workspaceRoot);
    expect(JSON.parse(before.config).scriptEnabled).toBe(false);
    await decompileWorkspace({ workspaceRoot });
    const after = await state(workspaceRoot);
    expect(after.project).toStrictEqual(before.project);
    expect(after.metadata).toStrictEqual(before.metadata);
    expect(after.config).toBe(before.config);
    expect(await readFile(join(workspaceRoot, "src/existing.events.ts"), "utf8")).toBe(source);
    expect(await readdir(join(workspaceRoot, "src/decompiled"))).toStrictEqual([
      "common-events.events.ts",
      "system.dsl.ts",
      "troop-events.events.ts",
    ]);
    expect(
      await readFile(join(workspaceRoot, "src/decompiled/common-events.events.ts"), "utf8"),
    ).toContain("Evidence Common Event");
  });
}, 30000);

it("Decompile never uses shared existing declarations to repair missing candidate references", async () => {
  await withWindowsSandbox("decompile-shared-candidate-reference", async ({ workspaceRoot }) => {
    await createMinimalProject(workspaceRoot);
    const commonPath = join(workspaceRoot, "Game/data/CommonEvents.json");
    const events = JSON.parse(await readFile(commonPath, "utf8"));
    events[1].list = [
      { code: 117, indent: 0, parameters: [2] },
      { code: 0, indent: 0, parameters: [] },
    ];
    await writeFile(commonPath, JSON.stringify(events));
    await initWorkspace({ workspaceRoot, projectRoot: "./Game" });
    await cloneWorkspace({ workspaceRoot });
    await mkdir(join(workspaceRoot, "src/shared"));
    await writeFile(join(workspaceRoot, "src/shared/ids.ts"), "export const identity = { id: 2 };");
    await writeFile(
      join(workspaceRoot, "src/existing.events.ts"),
      `import { commonEvent } from "rpgmaker-event-dsl";
import { identity } from "./shared/ids.js";
export const existing = commonEvent({ ...identity, name: "Existing target", trigger: "none", commands: [] });`,
    );
    const before = await state(workspaceRoot);
    await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(
      /Common event.*2|commonEvent.*2/i,
    );
    expect(await state(workspaceRoot)).toStrictEqual(before);
  });
}, 30000);

it("unchanged Decompiled Source preserves saved Common Event state beside a shared command function", async () => {
  await withWindowsSandbox("decompile-shared-roundtrip", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    await writeFile(
      join(workspaceRoot, "src/shared/commands.ts"),
      `import { comment } from "rpgmaker-event-dsl";
export const identity = { id: 99 };
export function commands({ text }: { text: string }) { return [comment({ lines: [text] })]; }`,
    );
    await writeFile(
      join(workspaceRoot, "src/existing.events.ts"),
      `import { commonEvent } from "rpgmaker-event-dsl";
import { identity, commands } from "./shared/commands.js";
export const existing = commonEvent({ ...identity, name: "Existing", trigger: "none", commands: commands({ text: "Shared comment" }) });`,
    );
    await decompileWorkspace({ workspaceRoot });
    await compileWorkspace({ workspaceRoot, check: false });
    const output = JSON.parse(
      await readFile(
        join(workspaceRoot, ".rpgmaker-event-dsl/generated-project-data/CommonEvents.json"),
        "utf8",
      ),
    );
    expect(output[1]).toStrictEqual({
      id: 1,
      name: "Evidence Common Event",
      trigger: 0,
      switchId: 1,
      list: [
        { code: 101, indent: 0, parameters: ["", 0, 1, 0] },
        { code: 401, indent: 0, parameters: ["Synthetic CR\rkept"] },
        { code: 401, indent: 0, parameters: [""] },
        { code: 108, indent: 0, parameters: ["Self-authored fixture"] },
        { code: 408, indent: 0, parameters: [""] },
        { code: 0, indent: 0, parameters: [] },
      ],
    });
    expect(output[99].list).toStrictEqual([
      { code: 108, indent: 0, parameters: ["Shared comment"] },
      { code: 0, indent: 0, parameters: [] },
    ]);
  });
}, 30000);

it.each([
  ["missing export", "export const other = 99;", /no named export identity/],
  [
    "missing module",
    `import { id } from "./absent.js"; export const identity = { id };`,
    /must resolve to a TypeScript source file/,
  ],
  ["missing binding", "export const identity = { id: unknownId };", /Unresolved.*unknownId/],
  [
    "undefined override",
    "export const identity = { id: 99, ...{ id: undefined } };",
    /invalid Entry Identity/,
  ],
  [
    "self-referencing identity",
    "export const identity = { id: identity.id };",
    /before initialization/,
  ],
  [
    "cyclic shared binding",
    `import { identity as self } from "./ids.js"; export const identity = self;`,
    /cyclic binding/,
  ],
  ["unsupported computation", "export const identity = { id: 98 + 1 };", /BinaryExpression/],
  [
    "recursive function",
    "function id() { return id(); } export const identity = { id: id() };",
    /Recursive identity function/,
  ],
  [
    "uninitialized function local",
    "const id = 1; function pick() { const chosen = id; const id = 99; return chosen; } export const identity = { id: pick() };",
    /before initialization/,
  ],
  [
    "uninitialized module scalar result",
    "const chosen = pick(); const id = 99; function pick() { return id; } export const identity = { id: chosen };",
    /id.*before initialization/,
  ],
  [
    "uninitialized module field call",
    "export const identity = { id: pick() }; function pick() { return id; } const id = 99;",
    /id.*before initialization/,
  ],
  [
    "uninitialized module arrow closure",
    "const pick = () => ({ id }); export const identity = pick(); const id = 99;",
    /id.*before initialization/,
  ],
  [
    "uninitialized escaped local object",
    "function pick() { const chosen = { id }; const id = 99; return chosen; } export const identity = pick();",
    /id.*before initialization/,
  ],
  [
    "uninitialized undefined local",
    "const undefined = 1; function pick() { const chosen = undefined; const undefined = 99; return chosen; } export const identity = { id: pick() };",
    /before initialization/,
  ],
  [
    "scalar function argument",
    "function pick(value: number) { return value; } export const identity = { id: pick(99) };",
    /options object/,
  ],
  [
    "higher-order identity call",
    "function get() { return 99; } function pick(options: any) { return options.get(); } export const identity = { id: pick({ get }) };",
    /functions in options/,
  ],
  [
    "event factory",
    `import { commonEvent } from "rpgmaker-event-dsl"; function make() { return commonEvent({ id: 99, commands: [] }); } export const identity = make();`,
    /Event Definition factories/,
  ],
] as const)(
  "Decompile preserves source and Snapshot when a shared identity is indeterminate (%s)",
  async (_label, shared, diagnostic) => {
    await withWindowsSandbox("decompile-identity-unknown", async ({ workspaceRoot }) => {
      await prepare(workspaceRoot);
      await writeFile(join(workspaceRoot, "src/shared/ids.ts"), shared);
      await writeFile(
        join(workspaceRoot, "src/existing.events.ts"),
        `import { commonEvent } from "rpgmaker-event-dsl";
import { identity } from "./shared/ids.js";
export const existing = commonEvent({ ...identity, commands: invalidCommands });`,
      );
      const before = await state(workspaceRoot);
      const error = await decompileWorkspace({ workspaceRoot }).catch(
        (failure: unknown) => failure,
      );
      expect(String(error)).toMatch(/MV-DECOMPILE-IDENTITY/);
      expect(String(error)).toMatch(diagnostic);
      expect(await state(workspaceRoot)).toStrictEqual(before);
    });
  },
  30000,
);

it("Decompile keeps Data Domain identities separate while projecting needed shared function fields", async () => {
  await withWindowsSandbox("decompile-shared-domains", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    await writeFile(
      join(workspaceRoot, "src/shared/ids.ts"),
      `export const ids = { common: 99, variable: 1, map: 1, event: 1, troop: 1 };
export function fields({ value: id }: { value: number }) { const identity = { id }; return identity; }`,
    );
    await writeFile(
      join(workspaceRoot, "src/existing.events.ts"),
      `import { commonEvent, variableDefinition, mapEvent, troopEvent } from "rpgmaker-event-dsl";
import { ids, fields } from "./shared/ids.js";
export const common = commonEvent({ ...fields({ value: ids.common }), commands: invalidCommands });
export const variable = variableDefinition({ id: ids.variable, name: invalidName });
export const map = mapEvent({ mapId: ids.map, id: ids.event, pages: invalidPages });
export const troop = troopEvent({ troopId: ids.troop, pages: invalidPages });`,
    );
    await decompileWorkspace({ workspaceRoot });
    expect(await readdir(join(workspaceRoot, "src/decompiled"))).toHaveLength(3);
  });
}, 30000);

it("Decompile applies local module containment to needed identity imports", async () => {
  await withWindowsSandbox("decompile-identity-containment", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    const outside = join(workspaceRoot, "outside");
    await mkdir(outside);
    await writeFile(join(outside, "ids.ts"), "export const id = 99;");
    const isolated = join(workspaceRoot, ".rpgmaker-event-dsl/decompile-candidates/partial");
    await mkdir(isolated, { recursive: true });
    await writeFile(join(isolated, "ids.ts"), "export const id = 99;");
    const alias = join(workspaceRoot, "src/shared/alias");
    for (const [target, diagnostic] of [
      [outside, /outside sourceRoot/],
      [isolated, /isolation area/],
    ] as const) {
      if (target === isolated) {
        const configPath = join(workspaceRoot, "rpgmaker-event-dsl.config.json");
        const config = JSON.parse(await readFile(configPath, "utf8"));
        await writeFile(configPath, JSON.stringify({ ...config, sourceRoot: "." }));
      }
      await symlink(target, alias, "junction");
      await writeFile(
        join(workspaceRoot, "src/existing.events.ts"),
        `import { commonEvent } from "rpgmaker-event-dsl";
import { id } from "./shared/alias/ids.js";
export const existing = commonEvent({ id, commands: invalidCommands });`,
      );
      const before = await state(workspaceRoot);
      await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(diagnostic);
      expect(await state(workspaceRoot)).toStrictEqual(before);
      await unlink(alias);
    }
  });
}, 30000);

it.each(["contents", "resolution"] as const)(
  "Decompile refuses publication after a shared identity dependency changes (%s)",
  async (change) => {
    await withWindowsSandbox("decompile-identity-race-" + change, async (sandbox) => {
      const { workspaceRoot } = sandbox;
      await prepare(workspaceRoot);
      const first = join(workspaceRoot, "src/shared/first");
      const second = join(workspaceRoot, "src/shared/second");
      const alias = join(workspaceRoot, "src/shared/current");
      await mkdir(first);
      await mkdir(second);
      await writeFile(join(first, "ids.ts"), "export const id = 99;");
      await writeFile(join(second, "ids.ts"), "export const id = 1;");
      await symlink(first, alias, "junction");
      await writeFile(
        join(workspaceRoot, "src/shared/config.ts"),
        `import { id } from "./current/ids.js"; export const identity = { id };`,
      );
      await writeFile(
        join(workspaceRoot, "src/existing.events.ts"),
        `import { commonEvent } from "rpgmaker-event-dsl";
import { identity } from "./shared/config.js";
export const existing = commonEvent({ ...identity, commands: invalidCommands });`,
      );
      const child = startWorkspaceOperation(sandbox, {
        operation: "decompile",
        boundary: "input-validation",
      });
      try {
        await child.waitFor("checkpoint");
        if (change === "contents") await writeFile(join(first, "ids.ts"), "export const id = 1;");
        else {
          await unlink(alias);
          await symlink(second, alias, "junction");
        }
        const beforeRelease = await state(workspaceRoot);
        child.send("release");
        expect(await child.waitFor("result")).toMatchObject({
          ok: false,
          message: expect.stringMatching(/inputs changed|inputs have changed/i),
        });
        await child.ended;
        expect(await state(workspaceRoot)).toStrictEqual(beforeRelease);
        await expect(lstat(join(workspaceRoot, "src/decompiled"))).rejects.toThrow();
      } finally {
        await child.stop();
      }
    });
  },
  30000,
);

it("Decompile rejects a transitive shared Entry Identity collision and reports both source locations", async () => {
  await withWindowsSandbox("decompile-shared-collision", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    await writeFile(join(workspaceRoot, "src/shared/ids.ts"), "export const target = { id: 1 };");
    await writeFile(
      join(workspaceRoot, "src/shared/config.ts"),
      `import { target } from "./ids.js";
const identity = { id: 99, ...target }; export { identity as shared };`,
    );
    await writeFile(
      join(workspaceRoot, "src/existing.events.ts"),
      `import { commonEvent } from "rpgmaker-event-dsl";
import { shared } from "./shared/config.js";
export const existing = commonEvent({ ...shared, commands: invalidCommands });`,
    );
    const before = await state(workspaceRoot);
    await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(
      /MV-DECOMPILE-IDENTITY.*commonEvent:1.*existing\.events\.ts.*common-events\.events\.ts/s,
    );
    expect(await state(workspaceRoot)).toStrictEqual(before);
  });
}, 30000);

it("Decompile distinguishes shared Common Event references and command results from declarations", async () => {
  await withWindowsSandbox("decompile-shared-exports", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    await writeFile(
      join(workspaceRoot, "src/shared/commands.ts"),
      `import { callCommonEvent, commonEventRef } from "rpgmaker-event-dsl";
export function call(options: { id: number }) { const ref = commonEventRef({ id: options.id }); return callCommonEvent({ commonEvent: ref }); }
export const wrap = ({ id: target }: { id: number }) => call({ id: target });
export const config = { kind: "commonEvent", id: 1 };
`,
    );
    await writeFile(
      join(workspaceRoot, "src/existing.events.ts"),
      `import { callCommonEvent, commonEventRef } from "rpgmaker-event-dsl";
import { config, wrap } from "./shared/commands.js";
export { config as sharedReference };
export const command = wrap({ id: 1 });
export const reference = commonEventRef({ id: 1 });
export const directCommand = callCommonEvent({ commonEvent: reference });
export const existing = { kind: "commonEvent", id: 99, commands: missingCommand() };
`,
    );
    await decompileWorkspace({ workspaceRoot });
    expect(await readdir(join(workspaceRoot, "src/decompiled"))).toHaveLength(3);
  });
}, 30000);

it("Decompile reads an explicit shared reference ID without deriving identity from a reference name", async () => {
  await withWindowsSandbox("decompile-shared-reference-id", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    const dependency = join(workspaceRoot, "src/shared/ids.ts");
    await writeFile(
      join(workspaceRoot, "src/existing.events.ts"),
      `import { commonEvent } from "rpgmaker-event-dsl";
import { target } from "./shared/ids.js";
export const existing = commonEvent({ id: target.id, commands: invalidCommands });`,
    );
    for (const [input, diagnostic] of [
      ["{ id: 1 }", /conflicts with existing commonEvent:1/],
      ['{ name: "Evidence Common Event" }', /invalid Entry Identity/],
    ] as const) {
      await writeFile(
        dependency,
        `import { commonEventRef } from "rpgmaker-event-dsl"; export const target = commonEventRef(${input});`,
      );
      const before = await state(workspaceRoot);
      await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(diagnostic);
      expect(await state(workspaceRoot)).toStrictEqual(before);
    }
  });
}, 30000);
