import { nativeAssetEvents } from "./asset-uses.js";
import { CapturedAssetData, collectAssetName } from "./asset-dependencies.js";
import type { AssetOrigin, AssetRelations } from "./asset-dependencies.js";

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function enemyAssets(
  data: CapturedAssetData,
  id: number,
  origin: AssetOrigin,
  result: AssetRelations,
): void {
  const enemy = data.entry("Enemies.json", id, origin, result);
  if (enemy === undefined) return;
  const selected: AssetOrigin = {
    ...origin,
    dependencyChain: [
      ...origin.dependencyChain,
      { data: "Enemies.json", id, field: "battlerName", relationship: "Enemy battler image" },
    ],
  };
  if (enemy.battlerName === "") return;
  const system = data.object("System.json", selected, result);
  if (system === undefined) return;
  if (typeof system.optSideView !== "boolean") {
    if (typeof enemy.battlerName !== "string")
      collectAssetName(
        result,
        enemy.battlerName,
        { category: "image", folder: "enemies" },
        selected,
        `Enemies.json[${id}].battlerName`,
      );
    result.problems.push({
      ...selected,
      dataPath: "System.json.optSideView",
      dependencyChain: [
        ...selected.dependencyChain,
        { data: "System.json", field: "optSideView", relationship: "Enemy battler directory" },
      ],
      reason: "Necessary optSideView must be boolean; the Enemy battler directory is unchecked.",
    });
    return;
  }
  collectAssetName(
    result,
    enemy.battlerName,
    { category: "image", folder: system.optSideView ? "sv_enemies" : "enemies" },
    {
      ...selected,
      conditions: [
        ...origin.conditions,
        system.optSideView
          ? "Enemy battlers use img/sv_enemies when System.optSideView is true."
          : "Enemy battlers use img/enemies when System.optSideView is false.",
      ],
    },
    `Enemies.json[${id}].battlerName`,
  );
}
export function collectActorEnemyAssets(
  files: ReadonlyMap<string, string>,
  external: ReadonlyMap<string, string | Uint8Array>,
): AssetRelations {
  const data = new CapturedAssetData(external);
  const result: AssetRelations = { uses: [], problems: [] };
  for (const event of nativeAssetEvents(files))
    for (const page of event.pages)
      for (const [index, command] of page.list.entries()) {
        if (command.code === 129 && command.parameters[1] === 0) {
          const id = command.parameters[0] as number;
          const origin: AssetOrigin = {
            identity: event.identity,
            nativePath: `${page.nativePath}.list[${index}].parameters[0]`,
            relatedNativePaths: [],
            dependencyChain: [],
            conditions: [],
          };
          const actor = data.entry("Actors.json", id, origin, result);
          if (actor === undefined) continue;
          collectAssetName(
            result,
            actor.characterName,
            { category: "image", folder: "characters" },
            {
              ...origin,
              dependencyChain: [
                {
                  data: "Actors.json",
                  id,
                  field: "characterName",
                  relationship: "Actor initial character image",
                },
              ],
              conditions: [
                "The added Actor supplies a player or follower image only when effective in the current party.",
              ],
              candidate: "Actor initial character image may be replaced by runtime image settings.",
            },
            `Actors.json[${id}].characterName`,
          );
          collectAssetName(
            result,
            actor.battlerName,
            { category: "image", folder: "sv_actors" },
            {
              ...origin,
              dependencyChain: [
                {
                  data: "Actors.json",
                  id,
                  field: "battlerName",
                  relationship: "Actor initial battler image",
                },
              ],
              conditions: [
                "Actor battler images apply only in side-view battle and while the Actor is an effective battle member.",
              ],
              candidate: "Actor initial battler image may be replaced by runtime image settings.",
            },
            `Actors.json[${id}].battlerName`,
          );
          continue;
        }
        if (command.code === 336) {
          enemyAssets(
            data,
            command.parameters[1] as number,
            {
              identity: event.identity,
              nativePath: `${page.nativePath}.list[${index}].parameters[1]`,
              relatedNativePaths: [],
              dependencyChain: [],
              conditions: [
                "The runtime enemy target may be absent; the saved replacement Enemy remains selected.",
              ],
            },
            result,
          );
          continue;
        }
        if (command.code !== 301 || command.parameters[0] !== 0) continue;
        const id = command.parameters[1] as number;
        const origin: AssetOrigin = {
          identity: event.identity,
          nativePath: `${page.nativePath}.list[${index}].parameters[1]`,
          relatedNativePaths: [],
          dependencyChain: [],
          conditions: ["All saved Troop members are selected, including hidden members."],
        };
        const troop = data.entry("Troops.json", id, origin, result);
        if (troop === undefined) continue;
        if (!Array.isArray(troop.members)) {
          result.problems.push({
            ...origin,
            dataPath: `Troops.json[${id}].members`,
            dependencyChain: [
              { data: "Troops.json", id, field: "members", relationship: "Troop member Enemies" },
            ],
            reason: "Necessary Troop members must be an array; member relationships are unchecked.",
          });
          continue;
        }
        for (const [memberIndex, member] of troop.members.entries()) {
          const field = `members[${memberIndex}].enemyId`;
          const selected: AssetOrigin = {
            ...origin,
            dependencyChain: [
              { data: "Troops.json", id, field, relationship: "Troop member Enemy" },
            ],
          };
          if (
            !object(member) ||
            !Number.isSafeInteger(member.enemyId) ||
            (member.enemyId as number) <= 0
          ) {
            result.problems.push({
              ...selected,
              dataPath: `Troops.json[${id}].${field}`,
              reason:
                "Necessary member enemyId must be a positive integer; this member relationship is unchecked.",
            });
            continue;
          }
          enemyAssets(data, member.enemyId as number, selected, result);
        }
      }
  return result;
}
