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
  | "commonEvent"
  | "item"
  | "map"
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

export type DslCommand =
  | ShowTextDslCommand
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
  | ChangeGoldDslCommand
  | ChangeItemDslCommand
  | WaitDslCommand
  | EraseEventDslCommand
  | BattleProcessingDslCommand
  | ShowChoicesDslCommand
  | ShopProcessingDslCommand
  | RawDslCommand;

export type ShowTextDslCommand = {
  kind: "showText";
  lines: readonly [string, ...string[]];
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
  condition: PageConditions;
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
  target:
    | {
        map: ReferenceValue<"map">;
        x: number;
        y: number;
        direction?: 2 | 4 | 6 | 8;
        fadeType?: 0 | 1 | 2;
      }
    | {
        variableMap: ReferenceValue<"map">;
        variableX: ReferenceValue<"variable">;
        variableY: ReferenceValue<"variable">;
        direction?: 2 | 4 | 6 | 8;
        fadeType?: 0 | 1 | 2;
      };
};

export type ControlSwitchesDslCommand = {
  kind: "controlSwitches";
  switch: ReferenceValue<"switch">;
  value: boolean;
};

export type ControlVariablesDslCommand = {
  kind: "controlVariables";
  variable: ReferenceValue<"variable">;
  operation: "set" | "add" | "sub" | "mul" | "div" | "mod";
  value:
    | number
    | ReferenceValue<"variable">
    | {
        kind: "random";
        from: number;
        to: number;
      };
};

export type ControlSelfSwitchDslCommand = {
  kind: "controlSelfSwitch";
  selfSwitch: "A" | "B" | "C" | "D";
  value: boolean;
};

export type ChangeGoldDslCommand = {
  kind: "changeGold";
  operation: "gain" | "lose";
  value: number;
};

export type ChangeItemDslCommand = {
  kind: "changeItem";
  item: ReferenceValue<"item">;
  operation: "gain" | "lose";
  amount: number;
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

export function showText(lines: readonly [string, ...string[]]): ShowTextDslCommand {
  return { kind: "showText", lines };
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
  condition: PageConditions;
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
  map: ReferenceValue<"map">;
  x: number;
  y: number;
  direction?: 2 | 4 | 6 | 8;
  fadeType?: 0 | 1 | 2;
}): TransferPlayerDslCommand {
  return {
    kind: "transferPlayer",
    target: input,
  };
}

export function controlSwitches(input: {
  switch: ReferenceValue<"switch">;
  value: boolean;
}): ControlSwitchesDslCommand {
  return {
    kind: "controlSwitches",
    switch: input.switch,
    value: input.value,
  };
}

export function controlVariables(input: {
  variable: ReferenceValue<"variable">;
  operation: "set" | "add" | "sub" | "mul" | "div" | "mod";
  value:
    | number
    | ReferenceValue<"variable">
    | {
        kind: "random";
        from: number;
        to: number;
      };
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

export function changeGold(input: {
  operation: "gain" | "lose";
  value: number;
}): ChangeGoldDslCommand {
  return {
    kind: "changeGold",
    operation: input.operation,
    value: input.value,
  };
}

export function changeItem(input: {
  item: ReferenceValue<"item">;
  operation: "gain" | "lose";
  amount: number;
}): ChangeItemDslCommand {
  return {
    kind: "changeItem",
    item: input.item,
    operation: input.operation,
    amount: input.amount,
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

export function actorRef(value: { id: number } | { name: string }): ReferenceValue<"actor"> {
  return createReference("actor", value);
}

export function armorRef(value: { id: number } | { name: string }): ReferenceValue<"armor"> {
  return createReference("armor", value);
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
