import type {
  CommandPosition,
  PictureOrigin,
  PictureDisplayInput,
  ShowBalloonIconDslCommand,
  ToneInput,
  ColorInput,
  WeatherEffectType,
} from "../../domain/types.js";
import type { ReferenceResolver } from "../../validation/types.js";

export function balloonIconToCode(balloon: ShowBalloonIconDslCommand["balloon"]): number {
  switch (balloon) {
    case "exclamation":
      return 1;
    case "question":
      return 2;
    case "musicNote":
      return 3;
    case "heart":
      return 4;
    case "anger":
      return 5;
    case "sweat":
      return 6;
    case "cobweb":
      return 7;
    case "silence":
      return 8;
    case "lightBulb":
      return 9;
    case "zzz":
      return 10;
    case "userDefined1":
      return 11;
    case "userDefined2":
      return 12;
    case "userDefined3":
      return 13;
    case "userDefined4":
      return 14;
    case "userDefined5":
      return 15;
  }
}

export function compileTone(tone: ToneInput): [number, number, number, number] {
  return [tone.red, tone.green, tone.blue, tone.gray];
}

export function compileColor(color: ColorInput): [number, number, number, number] {
  return [color.red, color.green, color.blue, color.alpha];
}

export function pictureOriginToCode(origin: PictureOrigin): number {
  return origin === "center" ? 1 : 0;
}

export function pictureBlendToCode(blend: PictureDisplayInput["blendMode"]): number {
  return ["normal", "additive", "multiply", "screen"].indexOf(blend);
}

export function compilePicturePosition(
  position: CommandPosition,
  resolver: ReferenceResolver,
): [number, number, number] {
  if (position.kind === "direct") {
    return [0, position.x, position.y];
  }

  return [1, resolver.resolveReference(position.x), resolver.resolveReference(position.y)];
}

export function weatherEffectToCode(weather: WeatherEffectType): string {
  return weather === "none" ? "none" : weather;
}
