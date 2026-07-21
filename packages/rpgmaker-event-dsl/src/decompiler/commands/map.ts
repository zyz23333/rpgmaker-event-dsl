import type { RawEventCommand, RenderedCommand } from "../../decompiler.js";
import { literal, readPositiveInteger } from "../../decompiler.js";
import { renderCommandPosition } from "../commands.js";

export function renderChangeTileset(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const tilesetId = readPositiveInteger(command.parameters[0]);
  return tilesetId === null
    ? null
    : {
        expression: `changeTileset({ tileset: tilesetRef({ id: ${tilesetId} }) })`,
        helperNames: ["changeTileset", "tilesetRef"],
      };
}

export function renderChangeBattleBack(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const battleback1 = command.parameters[0];
  const battleback2 = command.parameters[1];
  return typeof battleback1 !== "string" || typeof battleback2 !== "string"
    ? null
    : {
        expression: `changeBattleBack({ battleback1: imageAsset({ folder: "battlebacks1", name: ${literal(battleback1)} }), battleback2: imageAsset({ folder: "battlebacks2", name: ${literal(battleback2)} }) })`,
        helperNames: ["changeBattleBack", "imageAsset"],
      };
}

export function renderChangeParallax(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const imageName = command.parameters[0];
  const loopX = command.parameters[1];
  const loopY = command.parameters[2];
  const sx = command.parameters[3];
  const sy = command.parameters[4];

  if (
    typeof imageName !== "string" ||
    typeof loopX !== "boolean" ||
    typeof loopY !== "boolean" ||
    typeof sx !== "number" ||
    typeof sy !== "number"
  ) {
    return null;
  }

  const fields = [`image: imageAsset({ folder: "parallaxes", name: ${literal(imageName)} })`];
  if (loopX) {
    fields.push("loopX: true");
  }
  if (loopY) {
    fields.push("loopY: true");
  }
  if (sx !== 0) {
    fields.push(`sx: ${sx}`);
  }
  if (sy !== 0) {
    fields.push(`sy: ${sy}`);
  }

  return {
    expression: `changeParallax({ ${fields.join(", ")} })`,
    helperNames: ["changeParallax", "imageAsset"],
  };
}

export function renderGetLocationInfo(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const variableId = readPositiveInteger(command.parameters[0]);
  const info = locationInfoTypeFromCode(command.parameters[1]);
  const location = renderCommandPosition(
    command.parameters[2],
    command.parameters[3],
    command.parameters[4],
  );

  return variableId === null || info === null || location === null
    ? null
    : {
        expression: `getLocationInfo({ variable: variableRef({ id: ${variableId} }), info: ${literal(info)}, location: ${location.expression} })`,
        helperNames: ["getLocationInfo", "variableRef", ...location.helperNames],
      };
}

export function locationInfoTypeFromCode(
  value: unknown,
):
  | "terrainTag"
  | "eventId"
  | "tileIdLayer1"
  | "tileIdLayer2"
  | "tileIdLayer3"
  | "tileIdLayer4"
  | "regionId"
  | null {
  switch (value) {
    case 0:
      return "terrainTag";
    case 1:
      return "eventId";
    case 2:
      return "tileIdLayer1";
    case 3:
      return "tileIdLayer2";
    case 4:
      return "tileIdLayer3";
    case 5:
      return "tileIdLayer4";
    case 6:
      return "regionId";
    default:
      return null;
  }
}
