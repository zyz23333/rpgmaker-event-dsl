import type { RawEventCommand, RenderedCommand } from "../../decompiler/types.js";
import { isBlendMode, isNumberTuple, literal, readPositiveInteger } from "../../decompiler/core.js";

export function renderTintScreen(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const tone = renderTone(command.parameters[0]);
  const duration = command.parameters[1];
  const wait = command.parameters[2];

  return tone === null || typeof duration !== "number" || typeof wait !== "boolean"
    ? null
    : {
        expression: `tintScreen({ tone: ${tone}, duration: ${duration}${wait ? ", wait: true" : ""} })`,
        helperNames: ["tintScreen"],
      };
}

export function renderFlashScreen(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const color = renderColor(command.parameters[0]);
  const duration = command.parameters[1];
  const wait = command.parameters[2];

  return color === null || typeof duration !== "number" || typeof wait !== "boolean"
    ? null
    : {
        expression: `flashScreen({ color: ${color}, duration: ${duration}${wait ? ", wait: true" : ""} })`,
        helperNames: ["flashScreen"],
      };
}

export function renderShakeScreen(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const power = command.parameters[0];
  const speed = command.parameters[1];
  const duration = command.parameters[2];
  const wait = command.parameters[3];

  return typeof power !== "number" ||
    typeof speed !== "number" ||
    typeof duration !== "number" ||
    typeof wait !== "boolean"
    ? null
    : {
        expression: `shakeScreen({ power: ${power}, speed: ${speed}, duration: ${duration}${wait ? ", wait: true" : ""} })`,
        helperNames: ["shakeScreen"],
      };
}

export function renderShowPicture(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const pictureId = readPositiveInteger(command.parameters[0]);
  const imageName = command.parameters[1];
  const position = renderPicturePosition(
    command.parameters[2],
    command.parameters[3],
    command.parameters[4],
    command.parameters[5],
  );
  const display = renderPictureDisplay(
    command.parameters[6],
    command.parameters[7],
    command.parameters[8],
    command.parameters[9],
  );

  return pictureId === null ||
    typeof imageName !== "string" ||
    position === null ||
    display === null
    ? null
    : {
        expression: `showPicture({ pictureId: ${pictureId}, image: imageAsset({ folder: "pictures", name: ${literal(imageName)} }), position: ${position.expression}${display} })`,
        helperNames: ["imageAsset", "showPicture", ...position.helperNames],
      };
}

export function renderMovePicture(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const pictureId = readPositiveInteger(command.parameters[0]);
  const position = renderPicturePosition(
    command.parameters[2],
    command.parameters[3],
    command.parameters[4],
    command.parameters[5],
  );
  const display = renderPictureDisplay(
    command.parameters[6],
    command.parameters[7],
    command.parameters[8],
    command.parameters[9],
  );
  const duration = command.parameters[10];
  const wait = command.parameters[11];

  return pictureId === null ||
    position === null ||
    display === null ||
    typeof duration !== "number" ||
    typeof wait !== "boolean"
    ? null
    : {
        expression: `movePicture({ pictureId: ${pictureId}, position: ${position.expression}${display}, duration: ${duration}${wait ? ", wait: true" : ""} })`,
        helperNames: ["movePicture", ...position.helperNames],
      };
}

export function renderRotatePicture(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const pictureId = readPositiveInteger(command.parameters[0]);
  const speed = command.parameters[1];

  return pictureId === null || typeof speed !== "number"
    ? null
    : {
        expression: `rotatePicture({ pictureId: ${pictureId}, speed: ${speed} })`,
        helperNames: ["rotatePicture"],
      };
}

export function renderTintPicture(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const pictureId = readPositiveInteger(command.parameters[0]);
  const tone = renderTone(command.parameters[1]);
  const duration = command.parameters[2];
  const wait = command.parameters[3];

  return pictureId === null ||
    tone === null ||
    typeof duration !== "number" ||
    typeof wait !== "boolean"
    ? null
    : {
        expression: `tintPicture({ pictureId: ${pictureId}, tone: ${tone}, duration: ${duration}${wait ? ", wait: true" : ""} })`,
        helperNames: ["tintPicture"],
      };
}

export function renderErasePicture(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const pictureId = readPositiveInteger(command.parameters[0]);
  return pictureId === null
    ? null
    : {
        expression: `erasePicture({ pictureId: ${pictureId} })`,
        helperNames: ["erasePicture"],
      };
}

export function renderSetWeatherEffect(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const weather = weatherEffectFromCode(command.parameters[0]);
  const power = command.parameters[1];
  const duration = command.parameters[2];
  const wait = command.parameters[3];

  return weather === null ||
    typeof power !== "number" ||
    typeof duration !== "number" ||
    typeof wait !== "boolean"
    ? null
    : {
        expression: `setWeatherEffect({ weather: ${literal(weather)}, power: ${power}, duration: ${duration}${wait ? ", wait: true" : ""} })`,
        helperNames: ["setWeatherEffect"],
      };
}

export function renderPicturePosition(
  originParameter: unknown,
  designation: unknown,
  xParameter: unknown,
  yParameter: unknown,
): { expression: string; helperNames: readonly string[] } | null {
  const origin = pictureOriginFromCode(originParameter);
  if (origin === null) {
    return null;
  }

  if (designation === 0 && typeof xParameter === "number" && typeof yParameter === "number") {
    return {
      expression: `{ kind: "direct", x: ${xParameter}, y: ${yParameter}${origin === "center" ? ', origin: "center"' : ""} }`,
      helperNames: [],
    };
  }

  if (designation === 1) {
    const xVariableId = readPositiveInteger(xParameter);
    const yVariableId = readPositiveInteger(yParameter);
    return xVariableId === null || yVariableId === null
      ? null
      : {
          expression: `{ kind: "variables", x: variableRef({ id: ${xVariableId} }), y: variableRef({ id: ${yVariableId} })${origin === "center" ? ', origin: "center"' : ""} }`,
          helperNames: ["variableRef"],
        };
  }

  return null;
}

export function renderCommandPosition(
  designation: unknown,
  xParameter: unknown,
  yParameter: unknown,
): { expression: string; helperNames: readonly string[] } | null {
  if (designation === 0 && typeof xParameter === "number" && typeof yParameter === "number") {
    return {
      expression: `{ kind: "direct", x: ${xParameter}, y: ${yParameter} }`,
      helperNames: [],
    };
  }

  if (designation === 1) {
    const xVariableId = readPositiveInteger(xParameter);
    const yVariableId = readPositiveInteger(yParameter);
    return xVariableId === null || yVariableId === null
      ? null
      : {
          expression: `{ kind: "variables", x: variableRef({ id: ${xVariableId} }), y: variableRef({ id: ${yVariableId} }) }`,
          helperNames: ["variableRef"],
        };
  }

  return null;
}

export function renderPictureDisplay(
  scaleX: unknown,
  scaleY: unknown,
  opacity: unknown,
  blendMode: unknown,
): string | null {
  if (
    typeof scaleX !== "number" ||
    typeof scaleY !== "number" ||
    typeof opacity !== "number" ||
    !isBlendMode(blendMode)
  ) {
    return null;
  }

  const fields: string[] = [];
  if (scaleX !== 100) {
    fields.push(`scaleX: ${scaleX}`);
  }
  if (scaleY !== 100) {
    fields.push(`scaleY: ${scaleY}`);
  }
  if (opacity !== 255) {
    fields.push(`opacity: ${opacity}`);
  }
  if (blendMode !== 0) {
    fields.push(`blendMode: ${blendMode}`);
  }

  return fields.length === 0 ? "" : `, ${fields.join(", ")}`;
}

export function renderTone(value: unknown): string | null {
  return isNumberTuple(value, 4) ? literal(value) : null;
}

export function renderColor(value: unknown): string | null {
  return isNumberTuple(value, 4) ? literal(value) : null;
}

export function pictureOriginFromCode(value: unknown): "upperLeft" | "center" | null {
  if (value === 0) {
    return "upperLeft";
  }
  if (value === 1) {
    return "center";
  }

  return null;
}

export function weatherEffectFromCode(value: unknown): "none" | "rain" | "storm" | "snow" | null {
  if (value === "none" || value === "rain" || value === "storm" || value === "snow") {
    return value;
  }

  return null;
}
