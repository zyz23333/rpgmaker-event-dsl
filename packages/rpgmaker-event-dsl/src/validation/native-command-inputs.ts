import type { RawEventCommand, CommandOrigins } from "../compiler/types.js";
import type { ValidationIssue } from "./types.js";
import type { NativeMovementRoute } from "../commands/movement/types.js";
import { isKnownCommandCode } from "./native-parameters.js";

export type NativeInputOptions = {
  identity: string;
  stage: "compile" | "decompile";
  scriptEnabled: boolean;
  prefix?: string;
  origins?: CommandOrigins;
};

export function scriptGateIssue(
  nativePath: string,
  options: NativeInputOptions,
  dslPath?: string,
): ValidationIssue {
  const level = options.stage === "compile" ? "error" : "warning";
  return {
    code: "MV-SCRIPT-GATE",
    level,
    stage: options.stage,
    identity: options.identity,
    nativePath,
    expected: "scriptEnabled: true",
    actual: "scriptEnabled: false",
    ...(dslPath ? { dslPath } : {}),
    message: `${options.stage} ${level} ${options.identity}: MV-SCRIPT-GATE at ${nativePath}: Script commands require explicit config enablement; expected scriptEnabled: true; actual scriptEnabled: false.`,
  };
}

export function inspectNativeRouteInputs(
  route: NativeMovementRoute,
  path: string,
  options: NativeInputOptions,
  dslPath?: string,
): ValidationIssue[] {
  return options.scriptEnabled
    ? []
    : route.list.flatMap((record, index) =>
        record.code === 45
          ? [
              scriptGateIssue(
                `${path}.list[${index}].parameters[0]`,
                options,
                dslPath ? `${dslPath}.commands[${index}].script.code` : undefined,
              ),
            ]
          : [],
      );
}

// Called only after the complete known structure and saved envelopes are validated.
// Scan every stored record; execution reachability and string truthiness are irrelevant.
export function inspectNativeCommandInputs(
  commands: readonly RawEventCommand[],
  options: NativeInputOptions,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const [index, command] of commands.entries()) {
    const path = `${options.prefix ?? ""}list[${index}]`;
    const origin = options.origins?.get(command);
    if (!isKnownCommandCode(command.code))
      issues.push({
        code: "MV-UNKNOWN-COMMAND",
        level: "warning",
        stage: options.stage,
        identity: options.identity,
        nativePath: path,
        expected: "known native event code",
        actual: String(command.code),
        message: `${options.stage} warning ${options.identity}: MV-UNKNOWN-COMMAND at ${path}: unknown code ${command.code} is preserved as one raw record; its payload semantics are uninterpreted.`,
      });
    if (options.scriptEnabled) continue;
    let slot: number | undefined;
    if (command.code === 355 || command.code === 655) slot = 0;
    if (command.code === 111 && command.parameters[0] === 12) slot = 1;
    if (command.code === 122 && command.parameters[3] === 4) slot = 4;
    if (slot !== undefined) {
      const field =
        origin?.kind === "rawDslCommand"
          ? `.parameters[${slot}]`
          : command.code === 111
            ? ".condition.script.code"
            : command.code === 122
              ? ".value.script.code"
              : ".script.code";
      issues.push(
        scriptGateIssue(
          `${path}.parameters[${slot}]`,
          options,
          origin ? origin.path + field : undefined,
        ),
      );
    }
    if (command.code === 205) {
      const route = command.parameters[1] as NativeMovementRoute;
      for (const [routeIndex, record] of route.list.entries())
        if (record.code === 45)
          issues.push(
            scriptGateIssue(
              `${path}.parameters[1].list[${routeIndex}].parameters[0]`,
              options,
              origin
                ? origin.path +
                    (origin.kind === "rawDslCommand"
                      ? `.parameters[1].list[${routeIndex}].parameters[0]`
                      : `.route.commands[${routeIndex}].script.code`)
                : undefined,
            ),
          );
    }
    if (command.code === 505 && (command.parameters[0] as { code: number }).code === 45)
      issues.push(
        scriptGateIssue(
          `${path}.parameters[0].parameters[0]`,
          options,
          origin?.kind === "rawDslCommand"
            ? `${origin.path}.parameters[0].parameters[0]`
            : origin
              ? `${origin.path}.route`
              : undefined,
        ),
      );
  }
  return issues;
}
