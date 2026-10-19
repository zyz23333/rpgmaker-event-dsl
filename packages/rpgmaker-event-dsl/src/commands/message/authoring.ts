import type {
  DslCommand,
  InputNumberDslCommand,
  ReferenceValue,
  SelectItemDslCommand,
  ShowChoicesDslCommand,
  ShowScrollingTextDslCommand,
  ShowTextDslCommand,
} from "../../domain/types.js";
import {
  assertShowText,
  assertInputNumber,
  assertSelectItem,
  assertShowScrollingText,
} from "./validation.js";

export function showText(input: Omit<ShowTextDslCommand, "kind">): ShowTextDslCommand {
  assertShowText(input, "showText", false);
  return {
    kind: "showText",
    lines: input.lines,
    face: input.face,
    background: input.background,
    position: input.position,
  };
}

export function inputNumber(input: {
  variable: ReferenceValue<"variable">;
  digits: number;
}): InputNumberDslCommand {
  assertInputNumber(input, "inputNumber", false);
  return {
    kind: "inputNumber",
    variable: input.variable,
    digits: input.digits,
  };
}

export function selectItem(input: Omit<SelectItemDslCommand, "kind">): SelectItemDslCommand {
  assertSelectItem(input, "selectItem", false);
  return { kind: "selectItem", variable: input.variable, itemType: input.itemType };
}

export function showScrollingText(
  input: Omit<ShowScrollingTextDslCommand, "kind">,
): ShowScrollingTextDslCommand {
  assertShowScrollingText(input, "showScrollingText", false);
  return {
    kind: "showScrollingText",
    lines: input.lines,
    speed: input.speed,
    noFastForward: input.noFastForward,
  };
}

export function showChoices(input: {
  choices: readonly [string, ...string[]];
  branches: readonly [readonly DslCommand[], ...(readonly DslCommand[][])];
  cancelType?: number;
  defaultType?: number;
  positionType?: 0 | 1 | 2;
  background?: 0 | 1 | 2;
  cancelBranch?: readonly DslCommand[];
}): ShowChoicesDslCommand {
  const node: ShowChoicesDslCommand = {
    kind: "showChoices",
    choices: input.choices,
    branches: input.branches,
  };

  if (input.cancelType !== undefined) {
    node.cancelType = input.cancelType;
  }
  if (input.defaultType !== undefined) {
    node.defaultType = input.defaultType;
  }
  if (input.positionType !== undefined) {
    node.positionType = input.positionType;
  }
  if (input.background !== undefined) {
    node.background = input.background;
  }
  if (input.cancelBranch !== undefined) {
    node.cancelBranch = input.cancelBranch;
  }

  return node;
}
