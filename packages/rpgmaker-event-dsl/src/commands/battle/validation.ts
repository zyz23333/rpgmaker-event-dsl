import { assertDslCommandList, assertDslObject } from "../../validation/dsl-command-inputs.js";
import { CommandStructureError } from "../../validation/command-errors.js";
import { describeValue } from "../../project-data/json-values.js";
import type { ReferenceResolver } from "../../validation/types.js";

export function assertBattleInput(
  value: unknown,
  path: string,
  withKind = false,
  resolver?: ReferenceResolver,
): void {
  assertDslObject(
    value,
    [...(withKind ? ["kind"] : []), "troop", "canEscape", "canLose", "win", "escape", "lose"],
    path,
  );
  const fail = (suffix: string, expected: string, actual: unknown): never => {
    throw new CommandStructureError("MV-E301", "Invalid Battle Processing input.", {
      dslPath: path + suffix,
      expected,
      actual: describeValue(actual),
    });
  };
  const troop = value.troop;
  assertDslObject(troop, ["kind", "troop", "variable"], path + ".troop");
  if (!["fixed", "variable", "randomEncounter"].includes(troop.kind as string))
    fail(".troop.kind", "fixed, variable or randomEncounter", troop.kind);
  assertDslObject(
    troop,
    troop.kind === "fixed"
      ? ["kind", "troop"]
      : troop.kind === "variable"
        ? ["kind", "variable"]
        : ["kind"],
    path + ".troop",
  );
  if (troop.kind !== "randomEncounter") {
    const key = troop.kind === "fixed" ? "troop" : "variable";
    const ref = troop[key];
    assertDslObject(ref, ["kind", "id", "name"], `${path}.troop.${key}`);
    if (
      ref.kind !== key ||
      Object.hasOwn(ref, "id") === Object.hasOwn(ref, "name") ||
      (Object.hasOwn(ref, "id")
        ? !Number.isSafeInteger(ref.id) || (ref.id as number) < 1
        : typeof ref.name !== "string")
    )
      fail(`.troop.${key}`, `explicit ${key} reference`, ref);
    if (resolver)
      try {
        resolver.resolveReference(ref as never);
      } catch (error) {
        throw new CommandStructureError(
          "MV-E301-REFERENCE",
          error instanceof Error ? error.message : String(error),
          {
            dslPath: `${path}.troop.${key}`,
            expected: `existing ${key}`,
            actual: describeValue(ref),
          },
        );
      }
  }
  for (const flag of ["canEscape", "canLose"])
    if (value[flag] !== undefined && typeof value[flag] !== "boolean")
      fail(`.${flag}`, "boolean or omitted fixed false", value[flag]);
  for (const name of ["win", "escape", "lose"] as const) {
    const required =
      name === "win"
        ? value.canEscape === true || value.canLose === true
        : value[name === "escape" ? "canEscape" : "canLose"] === true;
    if (!required) {
      if (value[name] !== undefined)
        fail(`.${name}`, "body absent when its flag is false", value[name]);
      continue;
    }
    const body = value[name];
    assertDslObject(body, ["commands", "endMarker"], `${path}.${name}`);
    assertDslCommandList(body.commands, `${path}.${name}.commands`);
    if (body.endMarker !== undefined && body.endMarker !== "present" && body.endMarker !== "absent")
      fail(`.${name}.endMarker`, "present or absent", body.endMarker);
    if (body.commands.length === 0 && body.endMarker === "absent")
      fail(`.${name}.endMarker`, "present marker for empty body", body.endMarker);
  }
}

export function assertNativeBattleParameters(
  code: number,
  p: readonly unknown[],
  path: string,
): boolean {
  if (code !== 301) return false;
  const fail = (suffix: string, expected: string, actual: unknown): never => {
    throw new CommandStructureError("MV-E301", "Invalid Battle Processing saved parameters.", {
      nativePath: path + ".parameters" + suffix,
      expected,
      actual: describeValue(actual),
    });
  };
  if (p.length !== 4) fail("", "exactly four saved slots", p);
  if (![0, 1, 2].includes(p[0] as number) || Object.is(p[0], -0))
    fail("[0]", "troop mode 0, 1 or 2, excluding categorical negative zero", p[0]);
  if (
    p[0] === 2
      ? p[1] !== 0 || Object.is(p[1], -0)
      : !Number.isSafeInteger(p[1]) || (p[1] as number) < 1
  )
    fail("[1]", p[0] === 2 ? "exact structural zero" : "positive project reference ID", p[1]);
  for (const index of [2, 3])
    if (typeof p[index] !== "boolean") fail(`[${index}]`, "saved boolean", p[index]);
  return true;
}
