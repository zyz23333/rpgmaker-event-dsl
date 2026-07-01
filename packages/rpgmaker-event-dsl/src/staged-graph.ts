import type {
  AssetReference,
  ConditionalBranchCondition,
  CommonEventDefinition,
  DslCommand,
  DslOwnedDeclaration,
  EventPage,
  MapEventDefinition,
  MoveRouteCommand,
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
  animations?: readonly ReferenceEntry[];
  armors?: readonly ReferenceEntry[];
  classes?: readonly ReferenceEntry[];
  commonEvents?: readonly ReferenceEntry[];
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
    animations: readObjectReferenceEntries(source.animations ?? []),
    armors: readObjectReferenceEntries(source.armors ?? []),
    classes: readObjectReferenceEntries(source.classes ?? []),
    commonEvents: readObjectReferenceEntries(source.commonEvents ?? []),
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
    animation: buildReferenceScope(input.snapshotReferences.animations ?? []),
    armor: buildReferenceScope(input.snapshotReferences.armors ?? []),
    class: buildReferenceScope(input.snapshotReferences.classes ?? []),
    commonEvent: buildReferenceScope(commonEvents),
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
      validateReferenceOrRange(node.switch, resolver, issues);
    }
    if (node.kind === "controlVariables") {
      validateReferenceOrRange(node.variable, resolver, issues);
      if (isVariableReferenceValue(node.value)) {
        const valueRef = node.value;
        captureReferenceIssue(() => resolver.resolveReference(valueRef), issues);
      }
      if (typeof node.value === "object" && node.value !== null && "kind" in node.value) {
        if (node.value.kind === "script" && !options.scriptEnabled) {
          issues.push({
            level: "error",
            message: "Control Variables script operands require explicit config enablement.",
          });
        }
        if (node.value.kind === "gameData") {
          validateControlVariablesGameDataOperand(node.value, resolver, issues);
        }
      }
    }
    if (node.kind === "changeItems") {
      captureReferenceIssue(() => resolver.resolveReference(node.item), issues);
      if (isVariableReferenceValue(node.amount)) {
        const amountRef = node.amount;
        captureReferenceIssue(() => resolver.resolveReference(amountRef), issues);
      }
    }
    if (node.kind === "changeWeapons") {
      captureReferenceIssue(() => resolver.resolveReference(node.weapon), issues);
      if (isVariableReferenceValue(node.amount)) {
        const amountRef = node.amount;
        captureReferenceIssue(() => resolver.resolveReference(amountRef), issues);
      }
    }
    if (node.kind === "changeArmors") {
      captureReferenceIssue(() => resolver.resolveReference(node.armor), issues);
      if (isVariableReferenceValue(node.amount)) {
        const amountRef = node.amount;
        captureReferenceIssue(() => resolver.resolveReference(amountRef), issues);
      }
    }
    if (node.kind === "changeGold" && isVariableReferenceValue(node.value)) {
      const valueRef = node.value;
      captureReferenceIssue(() => resolver.resolveReference(valueRef), issues);
    }
    if (node.kind === "changePartyMember") {
      captureReferenceIssue(() => resolver.resolveReference(node.actor), issues);
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
      validateMapDestination(node.destination, resolver, issues);
    }
    if (node.kind === "setVehicleLocation") {
      validateMapDestination(node.destination, resolver, issues);
    }
    if (node.kind === "setEventLocation") {
      validateCharacterRuntimeSelector(node.character, "Set Event Location character", issues);
      validateEventLocationDestination(node.destination, resolver, issues);
    }
    if (node.kind === "setMovementRoute") {
      validateCharacterRuntimeSelector(node.target, "Set Movement Route target", issues);
      validateMoveRouteCommands(node.route, resolver, options, issues);
    }
    if (node.kind === "showAnimation") {
      validateCharacterRuntimeSelector(node.target, "Show Animation target", issues);
      captureReferenceIssue(() => resolver.resolveReference(node.animation), issues);
    }
    if (node.kind === "showBalloonIcon") {
      validateCharacterRuntimeSelector(node.target, "Show Balloon Icon target", issues);
    }
    if (node.kind === "showPicture" || node.kind === "movePicture") {
      validateCommandPosition(node.position, resolver, issues);
    }
    if (node.kind === "battleProcessing" && isReferenceValue(node.troop)) {
      const troopRef = node.troop;
      captureReferenceIssue(() => resolver.resolveReference(troopRef), issues);
    }
    if (node.kind === "changeTileset") {
      captureReferenceIssue(() => resolver.resolveReference(node.tileset), issues);
    }
    if (node.kind === "getLocationInfo") {
      captureReferenceIssue(() => resolver.resolveReference(node.variable), issues);
      validateCommandPosition(node.location, resolver, issues);
    }
    if (node.kind === "conditional") {
      validateConditionalBranchCondition(node.condition, resolver, options, issues);
      validateNodes(node.then, resolver, options, issues);
      if (node.else) {
        validateNodes(node.else, resolver, options, issues);
      }
    }
  }
}

function validateCommandPosition(
  position: Extract<DslCommand, { kind: "showPicture" | "movePicture" }>["position"],
  resolver: ReferenceResolver,
  issues: ValidationIssue[],
): void {
  if (position.kind === "variables") {
    captureReferenceIssue(() => resolver.resolveReference(position.x), issues);
    captureReferenceIssue(() => resolver.resolveReference(position.y), issues);
  }
}

function validateMoveRouteCommands(
  route: readonly MoveRouteCommand[],
  resolver: ReferenceResolver,
  options: { scriptEnabled: boolean },
  issues: ValidationIssue[],
): void {
  for (const command of route) {
    if (command.kind === "switchOn" || command.kind === "switchOff") {
      captureReferenceIssue(() => resolver.resolveReference(command.switch), issues);
    }

    if (command.kind === "script" && !options.scriptEnabled) {
      issues.push({
        level: "error",
        message: "Set Movement Route script commands require explicit config enablement.",
      });
    }
  }
}

function validateMapDestination(
  destination: Extract<
    DslCommand,
    { kind: "setVehicleLocation" | "transferPlayer" }
  >["destination"],
  resolver: ReferenceResolver,
  issues: ValidationIssue[],
): void {
  if (destination.kind === "direct") {
    captureReferenceIssue(() => resolver.resolveReference(destination.map), issues);
    return;
  }

  captureReferenceIssue(() => resolver.resolveReference(destination.map), issues);
  captureReferenceIssue(() => resolver.resolveReference(destination.x), issues);
  captureReferenceIssue(() => resolver.resolveReference(destination.y), issues);
}

function validateEventLocationDestination(
  destination: Extract<DslCommand, { kind: "setEventLocation" }>["destination"],
  resolver: ReferenceResolver,
  issues: ValidationIssue[],
): void {
  if (destination.kind === "variables") {
    captureReferenceIssue(() => resolver.resolveReference(destination.x), issues);
    captureReferenceIssue(() => resolver.resolveReference(destination.y), issues);
    return;
  }

  if (destination.kind === "exchange") {
    validateCharacterRuntimeSelector(
      destination.character,
      "Set Event Location exchange character",
      issues,
    );
  }
}

function validateCharacterRuntimeSelector(
  selector: RuntimeSelector,
  fieldName: string,
  issues: ValidationIssue[],
): void {
  if (selector.scope !== "character") {
    issues.push({
      level: "error",
      message: `${fieldName} must use the character runtime selector scope.`,
    });
    return;
  }

  if (selector.target === "player" || selector.target === "currentEvent") {
    if ("id" in selector) {
      issues.push({
        level: "error",
        message: `${fieldName} must not include an id for ${selector.target}.`,
      });
    }
    return;
  }

  if (selector.target === "event") {
    const eventSelector = selector as RuntimeSelector & { id?: unknown };
    if (
      typeof eventSelector.id !== "number" ||
      !Number.isInteger(eventSelector.id) ||
      eventSelector.id <= 0
    ) {
      issues.push({
        level: "error",
        message: `${fieldName} event id must be a positive integer.`,
      });
    }
    return;
  }

  issues.push({
    level: "error",
    message: `${fieldName} target must be player, currentEvent, or event.`,
  });
}

function validateReferenceOrRange<TKind extends ReferenceKind>(
  value: ReferenceValue<TKind> | { from: ReferenceValue<TKind>; to: ReferenceValue<TKind> },
  resolver: ReferenceResolver,
  issues: ValidationIssue[],
): void {
  if ("from" in value) {
    captureReferenceIssue(() => resolver.resolveReference(value.from), issues);
    captureReferenceIssue(() => resolver.resolveReference(value.to), issues);
    return;
  }

  captureReferenceIssue(() => resolver.resolveReference(value), issues);
}

function validateControlVariablesGameDataOperand(
  operand: Extract<
    Extract<DslCommand, { kind: "controlVariables" }>["value"],
    { kind: "gameData" }
  >,
  resolver: ReferenceResolver,
  issues: ValidationIssue[],
): void {
  switch (operand.source) {
    case "item":
      captureReferenceIssue(() => resolver.resolveReference(operand.item), issues);
      break;
    case "weapon":
      captureReferenceIssue(() => resolver.resolveReference(operand.weapon), issues);
      break;
    case "armor":
      captureReferenceIssue(() => resolver.resolveReference(operand.armor), issues);
      break;
    case "actor":
      captureReferenceIssue(() => resolver.resolveReference(operand.actor), issues);
      break;
    case "enemy":
    case "character":
    case "party":
    case "other":
      break;
  }
}

function validateConditionalBranchCondition(
  condition: ConditionalBranchCondition,
  resolver: ReferenceResolver,
  options: { scriptEnabled: boolean },
  issues: ValidationIssue[],
): void {
  switch (condition.kind) {
    case "switch":
      captureReferenceIssue(() => resolver.resolveReference(condition.switch), issues);
      break;
    case "variable":
      captureReferenceIssue(() => resolver.resolveReference(condition.variable), issues);
      if (isVariableReferenceValue(condition.value)) {
        const valueRef = condition.value;
        captureReferenceIssue(() => resolver.resolveReference(valueRef), issues);
      }
      break;
    case "actor":
      captureReferenceIssue(() => resolver.resolveReference(condition.actor), issues);
      validateActorConditionCheck(condition.check, resolver, issues);
      break;
    case "enemy":
      if (condition.check.kind === "state") {
        const stateRef = condition.check.state;
        captureReferenceIssue(() => resolver.resolveReference(stateRef), issues);
      }
      break;
    case "item":
      captureReferenceIssue(() => resolver.resolveReference(condition.item), issues);
      break;
    case "weapon":
      captureReferenceIssue(() => resolver.resolveReference(condition.weapon), issues);
      break;
    case "armor":
      captureReferenceIssue(() => resolver.resolveReference(condition.armor), issues);
      break;
    case "script":
      if (!options.scriptEnabled) {
        issues.push({
          level: "error",
          message: "Conditional Branch script conditions require explicit config enablement.",
        });
      }
      break;
    case "selfSwitch":
    case "timer":
    case "character":
    case "gold":
    case "button":
    case "vehicle":
      break;
  }
}

function validateActorConditionCheck(
  check: Extract<ConditionalBranchCondition, { kind: "actor" }>["check"],
  resolver: ReferenceResolver,
  issues: ValidationIssue[],
): void {
  switch (check.kind) {
    case "class":
      captureReferenceIssue(() => resolver.resolveReference(check.class), issues);
      break;
    case "skill":
      captureReferenceIssue(() => resolver.resolveReference(check.skill), issues);
      break;
    case "weapon":
      captureReferenceIssue(() => resolver.resolveReference(check.weapon), issues);
      break;
    case "armor":
      captureReferenceIssue(() => resolver.resolveReference(check.armor), issues);
      break;
    case "state":
      captureReferenceIssue(() => resolver.resolveReference(check.state), issues);
      break;
    case "inParty":
    case "name":
      break;
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

function isVariableReferenceValue(value: unknown): value is ReferenceValue<"variable"> {
  return isProjectDataReference(value) && value.kind === "variable";
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
