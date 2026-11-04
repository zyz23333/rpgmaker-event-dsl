import { expect, it } from "vitest";
import {
  battlePage,
  commonEvent,
  conditional,
  mapEvent,
  page,
  troopEvent,
  type ConditionalBranchCondition,
} from "../src/index.js";
import { validateDslOwnedDeclarations } from "../src/validation/staged-graph.js";

const self: ConditionalBranchCondition = { kind: "selfSwitch", selfSwitch: "A", value: false };
const character = (target: "player" | "currentEvent" | number): ConditionalBranchCondition => ({
  kind: "character",
  target:
    typeof target === "number"
      ? { kind: "runtimeSelector", scope: "character", target: "event", id: target }
      : { kind: "runtimeSelector", scope: "character", target },
  direction: 2,
});
const enemy = (index: number): ConditionalBranchCondition => ({
  kind: "enemy",
  enemy: { kind: "runtimeSelector", scope: "enemy", target: "enemy", index },
  check: { kind: "appeared" },
});
const commands = (conditions: ConditionalBranchCondition[]) =>
  conditions.map((condition) => conditional({ condition, then: { commands: [] } }));
const input = {
  scriptEnabled: true,
  snapshotReferences: {
    maps: [{ id: 1, name: "Map" }],
    troops: [{ id: 1, name: "Troop" }],
    enemies: [{ id: 1, name: "" }],
  },
  snapshotMaps: [{ id: 1, width: 10, height: 10, eventLocations: [{ eventId: 1, x: 0, y: 0 }] }],
  snapshotTroops: [{ id: 1, members: [{ enemyId: 1, x: 0, y: 0, hidden: true }] }],
};

it("keeps Common Event caller context unknown and warns without inventing declarations or targets", () => {
  const event = commonEvent({
    id: 1,
    name: "Caller unknown",
    trigger: "none",
    commands: commands([self, character("currentEvent"), character(9), enemy(7)]),
  });
  const { issues } = validateDslOwnedDeclarations([event], input);
  expect(issues.filter((issue) => issue.level === "error")).toStrictEqual([]);
  expect(
    issues
      .filter((issue) => issue.code?.startsWith("MV-E111-"))
      .map((issue) => ({ code: issue.code, nativePath: issue.nativePath, dslPath: issue.dslPath })),
  ).toStrictEqual([
    {
      code: "MV-E111-SELF-SWITCH-CONTEXT",
      nativePath: "list[0].parameters[1]",
      dslPath: "commands[0].condition.selfSwitch",
    },
    {
      code: "MV-E111-CHARACTER-CONTEXT",
      nativePath: "list[3].parameters[1]",
      dslPath: "commands[1].condition.target",
    },
    {
      code: "MV-E111-CHARACTER-CONTEXT",
      nativePath: "list[6].parameters[1]",
      dslPath: "commands[2].condition.target",
    },
    {
      code: "MV-E111-ENEMY-CONTEXT",
      nativePath: "list[9].parameters[1]",
      dslPath: "commands[3].condition.enemy",
    },
  ]);
  for (const issue of issues)
    expect(issue).toMatchObject({
      level: "warning",
      stage: "compile",
      identity: "commonEvent:1",
      expected: expect.any(String),
      actual: expect.any(String),
    });
});

it("distinguishes legal Map selectors from missing event positions and a Troop-dependent selector", () => {
  const event = mapEvent({
    mapId: 1,
    id: 1,
    name: "Map",
    x: 0,
    y: 0,
    pages: [
      page({
        commands: commands([
          self,
          character("player"),
          character("currentEvent"),
          character(1),
          character(9),
          enemy(0),
        ]),
      }),
    ],
  });
  const { issues } = validateDslOwnedDeclarations([event], input);
  expect(issues.filter((issue) => issue.level === "error")).toStrictEqual([]);
  expect(
    issues
      .filter((issue) => issue.code?.startsWith("MV-E111-"))
      .map((issue) => [issue.code, issue.nativePath, issue.dslPath]),
  ).toStrictEqual([
    [
      "MV-E111-CHARACTER-CONTEXT",
      "pages[0].list[12].parameters[1]",
      "pages[0].commands[4].condition.target",
    ],
    [
      "MV-E111-ENEMY-CONTEXT",
      "pages[0].list[15].parameters[1]",
      "pages[0].commands[5].condition.enemy",
    ],
  ]);
});

it("warns for battle-inapplicable characters/self-switch and preserves raw Troop positions including hidden/missing members", () => {
  const event = troopEvent({
    troopId: 1,
    pages: [
      battlePage({
        commands: commands([
          self,
          character("player"),
          character("currentEvent"),
          character(1),
          enemy(0),
          enemy(7),
        ]),
      }),
    ],
  });
  const { issues } = validateDslOwnedDeclarations([event], input);
  expect(issues.filter((issue) => issue.level === "error")).toStrictEqual([]);
  expect(
    issues
      .filter((issue) => issue.code?.startsWith("MV-E111-"))
      .map((issue) => [issue.code, issue.nativePath]),
  ).toStrictEqual([
    ["MV-E111-SELF-SWITCH-CONTEXT", "pages[0].list[0].parameters[1]"],
    ["MV-E111-CHARACTER-CONTEXT", "pages[0].list[3].parameters[1]"],
    ["MV-E111-CHARACTER-CONTEXT", "pages[0].list[6].parameters[1]"],
    ["MV-E111-CHARACTER-CONTEXT", "pages[0].list[9].parameters[1]"],
    ["MV-E111-ENEMY-CONTEXT", "pages[0].list[12].parameters[1]"],
    ["MV-E111-ENEMY-CONTEXT", "pages[0].list[15].parameters[1]"],
  ]);
  const missing = validateDslOwnedDeclarations([event], {
    ...input,
    snapshotTroops: [
      {
        id: 1,
        members: [
          { enemyId: 999, hidden: false },
          { enemyId: 1, hidden: false },
        ],
      },
    ],
  }).issues;
  expect(missing).toContainEqual(
    expect.objectContaining({
      code: "MV-E111-ENEMY-CONTEXT",
      nativePath: "pages[0].list[12].parameters[1]",
      actual: expect.stringContaining("999"),
    }),
  );
});
