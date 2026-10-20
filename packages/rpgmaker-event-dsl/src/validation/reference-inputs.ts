import type { ReferenceKind } from "../domain/types.js";
import { assertDslObject } from "./dsl-command-inputs.js";
import { CommandStructureError } from "./command-errors.js";
import { describeValue } from "../project-data/json-values.js";

export function assertReferenceInput(
  value: unknown,
  kind: ReferenceKind,
  path: string,
  withKind = false,
): void {
  assertDslObject(value, withKind ? ["kind", "id", "name"] : ["id", "name"], path);
  if (
    (withKind && value.kind !== kind) ||
    Object.hasOwn(value, "id") === Object.hasOwn(value, "name") ||
    (Object.hasOwn(value, "id") ? typeof value.id !== "number" : typeof value.name !== "string")
  )
    throw new CommandStructureError("MV-REFERENCE-INPUT", "Invalid Project Data Reference shape.", {
      dslPath: path,
      expected: `${kind} reference with exactly one numeric id or string name`,
      actual: describeValue(value),
    });
}
