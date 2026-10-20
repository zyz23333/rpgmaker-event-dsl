import { glob, readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import * as ts from "typescript";
import { describe, expect, it } from "vitest";

const sourceRoot = fileURLToPath(new URL("../src/", import.meta.url));

async function readSourceGraph(): Promise<Map<string, string[]>> {
  const files: string[] = [];
  for await (const file of glob("**/*.ts", { cwd: sourceRoot })) {
    files.push(file);
  }
  const fileSet = new Set(files.map((file) => resolve(sourceRoot, file)));
  const graph = new Map<string, string[]>();

  for (const relativeFile of files) {
    const filePath = resolve(sourceRoot, relativeFile);
    const source = ts.createSourceFile(
      filePath,
      await readFile(filePath, "utf8"),
      ts.ScriptTarget.ES2023,
      true,
      ts.ScriptKind.TS,
    );
    const dependencies: string[] = [];

    for (const statement of source.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
        continue;
      }

      const specifier = statement.moduleSpecifier.text;
      if (!specifier.startsWith(".")) {
        continue;
      }

      const target = resolve(dirname(filePath), specifier.replace(/\.js$/u, ".ts"));
      if (fileSet.has(target)) {
        dependencies.push(target);
      }
    }

    graph.set(filePath, dependencies);
  }

  return graph;
}

function assertAcyclic(graph: Map<string, string[]>): void {
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (filePath: string): void => {
    if (visiting.has(filePath)) {
      throw new Error(`Internal module cycle detected at ${relative(sourceRoot, filePath)}.`);
    }
    if (visited.has(filePath)) {
      return;
    }

    visiting.add(filePath);
    for (const dependency of graph.get(filePath) ?? []) {
      visit(dependency);
    }
    visiting.delete(filePath);
    visited.add(filePath);
  };

  for (const filePath of graph.keys()) {
    visit(filePath);
  }
}

describe("module architecture", () => {
  it("keeps the migrated source tree acyclic and free of transitional facades", async () => {
    const graph = await readSourceGraph();
    assertAcyclic(graph);

    const relativeFiles = [...graph.keys()].map((filePath) =>
      relative(sourceRoot, filePath).replaceAll("\\", "/"),
    );
    expect(relativeFiles).not.toContain("dsl.ts");
    expect(relativeFiles).not.toContain("decompiler.ts");
    expect(relativeFiles).not.toContain("workflow.ts");
    expect(relativeFiles).not.toContain("staged-graph.ts");
  });

  it("keeps command-family modules below their dispatchers", async () => {
    const graph = await readSourceGraph();

    for (const [filePath, dependencies] of graph) {
      const relativeFile = relative(sourceRoot, filePath).replaceAll("\\", "/");
      if (!relativeFile.startsWith("commands/")) {
        continue;
      }

      for (const dependency of dependencies) {
        const relativeDependency = relative(sourceRoot, dependency).replaceAll("\\", "/");
        expect(relativeDependency).not.toBe("compiler/dispatch.ts");
        expect(relativeDependency).not.toBe("decompiler/dispatch.ts");
        expect(relativeDependency).not.toBe("validation/staged-graph.ts");
      }
    }
  });
});
