import type { RawEventCommand, RenderedCommand } from "../../decompiler.js";
import {
  isBlendMode,
  isDirection,
  isEventLocationDirection,
  isFadeType,
  literal,
  readControlValue,
  readPositiveInteger,
} from "../../decompiler.js";
import { vehicleFromCode } from "../commands.js";

export function renderTransferPlayer(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const designation = command.parameters[0];
  const direction = command.parameters[4];
  const fadeType = command.parameters[5];

  if (!isDirection(direction) || !isFadeType(fadeType)) {
    return null;
  }

  if (designation === 0) {
    const mapId = readPositiveInteger(command.parameters[1]);
    const x = command.parameters[2];
    const y = command.parameters[3];
    return mapId === null || typeof x !== "number" || typeof y !== "number"
      ? null
      : {
          expression: `transferPlayer({ destination: { kind: "direct", map: mapRef({ id: ${mapId} }), x: ${x}, y: ${y} }${renderOptionalDirectionAndFade(direction, fadeType)} })`,
          helperNames: ["mapRef", "transferPlayer"],
        };
  }

  if (designation === 1) {
    const mapVariableId = readPositiveInteger(command.parameters[1]);
    const xVariableId = readPositiveInteger(command.parameters[2]);
    const yVariableId = readPositiveInteger(command.parameters[3]);
    return mapVariableId === null || xVariableId === null || yVariableId === null
      ? null
      : {
          expression: `transferPlayer({ destination: { kind: "variables", map: variableRef({ id: ${mapVariableId} }), x: variableRef({ id: ${xVariableId} }), y: variableRef({ id: ${yVariableId} }) }${renderOptionalDirectionAndFade(direction, fadeType)} })`,
          helperNames: ["transferPlayer", "variableRef"],
        };
  }

  return null;
}

export function renderSetVehicleLocation(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const vehicle = vehicleFromCode(command.parameters[0]);
  const designation = command.parameters[1];
  if (vehicle === null) {
    return null;
  }

  if (designation === 0) {
    const mapId = readPositiveInteger(command.parameters[2]);
    const x = command.parameters[3];
    const y = command.parameters[4];
    return mapId === null || typeof x !== "number" || typeof y !== "number"
      ? null
      : {
          expression: `setVehicleLocation({ vehicle: ${literal(vehicle)}, destination: { kind: "direct", map: mapRef({ id: ${mapId} }), x: ${x}, y: ${y} } })`,
          helperNames: ["mapRef", "setVehicleLocation"],
        };
  }

  if (designation === 1) {
    const mapVariableId = readPositiveInteger(command.parameters[2]);
    const xVariableId = readPositiveInteger(command.parameters[3]);
    const yVariableId = readPositiveInteger(command.parameters[4]);
    return mapVariableId === null || xVariableId === null || yVariableId === null
      ? null
      : {
          expression: `setVehicleLocation({ vehicle: ${literal(vehicle)}, destination: { kind: "variables", map: variableRef({ id: ${mapVariableId} }), x: variableRef({ id: ${xVariableId} }), y: variableRef({ id: ${yVariableId} }) } })`,
          helperNames: ["setVehicleLocation", "variableRef"],
        };
  }

  return null;
}

export function renderSetEventLocation(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const character = renderCharacterRuntimeSelector(command.parameters[0]);
  const designation = command.parameters[1];
  const direction = command.parameters[4];
  if (character === null || !isEventLocationDirection(direction)) {
    return null;
  }

  if (designation === 0) {
    const x = command.parameters[2];
    const y = command.parameters[3];
    return typeof x !== "number" || typeof y !== "number"
      ? null
      : {
          expression: `setEventLocation({ character: ${character.expression}, destination: { kind: "direct", x: ${x}, y: ${y} }${renderOptionalEventDirection(direction)} })`,
          helperNames: ["setEventLocation"],
        };
  }

  if (designation === 1) {
    const xVariableId = readPositiveInteger(command.parameters[2]);
    const yVariableId = readPositiveInteger(command.parameters[3]);
    return xVariableId === null || yVariableId === null
      ? null
      : {
          expression: `setEventLocation({ character: ${character.expression}, destination: { kind: "variables", x: variableRef({ id: ${xVariableId} }), y: variableRef({ id: ${yVariableId} }) }${renderOptionalEventDirection(direction)} })`,
          helperNames: ["setEventLocation", "variableRef"],
        };
  }

  if (designation === 2) {
    const exchangeCharacter = renderCharacterRuntimeSelector(command.parameters[2]);
    return exchangeCharacter === null
      ? null
      : {
          expression: `setEventLocation({ character: ${character.expression}, destination: { kind: "exchange", character: ${exchangeCharacter.expression} }${renderOptionalEventDirection(direction)} })`,
          helperNames: ["setEventLocation"],
        };
  }

  return null;
}

export function renderScrollMap(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const direction = command.parameters[0];
  const distance = command.parameters[1];
  const speed = command.parameters[2];

  return isDirection(direction) && typeof distance === "number" && typeof speed === "number"
    ? {
        expression: `scrollMap({ direction: ${direction}, distance: ${distance}, speed: ${speed} })`,
        helperNames: ["scrollMap"],
      }
    : null;
}

export function renderSetMovementRoute(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const target = renderCharacterRuntimeSelector(command.parameters[0]);
  const route = command.parameters[1];

  if (target === null || !route || typeof route !== "object" || Array.isArray(route)) {
    return null;
  }

  const routeRecord = route as Record<string, unknown>;
  if (
    !Array.isArray(routeRecord.list) ||
    typeof routeRecord.repeat !== "boolean" ||
    typeof routeRecord.skippable !== "boolean" ||
    typeof routeRecord.wait !== "boolean"
  ) {
    return null;
  }

  const renderedRoute = renderMoveRouteCommands(routeRecord.list);
  if (renderedRoute === null) {
    return null;
  }

  const fields = [
    `target: ${target.expression}`,
    `route: [${renderedRoute.expressions.join(", ")}]`,
  ];
  if (!routeRecord.repeat) {
    fields.push("repeat: false");
  }
  if (routeRecord.skippable) {
    fields.push("skippable: true");
  }
  if (routeRecord.wait) {
    fields.push("wait: true");
  }

  return {
    expression: `setMovementRoute({ ${fields.join(", ")} })`,
    helperNames: ["setMovementRoute", ...renderedRoute.helperNames],
  };
}

export function renderChangeTransparency(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const transparent = readControlValue(command.parameters[0]);
  return transparent === null
    ? null
    : {
        expression: `changeTransparency({ transparent: ${transparent} })`,
        helperNames: ["changeTransparency"],
      };
}

export function renderShowAnimation(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const target = renderCharacterRuntimeSelector(command.parameters[0]);
  const animationId = readPositiveInteger(command.parameters[1]);
  const wait = command.parameters[2];

  return target === null || animationId === null || typeof wait !== "boolean"
    ? null
    : {
        expression: `showAnimation({ target: ${target.expression}, animation: animationRef({ id: ${animationId} })${wait ? ", wait: true" : ""} })`,
        helperNames: ["animationRef", "showAnimation"],
      };
}

export function renderShowBalloonIcon(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const target = renderCharacterRuntimeSelector(command.parameters[0]);
  const balloon = balloonIconFromCode(command.parameters[1]);
  const wait = command.parameters[2];

  return target === null || balloon === null || typeof wait !== "boolean"
    ? null
    : {
        expression: `showBalloonIcon({ target: ${target.expression}, balloon: ${balloon}${wait ? ", wait: true" : ""} })`,
        helperNames: ["showBalloonIcon"],
      };
}

export function renderChangePlayerFollowers(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const visible = readControlValue(command.parameters[0]);
  return visible === null
    ? null
    : {
        expression: `changePlayerFollowers({ visible: ${visible} })`,
        helperNames: ["changePlayerFollowers"],
      };
}

export function renderMoveRouteCommands(
  commands: readonly unknown[],
): { expressions: string[]; helperNames: string[] } | null {
  const expressions: string[] = [];
  const helperNames = new Set<string>();

  for (const command of commands) {
    if (!command || typeof command !== "object" || Array.isArray(command)) {
      return null;
    }

    const record = command as Record<string, unknown>;
    if (record.code === 0) {
      if (!Array.isArray(record.parameters) || record.parameters.length !== 0) {
        return null;
      }
      continue;
    }

    const rendered = renderMoveRouteCommand(record);
    if (rendered === null) {
      return null;
    }

    expressions.push(rendered.expression);
    for (const helperName of rendered.helperNames) {
      helperNames.add(helperName);
    }
  }

  return { expressions, helperNames: [...helperNames] };
}

export function renderMoveRouteCommand(
  command: Record<string, unknown>,
): { expression: string; helperNames: readonly string[] } | null {
  const parameters = Array.isArray(command.parameters) ? command.parameters : null;
  if (typeof command.code !== "number" || parameters === null) {
    return null;
  }

  const simpleExpression = moveRouteSimpleExpressionFromCode(command.code);
  if (simpleExpression !== null) {
    return parameters.length === 0 ? { expression: simpleExpression, helperNames: [] } : null;
  }

  switch (command.code) {
    case 14:
      return typeof parameters[0] === "number" && typeof parameters[1] === "number"
        ? {
            expression: `{ kind: "jump", x: ${parameters[0]}, y: ${parameters[1]} }`,
            helperNames: [],
          }
        : null;
    case 15:
      return typeof parameters[0] === "number"
        ? { expression: `{ kind: "routeWait", frames: ${parameters[0]} }`, helperNames: [] }
        : null;
    case 27:
    case 28: {
      const switchId = readPositiveInteger(parameters[0]);
      return switchId === null
        ? null
        : {
            expression: `{ kind: ${literal(command.code === 27 ? "switchOn" : "switchOff")}, switch: switchRef({ id: ${switchId} }) }`,
            helperNames: ["switchRef"],
          };
    }
    case 29:
      return typeof parameters[0] === "number"
        ? { expression: `{ kind: "changeSpeed", speed: ${parameters[0]} }`, helperNames: [] }
        : null;
    case 30:
      return typeof parameters[0] === "number"
        ? {
            expression: `{ kind: "changeFrequency", frequency: ${parameters[0]} }`,
            helperNames: [],
          }
        : null;
    case 31:
    case 32:
      return {
        expression: `{ kind: "walkAnimation", enabled: ${command.code === 31} }`,
        helperNames: [],
      };
    case 33:
    case 34:
      return {
        expression: `{ kind: "stepAnimation", enabled: ${command.code === 33} }`,
        helperNames: [],
      };
    case 35:
    case 36:
      return {
        expression: `{ kind: "directionFix", enabled: ${command.code === 35} }`,
        helperNames: [],
      };
    case 37:
    case 38:
      return {
        expression: `{ kind: "through", enabled: ${command.code === 37} }`,
        helperNames: [],
      };
    case 39:
    case 40:
      return {
        expression: `{ kind: "transparent", enabled: ${command.code === 39} }`,
        helperNames: [],
      };
    case 41:
      return typeof parameters[0] === "string" && typeof parameters[1] === "number"
        ? {
            expression: `{ kind: "changeImage", image: imageAsset({ folder: "characters", name: ${literal(parameters[0])} }), index: ${parameters[1]} }`,
            helperNames: ["imageAsset"],
          }
        : null;
    case 42:
      return typeof parameters[0] === "number"
        ? { expression: `{ kind: "changeOpacity", opacity: ${parameters[0]} }`, helperNames: [] }
        : null;
    case 43:
      return isBlendMode(parameters[0])
        ? {
            expression: `{ kind: "changeBlendMode", blendMode: ${parameters[0]} }`,
            helperNames: [],
          }
        : null;
    case 44:
      return renderMoveRoutePlaySe(parameters[0]);
    case 45:
      return typeof parameters[0] === "string"
        ? {
            expression: `{ kind: "script", script: scriptInput({ code: ${literal(parameters[0])} }) }`,
            helperNames: ["scriptInput"],
          }
        : null;
    default:
      return null;
  }
}

export function moveRouteSimpleExpressionFromCode(code: number): string | null {
  switch (code) {
    case 1:
      return `{ kind: "moveDown" }`;
    case 2:
      return `{ kind: "moveLeft" }`;
    case 3:
      return `{ kind: "moveRight" }`;
    case 4:
      return `{ kind: "moveUp" }`;
    case 5:
      return `{ kind: "moveLowerLeft" }`;
    case 6:
      return `{ kind: "moveLowerRight" }`;
    case 7:
      return `{ kind: "moveUpperLeft" }`;
    case 8:
      return `{ kind: "moveUpperRight" }`;
    case 9:
      return `{ kind: "moveRandom" }`;
    case 10:
      return `{ kind: "moveTowardPlayer" }`;
    case 11:
      return `{ kind: "moveAwayFromPlayer" }`;
    case 12:
      return `{ kind: "moveForward" }`;
    case 13:
      return `{ kind: "moveBackward" }`;
    case 16:
      return `{ kind: "turnDown" }`;
    case 17:
      return `{ kind: "turnLeft" }`;
    case 18:
      return `{ kind: "turnRight" }`;
    case 19:
      return `{ kind: "turnUp" }`;
    case 20:
      return `{ kind: "turn90Right" }`;
    case 21:
      return `{ kind: "turn90Left" }`;
    case 22:
      return `{ kind: "turn180" }`;
    case 23:
      return `{ kind: "turn90RightOrLeft" }`;
    case 24:
      return `{ kind: "turnRandom" }`;
    case 25:
      return `{ kind: "turnTowardPlayer" }`;
    case 26:
      return `{ kind: "turnAwayFromPlayer" }`;
    default:
      return null;
  }
}

export function renderMoveRoutePlaySe(
  value: unknown,
): { expression: string; helperNames: readonly string[] } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const audio = value as Record<string, unknown>;
  if (
    typeof audio.name !== "string" ||
    typeof audio.volume !== "number" ||
    typeof audio.pitch !== "number" ||
    typeof audio.pan !== "number"
  ) {
    return null;
  }

  return {
    expression: `{ kind: "playSe", audio: { asset: audioAsset({ folder: "se", name: ${literal(audio.name)} }), volume: ${audio.volume}, pitch: ${audio.pitch}, pan: ${audio.pan} } }`,
    helperNames: ["audioAsset"],
  };
}

export function renderCharacterRuntimeSelector(
  value: unknown,
): { expression: string; helperNames: readonly string[] } | null {
  if (value === -1) {
    return {
      expression: `{ kind: "runtimeSelector", scope: "character", target: "player" }`,
      helperNames: [],
    };
  }
  if (value === 0) {
    return {
      expression: `{ kind: "runtimeSelector", scope: "character", target: "currentEvent" }`,
      helperNames: [],
    };
  }
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return {
      expression: `{ kind: "runtimeSelector", scope: "character", target: "event", id: ${value} }`,
      helperNames: [],
    };
  }

  return null;
}

export function renderOptionalDirectionAndFade(
  direction: 2 | 4 | 6 | 8,
  fadeType: 0 | 1 | 2,
): string {
  const fields: string[] = [];
  if (direction !== 2) {
    fields.push(`direction: ${direction}`);
  }
  if (fadeType !== 0) {
    fields.push(`fadeType: ${fadeType}`);
  }

  return fields.length === 0 ? "" : `, ${fields.join(", ")}`;
}

export function renderOptionalEventDirection(direction: 0 | 2 | 4 | 6 | 8): string {
  return direction === 0 ? "" : `, direction: ${direction}`;
}

export function balloonIconFromCode(value: unknown): string | null {
  switch (value) {
    case 1:
      return '"exclamation"';
    case 2:
      return '"question"';
    case 3:
      return '"musicNote"';
    case 4:
      return '"heart"';
    case 5:
      return '"anger"';
    case 6:
      return '"sweat"';
    case 7:
      return '"cobweb"';
    case 8:
      return '"silence"';
    case 9:
      return '"lightBulb"';
    case 10:
      return '"zzz"';
    default:
      return typeof value === "number" && Number.isInteger(value) && value > 0
        ? String(value)
        : null;
  }
}
