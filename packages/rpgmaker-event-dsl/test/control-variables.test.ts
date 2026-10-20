import { expect, it } from "vitest";
import { commonEvent, controlVariables, variableRef } from "../src/index.js";
import { compileCommonEvent } from "../src/compiler/events.js";
import { buildStagedDataGraph, validateStagedDataGraph } from "../src/validation/staged-graph.js";
import { rawDslCommand } from "../src/index.js";
import { renderDecompiledCommandList } from "../src/decompiler/dispatch.js";
import { scriptInput } from "../src/index.js";
import { battlePage, troopEvent } from "../src/index.js";
import {
  operandCases,
  operationCases,
  rejectedNativeCases,
  variableReferences,
} from "./support/control-variable-cases.js";
import { readRawCommandList } from "../src/decompiler/core.js";
import { verifyVariableEvidence } from "./support/control-variable-evidence.js";

it("MV-S6-VARIABLES-001: records independent E122 modes, all Game Data statuses, numeric saved values and known raw rejection", async () =>
  verifyVariableEvidence("001", () => {
    for (const [operation, code] of operationCases)
      for (const kind of ["constant", "variable", "random", "gameData", "script"] as const) {
        const operand = operandCases.find(({ value }) => value.kind === kind)!;
        const event = commonEvent({
          id: 1,
          name: "Evidence operation modes",
          trigger: "none",
          commands: [
            controlVariables({
              variable: {
                kind: "referenceRange",
                from: variableRef({ id: 1 }),
                to: variableRef({ id: 3 }),
              },
              operation,
              value: operand.value,
            }),
          ],
        });
        const graph = buildStagedDataGraph({
          declarations: [event],
          snapshotReferences: variableReferences,
        });
        expect(
          validateStagedDataGraph(graph, { scriptEnabled: true }).issues.filter(
            ({ level }) => level === "error",
          ),
        ).toEqual([]);
        expect(compileCommonEvent(event, { nextId: 1, resolver: graph.resolver }).list).toEqual([
          { code: 122, indent: 0, parameters: [1, 3, code, ...operand.slots] },
          { code: 0, indent: 0, parameters: [] },
        ]);
      }
    for (const { value, slots } of operandCases) {
      const event = commonEvent({
        id: 1,
        name: "Evidence",
        trigger: "none",
        commands: [controlVariables({ variable: variableRef({ id: 1 }), operation: "set", value })],
      });
      const graph = buildStagedDataGraph({
        declarations: [event],
        snapshotReferences: variableReferences,
      });
      expect(compileCommonEvent(event, { nextId: 1, resolver: graph.resolver }).list).toEqual([
        { code: 122, indent: 0, parameters: [1, 1, 0, ...slots] },
        { code: 0, indent: 0, parameters: [] },
      ]);
    }
    for (const { slots, path } of rejectedNativeCases)
      expect(() =>
        readRawCommandList(
          [
            { code: 122, indent: 0, parameters: slots },
            { code: 0, indent: 0, parameters: [] },
          ],
          "commonEvent:1",
        ),
      ).toThrow(`list[0].parameters${path}`);
    return {
      independentOperandCases: operandCases.length,
      rejectedNativeCases: rejectedNativeCases.length,
      operationsByOperandModes: 30,
      native: "not-executed",
    };
  }));

for (const [operation, code] of operationCases)
  for (const kind of ["constant", "variable", "random", "gameData", "script"] as const) {
    const operand = operandCases.find(({ value }) => value.kind === kind)!;
    it(`encodes ${operation} with ${kind} at the native public command boundary`, () => {
      const event = commonEvent({
        id: 1,
        name: "Six by five",
        trigger: "none",
        commands: [
          controlVariables({
            variable: {
              kind: "referenceRange",
              from: variableRef({ id: 1 }),
              to: variableRef({ id: 3 }),
            },
            operation,
            value: operand.value,
          }),
        ],
      });
      const graph = buildStagedDataGraph({
        declarations: [event],
        snapshotReferences: variableReferences,
      });
      expect(
        validateStagedDataGraph(graph, { scriptEnabled: true }).issues.filter(
          ({ level }) => level === "error",
        ),
      ).toEqual([]);
      expect(compileCommonEvent(event, { nextId: 1, resolver: graph.resolver }).list).toEqual([
        { code: 122, indent: 0, parameters: [1, 3, code, ...operand.slots] },
        { code: 0, indent: 0, parameters: [] },
      ]);
    });
  }

it.each(operandCases)(
  "preserves $label through formal encoding and known raw decoding",
  ({ value, slots }) => {
    const event = commonEvent({
      id: 1,
      name: "All Game Data statuses",
      trigger: "none",
      commands: [controlVariables({ variable: variableRef({ id: 1 }), operation: "set", value })],
    });
    const graph = buildStagedDataGraph({
      declarations: [event],
      snapshotReferences: variableReferences,
    });
    const native = [
      { code: 122, indent: 0, parameters: [1, 1, 0, ...slots] },
      { code: 0, indent: 0, parameters: [] },
    ];
    expect(compileCommonEvent(event, { nextId: 1, resolver: graph.resolver }).list).toEqual(native);
    expect(renderDecompiledCommandList(native).source).not.toContain("rawDslCommand");
  },
);

it.each(rejectedNativeCases)("rejects native $label at the exact saved slot", ({ slots, path }) => {
  const native = [
    { code: 122, indent: 0, parameters: slots },
    { code: 0, indent: 0, parameters: [] },
  ];
  expect(() => readRawCommandList(native, "commonEvent:1")).toThrow(`list[0].parameters${path}`);
  const event = commonEvent({
    id: 1,
    name: "Known raw validation",
    trigger: "none",
    commands: [rawDslCommand({ code: 122, parameters: slots })],
  });
  const graph = buildStagedDataGraph({
    declarations: [event],
    snapshotReferences: variableReferences,
  });
  expect(() => compileCommonEvent(event, { nextId: 1, resolver: graph.resolver })).toThrow(
    /MV-E122/,
  );
});

it.each([
  [0, 1],
  [1, 2],
  [2, 0, 1],
  [3, 7, 0, 0],
  [4, ""],
])("rejects missing or stale tail slots for operand %j", (...slots) => {
  for (const parameters of [[1, 1, 0, ...slots].slice(0, -1), [1, 1, 0, ...slots, 0]])
    expect(() =>
      readRawCommandList(
        [
          { code: 122, indent: 0, parameters },
          { code: 0, indent: 0, parameters: [] },
        ],
        "commonEvent:1",
      ),
    ).toThrow(/MV-E122-PARAMETERS/);
});

it.each([
  1,
  variableRef({ id: 2 }),
  null,
  undefined,
  { kind: "constant", value: 1, extra: true },
  { kind: "constant", value: 100000000 },
  { kind: "constant", value: NaN },
  { kind: "random", from: 2, to: 1 },
  { kind: "random", from: 0, to: Infinity },
  { kind: "variable", variable: { kind: "actor", id: 1 } },
  { kind: "gameData", source: "actor", actor: { kind: "actor", id: 1 }, value: "tp" },
  { kind: "gameData", source: "enemy", enemyIndex: 0, value: "hp" },
  { kind: "gameData", source: "character", characterId: 0, value: "mapX" },
  { kind: "gameData", source: "party", memberIndex: 0 },
  {
    kind: "gameData",
    source: "enemy",
    enemy: { kind: "runtimeSelector", scope: "enemy", target: "all" },
    value: "hp",
  },
  {
    kind: "gameData",
    source: "enemy",
    enemy: { kind: "runtimeSelector", scope: "enemy", target: "enemy", index: 8 },
    value: "hp",
  },
  {
    kind: "gameData",
    source: "character",
    target: { kind: "runtimeSelector", scope: "character", target: "follower", id: 1 },
    value: "mapX",
  },
  {
    kind: "gameData",
    source: "party",
    member: { kind: "runtimeSelector", scope: "enemy", target: "enemy", index: 0 },
  },
  { kind: "gameData", source: "item", item: { kind: "item", id: 1 }, includeEquipment: true },
  { kind: "script", script: { kind: "scriptInput", code: "", extra: true } },
])("rejects untyped operand %j without normalizing it", (value) => {
  expect(() =>
    controlVariables({ variable: variableRef({ id: 1 }), operation: "set", value } as never),
  ).toThrow(/MV-(DSL-SHAPE|E122-INPUT)/);
  const node = {
    kind: "controlVariables",
    variable: variableRef({ id: 1 }),
    operation: "set",
    value,
  };
  const event = commonEvent({
    id: 1,
    name: "Untyped direct input",
    trigger: "none",
    commands: [node as never],
  });
  const graph = buildStagedDataGraph({
    declarations: [event],
    snapshotReferences: variableReferences,
  });
  expect(
    validateStagedDataGraph(graph, { scriptEnabled: true }).issues.some(
      ({ level }) => level === "error",
    ),
  ).toBe(true);
});

for (const targetKind of ["variable", "referenceRange"] as const)
  for (const shape of ["accessor", "inherited", "non-enumerable"] as const)
    for (const entry of ["helper", "graph", "compile"] as const)
      it(`rejects original ${shape} ${targetKind} target through ${entry} without reading its discriminator`, () => {
        let reads = 0;
        const target: Record<string, unknown> =
          targetKind === "variable"
            ? { id: 1 }
            : { from: variableRef({ id: 1 }), to: variableRef({ id: 1 }) };
        const descriptor =
          shape === "non-enumerable"
            ? { value: targetKind, enumerable: false }
            : {
                enumerable: true,
                configurable: true,
                get() {
                  reads++;
                  Object.defineProperty(target, "kind", {
                    value: targetKind,
                    enumerable: true,
                    configurable: true,
                  });
                  return targetKind;
                },
              };
        if (shape === "inherited")
          Object.setPrototypeOf(target, Object.create(Object.prototype, { kind: descriptor }));
        else Object.defineProperty(target, "kind", descriptor);
        const input = {
          variable: target,
          operation: "set",
          value: { kind: "constant", value: 1 },
        };
        if (entry === "helper")
          expect(() => controlVariables(input as never)).toThrow(/MV-DSL-SHAPE/);
        else {
          const event = commonEvent({
            id: 1,
            name: "Original target shape",
            trigger: "none",
            commands: [{ kind: "controlVariables", ...input } as never],
          });
          const graph = buildStagedDataGraph({
            declarations: [event],
            snapshotReferences: { variableCapacity: 1 },
          });
          if (entry === "graph")
            expect(validateStagedDataGraph(graph, { scriptEnabled: false }).issues).toContainEqual(
              expect.objectContaining({
                level: "error",
                code: "MV-DSL-SHAPE",
                dslPath: "commands[0].variable",
              }),
            );
          else
            expect(() =>
              compileCommonEvent(event, { nextId: 1, resolver: graph.resolver }),
            ).toThrow(/MV-DSL-SHAPE/);
        }
        expect(reads).toBe(0);
      });

it("reports malformed untyped targets without throwing out of the validation API", () => {
  const event = commonEvent({
    id: 1,
    name: "Malformed target",
    trigger: "none",
    commands: [
      {
        kind: "controlVariables",
        variable: null,
        operation: "set",
        value: { kind: "constant", value: 1 },
      } as never,
    ],
  });
  const graph = buildStagedDataGraph({
    declarations: [event],
    snapshotReferences: variableReferences,
  });
  expect(validateStagedDataGraph(graph, { scriptEnabled: true }).issues).toContainEqual(
    expect.objectContaining({ level: "error", dslPath: "commands[0].variable" }),
  );
});

it("rejects untyped Script Input helper fields before they can disappear", () => {
  expect(() => scriptInput({ code: "", ignored: 1 } as never)).toThrow(/MV-DSL-SHAPE/);
});

it("keeps the precise known raw parameter suffix in the DSL diagnostic", () => {
  const event = commonEvent({
    id: 1,
    name: "Raw padding",
    trigger: "none",
    commands: [rawDslCommand({ code: 122, parameters: [1, 1, 0, 3, 7, 0, -0] })],
  });
  const graph = buildStagedDataGraph({
    declarations: [event],
    snapshotReferences: variableReferences,
  });
  expect(validateStagedDataGraph(graph, { scriptEnabled: true }).issues).toContainEqual(
    expect.objectContaining({ code: "MV-E122-PADDING", dslPath: "commands[0].parameters[6]" }),
  );
});

it("compiles the named constant operand to the exact five saved slots", () => {
  const event = commonEvent({
    id: 1,
    name: "Variables",
    trigger: "none",
    commands: [
      controlVariables({
        variable: variableRef({ id: 1 }),
        operation: "add",
        value: { kind: "constant", value: -0 },
      } as never),
    ],
  });
  const graph = buildStagedDataGraph({
    declarations: [event],
    snapshotReferences: { variableCapacity: 1 },
  });
  expect(compileCommonEvent(event, { nextId: 1, resolver: graph.resolver }).list).toEqual([
    { code: 122, indent: 0, parameters: [1, 1, 1, 0, -0] },
    { code: 0, indent: 0, parameters: [] },
  ]);
});

it("warns for absent runtime members in a known Troop while keeping Common Event context open", () => {
  const command = controlVariables({
    variable: variableRef({ id: 1 }),
    operation: "set",
    value: {
      kind: "gameData",
      source: "enemy",
      enemy: { kind: "runtimeSelector", scope: "enemy", target: "enemy", index: 7 },
      value: "hp",
    },
  });
  const common = commonEvent({ id: 1, name: "Reusable", trigger: "none", commands: [command] });
  const troop = troopEvent({ troopId: 1, pages: [battlePage({ commands: [command] })] });
  const graph = buildStagedDataGraph({
    declarations: [common, troop],
    snapshotReferences: { variableCapacity: 1, troops: [{ id: 1, name: "" }] },
    snapshotTroops: [{ id: 1, members: [] }],
  });
  const warnings = validateStagedDataGraph(graph, { scriptEnabled: true }).issues.filter(
    ({ code }) => code === "MV-E122-RUNTIME-TARGET",
  );
  expect(warnings).toEqual([
    expect.objectContaining({
      identity: "troop:1",
      nativePath: "pages[0].list[0].parameters[5]",
      dslPath: "pages[0].commands[0].value.enemy.index",
      level: "warning",
    }),
  ]);
});

it("warns when skipped Enemy entries shift or remove a Game Data runtime position", () => {
  const commands = [
    controlVariables({
      variable: variableRef({ id: 1 }),
      operation: "set",
      value: {
        kind: "gameData",
        source: "enemy",
        enemy: { kind: "runtimeSelector", scope: "enemy", target: "enemy", index: 0 },
        value: "hp",
      },
    }),
    rawDslCommand({ code: 122, parameters: [1, 1, 0, 3, 4, 1, 0] }),
  ];
  const event = troopEvent({ troopId: 1, pages: [battlePage({ commands })] });
  const graph = buildStagedDataGraph({
    declarations: [event],
    snapshotReferences: {
      variableCapacity: 1,
      troops: [{ id: 1, name: "Troop" }],
      enemies: [{ id: 1, name: "Valid Enemy" }],
    },
    snapshotTroops: [{ id: 1, members: [{ enemyId: 999 }, { enemyId: 1, hidden: true }] }],
  });
  const warnings = validateStagedDataGraph(graph, { scriptEnabled: true }).issues.filter(
    ({ code }) => code === "MV-E122-RUNTIME-TARGET",
  );
  expect(warnings).toEqual([
    expect.objectContaining({
      nativePath: "pages[0].list[0].parameters[5]",
      dslPath: "pages[0].commands[0].value.enemy.index",
      message: expect.stringMatching(/skips.*Enemy/),
    }),
    expect.objectContaining({
      nativePath: "pages[0].list[1].parameters[5]",
      dslPath: "pages[0].commands[1].parameters[5]",
      message: expect.stringMatching(/returns 0/),
    }),
  ]);
  const hiddenGraph = buildStagedDataGraph({
    declarations: [troopEvent({ troopId: 1, pages: [battlePage({ commands: [commands[0]!] })] })],
    snapshotReferences: {
      variableCapacity: 1,
      troops: [{ id: 1, name: "Troop" }],
      enemies: [{ id: 1, name: "Valid Enemy" }],
    },
    snapshotTroops: [{ id: 1, members: [{ enemyId: 1, hidden: true }] }],
  });
  expect(
    validateStagedDataGraph(hiddenGraph, { scriptEnabled: true }).issues.filter(
      ({ code }) => code === "MV-E122-RUNTIME-TARGET",
    ),
  ).toEqual([]);
});

it("warns about single-slot script CR/LF while preserving the complete text", () => {
  const event = commonEvent({
    id: 1,
    name: "Script text",
    trigger: "none",
    commands: [
      controlVariables({
        variable: variableRef({ id: 1 }),
        operation: "set",
        value: { kind: "script", script: scriptInput({ code: "  1\r\n+2\n" }) },
      }),
    ],
  });
  const graph = buildStagedDataGraph({
    declarations: [event],
    snapshotReferences: { variableCapacity: 1 },
  });
  const issues = validateStagedDataGraph(graph, { scriptEnabled: true }).issues;
  expect(issues).toContainEqual(
    expect.objectContaining({
      code: "MV-TEXT-RECONFIRMATION",
      level: "warning",
      dslPath: "commands[0].value.script.code",
      nativePath: "list[0].parameters[4]",
    }),
  );
  expect(
    compileCommonEvent(event, { nextId: 1, resolver: graph.resolver }).list[0]?.parameters[4],
  ).toBe("  1\r\n+2\n");
});

it("locates an untyped direct command's missing source variable at its actual DSL position", () => {
  const event = commonEvent({
    id: 1,
    name: "Invalid source",
    trigger: "none",
    commands: [
      {
        kind: "controlVariables",
        variable: variableRef({ id: 1 }),
        operation: "set",
        value: { kind: "variable", variable: variableRef({ id: 9 }) },
      },
    ],
  });
  const graph = buildStagedDataGraph({
    declarations: [event],
    snapshotReferences: { variableCapacity: 2 },
  });
  expect(validateStagedDataGraph(graph, { scriptEnabled: true }).issues).toContainEqual(
    expect.objectContaining({ code: "MV-E122-INPUT", dslPath: "commands[0].value.variable" }),
  );
});

it("validates the named variable operand against its source slot", () => {
  const event = commonEvent({
    id: 1,
    name: "Variable source",
    trigger: "none",
    commands: [
      controlVariables({
        variable: variableRef({ id: 1 }),
        operation: "set",
        value: { kind: "variable", variable: variableRef({ id: 2 }) },
      }),
    ],
  });
  const graph = buildStagedDataGraph({
    declarations: [event],
    snapshotReferences: { variableCapacity: 2 },
  });
  expect(validateStagedDataGraph(graph, { scriptEnabled: true }).issues).toEqual([]);
});

it("renders numeric negative zero in named operands and explicit position selectors", () => {
  const rendered = renderDecompiledCommandList([
    { code: 122, indent: 0, parameters: [1, 1, 0, 0, -0] },
    { code: 122, indent: 0, parameters: [1, 1, 0, 3, 4, -0, 0] },
    { code: 122, indent: 0, parameters: [1, 1, 0, 3, 6, -0, 0] },
    { code: 0, indent: 0, parameters: [] },
  ]);
  expect(rendered.source).toContain('value: { kind: "constant", value: -0 }');
  expect(rendered.source).toContain(
    'enemy: { kind: "runtimeSelector", scope: "enemy", target: "enemy", index: -0 }',
  );
  expect(rendered.source).toContain(
    'member: { kind: "runtimeSelector", scope: "party", target: "member", index: -0 }',
  );
});

it("rejects untyped helper extras and invalid native Game Data padding before they are discarded", () => {
  expect(() =>
    controlVariables({
      variable: variableRef({ id: 1 }),
      operation: "set",
      value: { kind: "constant", value: 1 },
      extra: true,
    } as never),
  ).toThrow(/MV-DSL-SHAPE/);
  const event = commonEvent({
    id: 1,
    name: "Invalid padding",
    trigger: "none",
    commands: [rawDslCommand({ code: 122, parameters: [1, 1, 0, 3, 0, 1, 9] })],
  });
  const graph = buildStagedDataGraph({
    declarations: [event],
    snapshotReferences: { variableCapacity: 1 },
  });
  expect(() => compileCommonEvent(event, { nextId: 1, resolver: graph.resolver })).toThrow(
    /MV-E122-PADDING/,
  );
});

it("encodes enemy, character and party Game Data using distinct Runtime Selectors", () => {
  const event = commonEvent({
    id: 1,
    name: "Selectors",
    trigger: "none",
    commands: [
      controlVariables({
        variable: variableRef({ id: 1 }),
        operation: "set",
        value: {
          kind: "gameData",
          source: "enemy",
          enemy: { kind: "runtimeSelector", scope: "enemy", target: "enemy", index: -0 },
          value: "hp",
        },
      } as never),
      controlVariables({
        variable: variableRef({ id: 1 }),
        operation: "set",
        value: {
          kind: "gameData",
          source: "character",
          target: { kind: "runtimeSelector", scope: "character", target: "currentEvent" },
          value: "screenY",
        },
      } as never),
      controlVariables({
        variable: variableRef({ id: 1 }),
        operation: "set",
        value: {
          kind: "gameData",
          source: "party",
          member: { kind: "runtimeSelector", scope: "party", target: "member", index: 7 },
        },
      } as never),
    ],
  });
  const graph = buildStagedDataGraph({
    declarations: [event],
    snapshotReferences: { variableCapacity: 1 },
  });
  expect(compileCommonEvent(event, { nextId: 1, resolver: graph.resolver }).list).toEqual([
    { code: 122, indent: 0, parameters: [1, 1, 0, 3, 4, -0, 0] },
    { code: 122, indent: 0, parameters: [1, 1, 0, 3, 5, 0, 4] },
    { code: 122, indent: 0, parameters: [1, 1, 0, 3, 6, 7, 0] },
    { code: 0, indent: 0, parameters: [] },
  ]);
});
