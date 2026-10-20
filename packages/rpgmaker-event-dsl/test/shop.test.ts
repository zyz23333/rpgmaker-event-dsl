import { expect, it } from "vitest";
import {
  armorRef,
  commonEvent,
  itemRef,
  rawDslCommand,
  shopProcessing,
  weaponRef,
} from "../src/index.js";
import { compileCommonEvent } from "../src/compiler/events.js";
import { buildStagedDataGraph } from "../src/validation/staged-graph.js";
import { validateDslOwnedDeclarations } from "../src/validation/staged-graph.js";
import { renderDecompiledCommandList } from "../src/decompiler/dispatch.js";

const resolver = buildStagedDataGraph({
  declarations: [],
  snapshotReferences: {
    items: [{ id: 1, name: "Potion" }],
    weapons: [{ id: 2, name: "Sword" }],
    armors: [{ id: 3, name: "Armor" }],
  },
}).resolver;

it("an empty Shop emits its exact single structural placeholder", () => {
  const event = commonEvent({
    id: 1,
    name: "Empty Shop",
    trigger: "none",
    commands: [shopProcessing({ goods: [] })],
  });
  expect(compileCommonEvent(event, { nextId: 1, resolver }).list).toStrictEqual([
    { code: 302, indent: 0, parameters: [0, 0, 0, 0, false] },
    { code: 0, indent: 0, parameters: [] },
  ]);
});

it("Shop native and recognized raw reject non-placeholder zero IDs and invalid price slots", () => {
  const invalid = [
    [0, 0, 0, 0, 0],
    [1, 0, 0, 0, false],
    [2, 0, 0, 0, false],
    [0, 0, 1, 0, false],
    [0, 0, 0, -0, false],
    [-0, 1, 0, 0, false],
    [0, -0, 0, 0, false],
    [0, 1, -0, 0, false],
    [0, 1, 1, -1, false],
    [0, 1, 1, 1_000_000, false],
    [0, 1, 1, 0.5, false],
    [0, 1, 0, 3, false],
    [0, 1, 0, 0],
    [0, 1, 0, 0, false, true],
  ];
  for (const parameters of invalid) {
    expect(
      () =>
        renderDecompiledCommandList([
          { code: 302, indent: 0, parameters },
          { code: 0, indent: 0, parameters: [] },
        ]),
      String(parameters),
    ).toThrow();
    const event = commonEvent({
      id: 1,
      name: "Known raw",
      trigger: "none",
      commands: [rawDslCommand({ code: 302, indent: 0, parameters })],
    });
    const result = validateDslOwnedDeclarations([event], {
      scriptEnabled: false,
      snapshotReferences: { items: [{ id: 1, name: "Potion" }] },
    });
    expect(
      result.issues.some((issue) => issue.level === "error"),
      String(parameters),
    ).toBe(true);
  }
});

it("Shop keeps numeric custom price negative zero and rejects unowned continuations", () => {
  const list = [
    { code: 302, indent: 0, parameters: [0, 1, 1, -0, false] },
    { code: 0, indent: 0, parameters: [] },
  ];
  expect(renderDecompiledCommandList(list).source).toBe(
    'shopProcessing({ goods: [{ kind: "item", item: itemRef({ id: 1 }), price: -0 }] }),',
  );
  const event = commonEvent({
    id: 1,
    name: "Price",
    trigger: "none",
    commands: [shopProcessing({ goods: [{ kind: "item", item: itemRef({ id: 1 }), price: -0 }] })],
  });
  expect(
    Object.is(compileCommonEvent(event, { nextId: 1, resolver }).list[0]!.parameters[3], -0),
  ).toBe(true);
  for (const records of [
    [{ code: 605, indent: 0, parameters: [0, 1, 0, 0] }],
    [
      { code: 302, indent: 0, parameters: [0, 1, 0, 0, false] },
      { code: 605, indent: 1, parameters: [0, 1, 0, 0] },
    ],
    [
      { code: 302, indent: 0, parameters: [0, 1, 0, 0, false] },
      { code: 605, indent: 0, parameters: [0, 1, 0, 0, false] },
    ],
  ])
    expect(() =>
      renderDecompiledCommandList([...records, { code: 0, indent: 0, parameters: [] }]),
    ).toThrow();
});

it("Shop rejects malformed original helper and direct inputs before projection", () => {
  const item = { kind: "item", item: itemRef({ id: 1 }) };
  const malformed = [
    {},
    { goods: undefined },
    { goods: null },
    { goods: {} },
    { goods: [undefined] },
    { goods: new Array(1) },
    { goods: [], extra: true },
    { goods: [], allowSelling: true },
    { goods: [], purchaseOnly: null },
    { goods: [], purchaseOnly: 1 },
    { goods: [{ kind: "placeholder", price: 0 }] },
    { goods: [{ kind: "placeholder", item: itemRef({ id: 1 }) }] },
    { goods: [{ kind: "item", item: weaponRef({ id: 2 }) }] },
    { goods: [{ kind: "weapon", item: weaponRef({ id: 2 }) }] },
    { goods: [{ kind: "armor", armor: null }] },
    ...[-1, 1_000_000, 0.5, NaN, Infinity, null].map((price) => ({ goods: [{ ...item, price }] })),
  ];
  for (const input of malformed) {
    expect(() => shopProcessing(input as never), JSON.stringify(input)).toThrow();
    const event = commonEvent({
      id: 1,
      name: "Invalid Shop",
      trigger: "none",
      commands: [{ kind: "shopProcessing", ...input } as never],
    });
    expect(() => compileCommonEvent(event, { nextId: 1, resolver })).toThrow();
    expect(
      validateDslOwnedDeclarations([event], { scriptEnabled: false }).issues.some(
        (issue) => issue.level === "error",
      ),
    ).toBe(true);
  }
  let reads = 0;
  const good = { kind: "placeholder" };
  Object.defineProperty(good, "kind", {
    enumerable: true,
    configurable: true,
    get() {
      reads++;
      Object.defineProperty(good, "kind", { value: "placeholder", enumerable: true });
      return "placeholder";
    },
  });
  expect(() => shopProcessing({ goods: [good] } as never)).toThrow();
  expect(reads).toBe(0);
});

it.each([
  {
    records: [{ code: 302, indent: 0, parameters: [0, 0, 0, 0, false] }],
    source: "shopProcessing({ goods: [] }),",
  },
  {
    records: [
      { code: 302, indent: 0, parameters: [0, 0, 0, 0, true] },
      { code: 605, indent: 0, parameters: [0, 0, 0, 0] },
    ],
    source:
      'shopProcessing({ goods: [{ kind: "placeholder" }, { kind: "placeholder" }], purchaseOnly: true }),',
  },
  {
    records: [
      { code: 302, indent: 0, parameters: [0, 1, 0, 0, false] },
      { code: 605, indent: 0, parameters: [1, 2, 1, 0] },
      { code: 605, indent: 0, parameters: [2, 3, 1, 999999] },
      { code: 605, indent: 0, parameters: [0, 0, 0, 0] },
    ],
    source:
      'shopProcessing({ goods: [{ kind: "item", item: itemRef({ id: 1 }) }, { kind: "weapon", weapon: weaponRef({ id: 2 }), price: 0 }, { kind: "armor", armor: armorRef({ id: 3 }), price: 999999 }, { kind: "placeholder" }] }),',
  },
])(
  "Shop decompiles the complete saved records without dropping placeholders: $source",
  ({ records, source }) => {
    expect(
      renderDecompiledCommandList([...records, { code: 0, indent: 0, parameters: [] }]).source,
    ).toBe(source);
  },
);

it("Shop preserves interleaved repeated placeholders, category references and zero custom prices", () => {
  const event = commonEvent({
    id: 1,
    name: "Ordered goods",
    trigger: "none",
    commands: [
      shopProcessing({
        purchaseOnly: true,
        goods: [
          { kind: "placeholder" },
          { kind: "item", item: itemRef({ id: 1 }) },
          { kind: "placeholder" },
          { kind: "weapon", weapon: weaponRef({ id: 2 }), price: 0 },
          { kind: "armor", armor: armorRef({ id: 3 }), price: 999_999 },
          { kind: "item", item: itemRef({ id: 1 }) },
          { kind: "placeholder" },
          { kind: "placeholder" },
        ],
      }),
    ],
  });
  expect(compileCommonEvent(event, { nextId: 1, resolver }).list).toStrictEqual([
    { code: 302, indent: 0, parameters: [0, 0, 0, 0, true] },
    { code: 605, indent: 0, parameters: [0, 1, 0, 0] },
    { code: 605, indent: 0, parameters: [0, 0, 0, 0] },
    { code: 605, indent: 0, parameters: [1, 2, 1, 0] },
    { code: 605, indent: 0, parameters: [2, 3, 1, 999_999] },
    { code: 605, indent: 0, parameters: [0, 1, 0, 0] },
    { code: 605, indent: 0, parameters: [0, 0, 0, 0] },
    { code: 605, indent: 0, parameters: [0, 0, 0, 0] },
    { code: 0, indent: 0, parameters: [] },
  ]);
});
