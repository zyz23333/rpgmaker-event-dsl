import type {
  ActorCommandTarget,
  ActorParameter,
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
  OperateValueOperand,
  RecoverAllDslCommand,
  ReferenceValue,
  VehicleTarget,
} from "../../domain/types.js";

export function changeHp(input: {
  target: ActorCommandTarget;
  operation: "gain" | "lose";
  value: OperateValueOperand;
  allowDeath?: boolean;
}): ChangeHpDslCommand {
  const node: ChangeHpDslCommand = {
    kind: "changeHp",
    target: input.target,
    operation: input.operation,
    value: input.value,
  };

  if (input.allowDeath !== undefined) {
    node.allowDeath = input.allowDeath;
  }

  return node;
}

export function changeMp(input: {
  target: ActorCommandTarget;
  operation: "gain" | "lose";
  value: OperateValueOperand;
}): ChangeMpDslCommand {
  return {
    kind: "changeMp",
    target: input.target,
    operation: input.operation,
    value: input.value,
  };
}

export function changeState(input: {
  target: ActorCommandTarget;
  operation: "add" | "remove";
  state: ReferenceValue<"state">;
}): ChangeStateDslCommand {
  return {
    kind: "changeState",
    target: input.target,
    operation: input.operation,
    state: input.state,
  };
}

export function recoverAll(input: { target: ActorCommandTarget }): RecoverAllDslCommand {
  return {
    kind: "recoverAll",
    target: input.target,
  };
}

export function changeExp(input: {
  target: ActorCommandTarget;
  operation: "gain" | "lose";
  value: OperateValueOperand;
  showLevelUp?: boolean;
}): ChangeExpDslCommand {
  const node: ChangeExpDslCommand = {
    kind: "changeExp",
    target: input.target,
    operation: input.operation,
    value: input.value,
  };

  if (input.showLevelUp !== undefined) {
    node.showLevelUp = input.showLevelUp;
  }

  return node;
}

export function changeLevel(input: {
  target: ActorCommandTarget;
  operation: "gain" | "lose";
  value: OperateValueOperand;
  showLevelUp?: boolean;
}): ChangeLevelDslCommand {
  const node: ChangeLevelDslCommand = {
    kind: "changeLevel",
    target: input.target,
    operation: input.operation,
    value: input.value,
  };

  if (input.showLevelUp !== undefined) {
    node.showLevelUp = input.showLevelUp;
  }

  return node;
}

export function changeParameter(input: {
  target: ActorCommandTarget;
  parameter: ActorParameter;
  operation: "gain" | "lose";
  value: OperateValueOperand;
}): ChangeParameterDslCommand {
  return {
    kind: "changeParameter",
    target: input.target,
    parameter: input.parameter,
    operation: input.operation,
    value: input.value,
  };
}

export function changeSkill(input: {
  target: ActorCommandTarget;
  operation: "learn" | "forget";
  skill: ReferenceValue<"skill">;
}): ChangeSkillDslCommand {
  return {
    kind: "changeSkill",
    target: input.target,
    operation: input.operation,
    skill: input.skill,
  };
}

export function changeEquipment(input: {
  actor: ReferenceValue<"actor">;
  equipmentTypeId: number;
  itemId: number | null;
}): ChangeEquipmentDslCommand {
  return {
    kind: "changeEquipment",
    actor: input.actor,
    equipmentTypeId: input.equipmentTypeId,
    itemId: input.itemId,
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
  keepExp?: boolean;
}): ChangeClassDslCommand {
  const node: ChangeClassDslCommand = {
    kind: "changeClass",
    actor: input.actor,
    class: input.class,
  };

  if (input.keepExp !== undefined) {
    node.keepExp = input.keepExp;
  }

  return node;
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
  target: ActorCommandTarget;
  operation: "gain" | "lose";
  value: OperateValueOperand;
}): ChangeTpDslCommand {
  return {
    kind: "changeTp",
    target: input.target,
    operation: input.operation,
    value: input.value,
  };
}
