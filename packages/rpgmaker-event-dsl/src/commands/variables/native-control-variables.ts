import { CommandStructureError } from "../../validation/command-errors.js";
import { describeValue } from "../../project-data/json-values.js";

/** Native mode slots have a finite shape; numeric saved values retain negative zero. */
export function assertNativeControlVariables(parameters: readonly unknown[], path: string): void {
  const fail = (code: string, index: number | undefined, expected: string): never => {
    throw new CommandStructureError(
      `MV-E122-${code}`,
      "Invalid Control Variables saved parameters.",
      {
        nativePath: `${path}.parameters${index === undefined ? "" : `[${index}]`}`,
        expected,
        actual: describeValue(index === undefined ? parameters : parameters[index]),
      },
    );
  };
  const integer = (i: number, min: number, max = Number.MAX_SAFE_INTEGER) => {
    if (
      !Number.isSafeInteger(parameters[i]) ||
      Number(parameters[i]) < min ||
      Number(parameters[i]) > max
    )
      fail("VALUE", i, `integer ${min}..${max}`);
  };
  const symbol = (i: number, min: number, max: number) => {
    integer(i, min, max);
    if (Object.is(parameters[i], -0)) fail("ENUM", i, "symbolic code excluding negative zero");
  };
  const mode = parameters[3];
  const length = mode === 2 ? 6 : mode === 3 ? 7 : 5;
  if (parameters.length !== length)
    fail("PARAMETERS", undefined, `exactly ${length} slots for operand mode ${String(mode)}`);
  integer(0, 1);
  integer(1, 1);
  if (Number(parameters[0]) > Number(parameters[1]))
    fail("RANGE", 1, "range end >= start; ranges are not reordered");
  symbol(2, 0, 5);
  symbol(3, 0, 4);
  if (mode === 0 || mode === 2) {
    integer(4, -99999999, 99999999);
    if (mode === 2) {
      integer(5, -99999999, 99999999);
      if (Number(parameters[4]) > Number(parameters[5]))
        fail("RANGE", 5, "random to >= from; endpoints are not reordered");
    }
  } else if (mode === 1) integer(4, 1);
  else if (mode === 4) {
    if (typeof parameters[4] !== "string") fail("SCRIPT", 4, "complete script string");
  } else {
    symbol(4, 0, 7);
    const source = parameters[4];
    if (source === 0 || source === 1 || source === 2 || source === 3) integer(5, 1);
    if (source === 4 || source === 6) integer(5, 0, 7);
    if (source === 5) symbol(5, -1, Number.MAX_SAFE_INTEGER);
    if (source === 7) symbol(5, 0, 9);
    if (source === 3) symbol(6, 0, 11);
    else if (source === 4) symbol(6, 0, 9);
    else if (source === 5) symbol(6, 0, 4);
    else if (!Object.is(parameters[6], 0)) fail("PADDING", 6, "exact structural +0");
  }
}
