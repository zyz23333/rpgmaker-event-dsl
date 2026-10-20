import type {
  BalloonIcon,
  ChangeEncounterDisableDslCommand,
  ChangeFormationAccessDslCommand,
  ChangeMenuAccessDslCommand,
  ChangePlayerFollowersDslCommand,
  ChangeSaveAccessDslCommand,
  ChangeTransparencyDslCommand,
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
  direction: Direction;
  distance: number;
  speed: number;
}): ScrollMapDslCommand {
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
  return {
    kind: "getOnOffVehicle",
  };
}

export function changeTransparency(input: { transparent: boolean }): ChangeTransparencyDslCommand {
  return {
    kind: "changeTransparency",
    transparent: input.transparent,
  };
}

export function showAnimation(input: {
  target: CharacterRuntimeSelector;
  animation: ReferenceValue<"animation">;
  wait?: boolean;
}): ShowAnimationDslCommand {
  const node: ShowAnimationDslCommand = {
    kind: "showAnimation",
    target: input.target,
    animation: input.animation,
  };

  if (input.wait !== undefined) {
    node.wait = input.wait;
  }

  return node;
}

export function showBalloonIcon(input: {
  target: CharacterRuntimeSelector;
  balloon: BalloonIcon | number;
  wait?: boolean;
}): ShowBalloonIconDslCommand {
  const node: ShowBalloonIconDslCommand = {
    kind: "showBalloonIcon",
    target: input.target,
    balloon: input.balloon,
  };

  if (input.wait !== undefined) {
    node.wait = input.wait;
  }

  return node;
}

export function changePlayerFollowers(input: {
  visible: boolean;
}): ChangePlayerFollowersDslCommand {
  return {
    kind: "changePlayerFollowers",
    visible: input.visible,
  };
}

export function gatherFollowers(): GatherFollowersDslCommand {
  return {
    kind: "gatherFollowers",
  };
}
