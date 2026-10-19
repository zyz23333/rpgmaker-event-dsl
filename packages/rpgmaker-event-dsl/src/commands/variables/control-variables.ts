import type { ControlVariablesDslCommand, ReferenceKind } from "../../domain/types.js";
import type { ReferenceResolver } from "../../validation/types.js";
import { assertDslObject } from "../../validation/dsl-command-inputs.js";
import { CommandStructureError } from "../../validation/command-errors.js";
import { describeValue } from "../../project-data/json-values.js";

const operations = ["set", "add", "sub", "mul", "div", "mod"];
const actorValues = ["level", "exp", "hp", "mp", "mhp", "mmp", "atk", "def", "mat", "mdf", "agi", "luk"];
const enemyValues = ["hp", "mp", "mhp", "mmp", "atk", "def", "mat", "mdf", "agi", "luk"];
const characterValues = ["mapX", "mapY", "direction", "screenX", "screenY"];
const otherValues = ["mapId", "partyMembers", "gold", "steps", "playTime", "timer", "saveCount", "battleCount", "winCount", "escapeCount"];

/** Validate authored saved inputs before a helper or encoder can discard information. */
export function assertControlVariablesInput(
  input: unknown,
  path = "controlVariables",
  withKind = false,
  resolver?: ReferenceResolver,
): asserts input is Omit<ControlVariablesDslCommand, "kind"> {
  const fail = (field: string, expected: string, actual: unknown): never => {
    throw new CommandStructureError("MV-E122-INPUT", "Invalid Control Variables saved input.", {
      dslPath: field, expected, actual: describeValue(actual),
    });
  };
  const integer = (value: unknown, at: string, min: number, max = Number.MAX_SAFE_INTEGER) => {
    if (!Number.isSafeInteger(value) || Number(value) < min || Number(value) > max)
      fail(at, `integer ${min}..${max}`, value);
  };
  const choice = (value: unknown, at: string, choices: readonly string[]) => {
    if (typeof value !== "string" || !choices.includes(value)) fail(at, choices.join(" | "), value);
  };
  const ref = (value: unknown, kind: ReferenceKind, at: string) => {
    assertDslObject(value, ["kind", "id", "name"], at);
    if (value.kind !== kind || Object.hasOwn(value, "id") === Object.hasOwn(value, "name"))
      fail(at, `${kind} reference with exactly id or name`, value);
    if (Object.hasOwn(value, "id")) integer(value.id, `${at}.id`, 1);
    else if (typeof value.name !== "string" || value.name.length === 0) fail(`${at}.name`, "nonempty reference name", value.name);
    if (resolver) {
      try { return resolver.resolveReference(value as never); }
      catch (error) { fail(at, "resolvable fixed project reference", error instanceof Error ? error.message : error); }
    }
    return typeof value.id === "number" ? value.id : undefined;
  };
  const selector = (value: unknown, scope: "enemy" | "party" | "character", at: string) => {
    assertDslObject(value, scope === "character" ? ["kind", "scope", "target", "id"] : ["kind", "scope", "target", "index"], at);
    if (value.kind !== "runtimeSelector" || value.scope !== scope) fail(at, `${scope} Runtime Selector`, value);
    if (scope === "character") {
      choice(value.target, `${at}.target`, ["player", "currentEvent", "event"]);
      if (value.target === "event") integer(value.id, `${at}.id`, 1);
      else if (Object.hasOwn(value, "id")) fail(`${at}.id`, "no id for player or currentEvent", value.id);
    } else {
      choice(value.target, `${at}.target`, [scope === "enemy" ? "enemy" : "member"]);
      integer(value.index, `${at}.index`, 0, 7);
    }
  };
  assertDslObject(input, [...(withKind ? ["kind"] : []), "variable", "operation", "value"], path);
  choice(input.operation, `${path}.operation`, operations);
  const target = input.variable;
  if (typeof target === "object" && target !== null && "kind" in target && target.kind === "referenceRange") {
    assertDslObject(target, ["kind", "from", "to"], `${path}.variable`);
    const range = target as Record<string, unknown>;
    const from = ref(range.from, "variable", `${path}.variable.from`);
    const to = ref(range.to, "variable", `${path}.variable.to`);
    if (from !== undefined && to !== undefined && from > to) fail(`${path}.variable`, "range start <= end; ranges are not reordered", target);
  } else ref(target, "variable", `${path}.variable`);
  const value = input.value;
  assertDslObject(value, undefined, `${path}.value`);
  choice(value.kind, `${path}.value.kind`, ["constant", "variable", "random", "gameData", "script"]);
  const at = `${path}.value`;
  if (value.kind === "constant") {
    assertDslObject(value, ["kind", "value"], at);
    integer(value.value, `${at}.value`, -99999999, 99999999);
  } else if (value.kind === "variable") {
    assertDslObject(value, ["kind", "variable"], at);
    ref(value.variable, "variable", `${at}.variable`);
  } else if (value.kind === "random") {
    assertDslObject(value, ["kind", "from", "to"], at);
    integer(value.from, `${at}.from`, -99999999, 99999999);
    integer(value.to, `${at}.to`, -99999999, 99999999);
    if (Number(value.from) > Number(value.to)) fail(at, "random from <= to; endpoints are not reordered", value);
  } else if (value.kind === "script") {
    assertDslObject(value, ["kind", "script"], at);
    assertDslObject(value.script, ["kind", "code"], `${at}.script`);
    if (value.script.kind !== "scriptInput" || typeof value.script.code !== "string") fail(`${at}.script`, "complete Script Input", value.script);
  } else {
    choice(value.source, `${at}.source`, ["item", "weapon", "armor", "actor", "enemy", "character", "party", "other"]);
    const source = value.source as string;
    const field = source === "character" ? "target" : source === "party" ? "member" : source;
    const hasStatus = ["actor", "enemy", "character", "other"].includes(source);
    assertDslObject(value, ["kind", "source", ...(source === "other" ? [] : [field]), ...(hasStatus ? ["value"] : [])], at);
    if (["item", "weapon", "armor", "actor"].includes(source)) ref(value[field], source as ReferenceKind, `${at}.${field}`);
    if (source === "enemy" || source === "character" || source === "party") selector(value[field], source, `${at}.${field}`);
    if (hasStatus) choice(value.value, `${at}.value`, source === "actor" ? actorValues : source === "enemy" ? enemyValues : source === "character" ? characterValues : otherValues);
  }
}

/** Native mode slots have a finite shape; numeric saved values retain negative zero. */
export function assertNativeControlVariables(parameters: readonly unknown[], path: string): void {
  const fail = (code: string, index: number | undefined, expected: string): never => {
    throw new CommandStructureError(`MV-E122-${code}`, "Invalid Control Variables saved parameters.", {
      nativePath: `${path}.parameters${index === undefined ? "" : `[${index}]`}`,
      expected, actual: describeValue(index === undefined ? parameters : parameters[index]),
    });
  };
  const integer = (i: number, min: number, max = Number.MAX_SAFE_INTEGER) => {
    if (!Number.isSafeInteger(parameters[i]) || Number(parameters[i]) < min || Number(parameters[i]) > max) fail("VALUE", i, `integer ${min}..${max}`);
  };
  const symbol = (i: number, min: number, max: number) => {
    integer(i, min, max);
    if (Object.is(parameters[i], -0)) fail("ENUM", i, "symbolic code excluding negative zero");
  };
  const mode = parameters[3];
  const length = mode === 2 ? 6 : mode === 3 ? 7 : 5;
  if (parameters.length !== length) fail("PARAMETERS", undefined, `exactly ${length} slots for operand mode ${String(mode)}`);
  integer(0, 1); integer(1, 1);
  if (Number(parameters[0]) > Number(parameters[1])) fail("RANGE", 1, "range end >= start; ranges are not reordered");
  symbol(2, 0, 5); symbol(3, 0, 4);
  if (mode === 0 || mode === 2) {
    integer(4, -99999999, 99999999);
    if (mode === 2) {
      integer(5, -99999999, 99999999);
      if (Number(parameters[4]) > Number(parameters[5])) fail("RANGE", 5, "random to >= from; endpoints are not reordered");
    }
  } else if (mode === 1) integer(4, 1);
  else if (mode === 4) {
    if (typeof parameters[4] !== "string") fail("SCRIPT", 4, "complete script string");
  } else {
    symbol(4, 0, 7);
    const source = parameters[4];
    if (source === 0 || source === 1 || source === 2 || source === 3) integer(5, 1);
    if (source === 4 || source === 6) integer(5, 0, 7);
    if (source === 5) symbol(5, -1, Number.MAX_SAFE_INTEGER);
    if (source === 7) symbol(5, 0, 9);
    if (source === 3) symbol(6, 0, 11);
    else if (source === 4) symbol(6, 0, 9);
    else if (source === 5) symbol(6, 0, 4);
    else if (!Object.is(parameters[6], 0)) fail("PADDING", 6, "exact structural +0");
  }
}
