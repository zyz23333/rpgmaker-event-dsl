import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it, vi } from "vitest";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { createMinimalProject, withWindowsSandbox } from "./support/windows-sandbox.js";

const api: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);

async function prepare(workspaceRoot: string) {
  await createMinimalProject(workspaceRoot);
  await api.initWorkspace({ workspaceRoot, projectRoot: "./Game" });
  await api.cloneWorkspace({ workspaceRoot });
  await mkdir(join(workspaceRoot, "src/shared"), { recursive: true });
  return {
    entry: join(workspaceRoot, "src/diagnostics.events.ts"),
    shared: join(workspaceRoot, "src/shared/commands.ts"),
    manifest: join(workspaceRoot, ".rpgmaker-event-dsl/sync-manifest.json"),
  };
}

async function failure(workspaceRoot: string): Promise<string> {
  try {
    await api.compileWorkspace({ workspaceRoot, check: true });
  } catch (error) {
    return String(error);
  }
  throw new Error("Expected Compile Check to fail.");
}

it("retains the shared command definition and each event use in grouped asset errors", async () => {
  await withWindowsSandbox("shared-diagnostics-constant", async ({ workspaceRoot }) => {
    const paths = await prepare(workspaceRoot);
    await writeFile(
      paths.shared,
      `import { showPicture, imageAsset } from "rpgmaker-event-dsl";
export const commands = [
  showPicture({ pictureId: 1, image: imageAsset({ folder: "pictures", name: "Missing" }), origin: "upperLeft", position: { kind: "direct", x: 0, y: 0 }, scaleX: 100, scaleY: 100, opacity: 255, blendMode: "normal" }),
];
`,
    );
    await writeFile(
      paths.entry,
      `import { commonEvent } from "rpgmaker-event-dsl";
import { commands } from "./shared/commands.js";
export const first = commonEvent({ id: 10, name: "First", trigger: "none", commands: [
  ...commands,
  ...commands,
] });
export const second = commonEvent({ id: 11, name: "Second", trigger: "none", commands: [
  ...commands,
] });
`,
    );
    const manifest = await readFile(paths.manifest, "utf8");
    const output = await failure(workspaceRoot);
    for (const [native, line] of [
      ["CommonEvents.json[10].list[0]", 4],
      ["CommonEvents.json[10].list[1]", 5],
      ["CommonEvents.json[11].list[0]", 8],
    ] as const) {
      const use = output.split("\n").find((value) => value.includes(native));
      expect(use).toContain("commands.ts (line 3, column 3)");
      expect(use).toContain(`diagnostics.events.ts (line ${line}, column 6)`);
      expect(use).toContain(`DSL: commands[${line === 5 ? 1 : 0}]`);
    }
    expect(await readFile(paths.manifest, "utf8")).toBe(manifest);
  });
}, 30_000);

it("keeps actual source locations for argument types, shared type and syntax errors, and failed imports", async () => {
  await withWindowsSandbox("shared-diagnostics-types-imports", async ({ workspaceRoot }) => {
    const paths = await prepare(workspaceRoot);
    const shared = `import { wait } from "rpgmaker-event-dsl";
export const build = (options: { frames: number }) => [wait({ frames: options.frames })];
`;
    const entry = `import { commonEvent } from "rpgmaker-event-dsl";
import { build } from "./shared/commands.js";
export const event = commonEvent({ id: 10, name: "Types", trigger: "none", commands:
  build({ frames: 1 })
});
`;
    const cases = [
      {
        shared,
        entry: entry.replace("frames: 1", 'frames: "wrong"'),
        location: /diagnostics\.events\.ts:4:\d+/u,
        detail: /Type 'string' is not assignable to type 'number'/u,
      },
      {
        shared: shared + 'const invalid: number = "wrong";\n',
        entry,
        location: /commands\.ts:3:\d+/u,
        detail: /Type 'string' is not assignable to type 'number'/u,
      },
      {
        shared: shared + "export const invalid = ;\n",
        entry,
        location: /commands\.ts:3:\d+/u,
        detail: /Expression expected/u,
      },
      {
        shared,
        entry: entry.replace("import { build }", "import { absent as build }"),
        location: /diagnostics\.events\.ts:2:\d+/u,
        detail: /no exported member 'absent'/u,
      },
      {
        shared,
        entry: entry.replace("./shared/commands.js", "./shared/absent.js"),
        location: /diagnostics\.events\.ts:2:\d+/u,
        detail: /Cannot find module '.\/shared\/absent.js'/u,
      },
    ];
    for (const value of cases) {
      await writeFile(paths.shared, value.shared);
      await writeFile(paths.entry, value.entry);
      const output = await failure(workspaceRoot);
      expect(output).toMatch(value.location);
      expect(output).toMatch(value.detail);
      if (value.shared !== shared) expect(output).toContain("diagnostics.events.ts:2:1");
    }
  });
}, 30_000);

it("preserves shared native values and rejects undefined instead of silently normalizing it", async () => {
  await withWindowsSandbox("shared-diagnostics-saved-values", async ({ workspaceRoot }) => {
    const paths = await prepare(workspaceRoot);
    const shared = `import { rawDslCommand } from "rpgmaker-event-dsl";
const payload = { negative: -0, ["__proto__"]: { saved: "own field" } };
export const commands = () => [rawDslCommand({ code: 999, parameters: [payload] })];
`;
    await writeFile(paths.shared, shared);
    await writeFile(
      paths.entry,
      `import { commonEvent } from "rpgmaker-event-dsl";
import { commands } from "./shared/commands.js";
export const event = commonEvent({ id: 10, name: "Saved values", trigger: "none", commands: [...commands(), ...commands()] });
`,
    );
    await api.compileWorkspace({ workspaceRoot, check: false });
    const generated = join(
      workspaceRoot,
      ".rpgmaker-event-dsl/generated-project-data/CommonEvents.json",
    );
    const bytes = await readFile(generated, "utf8");
    const commands = JSON.parse(bytes)[10].list;
    for (const command of commands.slice(0, 2)) {
      expect(command.code).toBe(999);
      expect(command.indent).toBe(0);
      expect(command.parameters).toHaveLength(1);
      expect(Object.is(command.parameters[0].negative, -0)).toBe(true);
      expect(Object.hasOwn(command.parameters[0], "__proto__")).toBe(true);
      expect(command.parameters[0].__proto__).toEqual({ saved: "own field" });
    }
    expect(commands[2]).toEqual({ code: 0, indent: 0, parameters: [] });
    const manifest = await readFile(paths.manifest, "utf8");
    await writeFile(
      paths.shared,
      shared.replace("negative: -0", "negative: -0, invalid: undefined"),
    );
    const output = await failure(workspaceRoot);
    expect(output).toContain("undefined");
    expect(output).toContain("invalid");
    expect(await readFile(generated, "utf8")).toBe(bytes);
    expect(await readFile(paths.manifest, "utf8")).toBe(manifest);
  });
}, 30_000);

it("reports cross-module constructor failures with the failed helper and author call chain", async () => {
  await withWindowsSandbox("shared-diagnostics-constructor", async ({ workspaceRoot }) => {
    const paths = await prepare(workspaceRoot);
    await writeFile(
      paths.shared,
      `import { wait } from "rpgmaker-event-dsl";
export function leaf(options: { frames: number }) {
  return wait({ frames: options.frames });
}
`,
    );
    await writeFile(
      join(workspaceRoot, "src/shared/outer.ts"),
      `import { leaf } from "./commands.js";
export function outer(options: { frames: number }) {
  return [leaf(options)];
}
`,
    );
    await writeFile(
      paths.entry,
      `import { commonEvent } from "rpgmaker-event-dsl";
import { outer } from "./shared/outer.js";
export const event = commonEvent({ id: 10, name: "Construction", trigger: "none", commands:
  outer({ frames: -1 })
});
`,
    );
    const output = await failure(workspaceRoot);
    expect(output).toContain("wait.frames");
    expect(output).toContain("commands.ts:3:10");
    expect(output).toContain("Author function leaf defined at");
    expect(output).toContain("outer.ts:3:11");
    expect(output).toContain("Author function outer defined at");
    expect(output).toContain("diagnostics.events.ts:4:3");
    expect(output).not.toContain("definitions.ts");
  });
}, 30_000);

it("retains warning severity and both paths for a shared Break Loop outside its required context", async () => {
  await withWindowsSandbox("shared-diagnostics-context", async ({ workspaceRoot }) => {
    const paths = await prepare(workspaceRoot);
    await writeFile(
      paths.shared,
      `import { breakLoop } from "rpgmaker-event-dsl";
export const leave = () => breakLoop();
`,
    );
    await writeFile(
      paths.entry,
      `import { commonEvent } from "rpgmaker-event-dsl";
import { leave } from "./shared/commands.js";
export const event = commonEvent({ id: 10, name: "Loop context", trigger: "none", commands: [
  leave(),
] });
`,
    );
    const output: string[] = [];
    const observer = vi
      .spyOn(console, "error")
      .mockImplementation((message) => output.push(String(message)));
    const manifest = await readFile(paths.manifest, "utf8");
    try {
      await api.compileWorkspace({ workspaceRoot, check: true });
    } finally {
      observer.mockRestore();
    }
    const warning = output.find((line) => line.includes("Break Loop outside a Loop"));
    expect(warning).toContain("commonEvent:10");
    expect(warning).toContain("native: list[0]");
    expect(warning).toContain("DSL: commands[0]");
    expect(warning).toContain("commands.ts (line 2, column 28)");
    expect(warning).toContain("call leave:");
    expect(warning).toContain("diagnostics.events.ts (line 4, column 3)");
    expect(await readFile(paths.manifest, "utf8")).toBe(manifest);
  });
}, 30_000);

it("keeps per-command locations for reference diagnostics that previously carried only text", async () => {
  await withWindowsSandbox("shared-diagnostics-switch", async ({ workspaceRoot }) => {
    const paths = await prepare(workspaceRoot);
    await writeFile(
      paths.shared,
      `import { controlSwitches, switchRef } from "rpgmaker-event-dsl";
export const commands = [controlSwitches({ switch: switchRef({ id: 999 }), value: true })];
`,
    );
    await writeFile(
      paths.entry,
      `import { commonEvent } from "rpgmaker-event-dsl";
import { commands } from "./shared/commands.js";
export const event = commonEvent({ id: 10, name: "Missing switch", trigger: "none", commands: [
  ...commands,
  ...commands,
] });
`,
    );
    const output = await failure(workspaceRoot);
    for (const [index, line] of [
      [0, 4],
      [1, 5],
    ]) {
      const issue = output
        .split("\n")
        .find((value) => value.includes(`common event 10.commands[${index}].switch`));
      expect(issue).toContain("Unknown switch reference id: 999");
      expect(issue).toContain("commands.ts (line 2, column 52)");
      expect(issue).toContain(`diagnostics.events.ts (line ${line}, column 6)`);
    }
  });
}, 30_000);

it("locates a failing options access inside nested author functions without inventing parameter positions", async () => {
  await withWindowsSandbox("shared-diagnostics-evaluation", async ({ workspaceRoot }) => {
    const paths = await prepare(workspaceRoot);
    await writeFile(
      paths.shared,
      `import { wait } from "rpgmaker-event-dsl";
export function leaf(options: { settings: { duration: number } }) {
  const config = options.settings;
  return wait({ frames: config.duration });
}
export const outer = (options: { settings: { duration: number } }) => [leaf(options)];
`,
    );
    await writeFile(
      paths.entry,
      `import { commonEvent } from "rpgmaker-event-dsl";
import { outer } from "./shared/commands.js";
export const event = commonEvent({ id: 10, name: "Failure", trigger: "none", commands:
  outer({ settings: undefined as unknown as { duration: number } })
});
`,
    );
    const output = await failure(workspaceRoot);
    expect(output).toContain("Property access must target an object");
    expect(output).toContain("commands.ts:4:25");
    expect(output).toContain("Author function leaf defined at");
    expect(output).toContain("commands.ts:6:72");
    expect(output).toContain("Author function outer defined at");
    expect(output).toContain("diagnostics.events.ts:4:3");
    expect(output).not.toContain("commonEvent:10");
    expect(output).not.toContain("definitions.ts");
  });
}, 30_000);

it("locates every unresolved reference after nested shared commands are composed", async () => {
  await withWindowsSandbox("shared-diagnostics-references", async ({ workspaceRoot }) => {
    const paths = await prepare(workspaceRoot);
    await writeFile(
      paths.shared,
      `import { callCommonEvent, commonEventRef } from "rpgmaker-event-dsl";
export const missing = () => callCommonEvent({ commonEvent: commonEventRef({ id: 99 }) });
export const commands = () => [missing()];
`,
    );
    await writeFile(
      paths.entry,
      `import { commonEvent } from "rpgmaker-event-dsl";
import { commands } from "./shared/commands.js";
export const first = commonEvent({ id: 10, name: "First", trigger: "none", commands: [
  ...commands(),
  ...commands(),
] });
export const second = commonEvent({ id: 11, name: "Second", trigger: "none", commands: commands() });
`,
    );
    const output = await failure(workspaceRoot);
    expect(output).toContain("Unknown commonEvent reference id: 99");
    for (const [identity, path, line, column] of [
      ["common event 10", "commands[0]", 4, 6],
      ["common event 10", "commands[1]", 5, 6],
      ["common event 11", "commands[0]", 7, 88],
    ] as const) {
      const issue = output
        .split("\n")
        .find((value) => value.includes(identity) && value.includes(path));
      expect(issue).toContain("commands.ts (line 2, column 61)");
      expect(issue).toContain("call missing:");
      expect(issue).toContain("call commands:");
      expect(issue).toContain(`diagnostics.events.ts (line ${line}, column ${column})`);
    }
  });
}, 30_000);

it("keeps nested and direct author call chains separate for later asset validation", async () => {
  await withWindowsSandbox("shared-diagnostics-calls", async ({ workspaceRoot }) => {
    const paths = await prepare(workspaceRoot);
    await writeFile(
      paths.shared,
      `import { showPicture, imageAsset } from "rpgmaker-event-dsl";
export function picture() {
  return showPicture({ pictureId: 1, image: imageAsset({ folder: "pictures", name: "Missing" }), origin: "upperLeft", position: { kind: "direct", x: 0, y: 0 }, scaleX: 100, scaleY: 100, opacity: 255, blendMode: "normal" });
}
export function inner() {
  return [picture()];
}
export const outer = () => inner();
`,
    );
    await writeFile(
      paths.entry,
      `import { commonEvent } from "rpgmaker-event-dsl";
import { picture, outer } from "./shared/commands.js";
export const event = commonEvent({ id: 10, name: "Calls", trigger: "none", commands: [
  picture(),
  ...outer(),
] });
`,
    );
    const output = await failure(workspaceRoot);
    const direct = output
      .split("\n")
      .find((line) => line.includes("CommonEvents.json[10].list[0]"));
    const nested = output
      .split("\n")
      .find((line) => line.includes("CommonEvents.json[10].list[1]"));
    expect(direct).toContain("commands.ts (line 3, column 10)");
    expect(direct).toContain("call picture:");
    expect(direct).toContain("diagnostics.events.ts (line 4, column 3)");
    expect(direct).not.toContain("call outer:");
    expect(nested).toContain("commands.ts (line 3, column 10)");
    expect(nested).toMatch(
      /call picture:.*commands.ts \(line 6, column 11\).*call inner:.*commands.ts \(line 8, column 28\).*call outer:.*diagnostics.events.ts \(line 5, column 6\)/u,
    );
    expect(nested).not.toContain("diagnostics.events.ts (line 4,");
  });
}, 30_000);
