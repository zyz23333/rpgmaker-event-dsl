import { CommandStructureError } from "../../validation/command-errors.js";
import { describeValue } from "../../project-data/json-values.js";

export function assertNativeMapCharacterParameters(
  code: number,
  p: readonly unknown[],
  path: string,
): void {
  if (![204, 206, 211, 212, 213, 214, 216, 217].includes(code)) return;
  const fail = (slot: number | undefined, expected: string, actual: unknown): never => {
    throw new CommandStructureError(
      `MV-E${code}-PARAMETERS`,
      "Invalid saved map character parameters.",
      {
        nativePath: `${path}.parameters${slot === undefined ? "" : `[${slot}]`}`,
        expected,
        actual: describeValue(actual),
      },
    );
  };
  const length =
    code === 204 || code === 212 || code === 213 ? 3 : code === 211 || code === 216 ? 1 : 0;
  if (p.length !== length) fail(undefined, `exactly ${length} saved slots`, p);
  const integer = (slot: number, minimum: number, maximum: number, categorical = true) => {
    if (
      !Number.isSafeInteger(p[slot]) ||
      (categorical && Object.is(p[slot], -0)) ||
      (p[slot] as number) < minimum ||
      (p[slot] as number) > maximum
    )
      fail(
        slot,
        `integer ${minimum}..${maximum}${categorical ? ", excluding negative zero" : ""}`,
        p[slot],
      );
  };
  if (code === 204) {
    if (![2, 4, 6, 8].includes(p[0] as number)) fail(0, "cardinal direction 2/4/6/8", p[0]);
    integer(1, 0, 100, false);
    integer(2, 1, 6);
  } else if (code === 211 || code === 216) integer(0, 0, 1);
  else if (code === 212 || code === 213) {
    integer(0, -1, Number.MAX_SAFE_INTEGER);
    integer(1, 1, code === 213 ? 15 : Number.MAX_SAFE_INTEGER);
    if (typeof p[2] !== "boolean") fail(2, "explicit boolean wait", p[2]);
  }
}
