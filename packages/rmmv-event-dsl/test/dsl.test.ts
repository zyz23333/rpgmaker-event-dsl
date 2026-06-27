import { describe, expect, it } from "vitest";

import {
  battleProcessing,
  changeGold,
  changeItem,
  collectEventDefinitions,
  comment,
  commonEvent,
  commonEventCall,
  commonEventRef,
  controlSelfSwitch,
  controlSwitch,
  controlVariable,
  eraseEvent,
  mapEvent,
  page,
  showChoices,
  showText,
  wait,
  switchRef,
  itemRef,
  variableRef,
  troopRef,
} from "../src/index.js";

describe("collectEventDefinitions", () => {
  it("collects named Event Definitions", () => {
    const definitions = collectEventDefinitions({
      alpha: mapEvent({
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
        name: "Beta",
        trigger: "none",
        switch: switchRef({ id: 1 }),
        commands: [commonEventCall(commonEventRef({ name: "SomeCommonEvent" }))],
      }),
    });

    expect(definitions).toHaveLength(2);
    expect(definitions.map((definition) => definition.name)).toEqual(["Alpha", "Beta"]);
  });

  it("rejects default exports", () => {
    expect(() =>
      collectEventDefinitions({
        default: mapEvent({
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
    ).toThrow("Default export is not allowed for Event Definitions.");
  });

  it("builds the new command helpers as structured nodes", () => {
    expect(comment(["A", "B"]).kind).toBe("comment");
    expect(controlSwitch({ switch: switchRef({ id: 1 }), value: true }).kind).toBe("controlSwitch");
    expect(controlVariable({ variable: variableRef({ id: 2 }), operation: "add", value: 3 }).kind).toBe("controlVariable");
    expect(controlSelfSwitch({ selfSwitch: "A", value: false }).kind).toBe("controlSelfSwitch");
    expect(changeGold({ operation: "gain", value: 5 }).kind).toBe("changeGold");
    expect(changeItem({ item: itemRef({ id: 1 }), operation: "lose", amount: 2 }).kind).toBe("changeItem");
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
});
