import type {
  AudioPayload,
  BalloonIcon,
  ChangeBattleBgmDslCommand,
  ChangeDefeatMeDslCommand,
  ChangeEncounterDisableDslCommand,
  ChangeFormationAccessDslCommand,
  ChangeMenuAccessDslCommand,
  ChangePlayerFollowersDslCommand,
  ChangeSaveAccessDslCommand,
  ChangeTransparencyDslCommand,
  ChangeVehicleBgmDslCommand,
  ChangeVictoryMeDslCommand,
  ChangeWindowColorDslCommand,
  CharacterRuntimeSelector,
  Direction,
  EventLocationDestination,
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
  ToneInput,
  VehicleTarget,
} from "../../domain/types.js";
import {
  assertMapCharacterInput,
  assertParameterlessCharacterCall,
} from "./character-validation.js";

export function changeBattleBgm(input: { audio: AudioPayload }): ChangeBattleBgmDslCommand {
  return {
    kind: "changeBattleBgm",
    audio: input.audio,
  };
}

export function changeVictoryMe(input: { audio: AudioPayload }): ChangeVictoryMeDslCommand {
  return {
    kind: "changeVictoryMe",
    audio: input.audio,
  };
}

export function changeSaveAccess(input: { enabled: boolean }): ChangeSaveAccessDslCommand {
  return {
    kind: "changeSaveAccess",
    enabled: input.enabled,
  };
}

export function changeMenuAccess(input: { enabled: boolean }): ChangeMenuAccessDslCommand {
  return {
    kind: "changeMenuAccess",
    enabled: input.enabled,
  };
}

export function changeEncounterDisable(input: {
  disabled: boolean;
}): ChangeEncounterDisableDslCommand {
  return {
    kind: "changeEncounterDisable",
    disabled: input.disabled,
  };
}

export function changeFormationAccess(input: {
  enabled: boolean;
}): ChangeFormationAccessDslCommand {
  return {
    kind: "changeFormationAccess",
    enabled: input.enabled,
  };
}

export function changeWindowColor(input: { tone: ToneInput }): ChangeWindowColorDslCommand {
  return {
    kind: "changeWindowColor",
    tone: input.tone,
  };
}

export function changeDefeatMe(input: { audio: AudioPayload }): ChangeDefeatMeDslCommand {
  return {
    kind: "changeDefeatMe",
    audio: input.audio,
  };
}

export function changeVehicleBgm(input: {
  vehicle: VehicleTarget;
  audio: AudioPayload;
}): ChangeVehicleBgmDslCommand {
  return {
    kind: "changeVehicleBgm",
    vehicle: input.vehicle,
    audio: input.audio,
  };
}

export function setVehicleLocation(input: {
  vehicle: VehicleTarget;
  destination: MapDestination;
}): SetVehicleLocationDslCommand {
  return {
    kind: "setVehicleLocation",
    vehicle: input.vehicle,
    destination: input.destination,
  };
}

export function setEventLocation(input: {
  character: CharacterRuntimeSelector;
  destination: EventLocationDestination;
  direction?: 0 | Direction;
}): SetEventLocationDslCommand {
  const node: SetEventLocationDslCommand = {
    kind: "setEventLocation",
    character: input.character,
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
