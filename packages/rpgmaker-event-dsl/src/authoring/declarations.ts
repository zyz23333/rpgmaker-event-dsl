import type {
  CommonEventDefinition,
  BattleEventPage,
  TroopEventDefinition,
  DslCommand,
  EventPage,
  AutonomousMovement,
  MapEventDefinition,
  MapPageTrigger,
  PageConditions,
  PageImage,
  PageOptions,
  SwitchDefinition,
  VariableDefinition,
} from "../domain/types.js";
import type { CommonEventInput } from "../domain/declarations.js";
import { assertCommonEventInput } from "../validation/common-events.js";
import { assertDslObject } from "../validation/dsl-command-inputs.js";

export function troopEvent(input: Omit<TroopEventDefinition, "kind">): TroopEventDefinition {
  assertDslObject(input, ["troopId", "pages"], "troopEvent");
  return { ...input, kind: "troopEvent" };
}

export function battlePage(input: BattleEventPage): BattleEventPage {
  assertDslObject(input, ["conditions", "span", "commands"], "battlePage");
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
  assertDslObject(input, ["mapId", "id", "name", "x", "y", "note", "pages"], "mapEvent");
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

export function commonEvent(input: CommonEventInput): CommonEventDefinition {
  assertCommonEventInput(input);
  return { ...input, kind: "commonEvent" };
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
  assertDslObject(
    input,
    ["conditions", "trigger", "commands", "movement", "image", "priority", "options"],
    "page",
  );
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
