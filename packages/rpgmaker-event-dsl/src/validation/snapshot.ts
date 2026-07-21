import type { CommonEventDefinition, SwitchDefinition, VariableDefinition } from "../dsl.js";
import type { ReferenceEntry } from "../staged-graph.js";

export function toReferenceEntry(
  declaration: CommonEventDefinition | SwitchDefinition | VariableDefinition,
): ReferenceEntry {
  return {
    id: declaration.id,
    name: declaration.name,
  };
}

export function readObjectReferenceEntries(
  values: readonly (Record<string, unknown> | null | undefined)[],
): ReferenceEntry[] {
  return values.flatMap((value) => {
    if (!value) {
      return [];
    }

    const id = readPositiveInteger(value.id);
    const name = readNonEmptyString(value.name);

    return id === null || name === null ? [] : [{ id, name }];
  });
}

export function readSystemNameEntries(
  system: Record<string, unknown>,
  key: "switches" | "variables",
): ReferenceEntry[] {
  const values = system[key];
  if (!Array.isArray(values)) {
    return [];
  }

  return values.flatMap((value, index) => {
    if (typeof value === "string") {
      return value.length > 0 ? [{ id: index, name: value }] : [];
    }
    if (!value || typeof value !== "object") {
      return [];
    }

    const name = readNonEmptyString((value as Record<string, unknown>).name);
    return name === null ? [] : [{ id: index, name }];
  });
}

export function readPositiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

export function readNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}
