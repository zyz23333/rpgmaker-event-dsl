import { describe, expect, it } from "vitest";

import {
  battleProcessing,
  audioAsset,
  buildStagedDataGraph,
  classRef,
  changeArmors,
  changeGold,
  changeItems,
  changePartyMember,
  changeWeapons,
  comment,
  commonEvent,
  conditional,
  controlTimer,
  controlSwitches,
  controlVariables,
  eraseEvent,
  getOnOffVehicle,
  imageAsset,
  inputNumber,
  itemRef,
  page,
  scriptInput,
  selectItem,
  scrollMap,
  setEventLocation,
  setMovementRoute,
  setVehicleLocation,
  showChoices,
  showScrollingText,
  showText,
  skillRef,
  stateRef,
  switchDefinition,
  switchRef,
  transferPlayer,
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
    switchDefinition({ id: 2, name: "Gate B" }),
    variableDefinition({ id: 1, name: "Count" }),
    variableDefinition({ id: 2, name: "Count B" }),
    variableDefinition({ id: 3, name: "Map Var" }),
    variableDefinition({ id: 4, name: "X Var" }),
    variableDefinition({ id: 5, name: "Y Var" }),
  ],
  snapshotReferences: {
    actors: [{ id: 1, name: "Hero" }],
    armors: [{ id: 1, name: "Shield" }],
    classes: [{ id: 1, name: "Warrior" }],
    items: [{ id: 1, name: "Potion" }],
    maps: [{ id: 1, name: "Town" }],
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
