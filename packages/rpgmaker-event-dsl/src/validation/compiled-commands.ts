import { compileNodes } from "../compiler/dispatch.js";
import { CommandStructureError } from "./command-structure.js";
import type { StagedDataGraph, ValidationIssue } from "./types.js";

export function validateCompiledCommandLists(graph: StagedDataGraph, issues: ValidationIssue[]): void {
  for (const declaration of graph.declarations) {
    const lists = declaration.kind === "commonEvent"
      ? [{ commands: declaration.commands, identity: `commonEvent:${declaration.id}`, path: "commands" }]
      : declaration.kind === "mapEvent"
        ? declaration.pages.map((page, index) => ({
            commands: page.commands,
            identity: `map:${declaration.mapId}/event:${declaration.id}`,
            path: `pages[${index}].commands`,
          }))
        : [];
    for (const list of lists) {
      try {
        compileNodes(list.commands, 0, graph.resolver, true, list.path);
      } catch (error) {
        if (error instanceof CommandStructureError) issues.push(error.issue(list.identity, "compile"));
        // Other families report their parameter/reference failures through their own validators.
      }
    }
  }
}
