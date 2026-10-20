import type {
  CharacterRuntimeSelector,
  DslCommand,
  MoveRouteCommand,
  MovementRoute,
  VehicleTarget,
} from "../../domain/types.js";
import type { ReferenceResolver } from "../../validation/types.js";
import { vehicleToCode } from "../../compiler/shared/conditions.js";
import { assertMovementRoute, assertNativeMovementRecord } from "./validation.js";
import type { NativeMovementRecord } from "./types.js";
import { locationDirectionToCode, resolveLocationReference } from "../map/compile.js";
export type { NativeMovementRecord } from "./types.js";

export function characterSelectorToCode(selector: CharacterRuntimeSelector): number {
  switch (selector.target) {
    case "player":
      return -1;
    case "currentEvent":
      return 0;
    case "event":
      return selector.id;
  }
}

export function compileSetVehicleLocationParameters(
  vehicle: VehicleTarget,
  destination: Extract<DslCommand, { kind: "setVehicleLocation" }>["destination"],
  resolver: ReferenceResolver,
  path = "setVehicleLocation",
): unknown[] {
  const vehicleCode = vehicleToCode(vehicle);
  if (destination.kind === "direct") {
    return [
      vehicleCode,
      0,
      resolveLocationReference(destination.map, resolver, `${path}.destination.map`, 202),
      destination.x,
      destination.y,
    ];
  }

  return [
    vehicleCode,
    1,
    resolveLocationReference(destination.map, resolver, `${path}.destination.map`, 202),
    resolveLocationReference(destination.x, resolver, `${path}.destination.x`, 202),
    resolveLocationReference(destination.y, resolver, `${path}.destination.y`, 202),
  ];
}

export function compileSetEventLocationParameters(
  node: Extract<DslCommand, { kind: "setEventLocation" }>,
  resolver: ReferenceResolver,
  path = "setEventLocation",
): unknown[] {
  const characterId = characterSelectorToCode(node.target);

  switch (node.destination.kind) {
    case "direct":
      return [
        characterId,
        0,
        node.destination.x,
        node.destination.y,
        locationDirectionToCode(node.direction),
      ];
    case "variables":
      return [
        characterId,
        1,
        resolveLocationReference(node.destination.x, resolver, `${path}.destination.x`, 203),
        resolveLocationReference(node.destination.y, resolver, `${path}.destination.y`, 203),
        locationDirectionToCode(node.direction),
      ];
    case "exchange":
      return [
        characterId,
        2,
        characterSelectorToCode(node.destination.target),
        0,
        locationDirectionToCode(node.direction),
      ];
  }
}

export function compileMovementRoute(
  route: MovementRoute,
  resolver: ReferenceResolver,
  path = "route",
) {
  assertMovementRoute(route, path);
  return {
    list: compileMoveRouteCommands(route, resolver, path),
    repeat: route.repeat ?? true,
    skippable: route.skippable ?? false,
    wait: route.wait ?? false,
  };
}

export function compileMoveRouteCommands(
  route: MovementRoute,
  resolver: ReferenceResolver,
  path = "route",
): NativeMovementRecord[] {
  return [
    ...route.commands.map((command, index) =>
      compileMoveRouteCommand(command, resolver, `${path}.commands[${index}]`),
    ),
    route.terminator?.parameters === "absent" ? { code: 0 } : { code: 0, parameters: [] },
  ];
}

export function compileMoveRouteCommand(
  command: MoveRouteCommand,
  resolver: ReferenceResolver,
  path = "route.commands",
): NativeMovementRecord {
  const record: NativeMovementRecord = compileMoveRouteInstruction(command, resolver);
  if (record.parameters?.length === 0) delete record.parameters;
  if (command.savedShape?.indent === "null") record.indent = null;
  if (command.savedShape?.indent === "zero") record.indent = 0;
  assertNativeMovementRecord(record, { dslPath: path });
  return record;
}

function compileMoveRouteInstruction(
  command: MoveRouteCommand,
  resolver: ReferenceResolver,
): { code: number; parameters: unknown[] } {
  switch (command.kind) {
    case "moveDown":
      return { code: 1, parameters: [] };
    case "moveLeft":
      return { code: 2, parameters: [] };
    case "moveRight":
      return { code: 3, parameters: [] };
    case "moveUp":
      return { code: 4, parameters: [] };
    case "moveLowerLeft":
      return { code: 5, parameters: [] };
    case "moveLowerRight":
      return { code: 6, parameters: [] };
    case "moveUpperLeft":
      return { code: 7, parameters: [] };
    case "moveUpperRight":
      return { code: 8, parameters: [] };
    case "moveRandom":
      return { code: 9, parameters: [] };
    case "moveTowardPlayer":
      return { code: 10, parameters: [] };
    case "moveAwayFromPlayer":
      return { code: 11, parameters: [] };
    case "moveForward":
      return { code: 12, parameters: [] };
    case "moveBackward":
      return { code: 13, parameters: [] };
    case "jump":
      return { code: 14, parameters: [command.x, command.y] };
    case "wait":
      return { code: 15, parameters: [command.frames] };
    case "turnDown":
      return { code: 16, parameters: [] };
    case "turnLeft":
      return { code: 17, parameters: [] };
    case "turnRight":
      return { code: 18, parameters: [] };
    case "turnUp":
      return { code: 19, parameters: [] };
    case "turn90Right":
      return { code: 20, parameters: [] };
    case "turn90Left":
      return { code: 21, parameters: [] };
    case "turn180":
      return { code: 22, parameters: [] };
    case "turn90RightOrLeft":
      return { code: 23, parameters: [] };
    case "turnRandom":
      return { code: 24, parameters: [] };
    case "turnTowardPlayer":
      return { code: 25, parameters: [] };
    case "turnAwayFromPlayer":
      return { code: 26, parameters: [] };
    case "switchOn":
      return { code: 27, parameters: [resolver.resolveReference(command.switch)] };
    case "switchOff":
      return { code: 28, parameters: [resolver.resolveReference(command.switch)] };
    case "changeSpeed":
      return { code: 29, parameters: [command.speed] };
    case "changeFrequency":
      return { code: 30, parameters: [command.frequency] };
    case "walkAnimation":
      return { code: command.enabled ? 31 : 32, parameters: [] };
    case "stepAnimation":
      return { code: command.enabled ? 33 : 34, parameters: [] };
    case "directionFix":
      return { code: command.enabled ? 35 : 36, parameters: [] };
    case "through":
      return { code: command.enabled ? 37 : 38, parameters: [] };
    case "transparent":
      return { code: command.enabled ? 39 : 40, parameters: [] };
    case "changeImage":
      return { code: 41, parameters: [command.character?.name ?? "", command.characterIndex] };
    case "changeOpacity":
      return { code: 42, parameters: [command.opacity] };
    case "changeBlendMode":
      return {
        code: 43,
        parameters: [["normal", "additive", "multiply", "screen"].indexOf(command.blendMode)],
      };
    case "playSe":
      return {
        code: 44,
        parameters: [
          {
            name: command.audio.asset?.name ?? "",
            volume: command.audio.volume,
            pitch: command.audio.pitch,
            pan: command.audio.pan,
          },
        ],
      };
    case "script":
      return { code: 45, parameters: [command.script.code] };
  }
}
