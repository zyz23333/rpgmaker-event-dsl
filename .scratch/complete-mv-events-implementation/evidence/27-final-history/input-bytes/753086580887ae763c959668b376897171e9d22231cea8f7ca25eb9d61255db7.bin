import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import { discoverDefinitionFiles } from "../src/workspace/definitions.js";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { createMinimalProject, withWindowsSandbox } from "./support/windows-sandbox.js";
import { recordEvidence } from "./support/mv-evidence.js";

const api: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);

async function tree(root: string): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  for (const entry of (await readdir(root, { withFileTypes: true }).catch(() => [])).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    if (entry.name === "operation.lock") continue;
    if (entry.isDirectory()) {
      files[entry.name + "/"] = "directory";
      for (const [key, bytes] of Object.entries(await tree(join(root, entry.name))))
        files[entry.name + "/" + key] = bytes;
    } else files[entry.name] = (await readFile(join(root, entry.name))).toString("hex");
  }
  return files;
}

async function observe(workspaceRoot: string) {
  const config = await readFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8");
  const state = await tree(join(workspaceRoot, ".rpgmaker-event-dsl"));
  // Only the allowed empty isolation parent may remain; every child is still compared.
  delete state["decompile-candidates/"];
  return {
    config,
    discovery: await discoverDefinitionFiles(workspaceRoot, JSON.parse(config)),
    source: await tree(join(workspaceRoot, "src")),
    project: await tree(join(workspaceRoot, "Game")),
    state,
  };
}

it.each([
  {
    label: "missing reserved slot",
    requirementId: "MV-S5-COMMON-CARRIER-BOUNDARY",
    input: "[]",
    identity: "commonEvents",
    nativePath: "CommonEvents[0]",
    actual: "undefined",
  },
  {
    label: "nonnull reserved slot",
    requirementId: "MV-S5-COMMON-CARRIER-BOUNDARY",
    input: "[false]",
    identity: "commonEvents",
    nativePath: "CommonEvents[0]",
    actual: "false",
  },
  {
    label: "categorical negative zero",
    requirementId: "MV-S5-COMMON-TRIGGER-BOUNDARY",
    input:
      '[null,{"id":1,"name":"Boundary","trigger":-0,"switchId":1,"list":[{"code":0,"indent":0,"parameters":[]}]}]',
    identity: "commonEvent:1",
    nativePath: "CommonEvents[1].trigger",
    actual: "-0",
  },
])("$requirementId: rejects $label before source publication", async (fixture) => {
  await withWindowsSandbox("common-native-boundary", async (sandbox) => {
    const startedAt = new Date().toISOString();
    let failure: unknown;
    let diagnostic: unknown;
    let before: unknown;
    try {
      await createMinimalProject(sandbox.workspaceRoot);
      await writeFile(join(sandbox.workspaceRoot, "Game/data/CommonEvents.json"), fixture.input);
      await api.initWorkspace({ ...sandbox, projectRoot: "./Game" });
      await api.cloneWorkspace(sandbox);
      before = await observe(sandbox.workspaceRoot);
      for (let attempt = 0; attempt < 2; attempt++) {
        await expect(api.decompileWorkspace(sandbox)).rejects.toMatchObject({
          code: "MV-COMMON-EVENT",
          stage: "decompile",
          identity: fixture.identity,
          location: { nativePath: fixture.nativePath, actual: fixture.actual },
        });
        diagnostic = {
          code: "MV-COMMON-EVENT",
          stage: "decompile",
          identity: fixture.identity,
          nativePath: fixture.nativePath,
          actual: fixture.actual,
        };
        expect(await observe(sandbox.workspaceRoot)).toStrictEqual(before);
      }
    } catch (error) {
      failure = error;
      throw error;
    } finally {
      await recordEvidence({
        requirementId: fixture.requirementId,
        startedAt,
        stages: ["Actual public Workspace Clone and repeated Decompile on independent raw JSON"],
        expected: { diagnostic: fixture, businessStateUnchanged: true },
        actual: {
          before,
          after: await observe(sandbox.workspaceRoot),
          diagnostic,
          entry: sandbox.cliEntry,
        },
        ...(failure === undefined ? {} : { error: failure }),
      });
    }
  });
});

it("MV-S5-COMMON-CARRIER-BOUNDARY: preserves ordinary null-only capacity through real Workspace Push", async () => {
  await withWindowsSandbox("common-null-only-control", async (sandbox) => {
    const startedAt = new Date().toISOString();
    let failure: unknown;
    let actual: unknown;
    try {
      await createMinimalProject(sandbox.workspaceRoot);
      await writeFile(join(sandbox.workspaceRoot, "Game/data/CommonEvents.json"), "[null]");
      await api.initWorkspace({ ...sandbox, projectRoot: "./Game" });
      await api.cloneWorkspace(sandbox);
      await api.decompileWorkspace(sandbox);
      const before = await observe(sandbox.workspaceRoot);
      await api.compileWorkspace({ ...sandbox, check: true });
      expect(await observe(sandbox.workspaceRoot)).toStrictEqual(before);
      await api.compileWorkspace({ ...sandbox, check: false });
      actual = JSON.parse(
        await readFile(
          join(
            sandbox.workspaceRoot,
            ".rpgmaker-event-dsl/generated-project-data/CommonEvents.json",
          ),
          "utf8",
        ),
      );
      expect(actual).toStrictEqual([null]);
      expect(await api.diffWorkspace(sandbox)).not.toContain("CommonEvents.json");
      await api.pushWorkspace({ ...sandbox, allowDestructive: false });
      expect(
        await readFile(join(sandbox.workspaceRoot, "Game/data/CommonEvents.json"), "utf8"),
      ).toBe("[null]");
    } catch (error) {
      failure = error;
      throw error;
    } finally {
      await recordEvidence({
        requirementId: "MV-S5-COMMON-CARRIER-BOUNDARY",
        startedAt,
        stages: ["Actual public Workspace Decompile, Check, Compile, Diff and no-op Push"],
        expected: [null],
        actual,
        ...(failure === undefined ? {} : { error: failure }),
      });
    }
  });
});
