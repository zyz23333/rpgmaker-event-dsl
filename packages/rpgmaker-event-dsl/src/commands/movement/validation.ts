import { isDeepStrictEqual } from "node:util";
import type { MovementRoute, SetMovementRouteDslCommand } from "../../domain/types.js";
import type { RawEventCommand } from "../../compiler/types.js";
import type { NativeMovementRecord, NativeMovementRoute } from "./types.js";
import type { ReferenceResolver, ValidationIssue } from "../../validation/types.js";
import { CommandStructureError } from "../../validation/command-errors.js";

type Location = { nativePath?: string; dslPath?: string };

function fail(message: string, location: Location, code = "MV-MOVEMENT-SHAPE"): never {
  throw new CommandStructureError(code, message, location);
}

function record(value: unknown, location: Location): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    fail("Expected a Movement Route object.", location);
  return value as Record<string, unknown>;
}

function keys(value: Record<string, unknown>, allowed: readonly string[], location: Location) {
  if (Object.keys(value).some((key) => !allowed.includes(key)))
    fail("Unknown Movement Route field.", location);
}

function array(value: unknown, location: Location): unknown[] {
  if (!Array.isArray(value)) fail("Expected a dense array.", location);
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
          { nativePath: `list[${mirrorIndex}]` },
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
  routeWait: ["frames"],
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
  changeImage: ["image", "index"],
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
