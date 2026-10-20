import type {
  ChangeArmorsDslCommand,
  ChangeGoldDslCommand,
  ChangeItemsDslCommand,
  ChangePartyMemberDslCommand,
  ChangeWeaponsDslCommand,
  ControlSelfSwitchDslCommand,
  ControlSwitchesDslCommand,
  ControlTimerDslCommand,
  ControlVariablesDslCommand,
  LocationDirection,
  TransferFade,
  MapDestination,
  OperateValueOperand,
  ReferenceRange,
  ReferenceValue,
  TransferPlayerDslCommand,
} from "../../domain/types.js";
import { assertControlTimerInput } from "./validation.js";
import { assertControlVariablesInput } from "./control-variables.js";
import { assertMapLocationInput } from "../map/location-validation.js";

export function transferPlayer(input: {
  destination: MapDestination;
  direction?: LocationDirection;
  fade?: TransferFade;
}): TransferPlayerDslCommand {
  assertMapLocationInput("transferPlayer", input, "transferPlayer", false);
  const node: TransferPlayerDslCommand = {
    kind: "transferPlayer",
    destination: input.destination,
  };

  if (input.direction !== undefined) {
    node.direction = input.direction;
  }
  if (input.fade !== undefined) {
    node.fade = input.fade;
  }

  return node;
}

export function controlSwitches(input: {
  switch: ReferenceValue<"switch"> | ReferenceRange<"switch">;
  value: boolean;
}): ControlSwitchesDslCommand {
  return {
    kind: "controlSwitches",
    switch: input.switch,
    value: input.value,
  };
}

export function controlVariables(
  input: Omit<ControlVariablesDslCommand, "kind">,
): ControlVariablesDslCommand {
  assertControlVariablesInput(input);
  return {
    kind: "controlVariables",
    variable: input.variable,
    operation: input.operation,
    value: input.value,
  };
}

export function controlSelfSwitch(input: {
  selfSwitch: "A" | "B" | "C" | "D";
  value: boolean;
}): ControlSelfSwitchDslCommand {
  return {
    kind: "controlSelfSwitch",
    selfSwitch: input.selfSwitch,
    value: input.value,
  };
}

export function controlTimer(
  input: { action: "start"; seconds: number } | { action: "stop"; seconds?: number },
): ControlTimerDslCommand {
  assertControlTimerInput(input, "controlTimer", false);
  if (input.action === "start")
    return { kind: "controlTimer", action: "start", seconds: input.seconds };
  return input.seconds === undefined
    ? { kind: "controlTimer", action: "stop" }
    : { kind: "controlTimer", action: "stop", seconds: input.seconds };
}

export function changeGold(input: {
  operation: "gain" | "lose";
  value: OperateValueOperand;
}): ChangeGoldDslCommand {
  return {
    kind: "changeGold",
    operation: input.operation,
    value: input.value,
  };
}

export function changeItems(input: {
  item: ReferenceValue<"item">;
  operation: "gain" | "lose";
  amount: OperateValueOperand;
}): ChangeItemsDslCommand {
  return {
    kind: "changeItems",
    item: input.item,
    operation: input.operation,
    amount: input.amount,
  };
}

export function changeWeapons(input: {
  weapon: ReferenceValue<"weapon">;
  operation: "gain" | "lose";
  amount: OperateValueOperand;
  includeEquipment?: boolean;
}): ChangeWeaponsDslCommand {
  const node: ChangeWeaponsDslCommand = {
    kind: "changeWeapons",
    weapon: input.weapon,
    operation: input.operation,
    amount: input.amount,
  };

  if (input.includeEquipment !== undefined) {
    node.includeEquipment = input.includeEquipment;
  }

  return node;
}

export function changeArmors(input: {
  armor: ReferenceValue<"armor">;
  operation: "gain" | "lose";
  amount: OperateValueOperand;
  includeEquipment?: boolean;
}): ChangeArmorsDslCommand {
  const node: ChangeArmorsDslCommand = {
    kind: "changeArmors",
    armor: input.armor,
    operation: input.operation,
    amount: input.amount,
  };

  if (input.includeEquipment !== undefined) {
    node.includeEquipment = input.includeEquipment;
  }

  return node;
}

export function changePartyMember(input: {
  actor: ReferenceValue<"actor">;
  operation: "add" | "remove";
  initialize?: boolean;
}): ChangePartyMemberDslCommand {
  const node: ChangePartyMemberDslCommand = {
    kind: "changePartyMember",
    actor: input.actor,
    operation: input.operation,
  };

  if (input.initialize !== undefined) {
    node.initialize = input.initialize;
  }

  return node;
}
