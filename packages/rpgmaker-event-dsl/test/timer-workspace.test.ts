import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { createMinimalProject, withWindowsSandbox } from "./support/windows-sandbox.js";
import { blankEvent, blankPage } from "./support/map-event-fixtures.js";
import { discoverDefinitionFiles } from "../src/workspace/definitions.js";
import { compileCommonEvent } from "../src/compiler/events.js";
import { buildStagedDataGraph } from "../src/validation/staged-graph.js";
import { recordEvidence } from "./support/mv-evidence.js";

const api: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const { commonEvent, controlTimer, rawDslCommand }: typeof import("../src/index.js") = await import(
  new URL(
    process.env.MV_CLI_ENTRY === "built" ? "../dist/index.mjs" : "../src/index.ts",
    import.meta.url,
  ).href
);
const end = { code: 0, indent: 0, parameters: [] };

afterEach(async ({ task }) => {
  const requirementId = /^MV-S6-TIMER-\d{3}/u.exec(task.name)?.[0];
  if (!requirementId) throw new Error(`Missing Timer evidence identity: ${task.name}`);
  const failure = task.result?.errors?.[0];
  await recordEvidence({
    requirementId,
    startedAt: new Date(task.result?.startTime ?? Date.now()).toISOString(),
    stages: [
      "Independent finite native arrays and accepted saved-slot contract",
      "Approved public DSL/command compilation or actual Workspace Discovery, source evaluation and filesystem operations",
      "Assertions of complete saved values, precise diagnostics and unchanged business state on failed/check-only paths",
    ],
    expected:
      "Every assertion in the linked Timer case holds; source runs do not claim built, editor UI or game verification.",
    actual: {
      test: task.name,
      assertionErrors: task.result?.errors ?? [],
      entry: process.env.MV_CLI_ENTRY ?? "source",
    },
    ...(failure === undefined ? {} : { error: failure }),
  });
});

async function json(path: string) {
  return JSON.parse(await readFile(path, "utf8"));
}
async function data(root: string) {
  return Object.fromEntries(
    await Promise.all(
      (await readdir(root)).sort().map(async (name) => [name, await json(join(root, name))]),
    ),
  );
}
async function tree(root: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const entry of await readdir(root, { withFileTypes: true }).catch(() => [])) {
    if (entry.name === "operation.lock") continue;
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      for (const [key, value] of Object.entries(await tree(path)))
        result[entry.name + "/" + key] = value;
    } else result[entry.name] = (await readFile(path)).toString("hex");
  }
  return result;
}
async function observe(workspaceRoot: string) {
  const config = await readFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8");
  return {
    config,
    source: await tree(join(workspaceRoot, "src")),
    project: await tree(join(workspaceRoot, "Game")),
    state: await tree(join(workspaceRoot, ".rpgmaker-event-dsl")),
    discovery: await discoverDefinitionFiles(workspaceRoot, JSON.parse(config)),
  };
}
async function nativeTimerProject(workspaceRoot: string, list?: unknown[]) {
  const fixture = await createMinimalProject(workspaceRoot);
  const timer = JSON.parse(
    await readFile(
      new URL("./fixtures/mv-evidence/timer-saved-slots.json", import.meta.url),
      "utf8",
    ),
  );
  const troop = JSON.parse(
    await readFile(
      new URL("./fixtures/mv-evidence/troop-event-project.json", import.meta.url),
      "utf8",
    ),
  );
  const saved = list ?? timer.list;
  const carriers = {
    ...fixture.projectFiles,
    "CommonEvents.json": [
      null,
      { id: 1, name: "Saved Timer", trigger: 0, switchId: 1, list: structuredClone(saved) },
    ],
    "MapInfos.json": [null, { id: 1, name: "Timer Map" }],
    "Map001.json": {
      width: 17,
      height: 13,
      tilesetId: 1,
      opaque: { retained: [null, [], {}] },
      events: [
        null,
        {
          ...blankEvent,
          name: "Saved Map",
          pages: [{ ...blankPage, list: structuredClone(saved) }],
        },
      ],
    },
    "Troops.json": [
      null,
      { ...troop.carrier, pages: [{ ...troop.defaultPage, list: structuredClone(saved) }] },
    ],
  };
  for (const [name, value] of Object.entries(carriers))
    await writeFile(join(workspaceRoot, "Game/data", name), JSON.stringify(value));
  await api.initWorkspace({ workspaceRoot, projectRoot: "./Game" });
  await api.cloneWorkspace({ workspaceRoot });
  return carriers;
}

it("MV-S6-TIMER-001: authored Stop preserves absent, undefined, zero and nonzero slots", async () => {
  await withWindowsSandbox("timer-authored-slots", async (s) => {
    const fixture = await createMinimalProject(s.workspaceRoot);
    await api.initWorkspace({ ...s, projectRoot: "./Game" });
    await api.cloneWorkspace(s);
    await mkdir(join(s.workspaceRoot, "src"), { recursive: true });
    await writeFile(
      join(s.workspaceRoot, "src/timer.events.ts"),
      `import {commonEvent,controlTimer,switchDefinition} from "rpgmaker-event-dsl";
       export const savedSwitch=switchDefinition({id:1,name:"Saved switch"});
       export const timer=commonEvent({id:1,name:"Saved Timer",trigger:"none",commands:[
         controlTimer({action:"stop"}),
         controlTimer({action:"stop",seconds:undefined}),
         controlTimer({action:"stop",seconds:0}),
         controlTimer({action:"stop",seconds:83}),
         controlTimer({action:"start",seconds:0}),
         controlTimer({action:"start",seconds:5999})
       ]});`,
    );
    // Independent native arrays from accepted D-TIMER; never compiled to form an oracle.
    const expected = {
      "CommonEvents.json": [
        null,
        {
          id: 1,
          name: "Saved Timer",
          trigger: 0,
          switchId: 1,
          list: [
            { code: 124, indent: 0, parameters: [1] },
            { code: 124, indent: 0, parameters: [1] },
            { code: 124, indent: 0, parameters: [1, 0] },
            { code: 124, indent: 0, parameters: [1, 83] },
            { code: 124, indent: 0, parameters: [0, 0] },
            { code: 124, indent: 0, parameters: [0, 5999] },
            end,
          ],
        },
      ],
      "System.json": fixture.projectFiles["System.json"],
      "Troops.json": [null],
    };
    await api.compileWorkspace({ ...s, check: true });
    await api.compileWorkspace({ ...s, check: false });
    expect(
      await data(join(s.workspaceRoot, ".rpgmaker-event-dsl/generated-project-data")),
    ).toStrictEqual(expected);
    await api.diffWorkspace(s);
    await api.pushWorkspace({ ...s, allowDestructive: false });
    expect(await json(join(s.workspaceRoot, "Game/data/CommonEvents.json"))).toStrictEqual(
      expected["CommonEvents.json"],
    );
  });
});

it("MV-S6-TIMER-002: independently saved slots roundtrip all three containers and install exact complete carriers", async () => {
  await withWindowsSandbox("timer-native-three-containers", async (s) => {
    const carriers = await nativeTimerProject(s.workspaceRoot);
    await api.decompileWorkspace(s);
    const discovery = (await observe(s.workspaceRoot)).discovery;
    const sources = await Promise.all(discovery.map((path) => readFile(path, "utf8")));
    for (const source of sources.filter((value) => value.includes("controlTimer"))) {
      expect(source).toContain('controlTimer({ action: "stop" })');
      expect(source).toContain('controlTimer({ action: "stop", seconds: 0 })');
      expect(source).toContain('controlTimer({ action: "stop", seconds: 83 })');
      expect(source).not.toContain("rawDslCommand");
    }
    expect(sources.filter((value) => value.includes("controlTimer"))).toHaveLength(3);
    const before = await observe(s.workspaceRoot);
    await api.compileWorkspace({ ...s, check: true });
    expect(await observe(s.workspaceRoot)).toStrictEqual(before);
    await api.compileWorkspace({ ...s, check: false });
    const generatedRoot = join(s.workspaceRoot, ".rpgmaker-event-dsl/generated-project-data");
    expect(await data(generatedRoot)).toStrictEqual({
      "CommonEvents.json": carriers["CommonEvents.json"],
      "Map001.json": carriers["Map001.json"],
      "System.json": carriers["System.json"],
      "Troops.json": carriers["Troops.json"],
    });
    expect(await api.diffWorkspace({ ...s, short: true })).toContain("No changes.");
    const expected = structuredClone(carriers);
    expected["CommonEvents.json"][1].name = "Installed Timer";
    expected["Map001.json"].events[1].name = "Installed Map";
    expected["Troops.json"][1].pages[0].list.unshift({
      code: 108,
      indent: 0,
      parameters: ["Installed Timer"],
    });
    for (const [index, path] of discovery.entries()) {
      let source = sources[index]!;
      source = source.replace('name: "Saved Timer"', 'name: "Installed Timer"');
      source = source.replace('name: "Saved Map"', 'name: "Installed Map"');
      if (source.includes("troopEvent("))
        source = `import {comment} from "rpgmaker-event-dsl";\n${source.replace("commands: [", 'commands: [comment({lines:["Installed Timer"]}),')}`;
      await writeFile(path, source);
    }
    await api.compileWorkspace({ ...s, check: true });
    await api.compileWorkspace({ ...s, check: false });
    expect(await api.diffWorkspace({ ...s, short: true })).not.toContain("No changes.");
    await api.pushWorkspace({ ...s, allowDestructive: false });
    expect(Object.keys(await data(join(s.workspaceRoot, "Game/data")))).toHaveLength(15);
    expect(await data(join(s.workspaceRoot, "Game/data"))).toStrictEqual(expected);
  });
}, 30_000);

it.each([
  ['controlTimer({action:"start",seconds:6000})', "controlTimer.seconds"],
  ['({kind:"controlTimer",action:"stop",seconds:6000})', "commands[0].seconds"],
])(
  "MV-S6-TIMER-004: invalid authored seconds fails Check and Compile without changing business state (%s)",
  async (expression, path) => {
    await withWindowsSandbox("timer-invalid-authored-seconds", async (s) => {
      await createMinimalProject(s.workspaceRoot);
      await api.initWorkspace({ ...s, projectRoot: "./Game" });
      await api.cloneWorkspace(s);
      await mkdir(join(s.workspaceRoot, "src"), { recursive: true });
      await writeFile(
        join(s.workspaceRoot, "src/timer.events.ts"),
        `import {commonEvent,controlTimer} from "rpgmaker-event-dsl";
       export const timer=commonEvent({id:1,name:"Rejected Timer",trigger:"none",commands:[${expression} as any]});`,
      );
      const before = await observe(s.workspaceRoot);
      for (const check of [true, false])
        await expect(api.compileWorkspace({ ...s, check })).rejects.toThrow(
          new RegExp(`MV-E124-SECONDS.*${path.replaceAll("[", "\\[").replaceAll("]", "\\]")}`, "u"),
        );
      expect(await observe(s.workspaceRoot)).toStrictEqual(before);
    });
  },
);

it.each([
  ['{action:"start"}', "MV-E124-SECONDS", "seconds"],
  ['{action:"start",seconds:undefined}', "MV-E124-SECONDS", "seconds"],
  ['{action:"stop",seconds:null}', "MV-E124-SECONDS", "seconds"],
  ['{action:"start",seconds:"83"}', "MV-E124-SECONDS", "seconds"],
  ['{action:"stop",seconds:-1}', "MV-E124-SECONDS", "seconds"],
  ['{action:"start",seconds:0.5}', "MV-E124-SECONDS", "seconds"],
  ['{action:"stop",seconds:1e999}', "MV-E124-SECONDS", "seconds"],
  ["{seconds:83}", "MV-E124-ACTION", "action"],
  ['{action:"pause"}', "MV-E124-ACTION", "action"],
] as const)(
  "MV-S6-TIMER-010: real loader validates untyped source-local values (%s)",
  async (input, code, field) => {
    await withWindowsSandbox("timer-untyped-loader", async (s) => {
      await createMinimalProject(s.workspaceRoot);
      await api.initWorkspace({ ...s, projectRoot: "./Game" });
      await api.cloneWorkspace(s);
      await mkdir(join(s.workspaceRoot, "src"), { recursive: true });
      await writeFile(
        join(s.workspaceRoot, "src/timer.events.ts"),
        `import {commonEvent,controlTimer} from "rpgmaker-event-dsl";
       const candidate=${input} as any;
       export const timer=commonEvent({id:1,name:"Rejected Timer",trigger:"none",commands:[controlTimer(candidate)]});`,
      );
      const before = await observe(s.workspaceRoot);
      for (const check of [true, false]) {
        const failure = await api
          .compileWorkspace({ ...s, check })
          .catch((error: unknown) => error);
        expect(failure).toBeInstanceOf(Error);
        expect((failure as Error).message).toContain(code);
        expect((failure as Error).message).toContain(`controlTimer.${field}`);
      }
      expect(await observe(s.workspaceRoot)).toStrictEqual(before);
    });
  },
);

it("MV-S6-TIMER-011: actual loader rejects an undefined known raw saved slot before any business write", async () => {
  await withWindowsSandbox("timer-undefined-raw-loader", async (s) => {
    await createMinimalProject(s.workspaceRoot);
    await api.initWorkspace({ ...s, projectRoot: "./Game" });
    await api.cloneWorkspace(s);
    await mkdir(join(s.workspaceRoot, "src"), { recursive: true });
    await writeFile(
      join(s.workspaceRoot, "src/timer.events.ts"),
      `import {commonEvent,rawDslCommand} from "rpgmaker-event-dsl";
       export const timer=commonEvent({id:1,name:"Rejected Timer",trigger:"none",commands:[rawDslCommand({code:124,parameters:[1,undefined]})]});`,
    );
    const before = await observe(s.workspaceRoot);
    for (const check of [true, false])
      await expect(api.compileWorkspace({ ...s, check })).rejects.toThrow(
        /MV-STRICT-JSON.*commands\[0\]\.parameters\[1\]/u,
      );
    expect(await observe(s.workspaceRoot)).toStrictEqual(before);
  });
});

it("MV-S6-TIMER-012: valid known raw slots compile and Push complete three-container state", async () => {
  await withWindowsSandbox("timer-valid-known-raw", async (s) => {
    const expected = await nativeTimerProject(s.workspaceRoot);
    await api.decompileWorkspace(s);
    for (const path of (await observe(s.workspaceRoot)).discovery) {
      let source = await readFile(path, "utf8");
      if (!source.includes("controlTimer")) continue;
      source = `import {rawDslCommand} from "rpgmaker-event-dsl";\n${source}`
        .replaceAll(
          'controlTimer({ action: "start", seconds: 0 })',
          "rawDslCommand({code:124,parameters:[0,0]})",
        )
        .replaceAll(
          'controlTimer({ action: "start", seconds: 5999 })',
          "rawDslCommand({code:124,parameters:[0,5999]})",
        )
        .replaceAll('controlTimer({ action: "stop" })', "rawDslCommand({code:124,parameters:[1]})")
        .replaceAll(
          'controlTimer({ action: "stop", seconds: 0 })',
          "rawDslCommand({code:124,parameters:[1,0]})",
        )
        .replaceAll(
          'controlTimer({ action: "stop", seconds: 83 })',
          "rawDslCommand({code:124,parameters:[1,83]})",
        )
        .replace('name: "Saved Timer"', 'name: "Installed Timer"');
      await writeFile(path, source);
    }
    expected["CommonEvents.json"][1].name = "Installed Timer";
    const before = await observe(s.workspaceRoot);
    await api.compileWorkspace({ ...s, check: true });
    expect(await observe(s.workspaceRoot)).toStrictEqual(before);
    await api.compileWorkspace({ ...s, check: false });
    await api.diffWorkspace(s);
    await api.pushWorkspace({ ...s, allowDestructive: false });
    expect(await data(join(s.workspaceRoot, "Game/data"))).toStrictEqual(expected);
  });
}, 30_000);

it.each(['{action:"start"}', '{action:"stop",seconds:null}', '{action:"pause"}'])(
  "MV-S6-TIMER-013: public types reject incomplete or invalid authored Timer input (%s)",
  async (input) => {
    await withWindowsSandbox("timer-public-types", async (s) => {
      await createMinimalProject(s.workspaceRoot);
      await api.initWorkspace({ ...s, projectRoot: "./Game" });
      await api.cloneWorkspace(s);
      await mkdir(join(s.workspaceRoot, "src"), { recursive: true });
      await writeFile(
        join(s.workspaceRoot, "src/timer.events.ts"),
        `import {commonEvent,controlTimer} from "rpgmaker-event-dsl";
         export const timer=commonEvent({id:1,name:"Rejected Timer",trigger:"none",commands:[controlTimer(${input})]});`,
      );
      const before = await observe(s.workspaceRoot);
      for (const check of [true, false])
        await expect(api.compileWorkspace({ ...s, check })).rejects.toThrow(
          /TypeScript diagnostics/u,
        );
      expect(await observe(s.workspaceRoot)).toStrictEqual(before);
    });
  },
);

it.each(["CommonEvents.json", "Map001.json", "Troops.json"])(
  "MV-S6-TIMER-005: invalid native seconds has a precise diagnostic before publication (%s)",
  async (carrier) => {
    await withWindowsSandbox("timer-invalid-native-seconds", async (s) => {
      await nativeTimerProject(s.workspaceRoot);
      const path = join(s.workspaceRoot, "Game/data", carrier);
      await writeFile(
        path,
        (await readFile(path, "utf8")).replace('"parameters":[0,0]', '"parameters":[0,6000]'),
      );
      await api.pullWorkspace(s);
      const before = await observe(s.workspaceRoot);
      await expect(api.decompileWorkspace(s)).rejects.toMatchObject({
        code: "MV-E124-SECONDS",
        stage: "decompile",
        identity:
          carrier === "CommonEvents.json"
            ? "commonEvent:1"
            : carrier === "Map001.json"
              ? "map:1/event:1"
              : "troop:1",
        location: {
          nativePath:
            carrier === "CommonEvents.json"
              ? "list[0].parameters[1]"
              : "pages[0].list[0].parameters[1]",
        },
      });
      expect(await observe(s.workspaceRoot)).toStrictEqual(before);
    });
  },
);

it("MV-S6-TIMER-003: numeric negative zero survives actual generated source and complete native installation", async () => {
  await withWindowsSandbox("timer-numeric-negative-zero", async (s) => {
    const expected = await nativeTimerProject(s.workspaceRoot);
    for (const name of ["CommonEvents.json", "Map001.json", "Troops.json"]) {
      const path = join(s.workspaceRoot, "Game/data", name);
      const text = await readFile(path, "utf8");
      await writeFile(
        path,
        text
          .replaceAll('"parameters":[0,0]', '"parameters":[0,-0]')
          .replaceAll('"parameters":[1,0]', '"parameters":[1,-0]'),
      );
    }
    expected["CommonEvents.json"][1].list[0].parameters[1] = -0;
    expected["CommonEvents.json"][1].list[3].parameters[1] = -0;
    expected["Map001.json"].events[1].pages[0].list[0].parameters[1] = -0;
    expected["Map001.json"].events[1].pages[0].list[3].parameters[1] = -0;
    expected["Troops.json"][1].pages[0].list[0].parameters[1] = -0;
    expected["Troops.json"][1].pages[0].list[3].parameters[1] = -0;
    await api.pullWorkspace(s);
    await api.decompileWorkspace(s);
    const discovery = (await observe(s.workspaceRoot)).discovery;
    for (const path of discovery) {
      const source = await readFile(path, "utf8");
      if (source.includes("controlTimer")) {
        expect(source).toContain('controlTimer({ action: "start", seconds: -0 })');
        expect(source).toContain('controlTimer({ action: "stop", seconds: -0 })');
      }
      await writeFile(
        path,
        `import {rawDslCommand} from "rpgmaker-event-dsl";\n${source
          .replace('name: "Saved Timer"', 'name: "Installed Timer"')
          .replace(
            'controlTimer({ action: "stop", seconds: -0 })',
            "rawDslCommand({code:124,parameters:[1,-0]})",
          )}`,
      );
    }
    expected["CommonEvents.json"][1].name = "Installed Timer";
    const before = await observe(s.workspaceRoot);
    await api.compileWorkspace({ ...s, check: true });
    expect(await observe(s.workspaceRoot)).toStrictEqual(before);
    await api.compileWorkspace({ ...s, check: false });
    await api.diffWorkspace(s);
    await api.pushWorkspace({ ...s, allowDestructive: false });
    expect(await data(join(s.workspaceRoot, "Game/data"))).toStrictEqual(expected);
  });
}, 30_000);

it.each([
  ["missing seconds", { action: "start" }, "MV-E124-SECONDS"],
  ["required undefined", { action: "start", seconds: undefined }, "MV-E124-SECONDS"],
  ["null seconds", { action: "stop", seconds: null }, "MV-E124-SECONDS"],
  ["string seconds", { action: "stop", seconds: "83" }, "MV-E124-SECONDS"],
  ["boolean seconds", { action: "stop", seconds: false }, "MV-E124-SECONDS"],
  ["negative seconds", { action: "stop", seconds: -1 }, "MV-E124-SECONDS"],
  ["fractional seconds", { action: "start", seconds: 0.5 }, "MV-E124-SECONDS"],
  ["above maximum", { action: "stop", seconds: 6000 }, "MV-E124-SECONDS"],
  ["NaN seconds", { action: "start", seconds: NaN }, "MV-E124-SECONDS"],
  ["infinite seconds", { action: "start", seconds: Infinity }, "MV-E124-SECONDS"],
  ["negative infinite seconds", { action: "stop", seconds: -Infinity }, "MV-E124-SECONDS"],
  ["missing action", { seconds: 83 }, "MV-E124-ACTION"],
  ["undefined action", { action: undefined }, "MV-E124-ACTION"],
  ["unknown action", { action: "pause", seconds: 83 }, "MV-E124-ACTION"],
  ["numeric action", { action: 0, seconds: 83 }, "MV-E124-ACTION"],
  ["null input", null, "MV-E124-SHAPE"],
  ["array input", [], "MV-E124-SHAPE"],
  ["unknown saved field", { action: "stop", seconds: 83, oldSeconds: 0 }, "MV-E124-SHAPE"],
] as const)(
  "MV-S6-TIMER-006: public helper rejects invalid untyped Timer input (%s)",
  (_label, input, code) => {
    expect(() => controlTimer(input as never)).toThrow(code);
  },
);

it("MV-S6-TIMER-006: rejects accessor fields without evaluating them", () => {
  let reads = 0;
  const input = {
    action: "stop",
    get seconds() {
      reads++;
      return 83;
    },
  };
  expect(() => controlTimer(input as never)).toThrow("MV-E124-SHAPE");
  expect(reads).toBe(0);
});

const invalidSavedSlots = [
  ["empty", "[]", "MV-E124-ACTION", ".parameters[0]"],
  ["missing Start seconds", "[0]", "MV-E124-PARAMETERS", ".parameters"],
  ["extra Start slot", "[0,83,0]", "MV-E124-PARAMETERS", ".parameters"],
  ["extra Stop slot", "[1,83,0]", "MV-E124-PARAMETERS", ".parameters"],
  ["null seconds", "[1,null]", "MV-E124-SECONDS", ".parameters[1]"],
  ["string seconds", '[0,"83"]', "MV-E124-SECONDS", ".parameters[1]"],
  ["boolean seconds", "[1,false]", "MV-E124-SECONDS", ".parameters[1]"],
  ["negative seconds", "[0,-1]", "MV-E124-SECONDS", ".parameters[1]"],
  ["fractional seconds", "[1,0.5]", "MV-E124-SECONDS", ".parameters[1]"],
  ["above maximum", "[1,6000]", "MV-E124-SECONDS", ".parameters[1]"],
  ["negative-zero action", "[-0,83]", "MV-E124-ACTION", ".parameters[0]"],
  ["unknown action", "[2,83]", "MV-E124-ACTION", ".parameters[0]"],
  ["string action", '["start",83]', "MV-E124-ACTION", ".parameters[0]"],
  ["null action", "[null,83]", "MV-E124-ACTION", ".parameters[0]"],
] as const;

it.each(invalidSavedSlots)(
  "MV-S6-TIMER-007: native and known raw reject the same malformed saved slots (%s)",
  async (_label, slots, code, suffix) => {
    await withWindowsSandbox("timer-invalid-saved-slots", async (s) => {
      await nativeTimerProject(s.workspaceRoot);
      const path = join(s.workspaceRoot, "Game/data/CommonEvents.json");
      await writeFile(
        path,
        (await readFile(path, "utf8")).replace('"parameters":[0,0]', `"parameters":${slots}`),
      );
      await api.pullWorkspace(s);
      const nativeBefore = await observe(s.workspaceRoot);
      await expect(api.decompileWorkspace(s)).rejects.toMatchObject({
        code,
        stage: "decompile",
        identity: "commonEvent:1",
        location: { nativePath: `list[0]${suffix}` },
      });
      expect(await observe(s.workspaceRoot)).toStrictEqual(nativeBefore);
      await mkdir(join(s.workspaceRoot, "src"), { recursive: true });
      await writeFile(
        join(s.workspaceRoot, "src/timer.events.ts"),
        `import {commonEvent,rawDslCommand} from "rpgmaker-event-dsl";
       export const timer=commonEvent({id:1,name:"Rejected Timer",trigger:"none",commands:[rawDslCommand({code:124,parameters:${slots}})]});`,
      );
      const rawBefore = await observe(s.workspaceRoot);
      for (const check of [true, false]) {
        const failure = await api
          .compileWorkspace({ ...s, check })
          .catch((error: unknown) => error);
        expect(failure).toBeInstanceOf(Error);
        expect((failure as Error).message).toContain(code);
        expect((failure as Error).message).toContain(`commands[0]${suffix}`);
      }
      expect(await observe(s.workspaceRoot)).toStrictEqual(rawBefore);
    });
  },
);

const sparseTimerParameters: unknown[] = [1];
sparseTimerParameters.length = 2;
it.each([
  ["undefined array element", [1, undefined]],
  ["sparse array slot", sparseTimerParameters],
  ["nonfinite seconds", [0, Infinity]],
] as const)(
  "MV-S6-TIMER-008: command compilation rejects non-JSON array values without normalizing (%s)",
  (_label, parameters) => {
    const before = Object.getOwnPropertyDescriptors(parameters);
    expect(() =>
      compileCommonEvent(
        commonEvent({
          id: 1,
          name: "Rejected Timer",
          trigger: "none",
          commands: [rawDslCommand({ code: 124, parameters })],
        }),
        { nextId: 1, resolver: buildStagedDataGraph({ declarations: [] }).resolver },
      ),
    ).toThrow("MV-STRICT-JSON");
    expect(Object.getOwnPropertyDescriptors(parameters)).toStrictEqual(before);
  },
);

it.each(['{action:"stop",seconds:83,oldSeconds:0}', '{action:"start",seconds:83,extra:undefined}'])(
  "MV-S6-TIMER-009: real loader rejects extra fields from a structurally typed local const (%s)",
  async (input) => {
    await withWindowsSandbox("timer-local-const-fields", async (s) => {
      await createMinimalProject(s.workspaceRoot);
      await api.initWorkspace({ ...s, projectRoot: "./Game" });
      await api.cloneWorkspace(s);
      await mkdir(join(s.workspaceRoot, "src"), { recursive: true });
      await writeFile(
        join(s.workspaceRoot, "src/timer.events.ts"),
        `import {commonEvent,controlTimer} from "rpgmaker-event-dsl";
       const candidate=${input} as const;
       export const timer=commonEvent({id:1,name:"Rejected Timer",trigger:"none",commands:[controlTimer(candidate)]});`,
      );
      const before = await observe(s.workspaceRoot);
      for (const check of [true, false])
        await expect(api.compileWorkspace({ ...s, check })).rejects.toThrow(
          /MV-E124-SHAPE.*controlTimer/u,
        );
      expect(await observe(s.workspaceRoot)).toStrictEqual(before);
    });
  },
);
