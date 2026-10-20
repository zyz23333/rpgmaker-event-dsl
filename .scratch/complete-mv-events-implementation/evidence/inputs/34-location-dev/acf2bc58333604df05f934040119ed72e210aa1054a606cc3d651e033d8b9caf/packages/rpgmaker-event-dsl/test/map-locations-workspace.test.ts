import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
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
import {
  createMinimalProject,
  withWindowsSandbox,
  type WindowsSandbox,
} from "./support/windows-sandbox.js";
import { recordEvidence } from "./support/mv-evidence.js";
import { blankPage } from "./support/map-event-fixtures.js";
import { locationRecords } from "./support/map-location-fixtures.js";

const discovery = {
  sourceRoot: "src",
  sourceInclude: ["**/*.events.ts", "**/*.dsl.ts"],
  sourceExclude: [],
};
async function data(directory: string): Promise<Record<string, string>> {
  return Object.fromEntries(
    await Promise.all(
      (await readdir(directory))
        .sort()
        .map(async (name) => [name, await readFile(join(directory, name), "utf8")] as const),
    ),
  );
}
async function state(workspaceRoot: string) {
  const paths = getWorkspaceStatePaths(workspaceRoot);
  const files = await discoverDefinitionFiles(workspaceRoot, discovery);
  return {
    project: await data(join(workspaceRoot, "Game/data")),
    snapshot: await data(paths.projectDataSnapshotDirectory),
    generated: await data(paths.generatedProjectDataDirectory).catch((error: unknown) => {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT")
        return null;
      throw error;
    }),
    manifest: await readFile(paths.syncManifestPath, "utf8"),
    files,
    sources: await Promise.all(files.map((path) => readFile(path, "utf8"))),
  };
}
async function withLocationEvidence(
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
        requirementId: id,
        startedAt,
        stages: [
          "Actual source Workspace API, Discovery and evaluation, independent numeric saved slots, complete emitted carriers or complete rejection state",
        ],
        expected:
          "Assertions compare independent native slots and all affected business state; no editor or game execution is claimed.",
        actual: { state: await state(sandbox.workspaceRoot), native: "not-executed" },
        ...(failure === undefined ? {} : { error: failure }),
      });
    }
  });
}
async function prepare(workspaceRoot: string) {
  const fixture = await createMinimalProject(workspaceRoot);
  const expected: Record<string, unknown> = structuredClone(fixture.projectFiles);
  expected["CommonEvents.json"] = [
    null,
    { id: 1, name: "Location matrix", trigger: 0, switchId: 1, list: locationRecords },
  ];
  expected["System.json"] = {
    ...fixture.projectFiles["System.json"],
    variables: ["", "Map source", "X source", ""],
  };
  expected["MapInfos.json"] = [null, { id: 1, name: "Location map" }];
  expected["Map001.json"] = {
    width: 4,
    height: 3,
    tilesetId: 1,
    opaque: { preserved: [null, "carrier"] },
    events: [
      null,
      {
        id: 1,
        name: "Map locations",
        note: "",
        x: 0,
        y: 0,
        pages: [{ ...blankPage, list: locationRecords }],
      },
    ],
  };
  for (const [name, value] of Object.entries(expected))
    await writeFile(join(workspaceRoot, "Game/data", name), JSON.stringify(value));
  await initWorkspace({ workspaceRoot, projectRoot: "./Game" });
  await cloneWorkspace({ workspaceRoot });
  return expected;
}

it("round trips all Location modes through actual discovered sources, Check, Compile, Diff and real Push with all fifteen carriers", async () => {
  await withLocationEvidence(
    "MV-S6-LOCATION-001",
    "location-roundtrip",
    async ({ workspaceRoot }) => {
      const expected = await prepare(workspaceRoot);
      const paths = getWorkspaceStatePaths(workspaceRoot);
      await decompileWorkspace({ workspaceRoot });
      const files = await discoverDefinitionFiles(workspaceRoot, discovery);
      const declarations = (
        await Promise.all(files.map((file) => loadDefinitionFile(file)))
      ).flat();
      expect(declarations.filter((value) => value.kind === "commonEvent")).toHaveLength(1);
      expect(declarations.filter((value) => value.kind === "mapEvent")).toHaveLength(1);
      const sourcePath = join(workspaceRoot, "src/decompiled/common-events.events.ts");
      const source = await readFile(sourcePath, "utf8");
      expect(source).not.toContain("rawDslCommand");
      expect(source).toContain('direction: "up"');
      expect(source).toContain('fade: "white"');
      expect(source).toContain('info: "tileLayer4"');
      const beforeCheck = await state(workspaceRoot);
      await compileWorkspace({ workspaceRoot, check: true });
      expect(await state(workspaceRoot)).toStrictEqual(beforeCheck);
      await compileWorkspace({ workspaceRoot, check: false });
      const generated = await data(paths.generatedProjectDataDirectory);
      expect(
        Object.fromEntries(
          Object.entries(generated).map(([name, text]) => [name, JSON.parse(text)]),
        ),
      ).toStrictEqual({
        "CommonEvents.json": expected["CommonEvents.json"],
        "System.json": expected["System.json"],
        "Troops.json": expected["Troops.json"],
        "Map001.json": expected["Map001.json"],
      });
      await writeFile(
        sourcePath,
        source.replace('name: "Location matrix"', 'name: "Location evaluated"'),
      );
      await compileWorkspace({ workspaceRoot, check: false });
      const difference = await diffWorkspace({ workspaceRoot });
      expect(difference).toContain("[changed] commonEventId 1");
      expect(
        JSON.parse(
          await readFile(join(paths.generatedProjectDataDirectory, "CommonEvents.json"), "utf8"),
        )[1].name,
      ).toBe("Location evaluated");
      (expected["CommonEvents.json"] as Array<null | { name: string }>)[1]!.name =
        "Location evaluated";
      await pushWorkspace({ workspaceRoot, allowDestructive: false });
      expect(
        Object.fromEntries(
          Object.entries(await data(join(workspaceRoot, "Game/data"))).map(([name, text]) => [
            name,
            JSON.parse(text),
          ]),
        ),
      ).toStrictEqual(expected);
    },
  );
}, 30_000);

it("rejects actual untyped Location sources at Check, Compile and Push without changing complete business state", async () => {
  await withLocationEvidence(
    "MV-S6-LOCATION-002",
    "location-source-refusal",
    async ({ workspaceRoot }) => {
      await prepare(workspaceRoot);
      await decompileWorkspace({ workspaceRoot });
      await compileWorkspace({ workspaceRoot, check: false });
      const sourcePath = join(workspaceRoot, "src/decompiled/common-events.events.ts");
      const original = await readFile(sourcePath, "utf8");
      for (const [code, helper, fields] of [
        [201, "transferPlayer", 'destination:{kind:"direct",map:mapRef({id:1}),x:0,y:0}'],
        [
          202,
          "setVehicleLocation",
          'vehicle:"boat",destination:{kind:"direct",map:mapRef({id:1}),x:0,y:0}',
        ],
        [
          203,
          "setEventLocation",
          'target:{kind:"runtimeSelector",scope:"character",target:"currentEvent"},destination:{kind:"direct",x:0,y:0}',
        ],
        [
          285,
          "getLocationInfo",
          'variable:variableRef({id:3}),info:"terrainTag",location:{kind:"direct",x:0,y:0}',
        ],
      ] as const)
        for (const direct of [false, true]) {
          const expression = direct
            ? `({kind:"${helper}",${fields},...extraFields} as any)`
            : `${helper}({${fields},...extraFields} as any)`;
          const invalid =
            "const extraFields={extra:true} as const;\n" +
            original.replace("commands: [", `commands: [${expression},`);
          await writeFile(sourcePath, invalid);
          const before = await state(workspaceRoot);
          await expect(compileWorkspace({ workspaceRoot, check: true })).rejects.toThrow(
            new RegExp(`MV-E${code}`),
          );
          await expect(compileWorkspace({ workspaceRoot, check: false })).rejects.toThrow(
            new RegExp(`MV-E${code}`),
          );
          await expect(pushWorkspace({ workspaceRoot, allowDestructive: false })).rejects.toThrow();
          expect(await state(workspaceRoot)).toStrictEqual(before);
        }
    },
  );
}, 30_000);

it("refuses native Location coordinate and unsupported exchange states before source publication while retaining every carrier", async () => {
  await withLocationEvidence(
    "MV-S6-LOCATION-003",
    "location-native-refusal",
    async ({ workspaceRoot }) => {
      const expected = await prepare(workspaceRoot);
      await mkdir(join(workspaceRoot, "src"), { recursive: true });
      await writeFile(
        join(workspaceRoot, "src/retained.events.ts"),
        'import { commonEvent } from "rpgmaker-event-dsl";\nexport const retained=commonEvent({id:2,name:"Retained source",trigger:"none",commands:[]});\n',
      );
      await compileWorkspace({ workspaceRoot, check: false });
      for (const [literal, diagnostic] of [
        [
          '[{"code":201,"indent":0,"parameters":[0,1,-0,0,0,0]},{"code":0,"indent":0,"parameters":[]}]',
          /parameters\[2\].*-0/,
        ],
        [
          '[{"code":203,"indent":0,"parameters":[0,2,99,42,0]},{"code":0,"indent":0,"parameters":[]}]',
          /MV-E203-UNSUPPORTED.*parameters\[3\]/,
        ],
      ] as const) {
        const event = structuredClone(expected["CommonEvents.json"]) as Array<null | {
          list: unknown;
        }>;
        event[1]!.list = [];
        const bytes = JSON.stringify(event).replace('"list":[]', `"list":${literal}`);
        await writeFile(join(workspaceRoot, "Game/data/CommonEvents.json"), bytes);
        await cloneWorkspace({ workspaceRoot });
        const before = await state(workspaceRoot);
        await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(diagnostic);
        expect(await state(workspaceRoot)).toStrictEqual(before);
      }
    },
  );
}, 30_000);
