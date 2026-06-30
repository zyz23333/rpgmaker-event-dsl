import { describe, expect, it } from "vitest";

import {
  battleProcessing,
  buildStagedDataGraph,
  classRef,
  changeGold,
  changeItem,
  comment,
  commonEvent,
  conditional,
  controlSwitches,
  controlVariables,
  eraseEvent,
  imageAsset,
  inputNumber,
  itemRef,
  page,
  scriptInput,
  selectItem,
  showChoices,
  showScrollingText,
  showText,
  skillRef,
  stateRef,
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
    actors: [{ id: 1, name: "Hero" }],
    armors: [{ id: 1, name: "Shield" }],
    classes: [{ id: 1, name: "Warrior" }],
    items: [{ id: 1, name: "Potion" }],
    skills: [{ id: 1, name: "Heal" }],
    states: [{ id: 1, name: "Poison" }],
    troops: [{ id: 1, name: "Slime" }],
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
    expect(commands[19]).toEqual({ code: 126, indent: 0, parameters: [1, 1, 0, 1] });
    expect(commands[20]).toEqual({ code: 301, indent: 0, parameters: [0, 1, true, false] });
    expect(commands[21]).toEqual({ code: 0, indent: 0, parameters: [] });
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
});
