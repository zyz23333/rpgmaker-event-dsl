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
import { assertPictureInput } from "./picture-inputs.js";

export function fadeoutScreen(): FadeoutScreenDslCommand {
  return {
    kind: "fadeoutScreen",
  };
}

export function fadeinScreen(): FadeinScreenDslCommand {
  return {
    kind: "fadeinScreen",
  };
}

export function tintScreen(input: {
  tone: ToneInput;
  duration: number;
  wait?: boolean;
}): TintScreenDslCommand {
  const node: TintScreenDslCommand = {
    kind: "tintScreen",
    tone: input.tone,
    duration: input.duration,
  };

  if (input.wait !== undefined) {
    node.wait = input.wait;
  }

  return node;
}

export function flashScreen(input: {
  color: ColorInput;
  duration: number;
  wait?: boolean;
}): FlashScreenDslCommand {
  const node: FlashScreenDslCommand = {
    kind: "flashScreen",
    color: input.color,
    duration: input.duration,
  };

  if (input.wait !== undefined) {
    node.wait = input.wait;
  }

  return node;
}

export function shakeScreen(input: {
  power: number;
  speed: number;
  duration: number;
  wait?: boolean;
}): ShakeScreenDslCommand {
  const node: ShakeScreenDslCommand = {
    kind: "shakeScreen",
    power: input.power,
    speed: input.speed,
    duration: input.duration,
  };

  if (input.wait !== undefined) {
    node.wait = input.wait;
  }

  return node;
}

export function wait(frames: number): WaitDslCommand {
  return { kind: "wait", frames };
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
  wait?: boolean;
}): SetWeatherEffectDslCommand {
  const node: SetWeatherEffectDslCommand = {
    kind: "setWeatherEffect",
    weather: input.weather,
    power: input.power,
    duration: input.duration,
  };

  if (input.wait !== undefined) {
    node.wait = input.wait;
  }

  return node;
}
