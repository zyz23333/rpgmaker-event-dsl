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
} from "../domain/types.js";
import type { MapInfoEntry } from "../project-data/project.js";

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

export type SnapshotMapValidationEntry = {
  id: number;
  width?: number;
  height?: number;
  eventLocations: readonly {
    eventId: number;
    x: number;
    y: number;
  }[];
};

export type StagedDataGraph = {
  declarations: readonly DslOwnedDeclaration[];
  mapEventsByIdentity: Map<string, MapEventDefinition>;
  commonEventsById: Map<number, CommonEventDefinition>;
  switchesById: Map<number, SwitchDefinition>;
  variablesById: Map<number, VariableDefinition>;
  snapshotMaps?: readonly SnapshotMapValidationEntry[];
  resolver: ReferenceResolver;
};

export type ReferenceScope = {
  byId: Map<number, ReferenceEntry>;
  byName: DuplicateAwareNameIndex;
};

export type ReferenceScopes = Record<ReferenceKind, ReferenceScope>;
