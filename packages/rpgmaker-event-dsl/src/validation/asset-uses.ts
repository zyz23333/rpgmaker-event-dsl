import type { RawEventCommand } from "../compiler/types.js";
import type { AssetReference } from "../domain/references.js";

export type AssetTarget = Omit<AssetReference, "kind">;
export type AssetDependency = {
  data: string;
  id?: number;
  field: string;
  relationship: string;
};
export type EventAssetUse = AssetTarget & {
  identity: string;
  nativePath: string;
  relatedNativePaths: readonly string[];
  dependencyChain: readonly AssetDependency[];
  conditions: readonly string[];
  candidate?: string;
  inactive?: string;
};
export type NativeAssetEvent = {
  kind: "mapEvent" | "commonEvent" | "troopEvent";
  identity: string;
  id: number;
  mapId?: number;
  file: string;
  pages: readonly {
    nativePath: string;
    list: readonly RawEventCommand[];
    saved: Record<string, unknown>;
  }[];
};

/** Call only after validating the complete native output. Removed events are absent here. */
export function nativeAssetEvents(files: ReadonlyMap<string, string>): NativeAssetEvent[] {
  const roots: NativeAssetEvent[] = [];
  for (const [file, text] of files) {
    if (file !== "CommonEvents.json" && file !== "Troops.json" && !/^Map\d+\.json$/u.test(file))
      continue;
    const data = JSON.parse(text);
    const common = file === "CommonEvents.json";
    const troop = file === "Troops.json";
    const mapId = common || troop ? undefined : Number(file.slice(3, -5));
    const entries = (common || troop ? data : data.events) as (Record<string, unknown> | null)[];
    for (const [id, entry] of entries.entries()) {
      if (entry === null) continue;
      const path = common || troop ? `${file}[${id}]` : `${file}.events[${id}]`;
      roots.push({
        kind: common ? "commonEvent" : troop ? "troopEvent" : "mapEvent",
        identity: common ? `commonEvent:${id}` : troop ? `troop:${id}` : `map:${mapId}/event:${id}`,
        id,
        ...(mapId === undefined ? {} : { mapId }),
        file,
        pages: common
          ? [{ nativePath: path, list: entry.list as RawEventCommand[], saved: entry }]
          : (entry.pages as Record<string, unknown>[]).map((page, index) => ({
              nativePath: `${path}.pages[${index}]`,
              list: page.list as RawEventCommand[],
              saved: page,
            })),
      });
    }
  }
  return roots.sort((left, right) => left.identity.localeCompare(right.identity));
}

export function collectEventAssetUses(files: ReadonlyMap<string, string>): EventAssetUse[] {
  const uses: EventAssetUse[] = [];
  for (const event of nativeAssetEvents(files))
    for (const page of event.pages)
      for (const [index, command] of page.list.entries()) {
        if (command.code !== 231 || command.parameters[1] === "") continue;
        uses.push({
          category: "image",
          folder: "pictures",
          name: command.parameters[1] as string,
          identity: event.identity,
          nativePath: `${page.nativePath}.list[${index}].parameters[1]`,
          relatedNativePaths: [],
          dependencyChain: [],
          conditions: [],
        });
      }
  return uses;
}

export function assetTargetKey(target: AssetTarget): string {
  return JSON.stringify([target.category, target.folder, target.name]);
}
