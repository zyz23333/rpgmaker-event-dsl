import type { RawEventCommand } from "../../compiler/types.js";
import type { NativeInputOptions } from "../../validation/native-command-inputs.js";
import type { ValidationIssue } from "../../validation/types.js";
import { describeValue } from "../../project-data/json-values.js";

export function inspectNativeActorPresentation(
  command: RawEventCommand,
  path: string,
  options: NativeInputOptions,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const origin = options.origins?.get(command);
  const warning = (
    suffix: string,
    slot: number | undefined,
    field: string,
    expected: string,
    actual: string,
    detail: string,
  ): void => {
    const nativePath = `${path}${slot === undefined ? "" : `.parameters[${slot}]`}`;
    issues.push({
      code: `MV-E${command.code}-${suffix}`,
      level: "warning",
      stage: options.stage,
      identity: options.identity,
      nativePath,
      ...(origin
        ? {
            dslPath:
              origin.path +
              (origin.kind === "rawDslCommand"
                ? slot === undefined
                  ? ""
                  : `.parameters[${slot}]`
                : field),
          }
        : {}),
      expected,
      actual,
      message: `${options.stage} warning ${options.identity}: MV-E${command.code}-${suffix} at ${nativePath}: ${detail}`,
    });
  };
  if ([320, 324, 325].includes(command.code)) {
    const value = command.parameters[1] as string;
    const count = value.split("\n").length - 1;
    const reasons = [
      ...(count >= (command.code === 325 ? 2 : 1)
        ? [`LF exceeds the native ${command.code === 325 ? "two-line" : "single-line"} control`]
        : []),
      ...(value.includes("\r")
        ? ["CR preservation on parameter reconfirmation requires native verification"]
        : []),
    ];
    if (reasons.length)
      warning(
        "TEXT-RECONFIRMATION",
        1,
        `.${command.code === 320 ? "name" : command.code === 324 ? "nickname" : "profile"}`,
        "review reconfirmation risk while retaining complete saved text",
        describeValue(value),
        `${reasons.join("; ")}. The complete saved string is retained exactly.`,
      );
  }
  if (
    command.code === 322 &&
    command.parameters[3] !== "" &&
    (command.parameters[4] as number) >= 8
  )
    warning(
      "FACE-LAYOUT",
      4,
      ".face.index",
      "official two-row layout uses indices 0..7; saved nonnegative 32-bit index is preserved",
      String(command.parameters[4]),
      `saved face index ${command.parameters[4]} is beyond the official two-row layout; asset dimensions are unchecked.`,
    );
  if (options.identity.startsWith("troop:") && (command.code === 303 || command.code === 323))
    warning(
      "BATTLE",
      undefined,
      "",
      command.code === 303
        ? "Name scene executes outside battle"
        : "review map vehicle visibility after battle",
      "Battle Event Page",
      command.code === 303
        ? "battle execution skips the Name input scene. Saved parameters are retained."
        : "This changes the held map vehicle object during battle; immediate visibility is uncertain. Saved parameters are retained.",
    );
  return issues;
}
