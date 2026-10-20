import { isDeepStrictEqual } from "node:util";
import type { MovementRoute, SetMovementRouteDslCommand } from "../../domain/types.js";
import type { RawEventCommand } from "../../compiler/types.js";
import type { NativeMovementRecord, NativeMovementRoute } from "./types.js";
import type { ReferenceResolver, ValidationIssue } from "../../validation/types.js";
import { CommandStructureError } from "../../validation/command-errors.js";
import { describeValue, renderJsonValue } from "../../project-data/json-values.js";

type Location = Pick<
  ValidationIssue,
  "nativePath" | "dslPath" | "expected" | "actual" | "relatedLocations"
>;

function fail(message: string, location: Location, code = "MV-MOVEMENT-SHAPE"): never {
  throw new CommandStructureError(code, message, location);
}

function record(value: unknown, location: Location): Record<string, unknown> {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value))
  )
    fail("Expected a Movement Route object.", location);
  return value as Record<string, unknown>;
}

function keys(value: Record<string, unknown>, allowed: readonly string[], location: Location) {
  if (
    Reflect.ownKeys(value).some((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
      return (
        typeof key !== "string" ||
        !allowed.includes(key) ||
        !("value" in descriptor) ||
        !descriptor.enumerable
      );
    })
  )
    fail("Unknown Movement Route field.", location);
}

function array(value: unknown, location: Location): unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype)
    fail("Expected a dense ordinary array.", location);
  for (const key of Reflect.ownKeys(value))
    if (key !== "length") {
      const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
      if (
        typeof key !== "string" ||
        !/^(0|[1-9]\d*)$/u.test(key) ||
        Number(key) >= value.length ||
        !("value" in descriptor) ||
        !descriptor.enumerable
      )
        fail("Movement Route arrays require only ordinary data slots.", location);
    }
  if (Object.keys(value).length !== value.length || value.some((item) => item === undefined))
    fail("Movement Route arrays cannot contain undefined, sparse slots or extra keys.", location);
  for (let index = 0; index < value.length; index += 1)
    if (!Object.hasOwn(value, index))
      fail("Movement Route arrays cannot contain sparse slots.", location);
  return value;
}

const parameterCounts = new Map([
  [14, 2],
  [15, 1],
  [27, 1],
  [28, 1],
  [29, 1],
  [30, 1],
  [41, 2],
  [42, 1],
  [43, 1],
  [44, 1],
  [45, 1],
]);

function at(location: Location, suffix: string): Location {
  return {
    ...(location.nativePath === undefined ? {} : { nativePath: location.nativePath + suffix }),
    ...(location.dslPath === undefined ? {} : { dslPath: location.dslPath + suffix }),
  };
}

function integer(value: unknown, minimum: number, maximum: number, location: Location): void {
  if (!Number.isInteger(value) || (value as number) < minimum || (value as number) > maximum)
    fail(
      "Movement parameter is outside its accepted integer domain.",
      {
        ...location,
        expected: `integer ${minimum}..${maximum}`,
        actual: describeValue(value),
      },
      "MV-MOVEMENT-PARAMETER",
    );
}

function asset(
  value: unknown,
  category: "image" | "audio",
  folder: string,
  location: Location,
): void {
  if (value === null) return;
  const input = record(value, location);
  keys(input, ["kind", "category", "folder", "name"], location);
  if (
    input.kind !== "asset" ||
    input.category !== category ||
    input.folder !== folder ||
    typeof input.name !== "string" ||
    input.name.length === 0
  )
    fail(`Movement asset requires a nonempty ${category}/${folder} reference or null.`, location);
}

export function assertNativeMovementRecord(
  value: unknown,
  location: Location,
  terminal = false,
): asserts value is NativeMovementRecord {
  const item = record(value, location);
  keys(item, terminal ? ["code", "parameters"] : ["code", "parameters", "indent"], location);
  if (terminal) {
    if (
      item.code !== 0 ||
      Object.is(item.code, -0) ||
      (Object.hasOwn(item, "parameters") && array(item.parameters, location).length !== 0)
    )
      fail(
        "The sole final M0 must omit parameters or contain an empty array, and must omit indent.",
        location,
      );
    return;
  }
  if (!Number.isInteger(item.code) || (item.code as number) < 1 || (item.code as number) > 45)
    fail(
      "Unknown movement code; raw movement instructions are not supported.",
      location,
      "MV-MOVEMENT-CODE",
    );
  if (
    Object.hasOwn(item, "indent") &&
    item.indent !== null &&
    (item.indent !== 0 || Object.is(item.indent, -0))
  )
    fail("A nonterminal movement indent must be absent, null or numeric zero.", location);
  const count = parameterCounts.get(item.code as number);
  if (count === undefined) {
    if (Object.hasOwn(item, "parameters"))
      fail("A parameterless movement instruction must omit parameters.", location);
    return;
  }
  const parameters = array(item.parameters, location);
  if (parameters.length !== count)
    fail(`Movement code ${item.code} requires exactly ${count} parameters.`, location);
  if (item.code === 44) {
    const audio = record(parameters[0], location);
    keys(audio, ["name", "volume", "pitch", "pan"], location);
    if (
      typeof audio.name !== "string" ||
      ![audio.volume, audio.pitch, audio.pan].every(
        (value) => typeof value === "number" && Number.isFinite(value),
      )
    )
      fail("Movement SE requires its complete saved audio object.", location);
  } else if (item.code === 45) {
    if (typeof parameters[0] !== "string")
      fail("Movement Script requires one complete string.", location);
  } else if (item.code === 41) {
    if (
      typeof parameters[0] !== "string" ||
      typeof parameters[1] !== "number" ||
      !Number.isFinite(parameters[1])
    )
      fail("Movement image requires its name and index.", location);
  } else if (!parameters.every((value) => typeof value === "number" && Number.isFinite(value))) {
    fail("Movement numeric parameter slots require finite numbers.", location);
  }
  if (item.code === 14) {
    integer(parameters[0], -99, 99, at(location, ".parameters[0]"));
    integer(parameters[1], -99, 99, at(location, ".parameters[1]"));
  }
  if (item.code === 15) integer(parameters[0], 1, 999, at(location, ".parameters[0]"));
  if (item.code === 27 || item.code === 28)
    integer(parameters[0], 1, Number.MAX_SAFE_INTEGER, at(location, ".parameters[0]"));
  if (item.code === 29) integer(parameters[0], 1, 6, at(location, ".parameters[0]"));
  if (item.code === 30) integer(parameters[0], 1, 5, at(location, ".parameters[0]"));
  if (item.code === 41) integer(parameters[1], 0, 7, at(location, ".parameters[1]"));
  if (item.code === 42) integer(parameters[0], 0, 255, at(location, ".parameters[0]"));
  if (item.code === 43) {
    integer(parameters[0], 0, 3, at(location, ".parameters[0]"));
    if (Object.is(parameters[0], -0))
      fail(
        "Movement blend mode requires a code with an exact symbolic representation.",
        {
          ...at(location, ".parameters[0]"),
          expected: "0, 1, 2 or 3 excluding negative zero",
          actual: "-0",
        },
        "MV-MOVEMENT-PARAMETER",
      );
  }
  if (item.code === 44) {
    const audio = parameters[0] as Record<string, unknown>;
    integer(audio.volume, 0, 100, at(location, ".parameters[0].volume"));
    integer(audio.pitch, 50, 150, at(location, ".parameters[0].pitch"));
    integer(audio.pan, -100, 100, at(location, ".parameters[0].pan"));
  }
}

export function assertNativeMovementRoute(
  value: unknown,
  path: string,
): asserts value is NativeMovementRoute {
  const location = { nativePath: path };
  const route = record(value, location);
  keys(route, ["list", "repeat", "skippable", "wait"], location);
  for (const key of ["repeat", "skippable", "wait"])
    if (typeof route[key] !== "boolean")
      fail(`Movement Route ${key} must be an explicit boolean.`, { nativePath: `${path}.${key}` });
  const list = array(route.list, { nativePath: `${path}.list` });
  if (list.length === 0)
    fail("Movement Route requires a sole final M0.", { nativePath: `${path}.list` });
  for (let index = 0; index < list.length; index += 1)
    assertNativeMovementRecord(
      list[index],
      { nativePath: `${path}.list[${index}]` },
      index === list.length - 1,
    );
}

export function assertNativeMovementCommands(commands: readonly RawEventCommand[]): void {
  for (let index = 0; index < commands.length; index += 1) {
    const command = commands[index]!;
    if (command.code === 505)
      fail("Orphan Movement Route mirror.", { nativePath: `list[${index}]` }, "MV-MOVEMENT-MIRROR");
    if (command.code !== 205) continue;
    const path = `list[${index}].parameters`;
    array(command.parameters, { nativePath: path });
    if (
      command.parameters.length !== 2 ||
      !Number.isSafeInteger(command.parameters[0]) ||
      Object.is(command.parameters[0], -0) ||
      (command.parameters[0] as number) < -1
    )
      fail("Set Movement Route requires one Character Runtime Selector and one route.", {
        nativePath: path,
      });
    const route = command.parameters[1];
    assertNativeMovementRoute(route, `${path}[1]`);
    const nonterminals = route.list.slice(0, -1);
    for (let offset = 0; offset < nonterminals.length; offset += 1) {
      const mirrorIndex = index + offset + 1;
      const mirror = commands[mirrorIndex];
      if (
        mirror?.code !== 505 ||
        mirror.indent !== command.indent ||
        mirror.parameters.length !== 1 ||
        !isDeepStrictEqual(mirror.parameters[0], nonterminals[offset])
      )
        fail(
          "Every nonterminal movement record requires one ordered, same-indent 505 containing the complete identical object.",
          {
            nativePath: `list[${mirrorIndex}]`,
            expected: renderJsonValue({
              code: 505,
              indent: command.indent,
              parameters: [nonterminals[offset]],
            }),
            actual: mirror ? describeValue(mirror) : "missing",
            relatedLocations: [
              {
                nativePath: `list[${index}].parameters[1].list[${offset}]`,
                value: renderJsonValue(nonterminals[offset]),
              },
            ],
          },
          "MV-MOVEMENT-MIRROR",
        );
      array(mirror!.parameters, { nativePath: `list[${mirrorIndex}].parameters` });
    }
    index += nonterminals.length;
  }
}

export function assertNativeMovementCommandParameters(
  code: number,
  parameters: unknown,
  location: Location,
): void {
  const slots = array(parameters, location);
  if (slots.length !== (code === 205 ? 2 : 1))
    fail(
      "Set Movement Route requires two parameter slots; its mirror requires exactly one.",
      location,
    );
  if (code === 505) assertNativeMovementRecord(slots[0], location);
}

const instructionFields: Record<string, readonly string[]> = {
  moveDown: [],
  moveLeft: [],
  moveRight: [],
  moveUp: [],
  moveLowerLeft: [],
  moveLowerRight: [],
  moveUpperLeft: [],
  moveUpperRight: [],
  moveRandom: [],
  moveTowardPlayer: [],
  moveAwayFromPlayer: [],
  moveForward: [],
  moveBackward: [],
  jump: ["x", "y"],
  wait: ["frames"],
  turnDown: [],
  turnLeft: [],
  turnRight: [],
  turnUp: [],
  turn90Right: [],
  turn90Left: [],
  turn180: [],
  turn90RightOrLeft: [],
  turnRandom: [],
  turnTowardPlayer: [],
  turnAwayFromPlayer: [],
  switchOn: ["switch"],
  switchOff: ["switch"],
  changeSpeed: ["speed"],
  changeFrequency: ["frequency"],
  walkAnimation: ["enabled"],
  stepAnimation: ["enabled"],
  directionFix: ["enabled"],
  through: ["enabled"],
  transparent: ["enabled"],
  changeImage: ["character", "characterIndex"],
  changeOpacity: ["opacity"],
  changeBlendMode: ["blendMode"],
  playSe: ["audio"],
  script: ["script"],
};

export function assertMovementRoute(value: unknown, path: string): asserts value is MovementRoute {
  const route = record(value, { dslPath: path });
  keys(route, ["commands", "repeat", "skippable", "wait", "terminator"], { dslPath: path });
  for (const key of ["repeat", "skippable", "wait"])
    if (route[key] !== undefined && typeof route[key] !== "boolean")
      fail(`${key} must be a boolean.`, { dslPath: `${path}.${key}` });
  if (route.terminator !== undefined) {
    const terminal = record(route.terminator, { dslPath: `${path}.terminator` });
    keys(terminal, ["parameters"], { dslPath: `${path}.terminator` });
    if (
      terminal.parameters !== undefined &&
      terminal.parameters !== "absent" &&
      terminal.parameters !== "empty"
    )
      fail("M0 parameters must be absent or empty.", { dslPath: `${path}.terminator.parameters` });
  }
  const commands = array(route.commands, { dslPath: `${path}.commands` });
  for (const [index, value] of commands.entries()) {
    const location = { dslPath: `${path}.commands[${index}]` };
    const command = record(value, location);
    const fields =
      typeof command.kind === "string" && Object.hasOwn(instructionFields, command.kind)
        ? instructionFields[command.kind]
        : undefined;
    if (fields === undefined)
      fail("Unknown movement instruction; M0 and raw are not authored commands.", location);
    keys(command, ["kind", "savedShape", ...fields], location);
    if (fields.some((field) => command[field] === undefined))
      fail("Movement instruction is missing a required field.", location);
    const domains: Record<string, readonly (readonly [string, number, number])[]> = {
      jump: [
        ["x", -99, 99],
        ["y", -99, 99],
      ],
      wait: [["frames", 1, 999]],
      changeSpeed: [["speed", 1, 6]],
      changeFrequency: [["frequency", 1, 5]],
      changeImage: [["characterIndex", 0, 7]],
      changeOpacity: [["opacity", 0, 255]],
    };
    for (const [field, minimum, maximum] of domains[command.kind as string] ?? [])
      integer(command[field], minimum, maximum, at(location, `.${field}`));
    if (
      command.kind === "changeBlendMode" &&
      !["normal", "additive", "multiply", "screen"].includes(command.blendMode as string)
    )
      fail(
        "Movement blend mode requires an explicit symbol.",
        {
          ...at(location, ".blendMode"),
          expected: "normal/additive/multiply/screen",
          actual: describeValue(command.blendMode),
        },
        "MV-MOVEMENT-PARAMETER",
      );
    if (
      ["walkAnimation", "stepAnimation", "directionFix", "through", "transparent"].includes(
        command.kind as string,
      ) &&
      typeof command.enabled !== "boolean"
    )
      fail("Movement state flags require an explicit boolean.", at(location, ".enabled"));
    if (command.kind === "changeImage")
      asset(command.character, "image", "characters", at(location, ".character"));
    if (command.kind === "switchOn" || command.kind === "switchOff") {
      const referenceLocation = at(location, ".switch");
      const reference = record(command.switch, referenceLocation);
      const byId = Object.hasOwn(reference, "id");
      keys(reference, byId ? ["kind", "id"] : ["kind", "name"], referenceLocation);
      if (
        reference.kind !== "switch" ||
        (byId
          ? typeof reference.id !== "number"
          : typeof reference.name !== "string" || reference.name.length === 0)
      )
        fail(
          "Movement switch requires exactly one switch ID or name reference.",
          referenceLocation,
        );
    }
    if (command.kind === "playSe") {
      const audioLocation = at(location, ".audio");
      const audio = record(command.audio, audioLocation);
      keys(audio, ["asset", "volume", "pitch", "pan"], audioLocation);
      if (
        ["asset", "volume", "pitch", "pan"].some(
          (field) => !Object.hasOwn(audio, field) || audio[field] === undefined,
        )
      )
        fail("Movement SE requires asset, volume, pitch and pan.", audioLocation);
      asset(audio.asset, "audio", "se", at(audioLocation, ".asset"));
      integer(audio.volume, 0, 100, at(audioLocation, ".volume"));
      integer(audio.pitch, 50, 150, at(audioLocation, ".pitch"));
      integer(audio.pan, -100, 100, at(audioLocation, ".pan"));
    }
    if (command.kind === "script") {
      const scriptLocation = at(location, ".script");
      const script = record(command.script, scriptLocation);
      keys(script, ["kind", "code"], scriptLocation);
      if (script.kind !== "scriptInput" || typeof script.code !== "string")
        fail("Movement Script requires Script Input with its complete string.", scriptLocation);
    }
    if (command.savedShape !== undefined) {
      const shape = record(command.savedShape, location);
      keys(shape, ["indent"], location);
      if (
        shape.indent !== undefined &&
        !["absent", "null", "zero"].includes(shape.indent as string)
      )
        fail("savedShape.indent must be absent, null or zero symbols.", {
          dslPath: `${location.dslPath}.savedShape.indent`,
        });
    }
  }
}

export function assertSetMovementRoute(node: SetMovementRouteDslCommand, path: string): void {
  keys(node as unknown as Record<string, unknown>, ["kind", "target", "route"], { dslPath: path });
  assertMovementRoute(node.route, `${path}.route`);
}

export function validateNativeMovementRouteInputs(
  value: unknown,
  resolver: ReferenceResolver,
  options: { scriptEnabled: boolean; identity?: string; dslPath?: string; nativePath: string },
  issues: ValidationIssue[],
): void {
  assertNativeMovementRoute(value, options.nativePath);
  for (const [index, command] of value.list.entries()) {
    const nativePath = `${options.nativePath}.list[${index}]`;
    const issue = (code: string, message: string) =>
      issues.push({
        level: "error",
        code,
        stage: "compile",
        ...(options.identity === undefined ? {} : { identity: options.identity }),
        ...(options.dslPath === undefined ? {} : { dslPath: options.dslPath }),
        nativePath,
        message,
        expected: command.code === 45 ? "scriptEnabled: true" : "existing switch ID",
        actual:
          command.code === 45 ? "scriptEnabled: false" : describeValue(command.parameters?.[0]),
      });
    if (command.code === 45 && !options.scriptEnabled)
      issue("MV-MOVEMENT-SCRIPT", "Movement Route Script requires explicit config enablement.");
    if (command.code === 27 || command.code === 28) {
      try {
        resolver.resolveReference({ kind: "switch", id: command.parameters![0] as number });
      } catch (error) {
        issue("MV-MOVEMENT-REFERENCE", error instanceof Error ? error.message : String(error));
      }
    }
  }
}
