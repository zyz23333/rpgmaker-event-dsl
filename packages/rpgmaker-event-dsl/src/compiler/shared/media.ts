import type { AudioPayload, CommandPosition, LocationInfoType } from "../../domain/types.js";
import type { ReferenceResolver } from "../../validation/types.js";
import { resolveLocationReference } from "../../commands/map/compile.js";

export function compileAudioPayload(audio: AudioPayload): {
  name: string;
  pan: number;
  pitch: number;
  volume: number;
} {
  return {
    name: audio.asset?.name ?? "",
    volume: audio.volume,
    pitch: audio.pitch,
    pan: audio.pan,
  };
}

export function compileLocationInfoPosition(
  position: CommandPosition,
  resolver: ReferenceResolver,
  path = "getLocationInfo.location",
): [number, number, number] {
  if (position.kind === "direct") {
    return [0, position.x, position.y];
  }

  return [
    1,
    resolveLocationReference(position.x, resolver, `${path}.x`, 285),
    resolveLocationReference(position.y, resolver, `${path}.y`, 285),
  ];
}

export function locationInfoTypeToCode(info: LocationInfoType): number {
  switch (info) {
    case "terrainTag":
      return 0;
    case "eventId":
      return 1;
    case "tileLayer1":
      return 2;
    case "tileLayer2":
      return 3;
    case "tileLayer3":
      return 4;
    case "tileLayer4":
      return 5;
    case "regionId":
      return 6;
  }
}
