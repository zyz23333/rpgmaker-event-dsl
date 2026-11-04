import { describeValue } from "../../project-data/json-values.js";
import { CommandStructureError } from "../../validation/command-errors.js";

export function assertNativeActorPresentationParameters(
  code: number,
  parameters: readonly unknown[],
  path: string,
): void {
  const counts: Record<number, number> = { 303: 2, 320: 2, 322: 6, 323: 3, 324: 2, 325: 2 };
  if (!Object.hasOwn(counts, code)) return;
  const fail = (slot: number | undefined, expected: string, actual: unknown): never => {
    throw new CommandStructureError(
      `MV-E${code}-PARAMETERS`,
      "Invalid saved Actor presentation slot.",
      {
        nativePath: `${path}.parameters${slot === undefined ? "" : `[${slot}]`}`,
        expected,
        actual: describeValue(actual),
      },
    );
  };
  if (parameters.length !== counts[code])
    fail(undefined, `exactly ${counts[code]} saved slots`, parameters);
  const integer = (
    slot: number,
    minimum: number,
    maximum = Number.MAX_SAFE_INTEGER,
    excludeNegativeZero = false,
  ): void => {
    const value = parameters[slot];
    if (
      !Number.isSafeInteger(value) ||
      (value as number) < minimum ||
      (value as number) > maximum ||
      (excludeNegativeZero && Object.is(value, -0))
    )
      fail(
        slot,
        `integer ${minimum}..${maximum}${excludeNegativeZero ? ", excluding negative zero" : ""}`,
        value,
      );
  };
  const text = (slot: number): void => {
    if (typeof parameters[slot] !== "string") fail(slot, "complete saved string", parameters[slot]);
  };
  integer(0, code === 323 ? 0 : 1, code === 323 ? 2 : Number.MAX_SAFE_INTEGER, true);
  if (code === 303) integer(1, 1, 16);
  else if (code === 322) {
    text(1);
    integer(2, 0, 7);
    text(3);
    integer(4, 0, 2147483647, true);
    text(5);
  } else if (code === 323) {
    text(1);
    integer(2, 0, 7);
  } else text(1);
}
