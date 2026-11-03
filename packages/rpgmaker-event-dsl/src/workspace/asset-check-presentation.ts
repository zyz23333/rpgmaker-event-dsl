import type { AssetDynamicStop, AssetOrigin } from "../validation/asset-dependencies.js";
import type { buildAssetReport } from "../validation/asset-report.js";
import { renderAuthoredAssetLocation, type AuthoredAssetLocation } from "./asset-provenance.js";

type AssetReport = ReturnType<typeof buildAssetReport>;

function renderOrigin(
  use: AssetOrigin,
  locations?: ReadonlyMap<string, AuthoredAssetLocation>,
): string {
  return `${use.identity} ${use.nativePath}${use.relatedNativePaths.length ? `; related: ${use.relatedNativePaths.join(", ")}` : ""}${use.dependencyChain.length ? `; chain: ${use.dependencyChain.map((step) => `${step.data}${step.id === undefined ? "" : `[${step.id}]`}.${step.field} (${step.relationship})`).join(" -> ")}` : ""}${use.conditions.length ? `; conditions: ${use.conditions.join(" ")}` : ""}${use.inactive ? `; inactive: ${use.inactive}` : ""}${renderAuthoredAssetLocation(use.nativePath, locations)}`;
}

function renderGroup(
  group: AssetReport["groups"][number],
  projectRoot: string,
  locations?: ReadonlyMap<string, AuthoredAssetLocation>,
): string {
  return `${group.level} ${group.code}: ${group.reason} Project Root: ${projectRoot}${group.extension === undefined ? "" : `; required extension: ${group.extension}`}${group.targetPath === undefined ? "" : `; target: ${group.targetPath}`}${group.failurePath === undefined ? "" : `; failed at: ${group.failurePath}`}\n${group.target === undefined ? "" : `  ${group.target.category}/${group.target.folder} ${JSON.stringify(group.target.name)}; ${group.members.length} use(s)\n`}${group.members.map((member) => `  - ${member.effectiveLevel} ${renderOrigin(member.origin, locations)}; base: ${member.baseLevel}; effective: ${member.effectiveLevel}${member.exceptionReason === undefined ? "" : `; exception reason: ${member.exceptionReason}`}`).join("\n")}`;
}

/** CLI wording and error delivery for a completed asset check. */
export function presentAssetCheck(
  report: AssetReport,
  stops: readonly AssetDynamicStop[],
  input: {
    commandName: string;
    projectRoot: string;
    locations?: ReadonlyMap<string, AuthoredAssetLocation>;
  },
): void {
  const groupParts = report.groups.map((group) =>
    renderGroup(group, input.projectRoot, input.locations),
  );
  const errors = groupParts.filter((_, index) => report.groups[index]!.level === "error");
  const parts = groupParts.filter((_, index) => report.groups[index]!.level === "warning");
  parts.push(
    ...stops.map(
      (stop) =>
        `info MV-ASSET-DYNAMIC-STOP: ${stop.reason}\n  - ${renderOrigin(stop, input.locations)}`,
    ),
  );
  const summary = `Coverage: ${report.incomplete ? "incomplete; named relationships or file checks remain unchecked" : "complete"}.`;
  const finalParts = report.hasErrors ? errors : parts;
  if (groupParts.length || stops.length) finalParts.push(summary);
  if (parts.length)
    console.error(
      `${input.commandName} asset check ${report.groups.some((group) => group.level === "warning") ? "warning" : "info"}:\n${parts.join("\n")}`,
    );
  if (report.hasErrors)
    throw new Error(`${input.commandName} asset check failed:\n${errors.join("\n")}`);
}
