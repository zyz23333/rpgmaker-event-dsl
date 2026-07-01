import type {
  BattleProcessingDslCommand,
  AudioPayload,
  CharacterRuntimeSelector,
  CommandOperand,
  CommandPosition,
  ConditionalBranchCondition,
  ConditionalVariableOperator,
  CommonEventDefinition,
  ControlVariablesDslCommand,
  DslCommand,
  EventPage,
  MapEventDefinition,
  MoveRouteCommand,
  OperateValueOperand,
  PageConditions,
  PicturePosition,
  ReferenceKind,
  ReferenceRange,
  ReferenceValue,
  ShowBalloonIconDslCommand,
  ToneInput,
  ColorInput,
  VehicleTarget,
  WeatherEffectType,
  LocationInfoType,
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
      case "changeBattleBgm":
        output.push({
          code: 132,
          indent,
          parameters: [compileAudioPayload(node.audio)],
        });
        break;
      case "changeVictoryMe":
        output.push({
          code: 133,
          indent,
          parameters: [compileAudioPayload(node.audio)],
        });
        break;
      case "changeSaveAccess":
        output.push({
          code: 134,
          indent,
          parameters: [node.enabled ? 1 : 0],
        });
        break;
      case "changeMenuAccess":
        output.push({
          code: 135,
          indent,
          parameters: [node.enabled ? 1 : 0],
        });
        break;
      case "changeEncounterDisable":
        output.push({
          code: 136,
          indent,
          parameters: [node.disabled ? 0 : 1],
        });
        break;
      case "changeFormationAccess":
        output.push({
          code: 137,
          indent,
          parameters: [node.enabled ? 1 : 0],
        });
        break;
      case "changeWindowColor":
        output.push({
          code: 138,
          indent,
          parameters: [compileTone(node.tone)],
        });
        break;
      case "changeDefeatMe":
        output.push({
          code: 139,
          indent,
          parameters: [compileAudioPayload(node.audio)],
        });
        break;
      case "changeVehicleBgm":
        output.push({
          code: 140,
          indent,
          parameters: [vehicleToCode(node.vehicle), compileAudioPayload(node.audio)],
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
      case "setMovementRoute":
        output.push({
          code: 205,
          indent,
          parameters: [
            characterSelectorToCode(node.target),
            {
              list: compileMoveRouteCommands(node.route, resolver),
              repeat: node.repeat ?? true,
              skippable: node.skippable ?? false,
              wait: node.wait ?? false,
            },
          ],
        });
        break;
      case "getOnOffVehicle":
        output.push({
          code: 206,
          indent,
          parameters: [],
        });
        break;
      case "changeTransparency":
        output.push({
          code: 211,
          indent,
          parameters: [node.transparent ? 0 : 1],
        });
        break;
      case "showAnimation":
        output.push({
          code: 212,
          indent,
          parameters: [
            characterSelectorToCode(node.target),
            resolver.resolveReference(node.animation),
            node.wait ?? false,
          ],
        });
        break;
      case "showBalloonIcon":
        output.push({
          code: 213,
          indent,
          parameters: [
            characterSelectorToCode(node.target),
            balloonIconToCode(node.balloon),
            node.wait ?? false,
          ],
        });
        break;
      case "changePlayerFollowers":
        output.push({
          code: 216,
          indent,
          parameters: [node.visible ? 0 : 1],
        });
        break;
      case "gatherFollowers":
        output.push({
          code: 217,
          indent,
          parameters: [],
        });
        break;
      case "fadeoutScreen":
        output.push({
          code: 221,
          indent,
          parameters: [],
        });
        break;
      case "fadeinScreen":
        output.push({
          code: 222,
          indent,
          parameters: [],
        });
        break;
      case "tintScreen":
        output.push({
          code: 223,
          indent,
          parameters: [compileTone(node.tone), node.duration, node.wait ?? false],
        });
        break;
      case "flashScreen":
        output.push({
          code: 224,
          indent,
          parameters: [compileColor(node.color), node.duration, node.wait ?? false],
        });
        break;
      case "shakeScreen":
        output.push({
          code: 225,
          indent,
          parameters: [node.power, node.speed, node.duration, node.wait ?? false],
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
      case "showPicture":
        output.push({
          code: 231,
          indent,
          parameters: [
            node.pictureId,
            node.image.name,
            pictureOriginToCode(node.position.origin),
            ...compilePicturePosition(node.position, resolver),
            node.scaleX ?? 100,
            node.scaleY ?? 100,
            node.opacity ?? 255,
            node.blendMode ?? 0,
          ],
        });
        break;
      case "movePicture":
        output.push({
          code: 232,
          indent,
          parameters: [
            node.pictureId,
            0,
            pictureOriginToCode(node.position.origin),
            ...compilePicturePosition(node.position, resolver),
            node.scaleX ?? 100,
            node.scaleY ?? 100,
            node.opacity ?? 255,
            node.blendMode ?? 0,
            node.duration,
            node.wait ?? false,
          ],
        });
        break;
      case "rotatePicture":
        output.push({
          code: 233,
          indent,
          parameters: [node.pictureId, node.speed],
        });
        break;
      case "tintPicture":
        output.push({
          code: 234,
          indent,
          parameters: [node.pictureId, compileTone(node.tone), node.duration, node.wait ?? false],
        });
        break;
      case "erasePicture":
        output.push({
          code: 235,
          indent,
          parameters: [node.pictureId],
        });
        break;
      case "setWeatherEffect":
        output.push({
          code: 236,
          indent,
          parameters: [
            weatherEffectToCode(node.weather),
            node.power,
            node.duration,
            node.wait ?? false,
          ],
        });
        break;
      case "playBgm":
        output.push({
          code: 241,
          indent,
          parameters: [compileAudioPayload(node.audio)],
        });
        break;
      case "fadeoutBgm":
        output.push({
          code: 242,
          indent,
          parameters: [node.duration],
        });
        break;
      case "saveBgm":
        output.push({
          code: 243,
          indent,
          parameters: [],
        });
        break;
      case "resumeBgm":
        output.push({
          code: 244,
          indent,
          parameters: [],
        });
        break;
      case "playBgs":
        output.push({
          code: 245,
          indent,
          parameters: [compileAudioPayload(node.audio)],
        });
        break;
      case "fadeoutBgs":
        output.push({
          code: 246,
          indent,
          parameters: [node.duration],
        });
        break;
      case "playMe":
        output.push({
          code: 249,
          indent,
          parameters: [compileAudioPayload(node.audio)],
        });
        break;
      case "playSe":
        output.push({
          code: 250,
          indent,
          parameters: [compileAudioPayload(node.audio)],
        });
        break;
      case "stopSe":
        output.push({
          code: 251,
          indent,
          parameters: [],
        });
        break;
      case "playMovie":
        output.push({
          code: 261,
          indent,
          parameters: [node.movie.name],
        });
        break;
      case "changeMapNameDisplay":
        output.push({
          code: 281,
          indent,
          parameters: [node.enabled ? 0 : 1],
        });
        break;
      case "changeTileset":
        output.push({
          code: 282,
          indent,
          parameters: [resolver.resolveReference(node.tileset)],
        });
        break;
      case "changeBattleBack":
        output.push({
          code: 283,
          indent,
          parameters: [node.battleback1.name, node.battleback2.name],
        });
        break;
      case "changeParallax":
        output.push({
          code: 284,
          indent,
          parameters: [
            node.image.name,
            node.loopX ?? false,
            node.loopY ?? false,
            node.sx ?? 0,
            node.sy ?? 0,
          ],
        });
        break;
      case "getLocationInfo":
        output.push({
          code: 285,
          indent,
          parameters: [
            resolver.resolveReference(node.variable),
            locationInfoTypeToCode(node.info),
            ...compileLocationInfoPosition(node.location, resolver),
          ],
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

function balloonIconToCode(balloon: ShowBalloonIconDslCommand["balloon"]): number {
  if (typeof balloon === "number") {
    return balloon;
  }

  switch (balloon) {
    case "exclamation":
      return 1;
    case "question":
      return 2;
    case "musicNote":
      return 3;
    case "heart":
      return 4;
    case "anger":
      return 5;
    case "sweat":
      return 6;
    case "cobweb":
      return 7;
    case "silence":
      return 8;
    case "lightBulb":
      return 9;
    case "zzz":
      return 10;
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

function compileTone(tone: ToneInput): [number, number, number, number] {
  return "red" in tone
    ? [tone.red, tone.green, tone.blue, tone.gray]
    : [tone[0], tone[1], tone[2], tone[3]];
}

function compileColor(color: ColorInput): [number, number, number, number] {
  return "red" in color
    ? [color.red, color.green, color.blue, color.alpha]
    : [color[0], color[1], color[2], color[3]];
}

function pictureOriginToCode(origin: PicturePosition["origin"]): number {
  return origin === "center" ? 1 : 0;
}

function compilePicturePosition(
  position: CommandPosition,
  resolver: ReferenceResolver,
): [number, number, number] {
  if (position.kind === "direct") {
    return [0, position.x, position.y];
  }

  return [1, resolver.resolveReference(position.x), resolver.resolveReference(position.y)];
}

function weatherEffectToCode(weather: WeatherEffectType): string {
  return weather === "none" ? "none" : weather;
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

function compileMoveRouteCommands(
  route: readonly MoveRouteCommand[],
  resolver: ReferenceResolver,
): Array<{ code: number; parameters: unknown[] }> {
  return [
    ...route.map((command) => compileMoveRouteCommand(command, resolver)),
    { code: 0, parameters: [] },
  ];
}

function compileMoveRouteCommand(
  command: MoveRouteCommand,
  resolver: ReferenceResolver,
): { code: number; parameters: unknown[] } {
  switch (command.kind) {
    case "moveDown":
      return { code: 1, parameters: [] };
    case "moveLeft":
      return { code: 2, parameters: [] };
    case "moveRight":
      return { code: 3, parameters: [] };
    case "moveUp":
      return { code: 4, parameters: [] };
    case "moveLowerLeft":
      return { code: 5, parameters: [] };
    case "moveLowerRight":
      return { code: 6, parameters: [] };
    case "moveUpperLeft":
      return { code: 7, parameters: [] };
    case "moveUpperRight":
      return { code: 8, parameters: [] };
    case "moveRandom":
      return { code: 9, parameters: [] };
    case "moveTowardPlayer":
      return { code: 10, parameters: [] };
    case "moveAwayFromPlayer":
      return { code: 11, parameters: [] };
    case "moveForward":
      return { code: 12, parameters: [] };
    case "moveBackward":
      return { code: 13, parameters: [] };
    case "jump":
      return { code: 14, parameters: [command.x, command.y] };
    case "routeWait":
      return { code: 15, parameters: [command.frames] };
    case "turnDown":
      return { code: 16, parameters: [] };
    case "turnLeft":
      return { code: 17, parameters: [] };
    case "turnRight":
      return { code: 18, parameters: [] };
    case "turnUp":
      return { code: 19, parameters: [] };
    case "turn90Right":
      return { code: 20, parameters: [] };
    case "turn90Left":
      return { code: 21, parameters: [] };
    case "turn180":
      return { code: 22, parameters: [] };
    case "turn90RightOrLeft":
      return { code: 23, parameters: [] };
    case "turnRandom":
      return { code: 24, parameters: [] };
    case "turnTowardPlayer":
      return { code: 25, parameters: [] };
    case "turnAwayFromPlayer":
      return { code: 26, parameters: [] };
    case "switchOn":
      return { code: 27, parameters: [resolver.resolveReference(command.switch)] };
    case "switchOff":
      return { code: 28, parameters: [resolver.resolveReference(command.switch)] };
    case "changeSpeed":
      return { code: 29, parameters: [command.speed] };
    case "changeFrequency":
      return { code: 30, parameters: [command.frequency] };
    case "walkAnimation":
      return { code: command.enabled ? 31 : 32, parameters: [] };
    case "stepAnimation":
      return { code: command.enabled ? 33 : 34, parameters: [] };
    case "directionFix":
      return { code: command.enabled ? 35 : 36, parameters: [] };
    case "through":
      return { code: command.enabled ? 37 : 38, parameters: [] };
    case "transparent":
      return { code: command.enabled ? 39 : 40, parameters: [] };
    case "changeImage":
      return { code: 41, parameters: [command.image.name, command.index] };
    case "changeOpacity":
      return { code: 42, parameters: [command.opacity] };
    case "changeBlendMode":
      return { code: 43, parameters: [command.blendMode] };
    case "playSe":
      return {
        code: 44,
        parameters: [compileAudioPayload(command.audio)],
      };
    case "script":
      return { code: 45, parameters: [command.script.code] };
  }
}

function compileAudioPayload(audio: AudioPayload): {
  name: string;
  pan: number;
  pitch: number;
  volume: number;
} {
  return {
    name: audio.asset.name,
    volume: audio.volume ?? 90,
    pitch: audio.pitch ?? 100,
    pan: audio.pan ?? 0,
  };
}

function compileLocationInfoPosition(
  position: CommandPosition,
  resolver: ReferenceResolver,
): [number, number, number] {
  if (position.kind === "direct") {
    return [0, position.x, position.y];
  }

  return [1, resolver.resolveReference(position.x), resolver.resolveReference(position.y)];
}

function locationInfoTypeToCode(info: LocationInfoType): number {
  switch (info) {
    case "terrainTag":
      return 0;
    case "eventId":
      return 1;
    case "tileIdLayer1":
      return 2;
    case "tileIdLayer2":
      return 3;
    case "tileIdLayer3":
      return 4;
    case "tileIdLayer4":
      return 5;
    case "regionId":
      return 6;
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
