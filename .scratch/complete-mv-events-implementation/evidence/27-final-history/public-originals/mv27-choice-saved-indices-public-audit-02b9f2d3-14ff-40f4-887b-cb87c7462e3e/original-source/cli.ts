#!/usr/bin/env node

import { realpathSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { Command } from "commander";

import { initWorkspace } from "./workspace/config.js";
import {
  cloneWorkspace,
  compileWorkspace,
  decompileWorkspace,
  diffWorkspace,
  pullWorkspace,
} from "./workspace/operations.js";
import { pushWorkspace } from "./workspace/push.js";

export const cliName = "rpgmaker-event-dsl";

export function createCli(): Command {
  const program = new Command();

  program
    .name(cliName)
    .description("Project-aware RPG Maker MV event definition tooling.")
    .version("0.1.2");

  program
    .command("init")
    .description("Initialize a workspace at the current directory or a chosen path.")
    .argument("[workspaceRoot]", "workspace directory to initialize")
    .requiredOption("--project-root <path>", "relative path to the RPG Maker MV project root")
    .action(async (workspaceRoot: string, options: { projectRoot: string }) => {
      await initWorkspace({
        workspaceRoot: workspaceRoot ?? process.cwd(),
        projectRoot: options.projectRoot,
      });
    });

  program
    .command("clone")
    .description("Capture the initial Project Data Snapshot from the configured MV project.")
    .action(async () => {
      await cloneWorkspace({ workspaceRoot: process.cwd() });
    });

  program
    .command("pull")
    .description("Refresh the Project Data Snapshot from the configured MV project.")
    .action(async () => {
      await pullWorkspace({ workspaceRoot: process.cwd() });
    });

  program
    .command("decompile")
    .description("Generate non-destructive DSL source from the Project Data Snapshot.")
    .action(async () => {
      await decompileWorkspace({ workspaceRoot: process.cwd() });
    });

  program
    .command("compile")
    .description("Compile discovered DSL source into Generated Project Data.")
    .option("--check", "validate without writing Generated Project Data or freshness metadata")
    .action(async (options: { check?: boolean }) => {
      await compileWorkspace({
        workspaceRoot: process.cwd(),
        check: options.check === true,
      });
    });

  program
    .command("diff")
    .description("Compare Generated Project Data with the Project Data Snapshot.")
    .option("--short", "show a summary without entry details")
    .option("--file <relativePath>", "filter the Structured Diff Report by Project Data File")
    .action(async (options: { file?: string; short?: boolean }) => {
      const diffOptions = {
        workspaceRoot: process.cwd(),
        short: options.short === true,
      };

      console.log(
        await diffWorkspace({
          ...diffOptions,
          ...(options.file === undefined ? {} : { file: options.file }),
        }),
      );
    });

  program
    .command("push")
    .description("Synchronize fresh Generated Project Data to the configured MV project.")
    .option(
      "--allow-destructive",
      "allow reviewed destructive changes without bypassing safety checks",
    )
    .action(async (options: { allowDestructive?: boolean }) => {
      await pushWorkspace({
        workspaceRoot: process.cwd(),
        allowDestructive: options.allowDestructive === true,
      });
    });

  return program;
}

export async function runCli(argv: readonly string[] = process.argv): Promise<void> {
  await createCli().parseAsync(argv);
}

function isCliEntrypoint(metaUrl: string, argvPath: string | undefined): boolean {
  if (argvPath === undefined) {
    return false;
  }

  return realpathSync(fileURLToPath(metaUrl)) === realpathSync(resolve(argvPath));
}

if (isCliEntrypoint(import.meta.url, process.argv[1])) {
  await runCli();
}
