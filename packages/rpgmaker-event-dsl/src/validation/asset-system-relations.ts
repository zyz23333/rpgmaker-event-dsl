import { CapturedAssetData, collectAssetName } from "./asset-dependencies.js";
import type { AssetDynamicStop, AssetOrigin, AssetRelations } from "./asset-dependencies.js";
import { nativeAssetEvents } from "./asset-uses.js";

export function collectSystemAssets(
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
    for (const page of event.pages)
      for (const [index, command] of page.list.entries()) {
        if (command.code !== 353 && command.code !== 354 && command.code !== 301) continue;
        const origin: AssetOrigin = {
          identity: event.identity,
          nativePath: `${page.nativePath}.list[${index}]`,
          relatedNativePaths: [],
          dependencyChain: [],
          conditions: [],
        };
        if (command.code === 301 && command.parameters[0] !== 0)
          result.stops.push({
            ...origin,
            nativePath: `${origin.nativePath}.parameters[0]`,
            reason:
              "Troop target is selected at runtime; the Troop/Enemy asset relationship is unchecked.",
          });
        if (command.code === 301 && event.kind === "mapEvent") {
          const map = data.object(event.file, origin, result);
          if (map !== undefined) {
            if (typeof map.specifyBattleback !== "boolean")
              result.problems.push({
                ...origin,
                dataPath: `${event.file}.specifyBattleback`,
                reason:
                  "Necessary specifyBattleback must be boolean; background activation is unchecked.",
              });
            for (const [field, folder] of [
              ["battleback1Name", "battlebacks1"],
              ["battleback2Name", "battlebacks2"],
            ] as const)
              collectAssetName(
                result,
                map[field],
                { category: "image", folder },
                {
                  ...origin,
                  dependencyChain: [
                    { data: event.file, field, relationship: "Host Map battle background" },
                  ],
                  conditions: [
                    map.specifyBattleback === true
                      ? "Host Map specifyBattleback is true; the saved battle background is enabled."
                      : map.specifyBattleback === false
                        ? "Host Map specifyBattleback is false; the saved battle background is disabled."
                        : "Host Map specifyBattleback is unchecked.",
                  ],
                  candidate:
                    "Saved host Map background applies only while this map remains current and runtime battle background settings have not replaced it.",
                  ...(map.specifyBattleback === false
                    ? {
                        inactive:
                          "Host Map specifyBattleback is false; saved battle background names are inactive.",
                      }
                    : {}),
                },
                `${event.file}.${field}`,
              );
          }
        }
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
        } else if (command.code === 354) {
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
        } else {
          for (const [field, folder, relationship, condition] of [
            ["battleBgm", "bgm", "Default battle BGM", "Battle BGM applies when battle starts."],
            [
              "victoryMe",
              "me",
              "Default victory ME",
              "Victory ME applies only when the battle is won.",
            ],
            [
              "defeatMe",
              "me",
              "Default defeat ME",
              "Defeat ME applies only when the battle is lost.",
            ],
          ] as const) {
            const audio = system[field];
            collectAssetName(
              result,
              audio !== null && typeof audio === "object" && !Array.isArray(audio)
                ? (audio as Record<string, unknown>).name
                : undefined,
              { category: "audio", folder },
              {
                ...origin,
                dependencyChain: [{ data: "System.json", field: `${field}.name`, relationship }],
                conditions: [condition],
                candidate: "Saved System default may be replaced by runtime battle audio settings.",
              },
              `System.json.${field}.name`,
            );
          }
          const sound = Array.isArray(system.sounds) ? system.sounds[7] : undefined;
          collectAssetName(
            result,
            sound !== null && typeof sound === "object" && !Array.isArray(sound)
              ? (sound as Record<string, unknown>).name
              : undefined,
            { category: "audio", folder: "se" },
            {
              ...origin,
              dependencyChain: [
                { data: "System.json", field: "sounds[7].name", relationship: "Battle start SE" },
              ],
              conditions: ["Battle start SE plays only when battle launches from the map scene."],
            },
            "System.json.sounds[7].name",
          );
        }
      }
  return result;
}
