import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute, join, parse, relative, resolve } from "node:path";

import type { DecompileFile } from "../decompiler/project.js";
import { isMissingFileError } from "./guards.js";
import { workspaceStateDirectoryName } from "./state.js";
import { decompileCandidatesDirectoryName } from "./source-discovery.js";

export function decompileDestination(workspaceRoot: string, sourceRoot: string): string {
  return resolve(workspaceRoot, sourceRoot, "decompiled");
}

export async function assertDecompileDestinationAbsent(destination: string): Promise<void> {
  const existing = await lstat(destination).catch((error: unknown) => {
    if (isMissingFileError(error)) return null;
    throw error;
  });
  if (existing !== null) throw new Error(`Decompile destination already exists: ${destination}`);
}

type PathFact = { path: string; physical: string; identity: string };
export type DecompilePublicationPaths = {
  facts: readonly PathFact[];
  physicalParent: string;
  physicalProtected: string;
};

async function pathFacts(paths: readonly string[]): Promise<PathFact[]> {
  const facts = new Map<string, PathFact>();
  for (const path of paths) {
    let ancestor = resolve(path);
    while (true) {
      const physical = await realpath(ancestor);
      const info = await lstat(ancestor);
      if (!info.isDirectory() && !info.isSymbolicLink())
        throw new Error(`Unsupported directory: ${ancestor}`);
      facts.set(ancestor.toLowerCase(), {
        path: ancestor,
        physical,
        identity: `${info.dev}:${info.ino}:${info.mode}`,
      });
      // Pin both the logical reparse entry and every physical ancestor it names.
      let physicalAncestor = physical;
      while (true) {
        const physicalInfo = await lstat(physicalAncestor);
        facts.set(physicalAncestor.toLowerCase(), {
          path: physicalAncestor,
          physical: await realpath(physicalAncestor),
          identity: `${physicalInfo.dev}:${physicalInfo.ino}:${physicalInfo.mode}`,
        });
        const parent = dirname(physicalAncestor);
        if (parent === physicalAncestor) break;
        physicalAncestor = parent;
      }
      const parent = dirname(ancestor);
      if (parent === ancestor) break;
      ancestor = parent;
    }
  }
  return [...facts.values()].sort((a, b) => a.path.localeCompare(b.path));
}

async function assertPathFacts(facts: readonly PathFact[]): Promise<void> {
  for (const fact of facts) {
    const info = await lstat(fact.path);
    if (
      (await realpath(fact.path)) !== fact.physical ||
      `${info.dev}:${info.ino}:${info.mode}` !== fact.identity
    )
      throw new Error(`Decompile publication path changed: ${fact.path}`);
  }
}

/** One Windows same-filesystem Directory.Move. Pins survive the final Node validation. */
async function moveDirectory(
  candidate: string,
  destination: string,
  facts: readonly PathFact[],
  validate: () => Promise<void>,
): Promise<void> {
  const data = Buffer.from(
    JSON.stringify({ candidate, destination, paths: facts.map((fact) => fact.path) }),
    "utf8",
  ).toString("base64");
  const script = `$ErrorActionPreference = 'Stop'
$handles = [System.Collections.Generic.List[object]]::new()
try {
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using Microsoft.Win32.SafeHandles;
public static class MvDecompilePin {
 [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)]
 public static extern SafeFileHandle CreateFileW(string name, uint access, uint share, IntPtr security, uint creation, uint flags, IntPtr template);
}
'@
$plan = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${data}')) | ConvertFrom-Json
foreach ($path in $plan.paths) {
 $handle = [MvDecompilePin]::CreateFileW($path, 1, 3, [IntPtr]::Zero, 3, 0x02200000, [IntPtr]::Zero)
 if ($handle.IsInvalid) { throw ('Cannot pin publication path: ' + $path + ' win32=' + [Runtime.InteropServices.Marshal]::GetLastWin32Error()) }
 $handles.Add($handle)
}
[Console]::Out.WriteLine('PINNED')
if ([Console]::In.ReadLine() -ne 'publish') { throw 'Publication cancelled before move' }
[System.IO.Directory]::Move($plan.candidate, $plan.destination)
[Console]::Out.WriteLine('PUBLISHED')
} catch { [Console]::Error.WriteLine($_.Exception.ToString()); exit 1 }
finally { foreach ($handle in $handles) { $handle.Dispose() } }
`;
  await new Promise<void>((done, reject) => {
    const child = spawn(
      "powershell.exe",
      [
        "-NoLogo",
        "-NoProfile",
        "-NonInteractive",
        "-EncodedCommand",
        Buffer.from(script, "utf16le").toString("base64"),
      ],
      { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] },
    );
    let output = "",
      errors = "",
      validating = false,
      failure: unknown;
    const timer = setTimeout(() => {
      failure = new Error("Decompile directory publication timed out.");
      child.kill();
    }, 30_000);
    child.stderr.on("data", (chunk) => {
      errors += String(chunk);
    });
    child.stdout.on("data", (chunk) => {
      output += String(chunk);
      if (output.includes("PINNED") && !validating) {
        validating = true;
        void (async () => {
          try {
            await assertPathFacts(facts);
            await validate();
            child.stdin.end("publish\n");
          } catch (error) {
            failure = error;
            child.stdin.end("cancel\n");
          }
        })();
      }
    });
    child.stdin.on("error", (error) => {
      failure ??= error;
    });
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("close", (code) => {
      clearTimeout(timer);
      if (failure) reject(failure);
      else if (code !== 0 || !output.includes("PUBLISHED"))
        reject(new Error(`Decompile directory publication failed: ${errors}`));
      else done();
    });
  });
}

export async function publishDecompileCandidate(options: {
  destination: string;
  files: readonly DecompileFile[];
  assertInputsUnchanged: () => Promise<void>;
  paths: DecompilePublicationPaths;
}): Promise<void> {
  if (process.platform !== "win32")
    throw new Error(
      "Complete non-overwriting Decompile publication requires Windows directory move support.",
    );
  const { destination, files } = options;
  await assertDecompileDestinationAbsent(destination);
  const { facts, physicalParent, physicalProtected } = options.paths;
  await assertPathFacts(facts);
  const candidate = await mkdtemp(join(physicalProtected, "candidate-"));
  const candidateInfo = await lstat(candidate);
  const expected = new Map<string, string>();
  for (const file of files) {
    const name = relative(destination, file.path);
    if (
      !name ||
      isAbsolute(name) ||
      name === ".." ||
      name.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)
    )
      throw new Error(`Invalid Decompile candidate path: ${file.path}`);
    const target = join(candidate, name);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, file.content, { encoding: "utf8", flag: "wx" });
    expected.set(name, createHash("sha256").update(file.content).digest("hex"));
  }
  const validate = async () => {
    await assertDecompileDestinationAbsent(destination);
    const currentInfo = await lstat(candidate);
    if (
      !currentInfo.isDirectory() ||
      currentInfo.dev !== candidateInfo.dev ||
      currentInfo.ino !== candidateInfo.ino
    )
      throw new Error("Decompile candidate directory changed.");
    const names: string[] = [];
    async function inspect(directory: string) {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) await inspect(path);
        else if (entry.isFile()) names.push(relative(candidate, path));
        else throw new Error(`Unexpected Decompile candidate entry: ${path}`);
      }
    }
    await inspect(candidate);
    if (JSON.stringify(names.sort()) !== JSON.stringify([...expected.keys()].sort()))
      throw new Error("Decompile candidate membership changed.");
    for (const [name, hash] of expected)
      if (
        createHash("sha256")
          .update(await readFile(join(candidate, name)))
          .digest("hex") !== hash
      )
        throw new Error("Decompile candidate bytes changed.");
    await options.assertInputsUnchanged();
  };
  // Remnants are permanently excluded by Discovery. Never delete an uncertain final destination.
  await moveDirectory(candidate, join(physicalParent, "decompiled"), facts, validate);
}

export async function captureDecompilePublicationPaths(
  workspaceRoot: string,
  destination: string,
): Promise<DecompilePublicationPaths> {
  if (process.platform !== "win32")
    throw new Error(
      "Complete non-overwriting Decompile publication requires Windows directory move support.",
    );
  const parent = dirname(destination);
  // The final parent must already be established: preparation never leaves a partial source tree.
  const parentInfo = await stat(parent).catch((error: unknown) => {
    if (isMissingFileError(error)) return null;
    throw error;
  });
  if (!parentInfo?.isDirectory())
    throw new Error(`Decompile sourceRoot must be an existing directory: ${parent}`);
  const protectedRoot = resolve(
    workspaceRoot,
    workspaceStateDirectoryName,
    decompileCandidatesDirectoryName,
  );
  await mkdir(protectedRoot, { recursive: true });
  if (!(await lstat(protectedRoot)).isDirectory())
    throw new Error(`Unsupported Decompile isolation directory: ${protectedRoot}`);
  const physicalParent = await realpath(parent),
    physicalProtected = await realpath(protectedRoot);
  if (
    parse(physicalParent).root.toLowerCase() !== parse(physicalProtected).root.toLowerCase() ||
    (await stat(parent)).dev !== (await stat(protectedRoot)).dev
  )
    throw new Error(
      "Decompile requires a same-filesystem isolated candidate and destination; cross-volume publication is unsupported.",
    );
  return { facts: await pathFacts([parent, protectedRoot]), physicalParent, physicalProtected };
}
