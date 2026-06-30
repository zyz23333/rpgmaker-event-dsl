import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { discoverDefinitionFiles, loadDefinitionFile } from "../src/definitions.js";

describe("loadDefinitionFile", () => {
  it("loads a named Event Definition from a TypeScript module", async () => {
    const dir = await mkdtemp(join(tmpdir(), "rpgmaker-event-dsl-def-"));
    const file = join(dir, "sample.ts");

    await writeFile(
      file,
      `const entry = {
  kind: "mapEvent",
  mapId: 1,
  id: 1,
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

  it("loads DSL-owned declarations from a TypeScript module", async () => {
    const dir = await mkdtemp(join(tmpdir(), "rpgmaker-event-dsl-def-"));
    const file = join(dir, "owned.ts");
    const packageRoot = join(dir, "node_modules", "rpgmaker-event-dsl");
    await mkdir(packageRoot, { recursive: true });
    await writeFile(
      join(packageRoot, "package.json"),
      JSON.stringify(
        {
          name: "rpgmaker-event-dsl",
          type: "module",
          types: "./index.d.ts",
          exports: {
            ".": {
              types: "./index.d.ts",
              default: "./index.js",
            },
          },
        },
        null,
        2,
      ),
      "utf8",
    );
    await writeFile(
      join(packageRoot, "index.d.ts"),
      `export declare function commonEvent(input: {
  id: number;
  name: string;
  trigger: "none" | "autorun" | "parallel";
  commands: readonly unknown[];
}): { kind: "commonEvent"; id: number; name: string };

export declare function switchDefinition(input: {
  id: number;
  name: string;
}): { kind: "switchDefinition"; id: number; name: string };

export declare function variableDefinition(input: {
  id: number;
  name: string;
}): { kind: "variableDefinition"; id: number; name: string };
`,
      "utf8",
    );

    await writeFile(
      file,
      `import { commonEvent, switchDefinition, variableDefinition } from "rpgmaker-event-dsl";

export const alarm = commonEvent({
  id: 1,
  name: "Alarm",
  trigger: "none",
  commands: [],
});

export const gate = switchDefinition({
  id: 2,
  name: "Gate",
});

export const count = variableDefinition({
  id: 3,
  name: "Count",
});
`,
      "utf8",
    );

    const definitions = await loadDefinitionFile(file);
    expect(definitions.map((definition) => definition.kind)).toEqual([
      "commonEvent",
      "switchDefinition",
      "variableDefinition",
    ]);
  });

  it("preserves nested array literals in DSL command input", async () => {
    const dir = await mkdtemp(join(tmpdir(), "rpgmaker-event-dsl-def-"));
    const file = join(dir, "nested-arrays.ts");

    await writeFile(
      file,
      `export const event = {
  kind: "mapEvent",
  mapId: 1,
  id: 1,
  name: "Choice",
  x: 1,
  y: 2,
  pages: [
    {
      conditions: {},
      trigger: "action",
      commands: [
        {
          kind: "showChoices",
          choices: ["Yes", "No"],
          branches: [
            [{ kind: "wait", frames: 10 }],
            [{ kind: "eraseEvent" }],
          ],
        },
      ],
    },
  ],
};
`,
      "utf8",
    );

    const definitions = await loadDefinitionFile(file);
    const event = definitions[0];

    expect(event?.kind).toBe("mapEvent");
    if (event?.kind !== "mapEvent") {
      return;
    }

    const choices = event.pages[0]?.commands[0];

    expect(choices?.kind).toBe("showChoices");
    if (choices?.kind !== "showChoices") {
      return;
    }
    expect(choices.branches).toEqual([[{ kind: "wait", frames: 10 }], [{ kind: "eraseEvent" }]]);
  });

  it("rejects default exports with a TypeScript diagnostics error", async () => {
    const dir = await mkdtemp(join(tmpdir(), "rpgmaker-event-dsl-def-"));
    const file = join(dir, "default-export.ts");

    await writeFile(
      file,
      `export default {
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
`,
      "utf8",
    );

    await expect(loadDefinitionFile(file)).rejects.toThrow("TypeScript diagnostics failed for");
  });
});

describe("discoverDefinitionFiles", () => {
  it("discovers DSL declaration files from sourceRoot and ignores helper modules", async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), "rpgmaker-event-dsl-discovery-"));
    const sourceRoot = join(workspaceRoot, "src");
    await writeFile(join(workspaceRoot, "rpgmaker-event-dsl.config.json"), "{}", "utf8");
    await mkdir(sourceRoot, { recursive: true });
    await writeFile(join(sourceRoot, "ignored.ts"), "export const helper = 1;\n", "utf8");
    await writeFile(join(sourceRoot, "alpha.events.ts"), "export const alpha = 1;\n", "utf8");
    await writeFile(join(sourceRoot, "beta.dsl.ts"), "export const beta = 2;\n", "utf8");
    await writeFile(join(sourceRoot, "sample.test.ts"), "export const test = 3;\n", "utf8");
    await writeFile(join(sourceRoot, "sample.d.ts"), "export {};\n", "utf8");

    const files = await discoverDefinitionFiles(workspaceRoot, {
      sourceRoot: "src",
      sourceInclude: ["**/*.events.ts", "**/*.dsl.ts"],
      sourceExclude: ["**/*.test.ts", "**/*.spec.ts", "**/*.d.ts"],
    });

    expect(files).toEqual([join(sourceRoot, "alpha.events.ts"), join(sourceRoot, "beta.dsl.ts")]);
  });
});
