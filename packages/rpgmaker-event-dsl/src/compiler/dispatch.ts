import type { CommonEventDefinition, DslCommand } from "../domain/types.js";
import { scrollDirections } from "../commands/movement/character-codes.js";
import {
  assertMapCharacterInput,
  isMapCharacterKind,
} from "../commands/movement/character-validation.js";
import type { ReferenceResolver } from "../validation/types.js";
import type { RawEventCommand, CommandOrigins } from "./types.js";
import { assertControlTimerInput } from "../commands/variables/validation.js";
import { assertDslCommandList } from "../validation/dsl-command-inputs.js";
import { assertShowChoicesInput } from "../commands/message/validation.js";
import { assertScreenInput } from "../commands/screen/validation.js";
import { assertSwitchCommandInput } from "../commands/variables/switch-inputs.js";
import { assertMapAppearanceInput } from "../commands/map/validation.js";
import { assertPictureInput } from "../commands/screen/picture-inputs.js";
import { assertPictureReferences } from "../commands/screen/picture-references.js";
import {
  assertSystemAccessInput,
  assertWindowColorInput,
} from "../commands/movement/access-validation.js";
import { assertSceneCommandInput } from "../commands/system/validation.js";
import { assertAudioCommandInput } from "../commands/audio/validation.js";
import { assertActorResourceInput } from "../commands/actor/validation.js";
import {
  compileActorResourceTarget,
  compileActorResourceValue,
} from "../commands/actor/compile.js";
import {
  assertConditionalCommand,
  assertConditionalBodyOutput,
  assertConditionalReferences,
} from "../commands/flow/conditional-validation.js";
import {
  locationDirectionToCode,
  transferFadeToCode,
  resolveLocationReference,
} from "../commands/map/compile.js";
import { assertMapLocationInput } from "../commands/map/location-validation.js";
import {
  resolveCommonEventCall,
  assertLoopCommand,
  assertParameterlessFlowCommand,
} from "../commands/flow/validation.js";
import {
  assertNativeCommandEnvelope,
  CommandStructureError,
  inspectCommandListStructure,
} from "../validation/command-structure.js";
import { compileConditionalBranchParameters, vehicleToCode } from "./shared/conditions.js";
export {
  compileConditionalBranchParameters,
  conditionalVariableOperatorToCode,
  actorConditionCheckToCode,
  actorConditionCheckValue,
  goldConditionOperatorToCode,
  vehicleToCode,
} from "./shared/conditions.js";
import {
  balloonIconToCode,
  compileTone,
  compileColor,
  pictureOriginToCode,
  pictureBlendToCode,
  compilePicturePosition,
  weatherEffectToCode,
} from "../commands/screen/compile.js";
export {
  balloonIconToCode,
  compileTone,
  compileColor,
  pictureOriginToCode,
  compilePicturePosition,
  weatherEffectToCode,
} from "../commands/screen/compile.js";
import {
  resolveControlValue,
  compileControlVariablesParameters,
  compileReferenceTargetRange,
  compileOperateValueParameters,
} from "../commands/variables/compile.js";
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
} from "../commands/variables/compile.js";
import {
  compileChoiceBranches,
  compileBattleProcessingParameters,
  compileShopGoodsParameters,
} from "./shared/branches.js";
export {
  compileChoiceBranches,
  compileBattleProcessingParameters,
  compileShopGoodsParameters,
  shopGoodsTypeToCode,
} from "./shared/branches.js";
import {
  enemyTargetToCode,
  battlerTargetTypeToCode,
  battlerTargetIdToCode,
  actorParameterToCode,
} from "./shared/targets.js";
export {
  enemyTargetToCode,
  battlerTargetTypeToCode,
  battlerTargetIdToCode,
  actorParameterToCode,
} from "./shared/targets.js";
import {
  characterSelectorToCode,
  compileSetVehicleLocationParameters,
  compileSetEventLocationParameters,
  compileMovementRoute,
} from "../commands/movement/compile.js";
import {
  assertSetMovementRoute,
  assertNativeMovementCommandParameters,
} from "../commands/movement/validation.js";
export {
  characterSelectorToCode,
  compileSetVehicleLocationParameters,
  compileSetEventLocationParameters,
  compileMoveRouteCommands,
  compileMoveRouteCommand,
} from "../commands/movement/compile.js";
import {
  compileAudioPayload,
  compileLocationInfoPosition,
  locationInfoTypeToCode,
} from "./shared/media.js";
export {
  compileAudioPayload,
  compileLocationInfoPosition,
  locationInfoTypeToCode,
} from "./shared/media.js";
export type { RawEventCommand } from "./types.js";

export function compileNodes(
  nodes: readonly DslCommand[],
  indent: number,
  resolver: ReferenceResolver,
  includeTerminator = true,
  sourcePath = "commands",
  origins: CommandOrigins = new Map(),
): RawEventCommand[] {
  assertDslCommandList(nodes, sourcePath);
  const output: RawEventCommand[] = [];

  for (const [nodeIndex, node] of nodes.entries()) {
    assertPictureInput(node.kind, node, `${sourcePath}[${nodeIndex}]`, true, resolver);
    assertAudioCommandInput(node.kind, node, `${sourcePath}[${nodeIndex}]`);
    assertSwitchCommandInput(node.kind, node, `${sourcePath}[${nodeIndex}]`);
    assertMapAppearanceInput(node.kind, node, `${sourcePath}[${nodeIndex}]`, true, resolver);
    assertSystemAccessInput(node.kind, node, `${sourcePath}[${nodeIndex}]`, true);
    assertWindowColorInput(node.kind, node, `${sourcePath}[${nodeIndex}]`, true);
    assertSceneCommandInput(node.kind, node, `${sourcePath}[${nodeIndex}]`);
    assertActorResourceInput(node.kind, node, `${sourcePath}[${nodeIndex}]`, true, resolver);

    if (isMapCharacterKind(node.kind))
      assertMapCharacterInput(node.kind, node, `${sourcePath}[${nodeIndex}]`, true, resolver);
    const outputStart = output.length;
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
      case "conditional": {
        const nodePath = `${sourcePath}[${nodeIndex}]`;
        assertConditionalCommand(node, nodePath);
        assertConditionalReferences(node, nodePath, resolver);
        output.push({
          code: 111,
          indent,
          parameters: compileConditionalBranchParameters(node.condition, resolver),
        });
        const then = compileNodes(
          node.then.commands,
          indent + 1,
          resolver,
          false,
          `${sourcePath}[${nodeIndex}].then.commands`,
          origins,
        );
        assertConditionalBodyOutput(then, node.then, indent + 1, `${nodePath}.then`);
        output.push(...then);
        if (node.then.endMarker !== "absent")
          output.push({ code: 0, indent: indent + 1, parameters: [] });
        if (node.else !== undefined) {
          output.push({
            code: 411,
            indent,
            parameters: [],
          });
          const otherwise = compileNodes(
            node.else.commands,
            indent + 1,
            resolver,
            false,
            `${sourcePath}[${nodeIndex}].else.commands`,
            origins,
          );
          assertConditionalBodyOutput(otherwise, node.else, indent + 1, `${nodePath}.else`);
          output.push(...otherwise);
          if (node.else.endMarker !== "absent")
            output.push({ code: 0, indent: indent + 1, parameters: [] });
        }
        output.push({ code: 412, indent, parameters: [] });
        break;
      }
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
      case "loop": {
        assertLoopCommand(node, `${sourcePath}[${nodeIndex}]`);
        const body = compileNodes(
          node.body.commands,
          indent + 1,
          resolver,
          false,
          `${sourcePath}[${nodeIndex}].body.commands`,
          origins,
        );
        if (body.at(-1)?.code === 0 && body.at(-1)?.indent === indent + 1) {
          throw new CommandStructureError(
            "MV-BODY-MARKER-CONFLICT",
            "Raw output contradicts the owning body's declared Body End Marker.",
            {
              dslPath: `${sourcePath}[${nodeIndex}].body.endMarker`,
            },
          );
        }
        output.push({
          code: 112,
          indent,
          parameters: [],
        });
        output.push(...body);
        if (node.body.endMarker !== "absent")
          output.push({ code: 0, indent: indent + 1, parameters: [] });
        output.push({
          code: 413,
          indent,
          parameters: [],
        });
        break;
      }
      case "breakLoop":
        assertParameterlessFlowCommand(node, `${sourcePath}[${nodeIndex}]`);
        output.push({ code: 113, indent, parameters: [] });
        break;
      case "exitEventProcessing":
        assertParameterlessFlowCommand(node, `${sourcePath}[${nodeIndex}]`);
        output.push({ code: 115, indent, parameters: [] });
        break;
      case "commonEvent":
        output.push({
          code: 117,
          indent,
          parameters: [resolveCommonEventCall(node, resolver, `${sourcePath}[${nodeIndex}]`)],
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
          parameters: compileControlVariablesParameters(
            node,
            resolver,
            `${sourcePath}[${nodeIndex}]`,
          ),
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
        assertControlTimerInput(node, `${sourcePath}[${nodeIndex}]`);
        output.push({
          code: 124,
          indent,
          parameters:
            node.action === "start"
              ? [0, node.seconds]
              : node.seconds === undefined
                ? [1]
                : [1, node.seconds],
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
      case "changeEncounter":
        output.push({
          code: 136,
          indent,
          parameters: [node.enabled ? 1 : 0],
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
        assertScreenInput(node.kind, node, `${sourcePath}[${nodeIndex}]`);
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
          output.push(
            ...compileNodes(
              node.win,
              indent + 1,
              resolver,
              false,
              `${sourcePath}[${nodeIndex}].win`,
              origins,
            ),
          );
          if (node.win.length === 0) output.push({ code: 0, indent: indent + 1, parameters: [] });
        }
        if (node.escape) {
          output.push({ code: 602, indent, parameters: [] });
          output.push(
            ...compileNodes(
              node.escape,
              indent + 1,
              resolver,
              false,
              `${sourcePath}[${nodeIndex}].escape`,
              origins,
            ),
          );
          if (node.escape.length === 0)
            output.push({ code: 0, indent: indent + 1, parameters: [] });
        }
        if (node.lose) {
          output.push({ code: 603, indent, parameters: [] });
          output.push(
            ...compileNodes(
              node.lose,
              indent + 1,
              resolver,
              false,
              `${sourcePath}[${nodeIndex}].lose`,
              origins,
            ),
          );
          if (node.lose.length === 0) output.push({ code: 0, indent: indent + 1, parameters: [] });
        }
        if (node.canEscape || node.canLose || node.win || node.escape || node.lose) {
          output.push({ code: 604, indent, parameters: [] });
        }
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
        assertMapLocationInput(node.kind, node, `${sourcePath}[${nodeIndex}]`);
        if (node.destination.kind === "direct") {
          output.push({
            code: 201,
            indent,
            parameters: [
              0,
              resolveLocationReference(
                node.destination.map,
                resolver,
                `${sourcePath}[${nodeIndex}].destination.map`,
                201,
              ),
              node.destination.x,
              node.destination.y,
              locationDirectionToCode(node.direction),
              transferFadeToCode(node.fade),
            ],
          });
        } else {
          output.push({
            code: 201,
            indent,
            parameters: [
              1,
              resolveLocationReference(
                node.destination.map,
                resolver,
                `${sourcePath}[${nodeIndex}].destination.map`,
                201,
              ),
              resolveLocationReference(
                node.destination.x,
                resolver,
                `${sourcePath}[${nodeIndex}].destination.x`,
                201,
              ),
              resolveLocationReference(
                node.destination.y,
                resolver,
                `${sourcePath}[${nodeIndex}].destination.y`,
                201,
              ),
              locationDirectionToCode(node.direction),
              transferFadeToCode(node.fade),
            ],
          });
        }
        break;
      case "setVehicleLocation":
        assertMapLocationInput(node.kind, node, `${sourcePath}[${nodeIndex}]`);
        output.push({
          code: 202,
          indent,
          parameters: compileSetVehicleLocationParameters(
            node.vehicle,
            node.destination,
            resolver,
            `${sourcePath}[${nodeIndex}]`,
          ),
        });
        break;
      case "setEventLocation":
        assertMapLocationInput(node.kind, node, `${sourcePath}[${nodeIndex}]`);
        output.push({
          code: 203,
          indent,
          parameters: compileSetEventLocationParameters(
            node,
            resolver,
            `${sourcePath}[${nodeIndex}]`,
          ),
        });
        break;
      case "scrollMap":
        output.push({
          code: 204,
          indent,
          parameters: [scrollDirections[node.direction], node.distance, node.speed],
        });
        break;
      case "setMovementRoute": {
        assertSetMovementRoute(node, `${sourcePath}[${nodeIndex}]`);
        const route = compileMovementRoute(
          node.route,
          resolver,
          `${sourcePath}[${nodeIndex}].route`,
        );
        output.push({
          code: 205,
          indent,
          parameters: [characterSelectorToCode(node.target), route],
        });
        for (const record of route.list.slice(0, -1))
          output.push({ code: 505, indent, parameters: [record] });
        break;
      }
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
            node.wait,
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
            node.wait,
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
        assertScreenInput(node.kind, node, `${sourcePath}[${nodeIndex}]`);
        output.push({
          code: 221,
          indent,
          parameters: [],
        });
        break;
      case "fadeinScreen":
        assertScreenInput(node.kind, node, `${sourcePath}[${nodeIndex}]`);
        output.push({
          code: 222,
          indent,
          parameters: [],
        });
        break;
      case "tintScreen":
        assertScreenInput(node.kind, node, `${sourcePath}[${nodeIndex}]`);
        output.push({
          code: 223,
          indent,
          parameters: [compileTone(node.tone), node.duration, node.wait],
        });
        break;
      case "flashScreen":
        assertScreenInput(node.kind, node, `${sourcePath}[${nodeIndex}]`);
        output.push({
          code: 224,
          indent,
          parameters: [compileColor(node.color), node.duration, node.wait],
        });
        break;
      case "shakeScreen":
        assertScreenInput(node.kind, node, `${sourcePath}[${nodeIndex}]`);
        output.push({
          code: 225,
          indent,
          parameters: [node.power, node.speed, node.duration, node.wait],
        });
        break;
      case "showChoices":
        assertShowChoicesInput(node, `${sourcePath}[${nodeIndex}]`);
        output.push({
          code: 102,
          indent,
          parameters: [
            node.choices.map((choice) => choice.text),
            node.cancel?.kind === "branch"
              ? -2
              : node.cancel?.kind === "disabled"
                ? -1
                : (node.cancel?.index ?? 1),
            node.defaultChoice?.kind === "none" ? -1 : (node.defaultChoice?.index ?? 0),
            { left: 0, center: 1, right: 2 }[node.position ?? "right"],
            { window: 0, dim: 1, transparent: 2 }[node.background ?? "window"],
          ],
        });
        output.push(
          ...compileChoiceBranches(
            node,
            indent,
            resolver,
            (children, childIndent, childResolver, childTerminator, childPath) =>
              compileNodes(
                children,
                childIndent,
                childResolver,
                childTerminator,
                childPath,
                origins,
              ),
            `${sourcePath}[${nodeIndex}]`,
          ),
        );
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
            ...compileActorResourceTarget(node.target, resolver),
            ...compileActorResourceValue(node.operation, node.value, resolver),
            node.allowDeath,
          ],
        });
        break;
      case "changeMp":
        output.push({
          code: 312,
          indent,
          parameters: [
            ...compileActorResourceTarget(node.target, resolver),
            ...compileActorResourceValue(node.operation, node.value, resolver),
          ],
        });
        break;
      case "changeState":
        output.push({
          code: 313,
          indent,
          parameters: [
            ...compileActorResourceTarget(node.target, resolver),
            node.operation === "add" ? 0 : 1,
            resolver.resolveReference(node.state),
          ],
        });
        break;
      case "recoverAll":
        output.push({
          code: 314,
          indent,
          parameters: compileActorResourceTarget(node.target, resolver),
        });
        break;
      case "changeExp":
        output.push({
          code: 315,
          indent,
          parameters: [
            ...compileActorResourceTarget(node.target, resolver),
            ...compileActorResourceValue(node.operation, node.value, resolver),
            node.showLevelUp,
          ],
        });
        break;
      case "changeLevel":
        output.push({
          code: 316,
          indent,
          parameters: [
            ...compileActorResourceTarget(node.target, resolver),
            ...compileActorResourceValue(node.operation, node.value, resolver),
            node.showLevelUp,
          ],
        });
        break;
      case "changeParameter":
        output.push({
          code: 317,
          indent,
          parameters: [
            ...compileActorResourceTarget(node.target, resolver),
            actorParameterToCode(node.parameter),
            ...compileActorResourceValue(node.operation, node.value, resolver),
          ],
        });
        break;
      case "changeSkill":
        output.push({
          code: 318,
          indent,
          parameters: [
            ...compileActorResourceTarget(node.target, resolver),
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
            node.slotIndex + 1,
            node.equipment === null ? 0 : node.equipment.id,
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
            node.keepExp,
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
            ...compileActorResourceTarget(node.target, resolver),
            ...compileActorResourceValue(node.operation, node.value, resolver),
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
            node.image === null ? "" : node.image.name,
            pictureOriginToCode(node.origin),
            ...compilePicturePosition(node.position, resolver),
            node.scaleX,
            node.scaleY,
            node.opacity,
            pictureBlendToCode(node.blendMode),
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
            pictureOriginToCode(node.origin),
            ...compilePicturePosition(node.position, resolver),
            node.scaleX,
            node.scaleY,
            node.opacity,
            pictureBlendToCode(node.blendMode),
            node.duration,
            node.wait,
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
          parameters: [node.pictureId, compileTone(node.tone), node.duration, node.wait],
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
        assertScreenInput(node.kind, node, `${sourcePath}[${nodeIndex}]`);
        output.push({
          code: 236,
          indent,
          parameters: [weatherEffectToCode(node.weather), node.power, node.duration, node.wait],
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
      case "replayBgm":
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
        assertScreenInput(node.kind, node, `${sourcePath}[${nodeIndex}]`);
        output.push({
          code: 261,
          indent,
          parameters: [node.movie?.name ?? ""],
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
          parameters: [node.battleback1?.name ?? "", node.battleback2?.name ?? ""],
        });
        break;
      case "changeParallax":
        output.push({
          code: 284,
          indent,
          parameters: [node.image?.name ?? "", node.loopX, node.loopY, node.sx, node.sy],
        });
        break;
      case "getLocationInfo":
        assertMapLocationInput(node.kind, node, `${sourcePath}[${nodeIndex}]`);
        output.push({
          code: 285,
          indent,
          parameters: [
            resolveLocationReference(
              node.variable,
              resolver,
              `${sourcePath}[${nodeIndex}].variable`,
              285,
            ),
            locationInfoTypeToCode(node.info),
            ...compileLocationInfoPosition(
              node.location,
              resolver,
              `${sourcePath}[${nodeIndex}].location`,
            ),
          ],
        });
        break;
      case "rawDslCommand":
        assertPictureReferences(node.code, node.parameters, resolver, {
          dslPath: `${sourcePath}[${nodeIndex}]`,
        });
        if (node.code === 205 || node.code === 505)
          assertNativeMovementCommandParameters(node.code, node.parameters, {
            dslPath: `${sourcePath}[${nodeIndex}]`,
          });
        {
          try {
            assertNativeCommandEnvelope(
              {
                code: node.code,
                indent: node.indent === undefined ? indent : node.indent,
                parameters: node.parameters,
              },
              output.length,
            );
          } catch (error) {
            if (error instanceof CommandStructureError)
              throw new CommandStructureError(error.code, error.detail, {
                ...error.location,
                dslPath: `${sourcePath}[${nodeIndex}]`,
              });
            throw error;
          }
        }
        output.push({
          code: node.code,
          indent: node.indent === undefined ? indent : node.indent,
          parameters: [...node.parameters],
        });
        break;
      default:
        throw new CommandStructureError("MV-DSL-KIND", "Unknown authored command kind.", {
          dslPath: `${sourcePath}[${nodeIndex}].kind`,
          expected: "supported command kind",
          actual: String((node as { kind: unknown }).kind),
        });
    }
    if (origins)
      for (const command of output.slice(outputStart))
        if (!origins.has(command))
          origins.set(command, { path: `${sourcePath}[${nodeIndex}]`, kind: node.kind });
  }

  if (includeTerminator && !(output.at(-1)?.code === 0 && output.at(-1)?.indent === indent)) {
    output.push({ code: 0, indent, parameters: [] });
  }
  if (includeTerminator && indent === 0)
    try {
      inspectCommandListStructure(output, { requireTerminator: true });
    } catch (error) {
      if (error instanceof CommandStructureError) {
        const dslAt = (path: string | undefined) =>
          path ? origins.get(output[Number(/^list\[(\d+)\]/u.exec(path)?.[1])]!)?.path : undefined;
        const dslPath = dslAt(error.location.nativePath);
        throw new CommandStructureError(error.code, error.detail, {
          ...error.location,
          ...(dslPath ? { dslPath } : {}),
          ...(error.location.relatedLocations
            ? {
                relatedLocations: error.location.relatedLocations.map((related) => {
                  const source = dslAt(related.nativePath);
                  return { ...related, ...(source ? { dslPath: source } : {}) };
                }),
              }
            : {}),
        });
      }
      throw error;
    }
  return output;
}

export { compilePageConditions as compileConditions } from "../map-event/page.js";

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
