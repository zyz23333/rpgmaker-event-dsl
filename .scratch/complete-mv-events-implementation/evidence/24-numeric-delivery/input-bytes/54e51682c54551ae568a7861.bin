import { deepStrictEqual } from "node:assert/strict";
import {
  mkdir,
  readFile,
  readdir,
  stat,
  symlink,
  unlink,
  utimes,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";

import { expect, it } from "vitest";

import { recordEvidence } from "./support/mv-evidence.js";
import {
  createMinimalProject,
  runCli,
  withWindowsSandbox,
  type WindowsSandbox,
} from "./support/windows-sandbox.js";
import {
  startWorkspaceOperation,
  workspaceApiEntry,
  type WorkspaceOperation,
} from "./support/workspace-operation-process.js";

const api: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const operations: WorkspaceOperation[] = [
  "clone",
  "pull",
  "decompile",
  "compile",
  "check",
  "diff",
  "push",
  "fresh",
];

function invoke(operation: WorkspaceOperation, workspaceRoot: string): Promise<unknown> {
  return rejectQueue(executeOperation(operation, workspaceRoot));
}

async function rejectQueue(operation: Promise<unknown>): Promise<unknown> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Competitor queued instead of immediately reporting busy")),
          5_000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function executeOperation(operation: WorkspaceOperation, workspaceRoot: string): Promise<unknown> {
  const options = { workspaceRoot };
  switch (operation) {
    case "clone":
      return api.cloneWorkspace(options);
    case "pull":
      return api.pullWorkspace(options);
    case "decompile":
      return api.decompileWorkspace(options);
    case "compile":
      return api.compileWorkspace({ ...options, check: false });
    case "check":
      return api.compileWorkspace({ ...options, check: true });
    case "diff":
      return api.diffWorkspace(options);
    case "push":
      return api.pushWorkspace({ ...options, allowDestructive: false });
    case "fresh":
      return api.isGeneratedProjectDataFresh(options);
  }
}

async function prepare(sandbox: WindowsSandbox) {
  const fixture = await createMinimalProject(sandbox.workspaceRoot);
  await api.initWorkspace({ workspaceRoot: sandbox.workspaceRoot, projectRoot: "./Game" });
  await api.cloneWorkspace(sandbox);
  await api.decompileWorkspace(sandbox);
  await api.compileWorkspace({ ...sandbox, check: false });
  return fixture;
}

async function tree(root: string): Promise<Record<string, string> | null> {
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return null;
    throw error;
  }
  const files: Record<string, string> = {};
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      for (const [name, bytes] of Object.entries((await tree(path))!))
        files[`${entry.name}/${name}`] = bytes;
    } else files[entry.name] = (await readFile(path)).toString("hex");
  }
  return files;
}

async function observe(workspaceRoot: string) {
  const state = join(workspaceRoot, ".rpgmaker-event-dsl");
  const project: Record<string, string> = {};
  for (const name of (await readdir(join(workspaceRoot, "Game", "data"))).sort()) {
    if (name.endsWith(".json"))
      project[name] = await readFile(join(workspaceRoot, "Game", "data", name), "utf8");
  }
  const manifest = await readFile(join(state, "sync-manifest.json"), "utf8");
  return {
    config: await readFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8"),
    source: await tree(join(workspaceRoot, "src")),
    project,
    snapshot: await tree(join(state, "project-data-snapshot")),
    generated: await tree(join(state, "generated-project-data")),
    manifest,
    discovery: JSON.parse(manifest).compileBaseline?.sourceFiles,
    pending: await tree(join(state, "pending-push")),
  };
}

async function evidence(
  id: string,
  body: (sandbox: WindowsSandbox, actual: Record<string, unknown>) => Promise<void>,
) {
  await withWindowsSandbox("workspace-lock", async (sandbox) => {
    const startedAt = new Date().toISOString();
    const actual: Record<string, unknown> = {};
    let failure: unknown;
    try {
      await body(sandbox, actual);
    } catch (error) {
      failure = error;
      throw error;
    } finally {
      await recordEvidence({
        requirementId: id,
        startedAt,
        stages: [
          "Real public Workspace API and Windows subprocesses with IPC-controlled filesystem boundary; complete user-visible state comparison",
        ],
        expected:
          "Immediate busy rejection while owner is alive; kernel-proven release after exit; user state and Interrupted Push preserved",
        actual: { ...actual, entry: sandbox.cliEntry, processes: sandbox.processes },
        ...(failure === undefined ? {} : { error: failure }),
      });
    }
  });
}

it("MV-S4-LOCK-001: excludes every Workspace API and CLI operation before mutable reads", async () => {
  await evidence("MV-S4-LOCK-001", async (sandbox, actual) => {
    await prepare(sandbox);
    const before = await observe(sandbox.workspaceRoot);
    const matrix: string[] = [];
    for (const holder of operations) {
      const owner = startWorkspaceOperation(sandbox, { operation: holder, boundary: "config" });
      try {
        expect((await owner.waitFor(["checkpoint", "result"])).kind).toBe("checkpoint");
        for (const competitor of operations) {
          await expect(invoke(competitor, sandbox.workspaceRoot)).rejects.toThrow(
            "Workspace is busy",
          );
          matrix.push(`${holder} owner / ${competitor} API busy`);
        }
        if (holder === "compile") {
          const configPath = join(sandbox.workspaceRoot, "rpgmaker-event-dsl.config.json");
          await writeFile(configPath, "deliberately incomplete configuration");
          try {
            for (const competitor of operations.filter((name) => name !== "fresh")) {
              const args = competitor === "check" ? ["compile", "--check"] : [competitor];
              const result = await runCli(sandbox, args, { allowFailure: true });
              expect(result.exitCode).toBe(1);
              expect(result.stderr).toContain("Workspace is busy");
              matrix.push(`compile owner / ${competitor} CLI busy before config parse`);
            }
          } finally {
            await writeFile(configPath, before.config);
          }
        }
        deepStrictEqual(await observe(sandbox.workspaceRoot), before);
      } finally {
        await owner.stop();
      }
    }
    const cliOwner = startWorkspaceOperation(sandbox, {
      operation: "check",
      mode: "cli",
      boundary: "config",
    });
    try {
      await cliOwner.waitFor("checkpoint");
      for (const competitor of operations)
        await expect(invoke(competitor, sandbox.workspaceRoot)).rejects.toThrow(
          "Workspace is busy",
        );
    } finally {
      await cliOwner.stop();
    }
    const simultaneous = await Promise.allSettled([
      api.compileWorkspace({ workspaceRoot: sandbox.workspaceRoot, check: true }),
      api.diffWorkspace({ workspaceRoot: sandbox.workspaceRoot }),
    ]);
    expect(simultaneous.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
    expect(simultaneous.filter(({ status }) => status === "rejected")).toHaveLength(1);
    expect(
      String(
        (simultaneous.find(({ status }) => status === "rejected") as PromiseRejectedResult).reason,
      ),
    ).toContain("Workspace is busy");
    deepStrictEqual(await observe(sandbox.workspaceRoot), before);
    actual.matrix = matrix;
    actual.sameProcess = simultaneous.map(({ status }) => status);
    actual.finalState = await observe(sandbox.workspaceRoot);
  });
}, 60_000);

it("MV-S4-LOCK-002: hides Snapshot publication gaps and aliases while other Workspaces operate", async () => {
  await evidence("MV-S4-LOCK-002", async (sandbox, actual) => {
    await prepare(sandbox);
    const other = {
      ...sandbox,
      workspaceRoot: join(sandbox.root, "Another independent Workspace"),
    };
    await mkdir(other.workspaceRoot);
    await prepare(other);
    const alias = join(sandbox.root, "Workspace directory junction");
    await symlink(sandbox.workspaceRoot, alias, "junction");
    const before = await observe(sandbox.workspaceRoot);
    const otherBefore = await observe(other.workspaceRoot);
    const owner = startWorkspaceOperation(sandbox, {
      operation: "pull",
      boundary: "snapshot-publication",
    });
    try {
      await owner.waitFor("checkpoint");
      // The old Snapshot has moved aside and the replacement is not installed.
      expect(
        await tree(join(sandbox.workspaceRoot, ".rpgmaker-event-dsl", "project-data-snapshot")),
      ).toBeNull();
      for (const operation of ["check", "diff", "decompile", "fresh"] as const) {
        await expect(invoke(operation, alias)).rejects.toThrow("Workspace is busy");
      }
      for (const args of [["compile", "--check"], ["diff"]]) {
        const result = await runCli({ ...sandbox, workspaceRoot: alias }, args, {
          allowFailure: true,
        });
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain("Workspace is busy");
      }
      await api.compileWorkspace({ workspaceRoot: other.workspaceRoot, check: true });
      expect(await api.diffWorkspace({ ...other, short: true })).toContain("No changes.");
      await api.pushWorkspace({ ...other, allowDestructive: false });
      deepStrictEqual(await observe(other.workspaceRoot), otherBefore);
      owner.send("release");
      expect(await owner.waitFor("result")).toMatchObject({ ok: true });
      expect((await owner.ended).exitCode).toBe(0);
    } finally {
      await owner.stop();
    }
    await api.compileWorkspace({ ...sandbox, check: false });
    expect(await api.diffWorkspace({ ...sandbox, short: true })).toContain("No changes.");
    deepStrictEqual(await observe(sandbox.workspaceRoot), before);
    actual.publicationGap = "Actual missing Snapshot while readers report busy";
    actual.alias = alias;
    actual.finalState = await observe(sandbox.workspaceRoot);
    actual.otherFinalState = await observe(other.workspaceRoot);
  });
}, 30_000);

it("MV-S4-LOCK-003: recovers kernel leases after interruption and crash without stale-cleaner races", async () => {
  await evidence("MV-S4-LOCK-003", async (sandbox, actual) => {
    await prepare(sandbox);
    const before = await observe(sandbox.workspaceRoot);
    const lockPath = join(sandbox.workspaceRoot, ".rpgmaker-event-dsl", "operation.lock");
    const abandonedBytes = "Old diagnostic PID 999999999; not proof of owner death";
    await writeFile(lockPath, abandonedBytes);
    await utimes(lockPath, new Date("2000-01-01"), new Date("2000-01-01"));
    const identity = (await stat(lockPath)).ino;
    const interrupted = startWorkspaceOperation(sandbox, {
      operation: "check",
      boundary: "config",
    });
    try {
      await interrupted.waitFor("checkpoint");
      await expect(invoke("check", sandbox.workspaceRoot)).rejects.toThrow("Workspace is busy");
      await expect(unlink(lockPath)).rejects.toMatchObject({ code: "EBUSY" });
      await interrupted.stop("SIGTERM");
    } finally {
      await interrupted.stop();
    }
    await api.compileWorkspace({ workspaceRoot: sandbox.workspaceRoot, check: true });
    deepStrictEqual(await observe(sandbox.workspaceRoot), before);
    const crashed = startWorkspaceOperation(sandbox, { operation: "check", boundary: "config" });
    try {
      await crashed.waitFor("checkpoint");
      crashed.send("crash");
      expect((await crashed.ended).exitCode).toBe(1);
    } finally {
      await crashed.stop();
    }
    // All contenders see the same abandoned pathname. One kernel acquisition
    // wins and pauses; losers finish busy while that winner remains alive.
    const contenders = Array.from({ length: 6 }, () =>
      startWorkspaceOperation(sandbox, {
        operation: "check",
        boundary: "config",
        barrier: true,
      }),
    );
    try {
      await Promise.all(contenders.map((child) => child.waitFor("ready")));
      for (const child of contenders) child.send("start");
      const results = await Promise.all(
        contenders.map((child) => child.waitFor(["checkpoint", "result"])),
      );
      expect(results.filter(({ kind }) => kind === "checkpoint")).toHaveLength(1);
      const losers = results.filter(({ kind }) => kind === "result");
      expect(losers).toHaveLength(5);
      for (const loser of losers)
        expect(loser).toMatchObject({
          ok: false,
          message: expect.stringContaining("Workspace is busy"),
        });
      const winner = contenders[results.findIndex(({ kind }) => kind === "checkpoint")]!;
      await expect(invoke("diff", sandbox.workspaceRoot)).rejects.toThrow("Workspace is busy");
      winner.send("release");
      expect(await winner.waitFor("result")).toMatchObject({ ok: true });
      await Promise.all(contenders.map((child) => child.ended));
      actual.race = results;
    } finally {
      await Promise.all(contenders.map((child) => child.stop()));
    }
    expect((await stat(lockPath)).ino).toBe(identity);
    expect(await readFile(lockPath, "utf8")).toBe(abandonedBytes);
    await api.compileWorkspace({ workspaceRoot: sandbox.workspaceRoot, check: true });
    deepStrictEqual(await observe(sandbox.workspaceRoot), before);
    actual.lockFile = { identity, bytes: abandonedBytes, persistent: true };
    actual.finalState = await observe(sandbox.workspaceRoot);
  });
}, 30_000);

it("MV-S4-LOCK-004: preserves Interrupted Push independently of abandoned locks and failed checks", async () => {
  await evidence("MV-S4-LOCK-004", async (sandbox, actual) => {
    const fixture = await prepare(sandbox);
    const sourcePath = join(sandbox.workspaceRoot, "src", "decompiled", "common-events.events.ts");
    const source = await readFile(sourcePath, "utf8");
    const changed = source.replace("Evidence Common Event", "Pending survives owner death");
    await writeFile(sourcePath, changed);
    await writeFile(
      join(sandbox.workspaceRoot, "src", "user-helper.ts"),
      "// User-owned helper survives every failure\n",
    );
    await api.compileWorkspace({ ...sandbox, check: false });
    const before = await observe(sandbox.workspaceRoot);
    const owner = startWorkspaceOperation(sandbox, {
      operation: "push",
      boundary: "before-project-write",
    });
    let pending;
    try {
      await owner.waitFor("checkpoint");
      pending = await observe(sandbox.workspaceRoot);
      expect(pending.pending).not.toBeNull();
      deepStrictEqual({ ...pending, pending: null }, before);
      await expect(invoke("check", sandbox.workspaceRoot)).rejects.toThrow("Workspace is busy");
      await owner.stop();
    } finally {
      await owner.stop();
    }
    for (const operation of operations.filter((name) => name !== "push")) {
      await expect(invoke(operation, sandbox.workspaceRoot)).rejects.toThrow(
        "Interrupted Push is pending",
      );
      deepStrictEqual(await observe(sandbox.workspaceRoot), pending);
    }
    const rejected = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
    expect(rejected.exitCode).toBe(1);
    expect(rejected.stderr).toContain("Interrupted Push is pending");
    deepStrictEqual(await observe(sandbox.workspaceRoot), pending);
    // Only Push abandons the all-Snapshot pending operation and performs the
    // current write. Its content-based recovery contract is unchanged.
    await api.pushWorkspace({ ...sandbox, allowDestructive: false });
    const final = await observe(sandbox.workspaceRoot);
    expect(final.pending).toBeNull();
    deepStrictEqual(final.source, before.source);
    deepStrictEqual(final.generated, before.generated);
    deepStrictEqual(final.discovery, before.discovery);
    expect(final.config).toBe(before.config);
    const expectedCommon = structuredClone(fixture.projectFiles["CommonEvents.json"]);
    expectedCommon[1].name = "Pending survives owner death";
    for (const [name, original] of Object.entries(fixture.projectFiles)) {
      const expected = name === "CommonEvents.json" ? expectedCommon : original;
      deepStrictEqual(JSON.parse(final.project[name]!), expected);
      deepStrictEqual(JSON.parse(Buffer.from(final.snapshot![name]!, "hex").toString()), expected);
    }
    const invalid = `${changed}\nthis is invalid TypeScript !\n`;
    await writeFile(sourcePath, invalid);
    const failedState = await observe(sandbox.workspaceRoot);
    await expect(
      api.compileWorkspace({ workspaceRoot: sandbox.workspaceRoot, check: true }),
    ).rejects.toThrow();
    deepStrictEqual(await observe(sandbox.workspaceRoot), failedState);
    await writeFile(sourcePath, changed);
    await api.compileWorkspace({ workspaceRoot: sandbox.workspaceRoot, check: true });
    deepStrictEqual(await observe(sandbox.workspaceRoot), final);
    actual.pendingBeforeRecovery = pending;
    actual.finalState = final;
    actual.checkFailurePreservedState = true;
  });
}, 30_000);
