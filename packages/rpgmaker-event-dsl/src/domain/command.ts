import type {
  ActorCommandTarget,
  ActorParameter,
  AudioPayload,
  BattlerCommandTarget,
  CharacterRuntimeSelector,
  ColorInput,
  CommandPosition,
  ConditionalBranchCondition,
  ControlVariablesGameDataOperand,
  Direction,
  EnemyCommandTarget,
  EventLocationDestination,
  ImageAssetReference,
  LocationInfoType,
  MapDestination,
  MovieAssetReference,
  OperateValueOperand,
  RandomOperand,
  ReferenceRange,
  ReferenceValue,
  ScriptInput,
  ScriptOperand,
  ToneInput,
  VehicleTarget,
} from "./references.js";

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
