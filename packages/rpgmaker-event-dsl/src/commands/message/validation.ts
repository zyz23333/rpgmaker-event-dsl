import { describeValue } from "../../project-data/json-values.js";
import { CommandStructureError } from "../../validation/command-errors.js";
import { assertDslCommandList, assertDslObject } from "../../validation/dsl-command-inputs.js";

export function assertShowChoicesInput(value: unknown, path: string, withKind = true): void {
  const fail = (at: string, expected: string, actual: unknown): never => {
    throw new CommandStructureError("MV-CHOICES", "Invalid Show Choices input.", {
      dslPath: at,
      expected,
      actual: describeValue(actual),
    });
  };
  const object = (input: unknown, keys: readonly string[], at: string): Record<string, unknown> => {
    try {
      assertDslObject(input, keys, at);
      return input;
    } catch (error) {
      if (!(error instanceof CommandStructureError)) throw error;
      throw new CommandStructureError("MV-CHOICES", error.detail, error.location);
    }
  };
  const body = (input: Record<string, unknown>, at: string): void => {
    if (!Object.hasOwn(input, "commands"))
      fail(`${at}.commands`, "required own commands array", undefined);
    try {
      assertDslCommandList(input.commands, `${at}.commands`, false);
    } catch (error) {
      if (!(error instanceof CommandStructureError)) throw error;
      throw new CommandStructureError("MV-CHOICES", error.detail, error.location);
    }
    if (
      input.endMarker !== undefined &&
      input.endMarker !== "present" &&
      input.endMarker !== "absent"
    )
      fail(`${at}.endMarker`, "present or absent", input.endMarker);
    if ((input.commands as unknown[]).length === 0 && input.endMarker === "absent")
      throw new CommandStructureError(
        "MV-CHILD-BODY",
        "An empty Child Command Body cannot omit its Body End Marker.",
        { dslPath: `${at}.endMarker` },
      );
  };
  const node = object(
    value,
    [...(withKind ? ["kind"] : []), "choices", "defaultChoice", "cancel", "position", "background"],
    path,
  );
  const choices = node.choices;
  if (
    !Object.hasOwn(node, "choices") ||
    !Array.isArray(choices) ||
    Object.getPrototypeOf(choices) !== Array.prototype ||
    choices.length < 1 ||
    choices.length > 6
  )
    fail(`${path}.choices`, "dense array of 1..6 choices", choices);
  for (const key of Reflect.ownKeys(choices as object)) {
    if (
      key !== "length" &&
      (typeof key !== "string" ||
        !/^(0|[1-9]\d*)$/u.test(key) ||
        Number(key) >= (choices as unknown[]).length)
    )
      fail(`${path}.choices`, "only choice array slots", key);
  }
  for (let index = 0; index < (choices as unknown[]).length; index++) {
    const at = `${path}.choices[${index}]`;
    const descriptor = Object.getOwnPropertyDescriptor(choices, String(index));
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable)
      fail(at, "own data choice slot", "missing or non-data slot");
    const choice = object(descriptor!.value, ["text", "commands", "endMarker"], at);
    if (!Object.hasOwn(choice, "text") || typeof choice.text !== "string")
      fail(`${at}.text`, "required own string", choice.text);
    body(choice, at);
  }
  for (const field of ["defaultChoice", "cancel"] as const) {
    if (node[field] === undefined) continue;
    const at = `${path}.${field}`;
    const mode = object(node[field], ["kind", "index", "commands", "endMarker"], at);
    const kind = mode.kind;
    if (!Object.hasOwn(mode, "kind")) fail(`${at}.kind`, "required own mode kind", undefined);
    if (kind === "choice") {
      object(mode, ["kind", "index"], at);
      if (
        !Object.hasOwn(mode, "index") ||
        !Number.isInteger(mode.index) ||
        (mode.index as number) < 0 ||
        (mode.index as number) > 5
      )
        fail(`${at}.index`, "numeric choice position integer 0..5", mode.index);
    } else if (kind === (field === "cancel" ? "disabled" : "none")) {
      object(mode, ["kind"], at);
    } else if (field === "cancel" && kind === "branch") {
      object(mode, ["kind", "commands", "endMarker"], at);
      body(mode, at);
    } else
      fail(
        `${at}.kind`,
        field === "cancel" ? "disabled, choice or branch" : "none or choice",
        kind,
      );
  }
  if (node.position !== undefined && !["left", "center", "right"].includes(node.position as string))
    fail(`${path}.position`, "left, center or right", node.position);
  if (
    node.background !== undefined &&
    !["window", "dim", "transparent"].includes(node.background as string)
  )
    fail(`${path}.background`, "window, dim or transparent", node.background);
}
