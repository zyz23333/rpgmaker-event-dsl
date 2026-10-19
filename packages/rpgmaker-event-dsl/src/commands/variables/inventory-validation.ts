import type { ReferenceKind, ReferenceValue } from "../../domain/types.js";
import type { ReferenceResolver } from "../../validation/types.js";
import { CommandStructureError } from "../../validation/command-errors.js";
import { assertDslObject } from "../../validation/dsl-command-inputs.js";
import { describeValue } from "../../project-data/json-values.js";

const definitions = {
  changeGold: { code: 125, fields: ["operation", "value"] },
  changeItems: { code: 126, fields: ["item", "operation", "amount"] },
  changeWeapons: { code: 127, fields: ["weapon", "operation", "amount", "includeEquipment"] },
  changeArmors: { code: 128, fields: ["armor", "operation", "amount", "includeEquipment"] },
  changePartyMember: { code: 129, fields: ["actor", "operation", "initialize"] },
} as const;

export type InventoryCommandKind = keyof typeof definitions;

export function isInventoryCommandKind(kind: string): kind is InventoryCommandKind {
  return Object.hasOwn(definitions, kind);
}

export function assertInventoryInput(
  kind: InventoryCommandKind,
  input: unknown,
  path = kind as string,
  withKind = true,
  resolver?: ReferenceResolver,
): void {
  const { code, fields } = definitions[kind];
  const fail = (at: string, expected: string, actual: unknown): never => {
    throw new CommandStructureError(
      `MV-E${code}-INPUT`,
      "Invalid inventory or party command input.",
      {
        dslPath: at,
        expected,
        actual: describeValue(actual),
      },
    );
  };
  assertDslObject(input, withKind ? ["kind", ...fields] : fields, path);
  for (const field of fields)
    if (!Object.hasOwn(input, field) || input[field] === undefined)
      fail(
        `${path}.${field}`,
        "required defined own field",
        Object.hasOwn(input, field) ? undefined : "missing",
      );
  const reference = (value: unknown, expectedKind: ReferenceKind, at: string) => {
    assertDslObject(value, ["kind", "id", "name"], at);
    if (
      value.kind !== expectedKind ||
      Object.hasOwn(value, "id") === Object.hasOwn(value, "name") ||
      (Object.hasOwn(value, "id")
        ? !Number.isSafeInteger(value.id) || (value.id as number) <= 0
        : typeof value.name !== "string")
    )
      fail(
        at,
        `${expectedKind} reference with exactly one positive integer id or string name`,
        value,
      );
    if (resolver) {
      try {
        resolver.resolveReference(value as ReferenceValue<ReferenceKind>);
      } catch (error) {
        fail(
          at,
          `existing uniquely resolved ${expectedKind} reference`,
          error instanceof Error ? error.message : error,
        );
      }
    }
  };
  const operation = input.operation;
  if (
    !(kind === "changePartyMember" ? ["add", "remove"] : ["gain", "lose"]).includes(
      operation as string,
    )
  )
    fail(
      `${path}.operation`,
      kind === "changePartyMember" ? "add or remove" : "gain or lose",
      operation,
    );
  if (kind === "changePartyMember") {
    reference(input.actor, "actor", `${path}.actor`);
    if (typeof input.initialize !== "boolean")
      fail(`${path}.initialize`, "explicit boolean saved initialization flag", input.initialize);
    return;
  }
  const quantityField = kind === "changeGold" ? "value" : "amount";
  const at = `${path}.${quantityField}`;
  const operand = input[quantityField];
  assertDslObject(operand, undefined, at);
  if (operand.kind === "constant") {
    assertDslObject(operand, ["kind", "value"], at);
    const maximum = kind === "changeGold" ? 9_999_999 : 9999;
    if (
      !Object.hasOwn(operand, "value") ||
      !Number.isSafeInteger(operand.value) ||
      (operand.value as number) < 1 ||
      (operand.value as number) > maximum
    )
      fail(`${at}.value`, `integer 1..${maximum}`, operand.value);
  } else if (operand.kind === "variable") {
    assertDslObject(operand, ["kind", "variable"], at);
    reference(operand.variable, "variable", `${at}.variable`);
  } else fail(`${at}.kind`, "constant or variable mode", operand.kind);
  if (kind !== "changeGold") {
    const field = kind === "changeItems" ? "item" : kind === "changeWeapons" ? "weapon" : "armor";
    reference(input[field], field, `${path}.${field}`);
  }
  if (
    (kind === "changeWeapons" || kind === "changeArmors") &&
    typeof input.includeEquipment !== "boolean"
  )
    fail(
      `${path}.includeEquipment`,
      "explicit boolean saved equipment flag",
      input.includeEquipment,
    );
}
