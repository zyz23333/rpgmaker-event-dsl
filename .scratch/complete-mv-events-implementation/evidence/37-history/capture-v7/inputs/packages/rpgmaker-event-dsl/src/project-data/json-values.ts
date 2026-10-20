export class StrictJsonError extends Error {
  constructor(
    readonly path: string,
    readonly actual: string,
  ) {
    super(`Expected strict representable JSON; received ${actual} at ${path}.`);
  }
}

export function describeValue(value: unknown): string {
  try {
    return renderJsonValue(value);
  } catch (error) {
    return error instanceof StrictJsonError ? error.actual : String(value);
  }
}

export function assertStrictJson(
  value: unknown,
  path = "value",
  ancestors = new Set<object>(),
): void {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number" && Number.isFinite(value)) return;
  if (typeof value !== "object" || value === null)
    throw new StrictJsonError(path, typeof value === "number" ? String(value) : typeof value);
  if (ancestors.has(value)) throw new StrictJsonError(path, "circular reference");
  if (
    Array.isArray(value)
      ? Object.getPrototypeOf(value) !== Array.prototype
      : ![Object.prototype, null].includes(Object.getPrototypeOf(value))
  )
    throw new StrictJsonError(path, "non-JSON object prototype");
  ancestors.add(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Reflect.ownKeys(value);
  if (Array.isArray(value)) {
    if (
      keys.some(
        (key) =>
          key !== "length" &&
          (typeof key !== "string" || !/^(0|[1-9]\d*)$/.test(key) || Number(key) >= value.length),
      )
    )
      throw new StrictJsonError(path, "array with extra properties");
    for (let index = 0; index < value.length; index++) {
      const descriptor = descriptors[String(index)];
      if (!descriptor || !("value" in descriptor) || !descriptor.enumerable)
        throw new StrictJsonError(
          `${path}[${index}]`,
          descriptor ? "non-JSON property" : "missing array slot",
        );
      assertStrictJson(descriptor.value, `${path}[${index}]`, ancestors);
    }
  } else
    for (const key of keys) {
      if (typeof key !== "string") throw new StrictJsonError(path, "symbol property");
      const childPath = /^[A-Za-z_$][\w$]*$/.test(key)
        ? `${path}.${key}`
        : `${path}[${JSON.stringify(key)}]`;
      const descriptor = descriptors[key]!;
      if (!("value" in descriptor) || !descriptor.enumerable)
        throw new StrictJsonError(childPath, "non-JSON property");
      assertStrictJson(descriptor.value, childPath, ancestors);
    }
  ancestors.delete(value);
}

// JSON permits the -0 token; JSON.stringify silently changes its parsed numeric value.
export function renderJsonValue(value: unknown, options: { typeScript?: boolean } = {}): string {
  assertStrictJson(value);
  return render(value, options.typeScript ?? false);
}

function render(value: unknown, typeScript: boolean): string {
  if (Object.is(value, -0)) return "-0";
  if (Array.isArray(value)) return `[${value.map((entry) => render(entry, typeScript)).join(",")}]`;
  if (typeof value === "object" && value !== null)
    return `{${Object.entries(value)
      .map(
        ([key, entry]) =>
          `${typeScript && key === "__proto__" ? '["__proto__"]' : JSON.stringify(key)}:${render(entry, typeScript)}`,
      )
      .join(",")}}`;
  return JSON.stringify(value);
}
