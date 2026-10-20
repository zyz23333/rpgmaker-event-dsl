import type {
  BalloonIcon,
  ChangeEncounterDslCommand,
  ChangeFormationAccessDslCommand,
  ChangeMenuAccessDslCommand,
  ChangePlayerFollowersDslCommand,
  ChangeSaveAccessDslCommand,
  ChangeTransparencyDslCommand,
  ChangeWindowColorDslCommand,
  CharacterRuntimeSelector,
  Direction,
  EventLocationDestination,
  EventRuntimeSelector,
  LocationDirection,
  GatherFollowersDslCommand,
  GetOnOffVehicleDslCommand,
  MapDestination,
  ReferenceValue,
  ScrollMapDslCommand,
  SetEventLocationDslCommand,
  SetMovementRouteDslCommand,
  SetVehicleLocationDslCommand,
  ShowAnimationDslCommand,
  ShowBalloonIconDslCommand,
  VehicleTarget,
} from "../../domain/types.js";
import { assertSystemAccessInput, assertWindowColorInput } from "./access-validation.js";
import { assertMapLocationInput } from "../map/location-validation.js";
import {
  assertMapCharacterInput,
  assertParameterlessCharacterCall,
} from "./character-validation.js";

export function changeSaveAccess(input: { enabled: boolean }): ChangeSaveAccessDslCommand {
  assertSystemAccessInput("changeSaveAccess", input, "changeSaveAccess");
  return {
    kind: "changeSaveAccess",
    enabled: input.enabled,
  };
}

export function changeMenuAccess(input: { enabled: boolean }): ChangeMenuAccessDslCommand {
  assertSystemAccessInput("changeMenuAccess", input, "changeMenuAccess");
  return {
    kind: "changeMenuAccess",
    enabled: input.enabled,
  };
}

export function changeEncounter(input: { enabled: boolean }): ChangeEncounterDslCommand {
  assertSystemAccessInput("changeEncounter", input, "changeEncounter");
  return {
    kind: "changeEncounter",
    enabled: input.enabled,
  };
}

export function changeFormationAccess(input: {
  enabled: boolean;
}): ChangeFormationAccessDslCommand {
  assertSystemAccessInput("changeFormationAccess", input, "changeFormationAccess");
  return {
    kind: "changeFormationAccess",
    enabled: input.enabled,
  };
}

export function changeWindowColor(input: {
  tone: ChangeWindowColorDslCommand["tone"];
}): ChangeWindowColorDslCommand {
  assertWindowColorInput("changeWindowColor", input, "changeWindowColor");
  return {
    kind: "changeWindowColor",
    tone: input.tone,
  };
}

export function setVehicleLocation(input: {
  vehicle: VehicleTarget;
  destination: MapDestination;
}): SetVehicleLocationDslCommand {
  assertMapLocationInput("setVehicleLocation", input, "setVehicleLocation", false);
  return {
    kind: "setVehicleLocation",
    vehicle: input.vehicle,
    destination: input.destination,
  };
}

export function setEventLocation(input: {
  target: EventRuntimeSelector;
  destination: EventLocationDestination;
  direction?: LocationDirection;
}): SetEventLocationDslCommand {
  assertMapLocationInput("setEventLocation", input, "setEventLocation", false);
  const node: SetEventLocationDslCommand = {
    kind: "setEventLocation",
    target: input.target,
    destination: input.destination,
  };

  if (input.direction !== undefined) {
    node.direction = input.direction;
  }

  return node;
}

export function scrollMap(input: {
  direction: ScrollMapDslCommand["direction"];
  distance: number;
  speed: number;
}): ScrollMapDslCommand {
  assertMapCharacterInput("scrollMap", input, "scrollMap", false);
  return {
    kind: "scrollMap",
    direction: input.direction,
    distance: input.distance,
    speed: input.speed,
  };
}

export function setMovementRoute(input: {
  target: CharacterRuntimeSelector;
  route: SetMovementRouteDslCommand["route"];
}): SetMovementRouteDslCommand {
  const node: SetMovementRouteDslCommand = {
    ...input,
    kind: "setMovementRoute",
    target: input.target,
    route: input.route,
  };

  return node;
}

export function getOnOffVehicle(): GetOnOffVehicleDslCommand {
  assertParameterlessCharacterCall("getOnOffVehicle", arguments);
  return {
    kind: "getOnOffVehicle",
  };
}

export function changeTransparency(input: { transparent: boolean }): ChangeTransparencyDslCommand {
  assertMapCharacterInput("changeTransparency", input, "changeTransparency", false);
  return {
    kind: "changeTransparency",
    transparent: input.transparent,
  };
}

export function showAnimation(input: {
  target: CharacterRuntimeSelector;
  animation: ReferenceValue<"animation">;
  wait: boolean;
}): ShowAnimationDslCommand {
  assertMapCharacterInput("showAnimation", input, "showAnimation", false);
  const node: ShowAnimationDslCommand = {
    kind: "showAnimation",
    target: input.target,
    animation: input.animation,
    wait: input.wait,
  };

  return node;
}

export function showBalloonIcon(input: {
  target: CharacterRuntimeSelector;
  balloon: BalloonIcon;
  wait: boolean;
}): ShowBalloonIconDslCommand {
  assertMapCharacterInput("showBalloonIcon", input, "showBalloonIcon", false);
  const node: ShowBalloonIconDslCommand = {
    kind: "showBalloonIcon",
    target: input.target,
    balloon: input.balloon,
    wait: input.wait,
  };

  return node;
}

export function changePlayerFollowers(input: {
  visible: boolean;
}): ChangePlayerFollowersDslCommand {
  assertMapCharacterInput("changePlayerFollowers", input, "changePlayerFollowers", false);
  return {
    kind: "changePlayerFollowers",
    visible: input.visible,
  };
}

export function gatherFollowers(): GatherFollowersDslCommand {
  assertParameterlessCharacterCall("gatherFollowers", arguments);
  return {
    kind: "gatherFollowers",
  };
}
