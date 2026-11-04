import type { RawEventCommand } from "../../compiler/types.js";
import { describeValue } from "../../project-data/json-values.js";
import { CommandStructureError } from "../../validation/command-errors.js";

export function assertNativeScriptRecords(commands: readonly RawEventCommand[]): void {
  for (const [index, command] of commands.entries()) {
    if (command.code !== 355 && command.code !== 655) continue;
    if ((command.parameters[0] as string).includes("\n"))
      throw new CommandStructureError(
        "MV-SCRIPT-RECORDS",
        "A Script physical record cannot contain LF.",
        {
          nativePath: `list[${index}].parameters[0]`,
          expected: "one string without LF",
          actual: describeValue(command.parameters[0]),
        },
      );
    if (command.code !== 355) continue;
    let count = 1;
    while (
      commands[index + count]?.code === 655 &&
      commands[index + count]?.indent === command.indent
    )
      count++;
    if (count > 12)
      throw new CommandStructureError(
        "MV-SCRIPT-RECORDS",
        "Script requires 1–12 physical records.",
        {
          nativePath: `list[${index + 12}]`,
          expected: "at most 12 records in the E355 group",
          actual: String(count),
          relatedLocations: [{ nativePath: `list[${index}]` }],
        },
      );
  }
}
