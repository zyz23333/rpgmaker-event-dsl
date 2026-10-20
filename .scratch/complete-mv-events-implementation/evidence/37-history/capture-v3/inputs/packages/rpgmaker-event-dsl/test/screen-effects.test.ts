import { expect, it } from "vitest";
import {
  commonEvent,
  battlePage,
  troopEvent,
  wait,
  tintScreen,
  flashScreen,
  shakeScreen,
  setWeatherEffect,
  playMovie,
  movieAsset,
  fadeoutScreen,
  fadeinScreen,
  type DslCommand,
} from "../src/index.js";
import { readRawCommandList } from "../src/decompiler/core.js";
import { renderDecompiledCommandList } from "../src/decompiler/dispatch.js";
import { compileCommonEvent } from "../src/compiler/events.js";
import {
  buildStagedDataGraph,
  validateDslOwnedDeclarations,
} from "../src/validation/staged-graph.js";

function compile(commands: readonly DslCommand[]) {
  const event = commonEvent({
    id: 1,
    name: "Screen effects",
    trigger: "none",
    commands: [...commands],
  });
  const graph = buildStagedDataGraph({ declarations: [event] });
  return compileCommonEvent(event, { nextId: 1, resolver: graph.resolver }).list;
}

it("warns that battle Weather skips both effect and wait without rejecting its saved parameters", () => {
  const weather = setWeatherEffect({ weather: "storm", power: 9, duration: 999, wait: true });
  const unknownContext = commonEvent({
    id: 1,
    name: "Weather",
    trigger: "none",
    commands: [weather],
  });
  expect(validateDslOwnedDeclarations([unknownContext], { scriptEnabled: false }).issues).toEqual(
    [],
  );
  const battle = troopEvent({ troopId: 1, pages: [battlePage({ commands: [weather] })] });
  const issues = validateDslOwnedDeclarations([battle], {
    scriptEnabled: false,
    snapshotReferences: { troops: [{ id: 1, name: "" }] },
    snapshotTroops: [{ id: 1, members: [] }],
  }).issues;
  expect(issues.filter(({ level }) => level === "error")).toEqual([]);
  expect(issues).toContainEqual(
    expect.objectContaining({
      code: "MV-E236-BATTLE",
      level: "warning",
      identity: "troop:1",
      nativePath: "pages[0].list[0]",
      dslPath: "pages[0].commands[0]",
      message: expect.stringContaining("both the weather effect and its wait"),
    }),
  );
});

it("requires the named Wait frames input and retains both duration boundaries", () => {
  expect(wait({ frames: 1 })).toStrictEqual({ kind: "wait", frames: 1 });
  expect(compile([wait({ frames: 1 }), wait({ frames: 999 })])).toStrictEqual([
    { code: 230, indent: 0, parameters: [1] },
    { code: 230, indent: 0, parameters: [999] },
    { code: 0, indent: 0, parameters: [] },
  ]);
  expect(() => wait(60 as never)).toThrow();
});

it("rejects untyped Movie Asset helper fields before they can be lost", () => {
  expect(() => movieAsset({ name: "Ending", extension: "webm" } as never)).toThrow(/MV-E261/);
  expect(() => movieAsset(Object.create({ name: "Ending" }))).toThrow(/MV-E261/);
  expect(() =>
    movieAsset({
      get name() {
        throw new Error("getter must not run");
      },
    } as never),
  ).toThrow(/MV-E261/);
});

it("rejects every missing or extra owned Screen field before helper field selection and direct compilation", () => {
  const cases = [
    ["wait", wait, { frames: 1 }],
    [
      "tintScreen",
      tintScreen,
      { tone: { red: 0, green: 0, blue: 0, gray: 0 }, duration: 1, wait: false },
    ],
    [
      "flashScreen",
      flashScreen,
      { color: { red: 0, green: 0, blue: 0, alpha: 0 }, duration: 1, wait: false },
    ],
    ["shakeScreen", shakeScreen, { power: 1, speed: 1, duration: 1, wait: false }],
    ["setWeatherEffect", setWeatherEffect, { weather: "none", power: 1, duration: 1, wait: false }],
    ["playMovie", playMovie, { movie: null }],
  ] as const;
  for (const [kind, helper, good] of cases) {
    const invalid: unknown[] = [
      null,
      undefined,
      [],
      { ...good, extra: undefined },
      Object.create(good),
    ];
    for (const field of Object.keys(good)) {
      const missing = { ...good } as Record<string, unknown>;
      delete missing[field];
      invalid.push(missing, { ...good, [field]: undefined });
    }
    for (const input of invalid) {
      expect(() => helper(input as never)).toThrow();
      if (input && typeof input === "object" && !Array.isArray(input))
        expect(() => compile([{ kind, ...input } as never])).toThrow();
    }
  }
  for (const [kind, last] of [
    ["tintScreen", "gray"],
    ["flashScreen", "alpha"],
  ] as const) {
    const field = kind === "tintScreen" ? "tone" : "color";
    for (const component of ["red", "green", "blue", last]) {
      const below = kind === "tintScreen" && component !== "gray" ? -256 : -1;
      for (const value of [undefined, null, below, 256, 0.5, NaN, Infinity, -Infinity]) {
        const components = { red: 0, green: 0, blue: 0, [last]: 0, [component]: value };
        expect(() =>
          compile([{ kind, [field]: components, duration: 1, wait: false } as never]),
        ).toThrow();
      }
    }
    expect(() =>
      compile([
        {
          kind,
          [field]: { red: 0, green: 0, blue: 0, [last]: 0, extra: 0 },
          duration: 1,
          wait: false,
        } as never,
      ]),
    ).toThrow();
  }
  for (const value of [0, -0, 1000, 1.5, NaN, Infinity, -Infinity]) {
    expect(() => wait({ frames: value })).toThrow();
    expect(() =>
      tintScreen({ tone: { red: 0, green: 0, blue: 0, gray: 0 }, duration: value, wait: true }),
    ).toThrow();
    expect(() =>
      flashScreen({ color: { red: 0, green: 0, blue: 0, alpha: 0 }, duration: value, wait: true }),
    ).toThrow();
    expect(() => shakeScreen({ power: 1, speed: 1, duration: value, wait: true })).toThrow();
    expect(() =>
      setWeatherEffect({ weather: "none", power: 1, duration: value, wait: true }),
    ).toThrow();
  }
  for (const value of [0, -0, 10, 0.5, NaN, Infinity, -Infinity]) {
    expect(() => shakeScreen({ power: 1, speed: value, duration: 1, wait: true })).toThrow();
    expect(() =>
      setWeatherEffect({ weather: "none", power: value, duration: 1, wait: true }),
    ).toThrow();
  }
});

it("requires exact native Screen slot counts and concrete boolean waits in native and known raw forms", () => {
  for (const [code, good] of [
    [221, []],
    [222, []],
    [223, [[0, 0, 0, 0], 1, false]],
    [224, [[0, 0, 0, 0], 1, true]],
    [225, [1, 1, 1, false]],
    [230, [1]],
    [236, ["none", 1, 1, true]],
    [261, [""]],
  ] as const) {
    const invalid: unknown[][] = [[...good, null]];
    if (good.length > 0)
      invalid.push(
        [...good].slice(0, -1),
        [...good].map((value, index) => (index === 0 ? undefined : value)),
      );
    if ([223, 224, 225, 236].includes(code))
      for (const wait of [undefined, null, 0, 1, "false"])
        invalid.push([...good.slice(0, -1), wait]);
    if (code === 223 || code === 224)
      invalid.push(
        [[], 1, true],
        [[0, 0, 0], 1, false],
        [[0, 0, 0, 0, 0], 1, true],
        [[0, , 0, 0], 1, true],
      );
    for (const parameters of invalid) {
      expect(() =>
        readRawCommandList([
          { code, indent: 0, parameters },
          { code: 0, indent: 0, parameters: [] },
        ]),
      ).toThrow();
      expect(() => compile([{ kind: "rawDslCommand", code, parameters } as never])).toThrow();
    }
  }
});

it("rejects the same native and known-raw Screen value violations at their saved slots", () => {
  for (const [code, parameters, path] of [
    [223, [[-256, 0, 0, 0], 1, false], "parameters[0][0]"],
    [223, [[0, 0, 0, -1], 1, false], "parameters[0][3]"],
    [224, [[0, 0, 0, 256], 1, false], "parameters[0][3]"],
    [224, [[0, 0, 0, 0], 1000, false], "parameters[1]"],
    [225, [1, 0, 1, false], "parameters[1]"],
    [225, [10, 1, 1, false], "parameters[0]"],
    [230, [0], "parameters[0]"],
    [230, [-0], "parameters[0]"],
    [236, ["none", 0, 1, false], "parameters[1]"],
    [236, ["rain", 1, 0, false], "parameters[2]"],
    [236, ["hail", 1, 1, false], "parameters[0]"],
  ] as const) {
    try {
      readRawCommandList([
        { code, indent: 0, parameters },
        { code: 0, indent: 0, parameters: [] },
      ]);
      throw new Error("accepted invalid native");
    } catch (error) {
      expect(error).toMatchObject({ location: { nativePath: `list[0].${path}` } });
    }
    expect(() => compile([{ kind: "rawDslCommand", code, parameters } as never])).toThrow();
  }
});

it("keeps Fade operations parameterless in helper and direct authored forms", () => {
  for (const helper of [fadeoutScreen, fadeinScreen])
    expect(() => (helper as (...input: unknown[]) => unknown)({ duration: 60 })).toThrow();
  for (const kind of ["fadeoutScreen", "fadeinScreen"])
    expect(() => compile([{ kind, duration: 60 } as never])).toThrow();
  expect(compile([fadeoutScreen(), fadeinScreen()])).toStrictEqual([
    { code: 221, indent: 0, parameters: [] },
    { code: 222, indent: 0, parameters: [] },
    { code: 0, indent: 0, parameters: [] },
  ]);
});

it("expresses explicit Movie None and a named movie without inventing an asset", () => {
  const records = compile([
    playMovie({ movie: null }),
    playMovie({ movie: movieAsset({ name: "Ending" }) }),
  ]);
  expect(records).toStrictEqual([
    { code: 261, indent: 0, parameters: [""] },
    { code: 261, indent: 0, parameters: ["Ending"] },
    { code: 0, indent: 0, parameters: [] },
  ]);
  const source = renderDecompiledCommandList(readRawCommandList(records)).source;
  expect(source).toContain("playMovie({ movie: null })");
  expect(source).toContain('movieAsset({ name: "Ending" })');
  for (const movie of [
    undefined,
    "Ending",
    { kind: "asset", category: "image", folder: "pictures", name: "Ending" },
    { kind: "asset", category: "movie", folder: "movies", name: "", extra: true },
  ])
    expect(() => playMovie({ movie } as never)).toThrow(/MV-E261/);
});

it("retains the inactive Weather None power and requires all four fields", () => {
  expect(() => setWeatherEffect({ weather: "none", power: 9, duration: 999 } as never)).toThrow(
    /MV-E236/,
  );
  for (const weather of ["none", "rain", "storm", "snow"] as const) {
    const records = compile([setWeatherEffect({ weather, power: 9, duration: 999, wait: false })]);
    expect(records[0]).toStrictEqual({
      code: 236,
      indent: 0,
      parameters: [weather, 9, 999, false],
    });
    expect(renderDecompiledCommandList(readRawCommandList(records)).source).toContain(
      "power: 9, duration: 999, wait: false",
    );
  }
  expect(() => setWeatherEffect({ weather: "none", power: 0, duration: 1, wait: true })).toThrow();
});

it("requires explicit Shake waits and uses its own 1..9 power and speed domain", () => {
  expect(() => shakeScreen({ power: 1, speed: 9, duration: 1 } as never)).toThrow(/MV-E225/);
  const records = compile([
    shakeScreen({ power: 1, speed: 9, duration: 1, wait: false }),
    shakeScreen({ power: 9, speed: 1, duration: 999, wait: true }),
  ]);
  expect(records).toStrictEqual([
    { code: 225, indent: 0, parameters: [1, 9, 1, false] },
    { code: 225, indent: 0, parameters: [9, 1, 999, true] },
    { code: 0, indent: 0, parameters: [] },
  ]);
  expect(renderDecompiledCommandList(readRawCommandList(records)).source).toContain(
    "duration: 1, wait: false",
  );
  for (const value of [0, -0, 10, 1.5, NaN, Infinity])
    expect(() => shakeScreen({ power: value, speed: 1, duration: 1, wait: false })).toThrow();
});

it("requires Flash fields and retains zero alpha and every signed-zero component", () => {
  const color = { red: -0, green: 255, blue: -0, alpha: -0 };
  expect(() => flashScreen({ color, duration: 999 } as never)).toThrow(/MV-E224/);
  const records = compile([flashScreen({ color, duration: 999, wait: false })]);
  expect(records[0]).toStrictEqual({
    code: 224,
    indent: 0,
    parameters: [[-0, 255, -0, -0], 999, false],
  });
  expect(renderDecompiledCommandList(readRawCommandList(records)).source).toContain(
    "flashScreen({ color: { red: -0, green: 255, blue: -0, alpha: -0 }, duration: 999, wait: false })",
  );
});

it("requires all named Tint fields and preserves numeric negative zero in the saved tone", () => {
  const tone = { red: -0, green: -255, blue: 255, gray: -0 };
  expect(() => tintScreen({ tone, duration: 1 } as never)).toThrow(/MV-E223/);
  const records = compile([tintScreen({ tone, duration: 1, wait: false })]);
  expect(records).toStrictEqual([
    { code: 223, indent: 0, parameters: [[-0, -255, 255, -0], 1, false] },
    { code: 0, indent: 0, parameters: [] },
  ]);
  expect(renderDecompiledCommandList(readRawCommandList(records)).source).toContain(
    "tintScreen({ tone: { red: -0, green: -255, blue: 255, gray: -0 }, duration: 1, wait: false })",
  );
  expect(() => tintScreen({ tone: [0, 0, 0, 0], duration: 1, wait: false } as never)).toThrow();
});
