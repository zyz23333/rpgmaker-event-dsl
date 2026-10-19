import { CommandStructureError } from "../../validation/command-errors.js";
import { renderJsonValue } from "../../project-data/json-values.js";

export function assertNativePictureParameters(
  code: number,
  parameters: readonly unknown[],
  path: string,
): void {
  if (code < 231 || code > 235) return;
  const fail = (suffix: string, expected: string, actual: unknown, savedShape = false): never => {
    throw new CommandStructureError(
      `MV-E${code}-${savedShape ? "SAVED-SHAPE" : "PARAMETERS"}`,
      savedShape
        ? "Unsupported Move Picture saved reserved slot."
        : "Invalid saved Picture parameter.",
      { nativePath: `${path}.parameters${suffix}`, expected, actual: renderJsonValue(actual) },
    );
  };
  const length = ({ 231: 10, 232: 12, 233: 2, 234: 4, 235: 1 } as Record<number, number>)[code]!;
  if (parameters.length !== length) fail("", `exactly ${length} saved slots`, parameters);
  const slot = (index: number, valid: boolean, expected: string) => {
    if (!valid) fail(`[${index}]`, expected, parameters[index]);
  };
  const integer = (index: number, minimum: number, maximum: number) =>
    slot(
      index,
      Number.isSafeInteger(parameters[index]) &&
        (parameters[index] as number) >= minimum &&
        (parameters[index] as number) <= maximum,
      `integer ${minimum}..${maximum}`,
    );
  const enumSlot = (index: number, values: readonly number[]) =>
    slot(
      index,
      values.includes(parameters[index] as number) && !Object.is(parameters[index], -0),
      `native enum ${values.join("/")}, excluding negative zero`,
    );
  integer(0, 1, 100);
  if (code === 231 || code === 232) {
    if (code === 231) slot(1, typeof parameters[1] === "string", "pictures filename or empty None");
    else if (parameters[1] !== 0 || Object.is(parameters[1], -0))
      fail("[1]", "exact positive structural zero", parameters[1], true);
    enumSlot(2, [0, 1]);
    enumSlot(3, [0, 1]);
    for (const index of [4, 5])
      integer(
        index,
        parameters[3] === 0 ? -9999 : 1,
        parameters[3] === 0 ? 9999 : Number.MAX_SAFE_INTEGER,
      );
    for (const index of [6, 7]) integer(index, -2000, 2000);
    integer(8, 0, 255);
    enumSlot(9, [0, 1, 2, 3]);
    if (code === 232) {
      integer(10, 1, 999);
      slot(11, typeof parameters[11] === "boolean", "explicit boolean");
    }
  }
  if (code === 233) integer(1, -90, 90);
  if (code === 234) {
    const tone = parameters[1];
    if (!Array.isArray(tone) || tone.length !== 4)
      fail("[1]", "exactly four saved tone components", tone);
    for (let index = 0; index < 4; index++) {
      const value = (tone as unknown[])[index];
      if (
        !Number.isSafeInteger(value) ||
        (value as number) < (index === 3 ? 0 : -255) ||
        (value as number) > 255
      )
        fail(`[1][${index}]`, index === 3 ? "integer gray 0..255" : "integer RGB -255..255", value);
    }
    integer(2, 1, 999);
    slot(3, typeof parameters[3] === "boolean", "explicit boolean");
  }
}
