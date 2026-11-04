import { CommandStructureError } from "../../validation/command-errors.js";
import { describeValue } from "../../project-data/json-values.js";

export function assertNativeBattleParameters(
  code: number,
  p: readonly unknown[],
  path: string,
): boolean {
  if (code !== 301) return false;
  const fail = (suffix: string, expected: string, actual: unknown): never => {
    throw new CommandStructureError("MV-E301", "Invalid Battle Processing saved parameters.", {
      nativePath: path + ".parameters" + suffix,
      expected,
      actual: describeValue(actual),
    });
  };
  if (p.length !== 4) fail("", "exactly four saved slots", p);
  if (![0, 1, 2].includes(p[0] as number) || Object.is(p[0], -0))
    fail("[0]", "troop mode 0, 1 or 2, excluding categorical negative zero", p[0]);
  if (
    p[0] === 2
      ? p[1] !== 0 || Object.is(p[1], -0)
      : !Number.isSafeInteger(p[1]) || (p[1] as number) < 1
  )
    fail("[1]", p[0] === 2 ? "exact structural zero" : "positive project reference ID", p[1]);
  for (const index of [2, 3])
    if (typeof p[index] !== "boolean") fail(`[${index}]`, "saved boolean", p[index]);
  return true;
}
