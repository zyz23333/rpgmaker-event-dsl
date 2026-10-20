import type { CommonEventDefinition } from "../domain/types.js";
import { describeValue } from "../project-data/json-values.js";
import { CommandStructureError } from "./command-errors.js";
import { assertDslCommandList, assertDslObject } from "./dsl-command-inputs.js";

export function assertCommonEventInput(
  value: unknown,
  withKind = false,
): asserts value is CommonEventDefinition {
  const path = "commonEvent";
  const fail = (field: string, expected: string, actual: unknown): never => {
    const id =
      typeof value === "object" && value !== null
        ? Object.getOwnPropertyDescriptor(value, "id")
        : undefined;
    throw new CommandStructureError(
      "MV-COMMON-EVENT",
      "Invalid Common Event definition.",
      { dslPath: field, expected, actual: describeValue(actual) },
      id !== undefined && "value" in id && Number.isSafeInteger(id.value)
        ? `commonEvent:${id.value}`
        : "commonEvent",
      "compile",
    );
  };
  try {
    assertDslObject(
      value,
      ["id", "name", "trigger", "switch", "commands", ...(withKind ? ["kind"] : [])],
      path,
    );
  } catch (error) {
    fail(
      path,
      "Common Event with only supported own data fields",
      error instanceof Error ? error.message : error,
    );
  }
  const input = value as Record<string, unknown>;
  if (!Number.isSafeInteger(input.id) || (input.id as number) <= 0)
    fail(`${path}.id`, "positive safe integer", input.id);
  if (typeof input.name !== "string") fail(`${path}.name`, "string", input.name);
  if (!["none", "autorun", "parallel"].includes(input.trigger as string))
    fail(`${path}.trigger`, "none | autorun | parallel", input.trigger);
  if (input.switch === undefined) {
    if (input.trigger !== "none") fail(`${path}.switch`, "explicit Switch reference", input.switch);
  } else {
    try {
      assertDslObject(input.switch, ["kind", "id", "name"], `${path}.switch`);
    } catch (error) {
      fail(`${path}.switch`, "Switch reference", error instanceof Error ? error.message : error);
    }
    const ref = input.switch as Record<string, unknown>;
    if (
      ref.kind !== "switch" ||
      Object.hasOwn(ref, "id") === Object.hasOwn(ref, "name") ||
      (Object.hasOwn(ref, "id")
        ? !Number.isSafeInteger(ref.id) || (ref.id as number) <= 0
        : typeof ref.name !== "string")
    )
      fail(
        `${path}.switch`,
        "Switch reference with exactly one positive id or string name",
        input.switch,
      );
  }
  try {
    assertDslCommandList(input.commands, `${path}.commands`, false);
  } catch (error) {
    fail(
      `${path}.commands`,
      "dense authored command array",
      error instanceof Error ? error.message : error,
    );
  }
}
