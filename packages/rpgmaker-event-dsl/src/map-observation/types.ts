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

export type MapEventReference = {
  scope: "switch" | "variable" | "commonEvent" | "actor" | "item";
  id: number;
  status: "resolved" | "missing";
  name?: string;
};

export type MapCommandSummary = {
  recordCount: number;
  codes: { code: number; count: number }[];
  operations: {
    index: number;
    code: number | null;
    recordCount: number;
    status: "recognized" | "unsupported";
    helpers: string[];
    reason?: string;
  }[];
};

export type MapEventPageInspection = {
  page: number;
  conditions: Record<string, unknown>;
  trigger: number;
  triggerName: "action" | "playerTouch" | "eventTouch" | "autorun" | "parallel";
  image: {
    characterName: string;
    characterIndex: number;
    direction: number;
    pattern: number;
    tileId: number;
    [field: string]: unknown;
  };
  commandSummary: MapCommandSummary;
  commands?: unknown[];
  references: MapEventReference[];
};

export type MapEventInspection = MapEventSummary & {
  note?: string;
  pages: MapEventPageInspection[];
};

export type MapEventResult = MapObservationResult & {
  kind: "map-event";
  map: MapInfoEntry;
  event: MapEventInspection;
};

export type MapInspectionResult = MapSummaryResult | MapEventResult | MapCellResult | MapAreaResult;
