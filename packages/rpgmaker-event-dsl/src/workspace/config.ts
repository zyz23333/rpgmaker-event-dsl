import { mkdir, readFile, readdir, realpath, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

import { z } from "zod";

export const defaultSourceRoot = "src";
export const defaultSourceInclude = ["**/*.events.ts", "**/*.dsl.ts"] as const;
export const defaultSourceExclude = ["**/*.test.ts", "**/*.spec.ts", "**/*.d.ts"] as const;

export const workspaceConfigSchema = z
  .object({
    projectRoot: z.string().min(1),
    scriptEnabled: z.boolean(),
    sourceRoot: z.string().min(1),
    sourceInclude: z.array(z.string().min(1)),
    sourceExclude: z.array(z.string().min(1)),
  })
  .strict();

export type WorkspaceConfig = z.infer<typeof workspaceConfigSchema>;

export type LoadedWorkspace = {
  workspaceRoot: string;
  projectRoot: string;
  dataDirectory: string;
  config: WorkspaceConfig;
  configHash: string;
  projectRootBinding: string;
};

export type InitWorkspaceOptions = {
  workspaceRoot: string;
  projectRoot: string;
};

export async function loadWorkspace(workspaceRoot: string): Promise<LoadedWorkspace> {
  const configPath = resolve(workspaceRoot, "rpgmaker-event-dsl.config.json");
  const configBytes = await readFile(configPath);
  const rawConfig = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(configBytes);
  const config = workspaceConfigSchema.parse(JSON.parse(rawConfig));
  const projectRoot = resolve(workspaceRoot, config.projectRoot);
  const dataDirectory = resolve(projectRoot, "data");

  await assertProjectRoot(projectRoot);
  await assertDirectoryExists(dataDirectory);

  return {
    workspaceRoot,
    projectRoot,
    dataDirectory,
    config,
    configHash: createHash("sha256").update(configBytes).digest("hex"),
    projectRootBinding: await normalizedProjectRoot(projectRoot),
  };
}

export async function initWorkspace(options: InitWorkspaceOptions): Promise<LoadedWorkspace> {
  const workspaceRoot = resolve(options.workspaceRoot);
  const configPath = resolve(workspaceRoot, "rpgmaker-event-dsl.config.json");
  const projectRoot = resolve(workspaceRoot, options.projectRoot);
  const dataDirectory = resolve(projectRoot, "data");
  const config: WorkspaceConfig = {
    projectRoot: options.projectRoot,
    scriptEnabled: false,
    sourceRoot: defaultSourceRoot,
    sourceInclude: [...defaultSourceInclude],
    sourceExclude: [...defaultSourceExclude],
  };

  await assertProjectRoot(projectRoot);
  await assertDirectoryExists(dataDirectory);
  await assertConfigDoesNotExist(configPath);
  await mkdir(workspaceRoot, { recursive: true });
  await mkdir(resolve(workspaceRoot, config.sourceRoot), { recursive: true });
  await writeFile(
    resolve(workspaceRoot, "rpgmaker-event-dsl.config.json"),
    `${JSON.stringify(config, null, 2)}\n`,
    "utf8",
  );

  return loadWorkspace(workspaceRoot);
}

async function normalizedProjectRoot(projectRoot: string): Promise<string> {
  const canonical = await realpath(projectRoot);
  return process.platform === "win32" ? canonical.toLowerCase() : canonical;
}

export async function assertWorkspaceUnchanged(
  workspace: LoadedWorkspace,
  commandName: string,
): Promise<void> {
  const current = await loadWorkspace(workspace.workspaceRoot).catch((error: unknown) => {
    throw new Error(
      `Workspace configuration or Project Root changed during ${commandName}. Run ${commandName} again.`,
      { cause: error },
    );
  });
  if (
    current.configHash !== workspace.configHash ||
    current.projectRootBinding !== workspace.projectRootBinding
  ) {
    throw new Error(
      `Workspace configuration or Project Root changed during ${commandName}. Run ${commandName} again.`,
    );
  }
}

async function assertConfigDoesNotExist(configPath: string): Promise<void> {
  try {
    await stat(configPath);
  } catch (error) {
    if (isMissingFileError(error)) {
      return;
    }
    throw error;
  }

  throw new Error(
    `Workspace Config already exists at ${configPath}. Refusing to overwrite it during init.`,
  );
}

function isMissingFileError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string" &&
    (error as { code?: string }).code === "ENOENT"
  );
}

async function assertProjectRoot(projectRoot: string): Promise<void> {
  const entries = await readdir(projectRoot, { withFileTypes: true });
  const projectMarkers = entries.filter(
    (entry) => entry.isFile() && entry.name.endsWith(".rpgproject"),
  );

  if (projectMarkers.length === 0) {
    throw new Error(`Expected ${projectRoot} to contain a *.rpgproject file.`);
  }
}

async function assertDirectoryExists(directoryPath: string): Promise<void> {
  const directoryStats = await stat(directoryPath);

  if (!directoryStats.isDirectory()) {
    throw new Error(`Expected ${directoryPath} to be a directory.`);
  }
}
