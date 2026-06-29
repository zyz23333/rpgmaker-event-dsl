import { describe, expect, it } from "vitest";

import {
  battleProcessing,
  changeGold,
  changeItem,
  collectDslOwnedDeclarations,
  comment,
  commonEvent,
  callCommonEvent,
  commonEventRef,
  controlSelfSwitch,
  controlSwitch,
  controlVariable,
  eraseEvent,
  mapEvent,
  page,
  showChoices,
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
            commands: [showText(["Hello"])],
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
    expect(comment(["A", "B"]).kind).toBe("comment");
    expect(controlSwitch({ switch: switchRef({ id: 1 }), value: true }).kind).toBe("controlSwitch");
    expect(
      controlVariable({ variable: variableRef({ id: 2 }), operation: "add", value: 3 }).kind,
    ).toBe("controlVariable");
    expect(controlSelfSwitch({ selfSwitch: "A", value: false }).kind).toBe("controlSelfSwitch");
    expect(changeGold({ operation: "gain", value: 5 }).kind).toBe("changeGold");
    expect(changeItem({ item: itemRef({ id: 1 }), operation: "lose", amount: 2 }).kind).toBe(
      "changeItem",
    );
    expect(wait(60).kind).toBe("wait");
    expect(eraseEvent().kind).toBe("eraseEvent");
    expect(battleProcessing({ troop: troopRef({ id: 1 }) }).kind).toBe("battleProcessing");
    expect(
      showChoices({
        choices: ["Yes", "No"],
        branches: [[], []],
      }).kind,
    ).toBe("showChoices");
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
