import { expect, it } from "vitest";
import {
  commonEvent,
  mapRef,
  transferPlayer,
  variableRef,
  setEventLocation,
  setVehicleLocation,
  getLocationInfo,
  mapEvent,
  page,
  troopEvent,
  type DslCommand,
} from "../src/index.js";
import { compileCommonEvent } from "../src/compiler/events.js";
import { buildStagedDataGraph, validateStagedDataGraph } from "../src/validation/staged-graph.js";
import { readRawCommandList } from "../src/decompiler/core.js";
import { renderDecompiledCommandList } from "../src/decompiler/dispatch.js";

it("uses only the accepted retain and black Transfer defaults", () => {
  const event = commonEvent({
    id: 1,
    name: "Transfer",
    trigger: "none",
    commands: [
      transferPlayer({
        destination: { kind: "direct", map: mapRef({ id: 1 }), x: 0, y: 2147483647 },
      }),
    ],
  });
  const graph = buildStagedDataGraph({
    declarations: [event],
    snapshotReferences: { maps: [{ id: 1, name: "Map" }] },
  });
  expect(compileCommonEvent(event, { nextId: 1, resolver: graph.resolver }).list).toStrictEqual([
    { code: 201, indent: 0, parameters: [0, 1, 0, 2147483647, 0, 0] },
    { code: 0, indent: 0, parameters: [] },
  ]);
});

it.each([
  ["negative zero", -0],
  ["negative", -1],
  ["fraction", 0.5],
  ["overflow", 2147483648],
  ["NaN", NaN],
  ["infinity", Infinity],
  ["negative infinity", -Infinity],
] as const)("rejects %s consistently at each direct coordinate boundary", (_name, value) => {
  const current = { kind: "runtimeSelector", scope: "character", target: "currentEvent" };
  const cases = [
    {
      kind: "transferPlayer",
      code: 201,
      field: "destination",
      input: { destination: { kind: "direct", map: mapRef({ id: 1 }), x: 0, y: 0 } },
      slots: [2, 3],
      parameters: [0, 1, 0, 0, 0, 0],
      helper: transferPlayer,
    },
    {
      kind: "setVehicleLocation",
      code: 202,
      field: "destination",
      input: {
        vehicle: "boat",
        destination: { kind: "direct", map: mapRef({ id: 1 }), x: 0, y: 0 },
      },
      slots: [3, 4],
      parameters: [0, 0, 1, 0, 0],
      helper: setVehicleLocation,
    },
    {
      kind: "setEventLocation",
      code: 203,
      field: "destination",
      input: { target: current, destination: { kind: "direct", x: 0, y: 0 } },
      slots: [2, 3],
      parameters: [0, 0, 0, 0, 0],
      helper: setEventLocation,
    },
    {
      kind: "getLocationInfo",
      code: 285,
      field: "location",
      input: {
        variable: variableRef({ id: 1 }),
        info: "terrainTag",
        location: { kind: "direct", x: 0, y: 0 },
      },
      slots: [3, 4],
      parameters: [1, 0, 0, 0, 0],
      helper: getLocationInfo,
    },
  ];
  for (const c of cases)
    for (const [axisIndex, axis] of ["x", "y"].entries()) {
      const base = (c.input as Record<string, unknown>)[c.field] as Record<string, unknown>;
      const input = { ...c.input, [c.field]: { ...base, [axis]: value } };
      expect(() => c.helper(input as never)).toThrow(new RegExp(`MV-E${c.code}`));
      const event = commonEvent({
        id: 1,
        name: "Direct boundary",
        trigger: "none",
        commands: [{ ...input, kind: c.kind } as DslCommand],
      });
      const graph = buildStagedDataGraph({
        declarations: [event],
        snapshotReferences: { maps: [{ id: 1, name: "Map" }], variableCapacity: 1 },
      });
      expect(() => compileCommonEvent(event, { nextId: 1, resolver: graph.resolver })).toThrow(
        new RegExp(`commands\\[0\\].${c.field}.${axis}`),
      );
      const parameters = [...c.parameters];
      parameters[c.slots[axisIndex]!] = value;
      expect(() => readRawCommandList([{ code: c.code, indent: 0, parameters }])).toThrow();
    }
});

it("rejects extra Map and Variable reference helper inputs before those fields can be discarded", () => {
  expect(() => mapRef({ id: 1, extra: true } as never)).toThrow();
  expect(() => variableRef({ id: 1, name: "also present" } as never)).toThrow();
});

it("warns against actual fixed and containing-map bounds while preserving distinct query consequences", () => {
  const commands = [
    transferPlayer({ destination: { kind: "direct", map: mapRef({ id: 1 }), x: 4, y: 0 } }),
    setVehicleLocation({
      vehicle: "boat",
      destination: { kind: "direct", map: mapRef({ id: 1 }), x: 5, y: 0 },
    }),
    setEventLocation({
      target: { kind: "runtimeSelector", scope: "character", target: "event", id: 99 },
      destination: { kind: "direct", x: 6, y: 0 },
    }),
    ...(["terrainTag", "regionId", "tileLayer1", "eventId"] as const).map((info) =>
      getLocationInfo({
        variable: variableRef({ id: 1 }),
        info,
        location: { kind: "direct", x: 4, y: 0 },
      }),
    ),
  ];
  const event = mapEvent({
    mapId: 1,
    id: 1,
    name: "Bounds",
    x: 0,
    y: 0,
    pages: [page({ commands })],
  });
  const input = {
    declarations: [event],
    snapshotReferences: { maps: [{ id: 1, name: "Map" }], variableCapacity: 1 },
    snapshotMaps: [{ id: 1, width: 4, height: 3, eventLocations: [] }],
  };
  const result = validateStagedDataGraph(buildStagedDataGraph(input), { scriptEnabled: false });
  expect(result.issues.filter((issue) => issue.level === "error")).toEqual([]);
  expect(result.issues.filter((issue) => issue.code?.endsWith("-BOUNDS"))).toHaveLength(7);
  expect(result.issues).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: "MV-E201-BOUNDS",
        dslPath: "pages[0].commands[0].destination.x",
        nativePath: "pages[0].list[0].parameters[2]",
      }),
      expect.objectContaining({ code: "MV-E203-TARGET", dslPath: "pages[0].commands[2].target" }),
      expect.objectContaining({
        code: "MV-E285-BOUNDS",
        message: expect.stringContaining("array index"),
      }),
      expect.objectContaining({
        code: "MV-E285-BOUNDS",
        message: expect.stringContaining("exact coordinate"),
      }),
    ]),
  );
  const common = commonEvent({
    id: 1,
    name: "Unknown running map",
    trigger: "none",
    commands: commands.slice(2),
  });
  expect(
    validateStagedDataGraph(buildStagedDataGraph({ ...input, declarations: [common] }), {
      scriptEnabled: false,
    }).issues,
  ).toEqual([]);
  const battle = troopEvent({ troopId: 1, pages: [{ commands: [commands[0]!] }] });
  expect(
    validateStagedDataGraph(
      buildStagedDataGraph({
        ...input,
        declarations: [battle],
        snapshotTroops: [{ id: 1, members: [] }],
      }),
      { scriptEnabled: false },
    ).issues,
  ).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        level: "warning",
        code: "MV-E201-CONTEXT",
        message: expect.stringContaining("stall"),
      }),
    ]),
  );
});

it("locates fixed Project Data Reference failures without rejecting unresolved runtime event selectors", () => {
  const event = commonEvent({
    id: 1,
    name: "References",
    trigger: "none",
    commands: [
      transferPlayer({ destination: { kind: "direct", map: mapRef({ id: 9 }), x: 0, y: 0 } }),
    ],
  });
  const graph = buildStagedDataGraph({ declarations: [event] });
  expect(() => compileCommonEvent(event, { nextId: 1, resolver: graph.resolver })).toThrow(
    /commands\[0\]\.destination\.map/,
  );
  expect(validateStagedDataGraph(graph, { scriptEnabled: false }).issues).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: "MV-E201-REFERENCE",
        dslPath: "commands[0].destination.map",
      }),
    ]),
  );
});

it("enforces the same native and known-raw saved slots without silently repairing Event exchange padding", () => {
  const invalid: Array<[number, unknown[], number]> = [
    [201, [0, 1, 2147483648, 0, 0, 0], 2],
    [201, [1, 1, 0, 3, 0, 0], 2],
    [202, [0, 0, 1, 0, 2147483648], 4],
    [202, [0, 1, 1, 2, 0], 4],
    [203, [-1, 0, 0, 0, 0], 0],
    [203, [0, 2, -1, 0, 0], 2],
    [203, [0, 2, 1, 1, 0], 3],
    [203, [0, 2, 1, -0, 0], 3],
    [203, [0, 0, 2147483648, 0, 0], 2],
    [203, [0, 1, 0, 1, 0], 2],
    [285, [1, 7, 0, 0, 0], 1],
    [285, [1, 0, 2, 0, 0], 2],
    [285, [1, 0, 0, 0, 2147483648], 4],
    [285, [1, 0, 1, 0, 2], 3],
  ];
  for (const [code, parameters, slot] of invalid) {
    expect(() => readRawCommandList([{ code, indent: 0, parameters }])).toThrow(
      new RegExp(`parameters\\[${slot}\\]`),
    );
    const event = commonEvent({
      id: 1,
      name: "Raw reject",
      trigger: "none",
      commands: [{ kind: "rawDslCommand", code, parameters } as never],
    });
    const graph = buildStagedDataGraph({
      declarations: [event],
      snapshotReferences: { maps: [{ id: 1, name: "Map" }], variableCapacity: 3 },
    });
    expect(() => compileCommonEvent(event, { nextId: 1, resolver: graph.resolver })).toThrow(
      new RegExp(`parameters\\[${slot}\\]`),
    );
  }
  expect(() =>
    readRawCommandList([{ code: 203, indent: 0, parameters: [0, 2, 1, 42, 0] }]),
  ).toThrow(/UNSUPPORTED/);
  const rendered = renderDecompiledCommandList(
    readRawCommandList([
      { code: 203, indent: 0, parameters: [0, 2, 99, 0, 8] },
      { code: 285, indent: 0, parameters: [1, 5, 1, 2, 3] },
      { code: 0, indent: 0, parameters: [] },
    ]),
  ).source;
  expect(rendered).toContain(
    'setEventLocation({ target: { kind: "runtimeSelector", scope: "character", target: "currentEvent" }, destination: { kind: "exchange", target: { kind: "runtimeSelector", scope: "character", target: "event", id: 99 } }, direction: "up" })',
  );
  expect(rendered).toContain('info: "tileLayer4"');
});

it("preserves all seven Location Info queries in direct and variable modes including unnamed output slots", () => {
  for (const [info, encoded] of [
    ["terrainTag", 0],
    ["eventId", 1],
    ["tileLayer1", 2],
    ["tileLayer2", 3],
    ["tileLayer3", 4],
    ["tileLayer4", 5],
    ["regionId", 6],
  ] as const) {
    const event = commonEvent({
      id: 1,
      name: "Queries",
      trigger: "none",
      commands: [
        getLocationInfo({
          variable: variableRef({ id: 1 }),
          info,
          location: { kind: "direct", x: 2147483647, y: 10000 },
        }),
        getLocationInfo({
          variable: variableRef({ id: 1 }),
          info,
          location: { kind: "variables", x: variableRef({ id: 2 }), y: variableRef({ id: 3 }) },
        }),
      ],
    });
    const graph = buildStagedDataGraph({
      declarations: [event],
      snapshotReferences: { variableCapacity: 3 },
    });
    expect(compileCommonEvent(event, { nextId: 1, resolver: graph.resolver }).list).toStrictEqual([
      { code: 285, indent: 0, parameters: [1, encoded, 0, 2147483647, 10000] },
      { code: 285, indent: 0, parameters: [1, encoded, 1, 2, 3] },
      { code: 0, indent: 0, parameters: [] },
    ]);
  }
});

it("expresses Event Location direct, variables and exchange with the event-only selector subset", () => {
  const current = { kind: "runtimeSelector", scope: "character", target: "currentEvent" } as const;
  const other = { kind: "runtimeSelector", scope: "character", target: "event", id: 99 } as const;
  for (const [direction, encoded] of [
    ["retain", 0],
    ["down", 2],
    ["left", 4],
    ["right", 6],
    ["up", 8],
  ] as const) {
    const event = commonEvent({
      id: 1,
      name: "Event locations",
      trigger: "none",
      commands: [
        setEventLocation({
          target: current,
          destination: { kind: "direct", x: 2147483647, y: 0 },
          direction,
        }),
        setEventLocation({
          target: other,
          destination: { kind: "variables", x: variableRef({ id: 2 }), y: variableRef({ id: 3 }) },
          direction,
        }),
        setEventLocation({
          target: current,
          destination: { kind: "exchange", target: other },
          direction,
        }),
      ],
    });
    const graph = buildStagedDataGraph({
      declarations: [event],
      snapshotReferences: { variableCapacity: 3 },
    });
    expect(compileCommonEvent(event, { nextId: 1, resolver: graph.resolver }).list).toStrictEqual([
      { code: 203, indent: 0, parameters: [0, 0, 2147483647, 0, encoded] },
      { code: 203, indent: 0, parameters: [99, 1, 2, 3, encoded] },
      { code: 203, indent: 0, parameters: [0, 2, 99, 0, encoded] },
      { code: 0, indent: 0, parameters: [] },
    ]);
  }
});

it("expresses every Transfer location, direction and fade without numeric aliases", () => {
  const directions = [
    ["retain", 0],
    ["down", 2],
    ["left", 4],
    ["right", 6],
    ["up", 8],
  ] as const;
  const fades = [
    ["black", 0],
    ["white", 1],
    ["none", 2],
  ] as const;
  for (const [direction, directionCode] of directions)
    for (const [fade, fadeCode] of fades) {
      const commands = [
        transferPlayer({
          destination: { kind: "direct", map: mapRef({ id: 1 }), x: 10000, y: 2147483647 },
          direction,
          fade,
        }),
        transferPlayer({
          destination: {
            kind: "variables",
            map: variableRef({ id: 1 }),
            x: variableRef({ id: 2 }),
            y: variableRef({ id: 3 }),
          },
          direction,
          fade,
        }),
      ];
      const event = commonEvent({ id: 1, name: "Transfer modes", trigger: "none", commands });
      const graph = buildStagedDataGraph({
        declarations: [event],
        snapshotReferences: { maps: [{ id: 1, name: "Map" }], variableCapacity: 3 },
      });
      expect(compileCommonEvent(event, { nextId: 1, resolver: graph.resolver }).list).toStrictEqual(
        [
          { code: 201, indent: 0, parameters: [0, 1, 10000, 2147483647, directionCode, fadeCode] },
          { code: 201, indent: 0, parameters: [1, 1, 2, 3, directionCode, fadeCode] },
          { code: 0, indent: 0, parameters: [] },
        ],
      );
    }
});

it("refuses unknown Transfer fields and invalid direct coordinates before mapping", () => {
  const destination = { kind: "direct", map: mapRef({ id: 1 }), x: 0, y: 0 };
  for (const input of [
    { destination, surprise: true },
    { destination, fadeType: 0 },
    { destination, direction: 0 },
    { destination, direction: -0 },
    { destination, fade: null },
    { destination: { ...destination, x: -0 } },
    { destination: { ...destination, x: 2147483648 } },
    { destination: { ...destination, y: undefined } },
    { destination: { ...destination, unused: true } },
  ])
    expect(() => transferPlayer(input as never)).toThrow(/MV-E201/);
});

it("decompiles Transfer retain faithfully and refuses native coordinates beyond the finite saved domain", () => {
  const render = (parameters: unknown[]) =>
    renderDecompiledCommandList(
      readRawCommandList([
        { code: 201, indent: 0, parameters },
        { code: 0, indent: 0, parameters: [] },
      ]),
    );
  expect(render([0, 1, 10000, 2147483647, 0, 0]).source).toContain(
    'transferPlayer({ destination: { kind: "direct", map: mapRef({ id: 1 }), x: 10000, y: 2147483647 } })',
  );
  expect(render([1, 1, 2, 3, 4, 1]).source).toContain('direction: "left", fade: "white"');
  for (const x of [-0, -1, 0.5, 2147483648])
    expect(() => render([0, 1, x, 0, 0, 0])).toThrow(/parameters\[2\]/);
});

it("rejects unsupported authored fields, missing modes and player Event Location targets", () => {
  const current = { kind: "runtimeSelector", scope: "character", target: "currentEvent" };
  const player = { kind: "runtimeSelector", scope: "character", target: "player" };
  const direct = { kind: "direct", x: 0, y: 0 };
  const eventInput = { target: current, destination: direct };
  const vehicleInput = { vehicle: "boat", destination: { ...direct, map: mapRef({ id: 1 }) } };
  const infoInput = { variable: variableRef({ id: 1 }), info: "terrainTag", location: direct };
  for (const input of [
    { ...eventInput, extra: true },
    { ...eventInput, target: player },
    { ...eventInput, destination: { kind: "exchange", target: player } },
    { ...eventInput, destination: { kind: "exchange", target: current, y: 0 } },
    { ...eventInput, destination: { ...direct, x: -0 } },
    { ...eventInput, direction: 0 },
    { ...eventInput, target: undefined },
  ])
    expect(() => setEventLocation(input as never)).toThrow(/MV-E203/);
  for (const input of [
    { ...vehicleInput, extra: true },
    { ...vehicleInput, direction: "up" },
    { ...vehicleInput, vehicle: null },
    { ...vehicleInput, vehicle: "train" },
    { ...vehicleInput, destination: { ...vehicleInput.destination, x: 2147483648 } },
    {
      ...vehicleInput,
      destination: { kind: "variables", map: variableRef({ id: 1 }), x: variableRef({ id: 2 }) },
    },
  ])
    expect(() => setVehicleLocation(input as never)).toThrow(/MV-E202/);
  for (const input of [
    { ...infoInput, extra: true },
    { ...infoInput, info: "tileIdLayer1" },
    { ...infoInput, info: 0 },
    { ...infoInput, variable: null },
    { ...infoInput, location: { kind: "exchange", target: current } },
    { ...infoInput, location: { ...direct, x: -0 } },
    { ...infoInput, location: { kind: "variables", x: variableRef({ id: 2 }), y: undefined } },
  ])
    expect(() => getLocationInfo(input as never)).toThrow(/MV-E285/);
});
