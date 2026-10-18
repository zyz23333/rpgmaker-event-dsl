import { Command, Option } from "commander";

import type {
  MapListResult,
  MapObservationSource,
  MapSummaryResult,
} from "./map-observation/types.js";
import { inspectWorkspaceMap, listWorkspaceMaps } from "./workspace/map-observation.js";
import { registerMapRenderCommand } from "./cli-map-preview.js";

function sourceOption(): Option {
  return new Option("--source <source>", "project data source to observe")
    .choices(["snapshot", "generated"])
    .default("snapshot");
}

function formatMapResult(result: MapListResult | MapSummaryResult): string {
  if (result.kind === "map-list") {
    return [
      `Maps (${result.source}):`,
      ...result.maps.map((map) => `  ${map.id}: ${map.name} (parent: ${map.parentId})`),
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
  registerMapRenderCommand(map);
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
    .description("Inspect the Selected Map's summary.")
    .requiredOption("--map <id>", "positive RPG Maker MV map ID", Number)
    .addOption(sourceOption())
    .option("--json", "print a versioned structured result")
    .action(async (options: { map: number; source: MapObservationSource; json?: boolean }) => {
      const result = await inspectWorkspaceMap({
        workspaceRoot: process.cwd(),
        source: options.source,
        mapId: options.map,
      });
      console.log(options.json ? JSON.stringify(result) : formatMapResult(result));
    });
}
