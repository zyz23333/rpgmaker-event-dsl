import { deepStrictEqual } from "node:assert/strict";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { expect, it } from "vitest";

import {
  cloneWorkspace,
  compileWorkspace,
  decompileWorkspace,
  diffWorkspace,
  initWorkspace,
  pushWorkspace,
} from "../src/workspace-api.js";
import { createMinimalProject, withWindowsSandbox } from "./support/windows-sandbox.js";
import {
  changeItems,
  commonEvent,
  conditional,
  controlSelfSwitch,
  controlSwitches,
  inputNumber,
  itemRef,
  mapEvent,
  page,
  rawDslCommand,
  switchDefinition,
  switchRef,
  variableRef,
} from "../src/index.js";
import {
  buildSnapshotReferenceInput,
  buildStagedDataGraph,
  validateDslOwnedDeclarations,
} from "../src/validation/staged-graph.js";
import { compileCommonEvent } from "../src/compiler/events.js";
import { renderDecompiledCommandList } from "../src/decompiler/dispatch.js";
import { readRequirements, recordEvidence } from "./support/mv-evidence.js";

function evidenceIt(name: string, verify: () => Promise<unknown> | unknown, timeout?: number) {
  it(
    name,
    async () => {
      const requirementId = name.split(":")[0]!;
      const startedAt = new Date().toISOString();
      const expected = (await readRequirements()).requirements.find(
        ({ id }) => id === requirementId,
      )!.expected;
      const stages = [
        "independent literal input",
        "public Workspace or staged validation boundary",
        "strict equality and diagnostic/file-state assertions",
      ];
      try {
        const actual = await verify();
        await recordEvidence({ requirementId, startedAt, stages, expected, actual });
      } catch (error) {
        await recordEvidence({
          requirementId,
          startedAt,
          stages,
          expected,
          actual: "Verification did not complete",
          error,
        });
        throw error;
      }
    },
    timeout,
  );
}

evidenceIt(
  "MV-S3-SLOTS-003: rejects missing native switch references before publishing Decompiled Source",
  async () => {
    let actual: unknown;
    await withWindowsSandbox("system-slots-invalid", async (sandbox) => {
      await createMinimalProject(sandbox.workspaceRoot);
      const projectData = join(sandbox.workspaceRoot, "Game", "data");
      const common = [
        null,
        {
          id: 1,
          name: "Invalid fixed switch",
          trigger: 0,
          switchId: 1,
          list: [
            { code: 121, indent: 0, parameters: [1, 3, 0] },
            { code: 0, indent: 0, parameters: [] },
          ],
        },
      ];
      await writeFile(join(projectData, "CommonEvents.json"), JSON.stringify(common));
      await initWorkspace({ workspaceRoot: sandbox.workspaceRoot, projectRoot: "./Game" });
      await cloneWorkspace({ workspaceRoot: sandbox.workspaceRoot });
      const stateRoot = join(sandbox.workspaceRoot, ".rpgmaker-event-dsl");
      const manifest = await readFile(join(stateRoot, "sync-manifest.json"), "utf8");
      const snapshot = await readFile(
        join(stateRoot, "project-data-snapshot", "CommonEvents.json"),
        "utf8",
      );
      await writeFile(join(sandbox.workspaceRoot, "src", "user.events.ts"), "export {};\n");
      await expect(decompileWorkspace({ workspaceRoot: sandbox.workspaceRoot })).rejects.toThrow(
        /Unknown switch reference id: 3/u,
      );
      await expect(decompileWorkspace({ workspaceRoot: sandbox.workspaceRoot })).rejects.toThrow(
        /decompile common event 1\.list\[0\]: MV-E121-REFERENCE parameters\[1\]/u,
      );
      expect(await readdir(join(sandbox.workspaceRoot, "src"))).toEqual(["user.events.ts"]);
      expect(await readFile(join(sandbox.workspaceRoot, "src", "user.events.ts"), "utf8")).toBe(
        "export {};\n",
      );
      expect(await readFile(join(stateRoot, "sync-manifest.json"), "utf8")).toBe(manifest);
      expect(
        await readFile(join(stateRoot, "project-data-snapshot", "CommonEvents.json"), "utf8"),
      ).toBe(snapshot);
      deepStrictEqual(
        JSON.parse(await readFile(join(projectData, "CommonEvents.json"), "utf8")),
        common,
      );
      actual = {
        rejected: "Unknown switch reference id: 3",
        source: await readdir(join(sandbox.workspaceRoot, "src")),
        projectCommonEvents: common,
        snapshotUnchanged: true,
        manifestUnchanged: true,
      };
    });
    return actual;
  },
);

evidenceIt(
  "MV-S3-SWITCH-001: validates formal and recognized raw switch commands without normalizing malformed native input",
  async () => {
    const fixture = JSON.parse(
      await readFile(
        new URL("./fixtures/mv-evidence/system-slots-project.json", import.meta.url),
        "utf8",
      ),
    );
    const snapshotReferences = buildSnapshotReferenceInput({
      system: fixture.projectFiles["System.json"],
    });
    const commands = [
      controlSwitches({
        switch: { kind: "referenceRange", from: switchRef({ id: 1 }), to: switchRef({ id: 3 }) },
        value: true,
      }),
      controlSwitches({ switch: switchRef({ id: 2 }), value: false }),
      controlSelfSwitch({ selfSwitch: "A", value: true }),
      controlSelfSwitch({ selfSwitch: "A", value: false }),
      controlSelfSwitch({ selfSwitch: "B", value: true }),
      controlSelfSwitch({ selfSwitch: "B", value: false }),
      controlSelfSwitch({ selfSwitch: "C", value: true }),
      controlSelfSwitch({ selfSwitch: "C", value: false }),
      controlSelfSwitch({ selfSwitch: "D", value: true }),
      controlSelfSwitch({ selfSwitch: "D", value: false }),
    ];
    const formal = commonEvent({ id: 1, name: "System slot evidence", trigger: "none", commands });
    const graph = buildStagedDataGraph({ declarations: [formal], snapshotReferences });
    deepStrictEqual(
      compileCommonEvent(formal, { nextId: 1, resolver: graph.resolver }),
      fixture.projectFiles["CommonEvents.json"][1],
    );
    const native = fixture.projectFiles["CommonEvents.json"][1].list;
    expect(
      validateDslOwnedDeclarations(
        [
          {
            ...formal,
            commands: [
              conditional({
                condition: { kind: "switch", switch: switchRef({ id: 1 }), value: true },
                then: [
                  controlSelfSwitch({ selfSwitch: "A", value: undefined as unknown as boolean }),
                ],
              }),
            ],
          },
        ],
        { scriptEnabled: false, snapshotReferences },
      ).issues.map(({ message }) => message),
    ).toContain(
      "MV-E123-VALUE validation common event 1.commands[0].then[0].value: expected explicit boolean; received undefined.",
    );
    expect(
      validateDslOwnedDeclarations(
        [
          mapEvent({
            mapId: 1,
            id: 2,
            name: "Map diagnostic",
            x: 0,
            y: 0,
            pages: [
              page({
                commands: [
                  controlSelfSwitch({ selfSwitch: "A", value: undefined as unknown as boolean }),
                ],
              }),
            ],
          }),
        ],
        { scriptEnabled: false, snapshotReferences },
      ).issues.map(({ message }) => message),
    ).toContain(
      "MV-E123-VALUE validation map 1 event 2.pages[0].commands[0].value: expected explicit boolean; received undefined.",
    );
    const raw = {
      ...formal,
      commands: native
        .slice(0, -1)
        .map((record: { code: number; indent: number; parameters: unknown[] }) =>
          rawDslCommand(record),
        ),
    };
    expect(
      validateDslOwnedDeclarations([raw], { scriptEnabled: false, snapshotReferences }).issues,
    ).toEqual([]);
    deepStrictEqual(
      compileCommonEvent(raw, { nextId: 1, resolver: graph.resolver }),
      fixture.projectFiles["CommonEvents.json"][1],
    );
    const malformed = [
      { code: 121, indent: 0, parameters: [3, 1, 0] },
      { code: 121, indent: 0, parameters: [0, 1, 0] },
      { code: 121, indent: 0, parameters: [-1, 1, 0] },
      { code: 121, indent: 0, parameters: [1, 1.5, 0] },
      { code: 121, indent: 0, parameters: [1, 1, true] },
      { code: 121, indent: 0, parameters: [1, 1, 2] },
      { code: 121, indent: 0, parameters: [1, 1] },
      { code: 121, indent: 0, parameters: [1, 1, 0, 99] },
      { code: 123, indent: 0, parameters: ["E", 0] },
      { code: 123, indent: 0, parameters: [null, 0] },
      { code: 123, indent: 0, parameters: ["A", false] },
      { code: 123, indent: 0, parameters: ["A", 2] },
      { code: 123, indent: 0, parameters: ["A"] },
      { code: 123, indent: 0, parameters: ["A", 0, null] },
    ];
    for (const record of malformed) {
      const issues = validateDslOwnedDeclarations(
        [{ ...formal, commands: [rawDslCommand(record)] }],
        { scriptEnabled: false, snapshotReferences },
      ).issues;
      expect(
        issues.some(({ level }) => level === "error"),
        JSON.stringify(record),
      ).toBe(true);
      expect(issues[0]!.message).toContain(
        `MV-E${record.code}-RAW validation common event 1.commands[0].parameters:`,
      );
      expect(() => renderDecompiledCommandList([record]), JSON.stringify(record)).toThrow(
        /MV-E12[13]/u,
      );
    }
    for (const node of [
      controlSwitches({
        switch: { kind: "referenceRange", from: switchRef({ id: 3 }), to: switchRef({ id: 1 }) },
        value: true,
      }),
      controlSelfSwitch({ selfSwitch: "E" as "A", value: true }),
      controlSelfSwitch({ selfSwitch: "A", value: undefined as unknown as boolean }),
      controlSwitches({ switch: switchRef({ id: 1 }), value: undefined as unknown as boolean }),
      rawDslCommand({ code: 121, parameters: [1, 4, 0] }),
    ]) {
      expect(
        validateDslOwnedDeclarations([{ ...formal, commands: [node] }], {
          scriptEnabled: false,
          snapshotReferences,
        }).issues.some(({ level }) => level === "error"),
      ).toBe(true);
    }
    return {
      formal: compileCommonEvent(formal, { nextId: 1, resolver: graph.resolver }),
      recognizedRaw: compileCommonEvent(raw, { nextId: 1, resolver: graph.resolver }),
      malformedRejected: malformed,
    };
  },
);

evidenceIt(
  "MV-S3-SLOTS-002: separates actual empty-name IDs, unnamed slots and DSL-only name resolution",
  () => {
    const snapshotReferences = buildSnapshotReferenceInput({
      items: [null, { id: 1, name: "" }],
      system: {
        switches: ["", "Snapshot switch", "", ""],
        variables: ["", "Snapshot variable", ""],
      },
    });
    const event = commonEvent({
      id: 1,
      name: "References",
      trigger: "none",
      commands: [
        controlSwitches({
          switch: { kind: "referenceRange", from: switchRef({ id: 1 }), to: switchRef({ id: 3 }) },
          value: true,
        }),
        inputNumber({ variable: variableRef({ id: 2 }), digits: 1 }),
        changeItems({
          item: itemRef({ id: 1 }),
          operation: "gain",
          amount: { kind: "constant", value: 1 },
        }),
      ],
    });
    expect(
      validateDslOwnedDeclarations([event], { scriptEnabled: false, snapshotReferences }).issues,
    ).toEqual([]);
    const invalid = [
      controlSwitches({ switch: switchRef({ id: 4 }), value: false }),
      controlSwitches({ switch: switchRef({ name: "Snapshot switch" }), value: true }),
      inputNumber({ variable: variableRef({ id: 3 }), digits: 1 }),
      changeItems({
        item: itemRef({ id: 2 }),
        operation: "gain",
        amount: { kind: "constant", value: 1 },
      }),
    ];
    const issues = validateDslOwnedDeclarations([{ ...event, commands: invalid }], {
      scriptEnabled: false,
      snapshotReferences,
    }).issues;
    expect(issues.map(({ message }) => message)).toEqual([
      "MV-E121-REFERENCE validation common event 1.commands[0].switch: Unknown switch reference id: 4",
      "MV-E121-REFERENCE validation common event 1.commands[1].switch: Unknown switch reference: Snapshot switch",
      "Unknown variable reference id: 3",
      'compile error common event 1: MV-E126-INPUT: Invalid inventory or party command input. (commands[3].item); expected existing uniquely resolved item reference; actual "Unknown item reference id: 2"',
    ]);
    expect(
      validateDslOwnedDeclarations(
        [
          switchDefinition({ id: 5, name: "Duplicate" }),
          switchDefinition({ id: 6, name: "Duplicate" }),
          {
            ...event,
            commands: [controlSwitches({ switch: switchRef({ name: "Duplicate" }), value: true })],
          },
        ],
        { scriptEnabled: false, snapshotReferences },
      ).issues.map(({ message }) => message),
    ).toEqual([
      "MV-E121-REFERENCE validation common event 1.commands[0].switch: Ambiguous switch reference: Duplicate",
    ]);
    return {
      accepted: "unnamed switches 1..3, unnamed variable 2, actual empty-name item 1",
      invalidMessages: issues.map(({ message }) => message),
      duplicateName: "Ambiguous switch reference: Duplicate",
    };
  },
);

evidenceIt(
  "MV-S3-SLOTS-001: preserves unnamed System capacity through real Workspace roundtrip and name removal",
  async () => {
    let actual: unknown;
    await withWindowsSandbox("system-slots", async (sandbox) => {
      const fixture = JSON.parse(
        await readFile(
          new URL("./fixtures/mv-evidence/system-slots-project.json", import.meta.url),
          "utf8",
        ),
      );
      await createMinimalProject(sandbox.workspaceRoot);
      for (const [name, value] of Object.entries(fixture.projectFiles)) {
        await writeFile(join(sandbox.workspaceRoot, "Game", "data", name), JSON.stringify(value));
      }
      await initWorkspace({ workspaceRoot: sandbox.workspaceRoot, projectRoot: "./Game" });
      await cloneWorkspace({ workspaceRoot: sandbox.workspaceRoot });
      await decompileWorkspace({ workspaceRoot: sandbox.workspaceRoot });
      await compileWorkspace({ workspaceRoot: sandbox.workspaceRoot, check: true });
      await compileWorkspace({ workspaceRoot: sandbox.workspaceRoot, check: false });
      const stateRoot = join(sandbox.workspaceRoot, ".rpgmaker-event-dsl");
      const readGenerated = async (name: string) =>
        JSON.parse(await readFile(join(stateRoot, "generated-project-data", name), "utf8"));
      deepStrictEqual(await readGenerated("System.json"), fixture.projectFiles["System.json"]);
      deepStrictEqual(
        await readGenerated("CommonEvents.json"),
        fixture.projectFiles["CommonEvents.json"],
      );
      expect(await diffWorkspace({ workspaceRoot: sandbox.workspaceRoot, short: true })).toContain(
        "No changes.",
      );
      await writeFile(
        join(sandbox.workspaceRoot, "src", "decompiled", "system.dsl.ts"),
        `import { switchDefinition, variableDefinition } from "rpgmaker-event-dsl";
export const addedSwitch = switchDefinition({ id: 5, name: "Extended switch" });
export const addedVariable = variableDefinition({ id: 4, name: "Extended variable" });
`,
      );
      await compileWorkspace({ workspaceRoot: sandbox.workspaceRoot, check: false });
      const expected = {
        ...fixture.projectFiles["System.json"],
        switches: ["", "", "", "", "", "Extended switch"],
        variables: ["", "", "", "", "Extended variable"],
      };
      deepStrictEqual(await readGenerated("System.json"), expected);
      expect(await diffWorkspace({ workspaceRoot: sandbox.workspaceRoot, short: false })).toContain(
        "snapshot-only",
      );
      await pushWorkspace({ workspaceRoot: sandbox.workspaceRoot, allowDestructive: true });
      deepStrictEqual(
        JSON.parse(
          await readFile(join(sandbox.workspaceRoot, "Game", "data", "System.json"), "utf8"),
        ),
        expected,
      );
      deepStrictEqual(
        JSON.parse(await readFile(join(stateRoot, "project-data-snapshot", "System.json"), "utf8")),
        expected,
      );
      expect(await diffWorkspace({ workspaceRoot: sandbox.workspaceRoot, short: true })).toContain(
        "No changes.",
      );
      await writeFile(
        join(sandbox.workspaceRoot, "src", "decompiled", "system.dsl.ts"),
        "export {};\n",
      );
      await writeFile(
        join(sandbox.workspaceRoot, "src", "unnamed.events.ts"),
        `import { commonEvent, inputNumber, variableRef, changeItems, itemRef } from "rpgmaker-event-dsl";
export const unnamedReferences = commonEvent({ id: 2, name: "Unnamed references", trigger: "none", commands: [
  inputNumber({ variable: variableRef({ id: 4 }), digits: 1 }),
  changeItems({ item: itemRef({ id: 1 }), operation: "gain", amount: { kind: "constant", value: 1 } }),
] });
`,
      );
      await compileWorkspace({ workspaceRoot: sandbox.workspaceRoot, check: false });
      const unnamed = {
        ...expected,
        switches: ["", "", "", "", "", ""],
        variables: ["", "", "", "", ""],
      };
      deepStrictEqual(await readGenerated("System.json"), unnamed);
      const expectedCommon = [
        ...fixture.projectFiles["CommonEvents.json"],
        {
          id: 2,
          name: "Unnamed references",
          trigger: 0,
          switchId: 1,
          list: [
            { code: 103, indent: 0, parameters: [4, 1] },
            { code: 126, indent: 0, parameters: [1, 0, 0, 1] },
            { code: 0, indent: 0, parameters: [] },
          ],
        },
      ];
      deepStrictEqual(await readGenerated("CommonEvents.json"), expectedCommon);
      deepStrictEqual(
        JSON.parse(
          await readFile(join(sandbox.workspaceRoot, "Game", "data", "Items.json"), "utf8"),
        ),
        fixture.projectFiles["Items.json"],
      );
      await pushWorkspace({ workspaceRoot: sandbox.workspaceRoot, allowDestructive: true });
      deepStrictEqual(
        JSON.parse(
          await readFile(join(sandbox.workspaceRoot, "Game", "data", "System.json"), "utf8"),
        ),
        unnamed,
      );
      deepStrictEqual(
        JSON.parse(await readFile(join(stateRoot, "project-data-snapshot", "System.json"), "utf8")),
        unnamed,
      );
      expect(await diffWorkspace({ workspaceRoot: sandbox.workspaceRoot, short: true })).toContain(
        "No changes.",
      );
      actual = {
        system: await readGenerated("System.json"),
        commonEvents: await readGenerated("CommonEvents.json"),
        item: fixture.projectFiles["Items.json"],
        finalDiff: await diffWorkspace({ workspaceRoot: sandbox.workspaceRoot, short: true }),
        snapshotMatchesProject: true,
      };
      const manifest = JSON.parse(await readFile(join(stateRoot, "sync-manifest.json"), "utf8"));
      expect(
        manifest.compileBaseline.sourceFiles
          .map(({ relativePath }: { relativePath: string }) => relativePath)
          .sort(),
      ).toEqual([
        "src/decompiled/common-events.events.ts",
        "src/decompiled/system.dsl.ts",
        "src/decompiled/troop-events.events.ts",
        "src/unnamed.events.ts",
      ]);
      expect(
        manifest.generatedFiles.map(({ relativePath }: { relativePath: string }) => relativePath),
      ).toEqual(["CommonEvents.json", "System.json", "Troops.json"]);
      expect(
        manifest.generatedFiles.filter(
          ({ relativePath }: { relativePath: string }) => relativePath !== "Troops.json",
        ),
      ).toEqual(
        manifest.snapshotFiles.filter(({ relativePath }: { relativePath: string }) =>
          ["CommonEvents.json", "System.json"].includes(relativePath),
        ),
      );
    });
    return actual;
  },
  30_000,
);
