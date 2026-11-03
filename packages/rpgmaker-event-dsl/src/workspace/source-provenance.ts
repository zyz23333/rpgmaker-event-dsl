export type SourceLocation = { file: string; line: number; column: number };
export type SourceUse = {
  location: SourceLocation;
  call?: { name: string; definition: SourceLocation };
};
export type CapturedSource = { source: SourceLocation; uses: readonly SourceUse[] };

const capturedSources = new WeakMap<object, CapturedSource>();

export function rememberCapturedLocation(value: unknown, source: SourceLocation): void {
  if (value !== null && typeof value === "object") capturedSources.set(value, { source, uses: [] });
}

export function capturedSource(value: unknown): CapturedSource | undefined {
  return value !== null && typeof value === "object" ? capturedSources.get(value) : undefined;
}

/** Pure authored data gets a separate occurrence at each use. Preserve own fields,
 * array holes, undefined and -0; opaque author-function tokens remain untouched. */
export function captureSourceUse(
  value: unknown,
  use: SourceUse,
  opaque: (value: object) => boolean,
): unknown {
  const copies = new Map<object, object>();
  function copy(input: unknown): unknown {
    if (input === null || typeof input !== "object" || opaque(input)) return input;
    const previous = copies.get(input);
    if (previous) return previous;
    const result: object = Array.isArray(input) ? [] : Object.create(Object.getPrototypeOf(input));
    copies.set(input, result);
    for (const key of Reflect.ownKeys(input)) {
      if (Array.isArray(input) && key === "length") continue;
      const descriptor = Object.getOwnPropertyDescriptor(input, key)!;
      if ("value" in descriptor) descriptor.value = copy(descriptor.value);
      Object.defineProperty(result, key, descriptor);
    }
    if (Array.isArray(input)) (result as unknown[]).length = input.length;
    const origin = capturedSources.get(input);
    if (origin) capturedSources.set(result, { source: origin.source, uses: [...origin.uses, use] });
    return result;
  }
  return copy(value);
}

function renderLocation(location: SourceLocation): string {
  return `${location.file} (line ${location.line}, column ${location.column})`;
}

export function renderCapturedSource(origin: CapturedSource | undefined): string {
  if (!origin) return "";
  return `; source: ${renderLocation(origin.source)}${origin.uses
    .map((use) =>
      use.call
        ? `; call ${use.call.name}: ${renderLocation(use.location)}; defined: ${renderLocation(use.call.definition)}`
        : `; use: ${renderLocation(use.location)}`,
    )
    .join("")}`;
}
