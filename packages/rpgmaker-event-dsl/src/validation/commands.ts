import type {
  ConditionalBranchCondition,
  DslCommand,
  EventPage,
  MoveRouteCommand,
  PageConditions,
  ReferenceKind,
  ReferenceValue,
  RuntimeSelector,
} from "../dsl.js";
import { isProjectDataReference } from "../dsl.js";
import type { ReferenceResolver, ValidationIssue } from "../staged-graph.js";
import { captureReferenceIssue, isReferenceValue } from "../staged-graph.js";

export function validatePages(
  pages: readonly EventPage[],
  resolver: ReferenceResolver,
  options: { scriptEnabled: boolean },
  issues: ValidationIssue[],
): void {
  for (const page of pages) {
    validateCondition(page.conditions, resolver, issues);
    validateNodes(page.commands, resolver, options, issues);
  }
}

export function validateNodes(
  nodes: readonly DslCommand[],
  resolver: ReferenceResolver,
  options: { scriptEnabled: boolean },
  issues: ValidationIssue[],
): void {
  for (const node of nodes) {
    if (node.kind === "script" && !options.scriptEnabled) {
      issues.push({
        level: "error",
        message: "Script commands require explicit config enablement.",
      });
    }
    if (node.kind === "controlSwitches") {
      validateReferenceOrRange(node.switch, resolver, issues);
    }
    if (node.kind === "controlVariables") {
      validateReferenceOrRange(node.variable, resolver, issues);
      if (isVariableReferenceValue(node.value)) {
        const valueRef = node.value;
        captureReferenceIssue(() => resolver.resolveReference(valueRef), issues);
      }
      if (typeof node.value === "object" && node.value !== null && "kind" in node.value) {
        if (node.value.kind === "script" && !options.scriptEnabled) {
          issues.push({
            level: "error",
            message: "Control Variables script operands require explicit config enablement.",
          });
        }
        if (node.value.kind === "gameData") {
          validateControlVariablesGameDataOperand(node.value, resolver, issues);
        }
      }
    }
    if (node.kind === "changeItems") {
      captureReferenceIssue(() => resolver.resolveReference(node.item), issues);
      if (isVariableReferenceValue(node.amount)) {
        const amountRef = node.amount;
        captureReferenceIssue(() => resolver.resolveReference(amountRef), issues);
      }
    }
    if (node.kind === "changeWeapons") {
      captureReferenceIssue(() => resolver.resolveReference(node.weapon), issues);
      if (isVariableReferenceValue(node.amount)) {
        const amountRef = node.amount;
        captureReferenceIssue(() => resolver.resolveReference(amountRef), issues);
      }
    }
    if (node.kind === "changeArmors") {
      captureReferenceIssue(() => resolver.resolveReference(node.armor), issues);
      if (isVariableReferenceValue(node.amount)) {
        const amountRef = node.amount;
        captureReferenceIssue(() => resolver.resolveReference(amountRef), issues);
      }
    }
    if (node.kind === "changeGold" && isVariableReferenceValue(node.value)) {
      const valueRef = node.value;
      captureReferenceIssue(() => resolver.resolveReference(valueRef), issues);
    }
    if (node.kind === "changePartyMember") {
      captureReferenceIssue(() => resolver.resolveReference(node.actor), issues);
    }
    if (node.kind === "inputNumber" || node.kind === "selectItem") {
      captureReferenceIssue(() => resolver.resolveReference(node.variable), issues);
    }
    if (node.kind === "showChoices" && node.branches.length !== node.choices.length) {
      issues.push({
        level: "error",
        message: "Show Choices branches must match the choice count.",
      });
    }
    if (node.kind === "showChoices") {
      for (const branch of node.branches) {
        validateNodes(branch, resolver, options, issues);
      }
      if (node.cancelBranch) {
        validateNodes(node.cancelBranch, resolver, options, issues);
      }
    }
    if (node.kind === "commonEvent") {
      captureReferenceIssue(() => resolver.resolveReference(node.ref), issues);
    }
    if (node.kind === "transferPlayer") {
      validateMapDestination(node.destination, resolver, issues);
    }
    if (node.kind === "setVehicleLocation") {
      validateMapDestination(node.destination, resolver, issues);
    }
    if (node.kind === "setEventLocation") {
      validateCharacterRuntimeSelector(node.character, "Set Event Location character", issues);
      validateEventLocationDestination(node.destination, resolver, issues);
    }
    if (node.kind === "setMovementRoute") {
      validateCharacterRuntimeSelector(node.target, "Set Movement Route target", issues);
      validateMoveRouteCommands(node.route, resolver, options, issues);
    }
    if (node.kind === "showAnimation") {
      validateCharacterRuntimeSelector(node.target, "Show Animation target", issues);
      captureReferenceIssue(() => resolver.resolveReference(node.animation), issues);
    }
    if (node.kind === "showBalloonIcon") {
      validateCharacterRuntimeSelector(node.target, "Show Balloon Icon target", issues);
    }
    if (node.kind === "showPicture" || node.kind === "movePicture") {
      validateCommandPosition(node.position, resolver, issues);
    }
    if (node.kind === "battleProcessing" && isReferenceValue(node.troop)) {
      const troopRef = node.troop;
      captureReferenceIssue(() => resolver.resolveReference(troopRef), issues);
    }
    if (
      node.kind === "battleProcessing" &&
      typeof node.troop === "object" &&
      node.troop.kind === "troop" &&
      "variable" in node.troop
    ) {
      const troopVariable = node.troop.variable;
      captureReferenceIssue(() => resolver.resolveReference(troopVariable), issues);
    }
    if (node.kind === "battleProcessing") {
      if (node.win) {
        validateNodes(node.win, resolver, options, issues);
      }
      if (node.escape) {
        if (node.canEscape !== true) {
          issues.push({
            level: "error",
            message: "Battle Processing escape branch requires canEscape: true.",
          });
        }
        validateNodes(node.escape, resolver, options, issues);
      }
      if (node.lose) {
        if (node.canLose !== true) {
          issues.push({
            level: "error",
            message: "Battle Processing lose branch requires canLose: true.",
          });
        }
        validateNodes(node.lose, resolver, options, issues);
      }
    }
    if (node.kind === "shopProcessing") {
      for (const goods of node.goods) {
        captureReferenceIssue(() => resolver.resolveReference(goods.item), issues);
      }
    }
    if (node.kind === "nameInputProcessing") {
      captureReferenceIssue(() => resolver.resolveReference(node.actor), issues);
    }
    if (
      node.kind === "changeHp" ||
      node.kind === "changeMp" ||
      node.kind === "recoverAll" ||
      node.kind === "changeExp" ||
      node.kind === "changeLevel" ||
      node.kind === "changeParameter" ||
      node.kind === "changeSkill" ||
      node.kind === "changeTp"
    ) {
      validateActorCommandTarget(node.target, resolver, `${node.kind} target`, issues);
    }
    if (
      node.kind === "changeHp" ||
      node.kind === "changeMp" ||
      node.kind === "changeExp" ||
      node.kind === "changeLevel" ||
      node.kind === "changeParameter" ||
      node.kind === "changeTp"
    ) {
      validateOperateValueOperand(node.value, resolver, issues);
    }
    if (node.kind === "changeState") {
      validateActorCommandTarget(node.target, resolver, "Change State target", issues);
      captureReferenceIssue(() => resolver.resolveReference(node.state), issues);
    }
    if (node.kind === "changeSkill") {
      captureReferenceIssue(() => resolver.resolveReference(node.skill), issues);
    }
    if (node.kind === "changeEquipment") {
      captureReferenceIssue(() => resolver.resolveReference(node.actor), issues);
      validateCommandPositiveInteger(
        node.equipmentTypeId,
        "Change Equipment equipment type id",
        issues,
      );
      validateCommandNonNegativeInteger(node.itemId ?? 0, "Change Equipment item id", issues);
    }
    if (node.kind === "changeName") {
      captureReferenceIssue(() => resolver.resolveReference(node.actor), issues);
    }
    if (node.kind === "changeClass") {
      captureReferenceIssue(() => resolver.resolveReference(node.actor), issues);
      captureReferenceIssue(() => resolver.resolveReference(node.class), issues);
    }
    if (node.kind === "changeActorImages") {
      captureReferenceIssue(() => resolver.resolveReference(node.actor), issues);
    }
    if (node.kind === "changeNickname" || node.kind === "changeProfile") {
      captureReferenceIssue(() => resolver.resolveReference(node.actor), issues);
    }
    if (
      node.kind === "changeEnemyHp" ||
      node.kind === "changeEnemyMp" ||
      node.kind === "enemyRecoverAll" ||
      node.kind === "enemyAppear" ||
      node.kind === "enemyTransform" ||
      node.kind === "showBattleAnimation" ||
      node.kind === "changeEnemyTp"
    ) {
      validateEnemyCommandTarget(node.target, `${node.kind} target`, issues);
    }
    if (
      node.kind === "changeEnemyHp" ||
      node.kind === "changeEnemyMp" ||
      node.kind === "changeEnemyTp"
    ) {
      validateOperateValueOperand(node.value, resolver, issues);
    }
    if (node.kind === "changeEnemyState") {
      validateEnemyCommandTarget(node.target, "Change Enemy State target", issues);
      captureReferenceIssue(() => resolver.resolveReference(node.state), issues);
    }
    if (node.kind === "enemyTransform") {
      captureReferenceIssue(() => resolver.resolveReference(node.enemy), issues);
    }
    if (node.kind === "showBattleAnimation") {
      captureReferenceIssue(() => resolver.resolveReference(node.animation), issues);
    }
    if (node.kind === "forceAction") {
      validateBattlerCommandTarget(node.subject, "Force Action subject", issues);
      captureReferenceIssue(() => resolver.resolveReference(node.skill), issues);
    }
    if (node.kind === "changeTileset") {
      captureReferenceIssue(() => resolver.resolveReference(node.tileset), issues);
    }
    if (node.kind === "getLocationInfo") {
      captureReferenceIssue(() => resolver.resolveReference(node.variable), issues);
      validateCommandPosition(node.location, resolver, issues);
    }
    if (node.kind === "conditional") {
      validateConditionalBranchCondition(node.condition, resolver, options, issues);
      validateNodes(node.then, resolver, options, issues);
      if (node.else) {
        validateNodes(node.else, resolver, options, issues);
      }
    }
  }
}

export function validateCommandPosition(
  position: Extract<DslCommand, { kind: "showPicture" | "movePicture" }>["position"],
  resolver: ReferenceResolver,
  issues: ValidationIssue[],
): void {
  if (position.kind === "variables") {
    captureReferenceIssue(() => resolver.resolveReference(position.x), issues);
    captureReferenceIssue(() => resolver.resolveReference(position.y), issues);
  }
}

export function validateMoveRouteCommands(
  route: readonly MoveRouteCommand[],
  resolver: ReferenceResolver,
  options: { scriptEnabled: boolean },
  issues: ValidationIssue[],
): void {
  for (const command of route) {
    if (command.kind === "switchOn" || command.kind === "switchOff") {
      captureReferenceIssue(() => resolver.resolveReference(command.switch), issues);
    }

    if (command.kind === "script" && !options.scriptEnabled) {
      issues.push({
        level: "error",
        message: "Set Movement Route script commands require explicit config enablement.",
      });
    }
  }
}

export function validateMapDestination(
  destination: Extract<
    DslCommand,
    { kind: "setVehicleLocation" | "transferPlayer" }
  >["destination"],
  resolver: ReferenceResolver,
  issues: ValidationIssue[],
): void {
  if (destination.kind === "direct") {
    captureReferenceIssue(() => resolver.resolveReference(destination.map), issues);
    return;
  }

  captureReferenceIssue(() => resolver.resolveReference(destination.map), issues);
  captureReferenceIssue(() => resolver.resolveReference(destination.x), issues);
  captureReferenceIssue(() => resolver.resolveReference(destination.y), issues);
}

export function validateEventLocationDestination(
  destination: Extract<DslCommand, { kind: "setEventLocation" }>["destination"],
  resolver: ReferenceResolver,
  issues: ValidationIssue[],
): void {
  if (destination.kind === "variables") {
    captureReferenceIssue(() => resolver.resolveReference(destination.x), issues);
    captureReferenceIssue(() => resolver.resolveReference(destination.y), issues);
    return;
  }

  if (destination.kind === "exchange") {
    validateCharacterRuntimeSelector(
      destination.character,
      "Set Event Location exchange character",
      issues,
    );
  }
}

export function validateCharacterRuntimeSelector(
  selector: RuntimeSelector,
  fieldName: string,
  issues: ValidationIssue[],
): void {
  if (selector.scope !== "character") {
    issues.push({
      level: "error",
      message: `${fieldName} must use the character runtime selector scope.`,
    });
    return;
  }

  if (selector.target === "player" || selector.target === "currentEvent") {
    if ("id" in selector) {
      issues.push({
        level: "error",
        message: `${fieldName} must not include an id for ${selector.target}.`,
      });
    }
    return;
  }

  if (selector.target === "event") {
    const eventSelector = selector as RuntimeSelector & { id?: unknown };
    if (
      typeof eventSelector.id !== "number" ||
      !Number.isInteger(eventSelector.id) ||
      eventSelector.id <= 0
    ) {
      issues.push({
        level: "error",
        message: `${fieldName} event id must be a positive integer.`,
      });
    }
    return;
  }

  issues.push({
    level: "error",
    message: `${fieldName} target must be player, currentEvent, or event.`,
  });
}

export function validateActorCommandTarget(
  selector: RuntimeSelector,
  resolver: ReferenceResolver,
  fieldName: string,
  issues: ValidationIssue[],
): void {
  if (selector.scope !== "actor") {
    issues.push({
      level: "error",
      message: `${fieldName} must use the actor runtime selector scope.`,
    });
    return;
  }

  if (selector.target === "entireParty") {
    return;
  }

  const actorSelector = selector as RuntimeSelector & {
    actorId?: unknown;
    variable?: ReferenceValue<"variable">;
  };
  if (selector.target === "actor") {
    if (
      typeof actorSelector.actorId !== "number" ||
      !Number.isInteger(actorSelector.actorId) ||
      actorSelector.actorId <= 0
    ) {
      issues.push({
        level: "error",
        message: `${fieldName} actor id must be a positive integer.`,
      });
    }
    return;
  }

  if (selector.target === "actorFromVariable") {
    const actorVariable = actorSelector.variable;
    if (actorVariable === undefined) {
      issues.push({
        level: "error",
        message: `${fieldName} actorFromVariable target requires a variable reference.`,
      });
      return;
    }
    captureReferenceIssue(() => resolver.resolveReference(actorVariable), issues);
    return;
  }

  issues.push({
    level: "error",
    message: `${fieldName} target must be entireParty, actor, or actorFromVariable.`,
  });
}

export function validateEnemyCommandTarget(
  selector: RuntimeSelector,
  fieldName: string,
  issues: ValidationIssue[],
): void {
  if (selector.scope !== "enemy") {
    issues.push({
      level: "error",
      message: `${fieldName} must use the enemy runtime selector scope.`,
    });
    return;
  }

  if (selector.target === "all") {
    return;
  }

  const enemySelector = selector as RuntimeSelector & { index?: unknown };
  if (selector.target === "enemy") {
    if (
      typeof enemySelector.index !== "number" ||
      !Number.isInteger(enemySelector.index) ||
      enemySelector.index < 0
    ) {
      issues.push({
        level: "error",
        message: `${fieldName} enemy index must be a zero-based integer.`,
      });
    }
    return;
  }

  issues.push({
    level: "error",
    message: `${fieldName} target must be all or enemy.`,
  });
}

export function validateBattlerCommandTarget(
  selector: RuntimeSelector,
  fieldName: string,
  issues: ValidationIssue[],
): void {
  if (selector.scope !== "battler") {
    issues.push({
      level: "error",
      message: `${fieldName} must use the battler runtime selector scope.`,
    });
    return;
  }

  const battlerSelector = selector as RuntimeSelector & { actorId?: unknown; index?: unknown };
  if (selector.target === "enemy") {
    if (
      typeof battlerSelector.index !== "number" ||
      !Number.isInteger(battlerSelector.index) ||
      battlerSelector.index < 0
    ) {
      issues.push({
        level: "error",
        message: `${fieldName} enemy index must be a zero-based integer.`,
      });
    }
    return;
  }

  if (selector.target === "actor") {
    if (
      typeof battlerSelector.actorId !== "number" ||
      !Number.isInteger(battlerSelector.actorId) ||
      battlerSelector.actorId <= 0
    ) {
      issues.push({
        level: "error",
        message: `${fieldName} actor id must be a positive integer.`,
      });
    }
    return;
  }

  issues.push({
    level: "error",
    message: `${fieldName} target must be enemy or actor.`,
  });
}

export function validateOperateValueOperand(
  operand: number | ReferenceValue<"variable">,
  resolver: ReferenceResolver,
  issues: ValidationIssue[],
): void {
  if (isVariableReferenceValue(operand)) {
    captureReferenceIssue(() => resolver.resolveReference(operand), issues);
  }
}

export function validateCommandPositiveInteger(
  value: unknown,
  fieldName: string,
  issues: ValidationIssue[],
): void {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    issues.push({
      level: "error",
      message: `${fieldName} must be a positive integer.`,
    });
  }
}

export function validateCommandNonNegativeInteger(
  value: unknown,
  fieldName: string,
  issues: ValidationIssue[],
): void {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    issues.push({
      level: "error",
      message: `${fieldName} must be a non-negative integer.`,
    });
  }
}

export function validateReferenceOrRange<TKind extends ReferenceKind>(
  value: ReferenceValue<TKind> | { from: ReferenceValue<TKind>; to: ReferenceValue<TKind> },
  resolver: ReferenceResolver,
  issues: ValidationIssue[],
): void {
  if ("from" in value) {
    captureReferenceIssue(() => resolver.resolveReference(value.from), issues);
    captureReferenceIssue(() => resolver.resolveReference(value.to), issues);
    return;
  }

  captureReferenceIssue(() => resolver.resolveReference(value), issues);
}

export function validateControlVariablesGameDataOperand(
  operand: Extract<
    Extract<DslCommand, { kind: "controlVariables" }>["value"],
    { kind: "gameData" }
  >,
  resolver: ReferenceResolver,
  issues: ValidationIssue[],
): void {
  switch (operand.source) {
    case "item":
      captureReferenceIssue(() => resolver.resolveReference(operand.item), issues);
      break;
    case "weapon":
      captureReferenceIssue(() => resolver.resolveReference(operand.weapon), issues);
      break;
    case "armor":
      captureReferenceIssue(() => resolver.resolveReference(operand.armor), issues);
      break;
    case "actor":
      captureReferenceIssue(() => resolver.resolveReference(operand.actor), issues);
      break;
    case "enemy":
    case "character":
    case "party":
    case "other":
      break;
  }
}

export function validateConditionalBranchCondition(
  condition: ConditionalBranchCondition,
  resolver: ReferenceResolver,
  options: { scriptEnabled: boolean },
  issues: ValidationIssue[],
): void {
  switch (condition.kind) {
    case "switch":
      captureReferenceIssue(() => resolver.resolveReference(condition.switch), issues);
      break;
    case "variable":
      captureReferenceIssue(() => resolver.resolveReference(condition.variable), issues);
      if (isVariableReferenceValue(condition.value)) {
        const valueRef = condition.value;
        captureReferenceIssue(() => resolver.resolveReference(valueRef), issues);
      }
      break;
    case "actor":
      captureReferenceIssue(() => resolver.resolveReference(condition.actor), issues);
      validateActorConditionCheck(condition.check, resolver, issues);
      break;
    case "enemy":
      if (condition.check.kind === "state") {
        const stateRef = condition.check.state;
        captureReferenceIssue(() => resolver.resolveReference(stateRef), issues);
      }
      break;
    case "item":
      captureReferenceIssue(() => resolver.resolveReference(condition.item), issues);
      break;
    case "weapon":
      captureReferenceIssue(() => resolver.resolveReference(condition.weapon), issues);
      break;
    case "armor":
      captureReferenceIssue(() => resolver.resolveReference(condition.armor), issues);
      break;
    case "script":
      if (!options.scriptEnabled) {
        issues.push({
          level: "error",
          message: "Conditional Branch script conditions require explicit config enablement.",
        });
      }
      break;
    case "selfSwitch":
    case "timer":
    case "character":
    case "gold":
    case "button":
    case "vehicle":
      break;
  }
}

export function validateActorConditionCheck(
  check: Extract<ConditionalBranchCondition, { kind: "actor" }>["check"],
  resolver: ReferenceResolver,
  issues: ValidationIssue[],
): void {
  switch (check.kind) {
    case "class":
      captureReferenceIssue(() => resolver.resolveReference(check.class), issues);
      break;
    case "skill":
      captureReferenceIssue(() => resolver.resolveReference(check.skill), issues);
      break;
    case "weapon":
      captureReferenceIssue(() => resolver.resolveReference(check.weapon), issues);
      break;
    case "armor":
      captureReferenceIssue(() => resolver.resolveReference(check.armor), issues);
      break;
    case "state":
      captureReferenceIssue(() => resolver.resolveReference(check.state), issues);
      break;
    case "inParty":
    case "name":
      break;
  }
}

export function validateCondition(
  condition: PageConditions,
  resolver: ReferenceResolver,
  issues: ValidationIssue[],
): void {
  if (condition.actor) {
    const actorRef = condition.actor;
    captureReferenceIssue(() => resolver.resolveReference(actorRef), issues);
  }
  if (condition.item) {
    const itemRef = condition.item;
    captureReferenceIssue(() => resolver.resolveReference(itemRef), issues);
  }
  if (condition.switch1) {
    const switchRef = condition.switch1;
    captureReferenceIssue(() => resolver.resolveReference(switchRef), issues);
  }
  if (condition.switch2) {
    const switchRef = condition.switch2;
    captureReferenceIssue(() => resolver.resolveReference(switchRef), issues);
  }
  if (condition.variable) {
    const variableCondition = condition.variable;
    captureReferenceIssue(() => resolver.resolveReference(variableCondition.ref), issues);
    if (typeof variableCondition.value === "number") {
      return;
    }
    if (typeof variableCondition.value === "object" && variableCondition.value !== null) {
      const variableValue = variableCondition.value;
      captureReferenceIssue(
        () => resolver.resolveReference(variableValue as ReferenceValue<"variable">),
        issues,
      );
      return;
    }

    issues.push({
      level: "error",
      message: "Variable conditions require either a numeric value or a variable reference.",
    });
  }
}

export function isVariableReferenceValue(value: unknown): value is ReferenceValue<"variable"> {
  return isProjectDataReference(value) && value.kind === "variable";
}
