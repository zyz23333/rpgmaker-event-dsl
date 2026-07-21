import type {
  AssetReference,
  CommonEventDefinition,
  DslOwnedDeclaration,
  MapEventDefinition,
  ReferenceKind,
  ReferenceValue,
  RuntimeSelector,
  ScriptInput,
  SwitchDefinition,
  VariableDefinition,
} from "./dsl.js";
import type { MapInfoEntry } from "./project.js";
import {
  buildReferenceScopes,
  createReferenceResolver,
  validateDeclarationReferences,
} from "./validation/references.js";
export {
  buildReferenceScopes,
  buildReferenceScope,
  createReferenceResolver,
  validateDeclarationReferences,
  captureReferenceIssue,
} from "./validation/references.js";
import { validateDeclarationIdentities, mapEventIdentityKey } from "./validation/identities.js";
export {
  validateDeclarationIdentities,
  validatePositiveInteger,
  validateNonEmptyName,
  trackUniqueIdentity,
  mapEventIdentityKey,
} from "./validation/identities.js";
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
} from "./validation/commands.js";
import { collectCommandInputPrimitives } from "./validation/inspection.js";
export { collectCommandInputPrimitives, isReferenceValue } from "./validation/inspection.js";
import { readObjectReferenceEntries, readSystemNameEntries } from "./validation/snapshot.js";
export {
  toReferenceEntry,
  readObjectReferenceEntries,
  readSystemNameEntries,
  readPositiveInteger,
  readNonEmptyString,
} from "./validation/snapshot.js";

export type DuplicateAwareNameIndex = Map<string, number[]>;

export type ValidationIssue = {
  level: "error" | "warning";
  message: string;
};

export type ValidationResult = {
  issues: ValidationIssue[];
};

export type ReferenceResolver = {
  resolveReference<TKind extends ReferenceKind>(ref: ReferenceValue<TKind>): number;
};

export type ReferenceEntry = {
  id: number;
  name: string;
};

export type SnapshotReferenceInput = {
  actors?: readonly ReferenceEntry[];
  animations?: readonly ReferenceEntry[];
  armors?: readonly ReferenceEntry[];
  classes?: readonly ReferenceEntry[];
  commonEvents?: readonly ReferenceEntry[];
  enemies?: readonly ReferenceEntry[];
  items?: readonly ReferenceEntry[];
  maps?: readonly ReferenceEntry[];
  skills?: readonly ReferenceEntry[];
  states?: readonly ReferenceEntry[];
  tilesets?: readonly ReferenceEntry[];
  troops?: readonly ReferenceEntry[];
  switches?: readonly ReferenceEntry[];
  variables?: readonly ReferenceEntry[];
  weapons?: readonly ReferenceEntry[];
};

export type SnapshotReferenceSource = {
  actors?: readonly (Record<string, unknown> | null | undefined)[];
  animations?: readonly (Record<string, unknown> | null | undefined)[];
  armors?: readonly (Record<string, unknown> | null | undefined)[];
  classes?: readonly (Record<string, unknown> | null | undefined)[];
  commonEvents?: readonly (Record<string, unknown> | null | undefined)[];
  enemies?: readonly (Record<string, unknown> | null | undefined)[];
  items?: readonly (Record<string, unknown> | null | undefined)[];
  mapInfos?: readonly MapInfoEntry[];
  skills?: readonly (Record<string, unknown> | null | undefined)[];
  states?: readonly (Record<string, unknown> | null | undefined)[];
  tilesets?: readonly (Record<string, unknown> | null | undefined)[];
  troops?: readonly (Record<string, unknown> | null | undefined)[];
  system?: Record<string, unknown>;
  weapons?: readonly (Record<string, unknown> | null | undefined)[];
};

export type CommandInputPrimitiveInspection = {
  projectDataReferences: ReferenceValue<ReferenceKind>[];
  assetReferences: AssetReference[];
  runtimeSelectors: RuntimeSelector[];
  scriptInputs: ScriptInput[];
};

export type StagedDataGraph = {
  declarations: readonly DslOwnedDeclaration[];
  mapEventsByIdentity: Map<string, MapEventDefinition>;
  commonEventsById: Map<number, CommonEventDefinition>;
  switchesById: Map<number, SwitchDefinition>;
  variablesById: Map<number, VariableDefinition>;
  resolver: ReferenceResolver;
};

export type ReferenceScope = {
  byId: Map<number, ReferenceEntry>;
  byName: DuplicateAwareNameIndex;
};

export type ReferenceScopes = Record<ReferenceKind, ReferenceScope>;

export function buildStagedDataGraph(input: {
  declarations: readonly DslOwnedDeclaration[];
  snapshotReferences?: SnapshotReferenceInput;
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

  validateDeclarationIdentities(graph.declarations, issues);
  validateDeclarationReferences(graph.declarations, graph.resolver, options, issues);

  return { issues };
}

export function validateDslOwnedDeclarations(
  declarations: readonly DslOwnedDeclaration[],
  input: {
    scriptEnabled: boolean;
    snapshotReferences?: SnapshotReferenceInput;
  },
): ValidationResult {
  const graphInput: {
    declarations: readonly DslOwnedDeclaration[];
    snapshotReferences?: SnapshotReferenceInput;
  } = { declarations };

  if (input.snapshotReferences !== undefined) {
    graphInput.snapshotReferences = input.snapshotReferences;
  }

  return validateStagedDataGraph(buildStagedDataGraph(graphInput), {
    scriptEnabled: input.scriptEnabled,
  });
}

export function buildDuplicateAwareNameIndex(
  entries: readonly ReferenceEntry[],
): DuplicateAwareNameIndex {
  const index: DuplicateAwareNameIndex = new Map();

  for (const entry of entries) {
    const existing = index.get(entry.name);
    if (existing) {
      existing.push(entry.id);
    } else {
      index.set(entry.name, [entry.id]);
    }
  }

  return index;
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
