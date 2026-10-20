import { describeValue } from "../../project-data/json-values.js";
import { CommandStructureError } from "../../validation/command-errors.js";
import type { ReferenceResolver, ValidationIssue } from "../../validation/types.js";

export function inspectEquipmentContext(
  parameters: readonly unknown[],
  resolver: ReferenceResolver,
  options: {
    equipmentTypes: unknown;
    identity: string;
    stage: "compile" | "decompile";
    nativePath: string;
    dslPath?: string;
    raw?: boolean;
  },
): ValidationIssue[] {
  const types = options.equipmentTypes;
  const nativePath = `${options.nativePath}.parameters[1]`;
  const dslPath = options.dslPath === undefined ? undefined : options.dslPath + (options.raw ? ".parameters[1]" : ".slotIndex");
  if (!Array.isArray(types) || !types.every((value) => typeof value === "string") ||
      typeof parameters[1] !== "number" || parameters[1] < 1 || parameters[1] >= types.length) {
    return [new CommandStructureError("MV-E319-SLOTS", "Equipment slot is outside final System.equipTypes capacity.", {
      nativePath, ...(dslPath === undefined ? {} : { dslPath }),
      expected: "saved one-based slot in final System.equipTypes.length - 1",
      actual: `slot=${describeValue(parameters[1])}; equipTypes=${describeValue(types)}`,
    }).issue(options.identity, options.stage)];
  }
  const id = parameters[2] as number;
  if (id === 0) return [];
  const slotIndex = parameters[1] - 1;
  const kinds = slotIndex === 0 ? ["weapon"] as const : slotIndex === 1 ? ["weapon", "armor"] as const : ["armor"] as const;
  const missing = kinds.filter((kind) => {
    try { resolver.resolveReference({ kind, id }); return false; }
    catch { return true; }
  });
  const location = {
    stage: options.stage, identity: options.identity,
    nativePath: `${options.nativePath}.parameters[2]`,
    ...(options.dslPath === undefined ? {} : { dslPath: options.dslPath + (options.raw ? ".parameters[2]" : ".equipment") }),
  };
  const issues: ValidationIssue[] = [];
  if (missing.length) issues.push({ ...location, level: "warning", code: "MV-E319-CANDIDATE",
    message: `${options.identity}: ${missing.join("/")} candidate ${id} is missing for a possible runtime slot type; the native command may unload equipment. No other table is substituted.`,
  });
  issues.push({ ...location, level: "warning", code: "MV-E319-RUNTIME",
    message: `${options.identity}: Equipment candidate ${id} uses actor.equipSlots()[${slotIndex}] at execution${slotIndex === 1 ? ", including dynamic dual wield" : ""}; inventory, slot type and equipability can prevent the change or unload equipment.`,
  });
  return issues;
}
