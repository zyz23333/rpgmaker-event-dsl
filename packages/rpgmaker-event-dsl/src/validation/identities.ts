import type { DslOwnedDeclaration, MapEventDefinition } from "../domain/types.js";
import type { SnapshotMapValidationEntry, ValidationIssue } from "./types.js";

export type { SnapshotMapValidationEntry } from "./types.js";

export function validateDeclarationIdentities(
  declarations: readonly DslOwnedDeclaration[],
  issues: ValidationIssue[],
  snapshotMaps?: readonly SnapshotMapValidationEntry[],
): void {
  const mapEventIdentities = new Set<string>();
  const commonEventIds = new Set<number>();
  const switchIds = new Set<number>();
  const variableIds = new Set<number>();
  const snapshotMapsById =
    snapshotMaps === undefined ? undefined : new Map(snapshotMaps.map((map) => [map.id, map]));
  const occupiedCoordinates = new Set<string>();

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
        validateMapEventPlacement(declaration, snapshotMapsById, occupiedCoordinates, issues);
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

function validateMapEventPlacement(
  declaration: MapEventDefinition,
  snapshotMapsById: ReadonlyMap<number, SnapshotMapValidationEntry> | undefined,
  occupiedCoordinates: Set<string>,
  issues: ValidationIssue[],
): void {
  if (snapshotMapsById === undefined) {
    return;
  }

  const map = snapshotMapsById.get(declaration.mapId);
  if (map === undefined) {
    issues.push({
      level: "error",
      message: `Map event "${declaration.name}" references unknown mapId ${declaration.mapId}.`,
    });
    return;
  }

  if (map.width !== undefined && !isCoordinateInBounds(declaration.x, map.width)) {
    issues.push({
      level: "error",
      message: `Map event "${declaration.name}" x coordinate ${declaration.x} is outside map ${map.id} bounds 0-${map.width - 1}.`,
    });
  }
  if (map.height !== undefined && !isCoordinateInBounds(declaration.y, map.height)) {
    issues.push({
      level: "error",
      message: `Map event "${declaration.name}" y coordinate ${declaration.y} is outside map ${map.id} bounds 0-${map.height - 1}.`,
    });
  }

  const coordinateKey = `${declaration.mapId}:${declaration.x}:${declaration.y}`;
  const snapshotOccupant = map.eventLocations.find(
    (event) =>
      event.eventId !== declaration.id && event.x === declaration.x && event.y === declaration.y,
  );
  if (occupiedCoordinates.has(coordinateKey) || snapshotOccupant !== undefined) {
    issues.push({
      level: "warning",
      message: `Map event "${declaration.name}" uses occupied coordinate (${declaration.x}, ${declaration.y}) on map ${declaration.mapId}.`,
    });
  }
  occupiedCoordinates.add(coordinateKey);
}

function isCoordinateInBounds(value: number, size: number): boolean {
  return Number.isInteger(value) && value >= 0 && value < size;
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
