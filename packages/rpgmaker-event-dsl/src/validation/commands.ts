import type {
  ConditionalBranchCondition,
  DslCommand,
  EventPage,
  MovementRoute,
  PageConditions,
  ReferenceKind,
  ReferenceValue,
  RuntimeSelector,
} from "../domain/types.js";
import { isProjectDataReference } from "../domain/references.js";
import type { ReferenceResolver, ValidationIssue } from "./types.js";
import { captureReferenceIssue } from "./shared.js";
import { isReferenceValue } from "./inspection.js";
import { assertNativeSwitchCommand } from "../commands/variables/validation.js";
import { assertNativeContextReferences } from "./native-context-references.js";
import { assertLoopCommand } from "../commands/flow/validation.js";
import {
  assertSetMovementRoute,
  validateNativeMovementRouteInputs,
} from "../commands/movement/validation.js";
import { CommandStructureError } from "./command-structure.js";
import { assertDslCommandList } from "./dsl-command-inputs.js";

type CommandValidationOptions = { scriptEnabled: boolean; identity?: string; path?: string };

export function validatePages(
  pages: readonly EventPage[],
  resolver: ReferenceResolver,
  options: CommandValidationOptions,
  issues: ValidationIssue[],
): void {
  for (const [pageIndex, page] of pages.entries()) {
    validateCondition(page.conditions, resolver, issues);
    validateNodes(
      page.commands,
      resolver,
      { ...options, path: `pages[${pageIndex}].commands` },
      issues,
    );
  }
}

export function validateNodes(
  nodes: readonly DslCommand[],
  resolver: ReferenceResolver,
  options: CommandValidationOptions,
  issues: ValidationIssue[],
): void {
  try {
    assertDslCommandList(nodes, options.path ?? "commands", false);
  } catch (error) {
    if (error instanceof CommandStructureError)
      issues.push(error.issue(options.identity ?? "event", "compile"));
    else throw error;
    return;
  }
  for (const [nodeIndex, node] of nodes.entries()) {
    const nodePath = `${options.path ?? "commands"}[${nodeIndex}]`;
    const childOptions = (field: string): CommandValidationOptions => ({
      ...options,
      path: `${nodePath}.${field}`,
    });
    if (node.kind === "loop") {
      try {
        assertLoopCommand(node, nodePath);
      } catch {
        continue;
      }
      validateNodes(node.body.commands, resolver, childOptions("body.commands"), issues);
    }
    const captureSwitchIssue = (
      code: string,
      field: string,
      action: () => unknown,
    ): number | undefined => {
      try {
        return action() as number | undefined;
      } catch (error) {
        issues.push({
          level: "error",
          message: `${code} validation ${options.identity ?? "event"}.${nodePath}.${field}: ${error instanceof Error ? error.message : String(error)}`,
        });
        return undefined;
      }
    };
    if (node.kind === "script" && !options.scriptEnabled) {
      issues.push({
        level: "error",
        message: "Script commands require explicit config enablement.",
      });
    }
    if (node.kind === "controlSwitches") {
      const value: unknown = node.value;
      if ("from" in node.switch) {
        const range = node.switch;
        const from = captureSwitchIssue("MV-E121-REFERENCE", "switch.from", () =>
          resolver.resolveReference(range.from),
        );
        const to = captureSwitchIssue("MV-E121-REFERENCE", "switch.to", () =>
          resolver.resolveReference(range.to),
        );
        if (from !== undefined && to !== undefined && from > to)
          captureSwitchIssue("MV-E121-RANGE", "switch", () => {
            throw new Error(
              `expected start <= end; received ${from}..${to}. Ranges are not reordered.`,
            );
          });
      } else {
        captureSwitchIssue("MV-E121-REFERENCE", "switch", () =>
          resolver.resolveReference(node.switch as ReferenceValue<"switch">),
        );
      }
      if (typeof value !== "boolean")
        captureSwitchIssue("MV-E121-VALUE", "value", () => {
          throw new Error(`expected explicit boolean; received ${String(value)}.`);
        });
    }
    if (node.kind === "controlSelfSwitch") {
      const value: unknown = node.value;
      if (typeof value !== "boolean")
        captureSwitchIssue("MV-E123-VALUE", "value", () => {
          throw new Error(`expected explicit boolean; received ${String(value)}.`);
        });
      captureSwitchIssue("MV-E123-LETTER", "selfSwitch", () =>
        assertNativeSwitchCommand(123, [node.selfSwitch, node.value ? 0 : 1]),
      );
    }
    if (node.kind === "rawDslCommand" && (node.code === 121 || node.code === 123)) {
      captureSwitchIssue(`MV-E${node.code}-RAW`, "parameters", () =>
        assertNativeSwitchCommand(node.code, node.parameters, resolver),
      );
    }
    if (node.kind === "rawDslCommand") {
      try {
        assertNativeContextReferences(node.code, node.parameters, resolver);
      } catch (error) {
        issues.push({
          level: "error",
          message: `validation ${options.identity ?? "event"}.${nodePath}: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
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
      for (const [branchIndex, branch] of node.branches.entries()) {
        validateNodes(branch, resolver, childOptions(`branches[${branchIndex}]`), issues);
      }
      if (node.cancelBranch) {
        validateNodes(node.cancelBranch, resolver, childOptions("cancelBranch"), issues);
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
      try {
        assertSetMovementRoute(node, nodePath);
      } catch (error) {
        if (error instanceof CommandStructureError)
          issues.push(error.issue(options.identity ?? "event", "compile"));
        continue;
      }
      validateCharacterRuntimeSelector(node.target, "Set Movement Route target", issues);
      validateMoveRouteCommands(node.route, resolver, childOptions("route"), issues);
    }
    if (node.kind === "rawDslCommand" && node.code === 205) {
      try {
        validateNativeMovementRouteInputs(
          node.parameters?.[1],
          resolver,
          {
            ...options,
            dslPath: `${nodePath}.parameters[1]`,
            nativePath: `${nodePath}.parameters[1]`,
          },
          issues,
        );
      } catch (error) {
        if (error instanceof CommandStructureError)
          issues.push(error.issue(options.identity ?? "event", "compile"));
      }
    }
    if (node.kind === "showAnimation") {
      validateCharacterRuntimeSelector(node.target, "Show Animation target", issues);
      captureSwitchIssue("MV-E212-REFERENCE", "animation", () =>
        resolver.resolveReference(node.animation),
      );
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
        validateNodes(node.win, resolver, childOptions("win"), issues);
      }
      if (node.escape) {
        if (node.canEscape !== true) {
          issues.push({
            level: "error",
            message: "Battle Processing escape branch requires canEscape: true.",
          });
        }
        validateNodes(node.escape, resolver, childOptions("escape"), issues);
      }
      if (node.lose) {
        if (node.canLose !== true) {
          issues.push({
            level: "error",
            message: "Battle Processing lose branch requires canLose: true.",
          });
        }
        validateNodes(node.lose, resolver, childOptions("lose"), issues);
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
      captureSwitchIssue("MV-E336-REFERENCE", "enemy", () => resolver.resolveReference(node.enemy));
    }
    if (node.kind === "showBattleAnimation") {
      captureReferenceIssue(() => resolver.resolveReference(node.animation), issues);
    }
    if (node.kind === "forceAction") {
      validateBattlerCommandTarget(node.subject, "Force Action subject", issues);
      captureReferenceIssue(() => resolver.resolveReference(node.skill), issues);
    }
    if (node.kind === "changeTileset") {
      captureSwitchIssue("MV-E282-REFERENCE", "tileset", () =>
        resolver.resolveReference(node.tileset),
      );
    }
    if (node.kind === "getLocationInfo") {
      captureReferenceIssue(() => resolver.resolveReference(node.variable), issues);
      validateCommandPosition(node.location, resolver, issues);
    }
    if (node.kind === "conditional") {
      validateConditionalBranchCondition(node.condition, resolver, options, issues);
      validateNodes(node.then, resolver, childOptions("then"), issues);
      if (node.else) {
        validateNodes(node.else, resolver, childOptions("else"), issues);
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
  route: MovementRoute,
  resolver: ReferenceResolver,
  options: CommandValidationOptions,
  issues: ValidationIssue[],
): void {
  for (const [index, command] of route.commands.entries()) {
    if (command.kind === "switchOn" || command.kind === "switchOff") {
      captureReferenceIssue(() => resolver.resolveReference(command.switch), issues);
    }

    if (command.kind === "script" && !options.scriptEnabled) {
      issues.push({
        level: "error",
        code: "MV-MOVEMENT-SCRIPT",
        stage: "compile",
        ...(options.identity === undefined ? {} : { identity: options.identity }),
        dslPath: `${options.path ?? "route"}.commands[${index}].script`,
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
    let from: number | undefined;
    let to: number | undefined;
    captureReferenceIssue(() => {
      from = resolver.resolveReference(value.from);
      return from;
    }, issues);
    captureReferenceIssue(() => {
      to = resolver.resolveReference(value.to);
      return to;
    }, issues);
    if (from !== undefined && to !== undefined && from > to) {
      issues.push({
        level: "error",
        message: `MV-REFERENCE-RANGE range start ${from} exceeds end ${to}; ranges are not reordered.`,
      });
    }
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
  for (const slot of [
    condition.actor,
    condition.item,
    condition.switch1,
    condition.switch2,
    condition.variable,
  ]) {
    if (slot && (slot.enabled || !("id" in slot.ref)))
      captureReferenceIssue(() => resolver.resolveReference(slot.ref), issues);
  }
}

export function isVariableReferenceValue(value: unknown): value is ReferenceValue<"variable"> {
  return isProjectDataReference(value) && value.kind === "variable";
}
