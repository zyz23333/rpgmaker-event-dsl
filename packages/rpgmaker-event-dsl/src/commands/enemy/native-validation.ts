import { CommandStructureError } from "../../validation/command-errors.js";
import { describeValue } from "../../project-data/json-values.js";

function fail(code: number, at: { nativePath: string }, expected: string, actual: unknown): never {
  throw new CommandStructureError(`MV-E${code}`, "Invalid Enemy command input.", {
    ...at,
    expected,
    actual: describeValue(actual),
  });
}
function validInteger(value: unknown, min: number, max: number) {
  return Number.isSafeInteger(value) && (value as number) >= min && (value as number) <= max;
}
export function assertNativeEnemyParameters(
  code: number,
  parameters: readonly unknown[],
  path: string,
): boolean {
  if (![331, 332, 333, 334, 335, 336, 337, 342, 339, 340].includes(code)) return false;
  const p = parameters;
  const slot = (index: number, valid: boolean, expected: string) => {
    if (!valid) fail(code, { nativePath: `${path}.parameters[${index}]` }, expected, p[index]);
  };
  if (code === 339 || code === 340) {
    if (p.length !== (code === 339 ? 4 : 0))
      fail(
        code,
        { nativePath: `${path}.parameters` },
        code === 339 ? "exactly four saved slots" : "exactly zero saved slots",
        p,
      );
    if (code === 340) return true;
    slot(
      0,
      (p[0] === 0 || p[0] === 1) && !Object.is(p[0], -0),
      "enemy mode 0 or Actor mode 1, excluding categorical negative zero",
    );
    slot(
      1,
      validInteger(p[1], p[0] === 0 ? 0 : 1, p[0] === 0 ? 7 : Number.MAX_SAFE_INTEGER),
      p[0] === 0 ? "enemy position 0..7" : "positive Actor ID",
    );
    slot(2, validInteger(p[2], 1, Number.MAX_SAFE_INTEGER), "positive Skill ID");
    slot(3, validInteger(p[3], -2, 7), "lastTarget -2, random -1 or position 0..7");
    return true;
  }
  const count =
    code === 331
      ? 5
      : [332, 342].includes(code)
        ? 4
        : [333, 337].includes(code)
          ? 3
          : code === 336
            ? 2
            : 1;
  if (p.length !== count)
    fail(code, { nativePath: `${path}.parameters` }, `exactly ${count} saved slots`, p);
  slot(
    0,
    validInteger(p[0], [335, 336, 337].includes(code) ? 0 : -1, 7),
    "saved enemy position 0..7, or -1 only in the all-capable family",
  );
  const enumSlot = (index: number) =>
    slot(
      index,
      (p[index] === 0 || p[index] === 1) && !Object.is(p[index], -0),
      "0 or 1, excluding categorical negative zero",
    );
  if ([331, 332, 342].includes(code)) {
    enumSlot(1);
    enumSlot(2);
    slot(
      3,
      validInteger(p[3], 1, p[2] === 1 ? Number.MAX_SAFE_INTEGER : code === 342 ? 100 : 9999),
      p[2] === 1 ? "positive variable slot" : `constant 1..${code === 342 ? 100 : 9999}`,
    );
    if (code === 331) slot(4, typeof p[4] === "boolean", "explicit boolean");
  }
  if (code === 333) {
    enumSlot(1);
    slot(2, validInteger(p[2], 1, Number.MAX_SAFE_INTEGER), "positive State ID");
  }
  if (code === 336 || code === 337)
    slot(1, validInteger(p[1], 1, Number.MAX_SAFE_INTEGER), "positive fixed project ID");
  if (code === 337) slot(2, typeof p[2] === "boolean", "explicit allEnemies boolean");
  return true;
}
