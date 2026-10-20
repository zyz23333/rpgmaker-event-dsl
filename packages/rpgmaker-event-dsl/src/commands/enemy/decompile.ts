import type { RawEventCommand, RenderedCommand } from "../../decompiler/types.js";
import { literal, readPositiveInteger } from "../../decompiler/core.js";
import { renderJsonValue } from "../../project-data/json-values.js";

export function renderEnemyOperateValueCommand(
  command: RawEventCommand,
  helperName: "changeEnemyHp" | "changeEnemyMp" | "changeEnemyTp",
  hasAllowDeath: boolean,
): Omit<RenderedCommand, "nextIndex"> | null {
  const target = renderEnemyCommandTarget(command.parameters[0]);
  const operation = command.parameters[1] === 0 ? "gain" : "lose";
  const variable = command.parameters[2] === 1;
  const value = variable
    ? `{ kind: "variable", variable: variableRef({ id: ${command.parameters[3]} }) }`
    : `{ kind: "constant", value: ${renderJsonValue(command.parameters[3])} }`;
  if (target === null) return null;
  return {
    expression: `${helperName}({ target: ${target.expression}, operation: ${literal(operation)}, value: ${value}${hasAllowDeath ? ", allowDeath: " + command.parameters[4] : ""} })`,
    helperNames: [helperName, ...target.helperNames, ...(variable ? ["variableRef"] : [])],
  };
}

export function renderChangeEnemyState(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const target = renderEnemyCommandTarget(command.parameters[0]);
  const operation =
    command.parameters[1] === 0 ? "add" : command.parameters[1] === 1 ? "remove" : null;
  const stateId = readPositiveInteger(command.parameters[2]);
  return target === null || operation === null || stateId === null
    ? null
    : {
        expression: `changeEnemyState({ target: ${target.expression}, operation: ${literal(operation)}, state: stateRef({ id: ${stateId} }) })`,
        helperNames: ["changeEnemyState", "stateRef", ...target.helperNames],
      };
}

export function renderEnemyTargetOnlyCommand(
  command: RawEventCommand,
  helperName: "enemyAppear" | "enemyRecoverAll",
): Omit<RenderedCommand, "nextIndex"> | null {
  const target = renderEnemyCommandTarget(command.parameters[0]);
  return target === null
    ? null
    : {
        expression: `${helperName}({ target: ${target.expression} })`,
        helperNames: [helperName, ...target.helperNames],
      };
}

export function renderEnemyTransform(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const target = renderEnemyCommandTarget(command.parameters[0]);
  const enemyId = readPositiveInteger(command.parameters[1]);
  return target === null || enemyId === null
    ? null
    : {
        expression: `enemyTransform({ target: ${target.expression}, enemy: enemyRef({ id: ${enemyId} }) })`,
        helperNames: ["enemyRef", "enemyTransform", ...target.helperNames],
      };
}

export function renderShowBattleAnimation(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const animationId = readPositiveInteger(command.parameters[1]);
  const allEnemies = command.parameters[2];
  const target = renderEnemyCommandTarget(command.parameters[0]);
  return target === null || animationId === null || typeof allEnemies !== "boolean"
    ? null
    : {
        expression: `showBattleAnimation({ target: ${target.expression}, animation: animationRef({ id: ${animationId} }), allEnemies: ${allEnemies} })`,
        helperNames: ["animationRef", "showBattleAnimation", ...target.helperNames],
      };
}

export function renderForceAction(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const subject = renderBattlerCommandTarget(command.parameters[0], command.parameters[1]);
  const skillId = readPositiveInteger(command.parameters[2]);
  const targetIndex = command.parameters[3];
  const target =
    targetIndex === -2
      ? `{ kind: "lastTarget" }`
      : targetIndex === -1
        ? `{ kind: "random" }`
        : `{ kind: "index", index: ${renderJsonValue(targetIndex)} }`;
  return subject === null || skillId === null || typeof targetIndex !== "number"
    ? null
    : {
        expression: `forceAction({ subject: ${subject.expression}, skill: skillRef({ id: ${skillId} }), target: ${target} })`,
        helperNames: ["forceAction", "skillRef", ...subject.helperNames],
      };
}

export function renderEnemyCommandTarget(
  value: unknown,
): { expression: string; helperNames: readonly string[] } | null {
  if (value === -1) {
    return {
      expression: `{ kind: "runtimeSelector", scope: "enemy", target: "all" }`,
      helperNames: [],
    };
  }

  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 7
    ? {
        expression: `{ kind: "runtimeSelector", scope: "enemy", target: "enemy", index: ${renderJsonValue(value)} }`,
        helperNames: [],
      }
    : null;
}

export function renderBattlerCommandTarget(
  targetKind: unknown,
  targetValue: unknown,
): { expression: string; helperNames: readonly string[] } | null {
  if (
    targetKind === 0 &&
    typeof targetValue === "number" &&
    Number.isInteger(targetValue) &&
    targetValue >= 0
  ) {
    return {
      expression: `{ kind: "runtimeSelector", scope: "battler", target: "enemy", index: ${renderJsonValue(targetValue)} }`,
      helperNames: [],
    };
  }

  const actorId = readPositiveInteger(targetValue);
  if (targetKind === 1 && actorId !== null) {
    return {
      expression: `{ kind: "runtimeSelector", scope: "battler", target: "actor", actor: actorRef({ id: ${actorId} }) }`,
      helperNames: ["actorRef"],
    };
  }

  return null;
}
