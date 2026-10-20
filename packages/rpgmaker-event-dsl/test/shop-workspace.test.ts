import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import { renderJsonValue } from "../src/project-data/json-values.js";
import { discoverDefinitionFiles } from "../src/workspace/definitions.js";
import { getWorkspaceStatePaths } from "../src/workspace/state.js";
import { recordEvidence } from "./support/mv-evidence.js";
import { blankEvent, blankPage } from "./support/map-event-fixtures.js";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { createMinimalProject, withWindowsSandbox } from "./support/windows-sandbox.js";

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
  await readFile(new URL("./fixtures/mv-evidence/shop-cases.json", import.meta.url), "utf8"),
);
const battlePage = JSON.parse(
  await readFile(
    new URL("./fixtures/mv-evidence/troop-event-project.json", import.meta.url),
    "utf8",
  ),
).defaultPage;

async function tree(directory: string): Promise<unknown> {
  try {
    return Object.fromEntries(
      await Promise.all(
        (await readdir(directory, { withFileTypes: true }))
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(async (entry) => [
            entry.name,
            entry.isDirectory()
              ? await tree(join(directory, entry.name))
              : await readFile(join(directory, entry.name), "utf8"),
          ]),
      ),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}
async function state(workspaceRoot: string) {
  const paths = getWorkspaceStatePaths(workspaceRoot);
  return {
    project: await tree(join(workspaceRoot, "Game/data")),
    snapshot: await tree(paths.projectDataSnapshotDirectory),
    generated: await tree(paths.generatedProjectDataDirectory),
    source: await tree(join(workspaceRoot, "src")),
    pending: await tree(paths.pendingPushDirectory),
    descriptor: await readFile(join(workspaceRoot, "Game/Game.rpgproject"), "utf8"),
    manifest: await readFile(paths.syncManifestPath, "utf8"),
    config: await readFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8"),
    discovery: await discoverDefinitionFiles(workspaceRoot, discovery),
  };
}
async function prepare(workspaceRoot: string, malformed = false) {
  const { projectFiles } = await createMinimalProject(workspaceRoot);
  const files: Record<string, unknown> = structuredClone(projectFiles);
  files["Items.json"] = [null, { id: 1, name: "Potion", external: true }];
  files["Weapons.json"] = [null, null, { id: 2, name: "Sword" }];
  files["Armors.json"] = [null, null, null, { id: 3, name: "Armor" }];
  files["MapInfos.json"] = [null, { id: 1, name: "Shop map" }];
  files["Tilesets.json"] = [null, { id: 1, name: "Field" }];
  files["Map001.json"] = {
    width: 17,
    height: 13,
    tilesetId: 1,
    external: [null, [], "keep"],
    events: [
      null,
      {
        ...structuredClone(blankEvent),
        pages: [{ ...structuredClone(blankPage), list: structuredClone(fixture.list) }],
      },
    ],
  };
  files["CommonEvents.json"] = [
    null,
    { id: 1, name: "Shop fixture", trigger: 0, switchId: 1, list: structuredClone(fixture.list) },
  ];
  const troop = {
    id: 1,
    name: "External troop",
    members: [],
    external: { keep: true },
    pages: [{ ...structuredClone(battlePage), list: structuredClone(fixture.list) }],
  };
  files["Troops.json"] = [null, troop];
  if (malformed)
    troop.pages[0]!.list.splice(-1, 0, {
      code: 302,
      indent: 0,
      parameters: [1, 0, 0, 0, false],
    });
  for (const [name, value] of Object.entries(files))
    await writeFile(join(workspaceRoot, "Game/data", name), renderJsonValue(value));
  await initWorkspace({ workspaceRoot, projectRoot: "./Game" });
  await cloneWorkspace({ workspaceRoot });
  return files;
}
async function evidence(id: string, operation: (workspaceRoot: string) => Promise<void>) {
  await withWindowsSandbox("shop-" + id, async ({ workspaceRoot }) => {
    const startedAt = new Date().toISOString();
    let failure: unknown;
    try {
      await operation(workspaceRoot);
    } catch (error) {
      failure = error;
      throw error;
    } finally {
      await recordEvidence({
        requirementId: `MV-S6-SHOP-${id}`,
        startedAt,
        stages: [
          "Windows Node22 actual public Workspace, source Discovery/evaluation and complete data/state assertions",
        ],
        expected:
          "Independent complete native Shop records and complete carrier equality; exact prepublication refusal with unchanged business files",
        actual: { workspaceRoot, ...(failure === undefined ? { verified: true } : {}) },
        ...(failure === undefined ? {} : { error: failure }),
      });
    }
  });
}

it("MV-S6-SHOP-001: evaluates Shop source in three containers and installs complete independent carriers", async () => {
  await evidence("001", async (workspaceRoot) => {
    const expected = await prepare(workspaceRoot);
    await decompileWorkspace({ workspaceRoot });
    const before = await state(workspaceRoot);
    await compileWorkspace({ workspaceRoot, check: true });
    expect(await state(workspaceRoot)).toStrictEqual(before);
    await compileWorkspace({ workspaceRoot, check: false });
    const paths = getWorkspaceStatePaths(workspaceRoot);
    for (const name of ["Map001.json", "CommonEvents.json", "Troops.json", "System.json"])
      expect(
        JSON.parse(await readFile(join(paths.generatedProjectDataDirectory, name), "utf8")),
      ).toStrictEqual(expected[name]);
    expect(await diffWorkspace({ workspaceRoot })).toContain(
      "Affected Project Data Files:\n- none",
    );
    const sourcePath = join(workspaceRoot, "src/decompiled/common-events.events.ts");
    const source = await readFile(sourcePath, "utf8");
    expect(source).not.toContain("rawDslCommand");
    await writeFile(sourcePath, source.replace("Shop fixture", "Shop source evaluated"));
    (expected["CommonEvents.json"] as { name: string }[])[1]!.name = "Shop source evaluated";
    await compileWorkspace({ workspaceRoot, check: false });
    expect(await diffWorkspace({ workspaceRoot })).toContain("CommonEvents.json");
    await pushWorkspace({ workspaceRoot, allowDestructive: false });
    for (const [name, value] of Object.entries(expected)) {
      expect(
        JSON.parse(await readFile(join(workspaceRoot, "Game/data", name), "utf8")),
      ).toStrictEqual(value);
      expect(
        JSON.parse(await readFile(join(paths.projectDataSnapshotDirectory, name), "utf8")),
      ).toStrictEqual(value);
    }
  });
});

it.each([
  [0, 2],
  [1, 1],
  [2, 2],
])(
  "MV-S6-SHOP-004: refuses missing category-specific native references (%i/%i)",
  async (category, id) => {
    await evidence("004", async (workspaceRoot) => {
      await prepare(workspaceRoot);
      const path = join(workspaceRoot, "Game/data/Troops.json");
      const troops = JSON.parse(await readFile(path, "utf8"));
      troops[1].pages[0].list.splice(-1, 0, {
        code: 302,
        indent: 0,
        parameters: [category, id, 0, 0, false],
      });
      await writeFile(path, renderJsonValue(troops));
      await cloneWorkspace({ workspaceRoot });
      const before = await state(workspaceRoot);
      await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(/parameters\[1\]/u);
      expect(await state(workspaceRoot)).toStrictEqual(before);
    });
  },
);

it("MV-S6-SHOP-002: refuses evaluated spread placeholder inputs without publishing business state", async () => {
  await evidence("002", async (workspaceRoot) => {
    await prepare(workspaceRoot);
    await decompileWorkspace({ workspaceRoot });
    await compileWorkspace({ workspaceRoot, check: false });
    const sourcePath = join(workspaceRoot, "src/decompiled/common-events.events.ts");
    const source = await readFile(sourcePath, "utf8");
    expect(source).toContain("goods: []");
    await writeFile(
      sourcePath,
      'const invalidGoods = { kind: "placeholder", price: 0 };\n' +
        source.replace("goods: []", "goods: [{ ...invalidGoods } as any]"),
    );
    const before = await state(workspaceRoot);
    for (const check of [true, false])
      await expect(compileWorkspace({ workspaceRoot, check })).rejects.toThrow(/MV-DSL-SHAPE/u);
    await expect(diffWorkspace({ workspaceRoot })).rejects.toThrow();
    await expect(pushWorkspace({ workspaceRoot, allowDestructive: false })).rejects.toThrow();
    expect(await state(workspaceRoot)).toStrictEqual(before);
  });
});

it("MV-S6-SHOP-003: refuses late malformed native zero identities before any source publication", async () => {
  await evidence("003", async (workspaceRoot) => {
    await prepare(workspaceRoot, true);
    const before = await state(workspaceRoot);
    await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(
      /MV-E302-PARAMETERS.*troop:1|troop:1.*MV-E302-PARAMETERS/u,
    );
    expect(await state(workspaceRoot)).toStrictEqual(before);
  });
});
