import type {
  BattleProcessingDslCommand,
  DslCommand,
  NameInputProcessingDslCommand,
  ReferenceValue,
  ShopGoods,
  ShopProcessingDslCommand,
} from "../../domain/types.js";
import { assertShopInput } from "./shop-validation.js";

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
  goods: readonly ShopGoods[];
  purchaseOnly?: boolean;
}): ShopProcessingDslCommand {
  assertShopInput(input, "shopProcessing", false);
  const node: ShopProcessingDslCommand = {
    kind: "shopProcessing",
    goods: input.goods,
  };

  if (input.purchaseOnly !== undefined) {
    node.purchaseOnly = input.purchaseOnly;
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
