import type { RawEventCommand } from "../compiler/types.js";
import { assertNativeMovementCommands } from "../commands/movement/validation.js";
import { assertNativeMessageGroups } from "../commands/message/validation.js";
import { CommandStructureError } from "./command-errors.js";
import { assertStrictJson, describeValue, StrictJsonError } from "../project-data/json-values.js";
import { assertNativeCommandParameters } from "./native-parameters.js";
import { renderJsonValue } from "../project-data/json-values.js";
export { CommandStructureError } from "./command-errors.js";

export function assertNativeCommandEnvelope(
  value: unknown,
  index: number,
): asserts value is RawEventCommand {
  const fail = (
    message: string,
    field?: string,
    expected = "native command with exactly code, indent and parameters",
  ): never => {
    throw new CommandStructureError("MV-COMMAND-ENVELOPE", message, {
      nativePath: `list[${index}]${field ? `.${field}` : ""}`,
      expected,
      actual:
        field && typeof value === "object" && value !== null
          ? Object.hasOwn(value, field)
            ? describeValue(Object.getOwnPropertyDescriptor(value, field)?.value)
            : "missing"
          : describeValue(value),
    });
  };
  if (typeof value !== "object" || value === null || Array.isArray(value))
    fail("Expected a native command object.");
  const command = value as Record<string, unknown>;
  for (const key of ["code", "indent", "parameters"]) {
    const descriptor = Object.getOwnPropertyDescriptor(command, key);
    if (!descriptor || ("value" in descriptor && descriptor.value === undefined))
      fail(
        "A required command field is missing or undefined.",
        key,
        "present native field with a defined value",
      );
  }
  try {
    assertStrictJson(command, `list[${index}]`);
  } catch (error) {
    if (error instanceof StrictJsonError)
      throw new CommandStructureError("MV-STRICT-JSON", error.message, {
        nativePath: error.path,
        expected: "strict representable JSON",
        actual: error.actual,
      });
    throw error;
  }
  if (Object.keys(command).some((key) => !["code", "indent", "parameters"].includes(key)))
    fail("Unknown command field.");
  for (const key of ["code", "indent"]) {
    if (
      !Object.hasOwn(command, key) ||
      !Number.isSafeInteger(command[key]) ||
      (command[key] as number) < 0 ||
      Object.is(command[key], -0)
    )
      fail(
        `${key} must be a nonnegative safe integer.`,
        key,
        "nonnegative safe integer, excluding negative zero",
      );
  }
  if (!Object.hasOwn(command, "parameters") || !Array.isArray(command.parameters))
    fail(
      "parameters must be an array and cannot be missing.",
      "parameters",
      "dense parameter array",
    );
  try {
    assertStrictJson(command.parameters, `list[${index}].parameters`);
  } catch (error) {
    if (error instanceof StrictJsonError)
      throw new CommandStructureError("MV-STRICT-JSON", error.message, {
        nativePath: error.path,
        expected: "strict representable JSON",
        actual: error.actual,
      });
    throw error;
  }
  if (command.code !== 505)
    assertNativeCommandParameters(
      command.code as number,
      command.parameters as unknown[],
      `list[${index}]`,
    );
}

export function inspectCommandListStructure(
  commands: readonly RawEventCommand[],
  options: { requireTerminator?: boolean; baseIndent?: number } = {},
): { breaksOutsideLoops: number[] } {
  const fail = (index: number, message: string, code = "MV-COMMAND-STRUCTURE"): never => {
    throw new CommandStructureError(code, message, {
      nativePath: `list[${index}]`,
      expected: message,
      actual: index < commands.length ? describeValue(commands[index]) : "missing",
    });
  };
  if (!Array.isArray(commands) || Object.getPrototypeOf(commands) !== Array.prototype)
    throw new CommandStructureError(
      "MV-COMMAND-ENVELOPE",
      "A native list must be a dense command array.",
      { nativePath: "list", expected: "dense command array", actual: describeValue(commands) },
    );
  for (const key of Reflect.ownKeys(commands))
    if (
      key !== "length" &&
      (typeof key !== "string" || !/^(0|[1-9]\d*)$/.test(key) || Number(key) >= commands.length)
    )
      fail(0, "A native list cannot have extra array properties.", "MV-COMMAND-ENVELOPE");
  for (let index = 0; index < commands.length; index += 1) {
    assertNativeCommandEnvelope(commands[index], index);
    if (
      [0, 112, 113, 115, 413].includes(commands[index]!.code) &&
      commands[index]!.parameters.length !== 0
    ) {
      fail(
        index,
        "This known structural/flow command requires exactly zero parameters.",
        "MV-COMMAND-PARAMETERS",
      );
    }
  }
  assertNativeMovementCommands(commands);
  assertNativeMessageGroups(commands);
  const breaksOutsideLoops: number[] = [];
  const continuationParents = new Map([
    [401, [101, 401]],
    [405, [105, 405]],
    [408, [108, 408]],
    [655, [355, 655]],
    [505, [205, 505]],
    [605, [302, 605]],
  ]);
  const branchCodes = [411, 412, 413, 402, 403, 404, 601, 602, 603, 604];
  type Boundary = { indent: number; codes: readonly number[] };
  const isBoundary = (index: number, boundary: Boundary | undefined): boolean =>
    boundary !== undefined &&
    commands[index]?.indent === boundary.indent &&
    boundary.codes.includes(commands[index]!.code);
  const sequence = (
    start: number,
    indent: number,
    boundary: Boundary | undefined,
    loopDepth: number,
  ): { index: number; marker: boolean; content: boolean } => {
    let index = start;
    let content = false;
    while (index < commands.length && !isBoundary(index, boundary)) {
      const command = commands[index]!;
      if (command.indent !== indent)
        fail(index, `Expected indentation ${indent}, found ${command.indent}.`);
      if (command.code === 0) {
        if (
          boundary === undefined ? index !== commands.length - 1 : !isBoundary(index + 1, boundary)
        ) {
          fail(
            index,
            "A Body End Marker must be the sole trailing marker of its own body; the event terminator must be last.",
          );
        }
        return { index: index + 1, marker: true, content };
      }
      if (branchCodes.includes(command.code)) fail(index, "Orphan branch or closing record.");
      const allowedPredecessors = continuationParents.get(command.code);
      if (
        allowedPredecessors &&
        (commands[index - 1]?.indent !== indent ||
          !allowedPredecessors.includes(commands[index - 1]!.code))
      ) {
        fail(index, "Orphan continuation record.");
      }
      if (command.code === 113 && loopDepth === 0) breaksOutsideLoops.push(index);
      content = true;
      if (command.code === 112) {
        const parentIndent = command.indent;
        const body = sequence(
          index + 1,
          parentIndent + 1,
          { indent: parentIndent, codes: [413] },
          loopDepth + 1,
        );
        if (!isBoundary(body.index, { indent: parentIndent, codes: [413] }))
          fail(body.index, "Loop has no matching 413.");
        if (!body.content && !body.marker)
          fail(body.index, "Empty Loop requires a Body End Marker.", "MV-CHILD-BODY");
        index = body.index + 1;
        continue;
      }
      if (command.code === 111) {
        const thenBody = sequence(index + 1, indent + 1, { indent, codes: [411, 412] }, loopDepth);
        if (!thenBody.content && !thenBody.marker)
          fail(
            thenBody.index,
            "An empty Conditional body requires a Body End Marker.",
            "MV-CHILD-BODY",
          );
        let end = thenBody.index;
        if (commands[end]?.code === 411 && commands[end]?.indent === indent) {
          const elseBody = sequence(end + 1, indent + 1, { indent, codes: [412] }, loopDepth);
          if (!elseBody.content && !elseBody.marker)
            fail(elseBody.index, "An empty Else body requires a Body End Marker.", "MV-CHILD-BODY");
          end = elseBody.index;
        }
        if (!isBoundary(end, { indent, codes: [412] }))
          fail(end, "Conditional has no matching412.");
        index = end + 1;
        continue;
      }
      const choices = command.code === 102;
      const battle =
        command.code === 301 &&
        commands[index + 1]?.indent === indent &&
        [601, 602, 603, 604].includes(commands[index + 1]!.code);
      if (choices || battle) {
        const branches = choices ? [402, 403] : [601, 602, 603];
        const close = choices ? 404 : 604;
        let end = index + 1;
        let choiceIndex = 0;
        let cancelSeen = false;
        const seen = new Set<number>();
        while (isBoundary(end, { indent, codes: branches })) {
          const branch = commands[end]!;
          if (seen.has(branch.code) && branch.code !== 402)
            fail(end, "Duplicate parent-owned branch.");
          seen.add(branch.code);
          if (choices && branch.code === 402) {
            const texts = command.parameters[0] as unknown[];
            const expected = [choiceIndex, texts[choiceIndex]];
            if (
              cancelSeen ||
              choiceIndex >= texts.length ||
              branch.parameters[0] !== choiceIndex ||
              branch.parameters[1] !== texts[choiceIndex]
            )
              throw new CommandStructureError(
                "MV-CHOICE-MIRROR",
                "Choice branches must mirror every parent choice exactly once in saved order.",
                {
                  nativePath: `list[${end}].parameters`,
                  expected:
                    choiceIndex < texts.length
                      ? renderJsonValue(expected)
                      : "no additional choice branch",
                  actual: renderJsonValue(branch.parameters),
                  relatedLocations: [
                    {
                      nativePath: `list[${index}].parameters[0][${choiceIndex}]`,
                      value:
                        choiceIndex < texts.length
                          ? renderJsonValue(texts[choiceIndex])
                          : "missing",
                    },
                  ],
                },
              );
            choiceIndex += 1;
          }
          if (choices && branch.code === 403) cancelSeen = true;
          const body = sequence(
            end + 1,
            indent + 1,
            { indent, codes: [...branches, close] },
            loopDepth,
          );
          if (!body.content && !body.marker)
            fail(body.index, "An empty branch requires a Body End Marker.", "MV-CHILD-BODY");
          end = body.index;
        }
        if (choices && choiceIndex !== (command.parameters[0] as unknown[]).length)
          throw new CommandStructureError(
            "MV-CHOICE-MIRROR",
            "A saved choice has no matching 402 branch.",
            {
              nativePath: `list[${end}]`,
              expected: `402 branch for choice ${choiceIndex}`,
              actual: commands[end] ? renderJsonValue(commands[end]) : "missing",
              relatedLocations: [
                {
                  nativePath: `list[${index}].parameters[0][${choiceIndex}]`,
                  value: renderJsonValue((command.parameters[0] as unknown[])[choiceIndex]),
                },
              ],
            },
          );
        if (!isBoundary(end, { indent, codes: [close] }))
          fail(end, `Parent has no matching${close}.`);
        index = end + 1;
        continue;
      }
      index += 1;
    }
    return { index, marker: false, content };
  };
  const result = sequence(0, options.baseIndent ?? 0, undefined, 0);
  if (options.requireTerminator && !result.marker)
    fail(
      commands.length,
      "Event command list requires its final code0/indent0/parameters[] terminator.",
    );
  return { breaksOutsideLoops };
}
