import type {
  ColorInput,
  ErasePictureDslCommand,
  FadeinScreenDslCommand,
  FadeoutScreenDslCommand,
  FlashScreenDslCommand,
  ImageAssetReference,
  MovePictureDslCommand,
  PictureDisplayInput,
  PicturePosition,
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
import { assignPictureDisplayInput } from "../../authoring/shared.js";
import { assertScreenInput, assertNoScreenArguments } from "./validation.js";

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

export function showPicture(
  input: {
    pictureId: number;
    image: ImageAssetReference;
    position: PicturePosition;
  } & PictureDisplayInput,
): ShowPictureDslCommand {
  const node: ShowPictureDslCommand = {
    kind: "showPicture",
    pictureId: input.pictureId,
    image: input.image,
    position: input.position,
  };

  assignPictureDisplayInput(node, input);
  return node;
}

export function movePicture(
  input: {
    pictureId: number;
    position: PicturePosition;
    duration: number;
    wait?: boolean;
  } & PictureDisplayInput,
): MovePictureDslCommand {
  const node: MovePictureDslCommand = {
    kind: "movePicture",
    pictureId: input.pictureId,
    position: input.position,
    duration: input.duration,
  };

  assignPictureDisplayInput(node, input);
  if (input.wait !== undefined) {
    node.wait = input.wait;
  }

  return node;
}

export function rotatePicture(input: {
  pictureId: number;
  speed: number;
}): RotatePictureDslCommand {
  return {
    kind: "rotatePicture",
    pictureId: input.pictureId,
    speed: input.speed,
  };
}

export function tintPicture(input: {
  pictureId: number;
  tone: ToneInput;
  duration: number;
  wait?: boolean;
}): TintPictureDslCommand {
  const node: TintPictureDslCommand = {
    kind: "tintPicture",
    pictureId: input.pictureId,
    tone: input.tone,
    duration: input.duration,
  };

  if (input.wait !== undefined) {
    node.wait = input.wait;
  }

  return node;
}

export function erasePicture(input: { pictureId: number }): ErasePictureDslCommand {
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
