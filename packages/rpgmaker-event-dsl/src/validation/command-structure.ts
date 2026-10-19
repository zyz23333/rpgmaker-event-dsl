import type { ValidationIssue } from "./types.js";
import type { RawEventCommand } from "../compiler/types.js";

export class CommandStructureError extends Error {
  constructor(
    readonly code: string,
    readonly detail: string,
    readonly location: { nativePath?: string; dslPath?: string } = {},
    readonly identity?: string,
    readonly stage?: "compile" | "decompile",
  ) {
    super(
      `${identity ? `${identity}: ` : ""}${code}: ${detail}${location.nativePath ? ` at ${location.nativePath}` : ""}${location.dslPath ? ` (${location.dslPath})` : ""}`,
    );
  }

  issue(identity: string, stage: "compile" | "decompile"): ValidationIssue {
    return {
      level: "error",
      code: this.code,
      stage,
      identity,
      ...this.location,
      message: `${identity}: ${this.message}`,
    };
  }
}

export function assertNativeCommandEnvelope(
  value: unknown,
  index: number,
): asserts value is RawEventCommand {
  const fail = (message: string): never => {
    throw new CommandStructureError("MV-COMMAND-ENVELOPE", message, {
      nativePath: `list[${index}]`,
    });
  };
  if (typeof value !== "object" || value === null || Array.isArray(value))
    fail("Expected a native command object.");
  const command = value as Record<string, unknown>;
  if (Object.keys(command).some((key) => !["code", "indent", "parameters"].includes(key)))
    fail("Unknown command field.");
  for (const key of ["code", "indent"]) {
    if (
      !Number.isSafeInteger(command[key]) ||
      (command[key] as number) < 0 ||
      Object.is(command[key], -0)
    )
      fail(`${key} must be a nonnegative safe integer.`);
  }
  if (!Array.isArray(command.parameters))
    fail("parameters must be an array and cannot be missing.");
}

export function inspectCommandListStructure(
  commands: readonly RawEventCommand[],
  options: { requireTerminator?: boolean; baseIndent?: number; fragment?: boolean } = {},
): { breaksOutsideLoops: number[] } {
  const fail = (index: number, message: string, code = "MV-COMMAND-STRUCTURE"): never => {
    throw new CommandStructureError(code, message, { nativePath: `list[${index}]` });
  };
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
      const strict = !options.fragment || boundary !== undefined;
      if (strict && command.indent !== indent)
        fail(index, `Expected indentation ${indent}, found ${command.indent}.`);
      if (command.code === 0) {
        if (!strict) {
          index += 1;
          continue;
        }
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
      if (branchCodes.includes(command.code) && (strict || command.code === 413))
        fail(index, "Orphan branch or closing record.");
      const allowedPredecessors = continuationParents.get(command.code);
      if (
        strict &&
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
      if (strict && command.code === 111) {
        const thenBody = sequence(index + 1, indent + 1, { indent, codes: [411, 412] }, loopDepth);
        let end = thenBody.index;
        if (commands[end]?.code === 411 && commands[end]?.indent === indent)
          end = sequence(end + 1, indent + 1, { indent, codes: [412] }, loopDepth).index;
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
      if (strict && (choices || battle)) {
        const branches = choices ? [402, 403] : [601, 602, 603];
        const close = choices ? 404 : 604;
        let end = index + 1;
        while (isBoundary(end, { indent, codes: branches }))
          end = sequence(
            end + 1,
            indent + 1,
            { indent, codes: [...branches, close] },
            loopDepth,
          ).index;
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
