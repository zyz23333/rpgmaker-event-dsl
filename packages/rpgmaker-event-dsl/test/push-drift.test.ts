import { createHash } from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  readlink,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import { discoverDefinitionFiles } from "../src/workspace/definitions.js";
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
const standard = [
  "Actors.json",
  "Animations.json",
  "Armors.json",
  "Classes.json",
  "CommonEvents.json",
  "Enemies.json",
  "Items.json",
  "MapInfos.json",
  "Skills.json",
  "States.json",
  "System.json",
  "Tilesets.json",
  "Troops.json",
  "Weapons.json",
  "Map001.json",
  "Map1001.json",
];
const statePath = (sandbox: WindowsSandbox, name: string) =>
  join(sandbox.workspaceRoot, ".rpgmaker-event-dsl", name);
const live = (sandbox: WindowsSandbox, name: string) =>
  join(sandbox.workspaceRoot, "Game/data", name);
const hash = (value: Uint8Array) => createHash("sha256").update(value).digest("hex");
async function tree(root: string): Promise<Record<string, string> | null> {
  const entries = await readdir(root, { withFileTypes: true }).catch((error: unknown) => {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return null;
    throw error;
  });
  if (entries === null) return null;
  const result: Record<string, string> = {};
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isSymbolicLink())
      result[entry.name] = `link:${await readlink(join(root, entry.name))}`;
    else if (entry.isDirectory()) {
      result[`${entry.name}/`] = "directory";
      for (const [name, value] of Object.entries((await tree(join(root, entry.name)))!))
        result[`${entry.name}/${name}`] = value;
    } else result[entry.name] = (await readFile(join(root, entry.name))).toString("hex");
  }
  return result;
}
async function observe(sandbox: WindowsSandbox) {
  const config = await readFile(
    join(sandbox.workspaceRoot, "rpgmaker-event-dsl.config.json"),
    "utf8",
  );
  return {
    config,
    source: await tree(join(sandbox.workspaceRoot, "src")),
    discovery: await discoverDefinitionFiles(sandbox.workspaceRoot, JSON.parse(config)),
    project: await tree(join(sandbox.workspaceRoot, "Game")),
    snapshot: await tree(statePath(sandbox, "project-data-snapshot")),
    generated: await tree(statePath(sandbox, "generated-project-data")),
    manifest: await readFile(statePath(sandbox, "sync-manifest.json"), "utf8").catch(
      (error: unknown) => {
        if (error instanceof Error && "code" in error && error.code === "ENOENT") return null;
        throw error;
      },
    ),
    pending: await tree(statePath(sandbox, "pending-push")),
  };
}
function reverseKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(reverseKeys);
  if (typeof value === "object" && value !== null)
    return Object.fromEntries(
      Object.entries(value)
        .reverse()
        .map(([key, entry]) => [key, reverseKeys(entry)]),
    );
  return value;
}
async function prepare(sandbox: WindowsSandbox, reversed = false) {
  const fixture = await createMinimalProject(sandbox.workspaceRoot);
  fixture.projectFiles["CommonEvents.json"][1].name = "Original �";
  fixture.projectFiles["Actors.json"] = [null, { id: 1, name: "Actor �" }];
  fixture.projectFiles["System.json"].switches[1] = "Switch �";
  await writeFile(
    live(sandbox, "System.json"),
    JSON.stringify(fixture.projectFiles["System.json"]),
  );
  await writeFile(
    live(sandbox, "CommonEvents.json"),
    JSON.stringify(fixture.projectFiles["CommonEvents.json"]),
  );
  await writeFile(
    live(sandbox, "Actors.json"),
    JSON.stringify(fixture.projectFiles["Actors.json"]),
  );
  await writeFile(
    live(sandbox, "MapInfos.json"),
    '[null,{"id":1,"name":"Map"},{"id":1001,"name":"High"}]',
  );
  for (const name of ["Map001.json", "Map1001.json"])
    await writeFile(live(sandbox, name), '{"events":[null],"opaque":{"text":"CR\\r"}}');
  if (reversed)
    for (const name of standard) {
      await writeFile(
        live(sandbox, name),
        JSON.stringify(reverseKeys(JSON.parse(await readFile(live(sandbox, name), "utf8")))),
      );
    }
  await api.initWorkspace({ workspaceRoot: sandbox.workspaceRoot, projectRoot: "./Game" });
  await api.cloneWorkspace(sandbox);
  await api.decompileWorkspace(sandbox);
  await api.compileWorkspace({ ...sandbox, check: true });
  await api.compileWorkspace({ ...sandbox, check: false });
  expect(
    JSON.parse(
      await readFile(statePath(sandbox, "generated-project-data/CommonEvents.json"), "utf8"),
    ),
  ).toEqual(fixture.projectFiles["CommonEvents.json"]);
  return fixture;
}
async function authorAffected(sandbox: WindowsSandbox) {
  const source = join(sandbox.workspaceRoot, "src/decompiled/common-events.events.ts");
  await writeFile(
    source,
    (await readFile(source, "utf8")).replace('name: "Original �"', 'name: "Authored �"'),
  );
  await writeFile(
    join(sandbox.workspaceRoot, "src/decompiled/system.dsl.ts"),
    'import { switchDefinition } from "rpgmaker-event-dsl";\nexport const changed = switchDefinition({id:1,name:"Authored switch"});',
  );
  await api.compileWorkspace({ ...sandbox, check: false });
}
it("canonical high maps support Diff filters and safe interrupted Push", async () => {
  await withWindowsSandbox("push-drift", async (sandbox) => {
    await prepare(sandbox);
    const source = join(sandbox.workspaceRoot, "src/decompiled/maps/Map1001.events.ts");
    await writeFile(
      source,
      'import { mapEvent, page } from "rpgmaker-event-dsl";\nexport const high=mapEvent({mapId:1001,id:1,name:"High event",x:0,y:0,pages:[page({commands:[]})]});\n',
    );
    await api.compileWorkspace({ ...sandbox, check: false });
    const before = await observe(sandbox);
    const diff = await api.diffWorkspace(sandbox);
    expect(diff).toContain("mapId 1001, eventId 1");
    expect(diff).toContain("[generated-only]");
    expect((await runCli(sandbox, ["diff", "--file", "Map1001.json"])).stdout).toContain(
      "mapId 1001, eventId 1",
    );
    expect(await observe(sandbox)).toEqual(before);
    for (const name of [
      "../Map1001.json",
      "Map01001.json",
      "Map000.json",
      "Map9007199254740992.json",
    ])
      await expect(api.diffWorkspace({ ...sandbox, file: name })).rejects.toThrow(
        /Project Data File/iu,
      );
    const operation = startWorkspaceOperation(sandbox, {
      operation: "push",
      boundary: "push-after-install",
      captureFile: "Map1001.json",
    });
    try {
      await operation.waitFor(["checkpoint", "result"]);
      expect(operation.messages.some(({ kind }) => kind === "checkpoint")).toBe(true);
      await operation.stop("SIGTERM");
    } finally {
      await operation.stop();
    }
    const interrupted = await observe(sandbox);
    expect(interrupted.project!["data/Map1001.json"]).toBe(before.generated!["Map1001.json"]);
    expect(interrupted.snapshot).toEqual(before.snapshot);
    expect(interrupted.manifest).toBe(before.manifest);
    expect(
      Object.keys(interrupted.pending!).filter(
        (name) => name.startsWith("backup/") && name.endsWith(".json"),
      ),
    ).toEqual(["backup/Map1001.json"]);
    await runCli(sandbox, ["push"]);
    const after = await observe(sandbox);
    expect(after.pending).toBeNull();
    const retainedStaging = Object.fromEntries(
      Object.entries(interrupted.project!).filter(([name]) => name.includes("/push-staging.tmp-")),
    );
    expect(after.project).toEqual({
      ...before.project,
      ...retainedStaging,
      "data/Map1001.json": before.generated!["Map1001.json"],
    });
    expect(after.snapshot).toEqual({
      ...before.snapshot,
      "Map1001.json": before.generated!["Map1001.json"],
    });
    expect({
      ...after,
      project: before.project,
      snapshot: before.snapshot,
      manifest: before.manifest,
    }).toEqual(before);
  });
}, 30000);
it("only Affected backups and writes preserve exact captured bytes", async () => {
  await withWindowsSandbox("push-drift", async (sandbox) => {
    await prepare(sandbox);
    await authorAffected(sandbox);
    const before = await observe(sandbox);
    const operation = startWorkspaceOperation(sandbox, {
      operation: "push",
      boundary: "push-prewrite",
    });
    try {
      await operation.waitFor("checkpoint");
      const checkpoint = await observe(sandbox);
      expect(checkpoint.pending!["backup/CommonEvents.json"]).toBe(
        before.snapshot!["CommonEvents.json"],
      );
      const staging = Object.keys(checkpoint.project!).find((name) =>
        /^data\/push-staging\.tmp-[^/]+\/$/u.test(name),
      )!;
      expect(checkpoint.project).toEqual({
        ...before.project,
        [staging]: "directory",
        [`${staging}CommonEvents.json`]: before.generated!["CommonEvents.json"],
        [`${staging}System.json`]: before.generated!["System.json"],
      });
      expect(
        Object.keys(checkpoint.pending!).filter(
          (name) => name.startsWith("backup/") && name.endsWith(".json"),
        ),
      ).toEqual(["backup/CommonEvents.json", "backup/System.json"]);
      operation.send("release");
      const result = await operation.waitFor("result");
      expect(result.ok).toBe(true);
    } finally {
      await operation.stop();
    }
    const after = await observe(sandbox);
    expect(after.project).toEqual({
      ...before.project,
      "data/CommonEvents.json": before.generated!["CommonEvents.json"],
      "data/System.json": before.generated!["System.json"],
    });
    expect(after.snapshot).toEqual({
      ...before.snapshot,
      "CommonEvents.json": before.generated!["CommonEvents.json"],
      "System.json": before.generated!["System.json"],
    });
    expect({
      ...after,
      project: before.project,
      snapshot: before.snapshot,
      manifest: before.manifest,
    }).toEqual(before);
  });
}, 30000);
it("staging rechecks actual generated bytes before live replacement", async () => {
  await withWindowsSandbox("push-drift", async (sandbox) => {
    await prepare(sandbox);
    await authorAffected(sandbox);
    const before = await observe(sandbox);
    const path = statePath(sandbox, "generated-project-data/CommonEvents.json");
    const original = await readFile(path);
    const position = original.indexOf(Buffer.from([0xef, 0xbf, 0xbd]));
    expect(position).toBeGreaterThan(0);
    const external = Buffer.concat([
      original.subarray(0, position),
      Buffer.from([0xff]),
      original.subarray(position + 3),
    ]);
    const operation = startWorkspaceOperation(sandbox, {
      operation: "push",
      boundary: "push-generated-capture",
      captureFile: "CommonEvents.json",
    });
    try {
      await operation.waitFor("checkpoint");
      await writeFile(path, external);
      operation.send("release");
      const result = await operation.waitFor("result");
      expect(result.ok).toBe(false);
      expect(result.message).toMatch(/Generated|stage/iu);
    } finally {
      await operation.stop();
    }
    const after = await observe(sandbox);
    expect(after).toEqual({
      ...before,
      generated: { ...before.generated, "CommonEvents.json": external.toString("hex") },
    });
  });
}, 30000);
it("postwrite check preserves an external edit to an already written affected file", async () => {
  await withWindowsSandbox("push-drift", async (sandbox) => {
    await prepare(sandbox);
    await authorAffected(sandbox);
    const before = await observe(sandbox);
    const external = Buffer.from('{"external":"changed after its generated replacement"}');
    const operation = startWorkspaceOperation(sandbox, {
      operation: "push",
      boundary: "push-after-install",
      captureFile: "System.json",
    });
    try {
      await operation.waitFor("checkpoint");
      await writeFile(live(sandbox, "CommonEvents.json"), external);
      operation.send("release");
      const result = await operation.waitFor("result");
      expect(result.ok).toBe(false);
      expect(result.message).toMatch(/Drift/iu);
    } finally {
      await operation.stop();
    }
    const after = await observe(sandbox);
    expect({ ...after, project: before.project, pending: before.pending }).toEqual(before);
    expect(after.project).toEqual({
      ...before.project,
      "data/CommonEvents.json": external.toString("hex"),
      "data/System.json": before.generated!["System.json"],
    });
    expect(after.pending).not.toBeNull();
  });
}, 30000);
it.each(["directory", "junction", "unsupported"] as const)(
  "atomic installation preserves directory and junction arrivals and fails safely when unsupported (%s)",
  async (mode) => {
    await withWindowsSandbox("push-drift", async (sandbox) => {
      await prepare(sandbox);
      await authorAffected(sandbox);
      const before = await observe(sandbox);
      const outside = join(sandbox.root, "outside-arrival");
      const unique = Buffer.from(`external object ${mode}`);
      const operation = startWorkspaceOperation(sandbox, {
        operation: "push",
        boundary: "push-before-install",
        captureFile: "CommonEvents.json",
        failInstall: mode === "unsupported",
      });
      try {
        await operation.waitFor("checkpoint");
        if (mode === "directory") await mkdir(live(sandbox, "CommonEvents.json"));
        if (mode === "junction") {
          await mkdir(outside);
          await writeFile(join(outside, "unique.txt"), unique);
          await symlink(outside, live(sandbox, "CommonEvents.json"), "junction");
        }
        operation.send("release");
        const result = await operation.waitFor("result");
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(mode === "unsupported" ? /unsupported/iu : /retained at/iu);
      } finally {
        await operation.stop();
      }
      const after = await observe(sandbox);
      expect({ ...after, project: before.project, pending: before.pending }).toEqual(before);
      expect(after.pending).not.toBeNull();
      if (mode === "unsupported") expect(after.project).toEqual(before.project);
      else {
        const staging = (await readdir(live(sandbox, ""))).filter((name) =>
          name.startsWith("push-staging.tmp-"),
        );
        expect(staging).toHaveLength(1);
        expect(await readFile(live(sandbox, `${staging[0]}/original/CommonEvents.json`))).toEqual(
          Buffer.from(before.project!["data/CommonEvents.json"]!, "hex"),
        );
        if (mode === "directory") {
          expect((await lstat(live(sandbox, "CommonEvents.json"))).isDirectory()).toBe(true);
          expect(await readdir(live(sandbox, "CommonEvents.json"))).toEqual([]);
        } else {
          expect((await lstat(live(sandbox, "CommonEvents.json"))).isSymbolicLink()).toBe(true);
          expect(await readFile(live(sandbox, "CommonEvents.json/unique.txt"))).toEqual(unique);
          expect(await readFile(join(outside, "unique.txt"))).toEqual(unique);
        }
      }
      expect(await readFile(live(sandbox, "System.json"))).toEqual(
        Buffer.from(before.project!["data/System.json"]!, "hex"),
      );
    });
  },
  30000,
);
it("deletion before a later capture leaves earlier writes and the external absence intact", async () => {
  await withWindowsSandbox("push-drift", async (sandbox) => {
    await prepare(sandbox);
    await authorAffected(sandbox);
    const before = await observe(sandbox);
    const operation = startWorkspaceOperation(sandbox, {
      operation: "push",
      boundary: "push-before-capture",
      captureFile: "System.json",
    });
    try {
      await operation.waitFor("checkpoint");
      await rm(live(sandbox, "System.json"));
      operation.send("release");
      const result = await operation.waitFor("result");
      expect(result.ok).toBe(false);
      expect(result.message).toContain("after writing: CommonEvents.json");
    } finally {
      await operation.stop();
    }
    const after = await observe(sandbox);
    const expected: Record<string, string> = {
      ...before.project!,
      "data/CommonEvents.json": before.generated!["CommonEvents.json"]!,
    };
    delete expected["data/System.json"];
    expect(after.project).toEqual(expected);
    expect({ ...after, project: before.project, pending: before.pending }).toEqual(before);
    expect(after.pending).not.toBeNull();
  });
}, 30000);
it("manifest finalization failure retains pending and the original compilation basis", async () => {
  await withWindowsSandbox("push-drift", async (sandbox) => {
    await prepare(sandbox);
    await authorAffected(sandbox);
    const before = await observe(sandbox);
    const operation = startWorkspaceOperation(sandbox, {
      operation: "push",
      boundary: "snapshot-manifest-failure",
    });
    try {
      const result = await operation.waitFor("result");
      expect(result.ok).toBe(false);
      expect(result.message).toMatch(/manifest publication failure/iu);
    } finally {
      await operation.stop();
    }
    const after = await observe(sandbox);
    expect(after.project).toEqual({
      ...before.project,
      "data/CommonEvents.json": before.generated!["CommonEvents.json"],
      "data/System.json": before.generated!["System.json"],
    });
    expect(after.snapshot).toEqual({
      ...before.snapshot,
      "CommonEvents.json": before.generated!["CommonEvents.json"],
      "System.json": before.generated!["System.json"],
    });
    expect({
      ...after,
      project: before.project,
      snapshot: before.snapshot,
      pending: before.pending,
    }).toEqual(before);
    expect(after.pending!["backup/CommonEvents.json"]).toBe(before.snapshot!["CommonEvents.json"]);
    expect(after.pending!["backup/System.json"]).toBe(before.snapshot!["System.json"]);
  });
}, 30000);
it("no-op Push checks every captured standard file and registered map by bytes", async () => {
  await withWindowsSandbox("push-drift", async (sandbox) => {
    await prepare(sandbox);
    expect(await api.diffWorkspace(sandbox)).toContain("- none");
    for (const name of standard) {
      const path = live(sandbox, name);
      const original = await readFile(path);
      await writeFile(path, Buffer.concat([original, Buffer.from(" \r\n")]));
      const before = await observe(sandbox);
      await expect(api.pushWorkspace({ ...sandbox, allowDestructive: false })).rejects.toThrow(
        /Project Drift/iu,
      );
      expect(await observe(sandbox)).toEqual(before);
      await writeFile(path, original);
    }
    for (const kind of ["missing", "directory"]) {
      const path = live(sandbox, "Enemies.json");
      const original = await readFile(path);
      await rm(path);
      if (kind === "directory") await mkdir(path);
      const before = await observe(sandbox);
      await expect(api.pushWorkspace({ ...sandbox, allowDestructive: false })).rejects.toThrow(
        /Project Drift/iu,
      );
      expect(await observe(sandbox)).toEqual(before);
      if (kind === "directory") await rm(path, { recursive: true });
      await writeFile(path, original);
    }
    await writeFile(live(sandbox, "PluginData.json"), '{"external":true}');
    await writeFile(live(sandbox, "Map999.json"), '{"unregistered":true}');
    const before = await observe(sandbox);
    await api.pushWorkspace({ ...sandbox, allowDestructive: false });
    expect(await observe(sandbox)).toEqual(before);
  });
}, 30000);
it("each captured old file is byte checked after earlier replacements", async () => {
  await withWindowsSandbox("push-drift", async (sandbox) => {
    await prepare(sandbox);
    await authorAffected(sandbox);
    const before = await observe(sandbox);
    const original = await readFile(live(sandbox, "System.json"));
    const position = original.indexOf(Buffer.from([0xef, 0xbf, 0xbd]));
    expect(position).toBeGreaterThan(0);
    const external = Buffer.concat([
      original.subarray(0, position),
      Buffer.from([0xff]),
      original.subarray(position + 3),
    ]);
    expect(external.toString("utf8")).toBe(original.toString("utf8"));
    const operation = startWorkspaceOperation(sandbox, {
      operation: "push",
      boundary: "push-before-capture",
      captureFile: "System.json",
    });
    try {
      await operation.waitFor("checkpoint");
      await writeFile(live(sandbox, "System.json"), external);
      operation.send("release");
      const result = await operation.waitFor("result");
      expect(result.ok).toBe(false);
      expect(result.message).toMatch(/Drift/iu);
    } finally {
      await operation.stop();
    }
    const after = await observe(sandbox);
    expect({ ...after, project: before.project, pending: before.pending }).toEqual(before);
    expect(after.project).toEqual({
      ...before.project,
      "data/CommonEvents.json": before.generated!["CommonEvents.json"],
      "data/System.json": external.toString("hex"),
    });
    expect(after.pending).not.toBeNull();
  });
}, 30000);
it.each(["arrival", "unsupported", "directory", "junction"] as const)(
  "failed nonoverwriting restoration retains unique captured external objects (%s)",
  async (mode) => {
    await withWindowsSandbox("push-drift", async (sandbox) => {
      await prepare(sandbox);
      await authorAffected(sandbox);
      const before = await observe(sandbox);
      const first = Buffer.from(`unique external original ${mode}`);
      const second = Buffer.from(`later external arrival ${mode}`);
      const outside = join(sandbox.root, "external-object");
      const operation = startWorkspaceOperation(sandbox, {
        operation: "push",
        boundary: "push-capture-restore",
        captureFile: "CommonEvents.json",
        failRestore: mode === "unsupported",
      });
      try {
        await operation.waitFor("checkpoint");
        if (mode === "directory" || mode === "junction") {
          await rm(live(sandbox, "CommonEvents.json"));
          if (mode === "junction") {
            await mkdir(outside);
            await writeFile(join(outside, "unique.txt"), first);
            await symlink(outside, live(sandbox, "CommonEvents.json"), "junction");
          } else {
            await mkdir(live(sandbox, "CommonEvents.json"));
            await writeFile(live(sandbox, "CommonEvents.json/unique.txt"), first);
          }
        } else await writeFile(live(sandbox, "CommonEvents.json"), first);
        operation.send("release");
        await operation.waitFor("restore");
        if (mode !== "unsupported") await writeFile(live(sandbox, "CommonEvents.json"), second);
        operation.send("release");
        const result = await operation.waitFor("result");
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/retained at .*original/iu);
      } finally {
        await operation.stop();
      }
      const after = await observe(sandbox);
      expect({ ...after, project: before.project, pending: before.pending }).toEqual(before);
      const staging = (await readdir(live(sandbox, ""))).filter((name) =>
        name.startsWith("push-staging.tmp-"),
      );
      expect(staging).toHaveLength(1);
      const captured = live(sandbox, `${staging[0]}/original/CommonEvents.json`);
      if (mode === "directory" || mode === "junction") {
        expect(await readFile(join(captured, "unique.txt"))).toEqual(first);
        expect(
          mode === "directory"
            ? (await lstat(captured)).isDirectory()
            : (await lstat(captured)).isSymbolicLink(),
        ).toBe(true);
      } else {
        expect(await readFile(captured)).toEqual(first);
        expect(
          await readFile(statePath(sandbox, "pending-push/backup/CommonEvents.json")),
        ).not.toEqual(first);
      }
      if (mode === "unsupported")
        await expect(readFile(live(sandbox, "CommonEvents.json"))).rejects.toMatchObject({
          code: "ENOENT",
        });
      else expect(await readFile(live(sandbox, "CommonEvents.json"))).toEqual(second);
      expect(await readFile(live(sandbox, "System.json"))).toEqual(
        Buffer.from(before.project!["data/System.json"]!, "hex"),
      );
    });
  },
  30000,
);
it("actual installation never overwrites a concurrently arriving external file", async () => {
  await withWindowsSandbox("push-drift", async (sandbox) => {
    await prepare(sandbox);
    await authorAffected(sandbox);
    const before = await observe(sandbox);
    const operation = startWorkspaceOperation(sandbox, {
      operation: "push",
      boundary: "push-before-install",
      captureFile: "CommonEvents.json",
    });
    const external = Buffer.from('{"uniqueExternal":"arrived after capture"}');
    try {
      await operation.waitFor("checkpoint");
      await writeFile(live(sandbox, "CommonEvents.json"), external);
      operation.send("release");
      const result = await operation.waitFor("result");
      expect(result.ok).toBe(false);
    } finally {
      await operation.stop();
    }
    const after = await observe(sandbox);
    expect({ ...after, project: before.project, pending: before.pending }).toEqual(before);
    expect(await readFile(live(sandbox, "CommonEvents.json"))).toEqual(external);
    expect(await readFile(live(sandbox, "System.json"))).toEqual(
      Buffer.from(before.project!["data/System.json"]!, "hex"),
    );
    expect(after.pending).not.toBeNull();
    expect(
      Object.keys(after.project!).some((name) => name.includes("rpgmaker-event-dsl-conflict")),
    ).toBe(false);
  });
}, 30000);
it("postwrite full check preserves unrelated external bytes and Interrupted Push", async () => {
  await withWindowsSandbox("push-drift", async (sandbox) => {
    await prepare(sandbox);
    await authorAffected(sandbox);
    const before = await observe(sandbox);
    const operation = startWorkspaceOperation(sandbox, {
      operation: "push",
      boundary: "push-after-install",
      captureFile: "System.json",
    });
    const external = Buffer.from('[null,{"id":1,"name":"external after writes"}]');
    try {
      await operation.waitFor("checkpoint");
      await writeFile(live(sandbox, "Actors.json"), external);
      operation.send("release");
      const result = await operation.waitFor("result");
      expect(result.ok).toBe(false);
      expect(result.message).toMatch(/Drift/iu);
    } finally {
      await operation.stop();
    }
    const after = await observe(sandbox);
    expect({ ...after, pending: before.pending, project: before.project }).toEqual(before);
    expect(after.project).toEqual({
      ...before.project,
      "data/Actors.json": external.toString("hex"),
      "data/CommonEvents.json": before.generated!["CommonEvents.json"],
      "data/System.json": before.generated!["System.json"],
    });
    expect(after.pending).not.toBeNull();
  });
}, 30000);
it("the full input set is checked again after staging before first replacement", async () => {
  await withWindowsSandbox("push-drift", async (sandbox) => {
    await prepare(sandbox);
    await authorAffected(sandbox);
    const before = await observe(sandbox);
    const operation = startWorkspaceOperation(sandbox, {
      operation: "push",
      boundary: "push-prewrite",
    });
    const external = Buffer.from('[null,{"id":1,"name":"external after staging"}]');
    try {
      await operation.waitFor("checkpoint");
      await writeFile(live(sandbox, "Actors.json"), external);
      operation.send("release");
      const result = await operation.waitFor("result");
      expect(result.ok).toBe(false);
      expect(result.message).toMatch(/Drift/iu);
    } finally {
      await operation.stop();
    }
    const after = await observe(sandbox);
    expect({ ...after, pending: before.pending, project: before.project }).toEqual(before);
    expect(after.project).toEqual({
      ...before.project,
      "data/Actors.json": external.toString("hex"),
    });
    expect(
      Object.keys(after.pending!)
        .filter((name) => name.startsWith("backup/") && name.endsWith(".json"))
        .sort(),
    ).toEqual(["backup/CommonEvents.json", "backup/System.json"]);
  });
}, 30000);
it("semantic Diff ignores key order while preserving saved-value distinctions and byte Drift", async () => {
  await withWindowsSandbox("push-drift", async (sandbox) => {
    await prepare(sandbox, true);
    const original = await observe(sandbox);
    expect(await api.diffWorkspace(sandbox)).toContain("- none");
    await api.pushWorkspace({ ...sandbox, allowDestructive: false });
    expect(await observe(sandbox)).toEqual(original);
    const common = live(sandbox, "CommonEvents.json");
    const bytes = await readFile(common);
    for (const rewrite of [
      JSON.stringify(JSON.parse(bytes.toString("utf8")), null, 4),
      bytes.toString("utf8").replace("Original", "\\u004friginal"),
    ]) {
      await writeFile(common, rewrite);
      const before = await observe(sandbox);
      await expect(api.pushWorkspace({ ...sandbox, allowDestructive: false })).rejects.toThrow(
        /Project Drift/iu,
      );
      expect(await observe(sandbox)).toEqual(before);
      await writeFile(common, bytes);
    }
    const source = join(sandbox.workspaceRoot, "src/decompiled/common-events.events.ts");
    const author = async (payload: string) => {
      await writeFile(
        source,
        `import { commonEvent, rawDslCommand } from "rpgmaker-event-dsl";\nexport const opaque = commonEvent({ id:1,name:"Opaque",trigger:"none",commands:[rawDslCommand({code:999,parameters:[${payload}]})] });`,
      );
      await api.compileWorkspace({ ...sandbox, check: false });
    };
    await author('{keep:null,array:[1,2],number:0,text:"CR\\r"}');
    await api.pushWorkspace({ ...sandbox, allowDestructive: false });
    for (const payload of [
      '{array:[1,2],number:0,text:"CR\\r"}',
      '{keep:null,array:[2,1],number:0,text:"CR\\r"}',
      '{keep:null,array:[1],number:0,text:"CR\\r"}',
      '{keep:null,array:[1,2],number:-0,text:"CR\\r"}',
      '{keep:null,array:[1,2],number:0,text:"CR"}',
    ]) {
      await author(payload);
      const before = await observe(sandbox);
      const diff = await api.diffWorkspace(sandbox);
      expect(diff).toContain("[changed] commonEventId 1");
      expect(diff).toContain("- CommonEvents.json");
      expect(await observe(sandbox)).toEqual(before);
    }
  });
}, 30000);
it("live byte corruption cannot pass through replacement UTF8 decoding", async () => {
  await withWindowsSandbox("push-drift", async (sandbox) => {
    await prepare(sandbox);
    for (const name of ["Actors.json", "CommonEvents.json"]) {
      if (name === "CommonEvents.json") {
        const source = join(sandbox.workspaceRoot, "src/decompiled/common-events.events.ts");
        await writeFile(
          source,
          (await readFile(source, "utf8")).replace('name: "Original �"', 'name: "Authored �"'),
        );
        await api.compileWorkspace({ ...sandbox, check: false });
      }
      const path = live(sandbox, name);
      const original = await readFile(path);
      const position = original.indexOf(Buffer.from([0xef, 0xbf, 0xbd]));
      expect(position).toBeGreaterThan(0);
      const external = Buffer.concat([
        original.subarray(0, position),
        Buffer.from([0xff]),
        original.subarray(position + 3),
      ]);
      expect(external.toString("utf8")).toBe(original.toString("utf8"));
      expect(hash(external)).not.toBe(hash(original));
      await writeFile(path, external);
      const before = await observe(sandbox);
      await expect(api.pushWorkspace({ ...sandbox, allowDestructive: false })).rejects.toThrow(
        /Project Drift/iu,
      );
      expect(await observe(sandbox)).toEqual(before);
      await writeFile(path, original);
    }
  });
}, 30000);
