import { describe, expect, it } from "vitest";

import {
  battleProcessing,
  audioAsset,
  changeArmors,
  changeGold,
  changeItems,
  changePartyMember,
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
  eraseEvent,
  imageAsset,
  inputNumber,
  isAssetReference,
  isProjectDataReference,
  isRuntimeSelector,
  isScriptInput,
  mapEvent,
  movieAsset,
  page,
  selectItem,
  scriptInput,
  scrollMap,
  setEventLocation,
  setMovementRoute,
  setVehicleLocation,
  showChoices,
  showScrollingText,
  showText,
  switchDefinition,
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
