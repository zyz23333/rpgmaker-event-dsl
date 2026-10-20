import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { discoverDefinitionFiles, loadDefinitionFile } from "../src/workspace/definitions.js";
import { getWorkspaceStatePaths } from "../src/workspace/state.js";
import { renderJsonValue } from "../src/project-data/json-values.js";
import {
  createMinimalProject,
  runCli,
  withWindowsSandbox,
  type WindowsSandbox,
} from "./support/windows-sandbox.js";
import { recordEvidence } from "./support/mv-evidence.js";
import { blankEvent, blankPage } from "./support/map-event-fixtures.js";
import {
  movementInstructions,
  movementParameterCases,
} from "./support/movement-instruction-fixtures.js";

const {
  initWorkspace,
  cloneWorkspace,
  decompileWorkspace,
  compileWorkspace,
  diffWorkspace,
  pushWorkspace,
}: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const discovery = {
  sourceRoot: "src",
  sourceInclude: ["**/*.events.ts", "**/*.dsl.ts"],
  sourceExclude: [],
};
const savedNumbers: {
  accepted: { label: string; native: unknown; sourceFields: string[] }[];
  rejected: { native: unknown };
} = JSON.parse(
  await readFile(
    new URL("./fixtures/mv-evidence/movement-saved-numbers.json", import.meta.url),
    "utf8",
  ),
);

async function withMovementEvidence(
  id: string,
  label: string,
  body: (sandbox: WindowsSandbox) => Promise<void>,
) {
  await withWindowsSandbox(label, async (sandbox) => {
    const startedAt = new Date().toISOString();
    let failure: unknown;
    try {
      await body(sandbox);
    } catch (error) {
      failure = error;
      throw error;
    } finally {
      await recordEvidence({
        requirementId: `MV-S6-MOVEMENT-${id}`,
        startedAt,
        stages: [
          "Actual public Workspace API/CLI and filesystem; discovered/evaluated formal source; independent complete native carriers and complete failure-state comparison",
        ],
        expected:
          "The linked assertions compare complete independent native values and intended diagnostics, including saved/inactive route fields and exact205/505. Rejected operations preserve every captured Workspace state field.",
        actual: {
          case: label,
          finalState: await state(sandbox.workspaceRoot),
          processes: sandbox.processes,
          entry: sandbox.cliEntry,
        },
        ...(failure === undefined ? {} : { error: failure }),
      });
    }
  });
}

async function state(workspaceRoot: string) {
  const paths = getWorkspaceStatePaths(workspaceRoot);
  const data = async (directory: string) => {
    try {
      return Object.fromEntries(
        await Promise.all(
          (await readdir(directory))
            .sort()
            .map(async (name) => [name, await readFile(join(directory, name), "utf8")]),
        ),
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  };
  const files = await discoverDefinitionFiles(workspaceRoot, discovery);
  return {
    config: await readFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8"),
    projectDescriptor: await readFile(join(workspaceRoot, "Game/Game.rpgproject"), "utf8"),
    project: await data(join(workspaceRoot, "Game/data")),
    snapshot: await data(paths.projectDataSnapshotDirectory),
    generated: await data(paths.generatedProjectDataDirectory),
    manifest: await readFile(paths.syncManifestPath, "utf8"),
    discovery: files,
    source: await Promise.all(files.map((file) => readFile(file, "utf8"))),
  };
}

const nativePage = (
  records: unknown[],
  flags = { repeat: true, skippable: false, wait: false },
  terminal: unknown = { code: 0, parameters: [] },
) => {
  const route = { list: [...records, terminal], ...flags };
  return {
    ...structuredClone(blankPage),
    moveRoute: route,
    list: [
      { code: 205, indent: 0, parameters: [-1, route] },
      ...records.map((record) => ({ code: 505, indent: 0, parameters: [record] })),
      { code: 0, indent: 0, parameters: [] },
    ],
  };
};

async function prepare(workspaceRoot: string, pages: unknown[]) {
  await createMinimalProject(workspaceRoot);
  const carrier = {
    width: 17,
    height: 13,
    tilesetId: 1,
    events: [null, { ...blankEvent, pages }, null, null],
    external: { exact: [null, "", false] },
  };
  await writeFile(
    join(workspaceRoot, "Game/data/MapInfos.json"),
    JSON.stringify([null, { id: 1, name: "Movement Map" }]),
  );
  await writeFile(join(workspaceRoot, "Game/data/Map001.json"), renderJsonValue(carrier));
  const systemPath = join(workspaceRoot, "Game/data/System.json");
  const system = JSON.parse(await readFile(systemPath, "utf8"));
  system.switches = ["", "Named", "", "Last"];
  await writeFile(systemPath, JSON.stringify(system));
  await initWorkspace({ workspaceRoot, projectRoot: "./Game" });
  await cloneWorkspace({ workspaceRoot });
  return carrier;
}

async function enableScript(workspaceRoot: string) {
  const path = join(workspaceRoot, "rpgmaker-event-dsl.config.json");
  const config = JSON.parse(await readFile(path, "utf8"));
  config.scriptEnabled = true;
  await writeFile(path, JSON.stringify(config));
}

it("MV-S6-MOVEMENT-001: evaluates all45 native records with every finite shell and parameter case through actual Workspace Check Compile Diff Push", async () => {
  await withMovementEvidence("001", "movement-full-matrix", async ({ workspaceRoot }) => {
    const pages = (["absent", "null", "zero"] as const).map((indent) =>
      nativePage(
        movementInstructions.map(({ native }) => ({
          ...native,
          ...(indent === "absent" ? {} : { indent: indent === "null" ? null : 0 }),
        })),
      ),
    );
    pages.push(nativePage(movementParameterCases.map(({ native }) => native)));
    for (const repeat of [false, true])
      for (const skippable of [false, true])
        for (const wait of [false, true])
          pages.push(
            nativePage([{ code: 15, parameters: [1] }], { repeat, skippable, wait }, { code: 0 }),
          );
    const carrier = await prepare(workspaceRoot, pages);
    await enableScript(workspaceRoot);
    const originalProject = (await state(workspaceRoot)).project!;
    await decompileWorkspace({ workspaceRoot });
    const files = await discoverDefinitionFiles(workspaceRoot, discovery);
    const declarations = (await Promise.all(files.map((file) => loadDefinitionFile(file)))).flat();
    expect(declarations.filter((value) => value.kind === "mapEvent")).toHaveLength(1);
    const sourcePath = join(workspaceRoot, "src/decompiled/maps/Map001.events.ts");
    const source = await readFile(sourcePath, "utf8");
    for (const expected of [
      'savedShape: { indent: "null" }',
      'savedShape: { indent: "zero" }',
      'terminator: { parameters: "absent" }',
      'kind: "wait"',
      "character: null",
      "characterIndex: 7",
      'blendMode: "screen"',
      "asset: null",
      'scriptInput({ code: "" })',
    ])
      expect(source).toContain(expected);
    expect(source).not.toContain("rawDslCommand");
    await compileWorkspace({ workspaceRoot, check: true });
    await compileWorkspace({ workspaceRoot, check: false });
    const generated = getWorkspaceStatePaths(workspaceRoot).generatedProjectDataDirectory;
    expect(JSON.parse(await readFile(join(generated, "Map001.json"), "utf8"))).toStrictEqual(
      carrier,
    );
    await writeFile(sourcePath, source.replace("Complete blank", "Movement installation verified"));
    await compileWorkspace({ workspaceRoot, check: true });
    await compileWorkspace({ workspaceRoot, check: false });
    expect(await diffWorkspace({ workspaceRoot })).toContain("Movement installation verified");
    await pushWorkspace({ workspaceRoot, allowDestructive: false });
    carrier.events[1]!.name = "Movement installation verified";
    expect(
      JSON.parse(await readFile(join(workspaceRoot, "Game/data/Map001.json"), "utf8")),
    ).toStrictEqual(carrier);
    const expectedProject = { ...originalProject, "Map001.json": JSON.stringify(carrier) };
    const actualProject = (await state(workspaceRoot)).project!;
    expect(Object.keys(actualProject)).toHaveLength(15);
    for (const [name, bytes] of Object.entries(expectedProject))
      expect(JSON.parse(actualProject[name]!)).toStrictEqual(JSON.parse(bytes as string));
  });
}, 30_000);

it.each(savedNumbers.accepted)(
  "MV-S6-MOVEMENT-011: $label preserves negative-zero saved parameters through actual Workspace source evaluation and installation",
  async ({ native, sourceFields }) => {
    await withMovementEvidence("011", "movement-negative-zero", async ({ workspaceRoot }) => {
      const carrier = await prepare(workspaceRoot, [nativePage([native])]);
      const original = (await state(workspaceRoot)).project!;
      expect(original["Map001.json"]).toContain("-0");
      await decompileWorkspace({ workspaceRoot });
      const sourcePath = join(workspaceRoot, "src/decompiled/maps/Map001.events.ts");
      const source = await readFile(sourcePath, "utf8");
      for (const field of sourceFields) expect(source).toContain(field);
      await compileWorkspace({ workspaceRoot, check: true });
      await compileWorkspace({ workspaceRoot, check: false });
      const generated = join(
        getWorkspaceStatePaths(workspaceRoot).generatedProjectDataDirectory,
        "Map001.json",
      );
      expect(JSON.parse(await readFile(generated, "utf8"))).toStrictEqual(carrier);
      await writeFile(sourcePath, source.replace("Complete blank", "Negative zero installed"));
      await compileWorkspace({ workspaceRoot, check: false });
      expect(await diffWorkspace({ workspaceRoot })).toContain("Negative zero installed");
      await pushWorkspace({ workspaceRoot, allowDestructive: false });
      carrier.events[1]!.name = "Negative zero installed";
      const actual = (await state(workspaceRoot)).project!;
      expect(Object.keys(actual)).toHaveLength(15);
      for (const [file, bytes] of Object.entries(original))
        expect(JSON.parse(actual[file]!)).toStrictEqual(
          file === "Map001.json" ? carrier : JSON.parse(bytes as string),
        );
    });
  },
  30_000,
);

it("MV-S6-MOVEMENT-002: retains empty and CR LF M45 source while closed Gate warns on Decompile and rejects Check Compile including a fixed route", async () => {
  await withMovementEvidence("002", "movement-gate", async (sandbox) => {
    const { workspaceRoot } = sandbox;
    const carrier = await prepare(workspaceRoot, [
      nativePage([
        { code: 45, parameters: [""] },
        { code: 45, parameters: [" \t\r\n// tail \t"] },
      ]),
    ]);
    const decompiled = await runCli(sandbox, ["decompile"]);
    expect(decompiled.stdout + decompiled.stderr).toContain("MV-SCRIPT-GATE");
    expect(decompiled.stdout + decompiled.stderr).toContain("MV-MOVEMENT-TEXT-RISK");
    const source = await readFile(
      join(workspaceRoot, "src/decompiled/maps/Map001.events.ts"),
      "utf8",
    );
    expect(source).toContain('scriptInput({ code: "" })');
    expect(source).toContain('scriptInput({ code: " \\t\\r\\n// tail \\t" })');
    const before = await state(workspaceRoot);
    for (const check of [true, false])
      await expect(compileWorkspace({ workspaceRoot, check })).rejects.toThrow(/MV-SCRIPT-GATE/);
    expect(await state(workspaceRoot)).toStrictEqual(before);
    await enableScript(workspaceRoot);
    await compileWorkspace({ workspaceRoot, check: true });
    await compileWorkspace({ workspaceRoot, check: false });
    expect(
      JSON.parse(
        await readFile(
          join(getWorkspaceStatePaths(workspaceRoot).generatedProjectDataDirectory, "Map001.json"),
          "utf8",
        ),
      ),
    ).toStrictEqual(carrier);
  });
}, 30_000);

it("MV-S6-MOVEMENT-003: rejects malformed evaluated untyped movement values without changing any complete Workspace carrier or publication state", async () => {
  await withMovementEvidence("003", "movement-untyped", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot, [blankPage]);
    await decompileWorkspace({ workspaceRoot });
    await compileWorkspace({ workspaceRoot, check: false });
    await mkdir(join(workspaceRoot, "src"), { recursive: true });
    const sourcePath = join(workspaceRoot, "src/untyped.events.ts");
    for (const instruction of [
      { kind: "walkAnimation", enabled: "false" },
      { kind: "changeImage", character: null, characterIndex: 8 },
      { kind: "playSe", audio: { asset: null, volume: 17, pitch: 73 } },
      { kind: "changeBlendMode", blendMode: 1 },
      { kind: "wait", frames: 0 },
      { kind: "switchOn", switch: { kind: "variable", id: 1 } },
      { kind: "switchOff", switch: { kind: "switch", id: 1, name: "Named" } },
    ]) {
      await writeFile(
        sourcePath,
        `import { commonEvent, setMovementRoute } from "rpgmaker-event-dsl";\nconst instruction = ${JSON.stringify(instruction)} as never;\nexport const untyped = commonEvent({ id: 2, name: "Untyped", trigger: "none", commands: [setMovementRoute({ target: { kind: "runtimeSelector", scope: "character", target: "player" }, route: { commands: [instruction] } })] });\n`,
      );
      const before = await state(workspaceRoot);
      for (const check of [true, false])
        await expect(compileWorkspace({ workspaceRoot, check })).rejects.toThrow(
          /MV-MOVEMENT-(SHAPE|PARAMETER)/,
        );
      expect(await state(workspaceRoot)).toStrictEqual(before);
    }
  });
}, 30_000);

it.each([
  [
    "late saved route",
    (page: ReturnType<typeof nativePage>) => {
      page.moveRoute.list[1] = { code: 43, parameters: [4] };
    },
    "MV-MOVEMENT-PARAMETER",
  ],
  [
    "late mirror",
    (page: ReturnType<typeof nativePage>) => {
      page.list[2]!.parameters[0] = { code: 15, parameters: [2] };
    },
    "MV-MOVEMENT-MIRROR",
  ],
] as const)(
  "MV-S6-MOVEMENT-004: rejects %s without publishing earlier candidates or changing complete Workspace state",
  async (_label, corrupt, code) => {
    await withMovementEvidence("004", "movement-late-native", async ({ workspaceRoot }) => {
      const late = nativePage([{ code: 1 }, { code: 15, parameters: [1] }]);
      corrupt(late);
      await prepare(workspaceRoot, [nativePage([{ code: 1 }]), late]);
      const before = await state(workspaceRoot);
      await expect(decompileWorkspace({ workspaceRoot })).rejects.toMatchObject({
        code,
        identity: "map:1/event:1",
      });
      expect(await state(workspaceRoot)).toStrictEqual(before);
    });
  },
  30_000,
);

it.each(["page", "forced"] as const)(
  "MV-S6-MOVEMENT-012: rejects a negative-zero symbolic M43 value in the %s route before source publication",
  async (entrance) => {
    await withMovementEvidence("012", "movement-negative-zero-blend", async ({ workspaceRoot }) => {
      const page = nativePage([savedNumbers.rejected.native]);
      if (entrance === "forced") page.moveRoute = structuredClone(blankPage.moveRoute);
      await prepare(workspaceRoot, [page]);
      const before = await state(workspaceRoot);
      await expect(decompileWorkspace({ workspaceRoot })).rejects.toMatchObject({
        code: "MV-MOVEMENT-PARAMETER",
        identity: "map:1/event:1",
        location: {
          nativePath:
            entrance === "page"
              ? "pages[0].moveRoute.list[0].parameters[0]"
              : "pages[0].list[0].parameters[1].list[0].parameters[0]",
          actual: "-0",
        },
      });
      expect(await state(workspaceRoot)).toStrictEqual(before);
    });
  },
  30_000,
);
