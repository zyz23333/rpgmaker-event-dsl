import type { RawEventCommand, CommandOrigins } from "../compiler/types.js";
import type { ValidationIssue } from "./types.js";
import type { NativeMovementRoute } from "../commands/movement/types.js";
import { isKnownCommandCode } from "./native-parameters.js";
import { inspectNativeScreenContext } from "../commands/screen/validation.js";
import { renderJsonValue } from "../project-data/json-values.js";
import {
  inspectNativeVariableInputs,
  type VariableInputContext,
} from "../commands/variables/diagnostics.js";

export type NativeInputOptions = {
  identity: string;
  stage: "compile" | "decompile";
  scriptEnabled: boolean;
  prefix?: string;
  origins?: CommandOrigins;
  variableContext?: VariableInputContext;
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
  return route.list.flatMap((record, index) => {
    if (record.code !== 45) return [];
    const native = `${path}.list[${index}].parameters[0]`;
    const authored = dslPath ? `${dslPath}.commands[${index}].script.code` : undefined;
    return [
      ...movementStringRisk(record.parameters![0] as string, native, options, authored),
      ...(options.scriptEnabled ? [] : [scriptGateIssue(native, options, authored)]),
    ];
  });
}

function movementStringRisk(
  value: string,
  nativePath: string,
  options: NativeInputOptions,
  dslPath?: string,
): ValidationIssue[] {
  if (!value.includes("\n") && !value.includes("\r")) return [];
  const reasons = [
    ...(value.includes("\n") ? ["LF exceeds the native single-line input"] : []),
    ...(value.includes("\r")
      ? ["CR preservation on parameter reconfirmation needs native verification"]
      : []),
  ];
  return [
    {
      code: "MV-MOVEMENT-TEXT-RISK",
      level: "warning",
      stage: options.stage,
      identity: options.identity,
      nativePath,
      ...(dslPath === undefined ? {} : { dslPath }),
      expected: "Complete saved single-slot text retained; parameter reconfirmation may differ",
      actual: JSON.stringify(value),
      message: `${options.stage} warning ${options.identity}: MV-MOVEMENT-TEXT-RISK at ${nativePath}: ${reasons.join("; ")}. Saved text is retained exactly.`,
    },
  ];
}

// Called only after the complete known structure and saved envelopes are validated.
// Scan every stored record; execution reachability and string truthiness are irrelevant.
export function inspectNativeCommandInputs(
  commands: readonly RawEventCommand[],
  options: NativeInputOptions,
): ValidationIssue[] {
  const issues: ValidationIssue[] = inspectNativeVariableInputs(commands, options);
  for (const [index, command] of commands.entries()) {
    const path = `${options.prefix ?? ""}list[${index}]`;
    const origin = options.origins?.get(command);
    if (
      command.code === 111 &&
      command.parameters[0] === 12 &&
      /[\r\n]/u.test(command.parameters[1] as string)
    ) {
      const nativePath = `${path}.parameters[1]`;
      issues.push({
        code: "MV-E111-SCRIPT-RECONFIRM",
        level: "warning",
        stage: options.stage,
        identity: options.identity,
        nativePath,
        ...(origin
          ? {
              dslPath:
                origin.path +
                (origin.kind === "rawDslCommand" ? ".parameters[1]" : ".condition.script.code"),
            }
          : {}),
        expected: "reconfirm the complete single-slot script containing CR or LF",
        actual: renderJsonValue(command.parameters[1]),
        message: `${options.stage} warning ${options.identity}: MV-E111-SCRIPT-RECONFIRM at ${nativePath}: Conditional Script contains CR or LF; reconfirm the complete single-slot expression before writing it back.`,
      });
    }
    if (command.code === 102) {
      const count = (command.parameters[0] as unknown[]).length;
      for (const slot of [1, 2]) {
        const value = command.parameters[slot] as number;
        if (value >= count)
          issues.push({
            code: "MV-CHOICE-INDEX",
            level: "warning",
            stage: options.stage,
            identity: options.identity,
            nativePath: `${path}.parameters[${slot}]`,
            ...(origin
              ? {
                  dslPath:
                    origin.path +
                    (origin.kind === "rawDslCommand"
                      ? `.parameters[${slot}]`
                      : `.${slot === 1 ? "cancel" : "defaultChoice"}.index`),
                }
              : {}),
            expected: `choice index below ${count}`,
            actual: String(value),
            message: `${options.stage} warning ${options.identity}: MV-CHOICE-INDEX at ${path}.parameters[${slot}]: saved choice index ${value} has no current choice and is preserved.`,
          });
      }
    }
    issues.push(
      ...inspectNativeScreenContext(command.code, {
        identity: options.identity,
        stage: options.stage,
        nativePath: path,
        ...(origin ? { dslPath: origin.path } : {}),
      }),
    );
    if (command.code === 205) {
      const route = command.parameters[1] as NativeMovementRoute;
      for (const [routeIndex, record] of route.list.entries())
        if (record.code === 45)
          issues.push(
            ...movementStringRisk(
              record.parameters![0] as string,
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
        ...movementStringRisk(
          (command.parameters[0] as { parameters: string[] }).parameters[0]!,
          `${path}.parameters[0].parameters[0]`,
          options,
          origin?.kind === "rawDslCommand"
            ? `${origin.path}.parameters[0].parameters[0]`
            : undefined,
        ),
      );
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
