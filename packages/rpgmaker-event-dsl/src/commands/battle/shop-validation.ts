import type { ReferenceValue } from "../../domain/types.js";
import { describeValue } from "../../project-data/json-values.js";
import { CommandStructureError } from "../../validation/command-errors.js";
import { assertDslObject } from "../../validation/dsl-command-inputs.js";
import type { ReferenceResolver } from "../../validation/types.js";

export function assertShopInput(
  input: unknown,
  path: string,
  withKind = true,
  resolver?: ReferenceResolver,
): void {
  const fail = (at: string, expected: string, actual: unknown): never => {
    throw new CommandStructureError("MV-E302-INPUT", "Invalid Shop input.", {
      dslPath: at,
      expected,
      actual: describeValue(actual),
    });
  };
  assertDslObject(
    input,
    withKind ? ["kind", "goods", "purchaseOnly"] : ["goods", "purchaseOnly"],
    path,
  );
  if (input.purchaseOnly !== undefined && typeof input.purchaseOnly !== "boolean")
    fail(`${path}.purchaseOnly`, "boolean or omitted", input.purchaseOnly);
  const goods = input.goods;
  if (
    !Object.hasOwn(input, "goods") ||
    !Array.isArray(goods) ||
    Object.getPrototypeOf(goods) !== Array.prototype
  )
    fail(`${path}.goods`, "required dense goods array", goods);
  const values = goods as unknown[];
  for (const key of Reflect.ownKeys(values)) {
    if (
      key !== "length" &&
      (typeof key !== "string" || !/^(0|[1-9]\d*)$/u.test(key) || Number(key) >= values.length)
    )
      fail(`${path}.goods`, "only dense array entries", key);
  }
  for (let index = 0; index < values.length; index++) {
    const at = `${path}.goods[${index}]`;
    const descriptor = Object.getOwnPropertyDescriptor(values, String(index));
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable)
      fail(at, "own enumerable data entry", descriptor);
    const entry = descriptor!.value;
    assertDslObject(entry, undefined, at);
    if (entry.kind === "placeholder") {
      assertDslObject(entry, ["kind"], at);
      continue;
    }
    const kind = entry.kind;
    if (kind !== "item" && kind !== "weapon" && kind !== "armor")
      fail(`${at}.kind`, "item, weapon, armor or placeholder", kind);
    assertDslObject(entry, ["kind", kind as string, "price"], at);
    const reference = entry[kind as string];
    assertDslObject(reference, ["kind", "id", "name"], `${at}.${kind}`);
    if (
      reference.kind !== kind ||
      Object.hasOwn(reference, "id") === Object.hasOwn(reference, "name") ||
      (Object.hasOwn(reference, "id")
        ? !Number.isSafeInteger(reference.id) || (reference.id as number) <= 0
        : typeof reference.name !== "string")
    )
      fail(`${at}.${kind}`, `matching ${kind} reference with one positive ID or name`, reference);
    if (resolver) {
      try {
        resolver.resolveReference(reference as ReferenceValue<"item" | "weapon" | "armor">);
      } catch (error) {
        fail(
          `${at}.${kind}`,
          `existing unique ${kind}`,
          error instanceof Error ? error.message : error,
        );
      }
    }
    if (
      entry.price !== undefined &&
      (!Number.isSafeInteger(entry.price) ||
        (entry.price as number) < 0 ||
        (entry.price as number) > 999_999)
    )
      fail(`${at}.price`, "integer 0..999999 or omitted standard price", entry.price);
  }
}
