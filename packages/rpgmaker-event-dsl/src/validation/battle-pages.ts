import type { BattleEventPage, TroopEventDefinition } from "../domain/types.js";
import type { ReferenceResolver, StagedDataGraph, ValidationIssue } from "./types.js";
import { validateNodes } from "./commands.js";
import { blankBattleEventPage } from "../domain/battle-page-defaults.js";
import type { RawEventCommand } from "../compiler/types.js";
import { CommandStructureError } from "./command-errors.js";
import { renderJsonValue } from "../project-data/json-values.js";

class BattlePageInputError extends Error {
  constructor(
    readonly path: string,
    readonly expected: string,
    readonly actual: string,
  ) {
    super(`${path}: expected ${expected}; actual ${actual}.`);
  }
}
function location(error: unknown, fallback: string) {
  return error instanceof BattlePageInputError
    ? { dslPath: error.path, expected: error.expected, actual: error.actual }
    : { dslPath: fallback };
}

export function validateBattlePages(
  definition: TroopEventDefinition,
  graph: StagedDataGraph,
  options: { scriptEnabled: boolean },
  issues: ValidationIssue[],
): void {
  const identity = `troop:${definition.troopId}`;
  const members = graph.snapshotTroops?.find(({ id }) => id === definition.troopId)?.members;
  try {
    object(definition, ["kind", "troopId", "pages"], ["kind", "troopId", "pages"], identity);
    densePages(definition.pages, `${identity}.pages`);
  } catch (error) {
    issues.push({
      level: "error",
      identity,
      stage: "compile",
      code: "MV-BATTLE-PAGE-INPUT",
      ...location(error, "pages"),
      message: String(error),
    });
    return;
  }
  if (definition.pages.length > 20)
    issues.push({
      level: "warning",
      identity,
      dslPath: "pages",
      message: `${identity}: ${definition.pages.length} Battle Event Pages exceed the editor's 20-page picker; all pages are preserved.`,
    });
  for (const [pageIndex, page] of definition.pages.entries()) {
    try {
      assertBattlePageInput(page, graph.resolver, `pages[${pageIndex}]`);
    } catch (error) {
      issues.push({
        level: "error",
        identity,
        stage: "compile",
        code: "MV-BATTLE-PAGE-INPUT",
        ...location(error, `pages[${pageIndex}]`),
        message: `${identity}: ${error instanceof Error ? error.message : String(error)}`,
      });
      continue;
    }
    const condition = page.conditions?.enemy;
    if (condition?.enabled) {
      if (
        !Array.isArray(members) ||
        !Number.isSafeInteger(condition.index) ||
        condition.index < 0 ||
        condition.index >= members.length
      ) {
        issues.push({
          level: "error",
          code: "MV-BATTLE-ENEMY-POSITION",
          stage: "compile",
          identity,
          nativePath: `pages[${pageIndex}].conditions.enemyIndex`,
          dslPath: `pages[${pageIndex}].conditions.enemy.index`,
          message: `${identity}: enabled enemy condition requires existing member position ${condition.index}.`,
        });
      }
      if (Array.isArray(members))
        for (const [index, member] of members.entries()) {
          const enemyId =
            member && typeof member === "object" && "enemyId" in member
              ? member.enemyId
              : undefined;
          try {
            graph.resolver.resolveReference({ kind: "enemy", id: enemyId as number });
          } catch (error) {
            issues.push({
              level: "error",
              code: "MV-BATTLE-MEMBER-ENEMY",
              stage: "compile",
              identity,
              nativePath: `members[${index}].enemyId`,
              dslPath: `pages[${pageIndex}].conditions.enemy`,
              message: `${identity}: member position ${index} has invalid Enemy ${String(enemyId)}: ${error instanceof Error ? error.message : String(error)}`,
            });
          }
        }
    }
    validateNodes(
      page.commands,
      graph.resolver,
      { ...options, identity, path: `pages[${pageIndex}].commands` },
      issues,
    );
  }
}

export function assertBattlePageInput(
  value: unknown,
  resolver: ReferenceResolver,
  path = "page",
): asserts value is BattleEventPage {
  const page = object(value, ["conditions", "span", "commands"], ["commands"], path);
  if (!Array.isArray(page.commands)) fail(`${path}.commands`, "command array", page.commands);
  if (page.span !== undefined && !["battle", "turn", "moment"].includes(page.span as string))
    fail(`${path}.span`, "battle, turn or moment", page.span);
  if (page.conditions === undefined) return;
  const conditions = object(
    page.conditions,
    ["turnEnd", "turn", "enemy", "actor", "switch"],
    [],
    `${path}.conditions`,
  );
  if ("turnEnd" in conditions) boolean(conditions.turnEnd, `${path}.conditions.turnEnd`);
  for (const slot of ["turn", "enemy", "actor", "switch"] as const) {
    if (!(slot in conditions)) continue;
    const slotPath = `${path}.conditions.${slot}`;
    const fields =
      slot === "turn"
        ? ["enabled", "a", "b"]
        : slot === "enemy"
          ? ["enabled", "index", "hpAtMost"]
          : slot === "actor"
            ? ["enabled", "ref", "hpAtMost"]
            : ["enabled", "ref"];
    const condition = object(conditions[slot], fields, fields, slotPath);
    boolean(condition.enabled, `${slotPath}.enabled`);
    if (slot === "turn") {
      integer(condition.a, 0, 9999, `${slotPath}.a`);
      integer(condition.b, 0, 9999, `${slotPath}.b`);
    }
    if (slot === "enemy") integer(condition.index, 0, Number.MAX_SAFE_INTEGER, `${slotPath}.index`);
    if (slot === "actor" || slot === "enemy")
      integer(condition.hpAtMost, 0, 100, `${slotPath}.hpAtMost`);
    if (slot === "actor" || slot === "switch") {
      const ref = object(condition.ref, ["kind", "id", "name"], ["kind"], `${slotPath}.ref`);
      if (ref.kind !== slot || "id" in ref === "name" in ref)
        fail(`${slotPath}.ref`, `one ${slot} ID or name reference`, ref);
      if ("id" in ref)
        integer(ref.id, condition.enabled ? 1 : 0, Number.MAX_SAFE_INTEGER, `${slotPath}.ref.id`);
      else if (typeof ref.name !== "string" || ref.name.length === 0)
        fail(`${slotPath}.ref.name`, "nonempty name", ref.name);
      if (condition.enabled || !("id" in ref))
        resolveSavedReference(resolver, ref, `${slotPath}.ref`);
    }
  }
}

function resolveSavedReference(
  resolver: ReferenceResolver,
  ref: Record<string, unknown>,
  path: string,
  actual: unknown = ref,
): void {
  try {
    resolver.resolveReference(ref as never);
  } catch {
    fail(path, `existing ${String(ref.kind)} reference`, actual);
  }
}

function fail(path: string, expected: string, actual?: unknown): never {
  let text: string;
  try {
    text = actual === undefined ? "absent/undefined" : renderJsonValue(actual);
  } catch {
    text = String(actual);
  }
  throw new BattlePageInputError(path, expected, text);
}
function object(
  value: unknown,
  allowed: readonly string[],
  required: readonly string[],
  path: string,
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(path, "object", value);
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record))
    if (!allowed.includes(key)) fail(`${path}.${key}`, "supported field", record[key]);
  for (const key of required)
    if (!Object.hasOwn(record, key)) fail(`${path}.${key}`, "required field");
  return record;
}
function boolean(value: unknown, path: string): void {
  if (typeof value !== "boolean") fail(path, "boolean", value);
}
function integer(value: unknown, min: number, max: number, path: string): void {
  if (!Number.isSafeInteger(value) || Number(value) < min || Number(value) > max)
    fail(path, `integer ${min}..${max}`, value);
}
function densePages(value: unknown, path: string): asserts value is unknown[] {
  if (!Array.isArray(value) || value.length === 0)
    fail(path, "nonempty dense ordered page array", value);
  for (let index = 0; index < value.length; index += 1)
    if (!Object.hasOwn(value, index) || !value[index]) fail(`${path}[${index}]`, "page object");
}

export type NativeBattleEventPage = {
  conditions: ReturnType<typeof blankBattleEventPage>["conditions"];
  span: number;
  list: RawEventCommand[];
};

/** Native ownership is exact; validate before rendering or normalizing any saved values. */
export function assertNativeBattlePages(
  value: unknown,
  members: unknown,
  resolver: ReferenceResolver,
  identity: string,
  stage: "compile" | "decompile" = "compile",
): asserts value is NativeBattleEventPage[] {
  try {
    densePages(value, `${identity}.pages`);
    for (const [index, valuePage] of value.entries()) {
      const path = `${identity}.pages[${index}]`;
      const page = object(
        valuePage,
        ["conditions", "span", "list"],
        ["conditions", "span", "list"],
        path,
      );
      const fields = Object.keys(blankBattleEventPage().conditions);
      const c = object(page.conditions, fields, fields, `${path}.conditions`);
      for (const field of ["turnEnding", "turnValid", "enemyValid", "actorValid", "switchValid"])
        boolean(c[field], `${path}.conditions.${field}`);
      for (const field of ["turnA", "turnB"])
        integer(c[field], 0, 9999, `${path}.conditions.${field}`);
      for (const field of ["actorHp", "enemyHp"])
        integer(c[field], 0, 100, `${path}.conditions.${field}`);
      integer(c.enemyIndex, 0, Number.MAX_SAFE_INTEGER, `${path}.conditions.enemyIndex`);
      integer(
        c.actorId,
        c.actorValid ? 1 : 0,
        Number.MAX_SAFE_INTEGER,
        `${path}.conditions.actorId`,
      );
      integer(
        c.switchId,
        c.switchValid ? 1 : 0,
        Number.MAX_SAFE_INTEGER,
        `${path}.conditions.switchId`,
      );
      integer(page.span, 0, 2, `${path}.span`);
      if (!Array.isArray(page.list)) fail(`${path}.list`, "complete command list", page.list);
      if (c.actorValid)
        resolveSavedReference(
          resolver,
          { kind: "actor", id: c.actorId },
          `${path}.conditions.actorId`,
          c.actorId,
        );
      if (c.switchValid)
        resolveSavedReference(
          resolver,
          { kind: "switch", id: c.switchId },
          `${path}.conditions.switchId`,
          c.switchId,
        );
      if (c.enemyValid) {
        if (!Array.isArray(members) || Number(c.enemyIndex) >= members.length)
          fail(`${path}.conditions.enemyIndex`, "existing raw member position", c.enemyIndex);
        for (const [memberIndex, member] of members.entries()) {
          const enemyId =
            member && typeof member === "object" && "enemyId" in member
              ? member.enemyId
              : undefined;
          resolveSavedReference(
            resolver,
            { kind: "enemy", id: enemyId },
            `${identity}.members[${memberIndex}].enemyId`,
            enemyId,
          );
        }
      }
    }
  } catch (error) {
    if (error instanceof BattlePageInputError)
      throw new CommandStructureError(
        "MV-BATTLE-PAGE-INPUT",
        "Invalid native Battle Event Page saved state.",
        {
          nativePath: error.path.replace(`${identity}.`, ""),
          expected: error.expected,
          actual: error.actual,
        },
        identity,
        stage,
      );
    throw error;
  }
}
