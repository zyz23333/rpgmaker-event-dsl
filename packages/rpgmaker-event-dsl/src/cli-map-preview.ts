import { Command, Option } from "commander";

import type { MapObservationSource } from "./map-observation/types.js";
import type { MapPreviewBounds } from "./map-observation/preview-types.js";
import { renderWorkspaceMap } from "./workspace/map-preview.js";

function parseCrop(value: string): MapPreviewBounds {
  const parts = value.split(",");
  if (parts.length !== 4 || parts.some((part) => !/^-?\d+$/u.test(part))) {
    throw new Error(
      "Invalid --crop: use X,Y,width,height integer coordinates in the original map.",
    );
  }
  const [x, y, width, height] = parts.map(Number) as [number, number, number, number];
  return { x, y, width, height };
}

export function registerMapRenderCommand(map: Command): void {
  map
    .command("render")
    .description("Render the Selected Map to PNG and matching provenance metadata.")
    .requiredOption("--map <id>", "positive RPG Maker MV map ID", Number)
    .option("--crop <x,y,width,height>", "render original-map cell bounds at useful local detail")
    .option("--no-grid", "hide grid and coordinate label aids")
    .addOption(
      new Option("--source <source>", "project data source to observe")
        .choices(["snapshot", "generated"])
        .default("snapshot"),
    )
    .option("--json", "print a versioned structured result")
    .option(
      "--allow-missing-assets",
      "show explicit incomplete placeholders for unavailable images",
    )
    .action(
      async (options: {
        map: number;
        source: MapObservationSource;
        json?: boolean;
        crop?: string;
        grid?: boolean;
        allowMissingAssets?: boolean;
      }) => {
        const result = await renderWorkspaceMap({
          workspaceRoot: process.cwd(),
          mapId: options.map,
          source: options.source,
          ...(options.crop === undefined ? {} : { crop: parseCrop(options.crop) }),
          grid: options.grid !== false,
          allowMissingAssets: options.allowMissingAssets === true,
        });
        console.log(
          options.json
            ? JSON.stringify(result)
            : [
                `Map ${result.map.id}: ${result.map.name} (${result.source})`,
                `${result.output.width} x ${result.output.height} pixels; native MV static preview`,
                `Bounds: (${result.bounds.x}, ${result.bounds.y}), ${result.bounds.width} x ${result.bounds.height} cells`,
                ...(result.complete
                  ? []
                  : [
                      "INCOMPLETE: unavailable images use diagnostic placeholders.",
                      ...result.warnings.map(({ message }) => message),
                    ]),
                `PNG: ${result.artifacts.png}`,
                `Metadata: ${result.artifacts.metadata}`,
              ].join("\n"),
        );
      },
    );
}
