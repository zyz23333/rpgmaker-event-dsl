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
import { buildDuplicateAwareNameIndex, captureReferenceIssue } from "./shared.js";

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
    commonEvent: buildReferenceScope(commonEvents),
    enemy: buildReferenceScope(input.snapshotReferences.enemies ?? []),
    item: buildReferenceScope(input.snapshotReferences.items ?? []),
    map: buildReferenceScope(input.snapshotReferences.maps ?? []),
    skill: buildReferenceScope(input.snapshotReferences.skills ?? []),
    state: buildReferenceScope(input.snapshotReferences.states ?? []),
    switch: buildReferenceScope(switches),
    tileset: buildReferenceScope(input.snapshotReferences.tilesets ?? []),
    troop: buildReferenceScope(input.snapshotReferences.troops ?? []),
    variable: buildReferenceScope(variables),
    weapon: buildReferenceScope(input.snapshotReferences.weapons ?? []),
  };
}

export function buildReferenceScope(entries: readonly ReferenceEntry[]): ReferenceScope {
  return {
    byId: new Map(entries.map((entry) => [entry.id, entry])),
    byName: buildDuplicateAwareNameIndex(entries),
  };
}

export function createReferenceResolver(scopes: ReferenceScopes): ReferenceResolver {
  return {
    resolveReference(ref) {
      const scope = scopes[ref.kind];

      if ("id" in ref) {
        if (!scope.byId.has(ref.id)) {
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
      validatePages(declaration.pages, resolver, options, issues);
      continue;
    }

    if (declaration.kind === "commonEvent") {
      if (declaration.trigger !== "none" && declaration.switch === undefined) {
        issues.push({
          level: "error",
          message: `Common event "${declaration.name}" requires a switch when trigger is ${declaration.trigger}.`,
        });
      }
      if (declaration.switch) {
        const switchRef = declaration.switch;
        captureReferenceIssue(() => resolver.resolveReference(switchRef), issues);
      }
      validateNodes(declaration.commands, resolver, options, issues);
    }
  }
}

export { captureReferenceIssue } from "./shared.js";
