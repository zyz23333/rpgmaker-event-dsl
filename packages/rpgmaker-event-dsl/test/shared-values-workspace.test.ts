import { mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { expect, it } from "vitest";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { createMinimalProject, runCli, withWindowsSandbox } from "./support/windows-sandbox.js";

const api: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);

async function prepare(workspaceRoot: string) {
  await createMinimalProject(workspaceRoot);
  await api.initWorkspace({ workspaceRoot, projectRoot: "./Game" });
  await api.cloneWorkspace({ workspaceRoot });
  await api.decompileWorkspace({ workspaceRoot });
  const shared = join(workspaceRoot, "src/shared");
  await mkdir(shared);
  return {
    shared,
    first: join(workspaceRoot, "src/decompiled/common-events.events.ts"),
    second: join(workspaceRoot, "src/second.events.ts"),
    state: join(workspaceRoot, ".rpgmaker-event-dsl"),
  };
}

it("compiles shared named values in two Definition Sources without collecting helper exports", async () => {
  await withWindowsSandbox("shared-values", async ({ workspaceRoot }) => {
    const paths = await prepare(workspaceRoot);
    await writeFile(
      join(paths.shared, "commands.ts"),
      `import { comment, commonEventRef } from "rpgmaker-event-dsl";
const settings = { trigger: "none" } as const;
const commands = [comment({ lines: ["Shared message"] })];
export { settings as commonSettings, commands };
export const target = commonEventRef({ id: 1 });
`,
    );
    await writeFile(
      paths.first,
      `import { commonEvent } from "rpgmaker-event-dsl";
import { commands as shared, commonSettings } from "../shared/commands.js";
export const first = commonEvent({ ...commonSettings, id: 1, name: "First", commands: [...shared] });
`,
    );
    await writeFile(
      paths.second,
      `import { callCommonEvent, commonEvent } from "rpgmaker-event-dsl";
import { commands, commonSettings, target } from "./shared/commands.js";
export const second = commonEvent({ ...commonSettings, id: 2, name: "Second", commands: [...commands, callCommonEvent({ commonEvent: target })] });
`,
    );
    const manifest = await readFile(join(paths.state, "sync-manifest.json"), "utf8");
    await api.compileWorkspace({ workspaceRoot, check: true });
    expect(await readFile(join(paths.state, "sync-manifest.json"), "utf8")).toBe(manifest);
    expect(await api.isGeneratedProjectDataFresh({ workspaceRoot })).toBe(false);
    await api.compileWorkspace({ workspaceRoot, check: false });
    const commonEvents = JSON.parse(
      await readFile(join(paths.state, "generated-project-data/CommonEvents.json"), "utf8"),
    );
    expect(commonEvents).toHaveLength(3);
    expect(commonEvents[1].list).toEqual([
      { code: 108, indent: 0, parameters: ["Shared message"] },
      { code: 0, indent: 0, parameters: [] },
    ]);
    expect(commonEvents[2].list).toEqual([
      { code: 108, indent: 0, parameters: ["Shared message"] },
      { code: 117, indent: 0, parameters: [1] },
      { code: 0, indent: 0, parameters: [] },
    ]);
    await writeFile(
      join(paths.shared, "commands.ts"),
      (await readFile(join(paths.shared, "commands.ts"), "utf8")).replace(
        "Shared message",
        "Changed directly",
      ),
    );
    expect(await api.isGeneratedProjectDataFresh({ workspaceRoot })).toBe(false);
  });
}, 30_000);

it.each([
  {
    label: "an internal dependency type error",
    source: 'const bad: number = "wrong"; export const name = "Name";',
    imported: 'import { name } from "../shared/bad.js";',
    expected: /bad\.ts:1:7.*not assignable/isu,
  },
  {
    label: "a missing named export",
    source: 'export const other = "Name";',
    imported: 'import { name } from "../shared/bad.js";',
    expected: /common-events\.events\.ts:2:.*no exported member/isu,
  },
  {
    label: "a local namespace import",
    source: 'export const name = "Name";',
    imported: 'import * as shared from "../shared/bad.js"; const name = shared.name;',
    expected: /common-events\.events\.ts:2:1.*Only named local value imports/isu,
  },
  {
    label: "a local default import",
    source: 'export default "Name";',
    imported: 'import name from "../shared/bad.js";',
    expected: /common-events\.events\.ts:2:1.*Only named local value imports/isu,
  },
  {
    label: "a default value import combined with type-only named imports",
    source: 'export type Named = string; export default "Ignored";',
    imported: 'import ignored, { type Named } from "../shared/bad.js"; const name: Named = "Name";',
    expected: /common-events\.events\.ts:2:1.*Only named local value imports/isu,
  },
  {
    label: "a module re-export",
    source: 'export { name } from "./leaf.js";',
    imported: 'import { name } from "../shared/bad.js";',
    expected: /bad\.ts:1:1.*Re-exporting/isu,
  },
])(
  "rejects $label without changing generated or project data",
  async ({ source, imported, expected }) => {
    await withWindowsSandbox("shared-rejection", async ({ workspaceRoot }) => {
      const paths = await prepare(workspaceRoot);
      await api.compileWorkspace({ workspaceRoot, check: false });
      const generated = join(paths.state, "generated-project-data/CommonEvents.json");
      const project = join(workspaceRoot, "Game/data/CommonEvents.json");
      const manifest = join(paths.state, "sync-manifest.json");
      const before = await Promise.all(
        [generated, project, manifest].map((path) => readFile(path, "utf8")),
      );
      await writeFile(join(paths.shared, "leaf.ts"), 'export const name = "Leaf";');
      await writeFile(join(paths.shared, "bad.ts"), source);
      await writeFile(
        paths.first,
        `import { commonEvent } from "rpgmaker-event-dsl";
${imported}
export const event = commonEvent({ id: 1, name, trigger: "none", commands: [] });`,
      );
      await expect(api.compileWorkspace({ workspaceRoot, check: true })).rejects.toThrow(expected);
      expect(
        await Promise.all([generated, project, manifest].map((path) => readFile(path, "utf8"))),
      ).toEqual(before);
    });
  },
  30_000,
);

it("rejects a shared module whose directory alias escapes sourceRoot", async () => {
  await withWindowsSandbox("shared-outside-alias", async (sandbox) => {
    const paths = await prepare(sandbox.workspaceRoot);
    const external = join(sandbox.root, "external");
    await mkdir(external);
    await writeFile(join(external, "value.ts"), 'export const name = "Outside";');
    await symlink(external, join(paths.shared, "outside"), "junction");
    await writeFile(
      paths.first,
      `import { commonEvent } from "rpgmaker-event-dsl";
import { name } from "../shared/outside/value.js";
export const event = commonEvent({ id: 1, name, trigger: "none", commands: [] });`,
    );
    await expect(api.compileWorkspace({ ...sandbox, check: true })).rejects.toThrow(
      /outside sourceRoot/iu,
    );
  });
}, 30_000);

it("keeps diamond dependencies separate from Discovery and invalidates stale generated data", async () => {
  await withWindowsSandbox("shared-discovery-and-freshness", async ({ workspaceRoot }) => {
    const paths = await prepare(workspaceRoot);
    const leaf = join(paths.shared, "leaf.ts");
    await writeFile(leaf, 'export { message }; const message = "Before";');
    for (const [file, exportName] of [
      ["left.ts", "left"],
      ["right.test.ts", "right"],
    ] as const) {
      await writeFile(
        join(paths.shared, file),
        `import { comment } from "rpgmaker-event-dsl";
import { message } from "./leaf.js";
export const ${exportName} = comment({ lines: [message] });`,
      );
    }
    const discovered = join(paths.shared, "group.events.ts");
    await writeFile(
      discovered,
      `import { commonEvent } from "rpgmaker-event-dsl";
import { left } from "./left.js";
import { right } from "./right.test.js";
export const commands = [left, right];
export const third = commonEvent({ id: 3, name: "Third", trigger: "none", commands: [] });`,
    );
    await writeFile(join(paths.shared, "orphan.ts"), 'throw new Error("Unloaded module");');
    for (const [file, id, moduleName] of [
      [paths.first, 1, "../shared/group.events.js"],
      [paths.second, 2, "./shared/group.events.js"],
    ] as const) {
      await writeFile(
        file,
        `import { commonEvent } from "rpgmaker-event-dsl";
import { commands } from "${moduleName}";
export const event = commonEvent({ id: ${id}, name: "Shared event", trigger: "none", commands: [...commands] });`,
      );
    }
    const generated = join(paths.state, "generated-project-data/CommonEvents.json");
    const project = join(workspaceRoot, "Game/data/CommonEvents.json");
    await api.compileWorkspace({ workspaceRoot, check: false });
    const events = JSON.parse(await readFile(generated, "utf8"));
    expect(events).toHaveLength(4);
    expect(events[1].list).toEqual([
      { code: 108, indent: 0, parameters: ["Before"] },
      { code: 108, indent: 0, parameters: ["Before"] },
      { code: 0, indent: 0, parameters: [] },
    ]);
    expect(events[2].list).toEqual(events[1].list);
    expect(events[3].list).toEqual([{ code: 0, indent: 0, parameters: [] }]);
    expect(await api.isGeneratedProjectDataFresh({ workspaceRoot })).toBe(true);
    await api.pushWorkspace({ workspaceRoot, allowDestructive: false });
    const before = await readFile(project, "utf8");
    await writeFile(leaf, 'export { message }; const message = "After";');
    expect(await api.isGeneratedProjectDataFresh({ workspaceRoot })).toBe(false);
    await expect(api.diffWorkspace({ workspaceRoot })).rejects.toThrow(/stale/iu);
    await expect(api.pushWorkspace({ workspaceRoot, allowDestructive: false })).rejects.toThrow(
      /stale/iu,
    );
    expect(await readFile(project, "utf8")).toBe(before);
    const previousGenerated = await readFile(generated, "utf8");
    const previousManifest = await readFile(join(paths.state, "sync-manifest.json"), "utf8");
    await api.compileWorkspace({ workspaceRoot, check: true });
    expect(await readFile(generated, "utf8")).toBe(previousGenerated);
    expect(await readFile(join(paths.state, "sync-manifest.json"), "utf8")).toBe(previousManifest);
    expect(await api.isGeneratedProjectDataFresh({ workspaceRoot })).toBe(false);
    await api.compileWorkspace({ workspaceRoot, check: false });
    await api.diffWorkspace({ workspaceRoot });
    await api.pushWorkspace({ workspaceRoot, allowDestructive: false });
    const updated = JSON.parse(await readFile(project, "utf8"));
    expect(updated[1].list).toEqual([
      { code: 108, indent: 0, parameters: ["After"] },
      { code: 108, indent: 0, parameters: ["After"] },
      { code: 0, indent: 0, parameters: [] },
    ]);
    expect(updated[2].list).toEqual(updated[1].list);
    await writeFile(
      discovered,
      (await readFile(discovered, "utf8")).replace('name: "Third"', 'name: "Changed third"'),
    );
    expect(await api.isGeneratedProjectDataFresh({ workspaceRoot })).toBe(false);
  });
}, 60_000);

it("reports an unsupported shared statement at its actual source position", async () => {
  await withWindowsSandbox("shared-statement-position", async ({ workspaceRoot }) => {
    const paths = await prepare(workspaceRoot);
    await writeFile(join(paths.shared, "bad.ts"), 'let name = "Mutable"; export { name };');
    await writeFile(
      paths.first,
      `import { commonEvent } from "rpgmaker-event-dsl";
import { name } from "../shared/bad.js";
export const event = commonEvent({ id: 1, name, trigger: "none", commands: [] });`,
    );
    await expect(api.compileWorkspace({ workspaceRoot, check: true })).rejects.toThrow(
      /bad\.ts:1:1.*Only const bindings/isu,
    );
  });
}, 30_000);

it("never invokes host functions obtained through a shared value", async () => {
  await withWindowsSandbox("shared-host-functions", async ({ workspaceRoot }) => {
    const paths = await prepare(workspaceRoot);
    await writeFile(
      join(paths.shared, "host.ts"),
      `const create = ({}.constructor.constructor as any);
const run = create('throw new Error("HOST EXECUTED")');
export const name = run();`,
    );
    await writeFile(
      paths.first,
      `import { commonEvent } from "rpgmaker-event-dsl";
import { name } from "../shared/host.js";
export const event = commonEvent({ id: 1, name, trigger: "none", commands: [] });`,
    );
    await expect(api.compileWorkspace({ workspaceRoot, check: true })).rejects.toThrow(
      /Only DSL helper calls are allowed/iu,
    );
  });
}, 30_000);

it("keeps inline type-only imports and exports outside the value-module graph", async () => {
  await withWindowsSandbox("shared-types", async ({ workspaceRoot }) => {
    const paths = await prepare(workspaceRoot);
    await mkdir(join(workspaceRoot, "types"));
    await writeFile(
      join(workspaceRoot, "types/name.ts"),
      'throw new Error("Type module executed"); export type Name = "Typed shared value";',
    );
    await writeFile(
      join(paths.shared, "typed.ts"),
      `import { type Name } from "../../types/name.js";
const name: Name = "Typed shared value";
export { type Name, name };`,
    );
    await writeFile(
      paths.first,
      `import { commonEvent } from "rpgmaker-event-dsl";
import { name } from "../shared/typed.js";
export const event = commonEvent({ id: 1, name, trigger: "none", commands: [] });`,
    );
    await api.compileWorkspace({ workspaceRoot, check: false });
    const events = JSON.parse(
      await readFile(join(paths.state, "generated-project-data/CommonEvents.json"), "utf8"),
    );
    expect(events[1].name).toBe("Typed shared value");
  });
}, 30_000);

it("refuses shared values from the Decompile isolation area through a directory alias", async () => {
  await withWindowsSandbox("shared-isolation", async ({ workspaceRoot }) => {
    const paths = await prepare(workspaceRoot);
    const configPath = join(workspaceRoot, "rpgmaker-event-dsl.config.json");
    const config = JSON.parse(await readFile(configPath, "utf8"));
    await writeFile(configPath, JSON.stringify({ ...config, sourceRoot: "." }));
    const isolated = join(paths.state, "decompile-candidates");
    await mkdir(isolated, { recursive: true });
    await writeFile(join(isolated, "value.ts"), 'export const name = "Isolated";');
    await symlink(isolated, join(paths.shared, "alias"), "junction");
    await writeFile(
      paths.first,
      `import { commonEvent } from "rpgmaker-event-dsl";
import { name } from "../shared/alias/value.js";
export const event = commonEvent({ id: 1, name, trigger: "none", commands: [] });`,
    );
    await expect(api.compileWorkspace({ workspaceRoot, check: true })).rejects.toThrow(
      /common-events\.events\.ts:2:1.*isolation/isu,
    );
  });
}, 30_000);

it("rejects value-module cycles with the module chain instead of hanging", async () => {
  await withWindowsSandbox("shared-value-cycle", async (sandbox) => {
    const paths = await prepare(sandbox.workspaceRoot);
    await writeFile(
      join(paths.shared, "a.ts"),
      'import { b } from "./b.js"; export const a = "A";',
    );
    await writeFile(
      join(paths.shared, "b.ts"),
      'import { a } from "./a.js"; export const b = "B";',
    );
    await writeFile(
      paths.first,
      `import { commonEvent } from "rpgmaker-event-dsl";
import { a } from "../shared/a.js";
export const event = commonEvent({ id: 1, name: a, trigger: "none", commands: [] });`,
    );
    const result = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toMatch(/value.module cycle.*a\.ts.*b\.ts.*a\.ts/is);
  });
}, 30_000);
