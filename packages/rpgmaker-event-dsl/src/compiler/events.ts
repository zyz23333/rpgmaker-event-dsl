import type {
  BattleEventPage,
  CommonEventDefinition,
  EventPage,
  MapEventDefinition,
  ReferenceValue,
} from "../domain/types.js";
import { blankBattleEventPage } from "../domain/battle-page-defaults.js";
import { assertMapEventInput, assertMapPageInput } from "../map-event/validation.js";
import type { ReferenceResolver } from "../validation/types.js";
import { commonEventTriggerToCode, compileNodes, type RawEventCommand } from "./dispatch.js";
import { compilePageMovement } from "../commands/movement/page.js";
import { assertCommonEventInput } from "../validation/common-events.js";

import { assertBattlePageInput } from "../validation/battle-pages.js";

export function compileBattlePage(page: BattleEventPage, resolver: ReferenceResolver) {
  assertBattlePageInput(page, resolver);
  const defaults = blankBattleEventPage();
  const conditions = page.conditions ?? {};
  const savedId = (ref: ReferenceValue<"actor"> | ReferenceValue<"switch">, enabled: boolean) =>
    !enabled && "id" in ref ? ref.id : resolver.resolveReference(ref);
  return {
    conditions: {
      ...defaults.conditions,
      ...(conditions.turnEnd === undefined ? {} : { turnEnding: conditions.turnEnd }),
      ...(conditions.turn === undefined
        ? {}
        : {
            turnValid: conditions.turn.enabled,
            turnA: conditions.turn.a,
            turnB: conditions.turn.b,
          }),
      ...(conditions.enemy === undefined
        ? {}
        : {
            enemyValid: conditions.enemy.enabled,
            enemyIndex: conditions.enemy.index,
            enemyHp: conditions.enemy.hpAtMost,
          }),
      ...(conditions.actor === undefined
        ? {}
        : {
            actorValid: conditions.actor.enabled,
            actorId: savedId(conditions.actor.ref, conditions.actor.enabled),
            actorHp: conditions.actor.hpAtMost,
          }),
      ...(conditions.switch === undefined
        ? {}
        : {
            switchValid: conditions.switch.enabled,
            switchId: savedId(conditions.switch.ref, conditions.switch.enabled),
          }),
    },
    span: page.span === undefined || page.span === "battle" ? 0 : page.span === "turn" ? 1 : 2,
    list: compileNodes(page.commands, 0, resolver),
  };
}
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
