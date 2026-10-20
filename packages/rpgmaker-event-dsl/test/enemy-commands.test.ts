import { expect, it } from "vitest";
import { commonEvent, showBattleAnimation, type DslCommand } from "../src/index.js";
import { compileCommonEvent } from "../src/compiler/events.js";
import { renderDecompiledCommandList } from "../src/decompiler/dispatch.js";
import { buildStagedDataGraph } from "../src/validation/staged-graph.js";
import * as dsl from "../src/index.js";

const resolver = buildStagedDataGraph({
  declarations: [],
  snapshotReferences: {
    animations: [{ id: 2, name: "Flash" }],
    states: [{ id: 2, name: "Dead" }],
    enemies: [{ id: 2, name: "Bat" }],
    variableCapacity: 2,
  },
}).resolver;
function compile(command: DslCommand) {
  return compileCommonEvent(
    commonEvent({ id: 1, name: "Enemy", trigger: "none", commands: [command] }),
    {
      nextId: 1,
      resolver,
    },
  ).list;
}

it("preserves the saved single enemy index independently from the all-enemies animation flag", () => {
  const command = showBattleAnimation({
    target: { kind: "runtimeSelector", scope: "enemy", target: "enemy", index: 7 },
    animation: { kind: "animation", id: 2 },
    allEnemies: true,
  });
  expect(compile(command)).toStrictEqual([
    { code: 337, indent: 0, parameters: [7, 2, true] },
    { code: 0, indent: 0, parameters: [] },
  ]);
  expect(
    renderDecompiledCommandList([{ code: 337, indent: 0, parameters: [7, 2, true] }]).source,
  ).toContain('target: "enemy", index: 7 }, animation: animationRef({ id: 2 }), allEnemies: true');
});

const single = { kind: "runtimeSelector", scope: "enemy", target: "enemy", index: 7 } as const;
const all = { kind: "runtimeSelector", scope: "enemy", target: "all" } as const;
const cases: Array<[string, unknown, number, unknown[]]> = [
  [
    "changeEnemyHp",
    { target: all, operation: "gain", value: { kind: "constant", value: 9999 }, allowDeath: true },
    331,
    [-1, 0, 0, 9999, true],
  ],
  [
    "changeEnemyHp",
    {
      target: single,
      operation: "lose",
      value: { kind: "variable", variable: { kind: "variable", id: 2 } },
      allowDeath: false,
    },
    331,
    [7, 1, 1, 2, false],
  ],
  [
    "changeEnemyMp",
    { target: single, operation: "gain", value: { kind: "constant", value: 1 } },
    332,
    [7, 0, 0, 1],
  ],
  [
    "changeEnemyTp",
    { target: all, operation: "lose", value: { kind: "constant", value: 100 } },
    342,
    [-1, 1, 0, 100],
  ],
  [
    "changeEnemyState",
    { target: all, operation: "remove", state: { kind: "state", id: 2 } },
    333,
    [-1, 1, 2],
  ],
  ["enemyRecoverAll", { target: all }, 334, [-1]],
  ["enemyAppear", { target: single }, 335, [7]],
  ["enemyTransform", { target: single, enemy: { kind: "enemy", id: 2 } }, 336, [7, 2]],
  [
    "showBattleAnimation",
    { target: single, animation: { kind: "animation", id: 2 }, allEnemies: false },
    337,
    [7, 2, false],
  ],
];
it.each(cases)("compiles exact saved Enemy slots for %s", (helper, input, code, parameters) => {
  const create = dsl[helper as keyof typeof dsl] as (input: never) => DslCommand;
  expect(compile(create(input as never))).toStrictEqual([
    { code, indent: 0, parameters },
    { code: 0, indent: 0, parameters: [] },
  ]);
  const rendered = renderDecompiledCommandList([{ code, indent: 0, parameters }]);
  expect(rendered.helperNames).toContain(helper);
  if (code === 331) expect(rendered.source).toContain(`allowDeath: ${parameters[4]}`);
});

it.each([
  ["enemyAppear", { target: all }],
  ["enemyTransform", { target: all, enemy: { kind: "enemy", id: 2 } }],
  [
    "showBattleAnimation",
    { target: all, animation: { kind: "animation", id: 2 }, allEnemies: true },
  ],
  ["showBattleAnimation", { target: single, animation: { kind: "animation", id: 2 } }],
  ["enemyAppear", { target: { ...single, index: 8 } }],
  ["enemyAppear", { target: { ...single, index: -1 } }],
  ["changeEnemyHp", { target: all, operation: "gain", value: { kind: "constant", value: 1 } }],
  ["changeEnemyTp", { target: all, operation: "gain", value: { kind: "constant", value: 101 } }],
  ["changeEnemyMp", { target: all, operation: "lose", value: 1 }],
  ["changeEnemyMp", { target: all, operation: "gain", value: { kind: "constant", value: 0 } }],
  ["enemyAppear", { target: single, extra: true }],
  ["enemyAppear", { target: { ...single, hidden: true } }],
] as const)("refuses malformed helper and direct Enemy inputs for %s", (helper, input) => {
  const create = dsl[helper] as (input: never) => DslCommand;
  expect(() => create(input as never)).toThrow();
  expect(() => compile({ kind: helper, ...input } as never)).toThrow();
});

it.each([
  [331, [0, 0, 0, 0, false]],
  [331, [0, 0, 0, 10000, true]],
  [331, [-2, 0, 0, 1, false]],
  [331, [8, 0, 0, 1, false]],
  [331, [0, -0, 0, 1, false]],
  [331, [0, 0, -0, 1, false]],
  [332, [0, 0, 0, 1, true]],
  [342, [0, 0, 0, 101]],
  [333, [0, 2, 1]],
  [334, [8]],
  [335, [-1]],
  [336, [-1, 2]],
  [337, [-1, 2, true]],
  [337, [7, 2]],
  [337, [7, 2, 1]],
] as Array<[number, unknown[]]>)(
  "rejects malformed native and known raw Enemy %i slots",
  (code, parameters) => {
    expect(() => renderDecompiledCommandList([{ code, indent: 0, parameters }])).toThrow();
    expect(() => compile(dsl.rawDslCommand({ code, parameters }))).toThrow();
  },
);

it("preserves each resource boundary, operand mode, operation and allowed selector independently", () => {
  for (const [helper, code, maximum] of [
    ["changeEnemyHp", 331, 9999],
    ["changeEnemyMp", 332, 9999],
    ["changeEnemyTp", 342, 100],
  ] as const) {
    const create = dsl[helper] as (input: never) => DslCommand;
    for (const [target, index] of [
      [all, -1],
      [{ ...single, index: 0 }, 0],
      [single, 7],
    ] as const) {
      for (const [operation, sign] of [
        ["gain", 0],
        ["lose", 1],
      ] as const) {
        for (const [value, mode, saved] of [
          [{ kind: "constant", value: 1 }, 0, 1],
          [{ kind: "constant", value: maximum }, 0, maximum],
          [{ kind: "variable", variable: { kind: "variable", id: 2 } }, 1, 2],
        ] as const) {
          const input = {
            target,
            operation,
            value,
            ...(code === 331 ? { allowDeath: false } : {}),
          };
          const expected = [
            {
              code,
              indent: 0,
              parameters: [index, sign, mode, saved, ...(code === 331 ? [false] : [])],
            },
            { code: 0, indent: 0, parameters: [] },
          ];
          expect(compile(create(input as never))).toStrictEqual(expected);
          expect(renderDecompiledCommandList(expected).source).not.toContain("rawDslCommand");
        }
      }
    }
    for (const invalid of [undefined, null, NaN, Infinity, -1, -0, 0, 0.5, maximum + 1]) {
      expect(() =>
        create({
          target: all,
          operation: "gain",
          value: { kind: "constant", value: invalid },
          ...(code === 331 ? { allowDeath: false } : {}),
        } as never),
      ).toThrow();
    }
  }
});

it("retains signed numeric enemy indices while rejecting descriptor and mixed-mode input before projection", () => {
  const command = dsl.enemyAppear({ target: { ...single, index: -0 } });
  expect(compile(command)[0]!.parameters).toStrictEqual([-0]);
  expect(
    renderDecompiledCommandList([{ code: 335, indent: 0, parameters: [-0] }]).source,
  ).toContain("index: -0");
  for (const input of [
    Object.assign(Object.create({ inherited: true }), { target: single }),
    Object.defineProperty({ target: single }, "hidden", { value: true }),
    { ...{ target: single }, [Symbol("extra")]: true },
    {
      target: Object.defineProperty({ ...single }, "index", {
        get() {
          throw Error("must not read getter");
        },
        enumerable: true,
      }),
    },
  ])
    expect(() => dsl.enemyAppear(input as never)).toThrow(/MV-DSL-SHAPE/);
  expect(() =>
    dsl.changeEnemyMp({
      target: all,
      operation: "gain",
      value: { kind: "variable", variable: { kind: "variable", id: 2 }, value: 1 },
    } as never),
  ).toThrow(/MV-DSL-SHAPE/);
});

const publicEnemyTypeChecks = () => {
  // @ts-expect-error Enemy HP requires an explicit allowDeath Boolean.
  dsl.changeEnemyHp({ target: all, operation: "gain", value: { kind: "constant", value: 1 } });
  // @ts-expect-error Enemy Appear accepts only one enemy position.
  dsl.enemyAppear({ target: all });
  dsl.showBattleAnimation({
    // @ts-expect-error Battle Animation retains a single index independently of allEnemies.
    target: all,
    animation: { kind: "animation", id: 2 },
    allEnemies: true,
  });
  // @ts-expect-error Resource operands use named modes.
  dsl.changeEnemyMp({ target: single, operation: "gain", value: 1 });
};
void publicEnemyTypeChecks;
