import { assetTargetKey, collectEventAssetUses } from "../validation/asset-uses.js";
import { observeAssetFile } from "./asset-files.js";
import { assetUseLevel } from "../validation/asset-policy.js";

/** Live metadata is transient and deliberately absent from Compile Baseline. */
export async function checkEventAssets(input: {
  projectRoot: string;
  files: ReadonlyMap<string, string>;
  commandName: string;
}): Promise<void> {
  const uses = collectEventAssetUses(input.files);
  const system = JSON.parse(input.files.get("System.json")!);
  const failures: string[] = [];
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
      const rendered = `${level} ${message}\n  ${target.category}/${target.folder} ${JSON.stringify(target.name)}; ${group.length} use(s)\n${group.map((use) => `  - ${assetUseLevel(use, code!)} ${use.identity} ${use.nativePath}${use.relatedNativePaths.length ? `; related: ${use.relatedNativePaths.join(", ")}` : ""}${use.inactive ? `; inactive: ${use.inactive}` : ""}${use.candidate ? `; candidate: ${use.candidate}` : ""}`).join("\n")}`;
      if (level === "error") failures.push(rendered);
      else console.error(`${input.commandName} asset check warning:\n${rendered}`);
    }
  }
  if (failures.length)
    throw new Error(`${input.commandName} asset check failed:\n${failures.join("\n")}`);
}
