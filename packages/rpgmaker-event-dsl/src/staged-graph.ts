import type {
  AssetReference,
  CommonEventDefinition,
  DslCommand,
  DslOwnedDeclaration,
  EventPage,
  MapEventDefinition,
  PageConditions,
  ReferenceKind,
  ReferenceValue,
  RuntimeSelector,
  ScriptInput,
  SwitchDefinition,
  VariableDefinition,
} from "./dsl.js";
import {
  isAssetReference,
  isProjectDataReference,
  isRuntimeSelector,
  isScriptInput,
} from "./dsl.js";
import type { MapInfoEntry } from "./project.js";

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
  armors?: readonly ReferenceEntry[];
  commonEvents?: readonly ReferenceEntry[];
  items?: readonly ReferenceEntry[];
  maps?: readonly ReferenceEntry[];
  troops?: readonly ReferenceEntry[];
  switches?: readonly ReferenceEntry[];
  variables?: readonly ReferenceEntry[];
  weapons?: readonly ReferenceEntry[];
};

export type SnapshotReferenceSource = {
  actors?: readonly (Record<string, unknown> | null | undefined)[];
  armors?: readonly (Record<string, unknown> | null | undefined)[];
  commonEvents?: readonly (Record<string, unknown> | null | undefined)[];
  items?: readonly (Record<string, unknown> | null | undefined)[];
  mapInfos?: readonly MapInfoEntry[];
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

type ReferenceScope = {
  byId: Map<number, ReferenceEntry>;
  byName: DuplicateAwareNameIndex;
};

type ReferenceScopes = Record<ReferenceKind, ReferenceScope>;

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
    armors: readObjectReferenceEntries(source.armors ?? []),
    commonEvents: readObjectReferenceEntries(source.commonEvents ?? []),
    items: readObjectReferenceEntries(source.items ?? []),
    maps: (source.mapInfos ?? []).map(({ id, name }) => ({ id, name })),
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

function buildReferenceScopes(input: {
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
    armor: buildReferenceScope(input.snapshotReferences.armors ?? []),
    commonEvent: buildReferenceScope(commonEvents),
    item: buildReferenceScope(input.snapshotReferences.items ?? []),
    map: buildReferenceScope(input.snapshotReferences.maps ?? []),
    switch: buildReferenceScope(switches),
    troop: buildReferenceScope(input.snapshotReferences.troops ?? []),
    variable: buildReferenceScope(variables),
    weapon: buildReferenceScope(input.snapshotReferences.weapons ?? []),
  };
}

function buildReferenceScope(entries: readonly ReferenceEntry[]): ReferenceScope {
  return {
    byId: new Map(entries.map((entry) => [entry.id, entry])),
    byName: buildDuplicateAwareNameIndex(entries),
  };
}

function createReferenceResolver(scopes: ReferenceScopes): ReferenceResolver {
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

function validateDeclarationIdentities(
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

function validateDeclarationReferences(
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

function validatePages(
  pages: readonly EventPage[],
  resolver: ReferenceResolver,
  options: { scriptEnabled: boolean },
  issues: ValidationIssue[],
): void {
  for (const page of pages) {
    validateCondition(page.conditions, resolver, issues);
    validateNodes(page.commands, resolver, options, issues);
  }
}

function validateNodes(
  nodes: readonly DslCommand[],
  resolver: ReferenceResolver,
  options: { scriptEnabled: boolean },
  issues: ValidationIssue[],
): void {
  for (const node of nodes) {
    if (node.kind === "script" && !options.scriptEnabled) {
      issues.push({
        level: "error",
        message: "Script commands require explicit config enablement.",
      });
    }
    if (node.kind === "controlSwitches") {
      captureReferenceIssue(() => resolver.resolveReference(node.switch), issues);
    }
    if (node.kind === "controlVariables") {
      captureReferenceIssue(() => resolver.resolveReference(node.variable), issues);
      if (isReferenceValue(node.value)) {
        captureReferenceIssue(
          () => resolver.resolveReference(node.value as ReferenceValue<"variable">),
          issues,
        );
      }
    }
    if (node.kind === "changeItem") {
      captureReferenceIssue(() => resolver.resolveReference(node.item), issues);
    }
    if (node.kind === "inputNumber" || node.kind === "selectItem") {
      captureReferenceIssue(() => resolver.resolveReference(node.variable), issues);
    }
    if (node.kind === "showChoices" && node.branches.length !== node.choices.length) {
      issues.push({
        level: "error",
        message: "Show Choices branches must match the choice count.",
      });
    }
    if (node.kind === "showChoices") {
      for (const branch of node.branches) {
        validateNodes(branch, resolver, options, issues);
      }
      if (node.cancelBranch) {
        validateNodes(node.cancelBranch, resolver, options, issues);
      }
    }
    if (node.kind === "commonEvent") {
      captureReferenceIssue(() => resolver.resolveReference(node.ref), issues);
    }
    if (node.kind === "transferPlayer") {
      const target = node.target;
      if ("map" in target) {
        captureReferenceIssue(() => resolver.resolveReference(target.map), issues);
      } else {
        captureReferenceIssue(() => resolver.resolveReference(target.variableMap), issues);
        captureReferenceIssue(() => resolver.resolveReference(target.variableX), issues);
        captureReferenceIssue(() => resolver.resolveReference(target.variableY), issues);
      }
    }
    if (node.kind === "battleProcessing" && isReferenceValue(node.troop)) {
      const troopRef = node.troop;
      captureReferenceIssue(() => resolver.resolveReference(troopRef), issues);
    }
    if (node.kind === "conditional") {
      validateCondition(node.condition, resolver, issues);
      validateNodes(node.then, resolver, options, issues);
      if (node.else) {
        validateNodes(node.else, resolver, options, issues);
      }
    }
  }
}

function validateCondition(
  condition: PageConditions,
  resolver: ReferenceResolver,
  issues: ValidationIssue[],
): void {
  if (condition.actor) {
    const actorRef = condition.actor;
    captureReferenceIssue(() => resolver.resolveReference(actorRef), issues);
  }
  if (condition.item) {
    const itemRef = condition.item;
    captureReferenceIssue(() => resolver.resolveReference(itemRef), issues);
  }
  if (condition.switch1) {
    const switchRef = condition.switch1;
    captureReferenceIssue(() => resolver.resolveReference(switchRef), issues);
  }
  if (condition.switch2) {
    const switchRef = condition.switch2;
    captureReferenceIssue(() => resolver.resolveReference(switchRef), issues);
  }
  if (condition.variable) {
    const variableCondition = condition.variable;
    captureReferenceIssue(() => resolver.resolveReference(variableCondition.ref), issues);
    if (typeof variableCondition.value === "number") {
      return;
    }
    if (typeof variableCondition.value === "object" && variableCondition.value !== null) {
      const variableValue = variableCondition.value;
      captureReferenceIssue(
        () => resolver.resolveReference(variableValue as ReferenceValue<"variable">),
        issues,
      );
      return;
    }

    issues.push({
      level: "error",
      message: "Variable conditions require either a numeric value or a variable reference.",
    });
  }
}

function collectCommandInputPrimitives(
  value: unknown,
  inspection: CommandInputPrimitiveInspection,
  seen: Set<object>,
): void {
  if (!value || typeof value !== "object") {
    return;
  }
  if (seen.has(value)) {
    return;
  }

  seen.add(value);

  if (isProjectDataReference(value)) {
    inspection.projectDataReferences.push(value);
    return;
  }
  if (isAssetReference(value)) {
    inspection.assetReferences.push(value);
    return;
  }
  if (isRuntimeSelector(value)) {
    inspection.runtimeSelectors.push(value);
    return;
  }
  if (isScriptInput(value)) {
    inspection.scriptInputs.push(value);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectCommandInputPrimitives(item, inspection, seen);
    }
    return;
  }

  for (const nestedValue of Object.values(value)) {
    collectCommandInputPrimitives(nestedValue, inspection, seen);
  }
}

function isReferenceValue(value: unknown): value is ReferenceValue<ReferenceKind> {
  return isProjectDataReference(value);
}

function captureReferenceIssue(callback: () => number, issues: ValidationIssue[]): void {
  try {
    callback();
  } catch (error) {
    issues.push({
      level: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

function validatePositiveInteger(
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

function validateNonEmptyName(name: string, domainName: string, issues: ValidationIssue[]): void {
  if (name.length === 0) {
    issues.push({
      level: "error",
      message: `${domainName} name must be a non-empty string.`,
    });
  }
}

function trackUniqueIdentity<T>(
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

function toReferenceEntry(
  declaration: CommonEventDefinition | SwitchDefinition | VariableDefinition,
): ReferenceEntry {
  return {
    id: declaration.id,
    name: declaration.name,
  };
}

function readObjectReferenceEntries(
  values: readonly (Record<string, unknown> | null | undefined)[],
): ReferenceEntry[] {
  return values.flatMap((value) => {
    if (!value) {
      return [];
    }

    const id = readPositiveInteger(value.id);
    const name = readNonEmptyString(value.name);

    return id === null || name === null ? [] : [{ id, name }];
  });
}

function readSystemNameEntries(
  system: Record<string, unknown>,
  key: "switches" | "variables",
): ReferenceEntry[] {
  const values = system[key];
  if (!Array.isArray(values)) {
    return [];
  }

  return values.flatMap((value, index) => {
    if (typeof value === "string") {
      return value.length > 0 ? [{ id: index, name: value }] : [];
    }
    if (!value || typeof value !== "object") {
      return [];
    }

    const name = readNonEmptyString((value as Record<string, unknown>).name);
    return name === null ? [] : [{ id: index, name }];
  });
}

function readPositiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

function readNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function mapEventIdentityKey(definition: MapEventDefinition): string {
  return `${definition.mapId}:${definition.id}`;
}
