import type { ControlVariablesDslCommand, ReferenceKind } from "../../domain/types.js";
import type { ReferenceResolver } from "../../validation/types.js";
import { assertDslObject } from "../../validation/dsl-command-inputs.js";
import { CommandStructureError } from "../../validation/command-errors.js";
import { describeValue } from "../../project-data/json-values.js";

const operations = ["set", "add", "sub", "mul", "div", "mod"];
const actorValues = [
  "level",
  "exp",
  "hp",
  "mp",
  "mhp",
  "mmp",
  "atk",
  "def",
  "mat",
  "mdf",
  "agi",
  "luk",
];
const enemyValues = ["hp", "mp", "mhp", "mmp", "atk", "def", "mat", "mdf", "agi", "luk"];
const characterValues = ["mapX", "mapY", "direction", "screenX", "screenY"];
const otherValues = [
  "mapId",
  "partyMembers",
  "gold",
  "steps",
  "playTime",
  "timer",
  "saveCount",
  "battleCount",
  "winCount",
  "escapeCount",
];

/** Validate authored saved inputs before a helper or encoder can discard information. */
export function assertControlVariablesInput(
  input: unknown,
  path = "controlVariables",
  withKind = false,
  resolver?: ReferenceResolver,
): asserts input is Omit<ControlVariablesDslCommand, "kind"> {
  const fail = (field: string, expected: string, actual: unknown): never => {
    throw new CommandStructureError("MV-E122-INPUT", "Invalid Control Variables saved input.", {
      dslPath: field,
      expected,
      actual: describeValue(actual),
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
    else if (typeof value.name !== "string" || value.name.length === 0)
      fail(`${at}.name`, "nonempty reference name", value.name);
    if (resolver) {
      try {
        return resolver.resolveReference(value as never);
      } catch (error) {
        fail(
          at,
          "resolvable fixed project reference",
          error instanceof Error ? error.message : error,
        );
      }
    }
    return typeof value.id === "number" ? value.id : undefined;
  };
  const selector = (value: unknown, scope: "enemy" | "party" | "character", at: string) => {
    assertDslObject(
      value,
      scope === "character"
        ? ["kind", "scope", "target", "id"]
        : ["kind", "scope", "target", "index"],
      at,
    );
    if (value.kind !== "runtimeSelector" || value.scope !== scope)
      fail(at, `${scope} Runtime Selector`, value);
    if (scope === "character") {
      choice(value.target, `${at}.target`, ["player", "currentEvent", "event"]);
      if (value.target === "event") integer(value.id, `${at}.id`, 1);
      else if (Object.hasOwn(value, "id"))
        fail(`${at}.id`, "no id for player or currentEvent", value.id);
    } else {
      choice(value.target, `${at}.target`, [scope === "enemy" ? "enemy" : "member"]);
      integer(value.index, `${at}.index`, 0, 7);
    }
  };
  assertDslObject(input, [...(withKind ? ["kind"] : []), "variable", "operation", "value"], path);
  choice(input.operation, `${path}.operation`, operations);
  const target = input.variable;
  if (
    typeof target === "object" &&
    target !== null &&
    "kind" in target &&
    target.kind === "referenceRange"
  ) {
    assertDslObject(target, ["kind", "from", "to"], `${path}.variable`);
    const range = target as Record<string, unknown>;
    const from = ref(range.from, "variable", `${path}.variable.from`);
    const to = ref(range.to, "variable", `${path}.variable.to`);
    if (from !== undefined && to !== undefined && from > to)
      fail(`${path}.variable`, "range start <= end; ranges are not reordered", target);
  } else ref(target, "variable", `${path}.variable`);
  const value = input.value;
  assertDslObject(value, undefined, `${path}.value`);
  choice(value.kind, `${path}.value.kind`, [
    "constant",
    "variable",
    "random",
    "gameData",
    "script",
  ]);
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
    if (Number(value.from) > Number(value.to))
      fail(at, "random from <= to; endpoints are not reordered", value);
  } else if (value.kind === "script") {
    assertDslObject(value, ["kind", "script"], at);
    assertDslObject(value.script, ["kind", "code"], `${at}.script`);
    if (value.script.kind !== "scriptInput" || typeof value.script.code !== "string")
      fail(`${at}.script`, "complete Script Input", value.script);
  } else {
    choice(value.source, `${at}.source`, [
      "item",
      "weapon",
      "armor",
      "actor",
      "enemy",
      "character",
      "party",
      "other",
    ]);
    const source = value.source as string;
    const field = source === "character" ? "target" : source === "party" ? "member" : source;
    const hasStatus = ["actor", "enemy", "character", "other"].includes(source);
    assertDslObject(
      value,
      ["kind", "source", ...(source === "other" ? [] : [field]), ...(hasStatus ? ["value"] : [])],
      at,
    );
    if (["item", "weapon", "armor", "actor"].includes(source))
      ref(value[field], source as ReferenceKind, `${at}.${field}`);
    if (source === "enemy" || source === "character" || source === "party")
      selector(value[field], source, `${at}.${field}`);
    if (hasStatus)
      choice(
        value.value,
        `${at}.value`,
        source === "actor"
          ? actorValues
          : source === "enemy"
            ? enemyValues
            : source === "character"
              ? characterValues
              : otherValues,
      );
  }
}
