import { collectForcedActionAssets } from "../validation/asset-action-relations.js";
import { assetTargetKey, collectEventAssetUses } from "../validation/asset-uses.js";
import { observeAssetFile } from "./asset-files.js";
import { buildAssetReport, type AssetFinding } from "../validation/asset-report.js";
import type { AssetCheckException } from "../validation/asset-exceptions.js";
import { collectAnimationAndTilesetAssets } from "../validation/asset-dependencies.js";
import { collectSystemAssets } from "../validation/asset-system-relations.js";
import {
  collectActorEnemyAssets,
  collectDynamicTroopAssetStops,
} from "../validation/asset-actor-enemy-relations.js";
import type { AuthoredAssetLocation } from "./asset-provenance.js";
import { presentAssetCheck } from "./asset-check-presentation.js";

/** Live metadata is transient and deliberately absent from Compile Baseline. */
export async function checkEventAssets(input: {
  projectRoot: string;
  files: ReadonlyMap<string, string>;
  externalData: ReadonlyMap<string, string | Uint8Array>;
  commandName: string;
  exceptions?: readonly AssetCheckException[];
  locations?: ReadonlyMap<string, AuthoredAssetLocation>;
}): Promise<void> {
  const actions = collectForcedActionAssets(input.files, input.externalData);
  const systemRelations = collectSystemAssets(input.files, input.externalData);
  const battlers = collectActorEnemyAssets(input.files, input.externalData);
  const relationGroups = [
    collectAnimationAndTilesetAssets(input.files, input.externalData),
    battlers,
    systemRelations,
    actions,
  ];
  const relations = {
    uses: relationGroups.flatMap((group) => group.uses),
    problems: relationGroups.flatMap((group) => group.problems),
  };
  const stops = [...collectDynamicTroopAssetStops(input.files), ...actions.stops];
  const uses = [...collectEventAssetUses(input.files), ...relations.uses];
  const system = JSON.parse(input.files.get("System.json")!);
  const findings: AssetFinding[] = relations.problems.map((problem) => ({
    code: "MV-ASSET-INVALID-DATA",
    reason: `${problem.dataPath}: ${problem.reason}`,
    failurePath: problem.dataPath,
    uses: [problem],
  }));
  const groups = new Map<string, typeof uses>();
  for (const use of uses) {
    const key = assetTargetKey(use);
    const group = groups.get(key) ?? [];
    group.push(use);
    groups.set(key, group);
  }
  for (const [, group] of [...groups].sort(([left], [right]) => left.localeCompare(right))) {
    const target = group[0]!;
    const flag =
      target.category === "image"
        ? "hasEncryptedImages"
        : target.category === "audio"
          ? "hasEncryptedAudio"
          : undefined;
    let finding: Omit<AssetFinding, "uses"> | undefined;
    if (flag !== undefined && system[flag] !== undefined && typeof system[flag] !== "boolean") {
      finding = {
        code: "MV-ASSET-INVALID-DATA",
        reason: `System.json.${flag} must be boolean when present; this use is unchecked.`,
        failurePath: `System.json.${flag}`,
      };
    } else if (flag !== undefined && system[flag] === true) {
      finding = {
        code: "MV-ASSET-UNSUPPORTED-ENCRYPTION",
        reason: `System.json.${flag} is true; ordinary editing files cannot be checked; this use is unchecked.`,
        failurePath: `System.json.${flag}`,
      };
    } else {
      const fact = await observeAssetFile(input.projectRoot, target);
      if (fact.code !== undefined)
        finding = {
          code: fact.code,
          reason: fact.reason!,
          target,
          extension: fact.extension,
          ...(fact.targetPath === undefined ? {} : { targetPath: fact.targetPath }),
          ...(fact.failurePath === undefined ? {} : { failurePath: fact.failurePath }),
        };
    }
    if (finding)
      findings.push({
        ...finding,
        extension:
          target.category === "image" ? ".png" : target.category === "audio" ? ".ogg" : ".webm",
        target,
        uses: group,
      });
  }
  const report = buildAssetReport(findings, input.exceptions ?? [], stops.length > 0);
  presentAssetCheck(report, stops, {
    commandName: input.commandName,
    projectRoot: input.projectRoot,
    ...(input.locations === undefined ? {} : { locations: input.locations }),
  });
}
