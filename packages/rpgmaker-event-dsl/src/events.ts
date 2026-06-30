import type {
  BattleProcessingDslCommand,
  CharacterRuntimeSelector,
  CommandOperand,
  ConditionalBranchCondition,
  ConditionalVariableOperator,
  CommonEventDefinition,
  ControlVariablesDslCommand,
  DslCommand,
  EventPage,
  MapEventDefinition,
  OperateValueOperand,
  PageConditions,
  ReferenceKind,
  ReferenceRange,
  ReferenceValue,
  VehicleTarget,
} from "./dsl.js";
import type { ReferenceResolver } from "./staged-graph.js";

type RawEventCommand = {
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
  list?: RawEventCommand[];
};

type ProjectEventPage = {
  conditions?: Record<string, unknown>;
  directionFix?: boolean;
  image?: Record<string, unknown>;
  list: RawEventCommand[];
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
  list: RawEventCommand[];
};

export function compileMapEvent(
  definition: MapEventDefinition,
  options: { nextId: number; resolver: ReferenceResolver },
): ProjectEventData {
  return {
    id: options.nextId,
    name: definition.name,
    x: definition.x,
    y: definition.y,
    pages: definition.pages.map((page) => compilePage(page, options.resolver)),
  };
}

export function compileCommonEvent(
  definition: CommonEventDefinition,
  options: { nextId: number; resolver: ReferenceResolver },
): CompiledCommonEvent {
  return {
    id: options.nextId,
    name: definition.name,
    trigger: commonEventTriggerToCode(definition.trigger),
    switchId: definition.switch ? options.resolver.resolveReference(definition.switch) : 1,
    list: compileNodes(definition.commands, 0, options.resolver),
  };
}

export function compilePage(page: EventPage, resolver: ReferenceResolver): ProjectEventPage {
  return {
    conditions: compileConditions(page.conditions, resolver),
    directionFix: false,
    image: {
      characterIndex: 0,
      characterName: "",
      direction: 2,
      pattern: 0,
      tileId: 0,
    },
    list: compileNodes(page.commands, 0, resolver),
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

function compileNodes(
  nodes: readonly DslCommand[],
  indent: number,
  resolver: ReferenceResolver,
  includeTerminator = true,
): RawEventCommand[] {
  const output: RawEventCommand[] = [];

  for (const node of nodes) {
    switch (node.kind) {
      case "showText":
        output.push({
          code: 101,
          indent,
          parameters: [
            node.face?.image.name ?? "",
            node.face?.index ?? 0,
            node.background ?? 0,
            node.positionType ?? 2,
          ],
        });
        for (const line of node.lines) {
          output.push({
            code: 401,
            indent,
            parameters: [line],
          });
        }
        break;
      case "inputNumber":
        output.push({
          code: 103,
          indent,
          parameters: [resolver.resolveReference(node.variable), node.digits],
        });
        break;
      case "selectItem":
        output.push({
          code: 104,
          indent,
          parameters: [resolver.resolveReference(node.variable), node.itemType ?? 2],
        });
        break;
      case "showScrollingText":
        output.push({
          code: 105,
          indent,
          parameters: [node.speed ?? 2, node.noFastForward ?? false],
        });
        for (const line of node.lines) {
          output.push({
            code: 405,
            indent,
            parameters: [line],
          });
        }
        break;
      case "conditional":
        output.push({
          code: 111,
          indent,
          parameters: compileConditionalBranchParameters(node.condition, resolver),
        });
        output.push(...compileNodes(node.then, indent + 1, resolver, false));
        if (node.else) {
          output.push({
            code: 411,
            indent,
            parameters: [],
          });
          output.push(...compileNodes(node.else, indent + 1, resolver, false));
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
        output.push(...compileNodes(node.body, indent + 1, resolver, false));
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
          parameters: [resolver.resolveReference(node.ref)],
        });
        break;
      case "label":
        output.push({ code: 118, indent, parameters: [node.name] });
        break;
      case "jumpToLabel":
        output.push({ code: 119, indent, parameters: [node.name] });
        break;
      case "controlSwitches": {
        const [startSwitchId, endSwitchId] = compileReferenceTargetRange(node.switch, resolver);
        output.push({
          code: 121,
          indent,
          parameters: [startSwitchId, endSwitchId, resolveControlValue(node.value)],
        });
        break;
      }
      case "controlVariables":
        output.push({
          code: 122,
          indent,
          parameters: compileControlVariablesParameters(node, resolver),
        });
        break;
      case "controlSelfSwitch":
        output.push({
          code: 123,
          indent,
          parameters: [node.selfSwitch, resolveControlValue(node.value)],
        });
        break;
      case "controlTimer":
        output.push({
          code: 124,
          indent,
          parameters: node.action === "start" ? [0, node.seconds] : [1, 0],
        });
        break;
      case "changeGold":
        output.push({
          code: 125,
          indent,
          parameters: compileOperateValueParameters(node.operation, node.value, resolver),
        });
        break;
      case "changeItems":
        output.push({
          code: 126,
          indent,
          parameters: [
            resolver.resolveReference(node.item),
            ...compileOperateValueParameters(node.operation, node.amount, resolver),
          ],
        });
        break;
      case "changeWeapons":
        output.push({
          code: 127,
          indent,
          parameters: [
            resolver.resolveReference(node.weapon),
            ...compileOperateValueParameters(node.operation, node.amount, resolver),
            node.includeEquipment ?? false,
          ],
        });
        break;
      case "changeArmors":
        output.push({
          code: 128,
          indent,
          parameters: [
            resolver.resolveReference(node.armor),
            ...compileOperateValueParameters(node.operation, node.amount, resolver),
            node.includeEquipment ?? false,
          ],
        });
        break;
      case "changePartyMember":
        output.push({
          code: 129,
          indent,
          parameters: [
            resolver.resolveReference(node.actor),
            node.operation === "add" ? 0 : 1,
            node.initialize ?? false,
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
          parameters: compileBattleProcessingParameters(node, resolver),
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
        if (node.destination.kind === "direct") {
          output.push({
            code: 201,
            indent,
            parameters: [
              0,
              resolver.resolveReference(node.destination.map),
              node.destination.x,
              node.destination.y,
              node.direction ?? 2,
              node.fadeType ?? 0,
            ],
          });
        } else {
          output.push({
            code: 201,
            indent,
            parameters: [
              1,
              resolver.resolveReference(node.destination.map),
              resolver.resolveReference(node.destination.x),
              resolver.resolveReference(node.destination.y),
              node.direction ?? 2,
              node.fadeType ?? 0,
            ],
          });
        }
        break;
      case "setVehicleLocation":
        output.push({
          code: 202,
          indent,
          parameters: compileSetVehicleLocationParameters(node.vehicle, node.destination, resolver),
        });
        break;
      case "setEventLocation":
        output.push({
          code: 203,
          indent,
          parameters: compileSetEventLocationParameters(node, resolver),
        });
        break;
      case "scrollMap":
        output.push({
          code: 204,
          indent,
          parameters: [node.direction, node.distance, node.speed],
        });
        break;
      case "getOnOffVehicle":
        output.push({
          code: 206,
          indent,
          parameters: [],
        });
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
        output.push(...compileChoiceBranches(node, indent, resolver));
        break;
      case "shopProcessing":
        output.push({
          code: 302,
          indent,
          parameters: [...node.goods, node.allowSelling ?? false],
        });
        break;
      case "rawDslCommand":
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

function compileConditionalBranchParameters(
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

function conditionalVariableOperatorToCode(operator: ConditionalVariableOperator): number {
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

function actorConditionCheckToCode(
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

function actorConditionCheckValue(
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

function goldConditionOperatorToCode(
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

function vehicleToCode(
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

function characterSelectorToCode(selector: CharacterRuntimeSelector): number {
  switch (selector.target) {
    case "player":
      return -1;
    case "currentEvent":
      return 0;
    case "event":
      return selector.id;
  }
}

function resolveControlValue(value: boolean): number {
  return value ? 0 : 1;
}

function isReferenceValue(value: unknown): value is ReferenceValue<"variable"> {
  return (
    !!value &&
    typeof value === "object" &&
    "kind" in value &&
    (value as { kind?: unknown }).kind === "variable"
  );
}

function compileControlVariablesParameters(
  node: ControlVariablesDslCommand,
  resolver: ReferenceResolver,
): unknown[] {
  const [startVariableId, endVariableId] = compileReferenceTargetRange(node.variable, resolver);
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
    return [startVariableId, endVariableId, operation, 0, node.value];
  }

  if ("kind" in node.value && node.value.kind === "random") {
    return [startVariableId, endVariableId, operation, 2, node.value.from, node.value.to];
  }

  if ("kind" in node.value && node.value.kind === "script") {
    return [startVariableId, endVariableId, operation, 4, node.value.script.code];
  }

  if ("kind" in node.value && node.value.kind === "gameData") {
    return [
      startVariableId,
      endVariableId,
      operation,
      3,
      ...compileControlVariablesGameDataOperand(node.value, resolver),
    ];
  }

  return [startVariableId, endVariableId, operation, 1, resolver.resolveReference(node.value)];
}

function compileReferenceTargetRange<TKind extends ReferenceKind>(
  target: ReferenceValue<TKind> | ReferenceRange<TKind>,
  resolver: ReferenceResolver,
): [number, number] {
  if ("from" in target) {
    return [resolver.resolveReference(target.from), resolver.resolveReference(target.to)];
  }

  const id = resolver.resolveReference(target);
  return [id, id];
}

function compileOperateValueParameters(
  operation: "gain" | "lose",
  operand: OperateValueOperand,
  resolver: ReferenceResolver,
): [number, number, number] {
  return [
    operation === "gain" ? 0 : 1,
    isReferenceValue(operand) ? 1 : 0,
    isReferenceValue(operand) ? resolver.resolveReference(operand) : operand,
  ];
}

function compileControlVariablesGameDataOperand(
  operand: Extract<CommandOperand, { kind: "gameData" }>,
  resolver: ReferenceResolver,
): [number, number, number] {
  switch (operand.source) {
    case "item":
      return [0, resolver.resolveReference(operand.item), 0];
    case "weapon":
      return [1, resolver.resolveReference(operand.weapon), 0];
    case "armor":
      return [2, resolver.resolveReference(operand.armor), 0];
    case "actor":
      return [3, resolver.resolveReference(operand.actor), actorGameDataValueToCode(operand.value)];
    case "enemy":
      return [4, operand.enemyIndex, enemyGameDataValueToCode(operand.value)];
    case "character":
      return [5, operand.characterId, characterGameDataValueToCode(operand.value)];
    case "party":
      return [6, operand.memberIndex, 0];
    case "other":
      return [7, otherGameDataValueToCode(operand.value), 0];
  }
}

function actorGameDataValueToCode(
  value: Extract<CommandOperand, { kind: "gameData"; source: "actor" }>["value"],
): number {
  switch (value) {
    case "level":
      return 0;
    case "exp":
      return 1;
    case "hp":
      return 2;
    case "mp":
      return 3;
    case "mhp":
      return 4;
    case "mmp":
      return 5;
    case "atk":
      return 6;
    case "def":
      return 7;
    case "mat":
      return 8;
    case "mdf":
      return 9;
    case "agi":
      return 10;
    case "luk":
      return 11;
  }
}

function enemyGameDataValueToCode(
  value: Extract<CommandOperand, { kind: "gameData"; source: "enemy" }>["value"],
): number {
  switch (value) {
    case "hp":
      return 0;
    case "mp":
      return 1;
    case "mhp":
      return 2;
    case "mmp":
      return 3;
    case "atk":
      return 4;
    case "def":
      return 5;
    case "mat":
      return 6;
    case "mdf":
      return 7;
    case "agi":
      return 8;
    case "luk":
      return 9;
  }
}

function characterGameDataValueToCode(
  value: Extract<CommandOperand, { kind: "gameData"; source: "character" }>["value"],
): number {
  switch (value) {
    case "mapX":
      return 0;
    case "mapY":
      return 1;
    case "direction":
      return 2;
    case "screenX":
      return 3;
    case "screenY":
      return 4;
  }
}

function otherGameDataValueToCode(
  value: Extract<CommandOperand, { kind: "gameData"; source: "other" }>["value"],
): number {
  switch (value) {
    case "mapId":
      return 0;
    case "partyMembers":
      return 1;
    case "gold":
      return 2;
    case "steps":
      return 3;
    case "playTime":
      return 4;
    case "timer":
      return 5;
    case "saveCount":
      return 6;
    case "battleCount":
      return 7;
    case "winCount":
      return 8;
    case "escapeCount":
      return 9;
  }
}

function compileChoiceBranches(
  node: Extract<DslCommand, { kind: "showChoices" }>,
  indent: number,
  resolver: ReferenceResolver,
): RawEventCommand[] {
  const output: RawEventCommand[] = [];

  node.branches.forEach((branch, index) => {
    output.push({
      code: 402,
      indent,
      parameters: [index],
    });
    output.push(...compileNodes(branch, indent + 1, resolver, false));
  });

  if (node.cancelBranch) {
    output.push({
      code: 403,
      indent,
      parameters: [],
    });
    output.push(...compileNodes(node.cancelBranch, indent + 1, resolver, false));
  }

  return output;
}

function compileBattleProcessingParameters(
  node: BattleProcessingDslCommand,
  resolver: ReferenceResolver,
): unknown[] {
  if ("useRandomEncounter" in node.troop) {
    return [2, 0, node.canEscape ?? false, node.canLose ?? false];
  }

  return [0, resolver.resolveReference(node.troop), node.canEscape ?? false, node.canLose ?? false];
}

function compileSetVehicleLocationParameters(
  vehicle: VehicleTarget,
  destination: Extract<DslCommand, { kind: "setVehicleLocation" }>["destination"],
  resolver: ReferenceResolver,
): unknown[] {
  const vehicleCode = vehicleToCode(vehicle);
  if (destination.kind === "direct") {
    return [
      vehicleCode,
      0,
      resolver.resolveReference(destination.map),
      destination.x,
      destination.y,
    ];
  }

  return [
    vehicleCode,
    1,
    resolver.resolveReference(destination.map),
    resolver.resolveReference(destination.x),
    resolver.resolveReference(destination.y),
  ];
}

function compileSetEventLocationParameters(
  node: Extract<DslCommand, { kind: "setEventLocation" }>,
  resolver: ReferenceResolver,
): unknown[] {
  const characterId = characterSelectorToCode(node.character);

  switch (node.destination.kind) {
    case "direct":
      return [characterId, 0, node.destination.x, node.destination.y, node.direction ?? 0];
    case "variables":
      return [
        characterId,
        1,
        resolver.resolveReference(node.destination.x),
        resolver.resolveReference(node.destination.y),
        node.direction ?? 0,
      ];
    case "exchange":
      return [
        characterId,
        2,
        characterSelectorToCode(node.destination.character),
        0,
        node.direction ?? 0,
      ];
  }
}

function compileConditions(
  conditions: PageConditions | undefined,
  resolver: ReferenceResolver,
): Record<string, unknown> {
  const variableValue =
    conditions?.variable && typeof conditions.variable.value === "number"
      ? conditions.variable.value
      : 0;

  return {
    actorId: conditions?.actor ? resolver.resolveReference(conditions.actor) : 0,
    actorValid: conditions?.actor !== undefined,
    itemId: conditions?.item ? resolver.resolveReference(conditions.item) : 0,
    itemValid: conditions?.item !== undefined,
    selfSwitchCh: conditions?.selfSwitch ?? "A",
    selfSwitchValid: conditions?.selfSwitch !== undefined,
    switch1Id: conditions?.switch1 ? resolver.resolveReference(conditions.switch1) : 0,
    switch1Valid: conditions?.switch1 !== undefined,
    switch2Id: conditions?.switch2 ? resolver.resolveReference(conditions.switch2) : 0,
    switch2Valid: conditions?.switch2 !== undefined,
    variableId: conditions?.variable ? resolver.resolveReference(conditions.variable.ref) : 0,
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
