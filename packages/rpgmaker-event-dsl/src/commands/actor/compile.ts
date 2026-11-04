import type { ActorResourceOperand, ActorResourceTarget } from "../../domain/types.js";
import type { ReferenceResolver } from "../../validation/types.js";

export function compileActorResourceTarget(
  target: ActorResourceTarget,
  resolver: ReferenceResolver,
): [number, number] {
  switch (target.target) {
    case "entireParty":
      return [0, 0];
    case "actor":
      return [0, resolver.resolveReference(target.actor)];
    case "actorFromVariable":
      return [1, resolver.resolveReference(target.variable)];
  }
}

export function compileActorResourceValue(
  operation: "gain" | "lose",
  operand: ActorResourceOperand,
  resolver: ReferenceResolver,
): [number, number, number] {
  return [
    operation === "gain" ? 0 : 1,
    operand.kind === "constant" ? 0 : 1,
    operand.kind === "constant" ? operand.value : resolver.resolveReference(operand.variable),
  ];
}
