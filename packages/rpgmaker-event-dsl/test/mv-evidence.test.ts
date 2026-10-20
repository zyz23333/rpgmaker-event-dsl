import { deepStrictEqual } from "node:assert/strict";
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, it } from "vitest";

import {
  cloneWorkspace,
  compileWorkspace,
  decompileWorkspace,
  initWorkspace,
} from "../src/workspace-api.js";
import { recordEvidence, validateRequirements } from "./support/mv-evidence.js";

it("validates the evidence index, source references, fixture hashes, test links, and current recorded runs", async () => {
  await validateRequirements();
});

it("MV-S0-CE-001: discovers and evaluates Decompiled Source against independent saved data", async () => {
  const fixture = JSON.parse(
    await readFile(
      new URL("./fixtures/mv-evidence/common-event-project.json", import.meta.url),
      "utf8",
    ),
  );

  const workspaceRoot = await mkdtemp(join(tmpdir(), "mv-s0-evidence-"));
  const startedAt = new Date().toISOString();
  const stages: string[] = ["Synthetic fixture preparation"];
  const observations: Record<string, unknown> = {};
  let failure: unknown;
  try {
    const projectRoot = join(workspaceRoot, "Game");
    await mkdir(join(projectRoot, "data"), { recursive: true });
    await writeFile(join(projectRoot, "Game.rpgproject"), "RPGMV 1.6.1\n");
    for (const [name, value] of Object.entries(fixture.projectFiles)) {
      await writeFile(join(projectRoot, "data", name), JSON.stringify(value));
    }
    await initWorkspace({ workspaceRoot, projectRoot: "./Game" });
    await writeFile(join(workspaceRoot, "package.json"), '{"type":"module"}\n');
    const fixturePackage = join(workspaceRoot, "node_modules", "rpgmaker-event-dsl");
    await mkdir(fixturePackage, { recursive: true });
    await writeFile(
      join(fixturePackage, "package.json"),
      JSON.stringify({
        name: "rpgmaker-event-dsl",
        type: "module",
        exports: { ".": { types: "./src/index.ts" } },
      }),
    );
    await symlink(
      fileURLToPath(new URL("../src", import.meta.url)),
      join(fixturePackage, "src"),
      "junction",
    );
    await cloneWorkspace({ workspaceRoot });
    stages.push("Clone");
    await decompileWorkspace({ workspaceRoot });
    stages.push("Decompile");
    await compileWorkspace({ workspaceRoot, check: true });
    stages.push("Compile Check (Discovery, real package types, source evaluation)");
    await compileWorkspace({ workspaceRoot, check: false });
    stages.push("Compile");
    const stateRoot = join(workspaceRoot, ".rpgmaker-event-dsl");
    const actual = JSON.parse(
      await readFile(join(stateRoot, "generated-project-data", "CommonEvents.json"), "utf8"),
    );
    observations.commonEvents = actual;
    deepStrictEqual(actual, fixture.projectFiles["CommonEvents.json"]);
    const system = JSON.parse(
      await readFile(join(stateRoot, "generated-project-data", "System.json"), "utf8"),
    );
    observations.system = system;
    deepStrictEqual(system, fixture.projectFiles["System.json"]);
    stages.push("Complete parsed Native Saved Shape and values compared without normalization");
    const manifest = JSON.parse(await readFile(join(stateRoot, "sync-manifest.json"), "utf8"));
    const sourceRoot = join(workspaceRoot, "src");
    const sourceFiles = (await readdir(sourceRoot, { recursive: true }))
      .filter((path) => path.endsWith(".events.ts") || path.endsWith(".dsl.ts"))
      .map((path) => `src/${path.replaceAll("\\", "/")}`)
      .sort();
    deepStrictEqual(
      manifest.compileBaseline.sourceFiles
        .map((entry: { relativePath: string }) => entry.relativePath)
        .sort(),
      sourceFiles,
    );
    expect(sourceFiles).toContain("src/decompiled/common-events.events.ts");
    observations.discoveredSourceFiles = sourceFiles;
    const sourcePath = join(sourceRoot, "decompiled", "common-events.events.ts");
    const original = await readFile(sourcePath, "utf8");
    await writeFile(sourcePath, original.replace("Evidence Common Event", "Evaluation observed"));
    await compileWorkspace({ workspaceRoot, check: false });
    const changed = JSON.parse(
      await readFile(join(stateRoot, "generated-project-data", "CommonEvents.json"), "utf8"),
    );
    const changedExpected = structuredClone(fixture.projectFiles["CommonEvents.json"]);
    changedExpected[1].name = "Evaluation observed";
    deepStrictEqual(changed, changedExpected);
    observations.sourceEvaluationControl = changed;
    stages.push("Source edit changes compiled event through actual Discovery and evaluation");
    await writeFile(sourcePath, original);
    await compileWorkspace({ workspaceRoot, check: false });
    deepStrictEqual(
      JSON.parse(
        await readFile(join(stateRoot, "generated-project-data", "CommonEvents.json"), "utf8"),
      ),
      fixture.projectFiles["CommonEvents.json"],
    );
    for (const [name, expected] of Object.entries(fixture.projectFiles)) {
      deepStrictEqual(
        JSON.parse(await readFile(join(projectRoot, "data", name), "utf8")),
        expected,
      );
      deepStrictEqual(
        JSON.parse(await readFile(join(stateRoot, "project-data-snapshot", name), "utf8")),
        expected,
      );
    }
    stages.push("Original source restored; Project Root and complete Snapshot remain unchanged");
  } catch (error) {
    failure = error;
    throw error;
  } finally {
    try {
      await recordEvidence({
        requirementId: "MV-S0-CE-001",
        startedAt,
        stages,
        expected: fixture.projectFiles,
        actual: observations,
        ...(failure === undefined ? {} : { error: failure }),
      });
    } finally {
      await rm(workspaceRoot, { force: true, recursive: true });
    }
  }
});

it("MV-S0-COMPARE-001: rejects every saved-state loss without normalizing either side", async () => {
  const startedAt = new Date().toISOString();
  const fixture = JSON.parse(
    await readFile(
      new URL("./fixtures/mv-evidence/common-event-project.json", import.meta.url),
      "utf8",
    ),
  );
  const expected = fixture.projectFiles;
  const mutations: Record<string, (candidate: typeof expected) => void> = {
    "final command marker removed": (candidate) => {
      candidate["CommonEvents.json"][1].list.pop();
    },
    "required key removed": (candidate) => {
      delete candidate["CommonEvents.json"][1].list[0].indent;
    },
    "CR removed": (candidate) => {
      candidate["CommonEvents.json"][1].list[1].parameters[0] = "Synthetic CRkept";
    },
    "trailing empty text record removed": (candidate) => {
      candidate["CommonEvents.json"][1].list.splice(2, 1);
    },
    "inactive switch value changed": (candidate) => {
      candidate["CommonEvents.json"][1].switchId = 2;
    },
    "null array slot removed": (candidate) => {
      candidate["CommonEvents.json"].shift();
    },
    "empty array changed to null": (candidate) => {
      candidate["System.json"].fixtureOrigin.retainedArray = null;
    },
    "unknown external field removed": (candidate) => {
      delete candidate["System.json"].fixtureOrigin;
    },
  };
  const observations: Record<string, string> = {};
  let failure: unknown;
  try {
    for (const [name, mutate] of Object.entries(mutations)) {
      const actual = structuredClone(expected);
      mutate(actual);
      expect(() => deepStrictEqual(actual, expected), name).toThrow();
      observations[name] = "difference detected";
    }
  } catch (error) {
    failure = error;
    throw error;
  } finally {
    await recordEvidence({
      requirementId: "MV-S0-COMPARE-001",
      startedAt,
      stages: [
        "Independent fixture copied and changed one saved value/shape at a time",
        "Same deepStrictEqual comparator used by Workspace roundtrip",
      ],
      expected: "Every mutation differs from the complete independent fixture",
      actual: observations,
      ...(failure === undefined ? {} : { error: failure }),
    });
  }
});
