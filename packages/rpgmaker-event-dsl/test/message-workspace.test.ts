import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import { discoverDefinitionFiles } from "../src/workspace/definitions.js";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { createMinimalProject, withWindowsSandbox } from "./support/windows-sandbox.js";
import { blankEvent, blankPage } from "./support/map-event-fixtures.js";
import { recordEvidence } from "./support/mv-evidence.js";

const api: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const end = { code: 0, indent: 0, parameters: [] };

// Independently authored saved records; never obtained from the compiler under test.
const messageList = [
  { code: 101, indent: 0, parameters: ["", 11, 2, 1] },
  { code: 401, indent: 0, parameters: [""] },
  { code: 401, indent: 0, parameters: [" A\r"] },
  { code: 401, indent: 0, parameters: ["  "] },
  { code: 401, indent: 0, parameters: [""] },
  { code: 101, indent: 0, parameters: ["UnscannedFace", 8, 0, 2] },
  { code: 401, indent: 0, parameters: ["face"] },
  { code: 103, indent: 0, parameters: [1, 1] },
  { code: 103, indent: 0, parameters: [2, 8] },
  { code: 104, indent: 0, parameters: [2, 1] },
  { code: 104, indent: 0, parameters: [2, 2] },
  { code: 104, indent: 0, parameters: [2, 3] },
  { code: 104, indent: 0, parameters: [2, 4] },
  { code: 105, indent: 0, parameters: [1, true] },
  { code: 405, indent: 0, parameters: [""] },
  { code: 105, indent: 0, parameters: [8, false] },
  { code: 405, indent: 0, parameters: ["A\r"] },
  { code: 405, indent: 0, parameters: [""] },
  { code: 405, indent: 0, parameters: ["B"] },
  { code: 405, indent: 0, parameters: ["C"] },
  { code: 405, indent: 0, parameters: ["D"] },
  { code: 405, indent: 0, parameters: ["E"] },
  { code: 405, indent: 0, parameters: [""] },
  { code: 108, indent: 0, parameters: ["one"] },
  { code: 108, indent: 0, parameters: [""] },
  { code: 408, indent: 0, parameters: [" A\r"] },
  { code: 408, indent: 0, parameters: ["  "] },
  { code: 408, indent: 0, parameters: ["B"] },
  { code: 408, indent: 0, parameters: ["C"] },
  { code: 408, indent: 0, parameters: [""] },
  end,
];
const battlePage = {
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
  list: messageList,
};

async function tree(root: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const entry of (await readdir(root, { withFileTypes: true }).catch(() => [])).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    if (entry.name === "operation.lock") continue;
    if (entry.isDirectory()) {
      result[`${entry.name}/`] = "directory";
      for (const [key, value] of Object.entries(await tree(join(root, entry.name))))
        result[`${entry.name}/${key}`] = value;
    } else result[entry.name] = (await readFile(join(root, entry.name))).toString("hex");
  }
  return result;
}
async function observe(workspaceRoot: string) {
  const config = await readFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8");
  const state = await tree(join(workspaceRoot, ".rpgmaker-event-dsl"));
  delete state["decompile-candidates/"];
  return {
    config,
    discovery: await discoverDefinitionFiles(workspaceRoot, JSON.parse(config)),
    source: await tree(join(workspaceRoot, "src")),
    project: await tree(join(workspaceRoot, "Game")),
    state,
  };
}
async function messageEvidence(
  id: string,
  label: string,
  body: Parameters<typeof withWindowsSandbox>[1],
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
          "Actual discovered TypeScript source evaluation and public Workspace operations on isolated synthetic Windows filesystem",
        ],
        expected:
          "Exact independent message records and complete Map/Common/Troop carriers; unchanged source, project, snapshot, generated output, manifest and Discovery on rejected or Check-only operations",
        actual: {
          finalState: await observe(sandbox.workspaceRoot),
          processes: sandbox.processes,
          entry: sandbox.cliEntry,
        },
        ...(failure === undefined ? {} : { error: failure }),
      });
    }
  });
}
async function prepare(
  workspaceRoot: string,
  lists: { map?: unknown[]; common?: unknown[]; troop?: unknown[] } = {},
) {
  const fixture = await createMinimalProject(workspaceRoot);
  const files = {
    "System.json": { ...fixture.projectFiles["System.json"], variables: ["", "", ""] },
    "MapInfos.json": [null, { id: 1, name: "Messages Map" }],
    "Map001.json": {
      width: 17,
      height: 13,
      tilesetId: 1,
      external: { untouched: true },
      events: [
        null,
        {
          ...blankEvent,
          name: "Messages Map",
          pages: [{ ...blankPage, list: lists.map ?? messageList }],
        },
      ],
    },
    "CommonEvents.json": [
      null,
      {
        id: 1,
        name: "Messages Common",
        trigger: 0,
        switchId: 1,
        list: lists.common ?? messageList,
      },
    ],
    "Troops.json": [
      null,
      {
        id: 1,
        name: "Messages Troop",
        members: [],
        external: { untouched: true },
        pages: [{ ...battlePage, list: lists.troop ?? messageList }],
      },
    ],
  };
  for (const [file, data] of Object.entries(files))
    await writeFile(join(workspaceRoot, "Game/data", file), JSON.stringify(data));
  await api.initWorkspace({ workspaceRoot, projectRoot: "./Game" });
  await api.cloneWorkspace({ workspaceRoot });
  return files;
}

it("MV-S6-MESSAGE-001: discovers and evaluates generated formal messages in Map/Common/Troop before exact Compile/Diff/Push", async () => {
  await messageEvidence("MV-S6-MESSAGE-001", "message-complete", async ({ workspaceRoot }) => {
    const files = await prepare(workspaceRoot);
    await api.decompileWorkspace({ workspaceRoot });
    const config = JSON.parse(
      await readFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8"),
    );
    const sources = await discoverDefinitionFiles(workspaceRoot, config);
    expect(sources.length).toBeGreaterThanOrEqual(3);
    const common = sources.find((file) => file.endsWith("common-events.events.ts"))!;
    const source = await readFile(common, "utf8");
    expect(source).not.toContain("rawDslCommand");
    expect(source).toContain('itemType: "hiddenB"');
    await writeFile(
      common,
      source.replace('name: "Messages Common"', 'name: "Messages installed"'),
    );
    const before = await observe(workspaceRoot);
    await api.compileWorkspace({ workspaceRoot, check: true });
    expect(await observe(workspaceRoot)).toStrictEqual(before);
    await api.compileWorkspace({ workspaceRoot, check: false });
    const expectedCommon = [null, { ...files["CommonEvents.json"][1], name: "Messages installed" }];
    for (const [file, expected] of Object.entries({
      ...files,
      "CommonEvents.json": expectedCommon,
    })) {
      if (file === "MapInfos.json") continue;
      const generated = JSON.parse(
        await readFile(
          join(workspaceRoot, ".rpgmaker-event-dsl/generated-project-data", file),
          "utf8",
        ),
      );
      expect(generated).toStrictEqual(expected);
    }
    expect(await api.diffWorkspace({ workspaceRoot })).toContain("[changed] commonEventId 1");
    await api.pushWorkspace({ workspaceRoot, allowDestructive: false });
    for (const [file, expected] of Object.entries({
      ...files,
      "CommonEvents.json": expectedCommon,
    }))
      expect(
        JSON.parse(await readFile(join(workspaceRoot, "Game/data", file), "utf8")),
      ).toStrictEqual(expected);
    expect(await api.diffWorkspace({ workspaceRoot })).toContain(
      "Affected Project Data Files:\n- none",
    );
  });
}, 30000);

it("MV-S6-MESSAGE-002: rejects helper-before-copy and forged messages without changing complete Workspace business state", async () => {
  await messageEvidence(
    "MV-S6-MESSAGE-002",
    "message-authored-rejection",
    async ({ workspaceRoot }) => {
      await prepare(workspaceRoot);
      await api.decompileWorkspace({ workspaceRoot });
      await api.compileWorkspace({ workspaceRoot, check: false });
      const file = join(workspaceRoot, "src/decompiled/common-events.events.ts");
      for (const command of [
        "showText(input)",
        '{kind:"showText", ...input}',
        "inputNumber({variable:variableRef({id:3}),digits:8})",
        "selectItem({variable:variableRef({id:2}),itemType:undefined} as any)",
        'comment({lines:["a\\nb"]})',
        'showScrollingText({lines:[""],speed:9,noFastForward:false})',
        'rawDslCommand({code:101,parameters:["",2147483648,0,2]})',
      ]) {
        await writeFile(
          file,
          `import {commonEvent,showText,inputNumber,selectItem,variableRef,comment,showScrollingText,rawDslCommand} from "rpgmaker-event-dsl";
const input={lines:[""] as [string],face:{image:null,index:0},background:"window" as const,position:"bottom" as const,extra:true};
export const messages=commonEvent({id:1,name:"Bad",trigger:"none",commands:[${command}]});`,
        );
        const before = await observe(workspaceRoot);
        for (const check of [true, false])
          await expect(api.compileWorkspace({ workspaceRoot, check })).rejects.toThrow(
            /MV-E10[13458]|MV-COMMAND-PARAMETERS/,
          );
        expect(await observe(workspaceRoot)).toStrictEqual(before);
        await expect(
          api.pushWorkspace({ workspaceRoot, allowDestructive: false }),
        ).rejects.toThrow();
        expect(await observe(workspaceRoot)).toStrictEqual(before);
      }
    },
  );
}, 60000);

it.each(["map", "common", "troop"] as const)(
  "MV-S6-MESSAGE-003: rejects invalid saved %s messages before source publication",
  async (carrier) => {
    await messageEvidence(
      "MV-S6-MESSAGE-003",
      `message-native-${carrier}`,
      async ({ workspaceRoot }) => {
        await prepare(workspaceRoot, {
          [carrier]: [
            { code: 101, indent: 0, parameters: ["", 0, 0, 2] },
            { code: 401, indent: 0, parameters: ["a\nb"] },
            end,
          ],
        });
        await mkdir(join(workspaceRoot, "src"), { recursive: true });
        await writeFile(
          join(workspaceRoot, "src/retained.events.ts"),
          "export const retained = 42;\n",
        );
        const before = await observe(workspaceRoot);
        await expect(api.decompileWorkspace({ workspaceRoot })).rejects.toThrow(
          /MV-MESSAGE-LINE.*parameters\[0\]/,
        );
        expect(await observe(workspaceRoot)).toStrictEqual(before);
      },
    );
  },
  30000,
);

it("MV-S6-MESSAGE-004: rejects omitted or positional public message fields in actual TypeScript source", async () => {
  await messageEvidence("MV-S6-MESSAGE-004", "message-public-types", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    await api.decompileWorkspace({ workspaceRoot });
    const file = join(workspaceRoot, "src/decompiled/common-events.events.ts");
    for (const command of [
      'showText({lines:[""]})',
      "inputNumber({variable:variableRef({id:1})})",
      "selectItem({variable:variableRef({id:1}),itemType:2})",
      'showScrollingText({lines:[""],speed:2})',
      'comment([""])',
    ]) {
      await writeFile(
        file,
        `import {commonEvent,showText,inputNumber,selectItem,showScrollingText,comment,variableRef} from "rpgmaker-event-dsl";export const invalid=commonEvent({id:1,name:"Bad types",trigger:"none",commands:[${command}]});`,
      );
      const before = await observe(workspaceRoot);
      for (const check of [true, false])
        await expect(api.compileWorkspace({ workspaceRoot, check })).rejects.toThrow(
          /TypeScript diagnostics/,
        );
      expect(await observe(workspaceRoot)).toStrictEqual(before);
    }
  });
}, 60000);
