import type {
  BreakLoopDslCommand,
  CommentDslCommand,
  CommonEventDslCommand,
  ConditionalBranchCondition,
  ConditionalDslCommand,
  DslCommand,
  ExitEventDslCommand,
  JumpToLabelDslCommand,
  LabelDslCommand,
  LoopDslCommand,
  PluginDslCommand,
  ReferenceValue,
  ScriptDslCommand,
  ScriptInput,
} from "../dsl.js";
import { isScriptInput, scriptInput } from "../dsl.js";

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

export function loop(body: readonly DslCommand[]): LoopDslCommand {
  return { kind: "loop", body };
}

export function breakLoop(): BreakLoopDslCommand {
  return { kind: "breakLoop" };
}

export function exitEvent(): ExitEventDslCommand {
  return { kind: "exitEvent" };
}

export function callCommonEvent(ref: ReferenceValue<"commonEvent">): CommonEventDslCommand {
  return { kind: "commonEvent", ref };
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
