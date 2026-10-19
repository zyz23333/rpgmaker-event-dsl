import { CommandStructureError } from "../../validation/command-errors.js";
import { renderJsonValue } from "../../project-data/json-values.js";

export function assertNativeMapAppearanceParameters(
  code: number,
  parameters: readonly unknown[],
  path: string,
): void {
  if (code < 281 || code > 284) return;
  const fail = (suffix: string, expected: string, actual: unknown): never => {
    throw new CommandStructureError(
      `MV-E${code}-PARAMETERS`,
      "Invalid saved map appearance parameter.",
      {
        nativePath: `${path}.parameters${suffix}`,
        expected,
        actual: renderJsonValue(actual),
      },
    );
  };
  const length = code === 283 ? 2 : code === 284 ? 5 : 1;
  if (parameters.length !== length) fail("", `exactly ${length} saved slots`, parameters);
  const slot = (index: number, valid: boolean, expected: string) => {
    if (!valid) fail(`[${index}]`, expected, parameters[index]);
  };
  if (code === 281)
    slot(
      0,
      (parameters[0] === 0 || parameters[0] === 1) && !Object.is(parameters[0], -0),
      "native enabled 0 or disabled 1",
    );
  if (code === 282)
    slot(
      0,
      Number.isSafeInteger(parameters[0]) && (parameters[0] as number) > 0,
      "positive actual tileset ID; no None",
    );
  if (code === 283)
    for (const index of [0, 1])
      slot(
        index,
        typeof parameters[index] === "string",
        "image filename string or empty string None",
      );
  if (code === 284) {
    slot(0, typeof parameters[0] === "string", "parallax filename string or empty string None");
    for (const index of [1, 2]) slot(index, typeof parameters[index] === "boolean", "boolean");
    for (const index of [3, 4])
      slot(
        index,
        Number.isSafeInteger(parameters[index]) &&
          !Object.is(parameters[index], -0) &&
          (parameters[index] as number) >= -32 &&
          (parameters[index] as number) <= 32,
        "integer -32..32, excluding negative zero",
      );
  }
}
