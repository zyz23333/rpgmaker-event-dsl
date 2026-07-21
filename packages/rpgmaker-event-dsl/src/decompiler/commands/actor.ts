import type { RawEventCommand, RenderedCommand } from "../../decompiler.js";
import { literal, readPositiveInteger } from "../../decompiler.js";
import { renderOperateValueOperand, vehicleFromCode } from "../commands.js";

export function renderNameInputProcessing(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const actorId = readPositiveInteger(command.parameters[0]);
  const maxCharacters = command.parameters[1];
  return actorId === null || typeof maxCharacters !== "number"
    ? null
    : {
        expression: `nameInputProcessing({ actor: actorRef({ id: ${actorId} }), maxCharacters: ${maxCharacters} })`,
        helperNames: ["actorRef", "nameInputProcessing"],
      };
}

export function renderActorOperateValueCommand(
  command: RawEventCommand,
  helperName: "changeExp" | "changeHp" | "changeLevel" | "changeMp" | "changeTp",
  hasTrailingBoolean: boolean,
): Omit<RenderedCommand, "nextIndex"> | null {
  const target = renderActorCommandTarget(command.parameters[0], command.parameters[1]);
  const operand = renderOperateValueOperand(
    command.parameters[2],
    command.parameters[3],
    command.parameters[4],
  );
  const trailing = command.parameters[5];
  if (
    target === null ||
    operand === null ||
    (hasTrailingBoolean && typeof trailing !== "boolean")
  ) {
    return null;
  }

  const trailingField =
    hasTrailingBoolean && trailing
      ? helperName === "changeHp"
        ? ", allowDeath: true"
        : ", showLevelUp: true"
      : "";

  return {
    expression: `${helperName}({ target: ${target.expression}, operation: ${literal(operand.operation)}, value: ${operand.expression}${trailingField} })`,
    helperNames: [helperName, ...target.helperNames, ...operand.helperNames],
  };
}

export function renderChangeState(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const target = renderActorCommandTarget(command.parameters[0], command.parameters[1]);
  const operation =
    command.parameters[2] === 0 ? "add" : command.parameters[2] === 1 ? "remove" : null;
  const stateId = readPositiveInteger(command.parameters[3]);
  return target === null || operation === null || stateId === null
    ? null
    : {
        expression: `changeState({ target: ${target.expression}, operation: ${literal(operation)}, state: stateRef({ id: ${stateId} }) })`,
        helperNames: ["changeState", "stateRef", ...target.helperNames],
      };
}

export function renderRecoverAll(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const target = renderActorCommandTarget(command.parameters[0], command.parameters[1]);
  return target === null
    ? null
    : {
        expression: `recoverAll({ target: ${target.expression} })`,
        helperNames: ["recoverAll", ...target.helperNames],
      };
}

export function renderChangeParameter(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const target = renderActorCommandTarget(command.parameters[0], command.parameters[1]);
  const parameter = actorParameterFromCode(command.parameters[2]);
  const operand = renderOperateValueOperand(
    command.parameters[3],
    command.parameters[4],
    command.parameters[5],
  );
  return target === null || parameter === null || operand === null
    ? null
    : {
        expression: `changeParameter({ target: ${target.expression}, parameter: ${literal(parameter)}, operation: ${literal(operand.operation)}, value: ${operand.expression} })`,
        helperNames: ["changeParameter", ...target.helperNames, ...operand.helperNames],
      };
}

export function renderChangeSkill(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const target = renderActorCommandTarget(command.parameters[0], command.parameters[1]);
  const operation =
    command.parameters[2] === 0 ? "learn" : command.parameters[2] === 1 ? "forget" : null;
  const skillId = readPositiveInteger(command.parameters[3]);
  return target === null || operation === null || skillId === null
    ? null
    : {
        expression: `changeSkill({ target: ${target.expression}, operation: ${literal(operation)}, skill: skillRef({ id: ${skillId} }) })`,
        helperNames: ["changeSkill", "skillRef", ...target.helperNames],
      };
}

export function renderChangeEquipment(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const actorId = readPositiveInteger(command.parameters[0]);
  const equipmentTypeId = readPositiveInteger(command.parameters[1]);
  const itemId = command.parameters[2];
  if (
    actorId === null ||
    equipmentTypeId === null ||
    typeof itemId !== "number" ||
    !Number.isInteger(itemId) ||
    itemId < 0
  ) {
    return null;
  }

  return {
    expression: `changeEquipment({ actor: actorRef({ id: ${actorId} }), equipmentTypeId: ${equipmentTypeId}, itemId: ${itemId === 0 ? "null" : itemId} })`,
    helperNames: ["actorRef", "changeEquipment"],
  };
}

export function renderActorStringCommand(
  command: RawEventCommand,
  helperName: "changeName" | "changeNickname" | "changeProfile",
  fieldName: "name" | "nickname" | "profile",
): Omit<RenderedCommand, "nextIndex"> | null {
  const actorId = readPositiveInteger(command.parameters[0]);
  const value = command.parameters[1];
  return actorId === null || typeof value !== "string"
    ? null
    : {
        expression: `${helperName}({ actor: actorRef({ id: ${actorId} }), ${fieldName}: ${literal(value)} })`,
        helperNames: ["actorRef", helperName],
      };
}

export function renderChangeClass(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const actorId = readPositiveInteger(command.parameters[0]);
  const classId = readPositiveInteger(command.parameters[1]);
  const keepExp = command.parameters[2];
  return actorId === null || classId === null || typeof keepExp !== "boolean"
    ? null
    : {
        expression: `changeClass({ actor: actorRef({ id: ${actorId} }), class: classRef({ id: ${classId} })${keepExp ? ", keepExp: true" : ""} })`,
        helperNames: ["actorRef", "changeClass", "classRef"],
      };
}

export function renderChangeActorImages(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const actorId = readPositiveInteger(command.parameters[0]);
  const characterName = command.parameters[1];
  const characterIndex = command.parameters[2];
  const faceName = command.parameters[3];
  const faceIndex = command.parameters[4];
  const battlerName = command.parameters[5];
  return actorId === null ||
    typeof characterName !== "string" ||
    typeof characterIndex !== "number" ||
    typeof faceName !== "string" ||
    typeof faceIndex !== "number" ||
    typeof battlerName !== "string"
    ? null
    : {
        expression: `changeActorImages({ actor: actorRef({ id: ${actorId} }), character: { image: imageAsset({ folder: "characters", name: ${literal(characterName)} }), index: ${characterIndex} }, face: { image: imageAsset({ folder: "faces", name: ${literal(faceName)} }), index: ${faceIndex} }, battler: imageAsset({ folder: "sv_actors", name: ${literal(battlerName)} }) })`,
        helperNames: ["actorRef", "changeActorImages", "imageAsset"],
      };
}

export function renderChangeVehicleImage(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const vehicle = vehicleFromCode(command.parameters[0]);
  const imageName = command.parameters[1];
  const index = command.parameters[2];
  return vehicle === null || typeof imageName !== "string" || typeof index !== "number"
    ? null
    : {
        expression: `changeVehicleImage({ vehicle: ${literal(vehicle)}, image: imageAsset({ folder: "characters", name: ${literal(imageName)} }), index: ${index} })`,
        helperNames: ["changeVehicleImage", "imageAsset"],
      };
}

export function renderActorCommandTarget(
  targetKind: unknown,
  targetValue: unknown,
): { expression: string; helperNames: readonly string[] } | null {
  if (targetKind === 0) {
    const actorId =
      typeof targetValue === "number" && Number.isInteger(targetValue) ? targetValue : null;
    if (actorId === 0) {
      return {
        expression: `{ kind: "runtimeSelector", scope: "actor", target: "entireParty" }`,
        helperNames: [],
      };
    }
    return actorId !== null && actorId > 0
      ? {
          expression: `{ kind: "runtimeSelector", scope: "actor", target: "actor", actorId: ${actorId} }`,
          helperNames: [],
        }
      : null;
  }

  if (targetKind === 1) {
    const variableId = readPositiveInteger(targetValue);
    return variableId === null
      ? null
      : {
          expression: `{ kind: "runtimeSelector", scope: "actor", target: "actorFromVariable", variable: variableRef({ id: ${variableId} }) }`,
          helperNames: ["variableRef"],
        };
  }

  return null;
}

export function actorParameterFromCode(value: unknown): string | null {
  switch (value) {
    case 0:
      return "mhp";
    case 1:
      return "mmp";
    case 2:
      return "atk";
    case 3:
      return "def";
    case 4:
      return "mat";
    case 5:
      return "mdf";
    case 6:
      return "agi";
    case 7:
      return "luk";
    default:
      return null;
  }
}
