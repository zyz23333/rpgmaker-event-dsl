import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import * as ts from "typescript";
import { z } from "zod";

// Bump when DSL types, validation, generated semantics or Compiler Defaults change.
export const compileContractVersion = "mv-1.6.1/21";

export const typeInputSchema = z
  .object({
    kind: z.enum([
      "readFile",
      "fileExists",
      "directoryExists",
      "getDirectories",
      "realpath",
      "readDirectory",
    ]),
    path: z.string().min(1),
    value: z.union([z.string(), z.boolean(), z.array(z.string()), z.null()]),
    directoryOptions: z
      .object({
        extensions: z.array(z.string()).nullable(),
        excludes: z.array(z.string()).nullable(),
        includes: z.array(z.string()).nullable(),
        depth: z.number().nullable(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .refine((input) => {
    if ((input.kind === "readDirectory") !== (input.directoryOptions !== undefined)) return false;
    switch (input.kind) {
      case "readFile":
        return (
          input.value === null ||
          (typeof input.value === "string" && /^[a-f0-9]{64}$/u.test(input.value))
        );
      case "fileExists":
      case "directoryExists":
        return typeof input.value === "boolean";
      case "realpath":
        return typeof input.value === "string" && input.value.length > 0;
      case "getDirectories":
      case "readDirectory":
        return Array.isArray(input.value);
    }
  }, "Invalid captured TypeScript filesystem observation");

export type TypeInput = z.infer<typeof typeInputSchema>;

function normalized(path: string): string {
  const absolute = resolve(path).replaceAll("\\", "/");
  return process.platform === "win32" ? absolute.toLowerCase() : absolute;
}

function readBytes(path: string): Buffer | undefined {
  try {
    return readFileSync(path);
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      ["ENOENT", "ENOTDIR", "EISDIR"].includes(String(error.code))
    )
      return undefined;
    throw error;
  }
}

function hash(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function observe(input: TypeInput): TypeInput["value"] {
  switch (input.kind) {
    case "readFile": {
      const bytes = readBytes(input.path);
      return bytes === undefined ? null : hash(bytes);
    }
    case "fileExists":
      return ts.sys.fileExists(input.path);
    case "directoryExists":
      return ts.sys.directoryExists(input.path);
    case "getDirectories":
      return ts.sys.getDirectories(input.path).sort();
    case "realpath":
      return ts.sys.realpath?.(input.path) ?? input.path;
    case "readDirectory": {
      const options = input.directoryOptions!;
      return ts.sys
        .readDirectory(
          input.path,
          options.extensions ?? undefined,
          options.excludes ?? undefined,
          options.includes ?? undefined,
          options.depth ?? undefined,
        )
        .sort();
    }
  }
}

export function typeInputsUnchanged(inputs: readonly TypeInput[]): boolean {
  try {
    return inputs.every((input) => JSON.stringify(observe(input)) === JSON.stringify(input.value));
  } catch {
    return false;
  }
}

/** One immutable filesystem view for all TypeScript hosts in a compilation. */
export class TypeInputCapture {
  constructor(readonly currentDirectory = process.cwd()) {}

  private readonly observations = new Map<string, TypeInput>();
  private readonly contents = new Map<string, Buffer | undefined>();

  readFile = (path: string): string | undefined => {
    const key = normalized(path);
    if (!this.contents.has(key)) {
      const bytes = readBytes(key);
      this.contents.set(key, bytes);
      this.observations.set(`readFile:${key}`, {
        kind: "readFile",
        path: key,
        value: bytes === undefined ? null : hash(bytes),
      });
      this.realpath(key);
    }
    return this.contents.get(key)?.toString("utf8");
  };

  private query(
    kind: TypeInput["kind"],
    path: string,
    directoryOptions?: TypeInput["directoryOptions"],
  ): TypeInput["value"] {
    const normalizedPath = normalized(path);
    const key = JSON.stringify([kind, normalizedPath, directoryOptions]);
    let input = this.observations.get(key);
    if (input === undefined) {
      input = {
        kind,
        path: normalizedPath,
        value: null,
        ...(directoryOptions === undefined ? {} : { directoryOptions }),
      };
      input.value = observe(input);
      this.observations.set(key, input);
    }
    return input.value;
  }

  fileExists = (path: string): boolean => this.query("fileExists", path) as boolean;
  directoryExists = (path: string): boolean => this.query("directoryExists", path) as boolean;
  getDirectories = (path: string): string[] => [
    ...(this.query("getDirectories", path) as string[]),
  ];
  realpath = (path: string): string => this.query("realpath", path) as string;
  readDirectory: typeof ts.sys.readDirectory = (path, extensions, excludes, includes, depth) => [
    ...(this.query("readDirectory", path, {
      extensions: extensions === undefined ? null : [...extensions],
      excludes: excludes === undefined ? null : [...excludes],
      includes: includes === undefined ? null : [...includes],
      depth: depth ?? null,
    }) as string[]),
  ];

  fileHash(path: string): string {
    this.readFile(path);
    const bytes = this.contents.get(normalized(path));
    if (bytes === undefined) throw new Error(`Definition Source is missing: ${path}`);
    return hash(bytes);
  }

  inputs(): TypeInput[] {
    return [...this.observations.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, input]) => input);
  }
}
