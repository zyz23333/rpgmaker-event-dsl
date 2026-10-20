import { expect, it } from "vitest";
import {
  changeGold,
  changeItems,
  changeWeapons,
  changeArmors,
  changePartyMember,
  itemRef,
  weaponRef,
  armorRef,
  actorRef,
  variableRef,
  rawDslCommand,
  commonEvent,
} from "../src/index.js";
import { compileCommonEvent } from "../src/compiler/events.js";
import {
  buildStagedDataGraph,
  validateDslOwnedDeclarations,
} from "../src/validation/staged-graph.js";
import { renderDecompiledCommandList } from "../src/decompiler/dispatch.js";
import { recordEvidence } from "./support/mv-evidence.js";

const resolver = buildStagedDataGraph({
  declarations: [],
  snapshotReferences: {
    items: [{ id: 1, name: "Potion" }],
    weapons: [{ id: 2, name: "Sword" }],
    armors: [{ id: 3, name: "Armor" }],
    actors: [{ id: 4, name: "Actor" }],
    variableCapacity: 3,
  },
}).resolver;

it("Change Gold authors explicit quantity modes and emits the independent native saved slots", () => {
  const event = commonEvent({
    id: 1,
    name: "Gold",
    trigger: "none",
    commands: [changeGold({ operation: "gain", value: { kind: "constant", value: 9_999_999 } })],
  });
  expect(compileCommonEvent(event, { nextId: 1, resolver }).list).toStrictEqual([
    { code: 125, indent: 0, parameters: [0, 0, 9_999_999] },
    { code: 0, indent: 0, parameters: [] },
  ]);
  expect(
    renderDecompiledCommandList([
      { code: 125, indent: 0, parameters: [1, 0, 1] },
      { code: 0, indent: 0, parameters: [] },
    ]).source,
  ).toBe('changeGold({ operation: "lose", value: { kind: "constant", value: 1 } }),');
});

const formalInputs = [
  {
    helper: changeGold,
    input: { operation: "gain", value: { kind: "constant", value: 1 } },
    quantity: "value",
    maximum: 9_999_999,
  },
  {
    helper: changeItems,
    input: {
      item: { kind: "item", id: 1 },
      operation: "gain",
      amount: { kind: "constant", value: 1 },
    },
    quantity: "amount",
    maximum: 9999,
  },
  {
    helper: changeWeapons,
    input: {
      weapon: { kind: "weapon", id: 2 },
      operation: "gain",
      amount: { kind: "constant", value: 1 },
      includeEquipment: true,
    },
    quantity: "amount",
    maximum: 9999,
  },
  {
    helper: changeArmors,
    input: {
      armor: { kind: "armor", id: 3 },
      operation: "gain",
      amount: { kind: "constant", value: 1 },
      includeEquipment: true,
    },
    quantity: "amount",
    maximum: 9999,
  },
  {
    helper: changePartyMember,
    input: { actor: { kind: "actor", id: 4 }, operation: "remove", initialize: true },
    quantity: null,
    maximum: 0,
  },
];

it.each(formalInputs)(
  "$helper.name refuses missing and unknown authored fields before helper projection and direct compilation",
  ({ helper, input, quantity, maximum }) => {
    const invalid: unknown[] = [
      { ...input, extra: true },
      { ...input, operation: undefined },
      { ...input, operation: null },
    ];
    for (const key of Object.keys(input)) {
      const missing: Record<string, unknown> = { ...input };
      delete missing[key];
      invalid.push(missing, { ...input, [key]: undefined });
    }
    if (quantity)
      invalid.push(
        ...[0, -0, -1, maximum + 1, 0.5, Infinity, NaN, null, undefined].map((value) => ({
          ...input,
          [quantity]: { kind: "constant", value },
        })),
        ...[
          1,
          { kind: "variable", id: 3 },
          { kind: "constant", value: 1, variable: { kind: "variable", id: 3 } },
          { kind: "variable", variable: { kind: "variable", id: 3 }, value: 1 },
          { kind: "variable", variable: { kind: "item", id: 1 } },
          { kind: "variable", variable: { kind: "variable", id: 0 } },
        ].map((value) => ({ ...input, [quantity]: value })),
      );
    const target =
      helper.name === "changeItems"
        ? "item"
        : helper.name === "changeWeapons"
          ? "weapon"
          : helper.name === "changeArmors"
            ? "armor"
            : helper.name === "changePartyMember"
              ? "actor"
              : null;
    if (target)
      invalid.push(
        ...[
          null,
          0,
          { kind: "variable", id: 1 },
          { kind: target, id: 0 },
          { kind: target, id: 1, extra: true },
          { kind: target, id: 1, name: "duplicate source" },
        ].map((value) => ({ ...input, [target]: value })),
      );
    const flag =
      helper.name === "changePartyMember"
        ? "initialize"
        : ["changeWeapons", "changeArmors"].includes(helper.name)
          ? "includeEquipment"
          : null;
    if (flag) invalid.push(...[null, 0, 1, "true"].map((value) => ({ ...input, [flag]: value })));
    for (const value of invalid) {
      expect(() => (helper as (value: unknown) => unknown)(value)).toThrow();
      const commands = [{ kind: helper.name, ...(value as object) }] as Parameters<
        typeof commonEvent
      >[0]["commands"];
      expect(() =>
        compileCommonEvent(commonEvent({ id: 1, name: "Invalid", trigger: "none", commands }), {
          nextId: 1,
          resolver,
        }),
      ).toThrow();
    }
  },
);

it("fixed project references and unnamed variable capacity are validated with exact authored and known-raw paths", () => {
  const authored = commonEvent({
    id: 1,
    name: "Missing",
    trigger: "none",
    commands: [
      changeGold({
        operation: "gain",
        value: { kind: "variable", variable: variableRef({ id: 4 }) },
      }),
      changeItems({
        item: itemRef({ id: 2 }),
        operation: "gain",
        amount: { kind: "constant", value: 1 },
      }),
      changeWeapons({
        weapon: weaponRef({ id: 2 }),
        operation: "gain",
        amount: { kind: "constant", value: 1 },
        includeEquipment: true,
      }),
    ],
  });
  const result = validateDslOwnedDeclarations([authored], {
    scriptEnabled: false,
    snapshotReferences: { variableCapacity: 3, weapons: [{ id: 2, name: "" }] },
  });
  expect(result.issues).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        level: "error",
        code: "MV-E125-INPUT",
        dslPath: "commands[0].value.variable",
      }),
      expect.objectContaining({
        level: "error",
        code: "MV-E126-INPUT",
        dslPath: "commands[1].item",
      }),
    ]),
  );
  const raw = commonEvent({
    id: 1,
    name: "Raw",
    trigger: "none",
    commands: [rawDslCommand({ code: 125, parameters: [-0, 0, 1] })],
  });
  expect(() => compileCommonEvent(raw, { nextId: 1, resolver })).toThrow(
    /commands\[0\]\.parameters\[0\].*actual -0/u,
  );
});

it.each([
  { code: 125, parameters: [0, 0, 1], operation: 0, source: 1, value: 2, maximum: 9_999_999 },
  { code: 126, parameters: [1, 0, 0, 1], operation: 1, source: 2, value: 3, maximum: 9999 },
  { code: 127, parameters: [2, 0, 0, 1, true], operation: 1, source: 2, value: 3, maximum: 9999 },
  { code: 128, parameters: [3, 0, 0, 1, true], operation: 1, source: 2, value: 3, maximum: 9999 },
  { code: 129, parameters: [4, 1, true], operation: 1, source: null, value: null, maximum: 0 },
])(
  "E$code rejects malformed native slots consistently through Decompile and recognized raw",
  ({ code, parameters, operation, source, value, maximum }) => {
    const invalid = [parameters.slice(0, -1), [...parameters, 0], parameters.map(() => null)];
    for (const at of [operation, ...(source === null ? [] : [source])])
      for (const wrong of [-0, -1, 2, 0.5, null, undefined]) {
        const next = [...parameters];
        next[at] = wrong as number;
        invalid.push(next);
      }
    if (value !== null)
      for (const wrong of [0, -0, -1, maximum + 1, 1.5]) {
        const next = [...parameters];
        next[value] = wrong;
        invalid.push(next);
      }
    for (const p of invalid) {
      expect(() => renderDecompiledCommandList([{ code, indent: 0, parameters: p }])).toThrow();
      expect(() =>
        compileCommonEvent(
          commonEvent({
            id: 1,
            name: "Invalid raw",
            trigger: "none",
            commands: [rawDslCommand({ code, parameters: p })],
          }),
          { nextId: 1, resolver },
        ),
      ).toThrow();
    }
  },
);

it("inventory quantities and inactive flags reconstruct their independently specified native records", async () => {
  const startedAt = new Date().toISOString();
  const event = commonEvent({
    id: 1,
    name: "Inventory",
    trigger: "none",
    commands: [
      changeGold({
        operation: "lose",
        value: { kind: "variable", variable: variableRef({ id: 3 }) },
      }),
      changeItems({
        item: itemRef({ id: 1 }),
        operation: "gain",
        amount: { kind: "constant", value: 9999 },
      }),
      changeItems({
        item: itemRef({ id: 1 }),
        operation: "lose",
        amount: { kind: "variable", variable: variableRef({ id: 3 }) },
      }),
      changeWeapons({
        weapon: weaponRef({ id: 2 }),
        operation: "gain",
        amount: { kind: "constant", value: 1 },
        includeEquipment: true,
      }),
      changeWeapons({
        weapon: weaponRef({ id: 2 }),
        operation: "lose",
        amount: { kind: "variable", variable: variableRef({ id: 3 }) },
        includeEquipment: false,
      }),
      changeArmors({
        armor: armorRef({ id: 3 }),
        operation: "gain",
        amount: { kind: "variable", variable: variableRef({ id: 3 }) },
        includeEquipment: true,
      }),
      changeArmors({
        armor: armorRef({ id: 3 }),
        operation: "lose",
        amount: { kind: "constant", value: 9999 },
        includeEquipment: false,
      }),
      changePartyMember({ actor: actorRef({ id: 4 }), operation: "remove", initialize: true }),
      changePartyMember({ actor: actorRef({ id: 4 }), operation: "add", initialize: false }),
    ],
  });
  const native = [
    { code: 125, indent: 0, parameters: [1, 1, 3] },
    { code: 126, indent: 0, parameters: [1, 0, 0, 9999] },
    { code: 126, indent: 0, parameters: [1, 1, 1, 3] },
    { code: 127, indent: 0, parameters: [2, 0, 0, 1, true] },
    { code: 127, indent: 0, parameters: [2, 1, 1, 3, false] },
    { code: 128, indent: 0, parameters: [3, 0, 1, 3, true] },
    { code: 128, indent: 0, parameters: [3, 1, 0, 9999, false] },
    { code: 129, indent: 0, parameters: [4, 1, true] },
    { code: 129, indent: 0, parameters: [4, 0, false] },
    { code: 0, indent: 0, parameters: [] },
  ];
  expect(compileCommonEvent(event, { nextId: 1, resolver }).list).toStrictEqual(native);
  expect(renderDecompiledCommandList(native).source).toBe(
    [
      'changeGold({ operation: "lose", value: { kind: "variable", variable: variableRef({ id: 3 }) } }),',
      'changeItems({ item: itemRef({ id: 1 }), operation: "gain", amount: { kind: "constant", value: 9999 } }),',
      'changeItems({ item: itemRef({ id: 1 }), operation: "lose", amount: { kind: "variable", variable: variableRef({ id: 3 }) } }),',
      'changeWeapons({ weapon: weaponRef({ id: 2 }), operation: "gain", amount: { kind: "constant", value: 1 }, includeEquipment: true }),',
      'changeWeapons({ weapon: weaponRef({ id: 2 }), operation: "lose", amount: { kind: "variable", variable: variableRef({ id: 3 }) }, includeEquipment: false }),',
      'changeArmors({ armor: armorRef({ id: 3 }), operation: "gain", amount: { kind: "variable", variable: variableRef({ id: 3 }) }, includeEquipment: true }),',
      'changeArmors({ armor: armorRef({ id: 3 }), operation: "lose", amount: { kind: "constant", value: 9999 }, includeEquipment: false }),',
      'changePartyMember({ actor: actorRef({ id: 4 }), operation: "remove", initialize: true }),',
      'changePartyMember({ actor: actorRef({ id: 4 }), operation: "add", initialize: false }),',
    ].join("\n"),
  );
  await recordEvidence({
    requirementId: "MV-S6-INVENTORY-005",
    startedAt,
    stages: [
      "Public authoring helpers and compiler/decompiler command seams; independent E125–E129 native literals",
    ],
    expected: native,
    actual: {
      compiled: compileCommonEvent(event, { nextId: 1, resolver }).list,
      decompiled: renderDecompiledCommandList(native),
    },
  });
});
