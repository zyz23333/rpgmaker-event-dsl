import {
  CapturedAssetData,
  collectAnimationAssets,
  type AssetOrigin,
  type AssetRelations,
  type AssetDynamicStop,
} from "./asset-dependencies.js";
import { nativeAssetEvents } from "./asset-uses.js";

export type ForcedActionAssetRelations = AssetRelations & { stops: AssetDynamicStop[] };

/** Follow only the fixed Skill's positive Animation; default attacks are runtime-dependent. */
export function collectForcedActionAssets(
  files: ReadonlyMap<string, string>,
  external: ReadonlyMap<string, string | Uint8Array>,
): ForcedActionAssetRelations {
  const result: ForcedActionAssetRelations = { uses: [], problems: [], stops: [] };
  const data = new CapturedAssetData(external);
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
        else if ((skill.animationId as number) < 0)
          result.stops.push({
            ...animationOrigin,
            reason:
              "The fixed Skill selects a default attack Animation determined at runtime; this relationship is unchecked.",
          });
      }
  return result;
}
