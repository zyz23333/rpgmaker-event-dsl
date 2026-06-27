import { describe, expect, it } from "vitest";

import {
  battleProcessing,
  changeGold,
  changeItem,
  comment,
  controlVariable,
  eraseEvent,
  itemRef,
  page,
  showChoices,
  showText,
  troopRef,
  variableRef,
  wait,
} from "../src/index.js";
import { buildProjectIndex } from "../src/project.js";
import { compileMapEvent } from "../src/events.js";

const projectIndex = buildProjectIndex({
  actors: [{ id: 1, name: "Hero" }],
  armors: [{ id: 1, name: "Leather" }],
  commonEvents: [{ id: 1, name: "Common" }],
  items: [{ id: 1, name: "Potion" }],
  mapInfos: [{ id: 1, name: "Map001", parentId: 0 }],
  system: {
    switches: ["", "Gate"],
    variables: ["", "Count"],
  },
  weapons: [{ id: 1, name: "Sword" }],
  troops: [{ id: 1, name: "Slime" }],
});

describe("compileMapEvent", () => {
  it("compiles core MV command helpers into raw commands", () => {
    const event = compileMapEvent(
      {
        kind: "mapEvent",
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
              controlVariable({
                variable: variableRef({ name: "Count" }),
                operation: "add",
                value: 3,
              }),
              changeGold({ operation: "gain", value: 5 }),
              changeItem({ item: itemRef({ name: "Potion" }), operation: "lose", amount: 1 }),
              battleProcessing({ troop: troopRef({ name: "Slime" }), canEscape: true }),
            ],
          }),
        ],
      },
      {
        nextId: 2,
        projectIndex,
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
    expect(commands[9]).toEqual({ code: 125, indent: 0, parameters: [0, 0, 5] });
    expect(commands[10]).toEqual({ code: 126, indent: 0, parameters: [1, 1, 0, 1] });
    expect(commands[11]).toEqual({ code: 301, indent: 0, parameters: [0, 1, true, false] });
    expect(commands[12]).toEqual({ code: 0, indent: 0, parameters: [] });
  });
});
