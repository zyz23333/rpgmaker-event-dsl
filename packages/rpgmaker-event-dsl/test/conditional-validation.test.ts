import { expect, it } from "vitest";
import { commonEvent, conditional, rawDslCommand } from "../src/index.js";
import { compileCommonEvent } from "../src/compiler/events.js";
import { renderDecompiledCommandList } from "../src/decompiler/dispatch.js";
import {
  buildStagedDataGraph,
  validateDslOwnedDeclarations,
} from "../src/validation/staged-graph.js";
import { conditionCases } from "./support/conditional-cases.js";

const good = {
  condition: { kind: "switch", switch: { kind: "switch", id: 1 }, value: true },
  then: { commands: [] },
};
const resolver = buildStagedDataGraph({
  declarations: [],
  snapshotReferences: { switchCapacity: 2 },
}).resolver;
const invalidInputs: Array<[string, unknown, string]> = [
  ["unknown helper key", { ...good, extra: undefined }, "conditional.extra"],
  ["missing condition", { then: { commands: [] } }, "conditional.condition"],
  ["null condition", { ...good, condition: null }, "conditional.condition"],
  ["unknown mode", { ...good, condition: { kind: "unknown" } }, "conditional.condition.kind"],
  [
    "wrong reference scope",
    { ...good, condition: { kind: "switch", switch: { kind: "variable", id: 1 }, value: true } },
    "conditional.condition.switch",
  ],
  [
    "ambiguous reference identity",
    {
      ...good,
      condition: { kind: "switch", switch: { kind: "switch", id: 1, name: "" }, value: true },
    },
    "conditional.condition.switch",
  ],
  [
    "missing required boolean",
    { ...good, condition: { kind: "weapon", weapon: { kind: "weapon", id: 1 } } },
    "conditional.condition.includeEquipment",
  ],
  [
    "bad variable mode",
    {
      ...good,
      condition: {
        kind: "variable",
        variable: { kind: "variable", id: 1 },
        operator: "eq",
        value: 0,
      },
    },
    "conditional.condition.value",
  ],
  [
    "constant below range",
    {
      ...good,
      condition: {
        kind: "variable",
        variable: { kind: "variable", id: 1 },
        operator: "eq",
        value: { kind: "constant", value: -100000000 },
      },
    },
    "conditional.condition.value.value",
  ],
  [
    "timer above range",
    { ...good, condition: { kind: "timer", seconds: 6000, operator: "ge" } },
    "conditional.condition.seconds",
  ],
  [
    "bad actor subtype",
    {
      ...good,
      condition: {
        kind: "actor",
        actor: { kind: "actor", id: 1 },
        check: { kind: "inParty", name: "" },
      },
    },
    "conditional.condition.check.name",
  ],
  [
    "enemy all selector",
    {
      ...good,
      condition: {
        kind: "enemy",
        enemy: { kind: "runtimeSelector", scope: "enemy", target: "all" },
        check: { kind: "appeared" },
      },
    },
    "conditional.condition.enemy.target",
  ],
  [
    "enemy position above range",
    {
      ...good,
      condition: {
        kind: "enemy",
        enemy: { kind: "runtimeSelector", scope: "enemy", target: "enemy", index: 8 },
        check: { kind: "appeared" },
      },
    },
    "conditional.condition.enemy.index",
  ],
  [
    "character retain",
    {
      ...good,
      condition: {
        kind: "character",
        target: { kind: "runtimeSelector", scope: "character", target: "player" },
        direction: 0,
      },
    },
    "conditional.condition.direction",
  ],
  [
    "gold fraction",
    { ...good, condition: { kind: "gold", amount: 0.5, operator: "lt" } },
    "conditional.condition.amount",
  ],
  [
    "unknown button",
    { ...good, condition: { kind: "button", button: "OK" } },
    "conditional.condition.button",
  ],
  [
    "bad script input",
    { ...good, condition: { kind: "script", script: { kind: "scriptInput", code: "", extra: 1 } } },
    "conditional.condition.script.extra",
  ],
  ["old array body", { ...good, then: [] }, "conditional.then"],
  [
    "unknown body key",
    { ...good, then: { commands: [], extra: undefined } },
    "conditional.then.extra",
  ],
  [
    "empty absent body",
    { ...good, then: { commands: [], endMarker: "absent" } },
    "conditional.then.endMarker",
  ],
  ["sparse body", { ...good, then: { commands: Array(1) } }, "conditional.then.commands[0]"],
];

it.each(invalidInputs)(
  "rejects malformed Conditional input before helper field copying: %s",
  (_name, input, dslPath) => {
    expect(() => conditional(input as never)).toThrowError(
      expect.objectContaining({
        code: expect.stringMatching(/^MV-(E111|CHILD-BODY)/),
        location: expect.objectContaining({ dslPath }),
      }),
    );
  },
);

it.each(invalidInputs)(
  "reports malformed direct Conditional graph values: %s",
  (_name, input, dslPath) => {
    const event = commonEvent({
      id: 1,
      name: "Invalid",
      trigger: "none",
      commands: [{ kind: "conditional", ...(input as object) } as never],
    });
    const { issues } = validateDslOwnedDeclarations([event], {
      scriptEnabled: true,
      snapshotReferences: { switchCapacity: 2 },
    });
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          level: "error",
          stage: "compile",
          identity: "commonEvent:1",
          dslPath: dslPath.replace("conditional", "commands[0]"),
        }),
      ]),
    );
  },
);

const invalidSlots: Array<[string, unknown[], number | undefined]> = [
  ["negative zero mode", [-0, 1, 0], 0],
  ["unknown mode", [14, 1], 0],
  ["switch zero", [0, 0, 0], 1],
  ["switch nonboolean code", [0, 1, 2], 2],
  ["variable source", [1, 1, 2, 0, 0], 2],
  ["constant range", [1, 1, 0, 100000000, 0], 3],
  ["variable rhs zero", [1, 1, 1, 0, 0], 3],
  ["negative zero operator", [1, 1, 0, 0, -0], 4],
  ["self switch", [2, "E", 0], 1],
  ["timer range", [3, 6000, 0], 1],
  ["actor subtype", [4, 1, 7, 1], 2],
  ["actor zero target", [4, 1, 2, 0], 3],
  ["actor wrong name", [4, 1, 1, 1], 3],
  ["actor extra slot", [4, 1, 0, 0], undefined],
  ["enemy range", [5, 8, 0], 1],
  ["enemy state zero", [5, 0, 1, 0], 3],
  ["enemy extra slot", [5, 0, 0, 0], undefined],
  ["character negative zero", [6, -0, 2], 1],
  ["character invalid id", [6, -2, 2], 1],
  ["character retain", [6, 0, 0], 2],
  ["gold range", [7, 10000000, 0], 1],
  ["item zero", [8, 0], 1],
  ["weapon missing boolean", [9, 1], undefined],
  ["armor not boolean", [10, 1, 0], 2],
  ["button case", [11, "OK"], 1],
  ["script extra slot", [12, "", ""], undefined],
  ["vehicle negative zero", [13, -0], 1],
];

it.each(invalidSlots)(
  "rejects malformed native and known raw Conditional slots: %s",
  (_name, parameters, slot) => {
    const list = [
      { code: 111, indent: 0, parameters },
      { code: 0, indent: 1, parameters: [] },
      { code: 412, indent: 0, parameters: [] },
    ];
    const expected = {
      code: "MV-E111",
      location: expect.objectContaining({
        nativePath: `list[0].parameters${slot === undefined ? "" : `[${slot}]`}`,
      }),
    };
    expect(() => renderDecompiledCommandList(list)).toThrowError(expect.objectContaining(expected));
    const event = commonEvent({
      id: 1,
      name: "Raw",
      trigger: "none",
      commands: list.map(rawDslCommand),
    });
    expect(() => compileCommonEvent(event, { nextId: 1, resolver })).toThrowError(
      expect.objectContaining({
        code: "MV-E111",
        location: expect.objectContaining({
          dslPath: `commands[0].parameters${slot === undefined ? "" : `[${slot}]`}`,
        }),
      }),
    );
  },
);

it("rejects accessors before reading condition fields", () => {
  let reads = 0;
  const condition = Object.defineProperty({}, "kind", {
    enumerable: true,
    get: () => {
      reads++;
      return "switch";
    },
  });
  expect(() => conditional({ ...good, condition } as never)).toThrow(/MV-E111/);
  expect(reads).toBe(0);
});

it.each(conditionCases)(
  "rejects missing and extra saved slots for every supported shape: %s",
  (_name, _condition, parameters) => {
    for (const invalid of [parameters.slice(0, -1), [...parameters, null]]) {
      const list = [
        { code: 111, indent: 0, parameters: invalid },
        { code: 0, indent: 1, parameters: [] },
        { code: 412, indent: 0, parameters: [] },
      ];
      expect(() => renderDecompiledCommandList(list)).toThrow(/MV-E111/u);
      const event = commonEvent({
        id: 1,
        name: "Slots",
        trigger: "none",
        commands: list.map(rawDslCommand),
      });
      expect(() => compileCommonEvent(event, { nextId: 1, resolver })).toThrow(/MV-E111/u);
    }
  },
);

it("rejects non-data nested body fields without running getters", () => {
  let reads = 0;
  const badCommand = Object.defineProperty({ kind: "comment" }, "lines", {
    enumerable: true,
    get: () => {
      reads++;
      return ["bad"];
    },
  });
  const badArrays = [
    Object.assign([], { extra: 1 }),
    Object.defineProperty([], "0", {
      enumerable: true,
      get: () => {
        reads++;
        return badCommand;
      },
    }),
  ];
  for (const commands of [...badArrays, [badCommand]])
    expect(() => conditional({ ...good, then: { commands } } as never)).toThrow(/MV-/u);
  for (const condition of [
    Object.assign({ ...good.condition }, { [Symbol("extra")]: true }),
    Object.defineProperty({ ...good.condition }, "hidden", { value: 1 }),
    Object.create(good.condition),
  ])
    expect(() => conditional({ ...good, condition } as never)).toThrow(/MV-E111/u);
  expect(reads).toBe(0);
});
