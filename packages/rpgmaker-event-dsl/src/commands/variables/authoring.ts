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
  Direction,
  MapDestination,
  ReferenceRange,
  ReferenceValue,
  TransferPlayerDslCommand,
} from "../../domain/types.js";
import { assertControlTimerInput } from "./validation.js";
import { assertInventoryInput } from "./inventory-validation.js";
import { assertControlVariablesInput } from "./control-variables.js";

export function transferPlayer(input: {
  destination: MapDestination;
  direction?: Direction;
  fadeType?: 0 | 1 | 2;
}): TransferPlayerDslCommand {
  const node: TransferPlayerDslCommand = {
    kind: "transferPlayer",
    destination: input.destination,
  };

  if (input.direction !== undefined) {
    node.direction = input.direction;
  }
  if (input.fadeType !== undefined) {
    node.fadeType = input.fadeType;
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
  value: ChangeGoldDslCommand["value"];
}): ChangeGoldDslCommand {
  assertInventoryInput("changeGold", input, "changeGold", false);
  return {
    kind: "changeGold",
    operation: input.operation,
    value: input.value,
  };
}

export function changeItems(input: {
  item: ReferenceValue<"item">;
  operation: "gain" | "lose";
  amount: ChangeItemsDslCommand["amount"];
}): ChangeItemsDslCommand {
  assertInventoryInput("changeItems", input, "changeItems", false);
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
  amount: ChangeWeaponsDslCommand["amount"];
  includeEquipment: boolean;
}): ChangeWeaponsDslCommand {
  assertInventoryInput("changeWeapons", input, "changeWeapons", false);
  const node: ChangeWeaponsDslCommand = {
    kind: "changeWeapons",
    weapon: input.weapon,
    operation: input.operation,
    amount: input.amount,
    includeEquipment: input.includeEquipment,
  };

  return node;
}

export function changeArmors(input: {
  armor: ReferenceValue<"armor">;
  operation: "gain" | "lose";
  amount: ChangeArmorsDslCommand["amount"];
  includeEquipment: boolean;
}): ChangeArmorsDslCommand {
  assertInventoryInput("changeArmors", input, "changeArmors", false);
  const node: ChangeArmorsDslCommand = {
    kind: "changeArmors",
    armor: input.armor,
    operation: input.operation,
    amount: input.amount,
    includeEquipment: input.includeEquipment,
  };

  return node;
}

export function changePartyMember(input: {
  actor: ReferenceValue<"actor">;
  operation: "add" | "remove";
  initialize: boolean;
}): ChangePartyMemberDslCommand {
  assertInventoryInput("changePartyMember", input, "changePartyMember", false);
  const node: ChangePartyMemberDslCommand = {
    kind: "changePartyMember",
    actor: input.actor,
    operation: input.operation,
    initialize: input.initialize,
  };

  return node;
}
