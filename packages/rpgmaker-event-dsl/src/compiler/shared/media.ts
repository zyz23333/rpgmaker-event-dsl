import type { AudioPayload, CommandPosition, LocationInfoType } from "../../domain/types.js";
import type { ReferenceResolver } from "../../validation/types.js";

export function compileAudioPayload(audio: AudioPayload): {
  name: string;
  pan: number;
  pitch: number;
  volume: number;
} {
  return {
    name: audio.asset.name,
    volume: audio.volume ?? 90,
    pitch: audio.pitch ?? 100,
    pan: audio.pan ?? 0,
  };
}

export function compileLocationInfoPosition(
  position: CommandPosition,
  resolver: ReferenceResolver,
): [number, number, number] {
  if (position.kind === "direct") {
    return [0, position.x, position.y];
  }

  return [1, resolver.resolveReference(position.x), resolver.resolveReference(position.y)];
}

export function locationInfoTypeToCode(info: LocationInfoType): number {
  switch (info) {
    case "terrainTag":
      return 0;
    case "eventId":
      return 1;
    case "tileIdLayer1":
      return 2;
    case "tileIdLayer2":
      return 3;
    case "tileIdLayer3":
      return 4;
    case "tileIdLayer4":
      return 5;
    case "regionId":
      return 6;
  }
}
