import type { ReferenceResolver } from "../../validation/types.js";

export function assertNativeSwitchCommand(
  code: number,
  parameters: readonly unknown[],
  resolver?: ReferenceResolver,
): void {
  if (code !== 121 && code !== 123) return;
  const label = `MV-E${code}`;
  if (!Array.isArray(parameters) || parameters.length !== (code === 121 ? 3 : 2)) {
    throw new Error(
      `${label}-PARAMETERS parameters: expected exactly ${code === 121 ? 3 : 2} saved slots; received ${JSON.stringify(parameters)}.`,
    );
  }
  const operation = parameters[code === 121 ? 2 : 1];
  if (operation !== 0 && operation !== 1) {
    throw new Error(
      `${label}-VALUE parameters[${code === 121 ? 2 : 1}]: expected native ON 0 or OFF 1; received ${JSON.stringify(operation)}.`,
    );
  }
  if (code === 123) {
    if (!["A", "B", "C", "D"].includes(parameters[0] as string)) {
      throw new Error(
        `${label}-LETTER parameters[0]: expected A, B, C or D; received ${JSON.stringify(parameters[0])}.`,
      );
    }
    return;
  }
  const [from, to] = parameters;
  if (
    !Number.isSafeInteger(from) ||
    (from as number) <= 0 ||
    !Number.isSafeInteger(to) ||
    (to as number) <= 0
  ) {
    throw new Error(
      `${label}-TARGET parameters[0..1]: expected positive integer switch IDs; received ${JSON.stringify(parameters.slice(0, 2))}.`,
    );
  }
  if ((from as number) > (to as number)) {
    throw new Error(
      `${label}-RANGE parameters[0..1]: range start ${from} exceeds end ${to}; ranges are not reordered.`,
    );
  }
  if (resolver !== undefined) {
    for (const [index, id] of [from, to].entries()) {
      try {
        resolver.resolveReference({ kind: "switch", id: id as number });
      } catch (error) {
        throw new Error(
          `${label}-REFERENCE parameters[${index}]: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
}
