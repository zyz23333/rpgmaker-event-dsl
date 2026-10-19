import { CommandStructureError } from "../validation/command-errors.js";

function fail(path: string, expected: string, actual: unknown, code = "MV-MAP-PAGE-SHAPE"): never {
  throw new CommandStructureError(code, "Invalid native Map Event saved shape.", {
    nativePath: path,
    expected,
    actual: String(actual),
  });
}

function object(
  value: unknown,
  path: string,
  fields: readonly string[],
  code?: string,
): Record<string, unknown> {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value))
  )
    fail(path, "complete saved object", value, code);
  const record = value as Record<string, unknown>;
  for (const key of Reflect.ownKeys(record)) {
    const descriptor = Object.getOwnPropertyDescriptor(record, key)!;
    if (
      typeof key !== "string" ||
      !fields.includes(key) ||
      !("value" in descriptor) ||
      !descriptor.enumerable
    )
      fail(`${path}${path ? "." : ""}${String(key)}`, "supported saved field", key, code);
  }
  for (const key of fields)
    if (!Object.hasOwn(record, key))
      fail(`${path}${path ? "." : ""}${key}`, "required saved field", "<missing>", code);
  return record;
}

function integer(value: unknown, path: string, min: number, max: number, code?: string): void {
  if (
    !Number.isSafeInteger(value) ||
    Object.is(value, -0) ||
    (value as number) < min ||
    (value as number) > max
  )
    fail(path, `integer ${min}..${max}`, value, code);
}

export function assertNativeMapEvent(
  value: unknown,
  index: number,
): asserts value is Record<string, unknown> {
  const code = "MV-MAP-EVENT-SHAPE";
  const event = object(value, "", ["id", "name", "note", "x", "y", "pages"], code);
  integer(event.id, "id", 1, Number.MAX_SAFE_INTEGER, code);
  if (event.id !== index) fail("id", `event array position ${index}`, event.id, code);
  for (const field of ["name", "note"] as const)
    if (typeof event[field] !== "string") fail(field, "string", event[field], code);
  for (const field of ["x", "y"] as const)
    integer(event[field], field, 0, Number.MAX_SAFE_INTEGER, code);
}

export function assertNativeMapPage(
  value: unknown,
  path: string,
): asserts value is Record<string, unknown> {
  const page = object(value, path, [
    "conditions",
    "image",
    "moveType",
    "moveSpeed",
    "moveFrequency",
    "moveRoute",
    "priorityType",
    "walkAnime",
    "stepAnime",
    "directionFix",
    "through",
    "trigger",
    "list",
  ]);
  const conditions = object(page.conditions, `${path}.conditions`, [
    "actorId",
    "actorValid",
    "itemId",
    "itemValid",
    "selfSwitchCh",
    "selfSwitchValid",
    "switch1Id",
    "switch1Valid",
    "switch2Id",
    "switch2Valid",
    "variableId",
    "variableValid",
    "variableValue",
  ]);
  for (const field of ["actor", "item", "switch1", "switch2", "variable"])
    integer(conditions[`${field}Id`], `${path}.conditions.${field}Id`, 0, Number.MAX_SAFE_INTEGER);
  integer(conditions.variableValue, `${path}.conditions.variableValue`, -99999999, 99999999);
  for (const field of ["actor", "item", "selfSwitch", "switch1", "switch2", "variable"])
    if (typeof conditions[`${field}Valid`] !== "boolean")
      fail(`${path}.conditions.${field}Valid`, "boolean", conditions[`${field}Valid`]);
  if (!["A", "B", "C", "D"].includes(conditions.selfSwitchCh as string))
    fail(`${path}.conditions.selfSwitchCh`, "A/B/C/D", conditions.selfSwitchCh);
  const image = object(page.image, `${path}.image`, [
    "characterName",
    "characterIndex",
    "tileId",
    "direction",
    "pattern",
  ]);
  if (typeof image.characterName !== "string")
    fail(`${path}.image.characterName`, "string", image.characterName);
  integer(image.characterIndex, `${path}.image.characterIndex`, 0, 7);
  integer(image.tileId, `${path}.image.tileId`, 0, 1023);
  integer(image.pattern, `${path}.image.pattern`, 0, 2);
  if (![2, 4, 6, 8].includes(image.direction as number))
    fail(`${path}.image.direction`, "2/4/6/8", image.direction);
  for (const field of ["walkAnime", "stepAnime", "directionFix", "through"])
    if (typeof page[field] !== "boolean") fail(`${path}.${field}`, "boolean", page[field]);
  integer(page.priorityType, `${path}.priorityType`, 0, 2);
  integer(page.trigger, `${path}.trigger`, 0, 4);
}

export function assertNativeMapPages(value: unknown): asserts value is unknown[] {
  if (!Array.isArray(value) || value.length === 0)
    fail("pages", "nonempty dense page array", value);
  for (let index = 0; index < value.length; index++)
    if (!Object.hasOwn(value, index)) fail(`pages[${index}]`, "saved page", "<missing>");
}

export function assertNativeMapEvents(value: unknown): asserts value is unknown[] {
  if (!Array.isArray(value))
    fail("events", "dense event array with null holes", value, "MV-MAP-EVENT-SHAPE");
  for (let index = 0; index < value.length; index++) {
    if (!Object.hasOwn(value, index) || (index === 0 && value[index] !== null))
      fail(
        `events[${index}]`,
        "event or null hole (slot zero must be null)",
        value[index],
        "MV-MAP-EVENT-SHAPE",
      );
  }
}
