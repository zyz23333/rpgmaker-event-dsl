import {
  lstat,
  mkdir,
  readFile,
  readdir,
  readlink,
  rename,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import { discoverDefinitionFiles, loadDefinitionFile } from "../src/workspace/definitions.js";
import {
  createMinimalProject,
  runCli,
  withWindowsSandbox as runWindowsSandbox,
  type WindowsSandbox,
} from "./support/windows-sandbox.js";
import { recordEvidence } from "./support/mv-evidence.js";
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

const discovery = {
  sourceRoot: "src",
  sourceInclude: ["**/*.events.ts", "**/*.dsl.ts"],
  sourceExclude: [],
};
async function prepare(workspaceRoot: string) {
  await createMinimalProject(workspaceRoot);
  await initWorkspace({ workspaceRoot, projectRoot: "./Game" });
  await cloneWorkspace({ workspaceRoot });
}
async function tree(directory: string): Promise<Record<string, string>> {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const result: Record<string, string> = {};
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name === "operation.lock") continue;
    const path = join(directory, entry.name);
    const stats = await lstat(path);
    if (stats.isSymbolicLink()) result[entry.name] = "link:" + (await readlink(path));
    else if (stats.isDirectory()) {
      result[entry.name + "/"] = "directory";
      for (const [name, content] of Object.entries(await tree(path)))
        result[entry.name + "/" + name] = content;
    } else result[entry.name] = (await readFile(path)).toString("hex");
  }
  return result;
}
async function state(workspaceRoot: string) {
  const metadata = await tree(join(workspaceRoot, ".rpgmaker-event-dsl"));
  for (const path of Object.keys(metadata))
    if (path === "operation.lock" || path.startsWith("decompile-candidates")) delete metadata[path];
  return {
    source: await tree(join(workspaceRoot, "src")),
    project: await tree(join(workspaceRoot, "Game")),
    metadata,
    config: await readFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8"),
    discovery: await discoverDefinitionFiles(workspaceRoot, discovery),
  };
}

async function withWindowsSandbox(label: string, body: (sandbox: WindowsSandbox) => Promise<void>) {
  await runWindowsSandbox(label, async (sandbox) => {
    const startedAt = new Date().toISOString();
    let failure: unknown;
    try {
      await body(sandbox);
    } catch (error) {
      failure = error;
      throw error;
    } finally {
      await recordEvidence({
        requirementId: expect.getState().currentTestName!.match(/MV-S4-DECOMPILE-\d+/u)![0],
        startedAt,
        stages: [
          "Public Workspace API/CLI; actual source Discovery, final-location TypeScript/evaluation, filesystem and process checkpoints",
        ],
        expected:
          "Only a complete validated candidate becomes discoverable, in one non-overwriting directory move; failures preserve source, Project Root, Snapshot, Generated, manifest and pending state",
        actual: {
          finalState: await state(sandbox.workspaceRoot),
          isolatedCandidates: await tree(
            join(sandbox.workspaceRoot, ".rpgmaker-event-dsl/decompile-candidates"),
          ),
          processes: sandbox.processes,
          entry: sandbox.cliEntry,
        },
        ...(failure === undefined ? {} : { error: failure }),
      });
    }
  });
}

it("MV-S4-DECOMPILE-001: checks existing Entry Identity without validating unrelated source payloads", async () => {
  await withWindowsSandbox("decompile-identity", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    const source = join(workspaceRoot, "src/existing.events.ts");
    const existing = (
      id: string,
    ) => `import { commonEvent as define, rawDslCommand, nonexistentCommand as missingCommand } from "rpgmaker-event-dsl";
const bad: number = "unrelated type error";
const base = { id: ${id} };
const value = define({ ...base, name: "Existing", trigger: "none", commands: [rawDslCommand({code:999,parameters:[],extra:true}), missingIdentifier, missingCommand({})] });
export { value as __proto__ };
`;
    await writeFile(source, existing("1"));
    const before = await state(workspaceRoot);
    await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(
      /MV-DECOMPILE-IDENTITY.*commonEvent:1/s,
    );
    expect(await state(workspaceRoot)).toStrictEqual(before);
    await writeFile(source, existing("missingCommand({})"));
    const unknownIdentityBefore = await state(workspaceRoot);
    await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(
      /MV-DECOMPILE-IDENTITY.*Unknown DSL helper nonexistentCommand/s,
    );
    expect(await state(workspaceRoot)).toStrictEqual(unknownIdentityBefore);
    await writeFile(source, existing("99"));
    await decompileWorkspace({ workspaceRoot });
    expect(
      (await loadDefinitionFile(join(workspaceRoot, "src/decompiled/common-events.events.ts")))[0],
    ).toMatchObject({ kind: "commonEvent", id: 1 });
    expect(await readFile(source, "utf8")).toBe(existing("99"));
  });
}, 30000);

it("MV-S4-DECOMPILE-015: unsupported sourceRoot and real publication I/O failures preserve all business state", async () => {
  await withWindowsSandbox("decompile-unsupported-and-io", async (sandbox) => {
    const { workspaceRoot } = sandbox;
    await prepare(workspaceRoot);
    const protectedPath = join(workspaceRoot, ".rpgmaker-event-dsl/decompile-candidates");
    await symlink(join(workspaceRoot, "src"), protectedPath, "junction");
    await expect(discoverDefinitionFiles(workspaceRoot, discovery)).rejects.toThrow(
      /Unsupported Decompile isolation directory/,
    );
    await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(
      /Unsupported Decompile isolation directory/,
    );
    await unlink(protectedPath);
    const configPath = join(workspaceRoot, "rpgmaker-event-dsl.config.json");
    const originalConfig = await readFile(configPath, "utf8");
    await writeFile(
      configPath,
      JSON.stringify({ ...JSON.parse(originalConfig), sourceRoot: "absent/nested-source" }),
    );
    const absentBefore = await state(workspaceRoot);
    await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(
      /existing directory|ENOENT/,
    );
    expect(await state(workspaceRoot)).toStrictEqual(absentBefore);
    await expect(lstat(join(workspaceRoot, "absent"))).rejects.toThrow();
    await writeFile(configPath, originalConfig);
    for (const boundary of ["decompile-write-failure", "decompile-move-unavailable"] as const) {
      const before = await state(workspaceRoot);
      const child = startWorkspaceOperation(sandbox, { operation: "decompile", boundary });
      try {
        expect(await child.waitFor("result")).toMatchObject({
          ok: false,
          message: expect.stringMatching(/candidate write failure|ENOENT/),
        });
        await child.ended;
        expect(await state(workspaceRoot)).toStrictEqual(before);
      } finally {
        await child.stop();
      }
    }
    await decompileWorkspace({ workspaceRoot });
    await compileWorkspace({ workspaceRoot, check: true });
  });
}, 30000);

it("MV-S4-DECOMPILE-016: pinned junction and physical parent resist external deletion and rename until the real move finishes", async () => {
  await withWindowsSandbox("decompile-pinned-alias", async (sandbox) => {
    const { workspaceRoot, root } = sandbox;
    await prepare(workspaceRoot);
    const physical = join(workspaceRoot, "src"),
      alias = join(workspaceRoot, "logical-source-alias");
    await symlink(physical, alias, "junction");
    const configPath = join(workspaceRoot, "rpgmaker-event-dsl.config.json");
    await writeFile(
      configPath,
      JSON.stringify({
        ...JSON.parse(await readFile(configPath, "utf8")),
        sourceRoot: "logical-source-alias",
      }),
    );
    const child = startWorkspaceOperation(sandbox, {
      operation: "decompile",
      boundary: "before-decompile-move",
    });
    try {
      await child.waitFor("checkpoint");
      await expect(unlink(alias)).rejects.toThrow();
      await expect(rename(physical, join(root, "renamed-physical"))).rejects.toThrow();
      await expect(rename(workspaceRoot, join(root, "renamed-workspace"))).rejects.toThrow();
      child.send("release");
      expect(await child.waitFor("result")).toMatchObject({ ok: true });
      await child.ended;
      expect(await readdir(join(physical, "decompiled"))).toStrictEqual([
        "common-events.events.ts",
        "system.dsl.ts",
        "troop-events.events.ts",
      ]);
      await unlink(alias);
      expect(
        await readFile(join(physical, "decompiled/common-events.events.ts"), "utf8"),
      ).toContain("Evidence Common Event");
      const moved = join(root, "renamed-physical");
      await rename(physical, moved);
      await rename(moved, physical);
    } finally {
      await child.stop();
    }
  });
}, 30000);

it.each(["absolute", "junction", "parent-relative"])(
  "MV-S4-DECOMPILE-014: publishes through a supported same-filesystem custom sourceRoot (%s)",
  async (kind) => {
    await withWindowsSandbox("decompile-custom-" + kind, async (sandbox) => {
      const { workspaceRoot } = sandbox;
      await prepare(workspaceRoot);
      let sourceRoot = join(workspaceRoot, "src");
      if (kind === "junction") {
        const alias = join(workspaceRoot, "源码 alias '$ chars");
        await symlink(sourceRoot, alias, "junction");
        sourceRoot = alias.slice(workspaceRoot.length + 1);
      }
      if (kind === "parent-relative")
        sourceRoot = "../" + workspaceRoot.split(/[\\/]/u).at(-1) + "/src";
      const configPath = join(workspaceRoot, "rpgmaker-event-dsl.config.json");
      const config = JSON.parse(await readFile(configPath, "utf8"));
      await writeFile(configPath, JSON.stringify({ ...config, sourceRoot }));
      const before = await state(workspaceRoot);
      await runCli(sandbox, ["decompile"]);
      const files = await discoverDefinitionFiles(workspaceRoot, { ...discovery, sourceRoot });
      expect(files.length).toBe(3);
      expect(files.every((file) => file.includes("decompiled"))).toBe(true);
      await runCli(sandbox, ["compile", "--check"]);
      await runCli(sandbox, ["compile"]);
      const fixture = JSON.parse(
        await readFile(
          new URL("./fixtures/mv-evidence/common-event-project.json", import.meta.url),
          "utf8",
        ),
      );
      for (const name of ["CommonEvents.json", "System.json"])
        expect(
          JSON.parse(
            await readFile(
              join(workspaceRoot, ".rpgmaker-event-dsl/generated-project-data", name),
              "utf8",
            ),
          ),
        ).toStrictEqual(fixture.projectFiles[name]);
      const after = await state(workspaceRoot);
      expect(after.project).toStrictEqual(before.project);
      expect(
        await tree(join(workspaceRoot, ".rpgmaker-event-dsl/project-data-snapshot")),
      ).toStrictEqual(
        Object.fromEntries(
          Object.entries(before.metadata)
            .filter(([path]) => path.startsWith("project-data-snapshot/") && !path.endsWith("/"))
            .map(([path, value]) => [path.slice("project-data-snapshot/".length), value]),
        ),
      );
    });
  },
  30000,
);

it("MV-S4-DECOMPILE-010: every planned file including empty modules must match full Discovery rules", async () => {
  await withWindowsSandbox("decompile-full-discovery", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    await writeFile(
      join(workspaceRoot, "Game/data/MapInfos.json"),
      '[null,{"id":1,"name":"Empty map"}]',
    );
    await writeFile(join(workspaceRoot, "Game/data/Map001.json"), '{"events":[null]}');
    await cloneWorkspace({ workspaceRoot });
    const configPath = join(workspaceRoot, "rpgmaker-event-dsl.config.json");
    const config = JSON.parse(await readFile(configPath, "utf8"));
    for (const rules of [
      { sourceInclude: ["**/*.events.ts"], sourceExclude: [] },
      { sourceInclude: ["**/*.events.ts", "**/*.dsl.ts"], sourceExclude: ["decompiled"] },
      { sourceInclude: [], sourceExclude: ["decompiled/**"] },
      { sourceInclude: ["**/*"], sourceExclude: ["**/system.dsl.ts"] },
      { sourceInclude: ["**/*"], sourceExclude: ["decompiled/maps"] },
    ]) {
      await writeFile(configPath, JSON.stringify({ ...config, ...rules }));
      const before = await state(workspaceRoot);
      await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(
        /excluded from Definition Source Discovery/,
      );
      expect(await state(workspaceRoot)).toStrictEqual(before);
    }
    await writeFile(
      configPath,
      JSON.stringify({ ...config, sourceInclude: [], sourceExclude: [] }),
    );
    await decompileWorkspace({ workspaceRoot });
    expect(
      (await discoverDefinitionFiles(workspaceRoot, { ...discovery, sourceInclude: [] })).length,
    ).toBe(4);
    expect(
      await readFile(join(workspaceRoot, "src/decompiled/maps/Map001.events.ts"), "utf8"),
    ).toBe("export {};\n");
  });
}, 30000);

it("MV-S4-DECOMPILE-011: direct object and namespace identities preserve spread and export alias semantics", async () => {
  await withWindowsSandbox("decompile-direct-identity", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    const path = join(workspaceRoot, "src/existing.events.ts");
    for (const source of [
      'const base = {kind:"commonEvent",id:99}; const value = {...base,id:1,commands:missingIdentifier}; export {value as __proto__};',
      'import * as dsl from "rpgmaker-event-dsl"; const define = dsl.commonEvent; export const value = define({id:1,commands:missingIdentifier});',
      'const identity = {value:1}; export const value = {kind:"commonEvent",id:identity.value,pages:missingIdentifier};',
    ]) {
      await writeFile(path, source);
      const before = await state(workspaceRoot);
      await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(
        /candidate conflicts with existing commonEvent:1/,
      );
      expect(await state(workspaceRoot)).toStrictEqual(before);
    }
    await writeFile(path, 'export const value = {kind:"commonEvent",id:missingIdentifier};');
    const before = await state(workspaceRoot);
    await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(
      /MV-DECOMPILE-IDENTITY.*Unresolved/s,
    );
    expect(await state(workspaceRoot)).toStrictEqual(before);
    const helperSpread =
      'import {commonEvent} from "rpgmaker-event-dsl"; export const value = {mapId:7,...commonEvent({id:99,commands:missingIdentifier}),kind:"mapEvent"};';
    await writeFile(path, helperSpread);
    await decompileWorkspace({ workspaceRoot });
    expect(await readFile(path, "utf8")).toBe(helperSpread);
  });
}, 30000);

it("MV-S4-DECOMPILE-012: existing source cannot supply a target omitted from the complete candidate", async () => {
  await withWindowsSandbox("decompile-owned-reference", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    const common = join(workspaceRoot, "Game/data/CommonEvents.json");
    const events = JSON.parse(await readFile(common, "utf8"));
    events[1].list = [
      { code: 117, indent: 0, parameters: [2] },
      { code: 0, indent: 0, parameters: [] },
    ];
    await writeFile(common, JSON.stringify(events));
    await cloneWorkspace({ workspaceRoot });
    await writeFile(
      join(workspaceRoot, "src/existing.events.ts"),
      'export const target = {kind:"commonEvent",id:2,name:"Old target",commands:[]};',
    );
    const before = await state(workspaceRoot);
    await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(
      /commonEvent.*2|Common Event.*2/i,
    );
    expect(await state(workspaceRoot)).toStrictEqual(before);
  });
}, 30000);

it.each([
  "source",
  "discovery",
  "config",
  "snapshot",
  "dependency",
  "candidate-bytes",
  "candidate-membership",
  "candidate-replacement",
])(
  "MV-S4-DECOMPILE-013: rejects captured input or isolated candidate changes (%s)",
  async (kind) => {
    await withWindowsSandbox("decompile-input-" + kind, async (sandbox) => {
      const { workspaceRoot } = sandbox;
      await prepare(workspaceRoot);
      const source = join(workspaceRoot, "src/existing.events.ts");
      await writeFile(source, 'export const old = {kind:"commonEvent",id:99};');
      const child = startWorkspaceOperation(sandbox, {
        operation: "decompile",
        boundary: "decompile-stage",
      });
      try {
        await child.waitFor("checkpoint");
        if (kind === "source")
          await writeFile(source, 'export const old = {kind:"commonEvent",id:98};');
        if (kind === "discovery")
          await writeFile(join(workspaceRoot, "src/new.events.ts"), "export {};");
        if (kind === "config") {
          const path = join(workspaceRoot, "rpgmaker-event-dsl.config.json");
          await writeFile(path, (await readFile(path, "utf8")) + "\n");
        }
        if (kind === "snapshot")
          await writeFile(
            join(workspaceRoot, ".rpgmaker-event-dsl/project-data-snapshot/Actors.json"),
            '[null,{"id":1,"name":"Changed"}]',
          );
        if (kind === "dependency") {
          const path = join(workspaceRoot, "node_modules/rpgmaker-event-dsl/package.json");
          await writeFile(path, (await readFile(path, "utf8")) + "\n");
        }
        if (kind.startsWith("candidate")) {
          const root = join(workspaceRoot, ".rpgmaker-event-dsl/decompile-candidates");
          const candidate = join(root, (await readdir(root))[0]!);
          if (kind === "candidate-replacement") {
            await rename(candidate, candidate + "-original");
            await mkdir(candidate);
            await writeFile(
              join(candidate, "common-events.events.ts"),
              await readFile(join(candidate + "-original", "common-events.events.ts")),
            );
          } else
            await writeFile(
              join(
                candidate,
                kind === "candidate-bytes" ? "common-events.events.ts" : "extra.events.ts",
              ),
              "external changed bytes",
            );
        }
        const before = await state(workspaceRoot);
        child.send("release");
        expect(await child.waitFor("result")).toMatchObject({
          ok: false,
          message: expect.stringMatching(
            /Inputs changed|candidate bytes changed|candidate membership changed|candidate directory changed/,
          ),
        });
        await child.ended;
        expect(await state(workspaceRoot)).toStrictEqual(before);
      } finally {
        await child.stop();
      }
    });
  },
  30000,
);

it.each(["empty-directory", "nonempty-directory", "file", "junction", "dangling-junction"])(
  "MV-S4-DECOMPILE-007: refuses external destination occupation after final validation (%s)",
  async (kind) => {
    await withWindowsSandbox("decompile-race-" + kind, async (sandbox) => {
      const { workspaceRoot, root } = sandbox;
      await prepare(workspaceRoot);
      const child = startWorkspaceOperation(sandbox, {
        operation: "decompile",
        boundary: "before-decompile-move",
      });
      try {
        await child.waitFor("checkpoint");
        // Actual OS handles must refuse parent substitution while allowing the child move.
        await expect(
          rename(join(workspaceRoot, "src"), join(root, "moved-source-root")),
        ).rejects.toThrow();
        const target = join(workspaceRoot, "src/decompiled");
        if (kind.includes("directory")) {
          await mkdir(target);
          if (kind === "nonempty-directory")
            await writeFile(join(target, "external.txt"), "external bytes");
        } else if (kind === "file") await writeFile(target, "external bytes");
        else {
          const external = join(root, "external-target");
          if (kind === "junction") {
            await mkdir(external);
            await writeFile(join(external, "external.txt"), "external bytes");
          }
          await symlink(external, target, "junction");
        }
        const before = await state(workspaceRoot);
        child.send("release");
        expect(await child.waitFor("result")).toMatchObject({
          ok: false,
          message: expect.stringMatching(/directory publication failed/i),
        });
        await child.ended;
        expect(await state(workspaceRoot)).toStrictEqual(before);
      } finally {
        await child.stop();
      }
    });
  },
  30000,
);

it("MV-S4-DECOMPILE-008: killed partial staging stays outside actual Discovery and a retry publishes the complete batch", async () => {
  await withWindowsSandbox("decompile-killed-stage", async (sandbox) => {
    const { workspaceRoot } = sandbox;
    await prepare(workspaceRoot);
    const before = await state(workspaceRoot);
    const child = startWorkspaceOperation(sandbox, {
      operation: "decompile",
      boundary: "decompile-stage",
    });
    try {
      await child.waitFor("checkpoint");
      expect(await state(workspaceRoot)).toStrictEqual(before);
      expect(
        await discoverDefinitionFiles(workspaceRoot, {
          sourceRoot: ".",
          sourceInclude: ["**/*.events.ts", "**/*.dsl.ts"],
          sourceExclude: ["node_modules"],
        }),
      ).toStrictEqual([]);
      await child.stop();
      expect(await state(workspaceRoot)).toStrictEqual(before);
      await decompileWorkspace({ workspaceRoot });
      expect(await readdir(join(workspaceRoot, "src/decompiled"))).toStrictEqual([
        "common-events.events.ts",
        "system.dsl.ts",
        "troop-events.events.ts",
      ]);
      await compileWorkspace({ workspaceRoot, check: true });
    } finally {
      await child.stop();
    }
  });
}, 30000);

it("MV-S4-DECOMPILE-009: lost success after the real directory move preserves the complete batch and retry reports existing destination", async () => {
  await withWindowsSandbox("decompile-killed-published", async (sandbox) => {
    const { workspaceRoot } = sandbox;
    await prepare(workspaceRoot);
    const child = startWorkspaceOperation(sandbox, {
      operation: "decompile",
      boundary: "after-decompile-move",
    });
    try {
      await child.waitFor("checkpoint");
      expect(await readdir(join(workspaceRoot, "src/decompiled"))).toStrictEqual([
        "common-events.events.ts",
        "system.dsl.ts",
        "troop-events.events.ts",
      ]);
      const published = await state(workspaceRoot);
      await child.stop();
      await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(/destination.*exists/i);
      expect(await state(workspaceRoot)).toStrictEqual(published);
      await compileWorkspace({ workspaceRoot, check: true });
    } finally {
      await child.stop();
    }
  });
}, 30000);

it("MV-S4-DECOMPILE-006: refuses sourceRoot replacement after capture before publication", async () => {
  await withWindowsSandbox("decompile-source-root-swap", async (sandbox) => {
    const { workspaceRoot } = sandbox;
    await prepare(workspaceRoot);
    const child = startWorkspaceOperation(sandbox, {
      operation: "decompile",
      boundary: "decompile-stage",
    });
    try {
      await child.waitFor("checkpoint");
      await rename(join(workspaceRoot, "src"), join(workspaceRoot, "original-src"));
      await mkdir(join(workspaceRoot, "src"));
      const before = await state(workspaceRoot);
      child.send("release");
      expect(await child.waitFor("result")).toMatchObject({
        ok: false,
        message: expect.stringMatching(/path changed|Inputs changed/),
      });
      await child.ended;
      expect(await state(workspaceRoot)).toStrictEqual(before);
    } finally {
      await child.stop();
    }
  });
}, 30000);

it("MV-S4-DECOMPILE-005: permanently excludes isolated remnants through broad and explicit junction Discovery", async () => {
  await withWindowsSandbox("decompile-protected-discovery", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    const protectedRoot = join(workspaceRoot, ".rpgmaker-event-dsl/decompile-candidates");
    await mkdir(join(protectedRoot, "killed-candidate"), { recursive: true });
    await writeFile(
      join(protectedRoot, "killed-candidate/partial.events.ts"),
      "malformed source never eligible",
    );
    await symlink(protectedRoot, join(workspaceRoot, "alias"), "junction");
    const rules = {
      sourceRoot: ".",
      sourceInclude: ["**/*.events.ts", "**/*.dsl.ts", "alias/killed-candidate/partial.events.ts"],
      sourceExclude: ["node_modules"],
    };
    expect(await discoverDefinitionFiles(workspaceRoot, rules)).toStrictEqual([]);
    const configPath = join(workspaceRoot, "rpgmaker-event-dsl.config.json");
    const config = JSON.parse(await readFile(configPath, "utf8"));
    await writeFile(configPath, JSON.stringify({ ...config, ...rules }));
    await decompileWorkspace({ workspaceRoot });
    expect(
      (await discoverDefinitionFiles(workspaceRoot, rules)).map((file) =>
        file.slice(workspaceRoot.length),
      ),
    ).toStrictEqual([
      "\\decompiled\\common-events.events.ts",
      "\\decompiled\\system.dsl.ts",
      "\\decompiled\\troop-events.events.ts",
    ]);
    expect(await readFile(join(protectedRoot, "killed-candidate/partial.events.ts"), "utf8")).toBe(
      "malformed source never eligible",
    );
  });
}, 30000);

it.each(["empty-directory", "nonempty-directory", "file", "junction", "dangling-junction"])(
  "MV-S4-DECOMPILE-004: refuses the entire existing destination (%s)",
  async (kind) => {
    await withWindowsSandbox("decompile-existing-" + kind, async ({ workspaceRoot, root }) => {
      await prepare(workspaceRoot);
      const target = join(workspaceRoot, "src/decompiled");
      if (kind.includes("directory")) {
        await mkdir(target);
        if (kind === "nonempty-directory")
          await writeFile(join(target, "external.txt"), "external bytes");
      } else if (kind === "file") await writeFile(target, "external bytes");
      else {
        const external = join(root, "external-target");
        if (kind === "junction") {
          await mkdir(external);
          await writeFile(join(external, "external.txt"), "external bytes");
        }
        await symlink(external, target, "junction");
      }
      const before = await state(workspaceRoot);
      await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(/destination.*exists/i);
      expect(await state(workspaceRoot)).toStrictEqual(before);
    });
  },
  30000,
);

it("MV-S4-DECOMPILE-003: refuses an unresolved identity after an own undefined spread overrides an earlier id", async () => {
  await withWindowsSandbox("decompile-identity-spread", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    await writeFile(
      join(workspaceRoot, "src/existing.events.ts"),
      `import * as dsl from "rpgmaker-event-dsl";
const overwritten = { id: undefined };
const value = dsl.commonEvent({ id: 99, ...overwritten, commands: missingIdentifier });
export { value as __proto__ };
`,
    );
    const before = await state(workspaceRoot);
    await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(
      /MV-DECOMPILE-IDENTITY.*invalid Entry Identity/s,
    );
    expect(await state(workspaceRoot)).toStrictEqual(before);
  });
}, 30000);

it("MV-S4-DECOMPILE-002: validates every candidate against dependencies at its final location", async () => {
  await withWindowsSandbox("decompile-final-types", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    const packageRoot = join(workspaceRoot, "src/node_modules/rpgmaker-event-dsl");
    await mkdir(packageRoot, { recursive: true });
    await writeFile(
      join(packageRoot, "package.json"),
      JSON.stringify({
        name: "rpgmaker-event-dsl",
        type: "module",
        exports: { ".": { types: "./index.d.ts" } },
      }),
    );
    const declarations = (type: string) =>
      ["commonEvent", "switchDefinition", "variableDefinition", "showText", "comment"]
        .map((name) => `export declare function ${name}(input:${type}):any;`)
        .join("\n");
    await writeFile(join(packageRoot, "index.d.ts"), declarations("never"));
    const before = await state(workspaceRoot);
    await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(
      /TypeScript diagnostics failed.*decompiled/s,
    );
    expect(await state(workspaceRoot)).toStrictEqual(before);
    await writeFile(join(packageRoot, "index.d.ts"), declarations("any"));
    await writeFile(join(workspaceRoot, "src/package.json"), '{"type":"commonjs"}');
    const commonjsBefore = await state(workspaceRoot);
    await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(
      /TypeScript diagnostics failed.*decompiled.*CommonJS/s,
    );
    expect(await state(workspaceRoot)).toStrictEqual(commonjsBefore);
    await writeFile(join(workspaceRoot, "src/package.json"), '{"type":"module"}');
    await decompileWorkspace({ workspaceRoot });
    expect(
      (await discoverDefinitionFiles(workspaceRoot, discovery)).map((file) =>
        file.slice(workspaceRoot.length),
      ),
    ).toStrictEqual([
      "\\src\\decompiled\\common-events.events.ts",
      "\\src\\decompiled\\system.dsl.ts",
      "\\src\\decompiled\\troop-events.events.ts",
    ]);
  });
}, 30000);
