import type { ReferenceEntry, ValidationIssue, DuplicateAwareNameIndex } from "./types.js";

export function buildDuplicateAwareNameIndex(
  entries: readonly ReferenceEntry[],
): DuplicateAwareNameIndex {
  const index: DuplicateAwareNameIndex = new Map();

  for (const entry of entries) {
    const existing = index.get(entry.name);
    if (existing) {
      existing.push(entry.id);
    } else {
      index.set(entry.name, [entry.id]);
    }
  }

  return index;
}

export function captureReferenceIssue(callback: () => number, issues: ValidationIssue[]): void {
  try {
    callback();
  } catch (error) {
    issues.push({
      level: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
