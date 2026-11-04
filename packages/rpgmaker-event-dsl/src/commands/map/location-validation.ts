import { CommandStructureError } from "../../validation/command-errors.js";
import { describeValue } from "../../project-data/json-values.js";

export function assertMapLocationInput(
  kind: "transferPlayer" | "setVehicleLocation" | "setEventLocation" | "getLocationInfo",
  value: unknown,
  path = kind as string,
  withKind = true,
): void {
  const fail = (at: string, expected: string, actual: unknown): never => {
    const code = {
      transferPlayer: 201,
      setVehicleLocation: 202,
      setEventLocation: 203,
      getLocationInfo: 285,
    }[kind];
    throw new CommandStructureError(`MV-E${code}`, "Invalid map location command input.", {
      dslPath: at,
      expected,
      actual: describeValue(actual),
    });
  };
  const record = (
    input: unknown,
    fields: readonly string[],
    at: string,
  ): Record<string, unknown> => {
    if (
      typeof input !== "object" ||
      input === null ||
      Array.isArray(input) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(input))
    )
      fail(at, "plain object containing supported own data fields", input);
    for (const key of Reflect.ownKeys(input as object)) {
      const descriptor = Object.getOwnPropertyDescriptor(input, key)!;
      if (
        typeof key !== "string" ||
        !fields.includes(key) ||
        !("value" in descriptor) ||
        !descriptor.enumerable
      )
        fail(at, `only ${fields.join(", ")}`, `unsupported field ${String(key)}`);
    }
    return input as Record<string, unknown>;
  };
  const ref = (input: unknown, referenceKind: "map" | "variable", at: string) => {
    const data = record(input, ["kind", "id", "name"], at);
    if (
      data.kind !== referenceKind ||
      Object.hasOwn(data, "id") === Object.hasOwn(data, "name") ||
      (Object.hasOwn(data, "id")
        ? !Number.isSafeInteger(data.id) || (data.id as number) <= 0
        : typeof data.name !== "string")
    )
      fail(at, `${referenceKind} reference with exactly one positive id or string name`, input);
  };
  const coordinate = (input: unknown, at: string) => {
    if (
      !Number.isInteger(input) ||
      Object.is(input, -0) ||
      (input as number) < 0 ||
      (input as number) > 2147483647
    )
      fail(at, "integer 0..2147483647, excluding negative zero", input);
  };
  const fields = {
    transferPlayer: ["destination", "direction", "fade"],
    setVehicleLocation: ["vehicle", "destination"],
    setEventLocation: ["target", "destination", "direction"],
    getLocationInfo: ["variable", "info", "location"],
  }[kind];
  const node = record(value, [...(withKind ? ["kind"] : []), ...fields], path);
  if (withKind && node.kind !== kind) fail(`${path}.kind`, kind, node.kind);
  const selector = (input: unknown, at: string) => {
    const data = record(input, ["kind", "scope", "target", "id"], at);
    if (
      data.kind !== "runtimeSelector" ||
      data.scope !== "character" ||
      (data.target !== "currentEvent" && data.target !== "event")
    )
      fail(at, "currentEvent or event character Runtime Selector (player is unsupported)", input);
    if (data.target === "event") {
      if (!Number.isSafeInteger(data.id) || (data.id as number) <= 0)
        fail(`${at}.id`, "positive event selector id", data.id);
    } else if (Object.hasOwn(data, "id"))
      fail(`${at}.id`, "no id on currentEvent selector", data.id);
  };
  const hasMap = kind === "transferPlayer" || kind === "setVehicleLocation";
  const field = kind === "getLocationInfo" ? "location" : "destination";
  const at = `${path}.${field}`;
  const destination = record(
    node[field],
    [
      "kind",
      ...(hasMap ? ["map"] : []),
      "x",
      "y",
      ...(kind === "setEventLocation" ? ["target"] : []),
    ],
    at,
  );
  if (destination.kind === "exchange" && kind === "setEventLocation") {
    record(destination, ["kind", "target"], at);
    selector(destination.target, `${at}.target`);
  } else {
    record(destination, ["kind", ...(hasMap ? ["map"] : []), "x", "y"], at);
    if (destination.kind !== "direct" && destination.kind !== "variables")
      fail(`${at}.kind`, "direct or variables", destination.kind);
    if (hasMap)
      ref(destination.map, destination.kind === "direct" ? "map" : "variable", `${at}.map`);
    for (const axis of ["x", "y"]) {
      if (destination.kind === "direct") coordinate(destination[axis], `${at}.${axis}`);
      else ref(destination[axis], "variable", `${at}.${axis}`);
    }
  }
  if (
    (kind === "transferPlayer" || kind === "setEventLocation") &&
    node.direction !== undefined &&
    !["retain", "down", "left", "right", "up"].includes(node.direction as string)
  )
    fail(`${path}.direction`, "retain, down, left, right or up", node.direction);
  if (
    kind === "transferPlayer" &&
    node.fade !== undefined &&
    !["black", "white", "none"].includes(node.fade as string)
  )
    fail(`${path}.fade`, "black, white or none", node.fade);
  if (
    kind === "setVehicleLocation" &&
    !["boat", "ship", "airship"].includes(node.vehicle as string)
  )
    fail(`${path}.vehicle`, "boat, ship or airship", node.vehicle);
  if (kind === "setEventLocation") selector(node.target, `${path}.target`);
  if (kind === "getLocationInfo") {
    ref(node.variable, "variable", `${path}.variable`);
    if (
      ![
        "terrainTag",
        "eventId",
        "tileLayer1",
        "tileLayer2",
        "tileLayer3",
        "tileLayer4",
        "regionId",
      ].includes(node.info as string)
    )
      fail(`${path}.info`, "one of the seven Location Info queries", node.info);
  }
}
