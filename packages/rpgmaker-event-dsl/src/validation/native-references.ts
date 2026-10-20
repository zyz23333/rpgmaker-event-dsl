import type { RawEventCommand, CommandOrigins } from "../compiler/types.js";
import type { ReferenceKind } from "../domain/types.js";
import type { ReferenceResolver, ValidationIssue } from "./types.js";
import { CommandStructureError } from "./command-errors.js";
import { renderJsonValue } from "../project-data/json-values.js";
import { inspectEquipmentContext } from "../commands/actor/equipment-validation.js";

// References already supported by current formal commands enter here after compilation,
// so handwritten known raw cannot bypass those fixed-ID checks. Runtime selectors remain
// selectors; family tickets own their context-dependent warnings and complete value domains.
export function inspectNativeCommandReferences(
  commands: readonly RawEventCommand[],
  resolver: ReferenceResolver,
  options: {
    identity: string;
    stage: "compile" | "decompile";
    prefix?: string;
    origins?: CommandOrigins;
    equipmentTypes?: unknown;
  },
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const [index, command] of commands.entries()) {
    const p = command.parameters;
    if (command.code === 319) {
      const origin = options.origins?.get(command);
      issues.push(
        ...inspectEquipmentContext(p, resolver, {
          equipmentTypes: options.equipmentTypes,
          identity: options.identity,
          stage: options.stage,
          nativePath: `${options.prefix ?? ""}list[${index}]`,
          ...(origin ? { dslPath: origin.path, raw: origin.kind === "rawDslCommand" } : {}),
        }),
      );
    }
    const refs: Array<[ReferenceKind, number]> = [];
    const ref = (kind: ReferenceKind, slot: number) => refs.push([kind, slot]);
    const operand = (type: number, value: number) => {
      if (p[type] === 1) ref("variable", value);
    };
    const actorTarget = () => {
      if (p[0] === 1) ref("variable", 1);
      else if (p[0] === 0 && p[1] !== 0) ref("actor", 1);
    };
    switch (command.code) {
      case 103:
      case 104:
        ref("variable", 0);
        break;
      case 117:
        ref("commonEvent", 0);
        break;
      case 121:
        ref("switch", 0);
        ref("switch", 1);
        break;
      case 111:
        if (p[0] === 0) ref("switch", 1);
        if (p[0] === 1) {
          ref("variable", 1);
          operand(2, 3);
        }
        if (p[0] === 4) {
          ref("actor", 1);
          const kinds: Record<number, ReferenceKind> = {
            2: "class",
            3: "skill",
            4: "weapon",
            5: "armor",
            6: "state",
          };
          if (kinds[p[2] as number]) ref(kinds[p[2] as number]!, 3);
        }
        if (p[0] === 5 && p[2] === 1) ref("state", 3);
        if (p[0] === 8) ref("item", 1);
        if (p[0] === 9) ref("weapon", 1);
        if (p[0] === 10) ref("armor", 1);
        break;
      case 122:
        ref("variable", 0);
        ref("variable", 1);
        if (p[3] === 1) ref("variable", 4);
        if (p[3] === 3) {
          const kinds: Record<number, ReferenceKind> = {
            0: "item",
            1: "weapon",
            2: "armor",
            3: "actor",
          };
          if (kinds[p[4] as number]) ref(kinds[p[4] as number]!, 5);
        }
        break;
      case 125:
        operand(1, 2);
        break;
      case 126:
      case 127:
      case 128:
        ref(command.code === 126 ? "item" : command.code === 127 ? "weapon" : "armor", 0);
        operand(2, 3);
        break;
      case 129:
        ref("actor", 0);
        break;
      case 201:
        if (p[0] === 0) ref("map", 1);
        else {
          ref("variable", 1);
          ref("variable", 2);
          ref("variable", 3);
        }
        break;
      case 202:
        if (p[1] === 0) ref("map", 2);
        else {
          ref("variable", 2);
          ref("variable", 3);
          ref("variable", 4);
        }
        break;
      case 203:
        if (p[1] === 1) {
          ref("variable", 2);
          ref("variable", 3);
        }
        break;
      case 212:
        ref("animation", 1);
        break;
      case 231:
      case 232:
        if (p[3] === 1) {
          ref("variable", 4);
          ref("variable", 5);
        }
        break;
      case 282:
        ref("tileset", 0);
        break;
      case 285:
        ref("variable", 0);
        if (p[2] === 1) {
          ref("variable", 3);
          ref("variable", 4);
        }
        break;
      case 301:
        if (p[0] === 0) ref("troop", 1);
        if (p[0] === 1) ref("variable", 1);
        break;
      case 302:
      case 605:
        if (p[1] !== 0) {
          const kinds: Record<number, ReferenceKind> = { 0: "item", 1: "weapon", 2: "armor" };
          if (kinds[p[0] as number]) ref(kinds[p[0] as number]!, 1);
        }
        break;
      case 303:
      case 319:
      case 320:
      case 322:
      case 324:
      case 325:
        ref("actor", 0);
        break;
      case 321:
        ref("actor", 0);
        ref("class", 1);
        break;
      case 311:
      case 312:
      case 315:
      case 316:
      case 326:
        actorTarget();
        operand(3, 4);
        break;
      case 313:
        actorTarget();
        ref("state", 3);
        break;
      case 314:
        actorTarget();
        break;
      case 317:
        actorTarget();
        operand(4, 5);
        break;
      case 318:
        actorTarget();
        ref("skill", 3);
        break;
      case 331:
      case 332:
      case 342:
        operand(2, 3);
        break;
      case 333:
        ref("state", 2);
        break;
      case 336:
        ref("enemy", 1);
        break;
      case 337:
        ref("animation", 1);
        break;
      case 339:
        if (p[0] === 1) ref("actor", 1);
        ref("skill", 2);
        break;
    }
    for (const [kind, slot] of refs)
      try {
        resolver.resolveReference({ kind, id: p[slot] as number });
      } catch (error) {
        const origin = options.origins?.get(command);
        const suffix = `.parameters[${slot}]`;
        issues.push(
          new CommandStructureError(
            `MV-E${command.code}-REFERENCE`,
            error instanceof Error ? error.message : String(error),
            {
              nativePath: `${options.prefix ?? ""}list[${index}]${suffix}`,
              ...(origin
                ? { dslPath: origin.path + (origin.kind === "rawDslCommand" ? suffix : "") }
                : {}),
              expected: `existing ${kind} ID`,
              actual: renderJsonValue(p[slot]),
            },
          ).issue(options.identity, options.stage),
        );
      }
  }
  return issues;
}
