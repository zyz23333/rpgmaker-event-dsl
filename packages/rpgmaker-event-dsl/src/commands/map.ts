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
} from "../dsl.js";

export function changeMapNameDisplay(input: { enabled: boolean }): ChangeMapNameDisplayDslCommand {
  return {
    kind: "changeMapNameDisplay",
    enabled: input.enabled,
  };
}

export function changeTileset(input: {
  tileset: ReferenceValue<"tileset">;
}): ChangeTilesetDslCommand {
  return {
    kind: "changeTileset",
    tileset: input.tileset,
  };
}

export function changeBattleBack(input: {
  battleback1: ImageAssetReference;
  battleback2: ImageAssetReference;
}): ChangeBattleBackDslCommand {
  return {
    kind: "changeBattleBack",
    battleback1: input.battleback1,
    battleback2: input.battleback2,
  };
}

export function changeParallax(input: {
  image: ImageAssetReference;
  loopX?: boolean;
  loopY?: boolean;
  sx?: number;
  sy?: number;
}): ChangeParallaxDslCommand {
  const node: ChangeParallaxDslCommand = {
    kind: "changeParallax",
    image: input.image,
  };

  if (input.loopX !== undefined) {
    node.loopX = input.loopX;
  }
  if (input.loopY !== undefined) {
    node.loopY = input.loopY;
  }
  if (input.sx !== undefined) {
    node.sx = input.sx;
  }
  if (input.sy !== undefined) {
    node.sy = input.sy;
  }

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
