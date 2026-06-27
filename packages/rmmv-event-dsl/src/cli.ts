#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { Command } from "commander";

export const cliName = "rmmv-event-dsl";

export function createCli(): Command {
  const program = new Command();

  program
    .name(cliName)
    .description("Project-aware RPG Maker MV event definition tooling.")
    .version("0.0.0");

  program
    .command("lint")
    .description("Validate Event Definitions against the configured MV project.")
    .action(() => {
      throw new Error("The lint workflow is reserved for a later implementation slice.");
    });

  program
    .command("create")
    .description("Create Event Data Store entries from Event Definitions.")
    .option("--dry-run", "preview planned changes without writing files")
    .option("--diff", "include full-file unified diffs in preview output")
    .action(() => {
      throw new Error("The create workflow is reserved for a later implementation slice.");
    });

  program
    .command("replace")
    .description("Replace existing Event Data Store entries from Event Definitions.")
    .option("--dry-run", "preview planned changes without writing files")
    .option("--diff", "include full-file unified diffs in preview output")
    .action(() => {
      throw new Error("The replace workflow is reserved for a later implementation slice.");
    });

  return program;
}

export async function runCli(argv: readonly string[] = process.argv): Promise<void> {
  await createCli().parseAsync(argv);
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await runCli();
}
