import type { DslCommand, MovementRoute } from "./command.js";
import type { ImageAssetReference, ReferenceValue } from "./references.js";

export type DslOwnedDeclaration =
  | MapEventDefinition
  | CommonEventDefinition
  | SwitchDefinition
  | VariableDefinition;

export type EventDefinition = MapEventDefinition | CommonEventDefinition;

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

export type CommonEventInput = {
  id: number;
  name: string;
  commands: readonly DslCommand[];
} & (
  | { trigger: "none"; switch?: ReferenceValue<"switch"> }
  | { trigger: "autorun" | "parallel"; switch: ReferenceValue<"switch"> }
);

export type CommonEventDefinition = CommonEventInput & { kind: "commonEvent" };

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

export function isDslOwnedDeclaration(value: unknown): value is DslOwnedDeclaration {
  return (
    !!value &&
    typeof value === "object" &&
    "kind" in value &&
    ((value as { kind?: string }).kind === "mapEvent" ||
      (value as { kind?: string }).kind === "commonEvent" ||
      (value as { kind?: string }).kind === "switchDefinition" ||
      (value as { kind?: string }).kind === "variableDefinition")
  );
}
