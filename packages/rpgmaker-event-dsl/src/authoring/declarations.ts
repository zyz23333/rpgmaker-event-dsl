import type {
  CommonEventDefinition,
  BattleEventPage,
  TroopEventDefinition,
  CommonEventTrigger,
  DslCommand,
  EventPage,
  AutonomousMovement,
  MapEventDefinition,
  MapPageTrigger,
  PageConditions,
  PageImage,
  PageOptions,
  ReferenceValue,
  SwitchDefinition,
  VariableDefinition,
} from "../domain/types.js";

export function troopEvent(input: Omit<TroopEventDefinition, "kind">): TroopEventDefinition {
  return { ...input, kind: "troopEvent" };
}

export function battlePage(input: BattleEventPage): BattleEventPage {
  return { ...input };
}

export function mapEvent(input: {
  mapId: number;
  id: number;
  name: string;
  x: number;
  y: number;
  note?: string;
  pages: readonly [EventPage, ...EventPage[]];
}): MapEventDefinition {
  return {
    ...input,
    kind: "mapEvent",
    mapId: input.mapId,
    id: input.id,
    name: input.name,
    x: input.x,
    y: input.y,
    note: input.note === undefined ? "" : input.note,
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
  movement?: AutonomousMovement;
  image?: PageImage;
  priority?: NonNullable<EventPage["priority"]>;
  options?: PageOptions;
}): EventPage {
  return {
    ...input,
    conditions: input.conditions === undefined ? {} : input.conditions,
    trigger: input.trigger === undefined ? "action" : input.trigger,
    commands: input.commands,
    ...(input.movement === undefined ? {} : { movement: input.movement }),
    ...(input.image === undefined ? {} : { image: input.image }),
    ...(input.priority === undefined ? {} : { priority: input.priority }),
    ...(input.options === undefined ? {} : { options: input.options }),
  };
}
