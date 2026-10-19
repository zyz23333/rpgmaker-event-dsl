import type { ReferenceResolver } from "../../validation/types.js";
import { CommandStructureError } from "../../validation/command-errors.js";
import { describeValue } from "../../project-data/json-values.js";

function isTimerSeconds(value: unknown): boolean {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 5999;
}

export function assertControlTimerInput(value: unknown, path: string, withKind = true): void {
  const failShape = (actual: string): never => {
    throw new CommandStructureError("MV-E124-SHAPE", "Invalid Timer authored fields.", {
      dslPath: path,
      expected: "plain Timer object containing only action and optional saved seconds",
      actual,
    });
  };
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value))
  )
    failShape(describeValue(value));
  const allowed = withKind ? ["kind", "action", "seconds"] : ["action", "seconds"];
  for (const key of Reflect.ownKeys(value as object)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
    if (
      typeof key !== "string" ||
      !allowed.includes(key) ||
      !("value" in descriptor) ||
      !descriptor.enumerable
    )
      failShape(`unsupported field ${String(key)}`);
  }
  const input = value as Record<string, unknown>;
  if (!Object.hasOwn(input, "action") || (input.action !== "start" && input.action !== "stop"))
    throw new CommandStructureError("MV-E124-ACTION", "Timer requires Start or Stop.", {
      dslPath: `${path}.action`,
      expected: '"start" or "stop"',
      actual: describeValue(input.action),
    });
  const seconds = Object.hasOwn(input, "seconds") ? input.seconds : undefined;
  if (input.action === "stop" && seconds === undefined) return;
  if (!isTimerSeconds(seconds))
    throw new CommandStructureError("MV-E124-SECONDS", "Invalid Timer saved seconds.", {
      dslPath: `${path}.seconds`,
      expected: "integer 0..5999; required for Start, optional for Stop",
      actual: describeValue(seconds),
    });
}

export function assertNativeTimerParameters(parameters: readonly unknown[], path: string): void {
  const action = parameters[0];
  if ((action !== 0 && action !== 1) || Object.is(action, -0))
    throw new CommandStructureError("MV-E124-ACTION", "Invalid native Timer action.", {
      nativePath: `${path}.parameters[0]`,
      expected: "Start 0 or Stop 1, excluding categorical negative zero",
      actual: describeValue(action),
    });
  if (parameters.length !== 2 && !(action === 1 && parameters.length === 1))
    throw new CommandStructureError("MV-E124-PARAMETERS", "Invalid Timer saved slot count.", {
      nativePath: `${path}.parameters`,
      expected: "Start exactly two saved slots; Stop exactly one or two saved slots",
      actual: describeValue(parameters),
    });
  if (parameters.length === 2 && !isTimerSeconds(parameters[1]))
    throw new CommandStructureError("MV-E124-SECONDS", "Invalid Timer saved seconds.", {
      nativePath: `${path}.parameters[1]`,
      expected: "integer 0..5999",
      actual: describeValue(parameters[1]),
    });
}

export function assertNativeSwitchCommand(
  code: number,
  parameters: readonly unknown[],
  resolver?: ReferenceResolver,
): void {
  if (code !== 121 && code !== 123) return;
  const label = `MV-E${code}`;
  if (!Array.isArray(parameters) || parameters.length !== (code === 121 ? 3 : 2)) {
    throw new Error(
      `${label}-PARAMETERS parameters: expected exactly ${code === 121 ? 3 : 2} saved slots; received ${JSON.stringify(parameters)}.`,
    );
  }
  const operation = parameters[code === 121 ? 2 : 1];
  if (operation !== 0 && operation !== 1) {
    throw new Error(
      `${label}-VALUE parameters[${code === 121 ? 2 : 1}]: expected native ON 0 or OFF 1; received ${JSON.stringify(operation)}.`,
    );
  }
  if (code === 123) {
    if (!["A", "B", "C", "D"].includes(parameters[0] as string)) {
      throw new Error(
        `${label}-LETTER parameters[0]: expected A, B, C or D; received ${JSON.stringify(parameters[0])}.`,
      );
    }
    return;
  }
  const [from, to] = parameters;
  if (
    !Number.isSafeInteger(from) ||
    (from as number) <= 0 ||
    !Number.isSafeInteger(to) ||
    (to as number) <= 0
  ) {
    throw new Error(
      `${label}-TARGET parameters[0..1]: expected positive integer switch IDs; received ${JSON.stringify(parameters.slice(0, 2))}.`,
    );
  }
  if ((from as number) > (to as number)) {
    throw new Error(
      `${label}-RANGE parameters[0..1]: range start ${from} exceeds end ${to}; ranges are not reordered.`,
    );
  }
  if (resolver !== undefined) {
    for (const [index, id] of [from, to].entries()) {
      try {
        resolver.resolveReference({ kind: "switch", id: id as number });
      } catch (error) {
        throw new Error(
          `${label}-REFERENCE parameters[${index}]: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
}
