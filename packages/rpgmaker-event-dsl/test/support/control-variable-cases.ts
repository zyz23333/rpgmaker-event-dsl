import {
  actorRef,
  armorRef,
  itemRef,
  scriptInput,
  variableRef,
  weaponRef,
  type CommandOperand,
} from "../../src/index.js";

// Independent synthetic cases from normative core E122; never compiler-generated.
export const operandCases: Array<{ label: string; value: CommandOperand; slots: unknown[] }> = [
  { label: "constant lower", value: { kind: "constant", value: -99999999 }, slots: [0, -99999999] },
  { label: "constant upper", value: { kind: "constant", value: 99999999 }, slots: [0, 99999999] },
  { label: "constant negative zero", value: { kind: "constant", value: -0 }, slots: [0, -0] },
  {
    label: "variable unnamed slot",
    value: { kind: "variable", variable: variableRef({ id: 2 }) },
    slots: [1, 2],
  },
  {
    label: "random endpoints",
    value: { kind: "random", from: -99999999, to: 99999999 },
    slots: [2, -99999999, 99999999],
  },
  { label: "random zero endpoints", value: { kind: "random", from: -0, to: 0 }, slots: [2, -0, 0] },
  {
    label: "random saved upper negative zero",
    value: { kind: "random", from: -0, to: -0 },
    slots: [2, -0, -0],
  },
  {
    label: "item",
    value: { kind: "gameData", source: "item", item: itemRef({ id: 1 }) },
    slots: [3, 0, 1, 0],
  },
  {
    label: "weapon",
    value: { kind: "gameData", source: "weapon", weapon: weaponRef({ id: 1 }) },
    slots: [3, 1, 1, 0],
  },
  {
    label: "armor",
    value: { kind: "gameData", source: "armor", armor: armorRef({ id: 1 }) },
    slots: [3, 2, 1, 0],
  },
  ...(
    [
      ["level", 0],
      ["exp", 1],
      ["hp", 2],
      ["mp", 3],
      ["mhp", 4],
      ["mmp", 5],
      ["atk", 6],
      ["def", 7],
      ["mat", 8],
      ["mdf", 9],
      ["agi", 10],
      ["luk", 11],
    ] as const
  ).map(([value, code]) => ({
    label: `actor ${value}`,
    value: { kind: "gameData", source: "actor", actor: actorRef({ id: 1 }), value } as const,
    slots: [3, 3, 1, code],
  })),
  ...(
    [
      ["hp", 0],
      ["mp", 1],
      ["mhp", 2],
      ["mmp", 3],
      ["atk", 4],
      ["def", 5],
      ["mat", 6],
      ["mdf", 7],
      ["agi", 8],
      ["luk", 9],
    ] as const
  ).map(([value, code]) => ({
    label: `enemy ${value}`,
    value: {
      kind: "gameData",
      source: "enemy",
      enemy: { kind: "runtimeSelector", scope: "enemy", target: "enemy", index: 7 },
      value,
    } as const,
    slots: [3, 4, 7, code],
  })),
  {
    label: "enemy position negative zero",
    value: {
      kind: "gameData",
      source: "enemy",
      enemy: { kind: "runtimeSelector", scope: "enemy", target: "enemy", index: -0 },
      value: "hp",
    },
    slots: [3, 4, -0, 0],
  },
  ...(
    [
      ["mapX", 0],
      ["mapY", 1],
      ["direction", 2],
      ["screenX", 3],
      ["screenY", 4],
    ] as const
  ).map(([value, code]) => ({
    label: `character ${value}`,
    value: {
      kind: "gameData",
      source: "character",
      target: { kind: "runtimeSelector", scope: "character", target: "player" },
      value,
    } as const,
    slots: [3, 5, -1, code],
  })),
  {
    label: "character current event",
    value: {
      kind: "gameData",
      source: "character",
      target: { kind: "runtimeSelector", scope: "character", target: "currentEvent" },
      value: "mapX",
    },
    slots: [3, 5, 0, 0],
  },
  {
    label: "character event id",
    value: {
      kind: "gameData",
      source: "character",
      target: { kind: "runtimeSelector", scope: "character", target: "event", id: 999 },
      value: "mapY",
    },
    slots: [3, 5, 999, 1],
  },
  {
    label: "party first negative zero",
    value: {
      kind: "gameData",
      source: "party",
      member: { kind: "runtimeSelector", scope: "party", target: "member", index: -0 },
    },
    slots: [3, 6, -0, 0],
  },
  {
    label: "party eighth",
    value: {
      kind: "gameData",
      source: "party",
      member: { kind: "runtimeSelector", scope: "party", target: "member", index: 7 },
    },
    slots: [3, 6, 7, 0],
  },
  ...(
    [
      ["mapId", 0],
      ["partyMembers", 1],
      ["gold", 2],
      ["steps", 3],
      ["playTime", 4],
      ["timer", 5],
      ["saveCount", 6],
      ["battleCount", 7],
      ["winCount", 8],
      ["escapeCount", 9],
    ] as const
  ).map(([value, code]) => ({
    label: `other ${value}`,
    value: { kind: "gameData", source: "other", value } as const,
    slots: [3, 7, code, 0],
  })),
  ...["", "  \t", "1\r", "1\n", "1\r\n+2\n", "x".repeat(10000) + "\n".repeat(64) + "tail"].map(
    (code, index) => ({
      label: `complete script ${index}`,
      value: { kind: "script", script: scriptInput({ code }) } as const,
      slots: [4, code],
    }),
  ),
];

export const operationCases = [
  ["set", 0],
  ["add", 1],
  ["sub", 2],
  ["mul", 3],
  ["div", 4],
  ["mod", 5],
] as const;
export const variableReferences = {
  variableCapacity: 3,
  actors: [{ id: 1, name: "" }],
  items: [{ id: 1, name: "" }],
  weapons: [{ id: 1, name: "" }],
  armors: [{ id: 1, name: "" }],
};

export const rejectedNativeCases: Array<{ label: string; slots: unknown[]; path: string }> = [
  { label: "target zero", slots: [0, 1, 0, 0, 1], path: "[0]" },
  { label: "reverse target", slots: [3, 1, 0, 0, 1], path: "[1]" },
  { label: "operation negative zero", slots: [1, 1, -0, 0, 1], path: "[2]" },
  { label: "operation unknown", slots: [1, 1, 6, 0, 1], path: "[2]" },
  { label: "operand negative zero", slots: [1, 1, 0, -0, 1], path: "[3]" },
  { label: "operand unknown", slots: [1, 1, 0, 5, 1], path: "[3]" },
  { label: "constant underflow", slots: [1, 1, 0, 0, -100000000], path: "[4]" },
  { label: "constant overflow", slots: [1, 1, 0, 0, 100000000], path: "[4]" },
  { label: "constant fractional", slots: [1, 1, 0, 0, 1.5], path: "[4]" },
  { label: "variable zero", slots: [1, 1, 0, 1, 0], path: "[4]" },
  { label: "random underflow", slots: [1, 1, 0, 2, -100000000, 0], path: "[4]" },
  { label: "random overflow", slots: [1, 1, 0, 2, 0, 100000000], path: "[5]" },
  { label: "random reversed", slots: [1, 1, 0, 2, 1, -1], path: "[5]" },
  { label: "source negative zero", slots: [1, 1, 0, 3, -0, 1, 0], path: "[4]" },
  { label: "source unknown", slots: [1, 1, 0, 3, 8, 0, 0], path: "[4]" },
  { label: "item None", slots: [1, 1, 0, 3, 0, 0, 0], path: "[5]" },
  { label: "weapon None", slots: [1, 1, 0, 3, 1, 0, 0], path: "[5]" },
  { label: "armor None", slots: [1, 1, 0, 3, 2, 0, 0], path: "[5]" },
  { label: "actor None", slots: [1, 1, 0, 3, 3, 0, 0], path: "[5]" },
  ...[0, 1, 2, 6, 7].flatMap((source) => [
    {
      label: `source ${source} nonzero padding`,
      slots: [1, 1, 0, 3, source, source < 3 ? 1 : 0, 1],
      path: "[6]",
    },
    {
      label: `source ${source} negative zero padding`,
      slots: [1, 1, 0, 3, source, source < 3 ? 1 : 0, -0],
      path: "[6]",
    },
  ]),
  { label: "actor TP", slots: [1, 1, 0, 3, 3, 1, 12], path: "[6]" },
  { label: "actor negative zero status", slots: [1, 1, 0, 3, 3, 1, -0], path: "[6]" },
  { label: "enemy all", slots: [1, 1, 0, 3, 4, -1, 0], path: "[5]" },
  { label: "enemy ninth", slots: [1, 1, 0, 3, 4, 8, 0], path: "[5]" },
  { label: "enemy TP", slots: [1, 1, 0, 3, 4, 0, 10], path: "[6]" },
  { label: "enemy negative zero status", slots: [1, 1, 0, 3, 4, 0, -0], path: "[6]" },
  { label: "character follower", slots: [1, 1, 0, 3, 5, -2, 0], path: "[5]" },
  { label: "character negative zero symbolic target", slots: [1, 1, 0, 3, 5, -0, 0], path: "[5]" },
  { label: "character status unknown", slots: [1, 1, 0, 3, 5, 0, 5], path: "[6]" },
  { label: "character negative zero status", slots: [1, 1, 0, 3, 5, 0, -0], path: "[6]" },
  { label: "party negative index", slots: [1, 1, 0, 3, 6, -1, 0], path: "[5]" },
  { label: "party ninth", slots: [1, 1, 0, 3, 6, 8, 0], path: "[5]" },
  { label: "other unknown", slots: [1, 1, 0, 3, 7, 10, 0], path: "[5]" },
  { label: "other negative zero status", slots: [1, 1, 0, 3, 7, -0, 0], path: "[5]" },
  { label: "script nonstring", slots: [1, 1, 0, 4, null], path: "[4]" },
];
