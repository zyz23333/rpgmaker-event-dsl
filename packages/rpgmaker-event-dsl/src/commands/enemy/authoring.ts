import type {
  ChangeEnemyHpDslCommand,
  ChangeEnemyMpDslCommand,
  ChangeEnemyTpDslCommand,
  ChangeEnemyStateDslCommand,
  EnemyRecoverAllDslCommand,
  EnemyAppearDslCommand,
  EnemyTransformDslCommand,
  ShowBattleAnimationDslCommand,
  ForceActionDslCommand,
  AbortBattleDslCommand,
} from "../../domain/types.js";
import { assertEnemyInput } from "./validation.js";

export function changeEnemyHp(
  input: Omit<ChangeEnemyHpDslCommand, "kind">,
): ChangeEnemyHpDslCommand {
  assertEnemyInput("changeEnemyHp", input, "changeEnemyHp");
  return { kind: "changeEnemyHp", ...input };
}

export function changeEnemyMp(
  input: Omit<ChangeEnemyMpDslCommand, "kind">,
): ChangeEnemyMpDslCommand {
  assertEnemyInput("changeEnemyMp", input, "changeEnemyMp");
  return { kind: "changeEnemyMp", ...input };
}

export function changeEnemyTp(
  input: Omit<ChangeEnemyTpDslCommand, "kind">,
): ChangeEnemyTpDslCommand {
  assertEnemyInput("changeEnemyTp", input, "changeEnemyTp");
  return { kind: "changeEnemyTp", ...input };
}

export function changeEnemyState(
  input: Omit<ChangeEnemyStateDslCommand, "kind">,
): ChangeEnemyStateDslCommand {
  assertEnemyInput("changeEnemyState", input, "changeEnemyState");
  return { kind: "changeEnemyState", ...input };
}

export function enemyRecoverAll(
  input: Omit<EnemyRecoverAllDslCommand, "kind">,
): EnemyRecoverAllDslCommand {
  assertEnemyInput("enemyRecoverAll", input, "enemyRecoverAll");
  return { kind: "enemyRecoverAll", ...input };
}

export function enemyAppear(input: Omit<EnemyAppearDslCommand, "kind">): EnemyAppearDslCommand {
  assertEnemyInput("enemyAppear", input, "enemyAppear");
  return { kind: "enemyAppear", ...input };
}

export function enemyTransform(
  input: Omit<EnemyTransformDslCommand, "kind">,
): EnemyTransformDslCommand {
  assertEnemyInput("enemyTransform", input, "enemyTransform");
  return { kind: "enemyTransform", ...input };
}

export function showBattleAnimation(
  input: Omit<ShowBattleAnimationDslCommand, "kind">,
): ShowBattleAnimationDslCommand {
  assertEnemyInput("showBattleAnimation", input, "showBattleAnimation");
  return { kind: "showBattleAnimation", ...input };
}

export function forceAction(input: Omit<ForceActionDslCommand, "kind">): ForceActionDslCommand {
  assertEnemyInput("forceAction", input, "forceAction");
  return { kind: "forceAction", ...input };
}
export function abortBattle(...args: never[]): AbortBattleDslCommand {
  if (args.length) throw new Error("MV-E340: Abort Battle accepts exactly zero inputs.");
  return { kind: "abortBattle" };
}
