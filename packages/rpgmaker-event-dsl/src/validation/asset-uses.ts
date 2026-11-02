import type { RawEventCommand } from "../compiler/types.js";
import type { AssetReference, ImageAssetFolder } from "../domain/references.js";
import type { NativeMovementRoute } from "../commands/movement/types.js";

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
    for (const page of event.pages) {
      if (event.kind === "mapEvent") {
        const image = page.saved.image as { characterName: string; tileId: number };
        if (image.characterName !== "")
          uses.push({
            category: "image",
            folder: "characters",
            name: image.characterName,
            identity: event.identity,
            nativePath: `${page.nativePath}.image.characterName`,
            relatedNativePaths: [],
            dependencyChain: [],
            conditions: [],
            ...(image.tileId > 0
              ? {
                  inactive:
                    "Map Event Page uses a tile image; the saved characterName is inactive.",
                }
              : {}),
          });
        const route = page.saved.moveRoute as NativeMovementRoute;
        for (const [index, record] of route.list.entries())
          if (record.code === 41 && record.parameters![0] !== "")
            uses.push({
              category: "image",
              folder: "characters",
              name: record.parameters![0] as string,
              identity: event.identity,
              nativePath: `${page.nativePath}.moveRoute.list[${index}].parameters[0]`,
              relatedNativePaths: [],
              dependencyChain: [],
              conditions: [],
              ...(page.saved.moveType === 3
                ? {}
                : {
                    inactive: `Autonomous Movement is ${["fixed", "random", "approach"][page.saved.moveType as number]}; the saved route is inactive.`,
                  }),
            });
      }
      for (const [index, command] of page.list.entries()) {
        if (command.code === 205) {
          const route = command.parameters[1] as NativeMovementRoute;
          for (const [routeIndex, record] of route.list.entries())
            if (record.code === 41 && record.parameters![0] !== "")
              uses.push({
                category: "image",
                folder: "characters",
                name: record.parameters![0] as string,
                identity: event.identity,
                nativePath: `${page.nativePath}.list[${index}].parameters[1].list[${routeIndex}].parameters[0]`,
                relatedNativePaths: [
                  `${page.nativePath}.list[${index + 1 + routeIndex}].parameters[0].parameters[0]`,
                ],
                dependencyChain: [],
                conditions: [],
              });
        }
        const fields: readonly (readonly [number, ImageAssetFolder])[] =
          command.code === 231
            ? [[1, "pictures"]]
            : command.code === 101
              ? [[0, "faces"]]
              : command.code === 283
                ? [
                    [0, "battlebacks1"],
                    [1, "battlebacks2"],
                  ]
                : command.code === 284
                  ? [[0, "parallaxes"]]
                  : command.code === 322
                    ? [
                        [1, "characters"],
                        [3, "faces"],
                        [5, "sv_actors"],
                      ]
                    : command.code === 323
                      ? [[1, "characters"]]
                      : [];
        for (const [field, folder] of fields) {
          if (command.parameters[field] === "") continue;
          uses.push({
            category: "image",
            folder,
            name: command.parameters[field] as string,
            identity: event.identity,
            nativePath: `${page.nativePath}.list[${index}].parameters[${field}]`,
            relatedNativePaths: [],
            dependencyChain: [],
            conditions: [],
          });
        }
      }
    }
  return uses;
}

export function assetTargetKey(target: AssetTarget): string {
  return JSON.stringify([target.category, target.folder, target.name]);
}
