import type { RawEventCommand, CommandOrigins } from "../compiler/types.js";
import type { ReferenceResolver, ValidationIssue } from "./types.js";
import { describeValue } from "../project-data/json-values.js";

export function inspectBattleCommandContext(
  commands: readonly RawEventCommand[],
  context: { kind: "map" | "common" | "troop"; members?: unknown; encounterList?: unknown },
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
    const { code, parameters: p } = command;
    const warn = (suffix: string, slot: number, field: string, detail: string, actual: unknown) => {
      const stable = `MV-E${code}-${suffix}`;
      const nativePath = `${options.prefix ?? ""}list[${index}].parameters${slot < 0 ? "" : `[${slot}]`}`;
      const origin = options.origins?.get(command);
      issues.push({
        code: stable,
        level: "warning",
        stage: options.stage,
        identity: options.identity,
        nativePath,
        ...(origin
          ? {
              dslPath:
                origin.path +
                (origin.kind === "rawDslCommand"
                  ? `.parameters${slot < 0 ? "" : `[${slot}]`}`
                  : field
                    ? `.${field}`
                    : ""),
            }
          : {}),
        expected: "runtime context compatible with the saved command",
        actual: describeValue(actual),
        message: `${options.stage} warning ${options.identity}: ${stable} at ${nativePath}: ${detail}`,
      });
    };
    if (code === 301) {
      if (context.kind === "troop")
        warn(
          "CONTEXT",
          -1,
          "troop",
          "Battle execution skips Battle Processing; all saved branches are nevertheless validated.",
          context.kind,
        );
      else if (context.kind === "common")
        warn(
          "CONTEXT",
          -1,
          "troop",
          "The Common Event caller's battle/map location is unknown; no battle entry is guaranteed.",
          context.kind,
        );
      if (
        p[0] === 2 &&
        context.kind === "map" &&
        Array.isArray(context.encounterList) &&
        context.encounterList.length === 0
      )
        warn(
          "ENCOUNTER-CONTEXT",
          0,
          "troop",
          "The containing map has no saved random encounters; execution still depends on the current map and location.",
          context.encounterList,
        );
    }
    if (code === 340 && context.kind !== "troop")
      warn(
        "CONTEXT",
        -1,
        "",
        "Abort Battle can set residual BattleManager phase to aborting; this is not a guarantee of an immediate scene transition.",
        context.kind,
      );
    if (code === 339 && context.kind !== "troop")
      warn(
        "CONTEXT",
        -1,
        "subject",
        context.kind === "map"
          ? "Map execution skips forced actions outside battle; a Common caller may execute in another context."
          : "Force Action requires battle execution; the Common Event caller is unknown.",
        context.kind,
      );
    const enemyCode = [331, 332, 333, 334, 335, 336, 337, 342].includes(code);
    const enemySubject = code === 339 && p[0] === 0;
    if (!enemyCode && !enemySubject) continue;
    const slot = enemySubject ? 1 : 0;
    const target = p[slot] as number;
    const field = enemySubject ? "subject" : "target";
    if (context.kind !== "troop") {
      warn(
        "ENEMY-CONTEXT",
        slot,
        field,
        context.kind === "common"
          ? "The Common Event caller's Troop is unknown; the saved enemy position is preserved."
          : "Map execution has no declared current Troop and may read residual runtime members; an effect is not guaranteed.",
        target,
      );
      continue;
    }
    const members = context.members;
    if (!Array.isArray(members)) {
      warn(
        "ENEMY-CONTEXT",
        slot,
        field,
        "Runtime members cannot be inferred from this external saved Troop.",
        members,
      );
      continue;
    }
    let filtered = false;
    for (const member of target === -1 ? members : members.slice(0, target + 1)) {
      const enemyId =
        member && typeof member === "object" && "enemyId" in member ? member.enemyId : undefined;
      try {
        resolver.resolveReference({ kind: "enemy", id: enemyId as number });
      } catch {
        filtered = true;
      }
    }
    if (filtered)
      warn(
        "ENEMY-CONTEXT",
        slot,
        field,
        "MV may filter invalid Enemy references while building runtime members, shifting subsequent positions; hidden members still occupy their saved positions.",
        { index: target, members },
      );
    else if (target >= members.length || (target === -1 && members.length === 0))
      warn(
        "ENEMY-CONTEXT",
        slot,
        field,
        code === 337 && p[2] === true
          ? "The independently saved single index has no member; allEnemies currently overrides that execution target, and the saved index remains unchanged."
          : "The saved Troop has no member at the selected position; the legal saved selector is preserved.",
        { index: target, members },
      );
  }
  return issues;
}
