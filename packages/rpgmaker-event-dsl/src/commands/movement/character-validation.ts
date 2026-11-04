import { assertDslObject } from "../../validation/dsl-command-inputs.js";
import { CommandStructureError } from "../../validation/command-errors.js";
import { describeValue } from "../../project-data/json-values.js";
import { scrollDirections } from "./character-codes.js";
import type { ReferenceResolver } from "../../validation/types.js";
import type { ReferenceValue } from "../../domain/types.js";

const definitions = {
  scrollMap: { code: 204, fields: ["direction", "distance", "speed"] },
  getOnOffVehicle: { code: 206, fields: [] },
  changeTransparency: { code: 211, fields: ["transparent"] },
  showAnimation: { code: 212, fields: ["target", "animation", "wait"] },
  showBalloonIcon: { code: 213, fields: ["target", "balloon", "wait"] },
  eraseEvent: { code: 214, fields: [] },
  changePlayerFollowers: { code: 216, fields: ["visible"] },
  gatherFollowers: { code: 217, fields: [] },
} as const;

export type MapCharacterKind = keyof typeof definitions;

export function isMapCharacterKind(kind: string): kind is MapCharacterKind {
  return Object.hasOwn(definitions, kind);
}

export function assertMapCharacterInput(
  kind: MapCharacterKind,
  input: unknown,
  path = kind as string,
  withKind = true,
  resolver?: ReferenceResolver,
): void {
  const { code, fields } = definitions[kind];
  assertDslObject(input, withKind ? ["kind", ...fields] : fields, path);
  const fail = (at: string, expected: string, actual: unknown): never => {
    throw new CommandStructureError(`MV-E${code}-INPUT`, "Invalid map character command input.", {
      dslPath: at,
      expected,
      actual: describeValue(actual),
    });
  };
  for (const field of fields)
    if (!Object.hasOwn(input, field) || input[field] === undefined)
      fail(
        `${path}.${field}`,
        "required defined own field",
        Object.hasOwn(input, field) ? undefined : "missing",
      );
  const integer = (field: string, minimum: number, maximum: number) => {
    if (
      !Number.isSafeInteger(input[field]) ||
      (input[field] as number) < minimum ||
      (input[field] as number) > maximum
    )
      fail(`${path}.${field}`, `integer ${minimum}..${maximum}`, input[field]);
  };
  if (kind === "scrollMap") {
    if (typeof input.direction !== "string" || !Object.hasOwn(scrollDirections, input.direction))
      fail(`${path}.direction`, "down, left, right or up", input.direction);
    integer("distance", 0, 100);
    integer("speed", 1, 6);
  }
  const flag =
    kind === "changeTransparency"
      ? "transparent"
      : kind === "changePlayerFollowers"
        ? "visible"
        : kind === "showAnimation" || kind === "showBalloonIcon"
          ? "wait"
          : undefined;
  if (flag && typeof input[flag] !== "boolean")
    fail(`${path}.${flag}`, "explicit boolean", input[flag]);
  if (kind !== "showAnimation" && kind !== "showBalloonIcon") return;
  const target = input.target;
  const targetPath = `${path}.target`;
  assertDslObject(target, ["kind", "scope", "target", "id"], targetPath);
  if (
    target.kind !== "runtimeSelector" ||
    target.scope !== "character" ||
    !["player", "currentEvent", "event"].includes(target.target as string) ||
    (target.target === "event"
      ? !Number.isSafeInteger(target.id) || (target.id as number) <= 0
      : Object.hasOwn(target, "id"))
  )
    fail(
      targetPath,
      "character player/currentEvent, or event with positive safe integer id",
      target,
    );
  if (kind === "showAnimation") {
    const animation = input.animation;
    const at = `${path}.animation`;
    assertDslObject(animation, ["kind", "id", "name"], at);
    if (
      animation.kind !== "animation" ||
      Object.hasOwn(animation, "id") === Object.hasOwn(animation, "name") ||
      (Object.hasOwn(animation, "id")
        ? !Number.isSafeInteger(animation.id) || (animation.id as number) <= 0
        : typeof animation.name !== "string")
    )
      fail(
        at,
        "animation reference with exactly one positive safe integer id or string name",
        animation,
      );
    if (resolver) {
      try {
        resolver.resolveReference(animation as ReferenceValue<"animation">);
      } catch (error) {
        throw new CommandStructureError(
          "MV-E212-REFERENCE",
          error instanceof Error ? error.message : String(error),
          {
            dslPath: at,
            expected: "existing uniquely resolved animation reference",
            actual: describeValue(animation),
          },
        );
      }
    }
  } else if (
    typeof input.balloon !== "string" ||
    ![
      "exclamation",
      "question",
      "musicNote",
      "heart",
      "anger",
      "sweat",
      "cobweb",
      "silence",
      "lightBulb",
      "zzz",
      "userDefined1",
      "userDefined2",
      "userDefined3",
      "userDefined4",
      "userDefined5",
    ].includes(input.balloon)
  )
    fail(`${path}.balloon`, "one of the fifteen named balloon icons", input.balloon);
}

export function assertParameterlessCharacterCall(kind: MapCharacterKind, args: IArguments): void {
  if (args.length > 0)
    throw new CommandStructureError(
      `MV-E${definitions[kind].code}-INPUT`,
      "This command accepts no arguments.",
      {
        dslPath: kind,
        expected: "no arguments",
        actual: `${args.length} arguments`,
      },
    );
}
