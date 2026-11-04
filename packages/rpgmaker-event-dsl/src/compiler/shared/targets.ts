import type {
  BattlerCommandTarget,
  EnemyCommandTarget,
  ActorParameter,
} from "../../domain/types.js";
import type { ReferenceResolver } from "../../validation/types.js";

export function enemyTargetToCode(target: EnemyCommandTarget): number {
  return target.target === "all" ? -1 : target.index;
}

export function battlerTargetTypeToCode(target: BattlerCommandTarget): number {
  return target.target === "enemy" ? 0 : 1;
}

export function battlerTargetIdToCode(
  target: BattlerCommandTarget,
  resolver: ReferenceResolver,
): number {
  return target.target === "enemy" ? target.index : resolver.resolveReference(target.actor);
}

export function actorParameterToCode(parameter: ActorParameter): number {
  switch (parameter) {
    case "mhp":
      return 0;
    case "mmp":
      return 1;
    case "atk":
      return 2;
    case "def":
      return 3;
    case "mat":
      return 4;
    case "mdf":
      return 5;
    case "agi":
      return 6;
    case "luk":
      return 7;
  }
}
