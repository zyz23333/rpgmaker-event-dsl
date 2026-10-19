import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { expect, it as test } from "vitest";
import { discoverDefinitionFiles, loadDefinitionFile } from "../src/workspace/definitions.js";
import { recordEvidence } from "./support/mv-evidence.js";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { createMinimalProject, withWindowsSandbox } from "./support/windows-sandbox.js";

const api: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const fixture = JSON.parse(
  await readFile(
    new URL("./fixtures/mv-evidence/system-access-window-scenes-project.json", import.meta.url),
    "utf8",
  ),
);
const sourceNames = [
  "src/decompiled/common-events.events.ts",
  "src/decompiled/maps/Map001.events.ts",
  "src/decompiled/system.dsl.ts",
  "src/decompiled/troop-events.events.ts",
];
const commandExpressions = [
  "changeSaveAccess({ enabled: false })",
  "changeSaveAccess({ enabled: true })",
  "changeMenuAccess({ enabled: false })",
  "changeMenuAccess({ enabled: true })",
  "changeEncounter({ enabled: false })",
  "changeEncounter({ enabled: true })",
  "changeFormationAccess({ enabled: false })",
  "changeFormationAccess({ enabled: true })",
  "changeWindowColor({ tone: { red: -255, green: 255, blue: 0, gray: 255 } })",
  "changeWindowColor({ tone: { red: 255, green: -255, blue: 255, gray: 0 } })",
  "changeWindowColor({ tone: { red: -0, green: 0, blue: -0, gray: -0 } })",
  "openMenuScreen()",
  "openSaveScreen()",
  "gameOver()",
  "returnToTitleScreen()",
];

function it(name: string, body: (actual: Record<string, unknown>) => Promise<void>) {
  test(name, async () => {
    const startedAt = new Date().toISOString();
    const actual: Record<string, unknown> = { entry: workspaceApiEntry };
    let failure: unknown;
    try {
      await body(actual);
    } catch (error) {
      failure = error;
      throw error;
    } finally {
      await recordEvidence({
        requirementId: name.split(":")[0]!,
        startedAt,
        stages: [
          "Actual full fifteen-carrier independent Project Root and Snapshot",
          "Public Workspace operations, actual Discovery and source evaluation as asserted",
          "Complete generated data, Push, signed values or failure state and stale guards as asserted",
        ],
        expected: name,
        actual: { ...actual, assertionsCompleted: failure === undefined },
        ...(failure === undefined ? {} : { error: failure }),
      });
    }
  });
}

// Independent input serialization preserves the signed numbers in the authored fixture.
function nativeLiteral(value: unknown): string {
  if (typeof value === "number" && Object.is(value, -0)) return "-0";
  if (Array.isArray(value)) return `[${value.map(nativeLiteral).join(",")}]`;
  if (value !== null && typeof value === "object")
    return `{${Object.entries(value)
      .map(([key, child]) => `${JSON.stringify(key)}:${nativeLiteral(child)}`)
      .join(",")}}`;
  const literal = JSON.stringify(value);
  if (literal === undefined) throw new Error("Only explicit JSON fixture values are supported.");
  return literal;
}

async function data(root: string): Promise<Record<string, unknown>> {
  const names = (await readdir(root)).sort();
  return Object.fromEntries(
    await Promise.all(
      names.map(async (name) => [name, JSON.parse(await readFile(join(root, name), "utf8"))]),
    ),
  );
}

async function tree(root: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const entry of (await readdir(root, { withFileTypes: true }).catch(() => [])).sort(
    (left, right) => left.name.localeCompare(right.name),
  )) {
    if (entry.name === "operation.lock") continue;
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      result[entry.name + "/"] = "directory";
      for (const [name, bytes] of Object.entries(await tree(path)))
        result[entry.name + "/" + name] = bytes;
    } else result[entry.name] = (await readFile(path)).toString("hex");
  }
  return result;
}

async function observe(workspaceRoot: string) {
  const config = await readFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8");
  const state = await tree(join(workspaceRoot, ".rpgmaker-event-dsl"));
  // Only the allowed empty isolation parent may remain; child directories and files still compare.
  delete state["decompile-candidates/"];
  return {
    config,
    source: await tree(join(workspaceRoot, "src")),
    project: await tree(join(workspaceRoot, "Game")),
    state,
    discovery: await discoverDefinitionFiles(workspaceRoot, JSON.parse(config)),
  };
}

async function prepare(workspaceRoot: string, carriers = structuredClone(fixture.projectFiles)) {
  await createMinimalProject(workspaceRoot);
  for (const [name, value] of Object.entries(carriers))
    await writeFile(join(workspaceRoot, "Game/data", name), nativeLiteral(value));
  await api.initWorkspace({ workspaceRoot, projectRoot: "./Game" });
  await api.cloneWorkspace({ workspaceRoot });
  expect(Object.keys(carriers)).toHaveLength(15);
  expect(await data(join(workspaceRoot, "Game/data"))).toStrictEqual(carriers);
  expect(
    await data(join(workspaceRoot, ".rpgmaker-event-dsl/project-data-snapshot")),
  ).toStrictEqual(carriers);
  return carriers;
}

function generated(carriers: Record<string, unknown>) {
  return Object.fromEntries(
    ["CommonEvents.json", "Map001.json", "System.json", "Troops.json"].map((name) => [
      name,
      carriers[name],
    ]),
  );
}

function assertToneSigns(carriers: Record<string, unknown>) {
  const common = carriers[
    "CommonEvents.json"
  ] as (typeof fixture.projectFiles)["CommonEvents.json"];
  const map = carriers["Map001.json"] as (typeof fixture.projectFiles)["Map001.json"];
  const troops = carriers["Troops.json"] as (typeof fixture.projectFiles)["Troops.json"];
  for (const commands of [common[1].list, map.events[1].pages[0].list, troops[1].pages[0].list])
    expect(commands[10].parameters[0].map((value: number) => Object.is(value, -0))).toStrictEqual([
      true,
      false,
      true,
      true,
    ]);
  expect(Object.is(map.external.negativeZero, -0)).toBe(true);
}

async function discovered(workspaceRoot: string) {
  const config = JSON.parse(
    await readFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8"),
  );
  const files = await discoverDefinitionFiles(workspaceRoot, config);
  expect(
    files.map((file) => relative(workspaceRoot, file).replaceAll("\\", "/")).sort(),
  ).toStrictEqual(sourceNames);
  return files;
}

it("MV-S6-SYSTEM-SCENES-010: decompiles full native carriers and evaluates discovered formal source with read-only Check", async (actual) => {
  await withWindowsSandbox("system-scenes-discovery-check", async ({ workspaceRoot }) => {
    actual.workspaceRoot = workspaceRoot;
    const carriers = await prepare(workspaceRoot);
    assertToneSigns(carriers);
    await api.decompileWorkspace({ workspaceRoot });
    const files = await discovered(workspaceRoot);
    const sources = await Promise.all(files.map((file) => readFile(file, "utf8")));
    const commandSources = sources.filter((source) => source.includes("changeWindowColor"));
    expect(commandSources).toHaveLength(3);
    for (const source of commandSources) {
      for (const expression of commandExpressions) expect(source).toContain(expression);
      expect(source).not.toContain("rawDslCommand");
      expect(source).not.toContain("changeEncounterDisable");
    }
    const declarations: Awaited<ReturnType<typeof loadDefinitionFile>> = [];
    for (const [index, file] of files.entries())
      if (sources[index]!.includes("changeWindowColor"))
        declarations.push(...(await loadDefinitionFile(file)));
    expect(declarations.map((declaration) => declaration.kind).sort()).toStrictEqual([
      "commonEvent",
      "mapEvent",
      "troopEvent",
    ]);
    actual.discovered = files;
    actual.evaluatedDeclarations = declarations;
    actual.before = await observe(workspaceRoot);
    await api.compileWorkspace({ workspaceRoot, check: true });
    actual.after = await observe(workspaceRoot);
    expect(actual.after).toStrictEqual(actual.before);
    expect(await data(join(workspaceRoot, "Game/data"))).toStrictEqual(carriers);
    expect(
      await data(join(workspaceRoot, ".rpgmaker-event-dsl/project-data-snapshot")),
    ).toStrictEqual(carriers);
  });
});

it("MV-S6-SYSTEM-SCENES-011: compiles all generated carriers and really pushes independent formal edits in all three event containers", async (actual) => {
  await withWindowsSandbox("system-scenes-formal-push", async ({ workspaceRoot }) => {
    actual.workspaceRoot = workspaceRoot;
    const carriers = await prepare(workspaceRoot);
    await api.decompileWorkspace({ workspaceRoot });
    for (const file of await discovered(workspaceRoot)) {
      const source = await readFile(file, "utf8");
      await writeFile(
        file,
        source.replace(commandExpressions[0]!, "changeSaveAccess({ enabled: true })"),
      );
    }
    const expected = structuredClone(carriers);
    expected["CommonEvents.json"][1].list[0].parameters = [1];
    expected["Map001.json"].events[1].pages[0].list[0].parameters = [1];
    expected["Troops.json"][1].pages[0].list[0].parameters = [1];
    actual.expectedProject = expected;
    await api.compileWorkspace({ workspaceRoot, check: false });
    actual.generated = await data(
      join(workspaceRoot, ".rpgmaker-event-dsl/generated-project-data"),
    );
    expect(actual.generated).toStrictEqual(generated(expected));
    assertToneSigns(actual.generated as Record<string, unknown>);
    actual.diff = await api.diffWorkspace({ workspaceRoot, short: true });
    expect(actual.diff).not.toContain("No changes.");
    await api.pushWorkspace({ workspaceRoot, allowDestructive: false });
    actual.project = await data(join(workspaceRoot, "Game/data"));
    actual.snapshot = await data(join(workspaceRoot, ".rpgmaker-event-dsl/project-data-snapshot"));
    expect(actual.project).toStrictEqual(expected);
    expect(actual.snapshot).toStrictEqual(expected);
    assertToneSigns(actual.project as Record<string, unknown>);
    expect(await api.diffWorkspace({ workspaceRoot, short: true })).toContain("No changes.");
  });
});

it("MV-S6-SYSTEM-SCENES-012: evaluates every known raw command in three containers and really pushes exact independent saved state", async (actual) => {
  await withWindowsSandbox("system-scenes-known-raw-push", async ({ workspaceRoot }) => {
    actual.workspaceRoot = workspaceRoot;
    const carriers = await prepare(workspaceRoot);
    await api.decompileWorkspace({ workspaceRoot });
    const commands = fixture.projectFiles["CommonEvents.json"][1].list.slice(0, -1);
    for (const file of await discovered(workspaceRoot)) {
      let source = await readFile(file, "utf8");
      if (!source.includes("changeWindowColor")) continue;
      for (const [index, expression] of commandExpressions.entries()) {
        expect(source).toContain(expression);
        const command = commands[index];
        source = source.replace(
          expression,
          `rawDslCommand({ code: ${command.code}, parameters: ${nativeLiteral(command.parameters)} })`,
        );
      }
      source = 'import { rawDslCommand } from "rpgmaker-event-dsl";\n' + source;
      source = source.replace('name: "System common"', 'name: "Installed known raw system common"');
      await writeFile(file, source);
    }
    const expected = structuredClone(carriers);
    expected["CommonEvents.json"][1].name = "Installed known raw system common";
    actual.expectedProject = expected;
    await api.compileWorkspace({ workspaceRoot, check: false });
    actual.generated = await data(
      join(workspaceRoot, ".rpgmaker-event-dsl/generated-project-data"),
    );
    expect(actual.generated).toStrictEqual(generated(expected));
    assertToneSigns(actual.generated as Record<string, unknown>);
    expect(await api.diffWorkspace({ workspaceRoot, short: true })).not.toContain("No changes.");
    await api.pushWorkspace({ workspaceRoot, allowDestructive: false });
    actual.project = await data(join(workspaceRoot, "Game/data"));
    actual.snapshot = await data(join(workspaceRoot, ".rpgmaker-event-dsl/project-data-snapshot"));
    expect(actual.project).toStrictEqual(expected);
    expect(actual.snapshot).toStrictEqual(expected);
    assertToneSigns(actual.project as Record<string, unknown>);
  });
});

type SourceFailure = {
  file: "common-events.events.ts" | "maps/Map001.events.ts" | "troop-events.events.ts";
  expression: string;
  replacement: string;
  prefix?: string;
  diagnostic: RegExp;
};

async function sourceFailure(actual: Record<string, unknown>, input: SourceFailure) {
  await withWindowsSandbox("system-scenes-source-failure", async ({ workspaceRoot }) => {
    actual.workspaceRoot = workspaceRoot;
    await prepare(workspaceRoot);
    await api.decompileWorkspace({ workspaceRoot });
    await api.compileWorkspace({ workspaceRoot, check: false });
    const file = join(workspaceRoot, "src/decompiled", input.file);
    const source = await readFile(file, "utf8");
    expect(source).toContain(input.expression);
    const replaced = source.replace(input.expression, input.replacement);
    const declarationAt = replaced.indexOf("export const ");
    expect(declarationAt).toBeGreaterThanOrEqual(0);
    await writeFile(
      file,
      replaced.slice(0, declarationAt) + (input.prefix ?? "") + replaced.slice(declarationAt),
    );
    actual.before = await observe(workspaceRoot);
    actual.input = { ...input, diagnostic: input.diagnostic.source };
    for (const check of [true, false]) {
      await expect(api.compileWorkspace({ workspaceRoot, check })).rejects.toThrow(
        input.diagnostic,
      );
      expect(await observe(workspaceRoot)).toStrictEqual(actual.before);
    }
    await expect(api.diffWorkspace({ workspaceRoot })).rejects.toThrow(
      /Generated Project Data is stale/,
    );
    expect(await observe(workspaceRoot)).toStrictEqual(actual.before);
    await expect(api.pushWorkspace({ workspaceRoot, allowDestructive: false })).rejects.toThrow(
      /Generated Project Data is stale/,
    );
    actual.after = await observe(workspaceRoot);
    expect(actual.after).toStrictEqual(actual.before);
  });
}

it("MV-S6-SYSTEM-SCENES-013: rejects helper local-const extra access fields before projection and preserves complete stale Workspace state", async (actual) => {
  await sourceFailure(actual, {
    file: "common-events.events.ts",
    expression: commandExpressions[0]!,
    replacement: "changeSaveAccess(invalidAccess)",
    prefix: "const invalidAccess = { enabled: false, extra: true };\n",
    diagnostic: /MV-DSL-SHAPE.*changeSaveAccess.*expected.*actual/s,
  });
});

it("MV-S6-SYSTEM-SCENES-014: rejects nested spread Tone extras before projection and preserves complete stale Workspace state", async (actual) => {
  await sourceFailure(actual, {
    file: "maps/Map001.events.ts",
    expression: commandExpressions[8]!,
    replacement: "changeWindowColor({ tone: { ...invalidTone } })",
    prefix: "const invalidTone = { red: -255, green: 255, blue: 0, gray: 255, extra: true };\n",
    diagnostic: /MV-DSL-SHAPE.*changeWindowColor\.tone.*expected.*actual/s,
  });
});

it("MV-S6-SYSTEM-SCENES-015: rejects runtime scene inputs from a typed local helper alias and preserves complete stale Workspace state", async (actual) => {
  await sourceFailure(actual, {
    file: "troop-events.events.ts",
    expression: "openMenuScreen()",
    replacement: "unsafeScene(undefined)",
    prefix:
      "const unsafeScene = openMenuScreen as (...args: unknown[]) => ReturnType<typeof openMenuScreen>;\n",
    diagnostic: /MV-E351-INPUT.*openMenuScreen.*expected.*actual/s,
  });
});

it("MV-S6-SYSTEM-SCENES-016: rejects directly constructed nonboolean access state with exact identity and authored slot", async (actual) => {
  await sourceFailure(actual, {
    file: "common-events.events.ts",
    expression: commandExpressions[0]!,
    replacement: '({ kind: "changeSaveAccess", enabled: "false" } as never)',
    diagnostic:
      /compile error commonEvent:1: MV-E134-INPUT.*commands\[0\]\.enabled.*expected.*actual/s,
  });
});

it("MV-S6-SYSTEM-SCENES-017: rejects directly constructed missing hidden gray with exact map identity and authored Tone field", async (actual) => {
  await sourceFailure(actual, {
    file: "maps/Map001.events.ts",
    expression: commandExpressions[8]!,
    replacement:
      '({ kind: "changeWindowColor", tone: { red: -255, green: 255, blue: 0 } } as never)',
    diagnostic:
      /compile error map:1\/event:1: MV-E138-INPUT.*pages\[0\]\.commands\[8\]\.tone\.gray.*expected.*actual/s,
  });
});

it("MV-S6-SYSTEM-SCENES-018: rejects known raw categorical negative zero with exact authored slot and preserves stale guards", async (actual) => {
  await sourceFailure(actual, {
    file: "common-events.events.ts",
    expression: commandExpressions[0]!,
    replacement: '({ kind: "rawDslCommand", code: 134, parameters: [-0] } as never)',
    diagnostic:
      /compile error commonEvent:1: MV-E134-PARAMETERS.*commands\[0\]\.parameters\[0\].*expected.*actual/s,
  });
});

it("MV-S6-SYSTEM-SCENES-019: rejects known raw out-of-range Window Tone with exact nested authored slot and preserves stale guards", async (actual) => {
  await sourceFailure(actual, {
    file: "maps/Map001.events.ts",
    expression: commandExpressions[8]!,
    replacement: '({ kind: "rawDslCommand", code: 138, parameters: [[-256,255,0,255]] } as never)',
    diagnostic:
      /compile error map:1\/event:1: MV-E138-PARAMETERS.*pages\[0\]\.commands\[8\]\.parameters\[0\]\[0\].*expected.*actual/s,
  });
});

it("MV-S6-SYSTEM-SCENES-020: rejects known raw scene extra slots with exact troop authored path and preserves stale guards", async (actual) => {
  await sourceFailure(actual, {
    file: "troop-events.events.ts",
    expression: "openMenuScreen()",
    replacement: '({ kind: "rawDslCommand", code: 351, parameters: [0] } as never)',
    diagnostic:
      /compile error troop:1: MV-COMMAND-PARAMETERS.*pages\[0\]\.commands\[11\]\.parameters.*expected.*actual/s,
  });
});

type NativeFailure = {
  carrier: "CommonEvents.json" | "Map001.json" | "Troops.json";
  command: { code: number; indent: number; parameters: unknown[] };
  identity: string;
  code: string;
  nativePath: string;
};

async function nativeFailure(actual: Record<string, unknown>, input: NativeFailure) {
  await withWindowsSandbox("system-scenes-native-failure", async ({ workspaceRoot }) => {
    actual.workspaceRoot = workspaceRoot;
    const carriers = structuredClone(fixture.projectFiles);
    const commands =
      input.carrier === "CommonEvents.json"
        ? carriers["CommonEvents.json"][1].list
        : input.carrier === "Map001.json"
          ? carriers["Map001.json"].events[1].pages[0].list
          : carriers["Troops.json"][1].pages[0].list;
    commands[0] = input.command;
    await prepare(workspaceRoot, carriers);
    await mkdir(join(workspaceRoot, "src"), { recursive: true });
    await writeFile(join(workspaceRoot, "src/retained.dsl.ts"), "export {};\n");
    actual.before = await observe(workspaceRoot);
    actual.input = input;
    await expect(api.decompileWorkspace({ workspaceRoot })).rejects.toMatchObject({
      code: input.code,
      stage: "decompile",
      identity: input.identity,
      location: {
        nativePath: input.nativePath,
        expected: expect.any(String),
        actual: expect.any(String),
      },
    });
    actual.after = await observe(workspaceRoot);
    expect(actual.after).toStrictEqual(actual.before);
  });
}

it("MV-S6-SYSTEM-SCENES-021: rejects native common access negative zero before any source publication with complete state preserved", async (actual) => {
  await nativeFailure(actual, {
    carrier: "CommonEvents.json",
    command: { code: 134, indent: 0, parameters: [-0] },
    identity: "commonEvent:1",
    code: "MV-E134-PARAMETERS",
    nativePath: "list[0].parameters[0]",
  });
});

it("MV-S6-SYSTEM-SCENES-022: rejects native map Window Tone bounds before any source publication with exact nested slot", async (actual) => {
  await nativeFailure(actual, {
    carrier: "Map001.json",
    command: { code: 138, indent: 0, parameters: [[0, 0, -256, 113]] },
    identity: "map:1/event:1",
    code: "MV-E138-PARAMETERS",
    nativePath: "pages[0].list[0].parameters[0][2]",
  });
});

it("MV-S6-SYSTEM-SCENES-023: rejects native troop scene extra slots before any source publication with complete state preserved", async (actual) => {
  await nativeFailure(actual, {
    carrier: "Troops.json",
    command: { code: 351, indent: 0, parameters: [0] },
    identity: "troop:1",
    code: "MV-COMMAND-PARAMETERS",
    nativePath: "pages[0].list[0].parameters",
  });
});

it("MV-S6-SYSTEM-SCENES-024: rejects direct scene unknown fields under an assertion with exact map authored path", async (actual) => {
  await sourceFailure(actual, {
    file: "maps/Map001.events.ts",
    expression: "openMenuScreen()",
    replacement: '({ kind: "openMenuScreen", extra: true } as never)',
    diagnostic:
      /compile error map:1\/event:1: MV-DSL-SHAPE.*pages\[0\]\.commands\[11\].*expected.*actual/s,
  });
});
