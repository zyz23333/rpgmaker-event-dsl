import type { PictureDisplayInput } from "../domain/types.js";

export function assignPictureDisplayInput<TNode extends PictureDisplayInput>(
  node: TNode,
  input: PictureDisplayInput,
): void {
  if (input.scaleX !== undefined) {
    node.scaleX = input.scaleX;
  }
  if (input.scaleY !== undefined) {
    node.scaleY = input.scaleY;
  }
  if (input.opacity !== undefined) {
    node.opacity = input.opacity;
  }
  if (input.blendMode !== undefined) {
    node.blendMode = input.blendMode;
  }
}

export function assertIncluded<TValue extends string>(
  allowedValues: readonly TValue[],
  value: TValue,
  fieldName: string,
): void {
  if (!(allowedValues as readonly string[]).includes(value)) {
    throw new Error(`Invalid ${fieldName}: ${String(value)}.`);
  }
}

export function assertNonEmptyString(value: string, fieldName: string): void {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${fieldName} must be a non-empty string.`);
  }
}
