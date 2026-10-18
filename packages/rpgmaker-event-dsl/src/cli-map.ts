import { Command, Option } from "commander";

import type {
  MapListResult,
  MapObservationSource,
  MapInspectionResult,
} from "./map-observation/types.js";
import { inspectWorkspaceMap, listWorkspaceMaps } from "./workspace/map-observation.js";

function sourceOption(): Option {
  return new Option("--source <source>", "project data source to observe")
    .choices(["snapshot", "generated"])
    .default("snapshot");
}

function formatMapResult(result: MapListResult | MapInspectionResult): string {
  if (result.kind === "map-list") {
    return [
      `Maps (${result.source}):`,
      ...result.maps.map((map) => `  ${map.id}: ${map.name} (parent: ${map.parentId})`),
    ].join("\n");
  }
  if (result.kind === "map-event") {
    return [
      `Map ${result.map.id}: ${result.map.name} (${result.source})`,
      `Event ${result.event.id}: ${result.event.name} at (${result.event.x}, ${result.event.y})`,
      ...result.event.pages.flatMap((page) => [
        `Page ${page.page}: ${page.triggerName}`,
        `  Conditions: ${JSON.stringify(page.conditions)}`,
        `  Image: ${JSON.stringify(page.image)}`,
        `  Command summary: ${JSON.stringify(page.commandSummary)}`,
        ...(page.references.length === 0
          ? []
          : [`  References: ${JSON.stringify(page.references)}`]),
        ...(page.commands === undefined ? [] : [`  Commands: ${JSON.stringify(page.commands)}`]),
      ]),
      ...result.warnings.map((warning) => `Warning (${warning.code}): ${warning.message}`),
    ].join("\n");
  }
  return [
    `Map ${result.map.id}: ${result.map.name} (${result.source})`,
    `${result.width} x ${result.height} cells; tileset ${result.tileset.id}: ${result.tileset.name}`,
    `Settings: ${JSON.stringify(result.settings)}`,
    `Events (${result.events.length}):`,
    ...result.events.map((event) => `  ${event.id}: ${event.name} at (${event.x}, ${event.y})`),
  ].join("\n");
}

export function registerMapCommands(program: Command): void {
  const map = program
    .command("map")
    .description("Inspect map layout and event definition positions.");
  map
    .command("list")
    .description("List map IDs, display names, and parent relationships.")
    .addOption(sourceOption())
    .option("--json", "print a versioned structured result")
    .action(async (options: { source: MapObservationSource; json?: boolean }) => {
      const result = await listWorkspaceMaps({
        workspaceRoot: process.cwd(),
        source: options.source,
      });
      console.log(options.json ? JSON.stringify(result) : formatMapResult(result));
    });
  map
    .command("inspect")
    .description("Inspect the Selected Map's summary or one event's pages.")
    .requiredOption("--map <id>", "positive RPG Maker MV map ID", Number)
    .option("--event <id>", "inspect one positive map-scoped event ID", Number)
    .option("--commands", "include complete raw commands for the selected event")
    .addOption(sourceOption())
    .option("--json", "print a versioned structured result")
    .action(
      async (options: {
        map: number;
        source: MapObservationSource;
        json?: boolean;
        event?: number;
        commands?: boolean;
        cell?: string;
        area?: string;
      }) => {
        if (options.commands === true && options.event === undefined)
          throw new Error("--commands requires --event.");
        if (
          options.event !== undefined &&
          (options.cell !== undefined || options.area !== undefined)
        )
          throw new Error(
            "--event, --cell, and --area are mutually exclusive inspection selectors.",
          );
        const result = await inspectWorkspaceMap({
          workspaceRoot: process.cwd(),
          source: options.source,
          mapId: options.map,
          ...(options.event === undefined
            ? {}
            : {
                selector: {
                  kind: "event" as const,
                  eventId: options.event,
                  commands: options.commands === true,
                },
              }),
        });
        console.log(options.json ? JSON.stringify(result) : formatMapResult(result));
      },
    );
}
