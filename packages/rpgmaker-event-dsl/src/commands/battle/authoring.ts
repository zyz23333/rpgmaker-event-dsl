import { assertBattleInput } from "./validation.js";
import type {
  BattleProcessingDslCommand,
  NameInputProcessingDslCommand,
  ReferenceValue,
  ShopGoods,
  ShopProcessingDslCommand,
} from "../../domain/types.js";

export function battleProcessing(
  input: Omit<BattleProcessingDslCommand, "kind">,
): BattleProcessingDslCommand {
  assertBattleInput(input, "battleProcessing");
  return { kind: "battleProcessing", ...input };
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
