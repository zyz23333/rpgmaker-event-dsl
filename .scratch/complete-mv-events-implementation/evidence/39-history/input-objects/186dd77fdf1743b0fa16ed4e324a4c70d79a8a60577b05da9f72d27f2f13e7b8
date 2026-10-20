import { expect, it } from "vitest";
import * as dsl from "../src/index.js";
import type { DslCommand } from "../src/domain/types.js";
import { compileCommonEvent } from "../src/compiler/events.js";
import { buildStagedDataGraph } from "../src/validation/staged-graph.js";
import { renderDecompiledCommandList } from "../src/decompiler/dispatch.js";

const resolver = buildStagedDataGraph({ declarations: [] }).resolver;
const end = { code: 0, indent: 0, parameters: [] };
const compile = (commands: readonly DslCommand[]) =>
  compileCommonEvent(dsl.commonEvent({ id: 1, name: "Audio", trigger: "none", commands }), {
    nextId: 1,
    resolver,
  }).list;

it("preserves explicit BGM None and every independent saved audio value", () => {
  const node = dsl.playBgm({ audio: { asset: null, volume: -0, pitch: 50, pan: -100 } } as never);
  const expected = {
    code: 241,
    indent: 0,
    parameters: [{ name: "", volume: -0, pitch: 50, pan: -100 }],
  };
  expect(compile([node])).toStrictEqual([expected, end]);
  expect(renderDecompiledCommandList([expected, end]).source).toContain(
    "playBgm({ audio: { asset: null, volume: -0, pitch: 50, pan: -100 } })",
  );
});

it("rejects incomplete, extra, inherited and invalid BGM inputs before helper selection or encoding", () => {
  const audio = { asset: null, volume: 1, pitch: 51, pan: 1 };
  for (const invalid of [
    {},
    { audio: null },
    { audio: { ...audio, pitch: undefined } },
    { audio: { ...audio, volume: -1 } },
    { audio: { ...audio, volume: 101 } },
    { audio: { ...audio, pitch: 49 } },
    { audio: { ...audio, pitch: 151 } },
    { audio: { ...audio, pan: -101 } },
    { audio: { ...audio, pan: 101 } },
    { audio: { ...audio, volume: 0.5 } },
    { audio: { ...audio, pitch: NaN } },
    { audio: { ...audio, pan: Infinity } },
    { audio: { ...audio, extra: true } },
    { audio, extra: true },
    Object.create({ audio }),
    { audio: { ...audio, asset: dsl.audioAsset({ folder: "bgs", name: "Rain" }) } },
    { audio: { ...audio, asset: { kind: "asset", category: "audio", folder: "bgm", name: "" } } },
  ]) {
    expect(() => dsl.playBgm(invalid as never)).toThrow(/MV-E241/);
    expect(() => compile([{ kind: "playBgm", ...invalid } as never])).toThrow(/MV-E241/);
  }
  let reads = 0;
  const accessor = Object.defineProperty({}, "audio", {
    enumerable: true,
    get() {
      reads++;
      return audio;
    },
  });
  expect(() => dsl.playBgm(accessor as never)).toThrow(/MV-E241/);
  expect(reads).toBe(0);
  expect(compile([dsl.playBgm({ audio })])[0]).toStrictEqual({
    code: 241,
    indent: 0,
    parameters: [{ name: "", volume: 1, pitch: 51, pan: 1 }],
  });
});

it("rejects exact BGM native and known raw slot defects with field diagnostics", () => {
  const audio = { name: "", volume: 0, pitch: 50, pan: -100 };
  for (const [parameters, suffix] of [
    [[], ""],
    [[audio, 1], ""],
    [[null], "[0]"],
    [[{ ...audio, volume: 101 }], "[0].volume"],
    [[{ ...audio, pitch: 49 }], "[0].pitch"],
    [[{ ...audio, pan: -101 }], "[0].pan"],
    [[{ ...audio, name: null }], "[0].name"],
    [[{ name: "", volume: 1, pitch: 51 }], "[0].pan"],
    [[{ ...audio, extra: true }], "[0]"],
  ] as const) {
    const command = { code: 241, indent: 0, parameters: [...parameters] };
    expect(() => renderDecompiledCommandList([command, end])).toThrow(/MV-E241-PARAMETER/);
    try {
      renderDecompiledCommandList([command, end]);
      expect.fail("Expected native rejection");
    } catch (error) {
      expect(error).toMatchObject({ location: { nativePath: `list[0].parameters${suffix}` } });
    }
    expect(() => compile([dsl.rawDslCommand(command)])).toThrow(/MV-E241-PARAMETER/);
  }
});

it("applies complete AUDIO and matching asset categories to playback and all system audio settings", () => {
  const cases = [
    ["changeBattleBgm", 132, "bgm"],
    ["changeVictoryMe", 133, "me"],
    ["changeDefeatMe", 139, "me"],
    ["changeVehicleBgm", 140, "bgm"],
    ["playBgm", 241, "bgm"],
    ["playBgs", 245, "bgs"],
    ["playMe", 249, "me"],
    ["playSe", 250, "se"],
  ] as const;
  for (const [kind, code, folder] of cases) {
    const helper = dsl[kind] as (input: unknown) => DslCommand;
    for (const [asset, name, volume, pitch, pan] of [
      [null, "", 0, 50, -100],
      [dsl.audioAsset({ folder, name: "Track" }), "Track", 100, 150, 100],
      [null, "", 1, 51, 1],
      [null, "", -0, 100, -0],
    ] as const) {
      const extra = kind === "changeVehicleBgm" ? { vehicle: "airship" } : {};
      const node = helper({ ...extra, audio: { asset, volume, pitch, pan } });
      const audio = { name, volume, pitch, pan };
      const expected = { code, indent: 0, parameters: code === 140 ? [2, audio] : [audio] };
      expect(compile([node])).toStrictEqual([expected, end]);
      expect(compile([dsl.rawDslCommand(expected)])).toStrictEqual([expected, end]);
      expect(renderDecompiledCommandList([expected, end]).source).toContain(`${kind}(`);
      if (asset === null)
        expect(renderDecompiledCommandList([expected, end]).source).toContain("asset: null");
    }
    const extra = kind === "changeVehicleBgm" ? { vehicle: "boat" } : {};
    for (const invalid of [
      { ...extra, audio: { asset: null, volume: 0, pan: 0 } },
      { ...extra, audio: { asset: null, volume: 0, pitch: 50, pan: 101 } },
      {
        ...extra,
        audio: {
          asset: dsl.audioAsset({ folder: folder === "se" ? "bgm" : "se", name: "Wrong" }),
          volume: 0,
          pitch: 50,
          pan: 0,
        },
      },
      { ...extra, audio: { asset: null, volume: 0, pitch: 50, pan: 0 }, extra: true },
    ]) {
      expect(() => helper(invalid)).toThrow(new RegExp(`MV-E${code}`));
      expect(() => compile([{ kind, ...invalid } as never])).toThrow(new RegExp(`MV-E${code}`));
    }
    expect(() =>
      renderDecompiledCommandList([
        {
          code,
          indent: 0,
          parameters:
            code === 140
              ? [0, { name: "", volume: 101, pitch: 50, pan: 0 }]
              : [{ name: "", volume: 101, pitch: 50, pan: 0 }],
        },
        end,
      ]),
    ).toThrow(new RegExp(`MV-E${code}-PARAMETER`));
  }
});

it("keeps audio fade durations in seconds with one required positive saved slot and no wait", () => {
  for (const [kind, code] of [
    ["fadeoutBgm", 242],
    ["fadeoutBgs", 246],
  ] as const) {
    for (const duration of [1, 999]) {
      const expected = { code, indent: 0, parameters: [duration] };
      expect(compile([dsl[kind]({ duration })])).toStrictEqual([expected, end]);
      expect(compile([dsl.rawDslCommand(expected)])).toStrictEqual([expected, end]);
      expect(renderDecompiledCommandList([expected, end]).source).toContain(
        `${kind}({ duration: ${duration} })`,
      );
    }
    for (const input of [
      {},
      { duration: 1, wait: true },
      { frames: 60 },
      ...[0, -0, 1000, 1.5, Infinity, null, undefined].map((duration) => ({ duration })),
    ]) {
      expect(() => dsl[kind](input as never)).toThrow(new RegExp(`MV-E${code}`));
      expect(() => compile([{ kind, ...input } as never])).toThrow(new RegExp(`MV-E${code}`));
    }
    for (const parameters of [[], [0], [-0], [1000], [1.5], [1, false]]) {
      expect(() => renderDecompiledCommandList([{ code, indent: 0, parameters }, end])).toThrow(
        new RegExp(`MV-E${code}-PARAMETER`),
      );
      expect(() => compile([dsl.rawDslCommand({ code, parameters })])).toThrow(
        new RegExp(`MV-E${code}-PARAMETER`),
      );
    }
  }
});

it("uses parameterless Save BGM, Replay BGM and Stop SE with no alias or discarded arguments", () => {
  expect("resumeBgm" in dsl).toBe(false);
  for (const [kind, code] of [
    ["saveBgm", 243],
    ["replayBgm", 244],
    ["stopSe", 251],
  ] as const) {
    const helper = (dsl as unknown as Record<string, (...args: unknown[]) => DslCommand>)[kind]!;
    expect(helper).toBeTypeOf("function");
    const expected = { code, indent: 0, parameters: [] };
    expect(compile([helper()])).toStrictEqual([expected, end]);
    expect(renderDecompiledCommandList([expected, end]).source).toContain(`${kind}()`);
    for (const argument of [{}, undefined, null, 0])
      expect(() => helper(argument)).toThrow(new RegExp(`MV-E${code}`));
    expect(() => compile([{ kind, duration: 1 } as never])).toThrow(new RegExp(`MV-E${code}`));
    expect(() => renderDecompiledCommandList([{ code, indent: 0, parameters: [1] }, end])).toThrow(
      new RegExp(`MV-E${code}-PARAMETER`),
    );
    expect(() => compile([dsl.rawDslCommand({ code, parameters: [1] })])).toThrow(
      new RegExp(`MV-E${code}-PARAMETER`),
    );
  }
  expect(() => compile([{ kind: "resumeBgm" } as never])).toThrow(/MV-E244|MV-DSL/);
});

it("checks original Audio Asset fields before selecting folder and filename", () => {
  for (const input of [
    { folder: "bgm", name: "Track", extra: true },
    { folder: "bgm", name: "" },
    { folder: "movies", name: "Track" },
    { folder: "bgm" },
    { name: "Track" },
    Object.create({ folder: "bgm", name: "Track" }),
  ])
    expect(() => dsl.audioAsset(input as never)).toThrow(/MV-AUDIO-ASSET/);
  let reads = 0;
  const input = Object.defineProperty({ folder: "bgm" }, "name", {
    enumerable: true,
    get() {
      reads++;
      return "Track";
    },
  });
  expect(() => dsl.audioAsset(input as never)).toThrow(/MV-AUDIO-ASSET/);
  expect(reads).toBe(0);
  expect(dsl.audioAsset({ folder: "me", name: " \r\n " })).toStrictEqual({
    kind: "asset",
    category: "audio",
    folder: "me",
    name: " \r\n ",
  });
});

it("reports the exact known raw Audio field at its actual authored command position", () => {
  const raw = dsl.rawDslCommand({
    code: 250,
    parameters: [{ name: "", volume: 1, pitch: 51, pan: 101 }],
  });
  expect(() => compile([dsl.saveBgm(), raw])).toThrow(/commands\[1\]\.parameters\[0\]\.pan/);
});

it("preserves every vehicle category while refusing native categorical negative zero", () => {
  const audio = { asset: null, volume: 0, pitch: 50, pan: -100 };
  for (const [vehicle, index] of [
    ["boat", 0],
    ["ship", 1],
    ["airship", 2],
  ] as const) {
    const expected = {
      code: 140,
      indent: 0,
      parameters: [index, { name: "", volume: 0, pitch: 50, pan: -100 }],
    };
    expect(compile([dsl.changeVehicleBgm({ vehicle, audio })])).toStrictEqual([expected, end]);
    expect(renderDecompiledCommandList([expected, end]).source).toContain(`vehicle: "${vehicle}"`);
  }
  for (const vehicle of ["car", 3, -0, null, undefined])
    expect(() => dsl.changeVehicleBgm({ vehicle, audio } as never)).toThrow(/MV-E140/);
  for (const index of [-0, 3, -1, 0.5, "boat", null]) {
    const command = {
      code: 140,
      indent: 0,
      parameters: [index, { name: "", volume: 0, pitch: 50, pan: 0 }],
    };
    expect(() => renderDecompiledCommandList([command, end])).toThrow(/MV-E140-PARAMETER/);
    expect(() => compile([dsl.rawDslCommand(command)])).toThrow(/commands\[0\]\.parameters\[0\]/);
  }
});
