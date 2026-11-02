import { assetTargetKey, collectEventAssetUses } from "../validation/asset-uses.js";
import { collectCommonEventCalls } from "../validation/asset-common-calls.js";
import { renderAssetCallContext } from "./asset-call-context.js";
import { observeAssetFile } from "./asset-files.js";
import { assetUseLevel } from "../validation/asset-policy.js";
import { collectAnimationAndTilesetAssets } from "../validation/asset-dependencies.js";
import type { AssetOrigin } from "../validation/asset-dependencies.js";
import { collectMapAssetRelations } from "../validation/asset-map-relations.js";
import { collectSystemAssets } from "../validation/asset-system-relations.js";
import { collectActorEnemyAssets } from "../validation/asset-actor-enemy-relations.js";
import { collectForcedActionAssets } from "../validation/asset-action-relations.js";

function renderOrigin(use: AssetOrigin): string {
  return `${use.identity} ${use.nativePath}${use.relatedNativePaths.length ? `; related: ${use.relatedNativePaths.join(", ")}` : ""}${use.dependencyChain.length ? `; chain: ${use.dependencyChain.map((step) => `${step.data}${step.id === undefined ? "" : `[${step.id}]`}.${step.field} (${step.relationship})`).join(" -> ")}` : ""}${use.conditions.length ? `; conditions: ${use.conditions.join(" ")}` : ""}${use.inactive ? `; inactive: ${use.inactive}` : ""}${use.candidate ? `; candidate: ${use.candidate}` : ""}`;
}

/** Live metadata is transient and deliberately absent from Compile Baseline. */
export async function checkEventAssets(input: {
  projectRoot: string;
  files: ReadonlyMap<string, string>;
  externalData: ReadonlyMap<string, string | Uint8Array>;
  commandName: string;
}): Promise<void> {
  const actions = collectForcedActionAssets(input.files, input.externalData);
  const mapRelations = collectMapAssetRelations(input.files, input.externalData);
  const systemRelations = collectSystemAssets(input.files, input.externalData);
  const relationGroups = [
    collectAnimationAndTilesetAssets(input.files, input.externalData),
    collectActorEnemyAssets(input.files, input.externalData),
    mapRelations,
    systemRelations,
    actions,
  ];
  const relations = {
    uses: relationGroups.flatMap((group) => group.uses),
    problems: relationGroups.flatMap((group) => group.problems),
  };
  for (const stop of [...mapRelations.stops, ...systemRelations.stops, ...actions.stops])
    console.error(
      `${input.commandName} asset check info:\ninfo MV-ASSET-DYNAMIC-STOP: ${stop.reason}\n  - ${renderOrigin(stop)}`,
    );
  const uses = [...collectEventAssetUses(input.files), ...relations.uses];
  const system = JSON.parse(input.files.get("System.json")!);
  const failures: string[] = relations.problems.map(
    (problem) =>
      `error MV-ASSET-INVALID-DATA: ${problem.dataPath}: ${problem.reason}\n  - ${renderOrigin(problem)}`,
  );
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
    let message: string | undefined;
    let code: string | undefined;
    if (flag !== undefined && system[flag] !== undefined && typeof system[flag] !== "boolean") {
      code = "MV-ASSET-INVALID-DATA";
      message = `MV-ASSET-INVALID-DATA: System.json.${flag} must be boolean when present; this use is unchecked.`;
    } else if (flag !== undefined && system[flag] === true) {
      code = "MV-ASSET-UNSUPPORTED-ENCRYPTION";
      message = `MV-ASSET-UNSUPPORTED-ENCRYPTION: System.json.${flag} is true; ordinary editing files cannot be checked; this use is unchecked.`;
    } else {
      const fact = await observeAssetFile(input.projectRoot, target);
      code = fact.code;
      if (fact.code !== undefined)
        message = `${fact.code}: ${fact.reason} Project Root: ${input.projectRoot}; required extension: ${fact.extension}${fact.targetPath === undefined ? "" : `; target: ${fact.targetPath}`}${fact.failurePath === undefined ? "" : `; failed at: ${fact.failurePath}`}`;
    }
    if (message !== undefined && code !== undefined) {
      const level = group.some((use) => assetUseLevel(use, code!) === "error")
        ? "error"
        : "warning";
      const rendered = `${level} ${message}\n  ${target.category}/${target.folder} ${JSON.stringify(target.name)}; ${group.length} use(s)\n${group.map((use) => `  - ${assetUseLevel(use, code!)} ${renderOrigin(use)}`).join("\n")}`;
      if (level === "error") failures.push(rendered);
      else console.error(`${input.commandName} asset check warning:\n${rendered}`);
    }
  }
  if (failures.length)
    throw new Error(
      `${input.commandName} asset check failed:\n${failures.join("\n")}${renderAssetCallContext([...collectCommonEventCalls(input.files), ...actions.calls])}`,
    );
}
