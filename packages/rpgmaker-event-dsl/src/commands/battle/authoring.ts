import { assertBattleInput } from "./validation.js";
import type {
  BattleProcessingDslCommand,
  NameInputProcessingDslCommand,
  ReferenceValue,
  ShopGoods,
  ShopProcessingDslCommand,
} from "../../domain/types.js";
import { assertShopInput } from "./shop-validation.js";

export function battleProcessing(
  input: Omit<BattleProcessingDslCommand, "kind">,
): BattleProcessingDslCommand {
  assertBattleInput(input, "battleProcessing");
  return { kind: "battleProcessing", ...input };
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
