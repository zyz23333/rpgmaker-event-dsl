import { renderDecompiledCommandList, renderSimpleOrRawCommand } from "../commands.js";
import type { RawEventCommand, RenderedCommand } from "../../decompiler.js";
import {
  isDirection,
  isSelfSwitch,
  literal,
  readControlValue,
  readPositiveInteger,
} from "../../decompiler.js";
import { renderInlineCommandListSource } from "../commands.js";

export function renderConditionalCommand(
  commands: readonly RawEventCommand[],
  index: number,
): RenderedCommand {
  const command = commands[index];
  if (command === undefined) {
    throw new Error("Cannot render missing Conditional Branch command.");
  }

  const condition = renderConditionalBranchCondition(command.parameters);
  if (condition === null) {
    return renderSimpleOrRawCommand(command, index);
  }

  const helperNames = new Set<string>(["conditional", ...condition.helperNames]);
  const thenEndIndex = findConditionalBranchBodyEnd(commands, index + 1, command.indent);
  const thenCommands = commands.slice(index + 1, thenEndIndex);
  const renderedThen = renderDecompiledCommandList(thenCommands);

  for (const helperName of renderedThen.helperNames) {
    helperNames.add(helperName);
  }

  const fields = [
    `condition: ${condition.expression}`,
    `then: [${renderInlineCommandListSource(renderedThen.source)}]`,
  ];
  let nextIndex = thenEndIndex - 1;

  if (commands[thenEndIndex]?.code === 411 && commands[thenEndIndex]?.indent === command.indent) {
    const elseEndIndex = findConditionalBranchBodyEnd(commands, thenEndIndex + 1, command.indent);
    const renderedElse = renderDecompiledCommandList(
      commands.slice(thenEndIndex + 1, elseEndIndex),
    );

    for (const helperName of renderedElse.helperNames) {
      helperNames.add(helperName);
    }

    fields.push(`else: [${renderInlineCommandListSource(renderedElse.source)}]`);
    nextIndex = elseEndIndex - 1;
  }

  return {
    expression: `conditional({ ${fields.join(", ")} })`,
    helperNames: [...helperNames],
    nextIndex,
  };
}

export function renderLoopCommand(
  commands: readonly RawEventCommand[],
  index: number,
): RenderedCommand {
  const command = commands[index];
  if (command === undefined) {
    throw new Error("Cannot render missing Loop command.");
  }

  const bodyEndIndex = findLoopBodyEnd(commands, index + 1, command.indent);
  const body = renderDecompiledCommandList(commands.slice(index + 1, bodyEndIndex));
  const nextIndex =
    commands[bodyEndIndex]?.code === 413 && commands[bodyEndIndex]?.indent === command.indent
      ? bodyEndIndex
      : bodyEndIndex - 1;

  return {
    expression: `loop([${renderInlineCommandListSource(body.source)}])`,
    helperNames: ["loop", ...body.helperNames],
    nextIndex,
  };
}

export function renderConditionalBranchCondition(
  parameters: readonly unknown[],
): { expression: string; helperNames: readonly string[] } | null {
  switch (parameters[0]) {
    case 0:
      return renderSwitchCondition(parameters);
    case 1:
      return renderVariableCondition(parameters);
    case 2:
      return renderSelfSwitchCondition(parameters);
    case 3:
      return renderTimerCondition(parameters);
    case 4:
      return renderActorCondition(parameters);
    case 5:
      return renderEnemyCondition(parameters);
    case 6:
      return renderCharacterCondition(parameters);
    case 7:
      return renderGoldCondition(parameters);
    case 8:
      return renderItemCondition(parameters);
    case 9:
      return renderWeaponCondition(parameters);
    case 10:
      return renderArmorCondition(parameters);
    case 11:
      return renderButtonCondition(parameters);
    case 12:
      return typeof parameters[1] === "string"
        ? {
            expression: `{
  kind: "script",
  script: scriptInput({ code: ${literal(parameters[1])} }),
}`,
            helperNames: ["scriptInput"],
          }
        : null;
    case 13:
      return renderVehicleCondition(parameters);
    default:
      return null;
  }
}

export function renderSwitchCondition(
  parameters: readonly unknown[],
): { expression: string; helperNames: readonly string[] } | null {
  const switchId = readPositiveInteger(parameters[1]);
  const value = readControlValue(parameters[2]);

  return switchId === null || value === null
    ? null
    : {
        expression: `{ kind: "switch", switch: switchRef({ id: ${switchId} }), value: ${value} }`,
        helperNames: ["switchRef"],
      };
}

export function renderVariableCondition(
  parameters: readonly unknown[],
): { expression: string; helperNames: readonly string[] } | null {
  const variableId = readPositiveInteger(parameters[1]);
  const operandKind = parameters[2];
  const operator = conditionalVariableOperatorFromCode(parameters[4]);

  if (variableId === null || operator === null) {
    return null;
  }

  if (operandKind === 0 && typeof parameters[3] === "number") {
    return {
      expression: `{ kind: "variable", variable: variableRef({ id: ${variableId} }), operator: ${literal(operator)}, value: ${parameters[3]} }`,
      helperNames: ["variableRef"],
    };
  }

  if (operandKind === 1) {
    const sourceVariableId = readPositiveInteger(parameters[3]);
    return sourceVariableId === null
      ? null
      : {
          expression: `{ kind: "variable", variable: variableRef({ id: ${variableId} }), operator: ${literal(operator)}, value: variableRef({ id: ${sourceVariableId} }) }`,
          helperNames: ["variableRef"],
        };
  }

  return null;
}

export function renderSelfSwitchCondition(
  parameters: readonly unknown[],
): { expression: string; helperNames: readonly string[] } | null {
  const selfSwitch = parameters[1];
  const value = readControlValue(parameters[2]);

  return isSelfSwitch(selfSwitch) && value !== null
    ? {
        expression: `{ kind: "selfSwitch", selfSwitch: ${literal(selfSwitch)}, value: ${value} }`,
        helperNames: [],
      }
    : null;
}

export function renderTimerCondition(
  parameters: readonly unknown[],
): { expression: string; helperNames: readonly string[] } | null {
  const seconds = parameters[1];
  const operator = parameters[2] === 0 ? "ge" : parameters[2] === 1 ? "le" : null;

  return typeof seconds === "number" && operator !== null
    ? {
        expression: `{ kind: "timer", seconds: ${seconds}, operator: ${literal(operator)} }`,
        helperNames: [],
      }
    : null;
}

export function renderActorCondition(
  parameters: readonly unknown[],
): { expression: string; helperNames: readonly string[] } | null {
  const actorId = readPositiveInteger(parameters[1]);
  if (actorId === null) {
    return null;
  }

  const check = renderActorConditionCheck(parameters[2], parameters[3]);
  if (check === null) {
    return null;
  }

  return {
    expression: `{ kind: "actor", actor: actorRef({ id: ${actorId} }), check: ${check.expression} }`,
    helperNames: ["actorRef", ...check.helperNames],
  };
}

export function renderActorConditionCheck(
  checkKind: unknown,
  value: unknown,
): { expression: string; helperNames: readonly string[] } | null {
  switch (checkKind) {
    case 0:
      return { expression: `{ kind: "inParty" }`, helperNames: [] };
    case 1:
      return typeof value === "string"
        ? { expression: `{ kind: "name", name: ${literal(value)} }`, helperNames: [] }
        : null;
    case 2:
      return renderReferencedActorCheck("class", "classRef", value);
    case 3:
      return renderReferencedActorCheck("skill", "skillRef", value);
    case 4:
      return renderReferencedActorCheck("weapon", "weaponRef", value);
    case 5:
      return renderReferencedActorCheck("armor", "armorRef", value);
    case 6:
      return renderReferencedActorCheck("state", "stateRef", value);
    default:
      return null;
  }
}

export function renderReferencedActorCheck(
  kind: "armor" | "class" | "skill" | "state" | "weapon",
  helperName: "armorRef" | "classRef" | "skillRef" | "stateRef" | "weaponRef",
  value: unknown,
): { expression: string; helperNames: readonly string[] } | null {
  const id = readPositiveInteger(value);
  return id === null
    ? null
    : {
        expression: `{ kind: ${literal(kind)}, ${kind}: ${helperName}({ id: ${id} }) }`,
        helperNames: [helperName],
      };
}

export function renderEnemyCondition(
  parameters: readonly unknown[],
): { expression: string; helperNames: readonly string[] } | null {
  const enemyIndex = parameters[1];
  if (typeof enemyIndex !== "number" || !Number.isInteger(enemyIndex) || enemyIndex < 0) {
    return null;
  }

  if (parameters[2] === 0) {
    return {
      expression: `{ kind: "enemy", enemyIndex: ${enemyIndex}, check: { kind: "appeared" } }`,
      helperNames: [],
    };
  }

  if (parameters[2] === 1) {
    const stateId = readPositiveInteger(parameters[3]);
    return stateId === null
      ? null
      : {
          expression: `{ kind: "enemy", enemyIndex: ${enemyIndex}, check: { kind: "state", state: stateRef({ id: ${stateId} }) } }`,
          helperNames: ["stateRef"],
        };
  }

  return null;
}

export function renderCharacterCondition(
  parameters: readonly unknown[],
): { expression: string; helperNames: readonly string[] } | null {
  const characterId = parameters[1];
  const direction = parameters[2];

  return typeof characterId === "number" && isDirection(direction)
    ? {
        expression: `{ kind: "character", characterId: ${characterId}, direction: ${direction} }`,
        helperNames: [],
      }
    : null;
}

export function renderGoldCondition(
  parameters: readonly unknown[],
): { expression: string; helperNames: readonly string[] } | null {
  const amount = parameters[1];
  const operator =
    parameters[2] === 0 ? "ge" : parameters[2] === 1 ? "le" : parameters[2] === 2 ? "lt" : null;

  return typeof amount === "number" && operator !== null
    ? {
        expression: `{ kind: "gold", amount: ${amount}, operator: ${literal(operator)} }`,
        helperNames: [],
      }
    : null;
}

export function renderItemCondition(
  parameters: readonly unknown[],
): { expression: string; helperNames: readonly string[] } | null {
  const itemId = readPositiveInteger(parameters[1]);
  return itemId === null
    ? null
    : {
        expression: `{ kind: "item", item: itemRef({ id: ${itemId} }) }`,
        helperNames: ["itemRef"],
      };
}

export function renderWeaponCondition(
  parameters: readonly unknown[],
): { expression: string; helperNames: readonly string[] } | null {
  const weaponId = readPositiveInteger(parameters[1]);
  return weaponId === null || typeof parameters[2] !== "boolean"
    ? null
    : {
        expression: `{ kind: "weapon", weapon: weaponRef({ id: ${weaponId} }), includeEquipment: ${parameters[2]} }`,
        helperNames: ["weaponRef"],
      };
}

export function renderArmorCondition(
  parameters: readonly unknown[],
): { expression: string; helperNames: readonly string[] } | null {
  const armorId = readPositiveInteger(parameters[1]);
  return armorId === null || typeof parameters[2] !== "boolean"
    ? null
    : {
        expression: `{ kind: "armor", armor: armorRef({ id: ${armorId} }), includeEquipment: ${parameters[2]} }`,
        helperNames: ["armorRef"],
      };
}

export function renderButtonCondition(
  parameters: readonly unknown[],
): { expression: string; helperNames: readonly string[] } | null {
  return isButtonName(parameters[1])
    ? {
        expression: `{ kind: "button", button: ${literal(parameters[1])} }`,
        helperNames: [],
      }
    : null;
}

export function renderVehicleCondition(
  parameters: readonly unknown[],
): { expression: string; helperNames: readonly string[] } | null {
  const vehicle = vehicleFromCode(parameters[1]);

  return vehicle === null
    ? null
    : {
        expression: `{ kind: "vehicle", vehicle: ${literal(vehicle)} }`,
        helperNames: [],
      };
}

export function vehicleFromCode(value: unknown): "boat" | "ship" | "airship" | null {
  if (value === 0) {
    return "boat";
  }
  if (value === 1) {
    return "ship";
  }
  if (value === 2) {
    return "airship";
  }

  return null;
}

export function findConditionalBranchBodyEnd(
  commands: readonly RawEventCommand[],
  startIndex: number,
  parentIndent: number,
): number {
  let index = startIndex;

  while (index < commands.length) {
    const command = commands[index];
    if (command === undefined || command.code === 0 || command.indent < parentIndent) {
      break;
    }
    if (command.indent === parentIndent && command.code === 411) {
      break;
    }
    if (command.indent <= parentIndent) {
      break;
    }
    index += 1;
  }

  return index;
}

export function findLoopBodyEnd(
  commands: readonly RawEventCommand[],
  startIndex: number,
  parentIndent: number,
): number {
  let index = startIndex;

  while (index < commands.length) {
    const command = commands[index];
    if (command === undefined || command.code === 0 || command.indent < parentIndent) {
      break;
    }
    if (command.indent === parentIndent && command.code === 413) {
      break;
    }
    if (command.indent <= parentIndent) {
      break;
    }
    index += 1;
  }

  return index;
}

export function conditionalVariableOperatorFromCode(
  value: unknown,
): "eq" | "ge" | "le" | "gt" | "lt" | "ne" | null {
  switch (value) {
    case 0:
      return "eq";
    case 1:
      return "ge";
    case 2:
      return "le";
    case 3:
      return "gt";
    case 4:
      return "lt";
    case 5:
      return "ne";
    default:
      return null;
  }
}

export function isButtonName(
  value: unknown,
): value is "ok" | "cancel" | "shift" | "down" | "left" | "right" | "up" | "pageup" | "pagedown" {
  return (
    value === "ok" ||
    value === "cancel" ||
    value === "shift" ||
    value === "down" ||
    value === "left" ||
    value === "right" ||
    value === "up" ||
    value === "pageup" ||
    value === "pagedown"
  );
}
