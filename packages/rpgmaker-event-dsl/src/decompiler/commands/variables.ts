import type { RawEventCommand, RenderedCommand } from "../../decompiler.js";
import { literal, readPositiveInteger } from "../../decompiler.js";

export function renderControlVariables(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const startVariableId = readPositiveInteger(command.parameters[0]);
  const endVariableId = readPositiveInteger(command.parameters[1]);
  const operationCode = command.parameters[2];
  const operandKind = command.parameters[3];

  if (
    startVariableId === null ||
    endVariableId === null ||
    typeof operationCode !== "number" ||
    typeof operandKind !== "number"
  ) {
    return null;
  }

  const operation = controlVariablesOperationFromCode(operationCode);
  if (operation === null) {
    return null;
  }

  if (operandKind === 0 && typeof command.parameters[4] === "number") {
    return {
      expression: `controlVariables({ variable: ${renderReferenceTarget("variableRef", startVariableId, endVariableId)}, operation: ${literal(operation)}, value: ${command.parameters[4]} })`,
      helperNames: ["controlVariables", "variableRef"],
    };
  }

  if (operandKind === 1) {
    const sourceVariableId = readPositiveInteger(command.parameters[4]);
    return sourceVariableId === null
      ? null
      : {
          expression: `controlVariables({ variable: ${renderReferenceTarget("variableRef", startVariableId, endVariableId)}, operation: ${literal(operation)}, value: variableRef({ id: ${sourceVariableId} }) })`,
          helperNames: ["controlVariables", "variableRef"],
        };
  }

  if (
    operandKind === 2 &&
    typeof command.parameters[4] === "number" &&
    typeof command.parameters[5] === "number"
  ) {
    return {
      expression: `controlVariables({ variable: ${renderReferenceTarget("variableRef", startVariableId, endVariableId)}, operation: ${literal(operation)}, value: { kind: "random", from: ${command.parameters[4]}, to: ${command.parameters[5]} } })`,
      helperNames: ["controlVariables", "variableRef"],
    };
  }

  if (operandKind === 3) {
    const operand = renderControlVariablesGameDataOperand(
      command.parameters[4],
      command.parameters[5],
      command.parameters[6],
    );
    return operand === null
      ? null
      : {
          expression: `controlVariables({ variable: ${renderReferenceTarget("variableRef", startVariableId, endVariableId)}, operation: ${literal(operation)}, value: ${operand.expression} })`,
          helperNames: ["controlVariables", "variableRef", ...operand.helperNames],
        };
  }

  if (operandKind === 4 && typeof command.parameters[4] === "string") {
    return {
      expression: `controlVariables({ variable: ${renderReferenceTarget("variableRef", startVariableId, endVariableId)}, operation: ${literal(operation)}, value: { kind: "script", script: scriptInput({ code: ${literal(command.parameters[4])} }) } })`,
      helperNames: ["controlVariables", "scriptInput", "variableRef"],
    };
  }

  return null;
}

export function renderReferenceTarget(
  helperName: "switchRef" | "variableRef",
  startId: number,
  endId: number,
): string {
  if (startId === endId) {
    return `${helperName}({ id: ${startId} })`;
  }

  return `{ kind: "referenceRange", from: ${helperName}({ id: ${startId} }), to: ${helperName}({ id: ${endId} }) }`;
}

export function renderOperateValueOperand(
  operationParameter: unknown,
  operandType: unknown,
  operand: unknown,
): { expression: string; helperNames: readonly string[]; operation: "gain" | "lose" } | null {
  const operation = operationParameter === 0 ? "gain" : operationParameter === 1 ? "lose" : null;
  if (operation === null) {
    return null;
  }

  if (operandType === 0 && typeof operand === "number") {
    return { expression: `${operand}`, helperNames: [], operation };
  }

  if (operandType === 1) {
    const variableId = readPositiveInteger(operand);
    return variableId === null
      ? null
      : {
          expression: `variableRef({ id: ${variableId} })`,
          helperNames: ["variableRef"],
          operation,
        };
  }

  return null;
}

export function renderControlVariablesGameDataOperand(
  type: unknown,
  param1: unknown,
  param2: unknown,
): { expression: string; helperNames: readonly string[] } | null {
  switch (type) {
    case 0: {
      const itemId = readPositiveInteger(param1);
      return itemId === null
        ? null
        : {
            expression: `{ kind: "gameData", source: "item", item: itemRef({ id: ${itemId} }) }`,
            helperNames: ["itemRef"],
          };
    }
    case 1: {
      const weaponId = readPositiveInteger(param1);
      return weaponId === null
        ? null
        : {
            expression: `{ kind: "gameData", source: "weapon", weapon: weaponRef({ id: ${weaponId} }) }`,
            helperNames: ["weaponRef"],
          };
    }
    case 2: {
      const armorId = readPositiveInteger(param1);
      return armorId === null
        ? null
        : {
            expression: `{ kind: "gameData", source: "armor", armor: armorRef({ id: ${armorId} }) }`,
            helperNames: ["armorRef"],
          };
    }
    case 3:
      return renderActorGameDataOperand(param1, param2);
    case 4:
      return renderEnemyGameDataOperand(param1, param2);
    case 5:
      return renderCharacterGameDataOperand(param1, param2);
    case 6:
      return typeof param1 === "number" && Number.isInteger(param1) && param1 >= 0
        ? {
            expression: `{ kind: "gameData", source: "party", memberIndex: ${param1} }`,
            helperNames: [],
          }
        : null;
    case 7: {
      const value = otherGameDataValueFromCode(param1);
      return value === null
        ? null
        : {
            expression: `{ kind: "gameData", source: "other", value: ${literal(value)} }`,
            helperNames: [],
          };
    }
    default:
      return null;
  }
}

export function renderActorGameDataOperand(
  actorParameter: unknown,
  valueParameter: unknown,
): { expression: string; helperNames: readonly string[] } | null {
  const actorId = readPositiveInteger(actorParameter);
  const value = actorGameDataValueFromCode(valueParameter);
  return actorId === null || value === null
    ? null
    : {
        expression: `{ kind: "gameData", source: "actor", actor: actorRef({ id: ${actorId} }), value: ${literal(value)} }`,
        helperNames: ["actorRef"],
      };
}

export function renderEnemyGameDataOperand(
  enemyIndex: unknown,
  valueParameter: unknown,
): { expression: string; helperNames: readonly string[] } | null {
  const value = enemyGameDataValueFromCode(valueParameter);
  return typeof enemyIndex === "number" &&
    Number.isInteger(enemyIndex) &&
    enemyIndex >= 0 &&
    value !== null
    ? {
        expression: `{ kind: "gameData", source: "enemy", enemyIndex: ${enemyIndex}, value: ${literal(value)} }`,
        helperNames: [],
      }
    : null;
}

export function renderCharacterGameDataOperand(
  characterId: unknown,
  valueParameter: unknown,
): { expression: string; helperNames: readonly string[] } | null {
  const value = characterGameDataValueFromCode(valueParameter);
  return typeof characterId === "number" && Number.isInteger(characterId) && value !== null
    ? {
        expression: `{ kind: "gameData", source: "character", characterId: ${characterId}, value: ${literal(value)} }`,
        helperNames: [],
      }
    : null;
}

export function controlVariablesOperationFromCode(
  value: number,
): "set" | "add" | "sub" | "mul" | "div" | "mod" | null {
  switch (value) {
    case 0:
      return "set";
    case 1:
      return "add";
    case 2:
      return "sub";
    case 3:
      return "mul";
    case 4:
      return "div";
    case 5:
      return "mod";
    default:
      return null;
  }
}

export function actorGameDataValueFromCode(
  value: unknown,
):
  | "level"
  | "exp"
  | "hp"
  | "mp"
  | "mhp"
  | "mmp"
  | "atk"
  | "def"
  | "mat"
  | "mdf"
  | "agi"
  | "luk"
  | null {
  switch (value) {
    case 0:
      return "level";
    case 1:
      return "exp";
    case 2:
      return "hp";
    case 3:
      return "mp";
    case 4:
      return "mhp";
    case 5:
      return "mmp";
    case 6:
      return "atk";
    case 7:
      return "def";
    case 8:
      return "mat";
    case 9:
      return "mdf";
    case 10:
      return "agi";
    case 11:
      return "luk";
    default:
      return null;
  }
}

export function enemyGameDataValueFromCode(
  value: unknown,
): "hp" | "mp" | "mhp" | "mmp" | "atk" | "def" | "mat" | "mdf" | "agi" | "luk" | null {
  switch (value) {
    case 0:
      return "hp";
    case 1:
      return "mp";
    case 2:
      return "mhp";
    case 3:
      return "mmp";
    case 4:
      return "atk";
    case 5:
      return "def";
    case 6:
      return "mat";
    case 7:
      return "mdf";
    case 8:
      return "agi";
    case 9:
      return "luk";
    default:
      return null;
  }
}

export function characterGameDataValueFromCode(
  value: unknown,
): "mapX" | "mapY" | "direction" | "screenX" | "screenY" | null {
  switch (value) {
    case 0:
      return "mapX";
    case 1:
      return "mapY";
    case 2:
      return "direction";
    case 3:
      return "screenX";
    case 4:
      return "screenY";
    default:
      return null;
  }
}

export function otherGameDataValueFromCode(
  value: unknown,
):
  | "mapId"
  | "partyMembers"
  | "gold"
  | "steps"
  | "playTime"
  | "timer"
  | "saveCount"
  | "battleCount"
  | "winCount"
  | "escapeCount"
  | null {
  switch (value) {
    case 0:
      return "mapId";
    case 1:
      return "partyMembers";
    case 2:
      return "gold";
    case 3:
      return "steps";
    case 4:
      return "playTime";
    case 5:
      return "timer";
    case 6:
      return "saveCount";
    case 7:
      return "battleCount";
    case 8:
      return "winCount";
    case 9:
      return "escapeCount";
    default:
      return null;
  }
}
