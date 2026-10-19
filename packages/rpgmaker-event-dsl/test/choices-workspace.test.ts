import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it, vi } from "vitest";
import type { RawEventCommand } from "../src/compiler/types.js";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { createMinimalProject, withWindowsSandbox } from "./support/windows-sandbox.js";

const api: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);

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

it("round trips native cancel and nested body markers through discovered source and a real Push replacement", async () => {
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

it("preserves the fixed one-choice defaults through actual source evaluation and Push", async () => {
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

it("rejects a removed field passed through a typed local constant without publishing output", async () => {
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
  "refuses native $name before publication and preserves all Workspace business bytes on retry",
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

it("keeps nested saved scripts intact while Check and Compile both enforce Gate before writing", async () => {
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

it("round trips all one-to-six item lists, empty text slots and named saved modes through real Workspace sources", async () => {
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
