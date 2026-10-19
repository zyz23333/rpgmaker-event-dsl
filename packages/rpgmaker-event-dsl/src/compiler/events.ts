import { assertMapEventInput, assertMapPageInput } from "../map-event/validation.js";
import type { CommonEventDefinition, EventPage, MapEventDefinition } from "../domain/types.js";
import type { ReferenceResolver } from "../validation/types.js";
import { commonEventTriggerToCode, compileNodes, type RawEventCommand } from "./dispatch.js";
import { compilePageMovement } from "../commands/movement/page.js";
import { assertCommonEventInput } from "../validation/common-events.js";
import { compilePageSettings } from "../map-event/page.js";

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
  assertMapEventInput(definition);
  return {
    id: options.nextId,
    name: definition.name,
    x: definition.x,
    y: definition.y,
    note: definition.note ?? "",
    pages: definition.pages.map((page) => compilePage(page, options.resolver)),
  };
}

export function compileCommonEvent(
  definition: CommonEventDefinition,
  options: { nextId: number; resolver: ReferenceResolver },
): CompiledCommonEvent {
  assertCommonEventInput(definition, true);
  return {
    id: options.nextId,
    name: definition.name,
    trigger: commonEventTriggerToCode(definition.trigger),
    switchId: definition.switch ? options.resolver.resolveReference(definition.switch) : 1,
    list: compileNodes(definition.commands, 0, options.resolver),
  };
}

export function compilePage(page: EventPage, resolver: ReferenceResolver): ProjectEventPage {
  assertMapPageInput(page, resolver, "page");
  return {
    ...compilePageSettings(page, resolver),
    list: compileNodes(page.commands, 0, resolver),
    ...compilePageMovement(page.movement, resolver),
  };
}
