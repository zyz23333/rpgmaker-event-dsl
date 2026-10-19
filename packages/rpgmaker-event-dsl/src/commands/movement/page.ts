import type { AutonomousMovement } from "../../domain/types.js";
import type { ReferenceResolver } from "../../validation/types.js";
import { CommandStructureError } from "../../validation/command-errors.js";
import { compileMovementRoute } from "./compile.js";
import { assertNativeMovementRoute } from "./validation.js";
import type { NativeMovementRoute } from "./types.js";

export const movementTypes = ["fixed", "random", "approach", "custom"] as const;

export function compilePageMovement(
  value: AutonomousMovement | undefined,
  resolver: ReferenceResolver,
  path = "movement",
) {
  if (value !== undefined) {
    const fail = (field: string, expected: string, actual: unknown): never => {
      throw new CommandStructureError(
        "MV-PAGE-MOVEMENT",
        "Invalid Autonomous Movement configuration.",
        { dslPath: `${path}${field}`, expected, actual: String(actual) },
      );
    };
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(value))
    )
      fail("", "movement object", value);
    if (
      Reflect.ownKeys(value).some((key) => {
        const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
        return (
          typeof key !== "string" ||
          !["type", "speed", "frequency", "route"].includes(key) ||
          !("value" in descriptor) ||
          !descriptor.enumerable
        );
      })
    )
      fail("", "type/speed/frequency/route only", "extra field");
    if (value.type !== undefined && !movementTypes.includes(value.type))
      fail(".type", movementTypes.join("/"), value.type);
    for (const [field, maximum] of [
      ["speed", 6],
      ["frequency", 5],
    ] as const) {
      const number = value[field];
      if (number !== undefined && (!Number.isInteger(number) || number < 1 || number > maximum))
        fail(`.${field}`, `integer 1..${maximum}`, number);
    }
  }
  return {
    moveType: movementTypes.indexOf(value?.type ?? "fixed"),
    moveSpeed: value?.speed ?? 3,
    moveFrequency: value?.frequency ?? 3,
    moveRoute: compileMovementRoute(
      value?.route === undefined ? { commands: [] } : value.route,
      resolver,
      `${path}.route`,
    ),
  };
}

export type NativePageMovement = {
  type: (typeof movementTypes)[number];
  speed: number;
  frequency: number;
  route: NativeMovementRoute;
};

export function readNativePageMovement(
  page: Record<string, unknown>,
  path: string,
): NativePageMovement | undefined {
  if (
    !["moveType", "moveSpeed", "moveFrequency", "moveRoute"].some((key) => Object.hasOwn(page, key))
  )
    return undefined;
  assertNativeMovementRoute(page.moveRoute, `${path}.moveRoute`);
  for (const [field, minimum, maximum] of [
    ["moveType", 0, 3],
    ["moveSpeed", 1, 6],
    ["moveFrequency", 1, 5],
  ] as const) {
    const value = page[field];
    if (
      !Number.isInteger(value) ||
      (value as number) < minimum ||
      (value as number) > maximum ||
      Object.is(value, -0)
    )
      throw new CommandStructureError(
        "MV-PAGE-MOVEMENT",
        "Invalid native Autonomous Movement configuration.",
        {
          nativePath: `${path}.${field}`,
          expected: `integer ${minimum}..${maximum}`,
          actual: Object.hasOwn(page, field) ? String(value) : "<missing>",
        },
      );
  }
  return {
    type: movementTypes[page.moveType as number]!,
    speed: page.moveSpeed as number,
    frequency: page.moveFrequency as number,
    route: page.moveRoute,
  };
}
