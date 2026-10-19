import { expect, it as test } from "vitest";
import { recordEvidence } from "./support/mv-evidence.js";
import {
  commonEvent,
  showPicture,
  movePicture,
  rotatePicture,
  tintPicture,
  erasePicture,
  variableRef,
  rawDslCommand,
} from "../src/index.js";
import { compileCommonEvent } from "../src/compiler/events.js";
import { renderDecompiledCommandList } from "../src/decompiler/dispatch.js";
import {
  buildStagedDataGraph,
  validateDslOwnedDeclarations,
} from "../src/validation/staged-graph.js";

const resolver = buildStagedDataGraph({ declarations: [] }).resolver;
function it(name: string, verify: () => void) {
  test(name, async () => {
    const startedAt = new Date().toISOString();
    let failure: unknown;
    try {
      verify();
    } catch (error) {
      failure = error;
      throw error;
    } finally {
      await recordEvidence({
        requirementId: "MV-S6-PICTURE-001",
        startedAt,
        stages: [
          "Independent complete native expectations",
          "Public helpers, event compilation/decompilation and validation",
          "Exact values, saved shape and diagnostic path assertions",
        ],
        expected: name,
        actual: { assertionsCompleted: failure === undefined },
        ...(failure === undefined ? {} : { error: failure }),
      });
    }
  });
}
it("requires every owned Picture input field at helper and direct-node boundaries", () => {
  const display = {
    pictureId: 1,
    origin: "upperLeft",
    position: { kind: "direct", x: 0, y: 0 },
    scaleX: 100,
    scaleY: 100,
    opacity: 255,
    blendMode: "normal",
  } as const;
  const cases = [
    ["showPicture", showPicture, { ...display, image: null }],
    ["movePicture", movePicture, { ...display, duration: 1, wait: false }],
    ["rotatePicture", rotatePicture, { pictureId: 1, speed: 0 }],
    [
      "tintPicture",
      tintPicture,
      { pictureId: 1, tone: { red: 0, green: 0, blue: 0, gray: 0 }, duration: 1, wait: false },
    ],
    ["erasePicture", erasePicture, { pictureId: 1 }],
  ] as const;
  for (const [kind, helper, valid] of cases)
    for (const field of Object.keys(valid)) {
      const input: Record<string, unknown> = { ...valid };
      delete input[field];
      expect(() => (helper as (input: never) => unknown)(input as never)).toThrow(
        `${kind}.${field}`,
      );
      const event = commonEvent({
        id: 1,
        name: "Required Picture input",
        trigger: "none",
        commands: [{ kind, ...input } as never],
      });
      expect(validateDslOwnedDeclarations([event], { scriptEnabled: false }).issues).toContainEqual(
        expect.objectContaining({ dslPath: `commands[0].${field}` }),
      );
      expect(() => compileCommonEvent(event, { nextId: 1, resolver })).toThrow(
        `commands[0].${field}`,
      );
    }
});

it("rejects every malformed Picture native slot and exact length in both native and known raw boundaries", () => {
  const baselines: [number, unknown[]][] = [
    [231, [1, "", 0, 0, 0, 0, 100, 100, 255, 0]],
    [232, [100, 0, 1, 1, 1, 1, -100, 2000, 0, 3, 999, true]],
    [233, [1, 0]],
    [234, [100, [0, 0, 0, 0], 1, false]],
    [235, [1]],
  ];
  const resolver = buildStagedDataGraph({
    declarations: [],
    snapshotReferences: { variableCapacity: 1 },
  }).resolver;
  const cases: [number, unknown[], string][] = [];
  for (const [code, parameters] of baselines) {
    cases.push([code, parameters.slice(0, -1), ""], [code, [...parameters, 0], ""]);
    for (let slot = 0; slot < parameters.length; slot++) {
      const invalid = [...parameters];
      invalid[slot] = null;
      cases.push([code, invalid, `[${slot}]`]);
    }
  }
  for (const [code, slot, values] of [
    [231, 0, [-1, 101, 1.5]],
    [231, 2, [2, -0]],
    [231, 3, [2, -0]],
    [231, 4, [-10000, 10000, 0.5]],
    [231, 5, [-10000, 10000, 0.5]],
    [231, 6, [-2001, 2001, 0.5]],
    [231, 7, [-2001, 2001, 0.5]],
    [231, 8, [-1, 256, 0.5]],
    [231, 9, [-1, 4, -0]],
    [232, 1, [1, -0]],
    [232, 4, [0, -0, 1.5]],
    [232, 5, [0, -0, 1.5]],
    [232, 10, [0, 1000, 1.5]],
    [233, 1, [-91, 91, 0.5]],
    [234, 2, [0, 1000, 1.5]],
    [235, 0, [0, 101, 0.5]],
  ] as const)
    for (const value of values) {
      const parameters = [...baselines.find(([candidate]) => candidate === code)![1]];
      parameters[slot] = value;
      cases.push([code, parameters, `[${slot}]`]);
    }
  for (const [slot, values] of [
    [0, [-256, 256, 0.5]],
    [1, [-256, 256, 0.5]],
    [2, [-256, 256, 0.5]],
    [3, [-1, 256, 0.5]],
  ] as const)
    for (const value of values) {
      const tone: unknown[] = [0, 0, 0, 0];
      tone[slot] = value;
      cases.push([234, [1, tone, 1, false], `[1][${slot}]`]);
    }
  for (const tone of [[], [0, 0, 0], [0, 0, 0, 0, 0], {}])
    cases.push([234, [1, tone, 1, false], "[1]"]);
  for (const [code, parameters, suffix] of cases) {
    const diagnostic =
      code === 232 &&
      parameters.length === 12 &&
      (parameters[1] !== 0 || Object.is(parameters[1], -0))
        ? "MV-E232-SAVED-SHAPE"
        : `MV-E${code}-PARAMETERS`;
    expect(() =>
      renderDecompiledCommandList([
        { code, indent: 0, parameters },
        { code: 0, indent: 0, parameters: [] },
      ]),
    ).toThrow(`list[0].parameters${suffix}`);
    const event = commonEvent({
      id: 1,
      name: "Picture native slots",
      trigger: "none",
      commands: [rawDslCommand({ code, parameters })],
    });
    expect(
      validateDslOwnedDeclarations([event], {
        scriptEnabled: false,
        snapshotReferences: { variableCapacity: 1 },
      }).issues,
    ).toContainEqual(
      expect.objectContaining({ code: diagnostic, dslPath: `commands[0].parameters${suffix}` }),
    );
    expect(() => compileCommonEvent(event, { nextId: 1, resolver })).toThrow(diagnostic);
  }
});
it("preserves explicit Show Picture None and every independent display field", () => {
  const node = showPicture({
    pictureId: 100,
    image: null,
    origin: "center",
    position: { kind: "direct", x: -9999, y: 9999 },
    scaleX: -2000,
    scaleY: 2000,
    opacity: 0,
    blendMode: "screen",
  } as never);
  const expected = [
    { code: 231, indent: 0, parameters: [100, "", 1, 0, -9999, 9999, -2000, 2000, 0, 3] },
    { code: 0, indent: 0, parameters: [] },
  ];
  expect(
    compileCommonEvent(commonEvent({ id: 1, name: "None", trigger: "none", commands: [node] }), {
      nextId: 1,
      resolver,
    }).list,
  ).toStrictEqual(expected);
  const rendered = renderDecompiledCommandList(expected).source;
  expect(rendered).toContain("image: null");
  expect(rendered).toContain('origin: "center"');
  expect(rendered).toContain('blendMode: "screen"');
});

it("resolves Picture variable positions at exact formal and known raw paths without requiring a shown picture", () => {
  const snapshotReferences = { variableCapacity: 1 };
  const refResolver = buildStagedDataGraph({ declarations: [], snapshotReferences }).resolver;
  const formal = showPicture({
    pictureId: 100,
    image: null,
    origin: "center",
    position: { kind: "variables", x: variableRef({ id: 1 }), y: variableRef({ id: 2 }) },
    scaleX: 100,
    scaleY: 100,
    opacity: 255,
    blendMode: "screen",
  });
  for (const [node, path] of [
    [formal, "commands[0].position.y"],
    [
      rawDslCommand({ code: 231, parameters: [100, "", 1, 1, 1, 2, 100, 100, 255, 3] }),
      "commands[0].parameters[5]",
    ],
  ] as const) {
    const event = commonEvent({
      id: 1,
      name: "Variable positions",
      trigger: "none",
      commands: [node],
    });
    expect(
      validateDslOwnedDeclarations([event], { scriptEnabled: false, snapshotReferences }).issues,
    ).toContainEqual(expect.objectContaining({ code: "MV-E231-REFERENCE", dslPath: path }));
    expect(() => compileCommonEvent(event, { nextId: 1, resolver: refResolver })).toThrow(path);
  }
});

it("refuses known native and raw Picture domains and categorical negative zero at exact slots", () => {
  const show: unknown[] = [1, "", 0, 0, 0, 0, 100, 100, 255, 0];
  const cases: [number, unknown[], string][] = [];
  for (const [slot, value] of [
    [0, 0],
    [0, 101],
    [2, -0],
    [2, 2],
    [3, -0],
    [3, 2],
    [4, -10000],
    [5, 10000],
    [6, -2001],
    [7, 2001],
    [8, 256],
    [9, -0],
    [9, 4],
  ] as const) {
    const parameters = [...show];
    parameters[slot] = value;
    cases.push([231, parameters, `[${slot}]`]);
  }
  for (const value of [1, -0])
    cases.push([232, [1, value, 0, 0, 0, 0, 100, 100, 255, 0, 1, false], "[1]"]);
  cases.push(
    [233, [1, 91], "[1]"],
    [234, [1, [0, 0, 0, 256], 1, false], "[1][3]"],
    [234, [1, [0, 0, 0, 0], 0, false], "[2]"],
    [235, [101], "[0]"],
  );
  for (const [code, parameters, suffix] of cases) {
    const diagnostic = code === 232 ? "MV-E232-SAVED-SHAPE" : `MV-E${code}-PARAMETERS`;
    const list = [
      { code, indent: 0, parameters },
      { code: 0, indent: 0, parameters: [] },
    ];
    expect(() => renderDecompiledCommandList(list)).toThrow(diagnostic);
    expect(() => renderDecompiledCommandList(list)).toThrow(`list[0].parameters${suffix}`);
    const event = commonEvent({
      id: 1,
      name: "Native refusals",
      trigger: "none",
      commands: [rawDslCommand({ code, parameters })],
    });
    expect(validateDslOwnedDeclarations([event], { scriptEnabled: false }).issues).toContainEqual(
      expect.objectContaining({ code: diagnostic, dslPath: `commands[0].parameters${suffix}` }),
    );
    expect(() => compileCommonEvent(event, { nextId: 1, resolver })).toThrow(diagnostic);
  }
});

it("requires every Picture field and rejects invalid or excess nested saved input without numeric coercion", () => {
  const good = {
    pictureId: 1,
    image: null,
    origin: "upperLeft",
    position: { kind: "direct", x: 0, y: 0 },
    scaleX: 100,
    scaleY: 100,
    opacity: 255,
    blendMode: "normal",
  } as const;
  const cases: [Record<string, unknown>, string][] = [];
  for (const field of Object.keys(good)) {
    const input: Record<string, unknown> = { ...good };
    delete input[field];
    cases.push([input, `.${field}`]);
  }
  for (const [field, value] of [
    ["pictureId", 0],
    ["pictureId", 101],
    ["pictureId", 1.5],
    ["origin", 0],
    ["scaleX", -2001],
    ["scaleY", 2001],
    ["opacity", 256],
    ["blendMode", 0],
    ["image", { kind: "asset", category: "image", folder: "faces", name: "Wrong" }],
    ["image", { kind: "asset", category: "image", folder: "pictures", name: "" }],
  ])
    cases.push([{ ...good, [field as string]: value }, `.${field}`]);
  for (const position of [
    { kind: "direct", x: -10000, y: 0 },
    { kind: "direct", x: 0, y: 10000 },
    { kind: "direct", x: 1.5, y: 0 },
    { kind: "exchange", x: 0, y: 0 },
    { kind: "variables", x: { kind: "variable", id: 0 }, y: { kind: "variable", id: 1 } },
  ])
    cases.push([{ ...good, position }, ".position"]);
  for (const [input, path] of cases)
    expect(() => showPicture(input as never)).toThrow(`showPicture${path}`);
  for (const tone of [
    [0, 0, 0, 0],
    { red: 0, green: 0, blue: 0 },
    { red: 256, green: 0, blue: 0, gray: 0 },
    { red: 0, green: 0, blue: 0, gray: -1 },
  ])
    expect(() => tintPicture({ pictureId: 1, tone, duration: 1, wait: false } as never)).toThrow(
      "tintPicture.tone",
    );
  for (const [helper, input, path] of [
    [movePicture, { ...good, image: undefined, duration: 1, wait: false }, "movePicture"],
    [rotatePicture, { pictureId: 1, speed: 91 }, "rotatePicture.speed"],
    [
      tintPicture,
      { pictureId: 1, tone: { red: 0, green: 0, blue: 0, gray: 0 }, duration: 0, wait: false },
      "tintPicture.duration",
    ],
    [erasePicture, { pictureId: 101 }, "erasePicture.pictureId"],
  ] as const)
    expect(() => (helper as (input: never) => unknown)(input as never)).toThrow(path);
  for (const position of [
    { kind: "direct", x: 0, y: 0, origin: "center" },
    {
      kind: "variables",
      x: { kind: "variable", id: 1, unexpected: true },
      y: { kind: "variable", id: 1 },
    },
    {
      kind: "variables",
      x: { kind: "variable", id: 1, name: "ambiguous" },
      y: { kind: "variable", id: 1 },
    },
  ])
    expect(() => showPicture({ ...good, position } as never)).toThrow("showPicture.position");
});

it("rejects all owned helper and direct-node excess fields before picture output", () => {
  const display = {
    pictureId: 1,
    origin: "upperLeft",
    position: { kind: "direct", x: 0, y: 0 },
    scaleX: 100,
    scaleY: 100,
    opacity: 255,
    blendMode: "normal",
  } as const;
  const cases = [
    [showPicture, { ...display, image: null }],
    [movePicture, { ...display, duration: 1, wait: false }],
    [rotatePicture, { pictureId: 1, speed: 0 }],
    [
      tintPicture,
      { pictureId: 1, tone: { red: 0, green: 0, blue: 0, gray: 0 }, duration: 1, wait: false },
    ],
    [erasePicture, { pictureId: 1 }],
  ] as const;
  for (const [helper, input] of cases) {
    const invoke = helper as (input: never) => unknown;
    expect(() => invoke({ ...input, unexpected: "refuse" } as never)).toThrow("MV-DSL-SHAPE");
    const node = invoke(input as never) as object;
    const event = commonEvent({
      id: 1,
      name: "Bad fields",
      trigger: "none",
      commands: [{ ...node, unexpected: "refuse" } as never],
    });
    expect(validateDslOwnedDeclarations([event], { scriptEnabled: false }).issues).toContainEqual(
      expect.objectContaining({ code: "MV-DSL-SHAPE", dslPath: "commands[0]" }),
    );
    expect(() => compileCommonEvent(event, { nextId: 1, resolver })).toThrow("commands[0]");
  }
});

it("preserves named Picture Tone, signed numeric zero, explicit false wait and unshown slot operations", () => {
  const commands = [
    rotatePicture({ pictureId: 100, speed: -0 }),
    tintPicture({
      pictureId: 100,
      tone: { red: -255, green: 255, blue: -0, gray: -0 },
      duration: 1,
      wait: false,
    }),
    erasePicture({ pictureId: 100 }),
  ];
  const expected = [
    { code: 233, indent: 0, parameters: [100, -0] },
    { code: 234, indent: 0, parameters: [100, [-255, 255, -0, -0], 1, false] },
    { code: 235, indent: 0, parameters: [100] },
    { code: 0, indent: 0, parameters: [] },
  ];
  expect(
    compileCommonEvent(
      commonEvent({ id: 1, name: "Unshown operations", trigger: "none", commands }),
      { nextId: 1, resolver },
    ).list,
  ).toStrictEqual(expected);
  const source = renderDecompiledCommandList(expected).source;
  expect(source).toContain("speed: -0");
  expect(source).toContain("tone: { red: -255, green: 255, blue: -0, gray: -0 }");
  expect(source).toContain("wait: false");
});

it("preserves Move Picture variables, structural zero, complete defaults and explicit false wait", () => {
  const variableResolver = buildStagedDataGraph({
    declarations: [],
    snapshotReferences: { variableCapacity: 2 },
  }).resolver;
  const node = movePicture({
    pictureId: 1,
    origin: "upperLeft",
    position: { kind: "variables", x: variableRef({ id: 1 }), y: variableRef({ id: 2 }) },
    scaleX: 100,
    scaleY: 100,
    opacity: 255,
    blendMode: "normal",
    duration: 999,
    wait: false,
  } as never);
  const expected = [
    { code: 232, indent: 0, parameters: [1, 0, 0, 1, 1, 2, 100, 100, 255, 0, 999, false] },
    { code: 0, indent: 0, parameters: [] },
  ];
  expect(
    compileCommonEvent(
      commonEvent({ id: 1, name: "Unshown slot", trigger: "none", commands: [node] }),
      { nextId: 1, resolver: variableResolver },
    ).list,
  ).toStrictEqual(expected);
  const rendered = renderDecompiledCommandList(expected).source;
  expect(rendered).toContain('origin: "upperLeft"');
  expect(rendered).toContain("scaleX: 100");
  expect(rendered).toContain('blendMode: "normal"');
  expect(rendered).toContain("wait: false");
});
