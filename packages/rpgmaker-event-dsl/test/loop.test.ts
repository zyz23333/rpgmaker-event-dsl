import { expect, it } from "vitest";

import {
  breakLoop,
  commonEvent,
  conditional,
  controlSwitches,
  exitEventProcessing,
  loop,
  rawDslCommand,
  script,
  switchRef,
} from "../src/index.js";
import { compileCommonEvent } from "../src/compiler/events.js";
import { renderDecompiledCommandList } from "../src/decompiler/dispatch.js";
import {
  buildStagedDataGraph,
  validateDslOwnedDeclarations,
} from "../src/validation/staged-graph.js";

const resolver = buildStagedDataGraph({ declarations: [] }).resolver;

it.each(["breakLoop", "exitEventProcessing"])(
  "rejects extra authored fields on parameterless %s",
  (kind) => {
    const event = commonEvent({
      id: 1,
      name: "Bad flow",
      trigger: "none",
      commands: [{ kind, value: undefined } as never],
    });
    expect(validateDslOwnedDeclarations([event], { scriptEnabled: false }).issues).toContainEqual(
      expect.objectContaining({ code: "MV-COMMAND-PARAMETERS", dslPath: "commands[0]" }),
    );
  },
);

it("reports the complete DSL path for an invalid Loop inside another parent's body", () => {
  const event = commonEvent({
    id: 1,
    name: "Nested invalid Loop",
    trigger: "none",
    commands: [
      conditional({
        condition: { kind: "button", button: "ok" },
        then: [loop({ body: { commands: [], endMarker: "absent" } })],
      }),
    ],
  });
  expect(validateDslOwnedDeclarations([event], { scriptEnabled: false }).issues).toContainEqual(
    expect.objectContaining({
      code: "MV-CHILD-BODY",
      dslPath: "commands[0].then[0].body.endMarker",
    }),
  );
});

it("accepts a handwritten complete event terminator without introducing a second code zero", () => {
  const event = commonEvent({
    id: 1,
    name: "Raw terminator",
    trigger: "none",
    commands: [rawDslCommand({ code: 0, parameters: [] })],
  });
  expect(compileCommonEvent(event, { nextId: 1, resolver }).list).toEqual([
    { code: 0, indent: 0, parameters: [] },
  ]);
});

it.each([
  { parameters: undefined },
  { parameters: null },
  { parameters: "" },
  { parameters: [], indent: null },
  { parameters: [], indent: -1 },
])("rejects malformed known raw envelopes without coercion before Check or Compile", (input) => {
  const event = commonEvent({
    id: 1,
    name: "Bad raw",
    trigger: "none",
    commands: [{ kind: "rawDslCommand", code: 113, ...input } as never],
  });
  expect(validateDslOwnedDeclarations([event], { scriptEnabled: false }).issues).toContainEqual(
    expect.objectContaining({
      code: "MV-COMMAND-ENVELOPE",
      dslPath: "indent" in input ? "commands[0].indent" : "commands[0].parameters",
    }),
  );
});

it("recognizes a nested Loop marker without truncating its containing conditional fragment", () => {
  const list = [
    { code: 112, indent: 0, parameters: [] },
    { code: 111, indent: 1, parameters: [0, 1, 0] },
    { code: 112, indent: 2, parameters: [] },
    { code: 113, indent: 3, parameters: [] },
    { code: 0, indent: 3, parameters: [] },
    { code: 413, indent: 2, parameters: [] },
    { code: 412, indent: 1, parameters: [] },
    { code: 113, indent: 1, parameters: [] },
    { code: 0, indent: 1, parameters: [] },
    { code: 413, indent: 0, parameters: [] },
    { code: 0, indent: 0, parameters: [] },
  ];
  const event = commonEvent({
    id: 1,
    name: "Nested boundaries",
    trigger: "none",
    commands: list.slice(0, -1).map(rawDslCommand),
  });
  expect(compileCommonEvent(event, { nextId: 1, resolver }).list).toEqual(list);
  expect(renderDecompiledCommandList(list).helperNames).toEqual([
    "breakLoop",
    "conditional",
    "loop",
    "switchRef",
  ]);
});

it("recursively validates Script Command Gate and contextual switch references inside Loop", () => {
  const event = commonEvent({
    id: 1,
    name: "Nested validation",
    trigger: "none",
    commands: [
      loop({
        body: {
          commands: [
            script({ code: "1" }),
            controlSwitches({ switch: switchRef({ id: 99 }), value: true }),
            breakLoop(),
          ],
        },
      }),
    ],
  });
  const issues = validateDslOwnedDeclarations([event], { scriptEnabled: false }).issues;
  expect(issues.some((issue) => /Script commands require explicit/u.test(issue.message))).toBe(
    true,
  );
  expect(
    issues.some((issue) =>
      /common event 1.commands\[0\].body.commands\[1\].switch/u.test(issue.message),
    ),
  ).toBe(true);
});

it.each([
  { body: undefined, path: ".body" },
  { body: null, path: ".body" },
  { body: [], path: ".body" },
  { body: {}, path: ".body.commands" },
  { body: { commands: undefined }, path: ".body.commands" },
  { body: { commands: [], extra: true }, path: ".body" },
  { body: { commands: [], endMarker: "other" }, path: ".body.endMarker" },
  { body: { commands: [undefined] }, path: ".body.commands[0]" },
  { body: { commands: new Array(1) }, path: ".body.commands[0]" },
  { body: { commands: [null] }, path: ".body.commands[0]" },
])("rejects invalid Loop body $path through the public validation seam", ({ body, path }) => {
  const event = commonEvent({
    id: 1,
    name: "Bad Loop",
    trigger: "none",
    commands: [{ kind: "loop", body } as never],
  });
  expect(validateDslOwnedDeclarations([event], { scriptEnabled: false }).issues).toContainEqual(
    expect.objectContaining({ code: "MV-CHILD-BODY", dslPath: `commands[0]${path}` }),
  );
});

it("compiles an empty Loop with its own Body End Marker and a distinct event terminator", () => {
  const event = commonEvent({
    id: 1,
    name: "Empty Loop",
    trigger: "none",
    commands: [loop({ body: { commands: [] } })],
  });
  expect(compileCommonEvent(event, { nextId: 1, resolver }).list).toEqual([
    { code: 112, indent: 0, parameters: [] },
    { code: 0, indent: 1, parameters: [] },
    { code: 413, indent: 0, parameters: [] },
    { code: 0, indent: 0, parameters: [] },
  ]);
});

it("warns about formal and raw Break Loop outside a Loop while preserving native output", () => {
  const event = commonEvent({
    id: 1,
    name: "Outside Break",
    trigger: "none",
    commands: [
      breakLoop(),
      rawDslCommand({ code: 113, parameters: [] }),
      loop({ body: { commands: [breakLoop()] } }),
    ],
  });
  const issues = validateDslOwnedDeclarations([event], { scriptEnabled: false }).issues;
  expect(issues.filter((issue) => issue.level === "error")).toEqual([]);
  expect(issues.filter((issue) => issue.code === "MV-BREAK-OUTSIDE-LOOP")).toEqual([
    expect.objectContaining({ level: "warning", identity: "commonEvent:1", nativePath: "list[0]" }),
    expect.objectContaining({ level: "warning", identity: "commonEvent:1", nativePath: "list[1]" }),
  ]);
  expect(compileCommonEvent(event, { nextId: 1, resolver }).list).toEqual([
    { code: 113, indent: 0, parameters: [] },
    { code: 113, indent: 0, parameters: [] },
    { code: 112, indent: 0, parameters: [] },
    { code: 113, indent: 1, parameters: [] },
    { code: 0, indent: 1, parameters: [] },
    { code: 413, indent: 0, parameters: [] },
    { code: 0, indent: 0, parameters: [] },
  ]);
});

it("checks the final declared body state after formal and raw records are combined", () => {
  for (const endMarker of ["present", "absent"] as const) {
    const event = commonEvent({
      id: 1,
      name: "Marker conflict",
      trigger: "none",
      commands: [
        loop({
          body: { commands: [breakLoop(), rawDslCommand({ code: 0, parameters: [] })], endMarker },
        }),
      ],
    });
    expect(() => compileCommonEvent(event, { nextId: 1, resolver })).toThrow(
      /MV-BODY-MARKER-CONFLICT/u,
    );
  }
  const event = commonEvent({
    id: 1,
    name: "Raw nested Loop",
    trigger: "none",
    commands: [
      loop({
        body: {
          commands: [
            rawDslCommand({ code: 112, parameters: [] }),
            rawDslCommand({ code: 113, indent: 2, parameters: [] }),
            rawDslCommand({ code: 0, indent: 2, parameters: [] }),
            rawDslCommand({ code: 413, parameters: [] }),
          ],
          endMarker: "absent",
        },
      }),
    ],
  });
  expect(compileCommonEvent(event, { nextId: 1, resolver }).list).toEqual([
    { code: 112, indent: 0, parameters: [] },
    { code: 112, indent: 1, parameters: [] },
    { code: 113, indent: 2, parameters: [] },
    { code: 0, indent: 2, parameters: [] },
    { code: 413, indent: 1, parameters: [] },
    { code: 413, indent: 0, parameters: [] },
    { code: 0, indent: 0, parameters: [] },
  ]);
});

it.each([
  { name: "orphan close", commands: [{ code: 413, indent: 0, parameters: [] }], at: 0 },
  {
    name: "missing close",
    commands: [
      { code: 112, indent: 0, parameters: [] },
      { code: 113, indent: 1, parameters: [] },
    ],
    at: 2,
  },
  { name: "extra known parameter", commands: [{ code: 113, indent: 0, parameters: [1] }], at: 0 },
  {
    name: "wrong child indent",
    commands: [
      { code: 112, indent: 0, parameters: [] },
      { code: 113, indent: 2, parameters: [] },
      { code: 413, indent: 0, parameters: [] },
    ],
    at: 1,
  },
  {
    name: "middle child marker",
    commands: [
      { code: 112, indent: 0, parameters: [] },
      { code: 0, indent: 1, parameters: [] },
      { code: 113, indent: 1, parameters: [] },
      { code: 413, indent: 0, parameters: [] },
    ],
    at: 1,
  },
  {
    name: "empty missing marker",
    commands: [
      { code: 112, indent: 0, parameters: [] },
      { code: 413, indent: 0, parameters: [] },
    ],
    at: 1,
  },
])(
  "rejects $name in known raw output and native decompilation with an exact location",
  ({ commands, at }) => {
    const native = [...commands, { code: 0, indent: 0, parameters: [] }];
    expect(() => renderDecompiledCommandList(native)).toThrow(/MV-/u);
    const event = commonEvent({
      id: 1,
      name: "Malformed native",
      trigger: "none",
      commands: commands.map(rawDslCommand),
    });
    expect(() => compileCommonEvent(event, { nextId: 1, resolver })).toThrow(/MV-/u);
    expect(validateDslOwnedDeclarations([event], { scriptEnabled: false }).issues).toContainEqual(
      expect.objectContaining({
        level: "error",
        identity: "commonEvent:1",
        ...(commands[at]?.code === 113 && commands[at]?.parameters.length
          ? { dslPath: `commands[${at}].parameters` }
          : { nativePath: `list[${at}]` }),
      }),
    );
  },
);

it("rejects an empty Loop whose declared Body End Marker is absent before Compile or Check", () => {
  const event = commonEvent({
    id: 1,
    name: "Invalid body",
    trigger: "none",
    commands: [loop({ body: { commands: [], endMarker: "absent" } })],
  });
  const result = validateDslOwnedDeclarations([event], { scriptEnabled: false });
  expect(result.issues).toContainEqual(
    expect.objectContaining({
      level: "error",
      code: "MV-CHILD-BODY",
      identity: "commonEvent:1",
      dslPath: "commands[0].body.endMarker",
    }),
  );
  expect(() => compileCommonEvent(event, { nextId: 1, resolver })).toThrow(/MV-CHILD-BODY/u);
});

it("preserves an absent outer Loop marker independently of the inner Loop marker and Exit", () => {
  const event = commonEvent({
    id: 1,
    name: "Nested Loop",
    trigger: "none",
    commands: [
      loop({
        body: {
          commands: [loop({ body: { commands: [breakLoop()] } }), breakLoop()],
          endMarker: "absent",
        },
      }),
      exitEventProcessing(),
    ],
  });
  const expected = [
    { code: 112, indent: 0, parameters: [] },
    { code: 112, indent: 1, parameters: [] },
    { code: 113, indent: 2, parameters: [] },
    { code: 0, indent: 2, parameters: [] },
    { code: 413, indent: 1, parameters: [] },
    { code: 113, indent: 1, parameters: [] },
    { code: 413, indent: 0, parameters: [] },
    { code: 115, indent: 0, parameters: [] },
    { code: 0, indent: 0, parameters: [] },
  ];
  expect(compileCommonEvent(event, { nextId: 1, resolver }).list).toEqual(expected);
  const rendering = renderDecompiledCommandList(expected);
  expect(rendering.helperNames).toEqual(["breakLoop", "exitEventProcessing", "loop"]);
  expect(rendering.source.match(/endMarker: "absent"/gu)).toHaveLength(1);
  expect(rendering.source).toContain("loop({ body: { commands:");
});
