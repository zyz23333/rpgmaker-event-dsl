import { Command, Option } from "commander";

import type { MapObservationSource } from "./map-observation/types.js";
import { renderWorkspaceMap } from "./workspace/map-preview.js";

export function registerMapRenderCommand(map: Command): void {
  map
    .command("render")
    .description("Render the Selected Map to PNG and matching provenance metadata.")
    .requiredOption("--map <id>", "positive RPG Maker MV map ID", Number)
    .addOption(
      new Option("--source <source>", "project data source to observe")
        .choices(["snapshot", "generated"])
        .default("snapshot"),
    )
    .option("--json", "print a versioned structured result")
    .action(async (options: { map: number; source: MapObservationSource; json?: boolean }) => {
      const result = await renderWorkspaceMap({
        workspaceRoot: process.cwd(),
        mapId: options.map,
        source: options.source,
      });
      console.log(
        options.json
          ? JSON.stringify(result)
          : [
              `Map ${result.map.id}: ${result.map.name} (${result.source})`,
              `${result.output.width} x ${result.output.height} pixels; native MV static preview`,
              `PNG: ${result.artifacts.png}`,
              `Metadata: ${result.artifacts.metadata}`,
            ].join("\n"),
      );
    });
}
