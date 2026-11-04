import type { CommandOrigins, RawEventCommand } from "../../compiler/types.js";
import { describeValue } from "../../project-data/json-values.js";
import type { ValidationIssue } from "../../validation/types.js";

export function inspectNativeLabelInputs(
  commands: readonly RawEventCommand[],
  options: {
    identity: string;
    stage: "compile" | "decompile";
    prefix?: string;
    origins?: CommandOrigins;
  },
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const firstLabels = new Map<string, number>();
  const location = (index: number) => {
    const command = commands[index]!;
    const origin = options.origins?.get(command);
    return {
      nativePath: `${options.prefix ?? ""}list[${index}].parameters[0]`,
      ...(origin
        ? {
            dslPath: `${origin.path}${origin.kind === "rawDslCommand" ? ".parameters[0]" : ".name"}`,
          }
        : {}),
    };
  };
  for (const [index, command] of commands.entries())
    if (command.code === 118 && !firstLabels.has(command.parameters[0] as string))
      firstLabels.set(command.parameters[0] as string, index);
  for (const [index, command] of commands.entries()) {
    if (command.code !== 118 && command.code !== 119) continue;
    const name = command.parameters[0] as string;
    const first = firstLabels.get(name);
    const actual = describeValue(name);
    const warning = (code: string, detail: string, expected: string): ValidationIssue => ({
      code,
      level: "warning",
      stage: options.stage,
      identity: options.identity,
      ...location(index),
      expected,
      actual,
      message: `${options.stage} warning ${options.identity}: ${code} at ${location(index).nativePath}: ${detail} Actual ${actual}.`,
    });
    if (command.code === 119 && first === undefined)
      issues.push(
        warning(
          "MV-LABEL-MISSING",
          "No exact Label exists in this complete native list; Jump to Label continues without jumping.",
          "exact Label in the same native list",
        ),
      );
    if (command.code === 118 && first !== index) {
      issues.push({
        ...warning(
          "MV-LABEL-DUPLICATE",
          "Duplicate exact Label; Jump to Label selects the first match in the complete native list, including across branch indentation.",
          "unique exact Label or deliberate first-match behavior",
        ),
        relatedLocations: [{ ...location(first!), value: actual }],
      });
    }
    if (name.includes("\r") || name.includes("\n")) {
      const reasons = [
        name.includes("\n") ? "LF exceeds the single-line editor control" : "",
        name.includes("\r")
          ? "CR preservation on parameter reconfirmation requires native verification"
          : "",
      ].filter(Boolean);
      issues.push(
        warning(
          "MV-TEXT-RECONFIRMATION",
          `The complete string is preserved; ${reasons.join("; ")}.`,
          "review parameter-reconfirmation risk without changing saved text",
        ),
      );
    }
  }
  return issues;
}
