import type { CommandOrigins, RawEventCommand } from "../../compiler/types.js";
import type { ReferenceResolver, ValidationIssue } from "../../validation/types.js";
import { describeValue } from "../../project-data/json-values.js";

type ConditionalContext = {
  kind: "map" | "common" | "troop";
  eventIds?: readonly number[];
  members?: unknown;
};

// Context affects runtime availability, never the saved selector or its slot position.
export function inspectConditionalContext(
  commands: readonly RawEventCommand[],
  context: ConditionalContext,
  resolver: ReferenceResolver,
  options: {
    identity: string;
    stage: "compile" | "decompile";
    prefix?: string;
    origins?: CommandOrigins;
  },
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const [index, command] of commands.entries()) {
    if (command.code !== 111) continue;
    const parameters = command.parameters;
    const origin = options.origins?.get(command);
    const warn = (
      name: string,
      field: string,
      detail: string,
      expected: string,
      actual: unknown,
    ) => {
      const nativePath = `${options.prefix ?? ""}list[${index}].parameters[1]`;
      const code = `MV-E111-${name}-CONTEXT`;
      issues.push({
        level: "warning",
        code,
        stage: options.stage,
        identity: options.identity,
        nativePath,
        ...(origin
          ? {
              dslPath:
                origin.path +
                (origin.kind === "rawDslCommand" ? ".parameters[1]" : `.condition.${field}`),
            }
          : {}),
        expected,
        actual: describeValue(actual),
        message: `${options.stage} warning ${options.identity}: ${code} at ${nativePath}: ${detail}`,
      });
    };
    if (parameters[0] === 2 && context.kind !== "map")
      warn(
        "SELF-SWITCH",
        "selfSwitch",
        context.kind === "common"
          ? "Self Switch depends on the Common Event caller's map and event ID; its caller context is unknown."
          : "A Troop interpreter has no positive map event ID, so this Self Switch condition evaluates false, including an OFF comparison.",
        "positive caller map event ID",
        context.kind,
      );
    if (parameters[0] === 6) {
      const target = parameters[1] as number;
      if (context.kind === "common")
        warn(
          "CHARACTER",
          "target",
          "Character availability depends on the Common Event caller; map and battle caller contexts are unknown.",
          "map caller with the selected character",
          target,
        );
      else if (context.kind === "troop")
        warn(
          "CHARACTER",
          "target",
          "Characters are unavailable to the battle interpreter; this direction condition evaluates false.",
          "map execution with the selected character",
          target,
        );
      else if (target > 0 && !context.eventIds?.includes(target))
        warn(
          "CHARACTER",
          "target",
          "The selected Map Event does not exist in the candidate map; this direction condition evaluates false.",
          "existing event position in the candidate map",
          target,
        );
    }
    if (parameters[0] !== 5) continue;
    const target = parameters[1] as number;
    if (context.kind !== "troop") {
      warn(
        "ENEMY",
        "enemy",
        context.kind === "common"
          ? "Enemy availability depends on the Common Event caller's current Troop; no member positions can be inferred."
          : "This Map Event has no declared current Troop; the condition reads runtime Troop members and a missing member evaluates false.",
        "current runtime Troop member at the saved position",
        target,
      );
      continue;
    }
    if (!Array.isArray(context.members) || target >= context.members.length) {
      warn(
        "ENEMY",
        "enemy",
        "The saved Troop has no member at this position; a missing runtime member evaluates false.",
        "existing raw Troop member position",
        { index: target, members: context.members },
      );
      continue;
    }
    let missing = false;
    for (const member of context.members.slice(0, target + 1)) {
      const enemyId =
        member && typeof member === "object" && "enemyId" in member ? member.enemyId : undefined;
      try {
        resolver.resolveReference({ kind: "enemy", id: enemyId as number });
      } catch {
        missing = true;
      }
    }
    if (missing) {
      warn(
        "ENEMY",
        "enemy",
        "A saved member through the selected raw position has a missing Enemy; MV skips invalid Enemy entries when constructing runtime members, so this position may select another member or no member. Saved positions are preserved.",
        "valid Enemy entries through the selected raw member position",
        { index: target, members: context.members },
      );
      continue;
    }
    const selected = context.members[target];
    if (
      parameters[2] === 0 &&
      selected &&
      typeof selected === "object" &&
      "hidden" in selected &&
      selected.hidden === true
    )
      warn(
        "ENEMY",
        "enemy",
        "The selected saved member starts hidden; appeared checks isAlive(), which is false while hidden or dead.",
        "alive and appeared runtime member",
        { index: target, member: selected },
      );
  }
  return issues;
}
