import type {
  AudioPayload,
  ChangeBattleBgmDslCommand,
  ChangeVictoryMeDslCommand,
  ChangeDefeatMeDslCommand,
  ChangeVehicleBgmDslCommand,
  VehicleTarget,
  FadeoutBgmDslCommand,
  FadeoutBgsDslCommand,
  MovieAssetReference,
  PlayBgmDslCommand,
  PlayBgsDslCommand,
  PlayMeDslCommand,
  PlayMovieDslCommand,
  PlaySeDslCommand,
  ReplayBgmDslCommand,
  SaveBgmDslCommand,
  StopSeDslCommand,
} from "../../domain/types.js";
import { assertAudioCommandInput, assertNoAudioArguments } from "./validation.js";

export function changeBattleBgm(input: { audio: AudioPayload<"bgm"> }): ChangeBattleBgmDslCommand {
  assertAudioCommandInput("changeBattleBgm", input, "changeBattleBgm", false);
  return { kind: "changeBattleBgm", audio: input.audio };
}
export function changeVictoryMe(input: { audio: AudioPayload<"me"> }): ChangeVictoryMeDslCommand {
  assertAudioCommandInput("changeVictoryMe", input, "changeVictoryMe", false);
  return { kind: "changeVictoryMe", audio: input.audio };
}
export function changeDefeatMe(input: { audio: AudioPayload<"me"> }): ChangeDefeatMeDslCommand {
  assertAudioCommandInput("changeDefeatMe", input, "changeDefeatMe", false);
  return { kind: "changeDefeatMe", audio: input.audio };
}
export function changeVehicleBgm(input: {
  vehicle: VehicleTarget;
  audio: AudioPayload<"bgm">;
}): ChangeVehicleBgmDslCommand {
  assertAudioCommandInput("changeVehicleBgm", input, "changeVehicleBgm", false);
  return { kind: "changeVehicleBgm", vehicle: input.vehicle, audio: input.audio };
}

export function playBgm(input: { audio: AudioPayload<"bgm"> }): PlayBgmDslCommand {
  assertAudioCommandInput("playBgm", input, "playBgm", false);
  return {
    kind: "playBgm",
    audio: input.audio,
  };
}

export function fadeoutBgm(input: { duration: number }): FadeoutBgmDslCommand {
  assertAudioCommandInput("fadeoutBgm", input, "fadeoutBgm", false);
  return {
    kind: "fadeoutBgm",
    duration: input.duration,
  };
}

export function saveBgm(): SaveBgmDslCommand {
  assertNoAudioArguments("saveBgm", arguments.length);
  return {
    kind: "saveBgm",
  };
}

export function replayBgm(): ReplayBgmDslCommand {
  assertNoAudioArguments("replayBgm", arguments.length);
  return {
    kind: "replayBgm",
  };
}

export function playBgs(input: { audio: AudioPayload<"bgs"> }): PlayBgsDslCommand {
  assertAudioCommandInput("playBgs", input, "playBgs", false);
  return {
    kind: "playBgs",
    audio: input.audio,
  };
}

export function fadeoutBgs(input: { duration: number }): FadeoutBgsDslCommand {
  assertAudioCommandInput("fadeoutBgs", input, "fadeoutBgs", false);
  return {
    kind: "fadeoutBgs",
    duration: input.duration,
  };
}

export function playMe(input: { audio: AudioPayload<"me"> }): PlayMeDslCommand {
  assertAudioCommandInput("playMe", input, "playMe", false);
  return {
    kind: "playMe",
    audio: input.audio,
  };
}

export function playSe(input: { audio: AudioPayload<"se"> }): PlaySeDslCommand {
  assertAudioCommandInput("playSe", input, "playSe", false);
  return {
    kind: "playSe",
    audio: input.audio,
  };
}

export function stopSe(): StopSeDslCommand {
  assertNoAudioArguments("stopSe", arguments.length);
  return {
    kind: "stopSe",
  };
}

export function playMovie(input: { movie: MovieAssetReference }): PlayMovieDslCommand {
  return {
    kind: "playMovie",
    movie: input.movie,
  };
}
