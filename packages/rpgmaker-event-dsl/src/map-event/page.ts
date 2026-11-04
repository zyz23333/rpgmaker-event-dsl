import type { EventPage, PageConditions, ReferenceKind, ReferenceValue } from "../domain/types.js";
import type { ReferenceResolver } from "../validation/types.js";

export const pageTriggers = ["action", "playerTouch", "eventTouch", "autorun", "parallel"] as const;
export const pagePriorities = ["below", "same", "above"] as const;
export const pageDirections = ["down", "left", "right", "up"] as const;
export const nativeDirections = [2, 4, 6, 8] as const;

export function compilePageConditions(
  conditions: PageConditions | undefined,
  resolver: ReferenceResolver,
): Record<string, unknown> {
  const id = (
    slot: { enabled: boolean; ref: ReferenceValue<ReferenceKind> } | undefined,
  ): number => {
    if (slot === undefined) return 1;
    if (!slot.enabled && "id" in slot.ref) return slot.ref.id;
    return resolver.resolveReference(slot.ref);
  };
  return {
    actorId: id(conditions?.actor),
    actorValid: conditions?.actor?.enabled ?? false,
    itemId: id(conditions?.item),
    itemValid: conditions?.item?.enabled ?? false,
    selfSwitchCh: conditions?.selfSwitch?.value ?? "A",
    selfSwitchValid: conditions?.selfSwitch?.enabled ?? false,
    switch1Id: id(conditions?.switch1),
    switch1Valid: conditions?.switch1?.enabled ?? false,
    switch2Id: id(conditions?.switch2),
    switch2Valid: conditions?.switch2?.enabled ?? false,
    variableId: id(conditions?.variable),
    variableValid: conditions?.variable?.enabled ?? false,
    variableValue: conditions?.variable?.atLeast ?? 0,
  };
}

export function compilePageSettings(page: EventPage, resolver: ReferenceResolver) {
  return {
    conditions: compilePageConditions(page.conditions, resolver),
    image: {
      characterName: page.image?.character?.name ?? "",
      characterIndex: page.image?.characterIndex ?? 0,
      tileId: page.image?.tileId ?? 0,
      direction: nativeDirections[pageDirections.indexOf(page.image?.direction ?? "down")],
      pattern: page.image?.pattern ?? 0,
    },
    directionFix: page.options?.directionFix ?? false,
    stepAnime: page.options?.stepAnimation ?? false,
    through: page.options?.through ?? false,
    walkAnime: page.options?.walkAnimation ?? true,
    priorityType: pagePriorities.indexOf(page.priority ?? "below"),
    trigger: pageTriggers.indexOf(page.trigger ?? "action"),
  };
}
