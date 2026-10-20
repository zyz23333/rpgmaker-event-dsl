import type {
  ActorParameter,
  ActorResourceOperand,
  ActorResourceTarget,
  ChangeActorImagesDslCommand,
  ChangeClassDslCommand,
  ChangeEquipmentDslCommand,
  ChangeExpDslCommand,
  ChangeHpDslCommand,
  ChangeLevelDslCommand,
  ChangeMpDslCommand,
  ChangeNameDslCommand,
  ChangeNicknameDslCommand,
  ChangeParameterDslCommand,
  ChangeProfileDslCommand,
  ChangeSkillDslCommand,
  ChangeStateDslCommand,
  ChangeTpDslCommand,
  ChangeVehicleImageDslCommand,
  ImageAssetReference,
  RecoverAllDslCommand,
  ReferenceValue,
  VehicleTarget,
} from "../../domain/types.js";
import { assertActorResourceInput } from "./validation.js";

export function changeHp(input: {
  target: ActorResourceTarget;
  operation: "gain" | "lose";
  value: ActorResourceOperand;
  allowDeath: boolean;
}): ChangeHpDslCommand {
  assertActorResourceInput("changeHp", input, "changeHp");
  return {
    kind: "changeHp",
    target: input.target,
    operation: input.operation,
    value: input.value,
    allowDeath: input.allowDeath,
  };
}

export function changeMp(input: {
  target: ActorResourceTarget;
  operation: "gain" | "lose";
  value: ActorResourceOperand;
}): ChangeMpDslCommand {
  assertActorResourceInput("changeMp", input, "changeMp");
  return {
    kind: "changeMp",
    target: input.target,
    operation: input.operation,
    value: input.value,
  };
}

export function changeState(input: {
  target: ActorResourceTarget;
  operation: "add" | "remove";
  state: ReferenceValue<"state">;
}): ChangeStateDslCommand {
  assertActorResourceInput("changeState", input, "changeState");
  return {
    kind: "changeState",
    target: input.target,
    operation: input.operation,
    state: input.state,
  };
}

export function recoverAll(input: { target: ActorResourceTarget }): RecoverAllDslCommand {
  assertActorResourceInput("recoverAll", input, "recoverAll");
  return {
    kind: "recoverAll",
    target: input.target,
  };
}

export function changeExp(input: {
  target: ActorResourceTarget;
  operation: "gain" | "lose";
  value: ActorResourceOperand;
  showLevelUp: boolean;
}): ChangeExpDslCommand {
  assertActorResourceInput("changeExp", input, "changeExp");
  return {
    kind: "changeExp",
    target: input.target,
    operation: input.operation,
    value: input.value,
    showLevelUp: input.showLevelUp,
  };

}

export function changeLevel(input: {
  target: ActorResourceTarget;
  operation: "gain" | "lose";
  value: ActorResourceOperand;
  showLevelUp: boolean;
}): ChangeLevelDslCommand {
  assertActorResourceInput("changeLevel", input, "changeLevel");
  return {
    kind: "changeLevel",
    target: input.target,
    operation: input.operation,
    value: input.value,
    showLevelUp: input.showLevelUp,
  };

}

export function changeParameter(input: {
  target: ActorResourceTarget;
  parameter: ActorParameter;
  operation: "gain" | "lose";
  value: ActorResourceOperand;
}): ChangeParameterDslCommand {
  assertActorResourceInput("changeParameter", input, "changeParameter");
  return {
    kind: "changeParameter",
    target: input.target,
    parameter: input.parameter,
    operation: input.operation,
    value: input.value,
  };
}

export function changeSkill(input: {
  target: ActorResourceTarget;
  operation: "learn" | "forget";
  skill: ReferenceValue<"skill">;
}): ChangeSkillDslCommand {
  assertActorResourceInput("changeSkill", input, "changeSkill");
  return {
    kind: "changeSkill",
    target: input.target,
    operation: input.operation,
    skill: input.skill,
  };
}

export function changeEquipment(input: {
  actor: ReferenceValue<"actor">;
  slotIndex: number;
  equipment: ChangeEquipmentDslCommand["equipment"];
}): ChangeEquipmentDslCommand {
  assertActorResourceInput("changeEquipment", input, "changeEquipment");
  return {
    kind: "changeEquipment",
    actor: input.actor,
    slotIndex: input.slotIndex,
    equipment: input.equipment,
  };
}

export function changeName(input: {
  actor: ReferenceValue<"actor">;
  name: string;
}): ChangeNameDslCommand {
  return {
    kind: "changeName",
    actor: input.actor,
    name: input.name,
  };
}

export function changeClass(input: {
  actor: ReferenceValue<"actor">;
  class: ReferenceValue<"class">;
  keepExp: boolean;
}): ChangeClassDslCommand {
  assertActorResourceInput("changeClass", input, "changeClass");
  return {
    kind: "changeClass",
    actor: input.actor,
    class: input.class,
    keepExp: input.keepExp,
  };

}

export function changeActorImages(input: {
  actor: ReferenceValue<"actor">;
  character: { image: ImageAssetReference; index: number };
  face: { image: ImageAssetReference; index: number };
  battler: ImageAssetReference;
}): ChangeActorImagesDslCommand {
  return {
    kind: "changeActorImages",
    actor: input.actor,
    character: input.character,
    face: input.face,
    battler: input.battler,
  };
}

export function changeVehicleImage(input: {
  vehicle: VehicleTarget;
  image: ImageAssetReference;
  index: number;
}): ChangeVehicleImageDslCommand {
  return {
    kind: "changeVehicleImage",
    vehicle: input.vehicle,
    image: input.image,
    index: input.index,
  };
}

export function changeNickname(input: {
  actor: ReferenceValue<"actor">;
  nickname: string;
}): ChangeNicknameDslCommand {
  return {
    kind: "changeNickname",
    actor: input.actor,
    nickname: input.nickname,
  };
}

export function changeProfile(input: {
  actor: ReferenceValue<"actor">;
  profile: string;
}): ChangeProfileDslCommand {
  return {
    kind: "changeProfile",
    actor: input.actor,
    profile: input.profile,
  };
}

export function changeTp(input: {
  target: ActorResourceTarget;
  operation: "gain" | "lose";
  value: ActorResourceOperand;
}): ChangeTpDslCommand {
  assertActorResourceInput("changeTp", input, "changeTp");
  return {
    kind: "changeTp",
    target: input.target,
    operation: input.operation,
    value: input.value,
  };
}
