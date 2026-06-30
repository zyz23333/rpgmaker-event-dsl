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
        'showText({ lines: ["Hello","World"] }),',
        "rawDslCommand({",
        "  code: 401,",
        "  indent: 1,",
        '  parameters: ["Different indent stays raw"],',
        "}),",
        'comment(["First","Second"]),',
      ].join("\n"),
    });
  });

  it("renders message commands and continuations as supported helpers", () => {
    expect(
      renderDecompiledCommandList([
        { code: 101, indent: 0, parameters: ["Actor1", 2, 1, 0] },
        { code: 401, indent: 0, parameters: ["Hello"] },
        { code: 102, indent: 0, parameters: [["Yes", "No"], 1, 0, 2, 0] },
        { code: 402, indent: 0, parameters: [0] },
        { code: 230, indent: 1, parameters: [10] },
        { code: 402, indent: 0, parameters: [1] },
        { code: 214, indent: 1, parameters: [] },
        { code: 403, indent: 0, parameters: [] },
        { code: 101, indent: 1, parameters: ["", 0, 0, 2] },
        { code: 401, indent: 1, parameters: ["Canceled"] },
        { code: 103, indent: 0, parameters: [3, 4] },
        { code: 104, indent: 0, parameters: [3, 1] },
        { code: 105, indent: 0, parameters: [5, true] },
        { code: 405, indent: 0, parameters: ["Scroll"] },
        { code: 405, indent: 0, parameters: ["More"] },
      ]),
    ).toEqual({
      helperNames: [
        "eraseEvent",
        "imageAsset",
        "inputNumber",
        "selectItem",
        "showChoices",
        "showScrollingText",
        "showText",
        "variableRef",
        "wait",
      ],
      source: [
        'showText({ lines: ["Hello"], face: { image: imageAsset({ folder: "faces", name: "Actor1" }), index: 2 }, background: 1, positionType: 0 }),',
        'showChoices({ choices: ["Yes","No"], branches: [[wait(10),], [eraseEvent(),]], cancelType: 1, cancelBranch: [showText({ lines: ["Canceled"] }),] }),',
        "inputNumber({ variable: variableRef({ id: 3 }), digits: 4 }),",
        "selectItem({ variable: variableRef({ id: 3 }), itemType: 1 }),",
        'showScrollingText({ lines: ["Scroll","More"], speed: 5, noFastForward: true }),',
      ].join("\n"),
    });
  });

  it("falls back to rawDslCommand for malformed supported command shapes", () => {
    expect(
      renderDecompiledCommandList([
        { code: 101, indent: 0, parameters: ["Actor1", 0, 9, 2] },
        { code: 102, indent: 0, parameters: [["Yes"], -1, 0, 9, 0] },
        { code: 103, indent: 0, parameters: [0, 4] },
        { code: 104, indent: 0, parameters: [1, 9] },
        { code: 105, indent: 0, parameters: [2, "false"] },
        { code: 121, indent: 0, parameters: [1, 2, 0] },
        { code: 122, indent: 0, parameters: [1, 1, 99, 0, 7] },
        { code: 230, indent: 2, parameters: ["thirty"] },
      ]),
    ).toEqual({
      helperNames: ["rawDslCommand"],
      source: [
        "rawDslCommand({",
        "  code: 101,",
        '  parameters: ["Actor1",0,9,2],',
        "}),",
        "rawDslCommand({",
        "  code: 102,",
        '  parameters: [["Yes"],-1,0,9,0],',
        "}),",
        "rawDslCommand({",
        "  code: 103,",
        "  parameters: [0,4],",
        "}),",
        "rawDslCommand({",
        "  code: 104,",
        "  parameters: [1,9],",
        "}),",
        "rawDslCommand({",
        "  code: 105,",
        '  parameters: [2,"false"],',
        "}),",
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
