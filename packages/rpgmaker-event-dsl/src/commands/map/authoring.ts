import type {
  ChangeBattleBackDslCommand,
  ChangeMapNameDisplayDslCommand,
  ChangeParallaxDslCommand,
  ChangeTilesetDslCommand,
  CommandPosition,
  EraseEventDslCommand,
  GetLocationInfoDslCommand,
  ImageAssetReference,
  LocationInfoType,
  ReferenceValue,
} from "../../domain/types.js";
import { assertMapAppearanceInput } from "./validation.js";

export function changeMapNameDisplay(input: { enabled: boolean }): ChangeMapNameDisplayDslCommand {
  assertMapAppearanceInput("changeMapNameDisplay", input, "changeMapNameDisplay");
  return {
    kind: "changeMapNameDisplay",
    enabled: input.enabled,
  };
}

export function changeTileset(input: {
  tileset: ReferenceValue<"tileset">;
}): ChangeTilesetDslCommand {
  assertMapAppearanceInput("changeTileset", input, "changeTileset");
  return {
    kind: "changeTileset",
    tileset: input.tileset,
  };
}

export function changeBattleBack(input: {
  battleback1: ImageAssetReference | null;
  battleback2: ImageAssetReference | null;
}): ChangeBattleBackDslCommand {
  assertMapAppearanceInput("changeBattleBack", input, "changeBattleBack");
  return {
    kind: "changeBattleBack",
    battleback1: input.battleback1,
    battleback2: input.battleback2,
  };
}

export function changeParallax(input: {
  image: ImageAssetReference | null;
  loopX: boolean;
  loopY: boolean;
  sx: number;
  sy: number;
}): ChangeParallaxDslCommand {
  assertMapAppearanceInput("changeParallax", input, "changeParallax");
  const node: ChangeParallaxDslCommand = {
    kind: "changeParallax",
    image: input.image,
    loopX: input.loopX,
    loopY: input.loopY,
    sx: input.sx,
    sy: input.sy,
  };

  return node;
}

export function getLocationInfo(input: {
  variable: ReferenceValue<"variable">;
  info: LocationInfoType;
  location: CommandPosition;
}): GetLocationInfoDslCommand {
  return {
    kind: "getLocationInfo",
    variable: input.variable,
    info: input.info,
    location: input.location,
  };
}

export function eraseEvent(): EraseEventDslCommand {
  return { kind: "eraseEvent" };
}
