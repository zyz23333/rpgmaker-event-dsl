import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";

import { expect, it } from "vitest";
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
    discovery: Object.keys(source ?? {}).filter((name) => /\.(events|dsl)\.ts$/u.test(name)),
    project: await tree(join(workspaceRoot, "Game")),
    snapshot: await tree(join(state, "project-data-snapshot")),
    generated: await tree(join(state, "generated-project-data")),
    manifest: await readFile(join(state, "sync-manifest.json"), "utf8").catch(() => null),
    pending: await tree(join(state, "pending-push")),
  };
}

async function withEvidence(id: string, body: (sandbox: WindowsSandbox) => Promise<void>) {
  await withWindowsSandbox(id.toLowerCase(), async (sandbox) => {
    const startedAt = new Date().toISOString();
    let failure: unknown;
    try {
      await body(sandbox);
    } catch (error) {
      failure = error;
      throw error;
    } finally {
      await recordEvidence({
        requirementId: id,
        startedAt,
        stages: [
          "Public Workspace API/CLI, actual Discovery/type validation/evaluation and complete output, real filesystem/process failures and complete state comparison",
        ],
        expected:
          "Compile/Check validate the same complete candidate; invalid or incomplete published output cannot authorize Diff/Push, and explicit Compile recovers",
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

async function prepare(sandbox: WindowsSandbox, compile = true) {
  const fixture = await createMinimalProject(sandbox.workspaceRoot);
  await writeFile(
    join(sandbox.workspaceRoot, "Game/data/MapInfos.json"),
    '[null,{"id":1,"name":"Map"}]',
  );
  await writeFile(
    join(sandbox.workspaceRoot, "Game/data/Map001.json"),
    '{"events":[null],"id":1,"opaque":{"kept":[null,1,"CR\\r"]}}',
  );
  await api.initWorkspace({ workspaceRoot: sandbox.workspaceRoot, projectRoot: "./Game" });
  await api.cloneWorkspace(sandbox);
  await api.decompileWorkspace(sandbox);
  if (compile) await api.compileWorkspace({ ...sandbox, check: false });
  return fixture;
}

it("MV-S4-OUTPUT-001: Diff and Push reject omitted owned output domains", async () => {
  await withEvidence("MV-S4-OUTPUT-001", async (sandbox) => {
    await prepare(sandbox);
    const manifestPath = join(sandbox.workspaceRoot, ".rpgmaker-event-dsl/sync-manifest.json");
    const original = JSON.parse(await readFile(manifestPath, "utf8"));
    for (const omitted of [
      "CommonEvents.json",
      "System.json",
      "Troops.json",
      "Map001.json",
      "all",
    ]) {
      await writeFile(
        manifestPath,
        JSON.stringify({
          ...original,
          generatedFiles:
            omitted === "all"
              ? []
              : original.generatedFiles.filter(
                  (file: { relativePath: string }) => file.relativePath !== omitted,
                ),
        }),
      );
      const before = await observe(sandbox.workspaceRoot);
      await expect(api.diffWorkspace(sandbox)).rejects.toThrow(/integrity|incomplete/iu);
      await expect(api.pushWorkspace({ ...sandbox, allowDestructive: false })).rejects.toThrow(
        /integrity|incomplete/iu,
      );
      expect(await observe(sandbox.workspaceRoot)).toEqual(before);
    }
  });
}, 30_000);

it("MV-S4-OUTPUT-004: Check validates a complete candidate in memory and leaves Freshness unchanged", async () => {
  await withEvidence("MV-S4-OUTPUT-004", async (sandbox) => {
    const fixture = await prepare(sandbox, false);
    const mapSource = join(sandbox.workspaceRoot, "src/decompiled/maps/Map001.events.ts");
    await writeFile(
      mapSource,
      'export const placed = { kind: "mapEvent", mapId: 1, id: 1, name: "Placed", x: 0, y: 0, pages: [{ conditions: {}, trigger: "action", commands: [] }] };',
    );
    for (const phase of ["initial", "fresh", "stale"]) {
      if (phase === "fresh") await api.compileWorkspace({ ...sandbox, check: false });
      if (phase === "stale")
        await writeFile(mapSource, `${await readFile(mapSource, "utf8")}\n// stale basis\n`);
      const before = await observe(sandbox.workspaceRoot);
      const stateBefore = await tree(join(sandbox.workspaceRoot, ".rpgmaker-event-dsl"));
      const check = startWorkspaceOperation(sandbox, {
        operation: "check",
        boundary: "generated-write-failure",
      });
      try {
        expect((await check.waitFor("result")).ok).toBe(true);
      } finally {
        await check.stop();
      }
      expect(await observe(sandbox.workspaceRoot)).toEqual(before);
      expect(await tree(join(sandbox.workspaceRoot, ".rpgmaker-event-dsl"))).toEqual(stateBefore);
      expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(phase === "fresh");
    }
    await api.compileWorkspace({ ...sandbox, check: false });
    const generatedRoot = join(sandbox.workspaceRoot, ".rpgmaker-event-dsl/generated-project-data");
    expect((await readdir(generatedRoot)).sort()).toEqual([
      "CommonEvents.json",
      "Map001.json",
      "System.json",
      "Troops.json",
    ]);
    expect(JSON.parse(await readFile(join(generatedRoot, "CommonEvents.json"), "utf8"))).toEqual(
      fixture.projectFiles["CommonEvents.json"],
    );
    expect(JSON.parse(await readFile(join(generatedRoot, "System.json"), "utf8"))).toEqual(
      fixture.projectFiles["System.json"],
    );
    expect(JSON.parse(await readFile(join(generatedRoot, "Troops.json"), "utf8"))).toEqual(
      fixture.projectFiles["Troops.json"],
    );
    expect(JSON.parse(await readFile(join(generatedRoot, "Map001.json"), "utf8"))).toEqual({
      id: 1,
      opaque: { kept: [null, 1, "CR\r"] },
      events: [
        null,
        {
          id: 1,
          name: "Placed",
          note: "",
          x: 0,
          y: 0,
          pages: [
            {
              conditions: {
                actorId: 1,
                actorValid: false,
                itemId: 1,
                itemValid: false,
                selfSwitchCh: "A",
                selfSwitchValid: false,
                switch1Id: 1,
                switch1Valid: false,
                switch2Id: 1,
                switch2Valid: false,
                variableId: 1,
                variableValid: false,
                variableValue: 0,
              },
              directionFix: false,
              image: { characterIndex: 0, characterName: "", direction: 2, pattern: 0, tileId: 0 },
              list: [{ code: 0, indent: 0, parameters: [] }],
              moveFrequency: 3,
              moveRoute: {
                list: [{ code: 0, parameters: [] }],
                repeat: true,
                skippable: false,
                wait: false,
              },
              moveSpeed: 3,
              moveType: 0,
              priorityType: 0,
              stepAnime: false,
              through: false,
              trigger: 0,
              walkAnime: true,
            },
          ],
        },
      ],
    });
  });
}, 30_000);

it("MV-S4-OUTPUT-009: Check and Compile share structure reference and Gate rejection without publication", async () => {
  await withEvidence("MV-S4-OUTPUT-009", async (sandbox) => {
    await prepare(sandbox);
    const source = join(sandbox.workspaceRoot, "src/decompiled/common-events.events.ts");
    for (const [command, diagnostic] of [
      ['{ kind: "rawDslCommand", code: 108, parameters: [] }', /MV-COMMAND-PARAMETERS/iu],
      [
        '{ kind: "rawDslCommand", code: 212, parameters: [-1,999,false] }',
        /animation|MV-REFERENCE/iu,
      ],
      ['{ kind: "rawDslCommand", code: 355, parameters: [""] }', /MV-SCRIPT-GATE/iu],
    ] as const) {
      await writeFile(
        source,
        `import { commonEvent } from "rpgmaker-event-dsl";\nexport const invalid = commonEvent({ id:1, name:"Invalid", trigger:"none", commands:[${command}] });`,
      );
      for (const check of [true, false]) {
        const before = await observe(sandbox.workspaceRoot);
        await expect(api.compileWorkspace({ ...sandbox, check })).rejects.toThrow(diagnostic);
        expect(await observe(sandbox.workspaceRoot)).toEqual(before);
      }
    }
  });
}, 30_000);

it("MV-S4-OUTPUT-005: real candidate installation and manifest failures cannot authorize stale output", async () => {
  await withEvidence("MV-S4-OUTPUT-005", async (sandbox) => {
    await prepare(sandbox);
    const source = join(sandbox.workspaceRoot, "src/decompiled/common-events.events.ts");
    for (const boundary of [
      "generated-write-failure",
      "generated-installation-failure",
      "snapshot-manifest-failure",
    ] as const) {
      await writeFile(
        source,
        (await readFile(source, "utf8")).replace(/name: "[^"]*"/u, `name: "${boundary}"`),
      );
      const before = await observe(sandbox.workspaceRoot);
      const operation = startWorkspaceOperation(sandbox, { operation: "compile", boundary });
      try {
        const result = await operation.waitFor("result");
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/Controlled/iu);
      } finally {
        await operation.stop();
      }
      const after = await observe(sandbox.workspaceRoot);
      expect({ ...after, generated: before.generated }).toEqual(before);
      await expect(api.diffWorkspace(sandbox)).rejects.toThrow(/stale|integrity/iu);
      await expect(api.pushWorkspace({ ...sandbox, allowDestructive: false })).rejects.toThrow(
        /stale|integrity/iu,
      );
      expect(await observe(sandbox.workspaceRoot)).toEqual(after);
      await api.compileWorkspace({ ...sandbox, check: false });
      expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(true);
      await expect(api.diffWorkspace(sandbox)).resolves.toContain("[changed] commonEventId 1");
      const completeCommon = JSON.parse(
        await readFile(
          join(
            sandbox.workspaceRoot,
            ".rpgmaker-event-dsl/generated-project-data/CommonEvents.json",
          ),
          "utf8",
        ),
      );
      const fixture = JSON.parse(
        await readFile(join(sandbox.workspaceRoot, "Game/data/CommonEvents.json"), "utf8"),
      );
      fixture[1].name = boundary;
      expect(completeCommon).toEqual(fixture);
    }
  });
}, 30_000);

it("MV-S4-OUTPUT-006: interruption after installation leaves unusable output until explicit Compile", async () => {
  await withEvidence("MV-S4-OUTPUT-006", async (sandbox) => {
    await prepare(sandbox, false);
    const source = join(sandbox.workspaceRoot, "src/decompiled/common-events.events.ts");
    for (const interruption of ["kill", "crash"] as const) {
      await writeFile(
        source,
        (await readFile(source, "utf8")).replace(/name: "[^"]*"/u, `name: "${interruption}"`),
      );
      const before = await observe(sandbox.workspaceRoot);
      const operation = startWorkspaceOperation(sandbox, {
        operation: "compile",
        boundary: "compile-manifest",
      });
      try {
        await operation.waitFor("checkpoint");
        if (interruption === "kill") await operation.stop();
        else {
          operation.send("crash");
          expect((await operation.ended).exitCode).toBe(1);
        }
      } finally {
        await operation.stop();
      }
      const after = await observe(sandbox.workspaceRoot);
      expect({ ...after, generated: before.generated }).toEqual(before);
      await expect(api.diffWorkspace(sandbox)).rejects.toThrow(/required|integrity|stale/iu);
      await expect(api.pushWorkspace({ ...sandbox, allowDestructive: false })).rejects.toThrow(
        /required|integrity|stale/iu,
      );
      expect(await observe(sandbox.workspaceRoot)).toEqual(after);
      await runCli(sandbox, ["compile"]);
      expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(true);
    }
  });
}, 30_000);

it("MV-S4-OUTPUT-007: integrity rejects missing replaced corrupt and extra claimed generated files", async () => {
  await withEvidence("MV-S4-OUTPUT-007", async (sandbox) => {
    await prepare(sandbox);
    const state = join(sandbox.workspaceRoot, ".rpgmaker-event-dsl");
    const generated = join(state, "generated-project-data");
    const common = join(generated, "CommonEvents.json");
    const manifestPath = join(state, "sync-manifest.json");
    const original = await readFile(manifestPath, "utf8");
    for (const change of [
      () => rm(common),
      async () => {
        await rm(common);
        await mkdir(common);
      },
      () => writeFile(common, "[null]"),
      () => rm(join(generated, "Troops.json")),
      async () => {
        await rm(join(generated, "Troops.json"));
        await mkdir(join(generated, "Troops.json"));
      },
      () => writeFile(join(generated, "Troops.json"), "[]"),
      ...["Actors.json", "Map999.json"].map((relativePath) => async () => {
        const content = relativePath.startsWith("Map") ? '{"events":[null]}' : "[null]";
        await writeFile(join(generated, relativePath), content);
        const manifest = JSON.parse(original);
        manifest.generatedFiles.push({
          relativePath,
          hash: createHash("sha256").update(content).digest("hex"),
        });
        await writeFile(manifestPath, JSON.stringify(manifest));
      }),
      () => writeFile(join(generated, "unlisted-plugin.json"), "{}"),
    ]) {
      await change();
      const before = await observe(sandbox.workspaceRoot);
      await expect(api.diffWorkspace(sandbox)).rejects.toThrow(/integrity/iu);
      await expect(api.pushWorkspace({ ...sandbox, allowDestructive: false })).rejects.toThrow(
        /integrity/iu,
      );
      expect(await observe(sandbox.workspaceRoot)).toEqual(before);
      await writeFile(manifestPath, original);
      await api.compileWorkspace({ ...sandbox, check: false });
      expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(true);
    }
  });
}, 30_000);

it("MV-S4-OUTPUT-003: Compile refuses changed inputs before manifest commitment", async () => {
  await withEvidence("MV-S4-OUTPUT-003", async (sandbox) => {
    await prepare(sandbox);
    const source = join(sandbox.workspaceRoot, "src/decompiled/common-events.events.ts");
    const operation = startWorkspaceOperation(sandbox, {
      operation: "compile",
      boundary: "compile-manifest",
    });
    try {
      await operation.waitFor("checkpoint");
      await writeFile(source, `${await readFile(source, "utf8")}\n// late input change\n`);
      const before = await observe(sandbox.workspaceRoot);
      operation.send("release");
      const result = await operation.waitFor("result");
      expect(result.ok).toBe(false);
      expect(result.message).toMatch(/changed.*again/isu);
      expect(await observe(sandbox.workspaceRoot)).toEqual(before);
      await expect(api.diffWorkspace(sandbox)).rejects.toThrow(/stale/iu);
      await expect(api.pushWorkspace({ ...sandbox, allowDestructive: false })).rejects.toThrow(
        /stale/iu,
      );
    } finally {
      await operation.stop();
    }
    await api.compileWorkspace({ ...sandbox, check: false });
    expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(true);
  });
}, 30_000);

it("MV-S4-OUTPUT-002: Check and Compile reject invalid emitted JSON without publishing", async () => {
  await withEvidence("MV-S4-OUTPUT-002", async (sandbox) => {
    await prepare(sandbox);
    await writeFile(
      join(sandbox.workspaceRoot, "src/decompiled/maps/Map001.events.ts"),
      'export const invalid = { kind: "mapEvent", mapId: 1, id: 1, name: "Invalid", x: undefined, y: 0, pages: [{ conditions: {}, trigger: "action", commands: [] }] };',
    );
    for (const check of [true, false]) {
      const before = await observe(sandbox.workspaceRoot);
      await expect(api.compileWorkspace({ ...sandbox, check })).rejects.toThrow(
        /output|JSON|MV-MAP-PAGE-INPUT/iu,
      );
      expect(await observe(sandbox.workspaceRoot)).toEqual(before);
    }
  });
}, 30_000);

it("MV-S4-OUTPUT-008: integrity compares actual generated bytes without lossy UTF8 decoding", async () => {
  await withEvidence("MV-S4-OUTPUT-008", async (sandbox) => {
    await prepare(sandbox);
    const source = join(sandbox.workspaceRoot, "src/decompiled/common-events.events.ts");
    await writeFile(
      source,
      (await readFile(source, "utf8")).replace(/name: "[^"]*"/u, 'name: "Compiled �"'),
    );
    await api.compileWorkspace({ ...sandbox, check: false });
    const common = join(
      sandbox.workspaceRoot,
      ".rpgmaker-event-dsl/generated-project-data/CommonEvents.json",
    );
    const valid = await readFile(common);
    const position = valid.indexOf(Buffer.from([0xef, 0xbf, 0xbd]));
    expect(position).toBeGreaterThan(0);
    const invalid = Buffer.concat([
      valid.subarray(0, position),
      Buffer.from([0x80]),
      valid.subarray(position + 3),
    ]);
    expect(invalid.equals(valid)).toBe(false);
    expect(invalid.toString("utf8")).toBe(valid.toString("utf8"));
    await writeFile(common, invalid);
    const before = await observe(sandbox.workspaceRoot);
    await expect(api.diffWorkspace(sandbox)).rejects.toThrow(/integrity/iu);
    await expect(api.pushWorkspace({ ...sandbox, allowDestructive: false })).rejects.toThrow(
      /integrity/iu,
    );
    expect(await observe(sandbox.workspaceRoot)).toEqual(before);
    await api.compileWorkspace({ ...sandbox, check: false });
    expect((await readFile(common)).equals(valid)).toBe(true);
    expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(true);
  });
}, 30_000);
