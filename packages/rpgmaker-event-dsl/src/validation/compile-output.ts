import type { RawEventCommand } from "../compiler/types.js";
import type { ReferenceResolver, ValidationIssue } from "./types.js";
import { assertStrictJson } from "../project-data/json-values.js";
import { CommandStructureError, inspectCommandListStructure } from "./command-structure.js";
import { inspectNativeCommandInputs, inspectNativeRouteInputs } from "./native-command-inputs.js";
import { inspectNativeCommandReferences } from "./native-references.js";
import {
  assertNativeMovementRoute,
  validateNativeMovementRouteInputs,
} from "../commands/movement/validation.js";
import type { NativeMovementRoute } from "../commands/movement/types.js";
import { assertNativeBattlePages } from "./battle-pages.js";

/** Validate the actual complete emitted values, before serialization or filesystem writes. */
export function assertCompileOutput(
  files: ReadonlyMap<string, unknown>,
  resolver: ReferenceResolver,
  scriptEnabled: boolean,
): void {
  const issues: ValidationIssue[] = [];
  const system = files.get("System.json");
  const equipmentTypes =
    system !== null && typeof system === "object" && "equipTypes" in system
      ? system.equipTypes
      : undefined;
  const list = (commands: RawEventCommand[], identity: string, prefix = "") => {
    try {
      inspectCommandListStructure(commands, { requireTerminator: true });
    } catch (error) {
      if (error instanceof CommandStructureError)
        throw new Error(`Compile output ${identity}: ${error.message}`, { cause: error });
      throw error;
    }
    issues.push(
      ...inspectNativeCommandInputs(commands, {
        identity,
        stage: "compile",
        scriptEnabled,
        prefix,
      }),
    );
    issues.push(
      ...inspectNativeCommandReferences(commands, resolver, {
        identity,
        stage: "compile",
        prefix,
        equipmentTypes,
      }),
    );
  };
  const require = (condition: boolean, path: string, expected: string) => {
    if (!condition) throw new Error(`Compile output ${path}: expected ${expected}.`);
  };
  for (const [file, value] of files) {
    assertStrictJson(value, `Compile output ${file}`);
    if (file === "System.json") continue;
    if (file === "Troops.json") {
      require(Array.isArray(value), file, "Troop array");
      for (const [index, troop] of (value as Array<Record<string, unknown> | null>).entries()) {
        if (troop === null) continue;
        const identity = `troop:${index}`;
        require(Boolean(troop) &&
          troop.id === index &&
          index > 0 &&
          Number.isSafeInteger(index), identity, "positive matching Troop identity");
        assertNativeBattlePages(troop.pages, troop.members, resolver, identity);
        for (const [pageIndex, page] of troop.pages.entries())
          list(page.list, identity, `pages[${pageIndex}].`);
      }
      continue;
    }
    const events = (
      file === "CommonEvents.json" ? value : (value as { events: unknown }).events
    ) as Array<Record<string, unknown> | null>;
    require(Array.isArray(events), file, "event array");
    for (const [index, event] of events.entries()) {
      if (event === null) continue;
      const identity =
        file === "CommonEvents.json"
          ? `commonEvent:${index}`
          : `map:${Number(file.slice(3, -5))}/event:${index}`;
      require(event.id === index &&
        index > 0 &&
        Number.isSafeInteger(event.id), identity, "positive matching Entry Identity");
      require(typeof event.name === "string", `${identity}.name`, "string");
      if (file === "CommonEvents.json") list(event.list as RawEventCommand[], identity);
      else {
        require(Number.isInteger(event.x) &&
          Number(event.x) >= 0 &&
          Number.isInteger(event.y) &&
          Number(event.y) >= 0, identity, "nonnegative integer coordinates");
        require(Array.isArray(event.pages) &&
          event.pages.length > 0, `${identity}.pages`, "nonempty page array");
        for (const [pageIndex, page] of (event.pages as Array<Record<string, unknown>>).entries()) {
          const prefix = `pages[${pageIndex}].`;
          list(page.list as RawEventCommand[], identity, prefix);
          assertNativeMovementRoute(page.moveRoute, `${prefix}moveRoute`);
          validateNativeMovementRouteInputs(
            page.moveRoute,
            resolver,
            { scriptEnabled: true, identity, nativePath: `${prefix}moveRoute` },
            issues,
          );
          issues.push(
            ...inspectNativeRouteInputs(
              page.moveRoute as NativeMovementRoute,
              `${prefix}moveRoute`,
              { identity, stage: "compile", scriptEnabled },
            ),
          );
        }
      }
    }
  }
  const errors = issues.filter(({ level }) => level === "error");
  if (errors.length > 0)
    throw new Error(
      `Compile output validation failed:\n${errors.map(({ message }) => message).join("\n")}`,
    );
}
