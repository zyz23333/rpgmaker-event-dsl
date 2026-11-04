import type { CommandOrigins, RawEventCommand } from "../../compiler/types.js";
import type { SnapshotMapValidationEntry, ValidationIssue } from "../../validation/types.js";
import { describeValue } from "../../project-data/json-values.js";

export function inspectMapLocationContext(
  commands: readonly RawEventCommand[],
  options: {
    identity: string;
    stage: "compile" | "decompile";
    maps: readonly SnapshotMapValidationEntry[];
    currentMapId?: number;
    battle?: boolean;
    prefix?: string;
    origins?: CommandOrigins;
  },
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const currentMap = options.maps.find((map) => map.id === options.currentMapId);
  for (const [index, command] of commands.entries()) {
    const p = command.parameters;
    if (![201, 202, 203, 285].includes(command.code)) continue;
    const origin = options.origins?.get(command);
    const warn = (suffix: string, slot: number, field: string, message: string) => {
      issues.push({
        level: "warning",
        code: `MV-E${command.code}-${suffix}`,
        stage: options.stage,
        identity: options.identity,
        nativePath: `${options.prefix ?? ""}list[${index}].parameters[${slot}]`,
        ...(origin
          ? {
              dslPath: `${origin.path}.${origin.kind === "rawDslCommand" ? `parameters[${slot}]` : field}`,
            }
          : {}),
        actual: describeValue(p[slot]),
        message,
      });
    };
    if (command.code === 201 && options.battle)
      warn(
        "CONTEXT",
        0,
        "destination",
        "Transfer Player executed during battle can stall the interpreter at this command.",
      );
    if (command.code === 203) {
      const targets: Array<[number, string]> = [[0, "target"]];
      if (p[1] === 2) targets.push([2, "destination.target"]);
      for (const [slot, field] of targets) {
        if (options.battle)
          warn(
            "TARGET",
            slot,
            field,
            "Set Event Location has no map event target while executing in battle; the saved selector is retained.",
          );
        else if (
          currentMap &&
          p[slot] !== 0 &&
          !currentMap.eventLocations.some((event) => event.eventId === p[slot])
        )
          warn(
            "TARGET",
            slot,
            field,
            "If this command executes on its containing map, the selected event is absent; other running maps are not predicted.",
          );
      }
    }
    let map: SnapshotMapValidationEntry | undefined;
    let start = 0;
    let conditional = false;
    let field = "destination";
    if (command.code === 201 && p[0] === 0) {
      map = options.maps.find((map) => map.id === p[1]);
      start = 2;
    }
    if (command.code === 202 && p[1] === 0) {
      map = options.maps.find((map) => map.id === p[2]);
      start = 3;
    }
    if (command.code === 203 && p[1] === 0) {
      map = currentMap;
      start = 2;
      conditional = true;
    }
    if (command.code === 285 && p[2] === 0) {
      map = currentMap;
      start = 3;
      conditional = true;
      field = "location";
    }
    if (!map) continue;
    for (const [offset, axis, bound] of [
      [0, "x", map.width],
      [1, "y", map.height],
    ] as const) {
      if (typeof bound !== "number" || (p[start + offset] as number) < bound) continue;
      let consequence = "The saved coordinate is retained without clamping.";
      if (command.code === 285) {
        consequence =
          p[1] === 0 || p[1] === 6
            ? "Terrain Tag and Region ID return 0 when the running map considers the position out of bounds."
            : p[1] === 1
              ? "Event ID uses an exact coordinate match and may find an event outside bounds; no match returns 0."
              : "Tile layers use a direct data array index that may alias another tile; a missing value returns 0.";
      }
      warn(
        "BOUNDS",
        start + offset,
        `${field}.${axis}`,
        `${conditional ? "If executed on its containing map, this" : "This fixed-map"} ${axis} coordinate is outside Snapshot map ${map.id} ${axis === "x" ? "width" : "height"} ${bound}. ${consequence}`,
      );
    }
  }
  return issues;
}
