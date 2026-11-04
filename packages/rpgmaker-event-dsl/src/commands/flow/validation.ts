import type {
  BreakLoopDslCommand,
  CommonEventDslCommand,
  ExitEventProcessingDslCommand,
  LoopDslCommand,
} from "../../domain/types.js";
import { CommandStructureError } from "../../validation/command-errors.js";
import { assertDslCommandList, assertDslObject } from "../../validation/dsl-command-inputs.js";
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
  if (Object.keys(node).some((key) => key !== "kind" && key !== "body")) {
    throw new CommandStructureError("MV-CHILD-BODY", "Loop has an unknown field.", {
      dslPath: path,
    });
  }
  assertLoopBody(node.body, `${path}.body`);
}

export function assertLoopBody(
  body: unknown,
  path: string,
): asserts body is LoopDslCommand["body"] {
  const fail = (message: string, suffix = ""): never => {
    throw new CommandStructureError("MV-CHILD-BODY", message, { dslPath: path + suffix });
  };
  try {
    assertDslObject(body, ["commands", "endMarker"], path);
  } catch {
    fail("Loop requires a plain body object with supported own data fields.");
  }
  const input = body as Record<string, unknown>;
  try {
    assertDslCommandList(input.commands, `${path}.commands`, false);
  } catch (error) {
    if (error instanceof CommandStructureError && error.code === "MV-DSL-SHAPE") {
      throw new CommandStructureError("MV-CHILD-BODY", error.detail, error.location);
    }
    throw error;
  }
  if (
    input.endMarker !== undefined &&
    input.endMarker !== "present" &&
    input.endMarker !== "absent"
  ) {
    fail("Body End Marker must be present or absent.", ".endMarker");
  }
  if ((input.commands as readonly unknown[]).length === 0 && input.endMarker === "absent") {
    fail("An empty Child Command Body cannot omit its Body End Marker.", ".endMarker");
  }
}
