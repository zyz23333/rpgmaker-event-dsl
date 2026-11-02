import { assetTargetKey, collectEventAssetUses } from "../validation/asset-uses.js";
import { collectCommonEventCalls } from "../validation/asset-common-calls.js";
import { renderAssetCallContext } from "./asset-call-context.js";
import { observeAssetFile } from "./asset-files.js";

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
    if (flag !== undefined && system[flag] !== undefined && typeof system[flag] !== "boolean")
      message = `MV-ASSET-INVALID-DATA: System.json.${flag} must be boolean when present; this use is unchecked.`;
    else if (flag !== undefined && system[flag] === true)
      message = `MV-ASSET-UNSUPPORTED-ENCRYPTION: System.json.${flag} is true; ordinary editing files cannot be checked.`;
    else {
      const fact = await observeAssetFile(input.projectRoot, target);
      if (fact.code !== undefined)
        message = `${fact.code}: ${fact.reason} Project Root: ${input.projectRoot}; required extension: ${fact.extension}${fact.targetPath === undefined ? "" : `; target: ${fact.targetPath}`}${fact.failurePath === undefined ? "" : `; failed at: ${fact.failurePath}`}`;
    }
    if (message !== undefined)
      failures.push(
        `${message}\n  ${target.category}/${target.folder} ${JSON.stringify(target.name)}; ${group.length} use(s)\n${group.map((use) => `  - ${use.identity} ${use.nativePath}`).join("\n")}`,
      );
  }
  if (failures.length)
    throw new Error(
      `${input.commandName} asset check failed:\n${failures.join("\n")}${renderAssetCallContext(collectCommonEventCalls(input.files))}`,
    );
}
