import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { createMinimalProject, withWindowsSandbox } from "./support/windows-sandbox.js";
import { blankEvent, blankPage } from "./support/map-event-fixtures.js";
import { discoverDefinitionFiles, loadDefinitionFile } from "../src/workspace/definitions.js";
import { renderJsonValue } from "../src/project-data/json-values.js";
import { getWorkspaceStatePaths } from "../src/workspace/state.js";

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
const fixture = JSON.parse(
  await readFile(
    new URL("./fixtures/mv-evidence/actor-presentation-cases.json", import.meta.url),
    "utf8",
  ),
);
const defaultBattlePage = JSON.parse(
  await readFile(
    new URL("./fixtures/mv-evidence/troop-event-project.json", import.meta.url),
    "utf8",
  ),
).defaultPage;

async function prepare(workspaceRoot: string, commands = fixture.commands, threeContainers = true) {
  const { projectFiles } = await createMinimalProject(workspaceRoot);
  const files: Record<string, unknown> = structuredClone(projectFiles);
  files["Actors.json"] = [
    null,
    { id: 1, name: "Mira", classId: 1, external: [null, "keep"] },
    { id: 2, name: "Noah", classId: 2 },
  ];
  files["CommonEvents.json"] = [
    null,
    {
      id: 1,
      name: "Actor presentation",
      trigger: 0,
      switchId: 1,
      list: structuredClone(commands),
    },
  ];
  if (threeContainers) {
    files["MapInfos.json"] = [null, { id: 1, name: "Presentation map" }];
    files["Tilesets.json"] = [null, { id: 1, name: "Field" }];
    files["Map001.json"] = {
      width: 17,
      height: 13,
      tilesetId: 1,
      external: "retain",
      events: [
        null,
        {
          ...structuredClone(blankEvent),
          pages: [{ ...structuredClone(blankPage), list: structuredClone(commands) }],
        },
      ],
    };
    files["Troops.json"] = [
      null,
      {
        id: 1,
        name: "External troop",
        members: [],
        external: true,
        pages: [{ ...structuredClone(defaultBattlePage), list: structuredClone(commands) }],
      },
    ];
  }
  for (const [name, value] of Object.entries(files))
    await writeFile(join(workspaceRoot, "Game/data", name), renderJsonValue(value));
  await initWorkspace({ workspaceRoot, projectRoot: "./Game" });
  await cloneWorkspace({ workspaceRoot });
  return files;
}

async function tree(path: string): Promise<unknown> {
  try {
    return Object.fromEntries(
      await Promise.all(
        (await readdir(path, { withFileTypes: true }))
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(async (entry) => [
            entry.name,
            entry.isDirectory()
              ? await tree(join(path, entry.name))
              : await readFile(join(path, entry.name), "utf8"),
          ]),
      ),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}
async function data(path: string): Promise<Record<string, unknown>> {
  const files = (await tree(path)) as Record<string, string>;
  return Object.fromEntries(
    Object.entries(files).map(([name, value]) => [name, JSON.parse(value)]),
  );
}
async function state(workspaceRoot: string) {
  const paths = getWorkspaceStatePaths(workspaceRoot);
  return {
    project: await tree(join(workspaceRoot, "Game/data")),
    snapshot: await tree(paths.projectDataSnapshotDirectory),
    generated: await tree(paths.generatedProjectDataDirectory),
    source: await tree(join(workspaceRoot, "src")),
    manifest: await readFile(paths.syncManifestPath, "utf8"),
    pending: await tree(paths.pendingPushDirectory),
    config: await readFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8"),
    descriptor: await readFile(join(workspaceRoot, "Game/Game.rpgproject"), "utf8"),
    discovery: await discoverDefinitionFiles(workspaceRoot, discovery),
  };
}

it("MV-S6-ACTOR-PRESENTATION-001: evaluates all three containers and preserves complete carriers through Check and edited Push", async () => {
  await withWindowsSandbox("actor-presentation-roundtrip", async ({ workspaceRoot }) => {
    const expected = await prepare(workspaceRoot);
    await decompileWorkspace({ workspaceRoot });
    const sources = await discoverDefinitionFiles(workspaceRoot, discovery);
    const declarations = (
      await Promise.all(sources.map((file) => loadDefinitionFile(file)))
    ).flat();
    expect(
      declarations.filter((value) =>
        ["commonEvent", "mapEvent", "troopEvent"].includes(value.kind),
      ),
    ).toHaveLength(3);
    const file = join(workspaceRoot, "src/decompiled/common-events.events.ts");
    const source = await readFile(file, "utf8");
    expect(source).not.toContain("rawDslCommand");
    expect(source).toContain("face: { image: null, index: 2147483647 }");
    expect(source).toContain('vehicle: "airship"');
    expect(source).toContain("index: -0");
    const before = await state(workspaceRoot);
    await compileWorkspace({ workspaceRoot, check: true });
    expect(await state(workspaceRoot)).toStrictEqual(before);
    await compileWorkspace({ workspaceRoot, check: false });
    const paths = getWorkspaceStatePaths(workspaceRoot);
    expect(await data(paths.generatedProjectDataDirectory)).toStrictEqual(
      Object.fromEntries(
        ["CommonEvents.json", "Map001.json", "System.json", "Troops.json"].map((name) => [
          name,
          expected[name],
        ]),
      ),
    );
    await writeFile(
      file,
      source
        .replace('name: "Actor presentation"', 'name: "Presentation edited"')
        .replace("maxCharacters: 1 }", "maxCharacters: 2 }"),
    );
    await compileWorkspace({ workspaceRoot, check: false });
    expect(await diffWorkspace({ workspaceRoot })).toContain("[changed] commonEventId 1");
    const event = (
      expected["CommonEvents.json"] as Array<null | {
        name: string;
        list: Array<{ parameters: unknown[] }>;
      }>
    )[1]!;
    event.name = "Presentation edited";
    event.list[0]!.parameters[1] = 2;
    const beforePush = await state(workspaceRoot);
    await pushWorkspace({ workspaceRoot, allowDestructive: false });
    expect(Object.keys(await data(join(workspaceRoot, "Game/data")))).toHaveLength(15);
    expect(await data(join(workspaceRoot, "Game/data"))).toStrictEqual(expected);
    expect(await data(paths.projectDataSnapshotDirectory)).toStrictEqual(expected);
    const after = await state(workspaceRoot);
    expect(after.source).toStrictEqual(beforePush.source);
    expect(after.discovery).toStrictEqual(beforePush.discovery);
    expect(after.pending).toBeNull();
  });
});

it("MV-S6-ACTOR-PRESENTATION-002: original helper and forged source fail without publishing or permitting stale Push", async () => {
  await withWindowsSandbox("actor-presentation-source-refusal", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    await decompileWorkspace({ workspaceRoot });
    await compileWorkspace({ workspaceRoot, check: false });
    for (const expression of [
      'changeName({actor:actorRef({id:1}),name:"",extra:true} as never)',
      '{kind:"changeActorImages",actor:actorRef({id:1}),character:{image:null,index:7},face:{image:null,index:2147483648},battler:null}',
    ]) {
      await writeFile(
        join(workspaceRoot, "src/decompiled/common-events.events.ts"),
        `import {commonEvent,actorRef,changeName} from "rpgmaker-event-dsl";\nexport const invalid=commonEvent({id:1,name:"Bad",trigger:"none",commands:[${expression}]});\n`,
      );
      const before = await state(workspaceRoot);
      for (const check of [true, false]) {
        await expect(compileWorkspace({ workspaceRoot, check })).rejects.toThrow(
          /MV-(?:DSL-SHAPE|E322-INPUT)/u,
        );
        expect(await state(workspaceRoot)).toStrictEqual(before);
      }
      await expect(pushWorkspace({ workspaceRoot, allowDestructive: false })).rejects.toThrow(
        /fresh|stale|compile|changed|baseline/iu,
      );
      expect(await state(workspaceRoot)).toStrictEqual(before);
    }
  });
});

it("MV-S6-ACTOR-PRESENTATION-003: late native image index fails before exposing any source", async () => {
  await withWindowsSandbox("actor-presentation-native-refusal", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot, [
      ...fixture.commands.slice(0, -1),
      { code: 322, indent: 0, parameters: [1, "", 0, "", 2147483648, ""] },
      { code: 0, indent: 0, parameters: [] },
    ]);
    const before = await state(workspaceRoot);
    await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(
      /MV-E322-PARAMETERS.*parameters\[4\]/u,
    );
    expect(await state(workspaceRoot)).toStrictEqual(before);
  });
});
