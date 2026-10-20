import { expect, it } from "vitest";
import { commonEvent, rawDslCommand, setMovementRoute } from "../src/index.js";
import { compileCommonEvent } from "../src/compiler/events.js";
import type { RawEventCommand } from "../src/compiler/types.js";
import { renderDecompiledCommandList } from "../src/decompiler/dispatch.js";
import {
  buildStagedDataGraph,
  validateDslOwnedDeclarations,
} from "../src/validation/staged-graph.js";

const resolver = buildStagedDataGraph({ declarations: [] }).resolver;

it.each([
  [false, false, false],
  [false, false, true],
  [false, true, false],
  [false, true, true],
  [true, false, false],
  [true, false, true],
  [true, true, false],
  [true, true, true],
])(
  "preserves route flags repeat=%s skippable=%s wait=%s without runtime-based normalization",
  (repeat, skippable, wait) => {
    const event = commonEvent({
      id: 1,
      name: "Flags",
      trigger: "none",
      commands: [
        setMovementRoute({
          target: { kind: "runtimeSelector", scope: "character", target: "player" },
          route: { commands: [], repeat, skippable, wait },
        }),
      ],
    });
    expect(compileCommonEvent(event, { nextId: 1, resolver }).list).toStrictEqual([
      {
        code: 205,
        indent: 0,
        parameters: [-1, { list: [{ code: 0, parameters: [] }], repeat, skippable, wait }],
      },
      { code: 0, indent: 0, parameters: [] },
    ]);
  },
);

it("compiles a shared Movement Route with exact defaults, record envelopes and 505 mirrors", () => {
  const event = commonEvent({
    id: 1,
    name: "Route",
    trigger: "none",
    commands: [
      setMovementRoute({
        target: { kind: "runtimeSelector", scope: "character", target: "player" },
        route: { commands: [{ kind: "moveDown" }, { kind: "jump", x: 2, y: -1 }] },
      }),
    ],
  });
  expect(compileCommonEvent(event, { nextId: 1, resolver }).list).toStrictEqual([
    {
      code: 205,
      indent: 0,
      parameters: [
        -1,
        {
          list: [{ code: 1 }, { code: 14, parameters: [2, -1] }, { code: 0, parameters: [] }],
          repeat: true,
          skippable: false,
          wait: false,
        },
      ],
    },
    { code: 505, indent: 0, parameters: [{ code: 1 }] },
    { code: 505, indent: 0, parameters: [{ code: 14, parameters: [2, -1] }] },
    { code: 0, indent: 0, parameters: [] },
  ]);
});

it("validates Script Gate and switch references in recognized raw 205 and 505 routes", () => {
  const route = {
    list: [{ code: 27, parameters: [99] }, { code: 45, parameters: ["1"] }, { code: 0 }],
    repeat: false,
    skippable: false,
    wait: false,
  };
  const event = commonEvent({
    id: 1,
    name: "Raw route",
    trigger: "none",
    commands: [
      rawDslCommand({ code: 205, parameters: [-1, route] }),
      rawDslCommand({ code: 505, parameters: [{ code: 27, parameters: [99] }] }),
      rawDslCommand({ code: 505, parameters: [{ code: 45, parameters: ["1"] }] }),
    ],
  });
  const issues = validateDslOwnedDeclarations([event], { scriptEnabled: false }).issues;
  expect(issues).toContainEqual(
    expect.objectContaining({
      code: "MV-MOVEMENT-SCRIPT",
      nativePath: expect.stringContaining("list[1]"),
    }),
  );
  expect(issues).toContainEqual(
    expect.objectContaining({
      code: "MV-MOVEMENT-REFERENCE",
      message: expect.stringContaining("Unknown switch reference id: 99"),
    }),
  );
});

const mirroredList: RawEventCommand[] = [
  {
    code: 205,
    indent: 0,
    parameters: [
      -1,
      {
        list: [
          { code: 1 },
          {
            code: 44,
            indent: null,
            parameters: [{ name: "Cursor1", volume: 37, pitch: 102, pan: -5 }],
          },
          { code: 0 },
        ],
        repeat: false,
        skippable: true,
        wait: true,
      },
    ],
  },
  { code: 505, indent: 0, parameters: [{ code: 1 }] },
  {
    code: 505,
    indent: 0,
    parameters: [
      {
        code: 44,
        indent: null,
        parameters: [{ name: "Cursor1", volume: 37, pitch: 102, pan: -5 }],
      },
    ],
  },
  { code: 0, indent: 0, parameters: [] },
];

function mirrorAt(list: RawEventCommand[], index: number): Record<string, unknown> {
  return list[index]!.parameters[0] as Record<string, unknown>;
}

it("rejects extra array keys in recognized raw movement parameters before compilation can copy the array", () => {
  const parameters = Object.assign([{ code: 1 }], { extra: true });
  const event = commonEvent({
    id: 1,
    name: "Raw array",
    trigger: "none",
    commands: [
      rawDslCommand({
        code: 205,
        parameters: [
          -1,
          { list: [{ code: 1 }, { code: 0 }], repeat: true, skippable: false, wait: false },
        ],
      }),
      rawDslCommand({ code: 505, parameters }),
    ],
  });
  expect(validateDslOwnedDeclarations([event], { scriptEnabled: false }).issues).toContainEqual(
    expect.objectContaining({ code: "MV-STRICT-JSON", dslPath: "commands[1]" }),
  );
});

it.each([
  ["missing mirror", (list: RawEventCommand[]) => list.splice(1, 1)],
  [
    "wrong outer indent",
    (list: RawEventCommand[]) => {
      list[1]!.indent = 1;
    },
  ],
  [
    "extra mirror",
    (list: RawEventCommand[]) =>
      list.splice(3, 0, { code: 505, indent: 0, parameters: [{ code: 0 }] }),
  ],
  [
    "wrong order",
    (list: RawEventCommand[]) => {
      [list[1], list[2]] = [list[2]!, list[1]!];
    },
  ],
  [
    "missing versus null",
    (list: RawEventCommand[]) => {
      mirrorAt(list, 1).indent = null;
    },
  ],
  [
    "null versus zero",
    (list: RawEventCommand[]) => {
      mirrorAt(list, 2).indent = 0;
    },
  ],
  [
    "nested value",
    (list: RawEventCommand[]) => {
      (mirrorAt(list, 2).parameters as Record<string, unknown>[])[0]!.pan = 0;
    },
  ],
  [
    "nested extra key",
    (list: RawEventCommand[]) => {
      (mirrorAt(list, 2).parameters as Record<string, unknown>[])[0]!.extra = 0;
    },
  ],
  [
    "mirror array length",
    (list: RawEventCommand[]) => {
      list[1]!.parameters.push({ code: 1 });
    },
  ],
])("rejects a complete 205/505 mirror difference: %s", (_name, mutate) => {
  const list = structuredClone(mirroredList);
  mutate(list);
  expect(() => renderDecompiledCommandList(list)).toThrow(/MV-MOVEMENT-MIRROR/);
});

it.each(
  [
    [],
    [{ code: 0 }, { code: 0 }],
    [{ code: 0, indent: null }],
    [{ code: 0, indent: 0 }],
    [{ code: 0, parameters: [1] }],
    [{ code: 1 }],
    [{ code: 0, parameters: undefined }],
  ].map((records) => ({ records })),
)(
  "rejects a missing, duplicate, nonfinal or malformed route terminator $records",
  ({ records }) => {
    const list = [
      {
        code: 205,
        indent: 0,
        parameters: [-1, { list: records, repeat: true, skippable: false, wait: false }],
      },
    ];
    expect(() => renderDecompiledCommandList(list)).toThrow(/MV-MOVEMENT-|MV-STRICT-JSON/);
  },
);

it.each(["absent", "null", "zero"] as const)(
  "preserves the finite %s indent state on both parameter families",
  (indent) => {
    const event = commonEvent({
      id: 1,
      name: "Shape",
      trigger: "none",
      commands: [
        setMovementRoute({
          target: { kind: "runtimeSelector", scope: "character", target: "player" },
          route: {
            commands: [
              { kind: "turnDown", savedShape: { indent } },
              { kind: "jump", x: 1, y: -1, savedShape: { indent } },
            ],
            terminator: { parameters: "absent" },
          },
        }),
      ],
    });
    const list = compileCommonEvent(event, { nextId: 1, resolver }).list;
    const expected =
      indent === "absent"
        ? [{ code: 16 }, { code: 14, parameters: [1, -1] }, { code: 0 }]
        : indent === "null"
          ? [
              { code: 16, indent: null },
              { code: 14, parameters: [1, -1], indent: null },
              { code: 0 },
            ]
          : [{ code: 16, indent: 0 }, { code: 14, parameters: [1, -1], indent: 0 }, { code: 0 }];
    expect((list[0]!.parameters[1] as { list: unknown[] }).list).toStrictEqual(expected);
  },
);

it("uses fixed defaults for omitted, empty and optional undefined saved descriptors", () => {
  for (const route of [
    { commands: [{ kind: "turnDown" }] },
    { commands: [{ kind: "turnDown", savedShape: {} }], terminator: {} },
    {
      commands: [{ kind: "turnDown", savedShape: { indent: undefined } }],
      repeat: undefined,
      skippable: undefined,
      wait: undefined,
      terminator: { parameters: undefined },
    },
  ]) {
    const event = commonEvent({
      id: 1,
      name: "Defaults",
      trigger: "none",
      commands: [
        setMovementRoute({
          target: { kind: "runtimeSelector", scope: "character", target: "player" },
          route: route as never,
        }),
      ],
    });
    expect(compileCommonEvent(event, { nextId: 1, resolver }).list).toStrictEqual([
      {
        code: 205,
        indent: 0,
        parameters: [
          -1,
          {
            list: [{ code: 16 }, { code: 0, parameters: [] }],
            repeat: true,
            skippable: false,
            wait: false,
          },
        ],
      },
      { code: 505, indent: 0, parameters: [{ code: 16 }] },
      { code: 0, indent: 0, parameters: [] },
    ]);
  }
});

it.each([
  { code: 46 },
  { code: 1, parameters: [] },
  { code: 1, indent: 1 },
  { code: 1, indent: "zero" },
  { code: 1, extra: true },
  { code: 15 },
  { code: 15, parameters: [1, 2] },
])("rejects an unsupported native movement envelope %j", (record) => {
  const list = structuredClone(mirroredList);
  (list[0]!.parameters[1] as { list: unknown[] }).list[0] = record;
  list[1]!.parameters = [record];
  expect(() => renderDecompiledCommandList(list)).toThrow(/MV-MOVEMENT-/);
});

it.each([
  { commands: [], repeat: 0 },
  { commands: [], terminator: { indent: "null" } },
  { commands: [{ kind: "moveDown", savedShape: { indent: 0 } }] },
  { commands: [{ kind: "moveDown", parameters: [] }] },
  { commands: [{ kind: "raw", code: 1 }] },
  { commands: [undefined] },
])("rejects malformed authored shared route state %j at the DSL location", (route) => {
  const event = commonEvent({
    id: 1,
    name: "Bad route",
    trigger: "none",
    commands: [
      setMovementRoute({
        target: { kind: "runtimeSelector", scope: "character", target: "player" },
        route: route as never,
      }),
    ],
  });
  expect(validateDslOwnedDeclarations([event], { scriptEnabled: false }).issues).toContainEqual(
    expect.objectContaining({
      code: "MV-MOVEMENT-SHAPE",
      identity: "commonEvent:1",
      dslPath: expect.stringContaining("commands[0].route"),
    }),
  );
});

it("decompiles explicit null/zero envelopes and an absent M0 parameter key without exposing 505", () => {
  const list = [
    {
      code: 205,
      indent: 0,
      parameters: [
        -1,
        {
          list: [{ code: 1, indent: null }, { code: 15, indent: 0, parameters: [4] }, { code: 0 }],
          repeat: false,
          skippable: true,
          wait: true,
        },
      ],
    },
    { code: 505, indent: 0, parameters: [{ code: 1, indent: null }] },
    { code: 505, indent: 0, parameters: [{ code: 15, indent: 0, parameters: [4] }] },
    { code: 0, indent: 0, parameters: [] },
  ];
  const rendered = renderDecompiledCommandList(list);
  expect(rendered.helperNames).toEqual(["setMovementRoute"]);
  expect(rendered.source).toContain('savedShape: { indent: "null" }');
  expect(rendered.source).toContain('savedShape: { indent: "zero" }');
  expect(rendered.source).toContain('terminator: { parameters: "absent" }');
  expect(rendered.source).toContain("repeat: false, skippable: true, wait: true");
  expect(rendered.source).toContain("route: { commands:");
});
