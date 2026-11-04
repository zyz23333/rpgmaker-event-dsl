import { CommandStructureError } from "../../validation/command-errors.js";
import { describeValue } from "../../project-data/json-values.js";

export function assertNativeInventoryCommand(
  code: number,
  p: readonly unknown[],
  path: string,
): void {
  if (code < 125 || code > 129) return;
  const fail = (slot: number | undefined, expected: string, actual: unknown): never => {
    throw new CommandStructureError(
      `MV-E${code}-PARAMETERS`,
      "Invalid saved inventory or party parameter.",
      {
        nativePath: `${path}.parameters${slot === undefined ? "" : `[${slot}]`}`,
        expected,
        actual: describeValue(actual),
      },
    );
  };
  const length = code === 125 || code === 129 ? 3 : code === 126 ? 4 : 5;
  if (p.length !== length) fail(undefined, `exactly ${length} saved slots`, p);
  const integer = (slot: number, minimum: number, maximum = Number.MAX_SAFE_INTEGER) => {
    if (
      !Number.isSafeInteger(p[slot]) ||
      Object.is(p[slot], -0) ||
      (p[slot] as number) < minimum ||
      (p[slot] as number) > maximum
    )
      fail(slot, `integer ${minimum}..${maximum}, excluding negative zero`, p[slot]);
  };
  const operation = code === 125 ? 0 : 1;
  integer(operation, 0, 1);
  if (code !== 125) integer(0, 1);
  if (code === 129) {
    if (typeof p[2] !== "boolean") fail(2, "explicit boolean saved initialization flag", p[2]);
    return;
  }
  integer(operation + 1, 0, 1);
  integer(
    operation + 2,
    1,
    p[operation + 1] === 1 ? Number.MAX_SAFE_INTEGER : code === 125 ? 9_999_999 : 9999,
  );
  if ((code === 127 || code === 128) && typeof p[4] !== "boolean")
    fail(4, "explicit boolean saved equipment flag", p[4]);
}
