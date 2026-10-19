import { expect, it } from "vitest";
import {
  commonEvent,
  label,
  jumpToLabel,
  pluginCommand,
  script,
  scriptInput,
  rawDslCommand,
  loop,
  conditional,
  showChoices,
} from "../src/index.js";
import { compileCommonEvent } from "../src/compiler/events.js";
import { renderDecompiledCommandList } from "../src/decompiler/dispatch.js";
import { buildStagedDataGraph, validateStagedDataGraph } from "../src/validation/staged-graph.js";

const resolver = buildStagedDataGraph({ declarations: [] }).resolver;
function event(commands: Parameters<typeof commonEvent>[0]["commands"]) {
  return commonEvent({ id: 1, name: "Exact text", trigger: "none", commands });
}

it("authors Label and Jump to Label with named complete strings", () => {
  const actual = compileCommonEvent(
    event([label({ name: " A\r\n\t " }), jumpToLabel({ name: " A\r\n\t " }), label({ name: "" })]),
    { nextId: 1, resolver },
  );
  expect(actual.list).toStrictEqual([
    { code: 118, indent: 0, parameters: [" A\r\n\t "] },
    { code: 119, indent: 0, parameters: [" A\r\n\t "] },
    { code: 118, indent: 0, parameters: [""] },
    { code: 0, indent: 0, parameters: [] },
  ]);
  expect(renderDecompiledCommandList(actual.list).source).toContain(
    'label({ name: " A\\r\\n\\t " })',
  );
});

it("diagnoses exact per-list Label targets across child bodies without changing their strings", () => {
  const declaration = event([
    jumpToLabel({ name: " A " }),
    { kind: "loop", body: { commands: [label({ name: " A " }), jumpToLabel({ name: "A" })] } },
    label({ name: " A " }),
    label({ name: "\r\n" }),
    jumpToLabel({ name: "\r\n" }),
    label({ name: "\t " }),
    label({ name: "" }),
    jumpToLabel({ name: "elsewhere" }),
  ]);
  const second = commonEvent({
    id: 2,
    name: "Separate list",
    trigger: "none",
    commands: [label({ name: "elsewhere" }), label({ name: " A " })],
  });
  const issues = validateStagedDataGraph(
    buildStagedDataGraph({ declarations: [declaration, second] }),
    { scriptEnabled: false },
  ).issues;
  expect(issues.filter((issue) => issue.code === "MV-LABEL-MISSING")).toMatchObject([
    {
      level: "warning",
      identity: "commonEvent:1",
      dslPath: "commands[1].body.commands[1].name",
      nativePath: "list[3].parameters[0]",
      actual: '"A"',
    },
    {
      level: "warning",
      identity: "commonEvent:1",
      dslPath: "commands[7].name",
      actual: '"elsewhere"',
    },
  ]);
  expect(issues.filter((issue) => issue.code === "MV-LABEL-DUPLICATE")).toMatchObject([
    {
      level: "warning",
      nativePath: "list[6].parameters[0]",
      dslPath: "commands[2].name",
      actual: '" A "',
      relatedLocations: [
        { nativePath: "list[2].parameters[0]", dslPath: "commands[1].body.commands[0].name" },
      ],
    },
  ]);
  expect(issues.filter((issue) => issue.code === "MV-TEXT-RECONFIRMATION")).toMatchObject([
    { nativePath: "list[7].parameters[0]", dslPath: "commands[3].name", actual: '"\\r\\n"' },
    { nativePath: "list[8].parameters[0]", dslPath: "commands[4].name", actual: '"\\r\\n"' },
  ]);
  expect(issues.filter((issue) => issue.level === "error")).toEqual([]);
});

it("splits Script only on LF and refuses a thirteenth physical record in formal and known raw input", () => {
  expect(
    compileCommonEvent(event([script(scriptInput({ code: "a\r\nb\r\n" }))]), {
      nextId: 1,
      resolver,
    }).list,
  ).toStrictEqual([
    { code: 355, indent: 0, parameters: ["a\r"] },
    { code: 655, indent: 0, parameters: ["b\r"] },
    { code: 655, indent: 0, parameters: [""] },
    { code: 0, indent: 0, parameters: [] },
  ]);
  expect(
    compileCommonEvent(event([script({ code: "" })]), { nextId: 1, resolver }).list,
  ).toStrictEqual([
    { code: 355, indent: 0, parameters: [""] },
    { code: 0, indent: 0, parameters: [] },
  ]);
  const twelve = [
    { code: 355, indent: 0, parameters: ["0"] },
    ...Array.from({ length: 11 }, (_, i) => ({
      code: 655,
      indent: 0,
      parameters: [String(i + 1)],
    })),
  ];
  expect(renderDecompiledCommandList(twelve).source).toContain(
    'code: "0\\n1\\n2\\n3\\n4\\n5\\n6\\n7\\n8\\n9\\n10\\n11"',
  );
  const thirteen = [...twelve, { code: 655, indent: 0, parameters: [""] }];
  expect(() =>
    compileCommonEvent(event([script({ code: "\n".repeat(12) })]), { nextId: 1, resolver }),
  ).toThrow(/MV-SCRIPT-RECORDS/);
  expect(() =>
    compileCommonEvent(event(thirteen.map(rawDslCommand)), { nextId: 1, resolver }),
  ).toThrow(/MV-SCRIPT-RECORDS/);
  expect(() => renderDecompiledCommandList(thirteen)).toThrow(/MV-SCRIPT-RECORDS/);
  expect(() =>
    renderDecompiledCommandList([{ code: 355, indent: 0, parameters: ["a\nb"] }]),
  ).toThrow(/MV-SCRIPT-RECORDS/);
});

it("rejects extra, missing and non-data text fields before helper projection and command encoding", () => {
  for (const [helper, field] of [
    [label, "name"],
    [jumpToLabel, "name"],
    [pluginCommand, "line"],
    [script, "code"],
    [scriptInput, "code"],
  ] as const) {
    const getter = Object.defineProperty({}, field, {
      enumerable: true,
      get() {
        throw new Error("getter executed");
      },
    });
    for (const input of [
      {},
      { [field]: undefined },
      { [field]: null },
      { [field]: 3 },
      { [field]: "", extra: true },
      Object.create({ [field]: "inherited" }),
      getter,
    ]) {
      expect(() => helper(input as never)).toThrow(/MV-DSL-SHAPE/);
    }
  }
  for (const command of [
    { kind: "label", name: "", extra: true },
    { kind: "jumpToLabel", name: "", extra: true },
    { kind: "pluginCommand", line: "", extra: true },
    { kind: "script", script: { kind: "scriptInput", code: "", extra: true } },
    { kind: "script", script: { kind: "scriptInput", code: "" }, extra: true },
  ])
    expect(() => compileCommonEvent(event([command as never]), { nextId: 1, resolver })).toThrow(
      /MV-DSL-SHAPE/,
    );
});

it("preserves the complete Plugin Command Line with Gate closed", () => {
  const declaration = event([pluginCommand({ line: " X  Y\t\r\n " }), pluginCommand({ line: "" })]);
  expect(compileCommonEvent(declaration, { nextId: 1, resolver }).list).toStrictEqual([
    { code: 356, indent: 0, parameters: [" X  Y\t\r\n "] },
    { code: 356, indent: 0, parameters: [""] },
    { code: 0, indent: 0, parameters: [] },
  ]);
  expect(
    validateStagedDataGraph(buildStagedDataGraph({ declarations: [declaration] }), {
      scriptEnabled: false,
    }).issues,
  ).toEqual([]);
  expect(
    renderDecompiledCommandList([{ code: 356, indent: 0, parameters: [""] }]).source,
  ).toContain('pluginCommand({ line: "" })');
});

it("reports exact native and DSL parameter paths for invalid known text and Script records", () => {
  for (const code of [118, 119, 355, 356]) {
    expect(() => renderDecompiledCommandList([{ code, indent: 0, parameters: [null] }])).toThrow(
      `list[0].parameters[0]`,
    );
    const graph = buildStagedDataGraph({
      declarations: [
        event([label({ name: "valid" }), rawDslCommand({ code, parameters: [null] })]),
      ],
    });
    expect(validateStagedDataGraph(graph, { scriptEnabled: true }).issues).toContainEqual(
      expect.objectContaining({
        code: "MV-COMMAND-PARAMETERS",
        dslPath: "commands[1].parameters[0]",
      }),
    );
  }
  const graph = buildStagedDataGraph({
    declarations: [
      event([label({ name: "valid" }), rawDslCommand({ code: 355, parameters: ["a\nb"] })]),
    ],
  });
  expect(validateStagedDataGraph(graph, { scriptEnabled: true }).issues).toContainEqual(
    expect.objectContaining({
      code: "MV-SCRIPT-RECORDS",
      nativePath: "list[1].parameters[0]",
      dslPath: "commands[1].parameters[0]",
    }),
  );
});

it.each([
  ["empty", ""],
  ["whitespace", " \t "],
  ["CR", "A\rB\r"],
  ["LF", "A\nB\n"],
  ["CRLF", "A\r\nB\r\n"],
  ["trailing", "A \t "],
  ["long", "中".repeat(4096) + " \t"],
])("preserves complete single-slot Label Jump and Plugin strings: %s", (_name, text) => {
  const declaration = event([
    label({ name: text }),
    jumpToLabel({ name: text }),
    pluginCommand({ line: text }),
  ]);
  const literal = [
    { code: 118, indent: 0, parameters: [text] },
    { code: 119, indent: 0, parameters: [text] },
    { code: 356, indent: 0, parameters: [text] },
    { code: 0, indent: 0, parameters: [] },
  ];
  expect(compileCommonEvent(declaration, { nextId: 1, resolver }).list).toStrictEqual(literal);
  expect(
    compileCommonEvent(event(literal.slice(0, -1).map(rawDslCommand)), { nextId: 1, resolver })
      .list,
  ).toStrictEqual(literal);
  expect(() => renderDecompiledCommandList(literal)).not.toThrow();
  const issues = validateStagedDataGraph(buildStagedDataGraph({ declarations: [declaration] }), {
    scriptEnabled: false,
  }).issues;
  expect(issues.filter((issue) => issue.code === "MV-TEXT-RECONFIRMATION")).toHaveLength(
    text.includes("\r") || text.includes("\n") ? 2 : 0,
  );
  expect(issues.filter((issue) => issue.level === "error")).toEqual([]);
});

it.each([118, 119, 355, 356, 655])(
  "rejects invalid exact saved text slots for E%s without fallback",
  (code) => {
    for (const parameters of [[], [null], [3], ["", "extra"], [undefined], new Array(1)]) {
      const records =
        code === 655
          ? [
              { code: 355, indent: 0, parameters: [""] },
              { code, indent: 0, parameters },
            ]
          : [{ code, indent: 0, parameters }];
      expect(() => renderDecompiledCommandList(records)).toThrow(
        /MV-(?:COMMAND-PARAMETERS|STRICT-JSON)/,
      );
      expect(() =>
        compileCommonEvent(event(records.map(rawDslCommand)), { nextId: 1, resolver }),
      ).toThrow(/MV-(?:COMMAND-PARAMETERS|STRICT-JSON)/);
    }
  },
);

it("recursively gates empty formal and raw Script groups in Loop Conditional and Choices", () => {
  const empty = script({ code: "" });
  const declaration = event([
    loop({ body: { commands: [empty] } }),
    conditional({
      condition: { kind: "script", script: scriptInput({ code: "" }) },
      then: [empty],
      else: [empty],
    }),
    showChoices({ choices: [""], branches: [[empty]], cancelType: -2, cancelBranch: [empty] }),
    loop({
      body: {
        commands: [
          rawDslCommand({ code: 355, parameters: [""] }),
          rawDslCommand({ code: 655, parameters: [""] }),
        ],
      },
    }),
  ]);
  const graph = buildStagedDataGraph({ declarations: [declaration] });
  const gated = validateStagedDataGraph(graph, { scriptEnabled: false }).issues.filter(
    (issue) => issue.code === "MV-SCRIPT-GATE",
  );
  expect(gated).toHaveLength(8);
  expect(
    gated.every(
      (issue) =>
        issue.level === "error" &&
        issue.stage === "compile" &&
        issue.identity === "commonEvent:1" &&
        issue.dslPath &&
        issue.nativePath,
    ),
  ).toBe(true);
  expect(
    validateStagedDataGraph(graph, { scriptEnabled: true }).issues.filter(
      (issue) => issue.level === "error",
    ),
  ).toEqual([]);
});

it("does not impose E355 physical-record limits on single-slot scripts in other native commands", () => {
  const complete = "x\r\n".repeat(20);
  const records = [
    { code: 111, indent: 0, parameters: [12, complete] },
    { code: 0, indent: 1, parameters: [] },
    { code: 412, indent: 0, parameters: [] },
    { code: 122, indent: 0, parameters: [1, 1, 0, 4, complete] },
  ];
  const graph = buildStagedDataGraph({
    declarations: [event(records.map(rawDslCommand))],
    snapshotReferences: { variableCapacity: 1 },
  });
  expect(
    validateStagedDataGraph(graph, { scriptEnabled: true }).issues.filter(
      (issue) => issue.level === "error",
    ),
  ).toEqual([]);
  expect(
    compileCommonEvent(event(records.map(rawDslCommand)), { nextId: 1, resolver: graph.resolver })
      .list,
  ).toStrictEqual([...records, { code: 0, indent: 0, parameters: [] }]);
});
