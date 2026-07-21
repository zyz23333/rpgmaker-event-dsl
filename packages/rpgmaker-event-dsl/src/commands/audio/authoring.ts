import type {
  AudioPayload,
  FadeoutBgmDslCommand,
  FadeoutBgsDslCommand,
  MovieAssetReference,
  PlayBgmDslCommand,
  PlayBgsDslCommand,
  PlayMeDslCommand,
  PlayMovieDslCommand,
  PlaySeDslCommand,
  ResumeBgmDslCommand,
  SaveBgmDslCommand,
  StopSeDslCommand,
} from "../../domain/types.js";

export function playBgm(input: { audio: AudioPayload }): PlayBgmDslCommand {
  return {
    kind: "playBgm",
    audio: input.audio,
  };
}

export function fadeoutBgm(input: { duration: number }): FadeoutBgmDslCommand {
  return {
    kind: "fadeoutBgm",
    duration: input.duration,
  };
}

export function saveBgm(): SaveBgmDslCommand {
  return {
    kind: "saveBgm",
  };
}

export function resumeBgm(): ResumeBgmDslCommand {
  return {
    kind: "resumeBgm",
  };
}

export function playBgs(input: { audio: AudioPayload }): PlayBgsDslCommand {
  return {
    kind: "playBgs",
    audio: input.audio,
  };
}

export function fadeoutBgs(input: { duration: number }): FadeoutBgsDslCommand {
  return {
    kind: "fadeoutBgs",
    duration: input.duration,
  };
}

export function playMe(input: { audio: AudioPayload }): PlayMeDslCommand {
  return {
    kind: "playMe",
    audio: input.audio,
  };
}

export function playSe(input: { audio: AudioPayload }): PlaySeDslCommand {
  return {
    kind: "playSe",
    audio: input.audio,
  };
}

export function stopSe(): StopSeDslCommand {
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
