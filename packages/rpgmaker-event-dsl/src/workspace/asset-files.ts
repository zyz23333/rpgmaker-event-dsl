import { lstat, readdir, realpath } from "node:fs/promises";
import { join } from "node:path";
import type { AssetTarget } from "../validation/asset-uses.js";

export type AssetFileProblem =
  | "MV-ASSET-MISSING-DIRECTORY"
  | "MV-ASSET-MISSING-FILE"
  | "MV-ASSET-NAME-MISMATCH"
  | "MV-ASSET-PATH-TYPE"
  | "MV-ASSET-UNSUPPORTED-NAME"
  | "MV-ASSET-UNSUPPORTED-LINK"
  | "MV-ASSET-QUERY-FAILED";
export type AssetFileFact = {
  target: AssetTarget;
  code?: AssetFileProblem;
  extension: string;
  targetPath?: string;
  failurePath?: string;
  reason?: string;
};

export async function observeAssetFile(
  projectRoot: string,
  target: AssetTarget,
): Promise<AssetFileFact> {
  const extension =
    target.category === "image" ? ".png" : target.category === "audio" ? ".ogg" : ".webm";
  const filename = `${target.name}${extension}`;
  const base = { target, extension };
  if (
    /[<>:"/\\|?*]/u.test(filename) ||
    Array.from(filename).some((character) => character.charCodeAt(0) < 32) ||
    /^(?:CON|PRN|AUX|NUL|COM[1-9¹²³]|LPT[1-9¹²³])[ ]*(?:\.|$)/iu.test(filename) ||
    (target.category !== "audio" && /[%#]/u.test(target.name))
  )
    return {
      ...base,
      code: "MV-ASSET-UNSUPPORTED-NAME",
      reason:
        "Saved name is outside supported Windows single-component names; this use is unchecked.",
    };
  let root: string;
  try {
    root = await realpath(projectRoot);
  } catch (error) {
    return {
      ...base,
      code: "MV-ASSET-QUERY-FAILED",
      failurePath: projectRoot,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
  const directories =
    target.category === "movie" ? [] : [target.category === "image" ? "img" : "audio"];
  const components = [...directories, target.folder, filename];
  const targetPath = join(root, ...components);
  let parent = root;
  for (const [index, component] of components.entries()) {
    const path = join(parent, component);
    const final = index === components.length - 1;
    let queriedPath = parent;
    try {
      const entries = await readdir(parent, { withFileTypes: true });
      const entry = entries.find((candidate) => candidate.name === component);
      if (entry === undefined) {
        const approximate = entries.filter(
          (candidate) => candidate.name.toLowerCase() === component.toLowerCase(),
        );
        return {
          ...base,
          targetPath,
          failurePath: path,
          code: approximate.length
            ? "MV-ASSET-NAME-MISMATCH"
            : final
              ? "MV-ASSET-MISSING-FILE"
              : "MV-ASSET-MISSING-DIRECTORY",
          reason: approximate.length
            ? `Exact name required; found ${approximate
                .map((candidate) => candidate.name)
                .sort()
                .join(", ")}.`
            : "Required exact directory entry is absent.",
        };
      }
      queriedPath = path;
      const metadata = await lstat(path);
      if (
        (
          [
            "isFile",
            "isDirectory",
            "isSymbolicLink",
            "isBlockDevice",
            "isCharacterDevice",
            "isFIFO",
            "isSocket",
          ] as const
        ).some((kind) => entry[kind]() !== metadata[kind]())
      )
        return {
          ...base,
          targetPath,
          failurePath: path,
          code: "MV-ASSET-QUERY-FAILED",
          reason:
            "Directory enumeration and metadata disagree about the entry type; this query is inconclusive.",
        };
      if (metadata.isSymbolicLink())
        return {
          ...base,
          targetPath,
          failurePath: path,
          code: "MV-ASSET-UNSUPPORTED-LINK",
          reason: "Links below Project Root are unsupported; this use is unchecked.",
        };
      if (final ? !metadata.isFile() : !metadata.isDirectory())
        return {
          ...base,
          targetPath,
          failurePath: path,
          code: "MV-ASSET-PATH-TYPE",
          reason: final ? "Expected ordinary file." : "Expected directory.",
        };
      parent = path;
    } catch (error) {
      return {
        ...base,
        targetPath,
        failurePath: queriedPath,
        code: "MV-ASSET-QUERY-FAILED",
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  }
  return { ...base, targetPath };
}
