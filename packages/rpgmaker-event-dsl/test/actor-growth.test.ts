import { expect, it } from "vitest";
import { readFile } from "node:fs/promises";

import {
  actorRef, changeClass, changeEquipment, changeExp, changeLevel, changeParameter, changeSkill, classRef,
  commonEvent, rawDslCommand, skillRef, variableRef, type ActorResourceTarget, type DslCommand,
} from "../src/index.js";
import { compileCommonEvent } from "../src/compiler/events.js";
import { readRawCommandList } from "../src/decompiler/core.js";
import { renderDecompiledCommandList } from "../src/decompiler/dispatch.js";
import { buildStagedDataGraph } from "../src/validation/staged-graph.js";

it("requires the independently saved growth and class flags in original helper input", () => {
  const input = {
    target: { kind: "runtimeSelector", scope: "actor", target: "entireParty" },
    operation: "lose",
    value: { kind: "constant", value: 1 },
  };
  expect(() => changeExp(input as never)).toThrow(/MV-E315.*showLevelUp/u);
  expect(() => changeLevel(input as never)).toThrow(/MV-E316.*showLevelUp/u);
  expect(() =>
    changeClass({ actor: actorRef({ id: 1 }), class: classRef({ id: 1 }) } as never),
  ).toThrow(/MV-E321.*keepExp/u);
});

it("evaluates every growth enum and selector from independent saved fixtures without losing flags", async () => {
  const { commands: expected } = JSON.parse(await readFile(new URL("./fixtures/mv-evidence/actor-growth-equipment-cases.json", import.meta.url), "utf8"));
  const rendered = renderDecompiledCommandList(readRawCommandList(expected));
  const bindings = { actorRef, classRef, skillRef, variableRef, changeExp, changeLevel, changeParameter, changeSkill, changeClass, changeEquipment };
  const commands = new Function(...Object.keys(bindings), `return [${rendered.source}];`)(...Object.values(bindings)) as DslCommand[];
  const declaration = commonEvent({ id: 1, name: "Complete growth enums", trigger: "none", commands });
  const graph = buildStagedDataGraph({ declarations: [declaration], snapshotReferences: {
    actors: [{ id: 1, name: "Mira" }, { id: 2, name: "Noah" }],
    classes: [{ id: 1, name: "Fighter" }, { id: 2, name: "Mage" }],
    skills: [{ id: 1, name: "Heal" }, { id: 2, name: "Fire" }], variableCapacity: 4,
  } });
  expect(commands).toHaveLength(29);
  expect(compileCommonEvent(declaration, { nextId: 1, resolver: graph.resolver }).list).toStrictEqual(expected);
});

it("applies growth literal domains, exact nested forms and fixed references to helper and direct input", () => {
  const target = { kind: "runtimeSelector", scope: "actor", target: "entireParty" };
  const base = { target, operation: "gain", value: { kind: "constant", value: 1 }, showLevelUp: false };
  const invalid = [
    ["changeExp", changeExp, { ...base, value: { kind: "constant", value: 10000000 } }],
    ["changeExp", changeExp, { ...base, value: { kind: "constant", value: 0 } }],
    ["changeExp", changeExp, { ...base, value: { kind: "constant", value: 1.5 } }],
    ["changeExp", changeExp, { ...base, value: 1 }],
    ["changeExp", changeExp, { ...base, value: { kind: "constant", value: 1, ignored: true } }],
    ["changeExp", changeExp, { ...base, target: { ...target, actorId: 1 } }],
    ["changeExp", changeExp, { ...base, target: { ...target, target: "actor", actor: { kind: "skill", id: 1 } } }],
    ["changeLevel", changeLevel, { ...base, value: { kind: "constant", value: 99 } }],
    ["changeLevel", changeLevel, { ...base, showLevelUp: undefined }],
    ["changeParameter", changeParameter, { target, operation: "gain", parameter: "other", value: { kind: "constant", value: 1 } }],
    ["changeParameter", changeParameter, { target, operation: "gain", parameter: "atk", value: { kind: "constant", value: 10000 } }],
    ["changeSkill", changeSkill, { target, operation: "gain", skill: skillRef({ id: 1 }) }],
    ["changeClass", changeClass, { actor: actorRef({ id: 1 }), class: classRef({ id: 1 }), keepExp: undefined }],
  ] as const;
  const graph = buildStagedDataGraph({ declarations: [], snapshotReferences: { actors: [{ id: 1, name: "Mira" }], classes: [{ id: 1, name: "Fighter" }], skills: [{ id: 1, name: "Heal" }] } });
  for (const [kind, helper, input] of invalid) {
    expect(() => helper(input as never)).toThrow(/MV-(?:DSL-SHAPE|E\d+-INPUT)/u);
    const declaration = commonEvent({ id: 1, name: "Bad direct", trigger: "none", commands: [{ kind, ...input } as never] });
    expect(() => compileCommonEvent(declaration, { nextId: 1, resolver: graph.resolver })).toThrow(/MV-(?:DSL-SHAPE|E\d+-INPUT)/u);
  }
});

it("rejects malformed growth saved slots through native Decompile and known raw Compile", () => {
  const graph = buildStagedDataGraph({ declarations: [], snapshotReferences: {
    actors: [{ id: 7, name: "Hero" }], classes: [{ id: 2, name: "Mage" }],
    skills: [{ id: 4, name: "Fire" }], variableCapacity: 8,
  } });
  const invalid: Array<[number, unknown[]]> = [
    [315, [0, 7, 0, 0, 10000000, false]],
    [315, [0, 7, 0, 0, 1]], [315, [0, 7, 0, 0, 1, false, 0]],
    [315, [-0, 7, 0, 0, 1, false]], [315, [0, -0, 0, 0, 1, false]],
    [315, [0, 7, 2, 0, 1, false]], [315, [0, 7, 0, 2, 1, false]],
    [315, [0, 7, 0, 0, 0, false]], [315, [0, 7, 0, 0, 10000000, false]],
    [315, [0, 7, 0, 0, 1, 0]], [316, [0, 7, 0, 0, 99, false]],
    [316, [0, 7, 0, 1, 0, false]], [317, [0, 7, 8, 0, 0, 1]],
    [317, [0, 7, -0, 0, 0, 1]], [317, [0, 7, 1, 0, 0, 10000]],
    [318, [0, 7, 2, 4]], [318, [0, 7, 0, 0]],
    [321, [7, 2, false, 0]], [321, [0, 2, true]], [321, [7, 0, false]],
    [321, [7, 2, 0]],
  ];
  for (const [code, parameters] of invalid) {
    const saved = [{ code, indent: 0, parameters }, { code: 0, indent: 0, parameters: [] }];
    expect(() => renderDecompiledCommandList(readRawCommandList(saved))).toThrow(new RegExp(`MV-E${code}-PARAMETERS.*parameters`, "u"));
    const declaration = commonEvent({ id: 1, name: "Bad raw", trigger: "none", commands: [
      rawDslCommand({ code, parameters } as never),
    ] });
    expect(() => compileCommonEvent(declaration, { nextId: 1, resolver: graph.resolver })).toThrow(new RegExp(`MV-E${code}-PARAMETERS.*parameters`, "u"));
  }
});

it("rejects unknown and non-data original growth helper fields before reading them", () => {
  const target = { kind: "runtimeSelector", scope: "actor", target: "entireParty" };
  const value = { kind: "constant", value: 1 };
  const cases = [
    [changeExp, { target, operation: "gain", value, showLevelUp: false }],
    [changeLevel, { target, operation: "lose", value, showLevelUp: true }],
    [changeParameter, { target, operation: "gain", parameter: "mhp", value }],
    [changeSkill, { target, operation: "learn", skill: skillRef({ id: 1 }) }],
    [changeClass, { actor: actorRef({ id: 1 }), class: classRef({ id: 1 }), keepExp: false }],
  ] as const;
  let reads = 0;
  for (const [helper, input] of cases) {
    const accessor = Object.defineProperty({ ...input }, "discarded", {
      enumerable: true,
      get() { reads++; return true; },
    });
    for (const malformed of [
      { ...input, discarded: true }, accessor, Object.create(input),
      { ...input, [Symbol("discarded")]: true },
    ]) expect(() => helper(malformed as never)).toThrow(/MV-DSL-SHAPE/u);
  }
  expect(reads).toBe(0);
});

it("compiles and decompiles canonical growth selectors, operands and independent flags", () => {
  const fixed: ActorResourceTarget = {
    kind: "runtimeSelector", scope: "actor", target: "actor", actor: actorRef({ id: 7 }),
  };
  const variable: ActorResourceTarget = {
    kind: "runtimeSelector", scope: "actor", target: "actorFromVariable", variable: variableRef({ id: 8 }),
  };
  const party: ActorResourceTarget = { kind: "runtimeSelector", scope: "actor", target: "entireParty" };
  const declaration = commonEvent({
    id: 1, name: "Growth", trigger: "none", commands: [
      changeExp({ target: fixed, operation: "lose", value: { kind: "constant", value: 9999999 }, showLevelUp: true } as never),
      changeExp({ target: variable, operation: "gain", value: { kind: "variable", variable: variableRef({ id: 6 }) }, showLevelUp: false } as never),
      changeLevel({ target: party, operation: "lose", value: { kind: "constant", value: 98 }, showLevelUp: true } as never),
      changeParameter({ target: fixed, parameter: "luk", operation: "gain", value: { kind: "constant", value: 9999 } } as never),
      changeSkill({ target: variable, operation: "forget", skill: skillRef({ id: 4 }) } as never),
      changeClass({ actor: actorRef({ id: 7 }), class: classRef({ id: 2 }), keepExp: false }),
    ],
  });
  const graph = buildStagedDataGraph({ declarations: [declaration], snapshotReferences: {
    actors: [{ id: 7, name: "Hero" }], classes: [{ id: 2, name: "Mage" }],
    skills: [{ id: 4, name: "Fire" }], variableCapacity: 8,
  } });
  const expected = [
    { code: 315, indent: 0, parameters: [0, 7, 1, 0, 9999999, true] },
    { code: 315, indent: 0, parameters: [1, 8, 0, 1, 6, false] },
    { code: 316, indent: 0, parameters: [0, 0, 1, 0, 98, true] },
    { code: 317, indent: 0, parameters: [0, 7, 7, 0, 0, 9999] },
    { code: 318, indent: 0, parameters: [1, 8, 1, 4] },
    { code: 321, indent: 0, parameters: [7, 2, false] },
    { code: 0, indent: 0, parameters: [] },
  ];
  expect(compileCommonEvent(declaration, { nextId: 1, resolver: graph.resolver }).list).toStrictEqual(expected);
  const rendered = renderDecompiledCommandList(readRawCommandList(expected));
  const source = rendered.source;
  expect(source).toContain('actor: actorRef({ id: 7 })');
  expect(source).toContain('value: { kind: "constant", value: 9999999 }');
  expect(source).toContain('value: { kind: "variable", variable: variableRef({ id: 6 }) }');
  expect(source).toContain("showLevelUp: false");
  expect(source).toContain("keepExp: false");
  expect(source).not.toContain("actorId:");
});
