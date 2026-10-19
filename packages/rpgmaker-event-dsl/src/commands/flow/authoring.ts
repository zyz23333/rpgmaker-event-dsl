import type {
  BreakLoopDslCommand,
  CommentDslCommand,
  CommonEventDslCommand,
  ConditionalBranchCondition,
  ConditionalDslCommand,
  DslCommand,
  ExitEventProcessingDslCommand,
  JumpToLabelDslCommand,
  LabelDslCommand,
  LoopDslCommand,
  PluginDslCommand,
  ReferenceValue,
  ScriptDslCommand,
  ScriptInput,
} from "../../domain/types.js";
import { isScriptInput } from "../../domain/references.js";
import { scriptInput } from "../../authoring/references.js";
import { assertCommonEventCall } from "./validation.js";
import { assertDslObject } from "../../validation/dsl-command-inputs.js";

export function conditional(input: {
  condition: ConditionalBranchCondition;
  then: readonly DslCommand[];
  else?: readonly DslCommand[];
}): ConditionalDslCommand {
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
  assertDslObject(input, ["body"], "loop");
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

export function label(name: string): LabelDslCommand {
  return { kind: "label", name };
}

export function jumpToLabel(name: string): JumpToLabelDslCommand {
  return { kind: "jumpToLabel", name };
}

export function comment(lines: readonly [string, ...string[]]): CommentDslCommand {
  return { kind: "comment", lines };
}

export function script(input: { code: string } | ScriptInput): ScriptDslCommand {
  return {
    kind: "script",
    script: isScriptInput(input) ? input : scriptInput(input),
  };
}

export function pluginCommand(input: {
  command: string;
  args?: readonly string[];
}): PluginDslCommand {
  const node: PluginDslCommand = {
    kind: "pluginCommand",
    command: input.command,
  };

  if (input.args !== undefined) {
    node.args = input.args;
  }

  return node;
}
