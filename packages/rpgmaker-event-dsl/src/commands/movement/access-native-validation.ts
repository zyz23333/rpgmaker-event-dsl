import { renderJsonValue } from "../../project-data/json-values.js";
import { CommandStructureError } from "../../validation/command-errors.js";

export function assertNativeSystemSettingsParameters(
  code: number,
  parameters: readonly unknown[],
  path: string,
): void {
  if (code < 134 || code > 138) return;
  const fail = (suffix: string, expected: string, actual: unknown): never => {
    throw new CommandStructureError(
      `MV-E${code}-PARAMETERS`,
      "Invalid saved system setting parameter.",
      {
        nativePath: `${path}.parameters${suffix}`,
        expected,
        actual: renderJsonValue(actual),
      },
    );
  };
  if (parameters.length !== 1) fail("", "exactly one saved slot", parameters);
  const value = parameters[0];
  if (code !== 138) {
    if ((value !== 0 && value !== 1) || Object.is(value, -0))
      fail("[0]", "native false 0 or true 1, excluding negative zero", value);
    return;
  }
  if (!Array.isArray(value) || value.length !== 4)
    fail("[0]", "exactly four saved Tone components", value);
  const tone = value as unknown[];
  for (let index = 0; index < 4; index++) {
    const component = tone[index];
    const minimum = index === 3 ? 0 : -255;
    if (
      !Number.isSafeInteger(component) ||
      (component as number) < minimum ||
      (component as number) > 255
    )
      fail(`[0][${index}]`, `integer ${minimum}..255`, component);
  }
}
