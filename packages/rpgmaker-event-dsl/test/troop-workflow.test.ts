import { verifyTroopEvidence } from "./support/troop-evidence.js";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { createMinimalProject } from "./support/windows-sandbox.js";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { getWorkspaceStatePaths } from "../src/workspace/state.js";

const {
  cloneWorkspace,
  compileWorkspace,
  decompileWorkspace,
  diffWorkspace,
  pushWorkspace,
  pullWorkspace,
}: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);

// Independent complete native literal; never obtained from the product compiler.
const defaultPage = {
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
  list: [{ code: 0, indent: 0, parameters: [] as unknown[] }],
};
const savedPage = {
  ...structuredClone(defaultPage),
  span: 1,
  conditions: {
    ...defaultPage.conditions,
    actorId: 0,
    enemyIndex: 8,
    enemyHp: 12,
    turnA: 8,
    switchId: 77,
  },
  list: [
    { code: 108, indent: 0, parameters: ["owned troop comment"] },
    { code: 0, indent: 0, parameters: [] },
  ],
};
async function fixture() {
  const workspaceRoot = await mkdtemp(join(tmpdir(), "mv25-troop-"));
  await createMinimalProject(workspaceRoot);
  await mkdir(join(workspaceRoot, "src"));
  await writeFile(
    join(workspaceRoot, "rpgmaker-event-dsl.config.json"),
    JSON.stringify({
      projectRoot: "./Game",
      scriptEnabled: false,
      sourceRoot: "src",
      sourceInclude: ["**/*.events.ts", "**/*.dsl.ts"],
      sourceExclude: ["**/*.test.ts", "**/*.spec.ts", "**/*.d.ts"],
    }),
  );
  const troops = [
    null,
    {
      id: 1,
      name: "",
      members: [],
      extraCarrier: { saved: [null, 3] },
      pages: [structuredClone(defaultPage)],
    },
    {
      id: 2,
      name: "External carrier",
      members: [{ enemyId: 999, x: 120, y: 240, hidden: true }],
      unknown: false,
      pages: [structuredClone(savedPage), structuredClone(defaultPage)],
    },
  ];
  await writeFile(join(workspaceRoot, "Game/data/Troops.json"), JSON.stringify(troops));
  await cloneWorkspace({ workspaceRoot });
  return { workspaceRoot, troops, paths: getWorkspaceStatePaths(workspaceRoot) };
}
async function json(path: string) {
  return JSON.parse(await readFile(path, "utf8"));
}

it("materializes every actual Troop carrier and resets omitted pages to the exact Blank", async () => {
  return verifyTroopEvidence("MV-S5-TROOP-WORKSPACE-001", async () => {
    const { workspaceRoot, troops, paths } = await fixture();
    await compileWorkspace({ workspaceRoot, check: true });
    await expect(readdir(paths.generatedProjectDataDirectory)).rejects.toThrow();
    await compileWorkspace({ workspaceRoot, check: false });
    expect((await readdir(paths.generatedProjectDataDirectory)).sort()).toEqual([
      "CommonEvents.json",
      "System.json",
      "Troops.json",
    ]);
    expect(await json(join(paths.generatedProjectDataDirectory, "Troops.json"))).toEqual(
      troops.map((troop) => (troop === null ? null : { ...troop, pages: [defaultPage] })),
    );
    expect(await json(join(workspaceRoot, "Game/data/Troops.json"))).toEqual(troops);

    return {
      expectedCarriers: troops,
      actualGenerated: await json(join(paths.generatedProjectDataDirectory, "Troops.json")),
      actualLive: await json(join(workspaceRoot, "Game/data/Troops.json")),
    };
  });
});

it("decompiles all actual Troops including Blank and roundtrips complete inactive state and page order", async () => {
  return verifyTroopEvidence("MV-S5-TROOP-WORKSPACE-002", async () => {
    const { workspaceRoot, troops, paths } = await fixture();
    await decompileWorkspace({ workspaceRoot });
    const source = await readFile(
      join(workspaceRoot, "src/decompiled/troop-events.events.ts"),
      "utf8",
    );
    expect(source).toContain("troopId: 1");
    expect(source).toContain("troopId: 2");
    expect(source).toContain("actorRef({ id: 0 })");
    expect(source).toContain("switchRef({ id: 77 })");
    expect(source).toContain("commands: [");
    await compileWorkspace({ workspaceRoot, check: false });
    expect(await json(join(paths.generatedProjectDataDirectory, "Troops.json"))).toEqual(troops);
    expect(await diffWorkspace({ workspaceRoot, short: true })).toContain("No changes.");

    return {
      source,
      expectedTroops: troops,
      actualGenerated: await json(join(paths.generatedProjectDataDirectory, "Troops.json")),
    };
  });
});

it("reports omission as Troop Event Reset in every Diff view and gates Push while retaining all carrier fields", async () => {
  return verifyTroopEvidence("MV-S5-TROOP-WORKSPACE-003", async () => {
    const { workspaceRoot, troops, paths } = await fixture();
    await decompileWorkspace({ workspaceRoot });
    await rm(join(workspaceRoot, "src/decompiled/troop-events.events.ts"));
    await compileWorkspace({ workspaceRoot, check: false });
    const full = await diffWorkspace({ workspaceRoot });
    expect(full).toContain("Troop Event Reset");
    expect(full).toContain("troopId 2");
    expect(full).toContain("page 1");
    expect(full).not.toContain("Carrier File\n- [changed]");
    for (const options of [
      { short: true },
      { file: "System.json" },
      { file: "Troops.json", short: true },
    ])
      expect(await diffWorkspace({ workspaceRoot, ...options })).toMatch(
        /Destructive Changes(?: Overall)?: yes/,
      );
    await expect(pushWorkspace({ workspaceRoot, allowDestructive: false })).rejects.toThrow(
      /destructive/i,
    );
    expect(await json(join(workspaceRoot, "Game/data/Troops.json"))).toEqual(troops);
    await pushWorkspace({ workspaceRoot, allowDestructive: true });
    const expected = troops.map((troop) =>
      troop === null ? null : { ...troop, pages: [defaultPage] },
    );
    expect(await json(join(workspaceRoot, "Game/data/Troops.json"))).toEqual(expected);
    expect(await json(join(paths.projectDataSnapshotDirectory, "Troops.json"))).toEqual(expected);
    expect(await diffWorkspace({ workspaceRoot })).toContain("Destructive Changes: no");

    return {
      fullDiff: full,
      expected,
      actualLive: await json(join(workspaceRoot, "Game/data/Troops.json")),
      actualSnapshot: await json(join(paths.projectDataSnapshotDirectory, "Troops.json")),
    };
  });
});

it("rejects an existing Troop source identity before publishing Decompile", async () => {
  return verifyTroopEvidence("MV-S5-TROOP-WORKSPACE-004", async () => {
    const { workspaceRoot, paths } = await fixture();
    const source =
      'import { troopEvent } from "rpgmaker-event-dsl";\nexport const existing = troopEvent({ troopId: 2, pages: unknownCommands() });\n';
    await writeFile(join(workspaceRoot, "src/existing.events.ts"), source);
    const manifest = await readFile(paths.syncManifestPath);
    await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(
      /MV-DECOMPILE-IDENTITY.*troopEvent:2/s,
    );
    await expect(readdir(join(workspaceRoot, "src/decompiled"))).rejects.toThrow();
    expect(await readFile(paths.syncManifestPath)).toEqual(manifest);
    expect(await readFile(join(workspaceRoot, "src/existing.events.ts"), "utf8")).toBe(source);

    return {
      source,
      actualManifestHex: (await readFile(paths.syncManifestPath)).toString("hex"),
      remainingSource: await readdir(join(workspaceRoot, "src")),
    };
  });
});

it.each([
  [
    "missing page list",
    (page: Record<string, unknown>) => {
      delete page.list;
    },
  ],
  [
    "extra page field",
    (page: Record<string, unknown>) => {
      page.raw = 1;
    },
  ],
  [
    "extra condition field",
    (page: Record<string, unknown>) => {
      (page.conditions as Record<string, unknown>).future = false;
    },
  ],
  [
    "missing condition field",
    (page: Record<string, unknown>) => {
      delete (page.conditions as Record<string, unknown>).turnA;
    },
  ],
  [
    "inactive invalid HP",
    (page: Record<string, unknown>) => {
      (page.conditions as Record<string, unknown>).actorHp = 101;
    },
  ],
  [
    "invalid span",
    (page: Record<string, unknown>) => {
      page.span = 3;
    },
  ],
  [
    "missing terminator",
    (page: Record<string, unknown>) => {
      page.list = [];
    },
  ],
] as const)(
  "rejects %s in native Troop input before source publication",
  async (_label, mutate) => {
    return verifyTroopEvidence("MV-S5-TROOP-WORKSPACE-005", async () => {
      const { workspaceRoot, troops, paths } = await fixture();
      mutate(troops[1]!.pages[0] as unknown as Record<string, unknown>);
      await writeFile(join(workspaceRoot, "Game/data/Troops.json"), JSON.stringify(troops));
      // Pull captures native bytes; Decompile must reject owned shapes rather than fill them.
      await pullWorkspace({ workspaceRoot });
      const manifest = await readFile(paths.syncManifestPath);
      await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(/troop:1/);
      await expect(readdir(join(workspaceRoot, "src/decompiled"))).rejects.toThrow();
      expect(await readFile(paths.syncManifestPath)).toEqual(manifest);
      expect(await json(join(workspaceRoot, "Game/data/Troops.json"))).toEqual(troops);

      return {
        case: _label,
        nativeInput: troops,
        actualManifestHex: (await readFile(paths.syncManifestPath)).toString("hex"),
        actualLive: await json(join(workspaceRoot, "Game/data/Troops.json")),
      };
    });
  },
);

it.each([
  ["explicit Blank", [defaultPage], true],
  ["partial deletion", [savedPage], false],
  ["two default pages", [defaultPage, defaultPage], false],
  [
    "inactive nondefault",
    [{ ...defaultPage, conditions: { ...defaultPage.conditions, actorId: 0 } }],
    false,
  ],
] as const)(
  "classifies %s by exact page state and compares native positions",
  async (_label, pages, destructive) => {
    return verifyTroopEvidence("MV-S5-TROOP-WORKSPACE-006", async () => {
      const { workspaceRoot } = await fixture();
      await decompileWorkspace({ workspaceRoot });
      // Author the fixed cases independently through the formal helpers; lists are known literals.
      const source = `import { troopEvent, battlePage, actorRef, comment } from "rpgmaker-event-dsl";\nexport const blank = troopEvent({ troopId: 1, pages: [battlePage({commands: []})] });\nexport const changed = troopEvent({ troopId: 2, pages: [${pages
        .map((page) => {
          if (page === savedPage)
            return 'battlePage({ conditions: { turn: { enabled: false, a: 8, b: 0 }, enemy: { enabled: false, index: 8, hpAtMost: 12 }, actor: { enabled: false, ref: actorRef({id: 0}), hpAtMost: 50 }, switch: { enabled: false, ref: {kind: "switch", id: 77} } }, span: "turn", commands: [comment(["owned troop comment"])] })';
          return `battlePage({ ${page.conditions.actorId === 0 ? "conditions: {actor: {enabled: false, ref: actorRef({id: 0}), hpAtMost: 50}}," : ""} commands: [] })`;
        })
        .join(",")} ] });\n`;
      await writeFile(join(workspaceRoot, "src/decompiled/troop-events.events.ts"), source);
      await compileWorkspace({ workspaceRoot, check: false });
      expect(await diffWorkspace({ workspaceRoot })).toContain(
        `Destructive Changes: ${destructive ? "yes" : "no"}`,
      );
      expect(await diffWorkspace({ workspaceRoot })).toMatch(/page [12]: pages\[[01]\]/);
      if (pages.length === 1)
        expect(await diffWorkspace({ workspaceRoot })).toContain("page count 2 → 1");

      return {
        case: _label,
        expectedPages: pages,
        expectedDestructive: destructive,
        actualDiff: await diffWorkspace({ workspaceRoot }),
      };
    });
  },
);
