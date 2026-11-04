import { describeValue } from "../../project-data/json-values.js";
import { CommandStructureError } from "../../validation/command-errors.js";

export function assertNativeShopParameters(
  code: number,
  parameters: readonly unknown[],
  path: string,
): void {
  const fail = (slot: number | undefined, expected: string, unsupported = false): never => {
    throw new CommandStructureError(
      unsupported ? "MV-COMMAND-UNSUPPORTED" : "MV-E302-PARAMETERS",
      unsupported
        ? "This saved Shop price form is not supported."
        : "Invalid saved Shop goods parameter.",
      {
        nativePath: `${path}.parameters${slot === undefined ? "" : `[${slot}]`}`,
        expected,
        actual: describeValue(slot === undefined ? parameters : parameters[slot]),
      },
    );
  };
  const length = code === 302 ? 5 : 4;
  if (parameters.length !== length) fail(undefined, `exactly ${length} saved slots`);
  if (code === 302 && typeof parameters[4] !== "boolean") fail(4, "boolean purchaseOnly");
  if (parameters.slice(0, 4).every((value) => Object.is(value, 0))) return;
  if (![0, 1, 2].some((value) => Object.is(value, parameters[0])))
    fail(0, "item0, weapon1 or armor2 category");
  if (!Number.isSafeInteger(parameters[1]) || (parameters[1] as number) <= 0)
    fail(1, "positive item identity or the exact four-zero placeholder");
  if (![0, 1].some((value) => Object.is(value, parameters[2])))
    fail(2, "standard0 or custom1 price mode");
  if (parameters[2] === 0) {
    if (!Object.is(parameters[3], 0)) fail(3, "exact zero saved with standard price mode", true);
  } else if (
    !Number.isSafeInteger(parameters[3]) ||
    (parameters[3] as number) < 0 ||
    (parameters[3] as number) > 999_999
  )
    fail(3, "integer custom price 0..999999");
}
