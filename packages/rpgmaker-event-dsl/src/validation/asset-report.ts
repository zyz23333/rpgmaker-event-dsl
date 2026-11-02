import type { AssetCheckException } from "./asset-exceptions.js";
import { assetUseLevel } from "./asset-policy.js";
import { assetTargetKey, type EventAssetUse } from "./asset-uses.js";
import type { AssetOrigin } from "./asset-dependencies.js";

export type AssetLevel = "error" | "warning";
export type AssetFinding = {
  code: string;
  reason: string;
  uses: readonly AssetOrigin[];
  target?: EventAssetUse;
  targetPath?: string;
  failurePath?: string;
  extension?: string;
};
export type AssetFindingGroup = AssetFinding & {
  level: AssetLevel;
  members: {
    origin: AssetOrigin;
    baseLevel: AssetLevel;
    effectiveLevel: AssetLevel;
    exceptionReason?: string;
  }[];
};
const eligible = new Set([
  "MV-ASSET-MISSING-DIRECTORY",
  "MV-ASSET-MISSING-FILE",
  "MV-ASSET-NAME-MISMATCH",
  "MV-ASSET-PATH-TYPE",
]);
const incompleteCodes = new Set([
  "MV-ASSET-QUERY-FAILED",
  "MV-ASSET-INVALID-DATA",
  "MV-ASSET-UNSUPPORTED-NAME",
  "MV-ASSET-UNSUPPORTED-LINK",
  "MV-ASSET-UNSUPPORTED-ENCRYPTION",
]);

/** Policy is independent of observation; no file facts or report are persisted. */
export function buildAssetReport(
  findings: readonly AssetFinding[],
  exceptions: readonly AssetCheckException[],
  hasDynamicStops = false,
) {
  const used = new Set<number>();
  const grouped = new Map<string, AssetFinding>();
  for (const finding of findings) {
    const key = JSON.stringify([
      finding.target ? assetTargetKey(finding.target) : (finding.failurePath ?? finding.reason),
      finding.code,
    ]);
    const previous = grouped.get(key);
    grouped.set(
      key,
      previous ? { ...previous, uses: [...previous.uses, ...finding.uses] } : finding,
    );
  }
  const groups: AssetFindingGroup[] = [...grouped]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, finding]) => {
      const exceptionIndex =
        finding.target === undefined
          ? -1
          : exceptions.findIndex(
              (entry) => assetTargetKey(entry) === assetTargetKey(finding.target!),
            );
      const members = [...finding.uses]
        .sort((left, right) =>
          JSON.stringify([left.identity, left.nativePath, left.dependencyChain]).localeCompare(
            JSON.stringify([right.identity, right.nativePath, right.dependencyChain]),
          ),
        )
        .map((origin) => {
          const baseLevel = assetUseLevel(origin, finding.code);
          const downgrade =
            baseLevel === "error" && eligible.has(finding.code) && exceptionIndex >= 0;
          if (downgrade) used.add(exceptionIndex);
          return {
            origin,
            baseLevel,
            effectiveLevel: downgrade ? ("warning" as const) : baseLevel,
            ...(eligible.has(finding.code) && exceptionIndex >= 0
              ? { exceptionReason: exceptions[exceptionIndex]!.reason }
              : {}),
          };
        });
      return {
        ...finding,
        level: members.some((member) => member.effectiveLevel === "error") ? "error" : "warning",
        members,
      };
    });
  const incomplete =
    hasDynamicStops || findings.some((finding) => incompleteCodes.has(finding.code));
  const indeterminateScope =
    hasDynamicStops ||
    findings.some((finding) => incompleteCodes.has(finding.code) && finding.target === undefined);
  const uncheckedTargets = new Set(
    findings.flatMap((finding) =>
      incompleteCodes.has(finding.code) && finding.target !== undefined
        ? [assetTargetKey(finding.target)]
        : [],
    ),
  );
  const ineffective = indeterminateScope
    ? []
    : exceptions.flatMap((entry, index) =>
        used.has(index) || uncheckedTargets.has(assetTargetKey(entry)) ? [] : [{ index, entry }],
      );
  const files = new Set(
    groups.flatMap((group) => (group.targetPath === undefined ? [] : [group.targetPath])),
  );
  const uses = new Set(
    groups.flatMap((group) =>
      group.members.map(({ origin }) =>
        JSON.stringify([origin.identity, origin.nativePath, origin.dependencyChain]),
      ),
    ),
  );
  return {
    groups,
    ineffective,
    incomplete,
    hasErrors: groups.some((group) => group.level === "error"),
    statistics: { groups: groups.length, files: files.size, uses: uses.size },
  };
}
