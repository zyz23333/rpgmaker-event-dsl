import { assetTargetKey, collectEventAssetUses } from "../validation/asset-uses.js";
import { collectCommonEventCalls } from "../validation/asset-common-calls.js";
import { renderAssetCallContext } from "./asset-call-context.js";
import { observeAssetFile } from "./asset-files.js";
import { buildAssetReport, type AssetFinding } from "../validation/asset-report.js";
import type { AssetCheckException } from "../validation/asset-exceptions.js";
import { collectAnimationAndTilesetAssets } from "../validation/asset-dependencies.js";
import type { AssetOrigin } from "../validation/asset-dependencies.js";
import { collectMapAssetRelations } from "../validation/asset-map-relations.js";
import { collectSystemAssets } from "../validation/asset-system-relations.js";
import { collectActorEnemyAssets } from "../validation/asset-actor-enemy-relations.js";
import { renderAuthoredAssetLocation, type AuthoredAssetLocation } from "./asset-provenance.js";

function renderOrigin(use: AssetOrigin): string {
  return `${use.identity} ${use.nativePath}${use.relatedNativePaths.length ? `; related: ${use.relatedNativePaths.join(", ")}` : ""}${use.dependencyChain.length ? `; chain: ${use.dependencyChain.map((step) => `${step.data}${step.id === undefined ? "" : `[${step.id}]`}.${step.field} (${step.relationship})`).join(" -> ")}` : ""}${use.conditions.length ? `; conditions: ${use.conditions.join(" ")}` : ""}${use.inactive ? `; inactive: ${use.inactive}` : ""}${use.candidate ? `; candidate: ${use.candidate}` : ""}`;
}

/** Live metadata is transient and deliberately absent from Compile Baseline. */
export async function checkEventAssets(input: {
  projectRoot: string;
  files: ReadonlyMap<string, string>;
  externalData: ReadonlyMap<string, string | Uint8Array>;
  commandName: string;
  exceptions?: readonly AssetCheckException[];
  locations?: ReadonlyMap<string, AuthoredAssetLocation>;
}): Promise<void> {
  const mapRelations = collectMapAssetRelations(input.files, input.externalData);
  const systemRelations = collectSystemAssets(input.files, input.externalData);
  const relationGroups = [
    collectAnimationAndTilesetAssets(input.files, input.externalData),
    collectActorEnemyAssets(input.files, input.externalData),
    mapRelations,
    systemRelations,
  ];
  const relations = {
    uses: relationGroups.flatMap((group) => group.uses),
    problems: relationGroups.flatMap((group) => group.problems),
  };
  const stops = [...mapRelations.stops, ...systemRelations.stops];
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
    if (finding) findings.push({ ...finding, target, uses: group });
  }
  const origin = (value: AssetOrigin) =>
    renderOrigin(value) + renderAuthoredAssetLocation(value.nativePath, input.locations);
  const report = buildAssetReport(findings, input.exceptions ?? [], stops.length > 0);
  const parts = report.groups.map(
    (group) =>
      `${group.level} ${group.code}: ${group.reason} Project Root: ${input.projectRoot}${group.extension === undefined ? "" : `; required extension: ${group.extension}`}${group.targetPath === undefined ? "" : `; target: ${group.targetPath}`}${group.failurePath === undefined ? "" : `; failed at: ${group.failurePath}`}\n${group.target === undefined ? "" : `  ${group.target.category}/${group.target.folder} ${JSON.stringify(group.target.name)}; ${group.members.length} use(s)\n`}${group.members.map((member) => `  - ${member.effectiveLevel} ${origin(member.origin)}; base: ${member.baseLevel}; effective: ${member.effectiveLevel}${member.exceptionReason === undefined ? "" : `; exception reason: ${member.exceptionReason}`}`).join("\n")}`,
  );
  parts.push(
    ...stops.map((stop) => `info MV-ASSET-DYNAMIC-STOP: ${stop.reason}\n  - ${origin(stop)}`),
  );
  parts.push(
    ...report.ineffective.map(
      ({ index, entry }) =>
        `warning MV-ASSET-INEFFECTIVE-EXCEPTION: assetCheckExceptions[${index}] ${entry.category}/${entry.folder} ${JSON.stringify(entry.name)} downgraded no error; reason: ${entry.reason}`,
    ),
  );
  if (parts.length)
    parts.push(
      `${report.statistics.groups} problem group(s), ${report.statistics.files} problem file(s), ${report.statistics.uses} affected use(s). Coverage: ${report.incomplete ? "incomplete; named relationships or file checks remain unchecked" : "complete"}.`,
    );
  const calls = renderAssetCallContext(collectCommonEventCalls(input.files), input.locations);
  if (calls) parts.push(calls.trimStart());
  if (report.hasErrors)
    throw new Error(`${input.commandName} asset check failed:\n${parts.join("\n")}`);
  if (parts.length)
    console.error(
      `${input.commandName} asset check ${report.groups.length || report.ineffective.length ? "warning" : "info"}:\n${parts.join("\n")}`,
    );
}
