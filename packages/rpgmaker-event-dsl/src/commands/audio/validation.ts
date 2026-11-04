import { CommandStructureError } from "../../validation/command-errors.js";
import { describeValue } from "../../project-data/json-values.js";

type Fail = (path: string, expected: string, actual: unknown) => never;

export function assertAudioAssetInput(input: unknown): void {
  const fail: Fail = (at, expected, actual) => {
    throw new CommandStructureError("MV-AUDIO-ASSET", "Invalid Audio Asset input.", {
      dslPath: at,
      expected,
      actual: describeValue(actual),
    });
  };
  const asset = record(input, ["folder", "name"], "audioAsset", fail);
  if (!["bgm", "bgs", "me", "se"].includes(asset.folder as string))
    fail("audioAsset.folder", "bgm, bgs, me or se", asset.folder);
  if (typeof asset.name !== "string" || asset.name.length === 0)
    fail("audioAsset.name", "nonempty filename stem", asset.name);
}
const audioKinds = {
  changeBattleBgm: { code: 132, folder: "bgm" },
  changeVictoryMe: { code: 133, folder: "me" },
  changeDefeatMe: { code: 139, folder: "me" },
  changeVehicleBgm: { code: 140, folder: "bgm" },
  playBgm: { code: 241, folder: "bgm" },
  playBgs: { code: 245, folder: "bgs" },
  playMe: { code: 249, folder: "me" },
  playSe: { code: 250, folder: "se" },
} as const;
const fadeKinds = { fadeoutBgm: 242, fadeoutBgs: 246 } as const;
const parameterlessKinds = { saveBgm: 243, replayBgm: 244, stopSe: 251 } as const;

export function assertNoAudioArguments(kind: keyof typeof parameterlessKinds, count: number): void {
  if (count !== 0)
    throw new CommandStructureError(
      `MV-E${parameterlessKinds[kind]}`,
      "Audio operation accepts no arguments.",
      {
        dslPath: kind,
        expected: "no arguments",
        actual: String(count),
      },
    );
}

function record(
  input: unknown,
  fields: readonly string[],
  path: string,
  fail: Fail,
): Record<string, unknown> {
  if (
    typeof input !== "object" ||
    input === null ||
    Array.isArray(input) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(input))
  )
    fail(path, "plain named input object", input);
  for (const key of Reflect.ownKeys(input as object)) {
    const descriptor = Object.getOwnPropertyDescriptor(input, key)!;
    if (
      typeof key !== "string" ||
      !fields.includes(key) ||
      !("value" in descriptor) ||
      !descriptor.enumerable
    )
      fail(path, `only ${fields.join(", ")} own data fields`, String(key));
  }
  for (const key of fields)
    if (!Object.hasOwn(input as object, key))
      fail(`${path}.${key}`, "required own data field", undefined);
  return input as Record<string, unknown>;
}

function audioNumbers(audio: Record<string, unknown>, path: string, fail: Fail) {
  for (const [key, min, max] of [
    ["volume", 0, 100],
    ["pitch", 50, 150],
    ["pan", -100, 100],
  ] as const)
    if (
      !Number.isInteger(audio[key]) ||
      (audio[key] as number) < min ||
      (audio[key] as number) > max
    )
      fail(`${path}.${key}`, `integer ${min}..${max}`, audio[key]);
}

export function assertNativeAudioParameters(
  code: number,
  parameters: readonly unknown[],
  path: string,
): void {
  if (![132, 133, 139, 140, 241, 242, 243, 244, 245, 246, 249, 250, 251].includes(code)) return;
  const fail: Fail = (at, expected, actual) => {
    throw new CommandStructureError(`MV-E${code}-PARAMETER`, "Invalid saved audio parameter.", {
      nativePath: at,
      expected,
      actual: describeValue(actual),
    });
  };
  if ([243, 244, 251].includes(code)) {
    if (parameters.length !== 0) fail(`${path}.parameters`, "no saved parameter slots", parameters);
    return;
  }
  if (code === 242 || code === 246) {
    if (parameters.length !== 1)
      fail(`${path}.parameters`, "exactly one saved duration slot", parameters);
    if (
      !Number.isInteger(parameters[0]) ||
      (parameters[0] as number) < 1 ||
      (parameters[0] as number) > 999
    )
      fail(`${path}.parameters[0]`, "duration integer 1..999 seconds", parameters[0]);
    return;
  }
  const index = code === 140 ? 1 : 0;
  if (parameters.length !== index + 1)
    fail(`${path}.parameters`, `exactly ${index + 1} saved slots`, parameters);
  if (
    code === 140 &&
    (![0, 1, 2].includes(parameters[0] as number) || Object.is(parameters[0], -0))
  )
    fail(`${path}.parameters[0]`, "vehicle enum 0, 1 or 2, excluding negative zero", parameters[0]);
  const at = `${path}.parameters[${index}]`;
  const audio = record(parameters[index], ["name", "volume", "pitch", "pan"], at, fail);
  if (typeof audio.name !== "string")
    fail(`${at}.name`, "saved filename string, including empty None", audio.name);
  audioNumbers(audio, at, fail);
}

export function assertAudioCommandInput(
  kind: string,
  input: unknown,
  path = kind,
  withKind = true,
): void {
  if (kind === "resumeBgm")
    throw new CommandStructureError("MV-E244", "Unsupported audio command kind.", {
      dslPath: path,
      expected: "replayBgm",
      actual: kind,
    });
  if (Object.hasOwn(parameterlessKinds, kind)) {
    const code = parameterlessKinds[kind as keyof typeof parameterlessKinds];
    const fail: Fail = (at, expected, actual) => {
      throw new CommandStructureError(`MV-E${code}`, "Invalid parameterless audio input.", {
        dslPath: at,
        expected,
        actual: describeValue(actual),
      });
    };
    record(input, withKind ? ["kind"] : [], path, fail);
    return;
  }
  if (Object.hasOwn(fadeKinds, kind)) {
    const code = fadeKinds[kind as keyof typeof fadeKinds];
    const fail: Fail = (at, expected, actual) => {
      throw new CommandStructureError(`MV-E${code}`, "Invalid audio fade input.", {
        dslPath: at,
        expected,
        actual: describeValue(actual),
      });
    };
    const node = record(input, [...(withKind ? ["kind"] : []), "duration"], path, fail);
    if (
      !Number.isInteger(node.duration) ||
      (node.duration as number) < 1 ||
      (node.duration as number) > 999
    )
      fail(`${path}.duration`, "duration integer 1..999 seconds", node.duration);
    return;
  }
  if (!Object.hasOwn(audioKinds, kind)) return;
  const { code, folder } = audioKinds[kind as keyof typeof audioKinds];
  const fail: Fail = (at, expected, actual) => {
    throw new CommandStructureError(`MV-E${code}`, "Invalid audio command input.", {
      dslPath: at,
      expected,
      actual: describeValue(actual),
    });
  };
  const node = record(
    input,
    [...(withKind ? ["kind"] : []), ...(kind === "changeVehicleBgm" ? ["vehicle"] : []), "audio"],
    path,
    fail,
  );
  if (kind === "changeVehicleBgm" && !["boat", "ship", "airship"].includes(node.vehicle as string))
    fail(`${path}.vehicle`, "boat, ship or airship", node.vehicle);
  const audio = record(node.audio, ["asset", "volume", "pitch", "pan"], `${path}.audio`, fail);
  audioNumbers(audio, `${path}.audio`, fail);
  if (audio.asset !== null) {
    const asset = record(
      audio.asset,
      ["kind", "category", "folder", "name"],
      `${path}.audio.asset`,
      fail,
    );
    if (
      asset.kind !== "asset" ||
      asset.category !== "audio" ||
      asset.folder !== folder ||
      typeof asset.name !== "string" ||
      asset.name.length === 0
    )
      fail(
        `${path}.audio.asset`,
        `${folder} Audio Asset Reference with nonempty name, or null`,
        audio.asset,
      );
  }
}
