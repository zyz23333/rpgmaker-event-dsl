import type {
  AssetReference,
  DslOwnedDeclaration,
  PictureDisplayInput,
  ReferenceKind,
  ReferenceValue,
  RuntimeSelector,
  ScriptInput,
} from "./domain/types.js";

export type {
  AbortBattleDslCommand,
  ActorCommandTarget,
  ActorParameter,
  AssetReference,
  AudioAssetFolder,
  AudioAssetReference,
  AudioPayload,
  BalloonIcon,
  BattleProcessingDslCommand,
  BattlerCommandTarget,
  BreakLoopDslCommand,
  ChangeActorImagesDslCommand,
  ChangeArmorsDslCommand,
  ChangeBattleBackDslCommand,
  ChangeBattleBgmDslCommand,
  ChangeClassDslCommand,
  ChangeDefeatMeDslCommand,
  ChangeEncounterDisableDslCommand,
  ChangeEnemyHpDslCommand,
  ChangeEnemyMpDslCommand,
  ChangeEnemyStateDslCommand,
  ChangeEnemyTpDslCommand,
  ChangeEquipmentDslCommand,
  ChangeExpDslCommand,
  ChangeFormationAccessDslCommand,
  ChangeGoldDslCommand,
  ChangeHpDslCommand,
  ChangeItemsDslCommand,
  ChangeLevelDslCommand,
  ChangeMapNameDisplayDslCommand,
  ChangeMenuAccessDslCommand,
  ChangeMpDslCommand,
  ChangeNameDslCommand,
  ChangeNicknameDslCommand,
  ChangeParallaxDslCommand,
  ChangeParameterDslCommand,
  ChangePartyMemberDslCommand,
  ChangePlayerFollowersDslCommand,
  ChangeProfileDslCommand,
  ChangeSaveAccessDslCommand,
  ChangeSkillDslCommand,
  ChangeStateDslCommand,
  ChangeTilesetDslCommand,
  ChangeTpDslCommand,
  ChangeTransparencyDslCommand,
  ChangeVehicleBgmDslCommand,
  ChangeVehicleImageDslCommand,
  ChangeVictoryMeDslCommand,
  ChangeWeaponsDslCommand,
  ChangeWindowColorDslCommand,
  CharacterRuntimeSelector,
  ColorInput,
  CommandOperand,
  CommandPosition,
  CommentDslCommand,
  CommonEventDefinition,
  CommonEventDslCommand,
  CommonEventTrigger,
  ConditionalBranchCondition,
  ConditionalDslCommand,
  ConditionalVariableOperator,
  ConstantOperand,
  ControlSelfSwitchDslCommand,
  ControlSwitchesDslCommand,
  ControlTimerDslCommand,
  ControlVariablesDslCommand,
  ControlVariablesGameDataOperand,
  DirectEventLocationDestination,
  DirectMapDestination,
  DirectPosition,
  Direction,
  DslCommand,
  DslOwnedDeclaration,
  EnemyAppearDslCommand,
  EnemyCommandTarget,
  EnemyRecoverAllDslCommand,
  EnemyTransformDslCommand,
  EraseEventDslCommand,
  ErasePictureDslCommand,
  EventDefinition,
  EventLocationDestination,
  EventPage,
  ExchangeEventLocationDestination,
  ExitEventDslCommand,
  FadeinScreenDslCommand,
  FadeoutBgmDslCommand,
  FadeoutBgsDslCommand,
  FadeoutScreenDslCommand,
  FlashScreenDslCommand,
  ForceActionDslCommand,
  GameOverDslCommand,
  GatherFollowersDslCommand,
  GetLocationInfoDslCommand,
  GetOnOffVehicleDslCommand,
  ImageAssetFolder,
  ImageAssetReference,
  InputNumberDslCommand,
  JumpToLabelDslCommand,
  LabelDslCommand,
  LocationInfoType,
  LoopDslCommand,
  MapDestination,
  MapEventDefinition,
  MapPageTrigger,
  MovePictureDslCommand,
  MoveRouteCommand,
  MovieAssetReference,
  NameInputProcessingDslCommand,
  NumericRange,
  OpenMenuScreenDslCommand,
  OpenSaveScreenDslCommand,
  OperateValueInput,
  OperateValueOperand,
  PageConditions,
  PictureDisplayInput,
  PictureOrigin,
  PicturePosition,
  PlayBgmDslCommand,
  PlayBgsDslCommand,
  PlayMeDslCommand,
  PlayMovieDslCommand,
  PlaySeDslCommand,
  PluginDslCommand,
  RandomOperand,
  RawDslCommand,
  RecoverAllDslCommand,
  ReferenceKind,
  ReferenceRange,
  ReferenceValue,
  ResumeBgmDslCommand,
  ReturnToTitleScreenDslCommand,
  RotatePictureDslCommand,
  RuntimeSelector,
  SaveBgmDslCommand,
  ScriptDslCommand,
  ScriptInput,
  ScriptOperand,
  ScrollMapDslCommand,
  SelectItemDslCommand,
  SetEventLocationDslCommand,
  SetMovementRouteDslCommand,
  SetVehicleLocationDslCommand,
  SetWeatherEffectDslCommand,
  ShakeScreenDslCommand,
  ShopGoods,
  ShopProcessingDslCommand,
  ShowAnimationDslCommand,
  ShowBalloonIconDslCommand,
  ShowBattleAnimationDslCommand,
  ShowChoicesDslCommand,
  ShowPictureDslCommand,
  ShowScrollingTextDslCommand,
  ShowTextDslCommand,
  StopSeDslCommand,
  SwitchDefinition,
  TintPictureDslCommand,
  TintScreenDslCommand,
  ToneInput,
  TransferPlayerDslCommand,
  VariableDefinition,
  VariableEventLocationDestination,
  VariableMapDestination,
  VariableOperand,
  VariablePosition,
  VehicleTarget,
  WaitDslCommand,
  WeatherEffectType,
} from "./domain/types.js";
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

export function createReference<TKind extends ReferenceKind>(
  kind: TKind,
  value: { id: number } | { name: string },
): ReferenceValue<TKind> {
  if ("id" in value) {
    return { id: value.id, kind };
  }

  return { kind, name: value.name };
}

export function assignPictureDisplayInput<TNode extends PictureDisplayInput>(
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

export function isReferenceKind(value: string): value is ReferenceKind {
  return (referenceKinds as readonly string[]).includes(value);
}

export function assertIncluded<TValue extends string>(
  allowedValues: readonly TValue[],
  value: TValue,
  fieldName: string,
): void {
  if (!isIncluded(allowedValues, value)) {
    throw new Error(`Invalid ${fieldName}: ${String(value)}.`);
  }
}

export function isIncluded<TValue extends string>(
  allowedValues: readonly TValue[],
  value: unknown,
): value is TValue {
  return typeof value === "string" && (allowedValues as readonly string[]).includes(value);
}

export function assertNonEmptyString(value: string, fieldName: string): void {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${fieldName} must be a non-empty string.`);
  }
}

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

export {
  mapEvent,
  commonEvent,
  switchDefinition,
  variableDefinition,
  page,
} from "./commands/declarations.js";
export {
  showText,
  inputNumber,
  selectItem,
  showScrollingText,
  showChoices,
} from "./commands/message.js";
export {
  conditional,
  loop,
  breakLoop,
  exitEvent,
  callCommonEvent,
  label,
  jumpToLabel,
  comment,
  script,
  pluginCommand,
} from "./commands/flow.js";
export {
  transferPlayer,
  controlSwitches,
  controlVariables,
  controlSelfSwitch,
  controlTimer,
  changeGold,
  changeItems,
  changeWeapons,
  changeArmors,
  changePartyMember,
} from "./commands/variables.js";
export {
  changeBattleBgm,
  changeVictoryMe,
  changeSaveAccess,
  changeMenuAccess,
  changeEncounterDisable,
  changeFormationAccess,
  changeWindowColor,
  changeDefeatMe,
  changeVehicleBgm,
  setVehicleLocation,
  setEventLocation,
  scrollMap,
  setMovementRoute,
  getOnOffVehicle,
  changeTransparency,
  showAnimation,
  showBalloonIcon,
  changePlayerFollowers,
  gatherFollowers,
} from "./commands/movement.js";
export {
  fadeoutScreen,
  fadeinScreen,
  tintScreen,
  flashScreen,
  shakeScreen,
  wait,
  showPicture,
  movePicture,
  rotatePicture,
  tintPicture,
  erasePicture,
  setWeatherEffect,
} from "./commands/screen.js";
export {
  playBgm,
  fadeoutBgm,
  saveBgm,
  resumeBgm,
  playBgs,
  fadeoutBgs,
  playMe,
  playSe,
  stopSe,
  playMovie,
} from "./commands/audio.js";
export {
  changeMapNameDisplay,
  changeTileset,
  changeBattleBack,
  changeParallax,
  getLocationInfo,
  eraseEvent,
} from "./commands/map.js";
export { battleProcessing, shopProcessing, nameInputProcessing } from "./commands/battle.js";
export {
  changeHp,
  changeMp,
  changeState,
  recoverAll,
  changeExp,
  changeLevel,
  changeParameter,
  changeSkill,
  changeEquipment,
  changeName,
  changeClass,
  changeActorImages,
  changeVehicleImage,
  changeNickname,
  changeProfile,
  changeTp,
} from "./commands/actor.js";
export {
  changeEnemyHp,
  changeEnemyMp,
  changeEnemyState,
  enemyRecoverAll,
  enemyAppear,
  enemyTransform,
  showBattleAnimation,
  forceAction,
  abortBattle,
  changeEnemyTp,
} from "./commands/enemy.js";
export {
  openMenuScreen,
  openSaveScreen,
  gameOver,
  returnToTitleScreen,
} from "./commands/system.js";
export {
  rawDslCommand,
  audioAsset,
  imageAsset,
  movieAsset,
  scriptInput,
  actorRef,
  animationRef,
  armorRef,
  classRef,
  commonEventRef,
  enemyRef,
  itemRef,
  mapRef,
  skillRef,
  stateRef,
  switchRef,
  tilesetRef,
  troopRef,
  variableRef,
  weaponRef,
} from "./commands/references.js";
