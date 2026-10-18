import type { MapInfoEntry } from "../project-data/project.js";
import type { MapObservationResult } from "./types.js";

export type MapPreviewBounds = { x: number; y: number; width: number; height: number };

export type MapImageInput = {
  relativePath: string;
  path: string;
  hash: string;
  status: "available";
};

export type MapPreviewPage = { eventId: number; page: number };

export type MapPreviewResult = MapObservationResult & {
  kind: "map-preview";
  map: MapInfoEntry;
  originalMap: { width: number; height: number; tileWidth: 48; tileHeight: 48 };
  looping: { horizontal: boolean; vertical: boolean };
  bounds: MapPreviewBounds;
  output: { width: number; height: number };
  mapContent: MapPreviewBounds;
  /** Original map cell boundaries map to (x * scaleX + offsetX, y * scaleY + offsetY). */
  transform: { scaleX: number; scaleY: number; offsetX: number; offsetY: number };
  overlays: { grid: boolean; coordinateStep: { x: number; y: number } };
  compatibility: { target: "rpg-maker-mv-native-static"; animationFrame: 0 };
  previewPages: MapPreviewPage[];
  parallax: {
    name: string;
    originX: 0;
    originY: 0;
    time: 0;
    loopX: boolean;
    loopY: boolean;
    scrollX: number;
    scrollY: number;
  };
  imageInputs: MapImageInput[];
  artifacts: { png: string; metadata: string };
  complete: boolean;
};
