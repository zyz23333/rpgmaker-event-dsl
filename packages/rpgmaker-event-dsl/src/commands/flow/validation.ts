import type {
  BreakLoopDslCommand,
  ExitEventProcessingDslCommand,
  LoopDslCommand,
} from "../../domain/types.js";
import { CommandStructureError } from "../../validation/command-structure.js";

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
