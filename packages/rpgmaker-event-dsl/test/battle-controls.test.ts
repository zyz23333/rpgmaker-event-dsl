import { expect, it } from "vitest";
import {
  battleProcessing,
  commonEvent,
  comment,
  rawDslCommand,
  type DslCommand,
} from "../src/index.js";
import { compileCommonEvent } from "../src/compiler/events.js";
import { renderDecompiledCommandList } from "../src/decompiler/dispatch.js";
import { buildStagedDataGraph } from "../src/validation/staged-graph.js";
import { forceAction, abortBattle } from "../src/index.js";

const resolver = buildStagedDataGraph({
  declarations: [],
  snapshotReferences: {
    troops: [{ id: 2, name: "Bats" }],
    actors: [{ id: 2, name: "Hero" }],
    skills: [{ id: 2, name: "Heal" }],
    variableCapacity: 2,
  },
}).resolver;
function compile(command: DslCommand) {
  return compileCommonEvent(
    commonEvent({ id: 1, name: "Battle", trigger: "none", commands: [command] }),
    { nextId: 1, resolver },
  ).list;
}
const troops: Array<[unknown, number[]]> = [
  [{ kind: "fixed", troop: { kind: "troop", id: 2 } }, [0, 2]],
  [{ kind: "variable", variable: { kind: "variable", id: 2 } }, [1, 2]],
  [{ kind: "randomEncounter" }, [2, 0]],
];
it.each(troops)(
  "preserves all Battle Processing flags and required saved result bodies for %j",
  (troop, pair) => {
    for (const [canEscape, canLose, branches] of [
      [false, false, []],
      [true, false, [601, 602]],
      [false, true, [601, 603]],
      [true, true, [601, 602, 603]],
    ] as const) {
      const body = { commands: [] };
      const command = battleProcessing({
        troop,
        canEscape,
        canLose,
        ...(branches.length ? { win: body } : {}),
        ...(canEscape ? { escape: body } : {}),
        ...(canLose ? { lose: body } : {}),
      } as never);
      const expected = [
        { code: 301, indent: 0, parameters: [...pair, canEscape, canLose] },
        ...branches.flatMap((code) => [
          { code, indent: 0, parameters: [] },
          { code: 0, indent: 1, parameters: [] },
        ]),
        ...(branches.length ? [{ code: 604, indent: 0, parameters: [] }] : []),
        { code: 0, indent: 0, parameters: [] },
      ];
      expect(compile(command)).toStrictEqual(expected);
      expect(renderDecompiledCommandList(expected).source).not.toContain("rawDslCommand");
    }
  },
);

it.each([
  [{ kind: "runtimeSelector", scope: "battler", target: "enemy", index: 7 }, 0, 7],
  [
    { kind: "runtimeSelector", scope: "battler", target: "actor", actor: { kind: "actor", id: 2 } },
    1,
    2,
  ],
] as const)("preserves Force Action subject %j and every named target", (subject, mode, id) => {
  for (const [target, index] of [
    [{ kind: "lastTarget" }, -2],
    [{ kind: "random" }, -1],
    [{ kind: "index", index: 0 }, 0],
    [{ kind: "index", index: 7 }, 7],
  ] as const) {
    const command = forceAction({ subject, skill: { kind: "skill", id: 2 }, target } as never);
    expect(compile(command)).toStrictEqual([
      { code: 339, indent: 0, parameters: [mode, id, 2, index] },
      { code: 0, indent: 0, parameters: [] },
    ]);
    const rendered = renderDecompiledCommandList([
      { code: 339, indent: 0, parameters: [mode, id, 2, index] },
    ]);
    expect(rendered.source).toContain(`target: { kind: "${target.kind}"`);
    expect(rendered.source).not.toContain("actorId");
  }
});
it.each([
  { subject: { kind: "runtimeSelector", scope: "battler", target: "all" } },
  { subject: { kind: "runtimeSelector", scope: "battler", target: "enemy", index: 8 } },
  { subject: { kind: "runtimeSelector", scope: "battler", target: "actor", actorId: 2 } },
  { target: { kind: "index", index: -1 } },
  { target: { kind: "index", index: 8 } },
  { target: { kind: "random", index: 7 } },
  { targetIndex: -1 },
  { extra: true },
])("rejects unsupported Force Action input %j", (invalid) => {
  const input = {
    subject: { kind: "runtimeSelector", scope: "battler", target: "enemy", index: 0 },
    skill: { kind: "skill", id: 2 },
    target: { kind: "lastTarget" },
    ...invalid,
  };
  expect(() => forceAction(input as never)).toThrow();
  expect(() => compile({ kind: "forceAction", ...input } as never)).toThrow();
});
it.each([
  [339, [-0, 0, 2, -1]],
  [339, [0, -1, 2, -1]],
  [339, [0, 8, 2, -1]],
  [339, [1, 0, 2, -1]],
  [339, [0, 0, 2, -3]],
  [339, [0, 0, 2, 8]],
  [340, [true]],
] as Array<[number, unknown[]]>)(
  "refuses malformed Force/Abort native and raw %i",
  (code, parameters) => {
    expect(() => renderDecompiledCommandList([{ code, indent: 0, parameters }])).toThrow();
    expect(() => compile(rawDslCommand({ code, parameters }))).toThrow();
  },
);
it("requires exactly zero Abort Battle inputs and saved slots", () => {
  expect(compile(abortBattle())).toStrictEqual([
    { code: 340, indent: 0, parameters: [] },
    { code: 0, indent: 0, parameters: [] },
  ]);
  expect(() => (abortBattle as (...args: unknown[]) => DslCommand)({})).toThrow();
  expect(() => compile({ kind: "abortBattle", canEscape: true } as never)).toThrow();
});
it("preserves absent and present Battle child markers independently", () => {
  const command = battleProcessing({
    troop: { kind: "randomEncounter" },
    canEscape: true,
    win: { commands: [comment({ lines: ["win"] })], endMarker: "absent" },
    escape: { commands: [comment({ lines: ["escape"] })] },
  } as never);
  const expected = [
    { code: 301, indent: 0, parameters: [2, 0, true, false] },
    { code: 601, indent: 0, parameters: [] },
    { code: 108, indent: 1, parameters: ["win"] },
    { code: 602, indent: 0, parameters: [] },
    { code: 108, indent: 1, parameters: ["escape"] },
    { code: 0, indent: 1, parameters: [] },
    { code: 604, indent: 0, parameters: [] },
    { code: 0, indent: 0, parameters: [] },
  ];
  expect(compile(command)).toStrictEqual(expected);
  expect(renderDecompiledCommandList(expected).source).toContain(
    'win: { commands: [comment({ lines: ["win"] }),], endMarker: "absent" }',
  );
});
it.each([
  { canEscape: true },
  { canLose: true, win: { commands: [] } },
  { win: { commands: [] } },
  { canEscape: true, win: { commands: [] }, escape: { commands: [] }, lose: { commands: [] } },
  { canEscape: true, win: { commands: [], endMarker: "absent" }, escape: { commands: [] } },
  { canEscape: true, win: [], escape: [] },
  { troop: { kind: "randomEncounter", troop: { kind: "troop", id: 2 } } },
  { extra: true },
])("rejects invalid flag/body/input relationships before helper projection: %j", (invalid) => {
  const input = { troop: { kind: "randomEncounter" }, ...invalid };
  expect(() => battleProcessing(input as never)).toThrow();
  expect(() => compile({ kind: "battleProcessing", ...input } as never)).toThrow();
});
it.each(
  (
    [
      [0, 2, false, false, 0],
      [2, 1, false, false],
      [-0, 2, false, false],
      [2, -0, false, false],
      [2, 0, 0, false],
    ] as unknown[][]
  ).map((parameters) => ({ parameters })),
)("rejects noncanonical Battle native header %j", ({ parameters }) => {
  expect(() => renderDecompiledCommandList([{ code: 301, indent: 0, parameters }])).toThrow(
    /MV-E301/,
  );
  expect(() => compile(rawDslCommand({ code: 301, parameters }))).toThrow(/MV-E301/);
});
it("rejects raw and native branch structures which disagree with Battle flags or saved order", () => {
  const header = { code: 301, indent: 0, parameters: [2, 0, false, false] };
  const bodies = [
    { code: 601, indent: 0, parameters: [] },
    { code: 0, indent: 1, parameters: [] },
    { code: 604, indent: 0, parameters: [] },
  ];
  expect(() => renderDecompiledCommandList([header, ...bodies])).toThrow(/MV-BATTLE-BRANCH/);
  expect(() =>
    renderDecompiledCommandList([{ ...header, parameters: [2, 0, true, false] }]),
  ).toThrow(/MV-BATTLE-BRANCH/);
});

it("rejects every malformed result boundary and extra continuation slots through native and known raw input", () => {
  const header = { code: 301, indent: 0, parameters: [2, 0, true, true] };
  const marker = { code: 0, indent: 1, parameters: [] };
  const win = { code: 601, indent: 0, parameters: [] };
  const escape = { code: 602, indent: 0, parameters: [] };
  const lose = { code: 603, indent: 0, parameters: [] };
  const close = { code: 604, indent: 0, parameters: [] };
  for (const body of [
    [escape, marker, win, marker, lose, marker, close],
    [win, marker, win, marker, escape, marker, lose, marker, close],
    [win, marker, escape, marker, close],
    [win, marker, escape, marker, lose, marker],
    [win, escape, marker, lose, marker, close],
    [win, marker, escape, marker, lose, marker, close, close],
    [{ ...win, parameters: [0] }, marker, escape, marker, lose, marker, close],
    [win, marker, escape, marker, lose, marker, { ...close, parameters: [0] }],
  ]) {
    const list = [header, ...body];
    expect(() => renderDecompiledCommandList(list)).toThrow();
    const commands = list.map(({ code, indent, parameters }) =>
      rawDslCommand({ code, indent, parameters }),
    );
    expect(() =>
      compileCommonEvent(commonEvent({ id: 1, name: "Malformed", trigger: "none", commands }), {
        nextId: 1,
        resolver,
      }),
    ).toThrow();
  }
  expect(() => renderDecompiledCommandList([close])).toThrow();
});

it("keeps body marker ownership and named Force index signed zero", () => {
  const body = battleProcessing({
    troop: { kind: "randomEncounter" },
    canEscape: true,
    win: { commands: [rawDslCommand({ code: 0, indent: 1, parameters: [] })] },
    escape: { commands: [] },
  });
  expect(() => compile(body)).toThrow(/MV-BODY-MARKER-CONFLICT/);
  expect(() =>
    battleProcessing({
      troop: { kind: "randomEncounter" },
      canEscape: true,
      win: { commands: Array(1) },
      escape: { commands: [] },
    } as never),
  ).toThrow(/MV-DSL-SHAPE/);
  const command = forceAction({
    subject: { kind: "runtimeSelector", scope: "battler", target: "enemy", index: -0 },
    skill: { kind: "skill", id: 2 },
    target: { kind: "index", index: -0 },
  });
  expect(compile(command)[0]!.parameters).toStrictEqual([0, -0, 2, -0]);
  expect(
    renderDecompiledCommandList([{ code: 339, indent: 0, parameters: [0, -0, 2, -0] }]).source,
  ).toContain('target: { kind: "index", index: -0 }');
});

const publicBattleTypeChecks = () => {
  // @ts-expect-error The fixed troop reference is nested inside its named mode.
  battleProcessing({ troop: { kind: "troop", id: 2 } });
  // @ts-expect-error Battle result bodies are named Child Command Body objects.
  battleProcessing({ troop: { kind: "randomEncounter" }, canEscape: true, win: [], escape: [] });
  forceAction({
    // @ts-expect-error Force Action's Actor subject uses an Actor reference.
    subject: { kind: "runtimeSelector", scope: "battler", target: "actor", actorId: 2 },
    skill: { kind: "skill", id: 2 },
    target: { kind: "random" },
  });
  forceAction({
    subject: { kind: "runtimeSelector", scope: "battler", target: "enemy", index: 0 },
    skill: { kind: "skill", id: 2 },
    // @ts-expect-error Force Action targets use named modes.
    targetIndex: -1,
  });
};
void publicBattleTypeChecks;
