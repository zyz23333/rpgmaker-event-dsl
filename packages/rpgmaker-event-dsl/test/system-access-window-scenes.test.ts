import { readFile } from "node:fs/promises";
import { expect, it as test } from "vitest";
import * as dsl from "../src/index.js";
import { compileCommonEvent } from "../src/compiler/events.js";
import { renderDecompiledCommandList } from "../src/decompiler/dispatch.js";
import { buildStagedDataGraph } from "../src/validation/staged-graph.js";
import { recordEvidence } from "./support/mv-evidence.js";

const fixture = JSON.parse(
  await readFile(
    new URL("./fixtures/mv-evidence/system-access-window-scenes.json", import.meta.url),
    "utf8",
  ),
);
const resolver = buildStagedDataGraph({ declarations: [] }).resolver;

function it(name: string, body: () => void | Promise<void>) {
  test(name, async () => {
    const startedAt = new Date().toISOString();
    let failure: unknown;
    try {
      await body();
    } catch (error) {
      failure = error;
      throw error;
    } finally {
      await recordEvidence({
        requirementId: name.split(":")[0]!,
        startedAt,
        stages: [
          "Public authoring and command compiler boundaries with independent native saved-slot literals",
          "Native command-list rendering boundary and known raw helper/direct inputs where asserted",
        ],
        expected: name,
        actual: { case: name, assertionsCompleted: failure === undefined },
        ...(failure === undefined ? {} : { error: failure }),
      });
    }
  });
}

it("MV-S6-SYSTEM-SCENES-001: compiles all four explicit access flags with false zero and true one", () => {
  const commands = [
    dsl.changeSaveAccess({ enabled: false }),
    dsl.changeSaveAccess({ enabled: true }),
    dsl.changeMenuAccess({ enabled: false }),
    dsl.changeMenuAccess({ enabled: true }),
    dsl.changeEncounter({ enabled: false }),
    dsl.changeEncounter({ enabled: true }),
    dsl.changeFormationAccess({ enabled: false }),
    dsl.changeFormationAccess({ enabled: true }),
  ];
  expect(
    compileCommonEvent(dsl.commonEvent({ id: 1, name: "Access", trigger: "none", commands }), {
      nextId: 1,
      resolver,
    }).list,
  ).toStrictEqual([...fixture.access, { code: 0, indent: 0, parameters: [] }]);
});

it("MV-S6-SYSTEM-SCENES-002: rejects missing or nonboolean access flags and unsupported own shapes before projection", () => {
  for (const [kind, helper, code] of [
    ["changeSaveAccess", dsl.changeSaveAccess, 134],
    ["changeMenuAccess", dsl.changeMenuAccess, 135],
    ["changeEncounter", dsl.changeEncounter, 136],
    ["changeFormationAccess", dsl.changeFormationAccess, 137],
  ] as const) {
    for (const input of [
      {},
      ...[undefined, null, 0, 1, "true", [], {}, dsl.scriptInput({ code: "true" })].map(
        (enabled) => ({ enabled }),
      ),
    ]) {
      expect(() => helper(input as never)).toThrow(
        new RegExp(`MV-E${code}-INPUT.*${kind}\\.enabled`),
      );
      expect(() =>
        compileCommonEvent(
          dsl.commonEvent({
            id: 1,
            name: "Invalid access",
            trigger: "none",
            commands: [{ kind, ...input } as never],
          }),
          { nextId: 1, resolver },
        ),
      ).toThrow(new RegExp(`MV-E${code}-INPUT.*commands\\[0\\]\\.enabled`));
    }
    let reads = 0;
    const accessor = Object.defineProperty({}, "enabled", {
      enumerable: true,
      get: () => {
        reads++;
        return true;
      },
    });
    for (const input of [
      null,
      [],
      { enabled: true, extra: 1 },
      { enabled: true, disabled: false },
      Object.assign({ enabled: true }, { [Symbol("extra")]: 1 }),
      Object.defineProperty({ enabled: true }, "extra", { value: 1 }),
      Object.create({ enabled: true }),
      accessor,
    ])
      expect(() => helper(input as never)).toThrow(/MV-DSL-SHAPE/);
    expect(reads).toBe(0);
    expect(() =>
      compileCommonEvent(
        dsl.commonEvent({
          id: 1,
          name: "Extra access",
          trigger: "none",
          commands: [{ kind, enabled: true, extra: 1 } as never],
        }),
        { nextId: 1, resolver },
      ),
    ).toThrow(/MV-DSL-SHAPE.*commands\[0\]/);
    expect(helper(Object.assign(Object.create(null), { enabled: false }))).toStrictEqual({
      kind,
      enabled: false,
    });
  }
});

it("MV-S6-SYSTEM-SCENES-003: requires exact named window Tone fields and preserves hidden gray and numeric negative zero", () => {
  expect(() => dsl.changeWindowColor({ tone: [0, 0, 0, 0] } as never)).toThrow(/MV-DSL-SHAPE/);
  const tones = [
    { red: -255, green: 255, blue: 0, gray: 255 },
    { red: 255, green: -255, blue: 255, gray: 0 },
    { red: -0, green: 0, blue: -0, gray: -0 },
  ];
  const compiled = compileCommonEvent(
    dsl.commonEvent({
      id: 1,
      name: "Window",
      trigger: "none",
      commands: tones.map((tone) => dsl.changeWindowColor({ tone })),
    }),
    { nextId: 1, resolver },
  );
  expect(compiled.list).toStrictEqual([...fixture.tones, { code: 0, indent: 0, parameters: [] }]);
  expect(
    (compiled.list[2]!.parameters[0] as number[]).map((value) => Object.is(value, -0)),
  ).toStrictEqual([true, false, true, true]);
  expect(
    compileCommonEvent(
      dsl.commonEvent({
        id: 1,
        name: "Blue lower bound",
        trigger: "none",
        commands: [dsl.changeWindowColor({ tone: { red: 0, green: 0, blue: -255, gray: 113 } })],
      }),
      { nextId: 1, resolver },
    ).list,
  ).toStrictEqual([
    { code: 138, indent: 0, parameters: [[0, 0, -255, 113]] },
    { code: 0, indent: 0, parameters: [] },
  ]);
  const good = { red: 0, green: 0, blue: 0, gray: 0 };
  for (const field of ["red", "green", "blue", "gray"] as const) {
    const missing: Partial<typeof good> = { ...good };
    delete missing[field];
    expect(() => dsl.changeWindowColor({ tone: missing } as never)).toThrow(
      new RegExp(`MV-E138-INPUT.*tone\\.${field}`),
    );
    for (const value of [
      field === "gray" ? -1 : -256,
      256,
      0.5,
      NaN,
      Infinity,
      -Infinity,
      "0",
      null,
      undefined,
      [],
    ]) {
      const tone = { ...good, [field]: value };
      expect(() => dsl.changeWindowColor({ tone } as never)).toThrow(
        new RegExp(`MV-E138-INPUT.*tone\\.${field}`),
      );
      expect(() =>
        compileCommonEvent(
          dsl.commonEvent({
            id: 1,
            name: "Invalid Tone",
            trigger: "none",
            commands: [{ kind: "changeWindowColor", tone } as never],
          }),
          { nextId: 1, resolver },
        ),
      ).toThrow(new RegExp(`MV-E138-INPUT.*commands\\[0\\]\\.tone\\.${field}`));
    }
  }
  expect(() => dsl.changeWindowColor({} as never)).toThrow(/MV-DSL-SHAPE.*tone/);
  expect(() => dsl.changeWindowColor({ tone: good, extra: true } as never)).toThrow(/MV-DSL-SHAPE/);
  let reads = 0;
  for (const tone of [
    null,
    [],
    { ...good, extra: true },
    Object.assign({ ...good }, { [Symbol("extra")]: 1 }),
    Object.defineProperty({ ...good }, "red", {
      get: () => {
        reads++;
        return 0;
      },
    }),
    Object.defineProperty({ ...good }, "extra", { value: true }),
    Object.create(good),
  ])
    expect(() => dsl.changeWindowColor({ tone } as never)).toThrow(/MV-DSL-SHAPE/);
  expect(reads).toBe(0);
  expect(() =>
    dsl.changeWindowColor({ tone: Object.assign(Object.create(null), good) }),
  ).not.toThrow();
});

it("MV-S6-SYSTEM-SCENES-004: validates exact native access flag slots before decompilation or known raw compilation", () => {
  expect(
    compileCommonEvent(
      dsl.commonEvent({
        id: 1,
        name: "Known raw access",
        trigger: "none",
        commands: fixture.access.map((command: { code: number; parameters: unknown[] }) =>
          dsl.rawDslCommand({ code: command.code, parameters: command.parameters }),
        ),
      }),
      { nextId: 1, resolver },
    ).list,
  ).toStrictEqual([...fixture.access, { code: 0, indent: 0, parameters: [] }]);
  for (const code of [134, 135, 136, 137]) {
    const rejected = (run: () => unknown, path: string, native: boolean) => {
      let failure: unknown;
      try {
        run();
      } catch (error) {
        failure = error;
      }
      expect(failure).toMatchObject({
        code: `MV-E${code}-PARAMETERS`,
        location: { [native ? "nativePath" : "dslPath"]: path },
      });
    };
    for (const [parameters, suffix] of [
      ...[-0, -1, 2, 0.5, "0", false, null, [], {}].map((value) => [[value], "[0]"] as const),
      [[], ""],
      [[0, 1], ""],
    ] as const) {
      rejected(
        () =>
          renderDecompiledCommandList([
            { code, indent: 0, parameters: [...parameters] },
            { code: 0, indent: 0, parameters: [] },
          ]),
        `list[0].parameters${suffix}`,
        true,
      );
      rejected(
        () =>
          compileCommonEvent(
            dsl.commonEvent({
              id: 1,
              name: "Invalid raw helper access",
              trigger: "none",
              commands: [dsl.rawDslCommand({ code, parameters: [...parameters] })],
            }),
            { nextId: 1, resolver },
          ),
        `commands[0].parameters${suffix}`,
        false,
      );
      rejected(
        () =>
          compileCommonEvent(
            dsl.commonEvent({
              id: 1,
              name: "Invalid known raw access",
              trigger: "none",
              commands: [{ kind: "rawDslCommand", code, parameters: [...parameters] }],
            }),
            { nextId: 1, resolver },
          ),
        `commands[0].parameters${suffix}`,
        false,
      );
    }
  }
});

it("MV-S6-SYSTEM-SCENES-005: validates exact native Window Tone shape and ranges while preserving all numeric zero signs", () => {
  const compiled = compileCommonEvent(
    dsl.commonEvent({
      id: 1,
      name: "Known raw Window Tone",
      trigger: "none",
      commands: fixture.tones.map((command: { code: number; parameters: unknown[] }) =>
        dsl.rawDslCommand({ code: command.code, parameters: command.parameters }),
      ),
    }),
    { nextId: 1, resolver },
  );
  expect(compiled.list).toStrictEqual([...fixture.tones, { code: 0, indent: 0, parameters: [] }]);
  expect(
    (compiled.list[2]!.parameters[0] as number[]).map((value) => Object.is(value, -0)),
  ).toStrictEqual([true, false, true, true]);
  expect(() =>
    renderDecompiledCommandList([...fixture.tones, { code: 0, indent: 0, parameters: [] }]),
  ).not.toThrow();
  const rejected = (parameters: unknown[], suffix: string, code = "MV-E138-PARAMETERS") => {
    for (const [run, location] of [
      [
        () =>
          renderDecompiledCommandList([
            { code: 138, indent: 0, parameters },
            { code: 0, indent: 0, parameters: [] },
          ]),
        { nativePath: `list[0].parameters${suffix}` },
      ],
      ...[false, true].map(
        (direct) =>
          [
            () =>
              compileCommonEvent(
                dsl.commonEvent({
                  id: 1,
                  name: "Invalid known raw Window Tone",
                  trigger: "none",
                  commands: [
                    direct
                      ? { kind: "rawDslCommand" as const, code: 138, parameters }
                      : dsl.rawDslCommand({ code: 138, parameters }),
                  ],
                }),
                { nextId: 1, resolver },
              ),
            { dslPath: `commands[0].parameters${suffix}` },
          ] as const,
      ),
    ] as const) {
      let failure: unknown;
      try {
        run();
      } catch (error) {
        failure = error;
      }
      expect(failure).toMatchObject({ code, location });
    }
  };
  for (const index of [0, 1, 2, 3]) {
    for (const value of [index === 3 ? -1 : -256, 256, 0.5, "0", null, [], {}]) {
      const tone: unknown[] = [0, 0, 0, 0];
      tone[index] = value;
      rejected([tone], `[0][${index}]`);
    }
    for (const value of [NaN, Infinity, -Infinity, undefined]) {
      const tone: unknown[] = [0, 0, 0, 0];
      tone[index] = value;
      rejected([tone], `[0][${index}]`, "MV-STRICT-JSON");
    }
  }
  for (const tone of [null, 0, {}, "tone", [], [0, 0, 0], [0, 0, 0, 0, 0]]) rejected([tone], "[0]");
  rejected([], "");
  rejected([[0, 0, 0, 0], true], "");
});

it("MV-S6-SYSTEM-SCENES-006: decompiles all access flags with explicit booleans and only the new Encounter helper", () => {
  const rendered = renderDecompiledCommandList([
    ...fixture.access,
    { code: 0, indent: 0, parameters: [] },
  ]);
  expect(rendered).toStrictEqual({
    helperNames: [
      "changeEncounter",
      "changeFormationAccess",
      "changeMenuAccess",
      "changeSaveAccess",
    ],
    source: [
      "changeSaveAccess({ enabled: false }),",
      "changeSaveAccess({ enabled: true }),",
      "changeMenuAccess({ enabled: false }),",
      "changeMenuAccess({ enabled: true }),",
      "changeEncounter({ enabled: false }),",
      "changeEncounter({ enabled: true }),",
      "changeFormationAccess({ enabled: false }),",
      "changeFormationAccess({ enabled: true }),",
    ].join("\n"),
  });
  expect(Object.hasOwn(dsl, "changeEncounterDisable")).toBe(false);
});

it("MV-S6-SYSTEM-SCENES-007: decompiles Window Tone as four explicit named fields including hidden gray and negative zero", () => {
  expect(
    renderDecompiledCommandList([
      ...fixture.tones,
      { code: 138, indent: 0, parameters: [[0, 0, -255, 113]] },
      { code: 0, indent: 0, parameters: [] },
    ]),
  ).toStrictEqual({
    helperNames: ["changeWindowColor"],
    source: [
      "changeWindowColor({ tone: { red: -255, green: 255, blue: 0, gray: 255 } }),",
      "changeWindowColor({ tone: { red: 255, green: -255, blue: 255, gray: 0 } }),",
      "changeWindowColor({ tone: { red: -0, green: 0, blue: -0, gray: -0 } }),",
      "changeWindowColor({ tone: { red: 0, green: 0, blue: -255, gray: 113 } }),",
    ].join("\n"),
  });
});

it("MV-S6-SYSTEM-SCENES-008: requires zero scene helper inputs and exact direct command fields", () => {
  const scenes = [
    ["openMenuScreen", dsl.openMenuScreen, 351],
    ["openSaveScreen", dsl.openSaveScreen, 352],
    ["gameOver", dsl.gameOver, 353],
    ["returnToTitleScreen", dsl.returnToTitleScreen, 354],
  ] as const;
  expect(
    compileCommonEvent(
      dsl.commonEvent({
        id: 1,
        name: "Scenes",
        trigger: "none",
        commands: scenes.map(([, helper]) => helper()),
      }),
      { nextId: 1, resolver },
    ).list,
  ).toStrictEqual([...fixture.scenes, { code: 0, indent: 0, parameters: [] }]);
  expect(
    renderDecompiledCommandList([...fixture.scenes, { code: 0, indent: 0, parameters: [] }]),
  ).toStrictEqual({
    helperNames: ["gameOver", "openMenuScreen", "openSaveScreen", "returnToTitleScreen"],
    source: [
      "openMenuScreen(),",
      "openSaveScreen(),",
      "gameOver(),",
      "returnToTitleScreen(),",
    ].join("\n"),
  });
  for (const [kind, helper, code] of scenes) {
    const invoke = helper as (...args: unknown[]) => unknown;
    for (const args of [[undefined], [null], [false], [0], [{}], [[], {}]])
      expect(() => invoke(...args)).toThrow(new RegExp(`MV-E${code}-INPUT.*${kind}`));
    let reads = 0;
    const accessor = Object.defineProperty({ kind }, "extra", {
      enumerable: true,
      get: () => {
        reads++;
        return true;
      },
    });
    for (const command of [
      { kind, extra: true },
      { kind, parameters: [] },
      Object.assign({ kind }, { [Symbol("extra")]: true }),
      Object.defineProperty({ kind }, "extra", { value: true }),
      accessor,
      Object.create({ kind }),
    ])
      expect(() =>
        compileCommonEvent(
          dsl.commonEvent({
            id: 1,
            name: "Invalid scene shape",
            trigger: "none",
            commands: [command],
          }),
          { nextId: 1, resolver },
        ),
      ).toThrow(/MV-DSL-SHAPE.*commands\[0\]/);
    expect(reads).toBe(0);
    expect(
      compileCommonEvent(
        dsl.commonEvent({
          id: 1,
          name: "Null prototype scene",
          trigger: "none",
          commands: [Object.assign(Object.create(null), { kind })],
        }),
        { nextId: 1, resolver },
      ).list,
    ).toStrictEqual([
      { code, indent: 0, parameters: [] },
      { code: 0, indent: 0, parameters: [] },
    ]);
  }
});

it("MV-S6-SYSTEM-SCENES-009: accepts only empty saved scene slots through native and both known raw compilation inputs", () => {
  expect(
    compileCommonEvent(
      dsl.commonEvent({
        id: 1,
        name: "Known raw scenes",
        trigger: "none",
        commands: fixture.scenes.map((command: { code: number; parameters: unknown[] }) =>
          dsl.rawDslCommand({ code: command.code, parameters: command.parameters }),
        ),
      }),
      { nextId: 1, resolver },
    ).list,
  ).toStrictEqual([...fixture.scenes, { code: 0, indent: 0, parameters: [] }]);
  for (const code of [351, 352, 353, 354])
    for (const parameters of [[0], [-0], [null], [false], [[]], [{}], [0, 1]])
      for (const [run, location] of [
        [
          () =>
            renderDecompiledCommandList([
              { code, indent: 0, parameters },
              { code: 0, indent: 0, parameters: [] },
            ]),
          { nativePath: "list[0].parameters" },
        ],
        ...[false, true].map(
          (direct) =>
            [
              () =>
                compileCommonEvent(
                  dsl.commonEvent({
                    id: 1,
                    name: "Invalid known raw scene",
                    trigger: "none",
                    commands: [
                      direct
                        ? { kind: "rawDslCommand" as const, code, parameters }
                        : dsl.rawDslCommand({ code, parameters }),
                    ],
                  }),
                  { nextId: 1, resolver },
                ),
              { dslPath: "commands[0].parameters" },
            ] as const,
        ),
      ] as const) {
        let failure: unknown;
        try {
          run();
        } catch (error) {
          failure = error;
        }
        expect(failure).toMatchObject({ code: "MV-COMMAND-PARAMETERS", location });
      }
});
