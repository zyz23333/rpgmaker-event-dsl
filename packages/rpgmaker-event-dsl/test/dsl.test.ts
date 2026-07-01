import { describe, expect, it } from "vitest";

import {
  animationRef,
  battleProcessing,
  audioAsset,
  changeArmors,
  changeBattleBack,
  changeBattleBgm,
  changeDefeatMe,
  changeEncounterDisable,
  changeFormationAccess,
  changeGold,
  changeItems,
  changeMapNameDisplay,
  changeMenuAccess,
  changePartyMember,
  changeParallax,
  changePlayerFollowers,
  changeSaveAccess,
  changeTransparency,
  changeTileset,
  changeVehicleBgm,
  changeVictoryMe,
  changeWindowColor,
  changeWeapons,
  collectDslOwnedDeclarations,
  comment,
  commonEvent,
  callCommonEvent,
  commonEventRef,
  controlSelfSwitch,
  controlSwitches,
  controlTimer,
  controlVariables,
  erasePicture,
  eraseEvent,
  fadeinScreen,
  fadeoutBgm,
  fadeoutBgs,
  fadeoutScreen,
  flashScreen,
  gatherFollowers,
  getLocationInfo,
  imageAsset,
  inputNumber,
  isAssetReference,
  isProjectDataReference,
  isRuntimeSelector,
  isScriptInput,
  mapEvent,
  movieAsset,
  movePicture,
  page,
  playBgm,
  playBgs,
  playMe,
  playMovie,
  playSe,
  rotatePicture,
  resumeBgm,
  saveBgm,
  selectItem,
  scriptInput,
  scrollMap,
  setEventLocation,
  setMovementRoute,
  setVehicleLocation,
  setWeatherEffect,
  showAnimation,
  showBalloonIcon,
  showChoices,
  showPicture,
  showScrollingText,
  showText,
  shakeScreen,
  switchDefinition,
  stopSe,
  tilesetRef,
  tintPicture,
  tintScreen,
  variableDefinition,
  wait,
  switchRef,
  itemRef,
  variableRef,
  troopRef,
} from "../src/index.js";

describe("collectDslOwnedDeclarations", () => {
  it("collects named DSL-owned declarations", () => {
    const definitions = collectDslOwnedDeclarations({
      alpha: mapEvent({
        mapId: 1,
        id: 1,
        name: "Alpha",
        x: 1,
        y: 2,
        pages: [
          page({
            commands: [showText({ lines: ["Hello"] })],
          }),
        ],
      }),
      beta: commonEvent({
        id: 1,
        name: "Beta",
        trigger: "none",
        switch: switchRef({ id: 1 }),
        commands: [callCommonEvent(commonEventRef({ name: "SomeCommonEvent" }))],
      }),
      gamma: switchDefinition({
        id: 2,
        name: "Gamma Switch",
      }),
      delta: variableDefinition({
        id: 3,
        name: "Delta Variable",
      }),
    });

    expect(definitions).toHaveLength(4);
    expect(definitions.map((definition) => definition.name)).toEqual([
      "Alpha",
      "Beta",
      "Gamma Switch",
      "Delta Variable",
    ]);
  });
  it("rejects default exports", () => {
    expect(() =>
      collectDslOwnedDeclarations({
        default: mapEvent({
          mapId: 1,
          id: 1,
          name: "Ignored",
          x: 0,
          y: 0,
          pages: [
            page({
              commands: [],
            }),
          ],
        }),
      }),
    ).toThrow("Default export is not allowed for DSL-owned declarations.");
  });

  it("builds the new command helpers as structured DSL commands", () => {
    expect(audioAsset({ folder: "bgm", name: "Theme" }).kind).toBe("asset");
    expect(imageAsset({ folder: "pictures", name: "Poster" }).kind).toBe("asset");
    expect(movieAsset({ name: "Intro" }).folder).toBe("movies");
    expect(scriptInput({ code: "console.log(1);" }).kind).toBe("scriptInput");
    expect(comment(["A", "B"]).kind).toBe("comment");
    expect(controlSwitches({ switch: switchRef({ id: 1 }), value: true }).kind).toBe(
      "controlSwitches",
    );
    expect(
      controlVariables({ variable: variableRef({ id: 2 }), operation: "add", value: 3 }).kind,
    ).toBe("controlVariables");
    expect(controlSelfSwitch({ selfSwitch: "A", value: false }).kind).toBe("controlSelfSwitch");
    expect(changeGold({ operation: "gain", value: 5 }).kind).toBe("changeGold");
    expect(changeItems({ item: itemRef({ id: 1 }), operation: "lose", amount: 2 }).kind).toBe(
      "changeItems",
    );
    expect(controlTimer({ action: "start", seconds: 30 }).kind).toBe("controlTimer");
    expect(
      changeWeapons({ weapon: { kind: "weapon", id: 1 }, operation: "gain", amount: 1 }).kind,
    ).toBe("changeWeapons");
    expect(
      changeArmors({ armor: { kind: "armor", id: 1 }, operation: "lose", amount: 1 }).kind,
    ).toBe("changeArmors");
    expect(changePartyMember({ actor: { kind: "actor", id: 1 }, operation: "add" }).kind).toBe(
      "changePartyMember",
    );
    expect(
      changeBattleBgm({ audio: { asset: audioAsset({ folder: "bgm", name: "Battle1" }) } }).kind,
    ).toBe("changeBattleBgm");
    expect(
      changeVictoryMe({ audio: { asset: audioAsset({ folder: "me", name: "Victory1" }) } }).kind,
    ).toBe("changeVictoryMe");
    expect(changeSaveAccess({ enabled: true }).kind).toBe("changeSaveAccess");
    expect(changeMenuAccess({ enabled: false }).kind).toBe("changeMenuAccess");
    expect(changeEncounterDisable({ disabled: true }).kind).toBe("changeEncounterDisable");
    expect(changeFormationAccess({ enabled: true }).kind).toBe("changeFormationAccess");
    expect(changeWindowColor({ tone: [0, 0, 0, 0] }).kind).toBe("changeWindowColor");
    expect(
      changeDefeatMe({ audio: { asset: audioAsset({ folder: "me", name: "Defeat1" }) } }).kind,
    ).toBe("changeDefeatMe");
    expect(
      changeVehicleBgm({
        vehicle: "ship",
        audio: { asset: audioAsset({ folder: "bgm", name: "Ship1" }) },
      }).kind,
    ).toBe("changeVehicleBgm");
    expect(
      setVehicleLocation({
        vehicle: "boat",
        destination: { kind: "direct", map: { kind: "map", id: 1 }, x: 2, y: 3 },
      }).kind,
    ).toBe("setVehicleLocation");
    expect(
      setEventLocation({
        character: { kind: "runtimeSelector", scope: "character", target: "currentEvent" },
        destination: { kind: "direct", x: 2, y: 3 },
      }).kind,
    ).toBe("setEventLocation");
    expect(scrollMap({ direction: 2, distance: 8, speed: 4 }).kind).toBe("scrollMap");
    expect(
      setMovementRoute({
        target: { kind: "runtimeSelector", scope: "character", target: "player" },
        route: [
          { kind: "moveDown" },
          { kind: "routeWait", frames: 15 },
          { kind: "switchOn", switch: switchRef({ id: 1 }) },
          { kind: "script", script: scriptInput({ code: "this.moveForward();" }) },
        ],
        repeat: false,
        skippable: true,
        wait: true,
      }).kind,
    ).toBe("setMovementRoute");
    expect(changeTransparency({ transparent: true }).kind).toBe("changeTransparency");
    expect(
      showAnimation({
        target: { kind: "runtimeSelector", scope: "character", target: "player" },
        animation: animationRef({ id: 1 }),
        wait: true,
      }).kind,
    ).toBe("showAnimation");
    expect(
      showBalloonIcon({
        target: { kind: "runtimeSelector", scope: "character", target: "currentEvent" },
        balloon: "exclamation",
      }).kind,
    ).toBe("showBalloonIcon");
    expect(changePlayerFollowers({ visible: false }).kind).toBe("changePlayerFollowers");
    expect(gatherFollowers().kind).toBe("gatherFollowers");
    expect(fadeoutScreen().kind).toBe("fadeoutScreen");
    expect(fadeinScreen().kind).toBe("fadeinScreen");
    expect(tintScreen({ tone: [0, 0, 0, 0], duration: 30 }).kind).toBe("tintScreen");
    expect(flashScreen({ color: [255, 255, 255, 128], duration: 20 }).kind).toBe("flashScreen");
    expect(shakeScreen({ power: 5, speed: 5, duration: 30 }).kind).toBe("shakeScreen");
    expect(
      showPicture({
        pictureId: 1,
        image: imageAsset({ folder: "pictures", name: "Poster" }),
        position: { kind: "direct", x: 10, y: 20, origin: "center" },
      }).kind,
    ).toBe("showPicture");
    expect(
      movePicture({
        pictureId: 1,
        position: { kind: "variables", x: variableRef({ id: 1 }), y: variableRef({ id: 2 }) },
        duration: 60,
        wait: true,
      }).kind,
    ).toBe("movePicture");
    expect(rotatePicture({ pictureId: 1, speed: 5 }).kind).toBe("rotatePicture");
    expect(tintPicture({ pictureId: 1, tone: [68, -34, -34, 0], duration: 30 }).kind).toBe(
      "tintPicture",
    );
    expect(erasePicture({ pictureId: 1 }).kind).toBe("erasePicture");
    expect(setWeatherEffect({ weather: "rain", power: 5, duration: 60 }).kind).toBe(
      "setWeatherEffect",
    );
    expect(playBgm({ audio: { asset: audioAsset({ folder: "bgm", name: "Theme" }) } }).kind).toBe(
      "playBgm",
    );
    expect(fadeoutBgm({ duration: 60 }).kind).toBe("fadeoutBgm");
    expect(saveBgm().kind).toBe("saveBgm");
    expect(resumeBgm().kind).toBe("resumeBgm");
    expect(playBgs({ audio: { asset: audioAsset({ folder: "bgs", name: "Rain" }) } }).kind).toBe(
      "playBgs",
    );
    expect(fadeoutBgs({ duration: 30 }).kind).toBe("fadeoutBgs");
    expect(playMe({ audio: { asset: audioAsset({ folder: "me", name: "Fanfare" }) } }).kind).toBe(
      "playMe",
    );
    expect(playSe({ audio: { asset: audioAsset({ folder: "se", name: "Cursor" }) } }).kind).toBe(
      "playSe",
    );
    expect(stopSe().kind).toBe("stopSe");
    expect(playMovie({ movie: movieAsset({ name: "Intro" }) }).kind).toBe("playMovie");
    expect(changeMapNameDisplay({ enabled: true }).kind).toBe("changeMapNameDisplay");
    expect(changeTileset({ tileset: tilesetRef({ id: 1 }) }).kind).toBe("changeTileset");
    expect(
      changeBattleBack({
        battleback1: imageAsset({ folder: "battlebacks1", name: "Grassland" }),
        battleback2: imageAsset({ folder: "battlebacks2", name: "Forest" }),
      }).kind,
    ).toBe("changeBattleBack");
    expect(
      changeParallax({
        image: imageAsset({ folder: "parallaxes", name: "Clouds" }),
        loopX: true,
        sx: 1,
      }).kind,
    ).toBe("changeParallax");
    expect(
      getLocationInfo({
        variable: variableRef({ id: 1 }),
        info: "regionId",
        location: { kind: "direct", x: 1, y: 2 },
      }).kind,
    ).toBe("getLocationInfo");
    expect(wait(60).kind).toBe("wait");
    expect(eraseEvent().kind).toBe("eraseEvent");
    expect(battleProcessing({ troop: troopRef({ id: 1 }) }).kind).toBe("battleProcessing");
    expect(
      showText({
        lines: ["Portrait line"],
        face: { image: imageAsset({ folder: "faces", name: "Actor1" }), index: 3 },
        background: 1,
        positionType: 0,
      }),
    ).toEqual({
      kind: "showText",
      lines: ["Portrait line"],
      face: {
        image: {
          kind: "asset",
          category: "image",
          folder: "faces",
          name: "Actor1",
        },
        index: 3,
      },
      background: 1,
      positionType: 0,
    });
    expect(inputNumber({ variable: variableRef({ id: 1 }), digits: 4 }).kind).toBe("inputNumber");
    expect(selectItem({ variable: variableRef({ id: 1 }), itemType: 1 }).kind).toBe("selectItem");
    expect(showScrollingText({ lines: ["A", "B"], speed: 4 }).kind).toBe("showScrollingText");
    expect(
      showChoices({
        choices: ["Yes", "No"],
        branches: [[], []],
      }).kind,
    ).toBe("showChoices");
  });

  it("distinguishes asset, project data, runtime selector, and script primitives", () => {
    const asset = audioAsset({ folder: "se", name: "Cursor" });
    const image = imageAsset({ folder: "faces", name: "Hero" });
    const script = scriptInput({ code: "return true;" });
    const projectData = switchRef({ id: 1 });
    const runtimeSelector = {
      kind: "runtimeSelector",
      scope: "player",
      target: "current",
    } as const;

    expect(isAssetReference(asset)).toBe(true);
    expect(isAssetReference(image)).toBe(true);
    expect(isProjectDataReference(projectData)).toBe(true);
    expect(isProjectDataReference(asset)).toBe(false);
    expect(isRuntimeSelector(runtimeSelector)).toBe(true);
    expect(isRuntimeSelector(projectData)).toBe(false);
    expect(isScriptInput(script)).toBe(true);
    expect(isScriptInput(projectData)).toBe(false);
  });

  it("requires explicit identities for event definitions", () => {
    expect(
      mapEvent({
        mapId: 1,
        id: 2,
        name: "Gate",
        x: 1,
        y: 2,
        pages: [
          page({
            commands: [],
          }),
        ],
      }).mapId,
    ).toBe(1);
    expect(
      commonEvent({
        id: 3,
        name: "Alarm",
        trigger: "none",
        commands: [],
      }).id,
    ).toBe(3);
    expect(switchDefinition({ id: 4, name: "Has Key" }).kind).toBe("switchDefinition");
    expect(variableDefinition({ id: 5, name: "Count" }).kind).toBe("variableDefinition");
  });
});
