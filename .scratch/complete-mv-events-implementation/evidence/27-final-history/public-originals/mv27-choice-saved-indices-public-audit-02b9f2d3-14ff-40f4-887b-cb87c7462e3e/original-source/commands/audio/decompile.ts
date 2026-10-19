import type { RawEventCommand, RenderedCommand } from "../../decompiler/types.js";
import { literal } from "../../decompiler/core.js";
import { vehicleFromCode } from "../flow/decompile.js";

export function renderAudioCommand(
  command: RawEventCommand,
  helperName: string,
  folder: "bgm" | "bgs" | "me" | "se",
): Omit<RenderedCommand, "nextIndex"> | null {
  const audio = renderAudioPayload(command.parameters[0], folder);
  return audio === null
    ? null
    : {
        expression: `${helperName}({ audio: ${audio} })`,
        helperNames: ["audioAsset", helperName],
      };
}

export function renderDurationCommand(
  command: RawEventCommand,
  helperName: string,
): Omit<RenderedCommand, "nextIndex"> | null {
  const duration = command.parameters[0];
  return typeof duration !== "number"
    ? null
    : {
        expression: `${helperName}({ duration: ${duration} })`,
        helperNames: [helperName],
      };
}

export function renderChangeVehicleBgm(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const vehicle = vehicleFromCode(command.parameters[0]);
  const audio = renderAudioPayload(command.parameters[1], "bgm");
  return vehicle === null || audio === null
    ? null
    : {
        expression: `changeVehicleBgm({ vehicle: ${literal(vehicle)}, audio: ${audio} })`,
        helperNames: ["audioAsset", "changeVehicleBgm"],
      };
}

export function renderPlayMovie(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const movieName = command.parameters[0];
  return typeof movieName !== "string"
    ? null
    : {
        expression: `playMovie({ movie: movieAsset({ name: ${literal(movieName)} }) })`,
        helperNames: ["movieAsset", "playMovie"],
      };
}

export function renderAudioPayload(
  value: unknown,
  folder: "bgm" | "bgs" | "me" | "se",
): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const audio = value as Record<string, unknown>;
  if (
    typeof audio.name !== "string" ||
    typeof audio.volume !== "number" ||
    typeof audio.pitch !== "number" ||
    typeof audio.pan !== "number"
  ) {
    return null;
  }

  return `{ asset: audioAsset({ folder: ${literal(folder)}, name: ${literal(audio.name)} }), volume: ${audio.volume}, pitch: ${audio.pitch}, pan: ${audio.pan} }`;
}
