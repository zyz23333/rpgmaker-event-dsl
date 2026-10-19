import type { DslCommand } from "../domain/types.js";
import { describeValue } from "../project-data/json-values.js";
import { CommandStructureError } from "./command-errors.js";
import { assertNativeCommandEnvelope } from "./command-structure.js";
import {
  assertShowText,
  assertInputNumber,
  assertSelectItem,
  assertShowScrollingText,
  assertComment,
} from "../commands/message/validation.js";

export function assertDslObject(
  value: unknown,
  allowed: readonly string[] | undefined,
  path: string,
): asserts value is Record<string, unknown> {
  const fail = (actual: string): never => {
    throw new CommandStructureError(
      "MV-DSL-SHAPE",
      "Expected a plain authored command with only supported own data fields.",
      { dslPath: path, expected: allowed?.join(", ") ?? "plain command object", actual },
    );
  };
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value))
  )
    fail(describeValue(value));
  for (const key of Reflect.ownKeys(value as object)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
    if (
      typeof key !== "string" ||
      (allowed && !allowed.includes(key)) ||
      !("value" in descriptor) ||
      !descriptor.enumerable
    )
      fail(`unsupported field ${String(key)}`);
  }
}

export function assertRawDslInput(
  value: unknown,
  path: string,
  indent = 0,
  withKind = false,
  checkParameters = true,
): void {
  assertDslObject(
    value,
    withKind ? ["kind", "code", "indent", "parameters"] : ["code", "indent", "parameters"],
    path,
  );
  if (!checkParameters) return;
  try {
    assertNativeCommandEnvelope(
      {
        code: value.code,
        indent: value.indent === undefined ? indent : value.indent,
        parameters: value.parameters,
      },
      0,
    );
  } catch (error) {
    if (error instanceof CommandStructureError) {
      const { nativePath: _nativePath, ...location } = error.location;
      throw new CommandStructureError(error.code, error.detail, {
        ...location,
        dslPath: path,
      });
    }
    throw error;
  }
}

export function assertDslCommandList(
  value: unknown,
  path: string,
  validateRaw = true,
): asserts value is readonly DslCommand[] {
  const fail = (at: string, actual: string): never => {
    throw new CommandStructureError(
      "MV-DSL-SHAPE",
      "Commands must be a dense array of authored command objects.",
      { dslPath: at, expected: "dense command array", actual },
    );
  };
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype)
    fail(path, describeValue(value));
  const values = value as unknown[];
  for (const key of Reflect.ownKeys(values))
    if (
      key !== "length" &&
      (typeof key !== "string" || !/^(0|[1-9]\d*)$/.test(key) || Number(key) >= values.length)
    )
      fail(path, `extra array field ${String(key)}`);
  for (let index = 0; index < values.length; index++) {
    const at = `${path}[${index}]`;
    const descriptor = Object.getOwnPropertyDescriptor(values, String(index));
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable)
      fail(at, "missing or non-data command slot");
    const node = descriptor!.value;
    assertDslObject(node, undefined, at);
    if (!Object.hasOwn(node, "kind") || typeof node.kind !== "string")
      fail(at, "missing command kind");
    if (node.kind === "rawDslCommand") assertRawDslInput(node, at, 0, true, validateRaw);
    if (node.kind === "showText") assertShowText(node, at);
    if (node.kind === "inputNumber") assertInputNumber(node, at);
    if (node.kind === "selectItem") assertSelectItem(node, at);
    if (node.kind === "showScrollingText") assertShowScrollingText(node, at);
    if (node.kind === "comment") assertComment(node, at);
  }
}
