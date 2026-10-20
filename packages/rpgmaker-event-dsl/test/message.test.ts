import { expect, it } from "vitest";
import {
  commonEvent,
  showText,
  inputNumber,
  selectItem,
  variableRef,
  showScrollingText,
  comment,
  imageAsset,
  variableDefinition,
  type DslCommand,
} from "../src/index.js";
import { compileCommonEvent } from "../src/compiler/events.js";
import { renderDecompiledCommandList } from "../src/decompiler/dispatch.js";
import { buildStagedDataGraph, validateStagedDataGraph } from "../src/validation/staged-graph.js";
import { recordEvidence } from "./support/mv-evidence.js";

function messageTest(name: string, body: () => void) {
  it(name, async () => {
    const startedAt = new Date().toISOString();
    let failure: unknown;
    try {
      body();
    } catch (error) {
      failure = error;
      throw error;
    } finally {
      await recordEvidence({
        requirementId: "MV-S6-MESSAGE-005",
        startedAt,
        stages: [
          "Public command helpers, accepted complete compiler/decompiler and Staged Data Graph seams; independently authored expected saved records",
        ],
        expected:
          "Exact required named messages and independent None/index, physical records, complete value domains, reference paths and asset layout warning without asset scanning",
        actual: { case: name, assertions: expect.getState().assertionCalls },
        ...(failure === undefined ? {} : { error: failure }),
      });
    }
  });
}

const end = { code: 0, indent: 0, parameters: [] };
const textInput = {
  lines: [""] as readonly [string, ...string[]],
  face: { image: null, index: 0 },
  background: "window" as const,
  position: "bottom" as const,
};
function compile(commands: readonly DslCommand[]) {
  const event = commonEvent({ id: 1, name: "Messages", trigger: "none", commands });
  const graph = buildStagedDataGraph({
    declarations: [event],
    snapshotReferences: { variableCapacity: 4 },
  });
  return compileCommonEvent(event, { nextId: 1, resolver: graph.resolver }).list;
}

messageTest(
  "preserves None with an independent nonzero face index and named message settings",
  () => {
    const expected = [
      { code: 101, indent: 0, parameters: ["", 11, 1, 0] },
      { code: 401, indent: 0, parameters: ["A\r"] },
      { code: 401, indent: 0, parameters: [""] },
      end,
    ];
    expect(
      compile([
        showText({
          lines: ["A\r", ""],
          face: { image: null, index: 11 },
          background: "dim",
          position: "top",
        }),
      ]),
    ).toStrictEqual(expected);
    const rendered = renderDecompiledCommandList(expected);
    expect(rendered.source).toContain("image: null, index: 11");
    expect(rendered.source).toContain('background: "dim", position: "top"');
    expect(rendered.helperNames).toEqual(["showText"]);
  },
);

messageTest(
  "warns for saved non-None face indices beyond the official layout independently of the script gate",
  () => {
    const definition = commonEvent({
      id: 1,
      name: "Faces",
      trigger: "none",
      commands: [
        showText({ ...textInput, face: { image: null, index: 2147483647 } }),
        showText({
          ...textInput,
          face: { image: imageAsset({ folder: "faces", name: "AbsentFace" }), index: 11 },
        }),
      ],
    });
    for (const scriptEnabled of [true, false]) {
      const graph = buildStagedDataGraph({ declarations: [definition] });
      const result = validateStagedDataGraph(graph, { scriptEnabled });
      expect(result.issues).toMatchObject([
        {
          code: "MV-E101-FACE-LAYOUT",
          level: "warning",
          identity: "commonEvent:1",
          stage: "compile",
          nativePath: "list[2].parameters[1]",
          dslPath: "commands[1].face.index",
          actual: "11",
        },
      ]);
      expect(result.issues[0]?.message).toMatch(/official two-row layout.*dimensions.*unchecked/);
      expect(compile(definition.commands)[0]?.parameters).toStrictEqual(["", 2147483647, 0, 2]);
    }
  },
);

messageTest(
  "preserves physical scrolling and comment records including CR and trailing empty lines",
  () => {
    const scrolling = ["", " A\r", "", "B", "C", "D", "E", "F", "G", ""] as const;
    const comments = ["", "A\r", "  ", "B", "C", ""] as const;
    const expected = [
      { code: 105, indent: 0, parameters: [8, false] },
      { code: 405, indent: 0, parameters: [""] },
      { code: 405, indent: 0, parameters: [" A\r"] },
      { code: 405, indent: 0, parameters: [""] },
      { code: 405, indent: 0, parameters: ["B"] },
      { code: 405, indent: 0, parameters: ["C"] },
      { code: 405, indent: 0, parameters: ["D"] },
      { code: 405, indent: 0, parameters: ["E"] },
      { code: 405, indent: 0, parameters: ["F"] },
      { code: 405, indent: 0, parameters: ["G"] },
      { code: 405, indent: 0, parameters: [""] },
      { code: 108, indent: 0, parameters: [""] },
      { code: 408, indent: 0, parameters: ["A\r"] },
      { code: 408, indent: 0, parameters: ["  "] },
      { code: 408, indent: 0, parameters: ["B"] },
      { code: 408, indent: 0, parameters: ["C"] },
      { code: 408, indent: 0, parameters: [""] },
      end,
    ];
    expect(
      compile([
        showScrollingText({ lines: scrolling, speed: 8, noFastForward: false }),
        comment({ lines: comments }),
      ]),
    ).toStrictEqual(expected);
    const rendered = renderDecompiledCommandList(expected);
    expect(rendered.source).toContain("speed: 8, noFastForward: false");
    expect(rendered.source).toContain('comment({ lines: ["","A\\r","  ","B","C",""] })');
    for (const input of [
      { lines: [""], speed: undefined, noFastForward: false },
      { lines: [""], speed: 0, noFastForward: false },
      { lines: [""], speed: 9, noFastForward: false },
      { lines: [""], speed: 1.1, noFastForward: false },
      { lines: [""], speed: 1, noFastForward: undefined },
      { lines: [], speed: 1, noFastForward: false },
      { lines: ["a\nb"], speed: 1, noFastForward: false },
      { lines: [""], speed: 1, noFastForward: false, extra: true },
    ]) {
      expect(() => showScrollingText(input as never)).toThrow(/MV-E105/);
      expect(() => compile([{ kind: "showScrollingText", ...input } as never])).toThrow(/MV-E105/);
    }
    for (const lines of [
      [],
      ["a\nb"],
      new Array(1),
      Array(7).fill(""),
      Object.assign([""], { extra: true }),
    ]) {
      expect(() => comment({ lines } as never)).toThrow(/MV-E108/);
      expect(() => compile([{ kind: "comment", lines } as never])).toThrow(/MV-E108/);
    }
    for (const native of [
      [{ code: 105, indent: 0, parameters: [1, false] }, end],
      [
        { code: 105, indent: 0, parameters: [0, false] },
        { code: 405, indent: 0, parameters: [""] },
        end,
      ],
      [
        { code: 108, indent: 0, parameters: [""] },
        ...Array.from({ length: 6 }, () => ({ code: 408, indent: 0, parameters: [""] })),
        end,
      ],
    ])
      expect(() => renderDecompiledCommandList(native)).toThrow();
  },
);

messageTest(
  "preserves every named message background and position and rejects invalid face assets without reading accessors",
  () => {
    const backgrounds = [
      ["window", 0],
      ["dim", 1],
      ["transparent", 2],
    ] as const;
    const positions = [
      ["top", 0],
      ["middle", 1],
      ["bottom", 2],
    ] as const;
    for (const [background, bgCode] of backgrounds)
      for (const [position, positionCode] of positions)
        expect(compile([showText({ ...textInput, background, position })])).toStrictEqual([
          { code: 101, indent: 0, parameters: ["", 0, bgCode, positionCode] },
          { code: 401, indent: 0, parameters: [""] },
          end,
        ]);
    for (const image of [
      undefined,
      { kind: "asset", category: "audio", folder: "faces", name: "A" },
      { kind: "asset", category: "image", folder: "pictures", name: "A" },
      { kind: "asset", category: "image", folder: "faces", name: "" },
      { kind: "asset", category: "image", folder: "faces", name: "A", extra: true },
    ])
      expect(() => showText({ ...textInput, face: { image, index: 0 } } as never)).toThrow(
        /face.image/,
      );
    let reads = 0;
    const input = {
      ...textInput,
      get unknown() {
        reads++;
        return "discarded";
      },
    };
    expect(() => showText(input)).toThrow(/unknown/);
    expect(reads).toBe(0);
    expect(() => imageAsset({ folder: "faces", name: "A", extra: true } as never)).toThrow(
      /imageAsset/,
    );
  },
);

messageTest(
  "compiles all named item types and required number input without defaults or zero references",
  () => {
    const variable = variableRef({ id: 2 });
    const nodes = [
      inputNumber({ variable, digits: 8 }),
      selectItem({ variable, itemType: "regular" }),
      selectItem({ variable, itemType: "key" }),
      selectItem({ variable, itemType: "hiddenA" }),
      selectItem({ variable, itemType: "hiddenB" }),
    ];
    const native = [
      { code: 103, indent: 0, parameters: [2, 8] },
      { code: 104, indent: 0, parameters: [2, 1] },
      { code: 104, indent: 0, parameters: [2, 2] },
      { code: 104, indent: 0, parameters: [2, 3] },
      { code: 104, indent: 0, parameters: [2, 4] },
      end,
    ];
    expect(compile(nodes)).toStrictEqual(native);
    expect(renderDecompiledCommandList(native).source).toContain('itemType: "hiddenB"');
    for (const digits of [undefined, 0, 9, 1.5, NaN]) {
      expect(() => inputNumber({ variable, digits } as never)).toThrow(/digits/);
      expect(() => compile([{ kind: "inputNumber", variable, digits } as never])).toThrow(/digits/);
    }
    for (const itemType of [undefined, 1, 0, 5, "hiddenC"]) {
      expect(() => selectItem({ variable, itemType } as never)).toThrow(/itemType/);
      expect(() => compile([{ kind: "selectItem", variable, itemType } as never])).toThrow(
        /itemType/,
      );
    }
    for (const [code, parameters] of [
      [103, [2, 0]],
      [103, [2, 9]],
      [104, [2, 0]],
      [104, [2, 5]],
      [103, [0, 1]],
      [104, [0, 1]],
    ] as const) {
      expect(() =>
        renderDecompiledCommandList([{ code, indent: 0, parameters: [...parameters] }, end]),
      ).toThrow(/parameters\[/);
    }
    expect(() => compile([inputNumber({ variable: variableRef({ id: 5 }), digits: 1 })])).toThrow(
      /MV-E103-REFERENCE.*commands\[0\].variable/,
    );
  },
);

messageTest(
  "resolves exact staged variable names without trimming or binding to item references",
  () => {
    const definition = commonEvent({
      id: 1,
      name: "Exact name",
      trigger: "none",
      commands: [selectItem({ variable: variableRef({ name: " " }), itemType: "key" })],
    });
    const graph = buildStagedDataGraph({
      declarations: [definition, variableDefinition({ id: 3, name: " " })],
    });
    expect(
      compileCommonEvent(definition, { nextId: 1, resolver: graph.resolver }).list,
    ).toStrictEqual([{ code: 104, indent: 0, parameters: [3, 2] }, end]);
  },
);

messageTest(
  "rejects invalid Show Text before helper copying, untyped compilation and native rendering",
  () => {
    const invalid = [
      { ...textInput, face: { image: null, index: -0 } },
      { ...textInput, face: { image: null, index: 2147483648 } },
      { ...textInput, face: { image: null, index: -1 } },
      { ...textInput, face: { image: null, index: 0.5 } },
      { ...textInput, face: { image: null } },
      { ...textInput, face: { image: null, index: 0, extra: true } },
      { ...textInput, background: undefined },
      { ...textInput, position: 2 },
      { ...textInput, extra: true },
      { ...textInput, lines: [] },
      { ...textInput, lines: ["a", "b", "c", "d", "e"] },
      { ...textInput, lines: ["a\nb"] },
      { ...textInput, lines: ["a\r\nb"] },
      { ...textInput, lines: [undefined] },
      { ...textInput, lines: [null] },
      { ...textInput, lines: new Array(1) },
      { ...textInput, lines: Object.assign(["a"], { extra: true }) },
    ];
    for (const input of invalid) {
      expect(() => showText(input as never), JSON.stringify(input)).toThrow(/MV-E101/);
      expect(() => compile([{ kind: "showText", ...input } as never])).toThrow(/MV-E101/);
    }
    for (const index of [-0, -1, 0.5, 2147483648]) {
      const native = [
        { code: 101, indent: 0, parameters: ["", index, 0, 2] },
        { code: 401, indent: 0, parameters: [""] },
        end,
      ];
      expect(() => renderDecompiledCommandList(native)).toThrow(/parameters\[1\]/);
      expect(() =>
        compile(native.slice(0, -1).map((command) => ({ kind: "rawDslCommand", ...command }))),
      ).toThrow();
    }
    for (const lines of [[], ["a", "b", "c", "d", "e"], ["a\nb"]]) {
      expect(() =>
        renderDecompiledCommandList([
          { code: 101, indent: 0, parameters: ["", 0, 0, 2] },
          ...lines.map((line) => ({ code: 401, indent: 0, parameters: [line] })),
          end,
        ]),
      ).toThrow(/MV-E101|MV-MESSAGE/);
    }
  },
);
