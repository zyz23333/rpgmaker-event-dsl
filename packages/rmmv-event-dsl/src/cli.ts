#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { Command } from "commander";

import { initWorkspace } from "./workspace.js";
import { runWorkflow } from "./workflow.js";

export const cliName = "rmmv-event-dsl";

export function createCli(): Command {
  const program = new Command();

  program
    .name(cliName)
    .description("Project-aware RPG Maker MV event definition tooling.")
    .version("0.0.0");

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
    .command("lint")
    .description("Validate Event Definitions against the configured MV project.")
    .action(async () => {
      await runWorkflow({
        workspaceRoot: process.cwd(),
        mode: "lint",
      });
    });

  program
    .command("create")
    .description("Create Event Data Store entries from Event Definitions.")
    .option("--dry-run", "preview planned changes without writing files")
    .option("--diff", "include full-file unified diffs in preview output")
    .action(async (options: { dryRun?: boolean; diff?: boolean }) => {
      const workflowOptions: Parameters<typeof runWorkflow>[0] = {
        workspaceRoot: process.cwd(),
        mode: "create",
      };

      if (options.dryRun !== undefined) {
        workflowOptions.dryRun = options.dryRun;
      }
      if (options.diff !== undefined) {
        workflowOptions.diff = options.diff;
      }

      await runWorkflow(workflowOptions);
    });

  program
    .command("replace")
    .description("Replace existing Event Data Store entries from Event Definitions.")
    .option("--dry-run", "preview planned changes without writing files")
    .option("--diff", "include full-file unified diffs in preview output")
    .action(async (options: { dryRun?: boolean; diff?: boolean }) => {
      const workflowOptions: Parameters<typeof runWorkflow>[0] = {
        workspaceRoot: process.cwd(),
        mode: "replace",
      };

      if (options.dryRun !== undefined) {
        workflowOptions.dryRun = options.dryRun;
      }
      if (options.diff !== undefined) {
        workflowOptions.diff = options.diff;
      }

      await runWorkflow(workflowOptions);
    });

  return program;
}

export async function runCli(argv: readonly string[] = process.argv): Promise<void> {
  await createCli().parseAsync(argv);
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await runCli();
}
