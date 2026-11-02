import {
  CapturedAssetData,
  collectAnimationAssets,
  collectAssetName,
  type AssetOrigin,
  type AssetRelations,
  type AssetDynamicStop,
} from "./asset-dependencies.js";
import { nativeAssetEvents } from "./asset-uses.js";
import type { CommonEventAssetCall } from "./asset-common-calls.js";

export type ForcedActionAssetRelations = AssetRelations & {
  stops: AssetDynamicStop[];
  calls: CommonEventAssetCall[];
};

/** Follow only the fixed Skill selected by a current saved Force Action. */
export function collectForcedActionAssets(
  files: ReadonlyMap<string, string>,
  external: ReadonlyMap<string, string | Uint8Array>,
): ForcedActionAssetRelations {
  const result: ForcedActionAssetRelations = { uses: [], problems: [], stops: [], calls: [] };
  const data = new CapturedAssetData(external);
  const current = new CapturedAssetData(files);
  for (const event of nativeAssetEvents(files))
    for (const page of event.pages)
      for (const [index, command] of page.list.entries()) {
        if (command.code !== 339) continue;
        const id = command.parameters[2] as number;
        const origin: AssetOrigin = {
          identity: event.identity,
          nativePath: `${page.nativePath}.list[${index}].parameters[2]`,
          relatedNativePaths: [],
          dependencyChain: [],
          conditions: [],
        };
        const skill = data.entry("Skills.json", id, origin, result);
        if (skill === undefined) continue;
        const animationOrigin: AssetOrigin = {
          ...origin,
          dependencyChain: [
            {
              data: "Skills.json",
              id,
              field: "animationId",
              relationship: "Forced action Skill animation",
            },
          ],
        };
        if (!Number.isInteger(skill.animationId))
          result.problems.push({
            ...animationOrigin,
            dataPath: `Skills.json[${id}].animationId`,
            reason:
              "Necessary Skill animationId must be an integer; this animation relationship is unchecked.",
          });
        else if ((skill.animationId as number) > 0)
          collectAnimationAssets(data, skill.animationId as number, animationOrigin, result);
        else if ((skill.animationId as number) < 0 && command.parameters[0] === 1) {
          const defaultOrigin: AssetOrigin = {
            ...animationOrigin,
            conditions: [
              "Current equipped weapons are runtime state; initial Actor equipment does not determine them.",
            ],
          };
          result.stops.push({
            ...defaultOrigin,
            reason:
              "The forced Actor's current weapons and their attack animations are runtime state; this branch is unchecked.",
          });
          collectAnimationAssets(
            data,
            1,
            {
              ...defaultOrigin,
              candidate: "Animation 1 applies only when the forced Actor has no current weapon.",
            },
            result,
          );
        } else if ((skill.animationId as number) < 0) {
          const soundOrigin: AssetOrigin = {
            ...animationOrigin,
            dependencyChain: [
              ...animationOrigin.dependencyChain,
              {
                data: "System.json",
                field: "sounds[9].name",
                relationship: "Enemy default attack sound effect",
              },
            ],
            conditions: ["Enemy default attacks use System.sounds[9] rather than an Animation."],
          };
          const system = data.object("System.json", soundOrigin, result);
          if (system !== undefined) {
            const sound: unknown = Array.isArray(system.sounds) ? system.sounds[9] : undefined;
            collectAssetName(
              result,
              sound !== null && typeof sound === "object" && !Array.isArray(sound)
                ? (sound as Record<string, unknown>).name
                : undefined,
              { category: "audio", folder: "se" },
              soundOrigin,
              "System.json.sounds[9].name",
            );
          }
        }
        if (!Array.isArray(skill.effects)) {
          result.problems.push({
            ...origin,
            dependencyChain: [
              {
                data: "Skills.json",
                id,
                field: "effects",
                relationship: "Skill Common Event effects",
              },
            ],
            dataPath: `Skills.json[${id}].effects`,
            reason: "Necessary Skill effects must be an array; effect relationships are unchecked.",
          });
          continue;
        }
        for (const [effectIndex, effect] of skill.effects.entries()) {
          if (
            effect === null ||
            typeof effect !== "object" ||
            Array.isArray(effect) ||
            !Number.isInteger(effect.code)
          ) {
            result.problems.push({
              ...origin,
              dependencyChain: [
                {
                  data: "Skills.json",
                  id,
                  field: `effects[${effectIndex}].code`,
                  relationship: "Skill effect kind",
                },
              ],
              dataPath: `Skills.json[${id}].effects[${effectIndex}].code`,
              reason:
                "Necessary Skill effect must be an object with an integer code; this effect relationship is unchecked.",
            });
            continue;
          }
          if (effect.code !== 44) continue;
          const targetId = effect.dataId as number;
          const effectOrigin: AssetOrigin = {
            ...origin,
            dependencyChain: [
              {
                data: "Skills.json",
                id,
                field: `effects[${effectIndex}].dataId`,
                relationship: "Skill Common Event effect",
              },
            ],
          };
          if (!Number.isInteger(targetId) || targetId <= 0) {
            result.problems.push({
              ...effectOrigin,
              dataPath: `Skills.json[${id}].effects[${effectIndex}].dataId`,
              reason:
                "Necessary Common Event effect target must be a positive integer; this effect relationship is unchecked.",
            });
            continue;
          }
          result.calls.push({
            caller: origin.identity,
            nativePath: origin.nativePath,
            target: `commonEvent:${targetId}`,
            targetId,
            dependencyChain: effectOrigin.dependencyChain,
          });
          current.entry("CommonEvents.json", targetId, effectOrigin, result);
        }
      }
  return result;
}
