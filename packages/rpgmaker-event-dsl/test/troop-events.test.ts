import { verifyTroopEvidence } from "./support/troop-evidence.js";
import { expect, it } from "vitest";

import { actorRef, battlePage, switchRef, troopEvent } from "../src/index.js";
import { compileBattlePage } from "../src/compiler/events.js";
import {
  buildStagedDataGraph,
  validateDslOwnedDeclarations,
} from "../src/validation/staged-graph.js";

it("authors a Troop Event with one complete fixed-default native Battle Event Page", async () => {
  return verifyTroopEvidence("MV-S5-TROOP-AUTHOR-001", async () => {
    const definition = troopEvent({ troopId: 2001, pages: [battlePage({ commands: [] })] });
    const graph = buildStagedDataGraph({
      declarations: [definition],
      snapshotReferences: { troops: [{ id: 2001, name: "" }] },
      snapshotTroops: [{ id: 2001, members: [] }],
    });
    expect(definition).toEqual({
      kind: "troopEvent",
      troopId: 2001,
      pages: [{ commands: [] }],
    });
    expect(compileBattlePage(definition.pages[0], graph.resolver)).toEqual({
      conditions: {
        actorHp: 50,
        actorId: 1,
        actorValid: false,
        enemyHp: 50,
        enemyIndex: 0,
        enemyValid: false,
        switchId: 1,
        switchValid: false,
        turnA: 0,
        turnB: 0,
        turnEnding: false,
        turnValid: false,
      },
      span: 0,
      list: [{ code: 0, indent: 0, parameters: [] }],
    });

    return { definition, nativePage: compileBattlePage(definition.pages[0], graph.resolver) };
  });
});

it("rejects an enabled enemy condition when an earlier hidden member has a missing Enemy", async () => {
  return verifyTroopEvidence("MV-S5-TROOP-AUTHOR-002", async () => {
    const result = validateDslOwnedDeclarations(
      [
        troopEvent({
          troopId: 3,
          pages: [
            battlePage({
              conditions: { enemy: { enabled: true, index: 2, hpAtMost: 100 } },
              commands: [],
            }),
          ],
        }),
      ],
      {
        scriptEnabled: false,
        snapshotReferences: {
          troops: [{ id: 3, name: "" }],
          enemies: [
            { id: 1, name: "first" },
            { id: 2, name: "selected" },
          ],
        },
        snapshotTroops: [
          { id: 3, members: [{ enemyId: 999, hidden: true }, { enemyId: 1 }, { enemyId: 2 }] },
        ],
      },
    );
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          level: "error",
          identity: "troop:3",
          nativePath: "members[0].enemyId",
          message: expect.stringContaining("999"),
        }),
      ]),
    );

    return { issues: result.issues };
  });
});

it("preserves inactive saved condition values but rejects malformed inactive slots", async () => {
  return verifyTroopEvidence("MV-S5-TROOP-AUTHOR-003", async () => {
    const page = battlePage({
      conditions: {
        turn: { enabled: false, a: 9999, b: 12 },
        enemy: { enabled: false, index: 99, hpAtMost: 0 },
        actor: { enabled: false, ref: actorRef({ id: 0 }), hpAtMost: 100 },
        switch: { enabled: false, ref: switchRef({ id: 999 }) },
      },
      span: "moment",
      commands: [],
    });
    const context = {
      scriptEnabled: false,
      snapshotTroops: [{ id: 1, members: [] }],
      snapshotReferences: { troops: [{ id: 1, name: "" }] },
    };
    expect(
      validateDslOwnedDeclarations([troopEvent({ troopId: 1, pages: [page] })], context).issues,
    ).toEqual([]);
    const graph = buildStagedDataGraph({ declarations: [], ...context });
    expect(compileBattlePage(page, graph.resolver)).toMatchObject({
      span: 2,
      conditions: {
        turnA: 9999,
        turnB: 12,
        enemyIndex: 99,
        enemyHp: 0,
        actorId: 0,
        actorHp: 100,
        switchId: 999,
      },
    });
    const rejected: unknown[] = [];
    for (const conditions of [
      { turn: { enabled: false, a: -1, b: 0 } },
      { turn: { enabled: false, a: 10000, b: 0 } },
      { turn: { enabled: false, a: 0, b: -1 } },
      { turn: { enabled: false, a: 0, b: 10000 } },
      { turn: { enabled: false, a: 0.5, b: 0 } },
      { turn: { enabled: false, a: 0 } },
      { enemy: { enabled: false, index: -1, hpAtMost: 50 } },
      { enemy: { enabled: false, index: Number.MAX_SAFE_INTEGER + 1, hpAtMost: 50 } },
      { enemy: { enabled: false, index: 0, hpAtMost: -1 } },
      { enemy: { enabled: false, index: 0, hpAtMost: 101 } },
      { enemy: { enabled: false, index: 0, hpAtMost: 0.5 } },
      { actor: { enabled: false, ref: actorRef({ id: -1 }), hpAtMost: 50 } },
      {
        actor: { enabled: false, ref: actorRef({ id: Number.MAX_SAFE_INTEGER + 1 }), hpAtMost: 50 },
      },
      { actor: { enabled: false, ref: actorRef({ id: 0 }), hpAtMost: -1 } },
      { actor: { enabled: false, ref: actorRef({ id: 0 }), hpAtMost: 101 } },
      { actor: { enabled: false, ref: { kind: "actor", id: 0, name: "both" }, hpAtMost: 50 } },
      { actor: { enabled: false, ref: { kind: "switch", id: 0 }, hpAtMost: 50 } },
      { switch: { enabled: false, ref: switchRef({ id: -1 }) } },
      { switch: { enabled: false, ref: switchRef({ id: 0.5 }) } },
      { switch: { enabled: false, ref: switchRef({ name: "" }) } },
      { switch: { enabled: 0, ref: switchRef({ id: 0 }) } },
      { switch: { enabled: false } },
      { turnEnd: "false" },
      { futureCondition: false },
    ]) {
      const invalid = troopEvent({ troopId: 1, pages: [{ conditions, commands: [] } as never] });
      const result = validateDslOwnedDeclarations([invalid], context);
      rejected.push({ conditions, issues: result.issues });
      expect(result.issues.some(({ level }) => level === "error")).toBe(true);
    }
    const boundaryPage = battlePage({
      conditions: {
        turn: { enabled: false, a: 0, b: 9999 },
        enemy: { enabled: false, index: Number.MAX_SAFE_INTEGER, hpAtMost: 100 },
        actor: { enabled: false, ref: actorRef({ id: Number.MAX_SAFE_INTEGER }), hpAtMost: 0 },
        switch: { enabled: false, ref: switchRef({ id: 0 }) },
      },
      commands: [],
    });
    expect(
      validateDslOwnedDeclarations([troopEvent({ troopId: 1, pages: [boundaryPage] })], context)
        .issues,
    ).toEqual([]);
    const boundaryNative = compileBattlePage(boundaryPage, graph.resolver);
    expect(boundaryNative.conditions).toMatchObject({
      turnA: 0,
      turnB: 9999,
      enemyIndex: 9007199254740991,
      enemyHp: 100,
      actorId: 9007199254740991,
      actorHp: 0,
      switchId: 0,
    });
    return {
      savedDslPage: page,
      nativePage: compileBattlePage(page, graph.resolver),
      boundaryNative,
      rejected,
    };
  });
});

it("requires unique existing Troop identities and nonempty ordered pages without an editor ID cap", async () => {
  return verifyTroopEvidence("MV-S5-TROOP-AUTHOR-004", async () => {
    const context = {
      scriptEnabled: false,
      snapshotTroops: [{ id: 2001, members: [] }],
      snapshotReferences: { troops: [{ id: 2001, name: "" }] },
    };
    const valid = troopEvent({ troopId: 2001, pages: [battlePage({ commands: [] })] });
    expect(validateDslOwnedDeclarations([valid], context).issues).toEqual([]);
    expect(
      validateDslOwnedDeclarations([troopEvent({ ...valid, troopId: 0 })], context).issues,
    ).toContainEqual(
      expect.objectContaining({
        code: "MV-TROOP-IDENTITY",
        stage: "compile",
        identity: "troop:0",
        dslPath: "troopId",
        expected: "positive existing Snapshot Troop identity",
        actual: "0",
        message: expect.stringMatching(
          /compile.*troop:0.*MV-TROOP-IDENTITY.*troopId.*expected.*actual 0/s,
        ),
      }),
    );
    expect(validateDslOwnedDeclarations([valid, valid], context).issues).toContainEqual(
      expect.objectContaining({
        code: "MV-TROOP-IDENTITY-DUPLICATE",
        stage: "compile",
        identity: "troop:2001",
        dslPath: "troopId",
        expected: "unique Troop Event identity",
        actual: "2001",
      }),
    );
    for (const definitions of [
      [valid, valid],
      [troopEvent({ ...valid, troopId: 1 })],
      [troopEvent({ ...valid, troopId: 0 })],
      [troopEvent({ ...valid, pages: [] as never })],
      [troopEvent({ ...valid, pages: [null] as never })],
    ])
      expect(
        validateDslOwnedDeclarations(definitions, context).issues.some(
          ({ level }) => level === "error",
        ),
      ).toBe(true);
    const twentyOne = troopEvent({
      ...valid,
      pages: Array.from({ length: 21 }, () => battlePage({ commands: [] })) as never,
    });
    expect(validateDslOwnedDeclarations([twentyOne], context).issues).toEqual([
      expect.objectContaining({ level: "warning", message: expect.stringContaining("21") }),
    ]);

    return {
      valid,
      twentyOne,
      warnings: validateDslOwnedDeclarations([twentyOne], context).issues,
    };
  });
});

it("resolves active actor and switch names, keeps inactive ID exceptions local, and validates complete Troop command lists", async () => {
  return verifyTroopEvidence("MV-S5-TROOP-AUTHOR-005", async () => {
    const context = {
      scriptEnabled: false,
      snapshotTroops: [{ id: 1, members: [{ enemyId: 2, hidden: true }, { enemyId: 1 }] }],
      snapshotReferences: {
        troops: [{ id: 1, name: "" }],
        actors: [{ id: 1, name: "Hero" }],
        enemies: [
          { id: 1, name: "A" },
          { id: 2, name: "B" },
        ],
        switches: [{ id: 1, name: "Snapshot only" }],
        switchCapacity: 2,
      },
    };
    const declaration = troopEvent({
      troopId: 1,
      pages: [
        battlePage({
          conditions: {
            enemy: { enabled: true, index: 1, hpAtMost: 100 },
            actor: { enabled: true, ref: actorRef({ name: "Hero" }), hpAtMost: 0 },
            switch: { enabled: true, ref: switchRef({ id: 2 }) },
          },
          commands: [],
        }),
      ],
    });
    expect(validateDslOwnedDeclarations([declaration], context).issues).toEqual([]);
    for (const name of ["Snapshot only", "missing"]) {
      const invalid = troopEvent({
        troopId: 1,
        pages: [
          battlePage({
            conditions: { switch: { enabled: false, ref: switchRef({ name }) } },
            commands: [],
          }),
        ],
      });
      expect(
        validateDslOwnedDeclarations([invalid], context).issues.some(
          ({ level }) => level === "error",
        ),
      ).toBe(true);
    }
    for (const command of [
      { kind: "rawDslCommand", code: 108, parameters: [] },
      { kind: "rawDslCommand", code: 212, parameters: [-1, 999, false] },
      { kind: "rawDslCommand", code: 355, parameters: [""] },
      { kind: "rawDslCommand", code: 111, parameters: [12, "true"] },
    ]) {
      const invalid = troopEvent({
        troopId: 1,
        pages: [battlePage({ commands: [command as never] })],
      });
      expect(
        validateDslOwnedDeclarations([invalid], context).issues.some(
          (issue) =>
            issue.level === "error" &&
            issue.identity === "troop:1" &&
            (issue.nativePath ?? issue.dslPath)?.startsWith("pages[0]."),
        ),
      ).toBe(true);
    }

    return { declaration, validation: validateDslOwnedDeclarations([declaration], context) };
  });
});

it("locates an invalid inactive condition at its exact DSL field with expected and actual values", async () => {
  return verifyTroopEvidence("MV-S5-TROOP-AUTHOR-006", async () => {
    const result = validateDslOwnedDeclarations(
      [
        troopEvent({
          troopId: 1,
          pages: [
            battlePage({
              conditions: { actor: { enabled: false, ref: actorRef({ id: 0 }), hpAtMost: 101 } },
              commands: [],
            }),
          ],
        }),
      ],
      { scriptEnabled: false, snapshotTroops: [{ id: 1, members: [] }] },
    );
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "MV-BATTLE-PAGE-INPUT",
        stage: "compile",
        identity: "troop:1",
        dslPath: "pages[0].conditions.actor.hpAtMost",
        expected: "integer 0..100",
        actual: "101",
        message: expect.stringMatching(
          /compile.*troop:1.*MV-BATTLE-PAGE-INPUT.*pages\[0\].conditions.actor.hpAtMost.*expected.*actual 101/s,
        ),
      }),
    );

    return { issues: result.issues };
  });
});

it("locates invalid span and fixed actor references with their saved actual values", async () => {
  return verifyTroopEvidence("MV-S5-TROOP-AUTHOR-007", async () => {
    const diagnosticCases: unknown[] = [];

    for (const [page, dslPath, expected, actual] of [
      [{ span: "future", commands: [] }, "pages[0].span", "battle, turn or moment", '"future"'],
      [
        {
          conditions: { actor: { enabled: true, ref: actorRef({ id: 999 }), hpAtMost: 50 } },
          commands: [],
        },
        "pages[0].conditions.actor.ref",
        "existing actor reference",
        '{"id":999,"kind":"actor"}',
      ],
    ] as const) {
      const result = validateDslOwnedDeclarations(
        [troopEvent({ troopId: 1, pages: [page as never] })],
        { scriptEnabled: false, snapshotTroops: [{ id: 1, members: [] }] },
      );
      diagnosticCases.push({ page, issues: result.issues });
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          code: "MV-BATTLE-PAGE-INPUT",
          stage: "compile",
          identity: "troop:1",
          dslPath,
          expected,
          actual,
        }),
      );
    }

    return { diagnosticCases };
  });
});
