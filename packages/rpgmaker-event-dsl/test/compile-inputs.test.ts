import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { expect, it } from "vitest";
import {
  startWorkspaceOperation,
  workspaceApiEntry,
} from "./support/workspace-operation-process.js";
import {
  createMinimalProject,
  runCli,
  withWindowsSandbox as runSandbox,
  type WindowsSandbox,
} from "./support/windows-sandbox.js";
import { recordEvidence } from "./support/mv-evidence.js";

const api: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);

async function tree(root: string): Promise<Record<string, string> | null> {
  const entries = await readdir(root, { withFileTypes: true }).catch((error: unknown) => {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return null;
    throw error;
  });
  if (entries === null) return null;
  const result: Record<string, string> = {};
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      for (const [name, value] of Object.entries((await tree(path))!))
        result[`${entry.name}/${name}`] = value;
    } else result[entry.name] = (await readFile(path)).toString("hex");
  }
  return result;
}

async function observe(workspaceRoot: string) {
  const state = join(workspaceRoot, ".rpgmaker-event-dsl");
  const source = await tree(join(workspaceRoot, "src"));
  return {
    config: await readFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8"),
    source,
    discoveryCandidates: Object.keys(source ?? {}).filter((name) =>
      /\.(events|dsl)\.ts$/u.test(name),
    ),
    dependencies: await tree(join(workspaceRoot, "types")),
    packageMetadata: await readFile(join(workspaceRoot, "package.json"), "utf8"),
    project: await tree(join(workspaceRoot, "Game")),
    snapshot: await tree(join(state, "project-data-snapshot")),
    generated: await tree(join(state, "generated-project-data")),
    manifest: await readFile(join(state, "sync-manifest.json"), "utf8"),
    pending: await tree(join(state, "pending-push")),
  };
}

const labels = [
  "type-dependency",
  "compile-input-race",
  "resolution-inputs",
  "compile-collection-race",
  "compile-config-race",
  "decompile-input-race",
  "contract-version",
  "restricted-imports",
];
async function withWindowsSandbox(label: string, body: (sandbox: WindowsSandbox) => Promise<void>) {
  await runSandbox(label, async (sandbox) => {
    const startedAt = new Date().toISOString();
    let failure: unknown;
    try {
      await body(sandbox);
    } catch (error) {
      failure = error;
      throw error;
    } finally {
      await recordEvidence({
        requirementId: `MV-S4-INPUT-${String(labels.indexOf(label) + 1).padStart(3, "0")}`,
        startedAt,
        stages: [
          "Public Workspace API/CLI, actual TypeScript host/module resolution, captured Snapshot, real filesystem/process boundary and complete observable state",
        ],
        expected:
          "One captured compilation basis; stale output and observed input mutations are refused without unauthorized state changes or code execution",
        actual: {
          finalState: await observe(sandbox.workspaceRoot),
          processes: sandbox.processes,
          entry: sandbox.cliEntry,
        },
        ...(failure === undefined ? {} : { error: failure }),
      });
    }
  });
}

async function prepare(sandbox: WindowsSandbox) {
  const fixture = await createMinimalProject(sandbox.workspaceRoot);
  await api.initWorkspace({ workspaceRoot: sandbox.workspaceRoot, projectRoot: "./Game" });
  await api.cloneWorkspace(sandbox);
  await api.decompileWorkspace(sandbox);
  const types = join(sandbox.workspaceRoot, "types");
  await mkdir(types);
  const dependency = join(types, "name.d.ts");
  await writeFile(dependency, 'export type Name = "Evidence Common Event";');
  const source = join(sandbox.workspaceRoot, "src/decompiled/common-events.events.ts");
  await writeFile(
    source,
    `import type { Name } from "../../types/name.js";\n${await readFile(source, "utf8")}\nconst checkedName: Name = "Evidence Common Event";\n`,
  );
  await api.compileWorkspace({ ...sandbox, check: false });
  expect(
    JSON.parse(
      await readFile(
        join(sandbox.workspaceRoot, ".rpgmaker-event-dsl/generated-project-data/CommonEvents.json"),
        "utf8",
      ),
    ),
  ).toEqual(fixture.projectFiles["CommonEvents.json"]);
  return { dependency, source };
}

async function assertStaleWithoutChanges(sandbox: WindowsSandbox) {
  const before = await observe(sandbox.workspaceRoot);
  expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(false);
  await expect(api.diffWorkspace(sandbox)).rejects.toThrow(/stale/iu);
  await expect(api.pushWorkspace({ ...sandbox, allowDestructive: false })).rejects.toThrow(
    /stale/iu,
  );
  expect(await observe(sandbox.workspaceRoot)).toEqual(before);
}

it("MV-S4-INPUT-001: type dependency content invalidates Generated Freshness and blocks Diff/Push", async () => {
  await withWindowsSandbox("type-dependency", async (sandbox) => {
    const { dependency } = await prepare(sandbox);
    expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(true);
    const original = await readFile(dependency);
    for (const change of [
      () => writeFile(dependency, 'export type Name = "Changed";'),
      () => rm(dependency),
      async () => {
        await writeFile(`${dependency}.replacement`, 'export type Name = "Replacement";');
        await rename(`${dependency}.replacement`, dependency);
      },
    ]) {
      await change();
      await assertStaleWithoutChanges(sandbox);
      await writeFile(dependency, original);
      expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(true);
    }
  });
}, 30_000);

it("MV-S4-INPUT-004: Compile and Check refuse changed discovery and Snapshot sets", async () => {
  await withWindowsSandbox("compile-collection-race", async (sandbox) => {
    const { source } = await prepare(sandbox);
    const extra = join(sandbox.workspaceRoot, "src/extra.events.ts");
    const mapInfos = join(
      sandbox.workspaceRoot,
      ".rpgmaker-event-dsl/project-data-snapshot/MapInfos.json",
    );
    const originalSource = await readFile(source);
    const originalMaps = await readFile(mapInfos);
    for (const command of ["compile", "check"] as const) {
      for (const change of [
        () => writeFile(extra, "export {};"),
        () => rm(source),
        async () => {
          await writeFile(mapInfos, '[null,{"id":1,"name":"Added"}]');
          await writeFile(
            join(sandbox.workspaceRoot, ".rpgmaker-event-dsl/project-data-snapshot/Map001.json"),
            '{"events":[null]}',
          );
        },
      ]) {
        const operation = startWorkspaceOperation(sandbox, {
          operation: command,
          boundary: "input-validation",
        });
        try {
          await operation.waitFor("checkpoint");
          await change();
          const before = await observe(sandbox.workspaceRoot);
          operation.send("release");
          const result = await operation.waitFor("result");
          expect(result.ok).toBe(false);
          expect(result.message).toMatch(/changed.*again/isu);
          expect(await observe(sandbox.workspaceRoot)).toEqual(before);
        } finally {
          await operation.stop();
        }
        await rm(extra, { force: true });
        await writeFile(source, originalSource);
        await writeFile(mapInfos, originalMaps);
      }
    }
  });
}, 30_000);

it("MV-S4-INPUT-005: Compile and Check refuse changed configuration target and captured bytes", async () => {
  await withWindowsSandbox("compile-config-race", async (sandbox) => {
    await prepare(sandbox);
    const config = join(sandbox.workspaceRoot, "rpgmaker-event-dsl.config.json");
    const originalConfig = await readFile(config, "utf8");
    const snapshotFile = join(
      sandbox.workspaceRoot,
      ".rpgmaker-event-dsl/project-data-snapshot/Actors.json",
    );
    const originalSnapshot = await readFile(snapshotFile);
    const candidate = join(sandbox.workspaceRoot, "types/name.ts");
    for (const command of ["compile", "check"] as const) {
      for (const change of [
        () =>
          writeFile(config, JSON.stringify({ ...JSON.parse(originalConfig), scriptEnabled: true })),
        () =>
          writeFile(
            config,
            JSON.stringify({ ...JSON.parse(originalConfig), projectRoot: "./Other Game" }),
          ),
        () => writeFile(snapshotFile, '[null,{"id":1,"name":"External"}]'),
        () => writeFile(candidate, 'export type Name = "New resolution";'),
      ]) {
        const operation = startWorkspaceOperation(sandbox, {
          operation: command,
          boundary: "input-validation",
        });
        try {
          await operation.waitFor("checkpoint");
          await change();
          const before = await observe(sandbox.workspaceRoot);
          operation.send("release");
          const result = await operation.waitFor("result");
          expect(result.ok).toBe(false);
          expect(result.message).toMatch(/changed.*again/isu);
          expect(await observe(sandbox.workspaceRoot)).toEqual(before);
        } finally {
          await operation.stop();
        }
        await writeFile(config, originalConfig);
        await writeFile(snapshotFile, originalSnapshot);
        await rm(candidate, { force: true });
      }
    }
  });
}, 30_000);

it("MV-S4-INPUT-006: Decompile refuses changed existing source discovery config and Snapshot before publication", async () => {
  await withWindowsSandbox("decompile-input-race", async (sandbox) => {
    await prepare(sandbox);
    await rm(join(sandbox.workspaceRoot, "src/decompiled"), { recursive: true });
    const source = join(sandbox.workspaceRoot, "src/manual.events.ts");
    await writeFile(source, "export {};");
    const extra = join(sandbox.workspaceRoot, "src/extra.events.ts");
    const config = join(sandbox.workspaceRoot, "rpgmaker-event-dsl.config.json");
    const originalConfig = await readFile(config, "utf8");
    const snapshotFile = join(
      sandbox.workspaceRoot,
      ".rpgmaker-event-dsl/project-data-snapshot/Actors.json",
    );
    const originalSnapshot = await readFile(snapshotFile);
    for (const change of [
      () => writeFile(source, "export {}; // changed"),
      () => writeFile(extra, "export {};"),
      () =>
        writeFile(
          config,
          JSON.stringify({ ...JSON.parse(originalConfig), sourceInclude: ["**/*.other.ts"] }),
        ),
      () => writeFile(snapshotFile, '[null,{"id":1,"name":"External"}]'),
    ]) {
      const operation = startWorkspaceOperation(sandbox, {
        operation: "decompile",
        boundary: "input-validation",
      });
      try {
        await operation.waitFor("checkpoint");
        await change();
        const before = await observe(sandbox.workspaceRoot);
        operation.send("release");
        const result = await operation.waitFor("result");
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/changed.*again/isu);
        expect(await observe(sandbox.workspaceRoot)).toEqual(before);
      } finally {
        await operation.stop();
      }
      await writeFile(source, "export {};");
      await rm(extra, { force: true });
      await writeFile(config, originalConfig);
      await writeFile(snapshotFile, originalSnapshot);
    }
    await api.decompileWorkspace(sandbox);
    expect(
      await readFile(join(sandbox.workspaceRoot, "src/decompiled/common-events.events.ts"), "utf8"),
    ).toContain("Evidence Common Event");
  });
}, 30_000);

it("MV-S4-INPUT-007: missing old or mismatched contract basis stays stale and Check creates no Freshness", async () => {
  await withWindowsSandbox("contract-version", async (sandbox) => {
    const { source } = await prepare(sandbox);
    const path = join(sandbox.workspaceRoot, ".rpgmaker-event-dsl/sync-manifest.json");
    await writeFile(
      source,
      (await readFile(source, "utf8")).replace(
        'name: "Evidence Common Event"',
        'name: "Written Name"',
      ),
    );
    await api.compileWorkspace({ ...sandbox, check: false });
    const writtenBasis = JSON.parse(await readFile(path, "utf8")).compileBaseline;
    await api.pushWorkspace({ ...sandbox, allowDestructive: false });
    const retainedBasis = JSON.parse(await readFile(path, "utf8")).compileBaseline;
    expect(retainedBasis.compileContractVersion).toEqual(writtenBasis.compileContractVersion);
    expect(retainedBasis.typeInputs).toEqual(writtenBasis.typeInputs);
    expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(true);
    const original = await readFile(path, "utf8");
    const configPath = join(sandbox.workspaceRoot, "rpgmaker-event-dsl.config.json");
    const originalConfig = await readFile(configPath, "utf8");
    for (const change of [
      { scriptEnabled: true },
      { sourceExclude: ["**/common-events.events.ts"] },
      { sourceInclude: ["**/*.dsl.ts"] },
      { sourceRoot: "other-source" },
    ]) {
      await writeFile(configPath, JSON.stringify({ ...JSON.parse(originalConfig), ...change }));
      await assertStaleWithoutChanges(sandbox);
      await writeFile(configPath, originalConfig);
    }
    for (const mutate of [
      (baseline: Record<string, unknown>) => {
        delete baseline.compileContractVersion;
      },
      (baseline: Record<string, unknown>) => {
        baseline.compileContractVersion = "previous-contract";
      },
      (baseline: Record<string, unknown>) => {
        delete baseline.typeInputs;
      },
    ]) {
      const manifest = JSON.parse(original);
      mutate(manifest.compileBaseline);
      await writeFile(path, JSON.stringify(manifest));
      await assertStaleWithoutChanges(sandbox);
    }
    const cli = await runCli(sandbox, ["diff"], { allowFailure: true });
    expect(cli.exitCode).toBe(1);
    expect(`${cli.stdout}${cli.stderr}`).toMatch(/stale/iu);
    const manifest = JSON.parse(original);
    delete manifest.compileBaseline;
    await writeFile(path, JSON.stringify(manifest));
    const before = await observe(sandbox.workspaceRoot);
    await runCli(sandbox, ["compile", "--check"]);
    expect(await observe(sandbox.workspaceRoot)).toEqual(before);
    expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(false);
    await api.compileWorkspace({ ...sandbox, check: false });
    expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(true);
  });
}, 30_000);

it("MV-S4-INPUT-008: capturing type dependencies never executes helper values or event JavaScript", async () => {
  await withWindowsSandbox("restricted-imports", async (sandbox) => {
    const { source } = await prepare(sandbox);
    const original = await readFile(source, "utf8");
    const helper = join(sandbox.workspaceRoot, "types/helper.ts");
    await writeFile(helper, 'throw new Error("HELPER EXECUTED"); export const value = "literal";');
    await writeFile(source, `import { value } from "../../types/helper.js";\n${original}`);
    const before = await observe(sandbox.workspaceRoot);
    await expect(api.compileWorkspace({ ...sandbox, check: false })).rejects.toThrow(
      /Unsupported import source/isu,
    );
    expect(await observe(sandbox.workspaceRoot)).toEqual(before);
    await writeFile(source, `import type { value } from "../../types/helper.js";\n${original}`);
    await api.compileWorkspace({ ...sandbox, check: false });
    expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(true);
    const configPath = join(sandbox.workspaceRoot, "rpgmaker-event-dsl.config.json");
    await writeFile(
      configPath,
      JSON.stringify({ ...JSON.parse(await readFile(configPath, "utf8")), scriptEnabled: true }),
    );
    const scriptSource = join(sandbox.workspaceRoot, "src/script.events.ts");
    await writeFile(
      scriptSource,
      'import { commonEvent, script } from "rpgmaker-event-dsl";\nexport const scripted = commonEvent({ id: 2, name: "Stored script", trigger: "none", commands: [script({ code: "throw new Error(\\"EVENT EXECUTED\\");" })] });',
    );
    await api.compileWorkspace({ ...sandbox, check: false });
    const generated = JSON.parse(
      await readFile(
        join(sandbox.workspaceRoot, ".rpgmaker-event-dsl/generated-project-data/CommonEvents.json"),
        "utf8",
      ),
    );
    expect(generated[2].list).toEqual([
      { code: 355, indent: 0, parameters: ['throw new Error("EVENT EXECUTED");'] },
      { code: 0, indent: 0, parameters: [] },
    ]);
  });
}, 30_000);

it("MV-S4-INPUT-002: Compile and Check refuse input changes observed before publication", async () => {
  await withWindowsSandbox("compile-input-race", async (sandbox) => {
    const { source, dependency } = await prepare(sandbox);
    for (const command of ["compile", "check"] as const) {
      for (const path of [source, dependency]) {
        const operation = startWorkspaceOperation(sandbox, {
          operation: command,
          boundary: "input-validation",
        });
        try {
          await operation.waitFor("checkpoint");
          await writeFile(path, `${await readFile(path, "utf8")}\n// external change\n`);
          const before = await observe(sandbox.workspaceRoot);
          operation.send("release");
          const result = await operation.waitFor("result");
          expect(result.ok).toBe(false);
          expect(result.message).toMatch(/changed.*again/isu);
          expect(await observe(sandbox.workspaceRoot)).toEqual(before);
        } finally {
          await operation.stop();
        }
      }
    }
  });
}, 30_000);

it("MV-S4-INPUT-003: resolution lookups and package metadata invalidate unchanged loaded declarations", async () => {
  await withWindowsSandbox("resolution-inputs", async (sandbox) => {
    await prepare(sandbox);
    const candidate = join(sandbox.workspaceRoot, "types/name.ts");
    await writeFile(candidate, 'export type Name = "Higher priority";');
    await assertStaleWithoutChanges(sandbox);
    await rm(candidate);
    expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(true);
    const metadata = join(sandbox.workspaceRoot, "package.json");
    const original = await readFile(metadata);
    await writeFile(metadata, '{"type":"commonjs"}');
    await assertStaleWithoutChanges(sandbox);
    await writeFile(metadata, original);
    const autoTypes = join(sandbox.workspaceRoot, "node_modules/@types/added");
    await mkdir(autoTypes, { recursive: true });
    await writeFile(join(autoTypes, "index.d.ts"), "declare const ambient: string;");
    await assertStaleWithoutChanges(sandbox);
  });
}, 30_000);
