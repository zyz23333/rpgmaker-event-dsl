import type { ConditionalBranchCondition } from "../../src/index.js";
const entries = [
  { id: 1, name: "" },
  { id: 2, name: "Second" },
];
export const references = {
  actors: entries,
  armors: entries,
  classes: entries,
  items: entries,
  skills: entries,
  states: entries,
  weapons: entries,
  variableCapacity: 2,
  switchCapacity: 2,
};

// Full literal native slots are independently specified from core.md E111, not produced by another encoder.
export const conditionCases: Array<[string, ConditionalBranchCondition, unknown[]]> = [
  ["switch-on", { kind: "switch", switch: { kind: "switch", id: 1 }, value: true }, [0, 1, 0]],
  ["switch-off", { kind: "switch", switch: { kind: "switch", id: 2 }, value: false }, [0, 2, 1]],
  [
    "constant-min",
    {
      kind: "variable",
      variable: { kind: "variable", id: 1 },
      operator: "eq",
      value: { kind: "constant", value: -99999999 },
    },
    [1, 1, 0, -99999999, 0],
  ],
  [
    "constant-max",
    {
      kind: "variable",
      variable: { kind: "variable", id: 1 },
      operator: "ne",
      value: { kind: "constant", value: 99999999 },
    },
    [1, 1, 0, 99999999, 5],
  ],
  ["self-A-on", { kind: "selfSwitch", selfSwitch: "A", value: true }, [2, "A", 0]],
  ["self-B-off", { kind: "selfSwitch", selfSwitch: "B", value: false }, [2, "B", 1]],
  ["self-C-on", { kind: "selfSwitch", selfSwitch: "C", value: true }, [2, "C", 0]],
  ["self-D-off", { kind: "selfSwitch", selfSwitch: "D", value: false }, [2, "D", 1]],
  ["timer-ge-zero", { kind: "timer", seconds: 0, operator: "ge" }, [3, 0, 0]],
  ["timer-le-max", { kind: "timer", seconds: 5999, operator: "le" }, [3, 5999, 1]],
  [
    "actor-party-three-slots",
    { kind: "actor", actor: { kind: "actor", id: 1 }, check: { kind: "inParty" } },
    [4, 1, 0],
  ],
  [
    "actor-name-full",
    {
      kind: "actor",
      actor: { kind: "actor", id: 1 },
      check: { kind: "name", name: "\r\n trailing \t" },
    },
    [4, 1, 1, "\r\n trailing \t"],
  ],
  [
    "actor-class",
    {
      kind: "actor",
      actor: { kind: "actor", id: 1 },
      check: { kind: "class", class: { kind: "class", id: 2 } },
    },
    [4, 1, 2, 2],
  ],
  [
    "actor-skill",
    {
      kind: "actor",
      actor: { kind: "actor", id: 1 },
      check: { kind: "skill", skill: { kind: "skill", id: 2 } },
    },
    [4, 1, 3, 2],
  ],
  [
    "actor-weapon",
    {
      kind: "actor",
      actor: { kind: "actor", id: 1 },
      check: { kind: "weapon", weapon: { kind: "weapon", id: 2 } },
    },
    [4, 1, 4, 2],
  ],
  [
    "actor-armor",
    {
      kind: "actor",
      actor: { kind: "actor", id: 1 },
      check: { kind: "armor", armor: { kind: "armor", id: 2 } },
    },
    [4, 1, 5, 2],
  ],
  [
    "actor-state",
    {
      kind: "actor",
      actor: { kind: "actor", id: 1 },
      check: { kind: "state", state: { kind: "state", id: 2 } },
    },
    [4, 1, 6, 2],
  ],
  [
    "enemy-appeared-three-slots",
    {
      kind: "enemy",
      enemy: { kind: "runtimeSelector", scope: "enemy", target: "enemy", index: 0 },
      check: { kind: "appeared" },
    },
    [5, 0, 0],
  ],
  [
    "enemy-state-last-position",
    {
      kind: "enemy",
      enemy: { kind: "runtimeSelector", scope: "enemy", target: "enemy", index: 7 },
      check: { kind: "state", state: { kind: "state", id: 2 } },
    },
    [5, 7, 1, 2],
  ],
  [
    "character-player",
    {
      kind: "character",
      target: { kind: "runtimeSelector", scope: "character", target: "player" },
      direction: 2,
    },
    [6, -1, 2],
  ],
  [
    "character-current",
    {
      kind: "character",
      target: { kind: "runtimeSelector", scope: "character", target: "currentEvent" },
      direction: 4,
    },
    [6, 0, 4],
  ],
  [
    "character-event-right",
    {
      kind: "character",
      target: { kind: "runtimeSelector", scope: "character", target: "event", id: 1 },
      direction: 6,
    },
    [6, 1, 6],
  ],
  [
    "character-event-up",
    {
      kind: "character",
      target: { kind: "runtimeSelector", scope: "character", target: "event", id: 999 },
      direction: 8,
    },
    [6, 999, 8],
  ],
  ["gold-ge-zero", { kind: "gold", amount: 0, operator: "ge" }, [7, 0, 0]],
  ["gold-le-max", { kind: "gold", amount: 9999999, operator: "le" }, [7, 9999999, 1]],
  ["gold-lt", { kind: "gold", amount: 1, operator: "lt" }, [7, 1, 2]],
  ["item", { kind: "item", item: { kind: "item", id: 1 } }, [8, 1]],
  [
    "weapon-inventory",
    { kind: "weapon", weapon: { kind: "weapon", id: 1 }, includeEquipment: false },
    [9, 1, false],
  ],
  [
    "weapon-equipped",
    { kind: "weapon", weapon: { kind: "weapon", id: 1 }, includeEquipment: true },
    [9, 1, true],
  ],
  [
    "armor-inventory",
    { kind: "armor", armor: { kind: "armor", id: 1 }, includeEquipment: false },
    [10, 1, false],
  ],
  [
    "armor-equipped",
    { kind: "armor", armor: { kind: "armor", id: 1 }, includeEquipment: true },
    [10, 1, true],
  ],
  ["script-empty", { kind: "script", script: { kind: "scriptInput", code: "" } }, [12, ""]],
  [
    "script-full-single-slot",
    { kind: "script", script: { kind: "scriptInput", code: "\r\ntrue\r\n\n \t" } },
    [12, "\r\ntrue\r\n\n \t"],
  ],
  ["vehicle-boat", { kind: "vehicle", vehicle: "boat" }, [13, 0]],
  ["vehicle-ship", { kind: "vehicle", vehicle: "ship" }, [13, 1]],
  ["vehicle-airship", { kind: "vehicle", vehicle: "airship" }, [13, 2]],
];
for (const [operator, code] of [
  ["eq", 0],
  ["ge", 1],
  ["le", 2],
  ["gt", 3],
  ["lt", 4],
  ["ne", 5],
] as const) {
  conditionCases.push([
    `constant-${operator}`,
    {
      kind: "variable",
      variable: { kind: "variable", id: 1 },
      operator,
      value: { kind: "constant", value: 0 },
    },
    [1, 1, 0, 0, code],
  ]);
  conditionCases.push([
    `variable-${operator}`,
    {
      kind: "variable",
      variable: { kind: "variable", id: 1 },
      operator,
      value: { kind: "variable", variable: { kind: "variable", id: 2 } },
    },
    [1, 1, 1, 2, code],
  ]);
}
for (const button of [
  "ok",
  "cancel",
  "shift",
  "down",
  "left",
  "right",
  "up",
  "pageup",
  "pagedown",
] as const)
  conditionCases.push([`button-${button}`, { kind: "button", button }, [11, button]]);
