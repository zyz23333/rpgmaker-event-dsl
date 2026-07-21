export type ReferenceKind =
  | "actor"
  | "animation"
  | "armor"
  | "class"
  | "commonEvent"
  | "enemy"
  | "item"
  | "map"
  | "skill"
  | "state"
  | "switch"
  | "tileset"
  | "troop"
  | "variable"
  | "weapon";

export const referenceKinds = [
  "actor",
  "animation",
  "armor",
  "class",
  "commonEvent",
  "enemy",
  "item",
  "map",
  "skill",
  "state",
  "switch",
  "tileset",
  "troop",
  "variable",
  "weapon",
] as const satisfies readonly ReferenceKind[];

export const audioAssetFolders = ["bgm", "bgs", "me", "se"] as const;

export const imageAssetFolders = [
  "animations",
  "battlebacks1",
  "battlebacks2",
  "characters",
  "enemies",
  "faces",
  "parallaxes",
  "pictures",
  "sv_actors",
  "sv_enemies",
  "system",
  "tilesets",
  "titles1",
  "titles2",
] as const;

export type ReferenceValue<TKind extends ReferenceKind> =
  | {
      id: number;
      kind: TKind;
    }
  | {
      kind: TKind;
      name: string;
    };

export type AudioAssetFolder = (typeof audioAssetFolders)[number];

export type ImageAssetFolder = (typeof imageAssetFolders)[number];

export type AudioAssetReference = {
  kind: "asset";
  category: "audio";
  folder: AudioAssetFolder;
  name: string;
};

export type ImageAssetReference = {
  kind: "asset";
  category: "image";
  folder: ImageAssetFolder;
  name: string;
};

export type MovieAssetReference = {
  kind: "asset";
  category: "movie";
  folder: "movies";
  name: string;
};

export type AssetReference = AudioAssetReference | ImageAssetReference | MovieAssetReference;

export type RuntimeSelector<TScope extends string = string, TTarget extends string = string> = {
  kind: "runtimeSelector";
  scope: TScope;
  target: TTarget;
};

export type ScriptInput = {
  kind: "scriptInput";
  code: string;
};

export type ReferenceRange<TKind extends ReferenceKind> = {
  kind: "referenceRange";
  from: ReferenceValue<TKind>;
  to: ReferenceValue<TKind>;
};

export type NumericRange = {
  kind: "numericRange";
  from: number;
  to: number;
};

export type ConstantOperand = {
  kind: "constant";
  value: number;
};

export type VariableOperand = {
  kind: "variable";
  variable: ReferenceValue<"variable">;
};

export type RandomOperand = {
  kind: "random";
  from: number;
  to: number;
};

export type ScriptOperand = {
  kind: "script";
  script: ScriptInput;
};

export type ControlVariablesGameDataOperand =
  | {
      kind: "gameData";
      source: "item";
      item: ReferenceValue<"item">;
    }
  | {
      kind: "gameData";
      source: "weapon";
      weapon: ReferenceValue<"weapon">;
    }
  | {
      kind: "gameData";
      source: "armor";
      armor: ReferenceValue<"armor">;
    }
  | {
      kind: "gameData";
      source: "actor";
      actor: ReferenceValue<"actor">;
      value:
        | "level"
        | "exp"
        | "hp"
        | "mp"
        | "mhp"
        | "mmp"
        | "atk"
        | "def"
        | "mat"
        | "mdf"
        | "agi"
        | "luk";
    }
  | {
      kind: "gameData";
      source: "enemy";
      enemyIndex: number;
      value: "hp" | "mp" | "mhp" | "mmp" | "atk" | "def" | "mat" | "mdf" | "agi" | "luk";
    }
  | {
      kind: "gameData";
      source: "character";
      characterId: number;
      value: "mapX" | "mapY" | "direction" | "screenX" | "screenY";
    }
  | {
      kind: "gameData";
      source: "party";
      memberIndex: number;
    }
  | {
      kind: "gameData";
      source: "other";
      value:
        | "mapId"
        | "partyMembers"
        | "gold"
        | "steps"
        | "playTime"
        | "timer"
        | "saveCount"
        | "battleCount"
        | "winCount"
        | "escapeCount";
    };

export type CommandOperand =
  | ConstantOperand
  | VariableOperand
  | RandomOperand
  | ControlVariablesGameDataOperand
  | ScriptOperand;

export type OperateValueOperand = number | ReferenceValue<"variable">;

export type OperateValueInput = {
  operation: "increase" | "decrease";
  operand: OperateValueOperand;
};

export type ActorCommandTarget =
  | (RuntimeSelector<"actor", "entireParty"> & {
      actorId?: never;
      variable?: never;
    })
  | (RuntimeSelector<"actor", "actor"> & {
      actorId: number;
      variable?: never;
    })
  | (RuntimeSelector<"actor", "actorFromVariable"> & {
      actorId?: never;
      variable: ReferenceValue<"variable">;
    });

export type EnemyCommandTarget =
  | (RuntimeSelector<"enemy", "all"> & {
      index?: never;
    })
  | (RuntimeSelector<"enemy", "enemy"> & {
      index: number;
    });

export type BattlerCommandTarget =
  | (RuntimeSelector<"battler", "enemy"> & {
      index: number;
      actorId?: never;
    })
  | (RuntimeSelector<"battler", "actor"> & {
      actorId: number;
      index?: never;
    });

export type ActorParameter = "mhp" | "mmp" | "atk" | "def" | "mat" | "mdf" | "agi" | "luk";

export type DirectPosition = {
  kind: "direct";
  x: number;
  y: number;
};

export type VariablePosition = {
  kind: "variables";
  x: ReferenceValue<"variable">;
  y: ReferenceValue<"variable">;
};

export type CommandPosition = DirectPosition | VariablePosition;

export type VehicleTarget = "boat" | "ship" | "airship";

export type Direction = 2 | 4 | 6 | 8;

export type CharacterRuntimeSelector =
  | (RuntimeSelector<"character", "player"> & {
      id?: never;
    })
  | (RuntimeSelector<"character", "currentEvent"> & {
      id?: never;
    })
  | (RuntimeSelector<"character", "event"> & {
      id: number;
    });

export type DirectMapDestination = {
  kind: "direct";
  map: ReferenceValue<"map">;
  x: number;
  y: number;
};

export type VariableMapDestination = {
  kind: "variables";
  map: ReferenceValue<"variable">;
  x: ReferenceValue<"variable">;
  y: ReferenceValue<"variable">;
};

export type MapDestination = DirectMapDestination | VariableMapDestination;

export type DirectEventLocationDestination = {
  kind: "direct";
  x: number;
  y: number;
};

export type VariableEventLocationDestination = {
  kind: "variables";
  x: ReferenceValue<"variable">;
  y: ReferenceValue<"variable">;
};

export type ExchangeEventLocationDestination = {
  kind: "exchange";
  character: CharacterRuntimeSelector;
};

export type EventLocationDestination =
  | DirectEventLocationDestination
  | VariableEventLocationDestination
  | ExchangeEventLocationDestination;

export type ToneInput =
  | readonly [red: number, green: number, blue: number, gray: number]
  | {
      red: number;
      green: number;
      blue: number;
      gray: number;
    };

export type ColorInput =
  | readonly [red: number, green: number, blue: number, alpha: number]
  | {
      red: number;
      green: number;
      blue: number;
      alpha: number;
    };

export type AudioPayload = {
  asset: AudioAssetReference;
  volume?: number;
  pitch?: number;
  pan?: number;
};

export type LocationInfoType =
  | "terrainTag"
  | "eventId"
  | "tileIdLayer1"
  | "tileIdLayer2"
  | "tileIdLayer3"
  | "tileIdLayer4"
  | "regionId";

export type ConditionalVariableOperator = "eq" | "ge" | "le" | "gt" | "lt" | "ne";

export type ConditionalBranchCondition =
  | {
      kind: "switch";
      switch: ReferenceValue<"switch">;
      value: boolean;
    }
  | {
      kind: "variable";
      variable: ReferenceValue<"variable">;
      operator: ConditionalVariableOperator;
      value: number | ReferenceValue<"variable">;
    }
  | {
      kind: "selfSwitch";
      selfSwitch: "A" | "B" | "C" | "D";
      value: boolean;
    }
  | {
      kind: "timer";
      seconds: number;
      operator: "ge" | "le";
    }
  | {
      kind: "actor";
      actor: ReferenceValue<"actor">;
      check:
        | { kind: "inParty" }
        | { kind: "name"; name: string }
        | { kind: "class"; class: ReferenceValue<"class"> }
        | { kind: "skill"; skill: ReferenceValue<"skill"> }
        | { kind: "weapon"; weapon: ReferenceValue<"weapon"> }
        | { kind: "armor"; armor: ReferenceValue<"armor"> }
        | { kind: "state"; state: ReferenceValue<"state"> };
    }
  | {
      kind: "enemy";
      enemyIndex: number;
      check: { kind: "appeared" } | { kind: "state"; state: ReferenceValue<"state"> };
    }
  | {
      kind: "character";
      characterId: number;
      direction: 2 | 4 | 6 | 8;
    }
  | {
      kind: "gold";
      amount: number;
      operator: "ge" | "le" | "lt";
    }
  | {
      kind: "item";
      item: ReferenceValue<"item">;
    }
  | {
      kind: "weapon";
      weapon: ReferenceValue<"weapon">;
      includeEquipment?: boolean;
    }
  | {
      kind: "armor";
      armor: ReferenceValue<"armor">;
      includeEquipment?: boolean;
    }
  | {
      kind: "button";
      button: "ok" | "cancel" | "shift" | "down" | "left" | "right" | "up" | "pageup" | "pagedown";
    }
  | {
      kind: "script";
      script: ScriptInput;
    }
  | {
      kind: "vehicle";
      vehicle: "boat" | "ship" | "airship";
    };

export function isProjectDataReference(value: unknown): value is ReferenceValue<ReferenceKind> {
  if (!value || typeof value !== "object" || !("kind" in value)) {
    return false;
  }

  const candidate = value as { kind?: unknown; id?: unknown; name?: unknown };
  return (
    typeof candidate.kind === "string" &&
    isReferenceKind(candidate.kind) &&
    ((typeof candidate.id === "number" && !("name" in candidate)) ||
      (typeof candidate.name === "string" && !("id" in candidate)))
  );
}

export function isAssetReference(value: unknown): value is AssetReference {
  if (!value || typeof value !== "object" || !("kind" in value)) {
    return false;
  }

  const candidate = value as {
    kind?: unknown;
    category?: unknown;
    folder?: unknown;
    name?: unknown;
  };

  if (candidate.kind !== "asset" || typeof candidate.name !== "string") {
    return false;
  }

  if (candidate.category === "audio") {
    return isIncluded(audioAssetFolders, candidate.folder);
  }
  if (candidate.category === "image") {
    return isIncluded(imageAssetFolders, candidate.folder);
  }
  if (candidate.category === "movie") {
    return candidate.folder === "movies";
  }

  return false;
}

export function isRuntimeSelector(value: unknown): value is RuntimeSelector {
  if (!value || typeof value !== "object" || !("kind" in value)) {
    return false;
  }

  const candidate = value as { kind?: unknown; scope?: unknown; target?: unknown };
  return (
    candidate.kind === "runtimeSelector" &&
    typeof candidate.scope === "string" &&
    candidate.scope.length > 0 &&
    typeof candidate.target === "string" &&
    candidate.target.length > 0
  );
}

export function isScriptInput(value: unknown): value is ScriptInput {
  if (!value || typeof value !== "object" || !("kind" in value)) {
    return false;
  }

  const candidate = value as { kind?: unknown; code?: unknown };
  return (
    candidate.kind === "scriptInput" &&
    typeof candidate.code === "string" &&
    candidate.code.length > 0
  );
}

export function createReference<TKind extends ReferenceKind>(
  kind: TKind,
  value: { id: number } | { name: string },
): ReferenceValue<TKind> {
  if ("id" in value) {
    return { id: value.id, kind };
  }

  return { kind, name: value.name };
}

export function isReferenceKind(value: string): value is ReferenceKind {
  return (referenceKinds as readonly string[]).includes(value);
}

function isIncluded<TValue extends string>(
  allowedValues: readonly TValue[],
  value: unknown,
): value is TValue {
  return typeof value === "string" && (allowedValues as readonly string[]).includes(value);
}
