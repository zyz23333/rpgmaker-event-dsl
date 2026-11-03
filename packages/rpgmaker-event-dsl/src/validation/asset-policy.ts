import type { AssetOrigin } from "./asset-dependencies.js";

const conditionalFileProblems = new Set([
  "MV-ASSET-MISSING-DIRECTORY",
  "MV-ASSET-MISSING-FILE",
  "MV-ASSET-NAME-MISMATCH",
  "MV-ASSET-PATH-TYPE",
  "MV-ASSET-UNSUPPORTED-NAME",
  "MV-ASSET-UNSUPPORTED-LINK",
  "MV-ASSET-UNSUPPORTED-ENCRYPTION",
]);

export function assetUseLevel(use: AssetOrigin, code: string): "error" | "warning" {
  return (use.inactive !== undefined || use.candidate !== undefined) &&
    conditionalFileProblems.has(code)
    ? "warning"
    : "error";
}
