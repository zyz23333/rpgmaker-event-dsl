import { isDslOwnedDeclaration, type DslOwnedDeclaration } from "../domain/declarations.js";
import { assertCommonEventInput } from "./common-events.js";

export function collectDslOwnedDeclarations(
  moduleExports: Record<string, unknown>,
): DslOwnedDeclaration[] {
  const definitions: DslOwnedDeclaration[] = [];
  for (const [name, value] of Object.entries(moduleExports)) {
    if (name === "default") {
      throw new Error("Default export is not allowed for DSL-owned declarations.");
    }
    if (isDslOwnedDeclaration(value)) {
      if (value.kind === "commonEvent") assertCommonEventInput(value, true);
      definitions.push(value);
    }
  }
  return definitions;
}
