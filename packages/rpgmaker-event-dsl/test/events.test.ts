import { describe, expect, it } from "vitest";

import {
  battleProcessing,
  buildStagedDataGraph,
  changeGold,
  changeItem,
  comment,
  commonEvent,
  controlSwitches,
  controlVariables,
  eraseEvent,
  itemRef,
  page,
  showChoices,
  showText,
  switchDefinition,
  switchRef,
  troopRef,
  variableDefinition,
  variableRef,
  wait,
} from "../src/index.js";
import { compileMapEvent } from "../src/events.js";

const resolver = buildStagedDataGraph({
  declarations: [
    commonEvent({ id: 1, name: "Common", trigger: "none", commands: [] }),
    switchDefinition({ id: 1, name: "Gate" }),
    variableDefinition({ id: 1, name: "Count" }),
  ],
  snapshotReferences: {
    items: [{ id: 1, name: "Potion" }],
    troops: [{ id: 1, name: "Slime" }],
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
              showText(["Hello"]),
              showChoices({
                choices: ["Yes", "No"],
                branches: [[wait(10)], [eraseEvent()]],
              }),
              controlVariables({
                variable: variableRef({ name: "Count" }),
                operation: "add",
                value: 3,
              }),
              controlSwitches({ switch: switchRef({ name: "Gate" }), value: true }),
              changeGold({ operation: "gain", value: 5 }),
              changeItem({ item: itemRef({ name: "Potion" }), operation: "lose", amount: 1 }),
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
    expect(commands[1]).toEqual({ code: 101, indent: 0, parameters: ["", 0, 0, 2] });
    expect(commands[2]).toEqual({ code: 401, indent: 0, parameters: ["Hello"] });
    expect(commands[3]).toEqual({ code: 102, indent: 0, parameters: [["Yes", "No"], -1, 0, 2, 0] });
    expect(commands[4]).toEqual({ code: 402, indent: 0, parameters: [0] });
    expect(commands[5]).toEqual({ code: 230, indent: 1, parameters: [10] });
    expect(commands[6]).toEqual({ code: 402, indent: 0, parameters: [1] });
    expect(commands[7]).toEqual({ code: 214, indent: 1, parameters: [] });
    expect(commands[8]).toEqual({ code: 122, indent: 0, parameters: [1, 1, 1, 0, 3] });
    expect(commands[9]).toEqual({ code: 121, indent: 0, parameters: [1, 1, 0] });
    expect(commands[10]).toEqual({ code: 125, indent: 0, parameters: [0, 0, 5] });
    expect(commands[11]).toEqual({ code: 126, indent: 0, parameters: [1, 1, 0, 1] });
    expect(commands[12]).toEqual({ code: 301, indent: 0, parameters: [0, 1, true, false] });
    expect(commands[13]).toEqual({ code: 0, indent: 0, parameters: [] });
  });
});
