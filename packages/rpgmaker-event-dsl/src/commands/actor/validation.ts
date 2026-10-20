import type { ReferenceKind, ReferenceValue } from "../../domain/types.js";
import { describeValue } from "../../project-data/json-values.js";
import { CommandStructureError } from "../../validation/command-errors.js";
import { assertDslObject } from "../../validation/dsl-command-inputs.js";
import type { ReferenceResolver } from "../../validation/types.js";

export function assertActorSavedFlag(code: number, field: string, value: unknown): void {
  if (typeof value !== "boolean")
    throw new CommandStructureError(`MV-E${code}-INPUT`, "Expected independently saved boolean.", {
      dslPath: field,
      expected: "explicit boolean",
      actual: describeValue(value),
    });
}

const codes = {
  changeHp: 311,
  changeMp: 312,
  changeState: 313,
  recoverAll: 314,
  changeTp: 326,
} as const;
const fields = {
  changeHp: ["target", "operation", "value", "allowDeath"],
  changeMp: ["target", "operation", "value"],
  changeState: ["target", "operation", "state"],
  recoverAll: ["target"],
  changeTp: ["target", "operation", "value"],
} as const;

export function assertActorResourceInput(
  kind: string,
  input: unknown,
  path: string,
  withKind = false,
  resolver?: ReferenceResolver,
): void {
  if (!Object.hasOwn(codes, kind)) return;
  const family = kind as keyof typeof codes;
  const code = codes[family];
  assertDslObject(input, [...(withKind ? ["kind"] : []), ...fields[family]], path);
  const fail = (at: string, expected: string, value: unknown): never => {
    throw new CommandStructureError(`MV-E${code}-INPUT`, "Invalid saved Actor resource input.", {
      dslPath: at,
      expected,
      actual: describeValue(value),
    });
  };
  const reference = (value: unknown, referenceKind: ReferenceKind, at: string): void => {
    assertDslObject(value, ["kind", "id", "name"], at);
    if (
      value.kind !== referenceKind ||
      Object.hasOwn(value, "id") === Object.hasOwn(value, "name") ||
      (Object.hasOwn(value, "id")
        ? !Number.isSafeInteger(value.id) || (value.id as number) <= 0
        : typeof value.name !== "string" || value.name.length === 0)
    )
      fail(at, `${referenceKind} reference with one positive integer ID or nonempty name`, value);
    if (resolver) {
      try {
        resolver.resolveReference(value as ReferenceValue<ReferenceKind>);
      } catch (error) {
        throw new CommandStructureError(
          `MV-E${code}-REFERENCE`,
          error instanceof Error ? error.message : String(error),
          {
            dslPath: at,
            expected: `existing ${referenceKind} in the Project Data Snapshot`,
            actual: describeValue(value),
          },
        );
      }
    }
  };
  const targetPath = `${path}.target`;
  const target = input.target;
  assertDslObject(target, ["kind", "scope", "target", "actor", "variable"], targetPath);
  if (
    target.kind !== "runtimeSelector" ||
    target.scope !== "actor" ||
    !["entireParty", "actor", "actorFromVariable"].includes(target.target as string)
  )
    fail(targetPath, "Actor entireParty, actor or actorFromVariable Runtime Selector", target);
  const targetFields =
    target.target === "actor"
      ? ["actor"]
      : target.target === "actorFromVariable"
        ? ["variable"]
        : [];
  assertDslObject(target, ["kind", "scope", "target", ...targetFields], targetPath);
  if (target.target === "actor") reference(target.actor, "actor", `${targetPath}.actor`);
  if (target.target === "actorFromVariable")
    reference(target.variable, "variable", `${targetPath}.variable`);
  if (family === "recoverAll") return;
  const operations = family === "changeState" ? ["add", "remove"] : ["gain", "lose"];
  if (!operations.includes(input.operation as string))
    fail(`${path}.operation`, operations.join(" or "), input.operation);
  if (family === "changeState") {
    reference(input.state, "state", `${path}.state`);
    return;
  }
  const operandPath = `${path}.value`;
  const operand = input.value;
  assertDslObject(operand, ["kind", "value", "variable"], operandPath);
  if (operand.kind === "constant") {
    assertDslObject(operand, ["kind", "value"], operandPath);
    const maximum = family === "changeTp" ? 100 : 9999;
    if (
      !Number.isSafeInteger(operand.value) ||
      (operand.value as number) < 1 ||
      (operand.value as number) > maximum
    )
      fail(`${operandPath}.value`, `integer 1..${maximum}`, operand.value);
  } else if (operand.kind === "variable") {
    assertDslObject(operand, ["kind", "variable"], operandPath);
    reference(operand.variable, "variable", `${operandPath}.variable`);
  } else fail(`${operandPath}.kind`, "constant or variable", operand.kind);
  if (family === "changeHp" && typeof input.allowDeath !== "boolean")
    fail(`${path}.allowDeath`, "explicit boolean", input.allowDeath);
}
