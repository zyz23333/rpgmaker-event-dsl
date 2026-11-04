import type { DslCommand } from "../domain/types.js";
import type { ReferenceResolver } from "../validation/types.js";

export type RawEventCommand = {
  code: number;
  indent: number;
  parameters: unknown[];
};

export type CommandOrigin = { path: string; kind: DslCommand["kind"] };
export type CommandOrigins = Map<RawEventCommand, CommandOrigin>;

export type CompileCommandList = (
  nodes: readonly DslCommand[],
  indent: number,
  resolver: ReferenceResolver,
  includeTerminator?: boolean,
  sourcePath?: string,
) => RawEventCommand[];
