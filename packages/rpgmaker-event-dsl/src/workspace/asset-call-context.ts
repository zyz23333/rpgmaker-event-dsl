import type { CommonEventAssetCall } from "../validation/asset-common-calls.js";

export function renderAssetCallContext(calls: readonly CommonEventAssetCall[]): string {
  if (calls.length === 0) return "";
  return `\nDirect Common Event calls:\n${calls
    .map((call) => `  - ${call.caller} ${call.nativePath} -> ${call.target}`)
    .join("\n")}`;
}
