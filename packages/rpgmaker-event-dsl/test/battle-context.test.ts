import { expect, it } from "vitest";
import {
  battlePage,
  troopEvent,
  commonEvent,
  mapEvent,
  page,
  enemyAppear,
  enemyTransform,
  showBattleAnimation,
  forceAction,
  battleProcessing,
  abortBattle,
} from "../src/index.js";
import { validateDslOwnedDeclarations } from "../src/validation/staged-graph.js";

const enemy = (index: number) => ({
  kind: "runtimeSelector" as const,
  scope: "enemy" as const,
  target: "enemy" as const,
  index,
});
const input = {
  scriptEnabled: true,
  snapshotReferences: {
    maps: [{ id: 1, name: "Map" }],
    troops: [{ id: 1, name: "Troop" }],
    enemies: [{ id: 1, name: "Bat" }],
    skills: [{ id: 1, name: "Heal" }],
    animations: [{ id: 1, name: "Flash" }],
  },
  snapshotMaps: [
    {
      id: 1,
      width: 10,
      height: 10,
      eventLocations: [{ eventId: 1, x: 0, y: 0 }],
      encounterList: [],
    },
  ],
  snapshotTroops: [{ id: 1, members: [{ enemyId: 1, hidden: true }] }],
};
it("preserves hidden member positions and warns about absent or filtered runtime positions without rejecting", () => {
  const event = troopEvent({
    troopId: 1,
    pages: [
      battlePage({
        commands: [
          enemyAppear({ target: enemy(0) }),
          enemyAppear({ target: enemy(7) }),
          showBattleAnimation({
            target: enemy(7),
            animation: { kind: "animation", id: 1 },
            allEnemies: true,
          }),
        ],
      }),
    ],
  });
  const { issues } = validateDslOwnedDeclarations([event], input);
  expect(issues.filter((issue) => issue.level === "error")).toStrictEqual([]);
  expect(
    issues
      .filter((issue) => issue.code?.endsWith("-ENEMY-CONTEXT"))
      .map((issue) => [issue.nativePath, issue.dslPath]),
  ).toStrictEqual([
    ["pages[0].list[1].parameters[0]", "pages[0].commands[1].target"],
    ["pages[0].list[2].parameters[0]", "pages[0].commands[2].target"],
  ]);
  const filtered = validateDslOwnedDeclarations([event], {
    ...input,
    snapshotTroops: [
      {
        id: 1,
        members: [
          { enemyId: 999, hidden: false },
          { enemyId: 1, hidden: true },
        ],
      },
    ],
  }).issues;
  expect(filtered).toContainEqual(
    expect.objectContaining({
      code: "MV-E335-ENEMY-CONTEXT",
      level: "warning",
      actual: expect.stringContaining("999"),
      message: expect.stringContaining("filter"),
    }),
  );
});
it("keeps Common caller and Map residual battle contexts as warnings", () => {
  const common = commonEvent({
    id: 1,
    name: "Unknown caller",
    trigger: "none",
    commands: [
      enemyAppear({ target: enemy(7) }),
      forceAction({
        subject: { kind: "runtimeSelector", scope: "battler", target: "enemy", index: 7 },
        skill: { kind: "skill", id: 1 },
        target: { kind: "index", index: 7 },
      }),
    ],
  });
  const issues = validateDslOwnedDeclarations([common], input).issues;
  expect(issues.filter((issue) => issue.level === "error")).toStrictEqual([]);
  expect(issues).toContainEqual(
    expect.objectContaining({
      code: "MV-E335-ENEMY-CONTEXT",
      identity: "commonEvent:1",
      level: "warning",
    }),
  );
  const map = mapEvent({
    mapId: 1,
    id: 1,
    name: "Map",
    x: 0,
    y: 0,
    pages: [
      page({
        commands: [
          abortBattle(),
          battleProcessing({ troop: { kind: "randomEncounter" } }),
          ...common.commands,
        ],
      }),
    ],
  });
  const mapped = validateDslOwnedDeclarations([map], input).issues;
  expect(mapped.filter((issue) => issue.level === "error")).toStrictEqual([]);
  expect(mapped).toContainEqual(
    expect.objectContaining({
      code: "MV-E340-CONTEXT",
      message: expect.stringContaining("aborting"),
    }),
  );
  expect(mapped).toContainEqual(expect.objectContaining({ code: "MV-E301-ENCOUNTER-CONTEXT" }));
  expect(mapped).toContainEqual(
    expect.objectContaining({ code: "MV-E339-CONTEXT", message: expect.stringContaining("skip") }),
  );
});
it("rejects missing fixed Enemy/Animation/Skill/Actor/Troop references while retaining valid runtime indices", () => {
  for (const command of [
    enemyTransform({ target: enemy(7), enemy: { kind: "enemy", id: 99 } }),
    showBattleAnimation({
      target: enemy(7),
      animation: { kind: "animation", id: 99 },
      allEnemies: true,
    }),
    forceAction({
      subject: {
        kind: "runtimeSelector",
        scope: "battler",
        target: "actor",
        actor: { kind: "actor", id: 99 },
      },
      skill: { kind: "skill", id: 1 },
      target: { kind: "random" },
    }),
    forceAction({
      subject: { kind: "runtimeSelector", scope: "battler", target: "enemy", index: 7 },
      skill: { kind: "skill", id: 99 },
      target: { kind: "index", index: 7 },
    }),
    battleProcessing({ troop: { kind: "fixed", troop: { kind: "troop", id: 99 } } }),
  ]) {
    const event = commonEvent({ id: 1, name: "Missing", trigger: "none", commands: [command] });
    expect(validateDslOwnedDeclarations([event], input).issues).toContainEqual(
      expect.objectContaining({
        level: "error",
        code: expect.stringMatching(/^MV-E\d+-REFERENCE$/),
        dslPath: expect.stringContaining("commands[0]"),
      }),
    );
  }
});
