import type { ReferenceKind, ReferenceValue } from "../dsl.js";
import {
  isAssetReference,
  isProjectDataReference,
  isRuntimeSelector,
  isScriptInput,
} from "../dsl.js";
import type { CommandInputPrimitiveInspection } from "../staged-graph.js";

export function collectCommandInputPrimitives(
  value: unknown,
  inspection: CommandInputPrimitiveInspection,
  seen: Set<object>,
): void {
  if (!value || typeof value !== "object") {
    return;
  }
  if (seen.has(value)) {
    return;
  }

  seen.add(value);

  if (isProjectDataReference(value)) {
    inspection.projectDataReferences.push(value);
    return;
  }
  if (isAssetReference(value)) {
    inspection.assetReferences.push(value);
    return;
  }
  if (isRuntimeSelector(value)) {
    inspection.runtimeSelectors.push(value);
    return;
  }
  if (isScriptInput(value)) {
    inspection.scriptInputs.push(value);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectCommandInputPrimitives(item, inspection, seen);
    }
    return;
  }

  for (const nestedValue of Object.values(value)) {
    collectCommandInputPrimitives(nestedValue, inspection, seen);
  }
}

export function isReferenceValue(value: unknown): value is ReferenceValue<ReferenceKind> {
  return isProjectDataReference(value);
}
