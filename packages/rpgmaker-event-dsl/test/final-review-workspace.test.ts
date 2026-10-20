import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";

import { discoverDefinitionFiles } from "../src/workspace/definitions.js";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { blankEvent } from "./support/map-event-fixtures.js";
import { createMinimalProject, withWindowsSandbox, runCli } from "./support/windows-sandbox.js";

const api: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const discovery = {
  sourceRoot: "src",
  sourceInclude: ["**/*.events.ts", "**/*.dsl.ts"],
  sourceExclude: [],
};

async function tree(root: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const entry of await readdir(root, { withFileTypes: true }).catch(() => [])) {
    if (entry.name === "operation.lock") continue;
    const file = join(root, entry.name);
    if (entry.isDirectory())
      for (const [name, value] of Object.entries(await tree(file)))
        result[entry.name + "/" + name] = value;
    else result[entry.name] = (await readFile(file)).toString("hex");
  }
  return result;
}

async function observe(workspaceRoot: string) {
  return {
    source: await tree(join(workspaceRoot, "src")),
    project: await tree(join(workspaceRoot, "Game")),
    state: await tree(join(workspaceRoot, ".rpgmaker-event-dsl")),
    config: await readFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8"),
    discovery: await discoverDefinitionFiles(workspaceRoot, discovery),
  };
}

async function prepare(workspaceRoot: string) {
  await createMinimalProject(workspaceRoot);
  await writeFile(
    join(workspaceRoot, "Game/data/MapInfos.json"),
    JSON.stringify([null, { id: 1, name: "Map" }]),
  );
  await writeFile(
    join(workspaceRoot, "Game/data/Map001.json"),
    JSON.stringify({
      width: 17,
      height: 13,
      tilesetId: 1,
      events: [null, blankEvent],
      retained: { opaque: true },
    }),
  );
  await api.initWorkspace({ workspaceRoot, projectRoot: "./Game" });
  await api.cloneWorkspace({ workspaceRoot });
  await api.decompileWorkspace({ workspaceRoot });
}

it("shows both directions of signed-zero saved Map values in the public Workspace Diff", async () => {
  await withWindowsSandbox("final-review-signed-diff", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    const source = join(workspaceRoot, "src/decompiled/maps/Map001.events.ts");
    const original = await readFile(source, "utf8");
    await writeFile(
      source,
      original.replace("commands: [", "image: { characterIndex: -0 }, commands: ["),
    );
    await api.compileWorkspace({ workspaceRoot, check: false });
    expect(await api.diffWorkspace({ workspaceRoot })).toContain(
      "pages[0].image.characterIndex (page 1): 0 -> -0",
    );
    await api.pushWorkspace({ workspaceRoot, allowDestructive: false });
    await writeFile(source, original);
    await api.compileWorkspace({ workspaceRoot, check: false });
    expect(await api.diffWorkspace({ workspaceRoot })).toContain(
      "pages[0].image.characterIndex (page 1): -0 -> 0",
    );
  });
}, 30_000);

for (const [name, body] of [
  [
    "mapEvent",
    'const input = { mapId: 1, id: 1, name: "Bad", x: 0, y: 0, pages: [page({ commands: [] })] as const, kind: "unexpected-input-field" }; export const bad = mapEvent(input);',
  ],
  [
    "troopEvent",
    'const input = { troopId: 1, pages: [battlePage({ commands: [] })] as const, kind: "unexpected-input-field" }; export const bad = troopEvent(input);',
  ],
  [
    "page",
    'const input = { commands: [], kind: "unexpected-input-field" }; export const bad = mapEvent({ mapId: 1, id: 1, name: "Bad", x: 0, y: 0, pages: [page(input)] });',
  ],
  [
    "battlePage",
    'const input = { commands: [], kind: "unexpected-input-field" }; export const bad = troopEvent({ troopId: 1, pages: [battlePage(input)] });',
  ],
])
  it(`rejects source-local const extra kind at ${name} without Check Compile or stale Push writes`, async () => {
    await withWindowsSandbox(`final-review-${name}-source`, async (sandbox) => {
      const { workspaceRoot } = sandbox;
      await prepare(workspaceRoot);
      await api.compileWorkspace({ ...sandbox, check: false });
      const source = join(workspaceRoot, "src/decompiled/maps/Map001.events.ts");
      await writeFile(
        source,
        'import { battlePage, troopEvent, mapEvent, page } from "rpgmaker-event-dsl";\n' +
          body +
          "\n",
      );
      const before = await observe(workspaceRoot);
      await expect(api.compileWorkspace({ ...sandbox, check: true })).rejects.toThrow(
        "MV-DSL-SHAPE",
      );
      expect(await observe(workspaceRoot)).toEqual(before);
      await expect(api.compileWorkspace({ ...sandbox, check: false })).rejects.toThrow(
        "MV-DSL-SHAPE",
      );
      expect(await observe(workspaceRoot)).toEqual(before);
      await expect(api.pushWorkspace({ ...sandbox, allowDestructive: false })).rejects.toThrow(
        /stale/i,
      );
      expect(await observe(workspaceRoot)).toEqual(before);
    });
  }, 30_000);

it("keeps an explicit old /23 contract stale until a normal current /24 Compile", async () => {
  await withWindowsSandbox("final-review-contract-24", async (sandbox) => {
    const { workspaceRoot } = sandbox;
    await prepare(workspaceRoot);
    await api.compileWorkspace({ ...sandbox, check: false });
    const manifestPath = join(workspaceRoot, ".rpgmaker-event-dsl/sync-manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    expect(manifest.compileBaseline.compileContractVersion).toBe("mv-1.6.1/24");
    manifest.compileBaseline.compileContractVersion = "mv-1.6.1/23";
    await writeFile(manifestPath, JSON.stringify(manifest));
    const before = await observe(workspaceRoot);
    expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(false);
    await expect(api.diffWorkspace(sandbox)).rejects.toThrow(/stale/i);
    await expect(api.pushWorkspace({ ...sandbox, allowDestructive: false })).rejects.toThrow(
      /stale/i,
    );
    expect(await observe(workspaceRoot)).toEqual(before);
    await api.compileWorkspace({ ...sandbox, check: true });
    expect(await observe(workspaceRoot)).toEqual(before);
    expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(false);
    await api.compileWorkspace({ ...sandbox, check: false });
    expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(true);
  });
}, 30_000);

it("prints identifiable page-count warnings on default stderr while preserving valid three-container output", async () => {
  await withWindowsSandbox("final-review-page-count", async (sandbox) => {
    const { workspaceRoot } = sandbox;
    await createMinimalProject(workspaceRoot);
    const events = [
      null,
      {
        ...blankEvent,
        name: "Shared",
        pages: Array.from({ length: 21 }, () => blankEvent.pages[0]),
      },
      {
        ...blankEvent,
        id: 2,
        name: "Shared",
        x: 1,
        pages: Array.from({ length: 21 }, () => blankEvent.pages[0]),
      },
    ];
    await writeFile(
      join(workspaceRoot, "Game/data/MapInfos.json"),
      JSON.stringify([null, { id: 1, name: "Map" }]),
    );
    await writeFile(
      join(workspaceRoot, "Game/data/Map001.json"),
      JSON.stringify({ width: 17, height: 13, tilesetId: 1, events }),
    );
    const battle = {
      conditions: {
        actorHp: 50,
        actorId: 1,
        actorValid: false,
        enemyHp: 50,
        enemyIndex: 0,
        enemyValid: false,
        switchId: 1,
        switchValid: false,
        turnA: 0,
        turnB: 0,
        turnEnding: false,
        turnValid: false,
      },
      span: 0,
      list: [{ code: 0, indent: 0, parameters: [] }],
    };
    await writeFile(
      join(workspaceRoot, "Game/data/Troops.json"),
      JSON.stringify([
        null,
        {
          id: 1,
          name: "Shared",
          members: [],
          pages: Array.from({ length: 21 }, () => battle),
          retained: { opaque: true },
        },
      ]),
    );
    await api.initWorkspace({ workspaceRoot, projectRoot: "./Game" });
    await api.cloneWorkspace(sandbox);
    await api.decompileWorkspace(sandbox);
    const beforeCheck = await observe(workspaceRoot);
    const check = await runCli(sandbox, ["compile", "--check"]);
    expect(await observe(workspaceRoot)).toEqual(beforeCheck);
    const compile = await runCli(sandbox, ["compile"]);
    for (const result of [check, compile]) {
      expect(result.exitCode).toBe(0);
      for (const identity of ["map:1/event:1", "map:1/event:2", "troop:1"]) {
        const line = result.stderr.split("\n").find((line) => line.includes(identity));
        expect(line).toContain(
          identity === "troop:1" ? "MV-BATTLE-PAGE-COUNT" : "MV-MAP-PAGE-COUNT",
        );
        expect(line).toContain("compile warning");
        expect(line).toContain("pages");
        expect(line).toContain("expected at most 20");
        expect(line).toContain("actual 21");
      }
    }
    const generated = join(workspaceRoot, ".rpgmaker-event-dsl/generated-project-data");
    const generatedNames = await readdir(generated);
    const names = await readdir(join(workspaceRoot, "Game/data"));
    expect(names).toHaveLength(15);
    for (const name of names) {
      const before = JSON.parse(await readFile(join(workspaceRoot, "Game/data", name), "utf8"));
      const after = JSON.parse(
        await readFile(
          join(generatedNames.includes(name) ? generated : join(workspaceRoot, "Game/data"), name),
          "utf8",
        ),
      );
      expect(after).toStrictEqual(before);
    }
  });
}, 30_000);
