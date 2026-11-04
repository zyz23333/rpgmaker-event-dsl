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
  TroopEventDefinition,
} from "../domain/types.js";
import type { MapInfoEntry } from "../project-data/project.js";

export type DuplicateAwareNameIndex = Map<string, number[]>;

export type ValidationIssue = {
  level: "error" | "warning";
  message: string;
  code?: string;
  stage?: "compile" | "decompile";
  identity?: string;
  nativePath?: string;
  dslPath?: string;
  expected?: string;
  actual?: string;
  relatedLocations?: readonly { nativePath?: string; dslPath?: string; value?: string }[];
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
  switchCapacity?: number;
  variables?: readonly ReferenceEntry[];
  variableCapacity?: number;
  weapons?: readonly ReferenceEntry[];
};

export type SnapshotReferenceSource = {
  actors?: readonly unknown[];
  animations?: readonly unknown[];
  armors?: readonly unknown[];
  classes?: readonly unknown[];
  commonEvents?: readonly unknown[];
  enemies?: readonly unknown[];
  items?: readonly unknown[];
  mapInfos?: readonly MapInfoEntry[];
  skills?: readonly unknown[];
  states?: readonly unknown[];
  tilesets?: readonly unknown[];
  troops?: readonly unknown[];
  system?: Record<string, unknown>;
  weapons?: readonly unknown[];
};

export type CommandInputPrimitiveInspection = {
  projectDataReferences: ReferenceValue<ReferenceKind>[];
  assetReferences: AssetReference[];
  runtimeSelectors: RuntimeSelector[];
  scriptInputs: ScriptInput[];
};

export type SnapshotMapValidationEntry = {
  id: number;
  width?: number;
  height?: number;
  tilesetId?: unknown;
  encounterList?: unknown;
  eventLocations: readonly {
    eventId: number;
    x: number;
    y: number;
  }[];
};

// External carrier fields stay uninterpreted until an owned consumer needs them.
// In particular, a hidden or missing-Enemy member must not be filtered or rebound.
export type SnapshotTroopValidationEntry = {
  id: number;
  members?: unknown;
};

export type SnapshotTilesetValidationEntry = {
  id: number;
  tilesetNames?: unknown;
};

export type SnapshotValidationInput = {
  references: SnapshotReferenceInput;
  maps: readonly SnapshotMapValidationEntry[];
  troops: readonly SnapshotTroopValidationEntry[];
  tilesets: readonly SnapshotTilesetValidationEntry[];
  equipmentTypes?: unknown;
};

export type StagedDataGraph = {
  declarations: readonly DslOwnedDeclaration[];
  mapEventsByIdentity: Map<string, MapEventDefinition>;
  commonEventsById: Map<number, CommonEventDefinition>;
  troopEventsById: Map<number, TroopEventDefinition>;
  switchesById: Map<number, SwitchDefinition>;
  variablesById: Map<number, VariableDefinition>;
  snapshotMaps?: readonly SnapshotMapValidationEntry[];
  snapshotTroops?: readonly SnapshotTroopValidationEntry[];
  snapshotTilesets?: readonly SnapshotTilesetValidationEntry[];
  snapshotEquipmentTypes?: unknown;
  resolver: ReferenceResolver;
};

export type ReferenceScope = {
  byId: Map<number, ReferenceEntry>;
  byName: DuplicateAwareNameIndex;
  capacity?: number;
};

export type ReferenceScopes = Record<ReferenceKind, ReferenceScope>;
