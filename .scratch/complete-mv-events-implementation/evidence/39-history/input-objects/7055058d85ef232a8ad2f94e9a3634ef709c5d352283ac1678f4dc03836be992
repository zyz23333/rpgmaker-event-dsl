import { isDeepStrictEqual } from "node:util";

export function describeMapEventChanges(generated: unknown, snapshot: unknown): string {
  const changes: string[] = [];
  const describe = (value: unknown, present: boolean) =>
    present ? JSON.stringify(value) : "<absent>";
  const visit = (
    before: unknown,
    after: unknown,
    path: string,
    beforePresent = true,
    afterPresent = true,
  ): void => {
    if (beforePresent === afterPresent && isDeepStrictEqual(before, after)) return;
    if (beforePresent && afterPresent && Array.isArray(before) && Array.isArray(after)) {
      if (before.length !== after.length) visit(before.length, after.length, `${path}.length`);
      for (let index = 0; index < Math.max(before.length, after.length); index++)
        visit(
          before[index],
          after[index],
          `${path}[${index}]`,
          Object.hasOwn(before, index),
          Object.hasOwn(after, index),
        );
      return;
    }
    if (
      beforePresent &&
      afterPresent &&
      before &&
      after &&
      typeof before === "object" &&
      typeof after === "object" &&
      !Array.isArray(before) &&
      !Array.isArray(after)
    ) {
      const left = before as Record<string, unknown>;
      const right = after as Record<string, unknown>;
      for (const key of [...new Set([...Object.keys(left), ...Object.keys(right)])].sort())
        visit(
          left[key],
          right[key],
          path ? `${path}.${key}` : key,
          Object.hasOwn(left, key),
          Object.hasOwn(right, key),
        );
      return;
    }
    const page = /^pages\[(\d+)\]/u.exec(path);
    changes.push(
      `\n  - ${path}${page ? ` (page ${Number(page[1]) + 1})` : ""}: ${describe(before, beforePresent)} -> ${describe(after, afterPresent)}`,
    );
  };
  visit(snapshot, generated, "");
  return changes.join("");
}
