import type { ReferenceResolver } from "../../validation/types.js";
import { CommandStructureError } from "../../validation/command-errors.js";
import { describeValue } from "../../project-data/json-values.js";

export function assertPictureReferences(
  code: number,
  parameters: readonly unknown[],
  resolver: ReferenceResolver,
  location: { dslPath?: string; nativePath?: string },
): void {
  if ((code !== 231 && code !== 232) || parameters[3] !== 1) return;
  for (const index of [4, 5])
    try {
      resolver.resolveReference({ kind: "variable", id: parameters[index] as number });
    } catch (error) {
      const suffix = `.parameters[${index}]`;
      throw new CommandStructureError(
        `MV-E${code}-REFERENCE`,
        error instanceof Error ? error.message : String(error),
        {
          ...(location.dslPath ? { dslPath: location.dslPath + suffix } : {}),
          ...(location.nativePath ? { nativePath: location.nativePath + suffix } : {}),
          expected: "existing System Variable Slot",
          actual: describeValue(parameters[index]),
        },
      );
    }
}
