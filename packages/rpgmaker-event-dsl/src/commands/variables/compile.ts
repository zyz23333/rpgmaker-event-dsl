import type {
  CommandOperand,
  ControlVariablesDslCommand,
  OperateValueOperand,
  ReferenceKind,
  ReferenceRange,
  ReferenceValue,
} from "../../domain/types.js";
import type { ReferenceResolver } from "../../validation/types.js";

export function resolveControlValue(value: boolean): number {
  return value ? 0 : 1;
}

export function isReferenceValue(value: unknown): value is ReferenceValue<"variable"> {
  return (
    !!value &&
    typeof value === "object" &&
    "kind" in value &&
    (value as { kind?: unknown }).kind === "variable"
  );
}

export function compileControlVariablesParameters(
  node: ControlVariablesDslCommand,
  resolver: ReferenceResolver,
): unknown[] {
  const [startVariableId, endVariableId] = compileReferenceTargetRange(node.variable, resolver);
  const operation =
    node.operation === "set"
      ? 0
      : node.operation === "add"
        ? 1
        : node.operation === "sub"
          ? 2
          : node.operation === "mul"
            ? 3
            : node.operation === "div"
              ? 4
              : 5;

  if (typeof node.value === "number") {
    return [startVariableId, endVariableId, operation, 0, node.value];
  }

  if ("kind" in node.value && node.value.kind === "random") {
    return [startVariableId, endVariableId, operation, 2, node.value.from, node.value.to];
  }

  if ("kind" in node.value && node.value.kind === "script") {
    return [startVariableId, endVariableId, operation, 4, node.value.script.code];
  }

  if ("kind" in node.value && node.value.kind === "gameData") {
    return [
      startVariableId,
      endVariableId,
      operation,
      3,
      ...compileControlVariablesGameDataOperand(node.value, resolver),
    ];
  }

  return [startVariableId, endVariableId, operation, 1, resolver.resolveReference(node.value)];
}

export function compileReferenceTargetRange<TKind extends ReferenceKind>(
  target: ReferenceValue<TKind> | ReferenceRange<TKind>,
  resolver: ReferenceResolver,
): [number, number] {
  if ("from" in target) {
    return [resolver.resolveReference(target.from), resolver.resolveReference(target.to)];
  }

  const id = resolver.resolveReference(target);
  return [id, id];
}

export function compileOperateValueParameters(
  operation: "gain" | "lose",
  operand: OperateValueOperand,
  resolver: ReferenceResolver,
): [number, number, number] {
  return [
    operation === "gain" ? 0 : 1,
    isReferenceValue(operand) ? 1 : 0,
    isReferenceValue(operand) ? resolver.resolveReference(operand) : operand,
  ];
}

export function compileControlVariablesGameDataOperand(
  operand: Extract<CommandOperand, { kind: "gameData" }>,
  resolver: ReferenceResolver,
): [number, number, number] {
  switch (operand.source) {
    case "item":
      return [0, resolver.resolveReference(operand.item), 0];
    case "weapon":
      return [1, resolver.resolveReference(operand.weapon), 0];
    case "armor":
      return [2, resolver.resolveReference(operand.armor), 0];
    case "actor":
      return [3, resolver.resolveReference(operand.actor), actorGameDataValueToCode(operand.value)];
    case "enemy":
      return [4, operand.enemyIndex, enemyGameDataValueToCode(operand.value)];
    case "character":
      return [5, operand.characterId, characterGameDataValueToCode(operand.value)];
    case "party":
      return [6, operand.memberIndex, 0];
    case "other":
      return [7, otherGameDataValueToCode(operand.value), 0];
  }
}

export function actorGameDataValueToCode(
  value: Extract<CommandOperand, { kind: "gameData"; source: "actor" }>["value"],
): number {
  switch (value) {
    case "level":
      return 0;
    case "exp":
      return 1;
    case "hp":
      return 2;
    case "mp":
      return 3;
    case "mhp":
      return 4;
    case "mmp":
      return 5;
    case "atk":
      return 6;
    case "def":
      return 7;
    case "mat":
      return 8;
    case "mdf":
      return 9;
    case "agi":
      return 10;
    case "luk":
      return 11;
  }
}

export function enemyGameDataValueToCode(
  value: Extract<CommandOperand, { kind: "gameData"; source: "enemy" }>["value"],
): number {
  switch (value) {
    case "hp":
      return 0;
    case "mp":
      return 1;
    case "mhp":
      return 2;
    case "mmp":
      return 3;
    case "atk":
      return 4;
    case "def":
      return 5;
    case "mat":
      return 6;
    case "mdf":
      return 7;
    case "agi":
      return 8;
    case "luk":
      return 9;
  }
}

export function characterGameDataValueToCode(
  value: Extract<CommandOperand, { kind: "gameData"; source: "character" }>["value"],
): number {
  switch (value) {
    case "mapX":
      return 0;
    case "mapY":
      return 1;
    case "direction":
      return 2;
    case "screenX":
      return 3;
    case "screenY":
      return 4;
  }
}

export function otherGameDataValueToCode(
  value: Extract<CommandOperand, { kind: "gameData"; source: "other" }>["value"],
): number {
  switch (value) {
    case "mapId":
      return 0;
    case "partyMembers":
      return 1;
    case "gold":
      return 2;
    case "steps":
      return 3;
    case "playTime":
      return 4;
    case "timer":
      return 5;
    case "saveCount":
      return 6;
    case "battleCount":
      return 7;
    case "winCount":
      return 8;
    case "escapeCount":
      return 9;
  }
}
