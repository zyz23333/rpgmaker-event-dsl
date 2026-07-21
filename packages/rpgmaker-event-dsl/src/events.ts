import type { CommonEventDefinition, EventPage, MapEventDefinition } from "./dsl.js";
import type { ReferenceResolver } from "./staged-graph.js";
import {
  commonEventTriggerToCode,
  compileConditions,
  compileNodes,
  type RawEventCommand,
} from "./compiler/commands.js";

export type ProjectEventData = {
  id: number;
  name: string;
  x?: number;
  y?: number;
  note?: string;
  pages?: ProjectEventPage[];
  trigger?: number;
  switchId?: number;
  list?: RawEventCommand[];
};

type ProjectEventPage = {
  conditions?: Record<string, unknown>;
  directionFix?: boolean;
  image?: Record<string, unknown>;
  list: RawEventCommand[];
  moveFrequency?: number;
  moveRoute?: Record<string, unknown>;
  moveSpeed?: number;
  moveType?: number;
  priorityType?: number;
  stepAnime?: boolean;
  through?: boolean;
  trigger?: number;
  walkAnime?: boolean;
};

type CompiledCommonEvent = {
  id: number;
  name: string;
  trigger: number;
  switchId: number;
  list: RawEventCommand[];
};

export function compileMapEvent(
  definition: MapEventDefinition,
  options: { nextId: number; resolver: ReferenceResolver },
): ProjectEventData {
  return {
    id: options.nextId,
    name: definition.name,
    x: definition.x,
    y: definition.y,
    pages: definition.pages.map((page) => compilePage(page, options.resolver)),
  };
}

export function compileCommonEvent(
  definition: CommonEventDefinition,
  options: { nextId: number; resolver: ReferenceResolver },
): CompiledCommonEvent {
  return {
    id: options.nextId,
    name: definition.name,
    trigger: commonEventTriggerToCode(definition.trigger),
    switchId: definition.switch ? options.resolver.resolveReference(definition.switch) : 1,
    list: compileNodes(definition.commands, 0, options.resolver),
  };
}

export function compilePage(page: EventPage, resolver: ReferenceResolver): ProjectEventPage {
  return {
    conditions: compileConditions(page.conditions, resolver),
    directionFix: false,
    image: {
      characterIndex: 0,
      characterName: "",
      direction: 2,
      pattern: 0,
      tileId: 0,
    },
    list: compileNodes(page.commands, 0, resolver),
    moveFrequency: 3,
    moveRoute: {
      list: [{ code: 0, parameters: [] }],
      repeat: true,
      skippable: false,
      wait: false,
    },
    moveSpeed: 3,
    moveType: 0,
    priorityType: 1,
    stepAnime: false,
    through: false,
    trigger:
      page.trigger === "action"
        ? 0
        : page.trigger === "playerTouch"
          ? 1
          : page.trigger === "eventTouch"
            ? 2
            : page.trigger === "autorun"
              ? 3
              : 4,
    walkAnime: true,
  };
}
