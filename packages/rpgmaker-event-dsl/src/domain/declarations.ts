import type { DslCommand, MovementRoute } from "./command.js";
import type { ImageAssetReference, ReferenceValue } from "./references.js";

export type DslOwnedDeclaration =
  | MapEventDefinition
  | CommonEventDefinition
  | TroopEventDefinition
  | SwitchDefinition
  | VariableDefinition;

export type EventDefinition = MapEventDefinition | CommonEventDefinition | TroopEventDefinition;

export type TroopEventDefinition = {
  kind: "troopEvent";
  troopId: number;
  pages: readonly [BattleEventPage, ...BattleEventPage[]];
};

export type BattleEventPage = {
  conditions?: BattlePageConditions;
  span?: "battle" | "turn" | "moment";
  commands: readonly DslCommand[];
};

export type BattlePageConditions = {
  turnEnd?: boolean;
  turn?: { enabled: boolean; a: number; b: number };
  enemy?: { enabled: boolean; index: number; hpAtMost: number };
  actor?: { enabled: boolean; ref: ReferenceValue<"actor">; hpAtMost: number };
  switch?: { enabled: boolean; ref: ReferenceValue<"switch"> };
};

export type SwitchDefinition = {
  kind: "switchDefinition";
  id: number;
  name: string;
};

export type VariableDefinition = {
  kind: "variableDefinition";
  id: number;
  name: string;
};

export type MapEventDefinition = {
  kind: "mapEvent";
  mapId: number;
  id: number;
  name: string;
  x: number;
  y: number;
  note?: string;
  pages: readonly [EventPage, ...EventPage[]];
};

export type CommonEventDefinition = {
  kind: "commonEvent";
  id: number;
  name: string;
  trigger: CommonEventTrigger;
  switch?: ReferenceValue<"switch">;
  commands: readonly DslCommand[];
};

export type CommonEventTrigger = "none" | "autorun" | "parallel";

export type MapPageTrigger = "action" | "playerTouch" | "eventTouch" | "autorun" | "parallel";

export type EventPage = {
  conditions: PageConditions;
  trigger: MapPageTrigger;
  commands: readonly DslCommand[];
  movement?: AutonomousMovement;
  image?: PageImage;
  priority?: "below" | "same" | "above";
  options?: PageOptions;
};

export type PageImage = {
  character?: ImageAssetReference | null;
  characterIndex?: number;
  tileId?: number;
  direction?: "down" | "left" | "right" | "up";
  pattern?: number;
};

export type PageOptions = {
  walkAnimation?: boolean;
  stepAnimation?: boolean;
  directionFix?: boolean;
  through?: boolean;
};

export type AutonomousMovement = {
  type?: "fixed" | "random" | "approach" | "custom";
  speed?: number;
  frequency?: number;
  route?: MovementRoute;
};

export type PageConditions = {
  actor?: { enabled: boolean; ref: ReferenceValue<"actor"> };
  item?: { enabled: boolean; ref: ReferenceValue<"item"> };
  selfSwitch?: { enabled: boolean; value: "A" | "B" | "C" | "D" };
  switch1?: { enabled: boolean; ref: ReferenceValue<"switch"> };
  switch2?: { enabled: boolean; ref: ReferenceValue<"switch"> };
  variable?: {
    enabled: boolean;
    ref: ReferenceValue<"variable">;
    atLeast: number;
  };
};

export function collectDslOwnedDeclarations(
  moduleExports: Record<string, unknown>,
): DslOwnedDeclaration[] {
  const definitions: DslOwnedDeclaration[] = [];

  for (const [name, value] of Object.entries(moduleExports)) {
    if (name === "default") {
      throw new Error("Default export is not allowed for DSL-owned declarations.");
    }
    if (isDslOwnedDeclaration(value)) {
      definitions.push(value);
    }
  }

  return definitions;
}

export function isDslOwnedDeclaration(value: unknown): value is DslOwnedDeclaration {
  return (
    !!value &&
    typeof value === "object" &&
    "kind" in value &&
    ((value as { kind?: string }).kind === "mapEvent" ||
      (value as { kind?: string }).kind === "commonEvent" ||
      (value as { kind?: string }).kind === "troopEvent" ||
      (value as { kind?: string }).kind === "switchDefinition" ||
      (value as { kind?: string }).kind === "variableDefinition")
  );
}
