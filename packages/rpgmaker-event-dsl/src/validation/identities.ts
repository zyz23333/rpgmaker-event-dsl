import type { DslOwnedDeclaration, MapEventDefinition } from "../dsl.js";
import type { ValidationIssue } from "../staged-graph.js";

export function validateDeclarationIdentities(
  declarations: readonly DslOwnedDeclaration[],
  issues: ValidationIssue[],
): void {
  const mapEventIdentities = new Set<string>();
  const commonEventIds = new Set<number>();
  const switchIds = new Set<number>();
  const variableIds = new Set<number>();

  for (const declaration of declarations) {
    switch (declaration.kind) {
      case "mapEvent":
        validatePositiveInteger(declaration.mapId, "Map event mapId", declaration.name, issues);
        validatePositiveInteger(declaration.id, "Map event id", declaration.name, issues);
        trackUniqueIdentity(
          mapEventIdentities,
          mapEventIdentityKey(declaration),
          `Duplicate Map Event identity: mapId ${declaration.mapId}, eventId ${declaration.id}.`,
          issues,
        );
        if (declaration.pages.length === 0) {
          issues.push({
            level: "error",
            message: `Map event "${declaration.name}" must contain at least one page.`,
          });
        }
        break;
      case "commonEvent":
        validatePositiveInteger(declaration.id, "Common event id", declaration.name, issues);
        trackUniqueIdentity(
          commonEventIds,
          declaration.id,
          `Duplicate Common Event id: ${declaration.id}.`,
          issues,
        );
        break;
      case "switchDefinition":
        validatePositiveInteger(declaration.id, "Switch id", declaration.name, issues);
        validateNonEmptyName(declaration.name, "Switch", issues);
        trackUniqueIdentity(
          switchIds,
          declaration.id,
          `Duplicate Switch id: ${declaration.id}.`,
          issues,
        );
        break;
      case "variableDefinition":
        validatePositiveInteger(declaration.id, "Variable id", declaration.name, issues);
        validateNonEmptyName(declaration.name, "Variable", issues);
        trackUniqueIdentity(
          variableIds,
          declaration.id,
          `Duplicate Variable id: ${declaration.id}.`,
          issues,
        );
        break;
    }
  }
}

export function validatePositiveInteger(
  value: unknown,
  fieldName: string,
  displayName: string,
  issues: ValidationIssue[],
): void {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    issues.push({
      level: "error",
      message: `${fieldName} for "${displayName}" must be a positive integer.`,
    });
  }
}

export function validateNonEmptyName(
  name: string,
  domainName: string,
  issues: ValidationIssue[],
): void {
  if (name.length === 0) {
    issues.push({
      level: "error",
      message: `${domainName} name must be a non-empty string.`,
    });
  }
}

export function trackUniqueIdentity<T>(
  identities: Set<T>,
  identity: T,
  message: string,
  issues: ValidationIssue[],
): void {
  if (identities.has(identity)) {
    issues.push({ level: "error", message });
    return;
  }

  identities.add(identity);
}

export function mapEventIdentityKey(definition: MapEventDefinition): string {
  return `${definition.mapId}:${definition.id}`;
}
