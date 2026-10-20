import { verifyTroopEvidence } from "./support/troop-evidence.js";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { createMinimalProject } from "./support/windows-sandbox.js";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { getWorkspaceStatePaths } from "../src/workspace/state.js";
import { discoverDefinitionFiles } from "../src/workspace/definitions.js";

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
async function tree(root: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const entry of await readdir(root, { withFileTypes: true }).catch(() => [])) {
    if (entry.name === "operation.lock") continue;
    const path = join(root, entry.name);
    if (entry.isDirectory())
      for (const [name, bytes] of Object.entries(await tree(path)))
        result[entry.name + "/" + name] = bytes;
    else result[entry.name] = (await readFile(path)).toString("hex");
  }
  return result;
}
async function observe(workspaceRoot: string) {
  const config = await readFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8");
  return {
    source: await tree(join(workspaceRoot, "src")),
    project: await tree(join(workspaceRoot, "Game")),
    state: await tree(join(workspaceRoot, ".rpgmaker-event-dsl")),
    config,
    discovery: await discoverDefinitionFiles(workspaceRoot, JSON.parse(config)),
  };
}

it("roundtrips an unbranched Battle Processing launch without inventing a result close record", async () => {
  return verifyTroopEvidence("MV-S5-TROOP-R2-AUXILIARY-E301", async () => {
    const { workspaceRoot, troops, paths } = await fixture();
    const commonPath = join(workspaceRoot, "Game/data/CommonEvents.json");
    const commonEvents = await json(commonPath);
    // Independent native false/false shape from the accepted actors-battle table.
    commonEvents[1].list = [
      { code: 301, indent: 0, parameters: [0, 1, false, false] },
      { code: 108, indent: 0, parameters: ["after the normal battle launch"] },
      { code: 0, indent: 0, parameters: [] },
    ];
    await writeFile(commonPath, JSON.stringify(commonEvents));
    await pullWorkspace({ workspaceRoot });
    await decompileWorkspace({ workspaceRoot });
    const source = await readFile(
      join(workspaceRoot, "src/decompiled/common-events.events.ts"),
      "utf8",
    );
    expect(source).toContain("battleProcessing({ troop: troopRef({ id: 1 }) })");
    expect(source).not.toContain("rawDslCommand");
    const before = await observe(workspaceRoot);
    await compileWorkspace({ workspaceRoot, check: true });
    expect(await observe(workspaceRoot)).toEqual(before);
    await compileWorkspace({ workspaceRoot, check: false });
    const actual = await json(join(paths.generatedProjectDataDirectory, "CommonEvents.json"));
    expect(actual).toEqual(commonEvents);
    expect(await json(join(paths.generatedProjectDataDirectory, "Troops.json"))).toEqual(troops);
    expect(await json(commonPath)).toEqual(commonEvents);
    expect(await diffWorkspace({ workspaceRoot, short: true })).toContain("No changes.");
    await pushWorkspace({ workspaceRoot, allowDestructive: false });
    expect(await json(commonPath)).toEqual(commonEvents);
    return { source, expectedCommonEvents: commonEvents, actualCommonEvents: actual };
  });
});

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

it("treats every optional Battle Page condition slot explicitly undefined as omission through public Check and Compile", async () => {
  return verifyTroopEvidence("MV-S5-TROOP-WORKSPACE-002", async () => {
    const { workspaceRoot, troops, paths } = await fixture();
    await decompileWorkspace({ workspaceRoot });
    const sourcePath = join(workspaceRoot, "src/decompiled/troop-events.events.ts");
    await writeFile(
      sourcePath,
      (await readFile(sourcePath, "utf8")).replace(
        "battlePage({",
        "battlePage({ conditions: { turnEnd: undefined, turn: undefined, enemy: undefined, actor: undefined, switch: undefined }, span: undefined,",
      ),
    );
    const before = await observe(workspaceRoot);
    await compileWorkspace({ workspaceRoot, check: true });
    expect(await observe(workspaceRoot)).toStrictEqual(before);
    await compileWorkspace({ workspaceRoot, check: false });
    expect(await json(join(paths.generatedProjectDataDirectory, "Troops.json"))).toStrictEqual(
      troops,
    );
    return {
      before,
      generatedTroops: await json(join(paths.generatedProjectDataDirectory, "Troops.json")),
    };
  });
});

it("preserves native negative zero in every saved Battle Page numeric condition through Decompile and public Compile", async () => {
  return verifyTroopEvidence("MV-S5-TROOP-WORKSPACE-002", async () => {
    const { workspaceRoot, troops, paths } = await fixture();
    const fields = [
      "turnA",
      "turnB",
      "enemyIndex",
      "enemyHp",
      "actorId",
      "actorHp",
      "switchId",
    ] as const;
    let nativeText = JSON.stringify(troops);
    for (const field of fields)
      nativeText = nativeText.replace(
        `"${field}":${defaultPage.conditions[field]}`,
        `"${field}":-0`,
      );
    await writeFile(join(workspaceRoot, "Game/data/Troops.json"), nativeText);
    const expectedTroops = JSON.parse(nativeText);
    for (const field of fields)
      expect(Object.is(expectedTroops[1].pages[0].conditions[field], -0)).toBe(true);
    await pullWorkspace({ workspaceRoot });
    const before = await observe(workspaceRoot);
    await decompileWorkspace({ workspaceRoot });
    const afterDecompile = await observe(workspaceRoot);
    expect(afterDecompile.project).toStrictEqual(before.project);
    expect(afterDecompile.state).toStrictEqual(before.state);
    expect(afterDecompile.config).toBe(before.config);
    expect(Object.keys(before.source)).toEqual([]);
    expect(afterDecompile.discovery).toContain(
      join(workspaceRoot, "src/decompiled/troop-events.events.ts"),
    );
    const source = await readFile(
      join(workspaceRoot, "src/decompiled/troop-events.events.ts"),
      "utf8",
    );
    await compileWorkspace({ workspaceRoot, check: true });
    expect(await observe(workspaceRoot)).toStrictEqual(afterDecompile);
    await compileWorkspace({ workspaceRoot, check: false });
    const generated = await json(join(paths.generatedProjectDataDirectory, "Troops.json"));
    expect(generated).toStrictEqual(expectedTroops);
    for (const field of fields)
      expect(Object.is(generated[1].pages[0].conditions[field], -0)).toBe(true);
    expect(source).toContain("a: -0, b: -0");
    expect(source).toContain("actorRef({ id: -0 })");
    expect(await diffWorkspace({ workspaceRoot, short: true })).toContain("No changes.");
    return {
      nativeText,
      source,
      afterDecompile,
      generatedNegativeZeroFields: fields.filter((field) =>
        Object.is(generated[1].pages[0].conditions[field], -0),
      ),
    };
  });
});

it("rejects native negative-zero Battle Event Span before publication without changing complete Workspace state", async () => {
  return verifyTroopEvidence("MV-S5-TROOP-WORKSPACE-005", async () => {
    const { workspaceRoot, troops } = await fixture();
    await writeFile(join(workspaceRoot, "src/keeper.events.ts"), "export const unrelated = 1;\n");
    await compileWorkspace({ workspaceRoot, check: false });
    await writeFile(
      join(workspaceRoot, "Game/data/Troops.json"),
      JSON.stringify(troops).replace('"span":0', '"span":-0'),
    );
    await pullWorkspace({ workspaceRoot });
    const before = await observe(workspaceRoot);
    await expect(decompileWorkspace({ workspaceRoot })).rejects.toMatchObject({
      code: "MV-BATTLE-PAGE-INPUT",
      stage: "decompile",
      identity: "troop:1",
      location: { nativePath: "pages[0].span", actual: "-0" },
    });
    expect(await observe(workspaceRoot)).toStrictEqual(before);
    return { nativeSpan: "-0", before };
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
    "empty page array",
    (_page: Record<string, unknown>, troop: Record<string, unknown>) => {
      troop.pages = [];
    },
  ],
  [
    "null page position",
    (_page: Record<string, unknown>, troop: Record<string, unknown>) => {
      troop.pages = [null];
    },
  ],
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
  ...(
    [
      ["turnA", -1],
      ["turnA", 10000],
      ["turnB", -1],
      ["turnB", 10000],
      ["enemyIndex", -1],
      ["enemyIndex", 9007199254740992],
      ["enemyHp", -1],
      ["enemyHp", 101],
      ["actorHp", -1],
      ["actorId", -1],
      ["switchId", -1],
      ["switchId", 0.5],
      ["turnEnding", 0],
      ["turnValid", "false"],
      ["enemyValid", null],
      ["actorValid", 1],
      ["switchValid", []],
    ] as const
  ).map(
    ([field, value]) =>
      [
        `invalid saved ${field} ${JSON.stringify(value)}`,
        (page: Record<string, unknown>) => {
          (page.conditions as Record<string, unknown>)[field] = value;
        },
      ] as const,
  ),
] as const)(
  "rejects %s in native Troop input before source publication",
  async (_label, mutate) => {
    return verifyTroopEvidence("MV-S5-TROOP-WORKSPACE-005", async () => {
      const { workspaceRoot, troops, paths } = await fixture();
      mutate(
        troops[1]!.pages[0] as unknown as Record<string, unknown>,
        troops[1] as unknown as Record<string, unknown>,
      );
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
            return 'battlePage({ conditions: { turn: { enabled: false, a: 8, b: 0 }, enemy: { enabled: false, index: 8, hpAtMost: 12 }, actor: { enabled: false, ref: actorRef({id: 0}), hpAtMost: 50 }, switch: { enabled: false, ref: {kind: "switch", id: 77} } }, span: "turn", commands: [comment({ lines: ["owned troop comment"] })] })';
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
