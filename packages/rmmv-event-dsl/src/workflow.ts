import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import type { EventDefinition } from "./dsl.js";
import { loadDefinitionFile } from "./definitions.js";
import {
  compileCommonEvent,
  compileMapEvent,
  validateDefinitions,
  type DefinitionBindingTarget,
} from "./events.js";
import { loadProject } from "./project.js";
import { loadWorkspace } from "./workspace.js";
import { writeStableJson } from "./writer.js";

export type WorkflowMode = "lint" | "create" | "replace";

export type WorkflowOptions = {
  workspaceRoot: string;
  mode: WorkflowMode;
  dryRun?: boolean;
  diff?: boolean;
};

export async function runWorkflow(options: WorkflowOptions): Promise<string[]> {
  const workspace = await loadWorkspace(options.workspaceRoot);
  const project = await loadProject(workspace.projectRoot);
  const output: string[] = [];
  const previewOnly = options.mode === "lint" || options.dryRun === true || options.diff === true;

  for (const binding of workspace.config.definitionTargets) {
    const definitionFile = resolve(workspace.workspaceRoot, binding.src);
    const definitions = await loadDefinitionFile(definitionFile);
    const selectedDefinitions = filterDefinitions(definitions, binding.target);
    const validation = validateDefinitions(selectedDefinitions, project.index, {
      scriptEnabled: workspace.config.scriptEnabled,
    });

    const blockingIssues = validation.issues.filter((issue) => issue.level === "error");
    if (blockingIssues.length > 0) {
      throw new Error(blockingIssues[0]?.message ?? "Validation failed.");
    }

    if (options.mode === "lint" || options.dryRun === true) {
      output.push(`${binding.src}: ${selectedDefinitions.length} definition(s) validated`);
      continue;
    }

    if (binding.target.type === "map") {
      const mapFilePath = join(
        project.dataDirectory,
        `Map${String(binding.target.mapId).padStart(3, "0")}.json`,
      );
      const before = JSON.parse(await readFile(mapFilePath, "utf8")) as Record<string, unknown>;
      const beforeEvents = Array.isArray(before.events) ? before.events : [];
      const definition = selectedDefinitions[0];

      if (!definition || definition.kind !== "mapEvent") {
        continue;
      }

      const compiled = compileMapEvent(definition, {
        nextId:
          options.mode === "create"
            ? ensureCreateSlot(beforeEvents, definition.name)
            : findExistingId(beforeEvents, definition.name),
        projectIndex: project.index,
      });
      const next = {
        ...before,
        events: replaceOrAppend(beforeEvents, compiled),
      };
      if (!previewOnly) {
        await writeFile(mapFilePath, writeStableJson(next), "utf8");
      }
      output.push(previewOnly ? buildDiffReport(mapFilePath, before, next) : mapFilePath);
    } else {
      const commonEventsPath = join(project.dataDirectory, "CommonEvents.json");
      const before = JSON.parse(await readFile(commonEventsPath, "utf8")) as unknown;
      const beforeEvents = Array.isArray(before) ? before : [];
      const definition = selectedDefinitions[0];

      if (!definition || definition.kind !== "commonEvent") {
        continue;
      }

      const compiled = compileCommonEvent(definition, {
        nextId:
          options.mode === "create"
            ? ensureCreateSlot(beforeEvents, definition.name)
            : findExistingId(beforeEvents, definition.name),
        projectIndex: project.index,
      });
      const next = replaceOrAppend(beforeEvents, compiled);
      if (!previewOnly) {
        await writeFile(commonEventsPath, writeStableJson(next), "utf8");
      }
      output.push(
        previewOnly ? buildDiffReport(commonEventsPath, beforeEvents, next) : commonEventsPath,
      );
    }
  }

  return output;
}

function filterDefinitions(
  definitions: EventDefinition[],
  target: DefinitionBindingTarget,
): EventDefinition[] {
  return definitions.filter((definition) => {
    if (target.type === "map") {
      return definition.kind === "mapEvent";
    }
    return definition.kind === "commonEvent";
  });
}

function replaceOrAppend<T extends { id: number }>(
  collection: readonly unknown[],
  entry: T,
): unknown[] {
  const output = collection.slice();
  output[entry.id] = entry;
  return output;
}

function getNextId(collection: readonly unknown[]): number {
  return collection.length;
}

function buildDiffReport(path: string, before: unknown, after: unknown): string {
  return [
    `diff -- ${path}`,
    ...toUnifiedDiffLines(writeStableJson(before), writeStableJson(after)),
  ].join("\n");
}

function toUnifiedDiffLines(before: string, after: string): string[] {
  const beforeLines = before.trimEnd().split("\n");
  const afterLines = after.trimEnd().split("\n");
  const lines: string[] = ["--- before", "+++ after", "@@ -1,1 +1,1 @@"];
  const max = Math.max(beforeLines.length, afterLines.length);

  for (let index = 0; index < max; index += 1) {
    const left = beforeLines[index];
    const right = afterLines[index];

    if (left === right) {
      if (left !== undefined) {
        lines.push(` ${left}`);
      }
      continue;
    }

    if (left !== undefined) {
      lines.push(`-${left}`);
    }
    if (right !== undefined) {
      lines.push(`+${right}`);
    }
  }

  return lines;
}

function ensureCreateSlot(collection: readonly unknown[], name: string): number {
  const existingId = findMatchingId(collection, name);
  if (existingId !== null) {
    throw new Error(`Duplicate target name: ${name}`);
  }

  return getNextId(collection);
}

function findExistingId(collection: readonly unknown[], name: string): number {
  const existingId = findMatchingId(collection, name);
  if (existingId === null) {
    throw new Error(`Missing target name: ${name}`);
  }

  return existingId;
}

function findMatchingId(collection: readonly unknown[], name: string): number | null {
  let foundId = -1;

  for (const [index, value] of collection.entries()) {
    if (!value || typeof value !== "object") {
      continue;
    }

    const record = value as Record<string, unknown>;
    if (record.name === name) {
      if (foundId !== -1) {
        throw new Error(`Ambiguous target name: ${name}`);
      }
      foundId = index;
    }
  }

  if (foundId === -1) {
    return null;
  }

  return foundId;
}
