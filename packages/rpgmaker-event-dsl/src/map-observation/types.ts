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
