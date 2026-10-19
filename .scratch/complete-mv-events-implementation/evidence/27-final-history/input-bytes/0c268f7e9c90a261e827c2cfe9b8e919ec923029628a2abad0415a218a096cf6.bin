import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import {
  createMinimalProject,
  withWindowsSandbox,
  type WindowsSandbox,
} from "./support/windows-sandbox.js";
import { recordEvidence } from "./support/mv-evidence.js";
import { discoverDefinitionFiles, loadDefinitionFile } from "../src/workspace/definitions.js";
import { getWorkspaceStatePaths } from "../src/workspace/state.js";

const {
  initWorkspace,
  cloneWorkspace,
  decompileWorkspace,
  compileWorkspace,
  diffWorkspace,
  pushWorkspace,
}: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);

const fixture = JSON.parse(
  await readFile(
    new URL("./fixtures/mv-evidence/map-page-negative-zero.json", import.meta.url),
    "utf8",
  ),
);
const discovery = {
  sourceRoot: "src",
  sourceInclude: ["**/*.events.ts", "**/*.dsl.ts"],
  sourceExclude: [],
};

async function tree(directory: string): Promise<Record<string, string>> {
  const entries: Record<string, string> = {};
  for (const entry of await readdir(directory, { withFileTypes: true }).catch(() => [])) {
    if (entry.name === "operation.lock") continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      for (const [name, bytes] of Object.entries(await tree(path)))
        entries[`${entry.name}/${name}`] = bytes;
    } else entries[entry.name] = (await readFile(path)).toString("hex");
  }
  return entries;
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

async function verify(
  requirementId: string,
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
        requirementId,
        startedAt,
        stages: [
          "Actual public Workspace init/Clone/Decompile/Check/Compile/Diff/Push as applicable; real Discovery and source evaluation; independent native JSON; exact Object.is and complete fifteen-carrier comparisons",
        ],
        expected:
          "Accepted numeric saved -0 survives source and strict JSON output. Categorical and enabled-reference -0 is refused at the intended field with actual -0 and unchanged complete business state.",
        actual: { label, state: await observe(sandbox.workspaceRoot), entry: sandbox.cliEntry },
        ...(failure === undefined ? {} : { error: failure }),
      });
    }
  });
}

// The fixture is independent native JSON. This test writer preserves its numeric sign;
// it deliberately does not call the product's JSON writer or compiler.
function nativeJson(value: unknown): string {
  return (
    JSON.stringify(
      value,
      (_key, entry) => (Object.is(entry, -0) ? "__MAP_NUMERIC_MINUS_ZERO__" : entry),
      2,
    ).replaceAll('"__MAP_NUMERIC_MINUS_ZERO__"', "-0") + "\n"
  );
}

async function jsonTree(directory: string) {
  return Object.fromEntries(
    await Promise.all(
      (await readdir(directory))
        .sort()
        .map(async (name) => [name, JSON.parse(await readFile(join(directory, name), "utf8"))]),
    ),
  );
}

async function prepare(workspaceRoot: string, page = fixture.page) {
  await createMinimalProject(workspaceRoot);
  await writeFile(
    join(workspaceRoot, "Game/data/MapInfos.json"),
    '[null,{"id":1,"name":"Numeric Map"}]\n',
  );
  const systemPath = join(workspaceRoot, "Game/data/System.json");
  const system = JSON.parse(await readFile(systemPath, "utf8"));
  system.variables = ["", "Threshold"];
  await writeFile(systemPath, JSON.stringify(system));
  const carrier = {
    width: 17,
    height: 13,
    tilesetId: 1,
    opaque: { retained: true },
    events: [null, { id: 1, name: "Native numeric page", note: "", x: 0, y: 0, pages: [page] }],
  };
  await writeFile(join(workspaceRoot, "Game/data/Map001.json"), nativeJson(carrier));
  await initWorkspace({ workspaceRoot, projectRoot: "./Game" });
  await cloneWorkspace({ workspaceRoot });
  return jsonTree(join(workspaceRoot, "Game/data"));
}

const numericCases = [
  ["disabled threshold", "conditions.variableValue", "conditions.variable.atLeast", false],
  ["enabled threshold", "conditions.variableValue", "conditions.variable.atLeast", true],
  ["disabled actor ID", "conditions.actorId", "conditions.actor.ref.id", false],
  ["disabled item ID", "conditions.itemId", "conditions.item.ref.id", false],
  ["disabled switch1 ID", "conditions.switch1Id", "conditions.switch1.ref.id", false],
  ["disabled switch2 ID", "conditions.switch2Id", "conditions.switch2.ref.id", false],
  ["disabled variable ID", "conditions.variableId", "conditions.variable.ref.id", false],
  ["character index", "image.characterIndex", "image.characterIndex", false],
  ["tile ID", "image.tileId", "image.tileId", false],
  ["pattern", "image.pattern", "image.pattern", false],
] as const;

function at(value: unknown, path: string): unknown {
  for (const key of path.split(".")) value = (value as Record<string, unknown>)[key];
  return value;
}

function set(value: unknown, path: string, replacement: unknown): void {
  const keys = path.split(".");
  for (const key of keys.slice(0, -1)) value = (value as Record<string, unknown>)[key];
  (value as Record<string, unknown>)[keys.at(-1)!] = replacement;
}

it.each(numericCases)(
  "preserves Map numeric negative zero: %s through actual discovered source and complete Workspace Push",
  async (_label, nativePath, dslPath, enabled) => {
    await verify(
      "MV-S5-MAP-NUMERIC-001",
      `map-numeric-${_label.replaceAll(" ", "-")}`,
      async ({ workspaceRoot }) => {
        const page = structuredClone(fixture.page);
        page.conditions.variableValue = 0;
        page.conditions.variableValid = enabled;
        set(page, nativePath, -0);
        const expected = await prepare(workspaceRoot, page);
        expect(Object.is(at(expected["Map001.json"].events[1].pages[0], nativePath), -0)).toBe(
          true,
        );
        expect(Object.keys(expected)).toHaveLength(15);
        await decompileWorkspace({ workspaceRoot });
        const files = await discoverDefinitionFiles(workspaceRoot, discovery);
        const definitions = (
          await Promise.all(files.map((file) => loadDefinitionFile(file)))
        ).flat();
        const event = definitions.find((definition) => definition.kind === "mapEvent")!;
        expect(event.kind === "mapEvent" && Object.is(at(event.pages[0], dslPath), -0)).toBe(true);
        const sourcePath = join(workspaceRoot, "src/decompiled/maps/Map001.events.ts");
        const source = await readFile(sourcePath, "utf8");
        expect(source).toContain(`${dslPath.split(".").at(-1)}: -0`);
        const beforeCheck = await observe(workspaceRoot);
        await compileWorkspace({ workspaceRoot, check: true });
        expect(await observe(workspaceRoot)).toStrictEqual(beforeCheck);
        await compileWorkspace({ workspaceRoot, check: false });
        const paths = getWorkspaceStatePaths(workspaceRoot);
        const generated = await jsonTree(paths.generatedProjectDataDirectory);
        expect(Object.keys(generated)).toStrictEqual([
          "CommonEvents.json",
          "Map001.json",
          "System.json",
          "Troops.json",
        ]);
        expect({ ...expected, ...generated }).toStrictEqual(expected);
        expect(await diffWorkspace({ workspaceRoot, short: true })).toContain("No changes.");
        await writeFile(
          sourcePath,
          source.replace("Native numeric page", "Installed numeric page"),
        );
        expected["Map001.json"].events[1].name = "Installed numeric page";
        await compileWorkspace({ workspaceRoot, check: true });
        await compileWorkspace({ workspaceRoot, check: false });
        expect(await diffWorkspace({ workspaceRoot, short: true })).toContain("Map001");
        await pushWorkspace({ workspaceRoot, allowDestructive: false });
        expect(await jsonTree(join(workspaceRoot, "Game/data"))).toStrictEqual(expected);
        expect(await jsonTree(paths.projectDataSnapshotDirectory)).toStrictEqual(expected);
        expect(
          Object.is(
            at(
              (await jsonTree(join(workspaceRoot, "Game/data")))["Map001.json"].events[1].pages[0],
              nativePath,
            ),
            -0,
          ),
        ).toBe(true);
      },
    );
  },
  30_000,
);

it.each(["helper", "untyped"] as const)(
  "preserves authored Map numeric negative zero from actual %s source evaluation through full Workspace Push",
  async (mode) => {
    await verify(
      "MV-S5-MAP-NUMERIC-002",
      `map-numeric-authored-${mode}`,
      async ({ workspaceRoot }) => {
        const nativePage = structuredClone(fixture.page);
        for (const [, nativePath] of numericCases) set(nativePage, nativePath, -0);
        const enabledPage = structuredClone(fixture.page);
        enabledPage.conditions.variableValid = true;
        const expected = await prepare(workspaceRoot);
        expected["Map001.json"].events[1].pages = [nativePage, enabledPage];
        await decompileWorkspace({ workspaceRoot });
        const pageFields = `conditions: {
      actor: { enabled: false, ref: ${mode === "helper" ? "actorRef({ id: -0 })" : '{ kind: "actor", id: -0 }'} },
      item: { enabled: false, ref: ${mode === "helper" ? "itemRef({ id: -0 })" : '{ kind: "item", id: -0 }'} },
      switch1: { enabled: false, ref: ${mode === "helper" ? "switchRef({ id: -0 })" : '{ kind: "switch", id: -0 }'} },
      switch2: { enabled: false, ref: ${mode === "helper" ? "switchRef({ id: -0 })" : '{ kind: "switch", id: -0 }'} },
      variable: { enabled: false, ref: ${mode === "helper" ? "variableRef({ id: -0 })" : '{ kind: "variable", id: -0 }'}, atLeast: -0 }
    }, image: { characterIndex: -0, tileId: -0, pattern: -0 }, commands: []`;
        const enabledFields = `conditions: { variable: { enabled: true, ref: ${mode === "helper" ? "variableRef({ id: 1 })" : '{ kind: "variable", id: 1 }'}, atLeast: -0 } }, commands: []`;
        const sourcePath = join(workspaceRoot, "src/decompiled/maps/Map001.events.ts");
        const source =
          mode === "helper"
            ? `import { mapEvent, page, actorRef, itemRef, switchRef, variableRef } from "rpgmaker-event-dsl";
const saved = { ${pageFields} } as never;
export const numeric = mapEvent({ mapId: 1, id: 1, name: "Native numeric page", x: 0, y: 0, pages: [page(saved), page({ ${enabledFields} })] });\n`
            : `const saved = { ${pageFields} } as never;
export const numeric = { kind: "mapEvent", mapId: 1, id: 1, name: "Native numeric page", x: 0, y: 0, note: "", pages: [saved, { ${enabledFields} }] } as never;\n`;
        await writeFile(sourcePath, source);
        const loaded = await loadDefinitionFile(sourcePath);
        const event = loaded.find((entry) => entry.kind === "mapEvent")!;
        for (const [, , dslPath] of numericCases)
          expect(event.kind === "mapEvent" && Object.is(at(event.pages[0], dslPath), -0)).toBe(
            true,
          );
        expect(
          event.kind === "mapEvent" && Object.is(event.pages[1]!.conditions!.variable!.atLeast, -0),
        ).toBe(true);
        const beforeCheck = await observe(workspaceRoot);
        await compileWorkspace({ workspaceRoot, check: true });
        expect(await observe(workspaceRoot)).toStrictEqual(beforeCheck);
        await compileWorkspace({ workspaceRoot, check: false });
        const paths = getWorkspaceStatePaths(workspaceRoot);
        const generated = await jsonTree(paths.generatedProjectDataDirectory);
        expect(Object.keys(generated)).toStrictEqual([
          "CommonEvents.json",
          "Map001.json",
          "System.json",
          "Troops.json",
        ]);
        expect({ ...expected, ...generated }).toStrictEqual(expected);
        expect(await diffWorkspace({ workspaceRoot })).toContain("pages");
        await pushWorkspace({ workspaceRoot, allowDestructive: false });
        expect(await jsonTree(join(workspaceRoot, "Game/data"))).toStrictEqual(expected);
        expect(await jsonTree(paths.projectDataSnapshotDirectory)).toStrictEqual(expected);
      },
    );
  },
  30_000,
);

it.each([
  ["priorityType", "MV-MAP-PAGE-SHAPE"],
  ["trigger", "MV-MAP-PAGE-SHAPE"],
  ["moveType", "MV-PAGE-MOVEMENT"],
  ...["actor", "item", "switch1", "switch2", "variable"].map((field) => [
    `conditions.${field}Id`,
    "MV-MAP-PAGE-SHAPE",
  ]),
])(
  "rejects native Map categorical or enabled-reference negative zero at %s without publishing or changing complete state",
  async (nativePath, code) => {
    await verify(
      "MV-S5-MAP-NUMERIC-003",
      `map-numeric-refusal-${nativePath}`,
      async ({ workspaceRoot }) => {
        const page = structuredClone(fixture.page);
        page.conditions.variableValue = 0;
        set(page, nativePath!, -0);
        if (nativePath!.startsWith("conditions."))
          set(page, nativePath!.replace(/Id$/u, "Valid"), true);
        await prepare(workspaceRoot, page);
        await mkdir(join(workspaceRoot, "src"), { recursive: true });
        await writeFile(
          join(workspaceRoot, "src/keeper.events.ts"),
          'import { commonEvent } from "rpgmaker-event-dsl";\nexport const keeper = commonEvent({ id: 99, name: "Keep exact existing source", trigger: "none", commands: [] });\n',
        );
        await compileWorkspace({ workspaceRoot, check: false });
        const before = await observe(workspaceRoot);
        await expect(decompileWorkspace({ workspaceRoot })).rejects.toMatchObject({
          code,
          stage: "decompile",
          identity: "map:1/event:1",
          location: { nativePath: `pages[0].${nativePath}`, actual: "-0" },
        });
        expect(await observe(workspaceRoot)).toStrictEqual(before);
      },
    );
  },
  30_000,
);

it.each(["helper", "untyped"] as const)(
  "rejects enabled negative-zero Map condition IDs from actual %s source in Check and Compile without changing state",
  async (mode) => {
    await verify(
      "MV-S5-MAP-NUMERIC-004",
      `map-numeric-enabled-${mode}`,
      async ({ workspaceRoot }) => {
        const page = structuredClone(fixture.page);
        page.conditions.variableValue = 0;
        await prepare(workspaceRoot, page);
        await decompileWorkspace({ workspaceRoot });
        await compileWorkspace({ workspaceRoot, check: false });
        const sourcePath = join(workspaceRoot, "src/decompiled/maps/Map001.events.ts");
        const original = await readFile(sourcePath, "utf8");
        for (const slot of ["actor", "item", "switch1", "switch2", "variable"]) {
          const kind = slot.startsWith("switch") ? "switch" : slot;
          const ref = mode === "helper" ? `${kind}Ref({ id: -0 })` : `{ kind: "${kind}", id: -0 }`;
          const condition = `${slot}: { enabled: true, ref: ${ref}${slot === "variable" ? ", atLeast: 0" : ""} }`;
          const source = `import { ${kind}Ref } from "rpgmaker-event-dsl";\n${original.replace("page({", `page({ conditions: { ${condition} } as never,`)}`;
          await writeFile(sourcePath, source);
          const loaded = await loadDefinitionFile(sourcePath);
          const event = loaded.find((entry) => entry.kind === "mapEvent")!;
          expect(
            event.kind === "mapEvent" &&
              Object.is(at(event.pages[0], `conditions.${slot}.ref.id`), -0),
          ).toBe(true);
          const before = await observe(workspaceRoot);
          for (const check of [true, false]) {
            const error = await compileWorkspace({ workspaceRoot, check }).catch(
              (error: unknown) => error,
            );
            expect(error).toBeInstanceOf(Error);
            const message = (error as Error).message;
            expect(message).toContain("MV-MAP-PAGE-INPUT");
            expect(message).toContain(`(pages[0].conditions.${slot}.ref.id)`);
            expect(message).toContain("actual -0");
            expect(await observe(workspaceRoot)).toStrictEqual(before);
          }
        }
      },
    );
  },
  30_000,
);
