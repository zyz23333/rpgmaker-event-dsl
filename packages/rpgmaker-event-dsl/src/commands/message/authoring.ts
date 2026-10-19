import type {
  ImageAssetReference,
  InputNumberDslCommand,
  ReferenceValue,
  SelectItemDslCommand,
  ShowChoicesDslCommand,
  ShowScrollingTextDslCommand,
  ShowTextDslCommand,
} from "../../domain/types.js";
import { assertShowChoicesInput } from "./validation.js";

export function showText(input: {
  lines: readonly [string, ...string[]];
  face?: {
    image: ImageAssetReference;
    index?: number;
  };
  background?: 0 | 1 | 2;
  positionType?: 0 | 1 | 2;
}): ShowTextDslCommand {
  const node: ShowTextDslCommand = {
    kind: "showText",
    lines: input.lines,
  };

  if (input.face !== undefined) {
    node.face = input.face;
  }
  if (input.background !== undefined) {
    node.background = input.background;
  }
  if (input.positionType !== undefined) {
    node.positionType = input.positionType;
  }

  return node;
}

export function inputNumber(input: {
  variable: ReferenceValue<"variable">;
  digits: number;
}): InputNumberDslCommand {
  return {
    kind: "inputNumber",
    variable: input.variable,
    digits: input.digits,
  };
}

export function selectItem(input: {
  variable: ReferenceValue<"variable">;
  itemType?: 1 | 2 | 3 | 4;
}): SelectItemDslCommand {
  const node: SelectItemDslCommand = {
    kind: "selectItem",
    variable: input.variable,
  };

  if (input.itemType !== undefined) {
    node.itemType = input.itemType;
  }

  return node;
}

export function showScrollingText(input: {
  lines: readonly [string, ...string[]];
  speed?: number;
  noFastForward?: boolean;
}): ShowScrollingTextDslCommand {
  const node: ShowScrollingTextDslCommand = {
    kind: "showScrollingText",
    lines: input.lines,
  };

  if (input.speed !== undefined) {
    node.speed = input.speed;
  }
  if (input.noFastForward !== undefined) {
    node.noFastForward = input.noFastForward;
  }

  return node;
}

export function showChoices(input: Omit<ShowChoicesDslCommand, "kind">): ShowChoicesDslCommand {
  assertShowChoicesInput(input, "showChoices", false);
  return { ...input, kind: "showChoices" };
}
