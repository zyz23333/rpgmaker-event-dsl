import type {
  CommonEventDefinition,
  DslOwnedDeclaration,
  MapEventDefinition,
  SwitchDefinition,
  VariableDefinition,
  TroopEventDefinition,
} from "../domain/types.js";
import type {
  CommandInputPrimitiveInspection,
  SnapshotMapValidationEntry,
  SnapshotReferenceInput,
  SnapshotReferenceSource,
  SnapshotTroopValidationEntry,
  SnapshotTilesetValidationEntry,
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
import { validateCompiledCommandLists } from "./compiled-commands.js";
import { validateBattlePages } from "./battle-pages.js";
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
  snapshotTroops?: readonly SnapshotTroopValidationEntry[];
  snapshotTilesets?: readonly SnapshotTilesetValidationEntry[];
  snapshotEquipmentTypes?: unknown;
}): StagedDataGraph {
  const declarations = [...input.declarations];
  const mapEventsByIdentity = new Map<string, MapEventDefinition>();
  const commonEventsById = new Map<number, CommonEventDefinition>();
  const troopEventsById = new Map<number, TroopEventDefinition>();
  const switchesById = new Map<number, SwitchDefinition>();
  const variablesById = new Map<number, VariableDefinition>();

  for (const declaration of declarations) {
    switch (declaration.kind) {
      case "troopEvent":
        troopEventsById.set(declaration.troopId, declaration);
        break;
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
    troopEventsById,
    switchesById,
    variablesById,
    ...(input.snapshotMaps === undefined ? {} : { snapshotMaps: input.snapshotMaps }),
    ...(input.snapshotTroops === undefined ? {} : { snapshotTroops: input.snapshotTroops }),
    ...(input.snapshotTilesets === undefined ? {} : { snapshotTilesets: input.snapshotTilesets }),
    ...("snapshotEquipmentTypes" in input
      ? { snapshotEquipmentTypes: input.snapshotEquipmentTypes }
      : {}),
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

  validateDeclarationIdentities(
    graph.declarations,
    issues,
    graph.snapshotMaps,
    graph.snapshotTroops,
  );
  validateDeclarationReferences(graph.declarations, graph.resolver, options, issues);
  for (const declaration of graph.declarations)
    if (declaration.kind === "troopEvent") validateBattlePages(declaration, graph, options, issues);
  validateCompiledCommandLists(graph, issues, options);

  return { issues };
}

export function validateDslOwnedDeclarations(
  declarations: readonly DslOwnedDeclaration[],
  input: {
    scriptEnabled: boolean;
    snapshotReferences?: SnapshotReferenceInput;
    snapshotMaps?: readonly SnapshotMapValidationEntry[];
    snapshotTroops?: readonly SnapshotTroopValidationEntry[];
  },
): ValidationResult {
  const graphInput: {
    declarations: readonly DslOwnedDeclaration[];
    snapshotReferences?: SnapshotReferenceInput;
    snapshotMaps?: readonly SnapshotMapValidationEntry[];
    snapshotTroops?: readonly SnapshotTroopValidationEntry[];
  } = { declarations };

  if (input.snapshotReferences !== undefined) {
    graphInput.snapshotReferences = input.snapshotReferences;
  }
  if (input.snapshotMaps !== undefined) {
    graphInput.snapshotMaps = input.snapshotMaps;
  }
  if (input.snapshotTroops !== undefined) graphInput.snapshotTroops = input.snapshotTroops;

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
    switchCapacity: Array.isArray(source.system?.switches)
      ? Math.max(0, source.system.switches.length - 1)
      : 0,
    variables: readSystemNameEntries(source.system ?? {}, "variables"),
    variableCapacity: Array.isArray(source.system?.variables)
      ? Math.max(0, source.system.variables.length - 1)
      : 0,
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
