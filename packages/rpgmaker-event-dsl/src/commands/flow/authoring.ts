import type {
  BreakLoopDslCommand,
  CommentDslCommand,
  CommonEventDslCommand,
  ConditionalBranchCondition,
  ConditionalDslCommand,
  ExitEventProcessingDslCommand,
  JumpToLabelDslCommand,
  LabelDslCommand,
  LoopDslCommand,
  PluginDslCommand,
  ReferenceValue,
  ScriptDslCommand,
  ScriptInput,
} from "../../domain/types.js";
import { scriptInput } from "../../authoring/references.js";
import { assertCommonEventCall } from "./validation.js";
import { assertConditionalCommand } from "./conditional-validation.js";

import { assertComment } from "../message/validation.js";

import { assertDslObject, assertDslTextInput } from "../../validation/dsl-command-inputs.js";

export function conditional(input: {
  condition: ConditionalBranchCondition;
  then: ConditionalDslCommand["then"];
  else?: ConditionalDslCommand["else"];
}): ConditionalDslCommand {
  assertConditionalCommand(input, "conditional", false);
  const node: ConditionalDslCommand = {
    kind: "conditional",
    condition: input.condition,
    then: input.then,
  };

  if (input.else !== undefined) {
    node.else = input.else;
  }

  return node;
}

export function loop(input: { body: LoopDslCommand["body"] }): LoopDslCommand {
  return { kind: "loop", body: input.body };
}

export function breakLoop(): BreakLoopDslCommand {
  return { kind: "breakLoop" };
}

export function exitEventProcessing(): ExitEventProcessingDslCommand {
  return { kind: "exitEventProcessing" };
}

export function callCommonEvent(input: {
  commonEvent: ReferenceValue<"commonEvent">;
}): CommonEventDslCommand {
  assertCommonEventCall(input, "callCommonEvent", false);
  return { kind: "commonEvent", commonEvent: input.commonEvent };
}

export function label(input: { name: string }): LabelDslCommand {
  assertDslTextInput(input, "name", "label");
  return { kind: "label", name: input.name };
}

export function jumpToLabel(input: { name: string }): JumpToLabelDslCommand {
  assertDslTextInput(input, "name", "jumpToLabel");
  return { kind: "jumpToLabel", name: input.name };
}

export function comment(input: Omit<CommentDslCommand, "kind">): CommentDslCommand {
  assertComment(input, "comment", false);
  return { kind: "comment", lines: input.lines };
}

export function script(input: { code: string } | ScriptInput): ScriptDslCommand {
  assertDslObject(input, ["kind", "code"], "script");
  const hasKind = Object.hasOwn(input, "kind");
  assertDslTextInput(input, "code", "script", hasKind ? "scriptInput" : undefined);
  return {
    kind: "script",
    script: hasKind ? (input as ScriptInput) : scriptInput(input),
  };
}

export function pluginCommand(input: { line: string }): PluginDslCommand {
  assertDslTextInput(input, "line", "pluginCommand");
  return { kind: "pluginCommand", line: input.line };
}
