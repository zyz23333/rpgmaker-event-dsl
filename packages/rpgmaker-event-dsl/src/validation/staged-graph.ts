import type {
  CommonEventDefinition,
  DslOwnedDeclaration,
  MapEventDefinition,
  SwitchDefinition,
  VariableDefinition,
} from "../domain/types.js";
import type {
  CommandInputPrimitiveInspection,
  SnapshotMapValidationEntry,
  SnapshotReferenceInput,
  SnapshotReferenceSource,
  StagedDataGraph,
  ValidationIssue,
  ValidationResult,
} from "./types.js";
import {
  buildReferenceScopes,
  createReferenceResolver,
  validateDeclarationReferences,
} from "./references.js";
export {
  buildReferenceScopes,
  buildReferenceScope,
  createReferenceResolver,
  validateDeclarationReferences,
} from "./references.js";
import { validateDeclarationIdentities, mapEventIdentityKey } from "./identities.js";
export {
  validateDeclarationIdentities,
  validatePositiveInteger,
  validateNonEmptyName,
  trackUniqueIdentity,
  mapEventIdentityKey,
} from "./identities.js";
export {
  validatePages,
  validateNodes,
  validateCommandPosition,
  validateMoveRouteCommands,
  validateMapDestination,
  validateEventLocationDestination,
  validateCharacterRuntimeSelector,
  validateActorCommandTarget,
  validateEnemyCommandTarget,
  validateBattlerCommandTarget,
  validateOperateValueOperand,
  validateCommandPositiveInteger,
  validateCommandNonNegativeInteger,
  validateReferenceOrRange,
  validateControlVariablesGameDataOperand,
  validateConditionalBranchCondition,
  validateActorConditionCheck,
  validateCondition,
  isVariableReferenceValue,
} from "./commands.js";
import { collectCommandInputPrimitives } from "./inspection.js";
export { collectCommandInputPrimitives, isReferenceValue } from "./inspection.js";
import { readObjectReferenceEntries, readSystemNameEntries } from "./snapshot.js";
export {
  toReferenceEntry,
  readObjectReferenceEntries,
  readSystemNameEntries,
  readPositiveInteger,
  readNonEmptyString,
} from "./snapshot.js";
export { buildDuplicateAwareNameIndex } from "./shared.js";
export type {
  CommandInputPrimitiveInspection,
  DuplicateAwareNameIndex,
  ReferenceEntry,
  ReferenceResolver,
  ReferenceScope,
  ReferenceScopes,
  SnapshotMapValidationEntry,
  SnapshotReferenceInput,
  SnapshotReferenceSource,
  StagedDataGraph,
  ValidationIssue,
  ValidationResult,
} from "./types.js";

export function buildStagedDataGraph(input: {
  declarations: readonly DslOwnedDeclaration[];
  snapshotReferences?: SnapshotReferenceInput;
  snapshotMaps?: readonly SnapshotMapValidationEntry[];
}): StagedDataGraph {
  const declarations = [...input.declarations];
  const mapEventsByIdentity = new Map<string, MapEventDefinition>();
  const commonEventsById = new Map<number, CommonEventDefinition>();
  const switchesById = new Map<number, SwitchDefinition>();
  const variablesById = new Map<number, VariableDefinition>();

  for (const declaration of declarations) {
    switch (declaration.kind) {
      case "mapEvent":
        mapEventsByIdentity.set(mapEventIdentityKey(declaration), declaration);
        break;
      case "commonEvent":
        commonEventsById.set(declaration.id, declaration);
        break;
      case "switchDefinition":
        switchesById.set(declaration.id, declaration);
        break;
      case "variableDefinition":
        variablesById.set(declaration.id, declaration);
        break;
    }
  }

  const scopes = buildReferenceScopes({
    declarations,
    snapshotReferences: input.snapshotReferences ?? {},
  });

  return {
    declarations,
    mapEventsByIdentity,
    commonEventsById,
    switchesById,
    variablesById,
    ...(input.snapshotMaps === undefined ? {} : { snapshotMaps: input.snapshotMaps }),
    resolver: createReferenceResolver(scopes),
  };
}

export function validateStagedDataGraph(
  graph: StagedDataGraph,
  options: {
    scriptEnabled: boolean;
  },
): ValidationResult {
  const issues: ValidationIssue[] = [];

  validateDeclarationIdentities(graph.declarations, issues, graph.snapshotMaps);
  validateDeclarationReferences(graph.declarations, graph.resolver, options, issues);

  return { issues };
}

export function validateDslOwnedDeclarations(
  declarations: readonly DslOwnedDeclaration[],
  input: {
    scriptEnabled: boolean;
    snapshotReferences?: SnapshotReferenceInput;
    snapshotMaps?: readonly SnapshotMapValidationEntry[];
  },
): ValidationResult {
  const graphInput: {
    declarations: readonly DslOwnedDeclaration[];
    snapshotReferences?: SnapshotReferenceInput;
    snapshotMaps?: readonly SnapshotMapValidationEntry[];
  } = { declarations };

  if (input.snapshotReferences !== undefined) {
    graphInput.snapshotReferences = input.snapshotReferences;
  }
  if (input.snapshotMaps !== undefined) {
    graphInput.snapshotMaps = input.snapshotMaps;
  }

  return validateStagedDataGraph(buildStagedDataGraph(graphInput), {
    scriptEnabled: input.scriptEnabled,
  });
}

export function buildSnapshotReferenceInput(
  source: SnapshotReferenceSource,
): SnapshotReferenceInput {
  return {
    actors: readObjectReferenceEntries(source.actors ?? []),
    animations: readObjectReferenceEntries(source.animations ?? []),
    armors: readObjectReferenceEntries(source.armors ?? []),
    classes: readObjectReferenceEntries(source.classes ?? []),
    commonEvents: readObjectReferenceEntries(source.commonEvents ?? []),
    enemies: readObjectReferenceEntries(source.enemies ?? []),
    items: readObjectReferenceEntries(source.items ?? []),
    maps: (source.mapInfos ?? []).map(({ id, name }) => ({ id, name })),
    skills: readObjectReferenceEntries(source.skills ?? []),
    states: readObjectReferenceEntries(source.states ?? []),
    tilesets: readObjectReferenceEntries(source.tilesets ?? []),
    troops: readObjectReferenceEntries(source.troops ?? []),
    switches: readSystemNameEntries(source.system ?? {}, "switches"),
    variables: readSystemNameEntries(source.system ?? {}, "variables"),
    weapons: readObjectReferenceEntries(source.weapons ?? []),
  };
}

export function inspectCommandInputPrimitives(value: unknown): CommandInputPrimitiveInspection {
  const inspection: CommandInputPrimitiveInspection = {
    projectDataReferences: [],
    assetReferences: [],
    runtimeSelectors: [],
    scriptInputs: [],
  };
  const seen = new Set<object>();

  collectCommandInputPrimitives(value, inspection, seen);

  return inspection;
}
