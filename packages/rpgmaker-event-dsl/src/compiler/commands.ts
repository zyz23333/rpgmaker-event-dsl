import type { CommonEventDefinition, DslCommand, PageConditions } from "../dsl.js";
import type { ReferenceResolver } from "../staged-graph.js";
import { compileConditionalBranchParameters, vehicleToCode } from "./commands/conditions.js";
export {
  compileConditionalBranchParameters,
  conditionalVariableOperatorToCode,
  actorConditionCheckToCode,
  actorConditionCheckValue,
  goldConditionOperatorToCode,
  vehicleToCode,
} from "./commands/conditions.js";
import {
  balloonIconToCode,
  compileTone,
  compileColor,
  pictureOriginToCode,
  compilePicturePosition,
  weatherEffectToCode,
} from "./commands/screen.js";
export {
  balloonIconToCode,
  compileTone,
  compileColor,
  pictureOriginToCode,
  compilePicturePosition,
  weatherEffectToCode,
} from "./commands/screen.js";
import {
  resolveControlValue,
  compileControlVariablesParameters,
  compileReferenceTargetRange,
  compileOperateValueParameters,
} from "./commands/variables.js";
export {
  resolveControlValue,
  isReferenceValue,
  compileControlVariablesParameters,
  compileReferenceTargetRange,
  compileOperateValueParameters,
  compileControlVariablesGameDataOperand,
  actorGameDataValueToCode,
  enemyGameDataValueToCode,
  characterGameDataValueToCode,
  otherGameDataValueToCode,
} from "./commands/variables.js";
import {
  compileChoiceBranches,
  compileBattleProcessingParameters,
  compileShopGoodsParameters,
} from "./commands/branches.js";
export {
  compileChoiceBranches,
  compileBattleProcessingParameters,
  compileShopGoodsParameters,
  shopGoodsTypeToCode,
} from "./commands/branches.js";
import {
  compileActorCommandTarget,
  enemyTargetToCode,
  battlerTargetTypeToCode,
  battlerTargetIdToCode,
  actorParameterToCode,
} from "./commands/targets.js";
export {
  compileActorCommandTarget,
  enemyTargetToCode,
  battlerTargetTypeToCode,
  battlerTargetIdToCode,
  actorParameterToCode,
} from "./commands/targets.js";
import {
  characterSelectorToCode,
  compileSetVehicleLocationParameters,
  compileSetEventLocationParameters,
  compileMoveRouteCommands,
} from "./commands/movement.js";
export {
  characterSelectorToCode,
  compileSetVehicleLocationParameters,
  compileSetEventLocationParameters,
  compileMoveRouteCommands,
  compileMoveRouteCommand,
} from "./commands/movement.js";
import {
  compileAudioPayload,
  compileLocationInfoPosition,
  locationInfoTypeToCode,
} from "./commands/media.js";
export {
  compileAudioPayload,
  compileLocationInfoPosition,
  locationInfoTypeToCode,
} from "./commands/media.js";

export type RawEventCommand = {
  code: number;
  indent: number;
  parameters: unknown[];
};

export function compileNodes(
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
        output.push({ code: 412, indent, parameters: [] });
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
        if (node.win) {
          output.push({ code: 601, indent, parameters: [] });
          output.push(...compileNodes(node.win, indent + 1, resolver, false));
        }
        if (node.escape) {
          output.push({ code: 602, indent, parameters: [] });
          output.push(...compileNodes(node.escape, indent + 1, resolver, false));
        }
        if (node.lose) {
          output.push({ code: 603, indent, parameters: [] });
          output.push(...compileNodes(node.lose, indent + 1, resolver, false));
        }
        output.push({ code: 604, indent, parameters: [] });
        break;
      case "script":
        output.push({
          code: 355,
          indent,
          parameters: [node.script.code.split("\n")[0] ?? ""],
        });
        for (const line of node.script.code.split("\n").slice(1)) {
          output.push({
            code: 655,
            indent,
            parameters: [line],
          });
        }
        break;
      case "pluginCommand":
        output.push({
          code: 356,
          indent,
          parameters: [
            node.args !== undefined && node.args.length > 0
              ? `${node.command} ${node.args.join(" ")}`
              : node.command,
          ],
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
            node.cancelBranch === undefined ? (node.cancelType ?? -1) : -2,
            node.defaultType ?? 0,
            node.positionType ?? 2,
            node.background ?? 0,
          ],
        });
        output.push(...compileChoiceBranches(node, indent, resolver));
        output.push({ code: 404, indent, parameters: [] });
        break;
      case "shopProcessing":
        node.goods.forEach((goods, index) => {
          output.push({
            code: index === 0 ? 302 : 605,
            indent,
            parameters:
              index === 0
                ? [...compileShopGoodsParameters(goods, resolver), node.allowSelling ?? false]
                : compileShopGoodsParameters(goods, resolver),
          });
        });
        break;
      case "nameInputProcessing":
        output.push({
          code: 303,
          indent,
          parameters: [resolver.resolveReference(node.actor), node.maxCharacters],
        });
        break;
      case "changeHp":
        output.push({
          code: 311,
          indent,
          parameters: [
            ...compileActorCommandTarget(node.target, resolver),
            ...compileOperateValueParameters(node.operation, node.value, resolver),
            node.allowDeath ?? false,
          ],
        });
        break;
      case "changeMp":
        output.push({
          code: 312,
          indent,
          parameters: [
            ...compileActorCommandTarget(node.target, resolver),
            ...compileOperateValueParameters(node.operation, node.value, resolver),
          ],
        });
        break;
      case "changeState":
        output.push({
          code: 313,
          indent,
          parameters: [
            ...compileActorCommandTarget(node.target, resolver),
            node.operation === "add" ? 0 : 1,
            resolver.resolveReference(node.state),
          ],
        });
        break;
      case "recoverAll":
        output.push({
          code: 314,
          indent,
          parameters: compileActorCommandTarget(node.target, resolver),
        });
        break;
      case "changeExp":
        output.push({
          code: 315,
          indent,
          parameters: [
            ...compileActorCommandTarget(node.target, resolver),
            ...compileOperateValueParameters(node.operation, node.value, resolver),
            node.showLevelUp ?? false,
          ],
        });
        break;
      case "changeLevel":
        output.push({
          code: 316,
          indent,
          parameters: [
            ...compileActorCommandTarget(node.target, resolver),
            ...compileOperateValueParameters(node.operation, node.value, resolver),
            node.showLevelUp ?? false,
          ],
        });
        break;
      case "changeParameter":
        output.push({
          code: 317,
          indent,
          parameters: [
            ...compileActorCommandTarget(node.target, resolver),
            actorParameterToCode(node.parameter),
            ...compileOperateValueParameters(node.operation, node.value, resolver),
          ],
        });
        break;
      case "changeSkill":
        output.push({
          code: 318,
          indent,
          parameters: [
            ...compileActorCommandTarget(node.target, resolver),
            node.operation === "learn" ? 0 : 1,
            resolver.resolveReference(node.skill),
          ],
        });
        break;
      case "changeEquipment":
        output.push({
          code: 319,
          indent,
          parameters: [
            resolver.resolveReference(node.actor),
            node.equipmentTypeId,
            node.itemId ?? 0,
          ],
        });
        break;
      case "changeName":
        output.push({
          code: 320,
          indent,
          parameters: [resolver.resolveReference(node.actor), node.name],
        });
        break;
      case "changeClass":
        output.push({
          code: 321,
          indent,
          parameters: [
            resolver.resolveReference(node.actor),
            resolver.resolveReference(node.class),
            node.keepExp ?? false,
          ],
        });
        break;
      case "changeActorImages":
        output.push({
          code: 322,
          indent,
          parameters: [
            resolver.resolveReference(node.actor),
            node.character.image.name,
            node.character.index,
            node.face.image.name,
            node.face.index,
            node.battler.name,
          ],
        });
        break;
      case "changeVehicleImage":
        output.push({
          code: 323,
          indent,
          parameters: [vehicleToCode(node.vehicle), node.image.name, node.index],
        });
        break;
      case "changeNickname":
        output.push({
          code: 324,
          indent,
          parameters: [resolver.resolveReference(node.actor), node.nickname],
        });
        break;
      case "changeProfile":
        output.push({
          code: 325,
          indent,
          parameters: [resolver.resolveReference(node.actor), node.profile],
        });
        break;
      case "changeTp":
        output.push({
          code: 326,
          indent,
          parameters: [
            ...compileActorCommandTarget(node.target, resolver),
            ...compileOperateValueParameters(node.operation, node.value, resolver),
          ],
        });
        break;
      case "changeEnemyHp":
        output.push({
          code: 331,
          indent,
          parameters: [
            enemyTargetToCode(node.target),
            ...compileOperateValueParameters(node.operation, node.value, resolver),
            node.allowDeath ?? false,
          ],
        });
        break;
      case "changeEnemyMp":
        output.push({
          code: 332,
          indent,
          parameters: [
            enemyTargetToCode(node.target),
            ...compileOperateValueParameters(node.operation, node.value, resolver),
          ],
        });
        break;
      case "changeEnemyState":
        output.push({
          code: 333,
          indent,
          parameters: [
            enemyTargetToCode(node.target),
            node.operation === "add" ? 0 : 1,
            resolver.resolveReference(node.state),
          ],
        });
        break;
      case "enemyRecoverAll":
        output.push({ code: 334, indent, parameters: [enemyTargetToCode(node.target)] });
        break;
      case "enemyAppear":
        output.push({ code: 335, indent, parameters: [enemyTargetToCode(node.target)] });
        break;
      case "enemyTransform":
        output.push({
          code: 336,
          indent,
          parameters: [enemyTargetToCode(node.target), resolver.resolveReference(node.enemy)],
        });
        break;
      case "showBattleAnimation":
        output.push({
          code: 337,
          indent,
          parameters: [
            node.target.target === "all" ? 0 : node.target.index,
            resolver.resolveReference(node.animation),
            node.target.target === "all",
          ],
        });
        break;
      case "forceAction":
        output.push({
          code: 339,
          indent,
          parameters: [
            battlerTargetTypeToCode(node.subject),
            battlerTargetIdToCode(node.subject),
            resolver.resolveReference(node.skill),
            node.targetIndex,
          ],
        });
        break;
      case "abortBattle":
        output.push({ code: 340, indent, parameters: [] });
        break;
      case "changeEnemyTp":
        output.push({
          code: 342,
          indent,
          parameters: [
            enemyTargetToCode(node.target),
            ...compileOperateValueParameters(node.operation, node.value, resolver),
          ],
        });
        break;
      case "openMenuScreen":
        output.push({ code: 351, indent, parameters: [] });
        break;
      case "openSaveScreen":
        output.push({ code: 352, indent, parameters: [] });
        break;
      case "gameOver":
        output.push({ code: 353, indent, parameters: [] });
        break;
      case "returnToTitleScreen":
        output.push({ code: 354, indent, parameters: [] });
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

export function compileConditions(
  conditions: PageConditions | undefined,
  resolver: ReferenceResolver,
): Record<string, unknown> {
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
    variableValue: conditions?.variable?.value ?? 0,
  };
}

export function commonEventTriggerToCode(trigger: CommonEventDefinition["trigger"]): number {
  switch (trigger) {
    case "none":
      return 0;
    case "autorun":
      return 1;
    case "parallel":
      return 2;
  }
}
