import { expect, it } from "vitest";
import { recordEvidence } from "./support/mv-evidence.js";

function commandIt(name: string, verify: () => unknown) {
  it(`MV-S6-CHARACTER-005: ${name}`, async () => {
    const startedAt = new Date().toISOString();
    try {
      verify();
      await recordEvidence({
        requirementId: "MV-S6-CHARACTER-005",
        startedAt,
        stages: ["Independent command literals through accepted command seam", name],
        expected: name,
        actual: "All complete-data and diagnostic assertions passed",
      });
    } catch (error) {
      await recordEvidence({
        requirementId: "MV-S6-CHARACTER-005",
        startedAt,
        stages: [name],
        expected: name,
        actual: "Verification failed; raw failure retained",
        error,
      });
      throw error;
    }
  });
}

import {
  commonEvent,
  mapEvent,
  page,
  troopEvent,
  battlePage,
  scrollMap,
  showBalloonIcon,
  showAnimation,
  animationRef,
  changeTransparency,
  changePlayerFollowers,
  getOnOffVehicle,
  eraseEvent,
  gatherFollowers,
  rawDslCommand,
  type DslCommand,
} from "../src/index.js";
import { compileCommonEvent } from "../src/compiler/events.js";
import { renderDecompiledCommandList } from "../src/decompiler/dispatch.js";
import {
  buildStagedDataGraph,
  validateDslOwnedDeclarations,
} from "../src/validation/staged-graph.js";

function compile(commands: readonly DslCommand[]) {
  const event = commonEvent({ id: 1, name: "Characters", trigger: "none", commands });
  const graph = buildStagedDataGraph({
    declarations: [event],
    snapshotReferences: { animations: [{ id: 1, name: "" }] },
  });
  return compileCommonEvent(event, { nextId: 1, resolver: graph.resolver }).list;
}

commandIt("encodes named cardinal Scroll Map directions and retains zero distance", () => {
  const commands = [
    scrollMap({ direction: "down", distance: 0, speed: 1 } as never),
    scrollMap({ direction: "left", distance: 100, speed: 6 } as never),
    scrollMap({ direction: "right", distance: -0, speed: 4 } as never),
    scrollMap({ direction: "up", distance: 1, speed: 3 } as never),
  ];
  expect(compile(commands)).toStrictEqual([
    { code: 204, indent: 0, parameters: [2, 0, 1] },
    { code: 204, indent: 0, parameters: [4, 100, 6] },
    { code: 204, indent: 0, parameters: [6, -0, 4] },
    { code: 204, indent: 0, parameters: [8, 1, 3] },
    { code: 0, indent: 0, parameters: [] },
  ]);
  expect(
    renderDecompiledCommandList([{ code: 204, indent: 0, parameters: [6, -0, 4] }]).source,
  ).toContain('scrollMap({ direction: "right", distance: -0, speed: 4 })');
});

commandIt("warns about map/common/battle execution context while retaining valid selectors", () => {
  const commands = [
    showAnimation({
      target: { kind: "runtimeSelector", scope: "character", target: "event", id: 99 },
      animation: animationRef({ id: 1 }),
      wait: true,
    }),
    rawDslCommand({ code: 213, parameters: [99, 15, true] }),
    eraseEvent(),
    gatherFollowers(),
    scrollMap({ direction: "left", distance: 0, speed: 6 }),
    getOnOffVehicle(),
    changeTransparency({ transparent: true }),
    changePlayerFollowers({ visible: false }),
  ];
  const result = validateDslOwnedDeclarations(
    [
      commonEvent({ id: 1, name: "Caller context", trigger: "none", commands }),
      mapEvent({ mapId: 1, id: 1, name: "Map context", x: 0, y: 0, pages: [page({ commands })] }),
      troopEvent({ troopId: 1, pages: [battlePage({ conditions: { turnEnd: true }, commands })] }),
    ],
    {
      scriptEnabled: false,
      snapshotReferences: { animations: [{ id: 1, name: "" }], troops: [{ id: 1, name: "" }] },
      snapshotTroops: [{ id: 1, members: [] }],
    },
  );
  expect(result.issues.filter((issue) => issue.level === "error")).toEqual([]);
  expect(result.issues).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: "MV-E212-CONTEXT",
        identity: "map:1/event:1",
        level: "warning",
        nativePath: "pages[0].list[0].parameters[0]",
        dslPath: "pages[0].commands[0].target",
      }),
      expect.objectContaining({
        code: "MV-E213-CONTEXT",
        identity: "map:1/event:1",
        level: "warning",
        dslPath: "pages[0].commands[1].parameters[0]",
      }),
      expect.objectContaining({
        code: "MV-E214-CONTEXT",
        identity: "commonEvent:1",
        level: "warning",
      }),
      expect.objectContaining({
        code: "MV-E217-CONTEXT",
        identity: "commonEvent:1",
        level: "warning",
      }),
      expect.objectContaining({ code: "MV-E204-CONTEXT", identity: "troop:1", level: "warning" }),
      expect.objectContaining({ code: "MV-E212-CONTEXT", identity: "troop:1", level: "warning" }),
      expect.objectContaining({ code: "MV-E206-CONTEXT", identity: "troop:1", level: "warning" }),
    ]),
  );
  const missing = validateDslOwnedDeclarations(
    [
      commonEvent({
        id: 1,
        name: "Fixed missing",
        trigger: "none",
        commands: [
          showAnimation({
            target: { kind: "runtimeSelector", scope: "character", target: "player" },
            animation: animationRef({ id: 99 }),
            wait: false,
          }),
        ],
      }),
    ],
    { scriptEnabled: false },
  );
  expect(missing.issues).toContainEqual(
    expect.objectContaining({
      level: "error",
      code: "MV-E212-REFERENCE",
      dslPath: "commands[0].animation",
    }),
  );
});

commandIt("requires complete authored value domains before enum or flag encoding", () => {
  const player = { kind: "runtimeSelector", scope: "character", target: "player" };
  const cases: Array<[string, (input: never) => DslCommand, Record<string, unknown>, string]> = [];
  for (const direction of [2, 0, -0, "retain", null, undefined])
    cases.push(["scrollMap", scrollMap, { direction, distance: 0, speed: 1 }, "direction"]);
  for (const distance of [-1, 101, 0.1, NaN, Infinity, null, undefined])
    cases.push(["scrollMap", scrollMap, { direction: "down", distance, speed: 1 }, "distance"]);
  for (const speed of [0, 7, 0.5, null, undefined])
    cases.push(["scrollMap", scrollMap, { direction: "down", distance: 0, speed }, "speed"]);
  for (const flag of [null, undefined, 0, 1, "false"]) {
    cases.push(["changeTransparency", changeTransparency, { transparent: flag }, "transparent"]);
    cases.push(["changePlayerFollowers", changePlayerFollowers, { visible: flag }, "visible"]);
    cases.push([
      "showAnimation",
      showAnimation,
      { target: player, animation: { kind: "animation", id: 1 }, wait: flag },
      "wait",
    ]);
    cases.push([
      "showBalloonIcon",
      showBalloonIcon,
      { target: player, balloon: "heart", wait: flag },
      "wait",
    ]);
  }
  for (const balloon of [0, 1, 15, 16, -0, "none", "userDefined6", null, undefined])
    cases.push([
      "showBalloonIcon",
      showBalloonIcon,
      { target: player, balloon, wait: false },
      "balloon",
    ]);
  for (const target of [
    null,
    undefined,
    { kind: "runtimeSelector", scope: "actor", target: "entireParty" },
    { kind: "runtimeSelector", scope: "character", target: "event", id: 0 },
    { kind: "runtimeSelector", scope: "character", target: "event", id: 1.5 },
    {
      kind: "runtimeSelector",
      scope: "character",
      target: "event",
      id: Number.MAX_SAFE_INTEGER + 1,
    },
    { kind: "runtimeSelector", scope: "character", target: "vehicle" },
  ])
    cases.push([
      "showBalloonIcon",
      showBalloonIcon,
      { target, balloon: "heart", wait: false },
      "target",
    ]);
  for (const animation of [
    null,
    undefined,
    { kind: "item", id: 1 },
    { kind: "animation", id: 0 },
    { kind: "animation", id: -0 },
    { kind: "animation", id: 1, name: "x" },
    { kind: "animation", name: undefined },
  ])
    cases.push([
      "showAnimation",
      showAnimation,
      { target: player, animation, wait: false },
      "animation",
    ]);
  for (const [kind, helper, input, field] of cases) {
    expect(() => helper(input as never), `${kind}.${field} helper`).toThrow();
    try {
      compile([{ kind, ...input } as never]);
      expect.fail(`${kind}.${field} accepted`);
    } catch (error) {
      expect(error).toMatchObject({
        location: { dslPath: expect.stringContaining(`commands[0].${field}`) },
      });
    }
  }
});

commandIt("rejects malformed known native and raw character slots before decompilation", () => {
  const cases: Array<[number, unknown[], string]> = [
    [204, [0, 0, 1], "[0]"],
    [204, [2, -1, 1], "[1]"],
    [204, [2, 101, 1], "[1]"],
    [204, [2, 0, 0], "[2]"],
    [204, [2, 0, 7], "[2]"],
    [204, [2, 0, 1, false], ""],
    [206, [0], ""],
    [214, [0], ""],
    [217, [false], ""],
    [211, [-0], "[0]"],
    [211, [2], "[0]"],
    [216, [-0], "[0]"],
    [216, [2], "[0]"],
    [212, [-0, 1, false], "[0]"],
    [212, [-2, 1, false], "[0]"],
    [212, [0, 0, false], "[1]"],
    [212, [0, 1], ""],
    [212, [0, 1, 0], "[2]"],
    [213, [0, 0, false], "[1]"],
    [213, [0, 16, false], "[1]"],
    [213, [0, 1.5, false], "[1]"],
    [213, [0, 1, null], "[2]"],
  ];
  for (const [code, parameters, suffix] of cases) {
    try {
      renderDecompiledCommandList([{ code, indent: 0, parameters }]);
      expect.fail(`E${code} accepted`);
    } catch (error) {
      expect(error).toMatchObject({
        code: `MV-E${code}-PARAMETERS`,
        location: { nativePath: `list[0].parameters${suffix}` },
      });
    }
    try {
      compile([rawDslCommand({ code, parameters })]);
      expect.fail(`raw E${code} accepted`);
    } catch (error) {
      expect(error).toMatchObject({
        code: `MV-E${code}-PARAMETERS`,
        location: { dslPath: `commands[0].parameters${suffix}` },
      });
    }
  }
});

commandIt("preserves both explicit flag values and exact parameterless command slots", () => {
  expect(
    compile([
      changeTransparency({ transparent: true }),
      changeTransparency({ transparent: false }),
      changePlayerFollowers({ visible: true }),
      changePlayerFollowers({ visible: false }),
      getOnOffVehicle(),
      eraseEvent(),
      gatherFollowers(),
    ]),
  ).toStrictEqual([
    { code: 211, indent: 0, parameters: [0] },
    { code: 211, indent: 0, parameters: [1] },
    { code: 216, indent: 0, parameters: [0] },
    { code: 216, indent: 0, parameters: [1] },
    { code: 206, indent: 0, parameters: [] },
    { code: 214, indent: 0, parameters: [] },
    { code: 217, indent: 0, parameters: [] },
    { code: 0, indent: 0, parameters: [] },
  ]);
});

commandIt("refuses owned helper fields before projection and direct command unknown fields", () => {
  const player = { kind: "runtimeSelector", scope: "character", target: "player" };
  const cases = [
    [scrollMap, { direction: "down", distance: 0, speed: 1 }],
    [changeTransparency, { transparent: true }],
    [showAnimation, { target: player, animation: { kind: "animation", id: 1 }, wait: false }],
    [showBalloonIcon, { target: player, balloon: "userDefined5", wait: false }],
    [changePlayerFollowers, { visible: false }],
  ] as const;
  for (const [helper, input] of cases) {
    expect(() => helper({ ...input, unexpected: true } as never)).toThrow(/MV-DSL-SHAPE/);
    const valid = helper(input as never);
    expect(() => compile([{ ...valid, unexpected: true } as never])).toThrow(/MV-DSL-SHAPE/);
  }
  for (const helper of [getOnOffVehicle, eraseEvent, gatherFollowers]) {
    expect(() => (helper as (...args: unknown[]) => unknown)({ target: player })).toThrow(
      /MV-E\d+-INPUT/,
    );
    expect(() => compile([{ ...helper(), wait: false } as never])).toThrow(/MV-DSL-SHAPE/);
  }
});

commandIt("supports all fifteen named balloon icons without numeric aliases", () => {
  const cases = [
    ["exclamation", 1],
    ["question", 2],
    ["musicNote", 3],
    ["heart", 4],
    ["anger", 5],
    ["sweat", 6],
    ["cobweb", 7],
    ["silence", 8],
    ["lightBulb", 9],
    ["zzz", 10],
    ["userDefined1", 11],
    ["userDefined2", 12],
    ["userDefined3", 13],
    ["userDefined4", 14],
    ["userDefined5", 15],
  ] as const;
  for (const [balloon, native] of cases) {
    expect(
      compile([
        showBalloonIcon({
          target: { kind: "runtimeSelector", scope: "character", target: "player" },
          balloon,
          wait: false,
        } as never),
      ]),
    ).toStrictEqual([
      { code: 213, indent: 0, parameters: [-1, native, false] },
      { code: 0, indent: 0, parameters: [] },
    ]);
    expect(
      renderDecompiledCommandList([{ code: 213, indent: 0, parameters: [-1, native, false] }])
        .source,
    ).toContain(`balloon: "${balloon}"`);
  }
});

commandIt("decompiles explicit false waits for animations and balloons", () => {
  expect(
    compile([
      showAnimation({
        target: { kind: "runtimeSelector", scope: "character", target: "currentEvent" },
        animation: animationRef({ id: 1 }),
        wait: false,
      }),
    ]),
  ).toStrictEqual([
    { code: 212, indent: 0, parameters: [0, 1, false] },
    { code: 0, indent: 0, parameters: [] },
  ]);
  expect(
    renderDecompiledCommandList([
      { code: 212, indent: 0, parameters: [0, 1, false] },
      { code: 213, indent: 0, parameters: [1, 15, false] },
    ]).source,
  ).toBe(
    [
      'showAnimation({ target: { kind: "runtimeSelector", scope: "character", target: "currentEvent" }, animation: animationRef({ id: 1 }), wait: false }),',
      'showBalloonIcon({ target: { kind: "runtimeSelector", scope: "character", target: "event", id: 1 }, balloon: "userDefined5", wait: false }),',
    ].join("\n"),
  );
});
