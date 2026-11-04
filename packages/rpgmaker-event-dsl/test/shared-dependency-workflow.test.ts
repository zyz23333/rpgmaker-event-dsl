import {
  cp,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";

import { expect, it } from "vitest";
import {
  startWorkspaceOperation,
  workspaceApiEntry,
} from "./support/workspace-operation-process.js";
import {
  createMinimalProject,
  withWindowsSandbox,
  type WindowsSandbox,
} from "./support/windows-sandbox.js";

const api: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);

async function tree(root: string): Promise<Record<string, string> | null> {
  const entries = await readdir(root, { withFileTypes: true }).catch((error: unknown) => {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return null;
    throw error;
  });
  if (entries === null) return null;
  const result: Record<string, string> = {};
  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isSymbolicLink()) result[entry.name] = `link:${await realpath(path)}`;
    else if (entry.isDirectory()) {
      for (const [name, bytes] of Object.entries((await tree(path))!))
        result[`${entry.name}/${name}`] = bytes;
    } else result[entry.name] = (await readFile(path)).toString("hex");
  }
  return result;
}

async function observe(workspaceRoot: string) {
  const state = join(workspaceRoot, ".rpgmaker-event-dsl");
  return {
    source: await tree(join(workspaceRoot, "src")),
    config: await readFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8"),
    packageMetadata: await readFile(join(workspaceRoot, "package.json"), "utf8"),
    project: await tree(join(workspaceRoot, "Game")),
    snapshot: await tree(join(state, "project-data-snapshot")),
    generated: await tree(join(state, "generated-project-data")),
    manifest: await readFile(join(state, "sync-manifest.json"), "utf8"),
    pending: await tree(join(state, "pending-push")),
  };
}

async function prepare(sandbox: WindowsSandbox) {
  const { workspaceRoot } = sandbox;
  await createMinimalProject(workspaceRoot);
  await api.initWorkspace({ workspaceRoot, projectRoot: "./Game" });
  await api.cloneWorkspace(sandbox);
  await api.decompileWorkspace(sandbox);
  const shared = join(workspaceRoot, "src/shared");
  await mkdir(shared);
  const leaf = join(shared, "message.ts");
  const direct = join(shared, "commands.ts");
  await writeFile(leaf, 'export const message = "Before";');
  await writeFile(
    direct,
    `import { comment } from "rpgmaker-event-dsl";
import { message } from "./message.js";
export const commands = [comment({ lines: [message] })];`,
  );
  for (const [file, id, module] of [
    ["decompiled/common-events.events.ts", 1, "../shared/commands.js"],
    ["second.events.ts", 2, "./shared/commands.js"],
  ] as const) {
    await writeFile(
      join(workspaceRoot, "src", file),
      `import { commonEvent } from "rpgmaker-event-dsl";
import { commands } from "${module}";
export const event = commonEvent({ id: ${id}, name: "Shared ${id}", trigger: "none", commands: [...commands] });`,
    );
  }
  await api.compileWorkspace({ ...sandbox, check: false });
  expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(true);
  return { shared, direct, leaf };
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

it("refuses stale shared dependencies after edits, deletion, rename and replacement with unchanged entries", async () => {
  await withWindowsSandbox("shared-dependency-mutations", async (sandbox) => {
    const { direct, leaf } = await prepare(sandbox);
    const entry = join(sandbox.workspaceRoot, "src/decompiled/common-events.events.ts");
    const originalEntry = await readFile(entry, "utf8");
    for (const dependency of [direct, leaf]) {
      const original = await readFile(dependency, "utf8");
      for (const change of [
        () => writeFile(dependency, `${original}\n// Same emitted commands, new source input.\n`),
        () => rm(dependency),
        () => rename(dependency, `${dependency}.renamed`),
        async () => {
          await writeFile(`${dependency}.replacement`, `${original}\n// Replaced source.\n`);
          await rename(`${dependency}.replacement`, dependency);
        },
      ]) {
        await change();
        expect(await readFile(entry, "utf8")).toBe(originalEntry);
        await assertStaleWithoutChanges(sandbox);
        await writeFile(dependency, original);
        await rm(`${dependency}.renamed`, { force: true });
        expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(true);
      }
    }
    const generated = join(
      sandbox.workspaceRoot,
      ".rpgmaker-event-dsl/generated-project-data/CommonEvents.json",
    );
    const before = await readFile(generated, "utf8");
    await writeFile(leaf, 'export const message = "Before"; // Changed without changing output.');
    await assertStaleWithoutChanges(sandbox);
    await api.compileWorkspace({ ...sandbox, check: false });
    expect(await readFile(generated, "utf8")).toBe(before);
    expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(true);
    await writeFile(leaf, 'export const message = "After";');
    await assertStaleWithoutChanges(sandbox);
    await api.compileWorkspace({ ...sandbox, check: false });
    await api.diffWorkspace(sandbox);
    await api.pushWorkspace({ ...sandbox, allowDestructive: false });
    const events = JSON.parse(
      await readFile(join(sandbox.workspaceRoot, "Game/data/CommonEvents.json"), "utf8"),
    );
    for (const id of [1, 2]) {
      expect(events[id].list).toEqual([
        { code: 108, indent: 0, parameters: ["After"] },
        { code: 0, indent: 0, parameters: [] },
      ]);
    }
    expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(true);
    const settled = await observe(sandbox.workspaceRoot);
    await api.diffWorkspace(sandbox);
    await api.pushWorkspace({ ...sandbox, allowDestructive: false });
    expect(await observe(sandbox.workspaceRoot)).toEqual(settled);
  });
}, 60_000);

it("rejects unusable shared output after publication failures and a late dependency change", async () => {
  await withWindowsSandbox("shared-dependency-publication", async (sandbox) => {
    const { leaf } = await prepare(sandbox);
    for (const boundary of [
      "generated-write-failure",
      "generated-installation-failure",
      "snapshot-manifest-failure",
      "compile-manifest",
    ] as const) {
      await writeFile(leaf, `export const message = "${boundary}";`);
      const before = await observe(sandbox.workspaceRoot);
      let expectedSource = before.source;
      const operation = startWorkspaceOperation(sandbox, { operation: "compile", boundary });
      try {
        if (boundary === "compile-manifest") {
          await operation.waitFor("checkpoint");
          await writeFile(leaf, 'export const message = "Changed before manifest commitment";');
          expectedSource = (await observe(sandbox.workspaceRoot)).source;
          operation.send("release");
        }
        const result = await operation.waitFor("result");
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(
          boundary === "compile-manifest" ? /changed.*again/isu : /Controlled/iu,
        );
      } finally {
        await operation.stop();
      }
      const after = await observe(sandbox.workspaceRoot);
      expect({ ...after, generated: before.generated }).toEqual({
        ...before,
        source: expectedSource,
      });
      expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(false);
      await expect(api.diffWorkspace(sandbox)).rejects.toThrow(/stale|integrity/iu);
      await expect(api.pushWorkspace({ ...sandbox, allowDestructive: false })).rejects.toThrow(
        /stale|integrity/iu,
      );
      expect(await observe(sandbox.workspaceRoot)).toEqual(after);
      await api.compileWorkspace({ ...sandbox, check: false });
      expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(true);
    }
    await api.pushWorkspace({ ...sandbox, allowDestructive: false });
    const events = JSON.parse(
      await readFile(join(sandbox.workspaceRoot, "Game/data/CommonEvents.json"), "utf8"),
    );
    for (const id of [1, 2]) {
      expect(events[id].list).toEqual([
        { code: 108, indent: 0, parameters: ["Changed before manifest commitment"] },
        { code: 0, indent: 0, parameters: [] },
      ]);
    }
  });
}, 60_000);

it("keeps shared output with a missing or old Compile Contract Version stale after Check", async () => {
  await withWindowsSandbox("shared-dependency-contract", async (sandbox) => {
    await prepare(sandbox);
    const manifestPath = join(sandbox.workspaceRoot, ".rpgmaker-event-dsl/sync-manifest.json");
    const original = await readFile(manifestPath, "utf8");
    for (const version of [undefined, "mv-1.6.1/40", "mv-1.6.1/42", "mv-1.6.1/43"]) {
      const manifest = JSON.parse(original);
      if (version === undefined) delete manifest.compileBaseline.compileContractVersion;
      else manifest.compileBaseline.compileContractVersion = version;
      await writeFile(manifestPath, JSON.stringify(manifest));
      await assertStaleWithoutChanges(sandbox);
      const before = await observe(sandbox.workspaceRoot);
      await api.compileWorkspace({ ...sandbox, check: true });
      expect(await observe(sandbox.workspaceRoot)).toEqual(before);
      await assertStaleWithoutChanges(sandbox);
    }
    await api.compileWorkspace({ ...sandbox, check: false });
    expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(true);
    await api.diffWorkspace(sandbox);
    await api.pushWorkspace({ ...sandbox, allowDestructive: false });
  });
}, 30_000);

it("keeps shared output behind Project Drift, Project Root Binding and Interrupted Push protection", async () => {
  await withWindowsSandbox("shared-dependency-push-protection", async (sandbox) => {
    const { leaf } = await prepare(sandbox);
    const actors = join(sandbox.workspaceRoot, "Game/data/Actors.json");
    const originalActors = await readFile(actors, "utf8");
    await writeFile(actors, `${originalActors}\n`);
    const drifted = await observe(sandbox.workspaceRoot);
    await expect(api.pushWorkspace({ ...sandbox, allowDestructive: false })).rejects.toThrow(
      /Project Drift.*Actors.json/iu,
    );
    expect(await observe(sandbox.workspaceRoot)).toEqual(drifted);
    await writeFile(actors, originalActors);

    const otherProject = join(sandbox.workspaceRoot, "Other Game");
    await cp(join(sandbox.workspaceRoot, "Game"), otherProject, { recursive: true });
    const otherBefore = await tree(otherProject);
    const configPath = join(sandbox.workspaceRoot, "rpgmaker-event-dsl.config.json");
    const config = await readFile(configPath, "utf8");
    await writeFile(
      configPath,
      JSON.stringify({ ...JSON.parse(config), projectRoot: "./Other Game" }),
    );
    const rebound = await observe(sandbox.workspaceRoot);
    await expect(api.pushWorkspace({ ...sandbox, allowDestructive: false })).rejects.toThrow(
      /Project Root Binding mismatch/iu,
    );
    expect(await observe(sandbox.workspaceRoot)).toEqual(rebound);
    expect(await tree(otherProject)).toEqual(otherBefore);
    await writeFile(configPath, config);

    const push = startWorkspaceOperation(sandbox, { operation: "push", boundary: "push-prewrite" });
    try {
      await push.waitFor("checkpoint");
    } finally {
      await push.stop();
    }
    await writeFile(leaf, 'export const message = "Changed after interrupted Push";');
    const interrupted = await observe(sandbox.workspaceRoot);
    expect(interrupted.pending).not.toBeNull();
    for (const command of [
      () => api.compileWorkspace({ ...sandbox, check: false }),
      () => api.compileWorkspace({ ...sandbox, check: true }),
      () => api.diffWorkspace(sandbox),
      () => api.isGeneratedProjectDataFresh(sandbox),
    ]) {
      await expect(command()).rejects.toThrow(/Interrupted Push/iu);
      expect(await observe(sandbox.workspaceRoot)).toEqual(interrupted);
    }
    await expect(api.pushWorkspace({ ...sandbox, allowDestructive: false })).rejects.toThrow(
      /stale/iu,
    );
    expect(await observe(sandbox.workspaceRoot)).toEqual({ ...interrupted, pending: null });
    await api.compileWorkspace({ ...sandbox, check: false });
    await api.pushWorkspace({ ...sandbox, allowDestructive: false });
    expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(true);
    expect(await tree(otherProject)).toEqual(otherBefore);
  });
}, 30_000);

it("keeps successful and failed shared Compile Check read-only and publishes nothing on validation failure", async () => {
  await withWindowsSandbox("shared-dependency-check-state", async (sandbox) => {
    const { direct, leaf } = await prepare(sandbox);
    const fresh = await observe(sandbox.workspaceRoot);
    await api.compileWorkspace({ ...sandbox, check: true });
    expect(await observe(sandbox.workspaceRoot)).toEqual(fresh);
    expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(true);

    await writeFile(leaf, 'export const message = "Checked but not compiled";');
    const stale = await observe(sandbox.workspaceRoot);
    await api.compileWorkspace({ ...sandbox, check: true });
    expect(await observe(sandbox.workspaceRoot)).toEqual(stale);
    await assertStaleWithoutChanges(sandbox);

    const validDirect = await readFile(direct, "utf8");
    for (const [source, diagnostic] of [
      [`${validDirect}\nconst invalid: number = "Shared type error";`, /not assignable/iu],
      [
        'import { callCommonEvent, commonEventRef } from "rpgmaker-event-dsl"; export const commands = [callCommonEvent({ commonEvent: commonEventRef({ id: 999 }) })];',
        /common event.*999/iu,
      ],
      [
        'import { script } from "rpgmaker-event-dsl"; export const commands = [script({ code: "throw new Error(\\"EVENT EXECUTED\\")" })];',
        /MV-SCRIPT-GATE/iu,
      ],
      [
        'import { showPicture, imageAsset } from "rpgmaker-event-dsl"; export const commands = [showPicture({ pictureId: 1, image: imageAsset({ folder: "pictures", name: "Missing shared picture" }), origin: "upperLeft", position: { kind: "direct", x: 0, y: 0 }, scaleX: 100, scaleY: 100, opacity: 255, blendMode: "normal" })];',
        /Missing shared picture/iu,
      ],
    ] as const) {
      await writeFile(direct, source);
      for (const check of [true, false]) {
        const before = await observe(sandbox.workspaceRoot);
        await expect(api.compileWorkspace({ ...sandbox, check })).rejects.toThrow(diagnostic);
        expect(await observe(sandbox.workspaceRoot)).toEqual(before);
        await assertStaleWithoutChanges(sandbox);
      }
    }
    await writeFile(direct, validDirect);
    await api.compileWorkspace({ ...sandbox, check: false });
    expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(true);
  });
}, 60_000);

it("invalidates shared resolution changes even when the previously read source bytes stay unchanged", async () => {
  await withWindowsSandbox("shared-dependency-resolution", async (sandbox) => {
    const { shared, direct, leaf } = await prepare(sandbox);
    const original = await readFile(leaf, "utf8");
    const first = join(shared, "first");
    const second = join(shared, "second");
    for (const directory of [first, second]) {
      await mkdir(directory);
      await writeFile(join(directory, "message.ts"), original);
    }
    const alias = join(shared, "active");
    await symlink(first, alias, "junction");
    await writeFile(
      direct,
      (await readFile(direct, "utf8")).replace("./message.js", "./active/message.js"),
    );
    await api.compileWorkspace({ ...sandbox, check: false });
    await unlink(alias);
    await symlink(second, alias, "junction");
    expect(await readFile(join(first, "message.ts"), "utf8")).toBe(original);
    expect(await readFile(join(second, "message.ts"), "utf8")).toBe(original);
    await assertStaleWithoutChanges(sandbox);
    await api.compileWorkspace({ ...sandbox, check: false });
    expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(true);

    const packageScope = join(shared, "package.json");
    await writeFile(packageScope, '{"type":"commonjs"}');
    expect(await readFile(join(second, "message.ts"), "utf8")).toBe(original);
    await assertStaleWithoutChanges(sandbox);
    await rm(packageScope);
    expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(true);
    await api.diffWorkspace(sandbox);
    await api.pushWorkspace({ ...sandbox, allowDestructive: false });
  });
}, 30_000);

it("rejects shared input changes during Compile and Check before publishing or returning", async () => {
  await withWindowsSandbox("shared-dependency-race", async (sandbox) => {
    const { direct, leaf, shared } = await prepare(sandbox);
    const packageScope = join(shared, "package.json");
    const directSource = await readFile(direct, "utf8");
    const leafSource = await readFile(leaf, "utf8");
    for (const command of ["compile", "check"] as const) {
      for (const change of [
        () => writeFile(direct, `${directSource}\n// Changed direct dependency.\n`),
        () => writeFile(leaf, 'export const message = "Changed during operation";'),
        () => writeFile(packageScope, '{"type":"commonjs"}'),
      ]) {
        const operation = startWorkspaceOperation(sandbox, {
          operation: command,
          boundary: "input-validation",
        });
        try {
          await operation.waitFor("checkpoint");
          await expect(api.diffWorkspace(sandbox)).rejects.toThrow(/busy/iu);
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
        await assertStaleWithoutChanges(sandbox);
        await writeFile(direct, directSource);
        await writeFile(leaf, leafSource);
        await rm(packageScope, { force: true });
        expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(true);
      }
    }
  });
}, 60_000);
