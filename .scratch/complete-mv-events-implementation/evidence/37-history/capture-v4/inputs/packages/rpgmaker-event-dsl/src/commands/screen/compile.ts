import type {
  CommandPosition,
  PicturePosition,
  ShowBalloonIconDslCommand,
  ToneInput,
  ColorInput,
  WeatherEffectType,
} from "../../domain/types.js";
import type { ReferenceResolver } from "../../validation/types.js";

export function balloonIconToCode(balloon: ShowBalloonIconDslCommand["balloon"]): number {
  if (typeof balloon === "number") {
    return balloon;
  }

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
  }
}

export function compileTone(tone: ToneInput): [number, number, number, number] {
  return "red" in tone
    ? [tone.red, tone.green, tone.blue, tone.gray]
    : [tone[0], tone[1], tone[2], tone[3]];
}

export function compileColor(color: ColorInput): [number, number, number, number] {
  return "red" in color
    ? [color.red, color.green, color.blue, color.alpha]
    : [color[0], color[1], color[2], color[3]];
}

export function pictureOriginToCode(origin: PicturePosition["origin"]): number {
  return origin === "center" ? 1 : 0;
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
