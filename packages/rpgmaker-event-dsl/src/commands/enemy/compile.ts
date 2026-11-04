import type { ConstantOperand, VariableOperand } from "../../domain/references.js";
import type { ReferenceResolver } from "../../validation/types.js";

export function compileEnemyResourceValue(
  operation: "gain" | "lose",
  value: ConstantOperand | VariableOperand,
  resolver: ReferenceResolver,
): number[] {
  return [
    operation === "gain" ? 0 : 1,
    value.kind === "constant" ? 0 : 1,
    value.kind === "constant" ? value.value : resolver.resolveReference(value.variable),
  ];
}
