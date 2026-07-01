import { describe, expect, it } from "vitest";

import {
  animationRef,
  abortBattle,
  battleProcessing,
  audioAsset,
  buildStagedDataGraph,
  classRef,
  changeActorImages,
  changeArmors,
  changeBattleBack,
  changeBattleBgm,
  changeClass,
  changeDefeatMe,
  changeEncounterDisable,
  changeEnemyHp,
  changeEnemyMp,
  changeEnemyState,
  changeEnemyTp,
  changeEquipment,
  changeExp,
  changeFormationAccess,
  changeGold,
  changeHp,
  changeItems,
  changeLevel,
  changeMapNameDisplay,
  changeMenuAccess,
  changeMp,
  changeName,
  changeNickname,
  changePartyMember,
  changeParallax,
  changeParameter,
  changePlayerFollowers,
  changeProfile,
  changeSaveAccess,
  changeSkill,
  changeState,
  changeTp,
  changeTransparency,
  changeTileset,
  changeVehicleBgm,
  changeVehicleImage,
  changeVictoryMe,
  changeWindowColor,
  changeWeapons,
  comment,
  commonEvent,
  conditional,
  controlTimer,
  controlSwitches,
  controlVariables,
  enemyAppear,
  enemyRecoverAll,
  enemyRef,
  enemyTransform,
  erasePicture,
  eraseEvent,
  fadeinScreen,
  fadeoutBgm,
  fadeoutBgs,
  fadeoutScreen,
  flashScreen,
  gatherFollowers,
  getOnOffVehicle,
  getLocationInfo,
  forceAction,
  gameOver,
  imageAsset,
  inputNumber,
  itemRef,
  movieAsset,
  movePicture,
  nameInputProcessing,
  openMenuScreen,
  openSaveScreen,
  page,
  pluginCommand,
  recoverAll,
  rotatePicture,
  resumeBgm,
  returnToTitleScreen,
  saveBgm,
  script,
  scriptInput,
  selectItem,
  scrollMap,
  setEventLocation,
  setMovementRoute,
  setVehicleLocation,
  setWeatherEffect,
  playBgm,
  playBgs,
  playMe,
  playMovie,
  playSe,
  stopSe,
  showBattleAnimation,
  showAnimation,
  showBalloonIcon,
  showChoices,
  showPicture,
  showScrollingText,
  showText,
  shakeScreen,
  skillRef,
  shopProcessing,
  stateRef,
  switchDefinition,
  switchRef,
  tilesetRef,
  transferPlayer,
  troopRef,
  variableDefinition,
  variableRef,
  wait,
  tintPicture,
  tintScreen,
} from "../src/index.js";
import { compileMapEvent } from "../src/events.js";

const resolver = buildStagedDataGraph({
  declarations: [
    commonEvent({ id: 1, name: "Common", trigger: "none", commands: [] }),
    switchDefinition({ id: 1, name: "Gate" }),
    switchDefinition({ id: 2, name: "Gate B" }),
    variableDefinition({ id: 1, name: "Count" }),
    variableDefinition({ id: 2, name: "Count B" }),
    variableDefinition({ id: 3, name: "Map Var" }),
    variableDefinition({ id: 4, name: "X Var" }),
    variableDefinition({ id: 5, name: "Y Var" }),
  ],
  snapshotReferences: {
    actors: [{ id: 1, name: "Hero" }],
    animations: [{ id: 1, name: "Sparkle" }],
    armors: [{ id: 1, name: "Shield" }],
    classes: [{ id: 1, name: "Warrior" }],
    enemies: [{ id: 1, name: "Bat" }],
    items: [{ id: 1, name: "Potion" }],
    maps: [{ id: 1, name: "Town" }],
    skills: [{ id: 1, name: "Heal" }],
    states: [{ id: 1, name: "Poison" }],
    troops: [{ id: 1, name: "Slime" }],
    tilesets: [{ id: 1, name: "Field" }],
    weapons: [{ id: 1, name: "Sword" }],
  },
}).resolver;

describe("compileMapEvent", () => {
  it("compiles core MV command helpers into raw commands", () => {
    const event = compileMapEvent(
      {
        kind: "mapEvent",
        mapId: 1,
        id: 1,
        name: "Gate",
        x: 1,
        y: 2,
        pages: [
          page({
            commands: [
              comment(["note"]),
              showText({
                lines: ["Hello"],
                face: { image: imageAsset({ folder: "faces", name: "Actor1" }), index: 2 },
                background: 1,
                positionType: 0,
              }),
              showChoices({
                choices: ["Yes", "No"],
                branches: [[wait(10)], [eraseEvent()]],
                cancelType: 1,
                cancelBranch: [showText({ lines: ["Canceled"] })],
              }),
              inputNumber({ variable: variableRef({ name: "Count" }), digits: 3 }),
              selectItem({ variable: variableRef({ name: "Count" }), itemType: 1 }),
              showScrollingText({ lines: ["Scroll", "More"], speed: 5, noFastForward: true }),
              controlVariables({
                variable: variableRef({ name: "Count" }),
                operation: "add",
                value: 3,
              }),
              controlSwitches({ switch: switchRef({ name: "Gate" }), value: true }),
              changeGold({ operation: "gain", value: 5 }),
              controlSwitches({
                switch: {
                  kind: "referenceRange",
                  from: switchRef({ name: "Gate" }),
                  to: switchRef({ name: "Gate B" }),
                },
                value: false,
              }),
              controlVariables({
                variable: {
                  kind: "referenceRange",
                  from: variableRef({ name: "Count" }),
                  to: variableRef({ name: "Count B" }),
                },
                operation: "set",
                value: {
                  kind: "gameData",
                  source: "item",
                  item: itemRef({ name: "Potion" }),
                },
              }),
              controlVariables({
                variable: variableRef({ name: "Count" }),
                operation: "set",
                value: {
                  kind: "script",
                  script: scriptInput({ code: "$gameParty.gold()" }),
                },
              }),
              controlTimer({ action: "start", seconds: 45 }),
              controlTimer({ action: "stop" }),
              changeGold({ operation: "lose", value: variableRef({ name: "Count" }) }),
              changeItems({ item: itemRef({ name: "Potion" }), operation: "lose", amount: 1 }),
              changeWeapons({
                weapon: { kind: "weapon", id: 1 },
                operation: "gain",
                amount: variableRef({ name: "Count" }),
                includeEquipment: true,
              }),
              changeArmors({
                armor: { kind: "armor", id: 1 },
                operation: "lose",
                amount: 2,
                includeEquipment: false,
              }),
              changePartyMember({
                actor: { kind: "actor", id: 1 },
                operation: "add",
                initialize: true,
              }),
              transferPlayer({
                destination: {
                  kind: "variables",
                  map: variableRef({ name: "Map Var" }),
                  x: variableRef({ name: "X Var" }),
                  y: variableRef({ name: "Y Var" }),
                },
                direction: 4,
                fadeType: 1,
              }),
              setVehicleLocation({
                vehicle: "airship",
                destination: { kind: "direct", map: { kind: "map", id: 1 }, x: 10, y: 12 },
              }),
              setVehicleLocation({
                vehicle: "boat",
                destination: {
                  kind: "variables",
                  map: variableRef({ name: "Map Var" }),
                  x: variableRef({ name: "X Var" }),
                  y: variableRef({ name: "Y Var" }),
                },
              }),
              setEventLocation({
                character: { kind: "runtimeSelector", scope: "character", target: "currentEvent" },
                destination: { kind: "direct", x: 6, y: 7 },
                direction: 8,
              }),
              setEventLocation({
                character: { kind: "runtimeSelector", scope: "character", target: "event", id: 3 },
                destination: {
                  kind: "variables",
                  x: variableRef({ name: "X Var" }),
                  y: variableRef({ name: "Y Var" }),
                },
              }),
              setEventLocation({
                character: { kind: "runtimeSelector", scope: "character", target: "player" },
                destination: {
                  kind: "exchange",
                  character: {
                    kind: "runtimeSelector",
                    scope: "character",
                    target: "currentEvent",
                  },
                },
              }),
              scrollMap({ direction: 6, distance: 9, speed: 5 }),
              setMovementRoute({
                target: { kind: "runtimeSelector", scope: "character", target: "event", id: 4 },
                route: [
                  { kind: "moveDown" },
                  { kind: "moveLeft" },
                  { kind: "moveRight" },
                  { kind: "moveUp" },
                  { kind: "moveLowerLeft" },
                  { kind: "moveLowerRight" },
                  { kind: "moveUpperLeft" },
                  { kind: "moveUpperRight" },
                  { kind: "moveRandom" },
                  { kind: "moveTowardPlayer" },
                  { kind: "moveAwayFromPlayer" },
                  { kind: "moveForward" },
                  { kind: "moveBackward" },
                  { kind: "jump", x: 2, y: -1 },
                  { kind: "routeWait", frames: 15 },
                  { kind: "turnDown" },
                  { kind: "turnLeft" },
                  { kind: "turnRight" },
                  { kind: "turnUp" },
                  { kind: "turn90Right" },
                  { kind: "turn90Left" },
                  { kind: "turn180" },
                  { kind: "turn90RightOrLeft" },
                  { kind: "turnRandom" },
                  { kind: "turnTowardPlayer" },
                  { kind: "turnAwayFromPlayer" },
                  { kind: "switchOn", switch: switchRef({ name: "Gate" }) },
                  { kind: "switchOff", switch: switchRef({ name: "Gate B" }) },
                  { kind: "changeSpeed", speed: 5 },
                  { kind: "changeFrequency", frequency: 4 },
                  { kind: "walkAnimation", enabled: true },
                  { kind: "walkAnimation", enabled: false },
                  { kind: "stepAnimation", enabled: true },
                  { kind: "stepAnimation", enabled: false },
                  { kind: "directionFix", enabled: true },
                  { kind: "directionFix", enabled: false },
                  { kind: "through", enabled: true },
                  { kind: "through", enabled: false },
                  { kind: "transparent", enabled: true },
                  { kind: "transparent", enabled: false },
                  {
                    kind: "changeImage",
                    image: imageAsset({ folder: "characters", name: "Actor1" }),
                    index: 3,
                  },
                  { kind: "changeOpacity", opacity: 128 },
                  { kind: "changeBlendMode", blendMode: 1 },
                  {
                    kind: "playSe",
                    audio: { asset: audioAsset({ folder: "se", name: "Cursor1" }), volume: 80 },
                  },
                  { kind: "script", script: scriptInput({ code: "this.moveForward();" }) },
                ],
                repeat: false,
                skippable: true,
                wait: true,
              }),
              getOnOffVehicle(),
              battleProcessing({ troop: troopRef({ name: "Slime" }), canEscape: true }),
            ],
          }),
        ],
      },
      {
        nextId: 2,
        resolver,
      },
    );

    const commands = event.pages?.[0]?.list ?? [];

    expect(commands[0]).toEqual({ code: 108, indent: 0, parameters: ["note"] });
    expect(commands[1]).toEqual({ code: 101, indent: 0, parameters: ["Actor1", 2, 1, 0] });
    expect(commands[2]).toEqual({ code: 401, indent: 0, parameters: ["Hello"] });
    expect(commands[3]).toEqual({ code: 102, indent: 0, parameters: [["Yes", "No"], 1, 0, 2, 0] });
    expect(commands[4]).toEqual({ code: 402, indent: 0, parameters: [0] });
    expect(commands[5]).toEqual({ code: 230, indent: 1, parameters: [10] });
    expect(commands[6]).toEqual({ code: 402, indent: 0, parameters: [1] });
    expect(commands[7]).toEqual({ code: 214, indent: 1, parameters: [] });
    expect(commands[8]).toEqual({ code: 403, indent: 0, parameters: [] });
    expect(commands[9]).toEqual({ code: 101, indent: 1, parameters: ["", 0, 0, 2] });
    expect(commands[10]).toEqual({ code: 401, indent: 1, parameters: ["Canceled"] });
    expect(commands[11]).toEqual({ code: 103, indent: 0, parameters: [1, 3] });
    expect(commands[12]).toEqual({ code: 104, indent: 0, parameters: [1, 1] });
    expect(commands[13]).toEqual({ code: 105, indent: 0, parameters: [5, true] });
    expect(commands[14]).toEqual({ code: 405, indent: 0, parameters: ["Scroll"] });
    expect(commands[15]).toEqual({ code: 405, indent: 0, parameters: ["More"] });
    expect(commands[16]).toEqual({ code: 122, indent: 0, parameters: [1, 1, 1, 0, 3] });
    expect(commands[17]).toEqual({ code: 121, indent: 0, parameters: [1, 1, 0] });
    expect(commands[18]).toEqual({ code: 125, indent: 0, parameters: [0, 0, 5] });
    expect(commands[19]).toEqual({ code: 121, indent: 0, parameters: [1, 2, 1] });
    expect(commands[20]).toEqual({ code: 122, indent: 0, parameters: [1, 2, 0, 3, 0, 1, 0] });
    expect(commands[21]).toEqual({
      code: 122,
      indent: 0,
      parameters: [1, 1, 0, 4, "$gameParty.gold()"],
    });
    expect(commands[22]).toEqual({ code: 124, indent: 0, parameters: [0, 45] });
    expect(commands[23]).toEqual({ code: 124, indent: 0, parameters: [1, 0] });
    expect(commands[24]).toEqual({ code: 125, indent: 0, parameters: [1, 1, 1] });
    expect(commands[25]).toEqual({ code: 126, indent: 0, parameters: [1, 1, 0, 1] });
    expect(commands[26]).toEqual({ code: 127, indent: 0, parameters: [1, 0, 1, 1, true] });
    expect(commands[27]).toEqual({ code: 128, indent: 0, parameters: [1, 1, 0, 2, false] });
    expect(commands[28]).toEqual({ code: 129, indent: 0, parameters: [1, 0, true] });
    expect(commands[29]).toEqual({ code: 201, indent: 0, parameters: [1, 3, 4, 5, 4, 1] });
    expect(commands[30]).toEqual({ code: 202, indent: 0, parameters: [2, 0, 1, 10, 12] });
    expect(commands[31]).toEqual({ code: 202, indent: 0, parameters: [0, 1, 3, 4, 5] });
    expect(commands[32]).toEqual({ code: 203, indent: 0, parameters: [0, 0, 6, 7, 8] });
    expect(commands[33]).toEqual({ code: 203, indent: 0, parameters: [3, 1, 4, 5, 0] });
    expect(commands[34]).toEqual({ code: 203, indent: 0, parameters: [-1, 2, 0, 0, 0] });
    expect(commands[35]).toEqual({ code: 204, indent: 0, parameters: [6, 9, 5] });
    expect(commands[36]).toEqual({
      code: 205,
      indent: 0,
      parameters: [
        4,
        {
          list: [
            { code: 1, parameters: [] },
            { code: 2, parameters: [] },
            { code: 3, parameters: [] },
            { code: 4, parameters: [] },
            { code: 5, parameters: [] },
            { code: 6, parameters: [] },
            { code: 7, parameters: [] },
            { code: 8, parameters: [] },
            { code: 9, parameters: [] },
            { code: 10, parameters: [] },
            { code: 11, parameters: [] },
            { code: 12, parameters: [] },
            { code: 13, parameters: [] },
            { code: 14, parameters: [2, -1] },
            { code: 15, parameters: [15] },
            { code: 16, parameters: [] },
            { code: 17, parameters: [] },
            { code: 18, parameters: [] },
            { code: 19, parameters: [] },
            { code: 20, parameters: [] },
            { code: 21, parameters: [] },
            { code: 22, parameters: [] },
            { code: 23, parameters: [] },
            { code: 24, parameters: [] },
            { code: 25, parameters: [] },
            { code: 26, parameters: [] },
            { code: 27, parameters: [1] },
            { code: 28, parameters: [2] },
            { code: 29, parameters: [5] },
            { code: 30, parameters: [4] },
            { code: 31, parameters: [] },
            { code: 32, parameters: [] },
            { code: 33, parameters: [] },
            { code: 34, parameters: [] },
            { code: 35, parameters: [] },
            { code: 36, parameters: [] },
            { code: 37, parameters: [] },
            { code: 38, parameters: [] },
            { code: 39, parameters: [] },
            { code: 40, parameters: [] },
            { code: 41, parameters: ["Actor1", 3] },
            { code: 42, parameters: [128] },
            { code: 43, parameters: [1] },
            { code: 44, parameters: [{ name: "Cursor1", volume: 80, pitch: 100, pan: 0 }] },
            { code: 45, parameters: ["this.moveForward();"] },
            { code: 0, parameters: [] },
          ],
          repeat: false,
          skippable: true,
          wait: true,
        },
      ],
    });
    expect(commands[37]).toEqual({ code: 206, indent: 0, parameters: [] });
    expect(commands[38]).toEqual({ code: 301, indent: 0, parameters: [0, 1, true, false] });
    expect(commands[39]).toEqual({ code: 0, indent: 0, parameters: [] });
  });

  it("compiles direct Transfer Player destinations with resolved map references", () => {
    const event = compileMapEvent(
      {
        kind: "mapEvent",
        mapId: 1,
        id: 1,
        name: "Transfer",
        x: 1,
        y: 2,
        pages: [
          page({
            commands: [
              transferPlayer({
                destination: { kind: "direct", map: { kind: "map", name: "Town" }, x: 4, y: 5 },
              }),
            ],
          }),
        ],
      },
      { nextId: 2, resolver },
    );

    expect(event.pages?.[0]?.list?.[0]).toEqual({
      code: 201,
      indent: 0,
      parameters: [0, 1, 4, 5, 2, 0],
    });
  });

  it("compiles MV Character and Screen command helpers into raw parameters", () => {
    const event = compileMapEvent(
      {
        kind: "mapEvent",
        mapId: 1,
        id: 1,
        name: "Presentation",
        x: 1,
        y: 2,
        pages: [
          page({
            commands: [
              changeTransparency({ transparent: true }),
              showAnimation({
                target: { kind: "runtimeSelector", scope: "character", target: "event", id: 3 },
                animation: animationRef({ name: "Sparkle" }),
                wait: true,
              }),
              showBalloonIcon({
                target: { kind: "runtimeSelector", scope: "character", target: "player" },
                balloon: "question",
              }),
              eraseEvent(),
              changePlayerFollowers({ visible: false }),
              gatherFollowers(),
              fadeoutScreen(),
              fadeinScreen(),
              tintScreen({ tone: [68, -34, -34, 0], duration: 60, wait: true }),
              flashScreen({
                color: { red: 255, green: 255, blue: 255, alpha: 160 },
                duration: 30,
              }),
              shakeScreen({ power: 5, speed: 7, duration: 40, wait: true }),
              wait(12),
              showPicture({
                pictureId: 1,
                image: imageAsset({ folder: "pictures", name: "Poster" }),
                position: { kind: "direct", x: 10, y: 20, origin: "center" },
                scaleX: 120,
                scaleY: 80,
                opacity: 200,
                blendMode: 1,
              }),
              movePicture({
                pictureId: 1,
                position: {
                  kind: "variables",
                  x: variableRef({ name: "X Var" }),
                  y: variableRef({ name: "Y Var" }),
                },
                scaleX: 100,
                scaleY: 100,
                opacity: 255,
                blendMode: 0,
                duration: 45,
                wait: true,
              }),
              rotatePicture({ pictureId: 1, speed: -5 }),
              tintPicture({ pictureId: 1, tone: [0, 0, 0, 255], duration: 30 }),
              erasePicture({ pictureId: 1 }),
              setWeatherEffect({ weather: "rain", power: 6, duration: 50, wait: true }),
            ],
          }),
        ],
      },
      { nextId: 2, resolver },
    );

    expect(event.pages?.[0]?.list).toEqual([
      { code: 211, indent: 0, parameters: [0] },
      { code: 212, indent: 0, parameters: [3, 1, true] },
      { code: 213, indent: 0, parameters: [-1, 2, false] },
      { code: 214, indent: 0, parameters: [] },
      { code: 216, indent: 0, parameters: [1] },
      { code: 217, indent: 0, parameters: [] },
      { code: 221, indent: 0, parameters: [] },
      { code: 222, indent: 0, parameters: [] },
      { code: 223, indent: 0, parameters: [[68, -34, -34, 0], 60, true] },
      { code: 224, indent: 0, parameters: [[255, 255, 255, 160], 30, false] },
      { code: 225, indent: 0, parameters: [5, 7, 40, true] },
      { code: 230, indent: 0, parameters: [12] },
      { code: 231, indent: 0, parameters: [1, "Poster", 1, 0, 10, 20, 120, 80, 200, 1] },
      { code: 232, indent: 0, parameters: [1, 0, 0, 1, 4, 5, 100, 100, 255, 0, 45, true] },
      { code: 233, indent: 0, parameters: [1, -5] },
      { code: 234, indent: 0, parameters: [1, [0, 0, 0, 255], 30, false] },
      { code: 235, indent: 0, parameters: [1] },
      { code: 236, indent: 0, parameters: ["rain", 6, 50, true] },
      { code: 0, indent: 0, parameters: [] },
    ]);
  });

  it("compiles MV Audio, Video, System, and Map command helpers into raw parameters", () => {
    const event = compileMapEvent(
      {
        kind: "mapEvent",
        mapId: 1,
        id: 1,
        name: "System Map",
        x: 1,
        y: 2,
        pages: [
          page({
            commands: [
              changeBattleBgm({
                audio: { asset: audioAsset({ folder: "bgm", name: "Battle1" }), volume: 80 },
              }),
              changeVictoryMe({
                audio: { asset: audioAsset({ folder: "me", name: "Victory1" }), pitch: 105 },
              }),
              changeSaveAccess({ enabled: false }),
              changeMenuAccess({ enabled: true }),
              changeEncounterDisable({ disabled: true }),
              changeFormationAccess({ enabled: false }),
              changeWindowColor({ tone: [12, -24, 36, 0] }),
              changeDefeatMe({
                audio: { asset: audioAsset({ folder: "me", name: "Defeat1" }), pan: -10 },
              }),
              changeVehicleBgm({
                vehicle: "ship",
                audio: { asset: audioAsset({ folder: "bgm", name: "Ship1" }) },
              }),
              playBgm({
                audio: { asset: audioAsset({ folder: "bgm", name: "Theme1" }), volume: 70 },
              }),
              fadeoutBgm({ duration: 45 }),
              saveBgm(),
              resumeBgm(),
              playBgs({
                audio: { asset: audioAsset({ folder: "bgs", name: "Rain" }), pitch: 90 },
              }),
              fadeoutBgs({ duration: 30 }),
              playMe({ audio: { asset: audioAsset({ folder: "me", name: "Fanfare" }) } }),
              playSe({ audio: { asset: audioAsset({ folder: "se", name: "Cursor" }) } }),
              stopSe(),
              playMovie({ movie: movieAsset({ name: "Intro" }) }),
              changeMapNameDisplay({ enabled: false }),
              changeTileset({ tileset: tilesetRef({ name: "Field" }) }),
              changeBattleBack({
                battleback1: imageAsset({ folder: "battlebacks1", name: "Grassland" }),
                battleback2: imageAsset({ folder: "battlebacks2", name: "Forest" }),
              }),
              changeParallax({
                image: imageAsset({ folder: "parallaxes", name: "Clouds" }),
                loopX: true,
                loopY: false,
                sx: 2,
                sy: 0,
              }),
              getLocationInfo({
                variable: variableRef({ name: "Count" }),
                info: "regionId",
                location: { kind: "direct", x: 4, y: 5 },
              }),
              getLocationInfo({
                variable: variableRef({ name: "Count B" }),
                info: "tileIdLayer2",
                location: {
                  kind: "variables",
                  x: variableRef({ name: "X Var" }),
                  y: variableRef({ name: "Y Var" }),
                },
              }),
            ],
          }),
        ],
      },
      { nextId: 2, resolver },
    );

    expect(event.pages?.[0]?.list).toEqual([
      { code: 132, indent: 0, parameters: [{ name: "Battle1", volume: 80, pitch: 100, pan: 0 }] },
      {
        code: 133,
        indent: 0,
        parameters: [{ name: "Victory1", volume: 90, pitch: 105, pan: 0 }],
      },
      { code: 134, indent: 0, parameters: [0] },
      { code: 135, indent: 0, parameters: [1] },
      { code: 136, indent: 0, parameters: [0] },
      { code: 137, indent: 0, parameters: [0] },
      { code: 138, indent: 0, parameters: [[12, -24, 36, 0]] },
      { code: 139, indent: 0, parameters: [{ name: "Defeat1", volume: 90, pitch: 100, pan: -10 }] },
      { code: 140, indent: 0, parameters: [1, { name: "Ship1", volume: 90, pitch: 100, pan: 0 }] },
      { code: 241, indent: 0, parameters: [{ name: "Theme1", volume: 70, pitch: 100, pan: 0 }] },
      { code: 242, indent: 0, parameters: [45] },
      { code: 243, indent: 0, parameters: [] },
      { code: 244, indent: 0, parameters: [] },
      { code: 245, indent: 0, parameters: [{ name: "Rain", volume: 90, pitch: 90, pan: 0 }] },
      { code: 246, indent: 0, parameters: [30] },
      { code: 249, indent: 0, parameters: [{ name: "Fanfare", volume: 90, pitch: 100, pan: 0 }] },
      { code: 250, indent: 0, parameters: [{ name: "Cursor", volume: 90, pitch: 100, pan: 0 }] },
      { code: 251, indent: 0, parameters: [] },
      { code: 261, indent: 0, parameters: ["Intro"] },
      { code: 281, indent: 0, parameters: [1] },
      { code: 282, indent: 0, parameters: [1] },
      { code: 283, indent: 0, parameters: ["Grassland", "Forest"] },
      { code: 284, indent: 0, parameters: ["Clouds", true, false, 2, 0] },
      { code: 285, indent: 0, parameters: [1, 6, 0, 4, 5] },
      { code: 285, indent: 0, parameters: [2, 3, 1, 4, 5] },
      { code: 0, indent: 0, parameters: [] },
    ]);
  });

  it("compiles MV Conditional Branch condition categories into raw parameters", () => {
    const event = compileMapEvent(
      {
        kind: "mapEvent",
        mapId: 1,
        id: 1,
        name: "Conditions",
        x: 1,
        y: 2,
        pages: [
          page({
            commands: [
              conditional({
                condition: { kind: "switch", switch: switchRef({ name: "Gate" }), value: true },
                then: [wait(1)],
                else: [wait(2)],
              }),
              conditional({
                condition: {
                  kind: "variable",
                  variable: variableRef({ name: "Count" }),
                  operator: "ne",
                  value: variableRef({ name: "Count" }),
                },
                then: [],
              }),
              conditional({
                condition: { kind: "selfSwitch", selfSwitch: "B", value: false },
                then: [],
              }),
              conditional({
                condition: { kind: "timer", seconds: 30, operator: "le" },
                then: [],
              }),
              conditional({
                condition: {
                  kind: "actor",
                  actor: { kind: "actor", id: 1 },
                  check: { kind: "class", class: classRef({ name: "Warrior" }) },
                },
                then: [],
              }),
              conditional({
                condition: {
                  kind: "enemy",
                  enemyIndex: 0,
                  check: { kind: "state", state: stateRef({ name: "Poison" }) },
                },
                then: [],
              }),
              conditional({
                condition: { kind: "character", characterId: -1, direction: 2 },
                then: [],
              }),
              conditional({
                condition: { kind: "gold", amount: 100, operator: "lt" },
                then: [],
              }),
              conditional({
                condition: { kind: "item", item: itemRef({ name: "Potion" }) },
                then: [],
              }),
              conditional({
                condition: {
                  kind: "weapon",
                  weapon: { kind: "weapon", id: 1 },
                  includeEquipment: true,
                },
                then: [],
              }),
              conditional({
                condition: {
                  kind: "armor",
                  armor: { kind: "armor", id: 1 },
                  includeEquipment: false,
                },
                then: [],
              }),
              conditional({
                condition: { kind: "button", button: "ok" },
                then: [],
              }),
              conditional({
                condition: {
                  kind: "script",
                  script: scriptInput({ code: "$gameParty.size() > 1" }),
                },
                then: [],
              }),
              conditional({
                condition: { kind: "vehicle", vehicle: "airship" },
                then: [],
              }),
              conditional({
                condition: {
                  kind: "actor",
                  actor: { kind: "actor", id: 1 },
                  check: { kind: "skill", skill: skillRef({ name: "Heal" }) },
                },
                then: [],
              }),
            ],
          }),
        ],
      },
      { nextId: 2, resolver },
    );

    const conditionalCommands = event.pages?.[0]?.list?.filter((command) => command.code === 111);

    expect(conditionalCommands?.map((command) => command.parameters)).toEqual([
      [0, 1, 0],
      [1, 1, 1, 1, 5],
      [2, "B", 1],
      [3, 30, 1],
      [4, 1, 2, 1],
      [5, 0, 1, 1],
      [6, -1, 2],
      [7, 100, 2],
      [8, 1],
      [9, 1, true],
      [10, 1, false],
      [11, "ok"],
      [12, "$gameParty.size() > 1"],
      [13, 2],
      [4, 1, 3, 1],
    ]);
    expect(event.pages?.[0]?.list).toEqual(
      expect.arrayContaining([
        { code: 111, indent: 0, parameters: [0, 1, 0] },
        { code: 230, indent: 1, parameters: [1] },
        { code: 411, indent: 0, parameters: [] },
        { code: 230, indent: 1, parameters: [2] },
      ]),
    );
  });

  it("compiles MV Scene Control, Actor, Enemy, and Advanced command helpers", () => {
    const partyTarget = {
      kind: "runtimeSelector",
      scope: "actor",
      target: "entireParty",
    } as const;
    const actorTarget = {
      kind: "runtimeSelector",
      scope: "actor",
      target: "actor",
      actorId: 1,
    } as const;
    const actorVariableTarget = {
      kind: "runtimeSelector",
      scope: "actor",
      target: "actorFromVariable",
      variable: variableRef({ name: "Count" }),
    } as const;
    const enemyTarget = {
      kind: "runtimeSelector",
      scope: "enemy",
      target: "enemy",
      index: 0,
    } as const;
    const allEnemiesTarget = {
      kind: "runtimeSelector",
      scope: "enemy",
      target: "all",
    } as const;

    const event = compileMapEvent(
      {
        kind: "mapEvent",
        mapId: 1,
        id: 1,
        name: "Advanced",
        x: 1,
        y: 2,
        pages: [
          page({
            commands: [
              battleProcessing({
                troop: { kind: "troop", variable: variableRef({ name: "Count" }) },
                canEscape: true,
                canLose: true,
                win: [wait(1)],
                escape: [wait(2)],
                lose: [wait(3)],
              }),
              shopProcessing({
                goods: [
                  { kind: "item", item: itemRef({ name: "Potion" }) },
                  { kind: "weapon", item: { kind: "weapon", id: 1 }, price: 250 },
                  { kind: "armor", item: { kind: "armor", id: 1 } },
                ],
                allowSelling: true,
              }),
              nameInputProcessing({ actor: { kind: "actor", id: 1 }, maxCharacters: 8 }),
              changeHp({
                target: partyTarget,
                operation: "lose",
                value: 10,
                allowDeath: true,
              }),
              changeMp({
                target: actorTarget,
                operation: "gain",
                value: variableRef({ name: "Count" }),
              }),
              changeState({
                target: actorVariableTarget,
                operation: "add",
                state: stateRef({ name: "Poison" }),
              }),
              recoverAll({ target: partyTarget }),
              changeExp({ target: actorTarget, operation: "gain", value: 50, showLevelUp: true }),
              changeLevel({ target: actorTarget, operation: "lose", value: 1 }),
              changeParameter({
                target: actorTarget,
                parameter: "atk",
                operation: "gain",
                value: 2,
              }),
              changeSkill({
                target: actorTarget,
                operation: "learn",
                skill: skillRef({ name: "Heal" }),
              }),
              changeEquipment({
                actor: { kind: "actor", id: 1 },
                equipmentTypeId: 1,
                itemId: 1,
              }),
              changeName({ actor: { kind: "actor", id: 1 }, name: "Alex" }),
              changeClass({
                actor: { kind: "actor", id: 1 },
                class: classRef({ name: "Warrior" }),
                keepExp: true,
              }),
              changeActorImages({
                actor: { kind: "actor", id: 1 },
                character: {
                  image: imageAsset({ folder: "characters", name: "Actor1" }),
                  index: 0,
                },
                face: { image: imageAsset({ folder: "faces", name: "Actor1" }), index: 1 },
                battler: imageAsset({ folder: "sv_actors", name: "Actor1_1" }),
              }),
              changeVehicleImage({
                vehicle: "boat",
                image: imageAsset({ folder: "characters", name: "Vehicle" }),
                index: 2,
              }),
              changeNickname({ actor: { kind: "actor", id: 1 }, nickname: "Ace" }),
              changeProfile({ actor: { kind: "actor", id: 1 }, profile: "Profile" }),
              changeTp({ target: actorTarget, operation: "gain", value: 5 }),
              changeEnemyHp({
                target: allEnemiesTarget,
                operation: "lose",
                value: 10,
                allowDeath: true,
              }),
              changeEnemyMp({
                target: enemyTarget,
                operation: "gain",
                value: variableRef({ name: "Count" }),
              }),
              changeEnemyState({
                target: enemyTarget,
                operation: "remove",
                state: stateRef({ name: "Poison" }),
              }),
              enemyRecoverAll({ target: enemyTarget }),
              enemyAppear({ target: enemyTarget }),
              enemyTransform({ target: enemyTarget, enemy: enemyRef({ name: "Bat" }) }),
              showBattleAnimation({
                target: allEnemiesTarget,
                animation: animationRef({ name: "Sparkle" }),
              }),
              forceAction({
                subject: { kind: "runtimeSelector", scope: "battler", target: "actor", actorId: 1 },
                skill: skillRef({ name: "Heal" }),
                targetIndex: -2,
              }),
              abortBattle(),
              changeEnemyTp({ target: enemyTarget, operation: "gain", value: 4 }),
              openMenuScreen(),
              openSaveScreen(),
              gameOver(),
              returnToTitleScreen(),
              script({ code: "const x = 1;\nconsole.log(x);" }),
              pluginCommand({ command: "MyPlugin", args: ["arg1", "arg2"] }),
            ],
          }),
        ],
      },
      { nextId: 2, resolver },
    );

    expect(event.pages?.[0]?.list).toEqual([
      { code: 301, indent: 0, parameters: [1, 1, true, true] },
      { code: 601, indent: 0, parameters: [] },
      { code: 230, indent: 1, parameters: [1] },
      { code: 602, indent: 0, parameters: [] },
      { code: 230, indent: 1, parameters: [2] },
      { code: 603, indent: 0, parameters: [] },
      { code: 230, indent: 1, parameters: [3] },
      { code: 302, indent: 0, parameters: [0, 1, 0, 0, true] },
      { code: 605, indent: 0, parameters: [1, 1, 1, 250] },
      { code: 605, indent: 0, parameters: [2, 1, 0, 0] },
      { code: 303, indent: 0, parameters: [1, 8] },
      { code: 311, indent: 0, parameters: [0, 0, 1, 0, 10, true] },
      { code: 312, indent: 0, parameters: [0, 1, 0, 1, 1] },
      { code: 313, indent: 0, parameters: [1, 1, 0, 1] },
      { code: 314, indent: 0, parameters: [0, 0] },
      { code: 315, indent: 0, parameters: [0, 1, 0, 0, 50, true] },
      { code: 316, indent: 0, parameters: [0, 1, 1, 0, 1, false] },
      { code: 317, indent: 0, parameters: [0, 1, 2, 0, 0, 2] },
      { code: 318, indent: 0, parameters: [0, 1, 0, 1] },
      { code: 319, indent: 0, parameters: [1, 1, 1] },
      { code: 320, indent: 0, parameters: [1, "Alex"] },
      { code: 321, indent: 0, parameters: [1, 1, true] },
      { code: 322, indent: 0, parameters: [1, "Actor1", 0, "Actor1", 1, "Actor1_1"] },
      { code: 323, indent: 0, parameters: [0, "Vehicle", 2] },
      { code: 324, indent: 0, parameters: [1, "Ace"] },
      { code: 325, indent: 0, parameters: [1, "Profile"] },
      { code: 326, indent: 0, parameters: [0, 1, 0, 0, 5] },
      { code: 331, indent: 0, parameters: [-1, 1, 0, 10, true] },
      { code: 332, indent: 0, parameters: [0, 0, 1, 1] },
      { code: 333, indent: 0, parameters: [0, 1, 1] },
      { code: 334, indent: 0, parameters: [0] },
      { code: 335, indent: 0, parameters: [0] },
      { code: 336, indent: 0, parameters: [0, 1] },
      { code: 337, indent: 0, parameters: [0, 1, true] },
      { code: 339, indent: 0, parameters: [1, 1, 1, -2] },
      { code: 340, indent: 0, parameters: [] },
      { code: 342, indent: 0, parameters: [0, 0, 0, 4] },
      { code: 351, indent: 0, parameters: [] },
      { code: 352, indent: 0, parameters: [] },
      { code: 353, indent: 0, parameters: [] },
      { code: 354, indent: 0, parameters: [] },
      { code: 355, indent: 0, parameters: ["const x = 1;"] },
      { code: 655, indent: 0, parameters: ["console.log(x);"] },
      { code: 356, indent: 0, parameters: ["MyPlugin arg1 arg2"] },
      { code: 0, indent: 0, parameters: [] },
    ]);
  });
});
