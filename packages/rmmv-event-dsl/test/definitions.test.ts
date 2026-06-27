import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { loadDefinitionFile } from "../src/definitions.js";

describe("loadDefinitionFile", () => {
  it("loads a named Event Definition from a TypeScript module", async () => {
    const dir = await mkdtemp(join(tmpdir(), "rmmv-event-dsl-def-"));
    const file = join(dir, "sample.ts");

    await writeFile(
      file,
      `const entry = {
  kind: "mapEvent",
  name: "Gate",
  x: 1,
  y: 2,
  pages: [
    {
      conditions: {},
      trigger: "action",
      commands: [],
    },
  ],
};

export const gate = entry;
`,
      "utf8",
    );

    const definitions = await loadDefinitionFile(file);
    expect(definitions).toHaveLength(1);
    expect(definitions[0]?.name).toBe("Gate");
  });
});
