import type { ReferenceValue } from "../../domain/types.js";
import { describeValue } from "../../project-data/json-values.js";
import { CommandStructureError } from "../../validation/command-errors.js";
import { assertDslObject } from "../../validation/dsl-command-inputs.js";
import type { ReferenceResolver } from "../../validation/types.js";

const commands = {
  nameInputProcessing: { code: 303, fields: ["actor", "maxCharacters"] },
  changeName: { code: 320, fields: ["actor", "name"] },
  changeActorImages: { code: 322, fields: ["actor", "character", "face", "battler"] },
  changeVehicleImage: { code: 323, fields: ["vehicle", "image", "index"] },
  changeNickname: { code: 324, fields: ["actor", "nickname"] },
  changeProfile: { code: 325, fields: ["actor", "profile"] },
} as const;

export function assertActorPresentationInput(
  kind: string,
  input: unknown,
  path: string,
  withKind = false,
  resolver?: ReferenceResolver,
): void {
  if (!Object.hasOwn(commands, kind)) return;
  const family = kind as keyof typeof commands;
  const { code, fields } = commands[family];
  assertDslObject(input, [...(withKind ? ["kind"] : []), ...fields], path);
  const fail = (at: string, expected: string, actual: unknown): never => {
    throw new CommandStructureError(
      `MV-E${code}-INPUT`,
      "Invalid saved Actor presentation input.",
      {
        dslPath: at,
        expected,
        actual: describeValue(actual),
      },
    );
  };
  const integer = (
    value: unknown,
    minimum: number,
    maximum: number,
    at: string,
    excludeNegativeZero = false,
  ): void => {
    if (
      !Number.isSafeInteger(value) ||
      (value as number) < minimum ||
      (value as number) > maximum ||
      (excludeNegativeZero && Object.is(value, -0))
    )
      fail(
        at,
        `integer ${minimum}..${maximum}${excludeNegativeZero ? ", excluding negative zero" : ""}`,
        value,
      );
  };
  const image = (value: unknown, folder: string, at: string): void => {
    if (value === null) return;
    assertDslObject(value, ["kind", "category", "folder", "name"], at);
    if (
      value.kind !== "asset" ||
      value.category !== "image" ||
      value.folder !== folder ||
      typeof value.name !== "string" ||
      value.name.length === 0
    )
      fail(at, `${folder} Image Asset Reference or null`, value);
  };
  if (family !== "changeVehicleImage") {
    const actor = input.actor;
    const at = `${path}.actor`;
    assertDslObject(actor, ["kind", "id", "name"], at);
    if (
      actor.kind !== "actor" ||
      Object.hasOwn(actor, "id") === Object.hasOwn(actor, "name") ||
      (Object.hasOwn(actor, "id")
        ? !Number.isSafeInteger(actor.id) || (actor.id as number) <= 0
        : typeof actor.name !== "string" || actor.name.length === 0)
    )
      fail(at, "Actor reference with one positive safe integer ID or nonempty name", actor);
    if (resolver) {
      try {
        resolver.resolveReference(actor as ReferenceValue<"actor">);
      } catch (error) {
        throw new CommandStructureError(
          `MV-E${code}-REFERENCE`,
          error instanceof Error ? error.message : String(error),
          {
            dslPath: at,
            expected: "existing Actor in the Project Data Snapshot",
            actual: describeValue(actor),
          },
        );
      }
    }
  }
  if (family === "nameInputProcessing")
    integer(input.maxCharacters, 1, 16, `${path}.maxCharacters`);
  else if (family === "changeActorImages") {
    for (const field of ["character", "face"] as const) {
      const value = input[field];
      assertDslObject(value, ["image", "index"], `${path}.${field}`);
      image(value.image, field === "face" ? "faces" : "characters", `${path}.${field}.image`);
      integer(
        value.index,
        0,
        field === "face" ? 2147483647 : 7,
        `${path}.${field}.index`,
        field === "face",
      );
    }
    image(input.battler, "sv_actors", `${path}.battler`);
  } else if (family === "changeVehicleImage") {
    if (!["boat", "ship", "airship"].includes(input.vehicle as string))
      fail(`${path}.vehicle`, "boat, ship or airship", input.vehicle);
    image(input.image, "characters", `${path}.image`);
    integer(input.index, 0, 7, `${path}.index`);
  } else {
    const field =
      family === "changeName" ? "name" : family === "changeNickname" ? "nickname" : "profile";
    if (typeof input[field] !== "string")
      fail(`${path}.${field}`, "complete saved string", input[field]);
  }
}
