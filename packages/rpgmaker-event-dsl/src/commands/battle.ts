import type {
  BattleProcessingDslCommand,
  DslCommand,
  NameInputProcessingDslCommand,
  ReferenceValue,
  ShopGoods,
  ShopProcessingDslCommand,
} from "../dsl.js";

export function battleProcessing(input: {
  troop:
    | ReferenceValue<"troop">
    | {
        kind: "troop";
        variable: ReferenceValue<"variable">;
      }
    | {
        kind: "troop";
        useRandomEncounter: true;
      };
  canEscape?: boolean;
  canLose?: boolean;
  win?: readonly DslCommand[];
  escape?: readonly DslCommand[];
  lose?: readonly DslCommand[];
}): BattleProcessingDslCommand {
  const node: BattleProcessingDslCommand = {
    kind: "battleProcessing",
    troop: input.troop,
  };

  if (input.canEscape !== undefined) {
    node.canEscape = input.canEscape;
  }
  if (input.canLose !== undefined) {
    node.canLose = input.canLose;
  }
  if (input.win !== undefined) {
    node.win = input.win;
  }
  if (input.escape !== undefined) {
    node.escape = input.escape;
  }
  if (input.lose !== undefined) {
    node.lose = input.lose;
  }

  return node;
}

export function shopProcessing(input: {
  goods: readonly [ShopGoods, ...ShopGoods[]];
  allowSelling?: boolean;
}): ShopProcessingDslCommand {
  const node: ShopProcessingDslCommand = {
    kind: "shopProcessing",
    goods: input.goods,
  };

  if (input.allowSelling !== undefined) {
    node.allowSelling = input.allowSelling;
  }

  return node;
}

export function nameInputProcessing(input: {
  actor: ReferenceValue<"actor">;
  maxCharacters: number;
}): NameInputProcessingDslCommand {
  return {
    kind: "nameInputProcessing",
    actor: input.actor,
    maxCharacters: input.maxCharacters,
  };
}
