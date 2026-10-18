import type { MapInfoEntry } from "../project-data/project.js";
import type { MapObservationResult, MapObservationWarning } from "./types.js";

export type MapPreviewBounds = { x: number; y: number; width: number; height: number };

export type MapImageUnavailableReason = "missing" | "unreadable" | "undecodable";

export type MapImageInput = {
  relativePath: string;
  path: string;
} & (
  | { status: "available"; hash: string }
  | { status: "unavailable"; reason: MapImageUnavailableReason; hash?: never }
);

export type MapImageWarning = MapObservationWarning & {
  code: "map-image-unavailable";
  reason: MapImageUnavailableReason;
  relativePath: string;
  path: string;
};

export type MapPreviewPage = { eventId: number; page: number };

export type MapPreviewResult = Omit<MapObservationResult, "warnings"> & {
  kind: "map-preview";
  map: MapInfoEntry;
  originalMap: { width: number; height: number; tileWidth: 48; tileHeight: 48 };
  bounds: MapPreviewBounds;
  output: { width: number; height: number };
  mapContent: MapPreviewBounds;
  /** Original map cell boundaries map to (x * scaleX + offsetX, y * scaleY + offsetY). */
  transform: { scaleX: number; scaleY: number; offsetX: number; offsetY: number };
  compatibility: { target: "rpg-maker-mv-native-static"; animationFrame: 0 };
  previewPages: MapPreviewPage[];
  imageInputs: MapImageInput[];
  artifacts: { png: string; metadata: string };
  complete: boolean;
  warnings: MapImageWarning[];
};
