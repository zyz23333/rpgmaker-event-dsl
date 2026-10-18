import { Command, Option } from "commander";

import type {
  MapListResult,
  MapCellDetail,
  MapInspectionResult,
  MapInspectionSelector,
  MapObservationSource,
} from "./map-observation/types.js";
import { inspectWorkspaceMap, listWorkspaceMaps } from "./workspace/map-observation.js";

function sourceOption(): Option {
  return new Option("--source <source>", "project data source to observe")
    .choices(["snapshot", "generated"])
    .default("snapshot");
}

function formatMapCell(cell: MapCellDetail): string[] {
  return [
    `Cell (${cell.x}, ${cell.y}): Region ID: ${cell.regionId}; Terrain Tag: ${cell.terrainTag}; shadow bits: ${cell.shadowBits}`,
    ...cell.layers.map(
      (layer) =>
        `  Layer ${layer.layer}: tile ${layer.tileId}; raw flags ${layer.rawFlags}; ${JSON.stringify(layer.flags)}`,
    ),
  ];
}

function formatMapResult(result: MapListResult | MapInspectionResult): string {
  if (result.kind === "map-list") {
    return [
      `Maps (${result.source}):`,
      ...result.maps.map((map) => `  ${map.id}: ${map.name} (parent: ${map.parentId})`),
    ].join("\n");
  }
  if (result.kind === "map-cell") {
    return [
      `Map ${result.map.id}: ${result.map.name} (${result.source})`,
      ...formatMapCell(result.cell),
    ].join("\n");
  }
  if (result.kind === "map-area") {
    return [
      `Map ${result.map.id}: ${result.map.name} (${result.source})`,
      `Area (${result.bounds.x}, ${result.bounds.y}), ${result.bounds.width} x ${result.bounds.height} cells:`,
      ...result.cells.flatMap(formatMapCell),
      `Events (${result.events.length}):`,
      ...result.events.map((event) => `  ${event.id}: ${event.name} at (${event.x}, ${event.y})`),
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

function parseCellOrAreaSelector(options: {
  cell?: string;
  area?: string;
  event?: number;
  commands?: boolean;
}): MapInspectionSelector {
  if (
    [options.event, options.cell, options.area].filter((value) => value !== undefined).length > 1
  ) {
    throw new Error("--event, --cell, and --area are mutually exclusive inspection selectors.");
  }
  if (options.commands && options.event === undefined) {
    throw new Error("--commands requires --event.");
  }
  const kind =
    options.cell !== undefined ? "cell" : options.area !== undefined ? "area" : "summary";
  if (kind === "summary") return { kind };
  const value = kind === "cell" ? options.cell! : options.area!;
  const components = value.split(",");
  const expectedCount = kind === "cell" ? 2 : 4;
  if (components.length !== expectedCount || components.some((part) => !/^-?\d+$/u.test(part))) {
    throw new Error(
      `Invalid --${kind}: use ${kind === "cell" ? "X,Y" : "X,Y,width,height"} integer coordinates.`,
    );
  }
  const [x, y, width, height] = components.map(Number) as [number, number, number, number];
  return kind === "cell" ? { kind, x, y } : { kind, x, y, width, height };
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
    .description("Inspect the Selected Map's summary or selected event, cell, or area.")
    .requiredOption("--map <id>", "positive RPG Maker MV map ID", Number)
    .option("--cell <x,y>", "inspect one cell using original zero-based map coordinates")
    .option("--area <x,y,width,height>", "inspect a rectangle and its event definition positions")
    .addOption(sourceOption())
    .option("--json", "print a versioned structured result")
    .action(
      async (options: {
        map: number;
        source: MapObservationSource;
        json?: boolean;
        cell?: string;
        area?: string;
      }) => {
        const result = await inspectWorkspaceMap({
          workspaceRoot: process.cwd(),
          source: options.source,
          mapId: options.map,
          selector: parseCellOrAreaSelector(options),
        });
        console.log(options.json ? JSON.stringify(result) : formatMapResult(result));
      },
    );
}
