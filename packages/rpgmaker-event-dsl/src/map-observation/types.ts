import type { MapInfoEntry } from "../project-data/project.js";
import type { MapSettings } from "./read.js";

export type MapObservationSource = "snapshot" | "generated";

export type MapDataInput = {
  source: MapObservationSource;
  relativePath: string;
  path: string;
  hash: string;
};

export type MapObservationWarning = {
  code: string;
  message: string;
};

export type MapObservationResult = {
  schemaVersion: 1;
  source: MapObservationSource;
  dataInputs: MapDataInput[];
  warnings: MapObservationWarning[];
};

export type MapListResult = MapObservationResult & {
  kind: "map-list";
  maps: MapInfoEntry[];
};

export type MapEventSummary = {
  id: number;
  name: string;
  x: number;
  y: number;
};

export type MapSummaryResult = MapObservationResult & {
  kind: "map-summary";
  map: MapInfoEntry;
  width: number;
  height: number;
  tileset: { id: number; name: string; mode: number };
  settings: MapSettings;
  events: MapEventSummary[];
};

export type MapInspectionSelector =
  | { kind: "summary" }
  | { kind: "event"; eventId: number; commands?: boolean }
  | { kind: "cell"; x: number; y: number }
  | ({ kind: "area" } & MapBounds);

export type MapBounds = { x: number; y: number; width: number; height: number };

export type MapTileFlags = {
  /** Individual tile passage bits; these do not determine final cell passability. */
  passageBlocked: { down: boolean; left: boolean; right: boolean; up: boolean };
  upperLayer: boolean;
  ladder: boolean;
  bush: boolean;
  counter: boolean;
  damageFloor: boolean;
  terrainTag: number;
};

export type MapCellLayer = {
  layer: 0 | 1 | 2 | 3;
  tileId: number;
  rawFlags: number;
  flags: MapTileFlags;
};

export type MapCellDetail = {
  x: number;
  y: number;
  layers: MapCellLayer[];
  shadowBits: number;
  regionId: number;
  terrainTag: number;
};

export type MapCellResult = MapObservationResult & {
  kind: "map-cell";
  map: MapInfoEntry;
  width: number;
  height: number;
  cell: MapCellDetail;
};

export type MapAreaResult = MapObservationResult & {
  kind: "map-area";
  map: MapInfoEntry;
  width: number;
  height: number;
  bounds: MapBounds;
  cells: MapCellDetail[];
  events: MapEventSummary[];
};

export type MapInspectionResult = MapSummaryResult | MapCellResult | MapAreaResult;
