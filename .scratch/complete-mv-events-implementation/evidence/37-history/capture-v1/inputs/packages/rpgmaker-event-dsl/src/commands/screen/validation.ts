import { CommandStructureError } from "../../validation/command-errors.js";
import { describeValue } from "../../project-data/json-values.js";
import type { ValidationIssue } from "../../validation/types.js";

const screenCodes = {
  fadeoutScreen: 221,
  fadeinScreen: 222,
  tintScreen: 223,
  flashScreen: 224,
  shakeScreen: 225,
  wait: 230,
  setWeatherEffect: 236,
  playMovie: 261,
} as const;
export type ScreenCommandKind = keyof typeof screenCodes;

export function assertMovieAssetInput(input: unknown): asserts input is { name: string } {
  const fail = (): never => {
    throw new CommandStructureError("MV-E261", "Invalid Movie Asset input.", {
      dslPath: "movieAsset",
      expected: "plain input with only an own nonempty filename stem name",
      actual: describeValue(input),
    });
  };
  if (
    typeof input !== "object" ||
    input === null ||
    Array.isArray(input) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(input))
  )
    fail();
  const keys = Reflect.ownKeys(input as object);
  if (keys.length !== 1 || keys[0] !== "name") fail();
  const descriptor = Object.getOwnPropertyDescriptor(input, "name");
  if (
    !descriptor ||
    !("value" in descriptor) ||
    !descriptor.enumerable ||
    typeof descriptor.value !== "string" ||
    descriptor.value.length === 0
  )
    fail();
}

export function inspectNativeScreenContext(
  code: number,
  options: {
    identity: string;
    stage: "compile" | "decompile";
    nativePath: string;
    dslPath?: string;
  },
): ValidationIssue[] {
  if (code !== 236 || !options.identity.startsWith("troop:")) return [];
  return [
    {
      code: "MV-E236-BATTLE",
      level: "warning",
      ...options,
      expected: "Weather executes outside battle",
      actual: "Battle Event Page",
      message: `${options.stage} warning ${options.identity}: MV-E236-BATTLE at ${options.nativePath}: battle execution skips both the weather effect and its wait. Saved parameters are retained.`,
    },
  ];
}

export function assertNoScreenArguments(
  kind: "fadeoutScreen" | "fadeinScreen",
  count: number,
): void {
  if (count !== 0)
    throw new CommandStructureError(
      `MV-E${screenCodes[kind]}`,
      "Fade screen operation accepts no arguments.",
      { dslPath: kind, expected: "no arguments", actual: String(count) },
    );
}

export function assertNativeScreenParameters(
  code: number,
  parameters: readonly unknown[],
  path: string,
): void {
  if (![223, 224, 225, 230, 236].includes(code)) return;
  const fail = (suffix: string, expected: string, actual: unknown): never => {
    throw new CommandStructureError(`MV-E${code}-PARAMETER`, "Invalid saved screen parameter.", {
      nativePath: `${path}.parameters${suffix}`,
      expected,
      actual: describeValue(actual),
    });
  };
  const integer = (value: unknown, min: number, max: number, suffix: string) => {
    if (!Number.isInteger(value) || (value as number) < min || (value as number) > max)
      fail(suffix, `integer ${min}..${max}`, value);
  };
  if (code === 223 || code === 224) {
    const components = parameters[0] as readonly unknown[];
    if (components.length !== 4) fail("[0]", "exactly four saved components", components);
    for (let i = 0; i < 4; i++)
      integer(components[i], code === 223 && i < 3 ? -255 : 0, 255, `[0][${i}]`);
    integer(parameters[1], 1, 999, "[1]");
  }
  if (code === 225) {
    integer(parameters[0], 1, 9, "[0]");
    integer(parameters[1], 1, 9, "[1]");
    integer(parameters[2], 1, 999, "[2]");
  }
  if (code === 230) integer(parameters[0], 1, 999, "[0]");
  if (code === 236) {
    if (!["none", "rain", "storm", "snow"].includes(parameters[0] as string))
      fail("[0]", "none, rain, storm or snow", parameters[0]);
    integer(parameters[1], 1, 9, "[1]");
    integer(parameters[2], 1, 999, "[2]");
  }
}

export function assertScreenInput(
  kind: ScreenCommandKind,
  value: unknown,
  path: string = kind,
  withKind = true,
): void {
  const fail = (at: string, expected: string, actual: unknown): never => {
    throw new CommandStructureError(`MV-E${screenCodes[kind]}`, "Invalid screen command input.", {
      dslPath: at,
      expected,
      actual: describeValue(actual),
    });
  };
  const record = (
    input: unknown,
    fields: readonly string[],
    at: string,
  ): Record<string, unknown> => {
    if (
      typeof input !== "object" ||
      input === null ||
      Array.isArray(input) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(input))
    )
      fail(at, "plain named input object", input);
    for (const key of Reflect.ownKeys(input as object)) {
      const descriptor = Object.getOwnPropertyDescriptor(input, key)!;
      if (
        typeof key !== "string" ||
        !fields.includes(key) ||
        !("value" in descriptor) ||
        !descriptor.enumerable
      )
        fail(at, `only ${fields.join(", ")} own data fields`, String(key));
    }
    return input as Record<string, unknown>;
  };
  const integer = (input: unknown, min: number, max: number, at: string) => {
    if (!Number.isInteger(input) || (input as number) < min || (input as number) > max)
      fail(at, `integer ${min}..${max}`, input);
  };
  const field = kind === "tintScreen" ? "tone" : "color";
  const fields = {
    fadeoutScreen: [],
    fadeinScreen: [],
    wait: ["frames"],
    tintScreen: ["tone", "duration", "wait"],
    flashScreen: ["color", "duration", "wait"],
    shakeScreen: ["power", "speed", "duration", "wait"],
    setWeatherEffect: ["weather", "power", "duration", "wait"],
    playMovie: ["movie"],
  }[kind];
  const node = record(value, [...(withKind ? ["kind"] : []), ...fields], path);
  if (withKind && node.kind !== kind) fail(`${path}.kind`, kind, node.kind);
  if (kind === "fadeoutScreen" || kind === "fadeinScreen") return;
  if (kind === "playMovie") {
    if (!Object.hasOwn(node, "movie"))
      fail(`${path}.movie`, "explicit movies Asset Reference or null", undefined);
    if (node.movie === null) return;
    const movie = record(node.movie, ["kind", "category", "folder", "name"], `${path}.movie`);
    if (
      movie.kind !== "asset" ||
      movie.category !== "movie" ||
      movie.folder !== "movies" ||
      typeof movie.name !== "string" ||
      movie.name.length === 0
    )
      fail(
        `${path}.movie`,
        "movies Asset Reference with a nonempty filename stem, or null",
        node.movie,
      );
  } else if (kind === "wait") integer(node.frames, 1, 999, `${path}.frames`);
  else {
    if (kind === "setWeatherEffect") {
      if (!["none", "rain", "storm", "snow"].includes(node.weather as string))
        fail(`${path}.weather`, "none, rain, storm or snow", node.weather);
      integer(node.power, 1, 9, `${path}.power`);
    } else if (kind === "shakeScreen") {
      integer(node.power, 1, 9, `${path}.power`);
      integer(node.speed, 1, 9, `${path}.speed`);
    } else {
      const components = ["red", "green", "blue", kind === "tintScreen" ? "gray" : "alpha"];
      const color = record(node[field], components, `${path}.${field}`);
      for (const component of components)
        integer(
          color[component],
          kind === "tintScreen" && component !== "gray" ? -255 : 0,
          255,
          `${path}.${field}.${component}`,
        );
    }
    integer(node.duration, 1, 999, `${path}.duration`);
    if (typeof node.wait !== "boolean") fail(`${path}.wait`, "boolean", node.wait);
  }
}
