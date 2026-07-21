import type { DecompiledCommandListRendering, RawEventCommand, RenderedCommand } from "./types.js";
import {
  isItemType,
  isSelfSwitch,
  literal,
  readControlValue,
  readPositiveInteger,
  readStringParameter,
} from "./core.js";
import {
  renderShowTextCommand,
  renderShowChoicesCommand,
  renderShowScrollingTextCommand,
  renderCommentCommand,
  renderScriptCommand,
} from "../commands/message/decompile.js";
export {
  renderShowTextCommand,
  renderShowChoicesCommand,
  renderShowScrollingTextCommand,
  renderCommentCommand,
  renderScriptCommand,
  findMessageBranchEnd,
  renderInlineCommandListSource,
} from "../commands/message/decompile.js";
import { renderConditionalCommand, renderLoopCommand } from "../commands/flow/decompile.js";
export {
  renderConditionalCommand,
  renderLoopCommand,
  renderConditionalBranchCondition,
  renderSwitchCondition,
  renderVariableCondition,
  renderSelfSwitchCondition,
  renderTimerCondition,
  renderActorCondition,
  renderActorConditionCheck,
  renderReferencedActorCheck,
  renderEnemyCondition,
  renderCharacterCondition,
  renderGoldCondition,
  renderItemCondition,
  renderWeaponCondition,
  renderArmorCondition,
  renderButtonCondition,
  renderVehicleCondition,
  findConditionalBranchBodyEnd,
  findLoopBodyEnd,
  conditionalVariableOperatorFromCode,
  vehicleFromCode,
  isButtonName,
} from "../commands/flow/decompile.js";
import {
  renderTransferPlayer,
  renderSetVehicleLocation,
  renderSetEventLocation,
  renderScrollMap,
  renderSetMovementRoute,
  renderChangeTransparency,
  renderShowAnimation,
  renderShowBalloonIcon,
  renderChangePlayerFollowers,
} from "../commands/movement/decompile.js";
export {
  renderTransferPlayer,
  renderSetVehicleLocation,
  renderSetEventLocation,
  renderScrollMap,
  renderSetMovementRoute,
  renderChangeTransparency,
  renderShowAnimation,
  renderShowBalloonIcon,
  renderChangePlayerFollowers,
  renderMoveRouteCommands,
  renderMoveRouteCommand,
  moveRouteSimpleExpressionFromCode,
  renderMoveRoutePlaySe,
  renderCharacterRuntimeSelector,
  renderOptionalDirectionAndFade,
  renderOptionalEventDirection,
  balloonIconFromCode,
} from "../commands/movement/decompile.js";
import {
  renderTintScreen,
  renderFlashScreen,
  renderShakeScreen,
  renderShowPicture,
  renderMovePicture,
  renderRotatePicture,
  renderTintPicture,
  renderErasePicture,
  renderSetWeatherEffect,
} from "../commands/screen/decompile.js";
export {
  renderTintScreen,
  renderFlashScreen,
  renderShakeScreen,
  renderShowPicture,
  renderMovePicture,
  renderRotatePicture,
  renderTintPicture,
  renderErasePicture,
  renderSetWeatherEffect,
  renderPicturePosition,
  renderCommandPosition,
  renderPictureDisplay,
  renderTone,
  renderColor,
  pictureOriginFromCode,
  weatherEffectFromCode,
} from "../commands/screen/decompile.js";
import {
  renderAudioCommand,
  renderDurationCommand,
  renderChangeVehicleBgm,
  renderPlayMovie,
} from "../commands/audio/decompile.js";
export {
  renderAudioCommand,
  renderDurationCommand,
  renderChangeVehicleBgm,
  renderPlayMovie,
  renderAudioPayload,
} from "../commands/audio/decompile.js";
import {
  renderChangeTileset,
  renderChangeBattleBack,
  renderChangeParallax,
  renderGetLocationInfo,
} from "../commands/map/decompile.js";
export {
  renderChangeTileset,
  renderChangeBattleBack,
  renderChangeParallax,
  renderGetLocationInfo,
  locationInfoTypeFromCode,
} from "../commands/map/decompile.js";
import {
  renderBattleProcessingCommand,
  renderShopProcessingCommand,
} from "../commands/battle/decompile.js";
export {
  renderBattleProcessingCommand,
  renderShopProcessingCommand,
  renderBattleTroop,
  battleBranchFieldName,
  renderShopGoods,
  shopGoodsKindFromCode,
} from "../commands/battle/decompile.js";
import {
  renderNameInputProcessing,
  renderActorOperateValueCommand,
  renderChangeState,
  renderRecoverAll,
  renderChangeParameter,
  renderChangeSkill,
  renderChangeEquipment,
  renderActorStringCommand,
  renderChangeClass,
  renderChangeActorImages,
  renderChangeVehicleImage,
} from "../commands/actor/decompile.js";
export {
  renderNameInputProcessing,
  renderActorOperateValueCommand,
  renderChangeState,
  renderRecoverAll,
  renderChangeParameter,
  renderChangeSkill,
  renderChangeEquipment,
  renderActorStringCommand,
  renderChangeClass,
  renderChangeActorImages,
  renderChangeVehicleImage,
  renderActorCommandTarget,
  actorParameterFromCode,
} from "../commands/actor/decompile.js";
import {
  renderEnemyOperateValueCommand,
  renderChangeEnemyState,
  renderEnemyTargetOnlyCommand,
  renderEnemyTransform,
  renderShowBattleAnimation,
  renderForceAction,
} from "../commands/enemy/decompile.js";
export {
  renderEnemyOperateValueCommand,
  renderChangeEnemyState,
  renderEnemyTargetOnlyCommand,
  renderEnemyTransform,
  renderShowBattleAnimation,
  renderForceAction,
  renderEnemyCommandTarget,
  renderBattlerCommandTarget,
} from "../commands/enemy/decompile.js";
import {
  renderControlVariables,
  renderReferenceTarget,
  renderOperateValueOperand,
} from "../commands/variables/decompile.js";
export {
  renderControlVariables,
  renderReferenceTarget,
  renderOperateValueOperand,
  renderControlVariablesGameDataOperand,
  renderActorGameDataOperand,
  renderEnemyGameDataOperand,
  renderCharacterGameDataOperand,
  controlVariablesOperationFromCode,
  actorGameDataValueFromCode,
  enemyGameDataValueFromCode,
  characterGameDataValueFromCode,
  otherGameDataValueFromCode,
} from "../commands/variables/decompile.js";
import {
  renderBooleanSystemCommand,
  renderChangeWindowColor,
  renderPluginCommand,
  renderNoParameterCommand,
  renderRawCommand,
} from "../commands/system/decompile.js";
export {
  renderBooleanSystemCommand,
  renderChangeWindowColor,
  renderPluginCommand,
  renderNoParameterCommand,
  renderRawCommand,
} from "../commands/system/decompile.js";

export function renderDecompiledCommandList(
  commands: readonly RawEventCommand[],
): DecompiledCommandListRendering {
  const rendered: string[] = [];
  const helperNames = new Set<string>();

  for (let index = 0; index < commands.length; index += 1) {
    const command = commands[index];

    if (command === undefined || command.code === 0) {
      continue;
    }

    const commandRendering = renderCommandAt(commands, index);
    rendered.push(commandRendering.expression);
    for (const helperName of commandRendering.helperNames) {
      helperNames.add(helperName);
    }
    index = commandRendering.nextIndex;
  }

  return {
    helperNames: [...helperNames].sort((left, right) => left.localeCompare(right)),
    source: rendered.map((line) => `${line},`).join("\n"),
  };
}

export function renderCommands(commands: readonly RawEventCommand[]): string {
  return renderDecompiledCommandList(commands).source;
}

export function renderCommandAt(
  commands: readonly RawEventCommand[],
  index: number,
): RenderedCommand {
  const command = commands[index];

  if (command === undefined) {
    throw new Error("Cannot render missing event command.");
  }

  switch (command.code) {
    case 101:
      return renderShowTextCommand(commands, index, renderSimpleOrRawCommand);
    case 102:
      return renderShowChoicesCommand(
        commands,
        index,
        renderDecompiledCommandList,
        renderSimpleOrRawCommand,
      );
    case 105:
      return renderShowScrollingTextCommand(commands, index, renderSimpleOrRawCommand);
    case 108:
      return renderCommentCommand(commands, index);
    case 111:
      return renderConditionalCommand(
        commands,
        index,
        renderDecompiledCommandList,
        renderSimpleOrRawCommand,
      );
    case 112:
      return renderLoopCommand(commands, index, renderDecompiledCommandList);
    case 301:
      return renderBattleProcessingCommand(
        commands,
        index,
        renderDecompiledCommandList,
        renderSimpleOrRawCommand,
      );
    case 302:
      return renderShopProcessingCommand(commands, index, renderSimpleOrRawCommand);
    case 355:
      return renderScriptCommand(commands, index, renderSimpleOrRawCommand);
    default:
      return renderSimpleOrRawCommand(command, index);
  }
}

export function renderSimpleOrRawCommand(command: RawEventCommand, index: number): RenderedCommand {
  const helper = renderSimpleCommand(command);

  if (helper !== null) {
    return {
      expression: helper.expression,
      helperNames: helper.helperNames,
      nextIndex: index,
    };
  }

  return {
    expression: renderRawCommand(command),
    helperNames: ["rawDslCommand"],
    nextIndex: index,
  };
}

export function renderSimpleCommand(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  switch (command.code) {
    case 117: {
      const commonEventId = readPositiveInteger(command.parameters[0]);
      return commonEventId === null
        ? null
        : {
            expression: `callCommonEvent(commonEventRef({ id: ${commonEventId} }))`,
            helperNames: ["callCommonEvent", "commonEventRef"],
          };
    }
    case 118:
      return {
        expression: `label(${literal(readStringParameter(command.parameters[0]))})`,
        helperNames: ["label"],
      };
    case 119:
      return {
        expression: `jumpToLabel(${literal(readStringParameter(command.parameters[0]))})`,
        helperNames: ["jumpToLabel"],
      };
    case 121: {
      const startSwitchId = readPositiveInteger(command.parameters[0]);
      const endSwitchId = readPositiveInteger(command.parameters[1]);
      const value = readControlValue(command.parameters[2]);
      return startSwitchId === null || endSwitchId === null || value === null
        ? null
        : {
            expression: `controlSwitches({ switch: ${renderReferenceTarget("switchRef", startSwitchId, endSwitchId)}, value: ${value} })`,
            helperNames: ["controlSwitches", "switchRef"],
          };
    }
    case 122:
      return renderControlVariables(command);
    case 123: {
      const selfSwitch = command.parameters[0];
      const value = readControlValue(command.parameters[1]);
      return isSelfSwitch(selfSwitch) && value !== null
        ? {
            expression: `controlSelfSwitch({ selfSwitch: ${literal(selfSwitch)}, value: ${value} })`,
            helperNames: ["controlSelfSwitch"],
          }
        : null;
    }
    case 124: {
      const action = command.parameters[0];
      const seconds = command.parameters[1];
      if (action === 0 && typeof seconds === "number") {
        return {
          expression: `controlTimer({ action: "start", seconds: ${seconds} })`,
          helperNames: ["controlTimer"],
        };
      }
      if (action === 1) {
        return {
          expression: `controlTimer({ action: "stop" })`,
          helperNames: ["controlTimer"],
        };
      }
      return null;
    }
    case 125: {
      const operand = renderOperateValueOperand(
        command.parameters[0],
        command.parameters[1],
        command.parameters[2],
      );
      return operand === null
        ? null
        : {
            expression: `changeGold({ operation: ${literal(operand.operation)}, value: ${operand.expression} })`,
            helperNames: ["changeGold", ...operand.helperNames],
          };
    }
    case 113:
      return renderNoParameterCommand(command, "breakLoop");
    case 115:
      return renderNoParameterCommand(command, "exitEvent");
    case 103: {
      const variableId = readPositiveInteger(command.parameters[0]);
      const digits = command.parameters[1];
      return variableId !== null && typeof digits === "number"
        ? {
            expression: `inputNumber({ variable: variableRef({ id: ${variableId} }), digits: ${digits} })`,
            helperNames: ["inputNumber", "variableRef"],
          }
        : null;
    }
    case 104: {
      const variableId = readPositiveInteger(command.parameters[0]);
      const itemType = command.parameters[1];
      return variableId !== null && isItemType(itemType)
        ? {
            expression: `selectItem({ variable: variableRef({ id: ${variableId} }), itemType: ${itemType} })`,
            helperNames: ["selectItem", "variableRef"],
          }
        : null;
    }
    case 126: {
      const itemId = readPositiveInteger(command.parameters[0]);
      const operand = renderOperateValueOperand(
        command.parameters[1],
        command.parameters[2],
        command.parameters[3],
      );
      return itemId === null || operand === null
        ? null
        : {
            expression: `changeItems({ item: itemRef({ id: ${itemId} }), operation: ${literal(operand.operation)}, amount: ${operand.expression} })`,
            helperNames: ["changeItems", "itemRef", ...operand.helperNames],
          };
    }
    case 127: {
      const weaponId = readPositiveInteger(command.parameters[0]);
      const operand = renderOperateValueOperand(
        command.parameters[1],
        command.parameters[2],
        command.parameters[3],
      );
      const includeEquipment = command.parameters[4];
      return weaponId === null || operand === null || typeof includeEquipment !== "boolean"
        ? null
        : {
            expression: `changeWeapons({ weapon: weaponRef({ id: ${weaponId} }), operation: ${literal(operand.operation)}, amount: ${operand.expression}, includeEquipment: ${includeEquipment} })`,
            helperNames: ["changeWeapons", "weaponRef", ...operand.helperNames],
          };
    }
    case 128: {
      const armorId = readPositiveInteger(command.parameters[0]);
      const operand = renderOperateValueOperand(
        command.parameters[1],
        command.parameters[2],
        command.parameters[3],
      );
      const includeEquipment = command.parameters[4];
      return armorId === null || operand === null || typeof includeEquipment !== "boolean"
        ? null
        : {
            expression: `changeArmors({ armor: armorRef({ id: ${armorId} }), operation: ${literal(operand.operation)}, amount: ${operand.expression}, includeEquipment: ${includeEquipment} })`,
            helperNames: ["armorRef", "changeArmors", ...operand.helperNames],
          };
    }
    case 129: {
      const actorId = readPositiveInteger(command.parameters[0]);
      const operation = command.parameters[1];
      const initialize = command.parameters[2];
      return actorId === null ||
        (operation !== 0 && operation !== 1) ||
        typeof initialize !== "boolean"
        ? null
        : {
            expression: `changePartyMember({ actor: actorRef({ id: ${actorId} }), operation: ${literal(operation === 0 ? "add" : "remove")}, initialize: ${initialize} })`,
            helperNames: ["actorRef", "changePartyMember"],
          };
    }
    case 132:
      return renderAudioCommand(command, "changeBattleBgm", "bgm");
    case 133:
      return renderAudioCommand(command, "changeVictoryMe", "me");
    case 134:
      return renderBooleanSystemCommand(command, "changeSaveAccess", "enabled", false);
    case 135:
      return renderBooleanSystemCommand(command, "changeMenuAccess", "enabled", false);
    case 136:
      return renderBooleanSystemCommand(command, "changeEncounterDisable", "disabled", true);
    case 137:
      return renderBooleanSystemCommand(command, "changeFormationAccess", "enabled", false);
    case 138:
      return renderChangeWindowColor(command);
    case 139:
      return renderAudioCommand(command, "changeDefeatMe", "me");
    case 140:
      return renderChangeVehicleBgm(command);
    case 201:
      return renderTransferPlayer(command);
    case 202:
      return renderSetVehicleLocation(command);
    case 203:
      return renderSetEventLocation(command);
    case 204:
      return renderScrollMap(command);
    case 205:
      return renderSetMovementRoute(command);
    case 206:
      return command.parameters.length === 0
        ? {
            expression: "getOnOffVehicle()",
            helperNames: ["getOnOffVehicle"],
          }
        : null;
    case 211:
      return renderChangeTransparency(command);
    case 212:
      return renderShowAnimation(command);
    case 213:
      return renderShowBalloonIcon(command);
    case 214:
      return {
        expression: "eraseEvent()",
        helperNames: ["eraseEvent"],
      };
    case 216:
      return renderChangePlayerFollowers(command);
    case 217:
      return command.parameters.length === 0
        ? {
            expression: "gatherFollowers()",
            helperNames: ["gatherFollowers"],
          }
        : null;
    case 221:
      return command.parameters.length === 0
        ? {
            expression: "fadeoutScreen()",
            helperNames: ["fadeoutScreen"],
          }
        : null;
    case 222:
      return command.parameters.length === 0
        ? {
            expression: "fadeinScreen()",
            helperNames: ["fadeinScreen"],
          }
        : null;
    case 223:
      return renderTintScreen(command);
    case 224:
      return renderFlashScreen(command);
    case 225:
      return renderShakeScreen(command);
    case 230: {
      const frames = command.parameters[0];
      return typeof frames === "number"
        ? {
            expression: `wait(${frames})`,
            helperNames: ["wait"],
          }
        : null;
    }
    case 231:
      return renderShowPicture(command);
    case 232:
      return renderMovePicture(command);
    case 233:
      return renderRotatePicture(command);
    case 234:
      return renderTintPicture(command);
    case 235:
      return renderErasePicture(command);
    case 236:
      return renderSetWeatherEffect(command);
    case 241:
      return renderAudioCommand(command, "playBgm", "bgm");
    case 242:
      return renderDurationCommand(command, "fadeoutBgm");
    case 243:
      return command.parameters.length === 0
        ? {
            expression: "saveBgm()",
            helperNames: ["saveBgm"],
          }
        : null;
    case 244:
      return command.parameters.length === 0
        ? {
            expression: "resumeBgm()",
            helperNames: ["resumeBgm"],
          }
        : null;
    case 245:
      return renderAudioCommand(command, "playBgs", "bgs");
    case 246:
      return renderDurationCommand(command, "fadeoutBgs");
    case 249:
      return renderAudioCommand(command, "playMe", "me");
    case 250:
      return renderAudioCommand(command, "playSe", "se");
    case 251:
      return command.parameters.length === 0
        ? {
            expression: "stopSe()",
            helperNames: ["stopSe"],
          }
        : null;
    case 261:
      return renderPlayMovie(command);
    case 281:
      return renderBooleanSystemCommand(command, "changeMapNameDisplay", "enabled", true);
    case 282:
      return renderChangeTileset(command);
    case 283:
      return renderChangeBattleBack(command);
    case 284:
      return renderChangeParallax(command);
    case 285:
      return renderGetLocationInfo(command);
    case 303:
      return renderNameInputProcessing(command);
    case 311:
      return renderActorOperateValueCommand(command, "changeHp", true);
    case 312:
      return renderActorOperateValueCommand(command, "changeMp", false);
    case 313:
      return renderChangeState(command);
    case 314:
      return renderRecoverAll(command);
    case 315:
      return renderActorOperateValueCommand(command, "changeExp", true);
    case 316:
      return renderActorOperateValueCommand(command, "changeLevel", true);
    case 317:
      return renderChangeParameter(command);
    case 318:
      return renderChangeSkill(command);
    case 319:
      return renderChangeEquipment(command);
    case 320:
      return renderActorStringCommand(command, "changeName", "name");
    case 321:
      return renderChangeClass(command);
    case 322:
      return renderChangeActorImages(command);
    case 323:
      return renderChangeVehicleImage(command);
    case 324:
      return renderActorStringCommand(command, "changeNickname", "nickname");
    case 325:
      return renderActorStringCommand(command, "changeProfile", "profile");
    case 326:
      return renderActorOperateValueCommand(command, "changeTp", false);
    case 331:
      return renderEnemyOperateValueCommand(command, "changeEnemyHp", true);
    case 332:
      return renderEnemyOperateValueCommand(command, "changeEnemyMp", false);
    case 333:
      return renderChangeEnemyState(command);
    case 334:
      return renderEnemyTargetOnlyCommand(command, "enemyRecoverAll");
    case 335:
      return renderEnemyTargetOnlyCommand(command, "enemyAppear");
    case 336:
      return renderEnemyTransform(command);
    case 337:
      return renderShowBattleAnimation(command);
    case 339:
      return renderForceAction(command);
    case 340:
      return renderNoParameterCommand(command, "abortBattle");
    case 342:
      return renderEnemyOperateValueCommand(command, "changeEnemyTp", false);
    case 351:
      return renderNoParameterCommand(command, "openMenuScreen");
    case 352:
      return renderNoParameterCommand(command, "openSaveScreen");
    case 353:
      return renderNoParameterCommand(command, "gameOver");
    case 354:
      return renderNoParameterCommand(command, "returnToTitleScreen");
    case 356:
      return renderPluginCommand(command);
    default:
      return null;
  }
}
