import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import type { RawEventCommand } from "../src/compiler/types.js";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { createMinimalProject, withWindowsSandbox } from "./support/windows-sandbox.js";
import { blankEvent, blankPage } from "./support/map-event-fixtures.js";
import { recordEvidence } from "./support/mv-evidence.js";

const api: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);

afterEach(async ({ task }) => {
  const requirementId = /^MV-S6-CHOICES-\d{3}/u.exec(task.name)?.[0];
  if (!requirementId) throw new Error(`Missing Choices evidence identity: ${task.name}`);
  const failure = task.result?.errors?.[0];
  await recordEvidence({
    requirementId,
    startedAt: new Date(task.result?.startTime ?? Date.now()).toISOString(),
    stages: [
      "Independent literal native inputs from the accepted E102 and child-body contract",
      "Actual Workspace Discovery, generated source evaluation, Check, Compile, Diff and Push as applicable",
      "Complete saved data, numeric signs, precise diagnostics and business-state assertions",
    ],
    expected:
      "All linked Choices assertions hold; this automatic run does not claim editor UI or game execution.",
    actual: {
      test: task.name,
      assertionErrors: task.result?.errors ?? [],
      entry: process.env.MV_CLI_ENTRY ?? "source",
    },
    ...(failure === undefined ? {} : { error: new Error(JSON.stringify(failure)) }),
  });
});

it.each([
  { name: "native positive zero", kind: "native", cancel: "0", defaultChoice: "0" },
  { name: "native cancel negative zero", kind: "native", cancel: "-0", defaultChoice: "0" },
  { name: "native default negative zero", kind: "native", cancel: "0", defaultChoice: "-0" },
  { name: "native both negative zero", kind: "native", cancel: "-0", defaultChoice: "-0" },
  { name: "formal positive zero", kind: "formal", cancel: "0", defaultChoice: "0" },
  { name: "formal cancel negative zero", kind: "formal", cancel: "-0", defaultChoice: "0" },
  { name: "formal default negative zero", kind: "formal", cancel: "0", defaultChoice: "-0" },
])(
  "MV-S6-CHOICES-006: preserves numeric saved choice indices through Workspace $name",
  async ({ kind, cancel, defaultChoice }) => {
    await withWindowsSandbox("choices-numeric-indices", async ({ workspaceRoot }) => {
      await createMinimalProject(workspaceRoot);
      const expected = JSON.parse(
        `[null,{"id":1,"name":"Numeric saved indices","trigger":0,"switchId":1,"list":[{"code":102,"indent":0,"parameters":[[""],${cancel},${defaultChoice},2,0]},{"code":402,"indent":0,"parameters":[0,""]},{"code":0,"indent":1,"parameters":[]},{"code":404,"indent":0,"parameters":[]},{"code":0,"indent":0,"parameters":[]}]}]`,
      );
      const live = join(workspaceRoot, "Game/data/CommonEvents.json");
      if (kind === "native")
        await writeFile(
          live,
          `[null,{"id":1,"name":"Numeric saved indices","trigger":0,"switchId":1,"list":[{"code":102,"indent":0,"parameters":[[""],${cancel},${defaultChoice},2,0]},{"code":402,"indent":0,"parameters":[0,""]},{"code":0,"indent":1,"parameters":[]},{"code":404,"indent":0,"parameters":[]},{"code":0,"indent":0,"parameters":[]}]}]`,
        );
      await api.initWorkspace({ workspaceRoot, projectRoot: "./Game" });
      await api.cloneWorkspace({ workspaceRoot });
      await api.decompileWorkspace({ workspaceRoot });
      if (kind === "formal")
        await writeFile(
          join(workspaceRoot, "src/decompiled/common-events.events.ts"),
          `import {commonEvent,showChoices} from "rpgmaker-event-dsl";export const event=commonEvent({id:1,name:"Numeric saved indices",trigger:"none",commands:[showChoices({choices:[{text:"",commands:[]}],cancel:{kind:"choice",index:${cancel}},defaultChoice:{kind:"choice",index:${defaultChoice}}})]});`,
        );
      else {
        const source = await readFile(
          join(workspaceRoot, "src/decompiled/common-events.events.ts"),
          "utf8",
        );
        expect(source).not.toContain("rawDslCommand");
        if (cancel === "-0") expect(source).toContain('cancel: { kind: "choice", index: -0 }');
        if (defaultChoice === "-0")
          expect(source).toContain('defaultChoice: { kind: "choice", index: -0 }');
        else expect(source).not.toContain("defaultChoice:");
      }
      const before = await business(workspaceRoot);
      await api.compileWorkspace({ workspaceRoot, check: true });
      expect(await business(workspaceRoot)).toStrictEqual(before);
      await api.compileWorkspace({ workspaceRoot, check: false });
      expect(
        JSON.parse(
          await readFile(
            join(workspaceRoot, ".rpgmaker-event-dsl/generated-project-data/CommonEvents.json"),
            "utf8",
          ),
        ),
      ).toStrictEqual(expected);
      await api.diffWorkspace({ workspaceRoot });
      await api.pushWorkspace({ workspaceRoot, allowDestructive: false });
      const actual = JSON.parse(await readFile(live, "utf8"));
      expect(actual).toStrictEqual(expected);
      expect(Object.is(actual[1].list[0].parameters[1], JSON.parse(cancel))).toBe(true);
      expect(Object.is(actual[1].list[0].parameters[2], JSON.parse(defaultChoice))).toBe(true);
    });
  },
);

async function tree(root: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const entry of await readdir(root, { withFileTypes: true }).catch(() => [])) {
    if (entry.name === "operation.lock") continue;
    if (entry.isDirectory()) {
      for (const [file, bytes] of Object.entries(await tree(join(root, entry.name))))
        result[entry.name + "/" + file] = bytes;
    } else result[entry.name] = (await readFile(join(root, entry.name))).toString("hex");
  }
  return result;
}
async function business(workspaceRoot: string) {
  const config = await readFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8");
  const { discoverDefinitionFiles } = await import("../src/workspace/definitions.js");
  return {
    config,
    source: await tree(join(workspaceRoot, "src")),
    project: await tree(join(workspaceRoot, "Game")),
    state: await tree(join(workspaceRoot, ".rpgmaker-event-dsl")),
    discovery: await discoverDefinitionFiles(workspaceRoot, JSON.parse(config)),
  };
}

function nativeText(value: unknown): string {
  if (typeof value === "number" && Object.is(value, -0)) return "-0";
  if (Array.isArray(value)) return "[" + value.map(nativeText).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.entries(value)
        .map(([key, item]) => JSON.stringify(key) + ":" + nativeText(item))
        .join(",") +
      "}"
    );
  return JSON.stringify(value);
}

async function data(root: string) {
  return Object.fromEntries(
    await Promise.all(
      (await readdir(root))
        .sort()
        .map(async (name) => [name, JSON.parse(await readFile(join(root, name), "utf8"))]),
    ),
  );
}

async function nativeChoicesProject(workspaceRoot: string) {
  const fixture = await createMinimalProject(workspaceRoot);
  const choices = JSON.parse(
    await readFile(
      new URL("./fixtures/mv-evidence/choices-complete.json", import.meta.url),
      "utf8",
    ),
  );
  const troop = JSON.parse(
    await readFile(
      new URL("./fixtures/mv-evidence/troop-event-project.json", import.meta.url),
      "utf8",
    ),
  );
  const carriers = {
    ...fixture.projectFiles,
    "CommonEvents.json": [
      null,
      {
        id: 1,
        name: "Saved Choices",
        trigger: 0,
        switchId: 1,
        list: structuredClone(choices.list),
      },
    ],
    "MapInfos.json": [null, { id: 1, name: "Choices Map" }],
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
          pages: [{ ...blankPage, list: structuredClone(choices.list) }],
        },
      ],
    },
    "Troops.json": [
      null,
      { ...troop.carrier, pages: [{ ...troop.defaultPage, list: structuredClone(choices.list) }] },
    ],
  };
  for (const [name, value] of Object.entries(carriers))
    await writeFile(join(workspaceRoot, "Game/data", name), nativeText(value));
  await api.initWorkspace({ workspaceRoot, projectRoot: "./Game" });
  await api.cloneWorkspace({ workspaceRoot });
  return carriers;
}

it("MV-S6-CHOICES-011: independent Choices roundtrip all three containers and install exact complete carriers", async () => {
  await withWindowsSandbox("choices-three-containers", async (s) => {
    const carriers = await nativeChoicesProject(s.workspaceRoot);
    await api.decompileWorkspace(s);
    const discovery = (await business(s.workspaceRoot)).discovery;
    const sources = await Promise.all(discovery.map((path) => readFile(path, "utf8")));
    const choiceSources = sources.filter((source) => source.includes("showChoices"));
    expect(choiceSources).toHaveLength(3);
    for (const source of choiceSources) {
      expect(source).not.toContain("rawDslCommand");
      expect(source).toContain('cancel: { kind: "choice", index: -0 }');
      expect(source).toContain('defaultChoice: { kind: "choice", index: -0 }');
      expect(source).toContain('endMarker: "absent"');
    }
    const before = await business(s.workspaceRoot);
    await api.compileWorkspace({ ...s, check: true });
    expect(await business(s.workspaceRoot)).toStrictEqual(before);
    await api.compileWorkspace({ ...s, check: false });
    expect(
      await data(join(s.workspaceRoot, ".rpgmaker-event-dsl/generated-project-data")),
    ).toStrictEqual({
      "CommonEvents.json": carriers["CommonEvents.json"],
      "Map001.json": carriers["Map001.json"],
      "System.json": carriers["System.json"],
      "Troops.json": carriers["Troops.json"],
    });
    expect(await api.diffWorkspace({ ...s, short: true })).toContain("No changes.");
    const expected = structuredClone(carriers);
    expected["CommonEvents.json"][1].name = "Installed Choices";
    expected["Map001.json"].events[1].name = "Installed Map";
    expected["Troops.json"][1].pages[0].list.unshift({
      code: 108,
      indent: 0,
      parameters: ["Installed Choices"],
    });
    for (const [index, path] of discovery.entries()) {
      let source = sources[index]!.replace(
        'name: "Saved Choices"',
        'name: "Installed Choices"',
      ).replace('name: "Saved Map"', 'name: "Installed Map"');
      if (source.includes("troopEvent("))
        source = `import {comment} from "rpgmaker-event-dsl";\n${source.replace("commands: [", 'commands: [comment(["Installed Choices"]),')}`;
      await writeFile(path, source);
    }
    const edited = await business(s.workspaceRoot);
    await api.compileWorkspace({ ...s, check: true });
    expect(await business(s.workspaceRoot)).toStrictEqual(edited);
    await api.compileWorkspace({ ...s, check: false });
    expect(await api.diffWorkspace({ ...s, short: true })).not.toContain("No changes.");
    await api.pushWorkspace({ ...s, allowDestructive: false });
    const actual = await data(join(s.workspaceRoot, "Game/data"));
    expect(Object.keys(actual)).toHaveLength(15);
    expect(actual).toStrictEqual(expected);
  });
}, 30_000);

it.each(["CommonEvents.json", "Map001.json", "Troops.json"])(
  "MV-S6-CHOICES-012: invalid native mirror has a precise diagnostic and preserves complete state (%s)",
  async (carrier) => {
    await withWindowsSandbox("choices-three-container-rejection", async (s) => {
      await nativeChoicesProject(s.workspaceRoot);
      const file = join(s.workspaceRoot, "Game/data", carrier);
      const value = JSON.parse(await readFile(file, "utf8"));
      const list =
        carrier === "CommonEvents.json"
          ? value[1].list
          : carrier === "Map001.json"
            ? value.events[1].pages[0].list
            : value[1].pages[0].list;
      list[1].parameters[1] = "contradictory mirror";
      await writeFile(file, nativeText(value));
      await api.pullWorkspace(s);
      const before = await business(s.workspaceRoot);
      for (let retry = 0; retry < 2; retry++) {
        await expect(api.decompileWorkspace(s)).rejects.toMatchObject({
          code: "MV-CHOICE-MIRROR",
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
                ? "list[1].parameters"
                : "pages[0].list[1].parameters",
          },
        });
        expect(await business(s.workspaceRoot)).toStrictEqual(before);
      }
    });
  },
);

const completeChoices = [
  null,
  {
    id: 1,
    name: "Nested Choices",
    trigger: 0,
    switchId: 1,
    list: [
      { code: 102, indent: 0, parameters: [[" first\r\n", ""], -2, 5, 0, 2] },
      { code: 402, indent: 0, parameters: [0, " first\r\n"] },
      { code: 102, indent: 1, parameters: [[""], -1, -1, 1, 1] },
      { code: 402, indent: 1, parameters: [0, ""] },
      { code: 0, indent: 2, parameters: [] },
      { code: 404, indent: 1, parameters: [] },
      { code: 0, indent: 1, parameters: [] },
      { code: 402, indent: 0, parameters: [1, ""] },
      { code: 230, indent: 1, parameters: [1] },
      { code: 403, indent: 0, parameters: [6, null] },
      { code: 0, indent: 1, parameters: [] },
      { code: 404, indent: 0, parameters: [] },
      { code: 0, indent: 0, parameters: [] },
    ],
  },
];

it("MV-S6-CHOICES-007: round trips native cancel and nested body markers through discovered source and a real Push replacement", async () => {
  await withWindowsSandbox("choices-roundtrip", async ({ workspaceRoot }) => {
    await createMinimalProject(workspaceRoot);
    const live = join(workspaceRoot, "Game/data/CommonEvents.json");
    const seeded = structuredClone(completeChoices);
    seeded[1]!.name = "Seed name";
    await writeFile(live, JSON.stringify(seeded));
    await api.initWorkspace({ workspaceRoot, projectRoot: "./Game" });
    await api.cloneWorkspace({ workspaceRoot });
    await api.decompileWorkspace({ workspaceRoot });
    const file = join(workspaceRoot, "src/decompiled/common-events.events.ts");
    const source = await readFile(file, "utf8");
    expect(source).not.toContain("rawDslCommand");
    expect(source).toContain('endMarker: "absent"');
    expect(source).toContain('kind: "branch"');
    await writeFile(file, source.replace('"Seed name"', '"Nested Choices"'));
    await api.compileWorkspace({ workspaceRoot, check: true });
    await api.compileWorkspace({ workspaceRoot, check: false });
    expect(await api.diffWorkspace({ workspaceRoot })).toContain("CommonEvents.json");
    await api.pushWorkspace({ workspaceRoot, allowDestructive: false });
    expect(JSON.parse(await readFile(live, "utf8"))).toStrictEqual(completeChoices);
    expect(
      JSON.parse(
        await readFile(
          join(workspaceRoot, ".rpgmaker-event-dsl/generated-project-data/CommonEvents.json"),
          "utf8",
        ),
      ),
    ).toStrictEqual(completeChoices);
  });
});

it("MV-S6-CHOICES-008: preserves the fixed one-choice defaults through actual source evaluation and Push", async () => {
  await withWindowsSandbox("choices-default", async ({ workspaceRoot }) => {
    await createMinimalProject(workspaceRoot);
    await api.initWorkspace({ workspaceRoot, projectRoot: "./Game" });
    await api.cloneWorkspace({ workspaceRoot });
    await api.decompileWorkspace({ workspaceRoot });
    await writeFile(
      join(workspaceRoot, "src/decompiled/common-events.events.ts"),
      'import {commonEvent,showChoices} from "rpgmaker-event-dsl"; export const event=commonEvent({id:1,name:"Choices",trigger:"none",commands:[showChoices({choices:[{text:"",commands:[]}]})]});',
    );
    const warning = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await api.compileWorkspace({ workspaceRoot, check: true });
      await api.compileWorkspace({ workspaceRoot, check: false });
      expect(warning.mock.calls.flat().join("\n")).toMatch(/MV-CHOICE-INDEX.*parameters\[1\]/u);
    } finally {
      warning.mockRestore();
    }
    await api.diffWorkspace({ workspaceRoot });
    await api.pushWorkspace({ workspaceRoot, allowDestructive: false });
    expect(
      JSON.parse(await readFile(join(workspaceRoot, "Game/data/CommonEvents.json"), "utf8")),
    ).toStrictEqual([
      null,
      {
        id: 1,
        name: "Choices",
        trigger: 0,
        switchId: 1,
        list: [
          { code: 102, indent: 0, parameters: [[""], 1, 0, 2, 0] },
          { code: 402, indent: 0, parameters: [0, ""] },
          { code: 0, indent: 1, parameters: [] },
          { code: 404, indent: 0, parameters: [] },
          { code: 0, indent: 0, parameters: [] },
        ],
      },
    ]);
  });
});

it("MV-S6-CHOICES-009: rejects a removed field passed through a typed local constant without publishing output", async () => {
  await withWindowsSandbox("choices-owned-shape", async ({ workspaceRoot }) => {
    await createMinimalProject(workspaceRoot);
    await api.initWorkspace({ workspaceRoot, projectRoot: "./Game" });
    await api.cloneWorkspace({ workspaceRoot });
    await api.decompileWorkspace({ workspaceRoot });
    const file = join(workspaceRoot, "src/decompiled/common-events.events.ts");
    await writeFile(
      file,
      'import {commonEvent,showChoices} from "rpgmaker-event-dsl"; const input={choices:[{text:"",commands:[]}],cancelType:0} as const;export const event=commonEvent({id:1,name:"Invalid",trigger:"none",commands:[showChoices(input)]});',
    );
    const before = await business(workspaceRoot);
    for (const check of [true, false]) {
      await expect(api.compileWorkspace({ workspaceRoot, check })).rejects.toThrow(
        /MV-CHOICES.*unsupported field cancelType/u,
      );
      expect(await business(workspaceRoot)).toStrictEqual(before);
    }
  });
});

it.each([
  { name: "mirror", code: "MV-CHOICE-MIRROR", path: "list[1].parameters" },
  { name: "cancel", code: "MV-CHOICE-CANCEL", path: "list[9]" },
  { name: "ordinal -0", code: "MV-COMMAND-PARAMETERS", path: "list[1].parameters[0]" },
] as const)(
  "MV-S6-CHOICES-009: refuses native $name before publication and preserves all Workspace business bytes on retry",
  async ({ name, code, path }) => {
    await withWindowsSandbox("choices-invalid-native", async ({ workspaceRoot }) => {
      await createMinimalProject(workspaceRoot);
      const events = structuredClone(completeChoices);
      if (name === "mirror") events[1]!.list[1]!.parameters[1] = "wrong";
      if (name === "cancel") events[1]!.list.splice(9, 2);
      let text = JSON.stringify(events);
      if (name === "ordinal -0") text = text.replace('"parameters":[0,', '"parameters":[-0,');
      await writeFile(join(workspaceRoot, "Game/data/CommonEvents.json"), text);
      await api.initWorkspace({ workspaceRoot, projectRoot: "./Game" });
      await api.cloneWorkspace({ workspaceRoot });
      const before = await business(workspaceRoot);
      for (let retry = 0; retry < 2; retry++) {
        await expect(api.decompileWorkspace({ workspaceRoot })).rejects.toMatchObject({
          code,
          identity: "commonEvent:1",
          stage: "decompile",
          location: { nativePath: path },
        });
        expect(await business(workspaceRoot)).toStrictEqual(before);
      }
    });
  },
);

it("MV-S6-CHOICES-010: keeps nested saved scripts intact while Check and Compile both enforce Gate before writing", async () => {
  await withWindowsSandbox("choices-script-gate", async ({ workspaceRoot }) => {
    await createMinimalProject(workspaceRoot);
    const events = [
      null,
      {
        id: 1,
        name: "Gate bodies",
        trigger: 0,
        switchId: 1,
        list: [
          { code: 102, indent: 0, parameters: [[""], -2, 0, 2, 0] },
          { code: 402, indent: 0, parameters: [0, ""] },
          { code: 355, indent: 1, parameters: [""] },
          { code: 0, indent: 1, parameters: [] },
          { code: 403, indent: 0, parameters: [6, null] },
          { code: 355, indent: 1, parameters: [" "] },
          { code: 0, indent: 1, parameters: [] },
          { code: 404, indent: 0, parameters: [] },
          { code: 0, indent: 0, parameters: [] },
        ],
      },
    ];
    await writeFile(join(workspaceRoot, "Game/data/CommonEvents.json"), JSON.stringify(events));
    await api.initWorkspace({ workspaceRoot, projectRoot: "./Game" });
    await api.cloneWorkspace({ workspaceRoot });
    await api.decompileWorkspace({ workspaceRoot });
    const before = await business(workspaceRoot);
    for (const check of [true, false]) {
      await expect(api.compileWorkspace({ workspaceRoot, check })).rejects.toThrow(
        /MV-SCRIPT-GATE.*list\[2\].parameters\[0\]/u,
      );
      expect(await business(workspaceRoot)).toStrictEqual(before);
    }
    const config = JSON.parse(before.config);
    config.scriptEnabled = true;
    await writeFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), JSON.stringify(config));
    await api.compileWorkspace({ workspaceRoot, check: true });
    await api.compileWorkspace({ workspaceRoot, check: false });
    await api.diffWorkspace({ workspaceRoot });
    await api.pushWorkspace({ workspaceRoot, allowDestructive: false });
    expect(
      JSON.parse(await readFile(join(workspaceRoot, "Game/data/CommonEvents.json"), "utf8")),
    ).toStrictEqual(events);
  });
});

it("MV-S6-CHOICES-007: round trips all one-to-six item lists, empty text slots and named saved modes through real Workspace sources", async () => {
  await withWindowsSandbox("choices-count-modes", async ({ workspaceRoot }) => {
    await createMinimalProject(workspaceRoot);
    // Independent native inputs from the accepted E102 slot table, never compiler output.
    const headers = [
      [[""], 1, 0, 2, 0],
      [["a", ""], 0, 1, 0, 2],
      [["a", "", ""], -1, -1, 1, 1],
      [[" \t", "\r", "\n", ""], 2, 3, 2, 2],
      [["a", "b", "c", "d", ""], 5, 5, 1, 0],
      [["", " ", "\r", "\n", "\r\n", ""], -2, 4, 0, 1],
    ];
    const events = [
      null,
      ...headers.map((header, eventIndex) => {
        const list: RawEventCommand[] = [{ code: 102, indent: 0, parameters: header }];
        (header[0] as string[]).forEach((text, index) => {
          list.push({ code: 402, indent: 0, parameters: [index, text] });
          if (index % 2 === 1) list.push({ code: 230, indent: 1, parameters: [index] });
          if (index % 2 === 0 || index % 3 !== 1) list.push({ code: 0, indent: 1, parameters: [] });
        });
        if (eventIndex === 5)
          list.push(
            { code: 403, indent: 0, parameters: [6, null] },
            { code: 230, indent: 1, parameters: [1] },
          );
        list.push({ code: 404, indent: 0, parameters: [] }, { code: 0, indent: 0, parameters: [] });
        return {
          id: eventIndex + 1,
          name: `Choices ${eventIndex + 1}`,
          trigger: 0,
          switchId: 1,
          list,
        };
      }),
    ];
    const live = join(workspaceRoot, "Game/data/CommonEvents.json");
    await writeFile(live, JSON.stringify(events));
    await api.initWorkspace({ workspaceRoot, projectRoot: "./Game" });
    await api.cloneWorkspace({ workspaceRoot });
    await api.decompileWorkspace({ workspaceRoot });
    const source = await readFile(
      join(workspaceRoot, "src/decompiled/common-events.events.ts"),
      "utf8",
    );
    expect(source).not.toMatch(/rawDslCommand|cancelType|defaultType|cancelBranch|positionType/u);
    await api.compileWorkspace({ workspaceRoot, check: true });
    await api.compileWorkspace({ workspaceRoot, check: false });
    expect(
      JSON.parse(
        await readFile(
          join(workspaceRoot, ".rpgmaker-event-dsl/generated-project-data/CommonEvents.json"),
          "utf8",
        ),
      ),
    ).toStrictEqual(events);
    await api.diffWorkspace({ workspaceRoot });
    await api.pushWorkspace({ workspaceRoot, allowDestructive: false });
    expect(JSON.parse(await readFile(live, "utf8"))).toStrictEqual(events);
  });
});
