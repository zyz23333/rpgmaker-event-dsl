import type {
  BreakLoopDslCommand,
  CommonEventDslCommand,
  ExitEventProcessingDslCommand,
  LoopDslCommand,
} from "../../domain/types.js";
import { CommandStructureError } from "../../validation/command-structure.js";
import { assertDslObject } from "../../validation/dsl-command-inputs.js";
import { describeValue } from "../../project-data/json-values.js";
import type { ReferenceResolver } from "../../validation/types.js";

export function resolveCommonEventCall(
  node: CommonEventDslCommand,
  resolver: ReferenceResolver,
  path: string,
): number {
  assertCommonEventCall(node, path);
  try {
    return resolver.resolveReference(node.commonEvent);
  } catch (error) {
    throw new CommandStructureError(
      "MV-E117-REFERENCE",
      error instanceof Error ? error.message : String(error),
      {
        dslPath: `${path}.commonEvent`,
        expected: "uniquely resolved staged Common Event",
        actual: describeValue(node.commonEvent),
      },
    );
  }
}

export function assertCommonEventCall(
  value: unknown,
  path = "callCommonEvent",
  withKind = true,
): asserts value is CommonEventDslCommand {
  const fail = (at: string, expected: string, actual: unknown): never => {
    throw new CommandStructureError("MV-E117", "Invalid Common Event call.", {
      dslPath: at,
      expected,
      actual: describeValue(actual),
    });
  };
  try {
    assertDslObject(value, withKind ? ["kind", "commonEvent"] : ["commonEvent"], path);
  } catch (error) {
    fail(
      path,
      "named object containing commonEvent",
      error instanceof Error ? error.message : error,
    );
  }
  const ref = (value as Record<string, unknown>).commonEvent;
  try {
    assertDslObject(ref, ["kind", "id", "name"], `${path}.commonEvent`);
  } catch (error) {
    fail(
      `${path}.commonEvent`,
      "Common Event reference",
      error instanceof Error ? error.message : error,
    );
  }
  const input = ref as Record<string, unknown>;
  if (
    input.kind !== "commonEvent" ||
    Object.hasOwn(input, "id") === Object.hasOwn(input, "name") ||
    (Object.hasOwn(input, "id")
      ? !Number.isSafeInteger(input.id) || (input.id as number) <= 0
      : typeof input.name !== "string")
  )
    fail(
      `${path}.commonEvent`,
      "Common Event reference with exactly one positive id or string name",
      ref,
    );
}

export function assertParameterlessFlowCommand(
  node: BreakLoopDslCommand | ExitEventProcessingDslCommand,
  path: string,
): void {
  if (Object.keys(node).some((key) => key !== "kind"))
    throw new CommandStructureError(
      "MV-COMMAND-PARAMETERS",
      `${node.kind} does not accept authored fields.`,
      { dslPath: path },
    );
}

export function assertLoopCommand(node: LoopDslCommand, path: string): void {
  const fail = (message: string, suffix = ".body"): never => {
    throw new CommandStructureError("MV-CHILD-BODY", message, { dslPath: path + suffix });
  };
  if (Object.keys(node).some((key) => key !== "kind" && key !== "body")) {
    fail("Loop has an unknown field.", "");
  }
  const body = node.body;
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    fail("Loop requires a body object with commands.");
  }
  if (Object.keys(body).some((key) => key !== "commands" && key !== "endMarker")) {
    fail("Child Command Body has an unknown field.");
  }
  if (!Array.isArray(body.commands)) {
    fail("Child Command Body requires a commands array.", ".body.commands");
  }
  for (let index = 0; index < body.commands.length; index += 1) {
    if (!Object.hasOwn(body.commands, index) || body.commands[index] === undefined) {
      fail(
        "Child Command Body commands cannot contain undefined or sparse slots.",
        `.body.commands[${index}]`,
      );
    }
    const command = body.commands[index];
    if (
      typeof command !== "object" ||
      command === null ||
      Array.isArray(command) ||
      typeof command.kind !== "string"
    ) {
      fail("Expected a DSL Command object.", `.body.commands[${index}]`);
    }
  }
  if (body.endMarker !== undefined && body.endMarker !== "present" && body.endMarker !== "absent") {
    fail("Body End Marker must be present or absent.", ".body.endMarker");
  }
  if (body.commands.length === 0 && body.endMarker === "absent") {
    fail("An empty Child Command Body cannot omit its Body End Marker.", ".body.endMarker");
  }
}
