import {
  CapturedAssetData,
  collectAssetName,
  collectTilesetAssets,
  readTilesetNames,
} from "./asset-dependencies.js";
import type { AssetDynamicStop, AssetOrigin, AssetRelations } from "./asset-dependencies.js";
import { nativeAssetEvents } from "./asset-uses.js";

export function collectMapAssetRelations(
  files: ReadonlyMap<string, string>,
  external: ReadonlyMap<string, string | Uint8Array>,
): AssetRelations & { stops: AssetDynamicStop[] } {
  const result: AssetRelations & { stops: AssetDynamicStop[] } = {
    uses: [],
    problems: [],
    stops: [],
  };
  const data = new CapturedAssetData(external);
  for (const event of nativeAssetEvents(files))
    for (const page of event.pages) {
      const image = page.saved.image as { tileId?: number } | undefined;
      if (event.kind === "mapEvent" && image !== undefined && image.tileId! > 0) {
        const origin: AssetOrigin = {
          identity: event.identity,
          nativePath: `${page.nativePath}.image.tileId`,
          relatedNativePaths: [],
          dependencyChain: [
            {
              data: event.file,
              field: "tilesetId",
              relationship: "Map Event Page initial host Tileset",
            },
          ],
          conditions: [
            "Page tile bitmap is selected from the host Map's initial Tileset; map rendering may separately request every sheet.",
          ],
          candidate:
            "Map Event Page uses the host Map's initial Tileset; runtime tileset changes may override it.",
        };
        const map = data.object(event.file, origin, result);
        if (map !== undefined) {
          if (!Number.isSafeInteger(map.tilesetId) || (map.tilesetId as number) <= 0)
            result.problems.push({
              ...origin,
              dataPath: `${event.file}.tilesetId`,
              reason:
                "Necessary Map tilesetId must be a positive integer; this relationship is unchecked.",
            });
          else {
            const names = readTilesetNames(data, map.tilesetId as number, origin, result);
            if (names !== undefined) {
              const index = 5 + Math.floor(image.tileId! / 256);
              const field = `tilesetNames[${index}]`;
              collectAssetName(
                result,
                names[index],
                { category: "image", folder: "tilesets" },
                {
                  ...origin,
                  dependencyChain: [
                    ...origin.dependencyChain,
                    {
                      data: "Tilesets.json",
                      id: map.tilesetId as number,
                      field,
                      relationship: "Map Event Page tile image sheet",
                    },
                  ],
                },
                `Tilesets.json[${map.tilesetId}].${field}`,
              );
            }
          }
        }
      }
      for (const [index, command] of page.list.entries()) {
        if (command.code !== 201) continue;
        if (command.parameters[0] !== 0) {
          result.stops.push({
            identity: event.identity,
            nativePath: `${page.nativePath}.list[${index}].parameters[1]`,
            relatedNativePaths: [],
            dependencyChain: [],
            conditions: [],
            reason:
              "Transfer destination Map is selected by a runtime variable; this path has no fixed Map candidate and is unchecked.",
          });
          continue;
        }
        const mapFile = `Map${String(command.parameters[1]).padStart(3, "0")}.json`;
        const origin: AssetOrigin = {
          identity: event.identity,
          nativePath: `${page.nativePath}.list[${index}].parameters[1]`,
          relatedNativePaths: [],
          dependencyChain: [],
          conditions: ["Transfer destination configuration may be overridden at runtime."],
        };
        const map = data.object(mapFile, origin, result);
        if (map === undefined) continue;
        const tilesetOrigin = {
          ...origin,
          dependencyChain: [
            { data: mapFile, field: "tilesetId", relationship: "Transfer destination Map tileset" },
          ],
        };
        if (Number.isSafeInteger(map.tilesetId) && (map.tilesetId as number) > 0)
          collectTilesetAssets(data, map.tilesetId as number, tilesetOrigin, result);
        else
          result.problems.push({
            ...tilesetOrigin,
            dataPath: `${mapFile}.tilesetId`,
            reason:
              "Necessary Map tilesetId must be a positive integer; this relationship is unchecked.",
          });
        collectAssetName(
          result,
          map.parallaxName,
          { category: "image", folder: "parallaxes" },
          {
            ...origin,
            dependencyChain: [
              {
                data: mapFile,
                field: "parallaxName",
                relationship: "Transfer destination Map parallax",
              },
            ],
          },
          `${mapFile}.parallaxName`,
        );
        for (const field of ["bgm", "bgs"] as const) {
          const saved = map[field];
          const name =
            saved !== null && typeof saved === "object" && !Array.isArray(saved)
              ? (saved as Record<string, unknown>).name
              : undefined;
          const flag = field === "bgm" ? "autoplayBgm" : "autoplayBgs";
          if (typeof name === "string" && name !== "" && typeof map[flag] !== "boolean") {
            result.problems.push({
              ...origin,
              dependencyChain: [
                {
                  data: mapFile,
                  field: flag,
                  relationship: "Transfer destination Map autoplay setting",
                },
              ],
              dataPath: `${mapFile}.${flag}`,
              reason:
                "Necessary Map autoplay setting must be boolean; this audio relationship is unchecked.",
            });
            continue;
          }
          collectAssetName(
            result,
            name,
            { category: "audio", folder: field },
            {
              ...origin,
              dependencyChain: [
                {
                  data: mapFile,
                  field: `${field}.name`,
                  relationship: "Transfer destination Map autoplay audio",
                },
              ],
              conditions: [
                ...origin.conditions,
                `Map ${field.toUpperCase()} plays only when its saved autoplay setting is enabled.`,
              ],
              ...(map[flag] === false
                ? {
                    inactive: `Map ${field === "bgm" ? "autoplayBgm" : "autoplayBgs"} is false; the saved ${field} is inactive.`,
                  }
                : {}),
            },
            `${mapFile}.${field}.name`,
          );
        }
      }
    }
  return result;
}
