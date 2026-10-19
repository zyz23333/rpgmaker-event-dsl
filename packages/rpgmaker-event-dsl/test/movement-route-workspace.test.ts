import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import { initWorkspace } from "../src/workspace/config.js";
import {
  cloneWorkspace,
  compileWorkspace,
  decompileWorkspace,
  diffWorkspace,
} from "../src/workspace/operations.js";
import { discoverDefinitionFiles, loadDefinitionFile } from "../src/workspace/definitions.js";
import { getWorkspaceStatePaths } from "../src/workspace/state.js";
import { pushWorkspace } from "../src/workspace/push.js";
import { createMinimalProject, runCli, withWindowsSandbox } from "./support/windows-sandbox.js";
import { readMapEvents } from "../src/decompiler/core.js";

const fixture = JSON.parse(
  await readFile(
    new URL("./fixtures/mv-evidence/movement-route-cases.json", import.meta.url),
    "utf8",
  ),
);

async function prepare(workspaceRoot: string) {
  await createMinimalProject(workspaceRoot);
  await writeFile(
    join(workspaceRoot, "Game/data/CommonEvents.json"),
    JSON.stringify(fixture.events),
  );
  await writeFile(
    join(workspaceRoot, "Game/data/System.json"),
    JSON.stringify({ switches: ["", "Route", "Script", "After"], variables: [""] }),
  );
  await initWorkspace({ workspaceRoot, projectRoot: "./Game" });
  const configPath = join(workspaceRoot, "rpgmaker-event-dsl.config.json");
  const config = JSON.parse(await readFile(configPath, "utf8"));
  config.scriptEnabled = true;
  await writeFile(configPath, JSON.stringify(config));
  await cloneWorkspace({ workspaceRoot });
}

const discovery = {
  sourceRoot: "src",
  sourceInclude: ["**/*.events.ts", "**/*.dsl.ts"],
  sourceExclude: [],
};

async function dataFiles(directory: string): Promise<Record<string, string>> {
  const files = (await readdir(directory)).sort();
  return Object.fromEntries(
    await Promise.all(
      files.map(async (name) => [name, await readFile(join(directory, name), "utf8")]),
    ),
  );
}

async function state(workspaceRoot: string) {
  const paths = getWorkspaceStatePaths(workspaceRoot);
  const files = await discoverDefinitionFiles(workspaceRoot, discovery);
  return {
    project: await dataFiles(join(workspaceRoot, "Game/data")),
    snapshot: await dataFiles(paths.projectDataSnapshotDirectory),
    generated: await dataFiles(paths.generatedProjectDataDirectory),
    manifest: await readFile(paths.syncManifestPath, "utf8"),
    discovery: files,
    sources: await Promise.all(files.map((file) => readFile(file, "utf8"))),
  };
}

it("rejects unknown movement codes in a noncustom Autonomous Movement saved route", () => {
  expect(() =>
    readMapEvents(
      {
        events: [
          null,
          {
            id: 1,
            name: "Inactive route",
            x: 0,
            y: 0,
            pages: [
              {
                conditions: {},
                moveType: 0,
                moveRoute: {
                  list: [{ code: 99 }, { code: 0 }],
                  repeat: true,
                  skippable: false,
                  wait: false,
                },
                list: [{ code: 0, indent: 0, parameters: [] }],
                trigger: 0,
              },
            ],
          },
        ],
      },
      1,
    ),
  ).toThrow(/MV-MOVEMENT-CODE/);
});

it("round trips independent Movement Routes through actual Discovery, evaluation, Check, Compile, Diff and Push", async () => {
  await withWindowsSandbox("movement-roundtrip", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    await decompileWorkspace({ workspaceRoot });
    const files = await discoverDefinitionFiles(workspaceRoot, discovery);
    const declarations = (await Promise.all(files.map((file) => loadDefinitionFile(file)))).flat();
    expect(declarations.filter((value) => value.kind === "commonEvent")).toHaveLength(6);
    const sourcePath = join(workspaceRoot, "src/decompiled/common-events.events.ts");
    const source = await readFile(sourcePath, "utf8");
    expect(source).not.toContain("rawDslCommand");
    expect(source).toContain('savedShape: { indent: "null" }');
    expect(source).toContain('savedShape: { indent: "zero" }');
    expect(source).toContain('terminator: { parameters: "absent" }');
    const paths = getWorkspaceStatePaths(workspaceRoot);
    const manifestBefore = await readFile(paths.syncManifestPath, "utf8");
    await compileWorkspace({ workspaceRoot, check: true });
    expect(await readFile(paths.syncManifestPath, "utf8")).toBe(manifestBefore);
    await compileWorkspace({ workspaceRoot, check: false });
    const generatedPath = join(paths.generatedProjectDataDirectory, "CommonEvents.json");
    expect(JSON.parse(await readFile(generatedPath, "utf8"))).toStrictEqual(fixture.events);
    await writeFile(sourcePath, source.replace("Movement envelope matrix", "Evaluation control"));
    await compileWorkspace({ workspaceRoot, check: false });
    expect(JSON.parse(await readFile(generatedPath, "utf8"))[1].name).toBe("Evaluation control");
    await writeFile(sourcePath, source);
    await compileWorkspace({ workspaceRoot, check: false });
    expect(JSON.parse(await readFile(generatedPath, "utf8"))).toStrictEqual(fixture.events);
    await expect(diffWorkspace({ workspaceRoot })).resolves.toBeDefined();
    await pushWorkspace({ workspaceRoot, allowDestructive: false });
    expect(
      JSON.parse(await readFile(join(workspaceRoot, "Game/data/CommonEvents.json"), "utf8")),
    ).toStrictEqual(fixture.events);
  });
}, 30_000);

it("rejects a native Movement Route mirror conflict before publishing source and preserves all workspace state", async () => {
  await withWindowsSandbox("movement-rejection", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    const invalid = structuredClone(fixture.events);
    invalid[1].list[2].parameters[0].indent = 0;
    await writeFile(join(workspaceRoot, "Game/data/CommonEvents.json"), JSON.stringify(invalid));
    await cloneWorkspace({ workspaceRoot });
    const paths = getWorkspaceStatePaths(workspaceRoot);
    const observedPaths = [
      join(workspaceRoot, "Game/data/CommonEvents.json"),
      join(paths.projectDataSnapshotDirectory, "CommonEvents.json"),
      paths.syncManifestPath,
    ];
    const before = await Promise.all(observedPaths.map((path) => readFile(path, "utf8")));
    await expect(decompileWorkspace({ workspaceRoot })).rejects.toMatchObject({
      code: "MV-MOVEMENT-MIRROR",
      identity: "commonEvent:1",
      stage: "decompile",
      location: { nativePath: "list[2]" },
    });
    expect(await discoverDefinitionFiles(workspaceRoot, discovery)).toEqual([]);
    expect(await Promise.all(observedPaths.map((path) => readFile(path, "utf8")))).toEqual(before);
  });
});

it("checks and compiles Movement Routes through separate actual Windows CLI processes", async () => {
  await withWindowsSandbox("movement-cli", async (sandbox) => {
    await prepare(sandbox.workspaceRoot);
    await runCli(sandbox, ["decompile"]);
    await runCli(sandbox, ["compile", "--check"]);
    await runCli(sandbox, ["compile"]);
    const paths = getWorkspaceStatePaths(sandbox.workspaceRoot);
    expect(
      JSON.parse(
        await readFile(join(paths.generatedProjectDataDirectory, "CommonEvents.json"), "utf8"),
      ),
    ).toStrictEqual(fixture.events);
  });
}, 30_000);

it("preserves source, project, snapshot, manifest, generated data and Discovery after route Check and Compile failures", async () => {
  await withWindowsSandbox("movement-failed-check", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    await decompileWorkspace({ workspaceRoot });
    await compileWorkspace({ workspaceRoot, check: false });
    const sourcePath = join(workspaceRoot, "src/decompiled/common-events.events.ts");
    const original = await readFile(sourcePath, "utf8");
    await writeFile(sourcePath, original.replace('indent: "zero"', 'indent: ("invalid" as never)'));
    const before = await state(workspaceRoot);
    await expect(compileWorkspace({ workspaceRoot, check: true })).rejects.toThrow(
      /MV-MOVEMENT-SHAPE/,
    );
    await expect(compileWorkspace({ workspaceRoot, check: false })).rejects.toThrow(
      /MV-MOVEMENT-SHAPE/,
    );
    expect(await state(workspaceRoot)).toStrictEqual(before);
    await writeFile(sourcePath, original);
    const configPath = join(workspaceRoot, "rpgmaker-event-dsl.config.json");
    const config = JSON.parse(await readFile(configPath, "utf8"));
    config.scriptEnabled = false;
    await writeFile(configPath, JSON.stringify(config));
    const beforeGate = await state(workspaceRoot);
    await expect(compileWorkspace({ workspaceRoot, check: true })).rejects.toThrow(
      /explicit config enablement/,
    );
    await expect(compileWorkspace({ workspaceRoot, check: false })).rejects.toThrow(
      /explicit config enablement/,
    );
    expect(await state(workspaceRoot)).toStrictEqual(beforeGate);
  });
}, 30_000);
