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
  | {
      kind: "event";
      eventId: number;
      commands?: boolean;
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

export type MapInspectionResult = MapSummaryResult | MapEventResult;
