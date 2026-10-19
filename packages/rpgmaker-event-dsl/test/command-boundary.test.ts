import { expect, it } from "vitest";
import { commonEvent, rawDslCommand, mapEvent, page } from "../src/index.js";
import { compileCommonEvent, compileMapEvent } from "../src/compiler/events.js";
import { renderDecompiledCommandList } from "../src/decompiler/dispatch.js";
import { readRawCommandList } from "../src/decompiler/core.js";
import { buildStagedDataGraph, validateStagedDataGraph } from "../src/validation/staged-graph.js";

const resolver = buildStagedDataGraph({ declarations: [] }).resolver;

it("reports the real raw source position before a native record exists", () => {
  const invalid = commonEvent({
    id: 1,
    name: "Second raw record",
    trigger: "none",
    commands: [
      rawDslCommand({ code: 999, parameters: [] }),
      { kind: "rawDslCommand", code: 230, parameters: null } as never,
    ],
  });
  const issue = validateStagedDataGraph(buildStagedDataGraph({ declarations: [invalid] }), {
    scriptEnabled: true,
  }).issues.find((candidate) => candidate.code === "MV-COMMAND-ENVELOPE");
  expect(issue).toMatchObject({ dslPath: "commands[1].parameters" });
  expect(issue?.nativePath).toBeUndefined();
});

it("reports both mirror locations within the correct native Page", () => {
  const route = {
    list: [{ code: 1 }, { code: 0 }],
    repeat: false,
    skippable: false,
    wait: false,
  };
  try {
    readRawCommandList(
      [
        { code: 205, indent: 0, parameters: [-1, route] },
        { code: 505, indent: 0, parameters: [{ code: 2 }] },
        { code: 0, indent: 0, parameters: [] },
      ],
      "map:1/event:1",
      "pages[2].",
    );
    expect.fail("Expected mirror mismatch");
  } catch (error) {
    expect(error).toMatchObject({
      location: {
        nativePath: "pages[2].list[1]",
        relatedLocations: [
          expect.objectContaining({ nativePath: "pages[2].list[0].parameters[1].list[0]" }),
        ],
      },
    });
  }
});

it("rejects non-data Page movement fields before reading accessors", () => {
  let reads = 0;
  const getter = Object.defineProperty({}, "speed", {
    enumerable: true,
    get: () => {
      reads++;
      return 3;
    },
  });
  for (const movement of [getter, Object.create({ speed: 3 })]) {
    const declaration = mapEvent({
      mapId: 1,
      id: 1,
      name: "Movement",
      x: 0,
      y: 0,
      pages: [page({ commands: [], movement })],
    });
    expect(() => compileMapEvent(declaration, { nextId: 1, resolver })).toThrow(/MV-PAGE-MOVEMENT/);
  }
  expect(reads).toBe(0);
});

it("preserves unknown single-record raw values with explicit absolute zero indentation", () => {
  const command = { code: 999, indent: 0, parameters: [-0, { nested: [null, " \r\n ", -0] }] };
  const rendered = renderDecompiledCommandList([command]);
  expect(rendered.source).toContain("indent: 0");
  expect(rendered.source).toContain('parameters: [-0,{"nested":[null," \\r\\n ",-0]}]');
  const declaration = commonEvent({
    trigger: "none",
    id: 1,
    name: "Unknown",
    commands: [rawDslCommand(command)],
  });
  expect(compileCommonEvent(declaration, { nextId: 1, resolver }).list).toStrictEqual([
    command,
    { code: 0, indent: 0, parameters: [] },
  ]);
});

it("preserves and gates a saved Movement Route even on a fixed Map Event Page", () => {
  const declaration = mapEvent({
    mapId: 1,
    id: 1,
    name: "Inactive script",
    x: 0,
    y: 0,
    pages: [
      page({
        movement: {
          type: "fixed",
          speed: 6,
          frequency: 1,
          route: {
            commands: [
              {
                kind: "script",
                script: { kind: "scriptInput", code: "" },
                savedShape: { indent: "null" },
              },
            ],
            repeat: false,
            skippable: true,
            wait: true,
            terminator: { parameters: "absent" },
          },
        },
        commands: [],
      } as never),
    ],
  });
  const graph = buildStagedDataGraph({
    declarations: [declaration],
    snapshotMaps: [{ id: 1, width: 2, height: 2, eventLocations: [] }],
  });
  expect(validateStagedDataGraph(graph, { scriptEnabled: false }).issues).toContainEqual(
    expect.objectContaining({
      code: "MV-SCRIPT-GATE",
      identity: "map:1/event:1",
      nativePath: "pages[0].moveRoute.list[0].parameters[0]",
      stage: "compile",
      level: "error",
    }),
  );
  expect(
    validateStagedDataGraph(graph, { scriptEnabled: true }).issues.filter(
      (issue) => issue.level === "error",
    ),
  ).toEqual([]);
  expect(
    compileMapEvent(declaration, { nextId: 1, resolver: graph.resolver }).pages?.[0],
  ).toMatchObject({
    moveType: 0,
    moveSpeed: 6,
    moveFrequency: 1,
    moveRoute: {
      list: [{ code: 45, parameters: [""], indent: null }, { code: 0 }],
      repeat: false,
      skippable: true,
      wait: true,
    },
  });
});

it("recursively gates every recognizable native script location including empty raw continuations and mirrors", () => {
  const cases = [
    {
      records: [
        { code: 355, parameters: [""] },
        { code: 655, parameters: [""] },
      ],
      paths: ["list[0].parameters[0]", "list[1].parameters[0]"],
    },
    {
      records: [
        { code: 111, parameters: [12, ""] },
        { code: 0, indent: 1, parameters: [] },
        { code: 412, parameters: [] },
      ],
      paths: ["list[0].parameters[1]"],
    },
    { records: [{ code: 122, parameters: [1, 1, 0, 4, ""] }], paths: ["list[0].parameters[4]"] },
    {
      records: [
        {
          code: 205,
          parameters: [
            -1,
            {
              list: [{ code: 45, parameters: [""] }, { code: 0 }],
              repeat: false,
              skippable: false,
              wait: true,
            },
          ],
        },
        { code: 505, parameters: [{ code: 45, parameters: [""] }] },
      ],
      paths: ["list[0].parameters[1].list[0].parameters[0]", "list[1].parameters[0].parameters[0]"],
    },
  ];
  for (const { records, paths } of cases) {
    const declaration = commonEvent({
      trigger: "none",
      id: 1,
      name: "Raw Gate",
      commands: records.map(rawDslCommand),
    });
    const graph = buildStagedDataGraph({
      declarations: [declaration],
      snapshotReferences: { variableCapacity: 1 },
    });
    const issues = validateStagedDataGraph(graph, { scriptEnabled: false }).issues.filter(
      (issue) => issue.code === "MV-SCRIPT-GATE",
    );
    expect(issues.map((issue) => issue.nativePath)).toEqual(paths);
    for (const issue of issues)
      expect(issue).toMatchObject({
        level: "error",
        stage: "compile",
        identity: "commonEvent:1",
        expected: "scriptEnabled: true",
        actual: "scriptEnabled: false",
      });
    expect(
      validateStagedDataGraph(graph, { scriptEnabled: true }).issues.filter(
        (issue) => issue.level === "error",
      ),
    ).toEqual([]);
  }
});

it("uses the same known parameter boundary for formal, handwritten raw and native input", () => {
  for (const parameters of [[], [null], ["30"], [30, 40]]) {
    expect(() => renderDecompiledCommandList([{ code: 230, indent: 0, parameters }])).toThrow(
      /MV-COMMAND-PARAMETERS/,
    );
    const graph = buildStagedDataGraph({
      declarations: [
        commonEvent({
          trigger: "none",
          id: 1,
          name: "Known raw",
          commands: [rawDslCommand({ code: 230, parameters })],
        }),
      ],
    });
    expect(validateStagedDataGraph(graph, { scriptEnabled: true }).issues).toContainEqual(
      expect.objectContaining({
        code: "MV-COMMAND-PARAMETERS",
        stage: "compile",
        identity: "commonEvent:1",
        level: "error",
      }),
    );
  }
  const graph = buildStagedDataGraph({
    declarations: [
      commonEvent({
        trigger: "none",
        id: 1,
        name: "Formal",
        commands: [{ kind: "wait", frames: "30" } as never],
      }),
    ],
  });
  expect(validateStagedDataGraph(graph, { scriptEnabled: true }).issues).toContainEqual(
    expect.objectContaining({ code: "MV-COMMAND-PARAMETERS" }),
  );
});

it("rejects orphan continuations and mismatched choice mirrors with both saved locations", () => {
  for (const record of [
    { code: 401, indent: 0, parameters: ["orphan"] },
    { code: 401, indent: 1, parameters: ["wrong indent"] },
  ])
    expect(() => renderDecompiledCommandList([record])).toThrow(/MV-COMMAND-STRUCTURE/);
  const records = [
    { code: 102, indent: 0, parameters: [[" first\r\n", "second"], -1, 0, 2, 0] },
    { code: 402, indent: 0, parameters: [0, "first"] },
    { code: 0, indent: 1, parameters: [] },
    { code: 402, indent: 0, parameters: [1, "second"] },
    { code: 0, indent: 1, parameters: [] },
    { code: 404, indent: 0, parameters: [] },
  ];
  const graph = buildStagedDataGraph({
    declarations: [
      commonEvent({
        trigger: "none",
        id: 1,
        name: "Choice mirror",
        commands: records.map(rawDslCommand),
      }),
    ],
  });
  expect(validateStagedDataGraph(graph, { scriptEnabled: true }).issues).toContainEqual(
    expect.objectContaining({
      code: "MV-CHOICE-MIRROR",
      level: "error",
      stage: "compile",
      identity: "commonEvent:1",
      nativePath: "list[1].parameters",
      expected: '[0," first\\r\\n"]',
      actual: '[0,"first"]',
      relatedLocations: [
        { nativePath: "list[0].parameters[0][0]", dslPath: "commands[0]", value: '" first\\r\\n"' },
      ],
    }),
  );
});

it("rejects misleading array prototypes and negative zero in the known movement terminator", () => {
  class MisleadingArray extends Array<unknown> {
    override [Symbol.iterator](): ArrayIterator<unknown> {
      return [2][Symbol.iterator]();
    }
  }
  const parameters = new MisleadingArray();
  parameters.push(1);
  expect(() =>
    compileCommonEvent(
      commonEvent({
        id: 1,
        name: "Array",
        trigger: "none",
        commands: [rawDslCommand({ code: 999, parameters })],
      }),
      { nextId: 1, resolver },
    ),
  ).toThrow(/MV-STRICT-JSON/);
  for (const terminal of [{ code: -0 }, { code: -0, parameters: [] }]) {
    const list = [
      {
        code: 205,
        indent: 0,
        parameters: [-1, { list: [terminal], repeat: false, skippable: false, wait: false }],
      },
    ];
    expect(() => renderDecompiledCommandList(list)).toThrow(/MV-MOVEMENT-SHAPE/);
  }
});

it("reports currently unrepresented known saved variants instead of silently dropping their slots", () => {
  for (const list of [
    [{ code: 124, indent: 0, parameters: [1, 83] }],
    [
      { code: 101, indent: 0, parameters: ["", 3, 0, 2] },
      { code: 401, indent: 0, parameters: [""] },
    ],
    [
      { code: 111, indent: 0, parameters: [12, ""] },
      { code: 230, indent: 1, parameters: [1] },
      { code: 0, indent: 1, parameters: [] },
      { code: 412, indent: 0, parameters: [] },
    ],
  ])
    expect(() => renderDecompiledCommandList(list)).toThrow(/MV-COMMAND-UNSUPPORTED/);
});

it("rejects nonrepresentable raw JSON before copying or rendering its parameter array", () => {
  const cycle: unknown[] = [];
  cycle.push(cycle);
  const extra = Object.assign([1], { extra: 2 });
  const symbol = { [Symbol("hidden")]: 1 };
  const bad = [
    [undefined],
    [NaN],
    [Infinity],
    [() => 1],
    [Symbol("value")],
    [1n],
    new Array(1),
    [{ x: undefined }],
    [new Date()],
    [{ toJSON: () => 1 }],
    cycle,
    extra,
    [symbol],
    [Object.create({ inherited: 1 })],
    [Object.defineProperty({}, "hidden", { value: 1 })],
  ];
  for (const parameters of bad) {
    const command = { code: 999, indent: 0, parameters };
    expect(() => renderDecompiledCommandList([command])).toThrow(
      /MV-STRICT-JSON.*list\[0\]\.parameters/,
    );
    expect(() =>
      compileCommonEvent(
        commonEvent({
          trigger: "none",
          id: 1,
          name: "Bad raw",
          commands: [rawDslCommand(command)],
        }),
        { nextId: 1, resolver },
      ),
    ).toThrow(/MV-STRICT-JSON/);
  }
});

it("requires complete own native fields and dense authored lists without silently omitting extra raw fields", () => {
  for (const command of [
    { code: 999, indent: 0 },
    { code: 999, parameters: [] },
    { code: 999, indent: 0, parameters: [], extra: true },
    Object.assign(Object.create({ code: 999 }), { indent: 0, parameters: [] }),
    Object.defineProperty({ code: 999, indent: 0, parameters: [] }, "hidden", { value: true }),
    { code: 999, indent: 0, parameters: [], [Symbol("extra")]: true },
  ])
    expect(() => renderDecompiledCommandList([command as never])).toThrow(
      /MV-COMMAND-ENVELOPE|MV-STRICT-JSON/,
    );
  for (const commands of [
    null,
    undefined,
    new Array(1),
    [null],
    [{ kind: "rawDslCommand", code: 999, parameters: [], extra: true }],
  ]) {
    try {
      commonEvent({
        trigger: "none",
        id: 1,
        name: "Bad declarations",
        commands: commands as never,
      });
      expect.fail("Expected invalid Common Event commands to fail at the authoring boundary");
    } catch (error) {
      expect(error).toMatchObject({
        code: "MV-COMMON-EVENT",
        stage: "compile",
        identity: "commonEvent:1",
        location: { dslPath: "commonEvent.commands" },
      });
    }
  }
  const graph = buildStagedDataGraph({
    declarations: [
      commonEvent({
        trigger: "none",
        id: 1,
        name: "Unknown command kind",
        commands: [{ kind: "invented" }] as never,
      }),
    ],
  });
  expect(validateStagedDataGraph(graph, { scriptEnabled: true }).issues).toContainEqual(
    expect.objectContaining({
      level: "error",
      stage: "compile",
      identity: "commonEvent:1",
      dslPath: expect.stringContaining("commands"),
      code: expect.stringMatching(/^MV-/),
    }),
  );
  expect(() => rawDslCommand({ code: 999, parameters: [], extra: true } as never)).toThrow(
    /MV-DSL-SHAPE/,
  );
});

it("applies recognizable family modes and fixed references to handwritten known raw commands", () => {
  for (const command of [
    { code: 122, parameters: [1, 1, 99, 0, 1] },
    { code: 101, parameters: ["Face", -0, 0, 2] },
    { code: 201, parameters: [0, 1, -0, 1, 0, 0] },
  ]) {
    expect(() => renderDecompiledCommandList([{ ...command, indent: 0 }])).toThrow(
      command.code === 122 ? /MV-E122-VALUE/ : /MV-COMMAND-PARAMETERS/,
    );
    const graph = buildStagedDataGraph({
      declarations: [
        commonEvent({ id: 1, name: "Known", trigger: "none", commands: [rawDslCommand(command)] }),
      ],
      snapshotReferences: { variableCapacity: 1, maps: [{ id: 1, name: "Map" }] },
    });
    expect(validateStagedDataGraph(graph, { scriptEnabled: true }).issues).toContainEqual(
      expect.objectContaining({
        code: command.code === 122 ? "MV-E122-VALUE" : "MV-COMMAND-PARAMETERS",
      }),
    );
  }
  const graph = buildStagedDataGraph({
    declarations: [
      commonEvent({
        id: 1,
        name: "Caller",
        trigger: "none",
        commands: [rawDslCommand({ code: 117, parameters: [2] })],
      }),
    ],
  });
  expect(validateStagedDataGraph(graph, { scriptEnabled: true }).issues).toContainEqual(
    expect.objectContaining({
      code: "MV-E117-REFERENCE",
      nativePath: "list[0].parameters[0]",
      dslPath: "commands[0].parameters[0]",
      expected: "existing commonEvent ID",
      actual: "2",
    }),
  );
});
