import { expect, it } from "vitest";

import {
  actorRef,
  changeHp,
  changeMp,
  changeState,
  changeTp,
  commonEvent,
  recoverAll,
  rawDslCommand,
  stateRef,
  variableDefinition,
  variableRef,
  type ActorResourceTarget,
  type DslCommand,
} from "../src/index.js";
import { compileCommonEvent } from "../src/compiler/events.js";
import { readRawCommandList } from "../src/decompiler/core.js";
import { renderDecompiledCommandList } from "../src/decompiler/dispatch.js";
import { inspectNativeCommandReferences } from "../src/validation/native-references.js";
import { buildStagedDataGraph, validateStagedDataGraph } from "../src/validation/staged-graph.js";

it("requires the independently saved HP allowDeath flag in the original helper input", () => {
  expect(() =>
    changeHp({
      target: { kind: "runtimeSelector", scope: "actor", target: "entireParty" },
      operation: "gain",
      value: { kind: "constant", value: 1 },
    } as never),
  ).toThrow(/MV-E311.*allowDeath/u);
});

it("compiles the independently saved MP, TP, State and Recover All slots", () => {
  const party: ActorResourceTarget = {
    kind: "runtimeSelector",
    scope: "actor",
    target: "entireParty",
  };
  const fixed: ActorResourceTarget = {
    kind: "runtimeSelector",
    scope: "actor",
    target: "actor",
    actor: actorRef({ id: 7 }),
  };
  const indirect: ActorResourceTarget = {
    kind: "runtimeSelector",
    scope: "actor",
    target: "actorFromVariable",
    variable: variableRef({ id: 8 }),
  };
  const declaration = commonEvent({
    id: 1,
    name: "Actor slots",
    trigger: "none",
    commands: [
      changeMp({ target: party, operation: "gain", value: { kind: "constant", value: 1 } }),
      changeMp({ target: fixed, operation: "lose", value: { kind: "constant", value: 9999 } }),
      changeMp({
        target: indirect,
        operation: "gain",
        value: { kind: "variable", variable: variableRef({ id: 6 }) },
      }),
      changeTp({ target: party, operation: "lose", value: { kind: "constant", value: 100 } }),
      changeTp({ target: fixed, operation: "gain", value: { kind: "constant", value: 1 } }),
      changeTp({
        target: indirect,
        operation: "lose",
        value: { kind: "variable", variable: variableRef({ id: 6 }) },
      }),
      changeState({ target: fixed, operation: "add", state: stateRef({ id: 1 }) }),
      changeState({ target: indirect, operation: "remove", state: stateRef({ name: "Poison" }) }),
      recoverAll({ target: party }),
      recoverAll({ target: fixed }),
      recoverAll({ target: indirect }),
    ],
  });
  const graph = buildStagedDataGraph({
    declarations: [declaration],
    snapshotReferences: {
      actors: [{ id: 7, name: "" }],
      states: [
        { id: 1, name: "" },
        { id: 4, name: "Poison" },
      ],
      variableCapacity: 8,
    },
  });
  expect(
    compileCommonEvent(declaration, { nextId: 1, resolver: graph.resolver }).list,
  ).toStrictEqual([
    { code: 312, indent: 0, parameters: [0, 0, 0, 0, 1] },
    { code: 312, indent: 0, parameters: [0, 7, 1, 0, 9999] },
    { code: 312, indent: 0, parameters: [1, 8, 0, 1, 6] },
    { code: 326, indent: 0, parameters: [0, 0, 1, 0, 100] },
    { code: 326, indent: 0, parameters: [0, 7, 0, 0, 1] },
    { code: 326, indent: 0, parameters: [1, 8, 1, 1, 6] },
    { code: 313, indent: 0, parameters: [0, 7, 0, 1] },
    { code: 313, indent: 0, parameters: [1, 8, 1, 4] },
    { code: 314, indent: 0, parameters: [0, 0] },
    { code: 314, indent: 0, parameters: [0, 7] },
    { code: 314, indent: 0, parameters: [1, 8] },
    { code: 0, indent: 0, parameters: [] },
  ]);
});

it("refuses extra and non-data fields in the original HP helper input before reading them", () => {
  const valid = {
    target: { kind: "runtimeSelector", scope: "actor", target: "entireParty" },
    operation: "gain",
    value: { kind: "constant", value: 1 },
    allowDeath: false,
  };
  let reads = 0;
  const accessor = Object.defineProperty({ ...valid }, "target", {
    enumerable: true,
    get() {
      reads++;
      return valid.target;
    },
  });
  const ignoredAccessor = Object.defineProperty({ ...valid }, "discarded", {
    enumerable: true,
    get() {
      reads++;
      return true;
    },
  });
  const hidden = Object.defineProperty({ ...valid }, "allowDeath", {
    enumerable: false,
    value: false,
  });
  for (const input of [
    { ...valid, discarded: true },
    Object.create(valid),
    accessor,
    ignoredAccessor,
    hidden,
    { ...valid, [Symbol("discarded")]: true },
    Object.assign([], valid),
    Object.assign(new Date(0), valid),
  ]) {
    try {
      changeHp(input as never);
      expect.fail("The original helper input must be rejected before selecting fields");
    } catch (error) {
      expect(error).toMatchObject({
        code: "MV-DSL-SHAPE",
        location: { dslPath: "changeHp" },
      });
    }
  }
  expect(reads).toBe(0);
});

it("compiles the three saved HP actor targets and both explicit operand modes", () => {
  const declaration = commonEvent({
    id: 1,
    name: "Actor resources",
    trigger: "none",
    commands: [
      changeHp({
        target: { kind: "runtimeSelector", scope: "actor", target: "entireParty" },
        operation: "gain",
        value: { kind: "constant", value: 1 },
        allowDeath: false,
      }),
      changeHp({
        target: { kind: "runtimeSelector", scope: "actor", target: "entireParty" },
        operation: "lose",
        value: { kind: "variable", variable: variableRef({ id: 6 }) },
        allowDeath: true,
      }),
      changeHp({
        target: {
          kind: "runtimeSelector",
          scope: "actor",
          target: "actor",
          actor: actorRef({ id: 7 }),
        },
        operation: "lose",
        value: { kind: "constant", value: 9999 },
        allowDeath: true,
      }),
      changeHp({
        target: {
          kind: "runtimeSelector",
          scope: "actor",
          target: "actor",
          actor: actorRef({ name: "Mira" }),
        },
        operation: "gain",
        value: { kind: "variable", variable: variableRef({ id: 6 }) },
        allowDeath: false,
      }),
      changeHp({
        target: {
          kind: "runtimeSelector",
          scope: "actor",
          target: "actorFromVariable",
          variable: variableRef({ id: 5 }),
        },
        operation: "gain",
        value: { kind: "constant", value: 9999 },
        allowDeath: true,
      }),
      changeHp({
        target: {
          kind: "runtimeSelector",
          scope: "actor",
          target: "actorFromVariable",
          variable: variableRef({ name: "TargetSlot" }),
        },
        operation: "lose",
        value: { kind: "variable", variable: variableRef({ name: "AmountSlot" }) },
        allowDeath: false,
      }),
    ],
  });
  const graph = buildStagedDataGraph({
    declarations: [
      declaration,
      variableDefinition({ id: 5, name: "TargetSlot" }),
      variableDefinition({ id: 6, name: "AmountSlot" }),
    ],
    snapshotReferences: {
      actors: [
        { id: 3, name: "Mira" },
        { id: 7, name: "" },
      ],
      variables: [
        { id: 5, name: "TargetSlot" },
        { id: 6, name: "AmountSlot" },
      ],
      variableCapacity: 8,
    },
  });
  expect(
    compileCommonEvent(declaration, { nextId: 1, resolver: graph.resolver }).list,
  ).toStrictEqual([
    { code: 311, indent: 0, parameters: [0, 0, 0, 0, 1, false] },
    { code: 311, indent: 0, parameters: [0, 0, 1, 1, 6, true] },
    { code: 311, indent: 0, parameters: [0, 7, 1, 0, 9999, true] },
    { code: 311, indent: 0, parameters: [0, 3, 0, 1, 6, false] },
    { code: 311, indent: 0, parameters: [1, 5, 0, 0, 9999, true] },
    { code: 311, indent: 0, parameters: [1, 5, 1, 1, 6, false] },
    { code: 0, indent: 0, parameters: [] },
  ]);
});

it("refuses non-data original inputs for every owned actor helper before selecting fields", () => {
  const target = { kind: "runtimeSelector", scope: "actor", target: "entireParty" };
  const quantity = { target, operation: "gain", value: { kind: "constant", value: 1 } };
  const cases = [
    { name: "changeMp", valid: quantity, call: (input: unknown) => changeMp(input as never) },
    { name: "changeTp", valid: quantity, call: (input: unknown) => changeTp(input as never) },
    {
      name: "changeState",
      valid: { target, operation: "add", state: stateRef({ id: 1 }) },
      call: (input: unknown) => changeState(input as never),
    },
    { name: "recoverAll", valid: { target }, call: (input: unknown) => recoverAll(input as never) },
  ];
  let reads = 0;
  for (const { name, valid, call } of cases) {
    const accessor = Object.defineProperty({ ...valid }, "target", {
      enumerable: true,
      get() {
        reads++;
        return target;
      },
    });
    const ignoredAccessor = Object.defineProperty({ ...valid }, "discarded", {
      enumerable: true,
      get() {
        reads++;
        return true;
      },
    });
    for (const input of [
      { ...valid, discarded: true },
      Object.create(valid),
      accessor,
      ignoredAccessor,
      Object.defineProperty({ ...valid }, "target", { enumerable: false, value: target }),
      { ...valid, [Symbol("discarded")]: true },
      Object.assign([], valid),
      Object.assign(new Date(0), valid),
    ]) {
      expect(() => call(input), name).toThrow(
        expect.objectContaining({
          code: "MV-DSL-SHAPE",
          location: expect.objectContaining({ dslPath: name }),
        }),
      );
    }
  }
  expect(reads).toBe(0);
});

it("refuses malformed actor resource fields through helpers, direct compilation and Check", () => {
  const target = { kind: "runtimeSelector", scope: "actor", target: "entireParty" };
  const quantity = { target, operation: "gain", value: { kind: "constant", value: 1 } };
  const hp = { ...quantity, allowDeath: false };
  const fixed = {
    kind: "runtimeSelector",
    scope: "actor",
    target: "actor",
    actor: actorRef({ id: 7 }),
  };
  const invalid: [string, Record<string, unknown>][] = [
    ["changeHp", { ...hp, target: undefined }],
    ["changeHp", { ...hp, operation: undefined }],
    ["changeHp", { ...hp, operation: "set" }],
    ["changeHp", { ...hp, value: undefined }],
    ["changeHp", { ...hp, value: 1 }],
    ["changeHp", { ...hp, allowDeath: undefined }],
    ["changeHp", { ...hp, allowDeath: 0 }],
    ["changeHp", { ...hp, value: { kind: "constant", value: 0 } }],
    ["changeHp", { ...hp, value: { kind: "constant", value: -0 } }],
    ["changeHp", { ...hp, value: { kind: "constant", value: 10000 } }],
    ["changeMp", { ...quantity, value: { kind: "constant", value: -1 } }],
    ["changeMp", { ...quantity, value: { kind: "constant", value: 1.5 } }],
    ["changeMp", { ...quantity, value: { kind: "constant", value: Infinity } }],
    ["changeMp", { ...quantity, value: { kind: "constant", value: NaN } }],
    ["changeTp", { ...quantity, value: { kind: "constant", value: 101 } }],
    ["changeTp", { ...quantity, value: { kind: "random", from: 1, to: 2 } }],
    ["changeMp", { ...quantity, target: { ...target, kind: "actor" } }],
    ["changeMp", { ...quantity, target: { ...target, scope: "enemy" } }],
    ["changeMp", { ...quantity, target: { ...target, target: "all" } }],
    ["changeMp", { ...quantity, target: { ...target, actor: actorRef({ id: 7 }) } }],
    [
      "changeMp",
      {
        ...quantity,
        target: { kind: "runtimeSelector", scope: "actor", target: "actor", actorId: 7 },
      },
    ],
    ["changeMp", { ...quantity, target: { ...fixed, actor: { kind: "actor", id: 0 } } }],
    ["changeMp", { ...quantity, target: { ...fixed, actor: { kind: "actor", id: -0 } } }],
    ["changeMp", { ...quantity, target: { ...fixed, actor: { kind: "skill", id: 7 } } }],
    [
      "changeMp",
      { ...quantity, target: { ...fixed, actor: { kind: "actor", id: 7, name: "Mira" } } },
    ],
    ["changeMp", { ...quantity, target: { ...fixed, actor: { kind: "actor", name: "" } } }],
    ["changeMp", { ...quantity, target: { ...fixed, actor: { kind: "actor", id: 8 } } }],
    ["changeMp", { ...quantity, target: { ...fixed, variable: variableRef({ id: 6 }) } }],
    ["changeTp", { ...quantity, value: variableRef({ id: 6 }) }],
    [
      "changeTp",
      { ...quantity, value: { kind: "variable", variable: { kind: "variable", id: 0 } } },
    ],
    ["changeTp", { ...quantity, value: { kind: "variable", variable: variableRef({ id: 9 }) } }],
    [
      "changeTp",
      { ...quantity, value: { kind: "variable", variable: variableRef({ id: 6 }), value: 1 } },
    ],
    ["changeState", { target, operation: "add", state: undefined }],
    ["changeState", { target, operation: "toggle", state: stateRef({ id: 1 }) }],
    ["changeState", { target, operation: "add", state: { kind: "state", id: 0 } }],
    ["changeState", { target, operation: "remove", state: stateRef({ id: 2 }) }],
    ["recoverAll", { target: undefined }],
    ["recoverAll", { target, operation: "gain" }],
  ];
  const helpers: Record<string, (input: never) => unknown> = {
    changeHp,
    changeMp,
    changeTp,
    changeState,
    recoverAll,
  };
  for (const [kind, input] of invalid) {
    const original = () => helpers[kind]!(input as never);
    const declaration = commonEvent({
      id: 1,
      name: "Malformed",
      trigger: "none",
      commands: [{ kind, ...input } as never],
    });
    const graph = buildStagedDataGraph({
      declarations: [declaration],
      snapshotReferences: {
        actors: [{ id: 7, name: "" }],
        states: [{ id: 1, name: "" }],
        variableCapacity: 8,
      },
    });
    // Helpers have no Snapshot; existing-reference checks belong to compile/Check.
    const hasMissingReference =
      (input.target === undefined
        ? false
        : (input.target as { actor?: { id?: number } }).actor?.id === 8) ||
      (input.value as { variable?: { id?: number } } | undefined)?.variable?.id === 9 ||
      (input.state as { id?: number } | undefined)?.id === 2;
    if (!hasMissingReference) expect(original, kind).toThrow(/MV-(?:DSL-SHAPE|E3\d+)/u);
    expect(
      () => compileCommonEvent(declaration, { nextId: 1, resolver: graph.resolver }),
      kind,
    ).toThrow(
      expect.objectContaining({
        code: expect.stringMatching(/^MV-(?:DSL-SHAPE|E3\d+)/u),
        location: expect.objectContaining({ dslPath: expect.stringMatching(/^commands\[0\]/u) }),
      }),
    );
    expect(validateStagedDataGraph(graph, { scriptEnabled: false }).issues, kind).toContainEqual(
      expect.objectContaining({
        level: "error",
        code: expect.stringMatching(/^MV-(?:DSL-SHAPE|E3\d+)/u),
        dslPath: expect.stringMatching(/^commands\[0\]/u),
      }),
    );
  }
});

it("evaluates formal actor resource rendering and reproduces every saved slot", () => {
  const saved = [
    { code: 311, indent: 0, parameters: [0, 0, 0, 0, 1, false] },
    { code: 311, indent: 0, parameters: [0, 7, 0, 1, 6, true] },
    { code: 311, indent: 0, parameters: [1, 8, 1, 0, 9999, true] },
    { code: 312, indent: 0, parameters: [0, 7, 1, 0, 9999] },
    { code: 312, indent: 0, parameters: [1, 8, 0, 1, 6] },
    { code: 326, indent: 0, parameters: [0, 0, 1, 0, 100] },
    { code: 326, indent: 0, parameters: [0, 7, 0, 0, 1] },
    { code: 326, indent: 0, parameters: [1, 8, 1, 1, 6] },
    { code: 313, indent: 0, parameters: [0, 7, 0, 1] },
    { code: 313, indent: 0, parameters: [1, 8, 1, 4] },
    { code: 314, indent: 0, parameters: [0, 0] },
    { code: 314, indent: 0, parameters: [0, 7] },
    { code: 314, indent: 0, parameters: [1, 8] },
    { code: 0, indent: 0, parameters: [] },
  ];
  const rendered = renderDecompiledCommandList(readRawCommandList(saved));
  const bindings = {
    actorRef,
    changeHp,
    changeMp,
    changeState,
    changeTp,
    recoverAll,
    stateRef,
    variableRef,
  };
  expect(rendered.helperNames).toStrictEqual(
    Object.keys(bindings).sort((left, right) => left.localeCompare(right)),
  );
  const commands = new Function(...Object.keys(bindings), `return [${rendered.source}];`)(
    ...Object.values(bindings),
  ) as DslCommand[];
  expect(commands[0]).toStrictEqual({
    kind: "changeHp",
    target: { kind: "runtimeSelector", scope: "actor", target: "entireParty" },
    operation: "gain",
    value: { kind: "constant", value: 1 },
    allowDeath: false,
  });
  expect(commands[1]).toStrictEqual({
    kind: "changeHp",
    target: {
      kind: "runtimeSelector",
      scope: "actor",
      target: "actor",
      actor: { kind: "actor", id: 7 },
    },
    operation: "gain",
    value: { kind: "variable", variable: { kind: "variable", id: 6 } },
    allowDeath: true,
  });
  const declaration = commonEvent({ id: 1, name: "Formal rendering", trigger: "none", commands });
  const graph = buildStagedDataGraph({
    declarations: [declaration],
    snapshotReferences: {
      actors: [{ id: 7, name: "" }],
      states: [
        { id: 1, name: "" },
        { id: 4, name: "Poison" },
      ],
      variableCapacity: 8,
    },
  });
  expect(
    validateStagedDataGraph(graph, { scriptEnabled: false }).issues.filter(
      (issue) => issue.level === "error",
    ),
  ).toEqual([]);
  expect(
    compileCommonEvent(declaration, { nextId: 1, resolver: graph.resolver }).list,
  ).toStrictEqual(saved);
});

it("rejects invalid saved actor resource slots equally for native and known raw commands", () => {
  const valid: [number, unknown[]][] = [
    [311, [0, 7, 0, 0, 1, false]],
    [312, [0, 7, 0, 0, 1]],
    [313, [0, 7, 0, 1]],
    [314, [0, 7]],
    [326, [0, 7, 0, 0, 1]],
  ];
  const malformed: [number, unknown[], string][] = [];
  for (const [code, parameters] of valid) {
    for (const [index, value] of [
      [0, -0],
      [0, 2],
      [0, "0"],
      [1, -0],
      [1, -1],
      [1, 0.5],
    ] as const) {
      const changed = [...parameters];
      changed[index] = value;
      malformed.push([code, changed, `parameters[${index}]`]);
    }
    malformed.push(
      [code, parameters.slice(0, -1), "parameters"],
      [code, [...parameters, 0], "parameters"],
    );
    const indirectZero = [...parameters];
    indirectZero[0] = 1;
    indirectZero[1] = 0;
    malformed.push([code, indirectZero, "parameters[1]"]);
    if (code !== 314)
      for (const value of [-0, 2]) {
        const changed = [...parameters];
        changed[2] = value;
        malformed.push([code, changed, "parameters[2]"]);
      }
    if (code === 313) {
      malformed.push([code, [0, 7, 0, 0], "parameters[3]"]);
      continue;
    }
    if (code === 314) continue;
    for (const value of [-0, 2]) {
      const changed = [...parameters];
      changed[3] = value;
      malformed.push([code, changed, "parameters[3]"]);
    }
    for (const value of [0, -0, -1, 0.5, code === 326 ? 101 : 10000]) {
      const changed = [...parameters];
      changed[4] = value;
      malformed.push([code, changed, "parameters[4]"]);
    }
    const variableZero = [...parameters];
    variableZero[3] = 1;
    variableZero[4] = 0;
    malformed.push([code, variableZero, "parameters[4]"]);
    if (code === 311) malformed.push([code, [0, 7, 0, 0, 1, 0], "parameters[5]"]);
  }
  for (const [code, parameters, slot] of malformed) {
    const expectedCode = `MV-E${code}-PARAMETERS`;
    expect(() =>
      readRawCommandList(
        [
          { code, indent: 0, parameters },
          { code: 0, indent: 0, parameters: [] },
        ],
        "map:1/event:1",
        "pages[2].",
      ),
    ).toThrow(
      expect.objectContaining({
        code: expectedCode,
        identity: "map:1/event:1",
        stage: "decompile",
        location: expect.objectContaining({ nativePath: `pages[2].list[0].${slot}` }),
      }),
    );
    const constructed = rawDslCommand({ code, parameters });
    const declaration = commonEvent({
      id: 1,
      name: "Invalid raw Actor slot",
      trigger: "none",
      commands: [{ kind: "rawDslCommand", code, parameters }],
    });
    const graph = buildStagedDataGraph({
      declarations: [declaration],
      snapshotReferences: {
        actors: [{ id: 7, name: "" }],
        states: [{ id: 1, name: "" }],
        variableCapacity: 8,
      },
    });
    expect(() => compileCommonEvent(declaration, { nextId: 1, resolver: graph.resolver })).toThrow(
      expect.objectContaining({
        code: expectedCode,
        location: expect.objectContaining({ dslPath: `commands[0].${slot}` }),
      }),
    );
    expect(validateStagedDataGraph(graph, { scriptEnabled: false }).issues).toContainEqual(
      expect.objectContaining({
        level: "error",
        code: expectedCode,
        dslPath: `commands[0].${slot}`,
      }),
    );
    const helperDeclaration = commonEvent({
      id: 2,
      name: "Invalid raw helper Actor slot",
      trigger: "none",
      commands: [constructed],
    });
    const helperGraph = buildStagedDataGraph({
      declarations: [helperDeclaration],
      snapshotReferences: {
        actors: [{ id: 7, name: "" }],
        states: [{ id: 1, name: "" }],
        variableCapacity: 8,
      },
    });
    expect(() =>
      compileCommonEvent(helperDeclaration, { nextId: 2, resolver: helperGraph.resolver }),
    ).toThrow(
      expect.objectContaining({
        code: expectedCode,
        location: expect.objectContaining({ dslPath: `commands[0].${slot}` }),
      }),
    );
    expect(validateStagedDataGraph(helperGraph, { scriptEnabled: false }).issues).toContainEqual(
      expect.objectContaining({
        level: "error",
        code: expectedCode,
        dslPath: `commands[0].${slot}`,
      }),
    );
  }
});

it("refuses nested non-data selectors, operands and references before reading accessors", () => {
  const target = { kind: "runtimeSelector", scope: "actor", target: "entireParty" };
  const hp = {
    target,
    operation: "gain",
    value: { kind: "constant", value: 1 },
    allowDeath: false,
  };
  let reads = 0;
  const accessor = (data: object, field: string, value: unknown) =>
    Object.defineProperty({ ...data }, field, {
      enumerable: true,
      get() {
        reads++;
        return value;
      },
    });
  const invalid: [string, Record<string, unknown>][] = [];
  for (const nested of [
    Object.create(target),
    accessor(target, "target", "entireParty"),
    Object.defineProperty({ ...target }, "scope", { enumerable: false, value: "actor" }),
    { ...target, [Symbol("extra")]: 1 },
    Object.assign([], target),
    Object.assign(new Date(0), target),
  ])
    invalid.push(["changeHp", { ...hp, target: nested }]);
  for (const nested of [
    Object.create(hp.value),
    accessor(hp.value, "kind", "constant"),
    accessor(hp.value, "value", 1),
    { ...hp.value, ignored: true },
    { ...hp.value, [Symbol("extra")]: 1 },
  ])
    invalid.push(["changeHp", { ...hp, value: nested }]);
  const fixed = { kind: "runtimeSelector", scope: "actor", target: "actor" };
  const actor = { kind: "actor", id: 7 };
  for (const reference of [
    Object.create(actor),
    accessor(actor, "id", 7),
    { ...actor, ignored: true },
    { ...actor, [Symbol("extra")]: 1 },
  ])
    invalid.push(["changeHp", { ...hp, target: { ...fixed, actor: reference } }]);
  invalid.push([
    "changeHp",
    {
      ...hp,
      value: { kind: "variable", variable: accessor({ kind: "variable", id: 6 }, "id", 6) },
    },
  ]);
  invalid.push([
    "changeState",
    { target, operation: "add", state: accessor({ kind: "state", id: 1 }, "kind", "state") },
  ]);
  const helpers: Record<string, (input: never) => unknown> = { changeHp, changeState };
  for (const [kind, input] of invalid) {
    expect(() => helpers[kind]!(input as never)).toThrow(
      expect.objectContaining({ code: "MV-DSL-SHAPE" }),
    );
    const declaration = commonEvent({
      id: 1,
      name: "Nested data shape",
      trigger: "none",
      commands: [{ kind, ...input } as never],
    });
    const graph = buildStagedDataGraph({ declarations: [declaration] });
    expect(() => compileCommonEvent(declaration, { nextId: 1, resolver: graph.resolver })).toThrow(
      expect.objectContaining({ code: "MV-DSL-SHAPE" }),
    );
    expect(validateStagedDataGraph(graph, { scriptEnabled: false }).issues).toContainEqual(
      expect.objectContaining({ level: "error", code: "MV-DSL-SHAPE" }),
    );
  }
  expect(reads).toBe(0);
});

it("rejects absent fixed Actor, State and Variable IDs in native and known raw reference checks", () => {
  const cases: [number, unknown[], number][] = [
    [311, [0, 8, 0, 0, 1, false], 1],
    [312, [0, 8, 0, 0, 1], 1],
    [313, [0, 8, 0, 1], 1],
    [314, [0, 8], 1],
    [326, [0, 8, 0, 0, 1], 1],
    [311, [1, 9, 0, 0, 1, false], 1],
    [312, [1, 9, 0, 0, 1], 1],
    [313, [1, 9, 0, 1], 1],
    [314, [1, 9], 1],
    [326, [1, 9, 0, 0, 1], 1],
    [311, [0, 0, 0, 1, 9, false], 4],
    [312, [0, 0, 0, 1, 9], 4],
    [326, [0, 0, 0, 1, 9], 4],
    [313, [0, 0, 0, 2], 3],
  ];
  for (const [code, parameters, slot] of cases) {
    const declaration = commonEvent({
      id: 1,
      name: "Absent fixed reference",
      trigger: "none",
      commands: [rawDslCommand({ code, parameters })],
    });
    const graph = buildStagedDataGraph({
      declarations: [declaration],
      snapshotReferences: {
        actors: [{ id: 7, name: "" }],
        states: [{ id: 1, name: "" }],
        variableCapacity: 8,
      },
    });
    expect(validateStagedDataGraph(graph, { scriptEnabled: false }).issues).toContainEqual(
      expect.objectContaining({
        level: "error",
        code: `MV-E${code}-REFERENCE`,
        nativePath: `list[0].parameters[${slot}]`,
        dslPath: `commands[0].parameters[${slot}]`,
      }),
    );
    const native = readRawCommandList([
      { code, indent: 0, parameters },
      { code: 0, indent: 0, parameters: [] },
    ]);
    expect(
      inspectNativeCommandReferences(native, graph.resolver, {
        identity: "map:1/event:1",
        stage: "decompile",
        prefix: "pages[2].",
      }),
    ).toContainEqual(
      expect.objectContaining({
        level: "error",
        code: `MV-E${code}-REFERENCE`,
        stage: "decompile",
        identity: "map:1/event:1",
        nativePath: `pages[2].list[0].parameters[${slot}]`,
      }),
    );
  }
});
