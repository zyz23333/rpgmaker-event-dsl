import type { ReferenceKind } from "../domain/references.js";
import type { ReferenceResolver } from "./types.js";

// These existing commands exercise Snapshot context assembly. Their command-family
// validators own the remaining saved slots, enums and execution-context warnings.
export function assertNativeContextReferences(
  code: number,
  parameters: readonly unknown[],
  resolver: ReferenceResolver,
): void {
  let reference: { kind: ReferenceKind; index: number };
  switch (code) {
    case 212:
      reference = { kind: "animation", index: 1 };
      break;
    case 282:
      reference = { kind: "tileset", index: 0 };
      break;
    case 336:
      reference = { kind: "enemy", index: 1 };
      break;
    default:
      return;
  }
  try {
    resolver.resolveReference({ kind: reference.kind, id: parameters[reference.index] as number });
  } catch (error) {
    throw new Error(
      `MV-E${code}-REFERENCE parameters[${reference.index}]: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
