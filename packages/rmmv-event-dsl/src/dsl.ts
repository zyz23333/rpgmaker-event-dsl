export type EventDefinition = MapEventDefinition | CommonEventDefinition;

export type MapEventDefinition = {
  kind: "mapEvent";
  name: string;
  x: number;
  y: number;
  pages: readonly [EventPage, ...EventPage[]];
};

export type CommonEventDefinition = {
  kind: "commonEvent";
  name: string;
  trigger: CommonEventTrigger;
  switch?: ReferenceValue<"switch">;
  commands: readonly EventNode[];
};

export type CommonEventTrigger = "none" | "autorun" | "parallel";

export type MapPageTrigger = "action" | "playerTouch" | "eventTouch" | "autorun" | "parallel";

export type EventPage = {
  conditions: PageConditions;
  trigger: MapPageTrigger;
  commands: readonly EventNode[];
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

export type ProjectIndex = {
  actorsByName: Map<string, number>;
  armorsByName: Map<string, number>;
  commonEventsByName: Map<string, number>;
  itemsByName: Map<string, number>;
  mapsByName: Map<string, number>;
  troopsByName: Map<string, number>;
  switchesByName: Map<string, number>;
  variablesByName: Map<string, number>;
  weaponsByName: Map<string, number>;
};

export type EventNode =
  | ShowTextNode
  | ConditionalNode
  | LoopNode
  | BreakLoopNode
  | ExitEventNode
  | CommonEventNode
  | LabelNode
  | JumpToLabelNode
  | CommentNode
  | ScriptNode
  | PluginCommandNode
  | TransferPlayerNode
  | ControlSwitchNode
  | ControlVariableNode
  | ControlSelfSwitchNode
  | ChangeGoldNode
  | ChangeItemNode
  | WaitNode
  | EraseEventNode
  | BattleProcessingNode
  | ShowChoicesNode
  | ShopProcessingNode
  | RawCommandNode;

export type ShowTextNode = {
  kind: "showText";
  lines: readonly [string, ...string[]];
};

export type ShowChoicesNode = {
  kind: "showChoices";
  choices: readonly [string, ...string[]];
  branches: readonly [readonly EventNode[], ...readonly EventNode[][]];
  cancelType?: number;
  defaultType?: number;
  positionType?: 0 | 1 | 2;
  background?: 0 | 1 | 2;
  cancelBranch?: readonly EventNode[];
};

export type ConditionalNode = {
  kind: "conditional";
  condition: PageConditions;
  then: readonly EventNode[];
  else?: readonly EventNode[];
};

export type LoopNode = {
  kind: "loop";
  body: readonly EventNode[];
};

export type BreakLoopNode = {
  kind: "breakLoop";
};

export type ExitEventNode = {
  kind: "exitEvent";
};

export type CommonEventNode = {
  kind: "commonEvent";
  ref: ReferenceValue<"commonEvent">;
};

export type LabelNode = {
  kind: "label";
  name: string;
};

export type JumpToLabelNode = {
  kind: "jumpToLabel";
  name: string;
};

export type CommentNode = {
  kind: "comment";
  lines: readonly [string, ...string[]];
};

export type ScriptNode = {
  kind: "script";
  code: readonly [string, ...string[]];
};

export type PluginCommandNode = {
  kind: "pluginCommand";
  command: string;
  args?: readonly string[];
};

export type TransferPlayerNode = {
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

export type ControlSwitchNode = {
  kind: "controlSwitch";
  switch: ReferenceValue<"switch">;
  value: boolean;
};

export type ControlVariableNode = {
  kind: "controlVariable";
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

export type ControlSelfSwitchNode = {
  kind: "controlSelfSwitch";
  selfSwitch: "A" | "B" | "C" | "D";
  value: boolean;
};

export type ChangeGoldNode = {
  kind: "changeGold";
  operation: "gain" | "lose";
  value: number;
};

export type ChangeItemNode = {
  kind: "changeItem";
  item: ReferenceValue<"item">;
  operation: "gain" | "lose";
  amount: number;
};

export type WaitNode = {
  kind: "wait";
  frames: number;
};

export type EraseEventNode = {
  kind: "eraseEvent";
};

export type BattleProcessingNode = {
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

export type ShopProcessingNode = {
  kind: "shopProcessing";
  goods: readonly [number, number, number, number, number?];
  allowSelling?: boolean;
};

export type RawCommandNode = {
  kind: "rawCommand";
  code: number;
  indent?: number;
  parameters: readonly unknown[];
};

export function mapEvent(input: {
  name: string;
  x: number;
  y: number;
  pages: readonly [EventPage, ...EventPage[]];
}): MapEventDefinition {
  return {
    kind: "mapEvent",
    name: input.name,
    x: input.x,
    y: input.y,
    pages: input.pages,
  };
}

export function commonEvent(input: {
  name: string;
  trigger: CommonEventTrigger;
  switch?: ReferenceValue<"switch">;
  commands: readonly EventNode[];
}): CommonEventDefinition {
  const definition: CommonEventDefinition = {
    kind: "commonEvent",
    name: input.name,
    trigger: input.trigger,
    commands: input.commands,
  };

  if (input.switch !== undefined) {
    definition.switch = input.switch;
  }

  return definition;
}

export function page(input: {
  conditions?: PageConditions;
  trigger?: MapPageTrigger;
  commands: readonly EventNode[];
}): EventPage {
  return {
    conditions: input.conditions ?? {},
    trigger: input.trigger ?? "action",
    commands: input.commands,
  };
}

export function showText(lines: readonly [string, ...string[]]): ShowTextNode {
  return { kind: "showText", lines };
}

export function showChoices(input: {
  choices: readonly [string, ...string[]];
  branches: readonly [readonly EventNode[], ...readonly EventNode[][]];
  cancelType?: number;
  defaultType?: number;
  positionType?: 0 | 1 | 2;
  background?: 0 | 1 | 2;
  cancelBranch?: readonly EventNode[];
}): ShowChoicesNode {
  const node: ShowChoicesNode = {
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
  then: readonly EventNode[];
  else?: readonly EventNode[];
}): ConditionalNode {
  const node: ConditionalNode = {
    kind: "conditional",
    condition: input.condition,
    then: input.then,
  };

  if (input.else !== undefined) {
    node.else = input.else;
  }

  return node;
}

export function loop(body: readonly EventNode[]): LoopNode {
  return { kind: "loop", body };
}

export function breakLoop(): BreakLoopNode {
  return { kind: "breakLoop" };
}

export function exitEvent(): ExitEventNode {
  return { kind: "exitEvent" };
}

export function commonEventCall(ref: ReferenceValue<"commonEvent">): CommonEventNode {
  return { kind: "commonEvent", ref };
}

export function label(name: string): LabelNode {
  return { kind: "label", name };
}

export function jumpToLabel(name: string): JumpToLabelNode {
  return { kind: "jumpToLabel", name };
}

export function comment(lines: readonly [string, ...string[]]): CommentNode {
  return { kind: "comment", lines };
}

export function script(code: readonly [string, ...string[]]): ScriptNode {
  return { kind: "script", code };
}

export function pluginCommand(input: {
  command: string;
  args?: readonly string[];
}): PluginCommandNode {
  const node: PluginCommandNode = {
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
}): TransferPlayerNode {
  return {
    kind: "transferPlayer",
    target: input,
  };
}

export function controlSwitch(input: {
  switch: ReferenceValue<"switch">;
  value: boolean;
}): ControlSwitchNode {
  return {
    kind: "controlSwitch",
    switch: input.switch,
    value: input.value,
  };
}

export function controlVariable(input: {
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
}): ControlVariableNode {
  return {
    kind: "controlVariable",
    variable: input.variable,
    operation: input.operation,
    value: input.value,
  };
}

export function controlSelfSwitch(input: {
  selfSwitch: "A" | "B" | "C" | "D";
  value: boolean;
}): ControlSelfSwitchNode {
  return {
    kind: "controlSelfSwitch",
    selfSwitch: input.selfSwitch,
    value: input.value,
  };
}

export function changeGold(input: {
  operation: "gain" | "lose";
  value: number;
}): ChangeGoldNode {
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
}): ChangeItemNode {
  return {
    kind: "changeItem",
    item: input.item,
    operation: input.operation,
    amount: input.amount,
  };
}

export function wait(frames: number): WaitNode {
  return { kind: "wait", frames };
}

export function eraseEvent(): EraseEventNode {
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
}): BattleProcessingNode {
  const node: BattleProcessingNode = {
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
}): ShopProcessingNode {
  const node: ShopProcessingNode = {
    kind: "shopProcessing",
    goods: input.goods,
  };

  if (input.allowSelling !== undefined) {
    node.allowSelling = input.allowSelling;
  }

  return node;
}

export function rawCommand(input: {
  code: number;
  indent?: number;
  parameters: readonly unknown[];
}): RawCommandNode {
  const node: RawCommandNode = {
    kind: "rawCommand",
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

export function collectEventDefinitions(moduleExports: Record<string, unknown>): EventDefinition[] {
  const definitions: EventDefinition[] = [];

  for (const [name, value] of Object.entries(moduleExports)) {
    if (name === "default") {
      throw new Error("Default export is not allowed for Event Definitions.");
    }
    if (isEventDefinition(value)) {
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

function isEventDefinition(value: unknown): value is EventDefinition {
  return (
    !!value &&
    typeof value === "object" &&
    "kind" in value &&
    ((value as { kind?: string }).kind === "mapEvent" ||
      (value as { kind?: string }).kind === "commonEvent")
  );
}
