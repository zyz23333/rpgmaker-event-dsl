import type {
  ShowTextDslCommand,
  InputNumberDslCommand,
  SelectItemDslCommand,
  ReferenceValue,
  ShowScrollingTextDslCommand,
  CommentDslCommand,
} from "../../domain/types.js";
import type { ReferenceResolver } from "../../validation/types.js";
import { describeValue } from "../../project-data/json-values.js";
import { CommandStructureError } from "../../validation/command-errors.js";

function invalid(code: number, path: string, expected: string, value: unknown): never {
  throw new CommandStructureError(`MV-E${code}-INPUT`, "Invalid message input.", {
    dslPath: path,
    expected,
    actual: describeValue(value),
  });
}

function object(
  value: unknown,
  fields: readonly string[],
  code: number,
  path: string,
): Record<string, unknown> {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value))
  )
    invalid(code, path, "plain object with supported own data fields", value);
  for (const key of Reflect.ownKeys(value as object)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
    if (
      typeof key !== "string" ||
      !fields.includes(key) ||
      !("value" in descriptor) ||
      !descriptor.enumerable
    )
      invalid(
        code,
        `${path}.${String(key)}`,
        `supported own data field: ${fields.join(", ")}`,
        "unsupported field",
      );
  }
  return value as Record<string, unknown>;
}

function lines(value: unknown, maximum: number, code: number, path: string): void {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype)
    invalid(code, path, "dense array of physical line strings", value);
  const array = value as unknown[];
  if (array.length < 1 || array.length > maximum)
    invalid(code, path, `1..${maximum} physical lines`, array);
  for (const key of Reflect.ownKeys(array)) {
    if (key === "length") continue;
    const descriptor = Object.getOwnPropertyDescriptor(array, key)!;
    if (
      typeof key !== "string" ||
      !/^(0|[1-9]\d*)$/u.test(key) ||
      Number(key) >= array.length ||
      !("value" in descriptor) ||
      !descriptor.enumerable
    )
      invalid(
        code,
        path,
        "dense array without extra fields or accessors",
        "unsupported array field",
      );
  }
  for (let index = 0; index < array.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(array, String(index));
    if (
      !descriptor ||
      !("value" in descriptor) ||
      typeof descriptor.value !== "string" ||
      descriptor.value.includes("\n")
    )
      invalid(
        code,
        `${path}[${index}]`,
        "one physical string record without LF; CR and empty text are preserved",
        descriptor && "value" in descriptor ? descriptor.value : undefined,
      );
  }
}

export function assertShowText(
  value: unknown,
  path: string,
  withKind = true,
): asserts value is ShowTextDslCommand {
  const input = object(
    value,
    [...(withKind ? ["kind"] : []), "lines", "face", "background", "position"],
    101,
    path,
  );
  lines(input.lines, 4, 101, `${path}.lines`);
  const face = object(input.face, ["image", "index"], 101, `${path}.face`);
  if (
    !Number.isInteger(face.index) ||
    Object.is(face.index, -0) ||
    (face.index as number) < 0 ||
    (face.index as number) > 2147483647
  )
    invalid(
      101,
      `${path}.face.index`,
      "integer 0..2147483647, excluding negative zero",
      face.index,
    );
  if (face.image !== null) {
    const image = object(
      face.image,
      ["kind", "category", "folder", "name"],
      101,
      `${path}.face.image`,
    );
    for (const [field, expected] of [
      ["kind", "asset"],
      ["category", "image"],
      ["folder", "faces"],
    ] as const)
      if (image[field] !== expected)
        invalid(101, `${path}.face.image.${field}`, expected, image[field]);
    if (typeof image.name !== "string" || image.name.length === 0)
      invalid(101, `${path}.face.image.name`, "nonempty face filename stem", image.name);
  }
  if (!["window", "dim", "transparent"].includes(input.background as string))
    invalid(101, `${path}.background`, "window | dim | transparent", input.background);
  if (!["top", "middle", "bottom"].includes(input.position as string))
    invalid(101, `${path}.position`, "top | middle | bottom", input.position);
}

export function assertShowScrollingText(
  value: unknown,
  path: string,
  withKind = true,
): asserts value is ShowScrollingTextDslCommand {
  const input = object(
    value,
    [...(withKind ? ["kind"] : []), "lines", "speed", "noFastForward"],
    105,
    path,
  );
  lines(input.lines, Infinity, 105, `${path}.lines`);
  if (!Number.isInteger(input.speed) || (input.speed as number) < 1 || (input.speed as number) > 8)
    invalid(105, `${path}.speed`, "integer 1..8", input.speed);
  if (typeof input.noFastForward !== "boolean")
    invalid(105, `${path}.noFastForward`, "explicit boolean", input.noFastForward);
}

export function assertComment(
  value: unknown,
  path: string,
  withKind = true,
): asserts value is CommentDslCommand {
  const input = object(value, [...(withKind ? ["kind"] : []), "lines"], 108, path);
  lines(input.lines, 6, 108, `${path}.lines`);
}

export function assertMessageVariable(
  value: unknown,
  code: number,
  path: string,
): asserts value is ReferenceValue<"variable"> {
  const reference = object(value, ["kind", "id", "name"], code, path);
  if (reference.kind !== "variable") invalid(code, `${path}.kind`, "variable", reference.kind);
  if (Object.hasOwn(reference, "id") === Object.hasOwn(reference, "name"))
    invalid(code, path, "exactly one explicit variable ID or name", value);
  if (Object.hasOwn(reference, "id")) {
    if (!Number.isSafeInteger(reference.id) || (reference.id as number) < 1)
      invalid(code, `${path}.id`, "positive safe integer variable ID", reference.id);
  } else if (typeof reference.name !== "string" || reference.name.length === 0)
    invalid(code, `${path}.name`, "nonempty variable name", reference.name);
}

export function assertInputNumber(
  value: unknown,
  path: string,
  withKind = true,
): asserts value is InputNumberDslCommand {
  const input = object(value, [...(withKind ? ["kind"] : []), "variable", "digits"], 103, path);
  assertMessageVariable(input.variable, 103, `${path}.variable`);
  if (
    !Number.isInteger(input.digits) ||
    (input.digits as number) < 1 ||
    (input.digits as number) > 8
  )
    invalid(103, `${path}.digits`, "integer 1..8", input.digits);
}

export function assertSelectItem(
  value: unknown,
  path: string,
  withKind = true,
): asserts value is SelectItemDslCommand {
  const input = object(value, [...(withKind ? ["kind"] : []), "variable", "itemType"], 104, path);
  assertMessageVariable(input.variable, 104, `${path}.variable`);
  if (!["regular", "key", "hiddenA", "hiddenB"].includes(input.itemType as string))
    invalid(104, `${path}.itemType`, "regular | key | hiddenA | hiddenB", input.itemType);
}

export function resolveMessageVariable(
  value: ReferenceValue<"variable">,
  code: number,
  resolver: ReferenceResolver,
  path: string,
): number {
  try {
    return resolver.resolveReference(value);
  } catch (error) {
    throw new CommandStructureError(
      `MV-E${code}-REFERENCE`,
      error instanceof Error ? error.message : String(error),
      {
        dslPath: path,
        expected: "existing variable slot within final System capacity",
        actual: describeValue(value),
      },
    );
  }
}
