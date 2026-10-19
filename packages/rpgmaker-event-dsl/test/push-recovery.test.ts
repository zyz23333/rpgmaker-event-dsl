import { verifyTroopEvidence } from "./support/troop-evidence.js";
import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, readdir, readlink, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import { discoverDefinitionFiles } from "../src/workspace/definitions.js";
import { writeStableJson } from "../src/project-data/writer.js";
import { recordEvidence } from "./support/mv-evidence.js";
import {
  startWorkspaceOperation,
  workspaceApiEntry,
} from "./support/workspace-operation-process.js";
import {
  createMinimalProject,
  runCli,
  withWindowsSandbox,
  type WindowsSandbox,
} from "./support/windows-sandbox.js";

const api: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const local = (s: WindowsSandbox, name: string) =>
  join(s.workspaceRoot, ".rpgmaker-event-dsl", name);
const live = (s: WindowsSandbox, name: string) => join(s.workspaceRoot, "Game/data", name);
const hash = (value: Uint8Array) => createHash("sha256").update(value).digest("hex");

it.each(["mv-1.6.1/5", "mv-1.6.1/6", "unknown-contract", "incomplete-prior-set"])(
  "recognizes the bounded pre-Troops complete output set: %s",
  async (contract) => {
    return verifyTroopEvidence("MV-S5-TROOP-PRIOR-001", async () => {
      let finalObservation: unknown;

      await withWindowsSandbox("mv25-prior-set", async (s) => {
        const { old, generated } = await prepare(s);
        old.generatedFiles = old.generatedFiles.filter(
          (entry: { relativePath: string }) => entry.relativePath !== "Troops.json",
        );
        await rm(local(s, "generated-project-data/Troops.json"));
        old.compileBaseline.compileContractVersion =
          contract === "incomplete-prior-set" ? "mv-1.6.1/5" : contract;
        if (contract === "incomplete-prior-set") {
          old.generatedFiles = old.generatedFiles.filter(
            (entry: { relativePath: string }) => entry.relativePath !== "System.json",
          );
          generated.delete("System.json");
          await rm(local(s, "generated-project-data/System.json"));
        }
        const { hash: _hash, ...basis } = old.compileBaseline;
        old.compileBaseline.hash = hash(Buffer.from(writeStableJson(basis)));
        await writeFile(local(s, "sync-manifest.json"), writeStableJson(old));
        await preconstruct(s, generated, old);
        for (const [name, bytes] of generated) await writeFile(live(s, name), bytes);
        const before = await observe(s);
        if (contract !== "mv-1.6.1/5") {
          await expect(api.pushWorkspace({ ...s, allowDestructive: false })).rejects.toThrow(
            /Interrupted Push.*file set/s,
          );
          expect(await observe(s)).toStrictEqual(before);
        } else {
          await expect(api.pushWorkspace({ ...s, allowDestructive: false })).rejects.toThrow(
            /stale|integrity/i,
          );
          const final = await manifest(s);
          expect(final.generatedFiles).toStrictEqual(old.generatedFiles);
          expect(final.compileBaseline).toMatchObject({
            ...basis,
            snapshotFiles: final.snapshotFiles,
          });
          for (const [name, bytes] of generated)
            expect(await readFile(local(s, "project-data-snapshot/" + name))).toEqual(bytes);
          expect(await readFile(live(s, "Troops.json"))).toEqual(
            Buffer.from(JSON.stringify([null])),
          );
          await expect(lstat(local(s, "pending-push"))).rejects.toThrow();
          expect((await observe(s)).source).toStrictEqual(before.source);
          expect(await api.isGeneratedProjectDataFresh(s)).toBe(false);
        }

        finalObservation = await observe(s);
      });

      return { contract, finalObservation };
    });
  },
  30000,
);

it("MV-S4-RECOVERY-019: refuses pending replacement after its original bytes are captured", async () => {
  await evidence("MV-S4-RECOVERY-019", async (s, observations) => {
    const { old, generated } = await prepare(s);
    await preconstruct(s, generated, old);
    for (const [name, bytes] of generated) await writeFile(live(s, name), bytes);
    const path = local(s, "pending-push/pending-push.json");
    const child = startWorkspaceOperation(s, {
      operation: "push",
      boundary: "push-pending-capture",
    });
    try {
      await child.waitFor("checkpoint");
      const changed = JSON.parse(await readFile(path, "utf8"));
      changed.version = 999;
      await writeFile(path, JSON.stringify(changed));
      const before = await observe(s);
      observations.push({ before });
      child.send("release");
      const result = await child.waitFor("result");
      observations.push({ result });
      expect(result.ok).toBe(false);
      expect(result.message).toMatch(/Interrupted Push/u);
      expect(await observe(s)).toStrictEqual(before);
    } finally {
      await child.stop();
    }
  });
}, 30000);
type CorruptPending = {
  version: number;
  projectRootBinding: string;
  originalManifest?: unknown;
  originalManifestHash: string;
  affectedFiles: Array<{ backupRelativePath: string; snapshotHash: string; generatedHash: string }>;
};

it("MV-S4-RECOVERY-015: identifies missing or uninterpretable recovery evidence and retains all remaining state", async () => {
  await evidence("MV-S4-RECOVERY-015", async (s, observations) => {
    const { old, generated } = await prepare(s);
    await preconstruct(s, generated, old);
    for (const [relative, content] of [
      ["pending-push/backup/CommonEvents.json", null],
      ["project-data-snapshot/MapInfos.json", Buffer.from("{bad")],
      ["generated-project-data/CommonEvents.json", null],
    ] as const) {
      const path = local(s, relative);
      const original = await readFile(path);
      if (content === null) await rm(path);
      else await writeFile(path, content);
      const before = await observe(s);
      observations.push({ relative, before });
      await expect(api.pushWorkspace({ ...s, allowDestructive: false })).rejects.toThrow(
        /Interrupted Push/u,
      );
      expect(await observe(s)).toStrictEqual(before);
      await writeFile(path, original);
    }
  });
}, 30000);
async function tree(root: string): Promise<Record<string, string> | null> {
  const entries = await readdir(root, { withFileTypes: true }).catch((error: unknown) => {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return null;
    throw error;
  });
  if (entries === null) return null;
  const result: Record<string, string> = {};
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name === "operation.lock") continue;
    const path = join(root, entry.name);
    if ((await lstat(path)).isSymbolicLink()) result[entry.name] = `link:${await readlink(path)}`;
    else if (entry.isDirectory()) {
      result[entry.name + "/"] = "directory";
      for (const [name, value] of Object.entries((await tree(path))!))
        result[entry.name + "/" + name] = value;
    } else result[entry.name] = (await readFile(path)).toString("hex");
  }
  return result;
}
async function observe(s: WindowsSandbox) {
  const config = await readFile(join(s.workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8");
  return {
    config,
    source: await tree(join(s.workspaceRoot, "src")),
    dependencies: await tree(join(s.workspaceRoot, "types")),
    discovery: await discoverDefinitionFiles(s.workspaceRoot, JSON.parse(config)),
    project: await tree(join(s.workspaceRoot, "Game")),
    state: await tree(local(s, "")),
  };
}
async function evidence(
  id: string,
  body: (s: WindowsSandbox, observations: unknown[]) => Promise<void>,
) {
  await withWindowsSandbox(id.toLowerCase(), async (s) => {
    const startedAt = new Date().toISOString();
    const observations: unknown[] = [];
    let failure: unknown;
    try {
      await body(s, observations);
    } catch (error) {
      failure = error;
      throw error;
    } finally {
      await recordEvidence({
        requirementId: id,
        startedAt,
        stages: [
          "Public Workspace API/CLI and actual filesystem/process checkpoints, complete byte and compilation basis comparison",
        ],
        expected:
          "Content-proven recovery records only original completed writes, preserves frozen compilation assumptions, safely retires pending and continues ordinary checks",
        actual: {
          observations,
          finalState: await observe(s),
          processes: s.processes,
          entry: s.cliEntry,
        },
        ...(failure === undefined ? {} : { error: failure }),
      });
    }
  });
}
async function manifest(s: WindowsSandbox) {
  return JSON.parse(await readFile(local(s, "sync-manifest.json"), "utf8"));
}
function ordered(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(ordered);
  if (value !== null && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, ordered(item)]),
    );
  return value;
}
async function preconstruct(
  s: WindowsSandbox,
  generated: Map<string, Buffer>,
  original: Awaited<ReturnType<typeof manifest>>,
) {
  await mkdir(local(s, "pending-push/backup"), { recursive: true });
  const affectedFiles = [];
  for (const [name, bytes] of generated) {
    const old = await readFile(local(s, "project-data-snapshot/" + name));
    await writeFile(local(s, "pending-push/backup/" + name), old);
    affectedFiles.push({
      relativePath: name,
      backupRelativePath: name,
      backupHash: hash(old),
      snapshotHash: hash(old),
      generatedHash: hash(bytes),
    });
  }
  await writeFile(
    local(s, "pending-push/pending-push.json"),
    writeStableJson({
      version: 3,
      startedAt: "2026-10-19T00:00:00.000Z",
      projectRootBinding: original.projectRootBinding,
      originalManifest: original,
      originalManifestHash: hash(Buffer.from(writeStableJson(ordered(original)))),
      affectedFiles,
    }),
  );
}
async function prepare(s: WindowsSandbox) {
  const fixture = await createMinimalProject(s.workspaceRoot);
  fixture.projectFiles["CommonEvents.json"][1].name = "Original �";
  fixture.projectFiles["System.json"].switches[1] = "Switch �";
  for (const name of ["CommonEvents.json", "System.json"])
    await writeFile(live(s, name), JSON.stringify(fixture.projectFiles[name]));
  await api.initWorkspace({ ...s, projectRoot: "./Game" });
  await api.cloneWorkspace(s);
  await api.decompileWorkspace(s);
  for (const [name, from, to] of [
    ["common-events.events.ts", "Original �", "Written �"],
    ["system.dsl.ts", "Switch �", "Written switch �"],
  ]) {
    const path = join(s.workspaceRoot, "src/decompiled", name!);
    await writeFile(path, (await readFile(path, "utf8")).replace(from!, to!));
  }
  await mkdir(join(s.workspaceRoot, "types"));
  await writeFile(join(s.workspaceRoot, "types/name.d.ts"), "export type Name = string;\n");
  const source = join(s.workspaceRoot, "src/decompiled/common-events.events.ts");
  await writeFile(
    source,
    `import type { Name } from "../../types/name.js";\n${await readFile(source, "utf8")}\nconst checkedName: Name = "Written �";\n`,
  );
  await api.compileWorkspace({ ...s, check: false });
  const old = await manifest(s);
  const before = await observe(s);
  const generated = new Map<string, Buffer>();
  for (const name of ["CommonEvents.json", "System.json"])
    generated.set(name, await readFile(local(s, "generated-project-data/" + name)));
  expect(JSON.parse(generated.get("CommonEvents.json")!.toString())[1]).toStrictEqual({
    ...fixture.projectFiles["CommonEvents.json"][1],
    name: "Written �",
  });
  expect(JSON.parse(generated.get("System.json")!.toString())).toStrictEqual({
    ...fixture.projectFiles["System.json"],
    switches: ["", "Written switch �"],
  });
  return { old, before, generated };
}
async function interrupt(
  s: WindowsSandbox,
  boundary:
    | "push-snapshot-installed"
    | "push-prewrite"
    | "push-manifest-installed"
    | "push-retirement-installed",
  captureFile = "CommonEvents.json",
) {
  const child = startWorkspaceOperation(s, { operation: "push", boundary, captureFile });
  try {
    await child.waitFor("checkpoint");
  } finally {
    await child.stop("SIGTERM");
  }
}
it("MV-S4-RECOVERY-001: finishes an actual killed Push with a partially refreshed Snapshot", async () => {
  await evidence("MV-S4-RECOVERY-001", async (s, observations) => {
    const { old, before, generated } = await prepare(s);
    await interrupt(s, "push-snapshot-installed");
    for (const [name, bytes] of generated) expect(await readFile(live(s, name))).toEqual(bytes);
    expect(await readFile(local(s, "project-data-snapshot/CommonEvents.json"))).toEqual(
      generated.get("CommonEvents.json"),
    );
    expect(await readFile(local(s, "project-data-snapshot/System.json"))).not.toEqual(
      generated.get("System.json"),
    );
    expect(await manifest(s)).toStrictEqual(old);
    observations.push(await observe(s));
    await api.pushWorkspace({ ...s, allowDestructive: false });
    for (const [name, bytes] of generated)
      expect(await readFile(local(s, "project-data-snapshot/" + name))).toEqual(bytes);
    const final = await manifest(s);
    expect(final.compileBaseline).toStrictEqual({
      ...old.compileBaseline,
      snapshotFiles: final.snapshotFiles,
      hash: expect.any(String),
    });
    expect(final.snapshotFiles).toStrictEqual(
      old.snapshotFiles.map((entry: { relativePath: string; hash: string }) =>
        generated.has(entry.relativePath)
          ? { ...entry, hash: hash(generated.get(entry.relativePath)!) }
          : entry,
      ),
    );
    expect(await tree(local(s, "pending-push"))).toBeNull();
    expect(await api.isGeneratedProjectDataFresh(s)).toBe(true);
    const after = await observe(s);
    expect(after.source).toStrictEqual(before.source);
    expect(after.config).toBe(before.config);
    expect(after.discovery).toStrictEqual(before.discovery);
    await runCli(s, ["push"]);
    observations.push(after);
  });
}, 30000);

it("MV-S4-RECOVERY-008: resumes repeated real process deaths across Snapshot, manifest and retirement", async () => {
  await evidence("MV-S4-RECOVERY-008", async (s, observations) => {
    const { generated } = await prepare(s);
    await interrupt(s, "push-snapshot-installed");
    const pending = await tree(local(s, "pending-push"));
    observations.push({ phase: "partial-snapshot", state: await observe(s) });
    await interrupt(s, "push-manifest-installed");
    expect(await tree(local(s, "pending-push"))).toStrictEqual(pending);
    const committed = await manifest(s);
    observations.push({ phase: "manifest-committed", state: await observe(s) });
    await interrupt(s, "push-retirement-installed");
    expect(await tree(local(s, "pending-push"))).toBeNull();
    expect(await manifest(s)).toStrictEqual(committed);
    const retired = (await readdir(local(s, ""))).find((name) =>
      name.startsWith("pending-push.retired-"),
    )!;
    expect(await tree(local(s, retired + "/operation"))).toStrictEqual(pending);
    const before = await observe(s);
    observations.push({ phase: "retired", state: before });
    await api.pushWorkspace({ ...s, allowDestructive: false });
    expect(await observe(s)).toStrictEqual(before);
    for (const [name, bytes] of generated) expect(await readFile(live(s, name))).toEqual(bytes);
    expect(await api.isGeneratedProjectDataFresh(s)).toBe(true);
  });
}, 30000);

function byteCollision(bytes: Buffer) {
  const index = bytes.indexOf(Buffer.from("�"));
  expect(index).toBeGreaterThanOrEqual(0);
  const changed = Buffer.concat([
    bytes.subarray(0, index),
    Buffer.from([0xff]),
    bytes.subarray(index + 3),
  ]);
  expect(changed.toString()).toBe(bytes.toString());
  expect(hash(changed)).not.toBe(hash(bytes));
  return changed;
}
it("MV-S4-RECOVERY-009: compares original bytes for live, backup, generated and Snapshot evidence", async () => {
  await evidence("MV-S4-RECOVERY-009", async (s, observations) => {
    const { old, generated } = await prepare(s);
    await preconstruct(s, generated, old);
    for (const path of [
      live(s, "CommonEvents.json"),
      local(s, "pending-push/backup/CommonEvents.json"),
      local(s, "generated-project-data/CommonEvents.json"),
      local(s, "project-data-snapshot/CommonEvents.json"),
    ]) {
      const original = await readFile(path);
      await writeFile(path, byteCollision(original));
      const before = await observe(s);
      await expect(api.pushWorkspace({ ...s, allowDestructive: false })).rejects.toThrow();
      expect(await observe(s)).toStrictEqual(before);
      expect(await tree(local(s, "pending-push"))).not.toBeNull();
      observations.push({ path, rawDigest: hash(await readFile(path)), preserved: true });
      await writeFile(path, original);
    }
  });
}, 30000);

it.each(["push-after-install", "push-generated-capture", "push-snapshot-candidate"] as const)(
  "MV-S4-RECOVERY-010: refuses late generated mutation at actual consumption boundaries (%s)",
  async (boundary) => {
    await evidence("MV-S4-RECOVERY-010", async (s, observations) => {
      const { old, generated } = await prepare(s);
      if (boundary !== "push-after-install") {
        await preconstruct(s, generated, old);
        for (const [name, bytes] of generated) await writeFile(live(s, name), bytes);
      }
      const child = startWorkspaceOperation(s, {
        operation: "push",
        boundary,
        captureFile: boundary === "push-after-install" ? "System.json" : "CommonEvents.json",
      });
      try {
        await child.waitFor("checkpoint");
        const path = local(s, "generated-project-data/CommonEvents.json");
        await writeFile(path, byteCollision(generated.get("CommonEvents.json")!));
        const before = await observe(s);
        observations.push({ boundary, before });
        child.send("release");
        const result = await child.waitFor("result");
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/generated data (integrity|changed)/iu);
        await child.ended;
        const expected =
          boundary === "push-after-install"
            ? {
                ...before,
                project: Object.fromEntries(
                  Object.entries(before.project!).filter(
                    ([name]) => !name.startsWith("data/push-staging.tmp-"),
                  ),
                ),
              }
            : before;
        expect(await observe(s)).toStrictEqual(expected);
        expect(await manifest(s)).toStrictEqual(old);
        expect(await tree(local(s, "pending-push"))).not.toBeNull();
        await writeFile(path, generated.get("CommonEvents.json")!);
        await api.pushWorkspace({ ...s, allowDestructive: false });
        for (const [name, bytes] of generated)
          expect(await readFile(local(s, "project-data-snapshot/" + name))).toEqual(bytes);
      } finally {
        await child.stop();
      }
    });
  },
  30000,
);

it.each([
  "push-snapshot-failure",
  "snapshot-manifest-failure",
  "push-retirement-directory-failure",
  "push-retirement-failure",
  "push-retirement-cleanup-failure",
] as const)(
  "MV-S4-RECOVERY-011: preserves the appropriate authority across deterministic I/O failures (%s)",
  async (boundary) => {
    await evidence("MV-S4-RECOVERY-011", async (s, observations) => {
      const { old, generated } = await prepare(s);
      await preconstruct(s, generated, old);
      for (const [name, bytes] of generated) await writeFile(live(s, name), bytes);
      const original = await observe(s);
      const pending = await tree(local(s, "pending-push"));
      const child = startWorkspaceOperation(s, {
        operation: "push",
        boundary,
        captureFile: "System.json",
      });
      try {
        const result = await child.waitFor("result");
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/(Controlled|cleanup failed)/u);
        await child.ended;
      } finally {
        await child.stop();
      }
      const after = await observe(s);
      expect(after.project).toStrictEqual(original.project);
      expect(after.source).toStrictEqual(original.source);
      expect(after.config).toBe(original.config);
      expect(after.discovery).toStrictEqual(original.discovery);
      observations.push({ boundary, after });
      if (boundary === "push-retirement-cleanup-failure") {
        expect(await tree(local(s, "pending-push"))).toBeNull();
        const retired = (await readdir(local(s, ""))).find((name) =>
          name.startsWith("pending-push.retired-"),
        )!;
        expect(await tree(local(s, retired + "/operation"))).not.toStrictEqual(pending);
        expect(await tree(local(s, retired + "/operation"))).not.toBeNull();
      } else expect(await tree(local(s, "pending-push"))).toStrictEqual(pending);
      if (boundary === "push-snapshot-failure") {
        expect(await manifest(s)).toStrictEqual(old);
        expect(await readFile(local(s, "project-data-snapshot/CommonEvents.json"))).toEqual(
          generated.get("CommonEvents.json"),
        );
        expect(await readFile(local(s, "project-data-snapshot/System.json"))).not.toEqual(
          generated.get("System.json"),
        );
      } else if (boundary === "snapshot-manifest-failure")
        expect(await manifest(s)).toStrictEqual(old);
      else expect((await manifest(s)).snapshotFiles).not.toStrictEqual(old.snapshotFiles);
      await api.pushWorkspace({ ...s, allowDestructive: false });
      for (const [name, bytes] of generated)
        expect(await readFile(local(s, "project-data-snapshot/" + name))).toEqual(bytes);
      expect(await tree(local(s, "pending-push"))).toBeNull();
      expect(await api.isGeneratedProjectDataFresh(s)).toBe(true);
    });
  },
  30000,
);

it("MV-S4-RECOVERY-012: refuses a committed manifest whose Snapshot or live content contradicts completion", async () => {
  await evidence("MV-S4-RECOVERY-012", async (s, observations) => {
    const { old, generated } = await prepare(s);
    await interrupt(s, "push-manifest-installed");
    for (const location of [
      "project-data-snapshot/CommonEvents.json",
      "live/CommonEvents.json",
      "live/System.json",
    ]) {
      const path = location.startsWith("live/") ? live(s, location.slice(5)) : local(s, location);
      const completed = await readFile(path);
      const name = location.split("/").at(-1)!;
      await writeFile(path, await readFile(local(s, "pending-push/backup/" + name)));
      const before = await observe(s);
      await expect(api.pushWorkspace({ ...s, allowDestructive: false })).rejects.toThrow(
        /Interrupted Push/u,
      );
      expect(await observe(s)).toStrictEqual(before);
      observations.push({ location, preserved: true });
      await writeFile(path, completed);
    }
    for (const name of generated.keys())
      await writeFile(live(s, name), await readFile(local(s, "pending-push/backup/" + name)));
    const before = await observe(s);
    await expect(api.pushWorkspace({ ...s, allowDestructive: false })).rejects.toThrow(
      /Interrupted Push/u,
    );
    expect(await observe(s)).toStrictEqual(before);
    expect((await manifest(s)).snapshotFiles).not.toStrictEqual(old.snapshotFiles);
  });
}, 30000);

it("MV-S4-RECOVERY-013: non-Push commands and dead-owner lock cleanup preserve pending evidence", async () => {
  await evidence("MV-S4-RECOVERY-013", async (s, observations) => {
    await prepare(s);
    await interrupt(s, "push-prewrite");
    const before = await observe(s);
    observations.push(before);
    for (const command of [
      () => api.cloneWorkspace(s),
      () => api.pullWorkspace(s),
      () => api.decompileWorkspace(s),
      () => api.compileWorkspace({ ...s, check: false }),
      () => api.compileWorkspace({ ...s, check: true }),
      () => api.diffWorkspace(s),
      () => api.isGeneratedProjectDataFresh(s),
    ]) {
      await expect(command()).rejects.toThrow(/Interrupted Push/u);
      expect(await observe(s)).toStrictEqual(before);
    }
    const held = startWorkspaceOperation(s, { operation: "push", boundary: "config" });
    try {
      await held.waitFor("checkpoint");
      const cli = await runCli(s, ["push"], { allowFailure: true });
      expect(cli.exitCode).not.toBe(0);
      expect(cli.stderr).toContain("Workspace is busy");
      expect(await observe(s)).toStrictEqual(before);
    } finally {
      await held.stop();
    }
    await api.pushWorkspace({ ...s, allowDestructive: false });
    expect(await tree(local(s, "pending-push"))).toBeNull();
    expect(await api.isGeneratedProjectDataFresh(s)).toBe(true);
  });
}, 30000);

it.each(["old", "partial", "new"] as const)(
  "MV-S4-RECOVERY-004: completes preconstructed all-generated Snapshot matrix (%s)",
  async (snapshotState) => {
    await evidence("MV-S4-RECOVERY-004", async (s, observations) => {
      const { old, generated, before } = await prepare(s);
      await preconstruct(s, generated, old);
      for (const [name, bytes] of generated) {
        await writeFile(live(s, name), bytes);
        if (
          snapshotState === "new" ||
          (snapshotState === "partial" && name === "CommonEvents.json")
        )
          await writeFile(local(s, "project-data-snapshot/" + name), bytes);
      }
      observations.push({ snapshotState, before: await observe(s) });
      await api.pushWorkspace({ ...s, allowDestructive: false });
      const after = await observe(s);
      for (const [name, bytes] of generated)
        expect(await readFile(local(s, "project-data-snapshot/" + name))).toEqual(bytes);
      const final = await manifest(s);
      expect(final.compileBaseline).toStrictEqual({
        ...old.compileBaseline,
        snapshotFiles: final.snapshotFiles,
        hash: expect.any(String),
      });
      expect(after.project).toStrictEqual({
        ...before.project,
        ...Object.fromEntries(
          [...generated].map(([name, bytes]) => ["data/" + name, bytes.toString("hex")]),
        ),
      });
      expect(after.source).toStrictEqual(before.source);
      expect(after.discovery).toStrictEqual(before.discovery);
      expect(await tree(local(s, "pending-push"))).toBeNull();
      expect(await api.isGeneratedProjectDataFresh(s)).toBe(true);
    });
  },
  30000,
);

it.each([
  "source",
  "discovery",
  "config",
  "dependency-change",
  "dependency-delete",
  "old-contract",
  "missing-types",
] as const)(
  "MV-S4-RECOVERY-005: retains original basis under changed current assumptions (%s)",
  async (change) => {
    await evidence("MV-S4-RECOVERY-005", async (s, observations) => {
      const { old, generated } = await prepare(s);
      if (change === "old-contract" || change === "missing-types") {
        if (change === "old-contract")
          old.compileBaseline.compileContractVersion = "understood-old-contract";
        else delete old.compileBaseline.typeInputs;
        const { hash: _hash, ...basis } = old.compileBaseline;
        old.compileBaseline.hash = hash(Buffer.from(writeStableJson(basis)));
        await writeFile(local(s, "sync-manifest.json"), writeStableJson(old));
      }
      await preconstruct(s, generated, old);
      for (const [name, bytes] of generated) await writeFile(live(s, name), bytes);
      if (change === "source") {
        const p = join(s.workspaceRoot, "src/decompiled/common-events.events.ts");
        await writeFile(p, (await readFile(p, "utf8")) + "\n// changed source\n");
      }
      if (change === "discovery")
        await writeFile(
          join(s.workspaceRoot, "src/extra.events.ts"),
          "export const extra = {kind:'commonEvent',id:2,name:'New',trigger:'none',commands:[]};\n",
        );
      if (change === "config") {
        const p = join(s.workspaceRoot, "rpgmaker-event-dsl.config.json");
        const config = JSON.parse(await readFile(p, "utf8"));
        config.scriptEnabled = !config.scriptEnabled;
        await writeFile(p, JSON.stringify(config));
      }
      if (change === "dependency-change")
        await writeFile(
          join(s.workspaceRoot, "types/name.d.ts"),
          'export type Name = "Changed";\n',
        );
      if (change === "dependency-delete") await rm(join(s.workspaceRoot, "types/name.d.ts"));
      const before = await observe(s);
      observations.push({ change, before });
      await expect(api.pushWorkspace({ ...s, allowDestructive: false })).rejects.toThrow(
        "Generated Project Data is stale before push",
      );
      const after = await observe(s);
      const final = await manifest(s);
      expect(final.compileBaseline).toStrictEqual({
        ...old.compileBaseline,
        snapshotFiles: final.snapshotFiles,
        hash: expect.any(String),
      });
      expect(final.generatedFiles).toStrictEqual(old.generatedFiles);
      expect(after.project).toStrictEqual(before.project);
      expect(after.source).toStrictEqual(before.source);
      expect(after.dependencies).toStrictEqual(before.dependencies);
      expect(after.config).toBe(before.config);
      expect(after.discovery).toStrictEqual(before.discovery);
      expect(await tree(local(s, "pending-push"))).toBeNull();
      expect(await api.isGeneratedProjectDataFresh(s)).toBe(false);
    });
  },
  30000,
);

it.each(["fresh", "stale", "unaffected-drift", "generated-unaffected-drift"] as const)(
  "MV-S4-RECOVERY-006: continues ordinary checks after content-based resolution (%s)",
  async (condition) => {
    await evidence("MV-S4-RECOVERY-006", async (s, observations) => {
      const { old, generated } = await prepare(s);
      await preconstruct(s, generated, old);
      if (condition === "generated-unaffected-drift")
        for (const [name, bytes] of generated) await writeFile(live(s, name), bytes);
      if (condition === "stale") {
        const path = join(s.workspaceRoot, "src/decompiled/common-events.events.ts");
        await writeFile(path, (await readFile(path, "utf8")) + "\n// stale\n");
      }
      if (condition.endsWith("drift"))
        await writeFile(live(s, "Actors.json"), '[null,{"id":1,"name":"External"}]');
      const before = await observe(s);
      observations.push({ condition, before });
      const operation = api.pushWorkspace({ ...s, allowDestructive: false });
      if (condition === "fresh") await operation;
      else
        await expect(operation).rejects.toThrow(
          condition === "stale"
            ? "stale before push"
            : "Project Drift detected before push for Actors.json",
        );
      expect(await tree(local(s, "pending-push"))).toBeNull();
      const after = await observe(s);
      expect(after.source).toStrictEqual(before.source);
      expect(after.config).toBe(before.config);
      expect(after.discovery).toStrictEqual(before.discovery);
      if (condition !== "fresh") expect(after.project).toStrictEqual(before.project);
      if (condition === "stale" || condition === "unaffected-drift") {
        expect(await manifest(s)).toStrictEqual(old);
        expect(await tree(local(s, "project-data-snapshot"))).toStrictEqual(
          Object.fromEntries(
            Object.entries(before.state!)
              .filter(
                ([key]) =>
                  key.startsWith("project-data-snapshot/") && key !== "project-data-snapshot/",
              )
              .map(([key, value]) => [key.slice("project-data-snapshot/".length), value]),
          ),
        );
      } else
        for (const [name, bytes] of generated)
          expect(await readFile(local(s, "project-data-snapshot/" + name))).toEqual(bytes);
    });
  },
  30000,
);

it("MV-S4-RECOVERY-014: rejects an incomplete affected set instead of losing pending authority", async () => {
  await evidence("MV-S4-RECOVERY-014", async (s, observations) => {
    const { old, generated } = await prepare(s);
    await preconstruct(s, generated, old);
    for (const [name, bytes] of generated) await writeFile(live(s, name), bytes);
    const path = local(s, "pending-push/pending-push.json");
    const p = JSON.parse(await readFile(path, "utf8"));
    p.affectedFiles.pop();
    await writeFile(path, JSON.stringify(p));
    const before = await observe(s);
    observations.push(before);
    await expect(api.pushWorkspace({ ...s, allowDestructive: false })).rejects.toThrow(
      /Interrupted Push/u,
    );
    expect(await observe(s)).toStrictEqual(before);
  });
}, 30000);

it("MV-S4-RECOVERY-007: refuses contradictory live and recovery evidence without state changes", async () => {
  await evidence("MV-S4-RECOVERY-007", async (s, observations) => {
    const { old, generated } = await prepare(s);
    await preconstruct(s, generated, old);
    const pendingPath = local(s, "pending-push/pending-push.json");
    const validPending = await readFile(pendingPath);
    const originalSystem = await readFile(live(s, "System.json"));
    const originalCommon = await readFile(live(s, "CommonEvents.json"));
    const mutations: Array<[string, string, () => Promise<void>]> = [
      [
        "mixed-live",
        live(s, "CommonEvents.json"),
        () => writeFile(live(s, "CommonEvents.json"), generated.get("CommonEvents.json")!),
      ],
      ["missing-live", live(s, "CommonEvents.json"), () => rm(live(s, "CommonEvents.json"))],
      [
        "unknown-live",
        live(s, "CommonEvents.json"),
        () => writeFile(live(s, "CommonEvents.json"), "[]"),
      ],
      [
        "semantic-only-live",
        live(s, "CommonEvents.json"),
        () =>
          writeFile(
            live(s, "CommonEvents.json"),
            JSON.stringify(JSON.parse(originalCommon.toString()), null, 4),
          ),
      ],
      [
        "snapshot-partial-with-old-live",
        local(s, "project-data-snapshot/CommonEvents.json"),
        () =>
          writeFile(
            local(s, "project-data-snapshot/CommonEvents.json"),
            generated.get("CommonEvents.json")!,
          ),
      ],
      [
        "snapshot-U-corruption",
        local(s, "project-data-snapshot/Actors.json"),
        () => writeFile(local(s, "project-data-snapshot/Actors.json"), "[]"),
      ],
      [
        "backup-corruption",
        local(s, "pending-push/backup/CommonEvents.json"),
        () => writeFile(local(s, "pending-push/backup/CommonEvents.json"), "[]"),
      ],
      [
        "generated-corruption",
        local(s, "generated-project-data/CommonEvents.json"),
        () => writeFile(local(s, "generated-project-data/CommonEvents.json"), "[]"),
      ],
      [
        "generated-missing",
        local(s, "generated-project-data/System.json"),
        () => rm(local(s, "generated-project-data/System.json")),
      ],
      [
        "generated-extra",
        local(s, "generated-project-data/Unexpected.json"),
        () => writeFile(local(s, "generated-project-data/Unexpected.json"), "[]"),
      ],
      [
        "manifest-third-state",
        local(s, "sync-manifest.json"),
        () =>
          writeFile(
            local(s, "sync-manifest.json"),
            writeStableJson({ ...old, generatedFiles: [] }),
          ),
      ],
    ];
    for (const [label, path, change] of mutations) {
      const original = await readFile(path).catch(() => null);
      await change();
      const before = await observe(s);
      await expect(api.pushWorkspace({ ...s, allowDestructive: false })).rejects.toThrow(
        /Interrupted Push/u,
      );
      expect(await observe(s)).toStrictEqual(before);
      observations.push({ label, preserved: true });
      if (original === null) await rm(path, { force: true });
      else await writeFile(path, original);
    }
    for (const [label, change] of [
      [
        "unknown-format",
        (p: CorruptPending) => {
          p.version = 999;
        },
      ],
      [
        "previous-pending-format",
        (p: CorruptPending) => {
          p.version = 2;
        },
      ],
      [
        "duplicate-A",
        (p: CorruptPending) => {
          p.affectedFiles.push(p.affectedFiles[0]!);
        },
      ],
      [
        "wrong-binding",
        (p: CorruptPending) => {
          p.projectRootBinding += "-wrong";
        },
      ],
      [
        "wrong-original-hash",
        (p: CorruptPending) => {
          p.originalManifestHash = "0".repeat(64);
        },
      ],
      [
        "wrong-O",
        (p: CorruptPending) => {
          p.affectedFiles[0]!.snapshotHash = "0".repeat(64);
        },
      ],
      [
        "wrong-N",
        (p: CorruptPending) => {
          p.affectedFiles[0]!.generatedHash = "0".repeat(64);
        },
      ],
      [
        "wrong-backup-mapping",
        (p: CorruptPending) => {
          p.affectedFiles[0]!.backupRelativePath = "System.json";
        },
      ],
      [
        "missing-original",
        (p: CorruptPending) => {
          delete p.originalManifest;
        },
      ],
    ] as const) {
      const p = JSON.parse(validPending.toString());
      change(p);
      await writeFile(pendingPath, JSON.stringify(p));
      const before = await observe(s);
      await expect(api.pushWorkspace({ ...s, allowDestructive: false })).rejects.toThrow(
        /Interrupted Push/u,
      );
      expect(await observe(s)).toStrictEqual(before);
      observations.push({ label, preserved: true });
      await writeFile(pendingPath, validPending);
    }
    expect(await readFile(live(s, "System.json"))).toEqual(originalSystem);
    for (const [name, bytes] of generated) await writeFile(live(s, name), bytes);
    const path = local(s, "project-data-snapshot/CommonEvents.json");
    const snapshot = await readFile(path);
    for (const bytes of [
      null,
      Buffer.from("[]"),
      Buffer.from(JSON.stringify(JSON.parse(snapshot.toString()), null, 4)),
    ]) {
      if (bytes === null) await rm(path);
      else await writeFile(path, bytes);
      const before = await observe(s);
      await expect(api.pushWorkspace({ ...s, allowDestructive: false })).rejects.toThrow(
        /Interrupted Push/u,
      );
      expect(await observe(s)).toStrictEqual(before);
      observations.push({
        allGenerated: true,
        snapshotContent: bytes === null ? "missing" : hash(bytes),
        preserved: true,
      });
      await writeFile(path, snapshot);
    }
  });
}, 30000);

it.each([
  "push-retirement-directory-failure",
  "push-retirement-failure",
  "push-retirement-cleanup-failure",
] as const)(
  "MV-S4-RECOVERY-016: all-Snapshot abandonment completes retirement before any new write (%s)",
  async (boundary) => {
    await evidence("MV-S4-RECOVERY-016", async (s, observations) => {
      const { old, generated } = await prepare(s);
      await preconstruct(s, generated, old);
      const before = await observe(s);
      const originalSnapshot = await tree(local(s, "project-data-snapshot"));
      const originalGenerated = await tree(local(s, "generated-project-data"));
      const pending = await tree(local(s, "pending-push"));
      const child = startWorkspaceOperation(s, { operation: "push", boundary });
      try {
        const result = await child.waitFor("result");
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/Interrupted Push/u);
        await child.ended;
      } finally {
        await child.stop();
      }
      const after = await observe(s);
      expect(after.project).toStrictEqual(before.project);
      expect(after.source).toStrictEqual(before.source);
      expect(after.config).toBe(before.config);
      expect(after.discovery).toStrictEqual(before.discovery);
      expect(await manifest(s)).toStrictEqual(old);
      expect(await tree(local(s, "project-data-snapshot"))).toStrictEqual(originalSnapshot);
      expect(await tree(local(s, "generated-project-data"))).toStrictEqual(originalGenerated);
      expect(await tree(local(s, "pending-push"))).toStrictEqual(
        boundary === "push-retirement-cleanup-failure" ? null : pending,
      );
      observations.push({ boundary, after });
      await api.pushWorkspace({ ...s, allowDestructive: false });
      for (const [name, bytes] of generated) expect(await readFile(live(s, name))).toEqual(bytes);
      expect(await tree(local(s, "pending-push"))).toBeNull();
      expect(await api.isGeneratedProjectDataFresh(s)).toBe(true);
    });
  },
  30000,
);

it("MV-S4-RECOVERY-017: recognizes an independently preconstructed committed manifest without rerecording basis", async () => {
  await evidence("MV-S4-RECOVERY-017", async (s, observations) => {
    const { old, generated } = await prepare(s);
    await preconstruct(s, generated, old);
    const snapshotFiles = old.snapshotFiles.map((entry: { relativePath: string; hash: string }) =>
      generated.has(entry.relativePath)
        ? { ...entry, hash: hash(generated.get(entry.relativePath)!) }
        : entry,
    );
    const basis = {
      compileContractVersion: old.compileBaseline.compileContractVersion,
      typeInputs: old.compileBaseline.typeInputs,
      projectRootBinding: old.compileBaseline.projectRootBinding,
      config: old.compileBaseline.config,
      snapshotFiles,
      sourceFiles: old.compileBaseline.sourceFiles,
    };
    const committed = {
      ...old,
      snapshotFiles,
      compileBaseline: { ...basis, hash: hash(Buffer.from(writeStableJson(basis))) },
    };
    for (const [name, bytes] of generated) {
      await writeFile(live(s, name), bytes);
      await writeFile(local(s, "project-data-snapshot/" + name), bytes);
    }
    await writeFile(local(s, "sync-manifest.json"), writeStableJson(committed));
    const before = await observe(s);
    observations.push(before);
    const originalManifestBytes = await readFile(local(s, "sync-manifest.json"));
    await api.pushWorkspace({ ...s, allowDestructive: false });
    expect(await readFile(local(s, "sync-manifest.json"))).toEqual(originalManifestBytes);
    expect(await manifest(s)).toStrictEqual(committed);
    expect((await observe(s)).project).toStrictEqual(before.project);
    expect(await tree(local(s, "pending-push"))).toBeNull();
    expect(await api.isGeneratedProjectDataFresh(s)).toBe(true);
  });
}, 30000);

it("MV-S4-RECOVERY-002: recognizes a committed manifest with intact pending after actual process death", async () => {
  await evidence("MV-S4-RECOVERY-002", async (s, observations) => {
    const { old, generated } = await prepare(s);
    await interrupt(s, "push-manifest-installed");
    const committed = await manifest(s);
    expect(committed.snapshotFiles).not.toStrictEqual(old.snapshotFiles);
    for (const [name, bytes] of generated)
      expect(await readFile(local(s, "project-data-snapshot/" + name))).toEqual(bytes);
    expect(await tree(local(s, "pending-push"))).not.toBeNull();
    const before = await observe(s);
    observations.push(before);
    await api.pushWorkspace({ ...s, allowDestructive: false });
    expect(await manifest(s)).toStrictEqual(committed);
    expect(await tree(local(s, "pending-push"))).toBeNull();
    expect((await observe(s)).project).toStrictEqual(before.project);
    expect(await api.isGeneratedProjectDataFresh(s)).toBe(true);
  });
}, 30000);

it("MV-S4-RECOVERY-003: finishes preconstructed understood old evidence without manufacturing current Freshness", async () => {
  await evidence("MV-S4-RECOVERY-003", async (s, observations) => {
    const { old, generated } = await prepare(s);
    delete old.compileBaseline.compileContractVersion;
    delete old.compileBaseline.typeInputs;
    const { hash: _hash, ...basis } = old.compileBaseline;
    old.compileBaseline.hash = hash(Buffer.from(writeStableJson(basis)));
    await writeFile(local(s, "sync-manifest.json"), writeStableJson(old));
    await preconstruct(s, generated, old);
    for (const [name, bytes] of generated) await writeFile(live(s, name), bytes);
    const before = await observe(s);
    observations.push(before);
    await expect(api.pushWorkspace({ ...s, allowDestructive: false })).rejects.toThrow(
      "Generated Project Data is stale before push",
    );
    const after = await observe(s);
    const final = await manifest(s);
    expect(final.compileBaseline).toStrictEqual({
      ...old.compileBaseline,
      snapshotFiles: final.snapshotFiles,
      hash: expect.any(String),
    });
    expect(final.compileBaseline).not.toHaveProperty("compileContractVersion");
    expect(final.compileBaseline).not.toHaveProperty("typeInputs");
    expect(final.generatedFiles).toStrictEqual(old.generatedFiles);
    expect(after.source).toStrictEqual(before.source);
    expect(after.discovery).toStrictEqual(before.discovery);
    expect(after.config).toBe(before.config);
    expect(after.project).toStrictEqual(before.project);
    expect(await tree(local(s, "pending-push"))).toBeNull();
    expect(await api.isGeneratedProjectDataFresh(s)).toBe(false);
    observations.push(after);
  });
}, 30000);

it.each(["pending-push/pending-push.json", "sync-manifest.json"] as const)(
  "MV-S4-RECOVERY-018: rejects byte-corrupt metadata even when replacement decoding produces identical fields (%s)",
  async (relative) => {
    await evidence("MV-S4-RECOVERY-018", async (s, observations) => {
      const { generated } = await prepare(s);
      await rename(
        join(s.workspaceRoot, "src/decompiled/common-events.events.ts"),
        join(s.workspaceRoot, "src/decompiled/common-�.events.ts"),
      );
      await api.compileWorkspace({ ...s, check: false });
      const old = await manifest(s);
      await preconstruct(s, generated, old);
      const path = local(s, relative);
      const original = await readFile(path);
      await writeFile(path, byteCollision(original));
      const before = await observe(s);
      observations.push({ relative, before });
      await expect(api.pushWorkspace({ ...s, allowDestructive: false })).rejects.toThrow(
        /Interrupted Push/u,
      );
      expect(await observe(s)).toStrictEqual(before);
      expect(await tree(local(s, "pending-push"))).not.toBeNull();
    });
  },
  30000,
);
