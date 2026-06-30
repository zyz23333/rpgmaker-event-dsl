export type DslOwnedDeclaration =
  | MapEventDefinition
  | CommonEventDefinition
  | SwitchDefinition
  | VariableDefinition;

export type EventDefinition = MapEventDefinition | CommonEventDefinition;

export type MapEventDefinition = {
  kind: "mapEvent";
  mapId: number;
  id: number;
  name: string;
  x: number;
  y: number;
  pages: readonly [EventPage, ...EventPage[]];
};

export type CommonEventDefinition = {
  kind: "commonEvent";
  id: number;
  name: string;
  trigger: CommonEventTrigger;
  switch?: ReferenceValue<"switch">;
  commands: readonly DslCommand[];
};

export type SwitchDefinition = {
  kind: "switchDefinition";
  id: number;
  name: string;
};

export type VariableDefinition = {
  kind: "variableDefinition";
  id: number;
  name: string;
};

export type CommonEventTrigger = "none" | "autorun" | "parallel";

export type MapPageTrigger = "action" | "playerTouch" | "eventTouch" | "autorun" | "parallel";

export type EventPage = {
  conditions: PageConditions;
  trigger: MapPageTrigger;
  commands: readonly DslCommand[];
};

export type PageConditions = {
  actor?: ReferenceValue<"actor">;
  item?: ReferenceValue<"item">;
  selfSwitch?: "A" | "B" | "C" | "D";
  switch1?: ReferenceValue<"switch">;
  switch2?: ReferenceValue<"switch">;
  variable?: {
    ref: ReferenceValue<"variable">;
    operator: "eq" | "ge" | "le" | "gt" | "lt";
    value: number | ReferenceValue<"variable">;
  };
};

export type ReferenceKind =
  | "actor"
  | "armor"
  | "class"
  | "commonEvent"
  | "item"
  | "map"
  | "skill"
  | "state"
  | "switch"
  | "troop"
  | "variable"
  | "weapon";

export type ReferenceValue<TKind extends ReferenceKind> =
  | {
      id: number;
      kind: TKind;
    }
  | {
      kind: TKind;
      name: string;
    };

export const referenceKinds = [
  "actor",
  "armor",
  "class",
  "commonEvent",
  "item",
  "map",
  "skill",
  "state",
  "switch",
  "troop",
  "variable",
  "weapon",
] as const satisfies readonly ReferenceKind[];

export const audioAssetFolders = ["bgm", "bgs", "me", "se"] as const;

export const imageAssetFolders = [
  "animations",
  "battlebacks1",
  "battlebacks2",
  "characters",
  "enemies",
  "faces",
  "parallaxes",
  "pictures",
  "sv_actors",
  "sv_enemies",
  "system",
  "tilesets",
  "titles1",
  "titles2",
] as const;

export type AudioAssetFolder = (typeof audioAssetFolders)[number];

export type ImageAssetFolder = (typeof imageAssetFolders)[number];

export type AudioAssetReference = {
  kind: "asset";
  category: "audio";
  folder: AudioAssetFolder;
  name: string;
};

export type ImageAssetReference = {
  kind: "asset";
  category: "image";
  folder: ImageAssetFolder;
  name: string;
};

export type MovieAssetReference = {
  kind: "asset";
  category: "movie";
  folder: "movies";
  name: string;
};

export type AssetReference = AudioAssetReference | ImageAssetReference | MovieAssetReference;

export type RuntimeSelector<TScope extends string = string, TTarget extends string = string> = {
  kind: "runtimeSelector";
  scope: TScope;
  target: TTarget;
};

export type ScriptInput = {
  kind: "scriptInput";
  code: string;
};

export type ReferenceRange<TKind extends ReferenceKind> = {
  kind: "referenceRange";
  from: ReferenceValue<TKind>;
  to: ReferenceValue<TKind>;
};

export type NumericRange = {
  kind: "numericRange";
  from: number;
  to: number;
};

export type ConstantOperand = {
  kind: "constant";
  value: number;
};

export type VariableOperand = {
  kind: "variable";
  variable: ReferenceValue<"variable">;
};

export type RandomOperand = {
  kind: "random";
  from: number;
  to: number;
};

export type ScriptOperand = {
  kind: "script";
  script: ScriptInput;
};

export type ControlVariablesGameDataOperand =
  | {
      kind: "gameData";
      source: "item";
      item: ReferenceValue<"item">;
    }
  | {
      kind: "gameData";
      source: "weapon";
      weapon: ReferenceValue<"weapon">;
    }
  | {
      kind: "gameData";
      source: "armor";
      armor: ReferenceValue<"armor">;
    }
  | {
      kind: "gameData";
      source: "actor";
      actor: ReferenceValue<"actor">;
      value:
        | "level"
        | "exp"
        | "hp"
        | "mp"
        | "mhp"
        | "mmp"
        | "atk"
        | "def"
        | "mat"
        | "mdf"
        | "agi"
        | "luk";
    }
  | {
      kind: "gameData";
      source: "enemy";
      enemyIndex: number;
      value: "hp" | "mp" | "mhp" | "mmp" | "atk" | "def" | "mat" | "mdf" | "agi" | "luk";
    }
  | {
      kind: "gameData";
      source: "character";
      characterId: number;
      value: "mapX" | "mapY" | "direction" | "screenX" | "screenY";
    }
  | {
      kind: "gameData";
      source: "party";
      memberIndex: number;
    }
  | {
      kind: "gameData";
      source: "other";
      value:
        | "mapId"
        | "partyMembers"
        | "gold"
        | "steps"
        | "playTime"
        | "timer"
        | "saveCount"
        | "battleCount"
        | "winCount"
        | "escapeCount";
    };

export type CommandOperand =
  | ConstantOperand
  | VariableOperand
  | RandomOperand
  | ControlVariablesGameDataOperand
  | ScriptOperand;

export type OperateValueOperand = number | ReferenceValue<"variable">;

export type OperateValueInput = {
  operation: "increase" | "decrease";
  operand: OperateValueOperand;
};

export type DirectPosition = {
  kind: "direct";
  x: number;
  y: number;
};

export type VariablePosition = {
  kind: "variables";
  x: ReferenceValue<"variable">;
  y: ReferenceValue<"variable">;
};

export type CommandPosition = DirectPosition | VariablePosition;

export type VehicleTarget = "boat" | "ship" | "airship";

export type Direction = 2 | 4 | 6 | 8;

export type CharacterRuntimeSelector =
  | (RuntimeSelector<"character", "player"> & {
      id?: never;
    })
  | (RuntimeSelector<"character", "currentEvent"> & {
      id?: never;
    })
  | (RuntimeSelector<"character", "event"> & {
      id: number;
    });

export type DirectMapDestination = {
  kind: "direct";
  map: ReferenceValue<"map">;
  x: number;
  y: number;
};

export type VariableMapDestination = {
  kind: "variables";
  map: ReferenceValue<"variable">;
  x: ReferenceValue<"variable">;
  y: ReferenceValue<"variable">;
};

export type MapDestination = DirectMapDestination | VariableMapDestination;

export type DirectEventLocationDestination = {
  kind: "direct";
  x: number;
  y: number;
};

export type VariableEventLocationDestination = {
  kind: "variables";
  x: ReferenceValue<"variable">;
  y: ReferenceValue<"variable">;
};

export type ExchangeEventLocationDestination = {
  kind: "exchange";
  character: CharacterRuntimeSelector;
};

export type EventLocationDestination =
  | DirectEventLocationDestination
  | VariableEventLocationDestination
  | ExchangeEventLocationDestination;

export type ToneInput =
  | readonly [red: number, green: number, blue: number, gray: number]
  | {
      red: number;
      green: number;
      blue: number;
      gray: number;
    };

export type ColorInput =
  | readonly [red: number, green: number, blue: number, alpha: number]
  | {
      red: number;
      green: number;
      blue: number;
      alpha: number;
    };

export type AudioPayload = {
  asset: AudioAssetReference;
  volume?: number;
  pitch?: number;
  pan?: number;
};

export type ConditionalVariableOperator = "eq" | "ge" | "le" | "gt" | "lt" | "ne";

export type ConditionalBranchCondition =
  | {
      kind: "switch";
      switch: ReferenceValue<"switch">;
      value: boolean;
    }
  | {
      kind: "variable";
      variable: ReferenceValue<"variable">;
      operator: ConditionalVariableOperator;
      value: number | ReferenceValue<"variable">;
    }
  | {
      kind: "selfSwitch";
      selfSwitch: "A" | "B" | "C" | "D";
      value: boolean;
    }
  | {
      kind: "timer";
      seconds: number;
      operator: "ge" | "le";
    }
  | {
      kind: "actor";
      actor: ReferenceValue<"actor">;
      check:
        | { kind: "inParty" }
        | { kind: "name"; name: string }
        | { kind: "class"; class: ReferenceValue<"class"> }
        | { kind: "skill"; skill: ReferenceValue<"skill"> }
        | { kind: "weapon"; weapon: ReferenceValue<"weapon"> }
        | { kind: "armor"; armor: ReferenceValue<"armor"> }
        | { kind: "state"; state: ReferenceValue<"state"> };
    }
  | {
      kind: "enemy";
      enemyIndex: number;
      check: { kind: "appeared" } | { kind: "state"; state: ReferenceValue<"state"> };
    }
  | {
      kind: "character";
      characterId: number;
      direction: 2 | 4 | 6 | 8;
    }
  | {
      kind: "gold";
      amount: number;
      operator: "ge" | "le" | "lt";
    }
  | {
      kind: "item";
      item: ReferenceValue<"item">;
    }
  | {
      kind: "weapon";
      weapon: ReferenceValue<"weapon">;
      includeEquipment?: boolean;
    }
  | {
      kind: "armor";
      armor: ReferenceValue<"armor">;
      includeEquipment?: boolean;
    }
  | {
      kind: "button";
      button: "ok" | "cancel" | "shift" | "down" | "left" | "right" | "up" | "pageup" | "pagedown";
    }
  | {
      kind: "script";
      script: ScriptInput;
    }
  | {
      kind: "vehicle";
      vehicle: "boat" | "ship" | "airship";
    };

export type DslCommand =
  | ShowTextDslCommand
  | InputNumberDslCommand
  | SelectItemDslCommand
  | ShowScrollingTextDslCommand
  | ConditionalDslCommand
  | LoopDslCommand
  | BreakLoopDslCommand
  | ExitEventDslCommand
  | CommonEventDslCommand
  | LabelDslCommand
  | JumpToLabelDslCommand
  | CommentDslCommand
  | ScriptDslCommand
  | PluginDslCommand
  | TransferPlayerDslCommand
  | ControlSwitchesDslCommand
  | ControlVariablesDslCommand
  | ControlSelfSwitchDslCommand
  | ControlTimerDslCommand
  | ChangeGoldDslCommand
  | ChangeItemsDslCommand
  | ChangeWeaponsDslCommand
  | ChangeArmorsDslCommand
  | ChangePartyMemberDslCommand
  | SetVehicleLocationDslCommand
  | SetEventLocationDslCommand
  | ScrollMapDslCommand
  | GetOnOffVehicleDslCommand
  | WaitDslCommand
  | EraseEventDslCommand
  | BattleProcessingDslCommand
  | ShowChoicesDslCommand
  | ShopProcessingDslCommand
  | RawDslCommand;

export type ShowTextDslCommand = {
  kind: "showText";
  lines: readonly [string, ...string[]];
  face?: {
    image: ImageAssetReference;
    index?: number;
  };
  background?: 0 | 1 | 2;
  positionType?: 0 | 1 | 2;
};

export type InputNumberDslCommand = {
  kind: "inputNumber";
  variable: ReferenceValue<"variable">;
  digits: number;
};

export type SelectItemDslCommand = {
  kind: "selectItem";
  variable: ReferenceValue<"variable">;
  itemType?: 1 | 2 | 3 | 4;
};

export type ShowScrollingTextDslCommand = {
  kind: "showScrollingText";
  lines: readonly [string, ...string[]];
  speed?: number;
  noFastForward?: boolean;
};

export type ShowChoicesDslCommand = {
  kind: "showChoices";
  choices: readonly [string, ...string[]];
  branches: readonly [readonly DslCommand[], ...(readonly DslCommand[][])];
  cancelType?: number;
  defaultType?: number;
  positionType?: 0 | 1 | 2;
  background?: 0 | 1 | 2;
  cancelBranch?: readonly DslCommand[];
};

export type ConditionalDslCommand = {
  kind: "conditional";
  condition: ConditionalBranchCondition;
  then: readonly DslCommand[];
  else?: readonly DslCommand[];
};

export type LoopDslCommand = {
  kind: "loop";
  body: readonly DslCommand[];
};

export type BreakLoopDslCommand = {
  kind: "breakLoop";
};

export type ExitEventDslCommand = {
  kind: "exitEvent";
};

export type CommonEventDslCommand = {
  kind: "commonEvent";
  ref: ReferenceValue<"commonEvent">;
};

export type LabelDslCommand = {
  kind: "label";
  name: string;
};

export type JumpToLabelDslCommand = {
  kind: "jumpToLabel";
  name: string;
};

export type CommentDslCommand = {
  kind: "comment";
  lines: readonly [string, ...string[]];
};

export type ScriptDslCommand = {
  kind: "script";
  code: readonly [string, ...string[]];
};

export type PluginDslCommand = {
  kind: "pluginCommand";
  command: string;
  args?: readonly string[];
};

export type TransferPlayerDslCommand = {
  kind: "transferPlayer";
  destination: MapDestination;
  direction?: Direction;
  fadeType?: 0 | 1 | 2;
};

export type ControlSwitchesDslCommand = {
  kind: "controlSwitches";
  switch: ReferenceValue<"switch"> | ReferenceRange<"switch">;
  value: boolean;
};

export type ControlVariablesDslCommand = {
  kind: "controlVariables";
  variable: ReferenceValue<"variable"> | ReferenceRange<"variable">;
  operation: "set" | "add" | "sub" | "mul" | "div" | "mod";
  value:
    | number
    | ReferenceValue<"variable">
    | RandomOperand
    | ControlVariablesGameDataOperand
    | ScriptOperand;
};

export type ControlSelfSwitchDslCommand = {
  kind: "controlSelfSwitch";
  selfSwitch: "A" | "B" | "C" | "D";
  value: boolean;
};

export type ControlTimerDslCommand =
  | {
      kind: "controlTimer";
      action: "start";
      seconds: number;
    }
  | {
      kind: "controlTimer";
      action: "stop";
    };

export type ChangeGoldDslCommand = {
  kind: "changeGold";
  operation: "gain" | "lose";
  value: OperateValueOperand;
};

export type ChangeItemsDslCommand = {
  kind: "changeItems";
  item: ReferenceValue<"item">;
  operation: "gain" | "lose";
  amount: OperateValueOperand;
};

export type ChangeWeaponsDslCommand = {
  kind: "changeWeapons";
  weapon: ReferenceValue<"weapon">;
  operation: "gain" | "lose";
  amount: OperateValueOperand;
  includeEquipment?: boolean;
};

export type ChangeArmorsDslCommand = {
  kind: "changeArmors";
  armor: ReferenceValue<"armor">;
  operation: "gain" | "lose";
  amount: OperateValueOperand;
  includeEquipment?: boolean;
};

export type ChangePartyMemberDslCommand = {
  kind: "changePartyMember";
  actor: ReferenceValue<"actor">;
  operation: "add" | "remove";
  initialize?: boolean;
};

export type SetVehicleLocationDslCommand = {
  kind: "setVehicleLocation";
  vehicle: VehicleTarget;
  destination: MapDestination;
};

export type SetEventLocationDslCommand = {
  kind: "setEventLocation";
  character: CharacterRuntimeSelector;
  destination: EventLocationDestination;
  direction?: 0 | Direction;
};

export type ScrollMapDslCommand = {
  kind: "scrollMap";
  direction: Direction;
  distance: number;
  speed: number;
};

export type GetOnOffVehicleDslCommand = {
  kind: "getOnOffVehicle";
};

export type WaitDslCommand = {
  kind: "wait";
  frames: number;
};

export type EraseEventDslCommand = {
  kind: "eraseEvent";
};

export type BattleProcessingDslCommand = {
  kind: "battleProcessing";
  troop:
    | ReferenceValue<"troop">
    | {
        kind: "troop";
        useRandomEncounter: true;
      };
  canEscape?: boolean;
  canLose?: boolean;
};

export type ShopProcessingDslCommand = {
  kind: "shopProcessing";
  goods: readonly [number, number, number, number, number?];
  allowSelling?: boolean;
};

export type RawDslCommand = {
  kind: "rawDslCommand";
  code: number;
  indent?: number;
  parameters: readonly unknown[];
};

export function mapEvent(input: {
  mapId: number;
  id: number;
  name: string;
  x: number;
  y: number;
  pages: readonly [EventPage, ...EventPage[]];
}): MapEventDefinition {
  return {
    kind: "mapEvent",
    mapId: input.mapId,
    id: input.id,
    name: input.name,
    x: input.x,
    y: input.y,
    pages: input.pages,
  };
}

export function commonEvent(input: {
  id: number;
  name: string;
  trigger: CommonEventTrigger;
  switch?: ReferenceValue<"switch">;
  commands: readonly DslCommand[];
}): CommonEventDefinition {
  const definition: CommonEventDefinition = {
    kind: "commonEvent",
    id: input.id,
    name: input.name,
    trigger: input.trigger,
    commands: input.commands,
  };

  if (input.switch !== undefined) {
    definition.switch = input.switch;
  }

  return definition;
}

export function switchDefinition(input: { id: number; name: string }): SwitchDefinition {
  return {
    kind: "switchDefinition",
    id: input.id,
    name: input.name,
  };
}

export function variableDefinition(input: { id: number; name: string }): VariableDefinition {
  return {
    kind: "variableDefinition",
    id: input.id,
    name: input.name,
  };
}

export function page(input: {
  conditions?: PageConditions;
  trigger?: MapPageTrigger;
  commands: readonly DslCommand[];
}): EventPage {
  return {
    conditions: input.conditions ?? {},
    trigger: input.trigger ?? "action",
    commands: input.commands,
  };
}

export function showText(input: {
  lines: readonly [string, ...string[]];
  face?: {
    image: ImageAssetReference;
    index?: number;
  };
  background?: 0 | 1 | 2;
  positionType?: 0 | 1 | 2;
}): ShowTextDslCommand {
  const node: ShowTextDslCommand = {
    kind: "showText",
    lines: input.lines,
  };

  if (input.face !== undefined) {
    node.face = input.face;
  }
  if (input.background !== undefined) {
    node.background = input.background;
  }
  if (input.positionType !== undefined) {
    node.positionType = input.positionType;
  }

  return node;
}

export function inputNumber(input: {
  variable: ReferenceValue<"variable">;
  digits: number;
}): InputNumberDslCommand {
  return {
    kind: "inputNumber",
    variable: input.variable,
    digits: input.digits,
  };
}

export function selectItem(input: {
  variable: ReferenceValue<"variable">;
  itemType?: 1 | 2 | 3 | 4;
}): SelectItemDslCommand {
  const node: SelectItemDslCommand = {
    kind: "selectItem",
    variable: input.variable,
  };

  if (input.itemType !== undefined) {
    node.itemType = input.itemType;
  }

  return node;
}

export function showScrollingText(input: {
  lines: readonly [string, ...string[]];
  speed?: number;
  noFastForward?: boolean;
}): ShowScrollingTextDslCommand {
  const node: ShowScrollingTextDslCommand = {
    kind: "showScrollingText",
    lines: input.lines,
  };

  if (input.speed !== undefined) {
    node.speed = input.speed;
  }
  if (input.noFastForward !== undefined) {
    node.noFastForward = input.noFastForward;
  }

  return node;
}

export function showChoices(input: {
  choices: readonly [string, ...string[]];
  branches: readonly [readonly DslCommand[], ...(readonly DslCommand[][])];
  cancelType?: number;
  defaultType?: number;
  positionType?: 0 | 1 | 2;
  background?: 0 | 1 | 2;
  cancelBranch?: readonly DslCommand[];
}): ShowChoicesDslCommand {
  const node: ShowChoicesDslCommand = {
    kind: "showChoices",
    choices: input.choices,
    branches: input.branches,
  };

  if (input.cancelType !== undefined) {
    node.cancelType = input.cancelType;
  }
  if (input.defaultType !== undefined) {
    node.defaultType = input.defaultType;
  }
  if (input.positionType !== undefined) {
    node.positionType = input.positionType;
  }
  if (input.background !== undefined) {
    node.background = input.background;
  }
  if (input.cancelBranch !== undefined) {
    node.cancelBranch = input.cancelBranch;
  }

  return node;
}

export function conditional(input: {
  condition: ConditionalBranchCondition;
  then: readonly DslCommand[];
  else?: readonly DslCommand[];
}): ConditionalDslCommand {
  const node: ConditionalDslCommand = {
    kind: "conditional",
    condition: input.condition,
    then: input.then,
  };

  if (input.else !== undefined) {
    node.else = input.else;
  }

  return node;
}

export function loop(body: readonly DslCommand[]): LoopDslCommand {
  return { kind: "loop", body };
}

export function breakLoop(): BreakLoopDslCommand {
  return { kind: "breakLoop" };
}

export function exitEvent(): ExitEventDslCommand {
  return { kind: "exitEvent" };
}

export function callCommonEvent(ref: ReferenceValue<"commonEvent">): CommonEventDslCommand {
  return { kind: "commonEvent", ref };
}

export function label(name: string): LabelDslCommand {
  return { kind: "label", name };
}

export function jumpToLabel(name: string): JumpToLabelDslCommand {
  return { kind: "jumpToLabel", name };
}

export function comment(lines: readonly [string, ...string[]]): CommentDslCommand {
  return { kind: "comment", lines };
}

export function script(code: readonly [string, ...string[]]): ScriptDslCommand {
  return { kind: "script", code };
}

export function pluginCommand(input: {
  command: string;
  args?: readonly string[];
}): PluginDslCommand {
  const node: PluginDslCommand = {
    kind: "pluginCommand",
    command: input.command,
  };

  if (input.args !== undefined) {
    node.args = input.args;
  }

  return node;
}

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

export function controlVariables(input: {
  variable: ReferenceValue<"variable"> | ReferenceRange<"variable">;
  operation: "set" | "add" | "sub" | "mul" | "div" | "mod";
  value:
    | number
    | ReferenceValue<"variable">
    | RandomOperand
    | ControlVariablesGameDataOperand
    | ScriptOperand;
}): ControlVariablesDslCommand {
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
  input: { action: "start"; seconds: number } | { action: "stop" },
): ControlTimerDslCommand {
  return input.action === "start"
    ? {
        kind: "controlTimer",
        action: input.action,
        seconds: input.seconds,
      }
    : {
        kind: "controlTimer",
        action: input.action,
      };
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

export function setVehicleLocation(input: {
  vehicle: VehicleTarget;
  destination: MapDestination;
}): SetVehicleLocationDslCommand {
  return {
    kind: "setVehicleLocation",
    vehicle: input.vehicle,
    destination: input.destination,
  };
}

export function setEventLocation(input: {
  character: CharacterRuntimeSelector;
  destination: EventLocationDestination;
  direction?: 0 | Direction;
}): SetEventLocationDslCommand {
  const node: SetEventLocationDslCommand = {
    kind: "setEventLocation",
    character: input.character,
    destination: input.destination,
  };

  if (input.direction !== undefined) {
    node.direction = input.direction;
  }

  return node;
}

export function scrollMap(input: {
  direction: Direction;
  distance: number;
  speed: number;
}): ScrollMapDslCommand {
  return {
    kind: "scrollMap",
    direction: input.direction,
    distance: input.distance,
    speed: input.speed,
  };
}

export function getOnOffVehicle(): GetOnOffVehicleDslCommand {
  return {
    kind: "getOnOffVehicle",
  };
}

export function wait(frames: number): WaitDslCommand {
  return { kind: "wait", frames };
}

export function eraseEvent(): EraseEventDslCommand {
  return { kind: "eraseEvent" };
}

export function battleProcessing(input: {
  troop:
    | ReferenceValue<"troop">
    | {
        kind: "troop";
        useRandomEncounter: true;
      };
  canEscape?: boolean;
  canLose?: boolean;
}): BattleProcessingDslCommand {
  const node: BattleProcessingDslCommand = {
    kind: "battleProcessing",
    troop: input.troop,
  };

  if (input.canEscape !== undefined) {
    node.canEscape = input.canEscape;
  }
  if (input.canLose !== undefined) {
    node.canLose = input.canLose;
  }

  return node;
}

export function shopProcessing(input: {
  goods: readonly [number, number, number, number, number?];
  allowSelling?: boolean;
}): ShopProcessingDslCommand {
  const node: ShopProcessingDslCommand = {
    kind: "shopProcessing",
    goods: input.goods,
  };

  if (input.allowSelling !== undefined) {
    node.allowSelling = input.allowSelling;
  }

  return node;
}

export function rawDslCommand(input: {
  code: number;
  indent?: number;
  parameters: readonly unknown[];
}): RawDslCommand {
  const node: RawDslCommand = {
    kind: "rawDslCommand",
    code: input.code,
    parameters: input.parameters,
  };

  if (input.indent !== undefined) {
    node.indent = input.indent;
  }

  return node;
}

export function audioAsset(input: { folder: AudioAssetFolder; name: string }): AudioAssetReference {
  assertIncluded(audioAssetFolders, input.folder, "audio asset folder");
  assertNonEmptyString(input.name, "Audio asset name");

  return {
    kind: "asset",
    category: "audio",
    folder: input.folder,
    name: input.name,
  };
}

export function imageAsset(input: { folder: ImageAssetFolder; name: string }): ImageAssetReference {
  assertIncluded(imageAssetFolders, input.folder, "image asset folder");
  assertNonEmptyString(input.name, "Image asset name");

  return {
    kind: "asset",
    category: "image",
    folder: input.folder,
    name: input.name,
  };
}

export function movieAsset(input: { name: string }): MovieAssetReference {
  assertNonEmptyString(input.name, "Movie asset name");

  return {
    kind: "asset",
    category: "movie",
    folder: "movies",
    name: input.name,
  };
}

export function scriptInput(input: { code: string }): ScriptInput {
  assertNonEmptyString(input.code, "Script input code");

  return {
    kind: "scriptInput",
    code: input.code,
  };
}

export function actorRef(value: { id: number } | { name: string }): ReferenceValue<"actor"> {
  return createReference("actor", value);
}

export function armorRef(value: { id: number } | { name: string }): ReferenceValue<"armor"> {
  return createReference("armor", value);
}

export function classRef(value: { id: number } | { name: string }): ReferenceValue<"class"> {
  return createReference("class", value);
}

export function commonEventRef(
  value: { id: number } | { name: string },
): ReferenceValue<"commonEvent"> {
  return createReference("commonEvent", value);
}

export function itemRef(value: { id: number } | { name: string }): ReferenceValue<"item"> {
  return createReference("item", value);
}

export function mapRef(value: { id: number } | { name: string }): ReferenceValue<"map"> {
  return createReference("map", value);
}

export function skillRef(value: { id: number } | { name: string }): ReferenceValue<"skill"> {
  return createReference("skill", value);
}

export function stateRef(value: { id: number } | { name: string }): ReferenceValue<"state"> {
  return createReference("state", value);
}

export function switchRef(value: { id: number } | { name: string }): ReferenceValue<"switch"> {
  return createReference("switch", value);
}

export function troopRef(value: { id: number } | { name: string }): ReferenceValue<"troop"> {
  return createReference("troop", value);
}

export function variableRef(value: { id: number } | { name: string }): ReferenceValue<"variable"> {
  return createReference("variable", value);
}

export function weaponRef(value: { id: number } | { name: string }): ReferenceValue<"weapon"> {
  return createReference("weapon", value);
}

export function isProjectDataReference(value: unknown): value is ReferenceValue<ReferenceKind> {
  if (!value || typeof value !== "object" || !("kind" in value)) {
    return false;
  }

  const candidate = value as { kind?: unknown; id?: unknown; name?: unknown };
  return (
    typeof candidate.kind === "string" &&
    isReferenceKind(candidate.kind) &&
    ((typeof candidate.id === "number" && !("name" in candidate)) ||
      (typeof candidate.name === "string" && !("id" in candidate)))
  );
}

export function isAssetReference(value: unknown): value is AssetReference {
  if (!value || typeof value !== "object" || !("kind" in value)) {
    return false;
  }

  const candidate = value as {
    kind?: unknown;
    category?: unknown;
    folder?: unknown;
    name?: unknown;
  };

  if (candidate.kind !== "asset" || typeof candidate.name !== "string") {
    return false;
  }

  if (candidate.category === "audio") {
    return isIncluded(audioAssetFolders, candidate.folder);
  }
  if (candidate.category === "image") {
    return isIncluded(imageAssetFolders, candidate.folder);
  }
  if (candidate.category === "movie") {
    return candidate.folder === "movies";
  }

  return false;
}

export function isRuntimeSelector(value: unknown): value is RuntimeSelector {
  if (!value || typeof value !== "object" || !("kind" in value)) {
    return false;
  }

  const candidate = value as { kind?: unknown; scope?: unknown; target?: unknown };
  return (
    candidate.kind === "runtimeSelector" &&
    typeof candidate.scope === "string" &&
    candidate.scope.length > 0 &&
    typeof candidate.target === "string" &&
    candidate.target.length > 0
  );
}

export function isScriptInput(value: unknown): value is ScriptInput {
  if (!value || typeof value !== "object" || !("kind" in value)) {
    return false;
  }

  const candidate = value as { kind?: unknown; code?: unknown };
  return (
    candidate.kind === "scriptInput" &&
    typeof candidate.code === "string" &&
    candidate.code.length > 0
  );
}

export function collectDslOwnedDeclarations(
  moduleExports: Record<string, unknown>,
): DslOwnedDeclaration[] {
  const definitions: DslOwnedDeclaration[] = [];

  for (const [name, value] of Object.entries(moduleExports)) {
    if (name === "default") {
      throw new Error("Default export is not allowed for DSL-owned declarations.");
    }
    if (isDslOwnedDeclaration(value)) {
      definitions.push(value);
    }
  }

  return definitions;
}

function createReference<TKind extends ReferenceKind>(
  kind: TKind,
  value: { id: number } | { name: string },
): ReferenceValue<TKind> {
  if ("id" in value) {
    return { id: value.id, kind };
  }

  return { kind, name: value.name };
}

function isReferenceKind(value: string): value is ReferenceKind {
  return (referenceKinds as readonly string[]).includes(value);
}

function assertIncluded<TValue extends string>(
  allowedValues: readonly TValue[],
  value: TValue,
  fieldName: string,
): void {
  if (!isIncluded(allowedValues, value)) {
    throw new Error(`Invalid ${fieldName}: ${String(value)}.`);
  }
}

function isIncluded<TValue extends string>(
  allowedValues: readonly TValue[],
  value: unknown,
): value is TValue {
  return typeof value === "string" && (allowedValues as readonly string[]).includes(value);
}

function assertNonEmptyString(value: string, fieldName: string): void {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${fieldName} must be a non-empty string.`);
  }
}

function isDslOwnedDeclaration(value: unknown): value is DslOwnedDeclaration {
  return (
    !!value &&
    typeof value === "object" &&
    "kind" in value &&
    ((value as { kind?: string }).kind === "mapEvent" ||
      (value as { kind?: string }).kind === "commonEvent" ||
      (value as { kind?: string }).kind === "switchDefinition" ||
      (value as { kind?: string }).kind === "variableDefinition")
  );
}
