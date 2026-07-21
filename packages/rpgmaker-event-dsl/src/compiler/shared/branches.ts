import type { BattleProcessingDslCommand, DslCommand, ShopGoods } from "../../domain/types.js";
import type { ReferenceResolver } from "../../validation/types.js";
import type { CompileCommandList, RawEventCommand } from "../types.js";

export function compileChoiceBranches(
  node: Extract<DslCommand, { kind: "showChoices" }>,
  indent: number,
  resolver: ReferenceResolver,
  compileCommandList: CompileCommandList,
): RawEventCommand[] {
  const output: RawEventCommand[] = [];

  node.branches.forEach((branch, index) => {
    output.push({
      code: 402,
      indent,
      parameters: [index],
    });
    output.push(...compileCommandList(branch, indent + 1, resolver, false));
  });

  if (node.cancelBranch) {
    output.push({
      code: 403,
      indent,
      parameters: [],
    });
    output.push(...compileCommandList(node.cancelBranch, indent + 1, resolver, false));
  }

  return output;
}

export function compileBattleProcessingParameters(
  node: BattleProcessingDslCommand,
  resolver: ReferenceResolver,
): unknown[] {
  if ("useRandomEncounter" in node.troop) {
    return [2, 0, node.canEscape ?? false, node.canLose ?? false];
  }

  if ("variable" in node.troop) {
    return [
      1,
      resolver.resolveReference(node.troop.variable),
      node.canEscape ?? false,
      node.canLose ?? false,
    ];
  }

  return [0, resolver.resolveReference(node.troop), node.canEscape ?? false, node.canLose ?? false];
}

export function compileShopGoodsParameters(
  goods: ShopGoods,
  resolver: ReferenceResolver,
): unknown[] {
  return [
    shopGoodsTypeToCode(goods.kind),
    resolver.resolveReference(goods.item),
    goods.price === undefined ? 0 : 1,
    goods.price ?? 0,
  ];
}

export function shopGoodsTypeToCode(kind: ShopGoods["kind"]): number {
  switch (kind) {
    case "item":
      return 0;
    case "weapon":
      return 1;
    case "armor":
      return 2;
  }
}
