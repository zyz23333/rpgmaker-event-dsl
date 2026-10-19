import type {
  AbortBattleDslCommand,
  BattlerCommandTarget,
  ChangeEnemyHpDslCommand,
  ChangeEnemyMpDslCommand,
  ChangeEnemyStateDslCommand,
  ChangeEnemyTpDslCommand,
  EnemyAppearDslCommand,
  EnemyCommandTarget,
  EnemyRecoverAllDslCommand,
  EnemyTransformDslCommand,
  ForceActionDslCommand,
  OperateValueOperand,
  ReferenceValue,
  ShowBattleAnimationDslCommand,
} from "../../domain/types.js";

export function changeEnemyHp(input: {
  target: EnemyCommandTarget;
  operation: "gain" | "lose";
  value: OperateValueOperand;
  allowDeath?: boolean;
}): ChangeEnemyHpDslCommand {
  const node: ChangeEnemyHpDslCommand = {
    kind: "changeEnemyHp",
    target: input.target,
    operation: input.operation,
    value: input.value,
  };

  if (input.allowDeath !== undefined) {
    node.allowDeath = input.allowDeath;
  }

  return node;
}

export function changeEnemyMp(input: {
  target: EnemyCommandTarget;
  operation: "gain" | "lose";
  value: OperateValueOperand;
}): ChangeEnemyMpDslCommand {
  return {
    kind: "changeEnemyMp",
    target: input.target,
    operation: input.operation,
    value: input.value,
  };
}

export function changeEnemyState(input: {
  target: EnemyCommandTarget;
  operation: "add" | "remove";
  state: ReferenceValue<"state">;
}): ChangeEnemyStateDslCommand {
  return {
    kind: "changeEnemyState",
    target: input.target,
    operation: input.operation,
    state: input.state,
  };
}

export function enemyRecoverAll(input: { target: EnemyCommandTarget }): EnemyRecoverAllDslCommand {
  return {
    kind: "enemyRecoverAll",
    target: input.target,
  };
}

export function enemyAppear(input: { target: EnemyCommandTarget }): EnemyAppearDslCommand {
  return {
    kind: "enemyAppear",
    target: input.target,
  };
}

export function enemyTransform(input: {
  target: EnemyCommandTarget;
  enemy: ReferenceValue<"enemy">;
}): EnemyTransformDslCommand {
  return {
    kind: "enemyTransform",
    target: input.target,
    enemy: input.enemy,
  };
}

export function showBattleAnimation(input: {
  target: EnemyCommandTarget;
  animation: ReferenceValue<"animation">;
}): ShowBattleAnimationDslCommand {
  return {
    kind: "showBattleAnimation",
    target: input.target,
    animation: input.animation,
  };
}

export function forceAction(input: {
  subject: BattlerCommandTarget;
  skill: ReferenceValue<"skill">;
  targetIndex: number;
}): ForceActionDslCommand {
  return {
    kind: "forceAction",
    subject: input.subject,
    skill: input.skill,
    targetIndex: input.targetIndex,
  };
}

export function abortBattle(): AbortBattleDslCommand {
  return {
    kind: "abortBattle",
  };
}

export function changeEnemyTp(input: {
  target: EnemyCommandTarget;
  operation: "gain" | "lose";
  value: OperateValueOperand;
}): ChangeEnemyTpDslCommand {
  return {
    kind: "changeEnemyTp",
    target: input.target,
    operation: input.operation,
    value: input.value,
  };
}
