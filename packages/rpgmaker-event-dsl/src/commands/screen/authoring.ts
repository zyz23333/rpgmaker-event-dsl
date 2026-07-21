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
