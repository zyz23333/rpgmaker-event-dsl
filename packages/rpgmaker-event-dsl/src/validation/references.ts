import type { DslOwnedDeclaration } from "../domain/types.js";
import type {
  ReferenceEntry,
  ReferenceResolver,
  ReferenceScope,
  ReferenceScopes,
  SnapshotReferenceInput,
  ValidationIssue,
} from "./types.js";
import { validateNodes, validatePages } from "./commands.js";
import { toReferenceEntry } from "./snapshot.js";
import { buildDuplicateAwareNameIndex } from "./shared.js";
import { CommandStructureError } from "./command-errors.js";
import { assertCommonEventInput } from "./common-events.js";

export function buildReferenceScopes(input: {
  declarations: readonly DslOwnedDeclaration[];
  snapshotReferences: SnapshotReferenceInput;
}): ReferenceScopes {
  const commonEvents = input.declarations.flatMap((declaration) =>
    declaration.kind === "commonEvent" ? [toReferenceEntry(declaration)] : [],
  );
  const switches = input.declarations.flatMap((declaration) =>
    declaration.kind === "switchDefinition" ? [toReferenceEntry(declaration)] : [],
  );
  const variables = input.declarations.flatMap((declaration) =>
    declaration.kind === "variableDefinition" ? [toReferenceEntry(declaration)] : [],
  );

  return {
    actor: buildReferenceScope(input.snapshotReferences.actors ?? []),
    animation: buildReferenceScope(input.snapshotReferences.animations ?? []),
    armor: buildReferenceScope(input.snapshotReferences.armors ?? []),
    class: buildReferenceScope(input.snapshotReferences.classes ?? []),
    commonEvent: buildReferenceScope(commonEvents, true),
    enemy: buildReferenceScope(input.snapshotReferences.enemies ?? []),
    item: buildReferenceScope(input.snapshotReferences.items ?? []),
    map: buildReferenceScope(input.snapshotReferences.maps ?? []),
    skill: buildReferenceScope(input.snapshotReferences.skills ?? []),
    state: buildReferenceScope(input.snapshotReferences.states ?? []),
    switch: buildSystemScope(
      switches,
      input.snapshotReferences.switches ?? [],
      input.snapshotReferences.switchCapacity,
    ),
    tileset: buildReferenceScope(input.snapshotReferences.tilesets ?? []),
    troop: buildReferenceScope(input.snapshotReferences.troops ?? []),
    variable: buildSystemScope(
      variables,
      input.snapshotReferences.variables ?? [],
      input.snapshotReferences.variableCapacity,
    ),
    weapon: buildReferenceScope(input.snapshotReferences.weapons ?? []),
  };
}

function buildSystemScope(
  declarations: readonly ReferenceEntry[],
  snapshot: readonly ReferenceEntry[],
  capacity = 0,
): ReferenceScope {
  return {
    ...buildReferenceScope(declarations),
    capacity: [...snapshot, ...declarations].reduce(
      (maximum, { id }) => (Number.isSafeInteger(id) && id > maximum ? id : maximum),
      Math.max(capacity, 0),
    ),
  };
}

export function buildReferenceScope(
  entries: readonly ReferenceEntry[],
  includeEmptyNames = false,
): ReferenceScope {
  return {
    byId: new Map(entries.map((entry) => [entry.id, entry])),
    byName: buildDuplicateAwareNameIndex(entries, includeEmptyNames),
  };
}

export function createReferenceResolver(scopes: ReferenceScopes): ReferenceResolver {
  return {
    resolveReference(ref) {
      const scope = scopes[ref.kind];

      if ("id" in ref) {
        if (
          !Number.isSafeInteger(ref.id) ||
          ref.id <= 0 ||
          (!scope.byId.has(ref.id) && !(scope.capacity !== undefined && ref.id <= scope.capacity))
        ) {
          throw new Error(`Unknown ${ref.kind} reference id: ${ref.id}`);
        }

        return ref.id;
      }

      const ids = scope.byName.get(ref.name) ?? [];
      if (ids.length === 0) {
        throw new Error(`Unknown ${ref.kind} reference: ${ref.name}`);
      }
      if (ids.length > 1) {
        throw new Error(`Ambiguous ${ref.kind} reference: ${ref.name}`);
      }

      return ids[0] as number;
    },
  };
}

export function validateDeclarationReferences(
  declarations: readonly DslOwnedDeclaration[],
  resolver: ReferenceResolver,
  options: { scriptEnabled: boolean },
  issues: ValidationIssue[],
): void {
  for (const declaration of declarations) {
    if (declaration.kind === "mapEvent") {
      validatePages(
        declaration.pages,
        resolver,
        { ...options, identity: `map ${declaration.mapId} event ${declaration.id}` },
        issues,
      );
      continue;
    }

    if (declaration.kind === "commonEvent") {
      try {
        assertCommonEventInput(declaration, true);
      } catch (error) {
        if (error instanceof CommandStructureError)
          issues.push(error.issue(`commonEvent:${declaration.id}`, "compile"));
        else throw error;
        continue;
      }
      if (declaration.switch) {
        try {
          resolver.resolveReference(declaration.switch);
        } catch (error) {
          issues.push(
            new CommandStructureError(
              "MV-COMMON-REFERENCE",
              error instanceof Error ? error.message : String(error),
              {
                dslPath: "commonEvent.switch",
                expected: "existing Switch reference",
              },
            ).issue(`commonEvent:${declaration.id}`, "compile"),
          );
        }
      }
      validateNodes(
        declaration.commands,
        resolver,
        { ...options, identity: `common event ${declaration.id}` },
        issues,
      );
    }
  }
}

export { captureReferenceIssue } from "./shared.js";
