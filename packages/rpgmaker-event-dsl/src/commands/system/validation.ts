import { CommandStructureError } from "../../validation/command-errors.js";
import { assertDslObject } from "../../validation/dsl-command-inputs.js";

const sceneCodes: Record<string, number> = {
  openMenuScreen: 351,
  openSaveScreen: 352,
  gameOver: 353,
  returnToTitleScreen: 354,
};

export function assertSceneArguments(kind: string, args: readonly unknown[]): void {
  if (args.length === 0) return;
  throw new CommandStructureError(
    `MV-E${sceneCodes[kind]}-INPUT`,
    "Scene commands require exactly zero inputs.",
    { dslPath: kind, expected: "zero arguments", actual: `${args.length} arguments` },
  );
}

export function assertSceneCommandInput(kind: string, input: unknown, path: string): void {
  if (Object.hasOwn(sceneCodes, kind)) assertDslObject(input, ["kind"], path);
}
