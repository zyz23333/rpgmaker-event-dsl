import type { CommandOrigins, RawEventCommand } from "../../compiler/types.js";
import type { ValidationIssue } from "../../validation/types.js";
import { describeValue } from "../../project-data/json-values.js";

export type VariableInputContext = {
  mapEventIds?: readonly number[];
  troopMemberCount?: number;
};

export function inspectNativeVariableInputs(
  commands: readonly RawEventCommand[],
  options: { identity: string; stage: "compile" | "decompile"; prefix?: string; origins?: CommandOrigins; variableContext?: VariableInputContext },
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const [index, command] of commands.entries()) {
    if (command.code !== 122) continue;
    const p = command.parameters;
    const origin = options.origins?.get(command);
    const warning = (code: string, slot: number, field: string, detail: string): void => {
      const nativePath = `${options.prefix ?? ""}list[${index}].parameters[${slot}]`;
      issues.push({ code, level: "warning", identity: options.identity, stage: options.stage, nativePath,
        ...(origin ? { dslPath: origin.path + (origin.kind === "rawDslCommand" ? `.parameters[${slot}]` : field) } : {}),
        expected: "review contextual or parameter-reconfirmation risk without changing saved input", actual: describeValue(p[slot]),
        message: `${options.stage} warning ${options.identity}: ${code} at ${nativePath}: ${detail}`,
      });
    };
    if (p[3] === 4 && typeof p[4] === "string" && (p[4].includes("\r") || p[4].includes("\n"))) {
      const reasons = [p[4].includes("\n") ? "LF exceeds the single-line editor control" : "", p[4].includes("\r") ? "CR preservation on parameter reconfirmation requires native verification" : ""].filter(Boolean);
      warning("MV-TEXT-RECONFIRMATION", 4, ".value.script.code", `The complete string is preserved; ${reasons.join("; ")}.`);
    }
    if (p[3] !== 3) continue;
    const context = options.variableContext;
    if (p[4] === 4 && context?.troopMemberCount !== undefined && Number(p[5]) >= context.troopMemberCount)
      warning("MV-E122-RUNTIME-TARGET", 5, ".value.enemy.index", "The enemy member position is absent from this Troop's saved members. In this battle context the native operand can return 0; future runtime context is not guaranteed.");
    if (p[4] === 4 && context?.mapEventIds !== undefined)
      warning("MV-E122-RUNTIME-TARGET", 5, ".value.enemy.index", "This containing Map Event supplies no battle member context; in that map context the native operand can return 0. Common Event calls may have another context.");
    if (p[4] === 5 && context?.troopMemberCount !== undefined)
      warning("MV-E122-RUNTIME-TARGET", 5, ".value.target", "In this containing Troop Event's battle context the character target is unavailable and the native operand returns 0; a Common Event may be called in another context.");
    if (p[4] === 5 && Number(p[5]) > 0 && context?.mapEventIds !== undefined && !context.mapEventIds.includes(Number(p[5])))
      warning("MV-E122-RUNTIME-TARGET", 5, ".value.target", "This event position is absent from the containing Map's saved events. In that map context the native operand can return 0; no map reference is inferred.");
  }
  return issues;
}
