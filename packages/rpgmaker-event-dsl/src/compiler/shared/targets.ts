import type {
  ActorCommandTarget,
  BattlerCommandTarget,
  EnemyCommandTarget,
  ActorParameter,
} from "../../domain/types.js";
import type { ReferenceResolver } from "../../validation/types.js";

export function compileActorCommandTarget(
  target: ActorCommandTarget,
  resolver: ReferenceResolver,
): [number, number] {
  switch (target.target) {
    case "entireParty":
      return [0, 0];
    case "actor":
      return [0, target.actorId];
    case "actorFromVariable":
      return [1, resolver.resolveReference(target.variable)];
  }
}

export function enemyTargetToCode(target: EnemyCommandTarget): number {
  return target.target === "all" ? -1 : target.index;
}

export function battlerTargetTypeToCode(target: BattlerCommandTarget): number {
  return target.target === "enemy" ? 0 : 1;
}

export function battlerTargetIdToCode(target: BattlerCommandTarget): number {
  return target.target === "enemy" ? target.index : target.actorId;
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
