import type { RawEventCommand } from "../../compiler/types.js";
import { CommandStructureError } from "../../validation/command-errors.js";

export function assertNativeMessageGroups(commands: readonly RawEventCommand[]): void {
  for (const [index, command] of commands.entries()) {
    if (![101, 105, 108].includes(command.code)) continue;
    const continuation = command.code === 101 ? 401 : command.code === 105 ? 405 : 408;
    let count = command.code === 108 ? 1 : 0;
    let next = index + 1;
    while (commands[next]?.code === continuation && commands[next]?.indent === command.indent) {
      count++;
      next++;
    }
    const maximum = command.code === 101 ? 4 : command.code === 108 ? 6 : Infinity;
    if (count < 1 || count > maximum)
      throw new CommandStructureError(
        `MV-E${command.code}-LINES`,
        "Invalid number of saved physical line records.",
        {
          nativePath: `list[${index}]`,
          expected:
            command.code === 105
              ? "at least one same-indent E405 record"
              : `1..${maximum} physical records`,
          actual: String(count),
        },
      );
  }
}
