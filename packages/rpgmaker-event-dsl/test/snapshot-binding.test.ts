import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { expect, it } from "vitest";
import { recordEvidence } from "./support/mv-evidence.js";

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

const api: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const caseLabels = [
  "snapshot-consistency",
  "pending-binding",
  "project-binding",
  "snapshot-bytes",
  "snapshot-collection",
  "snapshot-publication",
  "snapshot-metadata",
  "snapshot-integrity",
  "snapshot-carrier",
  "pending-corruption",
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
        requirementId: `MV-S4-SNAPSHOT-${String(caseLabels.indexOf(label) + 1).padStart(3, "0")}`,
        startedAt,
        stages: [
          "Public Workspace API/CLI, actual TypeScript Discovery and evaluation, real filesystem checkpoint and complete state comparison",
        ],
        expected:
          "Consistent byte-exact Snapshot and canonical target binding; explicit refusal preserves complete user state and pending recovery evidence",
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
  await api.compileWorkspace({ ...sandbox, check: false });
  return fixture;
}

async function tree(root: string): Promise<Record<string, string> | null> {
  const entries = await readdir(root, { withFileTypes: true }).catch((error: unknown) => {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return null;
    throw error;
  });
  if (entries === null) return null;
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
  const manifest = await readFile(join(state, "sync-manifest.json"), "utf8").catch(() => null);
  return {
    config: await readFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8"),
    source: await tree(join(workspaceRoot, "src")),
    project: await tree(join(workspaceRoot, "Game")),
    otherProject: await tree(join(workspaceRoot, "Other Game")),
    snapshot: await tree(join(state, "project-data-snapshot")),
    generated: await tree(join(state, "generated-project-data")),
    manifest,
    discovery: (() => {
      try {
        return manifest === null ? null : JSON.parse(manifest).compileBaseline?.sourceFiles;
      } catch {
        return "unknown-format";
      }
    })(),
    pending: await tree(join(state, "pending-push")),
  };
}

it("MV-S4-SNAPSHOT-001: rejects Project input changes before Snapshot publication", async () => {
  await withWindowsSandbox("snapshot-consistency", async (sandbox) => {
    await prepare(sandbox);
    const configPath = join(sandbox.workspaceRoot, "rpgmaker-event-dsl.config.json");
    const originalConfig = await readFile(configPath, "utf8");
    const changes: Record<string, () => Promise<void>> = {
      content: () =>
        writeFile(
          join(sandbox.workspaceRoot, "Game", "data", "Actors.json"),
          '[null,{"id":1,"name":"Concurrent edit"}]',
        ),
      collection: async () => {
        await writeFile(
          join(sandbox.workspaceRoot, "Game", "data", "MapInfos.json"),
          '[null,{"id":1,"parentId":0,"name":""}]',
        );
        await writeFile(
          join(sandbox.workspaceRoot, "Game", "data", "Map001.json"),
          '{"events":[null]}',
        );
      },
      missing: () => rm(join(sandbox.workspaceRoot, "Game", "data", "Actors.json")),
      config: () =>
        writeFile(
          configPath,
          JSON.stringify({ ...JSON.parse(originalConfig), scriptEnabled: true }),
        ),
    };
    for (const operationName of ["clone", "pull"] as const) {
      for (const change of Object.values(changes)) {
        const operation = startWorkspaceOperation(sandbox, {
          operation: operationName,
          boundary: "snapshot-capture",
        });
        try {
          await operation.waitFor("checkpoint");
          await change();
          const before = await observe(sandbox.workspaceRoot);
          operation.send("release");
          const result = await operation.waitFor("result");
          expect(result.ok).toBe(false);
          expect(result.message).toContain("changed");
          expect(await observe(sandbox.workspaceRoot)).toEqual(before);
        } finally {
          await operation.stop();
        }
        await writeFile(configPath, originalConfig);
        await writeFile(join(sandbox.workspaceRoot, "Game", "data", "Actors.json"), "[null]");
        await writeFile(join(sandbox.workspaceRoot, "Game", "data", "MapInfos.json"), "[null]");
      }
    }
  });
}, 30_000);

it("MV-S4-SNAPSHOT-002: preserves pending until Push returns to its original Project Root", async () => {
  await withWindowsSandbox("pending-binding", async (sandbox) => {
    await createMinimalProject(sandbox.workspaceRoot);
    await api.initWorkspace({ workspaceRoot: sandbox.workspaceRoot, projectRoot: "./Game" });
    await api.cloneWorkspace(sandbox);
    await api.decompileWorkspace(sandbox);
    await cp(join(sandbox.workspaceRoot, "Game"), join(sandbox.workspaceRoot, "Other Game"), {
      recursive: true,
    });
    const source = join(sandbox.workspaceRoot, "src", "decompiled", "common-events.events.ts");
    await writeFile(
      source,
      (await readFile(source, "utf8")).replace("Evidence Common Event", "Pending original target"),
    );
    await api.compileWorkspace({ ...sandbox, check: false });
    const owner = startWorkspaceOperation(sandbox, {
      operation: "push",
      boundary: "before-project-write",
    });
    try {
      await owner.waitFor("checkpoint");
    } finally {
      await owner.stop();
    }
    const pendingPath = join(
      sandbox.workspaceRoot,
      ".rpgmaker-event-dsl",
      "pending-push",
      "pending-push.json",
    );
    const pending = await readFile(pendingPath, "utf8");
    const configPath = join(sandbox.workspaceRoot, "rpgmaker-event-dsl.config.json");
    const config = JSON.parse(await readFile(configPath, "utf8"));
    config.projectRoot = "./Other Game";
    await writeFile(configPath, JSON.stringify(config));
    const before = await observe(sandbox.workspaceRoot);
    await expect(api.pushWorkspace({ ...sandbox, allowDestructive: false })).rejects.toThrow(
      "Project Root Binding",
    );
    expect(await readFile(pendingPath, "utf8")).toBe(pending);
    expect(await observe(sandbox.workspaceRoot)).toEqual(before);
    const cli = await runCli(sandbox, ["push"], { allowFailure: true });
    expect(cli.exitCode).not.toBe(0);
    expect(cli.stderr).toContain("Project Root Binding");
    expect(await observe(sandbox.workspaceRoot)).toEqual(before);
    config.projectRoot = "./Game";
    await writeFile(configPath, JSON.stringify(config));
    await api.pushWorkspace({ ...sandbox, allowDestructive: false });
    await expect(readFile(pendingPath)).rejects.toThrow();
    expect(
      JSON.parse(
        await readFile(join(sandbox.workspaceRoot, "Game", "data", "CommonEvents.json"), "utf8"),
      )[1].name,
    ).toBe("Pending original target");
    expect(
      JSON.parse(
        await readFile(
          join(sandbox.workspaceRoot, "Other Game", "data", "CommonEvents.json"),
          "utf8",
        ),
      )[1].name,
    ).toBe("Evidence Common Event");
    expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(true);
  });
}, 30_000);

it("MV-S4-SNAPSHOT-003: requires explicit Pull when the configured Project Root changes", async () => {
  await withWindowsSandbox("project-binding", async (sandbox) => {
    await createMinimalProject(sandbox.workspaceRoot);
    await api.initWorkspace({ workspaceRoot: sandbox.workspaceRoot, projectRoot: "./Game" });
    await api.cloneWorkspace(sandbox);
    await api.decompileWorkspace(sandbox);
    await api.compileWorkspace({ ...sandbox, check: false });
    await cp(join(sandbox.workspaceRoot, "Game"), join(sandbox.workspaceRoot, "Other Game"), {
      recursive: true,
    });
    const configPath = join(sandbox.workspaceRoot, "rpgmaker-event-dsl.config.json");
    const config = JSON.parse(await readFile(configPath, "utf8"));
    config.projectRoot = "./Other Game";
    await writeFile(configPath, JSON.stringify(config));
    const before = await observe(sandbox.workspaceRoot);
    const commands = [
      () => api.cloneWorkspace(sandbox),
      () => api.decompileWorkspace(sandbox),
      () => api.compileWorkspace({ ...sandbox, check: true }),
      () => api.compileWorkspace({ ...sandbox, check: false }),
      () => api.diffWorkspace(sandbox),
      () => api.pushWorkspace({ ...sandbox, allowDestructive: false }),
      () => api.isGeneratedProjectDataFresh(sandbox),
    ];
    for (const command of commands) {
      await expect(command()).rejects.toThrow("Project Root Binding");
      expect(await observe(sandbox.workspaceRoot)).toEqual(before);
    }
    const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
    expect(cli.exitCode).not.toBe(0);
    expect(cli.stderr).toContain("Project Root Binding");
    expect(await observe(sandbox.workspaceRoot)).toEqual(before);
    await api.pullWorkspace(sandbox);
    const state = join(sandbox.workspaceRoot, ".rpgmaker-event-dsl");
    const manifest = JSON.parse(await readFile(join(state, "sync-manifest.json"), "utf8"));
    expect(manifest.projectRootBinding).toBe(
      (await realpath(join(sandbox.workspaceRoot, "Other Game"))).toLowerCase(),
    );
    expect(manifest).not.toHaveProperty("compileBaseline");
    expect(manifest).not.toHaveProperty("generatedFiles");
    expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(false);
    await api.compileWorkspace({ ...sandbox, check: false });
    const rebound = JSON.parse(await readFile(join(state, "sync-manifest.json"), "utf8"));
    expect(rebound.compileBaseline.projectRootBinding).toBe(manifest.projectRootBinding);
    const alias = join(sandbox.workspaceRoot, "Project alias");
    await symlink(join(sandbox.workspaceRoot, "Other Game"), alias, "junction");
    config.projectRoot = "./Project alias";
    await writeFile(configPath, JSON.stringify(config));
    await api.compileWorkspace({ ...sandbox, check: true });
    expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(true);
  });
}, 30_000);

it("MV-S4-SNAPSHOT-004: rejects undecodable project bytes instead of publishing lossy Snapshot content", async () => {
  await withWindowsSandbox("snapshot-bytes", async (sandbox) => {
    await createMinimalProject(sandbox.workspaceRoot);
    await api.initWorkspace({ workspaceRoot: sandbox.workspaceRoot, projectRoot: "./Game" });
    await api.cloneWorkspace(sandbox);
    const actors = join(sandbox.workspaceRoot, "Game", "data", "Actors.json");
    const exactBytes = Buffer.from(' [ null, { "id": 1, "name": "中文" } ]\r\n\t');
    await writeFile(actors, exactBytes);
    await api.pullWorkspace(sandbox);
    const state = join(sandbox.workspaceRoot, ".rpgmaker-event-dsl");
    expect(await readFile(join(state, "project-data-snapshot", "Actors.json"))).toEqual(exactBytes);
    const manifest = JSON.parse(await readFile(join(state, "sync-manifest.json"), "utf8"));
    expect(
      manifest.snapshotFiles.find(
        (file: { relativePath: string }) => file.relativePath === "Actors.json",
      ).hash,
    ).toBe(createHash("sha256").update(exactBytes).digest("hex"));
    await writeFile(
      actors,
      Buffer.concat([Buffer.from('[null,{"name":"'), Buffer.from([0x80]), Buffer.from('"}]')]),
    );
    const before = await observe(sandbox.workspaceRoot);
    await expect(api.pullWorkspace(sandbox)).rejects.toThrow("UTF-8");
    expect(await observe(sandbox.workspaceRoot)).toEqual(before);
  });
});

it("MV-S4-SNAPSHOT-005: rejects unsafe MapInfos collections instead of silently filtering registered maps", async () => {
  await withWindowsSandbox("snapshot-collection", async (sandbox) => {
    await createMinimalProject(sandbox.workspaceRoot);
    await api.initWorkspace({ workspaceRoot: sandbox.workspaceRoot, projectRoot: "./Game" });
    await api.cloneWorkspace(sandbox);
    const mapInfos = join(sandbox.workspaceRoot, "Game", "data", "MapInfos.json");
    await writeFile(
      join(sandbox.workspaceRoot, "Game", "data", "Map001.json"),
      '{"events":[null]}',
    );
    for (const invalid of [
      {},
      [null, false],
      [null, { id: 0, parentId: 0 }],
      [null, { id: -1, parentId: 0 }],
      [null, { id: 1.5, parentId: 0 }],
      [null, { id: 9007199254740992, parentId: 0 }],
      [null, { id: "../outside", parentId: 0 }],
      [null, { id: 1 }],
      [null, { id: 1, parentId: -1 }],
      [null, { id: 1, parentId: 0 }, { id: 1, parentId: 0 }],
    ]) {
      await writeFile(mapInfos, JSON.stringify(invalid));
      const before = await observe(sandbox.workspaceRoot);
      await expect(api.pullWorkspace(sandbox)).rejects.toThrow("MapInfos");
      expect(await observe(sandbox.workspaceRoot)).toEqual(before);
    }
    const registered = '[null,{"id":1,"parentId":0,"name":"","retained":[null]}]';
    await writeFile(mapInfos, registered);
    await writeFile(join(sandbox.workspaceRoot, "Game", "data", "Map002.json"), "invalid orphan");
    await writeFile(
      join(sandbox.workspaceRoot, "Game", "data", "Plugin.json"),
      "invalid plugin data",
    );
    await api.pullWorkspace(sandbox);
    const snapshot = join(sandbox.workspaceRoot, ".rpgmaker-event-dsl", "project-data-snapshot");
    expect(await readFile(join(snapshot, "MapInfos.json"), "utf8")).toBe(registered);
    expect(await readFile(join(snapshot, "Map001.json"), "utf8")).toBe('{"events":[null]}');
    await expect(readFile(join(snapshot, "Map002.json"))).rejects.toThrow();
    await expect(readFile(join(snapshot, "Plugin.json"))).rejects.toThrow();
    await rm(join(sandbox.workspaceRoot, "Game", "data", "Map001.json"));
    const beforeMissing = await observe(sandbox.workspaceRoot);
    await expect(api.pullWorkspace(sandbox)).rejects.toThrow("Map001.json");
    expect(await observe(sandbox.workspaceRoot)).toEqual(beforeMissing);
  });
});

it("MV-S4-SNAPSHOT-006: retains prior Snapshot and manifest when Snapshot publication fails", async () => {
  await withWindowsSandbox("snapshot-publication", async (sandbox) => {
    await prepare(sandbox);
    await writeFile(
      join(sandbox.workspaceRoot, "Game", "data", "Actors.json"),
      '[null,{"id":1,"name":"New data"}]',
    );
    const before = await observe(sandbox.workspaceRoot);
    const operation = startWorkspaceOperation(sandbox, {
      operation: "pull",
      boundary: "snapshot-manifest-failure",
    });
    try {
      const result = await operation.waitFor("result");
      expect(result.ok).toBe(false);
      expect(result.message).toContain("Controlled Snapshot manifest publication failure");
      expect(await observe(sandbox.workspaceRoot)).toEqual(before);
    } finally {
      await operation.stop();
    }
  });
});

it("MV-S4-SNAPSHOT-007: rejects unsafe Snapshot metadata before reading or publishing output", async () => {
  await withWindowsSandbox("snapshot-metadata", async (sandbox) => {
    await createMinimalProject(sandbox.workspaceRoot);
    await api.initWorkspace({ workspaceRoot: sandbox.workspaceRoot, projectRoot: "./Game" });
    await api.cloneWorkspace(sandbox);
    const path = join(sandbox.workspaceRoot, ".rpgmaker-event-dsl", "sync-manifest.json");
    const valid = await readFile(path, "utf8");
    type ManifestInput = {
      version: number;
      projectRootBinding?: string;
      unknown?: boolean;
      snapshotFiles: Array<{ relativePath: string; hash: string }>;
    };
    const changes: Array<(manifest: ManifestInput) => void> = [
      (manifest) => {
        manifest.version = 999;
      },
      (manifest) => {
        delete manifest.projectRootBinding;
      },
      (manifest) => {
        manifest.unknown = true;
      },
      (manifest) => {
        manifest.snapshotFiles[0]!.relativePath = "../outside.json";
      },
      (manifest) => {
        manifest.snapshotFiles[0]!.relativePath = "C:/outside.json";
      },
      (manifest) => {
        manifest.snapshotFiles[0]!.hash = "bad";
      },
      (manifest) => {
        manifest.snapshotFiles.push(manifest.snapshotFiles[0]!);
      },
      (manifest) => {
        manifest.snapshotFiles.shift();
      },
    ];
    for (const change of changes) {
      const manifest = JSON.parse(valid);
      change(manifest);
      await writeFile(path, JSON.stringify(manifest));
      const before = await observe(sandbox.workspaceRoot);
      await expect(api.compileWorkspace({ ...sandbox, check: true })).rejects.toThrow(
        "Unknown or corrupt Sync Manifest",
      );
      expect(await observe(sandbox.workspaceRoot)).toEqual(before);
    }
    await writeFile(path, "{bad JSON");
    const before = await observe(sandbox.workspaceRoot);
    const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
    expect(cli.exitCode).not.toBe(0);
    expect(cli.stderr).toContain("Unknown or corrupt Sync Manifest");
    expect(await observe(sandbox.workspaceRoot)).toEqual(before);
  });
});

it("MV-S4-SNAPSHOT-008: rejects Snapshot content that no longer agrees with its captured manifest", async () => {
  await withWindowsSandbox("snapshot-integrity", async (sandbox) => {
    await createMinimalProject(sandbox.workspaceRoot);
    await api.initWorkspace({ workspaceRoot: sandbox.workspaceRoot, projectRoot: "./Game" });
    await api.cloneWorkspace(sandbox);
    await writeFile(
      join(sandbox.workspaceRoot, ".rpgmaker-event-dsl", "project-data-snapshot", "Actors.json"),
      '[null,{"id":1,"name":"Local corruption"}]',
    );
    const before = await observe(sandbox.workspaceRoot);
    await expect(api.compileWorkspace({ ...sandbox, check: true })).rejects.toThrow(
      "inconsistent Snapshot",
    );
    expect(await observe(sandbox.workspaceRoot)).toEqual(before);
  });
});

it("MV-S4-SNAPSHOT-009: rejects a registered map whose event carrier cannot be located safely", async () => {
  await withWindowsSandbox("snapshot-carrier", async (sandbox) => {
    await createMinimalProject(sandbox.workspaceRoot);
    await api.initWorkspace({ workspaceRoot: sandbox.workspaceRoot, projectRoot: "./Game" });
    await api.cloneWorkspace(sandbox);
    await writeFile(
      join(sandbox.workspaceRoot, "Game", "data", "MapInfos.json"),
      '[null,{"id":1,"parentId":0,"name":""}]',
    );
    const cases = [
      ["Map001.json", '{"events":{}}'],
      ["Map001.json", "[]"],
      ["Map001.json", "{}"],
      ["System.json", "[]"],
      ["CommonEvents.json", "{}"],
      ["Actors.json", "null"],
      ["Troops.json", "not JSON"],
    ];
    await writeFile(
      join(sandbox.workspaceRoot, "Game", "data", "Map001.json"),
      '{"events":[null]}',
    );
    for (const [name, content] of cases) {
      const path = join(sandbox.workspaceRoot, "Game", "data", name!);
      const original = await readFile(path);
      await writeFile(path, content!);
      const before = await observe(sandbox.workspaceRoot);
      await expect(api.pullWorkspace(sandbox)).rejects.toThrow(name);
      expect(await observe(sandbox.workspaceRoot)).toEqual(before);
      await writeFile(path, original);
    }
  });
});

it("MV-S4-SNAPSHOT-010: preserves unknown or inconsistent Interrupted Push evidence", async () => {
  await withWindowsSandbox("pending-corruption", async (sandbox) => {
    await prepare(sandbox);
    const state = join(sandbox.workspaceRoot, ".rpgmaker-event-dsl");
    const source = join(sandbox.workspaceRoot, "src", "decompiled", "common-events.events.ts");
    await writeFile(
      source,
      (await readFile(source, "utf8")).replace("Evidence Common Event", "Pending integrity"),
    );
    await api.compileWorkspace({ ...sandbox, check: false });
    const owner = startWorkspaceOperation(sandbox, {
      operation: "push",
      boundary: "before-project-write",
    });
    try {
      await owner.waitFor("checkpoint");
    } finally {
      await owner.stop();
    }
    const path = join(state, "pending-push", "pending-push.json");
    const valid = await readFile(path, "utf8");
    type PendingInput = {
      version: number;
      projectRootBinding?: string;
      extra?: boolean;
      affectedFiles: Array<{
        relativePath: string;
        backupRelativePath: string;
        snapshotHash: string;
        generatedHash: string;
        backupHash: string;
      }>;
    };
    const changes: Array<(pending: PendingInput) => void> = [
      (pending) => {
        pending.version = 999;
      },
      (pending) => {
        pending.version = 1;
      },
      (pending) => {
        delete pending.projectRootBinding;
      },
      (pending) => {
        pending.extra = true;
      },
      (pending) => {
        pending.affectedFiles[0]!.relativePath = "../outside.json";
      },
      (pending) => {
        pending.affectedFiles[0]!.backupRelativePath = "../outside.json";
      },
      (pending) => {
        pending.affectedFiles.push(pending.affectedFiles[0]!);
      },
      (pending) => {
        pending.affectedFiles[0]!.snapshotHash = "0".repeat(64);
      },
      (pending) => {
        pending.affectedFiles[0]!.generatedHash = "0".repeat(64);
      },
      (pending) => {
        pending.affectedFiles[0]!.backupHash = "0".repeat(64);
      },
    ];
    for (const change of changes) {
      const pending = JSON.parse(valid);
      change(pending);
      await writeFile(path, JSON.stringify(pending));
      const before = await observe(sandbox.workspaceRoot);
      await expect(api.pushWorkspace({ ...sandbox, allowDestructive: false })).rejects.toThrow(
        /Interrupted Push/u,
      );
      expect(await observe(sandbox.workspaceRoot)).toEqual(before);
    }
    await writeFile(path, "{bad JSON");
    const beforeCorrupt = await observe(sandbox.workspaceRoot);
    const cli = await runCli(sandbox, ["push"], { allowFailure: true });
    expect(cli.exitCode).not.toBe(0);
    expect(cli.stderr).toContain("Unknown or corrupt Interrupted Push");
    expect(await observe(sandbox.workspaceRoot)).toEqual(beforeCorrupt);
    await rm(path);
    const beforeMissing = await observe(sandbox.workspaceRoot);
    await expect(api.pushWorkspace({ ...sandbox, allowDestructive: false })).rejects.toThrow(
      "incomplete",
    );
    expect(await observe(sandbox.workspaceRoot)).toEqual(beforeMissing);
    await writeFile(path, valid);
    for (const location of ["backup", "generated-project-data"]) {
      const file =
        location === "backup"
          ? join(state, "pending-push", location, "CommonEvents.json")
          : join(state, location, "CommonEvents.json");
      const original = await readFile(file);
      await writeFile(file, "[]");
      const before = await observe(sandbox.workspaceRoot);
      await expect(api.pushWorkspace({ ...sandbox, allowDestructive: false })).rejects.toThrow(
        "integrity",
      );
      expect(await observe(sandbox.workspaceRoot)).toEqual(before);
      await writeFile(file, original);
    }
    await cp(
      join(state, "generated-project-data", "CommonEvents.json"),
      join(sandbox.workspaceRoot, "Game", "data", "CommonEvents.json"),
    );
    await api.pushWorkspace({ ...sandbox, allowDestructive: false });
    await expect(readFile(path)).rejects.toThrow();
    expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(true);
    expect(
      JSON.parse(
        await readFile(join(state, "project-data-snapshot", "CommonEvents.json"), "utf8"),
      )[1].name,
    ).toBe("Pending integrity");
    await mkdir(join(state, "pending-push"));
    const beforeIncomplete = await observe(sandbox.workspaceRoot);
    await expect(api.pullWorkspace(sandbox)).rejects.toThrow("incomplete");
    expect(await observe(sandbox.workspaceRoot)).toEqual(beforeIncomplete);
  });
}, 30_000);
