import { assertDslObject } from "../../validation/dsl-command-inputs.js";
import { CommandStructureError } from "../../validation/command-errors.js";
import { describeValue } from "../../project-data/json-values.js";
import type { ReferenceResolver } from "../../validation/types.js";
import type { ReferenceValue } from "../../domain/types.js";

const display = ["pictureId", "origin", "position", "scaleX", "scaleY", "opacity", "blendMode"];
const fields: Record<string, readonly string[]> = {
  showPicture: [...display, "image"],
  movePicture: [...display, "duration", "wait"],
  rotatePicture: ["pictureId", "speed"],
  tintPicture: ["pictureId", "tone", "duration", "wait"],
  erasePicture: ["pictureId"],
};

export function assertPictureInput(
  kind: string,
  input: unknown,
  path: string,
  withKind = false,
  resolver?: ReferenceResolver,
): void {
  if (!Object.hasOwn(fields, kind)) return;
  assertDslObject(input, [...(withKind ? ["kind"] : []), ...fields[kind]!], path);
  const codes: Record<string, number> = {
    showPicture: 231,
    movePicture: 232,
    rotatePicture: 233,
    tintPicture: 234,
    erasePicture: 235,
  };
  const code = codes[kind]!;
  const fail = (at: string, expected: string, actual: unknown): never => {
    throw new CommandStructureError(`MV-E${code}-INPUT`, "Invalid authored Picture parameter.", {
      dslPath: at,
      expected,
      actual: describeValue(actual),
    });
  };
  const integer = (value: unknown, minimum: number, maximum: number, at: string) => {
    if (!Number.isSafeInteger(value) || (value as number) < minimum || (value as number) > maximum)
      fail(at, `integer ${minimum}..${maximum}`, value);
  };
  integer(input.pictureId, 1, 100, `${path}.pictureId`);
  if (kind === "showPicture") {
    const image = input.image;
    if (image !== null) {
      assertDslObject(image, ["kind", "category", "folder", "name"], `${path}.image`);
      if (
        image.kind !== "asset" ||
        image.category !== "image" ||
        image.folder !== "pictures" ||
        typeof image.name !== "string" ||
        image.name.length === 0
      )
        fail(`${path}.image`, "pictures image Asset Reference with nonempty name, or null", image);
    }
  }
  if (kind === "showPicture" || kind === "movePicture") {
    if (!["upperLeft", "center"].includes(input.origin as string))
      fail(`${path}.origin`, "upperLeft or center", input.origin);
    if (!["normal", "additive", "multiply", "screen"].includes(input.blendMode as string))
      fail(`${path}.blendMode`, "normal, additive, multiply or screen", input.blendMode);
    for (const field of ["scaleX", "scaleY"])
      integer(input[field], -2000, 2000, `${path}.${field}`);
    integer(input.opacity, 0, 255, `${path}.opacity`);
    const position = input.position;
    assertDslObject(position, ["kind", "x", "y"], `${path}.position`);
    if (position.kind !== "direct" && position.kind !== "variables")
      fail(`${path}.position.kind`, "direct or variables", position.kind);
    for (const field of ["x", "y"]) {
      const at = `${path}.position.${field}`,
        value = position[field];
      if (position.kind === "direct") integer(value, -9999, 9999, at);
      else {
        assertDslObject(value, ["kind", "id", "name"], at);
        if (
          value.kind !== "variable" ||
          Object.hasOwn(value, "id") === Object.hasOwn(value, "name") ||
          (Object.hasOwn(value, "id")
            ? !Number.isSafeInteger(value.id) || (value.id as number) <= 0
            : typeof value.name !== "string")
        )
          fail(at, "variable reference with one positive integer id or string name", value);
        if (resolver)
          try {
            resolver.resolveReference(value as ReferenceValue<"variable">);
          } catch (error) {
            throw new CommandStructureError(
              `MV-E${code}-REFERENCE`,
              error instanceof Error ? error.message : String(error),
              {
                dslPath: at,
                expected: "existing System Variable Slot",
                actual: describeValue(value),
              },
            );
          }
      }
    }
  }
  if (kind === "rotatePicture") integer(input.speed, -90, 90, `${path}.speed`);
  if (kind === "tintPicture") {
    const tone = input.tone;
    assertDslObject(tone, ["red", "green", "blue", "gray"], `${path}.tone`);
    for (const field of ["red", "green", "blue", "gray"])
      integer(tone[field], field === "gray" ? 0 : -255, 255, `${path}.tone.${field}`);
  }
  if (kind === "movePicture" || kind === "tintPicture") {
    integer(input.duration, 1, 999, `${path}.duration`);
    if (typeof input.wait !== "boolean") fail(`${path}.wait`, "explicit boolean", input.wait);
  }
}
