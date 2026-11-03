import { CapturedAssetData, collectAssetName } from "./asset-dependencies.js";
import type { AssetOrigin, AssetRelations } from "./asset-dependencies.js";
import { nativeAssetEvents } from "./asset-uses.js";

/** The selected System relationships are Game Over and Return to Title only. */
export function collectSystemAssets(
  files: ReadonlyMap<string, string>,
  external: ReadonlyMap<string, string | Uint8Array>,
): AssetRelations {
  const result: AssetRelations = { uses: [], problems: [] };
  const data = new CapturedAssetData(external);
  for (const event of nativeAssetEvents(files))
    for (const page of event.pages)
      for (const [index, command] of page.list.entries()) {
        if (command.code !== 353 && command.code !== 354) continue;
        const origin: AssetOrigin = {
          identity: event.identity,
          nativePath: `${page.nativePath}.list[${index}]`,
          relatedNativePaths: [],
          dependencyChain: [],
          conditions: [],
        };
        const system = data.object("System.json", origin, result);
        if (system === undefined) continue;
        if (command.code === 353) {
          const audio = system.gameoverMe;
          collectAssetName(
            result,
            audio !== null && typeof audio === "object" && !Array.isArray(audio)
              ? (audio as Record<string, unknown>).name
              : undefined,
            { category: "audio", folder: "me" },
            {
              ...origin,
              dependencyChain: [
                { data: "System.json", field: "gameoverMe.name", relationship: "Game Over ME" },
              ],
            },
            "System.json.gameoverMe.name",
          );
        } else {
          for (const [field, folder] of [
            ["title1Name", "titles1"],
            ["title2Name", "titles2"],
          ] as const)
            collectAssetName(
              result,
              system[field],
              { category: "image", folder },
              {
                ...origin,
                dependencyChain: [{ data: "System.json", field, relationship: "Title image" }],
              },
              `System.json.${field}`,
            );
          const audio = system.titleBgm;
          collectAssetName(
            result,
            audio !== null && typeof audio === "object" && !Array.isArray(audio)
              ? (audio as Record<string, unknown>).name
              : undefined,
            { category: "audio", folder: "bgm" },
            {
              ...origin,
              dependencyChain: [
                { data: "System.json", field: "titleBgm.name", relationship: "Title BGM" },
              ],
            },
            "System.json.titleBgm.name",
          );
        }
      }
  return result;
}
