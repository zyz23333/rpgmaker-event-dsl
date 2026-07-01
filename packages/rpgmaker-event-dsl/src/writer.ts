export function writeStableJson(value: unknown): string {
  return `${stringify(value)}\n`;
}

function stringify(value: unknown, indent = 0): string {
  if (value === null) {
    return "null";
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "[]";
    }
    const nextIndent = indent + 2;
    const entries = value.map(
      (entry) => `${" ".repeat(nextIndent)}${stringify(entry, nextIndent)}`,
    );
    return `[\n${entries.join(",\n")}\n${" ".repeat(indent)}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return "{}";
    }
    const nextIndent = indent + 2;
    const lines = entries.map(([key, entry]) => {
      return `${" ".repeat(nextIndent)}${JSON.stringify(key)}:${stringify(entry, nextIndent)}`;
    });
    return `{\n${lines.join(",\n")}\n${" ".repeat(indent)}}`;
  }

  return "null";
}
