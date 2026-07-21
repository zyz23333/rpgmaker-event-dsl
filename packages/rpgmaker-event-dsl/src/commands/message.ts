import type {
  DslCommand,
  ImageAssetReference,
  InputNumberDslCommand,
  ReferenceValue,
  SelectItemDslCommand,
  ShowChoicesDslCommand,
  ShowScrollingTextDslCommand,
  ShowTextDslCommand,
} from "../dsl.js";

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
