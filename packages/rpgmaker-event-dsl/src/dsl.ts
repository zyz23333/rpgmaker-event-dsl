export type DslOwnedDeclaration =
  | MapEventDefinition
  | CommonEventDefinition
  | SwitchDefinition
  | VariableDefinition;

export type EventDefinition = MapEventDefinition | CommonEventDefinition;

export type MapEventDefinition = {
  kind: "mapEvent";
  mapId: number;
  id: number;
  name: string;
  x: number;
  y: number;
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

export type CommonEventTrigger = "none" | "autorun" | "parallel";

export type MapPageTrigger = "action" | "playerTouch" | "eventTouch" | "autorun" | "parallel";

export type EventPage = {
  conditions: PageConditions;
  trigger: MapPageTrigger;
  commands: readonly DslCommand[];
};

export type PageConditions = {
  actor?: ReferenceValue<"actor">;
  item?: ReferenceValue<"item">;
  selfSwitch?: "A" | "B" | "C" | "D";
  switch1?: ReferenceValue<"switch">;
  switch2?: ReferenceValue<"switch">;
  variable?: {
    ref: ReferenceValue<"variable">;
    operator: "eq" | "ge" | "le" | "gt" | "lt";
    value: number | ReferenceValue<"variable">;
  };
};

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

export type ReferenceValue<TKind extends ReferenceKind> =
  | {
      id: number;
      kind: TKind;
    }
  | {
      kind: TKind;
      name: string;
    };

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

export type DslCommand =
  | ShowTextDslCommand
  | InputNumberDslCommand
  | SelectItemDslCommand
  | ShowScrollingTextDslCommand
  | ConditionalDslCommand
  | LoopDslCommand
  | BreakLoopDslCommand
  | ExitEventDslCommand
  | CommonEventDslCommand
  | LabelDslCommand
  | JumpToLabelDslCommand
  | CommentDslCommand
  | ScriptDslCommand
  | PluginDslCommand
  | TransferPlayerDslCommand
  | ControlSwitchesDslCommand
  | ControlVariablesDslCommand
  | ControlSelfSwitchDslCommand
  | ControlTimerDslCommand
  | ChangeGoldDslCommand
  | ChangeItemsDslCommand
  | ChangeWeaponsDslCommand
  | ChangeArmorsDslCommand
  | ChangePartyMemberDslCommand
  | ChangeBattleBgmDslCommand
  | ChangeVictoryMeDslCommand
  | ChangeSaveAccessDslCommand
  | ChangeMenuAccessDslCommand
  | ChangeEncounterDisableDslCommand
  | ChangeFormationAccessDslCommand
  | ChangeWindowColorDslCommand
  | ChangeDefeatMeDslCommand
  | ChangeVehicleBgmDslCommand
  | SetVehicleLocationDslCommand
  | SetEventLocationDslCommand
  | ScrollMapDslCommand
  | SetMovementRouteDslCommand
  | GetOnOffVehicleDslCommand
  | ChangeTransparencyDslCommand
  | ShowAnimationDslCommand
  | ShowBalloonIconDslCommand
  | ChangePlayerFollowersDslCommand
  | GatherFollowersDslCommand
  | FadeoutScreenDslCommand
  | FadeinScreenDslCommand
  | TintScreenDslCommand
  | FlashScreenDslCommand
  | ShakeScreenDslCommand
  | WaitDslCommand
  | ShowPictureDslCommand
  | MovePictureDslCommand
  | RotatePictureDslCommand
  | TintPictureDslCommand
  | ErasePictureDslCommand
  | SetWeatherEffectDslCommand
  | PlayBgmDslCommand
  | FadeoutBgmDslCommand
  | SaveBgmDslCommand
  | ResumeBgmDslCommand
  | PlayBgsDslCommand
  | FadeoutBgsDslCommand
  | PlayMeDslCommand
  | PlaySeDslCommand
  | StopSeDslCommand
  | PlayMovieDslCommand
  | ChangeMapNameDisplayDslCommand
  | ChangeTilesetDslCommand
  | ChangeBattleBackDslCommand
  | ChangeParallaxDslCommand
  | GetLocationInfoDslCommand
  | EraseEventDslCommand
  | BattleProcessingDslCommand
  | ShowChoicesDslCommand
  | ShopProcessingDslCommand
  | NameInputProcessingDslCommand
  | ChangeHpDslCommand
  | ChangeMpDslCommand
  | ChangeStateDslCommand
  | RecoverAllDslCommand
  | ChangeExpDslCommand
  | ChangeLevelDslCommand
  | ChangeParameterDslCommand
  | ChangeSkillDslCommand
  | ChangeEquipmentDslCommand
  | ChangeNameDslCommand
  | ChangeClassDslCommand
  | ChangeActorImagesDslCommand
  | ChangeVehicleImageDslCommand
  | ChangeNicknameDslCommand
  | ChangeProfileDslCommand
  | ChangeTpDslCommand
  | ChangeEnemyHpDslCommand
  | ChangeEnemyMpDslCommand
  | ChangeEnemyStateDslCommand
  | EnemyRecoverAllDslCommand
  | EnemyAppearDslCommand
  | EnemyTransformDslCommand
  | ShowBattleAnimationDslCommand
  | ForceActionDslCommand
  | AbortBattleDslCommand
  | ChangeEnemyTpDslCommand
  | OpenMenuScreenDslCommand
  | OpenSaveScreenDslCommand
  | GameOverDslCommand
  | ReturnToTitleScreenDslCommand
  | RawDslCommand;

export type ShowTextDslCommand = {
  kind: "showText";
  lines: readonly [string, ...string[]];
  face?: {
    image: ImageAssetReference;
    index?: number;
  };
  background?: 0 | 1 | 2;
  positionType?: 0 | 1 | 2;
};

export type InputNumberDslCommand = {
  kind: "inputNumber";
  variable: ReferenceValue<"variable">;
  digits: number;
};

export type SelectItemDslCommand = {
  kind: "selectItem";
  variable: ReferenceValue<"variable">;
  itemType?: 1 | 2 | 3 | 4;
};

export type ShowScrollingTextDslCommand = {
  kind: "showScrollingText";
  lines: readonly [string, ...string[]];
  speed?: number;
  noFastForward?: boolean;
};

export type ShowChoicesDslCommand = {
  kind: "showChoices";
  choices: readonly [string, ...string[]];
  branches: readonly [readonly DslCommand[], ...(readonly DslCommand[][])];
  cancelType?: number;
  defaultType?: number;
  positionType?: 0 | 1 | 2;
  background?: 0 | 1 | 2;
  cancelBranch?: readonly DslCommand[];
};

export type ConditionalDslCommand = {
  kind: "conditional";
  condition: ConditionalBranchCondition;
  then: readonly DslCommand[];
  else?: readonly DslCommand[];
};

export type LoopDslCommand = {
  kind: "loop";
  body: readonly DslCommand[];
};

export type BreakLoopDslCommand = {
  kind: "breakLoop";
};

export type ExitEventDslCommand = {
  kind: "exitEvent";
};

export type CommonEventDslCommand = {
  kind: "commonEvent";
  ref: ReferenceValue<"commonEvent">;
};

export type LabelDslCommand = {
  kind: "label";
  name: string;
};

export type JumpToLabelDslCommand = {
  kind: "jumpToLabel";
  name: string;
};

export type CommentDslCommand = {
  kind: "comment";
  lines: readonly [string, ...string[]];
};

export type ScriptDslCommand = {
  kind: "script";
  script: ScriptInput;
};

export type PluginDslCommand = {
  kind: "pluginCommand";
  command: string;
  args?: readonly string[];
};

export type TransferPlayerDslCommand = {
  kind: "transferPlayer";
  destination: MapDestination;
  direction?: Direction;
  fadeType?: 0 | 1 | 2;
};

export type ControlSwitchesDslCommand = {
  kind: "controlSwitches";
  switch: ReferenceValue<"switch"> | ReferenceRange<"switch">;
  value: boolean;
};

export type ControlVariablesDslCommand = {
  kind: "controlVariables";
  variable: ReferenceValue<"variable"> | ReferenceRange<"variable">;
  operation: "set" | "add" | "sub" | "mul" | "div" | "mod";
  value:
    | number
    | ReferenceValue<"variable">
    | RandomOperand
    | ControlVariablesGameDataOperand
    | ScriptOperand;
};

export type ControlSelfSwitchDslCommand = {
  kind: "controlSelfSwitch";
  selfSwitch: "A" | "B" | "C" | "D";
  value: boolean;
};

export type ControlTimerDslCommand =
  | {
      kind: "controlTimer";
      action: "start";
      seconds: number;
    }
  | {
      kind: "controlTimer";
      action: "stop";
    };

export type ChangeGoldDslCommand = {
  kind: "changeGold";
  operation: "gain" | "lose";
  value: OperateValueOperand;
};

export type ChangeItemsDslCommand = {
  kind: "changeItems";
  item: ReferenceValue<"item">;
  operation: "gain" | "lose";
  amount: OperateValueOperand;
};

export type ChangeWeaponsDslCommand = {
  kind: "changeWeapons";
  weapon: ReferenceValue<"weapon">;
  operation: "gain" | "lose";
  amount: OperateValueOperand;
  includeEquipment?: boolean;
};

export type ChangeArmorsDslCommand = {
  kind: "changeArmors";
  armor: ReferenceValue<"armor">;
  operation: "gain" | "lose";
  amount: OperateValueOperand;
  includeEquipment?: boolean;
};

export type ChangePartyMemberDslCommand = {
  kind: "changePartyMember";
  actor: ReferenceValue<"actor">;
  operation: "add" | "remove";
  initialize?: boolean;
};

export type ChangeBattleBgmDslCommand = {
  kind: "changeBattleBgm";
  audio: AudioPayload;
};

export type ChangeVictoryMeDslCommand = {
  kind: "changeVictoryMe";
  audio: AudioPayload;
};

export type ChangeSaveAccessDslCommand = {
  kind: "changeSaveAccess";
  enabled: boolean;
};

export type ChangeMenuAccessDslCommand = {
  kind: "changeMenuAccess";
  enabled: boolean;
};

export type ChangeEncounterDisableDslCommand = {
  kind: "changeEncounterDisable";
  disabled: boolean;
};

export type ChangeFormationAccessDslCommand = {
  kind: "changeFormationAccess";
  enabled: boolean;
};

export type ChangeWindowColorDslCommand = {
  kind: "changeWindowColor";
  tone: ToneInput;
};

export type ChangeDefeatMeDslCommand = {
  kind: "changeDefeatMe";
  audio: AudioPayload;
};

export type ChangeVehicleBgmDslCommand = {
  kind: "changeVehicleBgm";
  vehicle: VehicleTarget;
  audio: AudioPayload;
};

export type SetVehicleLocationDslCommand = {
  kind: "setVehicleLocation";
  vehicle: VehicleTarget;
  destination: MapDestination;
};

export type SetEventLocationDslCommand = {
  kind: "setEventLocation";
  character: CharacterRuntimeSelector;
  destination: EventLocationDestination;
  direction?: 0 | Direction;
};

export type ScrollMapDslCommand = {
  kind: "scrollMap";
  direction: Direction;
  distance: number;
  speed: number;
};

export type MoveRouteCommand =
  | { kind: "moveDown" }
  | { kind: "moveLeft" }
  | { kind: "moveRight" }
  | { kind: "moveUp" }
  | { kind: "moveLowerLeft" }
  | { kind: "moveLowerRight" }
  | { kind: "moveUpperLeft" }
  | { kind: "moveUpperRight" }
  | { kind: "moveRandom" }
  | { kind: "moveTowardPlayer" }
  | { kind: "moveAwayFromPlayer" }
  | { kind: "moveForward" }
  | { kind: "moveBackward" }
  | { kind: "jump"; x: number; y: number }
  | { kind: "routeWait"; frames: number }
  | { kind: "turnDown" }
  | { kind: "turnLeft" }
  | { kind: "turnRight" }
  | { kind: "turnUp" }
  | { kind: "turn90Right" }
  | { kind: "turn90Left" }
  | { kind: "turn180" }
  | { kind: "turn90RightOrLeft" }
  | { kind: "turnRandom" }
  | { kind: "turnTowardPlayer" }
  | { kind: "turnAwayFromPlayer" }
  | { kind: "switchOn"; switch: ReferenceValue<"switch"> }
  | { kind: "switchOff"; switch: ReferenceValue<"switch"> }
  | { kind: "changeSpeed"; speed: number }
  | { kind: "changeFrequency"; frequency: number }
  | { kind: "walkAnimation"; enabled: boolean }
  | { kind: "stepAnimation"; enabled: boolean }
  | { kind: "directionFix"; enabled: boolean }
  | { kind: "through"; enabled: boolean }
  | { kind: "transparent"; enabled: boolean }
  | { kind: "changeImage"; image: ImageAssetReference; index: number }
  | { kind: "changeOpacity"; opacity: number }
  | { kind: "changeBlendMode"; blendMode: 0 | 1 | 2 | 3 }
  | { kind: "playSe"; audio: AudioPayload }
  | { kind: "script"; script: ScriptInput };

export type SetMovementRouteDslCommand = {
  kind: "setMovementRoute";
  target: CharacterRuntimeSelector;
  route: readonly MoveRouteCommand[];
  repeat?: boolean;
  skippable?: boolean;
  wait?: boolean;
};

export type GetOnOffVehicleDslCommand = {
  kind: "getOnOffVehicle";
};

export type ChangeTransparencyDslCommand = {
  kind: "changeTransparency";
  transparent: boolean;
};

export type ShowAnimationDslCommand = {
  kind: "showAnimation";
  target: CharacterRuntimeSelector;
  animation: ReferenceValue<"animation">;
  wait?: boolean;
};

export type BalloonIcon =
  | "exclamation"
  | "question"
  | "musicNote"
  | "heart"
  | "anger"
  | "sweat"
  | "cobweb"
  | "silence"
  | "lightBulb"
  | "zzz";

export type ShowBalloonIconDslCommand = {
  kind: "showBalloonIcon";
  target: CharacterRuntimeSelector;
  balloon: BalloonIcon | number;
  wait?: boolean;
};

export type ChangePlayerFollowersDslCommand = {
  kind: "changePlayerFollowers";
  visible: boolean;
};

export type GatherFollowersDslCommand = {
  kind: "gatherFollowers";
};

export type FadeoutScreenDslCommand = {
  kind: "fadeoutScreen";
};

export type FadeinScreenDslCommand = {
  kind: "fadeinScreen";
};

export type TintScreenDslCommand = {
  kind: "tintScreen";
  tone: ToneInput;
  duration: number;
  wait?: boolean;
};

export type FlashScreenDslCommand = {
  kind: "flashScreen";
  color: ColorInput;
  duration: number;
  wait?: boolean;
};

export type ShakeScreenDslCommand = {
  kind: "shakeScreen";
  power: number;
  speed: number;
  duration: number;
  wait?: boolean;
};

export type WaitDslCommand = {
  kind: "wait";
  frames: number;
};

export type PictureOrigin = "upperLeft" | "center";

export type PicturePosition = CommandPosition & {
  origin?: PictureOrigin;
};

export type PictureDisplayInput = {
  scaleX?: number;
  scaleY?: number;
  opacity?: number;
  blendMode?: 0 | 1 | 2 | 3;
};

export type ShowPictureDslCommand = {
  kind: "showPicture";
  pictureId: number;
  image: ImageAssetReference;
  position: PicturePosition;
} & PictureDisplayInput;

export type MovePictureDslCommand = {
  kind: "movePicture";
  pictureId: number;
  position: PicturePosition;
  duration: number;
  wait?: boolean;
} & PictureDisplayInput;

export type RotatePictureDslCommand = {
  kind: "rotatePicture";
  pictureId: number;
  speed: number;
};

export type TintPictureDslCommand = {
  kind: "tintPicture";
  pictureId: number;
  tone: ToneInput;
  duration: number;
  wait?: boolean;
};

export type ErasePictureDslCommand = {
  kind: "erasePicture";
  pictureId: number;
};

export type WeatherEffectType = "none" | "rain" | "storm" | "snow";

export type SetWeatherEffectDslCommand = {
  kind: "setWeatherEffect";
  weather: WeatherEffectType;
  power: number;
  duration: number;
  wait?: boolean;
};

export type PlayBgmDslCommand = {
  kind: "playBgm";
  audio: AudioPayload;
};

export type FadeoutBgmDslCommand = {
  kind: "fadeoutBgm";
  duration: number;
};

export type SaveBgmDslCommand = {
  kind: "saveBgm";
};

export type ResumeBgmDslCommand = {
  kind: "resumeBgm";
};

export type PlayBgsDslCommand = {
  kind: "playBgs";
  audio: AudioPayload;
};

export type FadeoutBgsDslCommand = {
  kind: "fadeoutBgs";
  duration: number;
};

export type PlayMeDslCommand = {
  kind: "playMe";
  audio: AudioPayload;
};

export type PlaySeDslCommand = {
  kind: "playSe";
  audio: AudioPayload;
};

export type StopSeDslCommand = {
  kind: "stopSe";
};

export type PlayMovieDslCommand = {
  kind: "playMovie";
  movie: MovieAssetReference;
};

export type ChangeMapNameDisplayDslCommand = {
  kind: "changeMapNameDisplay";
  enabled: boolean;
};

export type ChangeTilesetDslCommand = {
  kind: "changeTileset";
  tileset: ReferenceValue<"tileset">;
};

export type ChangeBattleBackDslCommand = {
  kind: "changeBattleBack";
  battleback1: ImageAssetReference;
  battleback2: ImageAssetReference;
};

export type ChangeParallaxDslCommand = {
  kind: "changeParallax";
  image: ImageAssetReference;
  loopX?: boolean;
  loopY?: boolean;
  sx?: number;
  sy?: number;
};

export type GetLocationInfoDslCommand = {
  kind: "getLocationInfo";
  variable: ReferenceValue<"variable">;
  info: LocationInfoType;
  location: CommandPosition;
};

export type EraseEventDslCommand = {
  kind: "eraseEvent";
};

export type BattleProcessingDslCommand = {
  kind: "battleProcessing";
  troop:
    | ReferenceValue<"troop">
    | {
        kind: "troop";
        variable: ReferenceValue<"variable">;
      }
    | {
        kind: "troop";
        useRandomEncounter: true;
      };
  canEscape?: boolean;
  canLose?: boolean;
  win?: readonly DslCommand[];
  escape?: readonly DslCommand[];
  lose?: readonly DslCommand[];
};

export type ShopGoods = {
  kind: "item" | "weapon" | "armor";
  item: ReferenceValue<"item"> | ReferenceValue<"weapon"> | ReferenceValue<"armor">;
  price?: number;
};

export type ShopProcessingDslCommand = {
  kind: "shopProcessing";
  goods: readonly [ShopGoods, ...ShopGoods[]];
  allowSelling?: boolean;
};

export type NameInputProcessingDslCommand = {
  kind: "nameInputProcessing";
  actor: ReferenceValue<"actor">;
  maxCharacters: number;
};

export type ChangeHpDslCommand = {
  kind: "changeHp";
  target: ActorCommandTarget;
  operation: "gain" | "lose";
  value: OperateValueOperand;
  allowDeath?: boolean;
};

export type ChangeMpDslCommand = {
  kind: "changeMp";
  target: ActorCommandTarget;
  operation: "gain" | "lose";
  value: OperateValueOperand;
};

export type ChangeStateDslCommand = {
  kind: "changeState";
  target: ActorCommandTarget;
  operation: "add" | "remove";
  state: ReferenceValue<"state">;
};

export type RecoverAllDslCommand = {
  kind: "recoverAll";
  target: ActorCommandTarget;
};

export type ChangeExpDslCommand = {
  kind: "changeExp";
  target: ActorCommandTarget;
  operation: "gain" | "lose";
  value: OperateValueOperand;
  showLevelUp?: boolean;
};

export type ChangeLevelDslCommand = {
  kind: "changeLevel";
  target: ActorCommandTarget;
  operation: "gain" | "lose";
  value: OperateValueOperand;
  showLevelUp?: boolean;
};

export type ChangeParameterDslCommand = {
  kind: "changeParameter";
  target: ActorCommandTarget;
  parameter: ActorParameter;
  operation: "gain" | "lose";
  value: OperateValueOperand;
};

export type ChangeSkillDslCommand = {
  kind: "changeSkill";
  target: ActorCommandTarget;
  operation: "learn" | "forget";
  skill: ReferenceValue<"skill">;
};

export type ChangeEquipmentDslCommand = {
  kind: "changeEquipment";
  actor: ReferenceValue<"actor">;
  equipmentTypeId: number;
  itemId: number | null;
};

export type ChangeNameDslCommand = {
  kind: "changeName";
  actor: ReferenceValue<"actor">;
  name: string;
};

export type ChangeClassDslCommand = {
  kind: "changeClass";
  actor: ReferenceValue<"actor">;
  class: ReferenceValue<"class">;
  keepExp?: boolean;
};

export type ChangeActorImagesDslCommand = {
  kind: "changeActorImages";
  actor: ReferenceValue<"actor">;
  character: { image: ImageAssetReference; index: number };
  face: { image: ImageAssetReference; index: number };
  battler: ImageAssetReference;
};

export type ChangeVehicleImageDslCommand = {
  kind: "changeVehicleImage";
  vehicle: VehicleTarget;
  image: ImageAssetReference;
  index: number;
};

export type ChangeNicknameDslCommand = {
  kind: "changeNickname";
  actor: ReferenceValue<"actor">;
  nickname: string;
};

export type ChangeProfileDslCommand = {
  kind: "changeProfile";
  actor: ReferenceValue<"actor">;
  profile: string;
};

export type ChangeTpDslCommand = {
  kind: "changeTp";
  target: ActorCommandTarget;
  operation: "gain" | "lose";
  value: OperateValueOperand;
};

export type ChangeEnemyHpDslCommand = {
  kind: "changeEnemyHp";
  target: EnemyCommandTarget;
  operation: "gain" | "lose";
  value: OperateValueOperand;
  allowDeath?: boolean;
};

export type ChangeEnemyMpDslCommand = {
  kind: "changeEnemyMp";
  target: EnemyCommandTarget;
  operation: "gain" | "lose";
  value: OperateValueOperand;
};

export type ChangeEnemyStateDslCommand = {
  kind: "changeEnemyState";
  target: EnemyCommandTarget;
  operation: "add" | "remove";
  state: ReferenceValue<"state">;
};

export type EnemyRecoverAllDslCommand = {
  kind: "enemyRecoverAll";
  target: EnemyCommandTarget;
};

export type EnemyAppearDslCommand = {
  kind: "enemyAppear";
  target: EnemyCommandTarget;
};

export type EnemyTransformDslCommand = {
  kind: "enemyTransform";
  target: EnemyCommandTarget;
  enemy: ReferenceValue<"enemy">;
};

export type ShowBattleAnimationDslCommand = {
  kind: "showBattleAnimation";
  target: EnemyCommandTarget;
  animation: ReferenceValue<"animation">;
};

export type ForceActionDslCommand = {
  kind: "forceAction";
  subject: BattlerCommandTarget;
  skill: ReferenceValue<"skill">;
  targetIndex: number;
};

export type AbortBattleDslCommand = {
  kind: "abortBattle";
};

export type ChangeEnemyTpDslCommand = {
  kind: "changeEnemyTp";
  target: EnemyCommandTarget;
  operation: "gain" | "lose";
  value: OperateValueOperand;
};

export type OpenMenuScreenDslCommand = {
  kind: "openMenuScreen";
};

export type OpenSaveScreenDslCommand = {
  kind: "openSaveScreen";
};

export type GameOverDslCommand = {
  kind: "gameOver";
};

export type ReturnToTitleScreenDslCommand = {
  kind: "returnToTitleScreen";
};

export type RawDslCommand = {
  kind: "rawDslCommand";
  code: number;
  indent?: number;
  parameters: readonly unknown[];
};

export function mapEvent(input: {
  mapId: number;
  id: number;
  name: string;
  x: number;
  y: number;
  pages: readonly [EventPage, ...EventPage[]];
}): MapEventDefinition {
  return {
    kind: "mapEvent",
    mapId: input.mapId,
    id: input.id,
    name: input.name,
    x: input.x,
    y: input.y,
    pages: input.pages,
  };
}

export function commonEvent(input: {
  id: number;
  name: string;
  trigger: CommonEventTrigger;
  switch?: ReferenceValue<"switch">;
  commands: readonly DslCommand[];
}): CommonEventDefinition {
  const definition: CommonEventDefinition = {
    kind: "commonEvent",
    id: input.id,
    name: input.name,
    trigger: input.trigger,
    commands: input.commands,
  };

  if (input.switch !== undefined) {
    definition.switch = input.switch;
  }

  return definition;
}

export function switchDefinition(input: { id: number; name: string }): SwitchDefinition {
  return {
    kind: "switchDefinition",
    id: input.id,
    name: input.name,
  };
}

export function variableDefinition(input: { id: number; name: string }): VariableDefinition {
  return {
    kind: "variableDefinition",
    id: input.id,
    name: input.name,
  };
}

export function page(input: {
  conditions?: PageConditions;
  trigger?: MapPageTrigger;
  commands: readonly DslCommand[];
}): EventPage {
  return {
    conditions: input.conditions ?? {},
    trigger: input.trigger ?? "action",
    commands: input.commands,
  };
}

export function showText(input: {
  lines: readonly [string, ...string[]];
  face?: {
    image: ImageAssetReference;
    index?: number;
  };
  background?: 0 | 1 | 2;
  positionType?: 0 | 1 | 2;
}): ShowTextDslCommand {
  const node: ShowTextDslCommand = {
    kind: "showText",
    lines: input.lines,
  };

  if (input.face !== undefined) {
    node.face = input.face;
  }
  if (input.background !== undefined) {
    node.background = input.background;
  }
  if (input.positionType !== undefined) {
    node.positionType = input.positionType;
  }

  return node;
}

export function inputNumber(input: {
  variable: ReferenceValue<"variable">;
  digits: number;
}): InputNumberDslCommand {
  return {
    kind: "inputNumber",
    variable: input.variable,
    digits: input.digits,
  };
}

export function selectItem(input: {
  variable: ReferenceValue<"variable">;
  itemType?: 1 | 2 | 3 | 4;
}): SelectItemDslCommand {
  const node: SelectItemDslCommand = {
    kind: "selectItem",
    variable: input.variable,
  };

  if (input.itemType !== undefined) {
    node.itemType = input.itemType;
  }

  return node;
}

export function showScrollingText(input: {
  lines: readonly [string, ...string[]];
  speed?: number;
  noFastForward?: boolean;
}): ShowScrollingTextDslCommand {
  const node: ShowScrollingTextDslCommand = {
    kind: "showScrollingText",
    lines: input.lines,
  };

  if (input.speed !== undefined) {
    node.speed = input.speed;
  }
  if (input.noFastForward !== undefined) {
    node.noFastForward = input.noFastForward;
  }

  return node;
}

export function showChoices(input: {
  choices: readonly [string, ...string[]];
  branches: readonly [readonly DslCommand[], ...(readonly DslCommand[][])];
  cancelType?: number;
  defaultType?: number;
  positionType?: 0 | 1 | 2;
  background?: 0 | 1 | 2;
  cancelBranch?: readonly DslCommand[];
}): ShowChoicesDslCommand {
  const node: ShowChoicesDslCommand = {
    kind: "showChoices",
    choices: input.choices,
    branches: input.branches,
  };

  if (input.cancelType !== undefined) {
    node.cancelType = input.cancelType;
  }
  if (input.defaultType !== undefined) {
    node.defaultType = input.defaultType;
  }
  if (input.positionType !== undefined) {
    node.positionType = input.positionType;
  }
  if (input.background !== undefined) {
    node.background = input.background;
  }
  if (input.cancelBranch !== undefined) {
    node.cancelBranch = input.cancelBranch;
  }

  return node;
}

export function conditional(input: {
  condition: ConditionalBranchCondition;
  then: readonly DslCommand[];
  else?: readonly DslCommand[];
}): ConditionalDslCommand {
  const node: ConditionalDslCommand = {
    kind: "conditional",
    condition: input.condition,
    then: input.then,
  };

  if (input.else !== undefined) {
    node.else = input.else;
  }

  return node;
}

export function loop(body: readonly DslCommand[]): LoopDslCommand {
  return { kind: "loop", body };
}

export function breakLoop(): BreakLoopDslCommand {
  return { kind: "breakLoop" };
}

export function exitEvent(): ExitEventDslCommand {
  return { kind: "exitEvent" };
}

export function callCommonEvent(ref: ReferenceValue<"commonEvent">): CommonEventDslCommand {
  return { kind: "commonEvent", ref };
}

export function label(name: string): LabelDslCommand {
  return { kind: "label", name };
}

export function jumpToLabel(name: string): JumpToLabelDslCommand {
  return { kind: "jumpToLabel", name };
}

export function comment(lines: readonly [string, ...string[]]): CommentDslCommand {
  return { kind: "comment", lines };
}

export function script(input: { code: string } | ScriptInput): ScriptDslCommand {
  return {
    kind: "script",
    script: isScriptInput(input) ? input : scriptInput(input),
  };
}

export function pluginCommand(input: {
  command: string;
  args?: readonly string[];
}): PluginDslCommand {
  const node: PluginDslCommand = {
    kind: "pluginCommand",
    command: input.command,
  };

  if (input.args !== undefined) {
    node.args = input.args;
  }

  return node;
}

export function transferPlayer(input: {
  destination: MapDestination;
  direction?: Direction;
  fadeType?: 0 | 1 | 2;
}): TransferPlayerDslCommand {
  const node: TransferPlayerDslCommand = {
    kind: "transferPlayer",
    destination: input.destination,
  };

  if (input.direction !== undefined) {
    node.direction = input.direction;
  }
  if (input.fadeType !== undefined) {
    node.fadeType = input.fadeType;
  }

  return node;
}

export function controlSwitches(input: {
  switch: ReferenceValue<"switch"> | ReferenceRange<"switch">;
  value: boolean;
}): ControlSwitchesDslCommand {
  return {
    kind: "controlSwitches",
    switch: input.switch,
    value: input.value,
  };
}

export function controlVariables(input: {
  variable: ReferenceValue<"variable"> | ReferenceRange<"variable">;
  operation: "set" | "add" | "sub" | "mul" | "div" | "mod";
  value:
    | number
    | ReferenceValue<"variable">
    | RandomOperand
    | ControlVariablesGameDataOperand
    | ScriptOperand;
}): ControlVariablesDslCommand {
  return {
    kind: "controlVariables",
    variable: input.variable,
    operation: input.operation,
    value: input.value,
  };
}

export function controlSelfSwitch(input: {
  selfSwitch: "A" | "B" | "C" | "D";
  value: boolean;
}): ControlSelfSwitchDslCommand {
  return {
    kind: "controlSelfSwitch",
    selfSwitch: input.selfSwitch,
    value: input.value,
  };
}

export function controlTimer(
  input: { action: "start"; seconds: number } | { action: "stop" },
): ControlTimerDslCommand {
  return input.action === "start"
    ? {
        kind: "controlTimer",
        action: input.action,
        seconds: input.seconds,
      }
    : {
        kind: "controlTimer",
        action: input.action,
      };
}

export function changeGold(input: {
  operation: "gain" | "lose";
  value: OperateValueOperand;
}): ChangeGoldDslCommand {
  return {
    kind: "changeGold",
    operation: input.operation,
    value: input.value,
  };
}

export function changeItems(input: {
  item: ReferenceValue<"item">;
  operation: "gain" | "lose";
  amount: OperateValueOperand;
}): ChangeItemsDslCommand {
  return {
    kind: "changeItems",
    item: input.item,
    operation: input.operation,
    amount: input.amount,
  };
}

export function changeWeapons(input: {
  weapon: ReferenceValue<"weapon">;
  operation: "gain" | "lose";
  amount: OperateValueOperand;
  includeEquipment?: boolean;
}): ChangeWeaponsDslCommand {
  const node: ChangeWeaponsDslCommand = {
    kind: "changeWeapons",
    weapon: input.weapon,
    operation: input.operation,
    amount: input.amount,
  };

  if (input.includeEquipment !== undefined) {
    node.includeEquipment = input.includeEquipment;
  }

  return node;
}

export function changeArmors(input: {
  armor: ReferenceValue<"armor">;
  operation: "gain" | "lose";
  amount: OperateValueOperand;
  includeEquipment?: boolean;
}): ChangeArmorsDslCommand {
  const node: ChangeArmorsDslCommand = {
    kind: "changeArmors",
    armor: input.armor,
    operation: input.operation,
    amount: input.amount,
  };

  if (input.includeEquipment !== undefined) {
    node.includeEquipment = input.includeEquipment;
  }

  return node;
}

export function changePartyMember(input: {
  actor: ReferenceValue<"actor">;
  operation: "add" | "remove";
  initialize?: boolean;
}): ChangePartyMemberDslCommand {
  const node: ChangePartyMemberDslCommand = {
    kind: "changePartyMember",
    actor: input.actor,
    operation: input.operation,
  };

  if (input.initialize !== undefined) {
    node.initialize = input.initialize;
  }

  return node;
}

export function changeBattleBgm(input: { audio: AudioPayload }): ChangeBattleBgmDslCommand {
  return {
    kind: "changeBattleBgm",
    audio: input.audio,
  };
}

export function changeVictoryMe(input: { audio: AudioPayload }): ChangeVictoryMeDslCommand {
  return {
    kind: "changeVictoryMe",
    audio: input.audio,
  };
}

export function changeSaveAccess(input: { enabled: boolean }): ChangeSaveAccessDslCommand {
  return {
    kind: "changeSaveAccess",
    enabled: input.enabled,
  };
}

export function changeMenuAccess(input: { enabled: boolean }): ChangeMenuAccessDslCommand {
  return {
    kind: "changeMenuAccess",
    enabled: input.enabled,
  };
}

export function changeEncounterDisable(input: {
  disabled: boolean;
}): ChangeEncounterDisableDslCommand {
  return {
    kind: "changeEncounterDisable",
    disabled: input.disabled,
  };
}

export function changeFormationAccess(input: {
  enabled: boolean;
}): ChangeFormationAccessDslCommand {
  return {
    kind: "changeFormationAccess",
    enabled: input.enabled,
  };
}

export function changeWindowColor(input: { tone: ToneInput }): ChangeWindowColorDslCommand {
  return {
    kind: "changeWindowColor",
    tone: input.tone,
  };
}

export function changeDefeatMe(input: { audio: AudioPayload }): ChangeDefeatMeDslCommand {
  return {
    kind: "changeDefeatMe",
    audio: input.audio,
  };
}

export function changeVehicleBgm(input: {
  vehicle: VehicleTarget;
  audio: AudioPayload;
}): ChangeVehicleBgmDslCommand {
  return {
    kind: "changeVehicleBgm",
    vehicle: input.vehicle,
    audio: input.audio,
  };
}

export function setVehicleLocation(input: {
  vehicle: VehicleTarget;
  destination: MapDestination;
}): SetVehicleLocationDslCommand {
  return {
    kind: "setVehicleLocation",
    vehicle: input.vehicle,
    destination: input.destination,
  };
}

export function setEventLocation(input: {
  character: CharacterRuntimeSelector;
  destination: EventLocationDestination;
  direction?: 0 | Direction;
}): SetEventLocationDslCommand {
  const node: SetEventLocationDslCommand = {
    kind: "setEventLocation",
    character: input.character,
    destination: input.destination,
  };

  if (input.direction !== undefined) {
    node.direction = input.direction;
  }

  return node;
}

export function scrollMap(input: {
  direction: Direction;
  distance: number;
  speed: number;
}): ScrollMapDslCommand {
  return {
    kind: "scrollMap",
    direction: input.direction,
    distance: input.distance,
    speed: input.speed,
  };
}

export function setMovementRoute(input: {
  target: CharacterRuntimeSelector;
  route: readonly MoveRouteCommand[];
  repeat?: boolean;
  skippable?: boolean;
  wait?: boolean;
}): SetMovementRouteDslCommand {
  const node: SetMovementRouteDslCommand = {
    kind: "setMovementRoute",
    target: input.target,
    route: input.route,
  };

  if (input.repeat !== undefined) {
    node.repeat = input.repeat;
  }
  if (input.skippable !== undefined) {
    node.skippable = input.skippable;
  }
  if (input.wait !== undefined) {
    node.wait = input.wait;
  }

  return node;
}

export function getOnOffVehicle(): GetOnOffVehicleDslCommand {
  return {
    kind: "getOnOffVehicle",
  };
}

export function changeTransparency(input: { transparent: boolean }): ChangeTransparencyDslCommand {
  return {
    kind: "changeTransparency",
    transparent: input.transparent,
  };
}

export function showAnimation(input: {
  target: CharacterRuntimeSelector;
  animation: ReferenceValue<"animation">;
  wait?: boolean;
}): ShowAnimationDslCommand {
  const node: ShowAnimationDslCommand = {
    kind: "showAnimation",
    target: input.target,
    animation: input.animation,
  };

  if (input.wait !== undefined) {
    node.wait = input.wait;
  }

  return node;
}

export function showBalloonIcon(input: {
  target: CharacterRuntimeSelector;
  balloon: BalloonIcon | number;
  wait?: boolean;
}): ShowBalloonIconDslCommand {
  const node: ShowBalloonIconDslCommand = {
    kind: "showBalloonIcon",
    target: input.target,
    balloon: input.balloon,
  };

  if (input.wait !== undefined) {
    node.wait = input.wait;
  }

  return node;
}

export function changePlayerFollowers(input: {
  visible: boolean;
}): ChangePlayerFollowersDslCommand {
  return {
    kind: "changePlayerFollowers",
    visible: input.visible,
  };
}

export function gatherFollowers(): GatherFollowersDslCommand {
  return {
    kind: "gatherFollowers",
  };
}

export function fadeoutScreen(): FadeoutScreenDslCommand {
  return {
    kind: "fadeoutScreen",
  };
}

export function fadeinScreen(): FadeinScreenDslCommand {
  return {
    kind: "fadeinScreen",
  };
}

export function tintScreen(input: {
  tone: ToneInput;
  duration: number;
  wait?: boolean;
}): TintScreenDslCommand {
  const node: TintScreenDslCommand = {
    kind: "tintScreen",
    tone: input.tone,
    duration: input.duration,
  };

  if (input.wait !== undefined) {
    node.wait = input.wait;
  }

  return node;
}

export function flashScreen(input: {
  color: ColorInput;
  duration: number;
  wait?: boolean;
}): FlashScreenDslCommand {
  const node: FlashScreenDslCommand = {
    kind: "flashScreen",
    color: input.color,
    duration: input.duration,
  };

  if (input.wait !== undefined) {
    node.wait = input.wait;
  }

  return node;
}

export function shakeScreen(input: {
  power: number;
  speed: number;
  duration: number;
  wait?: boolean;
}): ShakeScreenDslCommand {
  const node: ShakeScreenDslCommand = {
    kind: "shakeScreen",
    power: input.power,
    speed: input.speed,
    duration: input.duration,
  };

  if (input.wait !== undefined) {
    node.wait = input.wait;
  }

  return node;
}

export function wait(frames: number): WaitDslCommand {
  return { kind: "wait", frames };
}

export function showPicture(
  input: {
    pictureId: number;
    image: ImageAssetReference;
    position: PicturePosition;
  } & PictureDisplayInput,
): ShowPictureDslCommand {
  const node: ShowPictureDslCommand = {
    kind: "showPicture",
    pictureId: input.pictureId,
    image: input.image,
    position: input.position,
  };

  assignPictureDisplayInput(node, input);
  return node;
}

export function movePicture(
  input: {
    pictureId: number;
    position: PicturePosition;
    duration: number;
    wait?: boolean;
  } & PictureDisplayInput,
): MovePictureDslCommand {
  const node: MovePictureDslCommand = {
    kind: "movePicture",
    pictureId: input.pictureId,
    position: input.position,
    duration: input.duration,
  };

  assignPictureDisplayInput(node, input);
  if (input.wait !== undefined) {
    node.wait = input.wait;
  }

  return node;
}

export function rotatePicture(input: {
  pictureId: number;
  speed: number;
}): RotatePictureDslCommand {
  return {
    kind: "rotatePicture",
    pictureId: input.pictureId,
    speed: input.speed,
  };
}

export function tintPicture(input: {
  pictureId: number;
  tone: ToneInput;
  duration: number;
  wait?: boolean;
}): TintPictureDslCommand {
  const node: TintPictureDslCommand = {
    kind: "tintPicture",
    pictureId: input.pictureId,
    tone: input.tone,
    duration: input.duration,
  };

  if (input.wait !== undefined) {
    node.wait = input.wait;
  }

  return node;
}

export function erasePicture(input: { pictureId: number }): ErasePictureDslCommand {
  return {
    kind: "erasePicture",
    pictureId: input.pictureId,
  };
}

export function setWeatherEffect(input: {
  weather: WeatherEffectType;
  power: number;
  duration: number;
  wait?: boolean;
}): SetWeatherEffectDslCommand {
  const node: SetWeatherEffectDslCommand = {
    kind: "setWeatherEffect",
    weather: input.weather,
    power: input.power,
    duration: input.duration,
  };

  if (input.wait !== undefined) {
    node.wait = input.wait;
  }

  return node;
}

export function playBgm(input: { audio: AudioPayload }): PlayBgmDslCommand {
  return {
    kind: "playBgm",
    audio: input.audio,
  };
}

export function fadeoutBgm(input: { duration: number }): FadeoutBgmDslCommand {
  return {
    kind: "fadeoutBgm",
    duration: input.duration,
  };
}

export function saveBgm(): SaveBgmDslCommand {
  return {
    kind: "saveBgm",
  };
}

export function resumeBgm(): ResumeBgmDslCommand {
  return {
    kind: "resumeBgm",
  };
}

export function playBgs(input: { audio: AudioPayload }): PlayBgsDslCommand {
  return {
    kind: "playBgs",
    audio: input.audio,
  };
}

export function fadeoutBgs(input: { duration: number }): FadeoutBgsDslCommand {
  return {
    kind: "fadeoutBgs",
    duration: input.duration,
  };
}

export function playMe(input: { audio: AudioPayload }): PlayMeDslCommand {
  return {
    kind: "playMe",
    audio: input.audio,
  };
}

export function playSe(input: { audio: AudioPayload }): PlaySeDslCommand {
  return {
    kind: "playSe",
    audio: input.audio,
  };
}

export function stopSe(): StopSeDslCommand {
  return {
    kind: "stopSe",
  };
}

export function playMovie(input: { movie: MovieAssetReference }): PlayMovieDslCommand {
  return {
    kind: "playMovie",
    movie: input.movie,
  };
}

export function changeMapNameDisplay(input: { enabled: boolean }): ChangeMapNameDisplayDslCommand {
  return {
    kind: "changeMapNameDisplay",
    enabled: input.enabled,
  };
}

export function changeTileset(input: {
  tileset: ReferenceValue<"tileset">;
}): ChangeTilesetDslCommand {
  return {
    kind: "changeTileset",
    tileset: input.tileset,
  };
}

export function changeBattleBack(input: {
  battleback1: ImageAssetReference;
  battleback2: ImageAssetReference;
}): ChangeBattleBackDslCommand {
  return {
    kind: "changeBattleBack",
    battleback1: input.battleback1,
    battleback2: input.battleback2,
  };
}

export function changeParallax(input: {
  image: ImageAssetReference;
  loopX?: boolean;
  loopY?: boolean;
  sx?: number;
  sy?: number;
}): ChangeParallaxDslCommand {
  const node: ChangeParallaxDslCommand = {
    kind: "changeParallax",
    image: input.image,
  };

  if (input.loopX !== undefined) {
    node.loopX = input.loopX;
  }
  if (input.loopY !== undefined) {
    node.loopY = input.loopY;
  }
  if (input.sx !== undefined) {
    node.sx = input.sx;
  }
  if (input.sy !== undefined) {
    node.sy = input.sy;
  }

  return node;
}

export function getLocationInfo(input: {
  variable: ReferenceValue<"variable">;
  info: LocationInfoType;
  location: CommandPosition;
}): GetLocationInfoDslCommand {
  return {
    kind: "getLocationInfo",
    variable: input.variable,
    info: input.info,
    location: input.location,
  };
}

export function eraseEvent(): EraseEventDslCommand {
  return { kind: "eraseEvent" };
}

export function battleProcessing(input: {
  troop:
    | ReferenceValue<"troop">
    | {
        kind: "troop";
        variable: ReferenceValue<"variable">;
      }
    | {
        kind: "troop";
        useRandomEncounter: true;
      };
  canEscape?: boolean;
  canLose?: boolean;
  win?: readonly DslCommand[];
  escape?: readonly DslCommand[];
  lose?: readonly DslCommand[];
}): BattleProcessingDslCommand {
  const node: BattleProcessingDslCommand = {
    kind: "battleProcessing",
    troop: input.troop,
  };

  if (input.canEscape !== undefined) {
    node.canEscape = input.canEscape;
  }
  if (input.canLose !== undefined) {
    node.canLose = input.canLose;
  }
  if (input.win !== undefined) {
    node.win = input.win;
  }
  if (input.escape !== undefined) {
    node.escape = input.escape;
  }
  if (input.lose !== undefined) {
    node.lose = input.lose;
  }

  return node;
}

export function shopProcessing(input: {
  goods: readonly [ShopGoods, ...ShopGoods[]];
  allowSelling?: boolean;
}): ShopProcessingDslCommand {
  const node: ShopProcessingDslCommand = {
    kind: "shopProcessing",
    goods: input.goods,
  };

  if (input.allowSelling !== undefined) {
    node.allowSelling = input.allowSelling;
  }

  return node;
}

export function nameInputProcessing(input: {
  actor: ReferenceValue<"actor">;
  maxCharacters: number;
}): NameInputProcessingDslCommand {
  return {
    kind: "nameInputProcessing",
    actor: input.actor,
    maxCharacters: input.maxCharacters,
  };
}

export function changeHp(input: {
  target: ActorCommandTarget;
  operation: "gain" | "lose";
  value: OperateValueOperand;
  allowDeath?: boolean;
}): ChangeHpDslCommand {
  const node: ChangeHpDslCommand = {
    kind: "changeHp",
    target: input.target,
    operation: input.operation,
    value: input.value,
  };

  if (input.allowDeath !== undefined) {
    node.allowDeath = input.allowDeath;
  }

  return node;
}

export function changeMp(input: {
  target: ActorCommandTarget;
  operation: "gain" | "lose";
  value: OperateValueOperand;
}): ChangeMpDslCommand {
  return {
    kind: "changeMp",
    target: input.target,
    operation: input.operation,
    value: input.value,
  };
}

export function changeState(input: {
  target: ActorCommandTarget;
  operation: "add" | "remove";
  state: ReferenceValue<"state">;
}): ChangeStateDslCommand {
  return {
    kind: "changeState",
    target: input.target,
    operation: input.operation,
    state: input.state,
  };
}

export function recoverAll(input: { target: ActorCommandTarget }): RecoverAllDslCommand {
  return {
    kind: "recoverAll",
    target: input.target,
  };
}

export function changeExp(input: {
  target: ActorCommandTarget;
  operation: "gain" | "lose";
  value: OperateValueOperand;
  showLevelUp?: boolean;
}): ChangeExpDslCommand {
  const node: ChangeExpDslCommand = {
    kind: "changeExp",
    target: input.target,
    operation: input.operation,
    value: input.value,
  };

  if (input.showLevelUp !== undefined) {
    node.showLevelUp = input.showLevelUp;
  }

  return node;
}

export function changeLevel(input: {
  target: ActorCommandTarget;
  operation: "gain" | "lose";
  value: OperateValueOperand;
  showLevelUp?: boolean;
}): ChangeLevelDslCommand {
  const node: ChangeLevelDslCommand = {
    kind: "changeLevel",
    target: input.target,
    operation: input.operation,
    value: input.value,
  };

  if (input.showLevelUp !== undefined) {
    node.showLevelUp = input.showLevelUp;
  }

  return node;
}

export function changeParameter(input: {
  target: ActorCommandTarget;
  parameter: ActorParameter;
  operation: "gain" | "lose";
  value: OperateValueOperand;
}): ChangeParameterDslCommand {
  return {
    kind: "changeParameter",
    target: input.target,
    parameter: input.parameter,
    operation: input.operation,
    value: input.value,
  };
}

export function changeSkill(input: {
  target: ActorCommandTarget;
  operation: "learn" | "forget";
  skill: ReferenceValue<"skill">;
}): ChangeSkillDslCommand {
  return {
    kind: "changeSkill",
    target: input.target,
    operation: input.operation,
    skill: input.skill,
  };
}

export function changeEquipment(input: {
  actor: ReferenceValue<"actor">;
  equipmentTypeId: number;
  itemId: number | null;
}): ChangeEquipmentDslCommand {
  return {
    kind: "changeEquipment",
    actor: input.actor,
    equipmentTypeId: input.equipmentTypeId,
    itemId: input.itemId,
  };
}

export function changeName(input: {
  actor: ReferenceValue<"actor">;
  name: string;
}): ChangeNameDslCommand {
  return {
    kind: "changeName",
    actor: input.actor,
    name: input.name,
  };
}

export function changeClass(input: {
  actor: ReferenceValue<"actor">;
  class: ReferenceValue<"class">;
  keepExp?: boolean;
}): ChangeClassDslCommand {
  const node: ChangeClassDslCommand = {
    kind: "changeClass",
    actor: input.actor,
    class: input.class,
  };

  if (input.keepExp !== undefined) {
    node.keepExp = input.keepExp;
  }

  return node;
}

export function changeActorImages(input: {
  actor: ReferenceValue<"actor">;
  character: { image: ImageAssetReference; index: number };
  face: { image: ImageAssetReference; index: number };
  battler: ImageAssetReference;
}): ChangeActorImagesDslCommand {
  return {
    kind: "changeActorImages",
    actor: input.actor,
    character: input.character,
    face: input.face,
    battler: input.battler,
  };
}

export function changeVehicleImage(input: {
  vehicle: VehicleTarget;
  image: ImageAssetReference;
  index: number;
}): ChangeVehicleImageDslCommand {
  return {
    kind: "changeVehicleImage",
    vehicle: input.vehicle,
    image: input.image,
    index: input.index,
  };
}

export function changeNickname(input: {
  actor: ReferenceValue<"actor">;
  nickname: string;
}): ChangeNicknameDslCommand {
  return {
    kind: "changeNickname",
    actor: input.actor,
    nickname: input.nickname,
  };
}

export function changeProfile(input: {
  actor: ReferenceValue<"actor">;
  profile: string;
}): ChangeProfileDslCommand {
  return {
    kind: "changeProfile",
    actor: input.actor,
    profile: input.profile,
  };
}

export function changeTp(input: {
  target: ActorCommandTarget;
  operation: "gain" | "lose";
  value: OperateValueOperand;
}): ChangeTpDslCommand {
  return {
    kind: "changeTp",
    target: input.target,
    operation: input.operation,
    value: input.value,
  };
}

export function changeEnemyHp(input: {
  target: EnemyCommandTarget;
  operation: "gain" | "lose";
  value: OperateValueOperand;
  allowDeath?: boolean;
}): ChangeEnemyHpDslCommand {
  const node: ChangeEnemyHpDslCommand = {
    kind: "changeEnemyHp",
    target: input.target,
    operation: input.operation,
    value: input.value,
  };

  if (input.allowDeath !== undefined) {
    node.allowDeath = input.allowDeath;
  }

  return node;
}

export function changeEnemyMp(input: {
  target: EnemyCommandTarget;
  operation: "gain" | "lose";
  value: OperateValueOperand;
}): ChangeEnemyMpDslCommand {
  return {
    kind: "changeEnemyMp",
    target: input.target,
    operation: input.operation,
    value: input.value,
  };
}

export function changeEnemyState(input: {
  target: EnemyCommandTarget;
  operation: "add" | "remove";
  state: ReferenceValue<"state">;
}): ChangeEnemyStateDslCommand {
  return {
    kind: "changeEnemyState",
    target: input.target,
    operation: input.operation,
    state: input.state,
  };
}

export function enemyRecoverAll(input: { target: EnemyCommandTarget }): EnemyRecoverAllDslCommand {
  return {
    kind: "enemyRecoverAll",
    target: input.target,
  };
}

export function enemyAppear(input: { target: EnemyCommandTarget }): EnemyAppearDslCommand {
  return {
    kind: "enemyAppear",
    target: input.target,
  };
}

export function enemyTransform(input: {
  target: EnemyCommandTarget;
  enemy: ReferenceValue<"enemy">;
}): EnemyTransformDslCommand {
  return {
    kind: "enemyTransform",
    target: input.target,
    enemy: input.enemy,
  };
}

export function showBattleAnimation(input: {
  target: EnemyCommandTarget;
  animation: ReferenceValue<"animation">;
}): ShowBattleAnimationDslCommand {
  return {
    kind: "showBattleAnimation",
    target: input.target,
    animation: input.animation,
  };
}

export function forceAction(input: {
  subject: BattlerCommandTarget;
  skill: ReferenceValue<"skill">;
  targetIndex: number;
}): ForceActionDslCommand {
  return {
    kind: "forceAction",
    subject: input.subject,
    skill: input.skill,
    targetIndex: input.targetIndex,
  };
}

export function abortBattle(): AbortBattleDslCommand {
  return {
    kind: "abortBattle",
  };
}

export function changeEnemyTp(input: {
  target: EnemyCommandTarget;
  operation: "gain" | "lose";
  value: OperateValueOperand;
}): ChangeEnemyTpDslCommand {
  return {
    kind: "changeEnemyTp",
    target: input.target,
    operation: input.operation,
    value: input.value,
  };
}

export function openMenuScreen(): OpenMenuScreenDslCommand {
  return {
    kind: "openMenuScreen",
  };
}

export function openSaveScreen(): OpenSaveScreenDslCommand {
  return {
    kind: "openSaveScreen",
  };
}

export function gameOver(): GameOverDslCommand {
  return {
    kind: "gameOver",
  };
}

export function returnToTitleScreen(): ReturnToTitleScreenDslCommand {
  return {
    kind: "returnToTitleScreen",
  };
}

export function rawDslCommand(input: {
  code: number;
  indent?: number;
  parameters: readonly unknown[];
}): RawDslCommand {
  const node: RawDslCommand = {
    kind: "rawDslCommand",
    code: input.code,
    parameters: input.parameters,
  };

  if (input.indent !== undefined) {
    node.indent = input.indent;
  }

  return node;
}

export function audioAsset(input: { folder: AudioAssetFolder; name: string }): AudioAssetReference {
  assertIncluded(audioAssetFolders, input.folder, "audio asset folder");
  assertNonEmptyString(input.name, "Audio asset name");

  return {
    kind: "asset",
    category: "audio",
    folder: input.folder,
    name: input.name,
  };
}

export function imageAsset(input: { folder: ImageAssetFolder; name: string }): ImageAssetReference {
  assertIncluded(imageAssetFolders, input.folder, "image asset folder");
  assertNonEmptyString(input.name, "Image asset name");

  return {
    kind: "asset",
    category: "image",
    folder: input.folder,
    name: input.name,
  };
}

export function movieAsset(input: { name: string }): MovieAssetReference {
  assertNonEmptyString(input.name, "Movie asset name");

  return {
    kind: "asset",
    category: "movie",
    folder: "movies",
    name: input.name,
  };
}

export function scriptInput(input: { code: string }): ScriptInput {
  assertNonEmptyString(input.code, "Script input code");

  return {
    kind: "scriptInput",
    code: input.code,
  };
}

export function actorRef(value: { id: number } | { name: string }): ReferenceValue<"actor"> {
  return createReference("actor", value);
}

export function animationRef(
  value: { id: number } | { name: string },
): ReferenceValue<"animation"> {
  return createReference("animation", value);
}

export function armorRef(value: { id: number } | { name: string }): ReferenceValue<"armor"> {
  return createReference("armor", value);
}

export function classRef(value: { id: number } | { name: string }): ReferenceValue<"class"> {
  return createReference("class", value);
}

export function commonEventRef(
  value: { id: number } | { name: string },
): ReferenceValue<"commonEvent"> {
  return createReference("commonEvent", value);
}

export function enemyRef(value: { id: number } | { name: string }): ReferenceValue<"enemy"> {
  return createReference("enemy", value);
}

export function itemRef(value: { id: number } | { name: string }): ReferenceValue<"item"> {
  return createReference("item", value);
}

export function mapRef(value: { id: number } | { name: string }): ReferenceValue<"map"> {
  return createReference("map", value);
}

export function skillRef(value: { id: number } | { name: string }): ReferenceValue<"skill"> {
  return createReference("skill", value);
}

export function stateRef(value: { id: number } | { name: string }): ReferenceValue<"state"> {
  return createReference("state", value);
}

export function switchRef(value: { id: number } | { name: string }): ReferenceValue<"switch"> {
  return createReference("switch", value);
}

export function tilesetRef(value: { id: number } | { name: string }): ReferenceValue<"tileset"> {
  return createReference("tileset", value);
}

export function troopRef(value: { id: number } | { name: string }): ReferenceValue<"troop"> {
  return createReference("troop", value);
}

export function variableRef(value: { id: number } | { name: string }): ReferenceValue<"variable"> {
  return createReference("variable", value);
}

export function weaponRef(value: { id: number } | { name: string }): ReferenceValue<"weapon"> {
  return createReference("weapon", value);
}

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

function createReference<TKind extends ReferenceKind>(
  kind: TKind,
  value: { id: number } | { name: string },
): ReferenceValue<TKind> {
  if ("id" in value) {
    return { id: value.id, kind };
  }

  return { kind, name: value.name };
}

function assignPictureDisplayInput<TNode extends PictureDisplayInput>(
  node: TNode,
  input: PictureDisplayInput,
): void {
  if (input.scaleX !== undefined) {
    node.scaleX = input.scaleX;
  }
  if (input.scaleY !== undefined) {
    node.scaleY = input.scaleY;
  }
  if (input.opacity !== undefined) {
    node.opacity = input.opacity;
  }
  if (input.blendMode !== undefined) {
    node.blendMode = input.blendMode;
  }
}

function isReferenceKind(value: string): value is ReferenceKind {
  return (referenceKinds as readonly string[]).includes(value);
}

function assertIncluded<TValue extends string>(
  allowedValues: readonly TValue[],
  value: TValue,
  fieldName: string,
): void {
  if (!isIncluded(allowedValues, value)) {
    throw new Error(`Invalid ${fieldName}: ${String(value)}.`);
  }
}

function isIncluded<TValue extends string>(
  allowedValues: readonly TValue[],
  value: unknown,
): value is TValue {
  return typeof value === "string" && (allowedValues as readonly string[]).includes(value);
}

function assertNonEmptyString(value: string, fieldName: string): void {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${fieldName} must be a non-empty string.`);
  }
}

function isDslOwnedDeclaration(value: unknown): value is DslOwnedDeclaration {
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
