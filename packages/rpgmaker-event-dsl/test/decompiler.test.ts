import { describe, expect, it } from "vitest";

import { renderDecompiledCommandList } from "../src/decompiler.js";

describe("decompiler command list rendering", () => {
  it("renders supported command helpers and deterministic imports from the same command pass", () => {
    expect(
      renderDecompiledCommandList([
        { code: 230, indent: 0, parameters: [30] },
        { code: 117, indent: 0, parameters: [4] },
        { code: 121, indent: 0, parameters: [2, 2, 0] },
        { code: 122, indent: 0, parameters: [3, 3, 1, 0, 9] },
        { code: 126, indent: 0, parameters: [5, 1, 0, 2] },
        { code: 214, indent: 0, parameters: [] },
        { code: 0, indent: 0, parameters: [] },
      ]),
    ).toEqual({
      helperNames: [
        "callCommonEvent",
        "changeItem",
        "commonEventRef",
        "controlSwitches",
        "controlVariables",
        "eraseEvent",
        "itemRef",
        "switchRef",
        "variableRef",
        "wait",
      ],
      source: [
        "wait(30),",
        "callCommonEvent(commonEventRef({ id: 4 })),",
        "controlSwitches({ switch: switchRef({ id: 2 }), value: true }),",
        'controlVariables({ variable: variableRef({ id: 3 }), operation: "add", value: 9 }),',
        'changeItem({ item: itemRef({ id: 5 }), operation: "lose", amount: 2 }),',
        "eraseEvent(),",
      ].join("\n"),
    });
  });

  it("renders text and comment continuations as parent-owned helpers", () => {
    expect(
      renderDecompiledCommandList([
        { code: 101, indent: 0, parameters: ["", 0, 0, 2] },
        { code: 401, indent: 0, parameters: ["Hello"] },
        { code: 401, indent: 0, parameters: ["World"] },
        { code: 401, indent: 1, parameters: ["Different indent stays raw"] },
        { code: 108, indent: 0, parameters: ["First"] },
        { code: 408, indent: 0, parameters: ["Second"] },
      ]),
    ).toEqual({
      helperNames: ["comment", "rawDslCommand", "showText"],
      source: [
        'showText(["Hello","World"]),',
        "rawDslCommand({",
        "  code: 401,",
        "  indent: 1,",
        '  parameters: ["Different indent stays raw"],',
        "}),",
        'comment(["First","Second"]),',
      ].join("\n"),
    });
  });

  it("falls back to rawDslCommand for malformed supported command shapes", () => {
    expect(
      renderDecompiledCommandList([
        { code: 121, indent: 0, parameters: [1, 2, 0] },
        { code: 122, indent: 0, parameters: [1, 1, 99, 0, 7] },
        { code: 230, indent: 2, parameters: ["thirty"] },
      ]),
    ).toEqual({
      helperNames: ["rawDslCommand"],
      source: [
        "rawDslCommand({",
        "  code: 121,",
        "  parameters: [1,2,0],",
        "}),",
        "rawDslCommand({",
        "  code: 122,",
        "  parameters: [1,1,99,0,7],",
        "}),",
        "rawDslCommand({",
        "  code: 230,",
        "  indent: 2,",
        '  parameters: ["thirty"],',
        "}),",
      ].join("\n"),
    });
  });
});
