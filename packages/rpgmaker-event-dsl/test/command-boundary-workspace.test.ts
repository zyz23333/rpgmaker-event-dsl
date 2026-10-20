import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import {
  cloneWorkspace,
  compileWorkspace,
  decompileWorkspace,
  diffWorkspace,
  initWorkspace,
} from "../src/workspace-api.js";
import { discoverDefinitionFiles } from "../src/workspace/definitions.js";
import { getWorkspaceStatePaths } from "../src/workspace/state.js";
import { writeStableJson } from "../src/project-data/writer.js";
import { createMinimalProject, runCli, withWindowsSandbox } from "./support/windows-sandbox.js";

const historicalFixture = JSON.parse(
  await readFile(
    new URL("./fixtures/mv-evidence/command-boundary-cases.json", import.meta.url),
    "utf8",
  ),
);
// Preserve the immutable historical fixture and add the independently specified
// empty note required by the complete Map Event contract. Its pages are complete.
const fixture = {
  ...historicalFixture,
  map: {
    ...historicalFixture.map,
    events: historicalFixture.map.events.map((event: Record<string, unknown> | null) =>
      event === null
        ? null
        : {
            note: "",
            ...event,
          },
    ),
  },
};
const discovery = {
  sourceRoot: "src",
  sourceInclude: ["**/*.events.ts", "**/*.dsl.ts"],
  sourceExclude: [],
};
async function prepare(workspaceRoot: string) {
  await createMinimalProject(workspaceRoot);
  for (const [name, value] of Object.entries({
    "CommonEvents.json": fixture.commonEvents,
    "MapInfos.json": [null, { id: 1, name: "Map", parentId: 0 }],
    "Map001.json": fixture.map,
    "System.json": {
      switches: ["", "Route switch"],
      variables: ["", "Script operand"],
      unknown: { value: -0 },
    },
  }))
    await writeFile(join(workspaceRoot, "Game/data", name), writeStableJson(value));
  await initWorkspace({ workspaceRoot, projectRoot: "./Game" });
  await cloneWorkspace({ workspaceRoot });
}
async function fileState(workspaceRoot: string) {
  const paths = getWorkspaceStatePaths(workspaceRoot);
  const data = async (directory: string) =>
    Object.fromEntries(
      await Promise.all(
        (await readdir(directory).catch(() => []))
          .sort()
          .map(async (name) => [name, await readFile(join(directory, name), "utf8")]),
      ),
    );
  const files = await discoverDefinitionFiles(workspaceRoot, discovery);
  return {
    project: await data(join(workspaceRoot, "Game/data")),
    snapshot: await data(paths.projectDataSnapshotDirectory),
    generated: await data(paths.generatedProjectDataDirectory),
    manifest: await readFile(paths.syncManifestPath, "utf8"),
    discovery: files,
    sources: await Promise.all(files.map((file) => readFile(file, "utf8"))),
  };
}
async function enable(workspaceRoot: string, scriptEnabled: boolean) {
  const file = join(workspaceRoot, "rpgmaker-event-dsl.config.json");
  await writeFile(
    file,
    JSON.stringify({ ...JSON.parse(await readFile(file, "utf8")), scriptEnabled }),
  );
}

it("decompiles with the Gate closed, reports every saved script location, and checks actual evaluated output without changing state", async () => {
  await withWindowsSandbox("command-boundary", async (sandbox) => {
    const { workspaceRoot } = sandbox;
    await prepare(workspaceRoot);
    const decompile = await runCli(sandbox, ["decompile"]);
    expect(decompile.exitCode).toBe(0);
    expect(decompile.stderr).toContain(
      "decompile warning map:1/event:1: MV-SCRIPT-GATE at pages[0].moveRoute.list[0].parameters[0]",
    );
    expect(decompile.stderr).toContain("MV-UNKNOWN-COMMAND");
    const before = await fileState(workspaceRoot);
    for (const check of [true, false])
      await expect(compileWorkspace({ workspaceRoot, check })).rejects.toThrow(/MV-SCRIPT-GATE/);
    expect(await fileState(workspaceRoot)).toStrictEqual(before);
    await enable(workspaceRoot, true);
    await compileWorkspace({ workspaceRoot, check: true });
    await compileWorkspace({ workspaceRoot, check: false });
    const paths = getWorkspaceStatePaths(workspaceRoot);
    expect(
      JSON.parse(
        await readFile(join(paths.generatedProjectDataDirectory, "CommonEvents.json"), "utf8"),
      ),
    ).toStrictEqual(fixture.commonEvents);
    expect(
      JSON.parse(await readFile(join(paths.generatedProjectDataDirectory, "Map001.json"), "utf8")),
    ).toStrictEqual(fixture.map);
    expect(await diffWorkspace({ workspaceRoot })).toBe(
      "Structured Diff Report\n\nAffected Project Data Files:\n- none\n\nDestructive Changes: no",
    );
    expect((await runCli(sandbox, ["compile", "--check"])).exitCode).toBe(0);
    expect((await runCli(sandbox, ["compile"])).exitCode).toBe(0);
    const commonFile = before.discovery.find((file) => file.endsWith("common-events.events.ts"))!;
    const source = await readFile(commonFile, "utf8");
    const changed = source.replace("code: 999", "code: 230");
    expect(changed).not.toBe(source);
    await writeFile(commonFile, changed);
    const failureState = await fileState(workspaceRoot);
    const check = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
    expect(check.exitCode).not.toBe(0);
    expect(check.stderr).toContain("MV-E230-PARAMETER");
    await expect(compileWorkspace({ workspaceRoot, check: false })).rejects.toThrow(
      /MV-E230-PARAMETER/,
    );
    expect(await fileState(workspaceRoot)).toStrictEqual(failureState);
    await writeFile(commonFile, source);
    await compileWorkspace({ workspaceRoot, check: false });
    expect(
      JSON.parse(
        await readFile(join(paths.generatedProjectDataDirectory, "CommonEvents.json"), "utf8"),
      ),
    ).toStrictEqual(fixture.commonEvents);
  });
}, 60000);

it("checks the current declarations after every script is removed while the old Snapshot still contains scripts", async () => {
  await withWindowsSandbox("command-boundary-removed-scripts", async (sandbox) => {
    const { workspaceRoot } = sandbox;
    await prepare(workspaceRoot);
    await decompileWorkspace({ workspaceRoot });
    const files = await discoverDefinitionFiles(workspaceRoot, discovery);
    const common = files.find((file) => file.endsWith("common-events.events.ts"))!;
    await writeFile(
      common,
      'import { commonEvent } from "rpgmaker-event-dsl";\n' +
        fixture.commonEvents
          .filter((event: unknown) => event !== null)
          .map(
            (event: { id: number; name: string }) =>
              `export const e${event.id}=commonEvent({id:${event.id},name:${JSON.stringify(event.name)},trigger:"none",commands:[]});`,
          )
          .join("\n"),
    );
    const map = files.find((file) => file.endsWith("Map001.events.ts"))!;
    await writeFile(
      map,
      'import { mapEvent, page } from "rpgmaker-event-dsl";\nexport const event=mapEvent({mapId:1,id:1,name:"No scripts",x:0,y:0,pages:[page({movement:{type:"fixed",route:{commands:[]}},commands:[]})]});\n',
    );
    const before = await fileState(workspaceRoot);
    await compileWorkspace({ workspaceRoot, check: true });
    expect((await runCli(sandbox, ["compile", "--check"])).exitCode).toBe(0);
    expect(await fileState(workspaceRoot)).toStrictEqual(before);
    await compileWorkspace({ workspaceRoot, check: false });
    const paths = getWorkspaceStatePaths(workspaceRoot);
    const output = JSON.parse(
      await readFile(join(paths.generatedProjectDataDirectory, "Map001.json"), "utf8"),
    );
    expect(output.events[1].pages[0].moveRoute.list).toStrictEqual([{ code: 0, parameters: [] }]);
    expect(
      JSON.parse(await readFile(join(paths.projectDataSnapshotDirectory, "Map001.json"), "utf8")),
    ).toStrictEqual(fixture.map);
    expect(
      JSON.parse(await readFile(join(workspaceRoot, "Game/data/Map001.json"), "utf8")),
    ).toStrictEqual(fixture.map);
  });
}, 30000);

it("rejects malformed native records, conflicting mirrors and saved route references before publishing any source", async () => {
  for (const variant of ["envelope", "parameters", "mirror", "route-reference"])
    await withWindowsSandbox(`command-boundary-reject-${variant}`, async (sandbox) => {
      const { workspaceRoot } = sandbox;
      await createMinimalProject(workspaceRoot);
      const route = {
        list: [{ code: 27, parameters: [1] }, { code: 0 }],
        repeat: false,
        skippable: false,
        wait: false,
      };
      const commands: unknown[] =
        variant === "envelope"
          ? [{ code: 999, indent: 0, parameters: [], extra: true }]
          : variant === "parameters"
            ? [{ code: 230, indent: 0, parameters: [null] }]
            : [
                { code: 205, indent: 0, parameters: [-1, route] },
                {
                  code: 505,
                  indent: 0,
                  parameters: [{ code: 27, parameters: [variant === "mirror" ? 2 : 1] }],
                },
              ];
      await writeFile(
        join(workspaceRoot, "Game/data/CommonEvents.json"),
        writeStableJson([
          null,
          {
            id: 1,
            name: "Reject",
            trigger: 0,
            switchId: 1,
            list: [...commands, { code: 0, indent: 0, parameters: [] }],
          },
        ]),
      );
      await writeFile(
        join(workspaceRoot, "Game/data/System.json"),
        writeStableJson({
          switches: variant === "route-reference" ? [""] : ["", "One", "Two"],
          variables: [""],
        }),
      );
      await initWorkspace({ workspaceRoot, projectRoot: "./Game" });
      await cloneWorkspace({ workspaceRoot });
      const before = await fileState(workspaceRoot);
      const result = await runCli(sandbox, ["decompile"], { allowFailure: true });
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain(
        variant === "envelope"
          ? "MV-COMMAND-ENVELOPE"
          : variant === "parameters"
            ? "MV-E230-PARAMETER"
            : variant === "mirror"
              ? "MV-MOVEMENT-MIRROR"
              : "MV-MOVEMENT-REFERENCE",
      );
      expect(await fileState(workspaceRoot)).toStrictEqual(before);
    });
}, 30000);

it("collects own __proto__ named exports and aliases through real source Discovery", async () => {
  await withWindowsSandbox("command-boundary-exports", async (sandbox) => {
    const { workspaceRoot } = sandbox;
    await createMinimalProject(workspaceRoot);
    await initWorkspace({ workspaceRoot, projectRoot: "./Game" });
    await cloneWorkspace({ workspaceRoot });
    await mkdir(join(workspaceRoot, "src"), { recursive: true });
    const file = join(workspaceRoot, "src/proto.events.ts");
    const direct =
      'import { commonEvent } from "rpgmaker-event-dsl";\nexport const __proto__ = commonEvent({id:1,name:"Proto export",trigger:"none",commands:[]});\n';
    for (const source of [
      direct,
      direct.replace("export const __proto__ =", "const event =") +
        "export { event as __proto__ };\n",
    ]) {
      await writeFile(file, source);
      await compileWorkspace({ workspaceRoot, check: true });
      await compileWorkspace({ workspaceRoot, check: false });
      const common = JSON.parse(
        await readFile(
          join(
            getWorkspaceStatePaths(workspaceRoot).generatedProjectDataDirectory,
            "CommonEvents.json",
          ),
          "utf8",
        ),
      );
      expect(common).toStrictEqual([
        null,
        {
          id: 1,
          name: "Proto export",
          trigger: 0,
          switchId: 1,
          list: [{ code: 0, indent: 0, parameters: [] }],
        },
      ]);
    }
  });
}, 30000);

it("decompiles valid Common Event calls against the complete Snapshot owned candidate", async () => {
  await withWindowsSandbox("command-boundary-call", async (sandbox) => {
    const { workspaceRoot } = sandbox;
    await createMinimalProject(workspaceRoot);
    const expected = [
      null,
      {
        id: 1,
        name: "Caller",
        trigger: 0,
        switchId: 1,
        list: [
          { code: 117, indent: 0, parameters: [2] },
          { code: 0, indent: 0, parameters: [] },
        ],
      },
      {
        id: 2,
        name: "Callee",
        trigger: 0,
        switchId: 1,
        list: [{ code: 0, indent: 0, parameters: [] }],
      },
    ];
    await writeFile(join(workspaceRoot, "Game/data/CommonEvents.json"), writeStableJson(expected));
    await initWorkspace({ workspaceRoot, projectRoot: "./Game" });
    await cloneWorkspace({ workspaceRoot });
    await decompileWorkspace({ workspaceRoot });
    await compileWorkspace({ workspaceRoot, check: true });
    await compileWorkspace({ workspaceRoot, check: false });
    expect(
      JSON.parse(
        await readFile(
          join(
            getWorkspaceStatePaths(workspaceRoot).generatedProjectDataDirectory,
            "CommonEvents.json",
          ),
          "utf8",
        ),
      ),
    ).toStrictEqual(expected);
  });
}, 30000);
