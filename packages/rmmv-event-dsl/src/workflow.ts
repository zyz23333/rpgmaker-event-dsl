import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { loadDefinitionFile } from "./definitions.js";
import {
  compileCommonEvent,
  compileMapEvent,
  collectDefinitionsWithTarget,
  validateDefinitions,
} from "./events.js";
import type { EventDefinition } from "./dsl.js";
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

type PlannedWrite =
  | {
      kind: "map";
      filePath: string;
      before: Record<string, unknown>;
      after: Record<string, unknown>;
    }
  | {
      kind: "commonEvents";
      filePath: string;
      before: ReadonlyArray<unknown>;
      after: ReadonlyArray<unknown>;
    };

export async function runWorkflow(options: WorkflowOptions): Promise<string[]> {
  const workspace = await loadWorkspace(options.workspaceRoot);
  const project = await loadProject(workspace.projectRoot);
  const output: string[] = [];
  const previewOnly = options.mode === "lint" || options.dryRun === true || options.diff === true;
  const plans: PlannedWrite[] = [];

  for (const binding of workspace.config.definitionTargets) {
    const definitionFile = resolve(workspace.workspaceRoot, binding.src);
    const definitions = await loadDefinitionFile(definitionFile);
    const selectedDefinitions = collectDefinitionsWithTarget(definitions, binding.target);

    if (selectedDefinitions.length === 0) {
      throw new Error(`No Event Definitions matched target for ${binding.src}.`);
    }

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
      const filePath = join(
        project.dataDirectory,
        `Map${String(binding.target.mapId).padStart(3, "0")}.json`,
      );
      const before = JSON.parse(await readFile(filePath, "utf8")) as Record<string, unknown>;
      const beforeEvents = Array.isArray(before.events) ? before.events.slice() : [];
      const afterEvents = applyMapEventDefinitions(
        beforeEvents,
        selectedDefinitions,
        options.mode,
        project.index,
      );
      const after = {
        ...before,
        events: afterEvents,
      };

      plans.push({ kind: "map", filePath, before, after });
      output.push(previewOnly ? buildDiffReport(filePath, before, after) : filePath);
      continue;
    }

    const filePath = join(project.dataDirectory, "CommonEvents.json");
    const before = JSON.parse(await readFile(filePath, "utf8")) as ReadonlyArray<unknown>;
    const beforeEvents = Array.isArray(before) ? before.slice() : [];
    const after = applyCommonEventDefinitions(
      beforeEvents,
      selectedDefinitions,
      options.mode,
      project.index,
    );

    plans.push({ kind: "commonEvents", filePath, before: beforeEvents, after });
    output.push(previewOnly ? buildDiffReport(filePath, beforeEvents, after) : filePath);
  }

  if (previewOnly) {
    return output;
  }

  for (const plan of plans) {
    await writeFile(plan.filePath, writeStableJson(plan.after), "utf8");
  }

  return output;
}

function applyMapEventDefinitions(
  beforeEvents: ReadonlyArray<unknown>,
  definitions: ReadonlyArray<EventDefinition>,
  mode: WorkflowMode,
  projectIndex: Parameters<typeof compileMapEvent>[1]["projectIndex"],
): unknown[] {
  let stagedEvents = beforeEvents.slice();

  for (const definition of definitions) {
    if (definition.kind !== "mapEvent") {
      continue;
    }

    const compiled = compileMapEvent(definition, {
      nextId:
        mode === "create"
          ? ensureCreateSlot(stagedEvents, definition.name)
          : findExistingId(stagedEvents, definition.name),
      projectIndex,
    });
    stagedEvents = replaceOrAppend(stagedEvents, compiled);
  }

  return stagedEvents;
}

function applyCommonEventDefinitions(
  beforeEvents: ReadonlyArray<unknown>,
  definitions: ReadonlyArray<EventDefinition>,
  mode: WorkflowMode,
  projectIndex: Parameters<typeof compileCommonEvent>[1]["projectIndex"],
): unknown[] {
  let stagedEvents = beforeEvents.slice();

  for (const definition of definitions) {
    if (definition.kind !== "commonEvent") {
      continue;
    }

    const compiled = compileCommonEvent(definition, {
      nextId:
        mode === "create"
          ? ensureCreateSlot(stagedEvents, definition.name)
          : findExistingId(stagedEvents, definition.name),
      projectIndex,
    });
    stagedEvents = replaceOrAppend(stagedEvents, compiled);
  }

  return stagedEvents;
}

function replaceOrAppend<T extends { id: number }>(
  collection: ReadonlyArray<unknown>,
  entry: T,
): unknown[] {
  const output = collection.slice();
  output[entry.id] = entry;
  return output;
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

function ensureCreateSlot(collection: ReadonlyArray<unknown>, name: string): number {
  const existingId = findMatchingId(collection, name);
  if (existingId !== null) {
    throw new Error(`Duplicate target name: ${name}`);
  }

  return collection.length;
}

function findExistingId(collection: ReadonlyArray<unknown>, name: string): number {
  const existingId = findMatchingId(collection, name);
  if (existingId === null) {
    throw new Error(`Missing target name: ${name}`);
  }

  return existingId;
}

function findMatchingId(collection: ReadonlyArray<unknown>, name: string): number | null {
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

  return foundId === -1 ? null : foundId;
}
