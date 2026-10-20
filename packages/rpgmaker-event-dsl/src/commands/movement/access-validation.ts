import { describeValue } from "../../project-data/json-values.js";
import { CommandStructureError } from "../../validation/command-errors.js";
import { assertDslObject } from "../../validation/dsl-command-inputs.js";

const accessCodes: Record<string, number> = {
  changeSaveAccess: 134,
  changeMenuAccess: 135,
  changeEncounter: 136,
  changeFormationAccess: 137,
};

export function assertSystemAccessInput(
  kind: string,
  input: unknown,
  path: string,
  withKind = false,
): void {
  if (!Object.hasOwn(accessCodes, kind)) return;
  assertDslObject(input, withKind ? ["kind", "enabled"] : ["enabled"], path);
  if (typeof input.enabled !== "boolean")
    throw new CommandStructureError(
      `MV-E${accessCodes[kind]}-INPUT`,
      "System access requires an explicit boolean.",
      {
        dslPath: `${path}.enabled`,
        expected: "boolean",
        actual: describeValue(input.enabled),
      },
    );
}

export function assertWindowColorInput(
  kind: string,
  input: unknown,
  path: string,
  withKind = false,
): void {
  if (kind !== "changeWindowColor") return;
  assertDslObject(input, withKind ? ["kind", "tone"] : ["tone"], path);
  assertDslObject(input.tone, ["red", "green", "blue", "gray"], `${path}.tone`);
  for (const field of ["red", "green", "blue", "gray"] as const) {
    const value = input.tone[field];
    const minimum = field === "gray" ? 0 : -255;
    if (!Number.isSafeInteger(value) || (value as number) < minimum || (value as number) > 255)
      throw new CommandStructureError("MV-E138-INPUT", "Invalid saved window Tone component.", {
        dslPath: `${path}.tone.${field}`,
        expected: `integer ${minimum}..255`,
        actual: describeValue(value),
      });
  }
}
