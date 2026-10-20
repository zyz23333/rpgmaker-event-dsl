import type {
  InputNumberDslCommand,
  ReferenceValue,
  SelectItemDslCommand,
  ShowChoicesDslCommand,
  ShowScrollingTextDslCommand,
  ShowTextDslCommand,
} from "../../domain/types.js";
import { assertShowChoicesInput } from "./validation.js";

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

export function showChoices(input: Omit<ShowChoicesDslCommand, "kind">): ShowChoicesDslCommand {
  assertShowChoicesInput(input, "showChoices", false);
  return { ...input, kind: "showChoices" };
}
