import type { ValidatedMap, ValidatedTileset } from "./read.js";
import type { MapCellDetail, MapCellLayer } from "./types.js";

export function inspectMapCell(
  map: ValidatedMap,
  tileset: ValidatedTileset,
  x: number,
  y: number,
): MapCellDetail {
  const dataAt = (layer: number) => map.data[(layer * map.height + y) * map.width + x]!;
  const layers = ([0, 1, 2, 3] as const).map((layer): MapCellLayer => {
    const tileId = dataAt(layer);
    const rawFlags = tileset.flags[tileId];
    if (rawFlags === undefined) {
      throw new Error(
        `Tileset ${tileset.id} has no flags for tile ${tileId} at cell (${x}, ${y}), layer ${layer}. Run clone or pull to restore supporting data.`,
      );
    }
    return {
      layer,
      tileId,
      rawFlags,
      flags: {
        passageBlocked: {
          down: (rawFlags & 0x01) !== 0,
          left: (rawFlags & 0x02) !== 0,
          right: (rawFlags & 0x04) !== 0,
          up: (rawFlags & 0x08) !== 0,
        },
        upperLayer: (rawFlags & 0x10) !== 0,
        ladder: (rawFlags & 0x20) !== 0,
        bush: (rawFlags & 0x40) !== 0,
        counter: (rawFlags & 0x80) !== 0,
        damageFloor: (rawFlags & 0x100) !== 0,
        terrainTag: rawFlags >> 12,
      },
    };
  });
  return {
    x,
    y,
    layers,
    shadowBits: dataAt(4),
    regionId: dataAt(5),
    terrainTag: layers.findLast(({ flags }) => flags.terrainTag > 0)?.flags.terrainTag ?? 0,
  };
}
