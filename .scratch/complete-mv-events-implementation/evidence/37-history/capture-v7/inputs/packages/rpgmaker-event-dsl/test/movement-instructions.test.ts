import { expect, it } from "vitest";
import {
  commonEvent,
  exitEventProcessing,
  imageAsset,
  mapEvent,
  page,
  rawDslCommand,
  scriptInput,
  setMovementRoute,
  switchDefinition,
  switchRef,
} from "../src/index.js";
import type { MoveRouteCommand } from "../src/index.js";
import { compileCommonEvent, compileMapEvent } from "../src/compiler/events.js";
import {
  buildStagedDataGraph,
  validateDslOwnedDeclarations,
  validateStagedDataGraph,
} from "../src/validation/staged-graph.js";
import { renderDecompiledCommandList } from "../src/decompiler/dispatch.js";
import { blankEvent, blankPage } from "./support/map-event-fixtures.js";
import {
  movementInstructions,
  movementParameterCases,
} from "./support/movement-instruction-fixtures.js";

function compileInstructions(commands: readonly MoveRouteCommand[]) {
  const event = commonEvent({
    id: 1,
    name: "Independent movement instructions",
    trigger: "none",
    commands: [
      setMovementRoute({
        target: { kind: "runtimeSelector", scope: "character", target: "player" },
        route: { commands },
      }),
    ],
  });
  return compileCommonEvent(event, {
    nextId: 1,
    resolver: buildStagedDataGraph({ declarations: [], snapshotReferences: { switchCapacity: 3 } })
      .resolver,
  }).list;
}

it.each(
  movementInstructions.flatMap((item) =>
    (["absent", "null", "zero"] as const).map((indent) => ({ ...item, indent })),
  ),
)(
  "$label preserves $indent record envelopes in both page and forced routes with exact mirrors",
  ({ authored, native, indent }) => {
    const instruction = { ...authored, savedShape: { indent } };
    const expectedInstruction = {
      ...native,
      ...(indent === "absent" ? {} : { indent: indent === "null" ? null : 0 }),
    };
    const expectedRoute = {
      list: [expectedInstruction, { code: 0, parameters: [] }],
      repeat: true,
      skippable: false,
      wait: false,
    };
    expect(compileInstructions([instruction])).toStrictEqual([
      { code: 205, indent: 0, parameters: [-1, expectedRoute] },
      { code: 505, indent: 0, parameters: [expectedInstruction] },
      { code: 0, indent: 0, parameters: [] },
    ]);
    const event = mapEvent({
      mapId: 1,
      id: 1,
      name: blankEvent.name,
      note: blankEvent.note,
      x: 0,
      y: 0,
      pages: [
        page({ commands: [], movement: { type: "fixed", route: { commands: [instruction] } } }),
      ],
    });
    expect(
      compileMapEvent(event, {
        nextId: 1,
        resolver: buildStagedDataGraph({
          declarations: [],
          snapshotReferences: { switchCapacity: 3 },
        }).resolver,
      }),
    ).toStrictEqual({
      ...blankEvent,
      pages: [{ ...blankPage, moveRoute: expectedRoute }],
    });
  },
);

it.each(movementParameterCases)(
  "$label keeps each parameter and independent saved value in both entrances",
  ({ authored, native }) => {
    const expectedRoute = {
      list: [native, { code: 0, parameters: [] }],
      repeat: true,
      skippable: false,
      wait: false,
    };
    expect(compileInstructions([authored])).toStrictEqual([
      { code: 205, indent: 0, parameters: [-1, expectedRoute] },
      { code: 505, indent: 0, parameters: [native] },
      { code: 0, indent: 0, parameters: [] },
    ]);
    const event = mapEvent({
      mapId: 1,
      id: 1,
      name: blankEvent.name,
      note: blankEvent.note,
      x: 0,
      y: 0,
      pages: [
        page({ commands: [], movement: { type: "custom", route: { commands: [authored] } } }),
      ],
    });
    expect(
      compileMapEvent(event, {
        nextId: 1,
        resolver: buildStagedDataGraph({
          declarations: [],
          snapshotReferences: { switchCapacity: 3 },
        }).resolver,
      }),
    ).toStrictEqual({
      ...blankEvent,
      pages: [{ ...blankPage, moveType: 3, moveRoute: expectedRoute }],
    });
  },
);

it.each(movementInstructions)(
  "$label rejects malformed native shells, fields and slots through Decompile and recognized raw",
  ({ native }) => {
    const invalidRecords = [
      { ...native, indent: -1 },
      { ...native, indent: 1 },
      { ...native, indent: 0.5 },
      { ...native, indent: -0 },
      { ...native, indent: undefined },
      { ...native, extra: true },
      { ...native, parameters: [] },
      ...(native.parameters === undefined
        ? [
            { ...native, parameters: null },
            { ...native, parameters: [1] },
          ]
        : [
            { code: native.code },
            { ...native, parameters: null },
            { ...native, parameters: [...native.parameters, 1] },
            { ...native, parameters: native.parameters.map(() => null) },
          ]),
    ];
    for (const instruction of invalidRecords) {
      const route = {
        list: [instruction, { code: 0 }],
        repeat: false,
        skippable: true,
        wait: false,
      };
      const commands = [
        { code: 205, indent: 0, parameters: [-1, route] },
        { code: 505, indent: 0, parameters: [instruction] },
        { code: 0, indent: 0, parameters: [] },
      ];
      expect(() => renderDecompiledCommandList(commands)).toThrow(
        new RegExp(
          "indent" in instruction && instruction.indent === undefined
            ? "MV-STRICT-JSON"
            : "MV-MOVEMENT-SHAPE",
        ),
      );
      const event = commonEvent({
        id: 1,
        name: "Malformed known raw",
        trigger: "none",
        commands: commands.slice(0, -1).map(rawDslCommand),
      });
      expect(() =>
        compileCommonEvent(event, {
          nextId: 1,
          resolver: buildStagedDataGraph({
            declarations: [],
            snapshotReferences: { switchCapacity: 3 },
          }).resolver,
        }),
      ).toThrow(/MV-MOVEMENT-SHAPE|MV-STRICT-JSON/);
    }
  },
);

it.each(movementInstructions)(
  "$label rejects unauthorised authored fields and saved shapes in both entrances",
  ({ authored }) => {
    for (const invalid of [
      { ...authored, parameters: [] },
      { ...authored, code: 1 },
      { ...authored, savedShape: { indent: 0 } },
      { ...authored, savedShape: { indent: "zero", parameters: "empty" } },
    ]) {
      expect(() => compileInstructions([invalid as unknown as MoveRouteCommand])).toThrow(
        /MV-MOVEMENT-SHAPE/,
      );
      const event = mapEvent({
        mapId: 1,
        id: 1,
        name: "Invalid saved instruction",
        x: 0,
        y: 0,
        pages: [
          page({
            commands: [],
            movement: { route: { commands: [invalid as unknown as MoveRouteCommand] } },
          }),
        ],
      });
      expect(() =>
        compileMapEvent(event, {
          nextId: 1,
          resolver: buildStagedDataGraph({ declarations: [] }).resolver,
        }),
      ).toThrow(/MV-MOVEMENT-SHAPE/);
    }
  },
);

it.each([
  { kind: "switchOn", switch: { kind: "variable", id: 1 } },
  { kind: "switchOn", switch: { kind: "switch", id: 1, name: "Named" } },
  { kind: "switchOff", switch: { kind: "switch", id: 1, extra: true } },
  { kind: "switchOff", switch: { kind: "switch" } },
])("M27 M28 reject untyped non-switch or ambiguous reference shapes: %j", (instruction) => {
  expect(() => compileInstructions([instruction as unknown as MoveRouteCommand])).toThrow(
    /MV-MOVEMENT-SHAPE/,
  );
});

it("M15 uses the shared wait kind and preserves the explicit frames and finite saved shape", () => {
  expect(
    compileInstructions([{ kind: "wait", frames: 999, savedShape: { indent: "zero" } }]),
  ).toStrictEqual([
    {
      code: 205,
      indent: 0,
      parameters: [
        -1,
        {
          list: [
            { code: 15, parameters: [999], indent: 0 },
            { code: 0, parameters: [] },
          ],
          repeat: true,
          skippable: false,
          wait: false,
        },
      ],
    },
    { code: 505, indent: 0, parameters: [{ code: 15, parameters: [999], indent: 0 }] },
    { code: 0, indent: 0, parameters: [] },
  ]);
});

it("M41 preserves None and big-character index seven independently with the current character fields", () => {
  expect(
    compileInstructions([
      { kind: "changeImage", character: null, characterIndex: 7 },
      {
        kind: "changeImage",
        character: imageAsset({ folder: "characters", name: "!$Huge" }),
        characterIndex: 7,
      },
    ]),
  ).toStrictEqual([
    {
      code: 205,
      indent: 0,
      parameters: [
        -1,
        {
          list: [
            { code: 41, parameters: ["", 7] },
            { code: 41, parameters: ["!$Huge", 7] },
            { code: 0, parameters: [] },
          ],
          repeat: true,
          skippable: false,
          wait: false,
        },
      ],
    },
    { code: 505, indent: 0, parameters: [{ code: 41, parameters: ["", 7] }] },
    { code: 505, indent: 0, parameters: [{ code: 41, parameters: ["!$Huge", 7] }] },
    { code: 0, indent: 0, parameters: [] },
  ]);
});

it.each([
  ["normal", 0],
  ["additive", 1],
  ["multiply", 2],
  ["screen", 3],
] as const)("M43 encodes explicit symbolic %s mode as native %s", (blendMode, native) => {
  const list = compileInstructions([{ kind: "changeBlendMode", blendMode }]);
  expect((list[0]!.parameters[1] as { list: unknown[] }).list).toStrictEqual([
    { code: 43, parameters: [native] },
    { code: 0, parameters: [] },
  ]);
  expect(list[1]).toStrictEqual({
    code: 505,
    indent: 0,
    parameters: [{ code: 43, parameters: [native] }],
  });
});

it("M44 preserves None and independent explicitly supplied SE values", () => {
  const list = compileInstructions([
    { kind: "playSe", audio: { asset: null, volume: 17, pitch: 73, pan: -41 } },
  ]);
  expect((list[0]!.parameters[1] as { list: unknown[] }).list).toStrictEqual([
    { code: 44, parameters: [{ name: "", volume: 17, pitch: 73, pan: -41 }] },
    { code: 0, parameters: [] },
  ]);
  expect(list[1]).toStrictEqual({
    code: 505,
    indent: 0,
    parameters: [{ code: 44, parameters: [{ name: "", volume: 17, pitch: 73, pan: -41 }] }],
  });
});

it("preserves a nonempty character asset name without trimming its literal contents", () => {
  const list = compileInstructions([
    {
      kind: "changeImage",
      character: imageAsset({ folder: "characters", name: " \t " }),
      characterIndex: 0,
    },
  ]);
  expect((list[0]!.parameters[1] as { list: unknown[] }).list).toStrictEqual([
    { code: 41, parameters: [" \t ", 0] },
    { code: 0, parameters: [] },
  ]);
});

it.each([
  [-100, 0],
  [100, 0],
  [0.5, 0],
  [0, -100],
  [0, 100],
  [0, 0.5],
])(
  "M14 rejects jump outside its independent relative-coordinate domain (%s,%s) in formal, native and known raw",
  (x, y) => {
    expect(() => compileInstructions([{ kind: "jump", x, y }])).toThrow(/MV-MOVEMENT-PARAMETER/);
    const movement = { code: 14, parameters: [x, y] };
    const route = { list: [movement, { code: 0 }], repeat: false, skippable: true, wait: true };
    const native = [
      { code: 205, indent: 0, parameters: [-1, route] },
      { code: 505, indent: 0, parameters: [movement] },
      { code: 0, indent: 0, parameters: [] },
    ];
    expect(() => renderDecompiledCommandList(native)).toThrow(/MV-MOVEMENT-PARAMETER/);
    const event = commonEvent({
      id: 1,
      name: "Known raw jump",
      trigger: "none",
      commands: native.slice(0, -1).map((record) => rawDslCommand(record)),
    });
    expect(() =>
      compileCommonEvent(event, {
        nextId: 1,
        resolver: buildStagedDataGraph({ declarations: [] }).resolver,
      }),
    ).toThrow(/MV-MOVEMENT-PARAMETER/);
  },
);

it.each([
  ["M15 zero", { kind: "wait", frames: 0 }],
  ["M15 above", { kind: "wait", frames: 1000 }],
  ["M15 fraction", { kind: "wait", frames: 1.5 }],
  ["M29 below", { kind: "changeSpeed", speed: 0 }],
  ["M29 above", { kind: "changeSpeed", speed: 7 }],
  ["M29 fraction", { kind: "changeSpeed", speed: 1.5 }],
  ["M30 below", { kind: "changeFrequency", frequency: 0 }],
  ["M30 above", { kind: "changeFrequency", frequency: 6 }],
  ["M30 fraction", { kind: "changeFrequency", frequency: 1.5 }],
  ["M41 below", { kind: "changeImage", character: null, characterIndex: -1 }],
  ["M41 above", { kind: "changeImage", character: null, characterIndex: 8 }],
  ["M41 fraction", { kind: "changeImage", character: null, characterIndex: 0.5 }],
  ["M42 below", { kind: "changeOpacity", opacity: -1 }],
  ["M42 above", { kind: "changeOpacity", opacity: 256 }],
  ["M42 fraction", { kind: "changeOpacity", opacity: 0.5 }],
  ["M43 unknown", { kind: "changeBlendMode", blendMode: "overlay" }],
  ["M43 old numeric", { kind: "changeBlendMode", blendMode: 1 }],
])("%s rejects an authored parameter outside its accepted domain", (_label, value) => {
  expect(() => compileInstructions([value as MoveRouteCommand])).toThrow(/MV-MOVEMENT-PARAMETER/);
});

it.each([
  [15, [0]],
  [15, [1000]],
  [15, [0.5]],
  [29, [0]],
  [29, [7]],
  [29, [1.5]],
  [30, [0]],
  [30, [6]],
  [30, [1.5]],
  [41, ["", -1]],
  [41, ["", 8]],
  [41, ["", 0.5]],
  [42, [-1]],
  [42, [256]],
  [42, [0.5]],
  [43, [-1]],
  [43, [4]],
  [43, [0.5]],
])("rejects native movement M%s invalid parameters %j before decompiling", (code, parameters) => {
  const instruction = { code, parameters };
  expect(() =>
    renderDecompiledCommandList([
      {
        code: 205,
        indent: 0,
        parameters: [
          -1,
          { list: [instruction, { code: 0 }], repeat: true, skippable: false, wait: false },
        ],
      },
      { code: 505, indent: 0, parameters: [instruction] },
      { code: 0, indent: 0, parameters: [] },
    ]),
  ).toThrow(/MV-MOVEMENT-PARAMETER/);
});

it.each([
  ["volume below", -1, 100, 0],
  ["volume above", 101, 100, 0],
  ["volume fraction", 0.5, 100, 0],
  ["pitch below", 90, 49, 0],
  ["pitch above", 90, 151, 0],
  ["pitch fraction", 90, 100.5, 0],
  ["pan below", 90, 100, -101],
  ["pan above", 90, 100, 101],
  ["pan fraction", 90, 100, 0.5],
])("M44 rejects %s in formal and native SE objects", (_label, volume, pitch, pan) => {
  expect(() =>
    compileInstructions([
      { kind: "playSe", audio: { asset: null, volume: volume as number, pitch, pan } },
    ]),
  ).toThrow(/MV-MOVEMENT-PARAMETER/);
  const instruction = { code: 44, parameters: [{ name: "", volume, pitch, pan }] };
  expect(() =>
    renderDecompiledCommandList([
      {
        code: 205,
        indent: 0,
        parameters: [
          -1,
          { list: [instruction, { code: 0 }], repeat: false, skippable: false, wait: true },
        ],
      },
      { code: 505, indent: 0, parameters: [instruction] },
      { code: 0, indent: 0, parameters: [] },
    ]),
  ).toThrow(/MV-MOVEMENT-PARAMETER/);
});

it.each([
  { kind: "walkAnimation", enabled: "false" },
  { kind: "stepAnimation", enabled: 0 },
  { kind: "directionFix", enabled: null },
  { kind: "through", enabled: [] },
  { kind: "transparent", enabled: {} },
  {
    kind: "changeImage",
    character: { kind: "asset", category: "image", folder: "faces", name: "Actor1" },
    characterIndex: 0,
  },
  {
    kind: "changeImage",
    character: { kind: "asset", category: "image", folder: "characters", name: "" },
    characterIndex: 0,
  },
  {
    kind: "changeImage",
    character: {
      kind: "asset",
      category: "image",
      folder: "characters",
      name: "Actor1",
      extra: true,
    },
    characterIndex: 0,
  },
  { kind: "playSe", audio: { asset: null, volume: 90, pitch: 100 } },
  {
    kind: "playSe",
    audio: {
      asset: { kind: "asset", category: "audio", folder: "bgm", name: "Battle1" },
      volume: 90,
      pitch: 100,
      pan: 0,
    },
  },
  { kind: "playSe", audio: { asset: null, volume: 90, pitch: 100, pan: 0, extra: true } },
  { kind: "script", script: { kind: "other", code: "" } },
  { kind: "script", script: { kind: "scriptInput", code: "", extra: true } },
])("rejects untyped movement core values without coercion or field loss: %j", (value) => {
  expect(() => compileInstructions([value as MoveRouteCommand])).toThrow(/MV-MOVEMENT-SHAPE/);
});

it("M45 retains a complete single slot beyond twelve lines and warns on original CR and LF without changing Gate", () => {
  const code = " \t\r\n" + "// fixture\n".repeat(14) + "\rfinal tail \t";
  const instruction = { kind: "script" as const, script: scriptInput({ code }) };
  const list = compileInstructions([instruction]);
  expect((list[0]!.parameters[1] as { list: unknown[] }).list).toStrictEqual([
    { code: 45, parameters: [code] },
    { code: 0, parameters: [] },
  ]);
  const event = commonEvent({
    id: 1,
    name: "M45 warnings",
    trigger: "none",
    commands: [
      setMovementRoute({
        target: { kind: "runtimeSelector", scope: "character", target: "player" },
        route: { commands: [instruction] },
      }),
    ],
  });
  const open = validateDslOwnedDeclarations([event], { scriptEnabled: true });
  expect(open.issues.filter((issue) => issue.level === "error")).toStrictEqual([]);
  expect(open.issues).toContainEqual(
    expect.objectContaining({
      code: "MV-MOVEMENT-TEXT-RISK",
      level: "warning",
      identity: "commonEvent:1",
      nativePath: "list[0].parameters[1].list[0].parameters[0]",
    }),
  );
  const closed = validateDslOwnedDeclarations([event], { scriptEnabled: false });
  expect(closed.issues).toContainEqual(
    expect.objectContaining({ code: "MV-SCRIPT-GATE", level: "error" }),
  );
});

it("M27 M28 use current declared names, capacity-only unnamed IDs and late reference errors in saved noncustom routes", () => {
  const event = (instruction: MoveRouteCommand) =>
    mapEvent({
      mapId: 1,
      id: 1,
      name: "Saved references",
      x: 0,
      y: 0,
      pages: [
        page({ commands: [], movement: { type: "random", route: { commands: [instruction] } } }),
      ],
    });
  const declarations = [
    switchDefinition({ id: 1, name: "Unique" }),
    switchDefinition({ id: 2, name: "Duplicate" }),
    switchDefinition({ id: 3, name: "Duplicate" }),
  ];
  for (const kind of ["switchOn", "switchOff"] as const) {
    for (const reference of [switchRef({ id: 4 }), switchRef({ name: "Unique" })]) {
      const graph = buildStagedDataGraph({
        declarations: [event({ kind, switch: reference }), ...declarations],
        snapshotReferences: { switchCapacity: 4 },
      });
      expect(
        validateStagedDataGraph(graph, { scriptEnabled: false }).issues.filter(
          (issue) => issue.level === "error",
        ),
      ).toStrictEqual([]);
      expect(
        (
          compileMapEvent(event({ kind, switch: reference }), {
            nextId: 1,
            resolver: graph.resolver,
          }).pages![0]!.moveRoute as { list: unknown[] }
        ).list[0],
      ).toStrictEqual({
        code: kind === "switchOn" ? 27 : 28,
        parameters: ["id" in reference ? 4 : 1],
      });
    }
    for (const [reference, expected] of [
      [switchRef({ id: 5 }), "Unknown switch reference id: 5"],
      [switchRef({ name: "Missing" }), "Unknown switch reference: Missing"],
      [switchRef({ name: "Duplicate" }), "Ambiguous switch reference: Duplicate"],
    ] as const) {
      const graph = buildStagedDataGraph({
        declarations: [event({ kind, switch: reference }), ...declarations],
        snapshotReferences: { switchCapacity: 4 },
      });
      expect(validateStagedDataGraph(graph, { scriptEnabled: false }).issues).toContainEqual(
        expect.objectContaining({ level: "error", message: expect.stringContaining(expected) }),
      );
    }
  }
});

it.each(["", " \t", "\r", "\n", "\r\n"])(
  "M45 gates unreachable formal and raw scripts and both complete mirror locations without testing string truthiness: %j",
  (code) => {
    const movement = { code: 45, parameters: [code] };
    const route = { list: [movement, { code: 0 }], repeat: false, skippable: false, wait: false };
    for (const commands of [
      [
        exitEventProcessing(),
        setMovementRoute({
          target: { kind: "runtimeSelector", scope: "character", target: "player" },
          route: { commands: [{ kind: "script", script: scriptInput({ code }) }] },
        }),
      ],
      [
        exitEventProcessing(),
        rawDslCommand({ code: 205, parameters: [-1, route] }),
        rawDslCommand({ code: 505, parameters: [movement] }),
      ],
    ]) {
      const event = commonEvent({ id: 1, name: "Unreachable scripts", trigger: "none", commands });
      const closed = validateDslOwnedDeclarations([event], { scriptEnabled: false }).issues;
      for (const nativePath of [
        "list[1].parameters[1].list[0].parameters[0]",
        "list[2].parameters[0].parameters[0]",
      ])
        expect(closed).toContainEqual(
          expect.objectContaining({ code: "MV-SCRIPT-GATE", level: "error", nativePath }),
        );
      const open = validateDslOwnedDeclarations([event], { scriptEnabled: true }).issues;
      expect(open.filter((issue) => issue.level === "error")).toStrictEqual([]);
      expect(open.filter((issue) => issue.code === "MV-MOVEMENT-TEXT-RISK")).toHaveLength(
        /[\r\n]/u.test(code) ? 2 : 0,
      );
    }
  },
);
