import type { DslCommand } from "../domain/types.js";
import type { ReferenceResolver } from "../validation/types.js";

export type RawEventCommand = {
  code: number;
  indent: number;
  parameters: unknown[];
};

export type CompileCommandList = (
  nodes: readonly DslCommand[],
  indent: number,
  resolver: ReferenceResolver,
  includeTerminator?: boolean,
) => RawEventCommand[];
