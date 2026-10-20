import { expect, it } from "vitest";
import {
  comment,
  commonEvent,
  conditional,
  loop,
  rawDslCommand,
  type ChildCommandBody,
} from "../src/index.js";
import { compileCommonEvent } from "../src/compiler/events.js";
import { renderDecompiledCommandList } from "../src/decompiler/dispatch.js";
import {
  buildStagedDataGraph,
  validateDslOwnedDeclarations,
} from "../src/validation/staged-graph.js";

import { conditionCases, references } from "./support/conditional-cases.js";
const resolver = buildStagedDataGraph({
  declarations: [],
  snapshotReferences: references,
}).resolver;

it.each(conditionCases)(
  "compiles all exact Conditional saved slots: %s",
  (_name, condition, parameters) => {
    const event = commonEvent({
      id: 1,
      name: "Conditions",
      trigger: "none",
      commands: [conditional({ condition, then: { commands: [] } })],
    });
    expect(compileCommonEvent(event, { nextId: 1, resolver }).list).toStrictEqual([
      { code: 111, indent: 0, parameters },
      { code: 0, indent: 1, parameters: [] },
      { code: 412, indent: 0, parameters: [] },
      { code: 0, indent: 0, parameters: [] },
    ]);
  },
);

it.each([undefined, "present", "absent"] as const)(
  "preserves independent then/else body marker state: %s",
  (endMarker) => {
    const then: ChildCommandBody = { commands: [comment({ lines: ["then"] })] };
    if (endMarker !== undefined) then.endMarker = endMarker;
    const event = commonEvent({
      id: 1,
      name: "Bodies",
      trigger: "none",
      commands: [
        conditional({ condition: { kind: "button", button: "ok" }, then, else: { commands: [] } }),
      ],
    });
    const expected = [
      { code: 111, indent: 0, parameters: [11, "ok"] },
      { code: 108, indent: 1, parameters: ["then"] },
      ...(endMarker === "absent" ? [] : [{ code: 0, indent: 1, parameters: [] }]),
      { code: 411, indent: 0, parameters: [] },
      { code: 0, indent: 1, parameters: [] },
      { code: 412, indent: 0, parameters: [] },
      { code: 0, indent: 0, parameters: [] },
    ];
    expect(compileCommonEvent(event, { nextId: 1, resolver }).list).toStrictEqual(expected);
    expect(renderDecompiledCommandList(expected).source.includes('endMarker: "absent"')).toBe(
      endMarker === "absent",
    );
  },
);

it.each(["present", "absent"] as const)(
  "rejects raw own markers contradicting final declared %s body state",
  (endMarker) => {
    const event = commonEvent({
      id: 1,
      name: "Conflict",
      trigger: "none",
      commands: [
        conditional({
          condition: { kind: "button", button: "ok" },
          then: {
            commands: [comment({ lines: ["content"] }), rawDslCommand({ code: 0, parameters: [] })],
            endMarker,
          },
        }),
      ],
    });
    expect(() => compileCommonEvent(event, { nextId: 1, resolver })).toThrowError(
      expect.objectContaining({
        code: "MV-BODY-MARKER-CONFLICT",
        location: {
          dslPath: "commands[0].then.endMarker",
          expected: expect.any(String),
          actual: expect.any(String),
        },
      }),
    );
  },
);

it("preserves legal raw nested markers independently of the Conditional body", () => {
  const event = commonEvent({
    id: 1,
    name: "Nested",
    trigger: "none",
    commands: [
      conditional({
        condition: { kind: "button", button: "ok" },
        then: {
          commands: [
            rawDslCommand({ code: 112, parameters: [] }),
            rawDslCommand({ code: 0, indent: 2, parameters: [] }),
            rawDslCommand({ code: 413, parameters: [] }),
          ],
          endMarker: "absent",
        },
      }),
    ],
  });
  expect(compileCommonEvent(event, { nextId: 1, resolver }).list).toStrictEqual([
    { code: 111, indent: 0, parameters: [11, "ok"] },
    { code: 112, indent: 1, parameters: [] },
    { code: 0, indent: 2, parameters: [] },
    { code: 413, indent: 1, parameters: [] },
    { code: 412, indent: 0, parameters: [] },
    { code: 0, indent: 0, parameters: [] },
  ]);
});

it.each(["", " ", "a\rb", "a\nb", "a\r\nb", "trailing\n", "x".repeat(10000)])(
  "gates every E111 script slot and only warns to reconfirm CR/LF: %j",
  (code) => {
    const event = commonEvent({
      id: 1,
      name: "Gate",
      trigger: "none",
      commands: [
        conditional({
          condition: { kind: "button", button: "ok" },
          then: {
            commands: [
              loop({
                body: {
                  commands: [
                    conditional({
                      condition: { kind: "script", script: { kind: "scriptInput", code } },
                      then: { commands: [] },
                    }),
                  ],
                },
              }),
            ],
          },
        }),
      ],
    });
    const enabled = validateDslOwnedDeclarations([event], {
      scriptEnabled: true,
      snapshotReferences: references,
    }).issues;
    expect(enabled.filter((issue) => issue.code === "MV-E111-SCRIPT-RECONFIRM")).toEqual(
      /[\r\n]/u.test(code)
        ? [
            expect.objectContaining({
              level: "warning",
              stage: "compile",
              identity: "commonEvent:1",
              nativePath: "list[2].parameters[1]",
              dslPath: "commands[0].then.commands[0].body.commands[0].condition.script.code",
              expected: expect.any(String),
              actual: expect.any(String),
            }),
          ]
        : [],
    );
    expect(
      validateDslOwnedDeclarations([event], {
        scriptEnabled: false,
        snapshotReferences: references,
      }).issues,
    ).toContainEqual(
      expect.objectContaining({ code: "MV-SCRIPT-GATE", nativePath: "list[2].parameters[1]" }),
    );
  },
);
