import { renderDecompiledCommandList, renderSimpleOrRawCommand } from "../commands.js";
import type { RawEventCommand, RenderedCommand } from "../../decompiler.js";
import { literal, readPositiveInteger } from "../../decompiler.js";
import { findMessageBranchEnd, renderInlineCommandListSource } from "../commands.js";

export function renderBattleProcessingCommand(
  commands: readonly RawEventCommand[],
  index: number,
): RenderedCommand {
  const command = commands[index];
  if (command === undefined) {
    throw new Error("Cannot render missing Battle Processing command.");
  }

  const troop = renderBattleTroop(command.parameters);
  if (
    troop === null ||
    typeof command.parameters[2] !== "boolean" ||
    typeof command.parameters[3] !== "boolean"
  ) {
    return renderSimpleOrRawCommand(command, index);
  }

  const helperNames = new Set<string>(["battleProcessing", ...troop.helperNames]);
  const fields = [`troop: ${troop.expression}`];
  if (command.parameters[2]) {
    fields.push("canEscape: true");
  }
  if (command.parameters[3]) {
    fields.push("canLose: true");
  }

  let nextIndex = index;
  while (commands[nextIndex + 1]?.indent === command.indent) {
    const branchCommand = commands[nextIndex + 1];
    if (
      branchCommand === undefined ||
      (branchCommand.code !== 601 && branchCommand.code !== 602 && branchCommand.code !== 603)
    ) {
      break;
    }

    const branchEndIndex = findMessageBranchEnd(commands, nextIndex + 2, command.indent);
    const rendered = renderDecompiledCommandList(commands.slice(nextIndex + 2, branchEndIndex));
    for (const helperName of rendered.helperNames) {
      helperNames.add(helperName);
    }
    fields.push(
      `${battleBranchFieldName(branchCommand.code)}: [${renderInlineCommandListSource(rendered.source)}]`,
    );
    nextIndex = branchEndIndex - 1;
  }

  if (commands[nextIndex + 1]?.code === 604 && commands[nextIndex + 1]?.indent === command.indent) {
    nextIndex += 1;
  }

  return {
    expression: `battleProcessing({ ${fields.join(", ")} })`,
    helperNames: [...helperNames],
    nextIndex,
  };
}

export function renderShopProcessingCommand(
  commands: readonly RawEventCommand[],
  index: number,
): RenderedCommand {
  const command = commands[index];
  if (command === undefined) {
    throw new Error("Cannot render missing Shop Processing command.");
  }

  const firstGoods = renderShopGoods(command.parameters);
  const allowSelling = command.parameters[4];
  if (firstGoods === null || typeof allowSelling !== "boolean") {
    return renderSimpleOrRawCommand(command, index);
  }

  const goods = [firstGoods.expression];
  const helperNames = new Set<string>(["shopProcessing", ...firstGoods.helperNames]);
  let nextIndex = index;

  while (
    commands[nextIndex + 1]?.code === 605 &&
    commands[nextIndex + 1]?.indent === command.indent
  ) {
    const renderedGoods = renderShopGoods(commands[nextIndex + 1]?.parameters ?? []);
    if (renderedGoods === null) {
      break;
    }
    goods.push(renderedGoods.expression);
    for (const helperName of renderedGoods.helperNames) {
      helperNames.add(helperName);
    }
    nextIndex += 1;
  }

  const fields = [`goods: [${goods.join(", ")}]`];
  if (allowSelling) {
    fields.push("allowSelling: true");
  }

  return {
    expression: `shopProcessing({ ${fields.join(", ")} })`,
    helperNames: [...helperNames],
    nextIndex,
  };
}

export function renderBattleTroop(
  parameters: readonly unknown[],
): { expression: string; helperNames: readonly string[] } | null {
  if (parameters[0] === 0) {
    const troopId = readPositiveInteger(parameters[1]);
    return troopId === null
      ? null
      : {
          expression: `troopRef({ id: ${troopId} })`,
          helperNames: ["troopRef"],
        };
  }

  if (parameters[0] === 1) {
    const variableId = readPositiveInteger(parameters[1]);
    return variableId === null
      ? null
      : {
          expression: `{ kind: "troop", variable: variableRef({ id: ${variableId} }) }`,
          helperNames: ["variableRef"],
        };
  }

  if (parameters[0] === 2) {
    return {
      expression: `{ kind: "troop", useRandomEncounter: true }`,
      helperNames: [],
    };
  }

  return null;
}

export function battleBranchFieldName(code: number): "escape" | "lose" | "win" {
  if (code === 602) {
    return "escape";
  }
  if (code === 603) {
    return "lose";
  }
  return "win";
}

export function renderShopGoods(
  parameters: readonly unknown[],
): { expression: string; helperNames: readonly string[] } | null {
  const kind = shopGoodsKindFromCode(parameters[0]);
  const itemId = readPositiveInteger(parameters[1]);
  const priceMode = parameters[2];
  const price = parameters[3];
  if (kind === null || itemId === null || (priceMode !== 0 && priceMode !== 1)) {
    return null;
  }
  if (priceMode === 1 && typeof price !== "number") {
    return null;
  }

  const helperName = kind === "item" ? "itemRef" : kind === "weapon" ? "weaponRef" : "armorRef";
  const fields = [`kind: ${literal(kind)}`, `item: ${helperName}({ id: ${itemId} })`];
  if (priceMode === 1) {
    fields.push(`price: ${price}`);
  }

  return {
    expression: `{ ${fields.join(", ")} }`,
    helperNames: [helperName],
  };
}

export function shopGoodsKindFromCode(value: unknown): "armor" | "item" | "weapon" | null {
  if (value === 0) {
    return "item";
  }
  if (value === 1) {
    return "weapon";
  }
  if (value === 2) {
    return "armor";
  }
  return null;
}
