import type { CommonEventAssetCall } from "../validation/asset-common-calls.js";
import { renderAuthoredAssetLocation, type AuthoredAssetLocation } from "./asset-provenance.js";

export function renderAssetCallContext(
  calls: readonly CommonEventAssetCall[],
  locations?: ReadonlyMap<string, AuthoredAssetLocation>,
): string {
  if (calls.length === 0) return "";
  return `\nDirect Common Event calls:\n${calls
    .map(
      (call) =>
        `  - ${call.caller} ${call.nativePath} -> ${call.target}${renderAuthoredAssetLocation(call.nativePath, locations)}`,
    )
    .join("\n")}`;
}
