import type {
  ConditionalBranchCondition,
  ConditionalVariableOperator,
  VehicleTarget,
} from "../../dsl.js";
import type { ReferenceResolver } from "../../staged-graph.js";
import { isReferenceValue, resolveControlValue } from "../commands.js";

export function compileConditionalBranchParameters(
  condition: ConditionalBranchCondition,
  resolver: ReferenceResolver,
): unknown[] {
  switch (condition.kind) {
    case "switch":
      return [0, resolver.resolveReference(condition.switch), resolveControlValue(condition.value)];
    case "variable":
      return [
        1,
        resolver.resolveReference(condition.variable),
        isReferenceValue(condition.value) ? 1 : 0,
        isReferenceValue(condition.value)
          ? resolver.resolveReference(condition.value)
          : condition.value,
        conditionalVariableOperatorToCode(condition.operator),
      ];
    case "selfSwitch":
      return [2, condition.selfSwitch, resolveControlValue(condition.value)];
    case "timer":
      return [3, condition.seconds, condition.operator === "ge" ? 0 : 1];
    case "actor":
      return [
        4,
        resolver.resolveReference(condition.actor),
        actorConditionCheckToCode(condition.check),
        actorConditionCheckValue(condition.check, resolver),
      ];
    case "enemy":
      return condition.check.kind === "appeared"
        ? [5, condition.enemyIndex, 0]
        : [5, condition.enemyIndex, 1, resolver.resolveReference(condition.check.state)];
    case "character":
      return [6, condition.characterId, condition.direction];
    case "gold":
      return [7, condition.amount, goldConditionOperatorToCode(condition.operator)];
    case "item":
      return [8, resolver.resolveReference(condition.item)];
    case "weapon":
      return [9, resolver.resolveReference(condition.weapon), condition.includeEquipment ?? false];
    case "armor":
      return [10, resolver.resolveReference(condition.armor), condition.includeEquipment ?? false];
    case "button":
      return [11, condition.button];
    case "script":
      return [12, condition.script.code];
    case "vehicle":
      return [13, vehicleToCode(condition.vehicle)];
  }
}

export function conditionalVariableOperatorToCode(operator: ConditionalVariableOperator): number {
  switch (operator) {
    case "eq":
      return 0;
    case "ge":
      return 1;
    case "le":
      return 2;
    case "gt":
      return 3;
    case "lt":
      return 4;
    case "ne":
      return 5;
  }
}

export function actorConditionCheckToCode(
  check: Extract<ConditionalBranchCondition, { kind: "actor" }>["check"],
): number {
  switch (check.kind) {
    case "inParty":
      return 0;
    case "name":
      return 1;
    case "class":
      return 2;
    case "skill":
      return 3;
    case "weapon":
      return 4;
    case "armor":
      return 5;
    case "state":
      return 6;
  }
}

export function actorConditionCheckValue(
  check: Extract<ConditionalBranchCondition, { kind: "actor" }>["check"],
  resolver: ReferenceResolver,
): unknown {
  switch (check.kind) {
    case "inParty":
      return 0;
    case "name":
      return check.name;
    case "class":
      return resolver.resolveReference(check.class);
    case "skill":
      return resolver.resolveReference(check.skill);
    case "weapon":
      return resolver.resolveReference(check.weapon);
    case "armor":
      return resolver.resolveReference(check.armor);
    case "state":
      return resolver.resolveReference(check.state);
  }
}

export function goldConditionOperatorToCode(
  operator: Extract<ConditionalBranchCondition, { kind: "gold" }>["operator"],
): number {
  switch (operator) {
    case "ge":
      return 0;
    case "le":
      return 1;
    case "lt":
      return 2;
  }
}

export function vehicleToCode(
  vehicle: Extract<ConditionalBranchCondition, { kind: "vehicle" }>["vehicle"] | VehicleTarget,
): number {
  switch (vehicle) {
    case "boat":
      return 0;
    case "ship":
      return 1;
    case "airship":
      return 2;
  }
}
