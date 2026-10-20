import { assertDslObject } from "../../validation/dsl-command-inputs.js";
import { CommandStructureError } from "../../validation/command-errors.js";
import { describeValue } from "../../project-data/json-values.js";
import type { ReferenceResolver } from "../../validation/types.js";
import type { ReferenceValue } from "../../domain/types.js";

export function assertMapAppearanceInput(
  kind: string,
  input: unknown,
  path: string,
  withKind = false,
  resolver?: ReferenceResolver,
): void {
  const fields: Record<string, readonly string[]> = {
    changeMapNameDisplay: ["enabled"],
    changeTileset: ["tileset"],
    changeBattleBack: ["battleback1", "battleback2"],
    changeParallax: ["image", "loopX", "loopY", "sx", "sy"],
  };
  if (!Object.hasOwn(fields, kind)) return;
  assertDslObject(input, [...(withKind ? ["kind"] : []), ...fields[kind]!], path);
  if (kind === "changeParallax") {
    assertImageSlot(input.image, "parallaxes", `${path}.image`, 284);
    for (const field of ["loopX", "loopY", "sx", "sy"]) {
      const value = input[field];
      const boolean = field === "loopX" || field === "loopY";
      if (
        boolean
          ? typeof value !== "boolean"
          : !Number.isSafeInteger(value) || (value as number) < -32 || (value as number) > 32
      )
        throw new CommandStructureError(
          "MV-E284-INPUT",
          "Invalid independently saved parallax configuration.",
          {
            dslPath: `${path}.${field}`,
            expected: boolean ? "boolean" : "integer -32..32",
            actual: describeValue(value),
          },
        );
    }
    return;
  }
  if (kind === "changeBattleBack") {
    assertImageSlot(input.battleback1, "battlebacks1", `${path}.battleback1`, 283);
    assertImageSlot(input.battleback2, "battlebacks2", `${path}.battleback2`, 283);
    return;
  }
  if (kind === "changeMapNameDisplay") {
    if (typeof input.enabled !== "boolean")
      throw new CommandStructureError(
        "MV-E281-INPUT",
        "Map name display requires an explicit boolean.",
        {
          dslPath: `${path}.enabled`,
          expected: "boolean",
          actual: describeValue(input.enabled),
        },
      );
    return;
  }
  const expected = "tileset reference with one positive integer ID or nonempty name; no None";
  const fail = (): never => {
    throw new CommandStructureError("MV-E282-INPUT", "Invalid tileset reference.", {
      dslPath: `${path}.tileset`,
      expected,
      actual: describeValue(input.tileset),
    });
  };
  if (input.tileset === null || typeof input.tileset !== "object") fail();
  const reference = input.tileset as Record<string, unknown>;
  assertDslObject(reference, ["kind", "id", "name"], `${path}.tileset`);
  if (
    reference.kind !== "tileset" ||
    Object.hasOwn(reference, "id") === Object.hasOwn(reference, "name")
  )
    fail();
  if (
    Object.hasOwn(reference, "id")
      ? !Number.isSafeInteger(reference.id) || (reference.id as number) <= 0
      : typeof reference.name !== "string" || reference.name.length === 0
  )
    fail();
  if (resolver)
    try {
      resolver.resolveReference(reference as ReferenceValue<"tileset">);
    } catch (error) {
      throw new CommandStructureError(
        "MV-E282-REFERENCE",
        error instanceof Error ? error.message : String(error),
        {
          dslPath: `${path}.tileset`,
          expected: "existing tileset in the Project Data Snapshot",
          actual: describeValue(reference),
        },
      );
    }
}

function assertImageSlot(value: unknown, folder: string, path: string, code: number): void {
  if (value === null) return;
  const fail = (): never => {
    throw new CommandStructureError(
      `MV-E${code}-INPUT`,
      "Expected an explicit image Asset Reference or None.",
      {
        dslPath: path,
        expected: `${folder} image Asset Reference with nonempty name, or null`,
        actual: describeValue(value),
      },
    );
  };
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail();
  const asset = value as Record<string, unknown>;
  assertDslObject(asset, ["kind", "category", "folder", "name"], path);
  if (
    asset.kind !== "asset" ||
    asset.category !== "image" ||
    asset.folder !== folder ||
    typeof asset.name !== "string" ||
    asset.name.length === 0
  )
    fail();
}
