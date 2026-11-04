import { describeValue } from "../../project-data/json-values.js";
import { CommandStructureError } from "../../validation/command-errors.js";

export function assertNativeActorResourceParameters(
  code: number,
  parameters: readonly unknown[],
  path: string,
): void {
  const counts: Record<number, number> = {
    311: 6,
    312: 5,
    313: 4,
    314: 2,
    315: 6,
    316: 6,
    317: 6,
    318: 4,
    319: 3,
    321: 3,
    326: 5,
  };
  if (!Object.hasOwn(counts, code)) return;
  const fail = (index: number | undefined, expected: string, actual: unknown): never => {
    throw new CommandStructureError(
      `MV-E${code}-PARAMETERS`,
      "Invalid saved Actor resource slot.",
      {
        nativePath: `${path}.parameters${index === undefined ? "" : `[${index}]`}`,
        expected,
        actual: describeValue(actual),
      },
    );
  };
  if (parameters.length !== counts[code])
    fail(undefined, `exactly ${counts[code]} saved slots`, parameters);
  const categorical = (index: number): void => {
    if ((parameters[index] !== 0 && parameters[index] !== 1) || Object.is(parameters[index], -0))
      fail(index, "0 or 1, excluding negative zero", parameters[index]);
  };
  const integer = (index: number, minimum: number, maximum = Number.MAX_SAFE_INTEGER): void => {
    const value = parameters[index];
    if (
      !Number.isSafeInteger(value) ||
      Object.is(value, -0) ||
      (value as number) < minimum ||
      (value as number) > maximum
    )
      fail(index, `integer ${minimum}..${maximum}, excluding negative zero`, value);
  };
  if (code === 319) {
    integer(0, 1);
    integer(1, 1);
    integer(2, 0);
    return;
  }
  if (code === 321) {
    integer(0, 1);
    integer(1, 1);
    if (typeof parameters[2] !== "boolean") fail(2, "explicit boolean", parameters[2]);
    return;
  }
  categorical(0);
  integer(1, parameters[0] === 0 ? 0 : 1);
  if (code === 314) return;
  if (code === 317) {
    integer(2, 0, 7);
    categorical(3);
    categorical(4);
    integer(5, 1, parameters[4] === 1 ? Number.MAX_SAFE_INTEGER : 9999);
    return;
  }
  categorical(2);
  if (code === 313 || code === 318) {
    integer(3, 1);
    return;
  }
  categorical(3);
  integer(
    4,
    1,
    parameters[3] === 1
      ? Number.MAX_SAFE_INTEGER
      : code === 315
        ? 9999999
        : code === 316
          ? 98
          : code === 326
            ? 100
            : 9999,
  );
  if ((code === 311 || code === 315 || code === 316) && typeof parameters[5] !== "boolean")
    fail(5, "explicit boolean", parameters[5]);
}
