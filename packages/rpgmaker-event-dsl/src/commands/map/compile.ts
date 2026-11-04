import type {
  LocationDirection,
  TransferFade,
  ReferenceKind,
  ReferenceValue,
} from "../../domain/types.js";
import type { ReferenceResolver } from "../../validation/types.js";
import { CommandStructureError } from "../../validation/command-errors.js";
import { describeValue } from "../../project-data/json-values.js";

export function resolveLocationReference(
  ref: ReferenceValue<ReferenceKind>,
  resolver: ReferenceResolver,
  path: string,
  code: number,
): number {
  try {
    return resolver.resolveReference(ref);
  } catch (error) {
    throw new CommandStructureError(
      `MV-E${code}-REFERENCE`,
      error instanceof Error ? error.message : String(error),
      {
        dslPath: path,
        expected: `existing ${ref.kind} Project Data Reference`,
        actual: describeValue(ref),
      },
    );
  }
}

export function locationDirectionToCode(direction: LocationDirection | undefined): number {
  return { retain: 0, down: 2, left: 4, right: 6, up: 8 }[direction ?? "retain"];
}

export function transferFadeToCode(fade: TransferFade | undefined): number {
  return { black: 0, white: 1, none: 2 }[fade ?? "black"];
}
