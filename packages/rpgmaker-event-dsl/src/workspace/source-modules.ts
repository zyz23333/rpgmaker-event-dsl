import { dirname, isAbsolute, relative, resolve } from "node:path";

import * as ts from "typescript";

import { decompileCandidatesDirectoryName } from "./source-discovery.js";
import type { TypeInputCapture } from "./type-inputs.js";

function within(root: string, path: string): boolean {
  const name = relative(root, path);
  return !isAbsolute(name) && name !== ".." && !name.startsWith("..\\") && !name.startsWith("../");
}

/** Resolve a possibly absent directory using the same observations as compilation. */
function physicalDirectory(path: string, capture: TypeInputCapture): string {
  let ancestor = resolve(path);
  while (!capture.directoryExists(ancestor)) {
    const parent = dirname(ancestor);
    if (parent === ancestor) throw new Error(`Cannot resolve source directory: ${path}`);
    ancestor = parent;
  }
  return resolve(capture.realpath(ancestor), relative(ancestor, path));
}

/** Resolve only local source implementations, without executing a host module. */
export function resolveLocalValueModule(
  name: string,
  containingFile: string,
  capture: TypeInputCapture,
  sourceRoot: string,
): string {
  if (!name.startsWith("./") && !name.startsWith("../")) {
    throw new Error(`Unsupported import source: ${name}`);
  }
  const resolved = ts.resolveModuleName(
    name,
    containingFile,
    { module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext },
    capture,
    undefined,
    undefined,
    ts.ModuleKind.ESNext,
  ).resolvedModule;
  if (
    !resolved ||
    !resolved.resolvedFileName.endsWith(".ts") ||
    resolved.resolvedFileName.endsWith(".d.ts")
  ) {
    throw new Error(`Local value import must resolve to a TypeScript source file: ${name}`);
  }
  const physical = capture.realpath(resolved.resolvedFileName);
  if (!within(physicalDirectory(sourceRoot, capture), physical)) {
    throw new Error(`Local value import is outside sourceRoot: ${name}`);
  }
  const isolation = physicalDirectory(
    resolve(capture.currentDirectory, ".rpgmaker-event-dsl", decompileCandidatesDirectoryName),
    capture,
  );
  if (within(isolation, physical)) {
    throw new Error(`Local value import targets the Decompile isolation area: ${name}`);
  }
  return resolved.resolvedFileName;
}
