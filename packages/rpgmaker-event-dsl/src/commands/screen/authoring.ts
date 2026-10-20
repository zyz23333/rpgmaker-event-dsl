import type {
  ColorInput,
  ErasePictureDslCommand,
  FadeinScreenDslCommand,
  FadeoutScreenDslCommand,
  FlashScreenDslCommand,
  MovePictureDslCommand,
  RotatePictureDslCommand,
  SetWeatherEffectDslCommand,
  ShakeScreenDslCommand,
  ShowPictureDslCommand,
  TintPictureDslCommand,
  TintScreenDslCommand,
  ToneInput,
  WaitDslCommand,
  WeatherEffectType,
} from "../../domain/types.js";
import { assertScreenInput, assertNoScreenArguments } from "./validation.js";
import { assertPictureInput } from "./picture-inputs.js";

export function fadeoutScreen(): FadeoutScreenDslCommand {
  assertNoScreenArguments("fadeoutScreen", arguments.length);
  return {
    kind: "fadeoutScreen",
  };
}

export function fadeinScreen(): FadeinScreenDslCommand {
  assertNoScreenArguments("fadeinScreen", arguments.length);
  return {
    kind: "fadeinScreen",
  };
}

export function tintScreen(input: {
  tone: Extract<ToneInput, { red: number }>;
  duration: number;
  wait: boolean;
}): TintScreenDslCommand {
  assertScreenInput("tintScreen", input, "tintScreen", false);
  return {
    kind: "tintScreen",
    tone: input.tone,
    duration: input.duration,
    wait: input.wait,
  };
}

export function flashScreen(input: {
  color: Extract<ColorInput, { red: number }>;
  duration: number;
  wait: boolean;
}): FlashScreenDslCommand {
  assertScreenInput("flashScreen", input, "flashScreen", false);
  return {
    kind: "flashScreen",
    color: input.color,
    duration: input.duration,
    wait: input.wait,
  };
}

export function shakeScreen(input: {
  power: number;
  speed: number;
  duration: number;
  wait: boolean;
}): ShakeScreenDslCommand {
  assertScreenInput("shakeScreen", input, "shakeScreen", false);
  return {
    kind: "shakeScreen",
    power: input.power,
    speed: input.speed,
    duration: input.duration,
    wait: input.wait,
  };
}

export function wait(input: { frames: number }): WaitDslCommand {
  assertScreenInput("wait", input, "wait", false);
  return { kind: "wait", frames: input.frames };
}

export function showPicture(input: Omit<ShowPictureDslCommand, "kind">): ShowPictureDslCommand {
  assertPictureInput("showPicture", input, "showPicture");
  return { kind: "showPicture", ...input };
}

export function movePicture(input: Omit<MovePictureDslCommand, "kind">): MovePictureDslCommand {
  assertPictureInput("movePicture", input, "movePicture");
  return { kind: "movePicture", ...input };
}

export function rotatePicture(input: {
  pictureId: number;
  speed: number;
}): RotatePictureDslCommand {
  assertPictureInput("rotatePicture", input, "rotatePicture");
  return {
    kind: "rotatePicture",
    pictureId: input.pictureId,
    speed: input.speed,
  };
}

export function tintPicture(input: Omit<TintPictureDslCommand, "kind">): TintPictureDslCommand {
  assertPictureInput("tintPicture", input, "tintPicture");
  return { kind: "tintPicture", ...input };
}

export function erasePicture(input: { pictureId: number }): ErasePictureDslCommand {
  assertPictureInput("erasePicture", input, "erasePicture");
  return {
    kind: "erasePicture",
    pictureId: input.pictureId,
  };
}

export function setWeatherEffect(input: {
  weather: WeatherEffectType;
  power: number;
  duration: number;
  wait: boolean;
}): SetWeatherEffectDslCommand {
  assertScreenInput("setWeatherEffect", input, "setWeatherEffect", false);
  return {
    kind: "setWeatherEffect",
    weather: input.weather,
    power: input.power,
    duration: input.duration,
    wait: input.wait,
  };
}
