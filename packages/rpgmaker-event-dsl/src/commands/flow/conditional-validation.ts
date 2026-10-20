import type { ChildCommandBody, ConditionalDslCommand } from "../../domain/command.js";
import { CommandStructureError } from "../../validation/command-errors.js";
import { describeValue } from "../../project-data/json-values.js";
import type { ReferenceResolver } from "../../validation/types.js";

type At = { dslPath: string } | { nativePath: string };
const child = (at: At, suffix: string): At =>
  "dslPath" in at ? { dslPath: at.dslPath + suffix } : { nativePath: at.nativePath + suffix };

function fail(at: At, expected: string, actual: unknown, code = "MV-E111"): never {
  throw new CommandStructureError(code, "Invalid Conditional input.", {
    ...at,
    expected,
    actual: describeValue(actual),
  });
}

function object(value: unknown, at: At, allowed: readonly string[]): Record<string, unknown> {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value))
  )
    fail(at, "plain object with named Conditional fields", value);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
    if (
      typeof key !== "string" ||
      !allowed.includes(key) ||
      !("value" in descriptor) ||
      !descriptor.enumerable
    )
      fail(
        typeof key === "string" ? child(at, `.${key}`) : at,
        "supported enumerable data field",
        "unsupported field or descriptor",
      );
  }
  return value as Record<string, unknown>;
}

function array(value: unknown, at: At): unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype)
    fail(at, "dense ordinary command array", value, "MV-CHILD-BODY");
  for (const key of Reflect.ownKeys(value)) {
    if (key === "length") continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
    if (
      typeof key !== "string" ||
      !/^(0|[1-9]\d*)$/u.test(key) ||
      Number(key) >= value.length ||
      !("value" in descriptor) ||
      !descriptor.enumerable
    )
      fail(
        at,
        "ordinary array data slots only",
        "unsupported array field or descriptor",
        "MV-CHILD-BODY",
      );
  }
  for (let index = 0; index < value.length; index++)
    if (!Object.hasOwn(value, index) || value[index] === undefined)
      fail(child(at, `[${index}]`), "defined command data slot", undefined, "MV-CHILD-BODY");
  return value;
}

function oneOf(value: unknown, values: readonly unknown[], at: At): void {
  if (!values.includes(value) || Object.is(value, -0))
    fail(at, `one of ${describeValue(values)}`, value);
}

function integer(value: unknown, minimum: number, maximum: number, at: At): void {
  if (!Number.isSafeInteger(value) || (value as number) < minimum || (value as number) > maximum)
    fail(at, `safe integer ${minimum}..${maximum}`, value);
}

function string(value: unknown, at: At): void {
  if (typeof value !== "string") fail(at, "complete string", value);
}

function boolean(value: unknown, at: At): void {
  if (typeof value !== "boolean") fail(at, "explicit boolean", value);
}

function reference(value: unknown, kind: string, at: At): void {
  const ref = object(value, at, ["kind", "id", "name"]);
  if (ref.kind !== kind || Object.hasOwn(ref, "id") === Object.hasOwn(ref, "name"))
    fail(at, `${kind} reference with exactly one positive id or string name`, value);
  if (Object.hasOwn(ref, "id")) integer(ref.id, 1, Number.MAX_SAFE_INTEGER, child(at, ".id"));
  else string(ref.name, child(at, ".name"));
}

const buttons = ["ok", "cancel", "shift", "down", "left", "right", "up", "pageup", "pagedown"];
const actorChecks = ["inParty", "name", "class", "skill", "weapon", "armor", "state"];

function condition(value: unknown, at: At): void {
  // Check every descriptor before dispatch reads the discriminator.
  const input = object(value, at, [
    "kind",
    "switch",
    "variable",
    "value",
    "operator",
    "selfSwitch",
    "seconds",
    "actor",
    "check",
    "enemy",
    "target",
    "direction",
    "amount",
    "item",
    "weapon",
    "armor",
    "includeEquipment",
    "button",
    "script",
    "vehicle",
  ]);
  const fields: Record<string, readonly string[]> = {
    switch: ["switch", "value"],
    variable: ["variable", "operator", "value"],
    selfSwitch: ["selfSwitch", "value"],
    timer: ["seconds", "operator"],
    actor: ["actor", "check"],
    enemy: ["enemy", "check"],
    character: ["target", "direction"],
    gold: ["amount", "operator"],
    item: ["item"],
    weapon: ["weapon", "includeEquipment"],
    armor: ["armor", "includeEquipment"],
    button: ["button"],
    script: ["script"],
    vehicle: ["vehicle"],
  };
  if (typeof input.kind !== "string" || !Object.hasOwn(fields, input.kind))
    fail(child(at, ".kind"), "one of the 14 Conditional modes", input.kind);
  object(input, at, ["kind", ...fields[input.kind]!]);
  const field = (name: string) => child(at, `.${name}`);
  switch (input.kind) {
    case "switch":
      reference(input.switch, "switch", field("switch"));
      boolean(input.value, field("value"));
      break;
    case "variable": {
      reference(input.variable, "variable", field("variable"));
      oneOf(input.operator, ["eq", "ge", "le", "gt", "lt", "ne"], field("operator"));
      const operand = object(input.value, field("value"), ["kind", "value", "variable"]);
      oneOf(operand.kind, ["constant", "variable"], child(field("value"), ".kind"));
      object(
        operand,
        field("value"),
        operand.kind === "constant" ? ["kind", "value"] : ["kind", "variable"],
      );
      if (operand.kind === "constant")
        integer(operand.value, -99999999, 99999999, child(field("value"), ".value"));
      else reference(operand.variable, "variable", child(field("value"), ".variable"));
      break;
    }
    case "selfSwitch":
      oneOf(input.selfSwitch, ["A", "B", "C", "D"], field("selfSwitch"));
      boolean(input.value, field("value"));
      break;
    case "timer":
      integer(input.seconds, 0, 5999, field("seconds"));
      oneOf(input.operator, ["ge", "le"], field("operator"));
      break;
    case "actor": {
      reference(input.actor, "actor", field("actor"));
      const checkAt = field("check");
      const check = object(input.check, checkAt, [
        "kind",
        "name",
        "class",
        "skill",
        "weapon",
        "armor",
        "state",
      ]);
      oneOf(check.kind, actorChecks, child(checkAt, ".kind"));
      const kind = check.kind as string;
      object(check, checkAt, kind === "inParty" ? ["kind"] : ["kind", kind]);
      if (kind === "name") string(check.name, child(checkAt, ".name"));
      else if (kind !== "inParty") reference(check[kind], kind, child(checkAt, `.${kind}`));
      break;
    }
    case "enemy": {
      const enemyAt = field("enemy");
      const enemy = object(input.enemy, enemyAt, ["kind", "scope", "target", "index"]);
      oneOf(enemy.kind, ["runtimeSelector"], child(enemyAt, ".kind"));
      oneOf(enemy.scope, ["enemy"], child(enemyAt, ".scope"));
      oneOf(enemy.target, ["enemy"], child(enemyAt, ".target"));
      integer(enemy.index, 0, 7, child(enemyAt, ".index"));
      const checkAt = field("check");
      const check = object(input.check, checkAt, ["kind", "state"]);
      oneOf(check.kind, ["appeared", "state"], child(checkAt, ".kind"));
      object(check, checkAt, check.kind === "appeared" ? ["kind"] : ["kind", "state"]);
      if (check.kind === "state") reference(check.state, "state", child(checkAt, ".state"));
      break;
    }
    case "character": {
      const targetAt = field("target");
      const target = object(input.target, targetAt, ["kind", "scope", "target", "id"]);
      oneOf(target.kind, ["runtimeSelector"], child(targetAt, ".kind"));
      oneOf(target.scope, ["character"], child(targetAt, ".scope"));
      oneOf(target.target, ["player", "currentEvent", "event"], child(targetAt, ".target"));
      object(
        target,
        targetAt,
        target.target === "event" ? ["kind", "scope", "target", "id"] : ["kind", "scope", "target"],
      );
      if (target.target === "event")
        integer(target.id, 1, Number.MAX_SAFE_INTEGER, child(targetAt, ".id"));
      oneOf(input.direction, [2, 4, 6, 8], field("direction"));
      break;
    }
    case "gold":
      integer(input.amount, 0, 9999999, field("amount"));
      oneOf(input.operator, ["ge", "le", "lt"], field("operator"));
      break;
    case "item":
      reference(input.item, "item", field("item"));
      break;
    case "weapon":
    case "armor":
      reference(input[input.kind], input.kind, field(input.kind));
      boolean(input.includeEquipment, field("includeEquipment"));
      break;
    case "button":
      oneOf(input.button, buttons, field("button"));
      break;
    case "script": {
      const script = object(input.script, field("script"), ["kind", "code"]);
      oneOf(script.kind, ["scriptInput"], child(field("script"), ".kind"));
      string(script.code, child(field("script"), ".code"));
      break;
    }
    case "vehicle":
      oneOf(input.vehicle, ["boat", "ship", "airship"], field("vehicle"));
      break;
  }
}

function body(value: unknown, at: At): void {
  const input = object(value, at, ["commands", "endMarker"]);
  const commands = array(input.commands, child(at, ".commands"));
  for (const [index, command] of commands.entries()) {
    const commandAt = child(at, `.commands[${index}]`);
    if (
      typeof command !== "object" ||
      command === null ||
      Array.isArray(command) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(command))
    )
      fail(commandAt, "DSL Command object", command, "MV-CHILD-BODY");
    object(command, commandAt, Object.getOwnPropertyNames(command));
    const descriptor = Object.getOwnPropertyDescriptor(command, "kind");
    if (
      !descriptor ||
      !("value" in descriptor) ||
      !descriptor.enumerable ||
      typeof descriptor.value !== "string"
    )
      fail(commandAt, "DSL Command with data kind", "invalid command kind", "MV-CHILD-BODY");
  }
  if (input.endMarker !== undefined)
    oneOf(input.endMarker, ["present", "absent"], child(at, ".endMarker"));
  if (commands.length === 0 && input.endMarker === "absent")
    fail(
      child(at, ".endMarker"),
      "present Body End Marker for an empty body",
      input.endMarker,
      "MV-CHILD-BODY",
    );
}

export function assertConditionalCommand(
  value: unknown,
  path = "conditional",
  withKind = true,
): asserts value is ConditionalDslCommand {
  const at = { dslPath: path };
  const input = object(
    value,
    at,
    withKind ? ["kind", "condition", "then", "else"] : ["condition", "then", "else"],
  );
  if (withKind) oneOf(input.kind, ["conditional"], child(at, ".kind"));
  condition(input.condition, child(at, ".condition"));
  body(input.then, child(at, ".then"));
  if (input.else !== undefined) body(input.else, child(at, ".else"));
}

export function inspectConditionalReferences(
  node: ConditionalDslCommand,
  path: string,
  resolver: ReferenceResolver,
): CommandStructureError[] {
  const input = node.condition;
  const errors: CommandStructureError[] = [];
  const resolve = (value: Parameters<ReferenceResolver["resolveReference"]>[0], field: string) => {
    try {
      resolver.resolveReference(value);
    } catch (error) {
      errors.push(
        new CommandStructureError(
          "MV-E111-REFERENCE",
          error instanceof Error ? error.message : String(error),
          {
            dslPath: `${path}.condition.${field}`,
            expected: `uniquely resolved ${value.kind} reference`,
            actual: describeValue(value),
          },
        ),
      );
    }
  };
  switch (input.kind) {
    case "switch":
      resolve(input.switch, "switch");
      break;
    case "variable":
      resolve(input.variable, "variable");
      if (input.value.kind === "variable") resolve(input.value.variable, "value.variable");
      break;
    case "actor":
      resolve(input.actor, "actor");
      switch (input.check.kind) {
        case "class":
          resolve(input.check.class, "check.class");
          break;
        case "skill":
          resolve(input.check.skill, "check.skill");
          break;
        case "weapon":
          resolve(input.check.weapon, "check.weapon");
          break;
        case "armor":
          resolve(input.check.armor, "check.armor");
          break;
        case "state":
          resolve(input.check.state, "check.state");
          break;
      }
      break;
    case "enemy":
      if (input.check.kind === "state") resolve(input.check.state, "check.state");
      break;
    case "item":
      resolve(input.item, "item");
      break;
    case "weapon":
      resolve(input.weapon, "weapon");
      break;
    case "armor":
      resolve(input.armor, "armor");
      break;
  }
  return errors;
}

export function assertConditionalReferences(
  node: ConditionalDslCommand,
  path: string,
  resolver: ReferenceResolver,
): void {
  const error = inspectConditionalReferences(node, path, resolver)[0];
  if (error) throw error;
}

// The declared marker describes the complete emitted body, including any raw records.
// Only this body's indentation matters; nested structures retain their own markers.
export function assertConditionalBodyOutput(
  records: readonly { code: number; indent: number }[],
  input: ChildCommandBody,
  indent: number,
  path: string,
): void {
  if (records.some((record) => record.code === 0 && record.indent === indent))
    fail(
      { dslPath: `${path}.endMarker` },
      `raw output without an owned marker; declared ${input.endMarker ?? "present"}`,
      "raw owned Body End Marker",
      "MV-BODY-MARKER-CONFLICT",
    );
  if (records.length === 0 && input.endMarker === "absent")
    fail(
      { dslPath: `${path}.endMarker` },
      "present Body End Marker for empty emitted body",
      "absent",
      "MV-CHILD-BODY",
    );
}

export function assertNativeConditionalParameters(
  parameters: readonly unknown[],
  path: string,
): void {
  const at = { nativePath: `${path}.parameters` };
  const p = (index: number) => child(at, `[${index}]`);
  oneOf(
    parameters[0],
    Array.from({ length: 14 }, (_, index) => index),
    p(0),
  );
  const mode = parameters[0] as number;
  if (mode === 4) oneOf(parameters[2], [0, 1, 2, 3, 4, 5, 6], p(2));
  if (mode === 5) oneOf(parameters[2], [0, 1], p(2));
  const count = [
    3,
    5,
    3,
    3,
    parameters[2] === 0 ? 3 : 4,
    parameters[2] === 0 ? 3 : 4,
    3,
    3,
    2,
    3,
    3,
    2,
    2,
    2,
  ][mode]!;
  if (parameters.length !== count)
    fail(at, `exactly ${count} saved slots for Conditional mode ${mode}`, parameters);
  const ref = (slot: number) => integer(parameters[slot], 1, Number.MAX_SAFE_INTEGER, p(slot));
  switch (mode) {
    case 0:
      ref(1);
      oneOf(parameters[2], [0, 1], p(2));
      break;
    case 1:
      ref(1);
      oneOf(parameters[2], [0, 1], p(2));
      if (parameters[2] === 0) integer(parameters[3], -99999999, 99999999, p(3));
      else ref(3);
      oneOf(parameters[4], [0, 1, 2, 3, 4, 5], p(4));
      break;
    case 2:
      oneOf(parameters[1], ["A", "B", "C", "D"], p(1));
      oneOf(parameters[2], [0, 1], p(2));
      break;
    case 3:
      integer(parameters[1], 0, 5999, p(1));
      oneOf(parameters[2], [0, 1], p(2));
      break;
    case 4:
      ref(1);
      if (parameters[2] === 1) string(parameters[3], p(3));
      else if (parameters[2] !== 0) ref(3);
      break;
    case 5:
      integer(parameters[1], 0, 7, p(1));
      if (parameters[2] === 1) ref(3);
      break;
    case 6:
      integer(parameters[1], -1, Number.MAX_SAFE_INTEGER, p(1));
      if (Object.is(parameters[1], -0))
        fail(
          p(1),
          "player -1, currentEvent 0, or positive event id, excluding negative zero",
          parameters[1],
        );
      oneOf(parameters[2], [2, 4, 6, 8], p(2));
      break;
    case 7:
      integer(parameters[1], 0, 9999999, p(1));
      oneOf(parameters[2], [0, 1, 2], p(2));
      break;
    case 8:
      ref(1);
      break;
    case 9:
    case 10:
      ref(1);
      boolean(parameters[2], p(2));
      break;
    case 11:
      oneOf(parameters[1], buttons, p(1));
      break;
    case 12:
      string(parameters[1], p(1));
      break;
    case 13:
      oneOf(parameters[1], [0, 1, 2], p(1));
      break;
  }
}
