import { glob, lstat, realpath, stat } from "node:fs/promises";
import { dirname, isAbsolute, join, matchesGlob, relative, resolve } from "node:path";

import { isMissingFileError } from "./guards.js";

export const decompileCandidatesDirectoryName = "decompile-candidates";
export type DefinitionSourceDiscovery = {
  sourceRoot: string;
  sourceInclude: readonly string[];
  sourceExclude: readonly string[];
};

const key = (path: string) => (process.platform === "win32" ? path.toLowerCase() : path);
function within(root: string, path: string): boolean {
  const name = relative(key(root), key(path));
  return (
    name === "" ||
    (!isAbsolute(name) && name !== ".." && !name.startsWith("..\\") && !name.startsWith("../"))
  );
}

/** Project an absent descendant through its nearest real ancestor. */
export async function projectedRealpath(path: string): Promise<string> {
  let ancestor = resolve(path);
  while (true) {
    try {
      return resolve(await realpath(ancestor), relative(ancestor, path));
    } catch (error) {
      if (!isMissingFileError(error) || dirname(ancestor) === ancestor) throw error;
      ancestor = dirname(ancestor);
    }
  }
}

export function matchesSourceRules(name: string, discovery: DefinitionSourceDiscovery): boolean {
  const includes = discovery.sourceInclude.length ? discovery.sourceInclude : ["**/*"];
  if (!includes.some((pattern) => matchesGlob(name, pattern))) return false;
  let path = name;
  while (path !== "." && path !== dirname(path)) {
    if (discovery.sourceExclude.some((pattern) => matchesGlob(path, pattern))) return false;
    path = dirname(path);
  }
  return true;
}

async function protectedRoot(workspaceRoot: string): Promise<string> {
  const path = resolve(workspaceRoot, ".rpgmaker-event-dsl", decompileCandidatesDirectoryName);
  const info = await lstat(path).catch((error: unknown) => {
    if (isMissingFileError(error)) return null;
    throw error;
  });
  if (info && !info.isDirectory())
    throw new Error(`Unsupported Decompile isolation directory: ${path}`);
  return projectedRealpath(path);
}

export async function assertCandidateDiscoverable(
  workspaceRoot: string,
  discovery: DefinitionSourceDiscovery,
  files: readonly string[],
): Promise<void> {
  const root = resolve(workspaceRoot, discovery.sourceRoot),
    protectedPath = await protectedRoot(workspaceRoot);
  for (const file of files) {
    const name = relative(root, file);
    if (
      !within(root, file) ||
      !matchesSourceRules(name, discovery) ||
      within(protectedPath, await projectedRealpath(file))
    )
      throw new Error(`Decompile candidate is excluded from Definition Source Discovery: ${file}`);
  }
}

export async function discoverDefinitionFiles(
  workspaceRoot: string,
  discovery: DefinitionSourceDiscovery,
): Promise<string[]> {
  const root = resolve(workspaceRoot, discovery.sourceRoot),
    protectedPath = await protectedRoot(workspaceRoot);
  const files = new Map<string, string>();
  for (const pattern of discovery.sourceInclude.length ? discovery.sourceInclude : ["**/*"]) {
    for await (const name of glob(pattern, { cwd: root, exclude: discovery.sourceExclude })) {
      if (!matchesSourceRules(name, discovery)) continue;
      const path = join(root, name);
      const info = await stat(path).catch((error: unknown) => {
        if (isMissingFileError(error)) return null;
        throw error;
      });
      if (!info?.isFile()) continue;
      const physical = await realpath(path);
      if (within(protectedPath, physical)) continue;
      const old = files.get(key(physical));
      if (old === undefined || path < old) files.set(key(physical), path);
    }
  }
  return [...files.values()].sort();
}
