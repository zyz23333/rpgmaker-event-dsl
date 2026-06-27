import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { z } from "zod";

export const definitionTargetSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("map"),
    mapId: z.number().int().positive(),
  }),
  z.object({
    type: z.literal("commonEvents"),
  }),
]);

export const definitionBindingSchema = z.object({
  src: z.string().min(1),
  target: definitionTargetSchema,
});

export const workspaceConfigSchema = z
  .object({
    projectRoot: z.string().min(1),
    scriptEnabled: z.boolean(),
    definitionTargets: z.array(definitionBindingSchema),
  })
  .superRefine((config, context) => {
    const seenSources = new Set<string>();
    const seenMapTargets = new Set<number>();
    let seenCommonEvents = false;

    for (const binding of config.definitionTargets) {
      if (seenSources.has(binding.src)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate definition source: ${binding.src}`,
          path: ["definitionTargets"],
        });
      }
      seenSources.add(binding.src);

      if (binding.target.type === "map") {
        if (seenMapTargets.has(binding.target.mapId)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duplicate map target: ${binding.target.mapId}`,
            path: ["definitionTargets"],
          });
        }
        seenMapTargets.add(binding.target.mapId);
      } else if (seenCommonEvents) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Only one commonEvents target is allowed in a workspace.",
          path: ["definitionTargets"],
        });
      } else {
        seenCommonEvents = true;
      }
    }
  });

export type WorkspaceConfig = z.infer<typeof workspaceConfigSchema>;
export type DefinitionBinding = z.infer<typeof definitionBindingSchema>;
export type DefinitionTarget = z.infer<typeof definitionTargetSchema>;

export type LoadedWorkspace = {
  workspaceRoot: string;
  projectRoot: string;
  dataDirectory: string;
  config: WorkspaceConfig;
};

export type InitWorkspaceOptions = {
  workspaceRoot: string;
  projectRoot: string;
};

export async function loadWorkspace(workspaceRoot: string): Promise<LoadedWorkspace> {
  const configPath = resolve(workspaceRoot, "rmmv-event-dsl.config.json");
  const rawConfig = await readFile(configPath, "utf8");
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
  };
}

export async function initWorkspace(options: InitWorkspaceOptions): Promise<LoadedWorkspace> {
  const workspaceRoot = resolve(options.workspaceRoot);
  const projectRoot = resolve(workspaceRoot, options.projectRoot);
  const dataDirectory = resolve(projectRoot, "data");
  const config: WorkspaceConfig = {
    projectRoot: options.projectRoot,
    scriptEnabled: false,
    definitionTargets: [],
  };

  await assertProjectRoot(projectRoot);
  await assertDirectoryExists(dataDirectory);
  await mkdir(workspaceRoot, { recursive: true });
  await mkdir(resolve(workspaceRoot, "src"), { recursive: true });
  await writeFile(
    resolve(workspaceRoot, "rmmv-event-dsl.config.json"),
    `${JSON.stringify(config, null, 2)}\n`,
    "utf8",
  );

  return {
    workspaceRoot,
    projectRoot,
    dataDirectory,
    config,
  };
}

async function assertProjectRoot(projectRoot: string): Promise<void> {
  await readFile(resolve(projectRoot, ".rpgproject"), "utf8");
}

async function assertDirectoryExists(directoryPath: string): Promise<void> {
  const directoryStats = await stat(directoryPath);

  if (!directoryStats.isDirectory()) {
    throw new Error(`Expected ${directoryPath} to be a directory.`);
  }
}
