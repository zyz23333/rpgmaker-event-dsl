import type {
  BattleProcessingNode,
  CommonEventDefinition,
  EventDefinition,
  EventNode,
  EventPage,
  ControlVariableNode,
  MapEventDefinition,
  PageConditions,
  ProjectIndex,
  ReferenceKind,
  ReferenceValue,
} from "./dsl.js";

export type OperationMode = "create" | "replace";

export type DefinitionBindingTarget =
  | {
      type: "map";
      mapId: number;
    }
  | {
      type: "commonEvents";
    };

export type EventDataPlan =
  | {
      kind: "map";
      mapId: number;
      filePath: string;
      before: unknown;
      after: unknown;
      changed: boolean;
    }
  | {
      kind: "commonEvents";
      filePath: string;
      before: unknown;
      after: unknown;
      changed: boolean;
    };

export type ValidationIssue = {
  level: "error" | "warning";
  message: string;
};

export type ValidationResult = {
  issues: ValidationIssue[];
};

type CompiledEventNode = {
  code: number;
  indent: number;
  parameters: unknown[];
};

export type ProjectEventData = {
  id: number;
  name: string;
  x?: number;
  y?: number;
  note?: string;
  pages?: ProjectEventPage[];
  trigger?: number;
  switchId?: number;
  list?: CompiledEventNode[];
};

type ProjectEventPage = {
  conditions?: Record<string, unknown>;
  directionFix?: boolean;
  image?: Record<string, unknown>;
  list: CompiledEventNode[];
  moveFrequency?: number;
  moveRoute?: Record<string, unknown>;
  moveSpeed?: number;
  moveType?: number;
  priorityType?: number;
  stepAnime?: boolean;
  through?: boolean;
  trigger?: number;
  walkAnime?: boolean;
};

type CompiledCommonEvent = {
  id: number;
  name: string;
  trigger: number;
  switchId: number;
  list: CompiledEventNode[];
};

export function collectDefinitionsWithTarget(
  definitions: EventDefinition[],
  bindingTarget: DefinitionBindingTarget,
): EventDefinition[] {
  return definitions.filter((definition) => {
    if (bindingTarget.type === "map") {
      return definition.kind === "mapEvent";
    }

    return definition.kind === "commonEvent";
  });
}

export function validateDefinitions(
  definitions: EventDefinition[],
  projectIndex: ProjectIndex,
  options: {
    scriptEnabled: boolean;
  },
): ValidationResult {
  const issues: ValidationIssue[] = [];

  for (const definition of definitions) {
    if (definition.kind === "mapEvent") {
      if (definition.pages.length === 0) {
        issues.push({
          level: "error",
          message: `Map event "${definition.name}" must contain at least one page.`,
        });
      }
      validatePages(definition.pages, projectIndex, options, issues);
    } else {
      validateCommonEvent(definition, projectIndex, options, issues);
    }
  }

  return { issues };
}

export function compileMapEvent(
  definition: MapEventDefinition,
  options: { nextId: number; projectIndex: ProjectIndex },
): ProjectEventData {
  return {
    id: options.nextId,
    name: definition.name,
    x: definition.x,
    y: definition.y,
    pages: definition.pages.map((page) => compilePage(page, options.projectIndex)),
  };
}

export function compileCommonEvent(
  definition: CommonEventDefinition,
  options: { nextId: number; projectIndex: ProjectIndex },
): CompiledCommonEvent {
  return {
    id: options.nextId,
    name: definition.name,
    trigger: commonEventTriggerToCode(definition.trigger),
    switchId: definition.switch ? resolveReference(definition.switch, options.projectIndex) : 1,
    list: compileNodes(definition.commands, 0, options.projectIndex),
  };
}

export function toMvMapFile(
  mapData: Record<string, unknown>,
  event: ProjectEventData,
): Record<string, unknown> {
  const events = Array.isArray(mapData.events) ? mapData.events.slice() : [];
  events[event.id] = {
    id: event.id,
    name: event.name,
    note: event.note ?? "",
    pages: event.pages ?? [],
    x: event.x ?? 0,
    y: event.y ?? 0,
  };

  return {
    ...mapData,
    events,
  };
}

export function toMvCommonEventsFile(
  commonEvents: readonly unknown[],
  event: CompiledCommonEvent,
): unknown[] {
  const output = commonEvents.slice();
  output[event.id] = {
    id: event.id,
    list: event.list,
    name: event.name,
    switchId: event.switchId,
    trigger: event.trigger,
  };
  return output;
}

export function compilePage(page: EventPage, projectIndex: ProjectIndex): ProjectEventPage {
  return {
    conditions: compileConditions(page.conditions, projectIndex),
    directionFix: false,
    image: {
      characterIndex: 0,
      characterName: "",
      direction: 2,
      pattern: 0,
      tileId: 0,
    },
    list: compileNodes(page.commands, 0, projectIndex),
    moveFrequency: 3,
    moveRoute: {
      list: [{ code: 0, parameters: [] }],
      repeat: true,
      skippable: false,
      wait: false,
    },
    moveSpeed: 3,
    moveType: 0,
    priorityType: 1,
    stepAnime: false,
    through: false,
    trigger:
      page.trigger === "action"
        ? 0
        : page.trigger === "playerTouch"
          ? 1
          : page.trigger === "eventTouch"
            ? 2
            : page.trigger === "autorun"
              ? 3
              : 4,
    walkAnime: true,
  };
}

function validateCommonEvent(
  definition: CommonEventDefinition,
  projectIndex: ProjectIndex,
  options: { scriptEnabled: boolean },
  issues: ValidationIssue[],
): void {
  if (definition.trigger !== "none" && definition.switch === undefined) {
    issues.push({
      level: "error",
      message: `Common event "${definition.name}" requires a switch when trigger is ${definition.trigger}.`,
    });
  }

  validateNodes(definition.commands, projectIndex, options, issues);
}

function validatePages(
  pages: readonly EventPage[],
  projectIndex: ProjectIndex,
  options: { scriptEnabled: boolean },
  issues: ValidationIssue[],
): void {
  for (const page of pages) {
    validateCondition(page.conditions, projectIndex, issues);
    validateNodes(page.commands, projectIndex, options, issues);
  }
}

function validateNodes(
  nodes: readonly EventNode[],
  projectIndex: ProjectIndex,
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
    if (node.kind === "controlSwitch") {
      resolveReference(node.switch, projectIndex);
    }
    if (node.kind === "controlVariable") {
      resolveReference(node.variable, projectIndex);
      if (typeof node.value === "object" && node.value !== null && "kind" in node.value) {
        resolveReference(node.value as ReferenceValue<"variable">, projectIndex);
      }
    }
    if (node.kind === "changeItem") {
      resolveReference(node.item, projectIndex);
    }
    if (node.kind === "showChoices" && node.branches.length !== node.choices.length) {
      issues.push({
        level: "error",
        message: "Show Choices branches must match the choice count.",
      });
    }
    if (node.kind === "commonEvent") {
      resolveReference(node.ref, projectIndex);
    }
    if (node.kind === "transferPlayer") {
      if ("map" in node.target) {
        resolveReference(node.target.map, projectIndex);
      } else {
        resolveReference(node.target.variableMap, projectIndex);
        resolveReference(node.target.variableX, projectIndex);
        resolveReference(node.target.variableY, projectIndex);
      }
    }
    if (node.kind === "conditional") {
      validateCondition(node.condition, projectIndex, issues);
      validateNodes(node.then, projectIndex, options, issues);
      if (node.else) {
        validateNodes(node.else, projectIndex, options, issues);
      }
    }
  }
}

function validateCondition(
  condition: PageConditions,
  projectIndex: ProjectIndex,
  issues: ValidationIssue[],
): void {
  if (condition.actor) {
    resolveReference(condition.actor, projectIndex);
  }
  if (condition.item) {
    resolveReference(condition.item, projectIndex);
  }
  if (condition.switch1) {
    resolveReference(condition.switch1, projectIndex);
  }
  if (condition.switch2) {
    resolveReference(condition.switch2, projectIndex);
  }
  if (condition.variable) {
    resolveReference(condition.variable.ref, projectIndex);
    if (typeof condition.variable.value === "number") {
      return;
    }
    if (typeof condition.variable.value === "object" && condition.variable.value !== null) {
      resolveReference(condition.variable.value as ReferenceValue<"variable">, projectIndex);
      return;
    }

    issues.push({
      level: "error",
      message: "Variable conditions require either a numeric value or a variable reference.",
    });
  }
}

function compileNodes(
  nodes: readonly EventNode[],
  indent: number,
  projectIndex: ProjectIndex,
  includeTerminator = true,
): CompiledEventNode[] {
  const output: CompiledEventNode[] = [];

  for (const node of nodes) {
    switch (node.kind) {
      case "showText":
        output.push({
          code: 101,
          indent,
          parameters: ["", 0, 0, 2],
        });
        for (const line of node.lines) {
          output.push({
            code: 401,
            indent,
            parameters: [line],
          });
        }
        break;
      case "conditional":
        output.push({
          code: 111,
          indent,
          parameters: [0, 1, 0, 0, 0],
        });
        output.push(...compileNodes(node.then, indent + 1, projectIndex, false));
        if (node.else) {
          output.push({
            code: 411,
            indent,
            parameters: [],
          });
          output.push(...compileNodes(node.else, indent + 1, projectIndex, false));
        }
        break;
      case "comment":
        output.push({
          code: 108,
          indent,
          parameters: [node.lines[0]],
        });
        for (let index = 1; index < node.lines.length; index += 1) {
          output.push({
            code: 408,
            indent,
            parameters: [node.lines[index]],
          });
        }
        break;
      case "loop":
        output.push({
          code: 112,
          indent,
          parameters: [],
        });
        output.push(...compileNodes(node.body, indent + 1, projectIndex, false));
        output.push({
          code: 413,
          indent,
          parameters: [],
        });
        break;
      case "breakLoop":
        output.push({ code: 113, indent, parameters: [] });
        break;
      case "exitEvent":
        output.push({ code: 115, indent, parameters: [] });
        break;
      case "commonEvent":
        output.push({
          code: 117,
          indent,
          parameters: [resolveReference(node.ref, projectIndex)],
        });
        break;
      case "label":
        output.push({ code: 118, indent, parameters: [node.name] });
        break;
      case "jumpToLabel":
        output.push({ code: 119, indent, parameters: [node.name] });
        break;
      case "controlSwitch":
        output.push({
          code: 121,
          indent,
          parameters: [
            resolveReference(node.switch, projectIndex),
            resolveControlValue(node.value),
          ],
        });
        break;
      case "controlVariable":
        output.push({
          code: 122,
          indent,
          parameters: compileControlVariableParameters(node, projectIndex),
        });
        break;
      case "controlSelfSwitch":
        output.push({
          code: 123,
          indent,
          parameters: [node.selfSwitch, resolveControlValue(node.value)],
        });
        break;
      case "changeGold":
        output.push({
          code: 125,
          indent,
          parameters: [node.operation === "gain" ? 0 : 1, 0, node.value],
        });
        break;
      case "changeItem":
        output.push({
          code: 126,
          indent,
          parameters: [
            resolveReference(node.item, projectIndex),
            node.operation === "gain" ? 0 : 1,
            0,
            node.amount,
          ],
        });
        break;
      case "wait":
        output.push({
          code: 230,
          indent,
          parameters: [node.frames],
        });
        break;
      case "eraseEvent":
        output.push({
          code: 214,
          indent,
          parameters: [],
        });
        break;
      case "battleProcessing":
        output.push({
          code: 301,
          indent,
          parameters: compileBattleProcessingParameters(node, projectIndex),
        });
        break;
      case "script":
        output.push({
          code: 355,
          indent,
          parameters: [node.code.join("\n")],
        });
        for (let index = 1; index < node.code.length; index += 1) {
          output.push({
            code: 655,
            indent,
            parameters: [node.code[index]],
          });
        }
        break;
      case "pluginCommand":
        output.push({
          code: 356,
          indent,
          parameters: [node.args ? `${node.command} ${node.args.join(" ")}` : node.command],
        });
        break;
      case "transferPlayer":
        if ("map" in node.target) {
          output.push({
            code: 201,
            indent,
            parameters: [
              0,
              getReferenceId(node.target.map),
              node.target.x,
              node.target.y,
              node.target.direction ?? 2,
              node.target.fadeType ?? 0,
            ],
          });
        } else {
          output.push({
            code: 201,
            indent,
            parameters: [
              1,
              getReferenceId(node.target.variableMap),
              getReferenceId(node.target.variableX),
              getReferenceId(node.target.variableY),
              node.target.direction ?? 2,
              node.target.fadeType ?? 0,
            ],
          });
        }
        break;
      case "showChoices":
        output.push({
          code: 102,
          indent,
          parameters: [
            node.choices,
            node.cancelType ?? -1,
            node.defaultType ?? 0,
            node.positionType ?? 2,
            node.background ?? 0,
          ],
        });
        output.push(...compileChoiceBranches(node, indent, projectIndex));
        break;
      case "shopProcessing":
        output.push({
          code: 302,
          indent,
          parameters: [...node.goods, node.allowSelling ?? false],
        });
        break;
      case "rawCommand":
        output.push({
          code: node.code,
          indent: node.indent ?? indent,
          parameters: [...node.parameters],
        });
        break;
    }
  }

  if (includeTerminator) {
    output.push({ code: 0, indent, parameters: [] });
  }
  return output;
}

function resolveControlValue(value: boolean): number {
  return value ? 0 : 1;
}

function compileControlVariableParameters(
  node: ControlVariableNode,
  projectIndex: ProjectIndex,
): unknown[] {
  const targetId = resolveReference(node.variable, projectIndex);
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
    return [targetId, targetId, operation, 0, node.value];
  }

  if ("kind" in node.value && node.value.kind === "random") {
    return [targetId, targetId, operation, 2, node.value.from, node.value.to];
  }

  return [targetId, targetId, operation, 1, resolveReference(node.value, projectIndex)];
}

function compileChoiceBranches(
  node: Extract<EventNode, { kind: "showChoices" }>,
  indent: number,
  projectIndex: ProjectIndex,
): CompiledEventNode[] {
  const output: CompiledEventNode[] = [];

  node.branches.forEach((branch, index) => {
    output.push({
      code: 402,
      indent,
      parameters: [index],
    });
    output.push(...compileNodes(branch, indent + 1, projectIndex, false));
  });

  if (node.cancelBranch) {
    output.push({
      code: 403,
      indent,
      parameters: [],
    });
    output.push(...compileNodes(node.cancelBranch, indent + 1, projectIndex, false));
  }

  return output;
}

function compileBattleProcessingParameters(
  node: BattleProcessingNode,
  projectIndex: ProjectIndex,
): unknown[] {
  if ("useRandomEncounter" in node.troop) {
    return [2, 0, node.canEscape ?? false, node.canLose ?? false];
  }

  return [
    0,
    resolveReference(node.troop, projectIndex),
    node.canEscape ?? false,
    node.canLose ?? false,
  ];
}

function compileConditions(
  conditions: PageConditions | undefined,
  projectIndex: ProjectIndex,
): Record<string, unknown> {
  const variableValue =
    conditions?.variable && typeof conditions.variable.value === "number"
      ? conditions.variable.value
      : 0;

  return {
    actorId: conditions?.actor ? resolveReference(conditions.actor, projectIndex) : 0,
    actorValid: conditions?.actor !== undefined,
    itemId: conditions?.item ? resolveReference(conditions.item, projectIndex) : 0,
    itemValid: conditions?.item !== undefined,
    selfSwitchCh: conditions?.selfSwitch ?? "A",
    selfSwitchValid: conditions?.selfSwitch !== undefined,
    switch1Id: conditions?.switch1 ? resolveReference(conditions.switch1, projectIndex) : 0,
    switch1Valid: conditions?.switch1 !== undefined,
    switch2Id: conditions?.switch2 ? resolveReference(conditions.switch2, projectIndex) : 0,
    switch2Valid: conditions?.switch2 !== undefined,
    variableId: conditions?.variable ? resolveReference(conditions.variable.ref, projectIndex) : 0,
    variableValid: conditions?.variable !== undefined,
    variableValue,
  };
}

function commonEventTriggerToCode(trigger: CommonEventDefinition["trigger"]): number {
  switch (trigger) {
    case "none":
      return 0;
    case "autorun":
      return 1;
    case "parallel":
      return 2;
  }
}

function resolveReference<TKind extends ReferenceKind>(
  ref: ReferenceValue<TKind>,
  projectIndex: ProjectIndex,
): number {
  if ("id" in ref) {
    return ref.id;
  }

  const table = selectIndex(ref.kind, projectIndex);
  const value = table.get(ref.name);
  if (value === undefined) {
    throw new Error(`Unknown ${ref.kind} reference: ${ref.name}`);
  }

  return value;
}

function getReferenceId<TKind extends ReferenceKind>(ref: ReferenceValue<TKind>): number {
  if ("id" in ref) {
    return ref.id;
  }

  return 0;
}

function selectIndex(kind: ReferenceKind, projectIndex: ProjectIndex): Map<string, number> {
  switch (kind) {
    case "actor":
      return projectIndex.actorsByName;
    case "armor":
      return projectIndex.armorsByName;
    case "commonEvent":
      return projectIndex.commonEventsByName;
    case "item":
      return projectIndex.itemsByName;
    case "map":
      return projectIndex.mapsByName;
    case "switch":
      return projectIndex.switchesByName;
    case "troop":
      return projectIndex.troopsByName;
    case "variable":
      return projectIndex.variablesByName;
    case "weapon":
      return projectIndex.weaponsByName;
  }
}
