import type { BattleProcessingDslCommand, DslCommand, ShopGoods } from "../../domain/types.js";
import type { ReferenceResolver } from "../../validation/types.js";
import type { CompileCommandList, RawEventCommand } from "../types.js";
import { CommandStructureError } from "../../validation/command-errors.js";

export function compileChoiceBranches(
  node: Extract<DslCommand, { kind: "showChoices" }>,
  indent: number,
  resolver: ReferenceResolver,
  compileCommandList: CompileCommandList,
  sourcePath = "commands",
): RawEventCommand[] {
  const output: RawEventCommand[] = [];

  node.choices.forEach((branch, index) => {
    output.push({
      code: 402,
      indent,
      parameters: [index, branch.text],
    });
    const body = compileCommandList(
      branch.commands,
      indent + 1,
      resolver,
      false,
      `${sourcePath}.choices[${index}].commands`,
    );
    if (body.at(-1)?.code === 0 && body.at(-1)?.indent === indent + 1)
      throw new CommandStructureError(
        "MV-BODY-MARKER-CONFLICT",
        "Raw output contradicts the owning body's declared Body End Marker.",
        { dslPath: `${sourcePath}.choices[${index}].endMarker` },
      );
    output.push(...body);
    if (branch.endMarker !== "absent") output.push({ code: 0, indent: indent + 1, parameters: [] });
  });

  if (node.cancel?.kind === "branch") {
    output.push({
      code: 403,
      indent,
      parameters: [6, null],
    });
    const body = compileCommandList(
      node.cancel.commands,
      indent + 1,
      resolver,
      false,
      `${sourcePath}.cancel.commands`,
    );
    if (body.at(-1)?.code === 0 && body.at(-1)?.indent === indent + 1)
      throw new CommandStructureError(
        "MV-BODY-MARKER-CONFLICT",
        "Raw output contradicts the owning body's declared Body End Marker.",
        { dslPath: `${sourcePath}.cancel.endMarker` },
      );
    output.push(...body);
    if (node.cancel.endMarker !== "absent")
      output.push({ code: 0, indent: indent + 1, parameters: [] });
  }

  return output;
}

export function compileBattleProcessingParameters(
  node: BattleProcessingDslCommand,
  resolver: ReferenceResolver,
): unknown[] {
  const troop = node.troop;
  const prefix =
    troop.kind === "randomEncounter"
      ? [2, 0]
      : troop.kind === "variable"
        ? [1, resolver.resolveReference(troop.variable)]
        : [0, resolver.resolveReference(troop.troop)];
  return [...prefix, node.canEscape ?? false, node.canLose ?? false];
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
