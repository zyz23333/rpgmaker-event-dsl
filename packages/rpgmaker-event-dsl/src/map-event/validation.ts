import type { MapEventDefinition, PageConditions } from "../domain/types.js";
import type { ReferenceResolver, StagedDataGraph, ValidationIssue } from "../validation/types.js";
import { CommandStructureError } from "../validation/command-errors.js";
import { nativeDirections, pageDirections, pagePriorities, pageTriggers } from "./page.js";

function fail(path: string, expected: string, value: unknown, code = "MV-MAP-PAGE-INPUT"): never {
  throw new CommandStructureError(code, "Invalid Map Event input.", {
    dslPath: path,
    expected,
    actual: Object.is(value, -0) ? "-0" : String(value),
  });
}

function object(
  value: unknown,
  path: string,
  allowed: readonly string[],
  required: readonly string[] = [],
): Record<string, unknown> {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value))
  )
    fail(path, "plain object", value);
  const record = value as Record<string, unknown>;
  for (const key of Reflect.ownKeys(record)) {
    const descriptor = Object.getOwnPropertyDescriptor(record, key)!;
    if (
      typeof key !== "string" ||
      !allowed.includes(key) ||
      !("value" in descriptor) ||
      !descriptor.enumerable
    )
      fail(`${path}.${String(key)}`, "supported input field", key);
  }
  for (const key of required)
    if (!Object.hasOwn(record, key)) fail(`${path}.${key}`, "required field", "<missing>");
  return record;
}

function integer(
  value: unknown,
  path: string,
  min: number,
  max = Number.MAX_SAFE_INTEGER,
  allowNegativeZero = false,
): void {
  if (
    !Number.isSafeInteger(value) ||
    (!allowNegativeZero && Object.is(value, -0)) ||
    (value as number) < min ||
    (value as number) > max
  )
    fail(path, `integer ${min}..${max}`, value);
}

export function assertMapEventInput(event: MapEventDefinition): void {
  const record = object(
    event,
    "mapEvent",
    ["kind", "mapId", "id", "name", "x", "y", "note", "pages"],
    ["kind", "mapId", "id", "name", "x", "y", "pages"],
  );
  for (const field of ["mapId", "id"]) integer(record[field], field, 1);
  for (const field of ["x", "y"]) integer(record[field], field, 0);
  if (typeof record.name !== "string") fail("name", "string", record.name);
  if (record.note !== undefined && typeof record.note !== "string")
    fail("note", "string", record.note);
  if (!Array.isArray(record.pages) || record.pages.length === 0)
    fail("pages", "nonempty dense page array", record.pages);
  for (let index = 0; index < event.pages.length; index++)
    if (!Object.hasOwn(event.pages, index)) fail(`pages[${index}]`, "page", "<missing>");
}

export function assertPageConditions(
  value: PageConditions,
  resolver: ReferenceResolver,
  path = "conditions",
): void {
  const conditions = object(value, path, [
    "switch1",
    "switch2",
    "variable",
    "selfSwitch",
    "actor",
    "item",
  ]);
  for (const [field, slot] of Object.entries(conditions)) {
    if (slot === undefined) continue;
    const keys =
      field === "selfSwitch"
        ? ["enabled", "value"]
        : field === "variable"
          ? ["enabled", "ref", "atLeast"]
          : ["enabled", "ref"];
    const record = object(slot, `${path}.${field}`, keys, keys);
    if (typeof record.enabled !== "boolean")
      fail(`${path}.${field}.enabled`, "boolean", record.enabled);
    if (field === "selfSwitch") {
      if (!["A", "B", "C", "D"].includes(record.value as string))
        fail(`${path}.${field}.value`, "A/B/C/D", record.value);
      continue;
    }
    const ref = object(record.ref, `${path}.${field}.ref`, ["kind", "id", "name"], ["kind"]);
    const kind = field === "switch1" || field === "switch2" ? "switch" : field;
    if (ref.kind !== kind || Object.hasOwn(ref, "id") === Object.hasOwn(ref, "name"))
      fail(`${path}.${field}.ref`, `${kind} reference with exactly one ID or name`, record.ref);
    if ("id" in ref)
      integer(
        ref.id,
        `${path}.${field}.ref.id`,
        record.enabled ? 1 : 0,
        Number.MAX_SAFE_INTEGER,
        record.enabled === false,
      );
    else if (typeof ref.name !== "string" || ref.name.length === 0)
      fail(`${path}.${field}.ref.name`, "nonempty name", ref.name);
    if (field === "variable")
      integer(record.atLeast, `${path}.${field}.atLeast`, -99999999, 99999999, true);
    if (record.enabled || !("id" in ref)) {
      try {
        resolver.resolveReference(
          record.ref as Parameters<ReferenceResolver["resolveReference"]>[0],
        );
      } catch (error) {
        fail(
          `${path}.${field}.ref`,
          "existing unique reference",
          error instanceof Error ? error.message : error,
        );
      }
    }
  }
}

export function assertMapPageInput(
  value: unknown,
  resolver: ReferenceResolver,
  path: string,
): void {
  const page = object(
    value,
    path,
    ["conditions", "image", "movement", "priority", "options", "trigger", "commands"],
    ["commands"],
  );
  assertPageConditions(
    (page.conditions === undefined ? {} : page.conditions) as PageConditions,
    resolver,
    `${path}.conditions`,
  );
  if (page.priority !== undefined && !pagePriorities.includes(page.priority as "below"))
    fail(`${path}.priority`, pagePriorities.join("/"), page.priority);
  if (page.trigger !== undefined && !pageTriggers.includes(page.trigger as "action"))
    fail(`${path}.trigger`, pageTriggers.join("/"), page.trigger);
  if (page.image !== undefined) {
    const image = object(page.image, `${path}.image`, [
      "character",
      "characterIndex",
      "tileId",
      "direction",
      "pattern",
    ]);
    for (const [key, max] of [
      ["characterIndex", 7],
      ["tileId", 1023],
      ["pattern", 2],
    ] as const)
      if (image[key] !== undefined) integer(image[key], `${path}.image.${key}`, 0, max, true);
    if (image.direction !== undefined && !pageDirections.includes(image.direction as "down"))
      fail(
        `${path}.image.direction`,
        `${pageDirections.join("/")} (${nativeDirections.join("/")})`,
        image.direction,
      );
    if (image.character !== undefined && image.character !== null) {
      const asset = object(
        image.character,
        `${path}.image.character`,
        ["kind", "category", "folder", "name"],
        ["kind", "category", "folder", "name"],
      );
      if (
        asset.kind !== "asset" ||
        asset.category !== "image" ||
        asset.folder !== "characters" ||
        typeof asset.name !== "string" ||
        asset.name.length === 0
      )
        fail(
          `${path}.image.character`,
          "characters Image Asset Reference or null",
          image.character,
        );
    }
  }
  if (page.options !== undefined) {
    const options = object(page.options, `${path}.options`, [
      "walkAnimation",
      "stepAnimation",
      "directionFix",
      "through",
    ]);
    for (const [field, value] of Object.entries(options))
      if (value !== undefined && typeof value !== "boolean")
        fail(`${path}.options.${field}`, "boolean", value);
  }
}

export function validateMapEventInputs(graph: StagedDataGraph, issues: ValidationIssue[]): void {
  for (const event of graph.declarations) {
    if (event.kind !== "mapEvent") continue;
    const identity = `map:${event.mapId}/event:${event.id}`;
    try {
      assertMapEventInput(event);
      for (const [index, page] of event.pages.entries()) {
        assertMapPageInput(page, graph.resolver, `pages[${index}]`);
        const tileId = page.image?.tileId ?? 0;
        if (tileId === 0) continue;
        const map = graph.snapshotMaps?.find((map) => map.id === event.mapId);
        const tileset = graph.snapshotTilesets?.find((tileset) => tileset.id === map?.tilesetId);
        const group = Math.floor(tileId / 256) + 5;
        const groupName = Array.isArray(tileset?.tilesetNames)
          ? tileset.tilesetNames[group]
          : undefined;
        if (
          !Number.isSafeInteger(map?.tilesetId) ||
          (map!.tilesetId as number) <= 0 ||
          tileset === undefined ||
          typeof groupName !== "string"
        )
          fail(
            `pages[${index}].image.tileId`,
            "existing Map tileset and saved B/C/D/E group name",
            tileId,
            "MV-MAP-TILESET",
          );
        if (groupName === "")
          issues.push({
            level: "warning",
            code: "MV-MAP-TILESET-EMPTY",
            stage: "compile",
            identity,
            nativePath: `pages[${index}].image.tileId`,
            dslPath: `pages[${index}].image.tileId`,
            message: `${identity} page ${index + 1} uses tile ${tileId} from empty tileset group ${["B", "C", "D", "E"][group - 5]}; saved values are preserved.`,
          });
      }
    } catch (error) {
      if (error instanceof CommandStructureError) issues.push(error.issue(identity, "compile"));
      else throw error;
    }
  }
}
